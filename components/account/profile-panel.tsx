"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Glance = {
  id: "orders" | "returns" | "addresses" | "devices";
  label: string;
  value: string;
  detail: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "J";
}

export function ProfileIdentity({
  name,
  email,
  onLogout,
}: {
  name: string;
  email: string;
  onLogout: () => void;
}) {
  return (
    <section className="rounded-3xl border border-stone bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-bold text-paper"
        >
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-2xl">{name}</p>
          <p className="truncate text-sm text-muted">{email}</p>
        </div>
        <Button type="button" size="sm" variant="secondary" className="w-full sm:w-fit" onClick={onLogout}>
          Sign out
        </Button>
      </div>
    </section>
  );
}

export function ProfilePanel({
  name,
  email,
  ordersReady,
  orderCount,
  returnCount,
  onSaved,
  onOpen,
  onMessage,
}: {
  name: string;
  email: string;
  ordersReady: boolean;
  orderCount: number;
  returnCount: number;
  onSaved: (name: string) => void;
  onOpen: (tab: Glance["id"]) => void;
  onMessage: (value: string, ok?: boolean) => void;
}) {
  const [draft, setDraft] = useState(name);
  const [pending, setPending] = useState(false);
  const [addresses, setAddresses] = useState<number | null>(null);
  const [devices, setDevices] = useState<number | null>(null);

  useEffect(() => {
    setDraft(name);
  }, [name]);

  useEffect(() => {
    let active = true;
    void fetch("/api/account/addresses")
      .then((response) => response.json())
      .then((body: { addresses?: unknown[] }) => {
        if (active) setAddresses(body.addresses?.length ?? 0);
      })
      .catch(() => {
        if (active) setAddresses(0);
      });
    void fetch("/api/warranty/devices")
      .then((response) => response.json())
      .then((body: { devices?: unknown[] }) => {
        if (active) setDevices(body.devices?.length ?? 0);
      })
      .catch(() => {
        if (active) setDevices(0);
      });
    return () => {
      active = false;
    };
  }, []);

  const glances: Glance[] = [
    {
      id: "orders",
      label: "Orders",
      value: ordersReady ? String(orderCount) : "—",
      detail: orderCount === 1 ? "Saved order" : "Saved orders",
    },
    {
      id: "returns",
      label: "Returns",
      value: ordersReady ? String(returnCount) : "—",
      detail: "Free for 30 days after delivery",
    },
    {
      id: "addresses",
      label: "Addresses",
      value: addresses === null ? "—" : String(addresses),
      detail: "United States ship-to",
    },
    {
      id: "devices",
      label: "Devices",
      value: devices === null ? "—" : String(devices),
      detail: "Warranty registration",
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
      <form
        className="rounded-3xl border border-stone bg-white p-5 md:p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          const response = await fetch("/api/account/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: draft }),
          });
          const data = (await response.json()) as { error?: string; name?: string };
          setPending(false);
          if (!response.ok || !data.name) {
            onMessage(data.error ?? "The name could not be saved.", false);
            return;
          }
          onSaved(data.name);
          onMessage("Name saved.");
        }}
      >
        <h2 className="font-display text-2xl">Your details</h2>
        <p className="mt-2 text-sm text-muted">Orders, returns, and warranty registration use this account.</p>
        <label className="mt-5 block text-sm" htmlFor="profile-name">
          Name
          <Input
            id="profile-name"
            className="mt-2"
            name="name"
            autoComplete="name"
            required
            maxLength={80}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        <div className="mt-5">
          <p className="text-sm">Email</p>
          <p className="mt-2 break-all font-bold">{email}</p>
          <p className="mt-1 text-sm text-muted">Order updates and receipts go to this address.</p>
        </div>
        <Button type="submit" className="mt-6 w-full sm:w-fit" size="sm" disabled={pending || draft.trim() === name}>
          {pending ? "Saving" : "Save name"}
        </Button>
      </form>
      <section aria-labelledby="profile-glance">
        <h2 id="profile-glance" className="font-display text-2xl">At a glance</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {glances.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-3xl border border-stone bg-white p-4 text-left hover:border-ink/30"
                onClick={() => onOpen(item.id)}
              >
                <span>
                  <span className="block text-sm text-muted">{item.label}</span>
                  <span className="mt-1 block text-sm">{item.detail}</span>
                </span>
                <span className="font-display text-3xl">{item.value}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
