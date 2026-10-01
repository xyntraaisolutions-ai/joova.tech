"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReturnRequest() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setPending(true);
        setMessage("");
        void fetch("/api/returns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order: String(data.get("order") ?? ""),
            email: String(data.get("email") ?? ""),
            reason: String(data.get("reason") ?? ""),
          }),
        })
          .then((response) => response.json())
          .then((body: { ok?: boolean; error?: string }) => {
            setMessage(body.ok ? "Return requested. We reply within 6 to 24 hours." : (body.error ?? "The return could not be started."));
          })
          .catch(() => setMessage("The return could not be started."))
          .finally(() => setPending(false));
      }}
    >
      <h2 className="font-display text-2xl text-ink">Start a return</h2>
      <label className="block">
        <span className="text-sm text-ink">Order number</span>
        <Input className="mt-2" name="order" required autoComplete="off" />
      </label>
      <label className="block">
        <span className="text-sm text-ink">Email</span>
        <Input className="mt-2" type="email" name="email" required autoComplete="email" />
      </label>
      <label className="block">
        <span className="text-sm text-ink">Why are you returning it?</span>
        <textarea
          name="reason"
          required
          rows={4}
          className="mt-2 w-full rounded-2xl border border-stone bg-paper p-4 text-base text-ink"
        />
      </label>
      <Button type="submit" disabled={pending}>
        Request return
      </Button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
