"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyPlaceholders, passwordEmailFrom, type PasswordEmailTemplate } from "@/lib/mail/template";

const sample = {
  email: "customer@example.com",
  name: "Alex",
  reset_link: "https://joova.tech/account/reset",
  support_email: passwordEmailFrom.email,
  site_name: "Joova",
};

export function PasswordEmailForm({ onError }: { onError: (message: string) => void }) {
  const [template, setTemplate] = useState<PasswordEmailTemplate | null>(null);
  const [configured, setConfigured] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch("/api/portal/email-template")
      .then((response) => response.json())
      .then((data: { template?: PasswordEmailTemplate; resend?: { configured?: boolean } }) => {
        setTemplate(data.template ?? null);
        setConfigured(Boolean(data.resend?.configured));
      });
  }, []);

  if (!template) return <p className="mt-4 text-sm text-muted">Loading the password email.</p>;

  const preview = {
    subject: applyPlaceholders(template.subject, sample),
    heading: applyPlaceholders(template.heading, sample),
    body: applyPlaceholders(template.body, sample),
    buttonLabel: applyPlaceholders(template.buttonLabel, sample),
    footer: applyPlaceholders(template.footer, sample),
  };

  return (
    <form
      className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/portal/email-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: String(form.get("subject") ?? ""),
            heading: String(form.get("heading") ?? ""),
            body: String(form.get("body") ?? ""),
            buttonLabel: String(form.get("buttonLabel") ?? ""),
            footer: String(form.get("footer") ?? ""),
          }),
        });
        const data = (await response.json()) as { error?: string };
        setPending(false);
        onError(response.ok ? "" : data.error ?? "The email template could not be saved.");
      }}
    >
      <div className="grid gap-3">
        <p className="text-sm text-muted">
          From {passwordEmailFrom.name} &lt;{passwordEmailFrom.email}&gt; through Resend.{" "}
          {configured ? "The Resend key is stored." : "The Resend key is not stored yet."} Placeholders: {"{{email}}"}, {"{{name}}"}, {"{{reset_link}}"}, {"{{support_email}}"}, {"{{site_name}}"}.
        </p>
        <label className="text-sm">Subject<Input className="mt-2" name="subject" value={template.subject} onChange={(event) => setTemplate({ ...template, subject: event.target.value })} required /></label>
        <label className="text-sm">Heading<Input className="mt-2" name="heading" value={template.heading} onChange={(event) => setTemplate({ ...template, heading: event.target.value })} required /></label>
        <label className="text-sm">
          Message
          <textarea name="body" value={template.body} onChange={(event) => setTemplate({ ...template, body: event.target.value })} required className="mt-2 min-h-36 w-full rounded-2xl border border-stone bg-white px-4 py-3" />
        </label>
        <label className="text-sm">Button label<Input className="mt-2" name="buttonLabel" value={template.buttonLabel} onChange={(event) => setTemplate({ ...template, buttonLabel: event.target.value })} required /></label>
        <label className="text-sm">Footer<Input className="mt-2" name="footer" value={template.footer} onChange={(event) => setTemplate({ ...template, footer: event.target.value })} required /></label>
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving" : "Save password email"}</Button>
      </div>
      <aside className="h-fit rounded-3xl border border-stone bg-paper p-5">
        <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Preview</p>
        <p className="mt-4 text-sm font-bold">{passwordEmailFrom.name}</p>
        <p className="text-sm text-muted">{passwordEmailFrom.email}</p>
        <p className="mt-4 text-sm text-muted">{preview.subject}</p>
        <h3 className="mt-4 font-display text-2xl">{preview.heading}</h3>
        {preview.body.split(/\n{2,}/).map((paragraph, index) => (
          <p key={index} className="mt-3 text-sm">{paragraph}</p>
        ))}
        <p className="mt-4 inline-flex rounded-full bg-coral px-4 py-2 text-sm font-bold text-[var(--fixed-ink)]">{preview.buttonLabel}</p>
        <p className="mt-4 text-xs text-muted">{preview.footer}</p>
      </aside>
    </form>
  );
}
