"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ViewAs } from "@/lib/portal/roles";

const viewAsChoices: { role: ViewAs | ""; label: string; href: string }[] = [
  { role: "", label: "Super Admin", href: "/portal/admin" },
  { role: "csr", label: "Customer Support", href: "/portal/support" },
  { role: "inventory", label: "Inventory", href: "/portal/inventory" },
  { role: "content", label: "Content", href: "/portal/content" },
  { role: "customer", label: "Customer records", href: "/portal/support" },
];

export function PortalNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  if (links.length === 0) return null;
  const active = links.reduce((best, link) => {
    const hit = pathname === link.href || pathname.startsWith(`${link.href}/`);
    if (!hit) return best;
    return link.href.length > best.length ? link.href : best;
  }, "");
  return (
    <nav className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 pb-4" aria-label="Portal">
      {links.map((link) => {
        const selected = link.href === active;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold",
              selected ? "bg-ink text-paper" : "border border-stone text-ink",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ViewAsSelect({ value }: { value: ViewAs | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function change(role: string) {
    const choice = viewAsChoices.find((item) => item.role === role) ?? viewAsChoices[0];
    setPending(true);
    const response = await fetch("/api/portal/view-as", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: choice.role || null }),
    });
    if (!response.ok) {
      setPending(false);
      return;
    }
    router.push(choice.href);
    router.refresh();
  }

  return (
    <label className="text-sm text-ink">
      View as
      <select
        className="ml-2 h-11 rounded-full border border-stone bg-white px-3"
        value={value ?? ""}
        disabled={pending}
        onChange={(event) => void change(event.target.value)}
      >
        {viewAsChoices.map((choice) => (
          <option key={choice.label} value={choice.role}>
            {choice.label}
          </option>
        ))}
      </select>
    </label>
  );
}
