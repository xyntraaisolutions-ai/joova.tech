import type { SupabaseClient } from "@supabase/supabase-js";
import { percentFromRate, taxAmount, taxPercentLabel } from "@/lib/tax/avalara";

type ProductRow = {
  id: string;
  price: number | string;
  sale_price: number | string | null;
  on_sale: boolean | null;
  commerce: { taxable?: boolean } | null;
};

export type TaxQuote = {
  subtotal: number;
  taxable: number;
  rate: number;
  percent: number;
  label: string;
  state: string;
  regionName: string;
  parts: string;
  fallback: boolean;
  tax: number;
  total: number;
};

function unitCents(price: number | string) {
  return Math.round(Number(price) * 100);
}

function partLabel(name: string, value: number | string | null | undefined) {
  const rate = Number(value ?? 0);
  if (!Number.isFinite(rate) || rate <= 0) return "";
  return `${name} ${taxPercentLabel(percentFromRate(rate))}`;
}

async function defaultUnitedStatesPercent(supabase: SupabaseClient) {
  const saved = await supabase.from("country_tax_rates").select("rate_percent").eq("country_code", "US").maybeSingle();
  const percent = Number(saved.data?.rate_percent);
  if (Number.isFinite(percent) && percent >= 0 && percent <= 100) return percent;
  return 8.25;
}

function sellingPrice(product: ProductRow) {
  const sale = Number(product.sale_price ?? 0);
  if (product.on_sale && sale > 0) return sale;
  return Number(product.price);
}

export async function quoteSalesTax(
  supabase: SupabaseClient,
  input: { region: string; postal: string; items: { productId: string; quantity: number }[] },
): Promise<{ ok: true; quote: TaxQuote } | { ok: false; error: string; state?: string }> {
  const region = input.region.trim().toUpperCase();
  const postal = input.postal.trim().slice(0, 5);
  if (!/^[A-Z]{2}$/.test(region) || !/^[0-9]{5}$/.test(postal)) {
    return { ok: false, error: "Enter a state and a 5-digit ZIP code to calculate sales tax." };
  }
  if (input.items.length === 0) return { ok: false, error: "The cart is empty." };

  const ids = [...new Set(input.items.map((item) => item.productId))];
  const products = await supabase.from("products").select("id, price, sale_price, on_sale, commerce").in("id", ids).eq("published", true).is("deleted_at", null);
  if (products.error) return { ok: false, error: "Sales tax could not be calculated." };
  const byId = new Map((products.data as ProductRow[] | null ?? []).map((product) => [product.id, product]));

  let merchandiseCents = 0;
  let taxableCents = 0;
  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product || item.quantity < 1) return { ok: false, error: "Sales tax could not be calculated." };
    const line = unitCents(sellingPrice(product)) * item.quantity;
    merchandiseCents += line;
    if (product.commerce?.taxable !== false) taxableCents += line;
  }

  const found = await supabase
    .from("us_zip_tax_rates")
    .select("state, region_name, combined_rate, state_rate, county_rate, city_rate, special_rate")
    .eq("zip", postal)
    .maybeSingle();
  if (found.error) return { ok: false, error: "Sales tax could not be calculated." };
  if (!found.data) {
    const percent = await defaultUnitedStatesPercent(supabase);
    const rate = percent / 100;
    const tax = taxAmount(taxableCents, rate);
    return {
      ok: true,
      quote: {
        subtotal: merchandiseCents / 100,
        taxable: taxableCents / 100,
        rate,
        percent,
        label: taxPercentLabel(percent),
        state: region,
        regionName: "Default United States rate",
        parts: "",
        fallback: true,
        tax,
        total: Math.round((merchandiseCents + Math.round(taxableCents * rate))) / 100,
      },
    };
  }
  if (found.data.state !== region) {
    return { ok: false, error: "That ZIP code does not match the selected state.", state: found.data.state };
  }
  const rate = Number(found.data.combined_rate);
  const percent = percentFromRate(rate);
  const tax = taxAmount(taxableCents, rate);
  const subtotal = merchandiseCents / 100;
  const parts = [
    partLabel("State", found.data.state_rate),
    partLabel("County", found.data.county_rate),
    partLabel("City", found.data.city_rate),
    partLabel("Special", found.data.special_rate),
  ].filter(Boolean).join(" · ");
  return {
    ok: true,
    quote: {
      subtotal,
      taxable: taxableCents / 100,
      rate,
      percent,
      label: taxPercentLabel(percent),
      state: found.data.state,
      regionName: found.data.region_name || region,
      parts,
      fallback: false,
      tax,
      total: Math.round((merchandiseCents + Math.round(taxableCents * rate))) / 100,
    },
  };
}
