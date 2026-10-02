"use client";

import { useEffect, useState } from "react";
import { OrderOrigin } from "@/components/orders/order-origin";
import { CarrierRates } from "@/components/portal/carrier-rates";
import { SerialUnits } from "@/components/portal/serial-units";
import { ShippingOptions } from "@/components/portal/shipping-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { purchaseText } from "@/lib/content/variants";
import { cn, formatUsd } from "@/lib/utils";

type Stage = "open" | "shipped" | "delivered" | "all";

type Item = {
  id?: string;
  product_id: string;
  name: string;
  quantity?: number;
  color?: string | null;
  selection?: { color?: string; type?: string; size?: string; custom?: string; sku?: string } | null;
};

type Shipment = {
  carrier: string | null;
  tracking_number: string | null;
  status: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
};

type WarehouseReturn = {
  id: string;
  order_id: string;
  email: string;
  reason: string;
  resolution?: string;
  status: string;
  decision_note?: string;
  customer_reply?: string;
  orders?: {
    subtotal?: number;
    shipping?: { name?: string; line1?: string; city?: string; region?: string; postal?: string } | null;
    order_items?: Item[];
  } | {
    subtotal?: number;
    shipping?: { name?: string; line1?: string; city?: string; region?: string; postal?: string } | null;
    order_items?: Item[];
  }[] | null;
};

type Order = {
  id: string;
  email: string;
  status: string;
  payment_status?: string;
  subtotal?: number;
  created_at?: string;
  stock_committed_at?: string | null;
  shipping?: { name?: string; line1?: string; line2?: string; city?: string; region?: string; postal?: string; country?: string } | null;
  order_items: Item[];
  shipments: Shipment[];
  order_kind?: string | null;
  warranty_claims?: { order_id?: string } | { order_id?: string }[] | null;
  source_return?: { order_id?: string } | { order_id?: string }[] | null;
};

const steps = ["pending_payment", "preparing", "shipped", "out_for_delivery", "delivered"] as const;

const stepLabel: Record<string, string> = {
  pending_payment: "Placed",
  preparing: "Preparing",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  unpaid: "Unpaid",
  paid: "Paid",
};

const nextStatus: Record<string, "preparing" | "shipped" | "out_for_delivery" | "delivered" | null> = {
  pending_payment: "preparing",
  preparing: "shipped",
  shipped: "out_for_delivery",
  out_for_delivery: "delivered",
  delivered: null,
};

const nextLabel: Record<string, string> = {
  preparing: "Start preparing",
  shipped: "Mark shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Mark delivered",
};

function label(value: string) {
  return stepLabel[value] ?? value.replaceAll("_", " ");
}

