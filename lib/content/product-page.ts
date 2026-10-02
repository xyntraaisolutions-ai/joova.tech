import { cache } from "react";
import { catalog, catalogCategories, type CatalogProduct } from "@/content/catalog";
import { productCoverage } from "@/lib/catalog/coverage";
import { SITE_URL } from "@/content/site";
import { applyStory } from "@/lib/content/product-story";
import { arrangeProductMedia } from "@/lib/content/variants";
import { applyCountryPrice, defaultMarket, resolveMarket, type Market } from "@/lib/geo/market";
import { formatUsd } from "@/lib/utils";
import { canAccess } from "@/lib/portal/roles";
import { readPortalProfile } from "@/lib/portal/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

export type ProductPage = {
  product: CatalogProduct;
  categoryLabel: string;
  related: CatalogProduct[];
  siteUrl: string;
};

function mapProduct(row: Row, images: Row[], variants: Row[], stock?: { availability?: string; available?: number | null }, videos: Row[] = []): CatalogProduct {
  const fallback = catalog.find((item) => item.id === row.id);
  const commerce = row.commerce && typeof row.commerce === "object" ? (row.commerce as Record<string, unknown>) : {};
  const listPrice = Number(row.price ?? fallback?.price ?? 0);
  const salePrice = Number(row.sale_price ?? 0);
  const onSale = row.on_sale === true && salePrice > 0 && salePrice < listPrice;
  const price = onSale ? salePrice : listPrice;
  const media = arrangeProductMedia(variants, images, videos);
  const pictures = media.pictures;
  const storedStatus = typeof row.status === "string" && row.status ? row.status : fallback?.status ?? "Available";
  const availability = stock?.availability === "out_of_stock" ? "out_of_stock" : "in_stock";
  const colors = media.variants.map((variant) => ({ name: variant.name, image: variant.pictures[0]?.src ?? "" }));
  const text = (key: string, spare: string) => {
    const value = row[key];
    return typeof value === "string" && value.length > 0 ? value : spare;
  };
  const mapped: CatalogProduct = {
    id: String(row.id),
    name: text("name", fallback?.name ?? ""),
    menuLabel: text("menu_label", fallback?.menuLabel ?? ""),
    href: text("href", fallback?.href ?? "/shop"),
    category: (row.category_id as CatalogProduct["category"]) ?? fallback?.category ?? "wearables",
    alsoIn: Array.isArray(row.also_in) ? (row.also_in as CatalogProduct["alsoIn"]) : fallback?.alsoIn,
    price,
    priceLabel: price > 0 ? formatUsd(price) : "Price not set",
    compareAt: onSale ? listPrice : undefined,
    topPick: row.top_pick === true,
    status: onSale ? "On sale" : availability === "out_of_stock" ? "Out of stock" : storedStatus === "Hidden" ? "In stock" : storedStatus,
    summary: text("summary", fallback?.summary ?? ""),
    image: pictures[0] ?? { src: "", alt: text("name", "Product"), width: 1600, height: 1600 },
    pictures,
    sharedPictures: media.sharedPictures,
    videos: media.videos,
    variants: media.variants,
    defaultVariantId: media.defaultVariantId,
    kicker: text("kicker", fallback?.kicker ?? ""),
    lead: text("lead", fallback?.lead ?? ""),
    detail: text("detail", fallback?.detail ?? ""),
    note: text("note", fallback?.note ?? ""),
    signals: Array.isArray(row.signals) && row.signals.length ? (row.signals as CatalogProduct["signals"]) : (fallback?.signals ?? []),
    sku: typeof row.sku === "string" ? row.sku : fallback?.sku,
    model: typeof commerce.model === "string" ? commerce.model : fallback?.model,
    availability,
    availableCount: availability === "in_stock" && typeof stock?.available === "number" ? stock.available : undefined,
    colors: colors.length ? colors : fallback?.colors,
    warrantyNote: typeof commerce.warrantyNote === "string" && commerce.warrantyNote ? commerce.warrantyNote : fallback?.warrantyNote,
    coverage: "warranty_eligible" in row
      ? productCoverage({
          warrantyEligible: row.warranty_eligible === true,
          warrantyYears: typeof row.warranty_years === "number" ? row.warranty_years : null,
          warrantyDays: typeof row.warranty_days === "number" ? row.warranty_days : null,
          freeShipping: commerce.freeShipping,
          returnDays: commerce.returnDays,
        })
      : undefined,
  };
  return applyStory(mapped, commerce.details);
}

function staticPage(href: string): ProductPage | null {
  const product = catalog.find((item) => item.href.split("#")[0] === href);
  if (!product) return null;
  const filled = applyStory(product, undefined);
  const categoryLabel = catalogCategories.find((category) => category.id === product.category)?.label ?? "Shop";
  const related = catalog.filter((item) => item.id !== filled.id && (item.category === filled.category || item.alsoIn?.includes(filled.category))).slice(0, 4).map((item) => applyStory(item, undefined));
  return { product: filled, categoryLabel, related, siteUrl: SITE_URL };
}

