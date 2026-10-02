-- Store the Stripe invoice created for a paid order. The receipt stays a Joova document.

alter table public.orders add column if not exists stripe_invoice_id text;

update public.email_templates
set body = E'Thank you for your order, {{name}}.\n\nPayment for {{order_id}} is received. This email is your receipt. The Stripe invoice is attached.\n\nShipping is free in the United States. Orders ship from US warehouses and are delivered in 7 to 10 days. We will email you again when it ships.'
where id = 'order_confirmation'
  and body like '%receipt and invoice%';
