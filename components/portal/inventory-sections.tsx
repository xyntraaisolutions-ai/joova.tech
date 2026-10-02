"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/portal/inventory", label: "Products", count: "products" },
  { href: "/portal/inventory/fulfillment", label: "Fulfillment", count: "open" },
  { href: "/portal/inventory/batches", label: "Batch requests", count: "batches" },
  { href: "/portal/inventory/low-stock", label: "Low level stock", count: "low" },
] as const;

export function InventorySections({ current }: { current: "products" | "fulfillment" | "batches" | "low-stock" }) {
  const [counts, setCounts] = useState({ products: 0, open: 0, batches: 0, low: 0 });

  useEffect(() => {
    void Promise.all([
      fetch("/api/portal/fulfillment?stage=all").then((response) => response.json()) as Promise<{ counts?: { products?: number; open?: number } }>,
      fetch("/api/portal/inventory/batches").then((response) => response.json()) as Promise<{ count?: number }>,
      fetch("/api/portal/inventory/low-stock").then((response) => response.json()) as Promise<{ count?: number }>,
    ]).then(([fulfillment, batches, low]) => {
      setCounts({
        products: fulfillment.counts?.products ?? 0,
        open: fulfillment.counts?.open ?? 0,
        batches: batches.count ?? 0,
        low: low.count ?? 0,
      });
    });
  }, []);

  return (
    <nav className="mt-6 flex flex-wrap gap-2" aria-label="Inventory sections">
      {sections.map((section) => {
        const selected = (current === "products" && section.href === "/portal/inventory")
          || (current === "fulfillment" && section.href === "/portal/inventory/fulfillment")
          || (current === "batches" && section.href === "/portal/inventory/batches")
          || (current === "low-stock" && section.href === "/portal/inventory/low-stock");
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold",
              selected ? "bg-ink text-paper" : "border border-stone text-ink",
            )}
          >
            {section.label} ({counts[section.count]})
          </Link>
        );
      })}
    </nav>
  );
}
