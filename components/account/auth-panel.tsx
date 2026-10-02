"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountHome } from "@/components/account/account-home";
import { useAuth } from "@/components/layout/auth-provider";
import { useCart } from "@/components/layout/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/ui/password-field";

type Mode = "sign-in" | "register" | "forgot";

const benefits = [
  "Purchase history",
  "Order tracking",
  "Returns, inside the 30-day free return window",
  "Replacements on a registered warranty claim",
  "My Devices, with warranty status and the coverage end date",
];

function modeFrom(value: string | null): Mode {
  if (value === "register") return "register";
  if (value === "forgot") return "forgot";
  return "sign-in";
}

export function AuthPanel({
  summary,
  warranty,
}: {
  summary: string;
  warranty: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const { user, ready, login, register, logout } = useAuth();
  const { setOpen } = useCart();
  const [mode, setMode] = useState<Mode>(modeFrom(params.get("mode")));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role && user.role !== "customer") {
      router.replace("/portal");
      return;
    }
    if (params.get("next") === "checkout") setOpen(true);
  }, [user, params, setOpen, router]);

  if (!ready) {
    return <p className="text-muted">Loading your account.</p>;
  }

  if (user) {
    if (user.role && user.role !== "customer") {
      return <p className="text-muted">Opening the portal.</p>;
    }
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-bold tracking-[0.14em] text-muted uppercase">Customer account</p>
        <h1 className="mt-3 font-display" style={{ fontSize: "var(--text-h1)" }}>
          Account
        </h1>
        <AccountHome name={user.name} email={user.email} orderId={params.get("order")?.trim() ?? ""} onLogout={() => void logout()} />
      </div>
    );
  }

  const heading = mode === "forgot" ? "Reset password" : mode === "register" ? "Create an account" : "Sign in";
  const intro =
    mode === "forgot"
      ? "We email a link so you can choose a new password."
      : mode === "register"
        ? "Use this account for orders, returns, and warranty registration."
        : "Shopping stays the same after you sign in.";

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:gap-16">
      <section className="order-2 lg:order-1">
        <p className="text-sm font-bold tracking-[0.14em] text-muted uppercase">Customer account</p>
        <h1 className="mt-3 font-display" style={{ fontSize: "var(--text-h1)" }}>
          Account
        </h1>
        <p className="mt-6 max-w-xl text-lg">{summary}</p>
        <ul className="mt-8 max-w-xl space-y-3">
          {benefits.map((item) => (
            <li key={item} className="flex gap-3 text-muted">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ink" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-xl text-sm text-muted">
          {warranty} The only free return window is{" "}
          <Link className="font-medium text-ink underline" href="/returns">
            30 days from delivery in the United States
          </Link>
          .
        </p>
      </section>

      <section className="order-1 rounded-3xl border border-stone bg-white p-6 md:p-8 lg:order-2">
        {mode === "forgot" ? null : (
          <div className="flex gap-2" role="tablist" aria-label="Account">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "sign-in"}
              className={`min-h-11 rounded-full px-4 text-sm font-bold ${mode === "sign-in" ? "bg-ink text-paper" : "border border-stone"}`}
              onClick={() => {
                setMode("sign-in");
                setError("");
                setNotice("");
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
                setNotice("");
              }}
            >
              Register
            </button>
          </div>
        )}

        <h2 className={`font-display text-2xl ${mode === "forgot" ? "" : "mt-6"}`}>{heading}</h2>
        <p className="mt-2 text-sm text-muted">{intro}</p>

        {params.get("timeout") === "1" && mode === "sign-in" ? (
          <p className="mt-4 text-sm" role="status">
            Your portal session ended after a period of inactivity. Sign in again.
          </p>
        ) : null}

        <form
          className="mt-6 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setNotice("");
            setPending(true);
            const data = new FormData(event.currentTarget);
            const email = String(data.get("email") ?? "");
            const password = String(data.get("password") ?? "");
            if (mode === "forgot") {
              const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              });
              const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
              setPending(false);
              if (!response.ok) {
                setError(body?.error ?? "We could not send the reset email. Try again.");
                return;
              }
              setNotice(body?.message ?? "If an account exists for that email, we sent a reset link.");
              return;
            }
            const message =
              mode === "register"
                ? await register({ name: String(data.get("name") ?? ""), email, password })
                : await login({ email, password });
            setPending(false);
            if (message) setError(message);
          }}
        >
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
          {mode === "forgot" ? null : (
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-ink" htmlFor="account-password">
                  Password
                </label>
                {mode === "sign-in" ? (
                  <button
                    type="button"
                    className="text-sm font-bold text-ink underline"
                    onClick={() => {
                      setMode("forgot");
                      setError("");
                      setNotice("");
                    }}
                  >
                    Forgot password?
                  </button>
                ) : null}
              </div>
              <PasswordField
                className="mt-2"
                id="account-password"
                name="password"
                required
                minLength={mode === "register" ? 8 : 1}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
              />
            </div>
          )}
          {error ? (
            <p className="text-sm text-ink" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="text-sm text-ink" role="status">
              {notice}
            </p>
          ) : null}
          <Button className="w-full" type="submit" disabled={pending}>
            {mode === "forgot" ? (pending ? "Sending" : "Email reset link") : mode === "register" ? "Create account" : "Sign in"}
          </Button>
        </form>

        {mode === "forgot" ? (
          <button
            type="button"
            className="mt-4 text-sm font-bold text-ink underline"
            onClick={() => {
              setMode("sign-in");
              setError("");
              setNotice("");
            }}
          >
            Back to sign in
          </button>
        ) : null}
      </section>
    </div>
  );
}
