"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatUsd } from "@/lib/utils";

type Report = {
  orders: number;
  merchandise: number;
  discounts: number;
  tax: number;
  shipping: number;
  refunds: number;
  refundCount: number;
};

export function SalesReport({ onError }: { onError: (message: string) => void }) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
  const [from, setFrom] = useState(today.slice(0, 8) + "01");
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<Report | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div>
      <h2 className="font-display text-2xl">Sales and tax</h2>
      <p className="mt-2 text-sm text-muted">Paid orders in this date range, using America/Chicago. Refunds are the charged total of orders marked refunded in the same range.</p>
      <form
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          const response = await fetch(`/api/portal/reports?from=${from}&to=${to}`);
          const data = (await response.json()) as Report & { error?: string };
          setPending(false);
          if (!response.ok) {
            onError(data.error ?? "The report could not be loaded.");
            return;
          }
          onError("");
          setReport(data);
        }}
      >
        <label className="text-sm">From<Input className="mt-2" type="date" required value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label className="text-sm">To<Input className="mt-2" type="date" required value={to} onChange={(event) => setTo(event.target.value)} /></label>
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Loading" : "Show report"}</Button>
      </form>
      {report ? (
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Paid orders</dt><dd className="font-bold">{report.orders}</dd></div>
          <div><dt className="text-muted">Merchandise</dt><dd className="font-bold">{formatUsd(report.merchandise)}</dd></div>
          <div><dt className="text-muted">Discounts</dt><dd className="font-bold">{formatUsd(report.discounts)}</dd></div>
          <div><dt className="text-muted">Sales tax</dt><dd className="font-bold">{formatUsd(report.tax)}</dd></div>
          <div><dt className="text-muted">Shipping</dt><dd className="font-bold">{formatUsd(report.shipping)}</dd></div>
          <div><dt className="text-muted">Refunds ({report.refundCount})</dt><dd className="font-bold">{formatUsd(report.refunds)}</dd></div>
        </dl>
      ) : null}
    </div>
  );
}
