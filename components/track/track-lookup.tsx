"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { orderStatusLabel } from "@/lib/orders/status";

type Result = {
  found?: boolean;
  orderId?: string;
  status?: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  shipmentStatus?: string;
  error?: string;
};

export function TrackLookup({ initialOrder = "" }: { initialOrder?: string }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  return (
    <form
      className="mt-8 space-y-4 rounded-3xl border border-stone bg-white p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setPending(true);
        void fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order: String(data.get("order") ?? ""),
            email: String(data.get("email") ?? ""),
          }),
        })
          .then((response) => response.json())
          .then((body: Result) => setResult(body))
          .catch(() => setResult({ error: "Tracking could not be loaded." }))
          .finally(() => setPending(false));
      }}
    >
      <label className="block">
        <span className="text-sm font-medium text-ink">Order number</span>
        <Input className="mt-2" name="order" required autoComplete="off" defaultValue={initialOrder} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-ink">Email</span>
        <Input className="mt-2" type="email" name="email" required />
      </label>
      <Button type="submit" className="w-full sm:w-fit" disabled={pending}>
        Look up
      </Button>
      {result?.error ? <p className="text-sm text-band-red" role="alert">{result.error}</p> : null}
      {result && !result.error && !result.found ? <p role="status">No order matches that number and email.</p> : null}
      {result?.found ? (
        <div className="rounded-3xl bg-white p-4" role="status">
          <p className="font-bold">{result.orderId}</p>
          <p className="text-sm">Status: {orderStatusLabel(result.status)}</p>
          {result.trackingNumber ? (
            <p className="text-sm">
              Tracking: {result.carrier ? `${result.carrier} ` : ""}
              {result.trackingNumber}
            </p>
          ) : (
            <p className="text-sm text-muted">Tracking number appears after the order ships.</p>
          )}
        </div>
      ) : null}
    </form>
  );
}
