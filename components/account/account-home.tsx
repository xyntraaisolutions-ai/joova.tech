"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SavedAddresses } from "@/components/account/saved-addresses";
import { TrackLookup } from "@/components/track/track-lookup";
import { purchaseText } from "@/lib/content/variants";
import { orderStatusLabel } from "@/lib/orders/status";
import { cn, formatUsd } from "@/lib/utils";

type DeviceClaim = {
  id: string;
  status: string;
  message: string;
  decisionNote?: string;
  customerReply?: string;
};

type Device = {
  id: string;
  serial: string;
  model: string;
  name?: string;
  status: string;
  coverageEnds: string;
  purchaseDate?: string | null;
  coverage?: string[];
  claim?: DeviceClaim | null;
};

const claimCopy: Record<string, string> = {
  open: "Claim sent. Support is reviewing it and replies within 6 to 24 hours.",
  reviewing: "Support is reviewing this claim.",
  needs_info: "Support needs more information before this claim can continue.",
  approved: "Approved. A replacement order ships like a new order.",
  replaced: "Closed. The replacement order ships like a new order.",
  closed: "This claim is closed.",
};

const claimLabel: Record<string, string> = {
  open: "Open",
  reviewing: "Reviewing",
  needs_info: "More information",
  approved: "Approved",
  replaced: "Replaced",
  closed: "Closed",
};

function claimIsOpen(status?: string) {
  return Boolean(status) && status !== "closed" && status !== "replaced";
}

