"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { carriers, type CarrierCode } from "@/lib/shipping/carriers";
import { cn } from "@/lib/utils";

type RateDraft = {
  id: string;
  carrier: CarrierCode;
  service: string;
  maxWeightLb: string;
  maxLengthIn: string;
  maxWidthIn: string;
  maxHeightIn: string;
  carrierPrice: string;
  ourPrice: string;
  detail: string;
};

type SavedRate = {
  id: string;
  carrier: CarrierCode;
  service: string;
  maxWeightLb: number;
  maxLengthIn: number;
  maxWidthIn: number;
  maxHeightIn: number;
  carrierPrice: number;
  ourPrice: number | null;
  detail?: string;
};

function blankRate(carrier: CarrierCode, service: string): RateDraft {
  return {
    id: crypto.randomUUID(),
    carrier,
    service,
    maxWeightLb: "",
    maxLengthIn: "",
    maxWidthIn: "",
    maxHeightIn: "",
    carrierPrice: "",
    ourPrice: "",
    detail: "",
  };
}

function fromSaved(rate: SavedRate): RateDraft {
  return {
    id: rate.id,
    carrier: rate.carrier,
    service: rate.service,
    maxWeightLb: String(rate.maxWeightLb),
    maxLengthIn: String(rate.maxLengthIn),
    maxWidthIn: String(rate.maxWidthIn),
    maxHeightIn: String(rate.maxHeightIn),
    carrierPrice: String(rate.carrierPrice),
    ourPrice: rate.ourPrice === null ? "" : String(rate.ourPrice),
    detail: rate.detail ?? "",
  };
}

function empty(rate: RateDraft) {
  return !rate.maxWeightLb.trim() && !rate.maxLengthIn.trim() && !rate.maxWidthIn.trim() && !rate.maxHeightIn.trim() && !rate.carrierPrice.trim() && !rate.ourPrice.trim();
}

function servicesFor(carrier: CarrierCode, rows: RateDraft[]) {
  const known = carriers.find((item) => item.code === carrier)?.services ?? [];
  const extra = rows.filter((rate) => rate.carrier === carrier && rate.service && !known.includes(rate.service)).map((rate) => rate.service);
  return [...known, ...new Set(extra)];
}

function rateCount(rows: RateDraft[], carrier: CarrierCode, service?: string) {
  return rows.filter((rate) => rate.carrier === carrier && (!service || rate.service === service) && !empty(rate)).length;
}

