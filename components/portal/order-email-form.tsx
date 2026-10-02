"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyPlaceholders, passwordEmailFrom, type PasswordEmailTemplate } from "@/lib/mail/template";

const sample = {
  order_id: "JO-1001",
  email: "customer@example.com",
  name: "Alex Rivera",
  total: "$59.99",
  support_email: passwordEmailFrom.email,
  site_name: "Joova",
  track_link: "https://joova.tech/track",
};

export function OrderEmailForm({ onError }: { onError: (message: string) => void }) {
  const [template, setTemplate] = useState<PasswordEmailTemplate | null>(null);
  const [configured, setConfigured] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch("/api/portal/email-template?id=order_confirmation")
      .then((response) => response.json())
      .then((data: { template?: PasswordEmailTemplate; resend?: { configured?: boolean } }) => {
        setTemplate(data.template ?? null);
        setConfigured(Boolean(data.resend?.configured));
      });
  }, []);

  if (!template) return <p className="mt-4 text-sm text-muted">Loading the order email.</p>;

  const preview = {
    subject: applyPlaceholders(template.subject, sample),
    heading: applyPlaceholders(template.heading, sample),
    body: applyPlaceholders(template.body, sample),
    buttonLabel: applyPlaceholders(template.buttonLabel, sample),
    footer: applyPlaceholders(template.footer, sample),
  };

  return (
    <form
      className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/portal/email-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: "order_confirmation",
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
          {configured ? "The Resend key is stored." : "The Resend key is not stored yet."} The receipt, line items, ship-to address, and total are added from the paid order. Placeholders: {"{{order_id}}"}, {"{{email}}"}, {"{{name}}"}, {"{{total}}"}, {"{{support_email}}"}, {"{{site_name}}"}.
        </p>
        <label className="text-sm">Subject<Input className="mt-2" name="subject" value={template.subject} onChange={(event) => setTemplate({ ...template, subject: event.target.value })} required /></label>
        <label className="text-sm">Heading<Input className="mt-2" name="heading" value={template.heading} onChange={(event) => setTemplate({ ...template, heading: event.target.value })} required /></label>
        <label className="text-sm">
          Message
          <textarea name="body" value={template.body} onChange={(event) => setTemplate({ ...template, body: event.target.value })} required className="mt-2 min-h-36 w-full rounded-2xl border border-stone bg-white px-4 py-3" />
        </label>
        <label className="text-sm">Button label<Input className="mt-2" name="buttonLabel" value={template.buttonLabel} onChange={(event) => setTemplate({ ...template, buttonLabel: event.target.value })} required /></label>
        <label className="text-sm">Footer<Input className="mt-2" name="footer" value={template.footer} onChange={(event) => setTemplate({ ...template, footer: event.target.value })} required /></label>
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving" : "Save order email"}</Button>
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
        <p className="mt-5 text-xs font-bold tracking-[0.14em] text-muted uppercase">Receipt and invoice</p>
        <p className="mt-1 font-bold">{sample.order_id}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <p><span className="text-muted">Date</span><br />September 30, 2026</p>
          <p><span className="text-muted">Ship to</span><br />Alex Rivera<br />100 Main St<br />Grapevine, TX 76051</p>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs tracking-[0.06em] text-muted uppercase">
              <th className="pb-2 font-normal">Item</th>
              <th className="pb-2 text-center font-normal">Qty</th>
              <th className="pb-2 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-stone">
              <td className="py-2">Joova Fitness Band<br /><span className="text-muted">Color Black</span></td>
              <td className="py-2 text-center">1</td>
              <td className="py-2 text-right">$59.99</td>
            </tr>
          </tbody>
        </table>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>$59.99</dd></div>
          <div className="flex justify-between border-t border-stone pt-1"><dt className="text-muted">Shipping</dt><dd>$0.00</dd></div>
          <div className="flex justify-between border-t border-ink pt-2 font-bold"><dt>Total</dt><dd>$59.99</dd></div>
        </dl>
        <p className="mt-3 text-xs text-muted">Paid with Stripe. Joova does not store your card number.</p>
        <p className="mt-4 inline-flex rounded-full bg-coral px-4 py-2 text-sm font-bold text-[var(--fixed-ink)]">{preview.buttonLabel}</p>
        <p className="mt-4 text-xs text-muted">{preview.footer}</p>
      </aside>
    </form>
  );
}
