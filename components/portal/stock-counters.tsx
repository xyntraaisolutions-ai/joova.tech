"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const metrics = [
  { id: "lifetime", label: "Lifetime received", detail: "Units received into stock, from the first batch through today." },
  { id: "on_hand", label: "Current stock", detail: "Units in the warehouse now." },
  { id: "available", label: "Available", detail: "Units still open for a new order. A website order lowers this by the quantity ordered." },
  { id: "orders_received", label: "Orders received", detail: "Units on orders that have not shipped yet." },
  { id: "shipping", label: "In shipping", detail: "Units marked shipped." },
  { id: "delivery", label: "Out for delivery", detail: "Units marked out for delivery." },
  { id: "delivered", label: "Delivered", detail: "Units marked delivered." },
  { id: "returns", label: "Returns", detail: "Units on returns that were approved, received, refunded, or closed." },
  { id: "warranty_sent", label: "Warranty replacements", detail: "Claims marked replaced." },
] as const;

type MetricId = (typeof metrics)[number]["id"];

type CountProduct = {
  id: string;
  name: string;
  sku: string | null;
} & Record<MetricId, number>;

type Batch = {
  id: string;
  product_id: string;
  batch_date: string;
  reference: string;
  quantity: number;
  note: string;
};

type Adjustment = {
  id: string;
  product_id: string;
  metric: string;
  previous_value: number;
  next_value: number;
  reason: string;
  created_at: string;
  actor: string | null;
};

const metricName = (id: string) => metrics.find((metric) => metric.id === id)?.label ?? id;

