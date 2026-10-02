"use client";

import { useEffect, useState } from "react";
import { AuditLog } from "@/components/portal/audit-log";
import { LogoLibrary } from "@/components/portal/logo-library";
import { PromoCodes } from "@/components/portal/promo-codes";
import { SalesReport } from "@/components/portal/sales-report";
import { SalesTax } from "@/components/portal/sales-tax";
import { SellCountries } from "@/components/portal/sell-countries";
import { NotificationList } from "@/components/portal/notification-list";
import { NoticeEmailForm } from "@/components/portal/notice-email-form";
import { OrderEmailForm } from "@/components/portal/order-email-form";
import { PasswordEmailForm } from "@/components/portal/password-email-form";
import { PortalMenu, PortalPanel } from "@/components/portal/portal-menu";
import { ResourceDelete } from "@/components/portal/resource-delete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/ui/password-field";
import { roleLabels, type Role } from "@/lib/portal/roles";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  created_at?: string;
  deleted_at?: string | null;
  locked?: boolean;
};
const roles: Role[] = ["customer", "csr", "inventory", "content"];

export function AdminDesk() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/portal/users");
    const data = (await response.json()) as { users?: UserRow[]; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Users could not be loaded.");
      return;
    }
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  const people = [...users].sort((left, right) => Number(Boolean(right.locked)) - Number(Boolean(left.locked)));

  return (
    <PortalMenu
      groups={[
        { id: "users", label: `Users (${users.length})`, items: [{ id: "users", label: "Users" }] },
        {
          id: "settings",
          label: "Settings",
          items: [
            { id: "settings", label: "Settings" },
            { id: "taxes", label: "Taxes" },
            { id: "report", label: "Sales and tax" },
            { id: "promos", label: "Promo codes" },
          ],
        },
        {
          id: "notifications",
          label: "Notifications",
          items: [
            { id: "notify-order", label: "Order" },
            { id: "notify-return", label: "Return" },
            { id: "notify-warranty", label: "Warranty" },
          ],
        },
        {
          id: "email",
          label: "Email",
          items: [
            { id: "email", label: "Password reset" },
            { id: "order-email", label: "Order confirmation" },
            { id: "notice-email", label: "Other emails" },
          ],
        },
        { id: "audit", label: `Audit (${auditTotal})`, items: [{ id: "audit", label: "Audit" }] },
      ]}
    >
      {error ? <p role="alert">{error}</p> : null}
      <PortalPanel id="users">
        <section>
          <h2 className="font-display text-2xl">Users</h2>
          <p className="mt-2 text-sm text-muted">Support, Inventory, and Content in the bar open those desks. Accounts created on the website are customers.</p>
          <ul className="mt-4 space-y-3">
            {people.map((user) => (
              <UserAccount key={user.id} user={user} onError={setError} onDone={() => void load()} />
            ))}
          </ul>
          <form
            className="mt-8 grid gap-3 rounded-3xl bg-white p-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const response = await fetch("/api/portal/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "create",
                  name: String(form.get("name") ?? ""),
                  email: String(form.get("email") ?? ""),
                  password: String(form.get("password") ?? ""),
                  role: String(form.get("role") ?? "customer"),
                }),
              });
              const data = (await response.json()) as { error?: string };
              setError(response.ok ? "" : data.error ?? "The account could not be created.");
              if (response.ok) {
                event.currentTarget.reset();
                void load();
              }
            }}
          >
            <h3 className="font-display text-xl md:col-span-2">Add a user</h3>
            <label className="text-sm">Name<Input className="mt-2" name="name" required /></label>
            <label className="text-sm">Email<Input className="mt-2" type="email" name="email" required /></label>
            <label className="text-sm">Password<PasswordField className="mt-2" name="password" minLength={8} required /></label>
            <label className="text-sm">
              Role
              <select name="role" className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" defaultValue="customer">
                {roles.map((role) => (
                  <option key={role} value={role}>{roleLabels[role]}</option>
                ))}
              </select>
            </label>
            <Button type="submit" size="sm">Create account</Button>
          </form>
        </section>
      </PortalPanel>

      <PortalPanel id="settings">
      <section className="rounded-3xl bg-white p-4">
        <h2 className="font-display text-2xl">Platform settings</h2>
        <p className="mt-2 text-sm text-muted">These are the same rows the content portal edits. Payment marks stay labels. No card data is collected.</p>
        <div className="mt-6">
          <LogoLibrary onError={setError} />
          <SellCountries onError={setError} />
        </div>
        <PlatformForm onError={setError} />
      </section>
      </PortalPanel>

      <PortalPanel id="taxes">
      <section className="rounded-3xl bg-white p-4">
        <SalesTax onError={setError} />
      </section>
      </PortalPanel>

      <PortalPanel id="email">
      <section className="rounded-3xl bg-white p-4">
        <h2 className="font-display text-2xl">Password reset email</h2>
        <p className="mt-2 text-sm text-muted">Sent with Resend as Joova Customer Support, support@joova.tech. The link opens the Joova page where they choose a new password.</p>
        <PasswordEmailForm onError={setError} />
      </section>
      </PortalPanel>

      <PortalPanel id="report">
      <section className="rounded-3xl bg-white p-4">
        <SalesReport onError={setError} />
      </section>
      </PortalPanel>

      <PortalPanel id="promos">
      <section className="rounded-3xl bg-white p-4">
        <PromoCodes onError={setError} />
      </section>
      </PortalPanel>

      <PortalPanel id="notify-order">
        <NotificationList kind="order" onError={setError} />
      </PortalPanel>
      <PortalPanel id="notify-return">
        <NotificationList kind="return" onError={setError} />
      </PortalPanel>
      <PortalPanel id="notify-warranty">
        <NotificationList kind="warranty" onError={setError} />
      </PortalPanel>

      <PortalPanel id="order-email">
      <section className="rounded-3xl bg-white p-4">
        <h2 className="font-display text-2xl">Order confirmation email</h2>
        <p className="mt-2 text-sm text-muted">Sent to the customer after Stripe marks the order paid. It includes the receipt and invoice for that order.</p>
        <OrderEmailForm onError={setError} />
      </section>
      </PortalPanel>

      <PortalPanel id="notice-email">
      <section className="rounded-3xl bg-white p-4">
        <h2 className="font-display text-2xl">Other emails</h2>
        <p className="mt-2 text-sm text-muted">Warranty replacements, exchanges, shipping, reviews, refunds, stock notices, and the staff copy of a paid order. Each one uses the same designed card as the order confirmation.</p>
        <NoticeEmailForm onError={setError} />
      </section>
      </PortalPanel>

      <PortalPanel id="audit">
        <AuditLog onTotal={setAuditTotal} />
      </PortalPanel>
    </PortalMenu>
  );
}

