-- Customer order confirmation copy. Super Admin edits it; the receipt is built when the order is paid.

insert into public.email_templates (
  id, from_name, from_email, subject, heading, body, button_label, footer
) values (
  'order_confirmation',
  'Joova Customer Support',
  'support@joova.tech',
  'Your Joova order {{order_id}}',
  'Your order is confirmed',
  E'Thank you for your order, {{name}}.\n\nPayment for {{order_id}} is received. This email is your receipt and invoice.\n\nShipping is free in the United States. Orders ship from US warehouses and are delivered in 7 to 10 days. We will email you again when it ships.',
  'Track this order',
  'Joova Tech LLC · Grapevine, Texas · {{support_email}}'
) on conflict (id) do nothing;
