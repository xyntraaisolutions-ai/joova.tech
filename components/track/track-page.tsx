"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TrackLookup } from "@/components/track/track-lookup";
import { useAuth } from "@/components/layout/auth-provider";
import { buttonClassName } from "@/components/ui/button";

export function TrackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, ready } = useAuth();
  const order = params.get("order")?.trim() ?? "";
  const customer = Boolean(user && (!user.role || user.role === "customer"));

  useEffect(() => {
    if (!ready || !customer) return;
    const next = order ? `/account?order=${encodeURIComponent(order)}` : "/account";
    router.replace(next);
  }, [ready, customer, order, router]);

  if (!ready || customer) return <p className="text-muted">Opening your account.</p>;

  const signIn = order
    ? `/account?mode=sign-in&order=${encodeURIComponent(order)}`
    : "/account?mode=sign-in";

  return (
    <>
      <h1 className="font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
        Track my order
      </h1>
      <p className="mt-4 text-muted">
        Already have a Joova account? Sign in to see the order, its status, and tracking.
      </p>
      <Link className={`${buttonClassName()} mt-6`} href={signIn}>
        Sign in
      </Link>
      <p className="mt-8 text-muted">
        Or look it up with the order number and the email used at checkout. No account is required.
      </p>
      <TrackLookup initialOrder={order} />
    </>
  );
}
