import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requirePortalApi } from "@/lib/portal/api";
import { availableUnits, readAvailable, syncAvailability } from "@/lib/portal/availability";
import { skuFromChoice, skuFromModel, skuFromVariant, uniqueSku } from "@/lib/portal/sku";
import { isShippingCode, shippingCodes, type ShippingCode, type ShippingOption } from "@/lib/shipping/options";
import { formatUsd } from "@/lib/utils";

const variantSchema = z.object({
  id: z.string().trim().min(1).max(80),
  sku: z.string().trim().max(40).default(""),
  sort: z.number().int().min(0).max(100),
  isDefault: z.boolean().default(false),
  attrs: z.record(z.string(), z.unknown()),
});

const categorySchema = z.object({
  kind: z.literal("category"),
  id: z.string().trim().min(1).max(40).regex(/^[a-z0-9-]+$/),
  label: z.string().trim().min(1).max(80),
  href: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(300),
  active: z.boolean(),
});

const suggestSchema = z.object({
  kind: z.literal("suggestSku"),
  productId: z.string().trim().max(40).default(""),
  previousId: z.string().trim().max(40).default(""),
  model: z.string().trim().max(80).default(""),
  productSku: z.string().trim().max(40).default(""),
  color: z.string().trim().max(160).default(""),
  choiceType: z.string().trim().max(40).default(""),
  choiceName: z.string().trim().max(160).default(""),
  variant: z.boolean().default(false),
  ignore: z.string().trim().max(40).optional(),
  extra: z.array(z.string().trim().max(40)).max(80).optional(),
});

const commerceSchema = z.object({
  brand: z.string().trim().max(80),
  vendor: z.string().trim().max(80),
  currency: z.string().trim().length(3),
  condition: z.enum(["new", "refurbished", "used"]),
  availability: z.enum(["in_stock", "out_of_stock", "preorder"]),
  preorder: z.boolean(),
  subscription: z.boolean(),
  requiresShipping: z.boolean(),
  freeShipping: z.boolean(),
  shipsFrom: z.string().trim().max(80),
  shipsTo: z.array(z.string().trim().min(2).max(8)).max(20),
  handlingMinDays: z.number().int().min(0).max(90),
  handlingMaxDays: z.number().int().min(0).max(90),
  returnDays: z.number().int().min(0).max(365),
  returnShipping: z.string().trim().max(160),
  taxable: z.boolean().nullable(),
  taxCode: z.string().trim().max(40),
  gtin: z.string().trim().max(20),
  mpn: z.string().trim().max(40),
  barcode: z.string().trim().max(40),
  weightGrams: z.number().positive().max(100000).nullable(),
  lengthMm: z.number().positive().max(10000).nullable(),
  widthMm: z.number().positive().max(10000).nullable(),
  heightMm: z.number().positive().max(10000).nullable(),
  boxSystem: z.enum(["us", "metric"]).default("us"),
  weightUnit: z.enum(["lb", "oz", "kg", "g"]).default("lb"),
  dimensionUnit: z.enum(["in", "cm"]).default("in"),
  countryOfOrigin: z.string().trim().max(80),
  material: z.string().trim().max(200),
  model: z.string().trim().max(80).default(""),
  manufacturer: z.string().trim().max(80).default(""),
  manufacturerModel: z.string().trim().max(80).default(""),
  manufacturerProductName: z.string().trim().max(160).default(""),
  wholesalePrice: z.number().min(0).max(100000).nullable().default(null),
  seoTitle: z.string().trim().max(160),
  seoDescription: z.string().trim().max(320),
  productType: z.string().trim().max(80),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  warrantyNote: z.string().trim().max(300),
  googleCategory: z.string().trim().max(120),
  showAvailable: z.boolean().default(false),
});

const mediaSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("image"),
    productId: z.string().trim().min(1).max(40).regex(/^[a-z0-9_-]+$/),
    variantId: z.string().trim().max(80).optional(),
    src: z.string().trim().min(1).max(500),
    alt: z.string().trim().min(1).max(200),
    width: z.number().int().min(1).max(8000),
    height: z.number().int().min(1).max(8000),
  }),
  z.object({
    kind: z.literal("focus"),
    productId: z.string().trim().min(1).max(40).regex(/^[a-z0-9_-]+$/),
    imageId: z.string().trim().min(1).max(80),
  }),
  z.object({
    kind: z.literal("imageAlt"),
    imageId: z.string().trim().min(1).max(80),
    alt: z.string().trim().min(1).max(200),
  }),
  z.object({
    kind: z.literal("imageReplace"),
    imageId: z.string().trim().min(1).max(80),
    src: z.string().trim().min(1).max(500),
    width: z.number().int().min(1).max(8000),
    height: z.number().int().min(1).max(8000),
  }),
  z.object({
    kind: z.literal("imageEnabled"),
    imageId: z.string().trim().min(1).max(80),
    enabled: z.boolean(),
  }),
  z.object({
    kind: z.literal("imageRestore"),
    imageId: z.string().trim().min(1).max(80),
  }),
  z.object({
    kind: z.literal("video"),
    productId: z.string().trim().min(1).max(40).regex(/^[a-z0-9_-]+$/),
    variantId: z.string().trim().max(80).optional(),
    title: z.string().trim().min(1).max(120),
    src: z.string().trim().min(1).max(500),
    poster: z.string().trim().max(500),
  }),
  z.object({
    kind: z.literal("videoTitle"),
    videoId: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(120),
  }),
  z.object({
    kind: z.literal("videoReplace"),
    videoId: z.string().trim().min(1).max(80),
    src: z.string().trim().min(1).max(500),
  }),
  z.object({
    kind: z.literal("videoEnabled"),
    videoId: z.string().trim().min(1).max(80),
    enabled: z.boolean(),
  }),
  z.object({
    kind: z.literal("videoRestore"),
    videoId: z.string().trim().min(1).max(80),
  }),
]);