function MyDevices({ onMessage }: { email: string; name: string; onMessage: (value: string, ok?: boolean) => void }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [pending, setPending] = useState("");

  function loadDevices() {
    void fetch("/api/warranty/devices")
      .then((response) => response.json())
      .then((body: { devices?: Device[] }) => setDevices(body.devices ?? []));
  }

  useEffect(() => {
    loadDevices();
  }, []);

  return (
    <section id="devices" className="scroll-mt-24">
      <h2 className="font-display text-2xl">My Devices</h2>
      <p className="mt-2 text-sm text-muted">Start a claim on a registered device while coverage is active. Support reviews it, asks for more information when needed, and closes it after a repair or replacement.</p>
      {devices.length === 0 ? (
        <p className="mt-3 text-muted">
          No registered devices yet. Register from the{" "}
          <Link className="font-bold text-ink underline" href="/warranty#register">warranty page</Link>.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {devices.map((device) => {
            const claim = device.claim;
            const ended = device.status === "Ended";
            const active = claimIsOpen(claim?.status);
            return (
              <li key={device.id} className="rounded-3xl bg-white p-4">
                <p className="font-bold">{device.serial || device.model}</p>
                <p className="text-sm">{device.status}</p>
                <p className="text-sm text-muted">
                  {device.name ? `${device.name}. ` : ""}
                  {device.coverageEnds ? `Coverage ends ${device.coverageEnds}` : "Coverage end date is set when the device is registered."}
                </p>
                {device.coverage?.length ? (
                  <ul className="mt-2 space-y-1 text-sm text-muted">
                    {device.coverage.map((line) => <li key={line}>{line}</li>)}
                  </ul>
                ) : null}
                {claim ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-bold">{claimLabel[claim.status] ?? "Open"}</p>
                    <p className="text-sm">{claimCopy[claim.status] ?? claimCopy.open}</p>
                    <p className="text-sm text-muted">You sent: {claim.message}</p>
                    {claim.decisionNote ? <p className="text-sm text-muted">{claim.decisionNote}</p> : null}
                    {claim.customerReply ? <p className="text-sm text-muted">You replied: {claim.customerReply}</p> : null}
                  </div>
                ) : null}
                {claim?.status === "needs_info" ? (
                  <form
                    className="mt-3 space-y-2"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      setPending(device.id);
                      const response = await fetch("/api/warranty", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "reply",
                          id: claim.id,
                          note: String(form.get("note") ?? ""),
                        }),
                      });
                      const data = (await response.json()) as { ok?: boolean; error?: string };
                      setPending("");
                      onMessage(data.ok ? "Information sent. Support will review the claim again." : data.error ?? "The claim could not be updated.", data.ok);
                      if (data.ok) loadDevices();
                    }}
                  >
                    <label className="block text-sm">
                      More information
                      <Input className="mt-2" name="note" required minLength={3} />
                    </label>
                    <Button type="submit" size="sm" variant="secondary" disabled={pending === device.id}>Send information</Button>
                  </form>
                ) : null}
                {!active && !ended ? (
                  <form
                    className="mt-3 space-y-2"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      setPending(device.id);
                      const response = await fetch("/api/warranty", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          registrationId: device.id,
                          message: String(form.get("message") ?? ""),
                        }),
                      });
                      const data = (await response.json()) as { ok?: boolean; already?: boolean; error?: string };
                      setPending("");
                      onMessage(data.ok
                        ? data.already
                          ? "This device already has an open claim."
                          : "Warranty claim sent. Support replies within 6 to 24 hours."
                        : data.error ?? "The claim could not be sent.", data.ok);
                      if (data.ok) loadDevices();
                    }}
                  >
                    <label className="block text-sm">
                      What happened
                      <textarea name="message" required minLength={3} className="mt-2 min-h-20 w-full rounded-2xl border border-stone bg-white px-4 py-3 text-[17px]" />
                    </label>
                    <Button type="submit" size="sm" variant="secondary" disabled={pending === device.id}>Start warranty claim</Button>
                  </form>
                ) : null}
                {ended && !claim ? <p className="mt-3 text-sm text-muted">Coverage has ended, so a new claim cannot be started.</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const returnLabels: Record<string, string> = {
  requested: "Requested",
  needs_info: "More information",
  approved: "Approved",
  rejected: "Rejected",
  received: "Received",
  refunded: "Refunded",
  reopened: "Reopened",
  exchange_ordered: "Exchange order",
  closed: "Closed",
};

function returnStatus(status?: string, resolution?: string) {
  const exchange = resolution === "exchange";
  if (status === "approved") {
    return exchange
      ? "Approved. Pack the product and send it back. A similar item is sent after we receive this one."
      : "Approved. Pack the product and send it back. The refund is issued after we receive the item. It appears on the original payment method 5 to 10 business days after the item is received.";
  }
  if (status === "received") {
    return exchange
      ? "We received the item. Support is creating a replacement order. It ships like a new order."
      : "We received the item. Support sends the refund to the original payment method. It appears in 5 to 10 business days.";
  }
  if (status === "exchange_ordered") return "A replacement order is being prepared. It ships like a new order.";
  if (status === "refunded") return "The refund was sent to the original payment method. It appears 5 to 10 business days after we received the item.";
  if (status === "closed") {
    return exchange
      ? "Closed. The replacement order ships like a new order."
      : "Closed. The refund was sent to the original payment method. It appears 5 to 10 business days after we received the item.";
  }
  if (status === "reopened") return "Support reopened this return. You can request it again.";
  if (status === "rejected") return "This return was not approved. Support can reopen it if you should be able to request again.";
  if (status === "needs_info") return "Support needs more information before this return can be approved.";
  return "Requested. Support is reviewing this against the 30-day return policy.";
}

function ReturnChoiceForm({
  orderId,
  email,
  onMessage,
  onReload,
}: {
  orderId: string;
  email: string;
  onMessage: (value: string, ok?: boolean) => void;
  onReload: () => void;
}) {
  return (
    <form
      className="mt-4 space-y-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/returns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order: orderId,
            email,
            reason: String(form.get("reason") ?? ""),
            resolution: String(form.get("resolution") ?? ""),
          }),
        });
        const data = (await response.json()) as { error?: string; ok?: boolean };
        onMessage(data.ok ? "Return requested." : data.error ?? "The return could not be started.", data.ok);
        if (data.ok) onReload();
      }}
    >
      <fieldset>
        <legend className="text-sm">What should we do after we receive it?</legend>
        <label className="mt-2 flex items-start gap-3 text-sm">
          <input className="mt-1" type="radio" name="resolution" value="refund" defaultChecked required />
          <span>Refund. Issued after we receive the item. It appears on the original payment method in 5 to 10 business days.</span>
        </label>
        <label className="mt-2 flex items-start gap-3 text-sm">
          <input className="mt-1" type="radio" name="resolution" value="exchange" required />
          <span>Exchange for a similar item. A replacement order ships like a new order after we receive this one.</span>
        </label>
      </fieldset>
      <label className="block text-sm">
        Return reason
        <Input className="mt-2" name="reason" required minLength={3} />
      </label>
      <Button type="submit" size="sm" variant="secondary">Start a return</Button>
    </form>
  );
}

