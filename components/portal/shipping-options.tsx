"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shippingCodes, shippingWindow, type ShippingCode, type ShippingOption } from "@/lib/shipping/options";
import { formatUsd } from "@/lib/utils";

type Draft = {
  price: string;
  minDays: string;
  maxDays: string;
  enabled: boolean;
};

function draftFrom(option: ShippingOption): Draft {
  return {
    price: Number.isFinite(option.price) ? String(option.price) : "",
    minDays: String(option.minDays),
    maxDays: String(option.maxDays),
    enabled: option.enabled,
  };
}

export function ShippingOptions() {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [drafts, setDrafts] = useState<Partial<Record<ShippingCode, Draft>>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function load() {
    setError("");
    const response = await fetch("/api/portal/shipping");
    const data = (await response.json()) as { options?: ShippingOption[]; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Shipping options could not be loaded.");
      return;
    }
    const rows = data.options ?? [];
    setOptions(rows);
    setDrafts(Object.fromEntries(rows.map((option) => [option.code, draftFrom(option)])));
  }

  function setDraft(code: ShippingCode, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [code]: { ...current[code]!, ...patch } }));
  }

  async function save() {
    setError("");
    setNotice("");
    const payload = shippingCodes.map((code) => {
      const option = options.find((item) => item.code === code);
      const draft = drafts[code];
      return { option, draft, code };
    });
    if (payload.some((item) => !item.option || !item.draft)) {
      setError("Shipping options could not be loaded.");
      return;
    }
    const optionsPayload = payload.map((item) => ({
      code: item.code,
      price: Number(item.draft!.price),
      minDays: Number(item.draft!.minDays),
      maxDays: Number(item.draft!.maxDays),
      enabled: item.draft!.enabled,
    }));
    if (optionsPayload.some((item) => item.price < 0 || Number.isNaN(item.price) || !Number.isInteger(item.minDays) || !Number.isInteger(item.maxDays))) {
      setError("Enter a price and whole delivery days for each option.");
      return;
    }
    if (optionsPayload.some((item) => item.maxDays < item.minDays)) {
      setError("The latest day has to be on or after the earliest.");
      return;
    }
    setBusy(true);
    const response = await fetch("/api/portal/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options: optionsPayload }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Shipping options could not be saved.");
      return;
    }
    setNotice("Successfully saved.");
    await load();
  }

  return (
    <section className="rounded-3xl bg-white p-4 sm:p-6">
      <h2 className="font-display text-2xl">Shipping options</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        United States options. Turn an option on here and it appears on every product, where it can be marked or unmarked. This price is the starting price. A product can use a different price. A price of 0 adds no shipping charge. A new product starts with every enabled option marked.
      </p>
      {error ? <p className="mt-3 text-sm text-band-red" role="alert">{error}</p> : null}
      {notice ? (
        <div className="fixed inset-x-0 top-4 z-[80] flex justify-center px-4">
          <div role="status" className="w-full max-w-lg rounded-3xl border border-stone bg-white p-4 text-ink shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold">{notice}</p>
              <button type="button" className="min-h-11 px-2 text-sm font-bold" onClick={() => setNotice("")}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mt-6 space-y-4">
        {options.map((option) => {
          const draft = drafts[option.code];
          if (!draft) return null;
          return (
            <article key={option.code} className="rounded-3xl border border-stone p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold">{option.name}</h3>
                <label className="text-sm">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={draft.enabled}
                    onChange={(event) => setDraft(option.code, { enabled: event.target.checked })}
                  />
                  Enabled
                </label>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label className="text-sm">
                  Price, USD
                  <Input className="mt-2" inputMode="decimal" value={draft.price} onChange={(event) => setDraft(option.code, { price: event.target.value })} />
                </label>
                <label className="text-sm">
                  Earliest day
                  <Input className="mt-2" inputMode="numeric" value={draft.minDays} onChange={(event) => setDraft(option.code, { minDays: event.target.value })} />
                </label>
                <label className="text-sm">
                  Latest day
                  <Input className="mt-2" inputMode="numeric" value={draft.maxDays} onChange={(event) => setDraft(option.code, { maxDays: event.target.value })} />
                </label>
              </div>
              <p className="mt-3 text-sm text-muted">
                {draft.enabled ? "Available on inventory" : "Hidden from inventory"}
                {" · "}
                {formatUsd(Number(draft.price) || 0)}
                {" · "}
                {shippingWindow({ minDays: Number(draft.minDays) || 0, maxDays: Number(draft.maxDays) || 0 })}
              </p>
            </article>
          );
        })}
      </div>
      <Button className="mt-6" type="button" disabled={busy || options.length === 0} onClick={() => void save()}>
        {busy ? "Saving" : "Save shipping options"}
      </Button>
    </section>
  );
}

export function shippingChoices(options: ShippingOption[], custom: boolean, codes: string[]) {
  const enabled = options.filter((option) => option.enabled);
  if (!custom) return enabled.map((option) => option.code);
  const allowed = new Set(enabled.map((option) => option.code));
  return codes.filter((code): code is ShippingCode => allowed.has(code as ShippingCode));
}

export function ShippingTypeFields({
  options,
  checked,
  prices,
  onToggle,
  onPrice,
}: {
  options: ShippingOption[];
  checked: string[];
  prices: Partial<Record<ShippingCode, string>>;
  onToggle: (code: ShippingCode, checked: boolean) => void;
  onPrice: (code: ShippingCode, price: string) => void;
}) {
  const enabled = options.filter((option) => option.enabled);
  return (
    <div className="mt-4">
      <p className="max-w-2xl text-sm text-muted">
        These are the shipping options turned on in Fulfillment settings. Mark or unmark any of them for this product. A new product starts with each enabled option marked. The price starts from Fulfillment settings and can be different here.
      </p>
      {enabled.length === 0 ? (
        <p className="mt-4 text-sm">No shipping options are enabled. Turn them on in Fulfillment settings.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {enabled.map((option) => {
            const price = prices[option.code] ?? String(option.price);
            const ownPrice = price.trim() !== "" && Number(price) !== option.price;
            return (
              <li key={option.code} className="rounded-3xl border border-stone p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold">{option.name}</h3>
                  <label className="text-sm">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={checked.includes(option.code)}
                      onChange={(event) => onToggle(option.code, event.target.checked)}
                    />
                    Use for this product
                  </label>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <label className="text-sm">
                    Price for this product, USD
                    <Input
                      className="mt-2"
                      inputMode="decimal"
                      value={price}
                      onChange={(event) => onPrice(option.code, event.target.value)}
                    />
                  </label>
                  <label className="text-sm">
                    Earliest day
                    <Input className="mt-2" value={String(option.minDays)} readOnly />
                  </label>
                  <label className="text-sm">
                    Latest day
                    <Input className="mt-2" value={String(option.maxDays)} readOnly />
                  </label>
                </div>
                <p className="mt-3 text-sm text-muted">
                  {checked.includes(option.code) ? "Marked for this product" : "Not used for this product"}
                  {" · "}
                  {ownPrice ? `Fulfillment settings price is ${formatUsd(option.price)}` : "Using the price from Fulfillment settings"}
                  {" · "}
                  {shippingWindow(option)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
