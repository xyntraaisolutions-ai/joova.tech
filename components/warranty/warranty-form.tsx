"use client";

import { useState } from "react";
import { useSiteContent } from "@/components/layout/site-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WarrantyForm() {
  const { policies, support } = useSiteContent();
  const [status, setStatus] = useState<"idle" | "saved" | "success">("idle");
  const [website, setWebsite] = useState("");

  if (status === "saved") {
    return (
      <p className="mt-8" role="status">
        Thanks. We saved your warranty request. The product needs to be registered on your Joova Customer
        Account before coverage applies. We reply within 6 to 24 hours.
      </p>
    );
  }

  if (status === "success") {
    return (
      <p className="mt-8" role="status">
        Thanks. Your email app should open with this warranty request addressed to{" "}
        {support.email}. The product needs to be registered on your Joova Customer
        Account before coverage applies. We reply within 6 to 24 hours.
      </p>
    );
  }

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (website) return;
        const data = new FormData(event.currentTarget);
        const name = String(data.get("name") ?? "");
        const email = String(data.get("email") ?? "");
        const order = String(data.get("order") ?? "");
        const serial = String(data.get("serial") ?? "");
        const message = String(data.get("message") ?? "");
        const body = [
          "Warranty claim",
          `Name: ${name}`,
          `Email: ${email}`,
          `Order number: ${order}`,
          `Product serial: ${serial || "not provided"}`,
          "",
          message,
        ].join("\n");
        void fetch("/api/warranty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, order, serial, message }),
        })
          .then((response) => response.json())
          .then((result: { saved?: boolean }) => {
            if (result.saved) {
              setStatus("saved");
              return;
            }
            window.location.href = `mailto:${support.email}?subject=${encodeURIComponent("Joova warranty form")}&body=${encodeURIComponent(body)}`;
            setStatus("success");
          })
          .catch(() => {
            window.location.href = `mailto:${support.email}?subject=${encodeURIComponent("Joova warranty form")}&body=${encodeURIComponent(body)}`;
            setStatus("success");
          });
      }}
    >
      <h2 className="font-display text-2xl font-extrabold text-ink">Warranty form</h2>
      <p>
        Use this form after the product is registered on your Joova Customer
        Account. {policies.warrantyRegistration} Submit opens your email app to{" "}
        {support.email}. We reply within 6 to 24 hours.
      </p>
      <label className="block">
        <span className="text-sm text-ink">Name</span>
        <Input className="mt-2" name="name" required autoComplete="name" />
      </label>
      <label className="block">
        <span className="text-sm text-ink">Email</span>
        <Input className="mt-2" type="email" name="email" required autoComplete="email" />
      </label>
      <label className="block">
        <span className="text-sm text-ink">Order number</span>
        <Input className="mt-2" name="order" required autoComplete="off" />
      </label>
      <label className="block">
        <span className="text-sm text-ink">Product serial, if you have it</span>
        <Input className="mt-2" name="serial" autoComplete="off" />
      </label>
      <label className="block">
        <span className="text-sm text-ink">What happened</span>
        <textarea
          name="message"
          required
          rows={5}
          className="mt-2 w-full rounded-2xl border border-stone bg-paper p-4 text-base text-ink"
        />
      </label>
      <div className="hidden" aria-hidden>
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </label>
      </div>
      <Button type="submit">Submit warranty form</Button>
    </form>
  );
}
