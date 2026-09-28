"use client";

import Link from "next/link";
import { useWishlist } from "@/components/layout/wishlist-provider";
import { buttonClassName } from "@/components/ui/button";

export function WishlistList() {
  const { items, removeItem } = useWishlist();

  if (items.length === 0) {
    return (
      <p className="mt-10 text-muted">
        Your wishlist is empty. Save a product from its page, or shop{" "}
        <Link href="/shop" className="underline">
          everything that is available now
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="mt-10 grid gap-4">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-4 rounded-3xl border border-stone bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-medium text-ink">Wishlist</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold">{item.name}</h2>
            <p className="mt-2 text-muted">{item.note ?? "Saved for later."}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={item.href} className={buttonClassName("primary")}>
              View product
            </Link>
            <button
              type="button"
              className={buttonClassName("secondary")}
              onClick={() => removeItem(item.id)}
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
