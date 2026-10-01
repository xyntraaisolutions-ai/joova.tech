"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ShoppingBag } from "lucide-react";
import { CountryMenu } from "@/components/layout/country-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth } from "@/components/layout/auth-provider";
import { useCart } from "@/components/layout/cart-provider";
import { useSiteContent } from "@/components/layout/site-content";
import { categoryMenu } from "@/lib/content/helpers";
import { cn } from "@/lib/utils";

function ProductMenu({ label }: { label: string }) {
  const { catalog, catalogCategories } = useSiteContent();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const groups = catalogCategories
    .map((category) => ({
      ...category,
      items: categoryMenu(catalog, category.id),
    }))
    .filter((group) => group.items.length > 0);
  const active = groups.some((group) =>
    group.items.some((item) => {
      const path = item.href.split("#")[0];
      return pathname === path || pathname.startsWith(`${path}/`);
    }),
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="static">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="product-categories"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex min-h-11 items-center gap-1 text-[15px] font-medium tracking-[-0.01em] hover:text-ink",
          open || active ? "text-ink underline underline-offset-4" : "text-ink/80",
        )}
      >
        {label}
        <ChevronDown className={cn("size-4 transition", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <div
          id="product-categories"
          className="absolute inset-x-0 top-full z-50 px-5 pt-3 sm:px-8"
        >
          <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-x-8 gap-y-6 rounded-2xl border border-stone bg-white p-6 shadow-lg lg:grid-cols-4">
            {groups.map((group) => (
              <div key={group.id}>
                <Link
                  href={group.href}
                  className="text-xs font-bold uppercase tracking-[0.16em] text-ink"
                >
                  {group.label}
                </Link>
                <ul className="mt-2">
                  {group.items.map((item) => (
                    <li key={`${group.id}-${item.href}`}>
                      <Link
                        href={item.href}
                        className="block py-2 text-sm text-muted hover:text-ink"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NavMenu({
  label,
  items,
  inline = false,
}: {
  label: string;
  items: readonly { href: string; label: string }[];
  inline?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", inline && "shrink-0")}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex min-h-11 items-center gap-1 text-[15px] font-medium tracking-[-0.01em] hover:text-ink",
          open || active ? "text-ink underline underline-offset-4" : "text-ink/80",
          inline && !(open || active) && "text-muted no-underline",
        )}
      >
        {label}
        <ChevronDown className={cn("size-4 transition", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className={cn(
            "z-50 min-w-48 border border-stone bg-white py-2 shadow-lg",
            inline
              ? "absolute left-0 top-full mt-2 rounded-2xl"
              : "absolute left-0 top-full mt-3 rounded-2xl",
          )}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className="block px-5 py-3 text-sm text-muted hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const staff = Boolean(user?.role && user.role !== "customer");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/account?mode=sign-in"
        className="inline-flex h-11 items-center px-2 text-sm font-bold tracking-[-0.01em] text-ink"
      >
        Sign in
      </Link>
    );
  }

  if (staff) {
    return (
      <Link
        href="/portal"
        className="inline-flex h-11 shrink-0 flex-col items-start justify-center px-2 leading-tight"
      >
        <span className="whitespace-nowrap text-sm font-bold tracking-[-0.01em] text-ink">{user.name}</span>
        <span className="whitespace-nowrap text-[11px] text-muted">{user.email}</span>
      </Link>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 shrink-0 items-center gap-1 px-2 text-left leading-tight"
      >
        <span>
          <span className="block whitespace-nowrap text-sm font-bold tracking-[-0.01em] text-ink">{user.name}</span>
          <span className="block whitespace-nowrap text-[11px] text-muted">{user.email}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 transition", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <div role="menu" aria-label="Account" className="absolute right-0 top-full z-50 mt-2 min-w-52 rounded-2xl border border-stone bg-white py-2 shadow-lg">
          <Link href="/account#profile" role="menuitem" className="block px-5 py-3 text-sm text-muted hover:text-ink">
            Profile
          </Link>
          <Link href="/account#devices" role="menuitem" className="block px-5 py-3 text-sm text-muted hover:text-ink">
            My Devices
          </Link>
          <Link href="/account#orders" role="menuitem" className="block px-5 py-3 text-sm text-muted hover:text-ink">
            Orders, warranty, and returns
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-5 py-3 text-left text-sm text-muted hover:text-ink"
            onClick={() => void logout()}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Header() {
  const { navItems, headerSlogan, company } = useSiteContent();
  const { count, setOpen } = useCart();
  const pathname = usePathname();
  const headerItems = navItems.filter((item) => item.area === "header" && !item.parentId);

  return (
    <header
      className={cn(
        "relative border-b border-stone bg-paper/95 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link href="/" className="shrink-0" aria-label={`${company.brand} home. ${headerSlogan}`}>
          <span className="flex w-fit flex-col gap-0.5">
            <Logo />
            <span className="@container block w-0 min-w-full">
              <span className="block whitespace-nowrap text-justify text-[6.5cqw] font-medium leading-none tracking-normal text-ink [text-align-last:justify]">
                {headerSlogan}
              </span>
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-4 xl:gap-5 md:flex" aria-label="Primary">
          {headerItems.map((item) => {
            if (item.kind === "products") return <ProductMenu key={item.id} label={item.label} />;
            if (item.kind === "menu") {
              const items = navItems.filter((child) => child.parentId === item.id);
              return <NavMenu key={item.id} label={item.label} items={items} />;
            }
            const path = item.href.split("#")[0];
            const active = pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "text-[15px] font-medium tracking-[-0.01em] hover:text-ink",
                  active ? "text-ink underline underline-offset-4" : "text-ink/80",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <form action="/shop" role="search" className="hidden lg:block">
            <label htmlFor="site-search" className="sr-only">Search products</label>
            <input
              id="site-search"
              name="q"
              placeholder="Search"
              className="h-11 w-36 rounded-full border border-stone bg-white px-4 text-sm xl:w-48"
            />
          </form>
          <AccountMenu />
          <CountryMenu />
          <ThemeToggle />
          <span className="group/tip relative hidden md:inline-flex">
            <button
              className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-stone"
              onClick={() => setOpen(true)}
              aria-label={`Open cart, ${count} items`}
            >
              <ShoppingBag className="size-5" />
              {count > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-coral text-[11px] font-bold text-[var(--fixed-ink)]">
                  {count}
                </span>
              ) : null}
            </button>
            <span className="header-tip" aria-hidden="true">
              Cart
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
