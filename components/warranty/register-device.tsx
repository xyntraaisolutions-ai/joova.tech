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
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        const response = await fetch("/api/warranty/devices", { method: "POST", body: new FormData(event.currentTarget) });
        const data = (await response.json()) as { ok?: boolean; error?: string; extended?: boolean };
        setPending(false);
        if (!response.ok || !data.ok) {
          setMessage(data.error ?? "The device could not be registered.");
          return;
        }
        setMessage(data.extended ? "Registered. Coverage is extended to 2 years." : "Registered. Your coverage end date is on My Devices.");
        event.currentTarget.reset();
      }}
    >
      <label className="text-sm">
        Serial number
        <Input className="mt-2" name="serial" required pattern="(JSB01|JSB02|JSR01|STRAP1|STRAP2)-[0-9]{4}-[0-9]{6}" placeholder="JSB01-2611-000123" autoComplete="off" />
      </label>
      <p className="text-sm text-muted">Found on the card in the box and on the box label. Example: JSB01-2611-000123.</p>
      <label className="text-sm">
        Purchase date
        <Input className="mt-2" name="purchaseDate" type="date" required />
      </label>
      <label className="text-sm">
        Where purchased
        <Input className="mt-2" name="purchasedFrom" required maxLength={80} placeholder="joova.tech or Amazon" />
      </label>
      <label className="text-sm">
        Email
        <Input className="mt-2" name="email" type="email" required defaultValue={user.email ?? ""} />
      </label>
      <div className="text-sm">
        <p>Receipt</p>
        <FilePicker className="mt-2" label="Choose receipt" name="receipt" required accept="image/jpeg,image/png,image/webp,application/pdf" />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Saving" : "Register device"}</Button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