async function saveMedia(supabase: SupabaseClient, item: z.infer<typeof mediaSchema>) {
  if (item.kind === "image" || item.kind === "focus" || item.kind === "video") {
    const product = await supabase.from("products").select("id, deleted_at").eq("id", item.productId).maybeSingle();
    if (!product.data || product.data.deleted_at) return "Save the product before adding pictures or videos.";
  }
  if (item.kind === "image") {
    const variantId = item.variantId || null;
    const current = await supabase.from("product_images").select("id, focused, variant_id").eq("product_id", item.productId).is("deleted_at", null);
    if (current.error) return "The picture could not be saved.";
    const rows = (current.data ?? []).filter((row) => (row.variant_id ?? null) === variantId);
    const { error } = await supabase.from("product_images").insert({
      id: `${item.productId}-${Date.now()}`,
      product_id: item.productId,
      variant_id: variantId,
      src: item.src,
      alt: item.alt,
      width: item.width,
      height: item.height,
      sort: rows.length,
      focused: !variantId && !rows.some((row) => row.focused),
    });
    return error ? "The picture could not be saved." : null;
  }
  if (item.kind === "focus") {
    const image = await supabase.from("product_images").select("id, enabled, deleted_at").eq("id", item.imageId).eq("product_id", item.productId).maybeSingle();
    if (!image.data || image.data.deleted_at) return "That picture is not on this product.";
    if (image.data.enabled === false) return "Enable this picture before making it the focused image.";
    const clear = await supabase.from("product_images").update({ focused: false }).eq("product_id", item.productId);
    if (clear.error) return "The focused picture could not be saved.";
    const mark = await supabase.from("product_images").update({ focused: true }).eq("id", item.imageId);
    return mark.error ? "The focused picture could not be saved." : null;
  }
  if (item.kind === "imageAlt") {
    const { error } = await supabase.from("product_images").update({ alt: item.alt }).eq("id", item.imageId);
    return error ? "The picture description could not be saved." : null;
  }
  if (item.kind === "imageReplace") {
    const image = await supabase.from("product_images").select("id, deleted_at").eq("id", item.imageId).maybeSingle();
    if (!image.data || image.data.deleted_at) return "Recover this picture before replacing it.";
    const { error } = await supabase.from("product_images").update({
      src: item.src,
      width: item.width,
      height: item.height,
    }).eq("id", item.imageId);
    return error ? "The picture could not be replaced." : null;
  }
  if (item.kind === "imageEnabled") {
    const image = await supabase.from("product_images").select("id, product_id, focused, deleted_at").eq("id", item.imageId).maybeSingle();
    if (!image.data || image.data.deleted_at) return "Recover this picture before changing it.";
    const { error } = await supabase.from("product_images").update({ enabled: item.enabled }).eq("id", item.imageId);
    if (error) return "The picture could not be updated.";
    if (!item.enabled && image.data.focused) {
      const clear = await supabase.from("product_images").update({ focused: false }).eq("id", item.imageId);
      if (clear.error) return "The picture could not be updated.";
      const next = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", image.data.product_id)
        .eq("enabled", true)
        .is("deleted_at", null)
        .neq("id", item.imageId)
        .order("sort")
        .limit(1);
      const nextId = next.data?.[0]?.id;
      if (nextId) {
        const mark = await supabase.from("product_images").update({ focused: true }).eq("id", nextId);
        if (mark.error) return "The picture could not be updated.";
      }
    }
    return null;
  }
  if (item.kind === "imageRestore") {
    const { error } = await supabase.from("product_images").update({ deleted_at: null }).eq("id", item.imageId);
    return error ? "The picture could not be recovered." : null;
  }
  if (item.kind === "video") {
    const current = await supabase.from("videos").select("id").eq("product_id", item.productId).is("deleted_at", null);
    const { error } = await supabase.from("videos").insert({
      id: `${item.productId}-video-${Date.now()}`,
      product_id: item.productId,
      variant_id: item.variantId || null,
      title: item.title,
      youtube_id: "",
      src: item.src,
      poster: item.poster,
      sort: current.data?.length ?? 0,
      published: true,
    });
    return error ? "The video could not be saved." : null;
  }
  if (item.kind === "videoTitle") {
    const { error } = await supabase.from("videos").update({ title: item.title }).eq("id", item.videoId);
    return error ? "The video title could not be saved." : null;
  }
  if (item.kind === "videoReplace") {
    const video = await supabase.from("videos").select("id, deleted_at").eq("id", item.videoId).maybeSingle();
    if (!video.data || video.data.deleted_at) return "Recover this video before replacing it.";
    const { error } = await supabase.from("videos").update({ src: item.src, youtube_id: "" }).eq("id", item.videoId);
    return error ? "The video could not be replaced." : null;
  }
  if (item.kind === "videoEnabled") {
    const video = await supabase.from("videos").select("id, deleted_at").eq("id", item.videoId).maybeSingle();
    if (!video.data || video.data.deleted_at) return "Recover this video before changing it.";
    const { error } = await supabase.from("videos").update({ published: item.enabled }).eq("id", item.videoId);
    return error ? "The video could not be updated." : null;
  }
  const { error } = await supabase.from("videos").update({ deleted_at: null }).eq("id", item.videoId);
  return error ? "The video could not be recovered." : null;
}

