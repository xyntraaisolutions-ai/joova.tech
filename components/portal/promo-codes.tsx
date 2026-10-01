"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatUsd } from "@/lib/utils";

type Promo = {
  code: string;
  kind: "percent" | "amount";
  amount: number;
  starts_on: string | null;
  ends_on: string | null;
  max_uses: number | null;
  used_count: number;
  enabled: boolean;
};

export function PromoCodes({ onError }: { onError: (message: string) => void }) {
  const [promos, setPromos] = useState<Promo[]>([]);

  async function load() {
    const response = await fetch("/api/portal/promos");
    const data = (await response.json()) as { promos?: Promo[]; error?: string };
    if (!response.ok) {
      onError(data.error ?? "Promo codes could not be loaded.");
      return;
    }
    setPromos(data.promos ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <h2 className="font-display text-2xl">Promo codes</h2>
      <p className="mt-2 text-sm text-muted">A code lowers the merchandise total at checkout. Tax follows the discounted merchandise. Shipping stays the same. The use count goes up when the order is paid.</p>
      <ul className="mt-4 space-y-2 text-sm">
        {promos.map((promo) => (
          <li key={promo.code} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone px-4 py-3">
            <span>
              <span className="font-bold">{promo.code}</span>
              {" · "}
              {promo.kind === "percent" ? `${promo.amount}%` : formatUsd(Number(promo.amount))}
              {" · "}
              {promo.used_count}{promo.max_uses ? ` of ${promo.max_uses}` : ""} used
              {promo.enabled ? "" : " · off"}
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={async () => {
                const response = await fetch("/api/portal/promos", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "delete", code: promo.code }),
                });
                const data = (await response.json()) as { error?: string };
                if (!response.ok) {
                  onError(data.error ?? "That promo code could not be removed.");
                  return;
                }
                onError("");
                void load();
              }}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <form
        className="mt-6 grid gap-3 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const max = String(form.get("maxUses") ?? "").trim();
          const response = await fetch("/api/portal/promos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "save",
              code: String(form.get("code") ?? ""),
              kind: String(form.get("kind") ?? "amount"),
              amount: Number(form.get("amount") ?? 0),
              startsOn: String(form.get("startsOn") ?? "") || null,
              endsOn: String(form.get("endsOn") ?? "") || null,
              maxUses: max ? Number(max) : null,
              enabled: true,
            }),
          });
          const data = (await response.json()) as { error?: string };
          if (!response.ok) {
            onError(data.error ?? "The promo code could not be saved.");
            return;
          }
          onError("");
          event.currentTarget.reset();
          void load();
        }}
      >
        <label className="text-sm">Code<Input className="mt-2" name="code" required minLength={2} maxLength={40} autoCapitalize="characters" /></label>
        <label className="text-sm">
          Kind
          <select name="kind" className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" defaultValue="amount">
            <option value="amount">Dollar amount</option>
            <option value="percent">Percent</option>
          </select>
        </label>
        <label className="text-sm">Amount<Input className="mt-2" name="amount" type="number" min="0.01" step="0.01" required /></label>
        <label className="text-sm">Use limit <span className="text-muted">(optional)</span><Input className="mt-2" name="maxUses" type="number" min="1" step="1" /></label>
        <label className="text-sm">Starts <span className="text-muted">(optional)</span><Input className="mt-2" name="startsOn" type="date" /></label>
        <label className="text-sm">Ends <span className="text-muted">(optional)</span><Input className="mt-2" name="endsOn" type="date" /></label>
        <Button type="submit" size="sm">Save promo code</Button>
      </form>
    </div>
  );
}
