"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/portal/inventory", label: "Products", count: "products" },
  { href: "/portal/inventory/fulfillment", label: "Fulfillment", count: "open" },
] as const;

export function InventorySections({ current }: { current: "products" | "fulfillment" }) {
  const [counts, setCounts] = useState({ products: 0, open: 0 });

  useEffect(() => {
    void fetch("/api/portal/fulfillment?stage=all")
      .then((response) => response.json())
      .then((data: { counts?: { products?: number; open?: number } }) => {
        if (data.counts) setCounts({ products: data.counts.products ?? 0, open: data.counts.open ?? 0 });
      });
  }, []);

  return (
    <nav className="mt-6 flex flex-wrap gap-2" aria-label="Inventory sections">
      {sections.map((section) => {
        const selected = (current === "products" && section.href === "/portal/inventory")
          || (current === "fulfillment" && section.href === "/portal/inventory/fulfillment");
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