const productSchema = z.object({
  id: z.string().trim().min(1).max(40).regex(/^[a-z0-9_-]+$/),
  previousId: z.string().trim().max(40).regex(/^[a-z0-9_-]*$/).default(""),
  name: z.string().trim().min(1).max(80),
  menuLabel: z.string().trim().min(1).max(80),
  href: z.string().trim().min(1).max(160),
  categoryId: z.string().trim().min(1).max(40).regex(/^[a-z0-9-]+$/),
  alsoIn: z.array(z.string().trim().min(1).max(40)).max(8),
  price: z.number().min(0).max(100000),
  salePrice: z.number().positive().max(100000).nullable(),
  onSale: z.boolean(),
  published: z.boolean(),
  topPick: z.boolean(),
  highlighted: z.boolean(),
  warrantyEligible: z.boolean(),
  warrantyYears: z.number().int().min(1).max(30).nullable(),
  warrantyDays: z.number().int().min(1).max(3650).nullable(),
  status: z.string().trim().min(1).max(40),
  summary: z.string().trim().min(1).max(500),
  sku: z.string().trim().min(1).max(40),
  onHand: z.number().int().min(0).max(100000),
  reserved: z.number().int().min(0).max(100000),
  variants: z.array(variantSchema).max(40),
  commerce: commerceSchema,
  countryPrices: z.array(z.object({
    code: z.string().trim().length(2),
    price: z.number().min(0).max(100000).nullable(),
    salePrice: z.number().positive().max(100000).nullable(),
  })).max(50).default([]),
  shippingCustom: z.boolean().default(false),
  shippingTypes: z.array(z.object({
    code: z.enum(shippingCodes),
    price: z.number().min(0).max(100000).nullable(),
  })).max(shippingCodes.length).default([]),
});

const productFieldGuide = {
  id: { name: "Product ID", tab: "product" },
  name: { name: "Name", tab: "product" },
  menuLabel: { name: "Menu label", tab: "product" },
  href: { name: "Page path", tab: "product" },
  categoryId: { name: "Category", tab: "product" },
  status: { name: "Status label", tab: "product" },
  summary: { name: "Summary", tab: "product" },
  "commerce.model": { name: "Model", tab: "product" },
  price: { name: "Price", tab: "price" },
  salePrice: { name: "Sale price", tab: "price" },
  "commerce.currency": { name: "Currency", tab: "price" },
  "commerce.wholesalePrice": { name: "Wholesale price", tab: "price" },
  sku: { name: "SKU", tab: "stock" },
  onHand: { name: "On hand", tab: "stock" },
  reserved: { name: "Reserved", tab: "stock" },
  "commerce.handlingMinDays": { name: "Earliest delivery day", tab: "shipping" },
  "commerce.handlingMaxDays": { name: "Latest delivery day", tab: "shipping" },
  "commerce.returnDays": { name: "Return window", tab: "shipping" },
} as const;

function productFieldIssues(issues: { path: PropertyKey[]; code: string }[]) {
  return issues.map((issue) => {
    const field = issue.path.map(String).join(".");
    const guide = productFieldGuide[field as keyof typeof productFieldGuide] ?? { name: "Product", tab: "product" as const };
    let detail = "Check this value.";
    if (field === "price") detail = "Enter 0 if the price is not set yet, or a selling price.";
    else if (field === "salePrice") detail = "Enter a sale price, or leave it empty.";
    else if (field === "commerce.currency") detail = "Use a 3-letter currency code, such as USD.";
    else if (field === "commerce.wholesalePrice") detail = "Enter 0 or a wholesale price, or leave it empty.";
    else if (field === "id") detail = "Use lowercase letters, numbers, hyphens, and underscores.";
    else if (issue.code === "too_small") detail = "This field is required.";
    return { field: field || "name", name: guide.name, detail, tab: guide.tab };
  });
}

