import type { CatalogCategoryId, CatalogProduct } from "@/content/catalog";

export function productsInCategory(catalog: readonly CatalogProduct[], category: CatalogCategoryId) {
  return catalog.filter((product) => product.category === category || product.alsoIn?.includes(category));
}

export function categoryMenu(catalog: readonly CatalogProduct[], category: CatalogCategoryId) {
  return productsInCategory(catalog, category).map((product) => ({
    href: product.href,
    label: product.menuLabel,
  }));
}

export function includedExtra<T extends { id: string }>(variants: readonly T[], worn: T) {
  const extraId = worn.id === "black" ? "blue" : "black";
  return variants.find((variant) => variant.id === extraId) ?? variants[0];
}

export function matchCatalogProductId(cartId: string, productIds: readonly string[]) {
  return [...productIds]
    .sort((left, right) => right.length - left.length)
    .find((id) => cartId === id || cartId.startsWith(`${id}-`));
}

export function productIdFromCart(item: { id: string; name: string }) {
  if (item.id.startsWith("strap-") || item.name === "Woven strap") return "straps";
  if (item.id.startsWith("ring-") || item.name === "Joova Ring") return "ring";
  if (item.id.startsWith("watch-") || item.name === "Joova Watch") return "watch";
  if (item.name === "Joova Band" || item.id.includes("+")) return "band";
  if (item.id === "share" || item.name === "Joova Share Pod") return "share";
  if (item.id === "glasses" || item.name === "Joova Glasses") return "glasses";
  if (item.id === "buds" || item.name === "Joova Buds") return "buds";
  return item.id.split("-")[0] || item.id;
}
