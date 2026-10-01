import { cache } from "react";
import { arrangeProductMedia } from "@/lib/content/variants";
import { productsInCategory } from "@/lib/content/helpers";
import { applyCountryPrice, defaultMarket, resolveMarket, type Market } from "@/lib/geo/market";
import { productCoverage } from "@/lib/catalog/coverage";
import { formatMoney, formatUsd } from "@/lib/utils";
import { blockIds, staticBundle } from "@/lib/content/static";
import type { ContentBundle } from "@/lib/content/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { CatalogProduct, Deal } from "@/content/catalog";
import type { NavItem } from "@/content/nav";
import type { BlogPost } from "@/content/blog";

type Row = Record<string, unknown>;

function kept(rows: Row[]) {
  return rows.filter((row) => row.deleted_at == null);
}

function noticeChoice<T extends string>(value: unknown, allowed: readonly T[], fallback: T) {
  return typeof value === "string" && allowed.includes(value as T) ? value as T : fallback;
}

function text(row: Row | undefined, key: string, fallback: string) {
  const value = row?.[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function block<T>(rows: Row[], id: string, fallback: T): T {
  const row = rows.find((item) => item.id === id);
  return (row?.payload as T | undefined) ?? fallback;
}

export const loadContentBundle = cache(async (): Promise<ContentBundle> => {
  const base = staticBundle();
  if (!isSupabaseConfigured()) return base;

  try {
    const supabase = await createClient();
    const [
      settings,
      policyRows,
      categories,
      products,
      images,
      variants,
      blocks,
      dealRows,
      featured,
      posts,
      sections,
      videos,
      help,
      social,
      payments,
      stores,
      menu,
      channels,
      pages,
      nav,
      stock,
      logo,
      sellCountries,
      countryPrices,
    ] = await Promise.all([
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("policies").select("*").eq("id", 1).maybeSingle(),
      supabase.from("categories").select("*").order("sort"),
      supabase.from("products").select("*").eq("published", true).order("sort"),
      supabase.from("product_images").select("*").order("sort"),
      supabase.from("product_variants").select("*").order("sort"),
      supabase.from("product_blocks").select("*"),
      supabase.from("deals").select("*").eq("published", true).order("sort"),
      supabase.from("featured_products").select("*").order("sort"),
      supabase.from("blog_posts").select("*").eq("published", true),
      supabase.from("blog_sections").select("*").order("sort"),
      supabase.from("videos").select("*").eq("published", true),
      supabase.from("help_articles").select("*").eq("published", true).order("sort"),
      supabase.from("social_links").select("*").order("sort"),
      supabase.from("payment_methods").select("*").order("sort"),
      supabase.from("store_links").select("*").order("sort"),
      supabase.from("support_links").select("*").order("sort"),
      supabase.from("support_channels").select("*").order("sort"),
      supabase.from("page_copy").select("*"),
      supabase.from("nav_items").select("*").order("sort"),
      supabase.rpc("public_stock"),
      supabase.from("brand_logos").select("url, width, height").eq("active", true).maybeSingle(),
      supabase.from("sell_countries").select("code, name, currency").eq("enabled", true).order("name"),
      supabase.from("product_country_prices").select("product_id, country_code, price, sale_price"),
    ]);

    if (settings.error || products.error) return base;

    const setting = (settings.data ?? undefined) as Row | undefined;
    const policy = (policyRows.data ?? undefined) as Row | undefined;
    const company = {
      ...base.company,
      brand: text(setting, "brand", base.company.brand),
      legalName: text(setting, "legal_name", base.company.legalName),
      copyright: text(setting, "copyright", base.company.copyright),
      address: text(setting, "address", base.company.address),
      email: text(setting, "email", base.company.email),
      supportHours: text(setting, "support_hours", base.company.supportHours),
    };
    const policies = {
      returnsTitle: text(policy, "returns_title", base.policies.returnsTitle),
      strapTitle: text(policy, "strap_title", base.policies.strapTitle),
      dockTitle: text(policy, "dock_title", base.policies.dockTitle),
      heroLine: text(policy, "hero_line", base.policies.heroLine),
      strapSummary: text(policy, "strap_summary", base.policies.strapSummary),
      dockSummary: text(policy, "dock_summary", base.policies.dockSummary),
      shipping: text(policy, "shipping", base.policies.shipping),
      returnsSummary: text(policy, "returns_summary", base.policies.returnsSummary),
      warrantyRegistration: text(policy, "warranty_registration", base.policies.warrantyRegistration),
      accountSummary: text(policy, "account_summary", base.policies.accountSummary),
    };

    const imageRows = kept((images.data ?? []) as Row[]);
    const productRows = kept((products.data ?? []) as Row[]);
    const catalog: CatalogProduct[] = products.error
      ? base.catalog
      : productRows.map((product) => {
          const productVariants = kept((variants.data ?? []) as Row[]).filter((row) => row.product_id === product.id);
          const media = arrangeProductMedia(
            productVariants,
            imageRows.filter((image) => image.product_id === product.id),
          );
          const fallback = base.catalog.find((item) => item.id === product.id);
          const listPrice = Number(product.price ?? fallback?.price ?? 0);
          const salePrice = Number(product.sale_price ?? 0);
          const onSale = product.on_sale === true && salePrice > 0 && salePrice < listPrice;
          const price = onSale ? salePrice : listPrice;
          const alsoIn = Array.isArray(product.also_in) ? (product.also_in as CatalogProduct["alsoIn"]) : fallback?.alsoIn;
          const name = text(product, "name", fallback?.name ?? "");
          const commerce = product.commerce && typeof product.commerce === "object" ? (product.commerce as Record<string, unknown>) : {};
          const model = typeof commerce.model === "string" ? commerce.model : "";
          const warrantyNote = typeof commerce.warrantyNote === "string" ? commerce.warrantyNote : "";
          const colors = media.variants.map((variant) => ({ name: variant.name, image: variant.pictures[0]?.src ?? "" }));
          const stockRow = Array.isArray(stock.data)
            ? (stock.data as { product_id?: string; availability?: string; available?: number | null }[]).find((row) => row.product_id === product.id)
            : undefined;
          const availability = stockRow?.availability === "out_of_stock" ? "out_of_stock" : "in_stock";
          const availableCount = availability === "in_stock" && typeof stockRow?.available === "number" ? stockRow.available : undefined;
          return {
            id: String(product.id),
            name,
            menuLabel: text(product, "menu_label", fallback?.menuLabel ?? ""),
            href: text(product, "href", fallback?.href ?? "/shop"),
            category: (product.category_id as CatalogProduct["category"]) ?? fallback?.category ?? "wearables",
            alsoIn,
            price,
            priceLabel: formatUsd(price),
            compareAt: onSale ? listPrice : undefined,
            topPick: product.top_pick === true,
            status: onSale
              ? "On sale"
              : availability === "out_of_stock"
                ? "Out of stock"
                : text(product, "status", fallback?.status ?? "Available") === "Hidden"
                  ? "In stock"
                  : text(product, "status", fallback?.status ?? "Available"),
            summary: text(product, "summary", fallback?.summary ?? ""),
            image: media.pictures[0] ?? { src: "", alt: name, width: 1600, height: 1600 },
            pictures: media.pictures,
            sharedPictures: media.sharedPictures,
            variants: media.variants,
            defaultVariantId: media.defaultVariantId,
            kicker: text(product, "kicker", fallback?.kicker ?? ""),
            lead: text(product, "lead", fallback?.lead ?? ""),
            detail: text(product, "detail", fallback?.detail ?? ""),
            note: text(product, "note", fallback?.note ?? ""),
            signals: Array.isArray(product.signals) ? (product.signals as CatalogProduct["signals"]) : (fallback?.signals ?? []),
            sku: typeof product.sku === "string" ? product.sku : "",
            model,
            availability,
            availableCount,
            colors,
            warrantyNote,
            coverage: productCoverage({
              warrantyEligible: product.warranty_eligible === true,
              warrantyYears: typeof product.warranty_years === "number" ? product.warranty_years : null,
              warrantyDays: typeof product.warranty_days === "number" ? product.warranty_days : null,
              freeShipping: commerce.freeShipping,
              returnDays: commerce.returnDays,
            }),
          };
        });

    const categoryRows = kept((categories.data ?? []) as Row[]).filter((category) => category.active !== false);
    const categoryList = categories.error
      ? base.catalogCategories
      : categoryRows.map((category) => ({
          id: category.id as ContentBundle["catalogCategories"][number]["id"],
          label: String(category.label),
          href: String(category.href),
          summary: String(category.summary),
        }));
    const catalogCategories = categoryList.filter((category) => productsInCategory(catalog, category.id).length > 0);
    const markets: Market[] = sellCountries.error || !Array.isArray(sellCountries.data) || sellCountries.data.length === 0
      ? [defaultMarket]
      : (sellCountries.data as Market[]);
    const market = await resolveMarket(markets);
    const priceByProduct = new Map<string, { price?: number | string | null; sale_price?: number | string | null }>();
    if (!countryPrices.error && market.code !== "US") {
      for (const row of (countryPrices.data ?? []) as { product_id?: string; country_code?: string; price?: number | string | null; sale_price?: number | string | null }[]) {
        if (row.country_code === market.code && row.product_id) priceByProduct.set(row.product_id, row);
      }
    }
    const shopCatalog = market.code === "US" ? catalog : catalog.map((product) => applyCountryPrice(product, market, priceByProduct.get(product.id)));

    const featuredIds = kept((featured.data ?? []) as Row[]).map((row) => String(row.product_id));
    const featuredProducts = (featuredIds.length ? featuredIds : base.featuredProducts.map((item) => item.id))
      .flatMap((id) => {
        const product = shopCatalog.find((item) => item.id === id);
        return product ? [product] : [];
      });

    const variantRows = kept((variants.data ?? []) as Row[]);
    const variantList = (productId: string) =>
      variantRows.filter((row) => row.product_id === productId).map((row) => row.attrs);

    const blockRows = kept((blocks.data ?? []) as Row[]);
    const postRows = kept((posts.data ?? []) as Row[]);
    const sectionRows = kept((sections.data ?? []) as Row[]);
    const blogList: BlogPost[] = postRows.length
      ? postRows.map((post) => ({
          slug: String(post.slug),
          productId: post.product_id as BlogPost["productId"],
          title: String(post.title),
          description: String(post.description),
          excerpt: String(post.excerpt),
          published: String(post.published_label),
          publishedIso: String(post.published_iso),
          readingMinutes: Number(post.reading_minutes),
          points: (post.points as string[]) ?? [],
          relatedSlug: String(post.related_slug),
          sections: sectionRows
            .filter((section) => section.post_slug === post.slug)
            .map((section) => ({
              id: String(section.section_id),
              heading: String(section.heading),
              paragraphs: (section.paragraphs as string[]) ?? [],
            })),
        }))
      : base.blogPosts;

    const pageRows = kept((pages.data ?? []) as Row[]);
    const pageCopy = structuredClone(base.pageCopy);
    for (const row of pageRows) {
      const page = String(row.page);
      const key = String(row.key);
      const value = String(row.value ?? "");
      const group = pageCopy[page as keyof typeof pageCopy];
      if (group && key in group && value) {
        (group as Record<string, string>)[key] = value;
      }
    }

    const priceOf = (id: string, fallback: number) => shopCatalog.find((item) => item.id === id)?.price ?? fallback;
    const labelOf = (id: string, fallback: number) => shopCatalog.find((item) => item.id === id)?.priceLabel ?? (market.code === "US" ? formatMoney(fallback, "USD") : "Price not set");
    const prices = {
      band: priceOf("band", base.prices.band),
      ring: priceOf("ring", base.prices.ring),
      share: priceOf("share", base.prices.share),
      straps: priceOf("straps", base.prices.straps),
      glasses: priceOf("glasses", base.prices.glasses),
      buds: priceOf("buds", base.prices.buds),
      watch: priceOf("watch", base.prices.watch),
    };

    const offerFromProduct = (product: CatalogProduct, id: string, badge: string, title?: string, detail?: string): Deal => ({
      id,
      title: title || product.name,
      badge,
      detail: detail || product.summary,
      href: product.href,
      priceLabel: product.priceLabel,
      compareAtLabel: product.compareAtLabel ?? (market.code === "US" && product.compareAt ? formatMoney(product.compareAt, "USD") : null),
      image: product.image.src ? product.image : null,
    });
    const dealList = kept((dealRows.data ?? []) as Row[]).flatMap((deal): Deal[] => {
      const href = String(deal.href);
      const product = shopCatalog.find((item) => item.href === href);
      const category = catalogCategories.find((item) => item.href === href);
      if (!product && !category) return [];
      if (!product) {
        return [{
          id: String(deal.id),
          title: String(deal.title),
          badge: String(deal.badge),
          detail: String(deal.detail),
          href,
          priceLabel: deal.price_label ? String(deal.price_label) : null,
          compareAtLabel: null,
          image: null,
        }];
      }
      return [offerFromProduct(product, String(deal.id), String(deal.badge), String(deal.title), String(deal.detail))];
    });
    const listed = new Set(dealList.map((deal) => deal.href));
    const saleDeals = shopCatalog
      .filter((product) => (product.compareAt || product.compareAtLabel) && !listed.has(product.href))
      .map((product) => offerFromProduct(product, `sale-${product.id}`, "On sale"));
    const liveDeals = dealList;

    const logoRow = (logo.data ?? null) as { url?: string; width?: number; height?: number } | null;
    return {
      ...base,
      market,
      markets: markets.some((country) => country.code === "US") ? markets : [defaultMarket, ...markets],
      logo: logo.error
        ? base.logo
        : logoRow?.url && logoRow.width && logoRow.height
          ? { url: logoRow.url, width: logoRow.width, height: logoRow.height }
          : null,
      company,
      policies,
      announcement: text(setting, "announcement", base.announcement),
      notices: {
        development: {
          text: text(setting, "notice_primary", base.notices.development.text),
          enabled: setting?.notice_primary_enabled !== false,
          color: noticeChoice(setting?.notice_primary_color, ["red", "orange", "blue", "green", "white"], base.notices.development.color),
          background: noticeChoice(setting?.notice_primary_background, ["ink", "white", "red", "orange", "blue"], base.notices.development.background),
        },
        shipping: {
          text: text(setting, "notice_secondary", base.notices.shipping.text) || text(setting, "announcement", base.notices.shipping.text),
          enabled: setting?.notice_secondary_enabled !== false,
          color: noticeChoice(setting?.notice_secondary_color, ["red", "orange", "blue", "green", "white"], base.notices.shipping.color),
          background: noticeChoice(setting?.notice_secondary_background, ["ink", "white", "red", "orange", "blue"], base.notices.shipping.background),
        },
      },
      headerSlogan: text(setting, "header_slogan", base.headerSlogan),
      footerBlurb: text(setting, "footer_blurb", base.footerBlurb),
      footerMarketplaces: text(setting, "footer_marketplaces", base.footerMarketplaces),
      siteUrl: text(setting, "site_url", base.siteUrl),
      siteDescription: text(setting, "site_description", base.siteDescription),
      noSubscription: text(setting, "no_subscription", base.noSubscription),
      navItems: nav.error || kept((nav.data ?? []) as Row[]).length === 0
        ? base.navItems
        : kept((nav.data ?? []) as Row[])
            .filter((item) => item.published !== false)
            .map((item): NavItem => ({
              id: String(item.id),
              area: item.area === "footer" ? "footer" : "header",
              parentId: item.parent_id ? String(item.parent_id) : null,
              kind: item.kind === "products" ? "products" : item.kind === "menu" ? "menu" : "link",
              label: String(item.label),
              href: String(item.href ?? ""),
              sort: Number(item.sort ?? 0),
            }))
            .sort((left, right) => left.sort - right.sort),
      supportMenu: kept((menu.data ?? []) as Row[]).length
        ? kept((menu.data ?? []) as Row[]).map((item) => ({ href: String(item.href), label: String(item.label) }))
        : base.supportMenu,
      support: {
        email: company.email,
        promise: company.supportHours,
        channels: kept((channels.data ?? []) as Row[]).length
          ? kept((channels.data ?? []) as Row[]).map((channel) => ({
              id: String(channel.id),
              label: String(channel.label),
              reply: String(channel.reply),
              href: channel.href ? String(channel.href) : undefined,
            }))
          : base.support.channels,
      },
      catalog: shopCatalog,
      catalogCategories,
      deals: [...liveDeals, ...saleDeals],
      featuredProducts: featuredProducts.length ? featuredProducts : base.featuredProducts,
      socialLinks: social.error
        ? base.socialLinks
        : kept((social.data ?? []) as Row[])
            .filter((link) => link.enabled !== false)
            .map((link) => ({
              id: String(link.id),
              label: String(link.label),
              href: String(link.href),
            })),
      paymentMethods: payments.error
        ? base.paymentMethods
        : kept((payments.data ?? []) as Row[])
            .filter((method) => method.offered !== false)
            .map((method) => ({ id: String(method.id), label: String(method.label) })),
      storeLinks: stores.error
        ? base.storeLinks
        : kept((stores.data ?? []) as Row[])
            .filter((store) => store.enabled !== false)
            .map((store) => ({
              id: String(store.id),
              label: String(store.label),
              href: store.href ? String(store.href) : "",
            })),
      blogPosts: blogList,
      productVideos: videos.error
        ? base.productVideos
        : kept((videos.data ?? []) as Row[])
            .filter((video) => video.published !== false && shopCatalog.some((product) => product.id === video.product_id))
            .map((video) => ({
              id: String(video.id),
              productId: String(video.product_id),
              title: String(video.title),
              youtubeId: String(video.youtube_id ?? ""),
              src: video.src ? String(video.src) : undefined,
              poster: video.poster ? String(video.poster) : undefined,
            })),
      helpArticles: kept((help.data ?? []) as Row[]).length
        ? kept((help.data ?? []) as Row[]).map((article) => ({
            slug: String(article.slug),
            title: String(article.title),
            summary: String(article.summary),
            body: String(article.body),
          }))
        : base.helpArticles,
      bandVariants: variantList("band").length ? (variantList("band") as ContentBundle["bandVariants"]) : base.bandVariants,
      ringVariants: variantList("ring").length ? (variantList("ring") as ContentBundle["ringVariants"]) : base.ringVariants,
      watchVariants: variantList("watch").length ? (variantList("watch") as ContentBundle["watchVariants"]) : base.watchVariants,
      prices,
      priceLabels: {
        band: labelOf("band", prices.band),
        ring: labelOf("ring", prices.ring),
        share: labelOf("share", prices.share),
        straps: labelOf("straps", prices.straps),
        glasses: labelOf("glasses", prices.glasses),
        buds: labelOf("buds", prices.buds),
        watch: labelOf("watch", prices.watch),
      },
      faqs: block(blockRows, "faqs", base.faqs),
      specs: block(blockRows, "specs", base.specs),
      bandFeatures: block(blockRows, "bandFeatures", base.bandFeatures),
      ringFeatures: block(blockRows, "ringFeatures", base.ringFeatures),
      ringFacts: block(blockRows, "ringFacts", base.ringFacts),
      ringFaqs: block(blockRows, "ringFaqs", base.ringFaqs),
      watchFeatures: block(blockRows, "watchFeatures", base.watchFeatures),
      watchFacts: block(blockRows, "watchFacts", base.watchFacts),
      watchFaqs: block(blockRows, "watchFaqs", base.watchFaqs),
      glassesFeatures: block(blockRows, "glassesFeatures", base.glassesFeatures),
      glassesFacts: block(blockRows, "glassesFacts", base.glassesFacts),
      glassesFaqs: block(blockRows, "glassesFaqs", base.glassesFaqs),
      budsFeatures: block(blockRows, "budsFeatures", base.budsFeatures),
      budsFacts: block(blockRows, "budsFacts", base.budsFacts),
      budsFaqs: block(blockRows, "budsFaqs", base.budsFaqs),
      shareBuds: block(blockRows, "shareBuds", base.shareBuds),
      shareFacts: block(blockRows, "shareFacts", base.shareFacts),
      dayStory: block(blockRows, "dayStory", base.dayStory),
      appScreens: block(blockRows, "appScreens", base.appScreens),
      trustItems: block(blockRows, "trustItems", base.trustItems),
      inTheBox: block(blockRows, "inTheBox", base.inTheBox),
      useSteps: block(blockRows, "useSteps", base.useSteps),
      careNotes: block(blockRows, "careNotes", base.careNotes),
      boxFacts: block(blockRows, "boxFacts", base.boxFacts),
      batteryFacts: block(blockRows, "batteryFacts", base.batteryFacts),
      pageCopy,
    };
  } catch {
    return base;
  }
});

export { blockIds };
