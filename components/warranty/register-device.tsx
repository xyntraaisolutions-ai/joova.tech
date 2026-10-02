"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { Input } from "@/components/ui/input";

type SessionUser = { email?: string } | null;

export function RegisterDevice() {
  const [user, setUser] = useState<SessionUser>(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/session")
      .then((response) => response.json())
      .then((body: { user?: SessionUser }) => {
        setUser(body.user ?? null);
        setReady(true);
      });
  }, []);

  if (!ready) return <p className="text-muted">Loading the registration form.</p>;

  if (!user) {
    return (
      <p>
        <Link className="font-bold text-ink underline" href="/account?mode=register">
          Create a Joova Customer Account
        </Link>{" "}
        or{" "}
        <Link className="font-bold text-ink underline" href="/account?mode=sign-in&next=/warranty">
          sign in
        </Link>{" "}
        to register a device. The serial number is saved on your account.
      </p>
    );
  }

  return (
    <form
      className="grid gap-4 rounded-3xl border border-stone bg-white p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        setFailed(false);
        const response = await fetch("/api/warranty/devices", { method: "POST", body: new FormData(event.currentTarget) });
        const data = (await response.json()) as { ok?: boolean; error?: string; extended?: boolean };
        setPending(false);
        if (!response.ok || !data.ok) {
          setFailed(true);
          setMessage(data.error ?? "The device could not be registered.");
          return;
        }
        setFailed(false);
        setMessage(data.extended ? "Registered. Coverage is extended to 2 years." : "Registered. Your coverage end date is on My Devices.");
        event.currentTarget.reset();
      }}
    >
      <label className="text-sm font-medium text-ink">
        Serial number
        <Input className="mt-2" name="serial" required pattern="(JSB01|JSB02|JSR01|STRAP1|STRAP2)-[0-9]{4}-[0-9]{6}" placeholder="JSB01-2611-000123" autoComplete="off" />
      </label>
      <p className="text-sm text-muted">Found on the card in the box and on the box label. Example: JSB01-2611-000123.</p>
      <label className="text-sm font-medium text-ink">
        Purchase date
        <Input className="mt-2" name="purchaseDate" type="date" required />
      </label>
      <label className="text-sm font-medium text-ink">
        Where purchased
        <Input className="mt-2" name="purchasedFrom" required maxLength={80} placeholder="joova.tech or Amazon" />
      </label>
      <label className="text-sm font-medium text-ink">
        Email
        <Input className="mt-2" name="email" type="email" required defaultValue={user.email ?? ""} />
      </label>
      <FilePicker label="Receipt" hint="JPEG, PNG, WebP, or PDF" name="receipt" required accept="image/jpeg,image/png,image/webp,application/pdf" />
      <Button type="submit" className="w-full sm:w-fit" disabled={pending}>{pending ? "Saving" : "Register device"}</Button>
      {message ? <p role={failed ? "alert" : "status"} className={failed ? "text-sm text-band-red" : "text-sm"}>{message}</p> : null}
    </form>
  );
}
