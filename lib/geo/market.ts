import { cookies, headers } from "next/headers";
import { unitedStates, type CountryOption } from "@/lib/geo/countries";
import { formatMoney } from "@/lib/utils";

export const MARKET_COOKIE = "joova-country";

export type Market = {
  code: string;
  name: string;
  currency: string;
};

export const defaultMarket: Market = unitedStates;

export function asMarket(country: CountryOption): Market {
  return { code: country.code, name: country.name, currency: country.currency };
}

export async function resolveMarket(enabled: Market[]) {
  const list = enabled.some((country) => country.code === "US") ? enabled : [defaultMarket, ...enabled];
  const byCode = new Map(list.map((country) => [country.code, country]));
  const fallback = byCode.get("US") ?? defaultMarket;
  const jar = await cookies();
  const chosen = jar.get(MARKET_COOKIE)?.value?.trim().toUpperCase() ?? "";
  if (byCode.has(chosen)) return byCode.get(chosen) ?? fallback;
  const headerStore = await headers();
  const detected = (headerStore.get("cf-ipcountry") || headerStore.get("x-vercel-ip-country") || "").trim().toUpperCase();
  if (detected && detected !== "XX" && byCode.has(detected)) return byCode.get(detected) ?? fallback;
  return fallback;
}

export function applyCountryPrice<T extends { price: number; priceLabel: string; compareAt?: number; compareAtLabel?: string; unpriced?: boolean }>(
  product: T,
  market: Market,
  row?: { price?: number | string | null; sale_price?: number | string | null } | null,
): T {
  if (market.code === "US") return product;
  const listPrice = Number(row?.price ?? 0);
  if (!row || !Number.isFinite(listPrice) || listPrice <= 0) {
    return { ...product, priceLabel: "Price not set", compareAt: undefined, compareAtLabel: undefined, unpriced: true };
  }
  const salePrice = Number(row.sale_price ?? 0);
  const onSale = salePrice > 0 && salePrice < listPrice;
  return {
    ...product,
    priceLabel: formatMoney(onSale ? salePrice : listPrice, market.currency),
    compareAt: undefined,
    compareAtLabel: onSale ? formatMoney(listPrice, market.currency) : undefined,
    unpriced: false,
  };
}
