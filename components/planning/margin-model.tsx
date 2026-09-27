"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatUsd } from "@/lib/utils";
import {
  marginDefaults,
  planMargin,
  scaleOrder,
  type MarginInput,
  type MarginResult,
} from "@/lib/planning-margin";

function money(value: number) {
  return formatUsd(Number.isFinite(value) ? value : 0);
}

function percent(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function Field({
  label,
  hint,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
      <Input
        className="mt-2"
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
      />
    </label>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="font-display mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-muted">{detail}</p>
    </div>
  );
}

function ScenarioTable({
  caption,
  columns,
}: {
  caption: string;
  columns: { heading: string; result: MarginResult }[];
}) {
  const rows = [
    ["Revenue", (result: MarginResult) => money(result.revenue)],
    ["Landed cost", (result: MarginResult) => money(result.landed)],
    ["Gross margin", (result: MarginResult) => percent(result.grossMargin)],
    ["Net profit", (result: MarginResult) => money(result.contribution)],
    ["Net profit margin", (result: MarginResult) => percent(result.contributionMargin)],
  ] as const;

  return (
    <div className="overflow-x-auto rounded-3xl bg-white">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <caption className="px-5 pt-5 text-left text-base font-medium">{caption}</caption>
        <thead>
          <tr className="text-muted">
            <th className="px-5 py-3 font-medium" scope="col">
              Result
            </th>
            {columns.map((column, index) => (
              <th key={`${column.heading}-${index}`} className="px-5 py-3 font-medium" scope="col">
                {column.heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, read]) => (
            <tr key={label} className="border-t border-stone">
              <th className="px-5 py-3 font-medium" scope="row">
                {label}
              </th>
              {columns.map((column, index) => (
                <td key={`${column.heading}-${index}`} className="px-5 py-3">
                  {read(column.result)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NetProfit({
  amount,
  margin,
  hot,
  bannerRef,
  sticky = false,
  live = false,
}: {
  amount: number;
  margin: number | null;
  hot: boolean;
  bannerRef?: RefObject<HTMLDivElement | null>;
  sticky?: boolean;
  live?: boolean;
}) {
  return (
    <div
      ref={bannerRef}
      tabIndex={-1}
      className={cn(
        "cinematic rounded-3xl px-6 py-5 outline-none",
        sticky && "sticky top-3 z-20",
        hot && "net-profit-hot",
      )}
    >
      <p className="text-sm text-paper/70">Net profit</p>
      <p className="font-display text-5xl font-semibold tracking-tight" aria-live={live ? "polite" : undefined}>
        {money(amount)}
      </p>
      <p className="mt-2 text-sm text-paper/70">
        {percent(margin)} of revenue, after landed cost, fees, customer shipping, and ads
      </p>
    </div>
  );
}

export function MarginModel() {
  const [input, setInput] = useState<MarginInput>(marginDefaults);
  const [hot, setHot] = useState(false);
  const result = useMemo(() => planMargin(input), [input]);
  const seen = useRef<number | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (seen.current === null) {
      seen.current = result.contribution;
      return;
    }
    if (seen.current === result.contribution) return;
    seen.current = result.contribution;
    setHot(true);
    const active = document.activeElement;
    const typing = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
    if (!typing) {
      topRef.current?.focus({ preventScroll: true });
      bottomRef.current?.focus({ preventScroll: true });
    }
    const timer = window.setTimeout(() => setHot(false), 1200);
    return () => window.clearTimeout(timer);
  }, [result.contribution]);

  function set<K extends keyof MarginInput>(key: K, value: MarginInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setInput({ ...marginDefaults });
  }

  const priceColumns = [-10, 0, 10].map((delta) => {
    const price = Math.max(0, input.price + delta);
    return {
      heading: formatUsd(price),
      result: planMargin({ ...input, price }),
    };
  });

  const half = Math.max(1, Math.round(input.bands / 2));
  const double = Math.max(1, input.bands * 2);
  const qtyColumns = [half, input.bands, double].map((bands) => ({
    heading: `${bands.toLocaleString("en-US")} bands`,
    result: planMargin(scaleOrder(input, bands)),
  }));

  return (
    <section aria-labelledby="margin-heading">
      <h2 id="margin-heading" className="sr-only">
        Net profit
      </h2>
      <div className="sticky top-3 z-20">
        <NetProfit
          amount={result.contribution}
          margin={result.contributionMargin}
          hot={hot}
          bannerRef={topRef}
          live
        />
        <div className="mt-3 flex justify-end">
          <Button variant="secondary" size="sm" onClick={reset}>
            Reset
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-8">
        <fieldset className="rounded-3xl bg-white p-5 sm:p-6">
          <legend className="font-display text-xl font-semibold">Order and price</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Bands" value={input.bands} onChange={(value) => set("bands", value)} />
            <Field
              label="Additional straps"
              hint="Separate from the band cost."
              value={input.straps}
              onChange={(value) => set("straps", value)}
            />
            <Field
              label="Band manufacturing ($)"
              value={input.bandCost}
              step="0.01"
              onChange={(value) => set("bandCost", value)}
            />
            <Field
              label="Additional strap ($)"
              value={input.strapCost}
              step="0.01"
              onChange={(value) => set("strapCost", value)}
            />
            <Field
              label="Selling price ($)"
              value={input.price}
              step="0.01"
              onChange={(value) => set("price", value)}
            />
            <Field
              label="Unsold bands"
              hint="Creator samples and warranty swaps. They still carry landed cost."
              value={input.unsold}
              onChange={(value) => set("unsold", value)}
            />
          </div>
        </fieldset>

        <fieldset className="rounded-3xl bg-white p-5 sm:p-6">
          <legend className="font-display text-xl font-semibold">Landed in Texas</legend>
          <p className="mt-2 text-sm text-muted">
            [CONFIRM: forwarder quote, brokerage invoice, and the US tariff rate
            for this product.] The earlier launch range of $40,000 to $76,000
            moved with the tariff.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field
              label="Freight per band ($)"
              hint="Factory to the Grapevine, Texas warehouse."
              value={input.freightPerBand}
              step="0.01"
              onChange={(value) => set("freightPerBand", value)}
            />
            <Field
              label="Customs and brokerage per band ($)"
              value={input.customsPerBand}
              step="0.01"
              onChange={(value) => set("customsPerBand", value)}
            />
            <Field
              label="Tariff (% of goods + freight)"
              value={input.tariffPct}
              step="0.1"
              onChange={(value) => set("tariffPct", value)}
            />
          </div>
        </fieldset>

        <fieldset className="rounded-3xl bg-white p-5 sm:p-6">
          <legend className="font-display text-xl font-semibold">Where the bands sell</legend>
          <p className="mt-2 text-sm text-muted">
            Starting split from the launch plan: 850 to Amazon, the rest with
            you for the website, TikTok Shop, creators, and warranty swaps.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Amazon units" value={input.amazonUnits} onChange={(value) => set("amazonUnits", value)} />
            <Field label="Website units" value={input.websiteUnits} onChange={(value) => set("websiteUnits", value)} />
            <Field label="TikTok Shop units" value={input.tiktokUnits} onChange={(value) => set("tiktokUnits", value)} />
          </div>
          {result.channelsCapped ? (
            <p className="mt-3 text-sm text-muted" role="status">
              Those channel counts are above the bands left to sell, so they
              were scaled to {result.sold.toLocaleString("en-US")} bands.
            </p>
          ) : null}
          {result.unassigned > 0 ? (
            <p className="mt-3 text-sm text-muted" role="status">
              {result.unassigned.toLocaleString("en-US")} bands are not on a
              channel. They are left out of revenue, and their landed cost is
              still included.
            </p>
          ) : null}
        </fieldset>

        <fieldset className="rounded-3xl bg-white p-5 sm:p-6">
          <legend className="font-display text-xl font-semibold">Platform fees and customer shipping</legend>
          <p className="mt-2 text-sm text-muted">
            [CONFIRM: Amazon category rate, FBA size tier, TikTok Shop rate, and
            the carrier rate from Texas.] Amazon’s launch coupon is 15% in the
            plan. Referral fee schedules often list fitness trackers near 8% and
            many other categories at 15%.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Amazon referral fee (%)" value={input.amazonReferralPct} step="0.1" onChange={(value) => set("amazonReferralPct", value)} />
            <Field label="Amazon launch coupon (%)" value={input.amazonCouponPct} step="0.1" onChange={(value) => set("amazonCouponPct", value)} />
            <Field label="Amazon fulfillment per unit ($)" hint="Pick, pack, and ship to the Amazon customer." value={input.fbaFee} step="0.01" onChange={(value) => set("fbaFee", value)} />
            <Field label="Warehouse to Amazon per unit ($)" value={input.amazonTransfer} step="0.01" onChange={(value) => set("amazonTransfer", value)} />
            <Field label="Website card fee (%)" value={input.payPct} step="0.1" onChange={(value) => set("payPct", value)} />
            <Field label="Website card fee fixed ($)" value={input.payFixed} step="0.01" onChange={(value) => set("payFixed", value)} />
            <Field label="Ship to website customer ($)" value={input.customerShip} step="0.01" onChange={(value) => set("customerShip", value)} />
            <Field label="TikTok Shop fee (%)" value={input.tiktokFeePct} step="0.1" onChange={(value) => set("tiktokFeePct", value)} />
            <Field label="Ship to TikTok customer ($)" value={input.tiktokShip} step="0.01" onChange={(value) => set("tiktokShip", value)} />
          </div>
        </fieldset>

        <fieldset className="rounded-3xl bg-white p-5 sm:p-6">
          <legend className="font-display text-xl font-semibold">Marketing</legend>
          <p className="mt-2 text-sm text-muted">
            Example launch budgets. [CONFIRM: the amount you will actually spend
            on each platform.] A larger order keeps this spend the same, so the
            margin per band rises.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Amazon ads ($)" value={input.adsAmazon} step="1" onChange={(value) => set("adsAmazon", value)} />
            <Field label="Instagram and Facebook ($)" value={input.adsMeta} step="1" onChange={(value) => set("adsMeta", value)} />
            <Field label="TikTok ads ($)" value={input.adsTiktok} step="1" onChange={(value) => set("adsTiktok", value)} />
            <Field label="YouTube ($)" value={input.adsYouTube} step="1" onChange={(value) => set("adsYouTube", value)} />
            <Field label="Other marketing ($)" value={input.adsOther} step="1" onChange={(value) => set("adsOther", value)} />
          </div>
        </fieldset>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
        <SummaryCard
          label="Revenue"
          value={money(result.revenue)}
          detail={`${result.sold.toLocaleString("en-US")} bands sold · Amazon at ${money(result.amazonPrice)}`}
        />
        <SummaryCard
          label="Landed cost"
          value={money(result.landed)}
          detail={`${money(result.landedPerBand)} per band in Texas`}
        />
        <SummaryCard
          label="Gross margin"
          value={percent(result.grossMargin)}
          detail={`${money(result.grossProfit)} after manufacturing, freight, customs, and tariff`}
        />
        <SummaryCard
          label="Net profit margin"
          value={percent(result.contributionMargin)}
          detail={`${money(result.contribution)} after fees, customer shipping, and ads`}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl bg-white">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="px-5 pt-5 text-left text-base font-medium">
            Cost breakdown
          </caption>
          <thead>
            <tr className="text-muted">
              <th className="px-5 py-3 font-medium" scope="col">
                Line
              </th>
              <th className="px-5 py-3 font-medium" scope="col">
                Total
              </th>
              <th className="px-5 py-3 font-medium" scope="col">
                Share of revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {result.lines.map((line) => (
              <tr key={line.label} className="border-t border-stone">
                <th className="px-5 py-3 font-medium" scope="row">
                  {line.label}
                  {line.note ? (
                    <span className="mt-1 block font-normal text-muted">{line.note}</span>
                  ) : null}
                </th>
                <td className="px-5 py-3">{money(line.total)}</td>
                <td className="px-5 py-3">
                  {result.revenue > 0 ? percent(line.total / result.revenue) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4">
        <ScenarioTable caption="Same costs, three selling prices" columns={priceColumns} />
        <ScenarioTable
          caption="Same price, three order sizes. Straps, unsold bands, and channel units scale. Ad budgets stay fixed."
          columns={qtyColumns}
        />
      </div>

      <div className="mt-8">
        <NetProfit
          amount={result.contribution}
          margin={result.contributionMargin}
          hot={hot}
          bannerRef={bottomRef}
        />
      </div>
    </section>
  );
}
