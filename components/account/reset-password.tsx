"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { useSiteContent } from "@/components/layout/site-content";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button, buttonClassName } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";

type Phase = "checking" | "ready" | "error" | "done";

export function ResetPassword() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;

    async function confirmLink() {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const access = hash.get("access_token");
      const refresh = hash.get("refresh_token");

      if (code || (tokenHash && params.get("type") === "recovery")) {
        const response = await fetch("/api/auth/recovery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            code ? { code } : { tokenHash, type: "recovery" },
          ),
        });
        if (!active) return;
        if (!response.ok) {
          setPhase("error");
          return;
        }
        window.history.replaceState(null, "", "/account/reset");
        setPhase("ready");
        return;
      }

      if (access && refresh && hash.get("type") === "recovery") {
        const { error: sessionError } = await createBrowserSupabase().auth.setSession({
          access_token: access,
          refresh_token: refresh,
        });
        if (!active) return;
        if (sessionError) {
          setPhase("error");
          return;
        }
        window.history.replaceState(null, "", "/account/reset");
        setPhase("ready");
        return;
      }

      const session = (await fetch("/api/auth/session").then((response) => response.json())) as {
        user: { id: string } | null;
      };
      if (!active) return;
      setPhase(session.user ? "ready" : "error");
    }

    void confirmLink().catch(() => {
      if (active) setPhase("error");
    });

    return () => {
      active = false;
    };
  }, []);

  if (phase === "checking") {
    return (
      <ResetFrame>
        <p className="text-muted">Checking your reset link.</p>
      </ResetFrame>
    );
  }

  if (phase === "error") {
    return (
      <ResetFrame>
        <h1 className="font-display text-3xl">Reset link expired</h1>
        <p className="mt-4 text-muted">
          This reset link is missing or has expired. Request a new one from the sign-in page.
        </p>
        <Link className={buttonClassName("primary", "md", "mt-6")} href="/account?mode=forgot">
          Request a new link
        </Link>
      </ResetFrame>
    );
  }

  if (phase === "done") {
    return (
      <ResetFrame>
        <h1 className="font-display text-3xl">Password saved</h1>
        <p className="mt-4 text-muted">Your new password is ready. Opening your account.</p>
      </ResetFrame>
    );
  }

  return (
    <ResetFrame>
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        const data = new FormData(event.currentTarget);
        const password = String(data.get("password") ?? "");
        const confirm = String(data.get("confirm") ?? "");
        if (password !== confirm) {
          setError("Enter the same password in both fields.");
          return;
        }
        setPending(true);
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) {
          setPending(false);
          setError(body?.error ?? "The password could not be saved.");
          return;
        }
        setPhase("done");
        window.location.assign("/account");
      }}
    >
      <h1 className="font-display text-3xl">Choose a new password</h1>
      <p className="text-sm text-muted">Use at least 8 characters. This replaces the password on your account.</p>
      <label className="block">
        <span className="text-sm text-ink">New password</span>
        <PasswordField className="mt-2" name="password" required minLength={8} autoComplete="new-password" />
      </label>
      <label className="block">
        <span className="text-sm text-ink">Confirm password</span>
        <PasswordField className="mt-2" name="confirm" required minLength={8} autoComplete="new-password" />
      </label>
      {error ? (
        <p className="text-sm text-ink" role="alert">
          {error}
        </p>
      ) : null}
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save password"}
      </Button>
    </form>
    </ResetFrame>
  );
}

function ResetFrame({ children }: { children: ReactNode }) {
  const { company } = useSiteContent();
  return (
    <div className="mx-auto max-w-md">
      <Link href="/" aria-label={`${company.brand} home`} className="inline-flex">
        <Logo />
      </Link>
      <div className="mt-8 rounded-3xl border border-stone bg-white p-6 md:p-8">{children}</div>
    </div>
  );
}