function when(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function FulfillmentDesk() {
  const [view, setView] = useState<"orders" | "returns" | "serials" | "settings">("orders");
  const [warehouseReturns, setWarehouseReturns] = useState<WarehouseReturn[]>([]);
  const [returnCounts, setReturnCounts] = useState({ approved: 0, received: 0 });
  const [stage, setStage] = useState<Stage>("open");
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState({ open: 0, shipped: 0, delivered: 0, all: 0, products: 0 });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void load("open", "");
    void loadReturns("");
  }, []);

  async function load(nextStage = stage, query = q) {
    setError("");
    const response = await fetch(`/api/portal/fulfillment?stage=${nextStage}&q=${encodeURIComponent(query)}`);
    const data = (await response.json()) as { orders?: Order[]; counts?: typeof counts; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Orders could not be loaded.");
      return;
    }
    setOrders(data.orders ?? []);
    if (data.counts) setCounts(data.counts);
  }

  async function loadReturns(query = q) {
    setError("");
    const response = await fetch(`/api/portal/fulfillment?stage=returns&q=${encodeURIComponent(query)}`);
    const data = (await response.json()) as { returns?: WarehouseReturn[]; returnCounts?: typeof returnCounts; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Returns could not be loaded.");
      return;
    }
    setWarehouseReturns(data.returns ?? []);
    if (data.returnCounts) setReturnCounts(data.returnCounts);
  }

  const tabs: { id: Stage; label: string }[] = [
    { id: "open", label: "To fulfill" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
    { id: "all", label: "All" },
  ];

  return (
    <div className="mt-8">
      <nav className="flex flex-wrap gap-2" aria-label="Fulfillment">
        <button
          type="button"
          aria-pressed={view === "orders"}
          className={cn(
            "min-h-11 rounded-full px-4 text-sm font-bold",
            view === "orders" ? "bg-ink text-paper" : "border border-stone text-ink",
          )}
          onClick={() => setView("orders")}
        >
          Orders
        </button>
        <button
          type="button"
          aria-pressed={view === "returns"}
          className={cn(
            "min-h-11 rounded-full px-4 text-sm font-bold",
            view === "returns" ? "bg-ink text-paper" : "border border-stone text-ink",
          )}
          onClick={() => {
            setView("returns");
            setNotice("");
            void loadReturns();
          }}
        >
          Returns ({returnCounts.approved + returnCounts.received})
        </button>
        <button
          type="button"
          aria-pressed={view === "serials"}
          className={cn(
            "min-h-11 rounded-full px-4 text-sm font-bold",
            view === "serials" ? "bg-ink text-paper" : "border border-stone text-ink",
          )}
          onClick={() => {
            setView("serials");
            setNotice("");
            setError("");
          }}
        >
          Serials
        </button>
        <button
          type="button"
          aria-pressed={view === "settings"}
          className={cn(
            "min-h-11 rounded-full px-4 text-sm font-bold",
            view === "settings" ? "bg-ink text-paper" : "border border-stone text-ink",
          )}
          onClick={() => setView("settings")}
        >
          Settings
        </button>
      </nav>
      {view === "serials" ? <SerialUnits /> : null}
      {view === "settings" ? (
        <div className="mt-6 space-y-6">
          <ShippingOptions />
          <CarrierRates />
        </div>
      ) : null}
      {view === "returns" ? (
        <div className="mt-6">
          <p className="text-sm text-muted">Approved returns arrive here. Mark a package received. Support refunds the original payment or creates the exchange order after that.</p>
          <form
            className="mt-4 flex flex-wrap gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void loadReturns();
            }}
          >
            <label className="min-w-64 flex-1">
              <span className="text-sm text-ink">Search order number or email</span>
              <Input className="mt-2" value={q} onChange={(event) => setQ(event.target.value)} />
            </label>
            <Button type="submit" className="self-end">Search</Button>
          </form>
          {error ? <p className="mt-3" role="alert">{error}</p> : null}
          {notice ? <p className="mt-3" role="status">{notice}</p> : null}
          <p className="mt-4 text-sm text-muted">{returnCounts.approved} waiting to be received · {returnCounts.received} received</p>
          <p className="mt-2 text-sm text-muted">Received packages stay here until Support takes the next step. A refund appears on the original payment method 5 to 10 business days after the item is received. An exchange order ships like a new order.</p>
          {warehouseReturns.length === 0 ? (
            <p className="mt-4 text-muted">{q ? "No returns match that search." : "No approved returns are waiting."}</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {warehouseReturns.map((item) => {
                const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;
                return (
                  <li key={item.id} className="rounded-3xl bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{item.order_id}</p>
                        <p className="text-sm text-muted">{item.email}</p>
                      </div>
                      <p className="text-sm font-bold">{item.status === "approved" ? "Approved" : "Received"} · {item.resolution === "exchange" ? "Exchange" : "Refund"}</p>
                    </div>
                    <p className="mt-3 text-sm">{item.reason}</p>
                    {item.customer_reply ? <p className="mt-2 text-sm text-muted">Customer reply: {item.customer_reply}</p> : null}
                    {order?.order_items?.length ? (
                      <ul className="mt-2 text-sm text-muted">
                        {order.order_items.map((line) => (
                          <li key={`${item.id}-${line.name}`}>
                            {line.name}{line.quantity ? ` × ${line.quantity}` : ""}
                            {purchaseText(line.selection, line.color ?? undefined) ? ` · ${purchaseText(line.selection, line.color ?? undefined)}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="mt-4">
                      {item.status === "approved" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={async () => {
                            const response = await fetch("/api/portal/fulfillment", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "receive", id: item.id }),
                            });
                            const data = (await response.json()) as { error?: string };
                            if (!response.ok) {
                              setError(data.error ?? "The return could not be marked received.");
                              return;
                            }
                            setNotice("Return marked received.");
                            setError("");
                            await loadReturns();
                          }}
                        >
                          Mark received
                        </Button>
                      ) : (
                        <p className="text-sm text-muted">
                          Received. Support {item.resolution === "exchange" ? "creates the exchange order." : "refunds the original payment."}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
      {view === "orders" ? (
      <>
      <form
        className="mt-6 flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <label className="min-w-64 flex-1">
          <span className="text-sm text-ink">Search order number or email</span>
          <Input className="mt-2" value={q} onChange={(event) => setQ(event.target.value)} />
        </label>
        <Button type="submit" className="self-end">Search</Button>
      </form>
      {error ? <p className="mt-3" role="alert">{error}</p> : null}
      {notice ? <p className="mt-3" role="status">{notice}</p> : null}
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Fulfillment queue">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={stage === tab.id}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-bold",
              stage === tab.id ? "bg-ink text-paper" : "border border-stone text-ink",
            )}
            onClick={() => {
              setStage(tab.id);
              setNotice("");
              void load(tab.id);
            }}
          >
            {tab.label} ({counts[tab.id]})
          </button>
        ))}
      </nav>
      {orders.length === 0 ? (
        <p className="mt-6 text-muted">{q ? "No orders match that search." : "No orders in this queue."}</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <OrderFulfillment
              key={order.id}
              order={order}
              onDone={async (message) => {
                setNotice(message);
                await load();
              }}
            />
          ))}
        </ul>
      )}
      </>
      ) : null}
    </div>
  );
}

function OrderFulfillment({
  order,
  onDone,
}: {
  order: Order;
  onDone: (message: string) => Promise<void>;
}) {
  const shipment = order.shipments[0];
  const current = steps.includes(order.status as (typeof steps)[number]) ? order.status : "pending_payment";
  const upcoming = nextStatus[current];
  const [carrier, setCarrier] = useState(shipment?.carrier ?? "");
  const [tracking, setTracking] = useState(shipment?.tracking_number ?? "");
  const [pending, setPending] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const rank = steps.indexOf(current as (typeof steps)[number]);
  const advancing = pending !== null && pending !== current;
  const commitsStock = advancing && (pending === "shipped" || pending === "out_for_delivery" || pending === "delivered") && !order.stock_committed_at;

  async function save(status: "preparing" | "shipped" | "out_for_delivery" | "delivered") {
    setDialogError("");
    if ((status === "shipped" || status === "out_for_delivery" || status === "delivered") && (!carrier.trim() || !tracking.trim())) {
      setDialogError("Add a carrier and a tracking number before shipping.");
      return;
    }
    setBusy(true);
    const response = await fetch("/api/portal/fulfillment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: order.id, carrier, tracking, status }),
    });
    const data = (await response.json()) as { error?: string; emailError?: string };
    setBusy(false);
    if (!response.ok) {
      setDialogError(data.error ?? "The shipment could not be saved.");
      return;
    }
    setPending(null);
    await onDone(data.emailError || (status === current ? "Shipment saved." : `${order.id} is now ${label(status).toLowerCase()}.`));
  }

  return (
    <li className="rounded-3xl border border-stone bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">{order.id}</p>
          <OrderOrigin order={order} />
          <p className="break-all text-sm text-muted">{order.email}</p>
        </div>
        <p className="text-sm text-muted">
          {order.payment_status ? `${label(order.payment_status)} · ` : ""}
          {typeof order.subtotal === "number" ? `${formatUsd(Number(order.subtotal))} · ` : ""}
          {when(order.created_at)}
        </p>
      </div>
      <ol className="mt-4 flex flex-wrap gap-2" aria-label="Fulfillment steps">
        {steps.map((step, index) => (
          <li
            key={step}
            className={cn(
              "rounded-full px-3 py-1 text-sm",
              index < rank && "text-muted",
              index === rank && "bg-ink font-bold text-paper",
              index > rank && "border border-stone text-muted",
            )}
            aria-current={index === rank ? "step" : undefined}
          >
            {label(step)}
          </li>
        ))}
      </ol>
      {order.shipping?.line1 ? (
        <p className="mt-4 text-sm">
          Ship to {order.shipping.name}<br />
          {order.shipping.line1}
          {order.shipping.line2 ? <><br />{order.shipping.line2}</> : null}
          <br />
          {[order.shipping.city, order.shipping.region, order.shipping.postal].filter(Boolean).join(", ")}
        </p>
      ) : null}
      <p className="mt-4">
        <a className="text-sm font-bold text-ink underline" href={`/api/portal/fulfillment/slip?order=${encodeURIComponent(order.id)}`} target="_blank" rel="noreferrer">
          Packing slip
        </a>
      </p>
      <ul className="mt-4 text-sm text-muted">
        {order.order_items.map((item) => (
          <li key={item.id ?? item.product_id}>
            {item.name}
            {item.quantity ? ` × ${item.quantity}` : ""}
            {item.selection?.sku ? ` · ${item.selection.sku}` : ""}
            {purchaseText(item.selection, item.color ?? undefined) ? ` · ${purchaseText(item.selection, item.color ?? undefined)}` : ""}
          </li>
        ))}
      </ul>
      {shipment?.shipped_at ? <p className="mt-3 text-sm text-muted">Shipped {when(shipment.shipped_at)}</p> : null}
      {shipment?.delivered_at ? <p className="text-sm text-muted">Delivered {when(shipment.delivered_at)}</p> : null}
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        data-save-feedback="manual"
        onSubmit={(event) => {
          event.preventDefault();
          if (upcoming) setPending(upcoming);
        }}
      >
        <label className="block text-sm">
          Carrier
          <Input className="mt-2" value={carrier} onChange={(event) => setCarrier(event.target.value)} />
        </label>
        <label className="block text-sm">
          Tracking number
          <Input className="mt-2" value={tracking} onChange={(event) => setTracking(event.target.value)} />
        </label>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
          {current !== "pending_payment" ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => setPending(current)}>
              Save tracking
            </Button>
          ) : null}
          {upcoming ? (
            <Button type="submit" size="sm">{nextLabel[upcoming]}</Button>
          ) : (
            <p className="text-sm text-muted">This order is delivered.</p>
          )}
        </div>
      </form>
      {pending ? (
        <div className="mt-4 rounded-3xl border border-stone p-4" role="dialog" aria-labelledby={`fulfill-${order.id}`}>
          <h3 id={`fulfill-${order.id}`} className="font-bold">
            {pending === current ? "Save this shipment?" : `${nextLabel[pending] ?? "Update"}?`}
          </h3>
          <p className="mt-2 text-sm text-muted">
            {commitsStock
              ? "Shipping takes the order quantities off stock on hand."
              : "The customer can look this order up on the tracking page."}
          </p>
          {dialogError ? <p className="mt-2 text-sm" role="alert">{dialogError}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => { setPending(null); setDialogError(""); }}>Go back</Button>
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => void save(pending as "preparing" | "shipped" | "out_for_delivery" | "delivered")}
            >
              {busy ? "Saving" : "Confirm"}
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
