import Link from "next/link";
import { orderOrigin } from "@/lib/orders/origin";

export function OrderOrigin({
  order,
  href,
}: {
  order: Parameters<typeof orderOrigin>[0];
  href?: (orderId: string) => string;
}) {
  const origin = orderOrigin(order);
  if (!origin) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <span className="rounded-full bg-coral px-2.5 py-1 text-xs font-bold text-ink">{origin.label}</span>
      {origin.sourceOrderId ? (
        href ? (
          <Link className="font-bold underline" href={href(origin.sourceOrderId)}>
            Original order {origin.sourceOrderId}
          </Link>
        ) : (
          <span>Original order {origin.sourceOrderId}</span>
        )
      ) : null}
    </p>
  );
}
