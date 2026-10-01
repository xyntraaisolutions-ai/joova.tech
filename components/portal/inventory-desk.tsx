"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SizeWeightFields } from "@/components/portal/box-size";
import { PortalMenu, PortalPanel } from "@/components/portal/portal-menu";
import { LowStockSetup } from "@/components/portal/low-stock";
import { StockCounters } from "@/components/portal/stock-counters";
import { ProductMedia } from "@/components/portal/product-media";
import { ProductVariants, draftLabel, saveVariantMedia, type DraftVariant } from "@/components/portal/product-variants";
import { optionAxis, optionAvailable, optionName } from "@/lib/content/variants";
import { ResourceDelete } from "@/components/portal/resource-delete";
import { ShippingTypeFields, shippingChoices } from "@/components/portal/shipping-options";
import { SkuCodes } from "@/components/portal/sku-codes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { boxDraft, defaultDimensionUnit, defaultWeightUnit, dimensionUnitLabel, fromGrams, fromMillimeters, toGrams, toMillimeters, weightUnitLabel, weightUnits, type DimensionUnit, type MeasureSystem, type WeightUnit } from "@/lib/shipping/measure";
import { shippingWindow, type ShippingCode, type ShippingOption } from "@/lib/shipping/options";
import { cn, formatUsd } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  menu_label: string;
  href: string;
  category_id: string;
  also_in?: string[];
  price: number;
  sale_price: number | null;
  on_sale: boolean;
  published: boolean;
  top_pick: boolean;
  warranty_eligible: boolean;
  warranty_years: number | null;
  warranty_days: number | null;
  status: string;
  summary: string;
  sku: string | null;
  commerce?: Record<string, unknown>;
  deleted_at?: string | null;
};

type Category = {
  id: string;
  label: string;
  href: string;
  summary: string;
  active?: boolean;
  deleted_at?: string | null;
};

type Variant = { id: string; product_id: string; sku: string | null; sort: number; attrs: Record<string, unknown>; is_default?: boolean; deleted_at?: string | null };
type ImageRow = { id: string; product_id: string; variant_id?: string | null; src: string; alt: string; width?: number; height?: number; sort?: number; focused?: boolean; enabled?: boolean; deleted_at?: string | null };
type VideoRow = { id: string; product_id: string; variant_id?: string | null; title: string; youtube_id?: string; src?: string; published?: boolean; deleted_at?: string | null };
type Stock = { id: string; product_id: string; variant_id: string | null; warehouse?: string; on_hand: number; reserved: number; deleted_at?: string | null };
type Featured = { product_id: string };
type SellMarket = { code: string; name: string; currency: string };
type CountryPriceRow = { product_id: string; country_code: string; price: number | null; sale_price: number | null };

function countryDrafts(markets: SellMarket[], rows: CountryPriceRow[], productId: string) {
  const next: Record<string, { price: string; salePrice: string }> = {};
  for (const market of markets) {
    if (market.code === "US") continue;
    const row = rows.find((item) => item.product_id === productId && item.country_code === market.code);
    next[market.code] = {
      price: row?.price ? String(row.price) : "",
      salePrice: row?.sale_price ? String(row.sale_price) : "",
    };
  }
  return next;
}

const blank = {
  id: "",
  name: "",
  menuLabel: "",
  href: "/shop",
  categoryId: "wearables",
  alsoIn: [] as string[],
  price: "",
  salePrice: "",
  onSale: false,
  published: false,
  topPick: false,
  highlighted: false,
  warrantyEligible: true,
  warrantyYears: "1",
  warrantyDays: "",
  warrantyNote: "1 year from the purchase date. Register within 30 days for 1 extra year.",
  status: "Hidden",
  summary: "",
  sku: "",
  onHand: "100",
  reserved: "0",
  brand: "Joova",
  model: "",
  manufacturer: "",
  manufacturerModel: "",
  manufacturerProductName: "",
  wholesalePrice: "",
  currency: "USD",
  condition: "new",
  availability: "in_stock",
  showAvailable: false,
  preorder: false,
  subscription: false,
  requiresShipping: true,
  freeShipping: true,
  shipsFrom: "US warehouses",
  shipsTo: "US",
  handlingMinDays: "7",
  handlingMaxDays: "10",
  returnDays: "30",
  returnShipping: "US return shipping covered",
  taxable: "",
  taxCode: "",
  gtin: "",
  mpn: "",
  barcode: "",
  ...boxDraft(),
  countryOfOrigin: "",
  material: "",
  seoTitle: "",
  seoDescription: "",
  productType: "",
  tags: "",
  googleCategory: "",
};

const productTabs = [
  { id: "product", label: "Product" },
  { id: "variants", label: "Variants" },
  { id: "price", label: "Price" },
  { id: "stock", label: "Stock" },
  { id: "alerts", label: "Low stock" },
  { id: "shipping", label: "Shipping" },
  { id: "size", label: "Size & Weight" },
  { id: "warranty", label: "Warranty" },
  { id: "media", label: "Media" },
  { id: "search", label: "Search" },
] as const;

type ProductFieldIssue = {
  field: string;
  name: string;
  detail: string;
  tab: (typeof productTabs)[number]["id"];
};

function productIdFromName(name: string, model: string, taken: string[]) {
  const words = (value: string) => value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const base = [...words(name), ...words(model)].join("_").slice(0, 40).replace(/_+$/g, "");
  if (!base) return "";
  const used = new Set(taken);
  let id = base;
  let count = 2;
  while (used.has(id)) {
    const suffix = `_${count}`;
    id = `${base.slice(0, 40 - suffix.length).replace(/_+$/g, "")}${suffix}`;
    count += 1;
  }
  return id;
}

function draftsFor(productId: string, rows: Variant[], pictures: ImageRow[], clips: VideoRow[]): DraftVariant[] {
  const drafts = rows
    .filter((row) => row.product_id === productId && !row.deleted_at)
    .sort((left, right) => left.sort - right.sort)
    .map((row) => {
      const mediaPictures = pictures
        .filter((picture) => picture.variant_id === row.id && !picture.deleted_at)
        .map((picture) => ({
          key: picture.id,
          src: picture.src,
          alt: picture.alt,
          width: picture.width || 1600,
          height: picture.height || 1600,
          savedId: picture.id,
        }));
      const mediaVideos = clips
        .filter((video) => video.variant_id === row.id && !video.deleted_at && video.src)
        .map((video) => ({
          key: video.id,
          src: video.src || "",
          title: video.title,
          savedId: video.id,
        }));
      return {
        id: row.id,
        axis: optionAxis(row.attrs),
        name: optionName(row.attrs),
        available: optionAvailable(row.attrs),
        ownMedia: mediaPictures.length + mediaVideos.length > 0,
        ownSku: Boolean(row.sku),
        sku: row.sku ?? "",
        isDefault: row.is_default === true,
        pictures: mediaPictures,
        videos: mediaVideos,
        source: row.attrs,
      } satisfies DraftVariant;
    });
  if (drafts.length && !drafts.some((draft) => draft.isDefault)) drafts[0].isDefault = true;
  return drafts;
}

