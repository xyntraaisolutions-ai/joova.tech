"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { batchTotals } from "@/lib/portal/batch-cost";
import { formatUsd } from "@/lib/utils";

const statuses = [
  { id: "draft", label: "Batch draft" },
  { id: "review", label: "Review" },
  { id: "ordered", label: "Ordered" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "delayed", label: "Delayed" },
  { id: "abandoned", label: "Abandoned" },
  { id: "completed", label: "Completed" },
] as const;

type Status = (typeof statuses)[number]["id"];

type CatalogProduct = {
  id: string;
  name: string;
  sku: string;
  model: string;
  manufacturerModel: string;
};

type BatchFile = { id: string; name: string; contentType: string; createdAt: string };

type BatchItem = {
  key: string;
  productId: string;
  productName: string;
  joovaModel: string;
  manufacturerModel: string;
  quantity: string;
  unitPrice: string;
  unitDiscount: string;
  notes: string;
};

type Batch = {
  id: string;
  vendor: string;
  status: Status;
  notes: string;
  shippingCost: number;
  miscCost: number;
  items: Omit<BatchItem, "key">[];
  files: BatchFile[];
  quantity: number;
  total: number;
  updatedAt: string;
};

function blankItem(): BatchItem {
  return {
    key: crypto.randomUUID(),
    productId: "",
    productName: "",
    joovaModel: "",
    manufacturerModel: "",
    quantity: "1",
    unitPrice: "0",
    unitDiscount: "0",
    notes: "",
  };
}

function statusLabel(status: string) {
  return statuses.find((item) => item.id === status)?.label ?? status;
}

