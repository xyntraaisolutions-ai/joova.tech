import Link from "next/link";
import { deals } from "@/content/catalog";
import { buttonClassName } from "@/components/ui/button";

export function DealList() {
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {deals.map((deal) => (
        <li key={deal.id} className="flex flex-col rounded-3xl border border-stone bg-white p-6">
          <p className="text-sm text-muted">{deal.badge}</p>
          <h3 className="mt-2 font-display text-2xl font-extrabold">{deal.title}</h3>
          {deal.priceLabel ? (
            <p className="mt-3 font-display text-xl font-semibold">{deal.priceLabel}</p>
          ) : null}
          <p className="mt-3 flex-1 text-muted">{deal.detail}</p>
          <Link href={deal.href} className={`${buttonClassName("secondary")} mt-6 w-fit`}>
            View offer
          </Link>
        </li>
      ))}
    </ul>
  );
}
