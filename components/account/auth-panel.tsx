"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/layout/auth-provider";
import { useCart } from "@/components/layout/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatUsd } from "@/lib/utils";

type Order = {
  id: string;
  subtotal: number;
  createdAt: string;
  items: { id: string; name: string; quantity: number; price: number; color?: string }[];
};

export function AuthPanel() {
  const params = useSearchParams();
  const initial = params.get("mode") === "register" ? "register" : "sign-in";
  const { user, ready, login, register, logout } = useAuth();
  const { setOpen } = useCart();
  const [mode, setMode] = useState<"sign-in" | "register">(initial);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user && params.get("next") === "checkout") setOpen(true);
  }, [user, params, setOpen]);

  async function loadOrders() {
    const response = await fetch("/api/orders");
    const body = (await response.json()) as { orders: Order[] };
    setOrders(body.orders ?? []);
  }

  if (!ready) {
    return <p className="mt-8 text-muted">Loading your account.</p>;
  }

  if (user) {
    return (
      <SignedIn
        name={user.name}
        email={user.email}
        orders={orders}
        onShowOrders={() => void loadOrders()}
        onLogout={() => void logout()}
      />
    );
  }

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setPending(true);
        const data = new FormData(event.currentTarget);
        const email = String(data.get("email") ?? "");
        const password = String(data.get("password") ?? "");
        const message =
          mode === "register"
            ? await register({ name: String(data.get("name") ?? ""), email, password })
            : await login({ email, password });
        setPending(false);
        if (message) setError(message);
      }}
    >
      <div className="flex gap-2" role="tablist" aria-label="Account">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "sign-in"}
          className={`min-h-11 rounded-full px-4 text-sm font-bold ${mode === "sign-in" ? "bg-ink text-paper" : "border border-stone"}`}
          onClick={() => {
            setMode("sign-in");
            setError("");
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          className={`min-h-11 rounded-full px-4 text-sm font-bold ${mode === "register" ? "bg-ink text-paper" : "border border-stone"}`}
          onClick={() => {
            setMode("register");
            setError("");
          }}
        >
          Register
        </button>
      </div>
      <p className="text-sm text-muted">
        Preview accounts are stored on this site for now. Shopping stays the same after you sign in.
      </p>
      {mode === "register" ? (
        <label className="block">
          <span className="text-sm text-ink">Name</span>
          <Input className="mt-2" name="name" required autoComplete="name" />
        </label>
      ) : null}
      <label className="block">
        <span className="text-sm text-ink">Email</span>
        <Input className="mt-2" type="email" name="email" required autoComplete="email" />
      </label>
      <label className="block">
        <span className="text-sm text-ink">Password</span>
        <Input
          className="mt-2"
          type="password"
          name="password"
          required
          minLength={mode === "register" ? 8 : 1}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
        />
      </label>
      {error ? (
        <p className="text-sm text-ink" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {mode === "register" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}

function SignedIn({
  name,
  email,
  orders,
  onShowOrders,
  onLogout,
}: {
  name: string;
  email: string;
  orders: Order[];
  onShowOrders: () => void;
  onLogout: () => void;
}) {
  const [shown, setShown] = useState(false);

  return (
    <div className="mt-8 space-y-4">
      <p className="text-lg text-ink">
        Signed in as {name}. <span className="text-muted">{email}</span>
      </p>
      <p className="text-muted">
        Your cart, wishlist, and product pages work the same way while you are signed in.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setShown(true);
            onShowOrders();
          }}
        >
          Purchase history
        </Button>
        <Button type="button" variant="secondary" onClick={onLogout}>
          Sign out
        </Button>
      </div>
      {shown ? (
        orders.length === 0 ? (
          <p className="text-muted">No saved orders yet.</p>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="rounded-3xl bg-white p-4">
                <p className="font-bold">{order.id}</p>
                <p className="text-sm text-muted">{formatUsd(order.subtotal)}</p>
                <ul className="mt-2 text-sm text-muted">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.name}
                      {item.color ? `, ${item.color}` : ""} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
