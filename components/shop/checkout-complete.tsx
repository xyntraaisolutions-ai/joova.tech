"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/layout/auth-provider";
import { useCart } from "@/components/layout/cart-provider";
import { PaymentNote } from "@/components/shop/payment-note";

type Status = { found?: boolean; orderId?: string; paymentStatus?: string; email?: string; error?: string };

export function CheckoutComplete() {
  const params = useSearchParams();
  const { user } = useAuth();
  const sessionId = params.get("session_id") ?? "";
  const { clear } = useCart();
  const [status, setStatus] = useState<Status | null>(null);
  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    let stopped = false;
    let tries = 0;
    async function poll() {
      const response = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`);
      const body = (await response.json().catch(() => null)) as Status | null;
      if (stopped) return;
      setStatus(body);
      if (body?.paymentStatus === "paid") {
        sessionStorage.removeItem("joova-checkout");
        clear();
        setWaiting(false);
        return;
      }
      tries += 1;
      if (tries < 15) window.setTimeout(() => void poll(), 2000);
      else setWaiting(false);
    }
    void poll();
    return () => {
      stopped = true;
    };
  }, [sessionId, clear]);

  if (!sessionId) {
    return <p className="text-muted">This page opens after Stripe sends you back from payment.</p>;
  }
  if (status?.paymentStatus === "paid" && status.orderId) {
    return (
      <div className="rounded-3xl border border-stone bg-white p-5" role="status">
        <h2 className="font-display text-2xl">Payment received</h2>
        <p className="mt-3">Order {status.orderId} is paid.</p>
        <p className="mt-2 text-sm text-muted">A confirmation is on its way{status.email ? ` to ${status.email}` : ""}. We will email you again when it ships.</p>
        <div className="mt-4"><PaymentNote /></div>
        <p className="mt-4 text-sm">
          <Link className="font-bold text-ink underline" href={user && (!user.role || user.role === "customer") ? `/account?order=${encodeURIComponent(status.orderId)}` : `/track?order=${encodeURIComponent(status.orderId)}`}>Track this order</Link>
        </p>
      </div>
    );
  }
  if (status?.error) return <p role="alert">{status.error}</p>;
  if (!waiting && status?.paymentStatus !== "paid") {
    return <p role="status">Payment is still processing. Refresh this page in a moment, or check your email for the order number.</p>;
  }
  return <p role="status">Confirming your payment. This page updates when Stripe finishes.</p>;
}
