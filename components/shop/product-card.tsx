import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/content/catalog";
import { buttonClassName } from "@/components/ui/button";

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-stone bg-white">
      <Link href={product.href} className="block bg-stone/40" aria-label={product.image.alt}>
        <Image
          src={product.image.src}
          alt={product.image.alt}
          width={product.image.width}
          height={product.image.height}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="aspect-[4/5] w-full object-contain"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <p className="text-sm text-muted">{product.status}</p>
        <h3 className="mt-2 font-display text-2xl font-extrabold">
          <Link href={product.href} className="hover:underline">
            {product.menuLabel}
          </Link>
        </h3>
        <p className="mt-2 font-display text-xl font-semibold">{product.priceLabel}</p>
        <p className="mt-3 flex-1 text-muted">{product.summary}</p>
        <Link href={product.href} className={`${buttonClassName("primary")} mt-5 w-full sm:w-fit`}>
          See Details
        </Link>
      </div>
    </article>
  );
}
