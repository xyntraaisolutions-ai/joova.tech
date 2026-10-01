"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
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
type ListPages = { customers: number; messages: number; requests: number; orders: number; claims: number };
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
  returns: { id: string; status: string; reason: string; deleted_at?: string | null }[];
  warranty_registrations?: { id: string; product_id: string; serial?: string | null; coverage_ends_at?: string | null; deleted_at?: string | null }[];
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

const firstPages: ListPages = { customers: 1, messages: 1, requests: 1, orders: 1, claims: 1 };
const firstAccountPages: AccountPages = { orders: 1, messages: 1, claims: 1 };
const emptyPage = { rows: [], total: 0, page: 1, pages: 1, open: 0 };
type Section = "customers" | "messages" | "requests" | "orders" | "claims";

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
  approved: "Approved",
  received: "Received",
  refunded: "Refunded",
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
  const data = (await response.json()) as { error?: string };
  return response.ok ? "" : data.error ?? "That change could not be saved.";
}

export function SupportDesk() {
  const [section, setSection] = useState<Section>("customers");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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
    setClaims(data.claims ?? emptyPage);
    setAccount(data.account ?? null);
    setPeople((data.people ?? []).map((person) => ({ ...person, active: true, support_note: "" })));
    if (data.customers) setPages((current) => ({ ...current, customers: data.customers?.page ?? current.customers }));
    if (data.messages) setPages((current) => ({ ...current, messages: data.messages?.page ?? current.messages }));
    if (data.requests) setPages((current) => ({ ...current, requests: data.requests?.page ?? current.requests }));
    if (data.orders) setPages((current) => ({ ...current, orders: data.orders?.page ?? current.orders }));
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

  async function save(body: unknown) {
    setNotice("");
    const messageText = await post(body);
    setError(messageText);
    if (!messageText) {
      setNotice("Saved.");
      await load();
    }
    return messageText;
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
  const tabs: { id: Section; label: string }[] = [
    { id: "customers", label: `Customers (${customers.total})` },
    { id: "messages", label: `Messages (${messages.total})` },
    { id: "requests", label: `Customer requests (${requests.total})` },
    { id: "orders", label: `Orders (${orderTotal(orderCounts)})` },
    { id: "claims", label: `Warranty (${claims.total})` },
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
        {openClaims} open warranty {openClaims === 1 ? "claim" : "claims"}
      </p>
      {error ? <p className="mt-3" role="alert">{error}</p> : null}
      {notice ? <p className="mt-3" role="status">{notice}</p> : null}

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

      {section === "claims" ? (
        <section className="mt-6">
          <h2 className="font-display text-2xl">Warranty claims</h2>
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
    </div>
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
      <ResourceDelete table="contact_messages" id={message.id} removed={Boolean(message.deleted_at)} onDone={onReload} />
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
  const [sending, setSending] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [mailNote, setMailNote] = useState("");
  const paid = order.payment_status === "paid";
  const receiptHref = `/api/portal/support/receipt?order=${encodeURIComponent(order.id)}`;
  const invoiceHref = `/api/portal/support/invoice?order=${encodeURIComponent(order.id)}`;

  async function resend() {
    setMailNote("");
    setSending(true);
    const message = await post({ action: "resend", order: order.id });
    setSending(false);
    setConfirmSend(false);
    setMailNote(message || `Confirmation sent to ${order.email}.`);
  }

  return (
    <article className="rounded-3xl border border-stone bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">{order.id}</p>
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
        <Button type="button" size="sm" disabled={!paid} onClick={() => setConfirmSend(true)}>
          Resend confirmation
        </Button>
        <Dialog.Root open={confirmSend} onOpenChange={(open) => { if (!sending) setConfirmSend(open); }}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-ink">
              <Dialog.Title className="font-display text-xl">Resend confirmation</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted">
                Send the order confirmation for {order.id} to {order.email}? The email includes the receipt, and the Stripe invoice is attached.
              </Dialog.Description>
              <div className="mt-4 flex flex-wrap gap-2">
                <Dialog.Close className={buttonClassName("secondary", "sm")} disabled={sending}>
                  Cancel
                </Dialog.Close>
                <Button type="button" size="sm" disabled={sending} onClick={() => void resend()}>
                  {sending ? "Sending" : "Send confirmation"}
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
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
      {mailNote ? <p className="mt-2 text-sm" role="status">{mailNote}</p> : null}
      <ul className="mt-2 text-sm text-muted">
        {(order.order_items ?? []).map((item) => (
          <li key={item.id ?? item.product_id}>
            {item.name}
            {item.quantity ? ` × ${item.quantity}` : ""}
            {purchaseText(item.selection, item.color ?? undefined) ? ` · ${purchaseText(item.selection, item.color ?? undefined)}` : ""}
          </li>
        ))}
      </ul>
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
      {order.returns.map((item) => (
        <form
          key={item.id}
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            await onSave({ action: "return", id: item.id, status: String(data.get("status")) });
          }}
        >
          <label className="text-sm">
            Return: {item.reason}
            <select name="status" className="mt-2 h-12 rounded-2xl border border-stone bg-white px-4" defaultValue={item.status}>
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="received">Received</option>
              <option value="refunded">Refunded</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <Button type="submit" size="sm">Update return</Button>
          <ResourceDelete table="returns" id={item.id} removed={Boolean(item.deleted_at)} onDone={onReload} />
        </form>
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
        />
      ))}
      <ResourceDelete table="orders" id={order.id} removed={Boolean(order.deleted_at)} onDone={onReload} />
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
  return (
    <li className="rounded-3xl border border-stone bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">{claim.order_id}</p>
          <p className="break-all text-sm text-muted">{claim.name || "Customer"}{claim.email ? ` · ${claim.email}` : ""}</p>
        </div>
        <p className="text-sm text-muted">{label(claim.status)}{claim.created_at ? ` · ${when(claim.created_at)}` : ""}</p>
      </div>
      <p className="mt-2 text-sm">{claim.message}</p>
      {claim.serial ? <p className="mt-1 text-sm text-muted">Serial {claim.serial}</p> : null}
      {showLink && customer ? (
        <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => onOpenCustomer(customer.id)}>
          Open customer
        </Button>
      ) : null}
      <form
        className="mt-3 flex flex-wrap items-end gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          await onSave({ action: "claim", id: claim.id, status: String(data.get("status")) });
        }}
      >
        <select name="status" className="h-12 rounded-2xl border border-stone bg-white px-4" defaultValue={claim.status}>
          <option value="open">Open</option>
          <option value="reviewing">Reviewing</option>
          <option value="approved">Approved</option>
          <option value="replaced">Replaced</option>
          <option value="closed">Closed</option>
        </select>
        <Button type="submit" size="sm">Update claim</Button>
      </form>
      <ResourceDelete table="warranty_claims" id={claim.id} removed={Boolean(claim.deleted_at)} onDone={onReload} />
    </li>
  );
}
