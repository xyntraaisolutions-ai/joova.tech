"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Device = {
  id: string;
  serial: string;
  model: string;
  email: string;
  purchaseDate: string | null;
  purchasedFrom: string;
  coverageEnds: string;
  hasReceipt: boolean;
  removed: boolean;
};

export function WarrantyDesk() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/portal/warranty");
    if (!response.ok) {
      setMessage("Warranty devices could not be loaded.");
      return;
    }
    const body = (await response.json()) as { devices?: Device[] };
    setDevices(body.devices ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="rounded-3xl bg-white p-4">
      <h2 className="font-display text-2xl">Warranty devices</h2>
      <p className="mt-2 text-sm text-muted">Coverage end dates for registered devices. Page wording is in Page copy, under warranty.</p>
      {message ? <p role="status" className="mt-3">{message}</p> : null}
      <ul className="mt-4 space-y-3">
        {devices.filter((device) => !device.removed).map((device) => (
          <li key={device.id}>
            <form
              className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const response = await fetch("/api/portal/warranty", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: device.id, coverageEnds: String(form.get("coverageEnds") ?? "") }),
                });
                const data = (await response.json()) as { error?: string };
                setMessage(response.ok ? "Coverage date saved." : data.error ?? "The coverage date could not be saved.");
                if (response.ok) void load();
              }}
            >
              <p className="text-sm">
                <span className="font-bold">{device.serial || device.model}</span>
                <span className="text-muted"> · {device.email || "No email"} · {device.purchasedFrom || "Seller not set"}{device.hasReceipt ? " · Receipt on file" : ""}</span>
              </p>
              <label className="text-sm">
                Coverage ends
                <Input className="mt-2" type="date" name="coverageEnds" defaultValue={device.coverageEnds} required />
              </label>
              <Button type="submit" size="sm">Save</Button>
            </form>
          </li>
        ))}
      </ul>
      {devices.filter((device) => !device.removed).length === 0 ? <p className="mt-3 text-sm text-muted">No registered devices yet.</p> : null}
    </section>
  );
}
