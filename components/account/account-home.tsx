"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SavedAddresses } from "@/components/account/saved-addresses";
import { TrackLookup } from "@/components/track/track-lookup";
import { purchaseText } from "@/lib/content/variants";
import { orderStatusLabel } from "@/lib/orders/status";
import { formatUsd } from "@/lib/utils";

type Device = {
  id: string;
  serial: string;
  model: string;
  status: string;
  coverageEnds: string;
  purchaseDate?: string | null;
};

function MyDevices({ email, name, onMessage }: { email: string; name: string; onMessage: (value: string) => void }) {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    void fetch("/api/warranty/devices")
      .then((response) => response.json())
      .then((body: { devices?: Device[] }) => setDevices(body.devices ?? []));
  }, []);

  return (
    <section id="devices" className="scroll-mt-24">
      <h2 className="font-display text-2xl">My Devices</h2>
      {devices.length === 0 ? (
        <p className="mt-3 text-muted">
          No registered devices yet. Register from the{" "}
          <Link className="font-bold text-ink underline" href="/warranty#register">warranty page</Link>.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {devices.map((device) => (
            <li key={device.id} className="rounded-3xl bg-white p-4">
              <p className="font-bold">{device.serial || device.model}</p>
              <p className="text-sm">{device.status}</p>
              <p className="text-sm text-muted">
                {device.coverageEnds ? `Coverage ends ${device.coverageEnds}` : "Coverage end date is set when the device is registered."}
              </p>
              <form
                className="mt-3 space-y-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const response = await fetch("/api/warranty", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name,
                      email,
                      order: device.serial || device.id,
                      serial: device.serial,
                      message: String(form.get("message") ?? ""),
                    }),
                  });
                  const data = (await response.json()) as { saved?: boolean };
                  onMessage(data.saved ? "Warranty claim sent." : "The claim could not be sent.");
                }}
              >
                <label className="block text-sm">
                  What happened
                  <textarea name="message" required minLength={3} className="mt-2 min-h-20 w-full rounded-2xl border border-stone bg-white px-4 py-3" />
                </label>
                <Button type="submit" size="sm" variant="secondary">Start warranty claim</Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type Order = {
  id: string;
  status?: string;
  paymentStatus?: string;
  subtotal: number;
  createdAt: string;
  items: { id: string; productId?: string; name: string; quantity: number; color?: string; selection?: { color?: string; type?: string; size?: string; custom?: string; sku?: string } }[];
  shipments: { status?: string; tracking_number?: string | null; carrier?: string | null; delivered_at?: string | null }[];
  returns: { status?: string }[];
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

  useEffect(() => {
    void fetch("/api/orders")
      .then((response) => response.json())
      .then((body: { orders?: Order[] }) => setOrders(body.orders ?? []))
      .finally(() => setOrdersReady(true));
  }, []);

  useEffect(() => {
    if (!orderId || orders.length === 0) return;
    document.getElementById(`order-${orderId}`)?.scrollIntoView({ block: "start" });
  }, [orderId, orders]);

  return (
    <div id="profile" className="mt-8 space-y-6">
      <p className="text-lg">
        Signed in as {displayName}. <span className="text-muted">{email}</span>
      </p>
      <p className="text-muted">Your cart and product pages work the same way while you are signed in.</p>
      <form
        className="flex flex-wrap items-end gap-3"
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
            setMessage(data.error ?? "The name could not be saved.");
            return;
          }
          setDisplayName(data.name ?? displayName);
          setMessage("Name saved.");
        }}
      >
        <label className="text-sm">
          Name
          <Input className="mt-2" name="name" defaultValue={name} required />
        </label>
        <Button type="submit" size="sm" variant="secondary">
          Save name
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onLogout}>
          Sign out
        </Button>
      </form>
      {message ? <p role="status">{message}</p> : null}
      <SavedAddresses onMessage={setMessage} />
      <MyDevices email={email} name={displayName} onMessage={setMessage} />
      <h2 id="orders" className="scroll-mt-24 font-display text-2xl">Purchase history</h2>
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
                {order.returns?.[0] ? <p className="text-sm text-muted">Return: {order.returns[0].status}</p> : null}
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
                        {registered ? (
                          <p className="text-muted">
                            Warranty registered
                            {registered.coverage_ends_at
                              ? ` through ${registered.coverage_ends_at.slice(0, 10)}`
                              : " for the life of the strap"}
                          </p>
                        ) : item.productId ? (
                          <form
                            className="mt-2 flex flex-wrap items-end gap-2"
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
                              setMessage(data.ok ? "Warranty registered." : data.error ?? "Warranty could not be registered.");
                              if (data.ok) {
                                const refreshed = await fetch("/api/orders");
                                const body = (await refreshed.json()) as { orders?: Order[] };
                                setOrders(body.orders ?? []);
                              }
                            }}
                          >
                            <label>
                              Serial
                              <Input className="mt-1" name="serial" />
                            </label>
                            <Button type="submit" size="sm" variant="secondary">
                              Register warranty
                            </Button>
                          </form>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                <form
                  className="mt-4 space-y-2"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    const response = await fetch("/api/returns", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        order: order.id,
                        email,
                        reason: String(form.get("reason") ?? ""),
                      }),
                    });
                    const data = (await response.json()) as { error?: string; ok?: boolean };
                    setMessage(data.ok ? "Return requested." : data.error ?? "The return could not be started.");
                  }}
                >
                  <label className="block text-sm">
                    Return reason
                    <Input className="mt-2" name="reason" required minLength={3} />
                  </label>
                  <Button type="submit" size="sm" variant="secondary">
                    Start a return
                  </Button>
                </form>
                <form
                  className="mt-4 space-y-2"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    const response = await fetch("/api/warranty", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: displayName,
                        email,
                        order: order.id,
                        serial: String(form.get("serial") ?? ""),
                        message: String(form.get("message") ?? ""),
                      }),
                    });
                    const data = (await response.json()) as { saved?: boolean };
                    setMessage(data.saved ? "Warranty claim sent." : "The claim could not be sent.");
                  }}
                >
                  <label className="block text-sm">
                    What happened
                    <textarea name="message" required minLength={3} className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3" />
                  </label>
                  <label className="block text-sm">
                    Serial, if you have it
                    <Input className="mt-2" name="serial" />
                  </label>
                  <Button type="submit" size="sm" variant="secondary">
                    File a warranty claim
                  </Button>
                </form>
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
    </div>
  );
}