function UserAccount({
  user,
  onError,
  onDone,
}: {
  user: UserRow;
  onError: (message: string) => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "delete" | null>(null);
  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    : "";

  return (
    <li className="rounded-3xl bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">{user.name}</p>
          <p className="mt-1 text-sm">{user.email}</p>
          <p className="mt-1 text-sm text-muted">
            {roleLabels[user.role]} · {user.active ? "Active" : "Inactive"}
            {joined ? ` · Joined ${joined}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => setMode(mode === "view" ? null : "view")}>View</Button>
          {user.locked ? null : (
            <>
              <Button type="button" size="sm" variant="secondary" onClick={() => setMode(mode === "edit" ? null : "edit")}>Edit</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setMode(mode === "delete" ? null : "delete")}>Delete</Button>
            </>
          )}
        </div>
      </div>
      {user.locked ? (
        <p className="mt-3 text-sm text-muted">Read only. This Super Admin can only be changed from the backend.</p>
      ) : null}
      {mode === "view" ? (
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Name</dt><dd>{user.name}</dd></div>
          <div><dt className="text-muted">Email</dt><dd>{user.email}</dd></div>
          <div><dt className="text-muted">Role</dt><dd>{roleLabels[user.role]}</dd></div>
          <div><dt className="text-muted">Status</dt><dd>{user.active ? "Active" : "Inactive"}{user.deleted_at ? " · Removed" : ""}</dd></div>
        </dl>
      ) : null}
      {mode === "edit" && !user.locked ? (
        <form
          className="mt-4 grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const response = await fetch("/api/portal/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "update",
                id: user.id,
                name: String(form.get("name") ?? user.name),
                role: String(form.get("role") ?? user.role),
                active: form.get("active") === "on",
                email: String(form.get("email") ?? user.email),
              }),
            });
            const data = (await response.json()) as { error?: string };
            onError(response.ok ? "" : data.error ?? "The account could not be saved.");
            if (response.ok) {
              setMode("view");
              onDone();
            }
          }}
        >
          <label className="text-sm">Name<Input className="mt-2" name="name" defaultValue={user.name} required /></label>
          <label className="text-sm">Email<Input className="mt-2" type="email" name="email" defaultValue={user.email} required /></label>
          <label className="text-sm">
            Role
            <select name="role" className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" defaultValue={user.role}>
              {roles.map((role) => (
                <option key={role} value={role}>{roleLabels[role]}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" name="active" defaultChecked={user.active} /> Active
          </label>
          <Button type="submit" size="sm">Save</Button>
        </form>
      ) : null}
      {mode === "delete" && !user.locked ? (
        <ResourceDelete table="profiles" id={user.id} removed={Boolean(user.deleted_at)} onDone={onDone} />
      ) : null}
    </li>
  );
}

function PlatformForm({ onError }: { onError: (message: string) => void }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [policies, setPolicies] = useState<Record<string, string>>({});

  useEffect(() => {
    void fetch("/api/portal/content")
      .then((response) => response.json())
      .then((data: { settings?: Record<string, string>; policies?: Record<string, string> }) => {
        setSettings(data.settings ?? {});
        setPolicies(data.policies ?? {});
        setReady(true);
      });
  }, []);

  if (!ready) return <p className="mt-4 text-sm text-muted">Loading settings.</p>;

  return (
    <form
      className="mt-4 grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const settingsBody = {
          kind: "settings",
          announcement: String(form.get("announcement") ?? ""),
          siteDescription: settings.site_description,
          email: String(form.get("email") ?? ""),
          supportHours: settings.support_hours,
          siteUrl: String(form.get("siteUrl") ?? ""),
          brand: settings.brand,
          address: settings.address,
          noSubscription: settings.no_subscription,
          listPageSize: Number(form.get("listPageSize") ?? 10),
        };
        const policiesBody = {
          kind: "policies",
          shipping: String(form.get("shipping") ?? ""),
          returnsSummary: String(form.get("returnsSummary") ?? ""),
          warrantyRegistration: policies.warranty_registration,
          accountSummary: policies.account_summary,
          heroLine: policies.hero_line,
          outsideUsNotice: policies.outside_us_notice,
        };
        const first = await fetch("/api/portal/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settingsBody),
        });
        const second = await fetch("/api/portal/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(policiesBody),
        });
        onError(first.ok && second.ok ? "" : "Platform settings could not be saved.");
      }}
    >
      <label className="text-sm">Support email<Input className="mt-2" name="email" defaultValue={settings.email} required /></label>
      <label className="text-sm">Announcement<Input className="mt-2" name="announcement" defaultValue={settings.announcement} required /></label>
      <label className="text-sm">Public site URL<Input className="mt-2" name="siteUrl" defaultValue={settings.site_url ?? "http://127.0.0.1:3000"} required /></label>
      <label className="text-sm">
        List page size
        <Input className="mt-2" name="listPageSize" inputMode="numeric" min={1} max={100} defaultValue={settings.list_page_size ?? "10"} required />
      </label>
      <p className="text-sm text-muted">Portal lists show this many rows. The starting value is 10.</p>
      <label className="text-sm">Shipping<textarea name="shipping" defaultValue={policies.shipping} className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3" required /></label>
      <label className="text-sm">Returns<textarea name="returnsSummary" defaultValue={policies.returns_summary} className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3" required /></label>
      <Button type="submit" size="sm">Save platform settings</Button>
    </form>
  );
}
