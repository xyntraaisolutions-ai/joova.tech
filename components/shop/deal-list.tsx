import Image from "next/image";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { loadContentBundle } from "@/lib/content/load";

export async function DealList() {
  const { deals } = await loadContentBundle();
  if (deals.length === 0) {
    return <p className="text-muted">No current offers. A product appears here when it is on sale or listed as a deal.</p>;
  }
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {deals.map((deal) => (
        <li key={deal.id} className="flex flex-col overflow-hidden rounded-3xl border border-stone bg-white">
          {deal.image?.src ? (
            <Link href={deal.href} className="block bg-stone/40" aria-label={deal.image.alt}>
              <Image
                src={deal.image.src}
                alt={deal.image.alt}
                width={deal.image.width}
                height={deal.image.height}
                sizes="(min-width: 768px) 30vw, 100vw"
                className="aspect-[4/5] w-full object-contain"
              />
            </Link>
          ) : null}
          <div className="flex flex-1 flex-col p-6">
            <p className="text-sm text-muted">{deal.badge}</p>
            <h3 className="mt-2 font-display text-2xl font-extrabold">{deal.title}</h3>
            {deal.priceLabel ? (
              <p className="mt-3 font-display text-xl font-semibold">
                {deal.priceLabel}
                {deal.compareAtLabel ? (
                  <span className="ml-2 text-base font-medium text-muted line-through">{deal.compareAtLabel}</span>
                ) : null}
              </p>
            ) : null}
            <p className="mt-3 flex-1 text-muted">{deal.detail}</p>
            <Link href={deal.href} className={`${buttonClassName("secondary")} mt-6 w-fit`}>
              View offer
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
