import { readdirSync, readFileSync } from "fs";
import path from "path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { blockIds, staticBundle } from "../lib/content/static";

function readProperties(file: string) {
  const values: Record<string, string> = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    values[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }
  return values;
}

function isSample(value: string | undefined) {
  return !value || value.includes("YOUR_");
}

async function seed(url: string, serviceKey: string) {
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const site = staticBundle();

  const { error: settingsError } = await supabase.from("site_settings").upsert({
    id: 1,
    brand: site.company.brand,
    legal_name: site.company.legalName,
    copyright: site.company.copyright,
    address: site.company.address,
    email: site.company.email,
    support_hours: site.company.supportHours,
    site_description: site.siteDescription,
    announcement: site.announcement,
    no_subscription: site.noSubscription,
    published: true,
  });
  if (settingsError) throw settingsError;

  const { error: policyError } = await supabase.from("policies").upsert({
    id: 1,
    returns_title: site.policies.returnsTitle,
    strap_title: site.policies.strapTitle,
    dock_title: site.policies.dockTitle,
    hero_line: site.policies.heroLine,
    strap_summary: site.policies.strapSummary,
    dock_summary: site.policies.dockSummary,
    shipping: site.policies.shipping,
    returns_summary: site.policies.returnsSummary,
    warranty_registration: site.policies.warrantyRegistration,
    account_summary: site.policies.accountSummary,
  });
  if (policyError) throw policyError;

  const { error: categoryError } = await supabase.from("categories").upsert(
    site.catalogCategories.map((category, sort) => ({
      id: category.id,
      label: category.label,
      href: category.href,
      summary: category.summary,
      sort,
    })),
  );
  if (categoryError) throw categoryError;

  const { error: productError } = await supabase.from("products").upsert(
    site.catalog.map((product, sort) => ({
      id: product.id,
      name: product.name,
      menu_label: product.menuLabel,
      href: product.href,
      category_id: product.category,
      also_in: product.alsoIn ?? [],
      price: product.price,
      price_label: product.priceLabel,
      status: product.status,
      summary: product.summary,
      kicker: product.kicker,
      lead: product.lead,
      detail: product.detail,
      note: product.note,
      signals: product.signals,
      published: true,
      sort,
      warranty_eligible: true,
      warranty_years: product.id === "straps" ? null : 1,
      warranty_days: product.id === "straps" ? 90 : null,
      commerce: {
        brand: "Joova",
        vendor: "Joova",
        currency: "USD",
        condition: "new",
        availability: "in_stock",
        preorder: false,
        subscription: false,
        requiresShipping: true,
        freeShipping: true,
        shipsFrom: "US warehouses",
        shipsTo: ["US"],
        handlingMinDays: 7,
        handlingMaxDays: 10,
        returnDays: 30,
        returnShipping: "US return shipping covered",
        taxCode: "",
        gtin: "",
        mpn: "",
        barcode: "",
        countryOfOrigin: "",
        googleCategory: "",
        seoTitle: product.name,
        seoDescription: product.summary,
        productType: product.category,
        tags: [product.category, ...(product.alsoIn ?? [])],
        material: product.id === "ring"
          ? "Stainless steel shell with an epoxy resin inner layer."
          : product.id === "straps"
            ? "Woven"
            : "",
        warrantyNote: product.id === "straps"
          ? "90 days from the purchase date."
          : "1 year from the purchase date. Register within 30 days for 1 extra year.",
      },
    })),
  );
  if (productError) throw productError;

  const images = site.catalog.flatMap((product) =>
    product.pictures.map((image, sort) => ({
      id: `${product.id}-${sort}`,
      product_id: product.id,
      src: image.src,
      alt: image.alt,
      width: image.width,
      height: image.height,
      sort,
      focused: sort === 0,
    })),
  );
  const { error: imageError } = await supabase.from("product_images").upsert(images);
  if (imageError) throw imageError;

  const variants = [
    ...site.bandVariants.map((variant, sort) => ({
      id: `band-${variant.id}`,
      product_id: "band",
      sort,
      attrs: { ...variant, price: site.prices.band },
    })),
    ...site.ringVariants.map((variant, sort) => ({
      id: `ring-${variant.id}`,
      product_id: "ring",
      sort,
      attrs: variant,
    })),
    ...site.watchVariants.map((variant, sort) => ({
      id: `watch-${variant.id}`,
      product_id: "watch",
      sort,
      attrs: variant,
    })),
  ];
  const { error: variantError } = await supabase.from("product_variants").upsert(variants);
  if (variantError) throw variantError;

  const blocks = blockIds.map((id) => ({
    id,
    product_id: id.startsWith("ring") ? "ring" : id.startsWith("watch") ? "watch" : id.startsWith("glasses") ? "glasses" : id.startsWith("buds") ? "buds" : id.startsWith("share") ? "share" : "band",
    kind: id,
    payload: site[id],
  }));
  const { error: blockError } = await supabase.from("product_blocks").upsert(blocks);
  if (blockError) throw blockError;

  const { error: dealError } = await supabase.from("deals").upsert(
    site.deals.map((deal, sort) => ({
      id: deal.id,
      title: deal.title,
      badge: deal.badge,
      detail: deal.detail,
      href: deal.href,
      price_label: deal.priceLabel,
      published: true,
      sort,
    })),
  );
  if (dealError) throw dealError;

  const { error: featuredError } = await supabase.from("featured_products").upsert(
    site.featuredProducts.map((product, sort) => ({ product_id: product.id, sort })),
  );
  if (featuredError) throw featuredError;

  const { error: postError } = await supabase.from("blog_posts").upsert(
    site.blogPosts.map((post) => ({
      slug: post.slug,
      product_id: post.productId,
      title: post.title,
      description: post.description,
      excerpt: post.excerpt,
      published_label: post.published,
      published_iso: post.publishedIso,
      reading_minutes: post.readingMinutes,
      points: post.points,
      related_slug: post.relatedSlug,
      published: true,
    })),
  );
  if (postError) throw postError;

  const { error: sectionError } = await supabase.from("blog_sections").upsert(
    site.blogPosts.flatMap((post) =>
      post.sections.map((section, sort) => ({
        id: `${post.slug}-${section.id}`,
        post_slug: post.slug,
        section_id: section.id,
        heading: section.heading,
        paragraphs: section.paragraphs,
        sort,
      })),
    ),
  );
  if (sectionError) throw sectionError;

  const { error: videoError } = await supabase.from("videos").upsert(
    site.productVideos.map((video) => ({
      id: video.id,
      product_id: video.productId,
      title: video.title,
      youtube_id: video.youtubeId,
      published: true,
    })),
  );
  if (videoError) throw videoError;

  const { error: helpError } = await supabase.from("help_articles").upsert(
    site.helpArticles.map((article, sort) => ({ ...article, sort, published: true })),
  );
  if (helpError) throw helpError;

  const { error: socialError } = await supabase.from("social_links").upsert(
    site.socialLinks.map((link, sort) => ({ ...link, sort })),
  );
  if (socialError) throw socialError;

  const { error: paymentError } = await supabase.from("payment_methods").upsert(
    site.paymentMethods.map((method, sort) => ({ ...method, sort })),
  );
  if (paymentError) throw paymentError;

  const { error: menuError } = await supabase.from("support_links").upsert(
    site.supportMenu.map((item, sort) => ({ ...item, sort })),
  );
  if (menuError) throw menuError;

  const { error: navError } = await supabase.from("nav_items").upsert(
    site.navItems.map((item) => ({
      id: item.id,
      area: item.area,
      parent_id: item.parentId,
      kind: item.kind,
      label: item.label,
      href: item.href,
      sort: item.sort,
      published: true,
    })),
  );
  if (navError) throw navError;

  const { error: channelError } = await supabase.from("support_channels").upsert(
    site.support.channels.map((channel, sort) => ({
      id: channel.id,
      label: channel.label,
      reply: channel.reply,
      href: channel.href ?? null,
      sort,
    })),
  );
  if (channelError) throw channelError;

  const copy = Object.entries(site.pageCopy).flatMap(([page, fields]) =>
    Object.entries(fields).map(([key, value]) => ({ page, key, value })),
  );
  const { error: copyError } = await supabase.from("page_copy").upsert(copy);
  if (copyError) throw copyError;

  for (const product of site.catalog) {
    const existing = await supabase
      .from("inventory")
      .select("id")
      .eq("product_id", product.id)
      .is("variant_id", null)
      .eq("warehouse", "US")
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) {
      const inserted = await supabase.from("inventory").insert({
        product_id: product.id,
        variant_id: null,
        warehouse: "US",
        on_hand: 100,
        reserved: 0,
      });
      if (inserted.error) throw inserted.error;
    }
  }
}

