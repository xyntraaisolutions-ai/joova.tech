"use client";

import { useState } from "react";
import { company } from "@/content/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [website, setWebsite] = useState("");

  return (
    <Container className="max-w-xl py-16">
      <h1
        className="font-display font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        Contact
      </h1>
      <p className="mt-4 text-muted">
        {company.supportHours}. Email {company.email}. Phone/text coming.{" "}
        {company.address}
      </p>
      {status === "success" ? (
        <p className="mt-8" role="status">
          Thanks. We will reply within 24 hours on weekdays once forms are
          connected. This preview does not send mail.
        </p>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (website) return;
            setStatus("success");
          }}
        >
          <label className="block">
            <span className="text-sm text-muted">Name</span>
            <Input className="mt-2" name="name" required />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Email</span>
            <Input className="mt-2" type="email" name="email" required />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Message</span>
            <textarea
              name="message"
              required
              rows={5}
              className="mt-2 w-full rounded-2xl border border-stone bg-paper p-4"
            />
          </label>
          <div className="hidden" aria-hidden>
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <Button type="submit">Send</Button>
        </form>
      )}
    </Container>
  );
}
