"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SerialUnit = {
  id: string;
  serial: string;
  manufacturerSku: string;
  manufacturerModel: string;
  manufacturerWarranty: string;
  productName: string;
  color: string;
  productType: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type Draft = Omit<SerialUnit, "id" | "createdAt" | "updatedAt">;

const empty: Draft = {
  serial: "",
  manufacturerSku: "",
  manufacturerModel: "",
  manufacturerWarranty: "",
  productName: "",
  color: "",
  productType: "",
  notes: "",
};

function draftFrom(unit: SerialUnit): Draft {
  return {
    serial: unit.serial,
    manufacturerSku: unit.manufacturerSku,
    manufacturerModel: unit.manufacturerModel,
    manufacturerWarranty: unit.manufacturerWarranty,
    productName: unit.productName,
    color: unit.color,
    productType: unit.productType,
    notes: unit.notes,
  };
}

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SerialUnits() {
  const [units, setUnits] = useState<SerialUnit[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "new" | "view" | "edit">("list");
  const [current, setCurrent] = useState<SerialUnit | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  async function load(nextQuery = query) {
    const response = await fetch(`/api/portal/inventory/serials?q=${encodeURIComponent(nextQuery)}`);
    const data = (await response.json()) as { serials?: SerialUnit[]; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Serial numbers could not be loaded.");
      return;
    }
    setUnits(data.serials ?? []);
  }

  useEffect(() => {
    void load("");
  }, []);

  function openNew() {
    setCurrent(null);
    setDraft(empty);
    setMode("new");
    setError("");
    setNotice("");
    setConfirmRemove(false);
  }

  function openView(unit: SerialUnit) {
    setCurrent(unit);
    setDraft(draftFrom(unit));
    setMode("view");
    setError("");
    setNotice("");
    setConfirmRemove(false);
  }

  function setField(key: keyof Draft, value: string) {
    setDraft((item) => ({ ...item, [key]: value }));
  }

  async function save() {
    setBusy(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/portal/inventory/serials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        id: mode === "edit" ? current?.id : undefined,
        ...draft,
      }),
    });
    const data = (await response.json()) as { serial?: SerialUnit; error?: string };
    setBusy(false);
    if (!response.ok || !data.serial) {
      setError(data.error ?? "That serial number could not be saved.");
      return;
    }
    await load();
    setCurrent(data.serial);
    setDraft(draftFrom(data.serial));
    setMode("view");
    setNotice(mode === "edit" ? "Serial number updated." : "Serial number saved. Enter the next unit when you are ready.");
  }

  async function remove() {
    if (!current) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/portal/inventory/serials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", id: current.id }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    setConfirmRemove(false);
    if (!response.ok) {
      setError(data.error ?? "That serial number could not be removed.");
      return;
    }
    setCurrent(null);
    setDraft(empty);
    setMode("list");
    setNotice("Serial number removed.");
    await load();
  }

  const editing = mode === "new" || mode === "edit";

  if (mode === "list") {
    return (
      <section className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Enter each unit from a manufacturer delivery on its own. The serial number is required. The rest can be left blank.</p>
          <Button type="button" onClick={openNew}>Enter a unit</Button>
        </div>
        <form
          className="mt-4 flex flex-wrap gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
        >
          <label className="min-w-64 flex-1 text-sm">
            Search serial, name, SKU, model, color, or type
            <Input className="mt-2" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <Button type="submit" className="self-end">Search</Button>
        </form>
        {error ? <p className="mt-3 text-sm text-band-red" role="alert">{error}</p> : null}
        {notice ? <p className="mt-3 text-sm" role="status">{notice}</p> : null}
        {units.length === 0 ? (
          <p className="mt-4 text-muted">{query ? "No serial numbers match that search." : "No serial numbers yet."}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {units.map((unit) => (
              <li key={unit.id}>
                <button type="button" className="w-full rounded-3xl bg-white p-4 text-left" onClick={() => openView(unit)}>
                  <span className="block font-bold">{unit.serial}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {[unit.productName, unit.color, unit.productType, unit.manufacturerSku].filter(Boolean).join(" · ") || "No other details"}
                    {unit.createdAt ? ` · ${when(unit.createdAt)}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="secondary" onClick={() => { setMode("list"); setError(""); setNotice(""); }}>Back to serial numbers</Button>
        <div className="flex flex-wrap gap-2">
          {mode === "view" && current ? <Button type="button" variant="secondary" onClick={() => setMode("edit")}>Edit</Button> : null}
          {current ? <Button type="button" variant="secondary" onClick={() => setConfirmRemove(true)}>Delete</Button> : null}
          {mode !== "new" ? <Button type="button" onClick={openNew}>Enter the next unit</Button> : null}
        </div>
      </div>
      {error ? <p className="text-sm text-band-red" role="alert">{error}</p> : null}
      {notice ? <p className="text-sm" role="status">{notice}</p> : null}
      <form
        className="grid gap-4 rounded-3xl bg-white p-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (editing) void save();
        }}
      >
        <label className="text-sm md:col-span-2">
          Serial number
          <Input className="mt-2" value={draft.serial} onChange={(event) => setField("serial", event.target.value)} required disabled={!editing} />
        </label>
        <label className="text-sm">
          Manufacturer SKU
          <Input className="mt-2" value={draft.manufacturerSku} onChange={(event) => setField("manufacturerSku", event.target.value)} disabled={!editing} />
          <span className="mt-1 block text-xs text-muted">Optional.</span>
        </label>
        <label className="text-sm">
          Manufacturer model
          <Input className="mt-2" value={draft.manufacturerModel} onChange={(event) => setField("manufacturerModel", event.target.value)} disabled={!editing} />
          <span className="mt-1 block text-xs text-muted">Optional.</span>
        </label>
        <label className="text-sm">
          Manufacturer warranty
          <Input className="mt-2" value={draft.manufacturerWarranty} onChange={(event) => setField("manufacturerWarranty", event.target.value)} disabled={!editing} />
          <span className="mt-1 block text-xs text-muted">Optional.</span>
        </label>
        <label className="text-sm">
          Product name
          <Input className="mt-2" value={draft.productName} onChange={(event) => setField("productName", event.target.value)} disabled={!editing} />
          <span className="mt-1 block text-xs text-muted">Optional.</span>
        </label>
        <label className="text-sm">
          Color
          <Input className="mt-2" value={draft.color} onChange={(event) => setField("color", event.target.value)} disabled={!editing} />
          <span className="mt-1 block text-xs text-muted">Optional.</span>
        </label>
        <label className="text-sm">
          Type
          <Input className="mt-2" value={draft.productType} onChange={(event) => setField("productType", event.target.value)} disabled={!editing} />
          <span className="mt-1 block text-xs text-muted">Optional.</span>
        </label>
        <label className="text-sm md:col-span-2">
          Notes
          <textarea
            className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3 disabled:bg-stone/40"
            value={draft.notes}
            onChange={(event) => setField("notes", event.target.value)}
            disabled={!editing}
          />
          <span className="mt-1 block text-xs text-muted">Optional.</span>
        </label>
        {editing ? <Button type="submit" disabled={busy}>{busy ? "Saving" : mode === "edit" ? "Save changes" : "Save this unit"}</Button> : null}
      </form>
      {confirmRemove ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--fixed-ink)]/45 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5" role="dialog" aria-modal="true" aria-labelledby="remove-serial-title">
            <h2 id="remove-serial-title" className="font-display text-2xl">Delete this serial number?</h2>
            <p className="mt-2 text-sm text-muted">{current?.serial} leaves the list. You can enter that serial again later.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" disabled={busy} onClick={() => void remove()}>Delete serial number</Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmRemove(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
