-- Designed notice emails, editable from the admin portal, plus warehouse access to the original warranty order.

drop policy if exists warranty_claims_staff on public.warranty_claims;
create policy warranty_claims_staff on public.warranty_claims for select to authenticated
  using (public.app_role() in ('csr', 'inventory', 'super_admin'));

insert into public.email_templates (
  id, from_name, from_email, subject, heading, body, button_label, footer
) values
(
  'warranty_replacement',
  'Joova Customer Support',
  'support@joova.tech',
  'Warranty replacement {{order_id}}',
  'Your replacement is being prepared',
  E'Warranty replacement {{order_id}} is being prepared.\n\nIt is for your original order {{source_order}}. It ships the same way as a new order. We will email you when it ships.',
  'Track this order',
  'Joova Tech LLC · Grapevine, Texas · {{support_email}}'
),
(
  'exchange_order',
  'Joova Customer Support',
  'support@joova.tech',
  'Exchange order {{order_id}}',
  'Your exchange is being prepared',
  E'Exchange order {{order_id}} is being prepared.\n\nIt replaces your original order {{source_order}}. It ships the same way as a new order. We will email you when it ships.',
  'Track this order',
  'Joova Tech LLC · Grapevine, Texas · {{support_email}}'
),
(
  'shipment',
  'Joova Customer Support',
  'support@joova.tech',
  'Your Joova order {{order_id}} has shipped',
  'Your order has shipped',
  E'Order {{order_id}} has shipped.\n\n{{carrier}}\nTracking number: {{tracking}}',
  'Track this order',
  'Joova Tech LLC · Grapevine, Texas · {{support_email}}'
),
(
  'review_request',
  'Joova Customer Support',
  'support@joova.tech',
  'How was order {{order_id}}?',
  'How was your order?',
  E'Order {{order_id}} was delivered.\n\nIf you would like to share a review, send it from the reviews page. We publish a review after we read it.',
  'Write a review',
  'Joova Tech LLC · Grapevine, Texas · {{support_email}}'
),
(
  'refund',
  'Joova Customer Support',
  'support@joova.tech',
  'Refund for {{order_id}}',
  'Your refund was sent',
  E'The refund for order {{order_id}} has been sent.\n\nIt returns to the original payment method and appears 5 to 10 business days after we received the item. The refund receipt is attached.',
  'Track this order',
  'Joova Tech LLC · Grapevine, Texas · {{support_email}}'
),
(
  'back_in_stock',
  'Joova Customer Support',
  'support@joova.tech',
  '{{product}} is available again',
  '{{product}} is back',
  E'Hi {{name}},\n\n{{product}} is back in stock.',
  'View this item',
  'Joova Tech LLC · Grapevine, Texas · {{support_email}}'
),
(
  'low_stock',
  'Joova Customer Support',
  'support@joova.tech',
  'Low stock: {{product}}',
  'Low stock',
  E'{{product}} is down to {{available}} available.\n\nSKU {{sku}}. Available is on hand minus reserved.',
  'Open inventory',
  'Joova Tech LLC · Grapevine, Texas · {{support_email}}'
),
(
  'staff_order',
  'Joova Customer Support',
  'support@joova.tech',
  'New paid order {{order_id}}',
  'New paid order',
  E'{{name}} paid {{total}} for {{order_id}}.\n\n{{email}}',
  'Open support',
  'Joova Tech LLC · Grapevine, Texas · {{support_email}}'
),
(
  'stock_request',
  'Joova Customer Support',
  'support@joova.tech',
  'Customer request: {{product}}',
  'Customer request',
  E'{{name}} requested an out-of-stock item.\n\n{{product}}\nSKU {{sku}}\n\nReply to {{email}}\n\n{{note}}',
  'Reply',
  'Joova Tech LLC · Grapevine, Texas · {{support_email}}'
)
on conflict (id) do nothing;
