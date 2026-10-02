"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { OrderOrigin } from "@/components/orders/order-origin";
import { CouponDesk } from "@/components/portal/coupon-desk";
import { ResourceDelete } from "@/components/portal/resource-delete";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { purchaseText } from "@/lib/content/variants";
import { cn, formatUsd } from "@/lib/utils";

type Message = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  reply: string | null;
  kind?: string;
  created_at?: string;
  deleted_at?: string | null;
};
type Customer = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  support_note: string;
  created_at?: string;
  deleted_at?: string | null;
};
type Page<T> = { rows: T[]; total: number; page: number; pages: number; open?: number };
type ListPages = { customers: number; messages: number; requests: number; orders: number; returns: number; claims: number };
type AccountPages = { orders: number; messages: number; claims: number };
type CustomerTab = "profile" | "orders" | "messages" | "warranty";

type Order = {
  id: string;
  email: string;
  user_id: string | null;
  status: string;
  payment_status?: string;
  subtotal?: number;
  tax_amount?: number | null;
  discount_amount?: number | null;
  promo_code?: string | null;
  created_at?: string;
  deleted_at?: string | null;
  order_items: {
    id?: string;
    product_id: string;
    name: string;
    quantity?: number;
    color?: string | null;
    selection?: { color?: string; type?: string; size?: string; custom?: string; sku?: string } | null;
  }[];
  shipments: { carrier: string | null; tracking_number: string | null; status: string }[];
  returns: { id: string; status: string; reason: string; decision_note?: string; resolution?: string; deleted_at?: string | null }[];
  warranty_registrations?: { id: string; product_id: string; serial?: string | null; coverage_ends_at?: string | null; deleted_at?: string | null }[];
  order_kind?: string | null;
  warranty_claims?: { order_id?: string } | { order_id?: string }[] | null;
  source_return?: { order_id?: string } | { order_id?: string }[] | null;
};
type Claim = {
  id: string;
  user_id?: string | null;
  name?: string;
  email?: string;
  order_id: string;
  product_id?: string | null;
  serial?: string | null;
  status: string;
  message: string;
  replacement_order_id?: string | null;
  decision_note?: string;
  customer_reply?: string;
  created_at?: string;
  deleted_at?: string | null;
};
type OrderStep = "pending_payment" | "preparing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
type Account = { customer: Customer; messages: Page<Message>; orders: Page<Order>; claims: Page<Claim>; orderCounts?: Record<string, number> };