async function pageFromRow(supabase: Awaited<ReturnType<typeof createClient>>, row: Row): Promise<ProductPage> {
  const id = String(row.id);
    const [images, variants, stockRows, category, relatedRows, settings, videos] = await Promise.all([
      supabase.from("product_images").select("src, alt, width, height, sort, focused, enabled, deleted_at, variant_id").eq("product_id", id).order("sort"),
      supabase.from("product_variants").select("id, sku, attrs, sort, deleted_at, is_default").eq("product_id", id).order("sort"),
      supabase.rpc("public_stock"),
      supabase.from("categories").select("label").eq("id", row.category_id).maybeSingle(),
      supabase.from("products").select("id, name, menu_label, href, category_id, price, sale_price, on_sale, price_label, status, summary, published, deleted_at").eq("category_id", row.category_id).eq("published", true).is("deleted_at", null).neq("id", id).order("sort").limit(4),
      supabase.from("site_settings").select("site_url").eq("id", 1).maybeSingle(),
      supabase.from("videos").select("src, title, poster, sort, published, deleted_at, variant_id").eq("product_id", id).order("sort"),
    ]);
    const stock = Array.isArray(stockRows.data)
      ? (stockRows.data as { product_id?: string; availability?: string; available?: number | null }[]).find((item) => item.product_id === id)
      : undefined;
    const product = mapProduct(row, (images.data ?? []) as Row[], (variants.data ?? []) as Row[], stock, (videos.data ?? []) as Row[]);
    const relatedIds = ((relatedRows.data ?? []) as Row[]).map((item) => String(item.id));
    const [relatedImages, relatedVariants] = relatedIds.length
      ? await Promise.all([
          supabase.from("product_images").select("product_id, src, alt, width, height, sort, focused, enabled, deleted_at, variant_id").in("product_id", relatedIds).order("sort"),
          supabase.from("product_variants").select("id, product_id, sku, attrs, sort, deleted_at, is_default").in("product_id", relatedIds).order("sort"),
        ])
      : [{ data: [] }, { data: [] }];
    const stockList = Array.isArray(stockRows.data)
      ? (stockRows.data as { product_id?: string; availability?: string; available?: number | null }[])
      : [];
    const related = ((relatedRows.data ?? []) as Row[]).map((item) =>
      mapProduct(
        item,
        ((relatedImages.data ?? []) as Row[]).filter((image) => image.product_id === item.id),
        ((relatedVariants.data ?? []) as Row[]).filter((variant) => variant.product_id === item.id),
        stockList.find((entry) => entry.product_id === item.id),
      ),
    );
    const categoryLabel = typeof category.data?.label === "string" && category.data.label ? category.data.label : catalogCategories.find((item) => item.id === product.category)?.label ?? "Shop";
    const siteUrl = typeof settings.data?.site_url === "string" && settings.data.site_url ? settings.data.site_url : SITE_URL;
    const priced = await withCountryPrices(supabase, [product, ...related]);
  return { product: priced[0] ?? product, categoryLabel, related: priced.slice(1), siteUrl };
}

async function withCountryPrices(supabase: Awaited<ReturnType<typeof createClient>>, products: CatalogProduct[]) {
  const countries = await supabase.from("sell_countries").select("code, name, currency").eq("enabled", true);
  const markets: Market[] = countries.error || !Array.isArray(countries.data) || countries.data.length === 0
    ? [defaultMarket]
    : (countries.data as Market[]);
  const market = await resolveMarket(markets);
  if (market.code === "US" || products.length === 0) return products;
  const prices = await supabase
    .from("product_country_prices")
    .select("product_id, price, sale_price")
    .eq("country_code", market.code)
    .in("product_id", products.map((product) => product.id));
  const byProduct = new Map((prices.data ?? []).map((row) => [String(row.product_id), row]));
  return products.map((product) => applyCountryPrice(product, market, byProduct.get(product.id)));
}

export const loadProductPage = cache(async (slug: string): Promise<ProductPage | null> => {
  const href = `/${decodeURIComponent(slug)}`;
  if (!isSupabaseConfigured()) return staticPage(href);

  try {
    const supabase = await createClient();
    const productQuery = await supabase.from("products").select("*").eq("href", href).eq("published", true).is("deleted_at", null).maybeSingle();
    if (productQuery.error) return staticPage(href);
    if (!productQuery.data) return null;
    return pageFromRow(supabase, productQuery.data as Row);
  } catch {
    return staticPage(href);
  }
});

export async function loadStaffProduct(id: string): Promise<ProductPage | null> {
  if (!isSupabaseConfigured()) return staticPage(`/${id}`);
  const session = await readPortalProfile();
  if (!session || !canAccess(session.profile.role, "inventory")) return null;
  const productQuery = await session.supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (productQuery.error || !productQuery.data) return null;
  return pageFromRow(session.supabase, productQuery.data as Row);
}
