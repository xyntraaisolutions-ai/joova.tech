"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { Button, buttonClassName } from "@/components/ui/button";
import { countries } from "@/lib/geo/countries";

type SellCountry = {
  code: string;
  name: string;
  currency: string;
  enabled: boolean;
  locked: boolean;
};

export function SellCountries({ onError }: { onError: (message: string) => void }) {
  const [enabled, setEnabled] = useState<SellCountry[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [removing, setRemoving] = useState<SellCountry | null>(null);
  const [reason, setReason] = useState("");

  async function load() {
    const response = await fetch("/api/portal/countries");
    const data = (await response.json()) as { countries?: SellCountry[]; error?: string };
    if (!response.ok) {
      onError(data.error ?? "Countries could not be loaded.");
      setReady(true);
      return;
    }
    setEnabled(data.countries ?? []);
    setReady(true);
  }

  useEffect(() => {
    void load();
  }, []);

  const taken = useMemo(() => new Set(enabled.map((country) => country.code)), [enabled]);
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return countries
      .filter((country) => !taken.has(country.code))
      .filter((country) => {
        if (!needle) return true;
        return country.name.toLowerCase().includes(needle) || country.code.toLowerCase().includes(needle) || country.currency.toLowerCase().includes(needle);
      })
      .slice(0, 12);
  }, [query, taken]);

  async function add(code: string) {
    onError("");
    setPending(true);
    const response = await fetch("/api/portal/countries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", code }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      onError(data.error ?? "That country could not be added.");
      return;
    }
    setQuery("");
    setOpen(false);
    await load();
  }

  async function confirmRemove() {
    if (!removing || reason.trim().length < 3) return;
    onError("");
    setPending(true);
    const response = await fetch("/api/portal/countries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", code: removing.code, reason: reason.trim() }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      onError(data.error ?? "That country could not be removed.");
      return;
    }
    setRemoving(null);
    setReason("");
    await load();
  }

  return (
    <div className="mt-6 border-b border-stone pb-6">
      <h3 className="font-display text-xl">Countries</h3>
      <p className="mt-2 text-sm text-muted">
        Shoppers can view prices in these countries. Checkout stays in US dollars. United States is always available.
      </p>
      <div className="relative mt-4 max-w-md">
        <label className="text-sm">
          Add a country
          <input
            className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4"
            value={query}
            placeholder="Search by name, code, or currency"
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
          />
        </label>
        {open ? (
          <ul className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-stone bg-white p-2 shadow-lg">
            {matches.length ? matches.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-stone/40"
                  disabled={pending}
                  onClick={() => void add(country.code)}
                >
                  <span>{country.name}</span>
                  <span className="text-muted">{country.code} · {country.currency}</span>
                </button>
              </li>
            )) : <li className="px-3 py-2 text-sm text-muted">No matching country.</li>}
          </ul>
        ) : null}
      </div>
      {!ready ? <p className="mt-4 text-sm text-muted">Loading countries.</p> : null}
      <ul className="mt-4 space-y-2">
        {enabled.map((country) => (
          <li key={country.code} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone px-4 py-3">
            <p className="text-sm">
              <span className="font-bold">{country.name}</span>
              <span className="text-muted"> · {country.code} · {country.currency}</span>
            </p>
            {country.locked ? <p className="text-sm text-muted">Default</p> : (
              <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => { setReason(""); setRemoving(country); }}>
                Remove
              </Button>
            )}
          </li>
        ))}
      </ul>
      <Dialog.Root open={Boolean(removing)} onOpenChange={(next) => { if (!next && !pending) setRemoving(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-ink">
            <Dialog.Title className="font-display text-xl">Remove {removing?.name}</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted">
              The country leaves the website menu. Prices already entered for it stay saved if you add it again.
            </Dialog.Description>
            <label className="mt-4 block text-sm">
              Reason
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <Dialog.Close className={buttonClassName("secondary", "sm")} disabled={pending}>Cancel</Dialog.Close>
              <Button type="button" size="sm" disabled={pending || reason.trim().length < 3} onClick={() => void confirmRemove()}>
                Remove country
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