export async function GET() {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session } = gate;
  const [products, variants, images, videos, stock, featured, categories, deals, settings, sellCountries, countryPrices, shippingOptions, productShipping, productShippingOptions] = await Promise.all([
    session.supabase.from("products").select("*").order("sort"),
    session.supabase.from("product_variants").select("id, product_id, sku, sort, attrs, is_default, deleted_at").order("sort"),
    session.supabase.from("product_images").select("id, product_id, variant_id, src, alt, width, height, sort, focused, enabled, deleted_at").order("sort"),
    session.supabase.from("videos").select("id, product_id, variant_id, title, youtube_id, src, poster, sort, published, deleted_at").order("sort"),
    session.supabase.from("inventory").select("id, product_id, variant_id, warehouse, on_hand, reserved, deleted_at"),
    session.supabase.from("featured_products").select("product_id, sort, deleted_at"),
    session.supabase.from("categories").select("id, label, href, summary, sort, active, deleted_at").order("sort"),
    session.supabase.from("deals").select("id, title, deleted_at").order("sort"),
    session.supabase.from("site_settings").select("list_page_size").eq("id", 1).maybeSingle(),
    session.supabase.from("sell_countries").select("code, name, currency").eq("enabled", true).order("name"),
    session.supabase.from("product_country_prices").select("product_id, country_code, price, sale_price"),
    session.supabase.from("shipping_options").select("code, name, price, min_days, max_days, enabled, sort").order("sort"),
    session.supabase.from("product_shipping").select("product_id"),
    session.supabase.from("product_shipping_options").select("product_id, option_code, price"),
  ]);
  const error = products.error || variants.error || images.error || videos.error || stock.error || featured.error || categories.error || deals.error || shippingOptions.error || productShipping.error || productShippingOptions.error;
  if (error) return NextResponse.json({ error: "Inventory could not be loaded." }, { status: 400 });
  const rows = products.data ?? [];
  const units = new Map<string, { on_hand: number; reserved: number }>();
  for (const row of stock.data ?? []) {
    if (row.variant_id || row.deleted_at || row.warehouse !== "US") continue;
    units.set(row.product_id, row);
  }
  await Promise.all(rows.map(async (product) => {
    if (product.deleted_at) return;
    const row = units.get(product.id);
    const available = row ? availableUnits(row.on_hand, row.reserved) : 0;
    const commerce = (product.commerce ?? {}) as Record<string, unknown>;
    if (available > 0 || commerce.availability === "out_of_stock") return;
    const next = { ...commerce, availability: "out_of_stock" };
    const saved = await session.supabase.from("products").update({ commerce: next }).eq("id", product.id);
    if (!saved.error) product.commerce = next;
  }));
  return NextResponse.json({
    products: rows,
    variants: variants.data ?? [],
    images: images.data ?? [],
    videos: videos.data ?? [],
    stock: stock.data ?? [],
    featured: featured.data ?? [],
    categories: categories.data ?? [],
    deals: deals.data ?? [],
    pageSize: Number(settings.data?.list_page_size) || 10,
    sellCountries: sellCountries.error ? [] : (sellCountries.data ?? []),
    countryPrices: countryPrices.error ? [] : (countryPrices.data ?? []),
    shippingOptions: (shippingOptions.data ?? []).flatMap((row) => {
      if (!isShippingCode(row.code)) return [];
      const option: ShippingOption = {
        code: row.code,
        name: row.name,
        price: Number(row.price),
        minDays: row.min_days,
        maxDays: row.max_days,
        enabled: row.enabled,
      };
      return [option];
    }),
    productShipping: (productShipping.data ?? []).map((row) => ({
      productId: row.product_id,
      options: (productShippingOptions.data ?? []).flatMap((item) => {
        if (item.product_id !== row.product_id || !isShippingCode(item.option_code)) return [];
        return [{
          code: item.option_code as ShippingCode,
          price: item.price === null || item.price === undefined ? null : Number(item.price),
        }];
      }),
    })),
  });
}

const recoverSchema = z.object({
  kind: z.literal("recover"),
  id: z.string().trim().min(1).max(40),
  reason: z.string().trim().min(3).max(500),
});

const hideSchema = z.object({
  kind: z.literal("hide"),
  id: z.string().trim().min(1).max(40),
});

const activateSchema = z.object({
  kind: z.literal("activate"),
  id: z.string().trim().min(1).max(40),
});