const orderSteps: { id: OrderStep; label: string }[] = [
  { id: "pending_payment", label: "Placed" },
  { id: "preparing", label: "Preparing" },
  { id: "shipped", label: "Shipped" },
  { id: "out_for_delivery", label: "Out for delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

function orderTotal(counts?: Record<string, number>) {
  return Object.values(counts ?? {}).reduce((sum, count) => sum + count, 0);
}

const firstPages: ListPages = { customers: 1, messages: 1, requests: 1, orders: 1, returns: 1, claims: 1 };
const firstAccountPages: AccountPages = { orders: 1, messages: 1, claims: 1 };
const emptyPage = { rows: [], total: 0, page: 1, pages: 1, open: 0 };
type Section = "customers" | "messages" | "requests" | "orders" | "returns" | "claims" | "coupons";

type ReturnOrder = {
  id: string;
  email?: string;
  payment_status?: string;
  subtotal?: number;
  shipping?: { name?: string; line1?: string; city?: string; region?: string; postal?: string } | null;
  order_items?: { name: string; quantity?: number; color?: string | null; selection?: { color?: string; type?: string; size?: string; custom?: string; sku?: string } | null }[];
  shipments?: { status?: string; carrier?: string | null; tracking_number?: string | null; delivered_at?: string | null }[];
};

type ReturnRequest = {
  id: string;
  order_id: string;
  email: string;
  reason: string;
  resolution?: string;
  status: string;
  decision_note?: string;
  replacement_carrier?: string;
  replacement_tracking?: string;
  replacement_order_id?: string | null;
  refund_receipt_path?: string;
  refund_invoice_path?: string;
  customer_reply?: string;
  requested_at?: string;
  reviewed_at?: string | null;
  received_at?: string | null;
  deleted_at?: string | null;
  orders?: ReturnOrder | ReturnOrder[] | null;
};

const statusLabel: Record<string, string> = {
  open: "Open",
  replied: "Replied",
  closed: "Closed",
  pending_payment: "Pending payment",
  preparing: "Preparing",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  requested: "Requested",
  needs_info: "More information",
  approved: "Approved",
  rejected: "Rejected",
  received: "Received",
  refunded: "Refunded",
  reopened: "Reopened",
  exchange_ordered: "Exchange order",
  reviewing: "Reviewing",
  replaced: "Replaced",
  unpaid: "Unpaid",
  paid: "Paid",
};

function label(value: string) {
  return statusLabel[value] ?? value.replaceAll("_", " ");
}

function when(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function customerState(customer: Customer) {
  if (customer.deleted_at) return "Removed";
  return customer.active ? "Active" : "Inactive";
}

async function post(body: unknown) {
  const response = await fetch("/api/portal/support", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { error?: string; notice?: string };
  if (!response.ok) return { error: data.error ?? "That change could not be saved.", notice: "" };
  return { error: "", notice: data.notice ?? "" };
}

function actionCopy(body: Record<string, unknown>) {
  const action = String(body.action ?? "");
  const subject = String(body.subject ?? "").trim();
  const named = subject ? ` for ${subject}` : "";
  if (action === "customer") {
    return {
      title: "Save this customer",
      detail: `Save the name and support note${named}?`,
      done: `Customer record saved${named}.`,
    };
  }
  if (action === "reply") {
    const closing = body.status === "closed";
    return {
      title: closing ? "Send this reply and close it" : "Send this reply",
      detail: closing
        ? `Send this reply${named} and close the message?`
        : `Send this reply${named}?`,
      done: closing ? `Reply sent${named}. The message is closed.` : `Reply sent${named}.`,
    };
  }
  if (action === "reviewReturn") {
    const decision = String(body.decision ?? "");
    if (decision === "approve") return { title: "Approve this return", detail: `Approve the return${named}? Fulfillment can then receive the package.`, done: `Return approved${named}.` };
    if (decision === "reject") return { title: "Reject this return", detail: `Reject the return${named}? The customer will see the reason you wrote.`, done: `Return rejected${named}.` };
    if (decision === "needs_info") return { title: "Ask for more information", detail: `Ask the customer for more information${named}? They can reply from their account.`, done: `Request for more information sent${named}.` };
    if (decision === "reopen") return { title: "Reopen this return", detail: `Reopen the rejected return${named}? The customer can request it again.`, done: `Return reopened${named}.` };
  }
  if (action === "issueRefund") {
    return {
      title: "Refund the original payment",
      detail: `Refund${named} through Stripe? The customer gets a confirmation with the refund receipt. The receipt and invoice stay on this return. You can close the case after that.`,
      done: `Refund sent${named}. The receipt is saved on this return. It appears on the original payment method in 5 to 10 business days.`,
    };
  }
  if (action === "createExchange") {
    return {
      title: "Create the exchange order",
      detail: `Create a replacement order${named}? It is reserved in stock and goes through fulfillment like a new order.`,
      done: `Exchange order created${named}. Fulfillment can ship it like a new order.`,
    };
  }
  if (action === "closeReturn") {
    return {
      title: "Close this return",
      detail: `Close this return${named}?`,
      done: `Return closed${named}.`,
    };
  }
  if (action === "createWarrantyOrder") {
    return {
      title: "Create the replacement order",
      detail: `Create a warranty replacement order${named}? It is reserved in stock and goes through fulfillment like a new order.`,
      done: `Replacement order created${named}. Fulfillment can ship it like a new order.`,
    };
  }
  if (action === "closeClaim") {
    return {
      title: "Close this warranty claim",
      detail: `Close this claim${named}? The replacement order keeps moving through fulfillment.`,
      done: `Warranty claim closed${named}.`,
    };
  }
  if (action === "reviewClaim") {
    const decision = String(body.decision ?? "");
    if (decision === "approve") return { title: "Approve this warranty claim", detail: `Approve the claim${named}? A repair or replacement can follow.`, done: `Warranty claim approved${named}.` };
    if (decision === "reject") return { title: "Close this warranty claim", detail: `Close the claim${named}? The customer will see the reason you wrote.`, done: `Warranty claim closed${named}.` };
    if (decision === "needs_info") return { title: "Ask for more information", detail: `Ask the customer for more information${named}? They can reply from My Devices.`, done: `Request for more information sent${named}.` };
    if (decision === "replace") return { title: "Mark the replacement sent", detail: `Mark the replacement sent${named}? This closes the warranty claim.`, done: `Replacement marked sent${named}. The claim is closed.` };
  }
  if (action === "warranty") {
    return { title: "Register this warranty", detail: `Register this product on the warranty${named}?`, done: `Warranty registered${named}.` };
  }
  if (action === "fileClaim") {
    return { title: "File this warranty claim", detail: `File this warranty claim${named}?`, done: `Warranty claim filed${named}.` };
  }
  if (action === "resend") {
    const email = String(body.email ?? "").trim();
    return {
      title: "Resend confirmation",
      detail: email
        ? `Send the order confirmation${named} to ${email}? The email includes the receipt, and the Stripe invoice is attached.`
        : `Send the order confirmation${named} again?`,
      done: email ? `Confirmation sent to ${email}.` : `Confirmation sent${named}.`,
    };
  }
  if (action === "shipment") {
    return { title: "Update this shipment", detail: `Save this shipment update${named}?`, done: `Shipment updated${named}.` };
  }
  if (action === "return") {
    return { title: "Update this return", detail: `Save this return update${named}?`, done: `Return updated${named}.` };
  }
  if (action === "claim") {
    return { title: "Update this warranty claim", detail: `Save this claim update${named}?`, done: `Warranty claim updated${named}.` };
  }
  return { title: "Confirm this change", detail: "Save this change?", done: "Saved." };
}

export function SupportDesk() {
  const [section, setSection] = useState<Section>("customers");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<{
    title: string;
    detail: string;
    done: string;
    body: Record<string, unknown>;
    resolve: (message: string) => void;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [pages, setPages] = useState<ListPages>(firstPages);
  const [accountPages, setAccountPages] = useState<AccountPages>(firstAccountPages);
  const [orderStatus, setOrderStatus] = useState<OrderStep>("pending_payment");
  const [accountOrderStatus, setAccountOrderStatus] = useState<OrderStep>("pending_payment");
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [customers, setCustomers] = useState<Page<Customer>>(emptyPage);
  const [messages, setMessages] = useState<Page<Message>>(emptyPage);
  const [requests, setRequests] = useState<Page<Message>>(emptyPage);
  const [orders, setOrders] = useState<Page<Order>>(emptyPage);
  const [returns, setReturns] = useState<Page<ReturnRequest>>(emptyPage);
  const [claims, setClaims] = useState<Page<Claim>>(emptyPage);
  const [people, setPeople] = useState<Customer[]>([]);
  const [selected, setSelected] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  useEffect(() => {
    void load({ query: "" });
    // The desk loads the customer list when it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(options?: {
    query?: string;
    customerId?: string;
    pages?: ListPages;
    accountPages?: AccountPages;
    orderStatus?: OrderStep;
    accountOrderStatus?: OrderStep;
    opened?: boolean;
  }) {
    const query = options?.query ?? q;
    const customerId = options?.customerId ?? selected;
    const pageState = options?.pages ?? pages;
    const accountState = options?.accountPages ?? accountPages;
    const status = options?.orderStatus ?? orderStatus;
    const accountStatus = options?.accountOrderStatus ?? accountOrderStatus;
    setError("");
    const params = new URLSearchParams({
      q: query,
      customer: customerId,
      customersPage: String(pageState.customers),
      messagesPage: String(pageState.messages),
      requestsPage: String(pageState.requests),
      ordersPage: String(pageState.orders),
      returnsPage: String(pageState.returns),
      claimsPage: String(pageState.claims),
      accountOrdersPage: String(accountState.orders),
      accountMessagesPage: String(accountState.messages),
      accountClaimsPage: String(accountState.claims),
      ordersStatus: status,
      accountOrdersStatus: accountStatus,
    });
    if (options?.opened) params.set("opened", "1");
    const response = await fetch(`/api/portal/support?${params.toString()}`);
    const data = (await response.json()) as {
      pageSize?: number;
      customers?: Page<Customer>;
      messages?: Page<Message>;
      requests?: Page<Message>;
      orders?: Page<Order>;
      orderCounts?: Record<string, number>;
      returns?: Page<ReturnRequest>;
      claims?: Page<Claim>;
      account?: Account | null;
      people?: { id: string; name: string; email: string }[];
      error?: string;
    };
    if (!response.ok) {
      setError(data.error ?? "Support records could not be loaded.");
      return;
    }
    setPageSize(data.pageSize && data.pageSize > 0 ? data.pageSize : 10);
    setCustomers(data.customers ?? emptyPage);
    setMessages(data.messages ?? emptyPage);
    setRequests(data.requests ?? emptyPage);
    setOrders(data.orders ?? emptyPage);
    setOrderCounts(data.orderCounts ?? {});
    setReturns(data.returns ?? emptyPage);
    setClaims(data.claims ?? emptyPage);
    setAccount(data.account ?? null);
    setPeople((data.people ?? []).map((person) => ({ ...person, active: true, support_note: "" })));
    if (data.customers) setPages((current) => ({ ...current, customers: data.customers?.page ?? current.customers }));
    if (data.messages) setPages((current) => ({ ...current, messages: data.messages?.page ?? current.messages }));
    if (data.requests) setPages((current) => ({ ...current, requests: data.requests?.page ?? current.requests }));
    if (data.orders) setPages((current) => ({ ...current, orders: data.orders?.page ?? current.orders }));
    if (data.returns) setPages((current) => ({ ...current, returns: data.returns?.page ?? current.returns }));
    if (data.claims) setPages((current) => ({ ...current, claims: data.claims?.page ?? current.claims }));
  }

  async function openCustomer(id: string) {
    setSection("customers");
    setSelected(id);
    setNotice("");
    setError("");
    const nextAccount = firstAccountPages;
    setAccountPages(nextAccount);
    setLoadingAccount(true);
    await load({ customerId: id, accountPages: nextAccount, opened: true });
    setLoadingAccount(false);
  }

  function turn(list: keyof ListPages, page: number) {
    const next = { ...pages, [list]: page };
    setPages(next);
    void load({ pages: next });
  }

  function chooseOrderStatus(status: OrderStep) {
    setOrderStatus(status);
    const next = { ...pages, orders: 1 };
    setPages(next);
    void load({ pages: next, orderStatus: status });
  }

  function chooseAccountOrderStatus(status: OrderStep) {
    setAccountOrderStatus(status);
    const next = { ...accountPages, orders: 1 };
    setAccountPages(next);
    void load({ accountPages: next, accountOrderStatus: status });
  }

  function turnAccount(list: keyof AccountPages, page: number) {
    const next = { ...accountPages, [list]: page };
    setAccountPages(next);
    void load({ accountPages: next });
  }

  async function reload() {
    await load();
  }

  function dismissPending() {
    if (confirming) return;
    if (pending && !doneMessage) pending.resolve("");
    setPending(null);
    setDoneMessage("");
    setDialogError("");
    setConfirming(false);
  }

  async function confirmPending() {
    if (!pending || doneMessage) return;
    setConfirming(true);
    setDialogError("");
    const payload = { ...pending.body };
    delete payload.subject;
    delete payload.email;
    const result = await post(payload);
    setConfirming(false);
    if (result.error) {
      setDialogError(result.error);
      setError(result.error);
      return;
    }
    const finished = result.notice || pending.done;
    setError("");
    setNotice(finished);
    setDoneMessage(finished);
    pending.resolve("");
    await load();
  }

  async function save(body: unknown) {
    const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const copy = actionCopy(record);
    setError("");
    setNotice("");
    setDoneMessage("");
    setDialogError("");
    return await new Promise<string>((resolve) => {
      setPending({ ...copy, body: record, resolve });
    });
  }

  function customerByEmail(email: string) {
    const needle = email.toLowerCase();
    return customers.rows.find((customer) => customer.email.toLowerCase() === needle)
      ?? people.find((customer) => customer.email.toLowerCase() === needle)
      ?? null;
  }

  const openMessages = messages.open ?? 0;
  const openRequests = requests.open ?? 0;
  const openClaims = claims.open ?? 0;
  const openReturns = returns.open ?? 0;
  const tabs: { id: Section; label: string }[] = [
    { id: "customers", label: `Customers (${customers.total})` },
    { id: "messages", label: `Messages (${messages.total})` },
    { id: "requests", label: `Customer requests (${requests.total})` },
    { id: "orders", label: `Orders (${orderTotal(orderCounts)})` },
    { id: "returns", label: `Returns (${openReturns})` },
    { id: "claims", label: `Warranty (${claims.total})` },
    { id: "coupons", label: "Coupons" },
  ];

  return (
    <div className="mt-8">
      <form
        className="flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const next = firstPages;
          setPages(next);
          void load({ pages: next });
        }}
      >
        <label className="min-w-64 flex-1">
          <span className="text-sm text-ink">Search</span>
          <Input className="mt-2" value={q} placeholder="Name, email, note, message, order, item, tracking, or warranty" onChange={(event) => setQ(event.target.value)} />
        </label>
        <Button type="submit" className="self-end">
          Search
        </Button>
      </form>
      <p className="mt-3 text-sm text-muted">
        {customers.total} customer {customers.total === 1 ? "account" : "accounts"}
        {" · "}
        {openMessages} open {openMessages === 1 ? "message" : "messages"}
        {" · "}
        {openRequests} open customer {openRequests === 1 ? "request" : "requests"}
        {" · "}
        {orderTotal(orderCounts)} {orderTotal(orderCounts) === 1 ? "order" : "orders"}
        {" · "}
        {openReturns} open {openReturns === 1 ? "return" : "returns"}
        {" · "}
        {openClaims} open warranty {openClaims === 1 ? "claim" : "claims"}
      </p>
      {error ? <p className="mt-3" role="alert">{error}</p> : null}
      {notice ? <p className="mt-3" role="status">{notice}</p> : null}
      <Dialog.Root open={Boolean(pending)} onOpenChange={(open) => { if (!open) dismissPending(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-ink"
            onEscapeKeyDown={(event) => { if (confirming) event.preventDefault(); }}
            onPointerDownOutside={(event) => { if (confirming) event.preventDefault(); }}
          >
            {doneMessage ? (
              <>
                <Dialog.Title className="font-display text-xl">Done</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-muted">{doneMessage}</Dialog.Description>
                <div className="mt-4">
                  <Button type="button" size="sm" onClick={dismissPending}>Close</Button>
                </div>
              </>
            ) : (
              <>
                <Dialog.Title className="font-display text-xl">{pending?.title}</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-muted">{pending?.detail}</Dialog.Description>
                {dialogError ? <p className="mt-3 text-sm" role="alert">{dialogError}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Dialog.Close className={buttonClassName("secondary", "sm")} disabled={confirming}>Cancel</Dialog.Close>
                  <Button type="button" size="sm" disabled={confirming} onClick={() => void confirmPending()}>
                    {confirming ? "Working" : "Confirm"}
                  </Button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={section === tab.id}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-bold",
              section === tab.id ? "bg-ink text-paper" : "border border-stone text-ink",
            )}
            onClick={() => setSection(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {section === "customers" ? (
        <section className="mt-6">
          <h2 className="font-display text-2xl">Customers</h2>
          <p className="mt-2 text-sm text-muted">Website accounts with the customer role. Open one to update the name, leave an internal note, and work their orders, messages, and warranty.</p>
          {customers.rows.length === 0 ? (
            <p className="mt-4 text-muted">{q ? "No customer accounts match that search." : "No customer accounts yet."}</p>
          ) : (
            <ul className="mt-4 overflow-hidden rounded-3xl bg-white">
              {customers.rows.map((customer) => {
                const current = selected === customer.id;
                return (
                  <li key={customer.id} className="border-b border-stone last:border-b-0">
                    <button
                      type="button"
                      aria-expanded={current}
                      className={cn("flex w-full items-center justify-between gap-4 px-4 py-4 text-left", current && "bg-stone/40")}
                      onClick={() => void openCustomer(customer.id)}
                    >
                      <span className="min-w-0">
                        <span className="block font-bold">{customer.name}</span>
                        <span className="block break-all text-sm text-muted">{customer.email}</span>
                      </span>
                      <span className="shrink-0 text-sm text-muted">{customerState(customer)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <Pager page={customers.page} pages={customers.pages} total={customers.total} pageSize={pageSize} onPage={(page) => turn("customers", page)} />
          {loadingAccount ? <p className="mt-4 text-sm text-muted">Loading the customer record.</p> : null}
          {account && selected === account.customer.id ? (
            <CustomerRecord
              key={account.customer.id}
              account={account}
              pageSize={pageSize}
              onSave={save}
              onReload={() => void reload()}
              onOpenCustomer={(id) => void openCustomer(id)}
              customerByEmail={customerByEmail}
              searching={q.trim().length > 0}
              orderStatus={accountOrderStatus}
              onOrderStatus={chooseAccountOrderStatus}
              onOrdersPage={(page) => turnAccount("orders", page)}
              onMessagesPage={(page) => turnAccount("messages", page)}
              onClaimsPage={(page) => turnAccount("claims", page)}
            />
          ) : null}
        </section>
      ) : null}

      {section === "messages" ? (
        <section className="mt-6">
          <h2 className="font-display text-2xl">Messages</h2>
          {messages.rows.length === 0 ? (
            <p className="mt-4 text-muted">{q ? "No messages match that search." : "No messages yet."}</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {messages.rows.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  customer={customerByEmail(message.email)}
                  onSave={save}
                  onReload={() => void reload()}
                  onOpenCustomer={(id) => void openCustomer(id)}
                />
              ))}
            </ul>
          )}
          <Pager page={messages.page} pages={messages.pages} total={messages.total} pageSize={pageSize} onPage={(page) => turn("messages", page)} />
        </section>
      ) : null}

      {section === "requests" ? (
        <section className="mt-6">
          <h2 className="font-display text-2xl">Customer requests</h2>
          <p className="mt-2 text-sm text-muted">Requests from the shop for items that are out of stock.</p>
          {requests.rows.length === 0 ? (
            <p className="mt-4 text-muted">{q ? "No customer requests match that search." : "No customer requests yet."}</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {requests.rows.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  customer={customerByEmail(message.email)}
                  onSave={save}
                  onReload={() => void reload()}
                  onOpenCustomer={(id) => void openCustomer(id)}
                />
              ))}
            </ul>
          )}
          <Pager page={requests.page} pages={requests.pages} total={requests.total} pageSize={pageSize} onPage={(page) => turn("requests", page)} />
        </section>
      ) : null}

      {section === "orders" ? (
        <section className="mt-6">
          <h2 className="font-display text-2xl">Orders</h2>
          <OrderStatusTabs status={orderStatus} counts={orderCounts} onChoose={chooseOrderStatus} />
          {orders.rows.length === 0 ? (
            <p className="mt-4 text-muted">{q ? "No orders match that search." : `No ${orderSteps.find((step) => step.id === orderStatus)?.label.toLowerCase()} orders.`}</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {orders.rows.map((order) => (
                <li key={order.id}>
                  <OrderCard
                    order={order}
                    customer={customerByEmail(order.email) ?? customers.rows.find((customer) => customer.id === order.user_id) ?? people.find((customer) => customer.id === order.user_id) ?? null}
                    onSave={save}
                    onReload={() => void reload()}
                    onOpenCustomer={(id) => void openCustomer(id)}
                  />
                </li>
              ))}
            </ul>
          )}
          <Pager page={orders.page} pages={orders.pages} total={orders.total} pageSize={pageSize} onPage={(page) => turn("orders", page)} />
        </section>
      ) : null}

      {section === "returns" ? (
        <section className="mt-6">
          <h2 className="font-display text-2xl">Returns</h2>
          <p className="mt-2 text-sm text-muted">Requests start as requested. The customer chooses a refund or an exchange for a similar item. Approve one inside the 30-day window, reject it with a reason, or ask for more information. After Fulfillment marks it received, refund the original payment or create an exchange order. The exchange order ships like a new order. Close the return after the refund or the exchange order is in place.</p>
          {returns.rows.length === 0 ? (
            <p className="mt-4 text-muted">{q ? "No returns match that search." : "No return requests yet."}</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {returns.rows.map((item) => (
                <ReturnCard
                  key={item.id}
                  item={item}
                  customer={customerByEmail(item.email)}
                  onSave={save}
                  onOpenCustomer={(id) => void openCustomer(id)}
                />
              ))}
            </ul>
          )}
          <Pager page={returns.page} pages={returns.pages} total={returns.total} pageSize={pageSize} onPage={(page) => turn("returns", page)} />
        </section>
      ) : null}

      {section === "claims" ? (
        <section className="mt-6">
          <h2 className="font-display text-2xl">Warranty claims</h2>
          <p className="mt-2 text-sm text-muted">Claims start as open on a registered device. Approve a repair or replacement, reject it with a reason, or ask for more information. A replacement order ships like a new order. Close the claim after that order is created.</p>
          {claims.rows.length === 0 ? (
            <p className="mt-4 text-muted">{q ? "No warranty claims match that search." : "No warranty claims yet."}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {claims.rows.map((claim) => (
                <ClaimCard
                  key={claim.id}
                  claim={claim}
                  customer={(claim.email ? customerByEmail(claim.email) : null) ?? customers.rows.find((customer) => customer.id === claim.user_id) ?? people.find((customer) => customer.id === claim.user_id) ?? null}
                  onSave={save}
                  onReload={() => void reload()}
                  onOpenCustomer={(id) => void openCustomer(id)}
                />
              ))}
            </ul>
          )}
          <Pager page={claims.page} pages={claims.pages} total={claims.total} pageSize={pageSize} onPage={(page) => turn("claims", page)} />
        </section>
      ) : null}

      {section === "coupons" ? <CouponDesk onError={setError} /> : null}
    </div>
  );
}

function returnOrder(item: ReturnRequest) {
  if (!item.orders) return null;
  return Array.isArray(item.orders) ? item.orders[0] ?? null : item.orders;
}

function policyLine(deliveredAt?: string | null) {
  if (!deliveredAt) return "Not delivered. The 30-day window has not started.";
  const start = new Date(deliveredAt);
  if (Number.isNaN(start.getTime())) return "Delivery date is missing.";
  const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  const open = Date.now() <= end.getTime();
  return open
    ? `Delivered ${when(deliveredAt)}. The 30-day window is open through ${when(end.toISOString())}. Return shipping is covered in the United States.`
    : `Delivered ${when(deliveredAt)}. The 30-day window closed on ${when(end.toISOString())}.`;
}

function ReturnCard({
  item,
  customer,
  onSave,
  onOpenCustomer,
}: {
  item: ReturnRequest;
  customer: Customer | null;
  onSave: (body: unknown) => Promise<string>;
  onOpenCustomer: (id: string) => void;
}) {
  const order = returnOrder(item);
  const delivered = order?.shipments?.find((shipment) => shipment.delivered_at)?.delivered_at;
  const ship = order?.shipping;
  const waiting = item.status === "requested" || item.status === "needs_info";
  return (
    <li className="rounded-3xl bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">{item.order_id}</p>
          <p className="text-sm text-muted">{item.email}</p>
        </div>
        <p className="text-sm font-bold">{label(item.status)}</p>
      </div>
      <p className="mt-3 text-sm font-bold">{item.resolution === "exchange" ? "Exchange for a similar item" : "Refund to the original payment method"}</p>
      <p className="mt-2 text-sm">{item.reason}</p>
      <p className="mt-2 text-sm text-muted">{policyLine(delivered)}</p>
      {order?.order_items?.length ? (
        <ul className="mt-2 text-sm text-muted">
          {order.order_items.map((line) => (
            <li key={`${item.id}-${line.name}`}>
              {line.name}{line.quantity ? ` × ${line.quantity}` : ""}
              {purchaseText(line.selection, line.color ?? undefined) ? ` · ${purchaseText(line.selection, line.color ?? undefined)}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
      {ship?.line1 ? (
        <p className="mt-2 text-sm text-muted">
          Ship to {ship.name ? `${ship.name}, ` : ""}{ship.line1}, {[ship.city, ship.region, ship.postal].filter(Boolean).join(", ")}
        </p>
      ) : null}
      <p className="mt-2 text-sm text-muted">Requested {when(item.requested_at)}</p>
      {item.decision_note ? <p className="mt-2 text-sm">Note to customer: {item.decision_note}</p> : null}
      {item.customer_reply ? <p className="mt-2 text-sm">Customer reply: {item.customer_reply}</p> : null}
      {item.status === "approved" ? (
        <p className="mt-2 text-sm text-muted">
          Approved. Fulfillment receives the package. After that, {item.resolution === "exchange" ? "create the exchange order here." : "refund the original payment here."}
        </p>
      ) : null}
      {item.status === "received" ? (
        <p className="mt-2 text-sm text-muted">
          Received {when(item.received_at)}. {item.resolution === "exchange" ? "Create the exchange order. It ships like a new order." : "Refund the original payment. The customer sees it in 5 to 10 business days."}
        </p>
      ) : null}
      {item.status === "exchange_ordered" ? (
        <p className="mt-2 text-sm text-muted">
          Exchange order {item.replacement_order_id} is in fulfillment. Close this return when you are finished with the case.
        </p>
      ) : null}
      {item.status === "reopened" ? <p className="mt-2 text-sm text-muted">Reopened. The customer can request this return again.</p> : null}
      {item.status === "refunded" ? (
        <p className="mt-2 text-sm text-muted">Refund sent to the original payment method. It appears 5 to 10 business days after the item was received. Close the case when you are finished.</p>
      ) : null}
      {item.status === "closed" ? (
        <p className="mt-2 text-sm text-muted">
          Closed. {item.resolution === "exchange"
            ? `Exchange order ${item.replacement_order_id || "created"}.`
            : "Refund sent to the original payment method. It appears 5 to 10 business days after the item was received."}
        </p>
      ) : null}
      {item.refund_receipt_path || item.refund_invoice_path ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.refund_receipt_path ? (
            <>
              <a className={buttonClassName("secondary", "sm")} href={`/api/portal/support/return-file?id=${item.id}&kind=receipt`} target="_blank" rel="noopener noreferrer">View refund receipt</a>
              <a className={buttonClassName("secondary", "sm")} href={`/api/portal/support/return-file?id=${item.id}&kind=receipt&format=pdf`}>Download refund receipt</a>
            </>
          ) : null}
          {item.refund_invoice_path ? (
            <>
              <a className={buttonClassName("secondary", "sm")} href={`/api/portal/support/return-file?id=${item.id}&kind=invoice`} target="_blank" rel="noopener noreferrer">View refund invoice</a>
              <a className={buttonClassName("secondary", "sm")} href={`/api/portal/support/return-file?id=${item.id}&kind=invoice&format=pdf`}>Download refund invoice</a>
            </>
          ) : null}
        </div>
      ) : null}
      {item.status === "received" && item.resolution === "exchange" ? (
        <form className="mt-4" onSubmit={async (event) => {
          event.preventDefault();
          await onSave({ action: "createExchange", id: item.id, subject: item.order_id });
        }}>
          <Button type="submit" size="sm">Create exchange order</Button>
        </form>
      ) : null}
      {item.status === "received" && item.resolution !== "exchange" ? (
        <form className="mt-4" onSubmit={async (event) => {
          event.preventDefault();
          await onSave({ action: "issueRefund", id: item.id, subject: item.order_id });
        }}>
          <Button type="submit" size="sm">Refund the original payment</Button>
        </form>
      ) : null}
      {item.status === "refunded" || item.status === "exchange_ordered" ? (
        <form className="mt-4" onSubmit={async (event) => {
          event.preventDefault();
          await onSave({ action: "closeReturn", id: item.id, subject: item.order_id });
        }}>
          <Button type="submit" size="sm">Close this return</Button>
        </form>
      ) : null}
      {waiting ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            await onSave({
              action: "reviewReturn",
              id: item.id,
              decision: String(data.get("decision") ?? ""),
              note: String(data.get("note") ?? ""),
              subject: item.order_id,
            });
          }}
        >
          <label className="block text-sm">
            Decision
            <select name="decision" className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" defaultValue={item.status === "needs_info" ? "reject" : "approve"}>
              {item.status === "requested" ? <option value="approve">Approve</option> : null}
              <option value="reject">Reject</option>
              {item.status === "requested" ? <option value="needs_info">Request more information</option> : null}
            </select>
          </label>
          <label className="block text-sm">
            Reason for the customer
            <textarea name="note" className="mt-2 min-h-20 w-full rounded-2xl border border-stone bg-white px-4 py-3" placeholder="Required when rejecting or asking for more information." />
          </label>
          <Button type="submit" size="sm">Save decision</Button>
        </form>
      ) : null}
      {item.status === "rejected" ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            await onSave({
              action: "reviewReturn",
              id: item.id,
              decision: "reopen",
              note: String(data.get("note") ?? ""),
              subject: item.order_id,
            });
          }}
        >
          <label className="block text-sm">
            Note for the customer
            <textarea name="note" className="mt-2 min-h-20 w-full rounded-2xl border border-stone bg-white px-4 py-3" placeholder="Optional. Leave blank to keep the rejection reason." />
          </label>
          <Button type="submit" size="sm">Reopen and activate</Button>
        </form>
      ) : null}
      {customer ? (
        <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => onOpenCustomer(customer.id)}>
          Open customer
        </Button>
      ) : (
        <p className="mt-3 text-sm text-muted">Guest checkout. No customer account is tied to this email.</p>
      )}
    </li>
  );
}

function OrderStatusTabs({
  status,
  counts,
  onChoose,
}: {
  status: OrderStep;
  counts?: Record<string, number>;
  onChoose: (status: OrderStep) => void;
}) {
  return (
    <nav className="mt-4 flex flex-wrap gap-2" aria-label="Order status">
      {orderSteps.map((step) => {
        const count = counts?.[step.id] ?? 0;
        const selected = status === step.id;
        return (
          <button
            key={step.id}
            type="button"
            aria-pressed={selected}
            className={cn("min-h-11 rounded-full px-4 text-sm", selected ? "border border-ink font-bold text-ink" : "text-muted")}
            onClick={() => onChoose(step.id)}
          >
            {step.label} ({count})
          </button>
        );
      })}
    </nav>
  );
}

function Pager({
  page,
  pages,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted">{total} entries · {pageSize} per page</p>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <span>Page {page} of {pages}</span>
        <Button type="button" size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

function CustomerRecord({
  account,
  pageSize,
  onSave,
  onReload,
  onOpenCustomer,
  customerByEmail,
  searching,
  orderStatus,
  onOrderStatus,
  onOrdersPage,
  onMessagesPage,
  onClaimsPage,
}: {
  account: Account;
  pageSize: number;
  onSave: (body: unknown) => Promise<string>;
  onReload: () => void;
  onOpenCustomer: (id: string) => void;
  customerByEmail: (email: string) => Customer | null;
  searching: boolean;
  orderStatus: OrderStep;
  onOrderStatus: (status: OrderStep) => void;
  onOrdersPage: (page: number) => void;
  onMessagesPage: (page: number) => void;
  onClaimsPage: (page: number) => void;
}) {
  const [tab, setTab] = useState<CustomerTab>("profile");
  const customer = account.customer;
  const tabs: { id: CustomerTab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "orders", label: `Orders (${orderTotal(account.orderCounts)})` },
    { id: "messages", label: `Messages (${account.messages.total})` },
    { id: "warranty", label: `Warranty (${account.claims.total})` },
  ];
  return (
    <div className="mt-6 rounded-3xl bg-white p-4 sm:p-6">
      <p className="text-sm text-muted">{customerState(customer)}{customer.created_at ? ` · Joined ${when(customer.created_at)}` : ""}</p>
      <h3 className="mt-1 font-display text-2xl">{customer.name}</h3>
      <p className="break-all text-sm text-muted">{customer.email}</p>
      <nav className="mt-5 flex flex-wrap gap-2" aria-label={`${customer.name} record`}>
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            className={cn("min-h-11 rounded-full px-4 text-sm", tab === item.id ? "border border-ink font-bold text-ink" : "text-muted")}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {tab === "profile" ? (
      <form
        key={`${customer.id}:${customer.name}:${customer.support_note}`}
        className="mt-4 space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          await onSave({
            action: "customer",
            id: customer.id,
            name: String(data.get("name") ?? ""),
            note: String(data.get("note") ?? ""),
            subject: customer.name,
          });
        }}
      >
        <label className="block">
          <span className="text-sm">Name</span>
          <Input className="mt-2" name="name" defaultValue={customer.name} required />
        </label>
        <label className="block">
          <span className="text-sm">Internal note</span>
          <textarea
            name="note"
            defaultValue={customer.support_note}
            className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3"
          />
        </label>
        <p className="text-sm text-muted">The note stays on this record. Email changes are made in Admin.</p>
        <Button type="submit" size="sm">Save customer</Button>
      </form>
      ) : null}

      {tab === "orders" ? (
        <div className="mt-6">
          <OrderStatusTabs status={orderStatus} counts={account.orderCounts} onChoose={onOrderStatus} />
          {account.orders.rows.length === 0 ? <p className="mt-4 text-sm text-muted">{searching ? "No orders match that search." : `No ${orderSteps.find((step) => step.id === orderStatus)?.label.toLowerCase()} orders.`}</p> : (
            <ul className="space-y-4">
              {account.orders.rows.map((order) => (
                <li key={order.id}>
                  <OrderCard order={order} customer={customer} showLink={false} onSave={onSave} onReload={onReload} onOpenCustomer={onOpenCustomer} />
                </li>
              ))}
            </ul>
          )}
          <Pager page={account.orders.page} pages={account.orders.pages} total={account.orders.total} pageSize={pageSize} onPage={onOrdersPage} />
        </div>
      ) : null}

      {tab === "messages" ? (
        <div className="mt-6">
          {account.messages.rows.length === 0 ? <p className="text-sm text-muted">{searching ? "No messages match that search." : "No messages from this email."}</p> : (
            <ul className="space-y-4">
              {account.messages.rows.map((message) => (
                <MessageCard key={message.id} message={message} customer={customerByEmail(message.email)} showLink={false} onSave={onSave} onReload={onReload} onOpenCustomer={onOpenCustomer} />
              ))}
            </ul>
          )}
          <Pager page={account.messages.page} pages={account.messages.pages} total={account.messages.total} pageSize={pageSize} onPage={onMessagesPage} />
        </div>
      ) : null}

      {tab === "warranty" ? (
        <div className="mt-6">
          {account.claims.rows.length === 0 ? <p className="text-sm text-muted">{searching ? "No warranty claims match that search." : "No warranty claims for this customer."}</p> : (
            <ul className="space-y-3">
              {account.claims.rows.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} customer={customer} showLink={false} onSave={onSave} onReload={onReload} onOpenCustomer={onOpenCustomer} />
              ))}
            </ul>
          )}
          <Pager page={account.claims.page} pages={account.claims.pages} total={account.claims.total} pageSize={pageSize} onPage={onClaimsPage} />
        </div>
      ) : null}
    </div>
  );
}

function MessageCard({
  message,
  customer,
  showLink = true,
  onSave,
  onReload,
  onOpenCustomer,
}: {
  message: Message;
  customer: Customer | null;
  showLink?: boolean;
  onSave: (body: unknown) => Promise<string>;
  onReload: () => void;
  onOpenCustomer: (id: string) => void;
}) {
  return (
    <li className="rounded-3xl border border-stone bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">{message.name}</p>
          {message.kind === "customer_request" ? <p className="text-sm font-bold">Customer request</p> : null}
          <p className="break-all text-sm text-muted">{message.email}</p>
        </div>
        <p className="text-sm text-muted">{label(message.status)}{message.created_at ? ` · ${when(message.created_at)}` : ""}</p>
      </div>
      <p className="mt-2">{message.message}</p>
      {message.reply ? <p className="mt-2 text-sm text-muted">Reply on file: {message.reply}</p> : null}
      {showLink && customer ? (
        <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => onOpenCustomer(customer.id)}>
          Open customer
        </Button>
      ) : null}
      <form
        className="mt-3 space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          await onSave({
            action: "reply",
            id: message.id,
            reply: String(data.get("reply") ?? ""),
            status: String(data.get("status") ?? "replied"),
            subject: message.email,
          });
        }}
      >
        <label className="block">
          <span className="text-sm">Reply</span>
          <Input className="mt-2" name="reply" defaultValue={message.reply ?? ""} required />
        </label>
        <label className="block text-sm">
          Status
          <select name="status" className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" defaultValue={message.status === "closed" ? "closed" : "replied"}>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <Button type="submit" size="sm">Save reply</Button>
      </form>
      <ResourceDelete table="contact_messages" id={message.id} removed={Boolean(message.deleted_at)} onDone={onReload} withDialog />
    </li>
  );
}

function OrderCard({
  order,
  customer,
  showLink = true,
  onSave,
  onReload,
  onOpenCustomer,
}: {
  order: Order;
  customer: Customer | null;
  showLink?: boolean;
  onSave: (body: unknown) => Promise<string>;
  onReload: () => void;
  onOpenCustomer: (id: string) => void;
}) {
  const paid = order.payment_status === "paid";
  const receiptHref = `/api/portal/support/receipt?order=${encodeURIComponent(order.id)}`;
  const invoiceHref = `/api/portal/support/invoice?order=${encodeURIComponent(order.id)}`;

  return (
    <article className="rounded-3xl border border-stone bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">{order.id}</p>
          <OrderOrigin order={order} />
          <p className="break-all text-sm text-muted">{order.email}</p>
        </div>
        <p className="text-sm text-muted">
          {label(order.status)}
          {order.payment_status ? ` · ${label(order.payment_status)}` : ""}
          {typeof order.subtotal === "number" ? ` · ${formatUsd(Number(order.subtotal) + Number(order.tax_amount ?? 0))}` : ""}
          {order.created_at ? ` · ${when(order.created_at)}` : ""}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!paid}
          onClick={() => void onSave({ action: "resend", order: order.id, email: order.email, subject: order.id })}
        >
          Resend confirmation
        </Button>
        <a className={buttonClassName("secondary", "sm")} href={receiptHref} target="_blank" rel="noopener noreferrer">
          View receipt
        </a>
        <a className={buttonClassName("secondary", "sm")} href={`${receiptHref}&format=pdf`}>
          Download receipt
        </a>
        {paid ? (
          <>
            <a className={buttonClassName("secondary", "sm")} href={invoiceHref} target="_blank" rel="noopener noreferrer">
              View invoice
            </a>
            <a className={buttonClassName("secondary", "sm")} href={`${invoiceHref}&format=pdf`}>
              Download invoice
            </a>
          </>
        ) : null}
      </div>
      {paid ? null : <p className="mt-2 text-sm text-muted">The receipt can be viewed now. The Stripe invoice and confirmation email are available after the order is paid.</p>}
      <ul className="mt-2 text-sm text-muted">
        {(order.order_items ?? []).map((item) => (
          <li key={item.id ?? item.product_id}>
            {item.name}
            {item.quantity ? ` × ${item.quantity}` : ""}
            {purchaseText(item.selection, item.color ?? undefined) ? ` · ${purchaseText(item.selection, item.color ?? undefined)}` : ""}
          </li>
        ))}
      </ul>
      {order.promo_code ? (
        <p className="mt-2 text-sm">
          Promo {order.promo_code}
          {Number(order.discount_amount ?? 0) > 0 ? ` · ${formatUsd(Number(order.discount_amount))} off` : ""}
        </p>
      ) : null}
      {showLink && customer ? (
        <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => onOpenCustomer(customer.id)}>
          Open customer
        </Button>
      ) : showLink ? (
        <p className="mt-3 text-sm text-muted">Guest checkout. No customer account is tied to this email.</p>
      ) : null}
      <p className="mt-3 text-sm text-muted">
        Shipment: {order.shipments[0]?.status ? label(order.shipments[0].status) : "Not started"}
        {order.shipments[0]?.carrier ? ` · ${order.shipments[0].carrier}` : ""}
        {order.shipments[0]?.tracking_number ? ` · ${order.shipments[0].tracking_number}` : ""}
      </p>
      <p className="text-sm text-muted">Carrier, tracking, and delivery status are updated in Inventory fulfillment.</p>
      {order.returns.filter((item) => !item.deleted_at).map((item) => (
        <p key={item.id} className="mt-3 text-sm text-muted">
          Return {item.resolution === "exchange" ? "exchange" : "refund"} · {label(item.status)}: {item.reason}
          {item.decision_note ? ` · ${item.decision_note}` : ""}
          {" "}Review and decide in Returns. Fulfillment receives an approved return.
        </p>
      ))}
      {(order.warranty_registrations ?? []).filter((item) => !item.deleted_at).map((registration) => (
        <p key={registration.id} className="mt-3 text-sm text-muted">
          Warranty registered for {registration.product_id}
          {registration.serial ? ` · Serial ${registration.serial}` : ""}
          {registration.coverage_ends_at ? ` · Coverage ends ${when(registration.coverage_ends_at)}` : ""}
        </p>
      ))}
      {order.user_id ? (
        <form
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            await onSave({
              action: "warranty",
              userId: order.user_id,
              order: order.id,
              productId: String(data.get("productId") ?? ""),
              serial: String(data.get("serial") ?? ""),
              subject: order.id,
            });
          }}
        >
          <label className="text-sm">
            Register warranty
            <select name="productId" className="mt-2 h-12 rounded-2xl border border-stone bg-white px-4">
              {(order.order_items ?? []).map((item) => (
                <option key={item.product_id} value={item.product_id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Serial
            <Input className="mt-2" name="serial" />
          </label>
          <Button type="submit" size="sm">Register</Button>
        </form>
      ) : null}
      {order.user_id ? (
        <form
          className="mt-3 grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            await onSave({
              action: "fileClaim",
              userId: order.user_id,
              order: order.id,
              productId: String(data.get("productId") ?? ""),
              serial: String(data.get("serial") ?? ""),
              message: String(data.get("message") ?? ""),
              subject: order.id,
            });
          }}
        >
          <label className="text-sm">
            File a warranty claim
            <select name="productId" className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4">
              {(order.order_items ?? []).map((item) => (
                <option key={item.product_id} value={item.product_id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            What happened
            <textarea name="message" required minLength={3} className="mt-2 min-h-20 w-full rounded-2xl border border-stone bg-white px-4 py-3" />
          </label>
          <label className="text-sm">
            Serial
            <Input className="mt-2" name="serial" />
          </label>
          <Button type="submit" size="sm">File claim</Button>
        </form>
      ) : null}
      {(order.warranty_registrations ?? []).map((registration) => (
        <ResourceDelete
          key={registration.id}
          table="warranty_registrations"
          id={registration.id}
          removed={Boolean(registration.deleted_at)}
          onDone={onReload}
          withDialog
        />
      ))}
      <ResourceDelete table="orders" id={order.id} removed={Boolean(order.deleted_at)} onDone={onReload} withDialog />
    </article>
  );
}

function ClaimCard({
  claim,
  customer,
  showLink = true,
  onSave,
  onReload,
  onOpenCustomer,
}: {
  claim: Claim;
  customer: Customer | null;
  showLink?: boolean;
  onSave: (body: unknown) => Promise<string>;
  onReload: () => void;
  onOpenCustomer: (id: string) => void;
}) {
  const waiting = claim.status === "open" || claim.status === "reviewing" || claim.status === "needs_info";
  const title = claim.serial || claim.order_id || "Warranty claim";
  return (
    <li className="rounded-3xl border border-stone bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">{title}</p>
          <p className="break-all text-sm text-muted">{claim.name || "Customer"}{claim.email ? ` · ${claim.email}` : ""}</p>
        </div>
        <p className="text-sm font-bold">{label(claim.status)}</p>
      </div>
      {claim.product_id ? <p className="mt-2 text-sm text-muted">Product {claim.product_id}</p> : null}
      {claim.order_id && claim.order_id !== claim.serial ? <p className="mt-1 text-sm text-muted">Order {claim.order_id}</p> : null}
      <p className="mt-2 text-sm">{claim.message}</p>
      {claim.serial && claim.serial !== title ? <p className="mt-1 text-sm text-muted">Serial {claim.serial}</p> : null}
      {claim.decision_note ? <p className="mt-2 text-sm">Note to customer: {claim.decision_note}</p> : null}
      {claim.customer_reply ? <p className="mt-2 text-sm">Customer reply: {claim.customer_reply}</p> : null}
      {claim.created_at ? <p className="mt-2 text-sm text-muted">Opened {when(claim.created_at)}</p> : null}
      {claim.status === "approved" && !claim.replacement_order_id ? <p className="mt-2 text-sm text-muted">Approved. Create a replacement order. It ships like a new order.</p> : null}
      {claim.replacement_order_id && claim.status !== "replaced" ? <p className="mt-2 text-sm text-muted">Replacement order {claim.replacement_order_id} is in fulfillment. Close this claim when you are finished.</p> : null}
      {claim.status === "replaced" ? <p className="mt-2 text-sm text-muted">Closed. Replacement order {claim.replacement_order_id || "created"} ships like a new order.</p> : null}
      {claim.status === "closed" ? <p className="mt-2 text-sm text-muted">Closed.</p> : null}
      {waiting ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            await onSave({
              action: "reviewClaim",
              id: claim.id,
              decision: String(data.get("decision") ?? ""),
              note: String(data.get("note") ?? ""),
              subject: claim.serial || claim.order_id,
            });
          }}
        >
          <label className="block text-sm">
            Decision
            <select name="decision" className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" defaultValue={claim.status === "needs_info" ? "reject" : "approve"}>
              {claim.status !== "needs_info" ? <option value="approve">Approve repair or replacement</option> : null}
              <option value="reject">Close with a reason</option>
              {claim.status !== "needs_info" ? <option value="needs_info">Request more information</option> : null}
            </select>
          </label>
          <label className="block text-sm">
            Reason for the customer
            <textarea name="note" className="mt-2 min-h-20 w-full rounded-2xl border border-stone bg-white px-4 py-3" placeholder="Required when closing or asking for more information." />
          </label>
          <Button type="submit" size="sm">Save decision</Button>
        </form>
      ) : null}
      {claim.status === "approved" && !claim.replacement_order_id ? (
        <form
          className="mt-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSave({ action: "createWarrantyOrder", id: claim.id, subject: claim.serial || claim.order_id });
          }}
        >
          <Button type="submit" size="sm">Create replacement order</Button>
        </form>
      ) : null}
      {claim.replacement_order_id && claim.status !== "replaced" && claim.status !== "closed" ? (
        <form
          className="mt-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSave({ action: "closeClaim", id: claim.id, subject: claim.serial || claim.order_id });
          }}
        >
          <Button type="submit" size="sm">Close this claim</Button>
        </form>
      ) : null}
      {showLink && customer ? (
        <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => onOpenCustomer(customer.id)}>
          Open customer
        </Button>
      ) : null}
      <ResourceDelete table="warranty_claims" id={claim.id} removed={Boolean(claim.deleted_at)} onDone={onReload} withDialog />
    </li>
  );
}