function numberValue(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function BatchRequests() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [vendor, setVendor] = useState("");
  const [status, setStatus] = useState<Status>("draft");
  const [notes, setNotes] = useState("");
  const [shippingCost, setShippingCost] = useState("0");
  const [miscCost, setMiscCost] = useState("0");
  const [items, setItems] = useState<BatchItem[]>([blankItem()]);
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  async function load(keepId?: string) {
    const response = await fetch("/api/portal/inventory/batches");
    const data = (await response.json()) as { batches?: Batch[]; products?: CatalogProduct[]; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Batch requests could not be loaded.");
      return;
    }
    setBatches(data.batches ?? []);
    setProducts(data.products ?? []);
    if (keepId) openBatch((data.batches ?? []).find((batch) => batch.id === keepId) ?? null, keepId);
  }

  useEffect(() => {
    void load();
  }, []);

  function openBatch(batch: Batch | null, id: string | null) {
    setSelected(id);
    setError("");
    setConfirmRemove(false);
    if (!batch) {
      setVendor("");
      setStatus("draft");
      setNotes("");
      setShippingCost("0");
      setMiscCost("0");
      setItems([blankItem()]);
      setFiles([]);
      return;
    }
    setVendor(batch.vendor);
    setStatus(batch.status);
    setNotes(batch.notes);
    setShippingCost(String(batch.shippingCost));
    setMiscCost(String(batch.miscCost));
    setItems(batch.items.length ? batch.items.map((item) => ({ ...item, key: crypto.randomUUID() })) : [blankItem()]);
    setFiles(batch.files);
  }

  function updateItem(key: string, patch: Partial<BatchItem>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function chooseProduct(key: string, productId: string) {
    const product = products.find((item) => item.id === productId);
    updateItem(key, {
      productId,
      productName: product?.name ?? "",
      joovaModel: product?.model ?? "",
      manufacturerModel: product?.manufacturerModel ?? "",
    });
  }

  const totals = useMemo(() => batchTotals(
    items.map((item) => ({
      unitPrice: numberValue(item.unitPrice),
      unitDiscount: numberValue(item.unitDiscount),
      quantity: Math.trunc(numberValue(item.quantity)),
    })),
    numberValue(shippingCost),
    numberValue(miscCost),
  ), [items, shippingCost, miscCost]);

  async function save() {
    setBusy(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/portal/inventory/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selected || undefined,
        vendor,
        status,
        notes,
        shippingCost: numberValue(shippingCost),
        miscCost: numberValue(miscCost),
        items: items
          .filter((item) => item.productId || item.productName.trim())
          .map((item) => ({
            productId: item.productId,
            productName: item.productName,
            joovaModel: item.joovaModel,
            manufacturerModel: item.manufacturerModel,
            quantity: Math.trunc(numberValue(item.quantity)),
            unitPrice: numberValue(item.unitPrice),
            unitDiscount: numberValue(item.unitDiscount),
            notes: item.notes,
          })),
      }),
    });
    const data = (await response.json()) as { error?: string; id?: string };
    setBusy(false);
    if (!response.ok || !data.id) {
      setError(data.error ?? "That batch could not be saved.");
      return;
    }
    await load(data.id);
    setNotice("Batch request saved.");
  }

  async function remove() {
    if (!selected) return;
    setBusy(true);
    const response = await fetch("/api/portal/inventory/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", id: selected }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "That batch could not be removed.");
      return;
    }
    setSelected(null);
    setNotice("Batch request removed.");
    await load();
  }

  async function upload(file: File) {
    if (!selected) return;
    setBusy(true);
    setError("");
    const body = new FormData();
    body.set("batchId", selected);
    body.set("file", file);
    const response = await fetch("/api/portal/inventory/batches/file", { method: "POST", body });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "The document could not be saved.");
      return;
    }
    await load(selected);
    setNotice("Document saved.");
  }

  async function removeFile(id: string) {
    setBusy(true);
    const response = await fetch("/api/portal/inventory/batches/file", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    if (!response.ok) {
      setError("That document could not be removed.");
      return;
    }
    if (selected) await load(selected);
  }

  if (selected === null) {
    return (
      <section className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Orders placed with a manufacturer or vendor. Price, discount, shipping, and documents stay on the batch.</p>
          <Button type="button" onClick={() => openBatch(null, "")}>New batch request</Button>
        </div>
        {error ? <p className="mt-3 text-sm text-band-red" role="alert">{error}</p> : null}
        {notice ? <p className="mt-3 text-sm" role="status">{notice}</p> : null}
        {batches.length === 0 ? <p className="mt-4 text-muted">No batch requests yet.</p> : (
          <ul className="mt-4 space-y-3">
            {batches.map((batch) => (
              <li key={batch.id}>
                <button type="button" className="w-full rounded-3xl bg-white p-4 text-left" onClick={() => openBatch(batch, batch.id)}>
                  <span className="flex flex-wrap items-start justify-between gap-3">
                    <span>
                      <span className="block font-bold">{batch.vendor}</span>
                      <span className="mt-1 block text-sm text-muted">{statusLabel(batch.status)} · {batch.quantity} units</span>
                    </span>
                    <span className="text-sm font-bold">{formatUsd(batch.total)}</span>
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
        <Button type="button" variant="secondary" onClick={() => { setSelected(null); setNotice(""); setError(""); }}>Back to batch requests</Button>
        {selected ? <Button type="button" variant="secondary" onClick={() => setConfirmRemove(true)}>Remove batch</Button> : null}
      </div>
      {error ? <p className="text-sm text-band-red" role="alert">{error}</p> : null}
      {notice ? <p className="text-sm" role="status">{notice}</p> : null}
      <div className="grid gap-4 rounded-3xl bg-white p-4 md:grid-cols-2">
        <label className="text-sm">
          Manufacturer or vendor
          <Input className="mt-2" value={vendor} onChange={(event) => setVendor(event.target.value)} required />
        </label>
        <label className="text-sm">
          Status
          <select className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" value={status} onChange={(event) => setStatus(event.target.value as Status)}>
            {statuses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="text-sm md:col-span-2">
          Batch notes
          <textarea className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <label className="text-sm">
          Shipping cost
          <Input className="mt-2" inputMode="decimal" value={shippingCost} onChange={(event) => setShippingCost(event.target.value)} />
          <span className="mt-1 block text-xs text-muted">Optional. Leave 0 when there is no shipping charge.</span>
        </label>
        <label className="text-sm">
          Misc cost
          <Input className="mt-2" inputMode="decimal" value={miscCost} onChange={(event) => setMiscCost(event.target.value)} />
          <span className="mt-1 block text-xs text-muted">Optional. Add fees or other charges any time.</span>
        </label>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const line = batchTotals([{
            unitPrice: numberValue(item.unitPrice),
            unitDiscount: numberValue(item.unitDiscount),
            quantity: Math.trunc(numberValue(item.quantity)),
          }], 0, 0);
          return (
            <div key={item.key} className="rounded-3xl bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-bold">Item {index + 1}</p>
                <Button type="button" size="sm" variant="secondary" onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))}>Remove item</Button>
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <label className="text-sm md:col-span-2">
                  Existing product
                  <select className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" value={item.productId} onChange={(event) => chooseProduct(item.key, event.target.value)}>
                    <option value="">New product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}{product.sku ? ` · ${product.sku}` : ""}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm md:col-span-2">
                  Product name
                  <Input className="mt-2" value={item.productName} onChange={(event) => updateItem(item.key, { productName: event.target.value })} />
                </label>
                <label className="text-sm">
                  Joova model
                  <Input className="mt-2" value={item.joovaModel} onChange={(event) => updateItem(item.key, { joovaModel: event.target.value })} />
                </label>
                <label className="text-sm">
                  Manufacturer model
                  <Input className="mt-2" value={item.manufacturerModel} onChange={(event) => updateItem(item.key, { manufacturerModel: event.target.value })} />
                </label>
                <label className="text-sm">
                  Quantity
                  <Input className="mt-2" inputMode="numeric" value={item.quantity} onChange={(event) => updateItem(item.key, { quantity: event.target.value })} />
                </label>
                <label className="text-sm">
                  Price per unit
                  <Input className="mt-2" inputMode="decimal" value={item.unitPrice} onChange={(event) => updateItem(item.key, { unitPrice: event.target.value })} />
                </label>
                <label className="text-sm">
                  Discount per unit
                  <Input className="mt-2" inputMode="decimal" value={item.unitDiscount} onChange={(event) => updateItem(item.key, { unitDiscount: event.target.value })} />
                </label>
                <p className="self-end text-sm font-bold">Line cost {formatUsd(line.items)}</p>
                <label className="text-sm md:col-span-2">
                  Item notes
                  <textarea className="mt-2 min-h-20 w-full rounded-2xl border border-stone bg-white px-4 py-3" value={item.notes} onChange={(event) => updateItem(item.key, { notes: event.target.value })} />
                </label>
              </div>
            </div>
          );
        })}
        <Button type="button" variant="secondary" onClick={() => setItems((current) => [...current, blankItem()])}>Add item</Button>
      </div>

      <div className="rounded-3xl bg-white p-4 text-sm">
        <p>Total quantity <span className="font-bold">{totals.quantity}</span></p>
        <p className="mt-2">Items <span className="font-bold">{formatUsd(totals.items)}</span></p>
        <p className="mt-2">Shipping <span className="font-bold">{formatUsd(totals.shipping)}</span></p>
        <p className="mt-2">Misc <span className="font-bold">{formatUsd(totals.misc)}</span></p>
        <p className="mt-2">Total cost <span className="font-bold">{formatUsd(totals.total)}</span></p>
      </div>

      <div className="rounded-3xl bg-white p-4">
        <p className="font-bold">Documents and receipts</p>
        {selected ? (
          <>
            <label className="mt-3 block text-sm">
              Add a PDF or picture
              <input
                className="mt-2 block w-full text-sm"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void upload(file);
                }}
              />
            </label>
            {files.length === 0 ? <p className="mt-3 text-sm text-muted">No documents on this batch yet.</p> : (
              <ul className="mt-3 space-y-2">
                {files.map((file) => (
                  <li key={file.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-bold">{file.name}</span>
                    <a className="underline" href={`/api/portal/inventory/batches/file?id=${file.id}`} target="_blank" rel="noopener noreferrer">View</a>
                    <a className="underline" href={`/api/portal/inventory/batches/file?id=${file.id}&download=1`}>Download</a>
                    <button type="button" className="underline" onClick={() => void removeFile(file.id)}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : <p className="mt-2 text-sm text-muted">Save the batch, then add documents. They stay here to view or download later.</p>}
      </div>

      <Button type="button" disabled={busy} onClick={() => void save()}>{busy ? "Saving" : "Save batch request"}</Button>

      {confirmRemove ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--fixed-ink)]/45 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5" role="dialog" aria-modal="true" aria-labelledby="remove-batch-title">
            <h2 id="remove-batch-title" className="font-display text-2xl">Remove this batch?</h2>
            <p className="mt-2 text-sm text-muted">The batch leaves the list. Documents stay in storage until they are removed.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" disabled={busy} onClick={() => void remove()}>Remove batch</Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmRemove(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