export async function POST(request: Request) {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session, viewAs } = gate;
  const body = await request.json().catch(() => null);
  const recover = recoverSchema.safeParse(body);
  if (body && typeof body === "object" && (body as { kind?: unknown }).kind === "recover" && !recover.success) {
    return NextResponse.json({ error: "Add a reason for this restore." }, { status: 400 });
  }
  if (recover.success) {
    const current = await session.supabase.from("products").select("id, deleted_at").eq("id", recover.data.id).maybeSingle();
    if (!current.data?.deleted_at) {
      return NextResponse.json({ error: "That product is not in the removed list." }, { status: 400 });
    }
    const { error } = await session.supabase.from("products").update({ deleted_at: null, published: true, status: "Available" }).eq("id", recover.data.id);
    if (error) return NextResponse.json({ error: "The product could not be restored." }, { status: 400 });
    await session.supabase.rpc("record_audit", {
      p_action: "restore_product",
      p_entity: "products",
      p_entity_id: recover.data.id,
      p_detail: { reason: recover.data.reason, published: true },
      p_view_as: viewAs,
    });
    return NextResponse.json({ ok: true });
  }
  const activate = activateSchema.safeParse(body);
  if (activate.success) {
    const current = await session.supabase.from("products").select("id, deleted_at, published").eq("id", activate.data.id).maybeSingle();
    if (!current.data || current.data.deleted_at) {
      return NextResponse.json({ error: "That product is not in the hidden list." }, { status: 400 });
    }
    if (current.data.published) {
      return NextResponse.json({ error: "That product is already on the website." }, { status: 400 });
    }
    const { error } = await session.supabase.from("products").update({ published: true, status: "Available" }).eq("id", activate.data.id);
    if (error) return NextResponse.json({ error: "The product could not be activated." }, { status: 400 });
    await session.supabase.rpc("record_audit", {
      p_action: "activate_product",
      p_entity: "products",
      p_entity_id: activate.data.id,
      p_detail: { published: true },
      p_view_as: viewAs,
    });
    return NextResponse.json({ ok: true });
  }
  const hide = hideSchema.safeParse(body);
  if (hide.success) {
    const current = await session.supabase.from("products").select("id, deleted_at").eq("id", hide.data.id).maybeSingle();
    if (!current.data || current.data.deleted_at) {
      return NextResponse.json({ error: "That product is not on the active list." }, { status: 400 });
    }
    const { error } = await session.supabase.from("products").update({ published: false, status: "Hidden" }).eq("id", hide.data.id);
    if (error) return NextResponse.json({ error: "The product could not be hidden." }, { status: 400 });
    await session.supabase.from("featured_products").delete().eq("product_id", hide.data.id);
    await session.supabase.rpc("record_audit", {
      p_action: "hide_product",
      p_entity: "products",
      p_entity_id: hide.data.id,
      p_detail: { published: false },
      p_view_as: viewAs,
    });
    return NextResponse.json({ ok: true });
  }
  const suggestion = suggestSchema.safeParse(body);
  if (suggestion.success) {
    const requestSku = suggestion.data;
    const modelSku = skuFromModel(requestSku.model);
    let sku = "";
    if (requestSku.variant) {
      const choiceName = requestSku.choiceName || requestSku.color;
      if (!choiceName.trim()) return NextResponse.json({ error: "Add a name before generating a SKU." }, { status: 400 });
      if (requestSku.choiceType.trim()) {
        if (!requestSku.productSku.trim()) return NextResponse.json({ error: "Add a product SKU before generating a variant SKU." }, { status: 400 });
        sku = skuFromChoice(requestSku.productSku, requestSku.choiceType, choiceName);
      } else {
        const productSku = skuFromModel(requestSku.productSku) || modelSku;
        if (!productSku) return NextResponse.json({ error: "Add a model or product SKU before generating a variant SKU." }, { status: 400 });
        sku = skuFromVariant(productSku, choiceName);
      }
    } else {
      if (!modelSku) return NextResponse.json({ error: "Add a model before generating a SKU." }, { status: 400 });
      const catalog = await session.supabase.from("products").select("id, commerce");
      const key = requestSku.model.trim().toLowerCase();
      const modelTaken = (catalog.data ?? []).some((row) => {
        if (row.id === requestSku.productId || row.id === requestSku.previousId) return false;
        const commerce = row.commerce && typeof row.commerce === "object" ? (row.commerce as Record<string, unknown>) : {};
        const existing = typeof commerce.model === "string" ? commerce.model.trim().toLowerCase() : "";
        return existing === key;
      });
      if (modelTaken) return NextResponse.json({ error: "Model already exists." }, { status: 400 });
      sku = modelSku;
    }
    if (!sku) return NextResponse.json({ error: "A SKU could not be generated." }, { status: 400 });
    const [products, variants] = await Promise.all([
      session.supabase.from("products").select("sku"),
      session.supabase.from("product_variants").select("sku"),
    ]);
    const taken = new Set(
      [...(products.data ?? []), ...(variants.data ?? [])]
        .map((row) => (typeof row.sku === "string" ? row.sku.toUpperCase() : ""))
        .filter(Boolean),
    );
    if (requestSku.ignore) taken.delete(requestSku.ignore.toUpperCase());
    for (const extra of requestSku.extra ?? []) taken.add(extra.toUpperCase());
    sku = uniqueSku(sku, taken);
    if (!sku) return NextResponse.json({ error: "SKU already exists." }, { status: 400 });
    return NextResponse.json({ sku });
  }
  const category = categorySchema.safeParse(body);
  if (body && typeof body === "object" && (body as { kind?: unknown }).kind === "category" && !category.success) {
    return NextResponse.json({ error: "Use a name and a lowercase id. The shop path can be /shop#your-category." }, { status: 400 });
  }
  if (category.success) {
    const existingCategory = await session.supabase.from("categories").select("deleted_at, sort").eq("id", category.data.id).maybeSingle();
    if (existingCategory.data?.deleted_at) {
      return NextResponse.json({ error: "That category is removed. Permanently delete it before reusing the id." }, { status: 400 });
    }
    const sort = existingCategory.data?.sort ?? 100;
    const { error } = await session.supabase.from("categories").upsert({
      id: category.data.id,
      label: category.data.label,
      href: category.data.href,
      summary: category.data.summary,
      active: category.data.active,
      sort,
    });
    if (error) return NextResponse.json({ error: "The category could not be saved." }, { status: 400 });
    await session.supabase.rpc("record_audit", {
      p_action: "save_category",
      p_entity: "categories",
      p_entity_id: category.data.id,
      p_detail: { label: category.data.label, href: category.data.href, active: category.data.active },
      p_view_as: viewAs,
    });
    return NextResponse.json({ ok: true });
  }
  const media = mediaSchema.safeParse(body);
  if (media.success) {
    const saved = await saveMedia(session.supabase, media.data);
    if (saved) return NextResponse.json({ error: saved }, { status: 400 });
    await session.supabase.rpc("record_audit", {
      p_action: "save_media",
      p_entity: media.data.kind === "video" || media.data.kind === "videoTitle" ? "videos" : "product_images",
      p_entity_id: "imageId" in media.data ? media.data.imageId : "videoId" in media.data ? media.data.videoId : media.data.productId,
      p_detail: { kind: media.data.kind },
      p_view_as: viewAs,
    });
    return NextResponse.json({ ok: true });
  }
  const mediaKind = body && typeof body === "object" && "kind" in body ? String((body as { kind?: unknown }).kind) : "";
  if (mediaKind === "image" || mediaKind === "focus" || mediaKind === "imageAlt" || mediaKind === "imageReplace" || mediaKind === "imageEnabled" || mediaKind === "imageRestore" || mediaKind === "video" || mediaKind === "videoTitle" || mediaKind === "videoReplace" || mediaKind === "videoEnabled" || mediaKind === "videoRestore") {
    return NextResponse.json({ error: "Check the media fields." }, { status: 400 });
  }
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    const fields = productFieldIssues(parsed.error.issues);
    return NextResponse.json({ error: fields[0] ? `${fields[0].name}. ${fields[0].detail}` : "Check the product fields.", fields }, { status: 400 });
  }
  const item = parsed.data;
  const categoryRow = await session.supabase.from("categories").select("id, deleted_at").eq("id", item.categoryId).maybeSingle();
  if (!categoryRow.data || categoryRow.data.deleted_at) {
    return NextResponse.json({
      error: "Category. Choose an active category.",
      fields: [{ field: "categoryId", name: "Category", detail: "Choose an active category.", tab: "product" }],
    }, { status: 400 });
  }
  if (item.commerce.model.trim()) {
    const catalog = await session.supabase.from("products").select("id, commerce");
    const key = item.commerce.model.trim().toLowerCase();
    const modelTaken = (catalog.data ?? []).some((row) => {
      if (row.id === item.id || row.id === item.previousId) return false;
      const commerce = row.commerce && typeof row.commerce === "object" ? (row.commerce as Record<string, unknown>) : {};
      const existing = typeof commerce.model === "string" ? commerce.model.trim().toLowerCase() : "";
      return existing === key;
    });
    if (modelTaken) {
      return NextResponse.json({
        error: "Model. Model already exists.",
        fields: [{ field: "commerce.model", name: "Model", detail: "Model already exists.", tab: "product" }],
      }, { status: 400 });
    }
  }
  const codes = [item.sku, ...item.variants.map((variant) => variant.sku)].map((sku) => sku.trim().toUpperCase()).filter(Boolean);
  if (new Set(codes).size !== codes.length) {
    const productSku = item.sku.trim().toUpperCase();
    const variantClash = item.variants.some((variant, index) => {
      const sku = variant.sku.trim().toUpperCase();
      if (!sku) return false;
      return sku === productSku || item.variants.some((other, otherIndex) => otherIndex !== index && other.sku.trim().toUpperCase() === sku);
    });
    return NextResponse.json({
      error: "SKU. SKU already exists.",
      fields: [{ field: "sku", name: "SKU", detail: "SKU already exists.", tab: variantClash ? "variants" : "stock" }],
    }, { status: 400 });
  }
  const [skuProducts, skuVariants] = await Promise.all([
    session.supabase.from("products").select("id, sku"),
    session.supabase.from("product_variants").select("id, sku"),
  ]);
  const ownProducts = new Set([item.id, item.previousId].filter(Boolean));
  const ownVariants = new Set(item.variants.map((variant) => variant.id));
  const takenSkus = new Set<string>();
  for (const row of skuProducts.data ?? []) {
    if (!row.sku || ownProducts.has(row.id)) continue;
    takenSkus.add(row.sku.toUpperCase());
  }
  for (const row of skuVariants.data ?? []) {
    if (!row.sku || ownVariants.has(row.id)) continue;
    takenSkus.add(row.sku.toUpperCase());
  }
  const takenHit = codes.find((sku) => takenSkus.has(sku));
  if (takenHit) {
    return NextResponse.json({
      error: "SKU. SKU already exists.",
      fields: [{ field: "sku", name: "SKU", detail: "SKU already exists.", tab: takenHit === item.sku.trim().toUpperCase() ? "stock" : "variants" }],
    }, { status: 400 });
  }
  if (item.onSale && (item.salePrice === null || item.salePrice >= item.price)) {
    return NextResponse.json({
      error: "Sale price. A sale price has to be lower than the regular price.",
      fields: [{ field: "salePrice", name: "Sale price", detail: "A sale price has to be lower than the regular price.", tab: "price" }],
    }, { status: 400 });
  }
  const boxSides = [item.commerce.lengthMm, item.commerce.widthMm, item.commerce.heightMm];
  if (boxSides.some((side) => side !== null) && boxSides.some((side) => side === null)) {
    return NextResponse.json({
      error: "Box size. Enter length, width, and height, or leave all three empty.",
      fields: [{ field: "boxLength", name: "Box size", detail: "Enter length, width, and height, or leave all three empty.", tab: "size" }],
    }, { status: 400 });
  }
  if (item.commerce.handlingMaxDays < item.commerce.handlingMinDays) {
    return NextResponse.json({
      error: "Latest delivery day. The latest day has to be on or after the earliest.",
      fields: [{ field: "commerce.handlingMaxDays", name: "Latest delivery day", detail: "The latest day has to be on or after the earliest.", tab: "shipping" }],
    }, { status: 400 });
  }
  if (item.reserved > item.onHand) {
    return NextResponse.json({
      error: "Reserved. Reserved stock cannot be higher than the quantity on hand.",
      fields: [{ field: "reserved", name: "Reserved", detail: "Reserved stock cannot be higher than the quantity on hand.", tab: "stock" }],
    }, { status: 400 });
  }
  const commerce = availableUnits(item.onHand, item.reserved) <= 0
    ? { ...item.commerce, availability: "out_of_stock" as const }
    : item.commerce;
  const effective = item.onSale && item.salePrice ? item.salePrice : item.price;
  if (item.previousId && item.previousId !== item.id) {
    const renamed = await session.supabase.rpc("rename_product", { p_from: item.previousId, p_to: item.id });
    const renameError = renamed.error?.message || (renamed.data?.ok === false ? renamed.data.error : "");
    if (renameError) {
      return NextResponse.json({
        error: `Product ID. ${renameError}`,
        fields: [{ field: "id", name: "Product ID", detail: renameError, tab: "product" }],
      }, { status: 400 });
    }
  }
  const existing = await session.supabase.from("products").select("sort").eq("id", item.id).maybeSingle();
  const isNew = !existing.data;
  const published = isNew ? false : item.published;
  const status = isNew ? "Hidden" : item.status;
  const sort = existing.data?.sort ?? 100;
  const { error } = await session.supabase.from("products").upsert({
    id: item.id,
    name: item.name,
    menu_label: item.menuLabel,
    href: item.href,
    category_id: item.categoryId,
    also_in: item.alsoIn.filter((id) => id !== item.categoryId),
    price: item.price,
    price_label: item.price > 0 ? formatUsd(effective) : "Price not set",
    sale_price: item.salePrice,
    on_sale: item.onSale,
    published,
    top_pick: item.topPick,
    warranty_eligible: item.warrantyEligible,
    warranty_years: item.warrantyYears,
    warranty_days: item.warrantyDays,
    commerce,
    status,
    summary: item.summary,
    sku: item.sku,
    sort,
  });
  if (error) {
    const duplicate = error.message.toLowerCase().includes("sku") || error.code === "23505";
    return NextResponse.json({
      error: duplicate ? "SKU. SKU already exists." : "The product could not be saved.",
      fields: duplicate ? [{ field: "sku", name: "SKU", detail: "SKU already exists.", tab: "stock" }] : [],
    }, { status: 400 });
  }

  const savedVariants = item.variants.map((variant, index) => ({ ...variant, sort: index }));
  if (savedVariants.length && !savedVariants.some((variant) => variant.isDefault)) savedVariants[0].isDefault = true;
  let defaultUsed = false;
  for (const variant of savedVariants) {
    variant.isDefault = variant.isDefault && !defaultUsed;
    if (variant.isDefault) defaultUsed = true;
  }
  await session.supabase.from("product_variants").update({ is_default: false }).eq("product_id", item.id);
  if (savedVariants.length) {
    const { error: variantError } = await session.supabase.from("product_variants").upsert(
      savedVariants.map((variant) => ({
        id: variant.id,
        product_id: item.id,
        sku: variant.sku || null,
        sort: variant.sort,
        is_default: variant.isDefault,
        deleted_at: null,
        attrs: variant.attrs,
      })),
    );
    if (variantError) {
      return NextResponse.json({
        error: "SKU. SKU already exists.",
        fields: [{ field: "sku", name: "SKU", detail: "SKU already exists.", tab: "variants" }],
      }, { status: 400 });
    }
  }
  const liveVariants = await session.supabase.from("product_variants").select("id").eq("product_id", item.id).is("deleted_at", null);
  const keep = new Set(savedVariants.map((variant) => variant.id));
  const removed = (liveVariants.data ?? []).map((row) => row.id).filter((id) => !keep.has(id));
  if (removed.length) {
    const { error: removeError } = await session.supabase.from("product_variants").update({ deleted_at: new Date().toISOString(), is_default: false }).in("id", removed);
    if (removeError) return NextResponse.json({ error: "A variant could not be removed." }, { status: 400 });
  }

  const beforeStock = await readAvailable(session.supabase, item.id);
  const stock = await session.supabase
    .from("inventory")
    .select("id")
    .eq("product_id", item.id)
    .is("variant_id", null)
    .eq("warehouse", "US")
    .maybeSingle();
  const stockWrite = stock.data
    ? session.supabase.from("inventory").update({ on_hand: item.onHand, reserved: item.reserved }).eq("id", stock.data.id)
    : session.supabase.from("inventory").insert({
        product_id: item.id,
        variant_id: null,
        warehouse: "US",
        on_hand: item.onHand,
        reserved: item.reserved,
      });
  const stockResult = await stockWrite;
  if (stockResult.error) return NextResponse.json({ error: "Stock could not be saved." }, { status: 400 });
  await syncAvailability(session.supabase, item.id, beforeStock);

  if (item.shippingCustom) {
    const offered = await session.supabase.from("shipping_options").select("code, enabled");
    if (offered.error) return NextResponse.json({ error: "Shipping types could not be saved." }, { status: 400 });
    const enabled = new Set((offered.data ?? []).filter((row) => row.enabled && isShippingCode(row.code)).map((row) => row.code));
    const picked = [...new Map(item.shippingTypes.map((row) => [row.code, row])).values()];
    if (picked.some((row) => !enabled.has(row.code))) {
      return NextResponse.json({
        error: "Shipping type. That shipping option is turned off.",
        fields: [{ field: "shippingTypes", name: "Shipping type", detail: "That shipping option is turned off. Choose an enabled option.", tab: "shipping" }],
      }, { status: 400 });
    }
    const marker = await session.supabase.from("product_shipping").upsert({ product_id: item.id });
    if (marker.error) return NextResponse.json({ error: "Shipping types could not be saved." }, { status: 400 });
    const cleared = await session.supabase.from("product_shipping_options").delete().eq("product_id", item.id);
    if (cleared.error) return NextResponse.json({ error: "Shipping types could not be saved." }, { status: 400 });
    if (picked.length) {
      const linked = await session.supabase.from("product_shipping_options").insert(picked.map((row) => ({
        product_id: item.id,
        option_code: row.code,
        price: row.price,
      })));
      if (linked.error) return NextResponse.json({ error: "Shipping types could not be saved." }, { status: 400 });
    }
  }

  const enabledCountries = await session.supabase.from("sell_countries").select("code").eq("enabled", true);
  const allowed = new Set((enabledCountries.data ?? []).map((row) => row.code).filter((code) => code !== "US"));
  for (const row of item.countryPrices) {
    const code = row.code.toUpperCase();
    if (!allowed.has(code)) continue;
    if (row.price === null || row.price <= 0) {
      const cleared = await session.supabase.from("product_country_prices").delete().eq("product_id", item.id).eq("country_code", code);
      if (cleared.error) return NextResponse.json({ error: "A country price could not be cleared." }, { status: 400 });
      continue;
    }
    if (row.salePrice !== null && row.salePrice >= row.price) {
      return NextResponse.json({
        error: "Sale price. A country sale price has to be lower than that country's price.",
        fields: [{ field: `countryPrices.${code}.salePrice`, name: "Sale price", detail: "A country sale price has to be lower than that country's price.", tab: "price" }],
      }, { status: 400 });
    }
    const priced = await session.supabase.from("product_country_prices").upsert({
      product_id: item.id,
      country_code: code,
      price: row.price,
      sale_price: row.salePrice,
    });
    if (priced.error) return NextResponse.json({ error: "A country price could not be saved." }, { status: 400 });
  }

  if (published && item.highlighted) {
    const { error: featureError } = await session.supabase
      .from("featured_products")
      .upsert({ product_id: item.id, sort });
    if (featureError) return NextResponse.json({ error: "The highlight could not be saved." }, { status: 400 });
  } else {
    await session.supabase.from("featured_products").delete().eq("product_id", item.id);
  }

  await session.supabase.from("deals").update({ price_label: formatUsd(effective) }).eq("href", item.href);
  await session.supabase.rpc("record_audit", {
    p_action: "save_product",
    p_entity: "products",
    p_entity_id: item.id,
    p_detail: {
      price: item.price,
      salePrice: item.salePrice,
      onHand: item.onHand,
      reserved: item.reserved,
      published,
      sku: item.sku,
      shippingTypes: item.shippingCustom ? item.shippingTypes : "default",
    },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true });
}