function clientProductIssues(form: typeof blank, products: Product[], selected: string): ProductFieldIssue[] {
  const issues: ProductFieldIssue[] = [];
  const required = (field: string, name: string, tab: ProductFieldIssue["tab"], value: string) => {
    if (!value.trim()) issues.push({ field, name, detail: "This field is required.", tab });
  };
  if (!form.name.trim()) issues.push({ field: "name", name: "Name", detail: "This field is required.", tab: "product" });
  if (form.model.trim()) {
    const key = form.model.trim().toLowerCase();
    const modelTaken = products.some((product) => {
      if (product.id === selected || product.id === form.id) return false;
      const existing = typeof product.commerce?.model === "string" ? product.commerce.model.trim().toLowerCase() : "";
      return existing === key;
    });
    if (modelTaken) issues.push({ field: "commerce.model", name: "Model", detail: "Model already exists.", tab: "product" });
  }
  if (!/^[a-z0-9_-]{1,40}$/.test(form.id)) {
    issues.push({ field: "id", name: "Product ID", detail: "Use lowercase letters, numbers, hyphens, and underscores.", tab: "product" });
  } else if (products.some((item) => item.id === form.id && item.id !== selected)) {
    issues.push({ field: "id", name: "Product ID", detail: "That product id is already used.", tab: "product" });
  }
  required("menuLabel", "Menu label", "product", form.menuLabel);
  required("href", "Page path", "product", form.href);
  required("status", "Status label", "product", form.status);
  required("summary", "Summary", "product", form.summary);
  if (!form.price.trim() || Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
    issues.push({ field: "price", name: "Price", detail: "Enter 0 if the price is not set yet, or a selling price.", tab: "price" });
  }
  if (form.wholesalePrice.trim() && (Number.isNaN(Number(form.wholesalePrice)) || Number(form.wholesalePrice) < 0)) {
    issues.push({ field: "commerce.wholesalePrice", name: "Wholesale price", detail: "Enter 0 or a wholesale price, or leave it empty.", tab: "price" });
  }
  if (form.currency.trim().length !== 3) issues.push({ field: "commerce.currency", name: "Currency", detail: "Use a 3-letter currency code, such as USD.", tab: "price" });
  required("sku", "SKU", "stock", form.sku);
  if (form.onHand.trim() === "" || Number.isNaN(Number(form.onHand))) issues.push({ field: "onHand", name: "On hand", detail: "Enter the quantity on hand.", tab: "stock" });
  if (form.reserved.trim() === "" || Number.isNaN(Number(form.reserved))) issues.push({ field: "reserved", name: "Reserved", detail: "Enter the reserved quantity.", tab: "stock" });
  required("commerce.handlingMinDays", "Earliest delivery day", "shipping", form.handlingMinDays);
  required("commerce.handlingMaxDays", "Latest delivery day", "shipping", form.handlingMaxDays);
  required("commerce.returnDays", "Return window", "shipping", form.returnDays);
  return issues;
}

function textList(value: unknown) {
  return Array.isArray(value) ? value.map(String).join(", ") : "";
}

function convertBox<T extends {
  boxSystem: MeasureSystem;
  weightUnit: WeightUnit;
  dimensionUnit: DimensionUnit;
  boxWeight: string;
  boxLength: string;
  boxWidth: string;
  boxHeight: string;
}>(current: T, system: MeasureSystem): T {
  const grams = toGrams(current.boxWeight, current.weightUnit);
  const length = toMillimeters(current.boxLength, current.dimensionUnit);
  const width = toMillimeters(current.boxWidth, current.dimensionUnit);
  const height = toMillimeters(current.boxHeight, current.dimensionUnit);
  const weightUnit = defaultWeightUnit(system);
  const dimensionUnit = defaultDimensionUnit(system);
  return {
    ...current,
    boxSystem: system,
    weightUnit,
    dimensionUnit,
    boxWeight: grams ? fromGrams(grams, weightUnit) : "",
    boxLength: length ? fromMillimeters(length, dimensionUnit) : "",
    boxWidth: width ? fromMillimeters(width, dimensionUnit) : "",
    boxHeight: height ? fromMillimeters(height, dimensionUnit) : "",
  };
}

function convertWeightUnit<T extends { weightUnit: WeightUnit; boxWeight: string }>(current: T, unit: WeightUnit): T {
  const grams = toGrams(current.boxWeight, current.weightUnit);
  return { ...current, weightUnit: unit, boxWeight: grams ? fromGrams(grams, unit) : "" };
}

function commerceText(commerce: Record<string, unknown> | undefined, key: string) {
  const value = commerce?.[key];
  return value === null || value === undefined ? "" : String(value);
}

