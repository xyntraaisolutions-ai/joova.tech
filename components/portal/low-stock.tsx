"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Rule = {
  enabled: boolean;
  threshold: number;
  notify: boolean;
  emails: string[];
};

type LowRow = {
  productId: string;
  name: string;
  sku: string;
  available: number;
  threshold: number;
  notify: boolean;
  emails: string[];
};

export function LowStockList() {
  const [rows, setRows] = useState<LowRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/portal/inventory/low-stock")
      .then((response) => response.json())
      .then((data: { rows?: LowRow[]; error?: string }) => {
        if (data.error) setError(data.error);
        setRows(data.rows ?? []);
      });
  }, []);

  return (
    <section className="mt-6">
      <p className="text-sm text-muted">Products whose low stock flag is on and whose available count is at or below the threshold. Available is on hand minus reserved.</p>
      {error ? <p className="mt-3 text-sm text-band-red" role="alert">{error}</p> : null}
      {rows.length === 0 ? <p className="mt-4 text-muted">No products are at their low stock level.</p> : (
        <div className="mt-4 overflow-x-auto rounded-3xl bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-stone">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Threshold</th>
                <th className="px-4 py-3">Notification</th>
                <th className="px-4 py-3">Watchers</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.productId} className="border-b border-stone last:border-0">
                  <td className="px-4 py-3 font-bold">
                    <Link className="underline" href={`/portal/inventory?product=${row.productId}`}>{row.name}</Link>
                  </td>
                  <td className="px-4 py-3">{row.sku || "—"}</td>
                  <td className="px-4 py-3">{row.available}</td>
                  <td className="px-4 py-3">{row.threshold}</td>
                  <td className="px-4 py-3">{row.notify ? "On" : "Off"}</td>
                  <td className="px-4 py-3">{row.emails.length ? row.emails.join(", ") : "Support inbox"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function LowStockSetup({ productId, saved }: { productId: string; saved: boolean }) {
  const [rule, setRule] = useState<Rule>({ enabled: false, threshold: 5, notify: true, emails: [] });
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!saved || !productId) return;
    void fetch(`/api/portal/inventory/low-stock?product=${encodeURIComponent(productId)}`)
      .then((response) => response.json())
      .then((data: { rule?: Rule; error?: string }) => {
        if (data.rule) setRule(data.rule);
        if (data.error) setError(data.error);
      });
  }, [productId, saved]);

  if (!saved) {
    return <p className="mt-4 text-sm text-muted">Save the product, then set the low stock rule.</p>;
  }

  async function save() {
    setBusy(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/portal/inventory/low-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, ...rule }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "The low stock rule could not be saved.");
      return;
    }
    setNotice("Low stock rule saved.");
  }

  function addEmail() {
    const next = email.trim().toLowerCase();
    if (!next.includes("@") || rule.emails.includes(next)) return;
    setRule((current) => ({ ...current, emails: [...current.emails, next] }));
    setEmail("");
  }

  return (
    <div className="mt-4 max-w-xl space-y-4 rounded-3xl bg-white p-4">
      <p className="text-sm text-muted">Turn the flag on to watch available stock. When available falls to the threshold or below, the product appears on Low level stock. Notification sends that change to the watcher emails. With no watcher listed, it goes to the support inbox.</p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={rule.enabled} onChange={(event) => setRule((current) => ({ ...current, enabled: event.target.checked }))} />
        Low stock flag
      </label>
      <label className="block text-sm">
        Threshold
        <Input className="mt-2" inputMode="numeric" value={String(rule.threshold)} onChange={(event) => setRule((current) => ({ ...current, threshold: Math.max(0, Math.trunc(Number(event.target.value) || 0)) }))} />
        <span className="mt-1 block text-xs text-muted">Available units. Available is on hand minus reserved.</span>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={rule.notify} onChange={(event) => setRule((current) => ({ ...current, notify: event.target.checked }))} />
        Send a notification when stock reaches this level
      </label>
      <div className="text-sm">
        <label>
          Watcher email
          <Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <Button className="mt-2" type="button" size="sm" variant="secondary" onClick={addEmail}>Add email</Button>
        {rule.emails.length ? (
          <ul className="mt-3 space-y-2">
            {rule.emails.map((watcher) => (
              <li key={watcher} className="flex items-center justify-between gap-3">
                <span>{watcher}</span>
                <button type="button" className="underline" onClick={() => setRule((current) => ({ ...current, emails: current.emails.filter((item) => item !== watcher) }))}>Remove</button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-xs text-muted">No watchers yet. Notification uses the support inbox.</p>}
      </div>
      {error ? <p className="text-sm text-band-red" role="alert">{error}</p> : null}
      {notice ? <p className="text-sm" role="status">{notice}</p> : null}
      <Button type="button" disabled={busy} onClick={() => void save()}>Save low stock rule</Button>
    </div>
  );
}
