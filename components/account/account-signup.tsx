"use client";

import { useState } from "react";
import { support } from "@/content/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccountSignup() {
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [website, setWebsite] = useState("");

  if (status === "success") {
    return (
      <p className="mt-8" role="status">
        Thanks. Your email app should open with this account request addressed to{" "}
        {support.email}. We create the Joova Customer Account and confirm within
        6 to 24 hours. Register each product from the account after it is open.
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
        const product = String(data.get("product") ?? "");
        const body = [
          "Joova Customer Account signup",
          `Name: ${name}`,
          `Email: ${email}`,
          `Order number: ${order || "not provided yet"}`,
          `Product to register: ${product || "not provided yet"}`,
          "",
          "Please open the account so I can register products, see purchase history, track orders, and manage returns and replacements.",
        ].join("\n");
        window.location.href = `mailto:${support.email}?subject=${encodeURIComponent("Joova Customer Account")}&body=${encodeURIComponent(body)}`;
        setStatus("success");
      }}
    >
      <h2 className="font-display text-2xl text-ink">Sign up</h2>
      <p>
        This opens your email app to {support.email}. We do not store a password
        on this page. We reply within 6 to 24 hours and open the account.
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
        <span className="text-sm text-ink">Order number, if you have one</span>
        <Input className="mt-2" name="order" autoComplete="off" />
      </label>
      <label className="block">
        <span className="text-sm text-ink">Product to register</span>
        <Input className="mt-2" name="product" autoComplete="off" />
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
      <Button type="submit">Request a Joova Customer Account</Button>
    </form>
  );
}
