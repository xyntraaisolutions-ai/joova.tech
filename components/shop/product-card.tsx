import Image from "next/image";
import Link from "next/link";
import { ShopCardActions } from "@/components/shop/shop-card-actions";
import type { CatalogProduct } from "@/content/catalog";
import { policies } from "@/content/site";
import { buttonClassName } from "@/components/ui/button";
import { formatUsd } from "@/lib/utils";

export function ProductCard({ product, actions = false }: { product: CatalogProduct; actions?: boolean }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-stone bg-white">
      <Link href={product.href} className="block bg-stone/40" aria-label={product.image.alt}>
        {product.image.src ? (
          <Image
            src={product.image.src}
            alt={product.image.alt}
            width={product.image.width}
            height={product.image.height}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="aspect-[4/5] w-full object-contain"
          />
        ) : (
          <span className="block aspect-[4/5] w-full" />
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <p className="text-sm text-muted">
          {product.topPick ? "Top pick · " : ""}
          {product.availability === "out_of_stock" ? "Out of stock" : product.status}
        </p>
        {typeof product.availableCount === "number" ? (
          <p className="mt-1 text-sm text-muted">{product.availableCount} available</p>
        ) : null}
        <h3 className="mt-2 font-display text-2xl font-extrabold">
          <Link href={product.href} className="hover:underline">
            {product.menuLabel}
          </Link>
        </h3>
        {product.model ? <p className="mt-1 text-sm text-muted">{product.model}</p> : null}
        <p className="mt-2 font-display text-xl font-semibold">
          {product.priceLabel}
          {product.compareAtLabel || product.compareAt ? (
            <span className="ml-2 text-base font-medium text-muted line-through">{product.compareAtLabel ?? formatUsd(product.compareAt ?? 0)}</span>
          ) : null}
        </p>
        <p className="mt-1 text-sm text-muted">{policies.returnsTitle}</p>
        <p className="mt-3 line-clamp-3 flex-1 text-muted">{product.summary}</p>
        {actions ? (
          <ShopCardActions product={product} />
        ) : (
          <Link href={product.href} className={`${buttonClassName("primary")} mt-5 w-full sm:w-fit`}>
            See Details
          </Link>
        )}
      </div>
    </article>
  );
}