export function CarrierRates() {
  const [rates, setRates] = useState<RateDraft[]>([]);
  const [carrierTab, setCarrierTab] = useState<CarrierCode>("usps");
  const [serviceTab, setServiceTab] = useState(carriers[0].services[0]);
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
    const data = (await response.json()) as { rates?: SavedRate[]; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Carrier rates could not be loaded.");
      return;
    }
    const saved = data.rates ?? [];
    const next = carriers.flatMap((carrier) => {
      const rows = saved.filter((rate) => rate.carrier === carrier.code).map(fromSaved);
      return rows;
    });
    setRates(next);
  }

  function update(id: string, patch: Partial<RateDraft>) {
    setRates((current) => current.map((rate) => rate.id === id ? { ...rate, ...patch } : rate));
  }

  async function save() {
    setError("");
    setNotice("");
    const filled = rates.filter((rate) => !empty(rate));
    const payload = filled.map((rate) => ({
      id: rate.id,
      carrier: rate.carrier,
      service: rate.service.trim(),
      maxWeightLb: Number(rate.maxWeightLb),
      maxLengthIn: Number(rate.maxLengthIn),
      maxWidthIn: Number(rate.maxWidthIn),
      maxHeightIn: Number(rate.maxHeightIn),
      carrierPrice: Number(rate.carrierPrice),
      ourPrice: rate.ourPrice.trim() ? Number(rate.ourPrice) : null,
      detail: rate.detail.trim(),
    }));
    if (payload.some((rate) => !rate.service || [rate.maxWeightLb, rate.maxLengthIn, rate.maxWidthIn, rate.maxHeightIn, rate.carrierPrice].some((value) => !Number.isFinite(value) || value < 0) || (rate.ourPrice !== null && !Number.isFinite(rate.ourPrice)))) {
      setError("Each rate needs a service, a weight, length, width, height, and the carrier price. Our price can stay blank.");
      return;
    }
    if (payload.some((rate) => rate.maxWeightLb <= 0 || rate.maxLengthIn <= 0 || rate.maxWidthIn <= 0 || rate.maxHeightIn <= 0)) {
      setError("Weight and box size have to be greater than 0.");
      return;
    }
    setBusy(true);
    const response = await fetch("/api/portal/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "rates", rates: payload }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Carrier rates could not be saved.");
      return;
    }
    setNotice("Successfully saved.");
    await load();
  }

  const rows = rates.filter((rate) => rate.carrier === carrierTab && rate.service === serviceTab);

  return (
    <section className="rounded-3xl bg-white p-4 sm:p-6">
      <h2 className="font-display text-2xl">Carrier rates</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Starting prices are approximate published United States rates for zone 5, a mid-distance zone. Box sizes stay inside that weight so dimensional weight does not raise the price. Fuel and extra fees are not included. Change any price, size, or detail. Our price can stay blank.
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
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Carriers">
        {carriers.map((carrier) => (
          <button
            key={carrier.code}
            type="button"
            role="tab"
            aria-selected={carrierTab === carrier.code}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-bold",
              carrierTab === carrier.code ? "bg-ink text-paper" : "border border-stone text-ink",
            )}
            onClick={() => {
              setCarrierTab(carrier.code);
              setServiceTab(servicesFor(carrier.code, rates)[0] ?? "");
            }}
          >
            {carrier.name} ({rateCount(rates, carrier.code)})
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Services">
        {servicesFor(carrierTab, rates).map((service) => (
          <button
            key={service}
            type="button"
            role="tab"
            aria-selected={serviceTab === service}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-bold",
              serviceTab === service ? "bg-white text-ink ring-2 ring-ink" : "border border-stone text-ink",
            )}
            onClick={() => setServiceTab(service)}
          >
            {service} ({rateCount(rates, carrierTab, service)})
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-3xl border border-stone p-4">
        {rows.length ? (
          <ul className="space-y-4">
            {rows.map((rate) => (
              <li key={rate.id} className="grid gap-3 border-t border-stone pt-4 first:border-t-0 first:pt-0">
                <div className="grid gap-3 sm:grid-cols-4">
                  <label className="text-sm">Weight up to, lb<Input className="mt-2" inputMode="decimal" value={rate.maxWeightLb} onChange={(event) => update(rate.id, { maxWeightLb: event.target.value })} /></label>
                  <label className="text-sm">Length up to, in<Input className="mt-2" inputMode="decimal" value={rate.maxLengthIn} onChange={(event) => update(rate.id, { maxLengthIn: event.target.value })} /></label>
                  <label className="text-sm">Width up to, in<Input className="mt-2" inputMode="decimal" value={rate.maxWidthIn} onChange={(event) => update(rate.id, { maxWidthIn: event.target.value })} /></label>
                  <label className="text-sm">Height up to, in<Input className="mt-2" inputMode="decimal" value={rate.maxHeightIn} onChange={(event) => update(rate.id, { maxHeightIn: event.target.value })} /></label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">Carrier price, USD<Input className="mt-2" inputMode="decimal" value={rate.carrierPrice} onChange={(event) => update(rate.id, { carrierPrice: event.target.value })} /></label>
                  <label className="text-sm">Our price, USD, optional<Input className="mt-2" inputMode="decimal" value={rate.ourPrice} onChange={(event) => update(rate.id, { ourPrice: event.target.value })} /></label>
                </div>
                <label className="text-sm">Details<Input className="mt-2" value={rate.detail} onChange={(event) => update(rate.id, { detail: event.target.value })} /></label>
                <div>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setRates((current) => current.filter((item) => item.id !== rate.id))}>
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No rates for this service yet.</p>
        )}
        <Button className="mt-4" type="button" size="sm" variant="secondary" onClick={() => setRates((current) => [...current, blankRate(carrierTab, serviceTab)])}>
          Add a rate
        </Button>
      </div>
      <Button className="mt-6" type="button" disabled={busy} onClick={() => void save()}>
        {busy ? "Saving" : "Save carrier rates"}
      </Button>
      <p className="mt-2 text-sm text-muted">This saves USPS, UPS, and FedEx together.</p>
    </section>
  );
}