export function StockCounters() {
  const [products, setProducts] = useState<CountProduct[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [metric, setMetric] = useState<MetricId | "">("");
  const [nextValue, setNextValue] = useState("");
  const [step, setStep] = useState<"edit" | "confirm" | "reason">("edit");
  const [reason, setReason] = useState("");
  const [batchDate, setBatchDate] = useState("");
  const [reference, setReference] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [batchStep, setBatchStep] = useState(false);

  async function load(keep = selected) {
    const response = await fetch("/api/portal/inventory/counts");
    const data = (await response.json()) as {
      products?: CountProduct[];
      batches?: Batch[];
      adjustments?: Adjustment[];
      error?: string;
    };
    if (!response.ok) {
      setError(data.error ?? "Counters could not be loaded.");
      return;
    }
    const rows = data.products ?? [];
    setProducts(rows);
    setBatches(data.batches ?? []);
    setAdjustments(data.adjustments ?? []);
    setSelected(rows.some((product) => product.id === keep) ? keep : rows[0]?.id ?? "");
    setError("");
  }

  useEffect(() => {
    void load("");
  }, []);

  const product = products.find((item) => item.id === selected);
  const visible = products.filter((item) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return item.name.toLowerCase().includes(needle) || (item.sku ?? "").toLowerCase().includes(needle);
  });
  const productBatches = batches.filter((batch) => batch.product_id === selected);
  const history = adjustments.filter((row) => row.product_id === selected);

  function beginUpdate(id: MetricId) {
    if (!product) return;
    setMetric(id);
    setNextValue(String(product[id]));
    setStep("edit");
    setReason("");
    setError("");
  }

  async function applyUpdate() {
    if (!product || !metric) return;
    const response = await fetch("/api/portal/inventory/counts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "adjust",
        productId: product.id,
        metric,
        next: Number(nextValue),
        reason,
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "The count could not be updated.");
      return;
    }
    setMetric("");
    setReason("");
    setStep("edit");
    await load(product.id);
  }

  async function addBatch() {
    if (!product) return;
    const response = await fetch("/api/portal/inventory/counts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "batch",
        productId: product.id,
        batchDate,
        reference,
        quantity: Number(quantity),
        note,
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "The batch could not be added.");
      return;
    }
    setReference("");
    setQuantity("");
    setNote("");
    setBatchStep(false);
    await load(product.id);
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-2xl">Counters</h2>
        <p className="mt-2 text-sm text-muted">
          Lifetime receipts, warehouse stock, and where each unit sits from the order through delivery. Updating a count asks twice and keeps the reason.
        </p>
      </div>
      {error ? <p className="text-sm text-band-red" role="alert">{error}</p> : null}
      <label className="block text-sm">
        Find a product
        <Input className="mt-2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or SKU" />
      </label>
      <div className="flex flex-wrap gap-2">
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === selected}
            className={`min-h-11 rounded-full px-4 text-sm ${item.id === selected ? "bg-ink font-bold text-paper" : "border border-stone text-ink"}`}
            onClick={() => {
              setSelected(item.id);
              setMetric("");
              setBatchStep(false);
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
      {product ? (
        <div className="space-y-6">
          <div>
            <h3 className="font-display text-xl">{product.name}</h3>
            <p className="mt-1 text-sm text-muted">{product.sku || "No SKU"}</p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((item) => (
              <div key={item.id} className="rounded-3xl bg-white p-4">
                <dt className="text-sm text-muted">{item.label}</dt>
                <dd className="mt-1 font-display text-3xl font-extrabold">{product[item.id]}</dd>
                <p className="mt-2 text-xs text-muted">{item.detail}</p>
                <Button className="mt-3" type="button" size="sm" variant="secondary" onClick={() => beginUpdate(item.id)}>
                  Update
                </Button>
              </div>
            ))}
          </dl>
          {metric ? (
            <div className="rounded-3xl bg-white p-4">
              <h3 className="font-display text-xl">Update {metricName(metric)}</h3>
              {step === "edit" ? (
                <div className="mt-3 grid gap-3 sm:max-w-xs">
                  <label className="text-sm">
                    New count
                    <Input className="mt-2" inputMode="numeric" value={nextValue} onChange={(event) => setNextValue(event.target.value)} />
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (nextValue.trim() === "" || Number.isNaN(Number(nextValue)) || Number(nextValue) < 0) {
                        setError("Enter a count of 0 or more.");
                        return;
                      }
                      setError("");
                      setStep("confirm");
                    }}
                  >
                    Review update
                  </Button>
                </div>
              ) : null}
              {step === "confirm" ? (
                <div className="mt-3 space-y-3">
                  <p>
                    Update {metricName(metric)} for {product.name} from {product[metric]} to {Number(nextValue)}?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => setStep("edit")}>Go back</Button>
                    <Button type="button" size="sm" onClick={() => setStep("reason")}>Continue</Button>
                  </div>
                </div>
              ) : null}
              {step === "reason" ? (
                <div className="mt-3 grid gap-3 sm:max-w-lg">
                  <p>Add the reason, then confirm the update.</p>
                  <label className="text-sm">
                    Reason
                    <Input className="mt-2" value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} required />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => setStep("confirm")}>Go back</Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (reason.trim().length < 3) {
                          setError("Add a reason of at least 3 characters.");
                          return;
                        }
                        void applyUpdate();
                      }}
                    >
                      Confirm update
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="rounded-3xl bg-white p-4">
            <h3 className="font-display text-xl">Batches</h3>
            <p className="mt-2 text-sm text-muted">Each receipt adds to lifetime received and current stock. The order number is the supplier reference.</p>
            {productBatches.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-muted">
                      <th className="px-2 py-2 font-medium">Batch date</th>
                      <th className="px-2 py-2 font-medium">Order #</th>
                      <th className="px-2 py-2 font-medium">Count</th>
                      <th className="px-2 py-2 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productBatches.map((batch) => (
                      <tr key={batch.id} className="border-t border-stone">
                        <td className="px-2 py-2">{batch.batch_date}</td>
                        <td className="px-2 py-2">{batch.reference || "—"}</td>
                        <td className="px-2 py-2">{batch.quantity}</td>
                        <td className="px-2 py-2">{batch.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">No batches yet.</p>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                Batch date
                <Input className="mt-2" type="date" value={batchDate} onChange={(event) => setBatchDate(event.target.value)} required />
              </label>
              <label className="text-sm">
                Order #
                <Input className="mt-2" value={reference} onChange={(event) => setReference(event.target.value)} />
              </label>
              <label className="text-sm">
                Count
                <Input className="mt-2" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
              </label>
              <label className="text-sm">
                Note
                <Input className="mt-2" value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
            </div>
            {batchStep ? (
              <div className="mt-4 space-y-3">
                <p>Add {Number(quantity)} to {product.name}{reference ? `, order ${reference}` : ""}?</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => setBatchStep(false)}>Go back</Button>
                  <Button type="button" size="sm" onClick={() => void addBatch()}>Add this batch</Button>
                </div>
              </div>
            ) : (
              <Button
                className="mt-4"
                type="button"
                size="sm"
                onClick={() => {
                  if (!batchDate || !quantity.trim() || Number(quantity) < 1) {
                    setError("Enter a batch date and a count of at least 1.");
                    return;
                  }
                  setError("");
                  setBatchStep(true);
                }}
              >
                Review batch
              </Button>
            )}
          </div>
          <div className="rounded-3xl bg-white p-4">
            <h3 className="font-display text-xl">Count changes</h3>
            {history.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {history.map((row) => (
                  <li key={row.id} className="rounded-2xl bg-paper px-4 py-3">
                    {metricName(row.metric)} from {row.previous_value} to {row.next_value}. {row.reason}
                    <span className="mt-1 block text-muted">
                      {row.actor || "Staff"} · {new Date(row.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">No manual count changes yet.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">No products to count yet.</p>
      )}
    </section>
  );
}