export function InventoryDesk({ initialProduct = "" }: { initialProduct?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [featured, setFeatured] = useState<Featured[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deals, setDeals] = useState<{ id: string; title: string; deleted_at?: string | null }[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [markets, setMarkets] = useState<SellMarket[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [productShipping, setProductShipping] = useState<{ productId: string; options: { code: ShippingCode; price: number | null }[] }[]>([]);
  const [shippingCustom, setShippingCustom] = useState(false);
  const [shippingCodes, setShippingCodes] = useState<ShippingCode[]>([]);
  const [shippingPrices, setShippingPrices] = useState<Partial<Record<ShippingCode, string>>>({});
  const [countryPriceRows, setCountryPriceRows] = useState<CountryPriceRow[]>([]);
  const [countryPrices, setCountryPrices] = useState<Record<string, { price: string; salePrice: string }>>({});
  const [selected, setSelected] = useState("");
  const [editing, setEditing] = useState(false);
  const [listStart, setListStart] = useState<ProductListTab>("active");
  const [form, setForm] = useState(blank);
  const [drafts, setDrafts] = useState<DraftVariant[]>([]);
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<ProductFieldIssue[]>([]);
  const [saved, setSaved] = useState("");
  const [formTab, setFormTab] = useState<(typeof productTabs)[number]["id"]>("product");
  const [confirmSave, setConfirmSave] = useState(false);
  const allowSave = useRef(false);

  async function load() {
    const response = await fetch("/api/portal/inventory");
    const data = (await response.json()) as {
      products?: Product[];
      variants?: Variant[];
      images?: ImageRow[];
      videos?: VideoRow[];
      stock?: Stock[];
      featured?: Featured[];
      categories?: Category[];
      deals?: { id: string; title: string; deleted_at?: string | null }[];
      pageSize?: number;
      sellCountries?: SellMarket[];
      countryPrices?: CountryPriceRow[];
      shippingOptions?: ShippingOption[];
      productShipping?: { productId: string; options: { code: ShippingCode; price: number | null }[] }[];
      error?: string;
    };
    if (!response.ok) {
      setError(data.error ?? "Inventory could not be loaded.");
      return;
    }
    setProducts(data.products ?? []);
    setVariants(data.variants ?? []);
    setImages(data.images ?? []);
    setVideos(data.videos ?? []);
    setStock(data.stock ?? []);
    setFeatured(data.featured ?? []);
    setCategories(data.categories ?? []);
    setDeals(data.deals ?? []);
    setPageSize(data.pageSize && data.pageSize > 0 ? data.pageSize : 10);
    setMarkets(data.sellCountries ?? []);
    setCountryPriceRows(data.countryPrices ?? []);
    setShippingOptions(data.shippingOptions ?? []);
    setProductShipping(data.productShipping ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  const openedProduct = useRef("");
  useEffect(() => {
    if (!initialProduct || openedProduct.current === initialProduct) return;
    if (!products.some((product) => product.id === initialProduct)) return;
    openedProduct.current = initialProduct;
    choose(initialProduct);
    setFormTab("alerts");
  }, [initialProduct, products]);

  useEffect(() => {
    setCountryPrices((current) => {
      const next = { ...current };
      let changed = false;
      for (const market of markets) {
        if (market.code === "US" || next[market.code]) continue;
        const row = countryPriceRows.find((item) => item.product_id === selected && item.country_code === market.code);
        next[market.code] = {
          price: row?.price ? String(row.price) : "",
          salePrice: row?.sale_price ? String(row.sale_price) : "",
        };
        changed = true;
      }
      return changed ? next : current;
    });
  }, [markets, countryPriceRows, selected]);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(""), 4000);
    return () => window.clearTimeout(timer);
  }, [saved]);

  function choose(id: string) {
    setSelected(id);
    setSaved("");
    setIssues([]);
    setError("");
    setFormTab("product");
    setEditing(true);
    if (!id) {
      setForm(blank);
      setDrafts([]);
      setCountryPrices(countryDrafts(markets, [], ""));
      setShippingCustom(false);
      setShippingCodes([]);
      setShippingPrices({});
      return;
    }
    const product = products.find((item) => item.id === id);
    if (!product) return;
    const units = productUnits(id, stock);
    const commerce = product.commerce ?? {};
    setForm({
      id: product.id,
      name: product.name,
      menuLabel: product.menu_label,
      href: product.href,
      categoryId: product.category_id,
      alsoIn: product.also_in ?? [],
      price: String(product.price),
      salePrice: product.sale_price ? String(product.sale_price) : "",
      onSale: product.on_sale,
      published: product.published,
      topPick: product.top_pick,
      highlighted: featured.some((item) => item.product_id === id),
      warrantyEligible: product.warranty_eligible,
      warrantyYears: product.warranty_years === null ? "" : String(product.warranty_years),
      warrantyDays: product.warranty_days === null ? "" : String(product.warranty_days),
      warrantyNote: commerceText(commerce, "warrantyNote"),
      status: product.published && product.status.trim().toLowerCase() === "hidden" ? "Available" : product.status,
      summary: product.summary,
      sku: product.sku ?? "",
      onHand: String(units?.on_hand ?? 0),
      reserved: String(units?.reserved ?? 0),
      brand: commerceText(commerce, "brand") || "Joova",
      model: commerceText(commerce, "model"),
      manufacturer: commerceText(commerce, "manufacturer") || commerceText(commerce, "vendor"),
      manufacturerModel: commerceText(commerce, "manufacturerModel"),
      manufacturerProductName: commerceText(commerce, "manufacturerProductName"),
      wholesalePrice: commerceText(commerce, "wholesalePrice"),
      currency: commerceText(commerce, "currency") || "USD",
      condition: commerceText(commerce, "condition") || "new",
      availability: units && units.on_hand - units.reserved <= 0 ? "out_of_stock" : commerceText(commerce, "availability") === "out_of_stock" ? "out_of_stock" : "in_stock",
      showAvailable: commerce.showAvailable === true,
      preorder: commerce.preorder === true,
      subscription: commerce.subscription === true,
      requiresShipping: commerce.requiresShipping !== false,
      freeShipping: commerce.freeShipping !== false,
      shipsFrom: commerceText(commerce, "shipsFrom") || "US warehouses",
      shipsTo: textList(commerce.shipsTo) || "US",
      handlingMinDays: commerceText(commerce, "handlingMinDays") || "7",
      handlingMaxDays: commerceText(commerce, "handlingMaxDays") || "10",
      returnDays: commerceText(commerce, "returnDays") || "30",
      returnShipping: commerceText(commerce, "returnShipping") || "US return shipping covered",
      taxable: commerce.taxable === true ? "yes" : commerce.taxable === false ? "no" : "",
      taxCode: commerceText(commerce, "taxCode"),
      gtin: commerceText(commerce, "gtin"),
      mpn: commerceText(commerce, "mpn"),
      barcode: commerceText(commerce, "barcode"),
      ...boxDraft(commerce),
      countryOfOrigin: commerceText(commerce, "countryOfOrigin"),
      material: commerceText(commerce, "material"),
      seoTitle: commerceText(commerce, "seoTitle"),
      seoDescription: commerceText(commerce, "seoDescription"),
      productType: commerceText(commerce, "productType"),
      tags: textList(commerce.tags),
      googleCategory: commerceText(commerce, "googleCategory"),
    });
    setCountryPrices(countryDrafts(markets, countryPriceRows, id));
    setDrafts(draftsFor(id, variants, images, videos));
    const savedShipping = productShipping.find((row) => row.productId === id);
    setShippingCustom(Boolean(savedShipping));
    setShippingCodes(savedShipping?.options.map((option) => option.code) ?? []);
    setShippingPrices(Object.fromEntries(
      (savedShipping?.options ?? [])
        .filter((option) => option.price !== null)
        .map((option) => [option.code, String(option.price)]),
    ));
  }

  function rememberShipping() {
    if (shippingCustom) return;
    setShippingCodes(shippingChoices(shippingOptions, false, []));
    setShippingCustom(true);
  }

  function toggleShipping(code: ShippingCode, marked: boolean) {
    const enabled = shippingOptions.filter((option) => option.enabled).map((option) => option.code);
    const base = shippingCustom ? shippingCodes : enabled;
    const next = new Set(base);
    if (marked) next.add(code);
    else next.delete(code);
    setShippingCustom(true);
    setShippingCodes([...next].filter((item): item is ShippingCode => enabled.includes(item)));
  }

  function setShippingPrice(code: ShippingCode, price: string) {
    rememberShipping();
    setShippingPrices((current) => ({ ...current, [code]: price }));
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key !== "onHand" && key !== "reserved") return next;
      const before = Number(current.onHand) - Number(current.reserved);
      const after = Number(next.onHand) - Number(next.reserved);
      if (Number.isFinite(after) && after <= 0) next.availability = "out_of_stock";
      else if (Number.isFinite(before) && before <= 0 && after > 0) next.availability = "in_stock";
      return next;
    });
  }

  function goToField(issue: ProductFieldIssue) {
    setFormTab(issue.tab);
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-field="${issue.field}"]`)?.focus();
    }, 50);
  }

  async function generateSku() {
    setError("");
    const response = await fetch("/api/portal/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "suggestSku",
        productId: form.id,
        previousId: selected,
        model: form.model,
        productSku: form.sku,
        color: "",
        variant: false,
        ignore: form.sku,
        extra: drafts.filter((draft) => draft.ownSku && draft.sku.trim()).map((draft) => draft.sku.trim()),
      }),
    });
    const data = (await response.json()) as { sku?: string; error?: string };
    if (!response.ok || !data.sku) {
      setError(data.error ?? "A SKU could not be generated.");
      return;
    }
    set("sku", data.sku);
  }

  return (
    <PortalMenu
      groups={[
        { id: "products", label: `Products (${products.length})`, items: [{ id: "products", label: "Products" }] },
        { id: "counters", label: "Counters", items: [{ id: "counters", label: "Counters" }] },
        { id: "categories", label: `Categories (${categories.length})`, items: [{ id: "categories", label: "Categories" }] },
        { id: "deals", label: `Deals (${deals.length})`, items: [{ id: "deals", label: "Deals" }] },
      ]}
    >
      <PortalPanel id="products">
      {saved ? (
        <div className="fixed inset-x-0 top-4 z-[80] flex justify-center px-4">
          <div role="status" className="w-full max-w-lg rounded-3xl border border-stone bg-white p-4 text-ink shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold">{saved}</p>
              <button type="button" className="min-h-11 px-2 text-sm font-bold" onClick={() => setSaved("")}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className={cn("space-y-6", editing && "pb-24")}>
      {editing ? (
        <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>All products</Button>
      ) : (
        <ProductList
          products={products}
          categories={categories}
          stock={stock}
          pageSize={pageSize}
          initialTab={listStart}
          onEdit={(id) => choose(id)}
          onAdd={() => choose("")}
          onDone={() => void load()}
        />
      )}
      {editing ? (
      <>
      <div className="sticky top-0 z-30 flex items-center justify-end rounded-3xl border border-stone bg-white px-4 py-3">
        <Button type="submit" form="product-editor">Save product</Button>
      </div>
      <form
        id="product-editor"
        data-save-feedback="manual"
        className="rounded-3xl bg-white p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!allowSave.current) {
            setConfirmSave(true);
            return;
          }
          allowSave.current = false;
          setConfirmSave(false);
          setError("");
          setIssues([]);
          setSaved("");
          const localIssues = clientProductIssues(form, products, selected);
          if (drafts.some((draft) => draft.ownSku && !draft.sku.trim())) {
            localIssues.push({ field: "variants", name: "SKU", detail: "Enter a SKU for each choice that needs its own, or choose No.", tab: "variants" });
          }
          if (drafts.some((draft) => !draftLabel(draft))) {
            localIssues.push({ field: "variants", name: "Choice", detail: "Add a name for each color, type, size, or custom choice.", tab: "variants" });
          }
          const seen = new Set<string>();
          for (const draft of drafts) {
            const key = `${draft.axis}:${draftLabel(draft).toLowerCase()}`;
            if (!draftLabel(draft) || !seen.has(key)) {
              seen.add(key);
              continue;
            }
            localIssues.push({ field: "variants", name: "Choice", detail: "Each color, type, size, or custom name can only be used once.", tab: "variants" });
            break;
          }
          const badMeasure = (value: string) => value.trim() !== "" && !(Number(value) > 0);
          const boxSides = [form.boxLength, form.boxWidth, form.boxHeight];
          if (badMeasure(form.boxWeight)) {
            localIssues.push({ field: "boxWeight", name: "Box weight", detail: "Enter a weight greater than 0, or leave it empty.", tab: "size" });
          }
          if (boxSides.some((side) => side.trim()) && boxSides.some((side) => !side.trim() || badMeasure(side))) {
            localIssues.push({ field: "boxLength", name: "Box size", detail: "Enter length, width, and height, or leave all three empty.", tab: "size" });
          }
          const chosenShipping = shippingChoices(shippingOptions, shippingCustom, shippingCodes);
          const shippingTypes = chosenShipping.map((code) => {
            const option = shippingOptions.find((item) => item.code === code);
            const raw = shippingPrices[code];
            const price = raw === undefined || raw.trim() === "" ? option?.price ?? 0 : Number(raw);
            return {
              code,
              price: option && price === option.price ? null : price,
              invalid: Number.isNaN(price) || price < 0,
            };
          });
          if (shippingCustom && shippingTypes.some((row) => row.invalid)) {
            localIssues.push({ field: "shippingTypes", name: "Shipping price", detail: "Enter 0 or a shipping price for each selected option.", tab: "shipping" });
          }
          if (localIssues.length) {
            setIssues(localIssues);
            setFormTab(localIssues[0].tab);
            return;
          }
          const response = await fetch("/api/portal/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: form.id,
              previousId: selected,
              name: form.name,
              menuLabel: form.menuLabel,
              href: form.href,
              categoryId: form.categoryId,
              alsoIn: form.alsoIn,
              price: Number(form.price),
              salePrice: form.salePrice ? Number(form.salePrice) : null,
              countryPrices: Object.entries(countryPrices).map(([code, value]) => ({
                code,
                price: value.price.trim() ? Number(value.price) : null,
                salePrice: value.salePrice.trim() ? Number(value.salePrice) : null,
              })),
              onSale: form.onSale,
              published: form.published,
              topPick: form.topPick,
              highlighted: form.highlighted,
              warrantyEligible: form.warrantyEligible,
              warrantyYears: form.warrantyYears ? Number(form.warrantyYears) : null,
              warrantyDays: form.warrantyDays ? Number(form.warrantyDays) : null,
              status: form.status,
              summary: form.summary,
              sku: form.sku,
              onHand: Number(form.onHand),
              reserved: Number(form.reserved),
              variants: drafts.map((draft, index) => ({
                id: draft.id,
                sku: draft.ownSku ? draft.sku.trim() : "",
                sort: index,
                isDefault: draft.isDefault,
                attrs: {
                  ...(draft.source ?? {}),
                  axis: draft.axis,
                  name: draftLabel(draft),
                  available: draft.available,
                },
              })),
              commerce: {
                brand: form.brand,
                vendor: form.manufacturer,
                currency: form.currency,
                condition: form.condition,
                availability: Number(form.onHand) - Number(form.reserved) <= 0 ? "out_of_stock" : form.availability,
                preorder: form.preorder,
                subscription: form.subscription,
                requiresShipping: form.requiresShipping,
                freeShipping: form.freeShipping,
                shipsFrom: form.shipsFrom,
                shipsTo: form.shipsTo.split(",").map((item) => item.trim()).filter(Boolean),
                handlingMinDays: Number(form.handlingMinDays),
                handlingMaxDays: Number(form.handlingMaxDays),
                returnDays: Number(form.returnDays),
                returnShipping: form.returnShipping,
                taxable: form.taxable === "yes" ? true : form.taxable === "no" ? false : null,
                taxCode: form.taxCode,
                gtin: form.gtin,
                mpn: form.mpn,
                barcode: form.barcode,
                weightGrams: toGrams(form.boxWeight, form.weightUnit),
                lengthMm: toMillimeters(form.boxLength, form.dimensionUnit),
                widthMm: toMillimeters(form.boxWidth, form.dimensionUnit),
                heightMm: toMillimeters(form.boxHeight, form.dimensionUnit),
                boxSystem: form.boxSystem,
                weightUnit: form.weightUnit,
                dimensionUnit: form.dimensionUnit,
                countryOfOrigin: form.countryOfOrigin,
                material: form.material,
                model: form.model,
                manufacturer: form.manufacturer,
                manufacturerModel: form.manufacturerModel,
                manufacturerProductName: form.manufacturerProductName,
                wholesalePrice: form.wholesalePrice.trim() ? Number(form.wholesalePrice) : null,
                seoTitle: form.seoTitle,
                seoDescription: form.seoDescription,
                productType: form.productType,
                tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
                warrantyNote: form.warrantyNote,
                googleCategory: form.googleCategory,
                showAvailable: form.showAvailable,
              },
              shippingCustom,
              shippingTypes: shippingTypes.map((row) => ({ code: row.code, price: row.invalid ? 0 : row.price })),
            }),
          });
          const data = (await response.json()) as { error?: string; fields?: ProductFieldIssue[] };
          if (!response.ok) {
            const next = data.fields ?? [];
            setIssues(next);
            if (next[0]) setFormTab(next[0].tab);
            setError(next.length ? "" : data.error ?? "The product could not be saved.");
            return;
          }
          setSelected(form.id);
          const mediaError = await saveVariantMedia(form.id, form.name, drafts);
          await load();
          if (mediaError) {
            setError(mediaError);
            setFormTab("variants");
            return;
          }
          setSaved(selected ? "Successfully saved." : "Successfully saved. This product is hidden. Preview it, then mark it active when it should go on the website.");
          setListStart(
            Number(form.onHand) - Number(form.reserved) <= 0 || form.availability === "out_of_stock"
              ? "out_of_stock"
              : selected
                ? (form.published ? "active" : "inactive")
                : "inactive",
          );
          setEditing(false);
        }}
      >
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Product details">
          {productTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={formTab === tab.id}
              className={cn(
                "min-h-11 rounded-full px-4 text-sm font-bold",
                formTab === tab.id ? "bg-ink text-paper" : "border border-stone text-ink",
              )}
              onClick={() => setFormTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div hidden={formTab !== "product"}>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          Product ID
          <Input
            className="mt-2"
            data-field="id"
            value={form.id}
            maxLength={40}
            onChange={(event) => set("id", event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40))}
            required
          />
          <span className="mt-1 block text-xs text-muted">Unique id. Lowercase letters, numbers, hyphens, and underscores. You can type it or generate it from the name. Stock, orders, and pictures stay with this product.</span>
        </label>
        <div className="text-sm">
          <label>
            Name
            <Input
              className="mt-2"
              data-field="name"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              required
            />
          </label>
          <Button
            className="mt-2"
            type="button"
            size="sm"
            variant="secondary"
            disabled={!form.name.trim()}
            onClick={() => {
              const taken = products.map((item) => item.id).filter((id) => id !== form.id && id !== selected);
              const id = productIdFromName(form.name, form.model, taken);
              if (id) setForm((current) => ({ ...current, id, href: `/${id}` }));
            }}
          >
            Auto generate ID
          </Button>
          <p className="mt-2 text-xs text-muted">Each word of the name, then the model, joined with underscores. The page path is set to the same id.</p>
        </div>
        <label className="text-sm">
          Model
          <Input className="mt-2" data-field="commerce.model" value={form.model} onChange={(event) => set("model", event.target.value)} />
          <span className="mt-1 block text-xs text-muted">Shown on the website. The model name has to be unique.</span>
        </label>
        <label className="text-sm">
          Menu label
          <Input className="mt-2" data-field="menuLabel" value={form.menuLabel} onChange={(event) => set("menuLabel", event.target.value)} required />
        </label>
        <label className="text-sm">
          Page path
          <Input className="mt-2" data-field="href" value={form.href} onChange={(event) => set("href", event.target.value)} required />
        </label>
        <label className="text-sm">
          Category
          <select className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" data-field="categoryId" value={form.categoryId} onChange={(event) => set("categoryId", event.target.value)}>
            {categories.filter((category) => !category.deleted_at).map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}{category.active === false ? " (disabled)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Status label
          <Input className="mt-2" data-field="status" value={form.status} onChange={(event) => set("status", event.target.value)} required />
        </label>
        <label className="text-sm md:col-span-2">
          Summary
          <textarea className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3" data-field="summary" value={form.summary} onChange={(event) => set("summary", event.target.value)} required />
        </label>
        <div className="flex flex-wrap gap-4 text-sm md:col-span-2">
          <label>
            <input type="checkbox" checked={Boolean(selected) && form.published} disabled={!selected} onChange={(event) => set("published", event.target.checked)} /> Active
          </label>
          <label><input type="checkbox" checked={form.highlighted} onChange={(event) => set("highlighted", event.target.checked)} /> Highlighted</label>
          <label><input type="checkbox" checked={form.topPick} onChange={(event) => set("topPick", event.target.checked)} /> Top pick</label>
          {selected ? null : <p className="w-full text-xs text-muted">A new product stays hidden. After you save it, use Preview, then mark it active when it should go on the website.</p>}
        </div>
        <fieldset className="text-sm md:col-span-2">
          <legend className="font-bold">Also listed in</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {categories.filter((category) => !category.deleted_at && category.id !== form.categoryId).map((category) => (
              <label key={category.id}>
                <input
                  type="checkbox"
                  checked={form.alsoIn.includes(category.id)}
                  onChange={(event) => {
                    set(
                      "alsoIn",
                      event.target.checked
                        ? [...form.alsoIn, category.id]
                        : form.alsoIn.filter((id) => id !== category.id),
                    );
                  }}
                /> {category.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="rounded-2xl border border-stone p-4 md:col-span-2">
          <p className="text-sm font-bold">Reference</p>
          <p className="mt-1 text-xs text-muted">For our records. These stay off the website.</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              Manufacturer
              <Input className="mt-2" data-field="commerce.manufacturer" value={form.manufacturer} onChange={(event) => set("manufacturer", event.target.value)} />
            </label>
            <label className="text-sm">
              Manufacturer model
              <Input className="mt-2" data-field="commerce.manufacturerModel" value={form.manufacturerModel} onChange={(event) => set("manufacturerModel", event.target.value)} />
            </label>
            <label className="text-sm md:col-span-2">
              Manufacturer product name
              <Input className="mt-2" data-field="commerce.manufacturerProductName" value={form.manufacturerProductName} onChange={(event) => set("manufacturerProductName", event.target.value)} />
            </label>
          </div>
        </div>
        </div>
        </div>
        <div hidden={formTab !== "variants"}>
          <ProductVariants productName={form.name} productSku={form.sku} productId={form.id} previousId={selected} drafts={drafts} onChange={setDrafts} />
        </div>
        <div hidden={formTab !== "price"}>
        <p className="mt-4 text-sm font-bold">United States (USD)</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Price
            <Input className="mt-2" data-field="price" inputMode="decimal" value={form.price} onChange={(event) => set("price", event.target.value)} required />
            <span className="mt-1 block text-xs text-muted">Shown on the website. Use 0 until the price is set.</span>
          </label>
          <label className="text-sm">
            Wholesale price
            <Input className="mt-2" data-field="commerce.wholesalePrice" inputMode="decimal" value={form.wholesalePrice} onChange={(event) => set("wholesalePrice", event.target.value)} />
            <span className="mt-1 block text-xs text-muted">For our records. Not shown on the website.</span>
          </label>
          <label className="text-sm">
            Sale price
            <Input className="mt-2" data-field="salePrice" inputMode="decimal" value={form.salePrice} onChange={(event) => set("salePrice", event.target.value)} />
          </label>
          <label className="text-sm">Currency<Input className="mt-2" data-field="commerce.currency" value={form.currency} onChange={(event) => set("currency", event.target.value)} maxLength={3} required /></label>
          {markets.filter((market) => market.code !== "US").map((market) => {
            const draft = countryPrices[market.code] ?? { price: "", salePrice: "" };
            return (
              <div key={market.code} className="grid gap-4 md:col-span-2 md:grid-cols-2">
                <label className="text-sm">
                  {market.name} ({market.currency}) price
                  <Input
                    className="mt-2"
                    inputMode="decimal"
                    value={draft.price}
                    onChange={(event) => setCountryPrices((current) => ({ ...current, [market.code]: { ...draft, price: event.target.value } }))}
                  />
                  <span className="mt-1 block text-xs text-muted">Leave empty when this price is not set. Checkout stays in US dollars.</span>
                </label>
                <label className="text-sm">
                  {market.name} ({market.currency}) sale price
                  <Input
                    className="mt-2"
                    inputMode="decimal"
                    value={draft.salePrice}
                    onChange={(event) => setCountryPrices((current) => ({ ...current, [market.code]: { ...draft, salePrice: event.target.value } }))}
                  />
                </label>
              </div>
            );
          })}
          <label className="text-sm">Brand<Input className="mt-2" value={form.brand} onChange={(event) => set("brand", event.target.value)} /></label>
          <label className="text-sm">
            Condition
            <select className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" value={form.condition} onChange={(event) => set("condition", event.target.value)}>
              <option value="new">New</option>
              <option value="refurbished">Refurbished</option>
              <option value="used">Used</option>
            </select>
          </label>
          <label className="text-sm">Product type<Input className="mt-2" value={form.productType} onChange={(event) => set("productType", event.target.value)} /></label>
          <label className="text-sm">
            Taxable
            <select className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" value={form.taxable} onChange={(event) => set("taxable", event.target.value)}>
              <option value="">Not set</option>
              <option value="yes">Taxable</option>
              <option value="no">Not taxable</option>
            </select>
          </label>
          <label className="text-sm">Tax code<Input className="mt-2" value={form.taxCode} onChange={(event) => set("taxCode", event.target.value)} /></label>
          <label className="text-sm md:col-span-2">Tags, separated by commas<Input className="mt-2" value={form.tags} onChange={(event) => set("tags", event.target.value)} /></label>
          <label className="text-sm md:col-span-2">Material<Input className="mt-2" value={form.material} onChange={(event) => set("material", event.target.value)} /></label>
          <div className="flex flex-wrap gap-4 text-sm md:col-span-2">
            <label><input type="checkbox" checked={form.onSale} onChange={(event) => set("onSale", event.target.checked)} /> On sale</label>
            <label><input type="checkbox" checked={form.subscription} onChange={(event) => set("subscription", event.target.checked)} /> Subscription</label>
            <label><input type="checkbox" checked={form.preorder} onChange={(event) => set("preorder", event.target.checked)} /> Preorder</label>
          </div>
        </div>
        </div>
        <div hidden={formTab !== "stock"}>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <p className="text-sm text-muted md:col-span-2">On hand and reserved stay off the website. The available count is shown only when you turn that on.</p>
          <label className="text-sm">
            Stock
            <select className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" data-field="commerce.availability" value={Number(form.onHand) - Number(form.reserved) <= 0 ? "out_of_stock" : form.availability} onChange={(event) => set("availability", event.target.value)}>
              <option value="in_stock" disabled={Number(form.onHand) - Number(form.reserved) <= 0}>In stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
            {Number(form.onHand) - Number(form.reserved) <= 0 ? <p className="mt-2 text-muted">Available is 0, so this product is out of stock.</p> : null}
          </label>
          <label className="flex items-end gap-2 text-sm">
            <input type="checkbox" checked={form.showAvailable} onChange={(event) => set("showAvailable", event.target.checked)} />
            Show how many are available
          </label>
          <div className="text-sm">
            <label>
              SKU
              <Input className="mt-2" data-field="sku" value={form.sku} onChange={(event) => set("sku", event.target.value)} required />
            </label>
            <Button className="mt-2" type="button" size="sm" variant="secondary" onClick={() => void generateSku()}>
              Generate SKU
            </Button>
            <p className="mt-2 text-muted">Starts with SKU, then the model. If that SKU is already used, 1, 2, or 3 is added at the end. A choice can keep this SKU or use its own. You can edit it.</p>
          </div>
          <label className="text-sm">
            On hand
            <Input className="mt-2" data-field="onHand" inputMode="numeric" value={form.onHand} onChange={(event) => set("onHand", event.target.value)} required />
          </label>
          <label className="text-sm">
            Reserved
            <Input className="mt-2" data-field="reserved" inputMode="numeric" value={form.reserved} onChange={(event) => set("reserved", event.target.value)} required />
          </label>
          {stock.find((row) => row.product_id === form.id && !row.variant_id) ? (
            <div className="md:col-span-2">
              <ResourceDelete
                table="inventory"
                id={stock.find((row) => row.product_id === form.id && !row.variant_id)?.id ?? ""}
                removed={Boolean(stock.find((row) => row.product_id === form.id && !row.variant_id)?.deleted_at)}
                onDone={() => void load()}
              />
            </div>
          ) : null}
          <SkuCodes sku={form.sku} />
        </div>
        </div>
        <div hidden={formTab !== "shipping"}>
          <ShippingTypeFields
            options={shippingOptions}
            checked={shippingChoices(shippingOptions, shippingCustom, shippingCodes)}
            prices={shippingPrices}
            onToggle={toggleShipping}
            onPrice={setShippingPrice}
          />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">Ships from<Input className="mt-2" value={form.shipsFrom} onChange={(event) => set("shipsFrom", event.target.value)} /></label>
          <label className="text-sm">Ships to, country codes<Input className="mt-2" value={form.shipsTo} onChange={(event) => set("shipsTo", event.target.value)} /></label>
          <label className="text-sm">Earliest delivery day<Input className="mt-2" data-field="commerce.handlingMinDays" inputMode="numeric" value={form.handlingMinDays} onChange={(event) => set("handlingMinDays", event.target.value)} required /></label>
          <label className="text-sm">Latest delivery day<Input className="mt-2" data-field="commerce.handlingMaxDays" inputMode="numeric" value={form.handlingMaxDays} onChange={(event) => set("handlingMaxDays", event.target.value)} required /></label>
          <label className="text-sm">Return window, days<Input className="mt-2" data-field="commerce.returnDays" inputMode="numeric" value={form.returnDays} onChange={(event) => set("returnDays", event.target.value)} required /></label>
          <label className="text-sm">Return shipping<Input className="mt-2" value={form.returnShipping} onChange={(event) => set("returnShipping", event.target.value)} /></label>
          <label className="text-sm">Country of origin<Input className="mt-2" value={form.countryOfOrigin} onChange={(event) => set("countryOfOrigin", event.target.value)} /></label>
          <div className="flex flex-wrap gap-4 text-sm md:col-span-2">
            <label><input type="checkbox" checked={form.freeShipping} onChange={(event) => set("freeShipping", event.target.checked)} /> Free shipping</label>
            <label><input type="checkbox" checked={form.requiresShipping} onChange={(event) => set("requiresShipping", event.target.checked)} /> Requires shipping</label>
          </div>
        </div>
        </div>
        <div hidden={formTab !== "size"}>
          <SizeWeightFields
            system={form.boxSystem}
            weightUnit={form.weightUnit}
            dimensionUnit={form.dimensionUnit}
            weight={form.boxWeight}
            length={form.boxLength}
            width={form.boxWidth}
            height={form.boxHeight}
            onSystem={(system) => setForm((current) => convertBox(current, system))}
            onWeightUnit={(unit) => setForm((current) => convertWeightUnit(current, unit))}
            onWeight={(value) => set("boxWeight", value)}
            onLength={(value) => set("boxLength", value)}
            onWidth={(value) => set("boxWidth", value)}
            onHeight={(value) => set("boxHeight", value)}
          />
        </div>
        <div hidden={formTab !== "warranty"}>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Warranty years
            <Input className="mt-2" inputMode="numeric" value={form.warrantyYears} onChange={(event) => set("warrantyYears", event.target.value)} />
          </label>
          <label className="text-sm">
            Warranty days
            <Input className="mt-2" inputMode="numeric" value={form.warrantyDays} onChange={(event) => set("warrantyDays", event.target.value)} />
          </label>
          <label className="text-sm md:col-span-2">
            Warranty note
            <Input className="mt-2" value={form.warrantyNote} onChange={(event) => set("warrantyNote", event.target.value)} />
          </label>
          <label className="text-sm"><input type="checkbox" checked={form.warrantyEligible} onChange={(event) => set("warrantyEligible", event.target.checked)} /> Warranty eligible</label>
        </div>
        </div>
        <div hidden={formTab !== "search"}>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <p className="text-sm text-muted md:col-span-2">Leave GTIN and barcode empty until those facts are confirmed.</p>
          <label className="text-sm">GTIN<Input className="mt-2" value={form.gtin} onChange={(event) => set("gtin", event.target.value)} /></label>
          <label className="text-sm">MPN<Input className="mt-2" value={form.mpn} onChange={(event) => set("mpn", event.target.value)} /></label>
          <label className="text-sm">Barcode<Input className="mt-2" value={form.barcode} onChange={(event) => set("barcode", event.target.value)} /></label>
          <label className="text-sm">Google category<Input className="mt-2" value={form.googleCategory} onChange={(event) => set("googleCategory", event.target.value)} /></label>
          <label className="text-sm">Search title<Input className="mt-2" value={form.seoTitle} onChange={(event) => set("seoTitle", event.target.value)} /></label>
          <label className="text-sm md:col-span-2">Search description<textarea className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3" value={form.seoDescription} onChange={(event) => set("seoDescription", event.target.value)} /></label>
        </div>
        </div>
        {issues.length ? (
          <ul className="mt-4 space-y-2" role="alert">
            {issues.map((issue) => (
              <li key={`${issue.field}-${issue.detail}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-band-red">
                <span><span className="font-bold">{issue.name}.</span> {issue.detail}</span>
                <button type="button" className="font-bold underline underline-offset-4" onClick={() => goToField(issue)}>
                  Go to field
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {error ? <p className="mt-4 text-sm text-band-red" role="alert">{error}</p> : null}
      </form>
      {formTab === "alerts" ? (
        <LowStockSetup productId={form.id} saved={products.some((product) => product.id === form.id)} />
      ) : null}
      {formTab === "media" ? (
        <div className="rounded-3xl bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">
            {products.some((product) => product.id === form.id) ? (
              <ProductMedia
                productId={form.id}
                productName={form.name}
                images={images.filter((image) => image.product_id === form.id && !image.variant_id)}
                videos={videos.filter((video) => video.product_id === form.id && !video.variant_id)}
                onDone={() => void load()}
              />
            ) : (
              <p className="text-sm text-muted md:col-span-2">Save the product, then add pictures and videos.</p>
            )}
          </div>
        </div>
      ) : null}
      {selected ? (
        <ResourceDelete
          table="products"
          id={selected}
          removed={Boolean(products.find((product) => product.id === selected)?.deleted_at)}
          onDone={() => void load()}
        />
      ) : null}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl justify-end">
          <Button type="submit" form="product-editor">Save product</Button>
        </div>
      </div>
      {confirmSave ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--fixed-ink)]/45 p-4 sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="save-product-title" className="w-full max-w-md rounded-3xl bg-white p-6 text-ink shadow-lg">
            <h2 id="save-product-title" className="font-display text-2xl">Save this product?</h2>
            <p className="mt-2 text-sm text-muted">Confirm to save these product details.</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setConfirmSave(false)}>Go back</Button>
              <Button
                type="button"
                onClick={() => {
                  const editor = document.getElementById("product-editor");
                  if (!(editor instanceof HTMLFormElement)) return;
                  if (!editor.reportValidity()) return;
                  allowSave.current = true;
                  setConfirmSave(false);
                  editor.requestSubmit();
                }}
              >
                Save product
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      </>
      ) : null}
      </div>
      </PortalPanel>
      <PortalPanel id="counters">
        <StockCounters />
      </PortalPanel>
      <PortalPanel id="categories">
      <CategoryEditor categories={categories} onDone={() => void load()} />
      </PortalPanel>
      <PortalPanel id="deals">
      <section className="rounded-3xl bg-white p-4">
        <h2 className="font-display text-2xl">Deals</h2>
        <ul className="mt-4 space-y-3">
          {deals.map((deal) => (
            <li key={deal.id}>
              <p className="text-sm font-bold">{deal.title}{deal.deleted_at ? " · removed" : ""}</p>
              <ResourceDelete table="deals" id={deal.id} removed={Boolean(deal.deleted_at)} onDone={() => void load()} />
            </li>
          ))}
        </ul>
      </section>
      </PortalPanel>
    </PortalMenu>
  );
}

