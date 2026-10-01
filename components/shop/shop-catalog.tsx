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
  useEffect(() => {
    setText(query);
  }, [query]);
  const needle = text.trim().toLowerCase();
  const visible = useMemo(() => {
    return catalog.filter((product) => {
      if (category !== "all" && product.category !== category && !product.alsoIn?.includes(category)) return false;
      if (!needle) return true;
      const haystack = [product.name, product.menuLabel, product.model, product.sku, product.summary, product.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [catalog, category, needle]);

  return (
    <div>
      <form className="mt-8" role="search" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="shop-search" className="text-sm font-medium">Search products</label>
        <input
          id="shop-search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Name, model, or SKU"
          className="mt-2 h-12 w-full rounded-full border border-stone bg-white px-5 text-base"
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
        {categories.map((item) => (
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
