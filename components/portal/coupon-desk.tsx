"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatUsd } from "@/lib/utils";

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

type Redemption = {
  code: string;
  order_id: string;
  email: string;
  discount_amount: number | string;
  redeemed_at: string;
};

const emptyForm = {
  code: "",
  kind: "amount" as "percent" | "amount",
  amount: "",
  maxUses: "",
  startsOn: "",
  endsOn: "",
  enabled: true,
};

function chicagoToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
}

function promoStatus(promo: Promo) {
  const today = chicagoToday();
  if (promo.max_uses !== null && promo.used_count >= promo.max_uses) return "Quota met";
  if (!promo.enabled) return "Expired";
  if (promo.ends_on && today > promo.ends_on) return "Ended";
  if (promo.starts_on && today < promo.starts_on) return "Scheduled";
  return "Active";
}

function when(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function offerText(promo: Pick<Promo, "kind" | "amount">) {
  return promo.kind === "percent" ? `${Number(promo.amount)}% off` : `${formatUsd(Number(promo.amount))} off`;
}

export function CouponDesk({ onError }: { onError: (message: string) => void }) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [selected, setSelected] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  async function load(keep = selected) {
    const response = await fetch("/api/portal/promos");
    const data = (await response.json()) as { promos?: Promo[]; redemptions?: Redemption[]; error?: string };
    if (!response.ok) {
      onError(data.error ?? "Promo codes could not be loaded.");
      return;
    }
    onError("");
    setPromos(data.promos ?? []);
    setRedemptions(data.redemptions ?? []);
    if (keep && (data.promos ?? []).some((promo) => promo.code === keep)) setSelected(keep);
  }

  useEffect(() => {
    void load("");
  }, []);

  const history = useMemo(
    () => redemptions.filter((row) => row.code === selected),
    [redemptions, selected],
  );
  const retired = useMemo(() => {
    const live = new Set(promos.map((promo) => promo.code));
    return [...new Set(redemptions.map((row) => row.code))].filter((code) => !live.has(code));
  }, [promos, redemptions]);

  function startCreate() {
    setEditing(false);
    setSelected("");
    setForm(emptyForm);
  }

  function startEdit(promo: Promo) {
    setEditing(true);
    setSelected(promo.code);
    setForm({
      code: promo.code,
      kind: promo.kind,
      amount: String(promo.amount),
      maxUses: promo.max_uses === null ? "" : String(promo.max_uses),
      startsOn: promo.starts_on ?? "",
      endsOn: promo.ends_on ?? "",
      enabled: promo.enabled,
    });
  }

  async function post(body: unknown) {
    setBusy(true);
    const response = await fetch("/api/portal/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      onError(data.error ?? "That change could not be saved.");
      return false;
    }
    onError("");
    return true;
  }

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Coupons</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            A promo code lowers the merchandise total at checkout. Set a quota and the code turns off automatically when that many paid orders have used it. Usage stays on the order after the code is removed.
          </p>
        </div>
        <Button type="button" size="sm" onClick={startCreate}>New promo code</Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          {promos.length === 0 ? <p className="text-muted">No promo codes yet.</p> : (
            <ul className="space-y-3">
              {promos.map((promo) => {
                const status = promoStatus(promo);
                const open = selected === promo.code;
                return (
                  <li key={promo.code} className="rounded-3xl border border-stone bg-white p-4">
                    <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setSelected(open ? "" : promo.code)}>
                      <span>
                        <span className="font-bold">{promo.code}</span>
                        <span className="mt-1 block text-sm text-muted">{offerText(promo)}</span>
                      </span>
                      <span className={cn("rounded-full px-3 py-1 text-xs font-bold", status === "Active" ? "bg-ink text-paper" : "bg-stone text-ink")}>{status}</span>
                    </button>
                    <p className="mt-3 text-sm text-muted">
                      {promo.used_count}{promo.max_uses ? ` of ${promo.max_uses}` : ""} paid {promo.used_count === 1 ? "use" : "uses"}
                      {promo.starts_on ? ` · starts ${promo.starts_on}` : ""}
                      {promo.ends_on ? ` · ends ${promo.ends_on}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(promo)}>Update</Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busy || !promo.enabled}
                        onClick={() => void post({ action: "expire", code: promo.code }).then((ok) => { if (ok) void load(promo.code); })}
                      >
                        Expire
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          if (!window.confirm(`Remove ${promo.code}? Past orders keep this code in their history.`)) return;
                          void post({ action: "delete", code: promo.code }).then((ok) => {
                            if (!ok) return;
                            if (selected === promo.code) setSelected("");
                            void load("");
                          });
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                    {open ? <UsageList rows={history} /> : null}
                  </li>
                );
              })}
            </ul>
          )}
          {retired.length > 0 ? (
            <div className="mt-6">
              <h3 className="font-bold">Removed codes</h3>
              <p className="mt-1 text-sm text-muted">These codes were deleted. Paid orders that used them are still listed.</p>
              <ul className="mt-3 space-y-3">
                {retired.map((code) => (
                  <li key={code} className="rounded-3xl border border-stone bg-white p-4">
                    <button type="button" className="font-bold" onClick={() => setSelected(selected === code ? "" : code)}>{code}</button>
                    {selected === code ? <UsageList rows={history} /> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <form
          className="h-fit rounded-3xl border border-stone bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const max = form.maxUses.trim();
            void post({
              action: "save",
              code: form.code,
              kind: form.kind,
              amount: Number(form.amount),
              startsOn: form.startsOn || null,
              endsOn: form.endsOn || null,
              maxUses: max ? Number(max) : null,
              enabled: form.enabled,
            }).then((ok) => {
              if (!ok) return;
              const code = form.code.trim().toUpperCase();
              setEditing(true);
              setSelected(code);
              setForm((current) => ({ ...current, code }));
              void load(code);
            });
          }}
        >
          <h3 className="font-bold">{editing ? `Update ${form.code}` : "Create a promo code"}</h3>
          <label className="mt-4 block text-sm">
            Code
            <Input
              className="mt-2 uppercase"
              value={form.code}
              required
              minLength={2}
              maxLength={40}
              readOnly={editing}
              autoCapitalize="characters"
              onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
            />
          </label>
          <label className="mt-3 block text-sm">
            Kind
            <select
              className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4"
              value={form.kind}
              onChange={(event) => setForm({ ...form, kind: event.target.value === "percent" ? "percent" : "amount" })}
            >
              <option value="amount">Dollar amount</option>
              <option value="percent">Percent</option>
            </select>
          </label>
          <label className="mt-3 block text-sm">
            Amount
            <Input className="mt-2" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          </label>
          <label className="mt-3 block text-sm">
            Quota <span className="text-muted">(optional)</span>
            <Input className="mt-2" type="number" min="1" step="1" value={form.maxUses} onChange={(event) => setForm({ ...form, maxUses: event.target.value })} />
          </label>
          <p className="mt-1 text-xs text-muted">When paid uses reach this number, the code expires on its own.</p>
          <label className="mt-3 block text-sm">
            Starts <span className="text-muted">(optional)</span>
            <Input className="mt-2" type="date" value={form.startsOn} onChange={(event) => setForm({ ...form, startsOn: event.target.value })} />
          </label>
          <label className="mt-3 block text-sm">
            Ends <span className="text-muted">(optional)</span>
            <Input className="mt-2" type="date" value={form.endsOn} onChange={(event) => setForm({ ...form, endsOn: event.target.value })} />
          </label>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />
            Available at checkout
          </label>
          <Button className="mt-4" type="submit" size="sm" disabled={busy}>{editing ? "Save changes" : "Create promo code"}</Button>
        </form>
      </div>
    </section>
  );
}

function UsageList({ rows }: { rows: Redemption[] }) {
  if (rows.length === 0) return <p className="mt-3 text-sm text-muted">No paid orders have used this code yet.</p>;
  return (
    <ul className="mt-3 space-y-2 border-t border-stone pt-3 text-sm">
      {rows.map((row) => (
        <li key={row.order_id}>
          <span className="font-bold">{row.order_id}</span>
          <span className="text-muted"> · {row.email} · {when(row.redeemed_at)} · {formatUsd(Number(row.discount_amount))}</span>
        </li>
      ))}
    </ul>
  );
}