function currentReturn(returns: Order["returns"]) {
  const rows = [...returns].sort((a, b) => String(b.requested_at ?? "").localeCompare(String(a.requested_at ?? "")));
  return rows.find((row) => row.status === "reopened")
    ?? rows.find((row) => row.status && !["rejected", "closed", "refunded"].includes(row.status))
    ?? rows[0];
}

function Returns({
  orders,
  ordersReady,
  email,
  onMessage,
  onReload,
}: {
  orders: Order[];
  ordersReady: boolean;
  email: string;
  onMessage: (value: string, ok?: boolean) => void;
  onReload: () => void;
}) {
  return (
    <section id="returns" className="space-y-4">
      <h2 className="font-display text-2xl">Returns</h2>
      <p className="text-sm text-muted">Free returns start after delivery and stay open for 30 days. Choose a refund or an exchange for a similar item. A refund is issued after we receive the item and shows on the original payment method in 5 to 10 business days. An exchange becomes a new order and ships the same way.</p>
      {!ordersReady ? <p className="text-muted">Loading returns.</p> : null}
      {ordersReady && orders.length === 0 ? <p className="text-muted">No orders to return yet.</p> : null}
      {orders.length > 0 ? (
        <ul className="space-y-4">
          {orders.map((order) => {
            const openReturn = currentReturn(order.returns ?? []);
            const delivered = order.shipments?.some((shipment) => shipment.delivered_at);
            return (
              <li key={order.id} className="rounded-3xl bg-white p-4">
                <p className="font-bold">{order.id}</p>
                <p className="mt-1 text-sm text-muted">
                  {order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}
                </p>
                {openReturn ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm font-bold">{returnLabels[openReturn.status || "requested"] ?? "Requested"} · {openReturn.resolution === "exchange" ? "Exchange" : "Refund"}</p>
                    <p className="text-sm">{returnStatus(openReturn.status, openReturn.resolution)}</p>
                    {openReturn.decision_note ? <p className="text-sm text-muted">{openReturn.decision_note}</p> : null}
                    {openReturn.customer_reply ? <p className="text-sm text-muted">You sent: {openReturn.customer_reply}</p> : null}
                    {openReturn.replacement_order_id ? (
                      <p className="text-sm text-muted">Replacement order {openReturn.replacement_order_id}</p>
                    ) : null}
                    {openReturn.status === "closed" && openReturn.resolution === "exchange" && openReturn.replacement_tracking ? (
                      <p className="text-sm text-muted">Replacement {openReturn.replacement_carrier ? `${openReturn.replacement_carrier} · ` : ""}{openReturn.replacement_tracking}</p>
                    ) : null}
                    {openReturn.status === "needs_info" && openReturn.id ? (
                      <form
                        className="space-y-2"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          const form = new FormData(event.currentTarget);
                          const response = await fetch("/api/returns", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "reply",
                              id: openReturn.id,
                              note: String(form.get("note") ?? ""),
                            }),
                          });
                          const data = (await response.json()) as { error?: string; ok?: boolean };
                          onMessage(data.ok ? "Information sent. Support will review the return again." : data.error ?? "The return could not be updated.", data.ok);
                          if (data.ok) onReload();
                        }}
                      >
                        <label className="block text-sm">
                          More information
                          <Input className="mt-2" name="note" required minLength={3} />
                        </label>
                        <Button type="submit" size="sm" variant="secondary">Send information</Button>
                      </form>
                    ) : null}
                    {openReturn.status === "reopened" ? (
                      <ReturnChoiceForm orderId={order.id} email={email} onMessage={onMessage} onReload={onReload} />
                    ) : null}
                  </div>
                ) : delivered ? (
                  <ReturnChoiceForm orderId={order.id} email={email} onMessage={onMessage} onReload={onReload} />
                ) : (
                  <p className="mt-3 text-sm text-muted">Returns start after this order is delivered.</p>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

const accountTabs = [
  { id: "profile", label: "Profile" },
  { id: "orders", label: "Orders" },
  { id: "returns", label: "Returns" },
  { id: "addresses", label: "Addresses" },
  { id: "devices", label: "Devices" },
] as const;

type AccountTab = (typeof accountTabs)[number]["id"];

type Order = {
  id: string;
  status?: string;
  paymentStatus?: string;
  subtotal: number;
  createdAt: string;
  items: { id: string; productId?: string; name: string; quantity: number; color?: string; selection?: { color?: string; type?: string; size?: string; custom?: string; sku?: string }; coverage?: string[] }[];
  shipments: { status?: string; tracking_number?: string | null; carrier?: string | null; delivered_at?: string | null }[];
  returns: { id?: string; status?: string; resolution?: string; decision_note?: string; customer_reply?: string; replacement_carrier?: string; replacement_tracking?: string; replacement_order_id?: string | null; requested_at?: string }[];
  registrations: { product_id: string; coverage_ends_at?: string | null }[];
  claims: { id: string; status: string; message: string }[];
};

export function AccountHome({
  name,
  email,
  onLogout,
  orderId = "",
}: {
  name: string;
  email: string;
  onLogout: () => void;
  orderId?: string;
}) {
  const [displayName, setDisplayName] = useState(name);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersReady, setOrdersReady] = useState(false);
  const [message, setMessage] = useState("");
  const [messageAlert, setMessageAlert] = useState(false);
  function note(text: string, ok = true) {
    setMessage(text);
    setMessageAlert(!ok);
  }
  const [tab, setTab] = useState<AccountTab>(orderId ? "orders" : "profile");

  async function reloadOrders() {
    const response = await fetch("/api/orders");
    const body = (await response.json()) as { orders?: Order[] };
    setOrders(body.orders ?? []);
    setOrdersReady(true);
  }

  useEffect(() => {
    void reloadOrders();
  }, []);

  useEffect(() => {
    if (orderId) setTab("orders");
  }, [orderId]);

  useEffect(() => {
    if (tab !== "orders" || !orderId || orders.length === 0) return;
    document.getElementById(`order-${orderId}`)?.scrollIntoView({ block: "start" });
  }, [orderId, orders, tab]);

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = event.key === "ArrowRight"
      ? (index + 1) % accountTabs.length
      : (index - 1 + accountTabs.length) % accountTabs.length;
    const id = accountTabs[next].id;
    setTab(id);
    document.getElementById(`account-tab-${id}`)?.focus();
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-lg">
          Signed in as {displayName}. <span className="text-muted">{email}</span>
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={onLogout}>
          Sign out
        </Button>
      </div>
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Account">
        {accountTabs.map((item, index) => (
          <button
            key={item.id}
            id={`account-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`account-panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-bold",
              tab === item.id ? "bg-ink text-paper" : "border border-stone",
            )}
            onClick={() => setTab(item.id)}
            onKeyDown={(event) => moveTab(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {message ? <p className={messageAlert ? "mt-4 text-sm text-band-red" : "mt-4 text-sm"} role={messageAlert ? "alert" : "status"}>{message}</p> : null}
      <div
        id={`account-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`account-tab-${tab}`}
        className="mt-6"
      >
      {tab === "profile" ? (
        <section id="profile" className="space-y-4">
          <h2 className="font-display text-2xl">Profile</h2>
          <p className="text-muted">Your cart and product pages work the same way while you are signed in.</p>
          <form
            className="grid max-w-md gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const response = await fetch("/api/account/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: String(form.get("name") ?? "") }),
              });
              const data = (await response.json()) as { error?: string; name?: string };
              if (!response.ok) {
                note(data.error ?? "The name could not be saved.", false);
                return;
              }
              setDisplayName(data.name ?? displayName);
              note("Name saved.");
            }}
          >
            <label className="block text-sm">
              Name
              <Input className="mt-2" name="name" defaultValue={displayName} required />
            </label>
            <Button type="submit" className="w-full sm:w-fit" size="sm" variant="secondary">
              Save name
            </Button>
          </form>
        </section>
      ) : null}
      {tab === "returns" ? (
        <Returns orders={orders} ordersReady={ordersReady} email={email} onMessage={note} onReload={() => void reloadOrders()} />
      ) : null}
      {tab === "addresses" ? <SavedAddresses onMessage={note} /> : null}
      {tab === "devices" ? <MyDevices email={email} name={displayName} onMessage={note} /> : null}
      {tab === "orders" ? (
      <section id="orders" className="scroll-mt-24 space-y-4">
      <h2 className="font-display text-2xl">Purchase history</h2>
      {ordersReady && orderId && !orders.some((order) => order.id === orderId) ? (
        <div className="rounded-3xl bg-white p-4">
          <p>Order {orderId} is not on this account.</p>
          <p className="mt-2 text-sm text-muted">Look it up with the email used at checkout.</p>
          <TrackLookup initialOrder={orderId} />
        </div>
      ) : null}
      {orders.length === 0 ? (
        orderId ? null : <p className="text-muted">No saved orders yet.</p>
      ) : (
        <ul className="space-y-4">
          {[...orders].sort((left, right) => (left.id === orderId ? -1 : right.id === orderId ? 1 : 0)).map((order) => {
            const shipment = order.shipments?.[0];
            const focused = order.id === orderId;
            return (
              <li id={`order-${order.id}`} key={order.id} className={`scroll-mt-24 rounded-3xl bg-white p-4 ${focused ? "ring-2 ring-ink" : ""}`}>
                {focused ? <p className="text-sm font-bold">This order</p> : null}
                <p className="font-bold">{order.id}</p>
                <p className="text-sm text-muted">{formatUsd(order.subtotal)}</p>
                <p className="mt-2 text-sm">Status: {orderStatusLabel(order.status, order.paymentStatus)}</p>
                {shipment?.tracking_number ? (
                  <p className="text-sm">
                    Tracking: {shipment.carrier ? `${shipment.carrier} ` : ""}
                    {shipment.tracking_number}
                  </p>
                ) : (
                  <p className="text-sm text-muted">Tracking number appears after the order ships.</p>
                )}
                <ul className="mt-3 space-y-3 text-sm">
                  {order.items.map((item) => {
                    const registered = order.registrations?.find((entry) => entry.product_id === item.productId);
                    return (
                      <li key={item.id}>
                        <p>
                          {item.name} × {item.quantity}
                        </p>
                        {purchaseText(item.selection, item.color) ? (
                          <p className="text-muted">{purchaseText(item.selection, item.color)}</p>
                        ) : null}
                        {item.coverage?.length ? (
                          <ul className="mt-1 space-y-1 text-muted">
                            {item.coverage.map((line) => <li key={line}>{line}</li>)}
                          </ul>
                        ) : null}
                        {registered ? (
                          <p className="text-muted">
                            Warranty registered
                            {registered.coverage_ends_at
                              ? ` through ${registered.coverage_ends_at.slice(0, 10)}`
                              : " for the life of the strap"}
                          </p>
                        ) : item.productId ? (
                          <form
                            className="mt-2 grid max-w-md gap-2"
                            onSubmit={async (event) => {
                              event.preventDefault();
                              const form = new FormData(event.currentTarget);
                              const response = await fetch("/api/warranty/register", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  order: order.id,
                                  productId: item.productId,
                                  serial: String(form.get("serial") ?? ""),
                                }),
                              });
                              const data = (await response.json()) as { ok?: boolean; error?: string };
                              note(data.ok ? "Warranty registered." : data.error ?? "Warranty could not be registered.", Boolean(data.ok));
                              if (data.ok) void reloadOrders();
                            }}
                          >
                            <label className="block text-sm">
                              Serial
                              <Input className="mt-1" name="serial" />
                            </label>
                            <Button type="submit" className="w-full sm:w-fit" size="sm" variant="secondary">
                              Register warranty
                            </Button>
                          </form>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                {order.claims?.length ? (
                  <ul className="mt-3 text-sm text-muted">
                    {order.claims.map((claim) => (
                      <li key={claim.id}>Claim {claim.status}: {claim.message}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      </section>
      ) : null}
      </div>
    </div>
  );
}