type SortKey = "name" | "sku" | "category" | "price" | "status" | "displayed";
type ProductListTab = "active" | "inactive" | "out_of_stock" | "removed";

const productListTabs = [
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "out_of_stock", label: "Out of stock" },
  { id: "removed", label: "Removed" },
] as const;

const listCopy: Record<ProductListTab, { detail: string; empty: string }> = {
  active: { detail: "These products are on the website.", empty: "No active products match this search." },
  inactive: { detail: "These products stay in inventory and stay off the shop.", empty: "No inactive products match this search." },
  out_of_stock: { detail: "These products have no units available for a new order.", empty: "No out of stock products match this search." },
  removed: { detail: "Restore a product to put it back on the website, or delete it permanently.", empty: "No removed products match this search." },
};

function ProductList({
  products,
  categories,
  stock,
  pageSize,
  initialTab,
  onEdit,
  onAdd,
  onDone,
}: {
  products: Product[];
  categories: Category[];
  stock: Stock[];
  pageSize: number;
  initialTab: ProductListTab;
  onEdit: (id: string) => void;
  onAdd: () => void;
  onDone: () => void;
}) {
  const [listTab, setListTab] = useState<ProductListTab>(initialTab);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState("");
  const [preview, setPreview] = useState<Product | null>(null);
  const [hiding, setHiding] = useState("");
  const [hideError, setHideError] = useState("");
  const [pendingVisibility, setPendingVisibility] = useState<{ id: string; action: "hide" | "activate" } | null>(null);
  const [recovering, setRecovering] = useState("");
  const [restoreReason, setRestoreReason] = useState("");
  const [recoverError, setRecoverError] = useState("");
  const [activating, setActivating] = useState("");
  const [activateError, setActivateError] = useState("");

  const categoryName = (id: string) => categories.find((item) => item.id === id)?.label ?? id;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = products.filter((product) => {
      const removed = Boolean(product.deleted_at);
      if (listTab === "removed") return removed;
      if (removed) return false;
      const soldOut = isOutOfStock(product, stock);
      if (listTab === "out_of_stock") return soldOut;
      if (soldOut) return false;
      if (listTab === "active" && !product.published) return false;
      if (listTab === "inactive" && product.published) return false;
      if (categoryId && product.category_id !== categoryId) return false;
      if (!needle) return true;
      const haystack = [product.name, product.sku, product.status, product.summary, categoryName(product.category_id)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
    const sorted = [...matched].sort((left, right) => {
      const value = (product: Product) => {
        if (sortKey === "price") return Number(product.price);
        if (sortKey === "sku") return product.sku ?? "";
        if (sortKey === "category") return categoryName(product.category_id);
        if (sortKey === "status") return listStatus(product, stock);
        if (sortKey === "displayed") return displayedOnSite(product) ? "Yes" : "No";
        return product.name;
      };
      const a = value(left);
      const b = value(right);
      const order = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
      return sortDir === "asc" ? order : -order;
    });
    return sorted;
  }, [products, categories, stock, query, categoryId, sortKey, sortDir, listTab]);

  const size = pageSize > 0 ? pageSize : 10;
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * size, current * size);

  function chooseList(next: ProductListTab) {
    setListTab(next);
    setPage(1);
    setDeleting("");
    setPreview(null);
    setHiding("");
    setHideError("");
    setPendingVisibility(null);
    setRecovering("");
    setRestoreReason("");
    setRecoverError("");
    setActivating("");
    setActivateError("");
  }

  async function recover(id: string) {
    const reason = restoreReason.trim();
    if (reason.length < 3) {
      setRecoverError("Add a reason for this restore.");
      return;
    }
    setRecoverError("");
    const response = await fetch("/api/portal/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "recover", id, reason }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setRecoverError(data.error ?? "The product could not be restored.");
      return;
    }
    setRecovering("");
    setRestoreReason("");
    onDone();
  }

  async function activate(id: string) {
    setActivateError("");
    setActivating(id);
    const response = await fetch("/api/portal/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "activate", id }),
    });
    const data = (await response.json()) as { error?: string };
    setActivating("");
    if (!response.ok) {
      setActivateError(data.error ?? "The product could not be activated.");
      return;
    }
    setPendingVisibility(null);
    onDone();
  }

  async function hide(id: string) {
    setHideError("");
    setHiding(id);
    const response = await fetch("/api/portal/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "hide", id }),
    });
    const data = (await response.json()) as { error?: string };
    setHiding("");
    if (!response.ok) {
      setHideError(data.error ?? "The product could not be hidden.");
      return;
    }
    setPendingVisibility(null);
    onDone();
  }

  function sortBy(key: SortKey) {
    setPage(1);
    if (sortKey === key) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl">Products</h2>
        <Button type="button" size="sm" onClick={onAdd}>Add new product</Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Product lists">
        {productListTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={listTab === tab.id}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-bold",
              listTab === tab.id ? "bg-ink text-paper" : "border border-stone text-ink",
            )}
            onClick={() => chooseList(tab.id)}
          >
            {tab.label} ({products.filter((product) => inProductList(product, stock, tab.id)).length})
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">{listCopy[listTab].detail}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_16rem]">
        <label className="text-sm">
          Search
          <Input
            className="mt-2"
            value={query}
            placeholder="Name, SKU, or status"
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="text-sm">
          Category
          <select
            className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4"
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {categories.filter((category) => !category.deleted_at).map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 overflow-x-auto rounded-3xl bg-white">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead>
            <tr className="border-b border-stone">
              {([
                ["name", "Name"],
                ["sku", "SKU"],
                ["category", "Category"],
                ["price", "Price"],
                ["status", "Status"],
                ["displayed", "Displayed in Website"],
              ] as const).map(([key, label]) => (
                <th key={key} className="px-4 py-3" aria-sort={sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" className="font-bold" onClick={() => sortBy(key)}>
                    {label}{sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((product) => (
              <tr key={product.id} className="border-b border-stone align-top">
                <td className="px-4 py-3 font-bold">
                  <button
                    type="button"
                    className="text-left font-bold underline-offset-2 hover:underline"
                    onClick={() => onEdit(product.id)}
                  >
                    {product.name}
                  </button>
                </td>
                <td className="px-4 py-3">{product.sku ?? ""}</td>
                <td className="px-4 py-3">{categoryName(product.category_id)}</td>
                <td className="px-4 py-3">${Number(product.price).toFixed(2)}</td>
                <td className="px-4 py-3">{listStatus(product, stock)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{displayedOnSite(product) ? "Yes" : "No"}</span>
                    {listTab === "removed" ? null : displayedOnSite(product) ? (
                      <Button type="button" size="sm" variant="secondary" onClick={() => { setPendingVisibility({ id: product.id, action: "hide" }); setHideError(""); }}>
                        Hide
                      </Button>
                    ) : (
                      <Button type="button" size="sm" variant="secondary" onClick={() => { setPendingVisibility({ id: product.id, action: "activate" }); setActivateError(""); }}>
                        Display
                      </Button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {listTab === "removed" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => setPreview(product)}>Preview</Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => { setRecovering(product.id); setDeleting(""); setRestoreReason(""); setRecoverError(""); }}>Restore</Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => { setDeleting(deleting === product.id ? "" : product.id); setRecovering(""); }}>Hard delete</Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => setPreview(product)}>Preview</Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => onEdit(product.id)}>Edit</Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => setDeleting(deleting === product.id ? "" : product.id)}>Delete</Button>
                    </div>
                  )}
                  {deleting === product.id ? (
                    <ResourceDelete table="products" id={product.id} removed={listTab === "removed"} onDone={onDone} />
                  ) : null}
                </td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={7}>
                  {listCopy[listTab].empty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {preview ? <ProductPreview product={preview} onClose={() => setPreview(null)} /> : null}
      {recovering ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[var(--fixed-ink)]/45 p-4 sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="restore-product-title" className="w-full max-w-md rounded-3xl bg-white p-6 text-ink shadow-lg">
            <h2 id="restore-product-title" className="font-display text-2xl">Restore this product?</h2>
            <p className="mt-2 text-sm text-muted">
              {products.find((item) => item.id === recovering)?.name} goes back on the website. Add a reason for the audit log.
            </p>
            <label className="mt-4 block text-sm">
              Reason
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3"
                value={restoreReason}
                maxLength={500}
                onChange={(event) => setRestoreReason(event.target.value)}
              />
            </label>
            {recoverError ? <p className="mt-2 text-sm text-band-red" role="alert">{recoverError}</p> : null}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => { setRecovering(""); setRestoreReason(""); setRecoverError(""); }}>Go back</Button>
              <Button type="button" onClick={() => void recover(recovering)}>Restore</Button>
            </div>
          </div>
        </div>
      ) : null}
      {pendingVisibility ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[var(--fixed-ink)]/45 p-4 sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="visibility-product-title" className="w-full max-w-md rounded-3xl bg-white p-6 text-ink shadow-lg">
            <h2 id="visibility-product-title" className="font-display text-2xl">
              {pendingVisibility.action === "hide" ? "Hide this product?" : "Display this product?"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {products.find((item) => item.id === pendingVisibility.id)?.name}{" "}
              {pendingVisibility.action === "hide"
                ? "comes off the website. You can display it again from this list."
                : "goes on the website."}
            </p>
            {pendingVisibility.action === "hide" && hideError ? <p className="mt-2 text-sm text-band-red" role="alert">{hideError}</p> : null}
            {pendingVisibility.action === "activate" && activateError ? <p className="mt-2 text-sm text-band-red" role="alert">{activateError}</p> : null}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => { setPendingVisibility(null); setHideError(""); setActivateError(""); }}>Go back</Button>
              <Button
                type="button"
                disabled={hiding === pendingVisibility.id || activating === pendingVisibility.id}
                onClick={() => void (pendingVisibility.action === "hide" ? hide(pendingVisibility.id) : activate(pendingVisibility.id))}
              >
                {hiding === pendingVisibility.id ? "Hiding" : activating === pendingVisibility.id ? "Displaying" : pendingVisibility.action === "hide" ? "Hide" : "Display"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted">{rows.length} products · {size} per page</p>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={current <= 1} onClick={() => setPage(current - 1)}>Previous</Button>
          <span>Page {current} of {pages}</span>
          <Button type="button" size="sm" variant="secondary" disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</Button>
        </div>
      </div>
    </section>
  );
}

function ProductPreview({ product, onClose }: { product: Product; onClose: () => void }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeRef.current();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--fixed-ink)]/45 p-3 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-preview-title"
        className="flex h-[calc(100vh-1.5rem)] w-full max-w-[1440px] flex-col overflow-hidden rounded-3xl bg-paper shadow-lg sm:h-[calc(100vh-3rem)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-stone bg-white px-4 py-3">
          <h2 id="product-preview-title" className="font-display text-xl">Preview · {product.name}</h2>
          <Button type="button" size="sm" variant="secondary" onClick={onClose}>Close</Button>
        </div>
        <iframe
          title={`${product.name} product page`}
          src={`/preview/${encodeURIComponent(product.id)}`}
          className="min-h-0 w-full flex-1 bg-paper"
        />
      </div>
    </div>
  );
}

