"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReturnRequest() {
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-8 space-y-4 rounded-3xl border border-stone bg-white p-6 text-ink"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setPending(true);
        setMessage("");
        setFailed(false);
        void fetch("/api/returns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order: String(data.get("order") ?? ""),
            email: String(data.get("email") ?? ""),
            reason: String(data.get("reason") ?? ""),
            resolution: String(data.get("resolution") ?? ""),
          }),
        })
          .then((response) => response.json())
          .then((body: { ok?: boolean; error?: string }) => {
            setFailed(!body.ok);
            setMessage(body.ok ? "Return requested. We reply within 6 to 24 hours." : (body.error ?? "The return could not be started."));
          })
          .catch(() => {
            setFailed(true);
            setMessage("The return could not be started.");
          })
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
      <fieldset>
        <legend className="text-sm text-ink">What should we do after we receive it?</legend>
        <label className="mt-3 flex items-start gap-3 text-sm text-ink">
          <input className="mt-1" type="radio" name="resolution" value="refund" defaultChecked required />
          <span>Refund. Issued after we receive the item. It appears on the original payment method in 5 to 10 business days.</span>
        </label>
        <label className="mt-3 flex items-start gap-3 text-sm text-ink">
          <input className="mt-1" type="radio" name="resolution" value="exchange" required />
          <span>Exchange for a similar item. A replacement order ships like a new order after we receive this one.</span>
        </label>
      </fieldset>
      <label className="block">
        <span className="text-sm text-ink">Why are you returning it?</span>
        <textarea
          name="reason"
          required
          rows={4}
          className="mt-2 w-full rounded-2xl border border-stone bg-white p-4 text-[17px] text-ink"
        />
      </label>
      <Button type="submit" className="w-full sm:w-fit" disabled={pending}>
        Request return
      </Button>
      {message ? <p role={failed ? "alert" : "status"} className={failed ? "text-sm text-band-red" : "text-sm"}>{message}</p> : null}
    </form>
  );
}
