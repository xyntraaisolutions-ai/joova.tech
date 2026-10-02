"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyPlaceholders, noticeEmailDefaults, passwordEmailFrom, type NoticeEmailId, type PasswordEmailTemplate } from "@/lib/mail/template";

const labels: Record<NoticeEmailId, string> = {
  warranty_replacement: "Warranty replacement",
  exchange_order: "Exchange order",
  shipment: "Shipment",
  review_request: "Review request",
  refund: "Refund",
  back_in_stock: "Back in stock",
  low_stock: "Low stock",
  staff_order: "New paid order",
  staff_return: "Return request",
  staff_warranty: "Warranty claim",
  stock_request: "Stock request",
};

const sample: Record<string, string> = {
  order_id: "JO-D732A65C",
  source_order: "JO-A0465989",
  email: "customer@example.com",
  name: "Alex",
  tracking: "1Z999",
  carrier: "UPS",
  product: "Joova Fitness Band",
  sku: "BAND-01",
  available: "2",
  total: "$59.99",
  note: "Please tell me when this returns.",
  support_email: passwordEmailFrom.email,
  site_name: "Joova",
};

export function NoticeEmailForm({ onError }: { onError: (message: string) => void }) {
  const ids = Object.keys(noticeEmailDefaults) as NoticeEmailId[];
  const [id, setId] = useState<NoticeEmailId>("warranty_replacement");
  const [template, setTemplate] = useState<PasswordEmailTemplate | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setTemplate(null);
    void fetch(`/api/portal/email-template?id=${encodeURIComponent(id)}`)
      .then((response) => response.json())
      .then((data: { template?: PasswordEmailTemplate; error?: string }) => {
        if (data.template) setTemplate(data.template);
        else onError(data.error ?? "The email template could not be loaded.");
      });
  }, [id, onError]);

  if (!template) return <p className="mt-4 text-sm text-muted">Loading the email.</p>;

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
            id,
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
        <label className="text-sm">
          Email
          <select
            className="mt-2 w-full rounded-2xl border border-stone bg-white px-4 py-3"
            value={id}
            onChange={(event) => setId(event.target.value as NoticeEmailId)}
          >
            {ids.map((item) => (
              <option key={item} value={item}>{labels[item]}</option>
            ))}
          </select>
        </label>
        <p className="text-sm text-muted">
          From {passwordEmailFrom.name} &lt;{passwordEmailFrom.email}&gt;. The same card, logo, and button as the order confirmation. Placeholders: {"{{order_id}}"}, {"{{source_order}}"}, {"{{name}}"}, {"{{email}}"}, {"{{product}}"}, {"{{tracking}}"}, {"{{support_email}}"}.
        </p>
        <label className="text-sm">Subject<Input className="mt-2" name="subject" value={template.subject} onChange={(event) => setTemplate({ ...template, subject: event.target.value })} required /></label>
        <label className="text-sm">Heading<Input className="mt-2" name="heading" value={template.heading} onChange={(event) => setTemplate({ ...template, heading: event.target.value })} required /></label>
        <label className="text-sm">
          Message
          <textarea name="body" value={template.body} onChange={(event) => setTemplate({ ...template, body: event.target.value })} required className="mt-2 min-h-36 w-full rounded-2xl border border-stone bg-white px-4 py-3" />
        </label>
        <label className="text-sm">Button label<Input className="mt-2" name="buttonLabel" value={template.buttonLabel} onChange={(event) => setTemplate({ ...template, buttonLabel: event.target.value })} required /></label>
        <label className="text-sm">Footer<Input className="mt-2" name="footer" value={template.footer} onChange={(event) => setTemplate({ ...template, footer: event.target.value })} required /></label>
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving" : "Save email"}</Button>
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
