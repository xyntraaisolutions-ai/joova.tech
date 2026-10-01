"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/shop/product-card";
import type { CatalogCategoryId, CatalogProduct } from "@/content/catalog";
import { productsInCategory } from "@/lib/content/helpers";

type Category = {
  id: CatalogCategoryId;
  label: string;
  summary: string;
};

export function ShopCatalog({
  catalog,
  categories,
  query,
}: {
  catalog: CatalogProduct[];
  categories: readonly Category[];
  query: string;
}) {
  const [text, setText] = useState(query);
  const [category, setCategory] = useState<CatalogCategoryId | "all">("all");
  const [sort, setSort] = useState<"featured" | "name" | "price-asc" | "price-desc">("featured");
  useEffect(() => {
    setText(query);
  }, [query]);
  const stocked = categories.filter((item) =>
    catalog.some((product) => product.category === item.id || product.alsoIn?.includes(item.id)),
  );
  const needle = text.trim().toLowerCase();
  const visible = useMemo(() => {
    const matched = catalog.filter((product) => {
      if (category !== "all" && product.category !== category && !product.alsoIn?.includes(category)) return false;
      if (!needle) return true;
      const haystack = [
        product.name,
        product.menuLabel,
        product.model,
        product.sku,
        product.summary,
        product.status,
        ...(product.variants ?? []).flatMap((option) => [option.name, option.color, option.type, option.size, option.custom, option.sku]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
    const ordered = [...matched];
    if (sort === "name") ordered.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price-asc") ordered.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") ordered.sort((a, b) => b.price - a.price);
    return ordered;
  }, [catalog, category, needle, sort]);

  return (
    <div>
      <form className="mt-8" role="search" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="shop-search" className="text-sm font-medium">Search products</label>
        <input
          id="shop-search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Name, model, or SKU"
          className="mt-2 h-12 w-full rounded-full border border-stone bg-white px-5 text-[17px]"
          autoComplete="off"
        />
      </form>
      <div className="mt-4 flex flex-wrap gap-2" role="listbox" aria-label="Categories">
        <button
          type="button"
          role="option"
          aria-selected={category === "all"}
          className={category === "all" ? "inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-medium text-paper" : "inline-flex min-h-11 items-center rounded-full border border-stone px-4 text-sm font-medium"}
          onClick={() => setCategory("all")}
        >
          All
        </button>
        {stocked.map((item) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={category === item.id}
            className={category === item.id ? "inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-medium text-paper" : "inline-flex min-h-11 items-center rounded-full border border-stone px-4 text-sm font-medium"}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <label className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium">
        Sort
        <select
          className="h-11 rounded-full border border-stone bg-white px-4 text-[17px]"
          value={sort}
          onChange={(event) => setSort(event.target.value as typeof sort)}
        >
          <option value="featured">Featured</option>
          <option value="name">Name</option>
          <option value="price-asc">Price, low to high</option>
          <option value="price-desc">Price, high to low</option>
        </select>
      </label>
      {visible.length === 0 ? (
        <p className="mt-10 text-muted">No products match that search.</p>
      ) : needle || category !== "all" ? (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <li key={product.id}><ProductCard product={product} actions /></li>
          ))}
        </ul>
      ) : (
        <div className="mt-12 space-y-16">
          {categories.map((item) => {
            const products = productsInCategory(visible, item.id);
            if (products.length === 0) return null;
            return (
              <section key={item.id} id={item.id} className="scroll-mt-24">
                <h2 className="font-display text-3xl font-extrabold">{item.label}</h2>
                <p className="mt-2 text-muted">{item.summary}</p>
                <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <li key={`${item.id}-${product.id}`}><ProductCard product={product} actions /></li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
