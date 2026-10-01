"use client";

import { useEffect, useState } from "react";
import { US_STATES } from "@/components/shop/us-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Address = {
  id: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal: string;
  is_default: boolean;
};

export function SavedAddresses({ onMessage }: { onMessage: (value: string) => void }) {
  const [addresses, setAddresses] = useState<Address[]>([]);

  async function load() {
    const response = await fetch("/api/account/addresses");
    const data = (await response.json()) as { addresses?: Address[]; error?: string };
    if (!response.ok) {
      onMessage(data.error ?? "Saved addresses could not be loaded.");
      return;
    }
    setAddresses(data.addresses ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section id="addresses" className="scroll-mt-24">
      <h2 className="font-display text-2xl">Saved addresses</h2>
      <p className="mt-2 text-sm text-muted">United States ship-to addresses for checkout.</p>
      <ul className="mt-4 space-y-3">
        {addresses.map((address) => (
          <li key={address.id} className="rounded-3xl bg-white p-4 text-sm">
            <p className="font-bold">{address.name}{address.is_default ? " · Default" : ""}</p>
            <p className="mt-1 text-muted">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {[address.city, address.region, address.postal].filter(Boolean).join(", ")}
            </p>
            <Button
              className="mt-3"
              type="button"
              size="sm"
              variant="secondary"
              onClick={async () => {
                const response = await fetch(`/api/account/addresses?id=${address.id}`, { method: "DELETE" });
                const data = (await response.json()) as { error?: string };
                if (!response.ok) {
                  onMessage(data.error ?? "The address could not be removed.");
                  return;
                }
                onMessage("Address removed.");
                void load();
              }}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <form
        className="mt-4 grid gap-3 rounded-3xl bg-white p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const response = await fetch("/api/account/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: String(form.get("name") ?? ""),
              line1: String(form.get("line1") ?? ""),
              line2: String(form.get("line2") ?? ""),
              city: String(form.get("city") ?? ""),
              region: String(form.get("region") ?? ""),
              postal: String(form.get("postal") ?? ""),
              isDefault: form.get("isDefault") === "on" || addresses.length === 0,
            }),
          });
          const data = (await response.json()) as { error?: string };
          if (!response.ok) {
            onMessage(data.error ?? "The address could not be saved.");
            return;
          }
          onMessage("Address saved.");
          event.currentTarget.reset();
          void load();
        }}
      >
        <label className="text-sm">Full name<Input className="mt-2" name="name" required autoComplete="name" /></label>
        <label className="text-sm">Address<Input className="mt-2" name="line1" required autoComplete="address-line1" /></label>
        <label className="text-sm">Apartment, suite <span className="text-muted">(optional)</span><Input className="mt-2" name="line2" autoComplete="address-line2" /></label>
        <label className="text-sm">City<Input className="mt-2" name="city" required autoComplete="address-level2" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            State
            <select className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" name="region" required defaultValue="TX">
              {US_STATES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm">ZIP<Input className="mt-2" name="postal" required inputMode="numeric" autoComplete="postal-code" minLength={5} maxLength={10} /></label>
        </div>
        <label className="text-sm"><input type="checkbox" name="isDefault" /> Use as the default ship-to address</label>
        <Button type="submit" size="sm">Save address</Button>
      </form>
    </section>
  );
}