function displayedOnSite(product: Product) {
  return Boolean(product.published) && !product.deleted_at;
}

function listStatus(product: Product, stock: Stock[]) {
  if (product.deleted_at) return "Removed";
  if (isOutOfStock(product, stock)) return "Out of stock";
  if (!product.published) return "Inactive";
  if (product.status.trim().toLowerCase() === "hidden") return "Available";
  return product.status;
}

function productUnits(productId: string, stock: Stock[]) {
  return stock.find((item) => item.product_id === productId && !item.variant_id && !item.deleted_at && (item.warehouse ?? "US") === "US");
}

function inProductList(product: Product, stock: Stock[], tab: ProductListTab) {
  const removed = Boolean(product.deleted_at);
  if (tab === "removed") return removed;
  if (removed) return false;
  const soldOut = isOutOfStock(product, stock);
  if (tab === "out_of_stock") return soldOut;
  if (soldOut) return false;
  if (tab === "active") return Boolean(product.published);
  return !product.published;
}

function isOutOfStock(product: Product, stock: Stock[]) {
  const units = productUnits(product.id, stock);
  const available = units ? Math.max(0, units.on_hand - units.reserved) : 0;
  return available <= 0 || product.commerce?.availability === "out_of_stock";
}

function categorySlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

function CategoryEditor({ categories, onDone }: { categories: Category[]; onDone: () => void }) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [id, setId] = useState("");
  const [href, setHref] = useState("");
  const [summary, setSummary] = useState("");
  const [idEdited, setIdEdited] = useState(false);
  const [hrefEdited, setHrefEdited] = useState(false);
  const [error, setError] = useState("");

  async function save(body: Record<string, unknown>, form?: HTMLFormElement) {
    const response = await fetch("/api/portal/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { error?: string };
    setError(response.ok ? "" : data.error ?? "The category could not be saved.");
    if (response.ok) {
      form?.reset();
      onDone();
    }
    return response.ok;
  }

  function fillLabel(value: string) {
    setLabel(value);
    const slug = categorySlug(value);
    if (!idEdited) setId(slug);
    if (!hrefEdited) setHref(slug ? `/shop#${slug}` : "");
  }

  return (
    <section className="rounded-3xl bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl">Categories</h2>
        <Button type="button" size="sm" onClick={() => setAdding((open) => !open)}>Add new category</Button>
      </div>
      {error ? <p className="mt-2 text-sm text-band-red" role="alert">{error}</p> : null}
      {adding ? (
        <form
          className="mt-4 grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const slug = categorySlug(id || label);
            void save({
              kind: "category",
              id: slug,
              label: label.trim(),
              href: href.trim() || `/shop#${slug}`,
              summary: summary.trim() || label.trim(),
              active: true,
            }).then((saved) => {
              if (!saved) return;
              setAdding(false);
              setLabel("");
              setId("");
              setHref("");
              setSummary("");
              setIdEdited(false);
              setHrefEdited(false);
            });
          }}
        >
          <label className="text-sm">Name<Input className="mt-2" value={label} onChange={(event) => fillLabel(event.target.value)} required /></label>
          <label className="text-sm">Id<Input className="mt-2" value={id} pattern="[a-z0-9-]+" onChange={(event) => { setIdEdited(true); setId(categorySlug(event.target.value)); }} required /></label>
          <label className="text-sm">Shop path<Input className="mt-2" value={href} onChange={(event) => { setHrefEdited(true); setHref(event.target.value); }} required /></label>
          <label className="text-sm md:col-span-2">Summary<Input className="mt-2" value={summary} onChange={(event) => setSummary(event.target.value)} /></label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm">Add category</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted">Add a category, then assign products to it from the product form.</p>
      )}
      <ul className="mt-6 space-y-4">
        {categories.map((category) => (
          <li key={category.id} className="rounded-2xl border border-stone p-3">
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                void save({
                  kind: "category",
                  id: category.id,
                  label: String(data.get("label") ?? ""),
                  href: String(data.get("href") ?? ""),
                  summary: String(data.get("summary") ?? ""),
                  active: data.get("active") === "on",
                });
              }}
            >
              <p className="text-sm font-bold md:col-span-2">
                {category.id}{category.deleted_at ? " · removed" : category.active === false ? " · disabled" : ""}
              </p>
              <label className="text-sm">Label<Input className="mt-2" name="label" defaultValue={category.label} required /></label>
              <label className="text-sm">Path<Input className="mt-2" name="href" defaultValue={category.href} required /></label>
              <label className="text-sm md:col-span-2">Summary<Input className="mt-2" name="summary" defaultValue={category.summary} required /></label>
              <label className="text-sm"><input type="checkbox" name="active" defaultChecked={category.active !== false} /> Enabled</label>
              <Button type="submit" size="sm">Save {category.id}</Button>
            </form>
            <ResourceDelete table="categories" id={category.id} removed={Boolean(category.deleted_at)} onDone={onDone} />
          </li>
        ))}
      </ul>
    </section>
  );
}