async function ensureSuperAdmin(url: string, serviceKey: string, properties: Record<string, string>) {
  const email = (properties.SUPER_ADMIN_EMAIL || "xyntraaisolutions@gmail.com").toLowerCase();
  const password = properties.SUPER_ADMIN_PASSWORD;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listError) throw listError;
  let user = listed.users.find((item) => item.email?.toLowerCase() === email);
  if (!user) {
    if (!password || password.includes("YOUR_")) {
      console.log("Set SUPER_ADMIN_PASSWORD in config/supabase.local.properties, then run this script again to create the Super Admin.");
      return;
    }
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: "Super Admin" },
    });
    if (created.error || !created.data.user) throw created.error ?? new Error("Super Admin could not be created.");
    user = created.data.user;
  }
  const { error } = await admin.from("profiles").update({ role: "super_admin", active: true, name: "Super Admin" }).eq("id", user.id);
  if (error) throw error;
  console.log(`Super Admin is ${email}.`);
}

async function main() {
  const file = path.join(process.cwd(), "config", "supabase.local.properties");
  const properties = readProperties(file);
  if (
    isSample(properties.SUPABASE_URL) ||
    isSample(properties.SUPABASE_SERVICE_ROLE_KEY) ||
    isSample(properties.SUPABASE_DB_URL)
  ) {
    console.log("Replace the YOUR_* values in config/supabase.local.properties, then run this script again.");
    return;
  }

  const client = new pg.Client({
    connectionString: properties.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const directory = path.join(process.cwd(), "supabase/migrations");
  for (const name of readdirSync(directory).filter((file) => file.endsWith(".sql")).sort()) {
    await client.query(readFileSync(path.join(directory, name), "utf8"));
  }
  await client.query("notify pgrst, 'reload schema'");
  await client.end();
  await seed(properties.SUPABASE_URL, properties.SUPABASE_SERVICE_ROLE_KEY);
  await ensureSuperAdmin(properties.SUPABASE_URL, properties.SUPABASE_SERVICE_ROLE_KEY, properties);
  console.log("Supabase schema and Joova content are in place.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
