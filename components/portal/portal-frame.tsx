import Link from "next/link";
import type { ReactNode } from "react";
import { PortalNav, ViewAsSelect } from "@/components/portal/portal-nav";
import { PortalSession } from "@/components/portal/portal-session";
import type { Role, ViewAs } from "@/lib/portal/roles";
import { roleLabels } from "@/lib/portal/roles";

const links = [
  { href: "/portal/support", label: "Support", roles: ["csr", "super_admin"] },
  { href: "/portal/inventory", label: "Inventory", roles: ["inventory", "super_admin"] },
  { href: "/portal/inventory/fulfillment", label: "Fulfillment", roles: ["inventory", "super_admin"] },
  { href: "/portal/content", label: "Content", roles: ["content", "super_admin"] },
  { href: "/portal/admin", label: "Admin", roles: ["super_admin"] },
] as const;

export function PortalFrame({
  role,
  viewAs,
  name,
  environment = "",
  children,
}: {
  role: Role;
  viewAs: ViewAs | null;
  name: string;
  environment?: string;
  children: ReactNode;
}) {
  const visible = links.filter((link) => (link.roles as readonly Role[]).includes(role));

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-stone bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">
              Joova portal
              {environment ? <span className="ml-2 text-ink">{environment}</span> : null}
            </p>
            <p className="font-display text-xl">{roleLabels[role]}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {role === "super_admin" ? <ViewAsSelect value={viewAs} /> : null}
            <p className="text-sm text-muted">{name}</p>
            <PortalSession />
            <Link href="/" className="inline-flex min-h-11 items-center text-sm font-bold text-ink">
              Store
            </Link>
          </div>
        </div>
        <PortalNav links={visible.map((link) => ({ href: link.href, label: link.label }))} />
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
