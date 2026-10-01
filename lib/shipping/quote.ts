import type { SupabaseClient } from "@supabase/supabase-js";
import { isShippingCode, shippingCodes, type ShippingCode, type ShippingOption } from "@/lib/shipping/options";

export type CartShippingOption = {
  code: ShippingCode;
  name: string;
  price: number;
  minDays: number;
  maxDays: number;
};

type ProductRow = { id: string; commerce: { requiresShipping?: boolean } | null };
type CustomRow = { product_id: string };
type PriceRow = { product_id: string; option_code: string; price: number | string | null };

function money(value: number) {
  return Math.round(value * 100) / 100;
}

export async function quoteCartShipping(supabase: SupabaseClient, productIds: string[]) {
  const ids = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))];
  if (!ids.length) return { error: "The cart is empty." as const };
  const [options, products, custom, prices] = await Promise.all([
    supabase.from("shipping_options").select("code, name, price, min_days, max_days, enabled, sort").eq("enabled", true).order("sort"),
    supabase.from("products").select("id, commerce").in("id", ids).is("deleted_at", null),
    supabase.from("product_shipping").select("product_id").in("product_id", ids),
    supabase.from("product_shipping_options").select("product_id, option_code, price").in("product_id", ids),
  ]);
  if (options.error || products.error || custom.error || prices.error) {
    return { error: "Shipping options could not be loaded." as const };
  }
  const enabled = (options.data ?? []).flatMap((row) => {
    if (!isShippingCode(row.code) || row.enabled === false) return [];
    const option: ShippingOption = {
      code: row.code,
      name: row.name,
      price: Number(row.price),
      minDays: row.min_days,
      maxDays: row.max_days,
      enabled: true,
    };
    return [option];
  });
  const found = new Map((products.data as ProductRow[] | null ?? []).map((row) => [row.id, row]));
  if (ids.some((id) => !found.has(id))) return { error: "A cart item is no longer available." as const };
  const shippable = ids.filter((id) => found.get(id)?.commerce?.requiresShipping !== false);
  if (!shippable.length) {
    const free = enabled.find((option) => option.code === "free");
    return {
      options: [{
        code: "free" as const,
        name: free?.name ?? "Free Shipping",
        price: 0,
        minDays: free?.minDays ?? 0,
        maxDays: free?.maxDays ?? 0,
      }],
    };
  }
  const customIds = new Set((custom.data as CustomRow[] | null ?? []).map((row) => row.product_id));
  const overrides = prices.data as PriceRow[] | null ?? [];
  const choices = shippable.map((id) => {
    if (!customIds.has(id)) {
      return new Map(enabled.map((option) => [option.code, option.price]));
    }
    const rows = overrides.filter((row) => row.product_id === id && isShippingCode(row.option_code));
    return new Map(rows.flatMap((row) => {
      const option = enabled.find((item) => item.code === row.option_code);
      if (!option) return [];
      const price = row.price === null || row.price === undefined ? option.price : Number(row.price);
      return [[option.code, price] as const];
    }));
  });
  const shared = shippingCodes.filter((code) => choices.every((choice) => choice.has(code)));
  if (!shared.length) return { error: "These items do not share a shipping option. Order them separately." as const };
  const quoted: CartShippingOption[] = enabled.flatMap((option) => {
    if (!shared.includes(option.code)) return [];
    const price = Math.max(...choices.map((choice) => choice.get(option.code) ?? 0));
    return [{ code: option.code, name: option.name, price: money(price), minDays: option.minDays, maxDays: option.maxDays }];
  });
  return { options: quoted };
}
