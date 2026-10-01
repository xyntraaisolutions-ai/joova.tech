"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Search, ShoppingBag } from "lucide-react";
import { CountryMenu } from "@/components/layout/country-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth } from "@/components/layout/auth-provider";
import { useCart } from "@/components/layout/cart-provider";
import { useSiteContent } from "@/components/layout/site-content";
import { useSiteMenu } from "@/components/layout/site-menu";
import { buttonClassName } from "@/components/ui/button";
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
                  className="inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-[0.16em] text-ink"
                >
                  {group.label}
                </Link>
                <ul className="mt-1">
                  {group.items.map((item) => (
                    <li key={`${group.id}-${item.href}`}>
                      <Link
                        href={item.href}
                        className="flex min-h-11 items-center text-sm text-muted hover:text-ink"
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
        aria-label={`${user.name}, portal`}
        className="inline-flex h-11 max-w-40 shrink-0 items-center px-2 text-sm font-bold tracking-[-0.01em] text-ink xl:max-w-48 xl:flex-col xl:items-start xl:justify-center xl:leading-tight"
      >
        <span className="xl:hidden">Account</span>
        <span className="hidden w-full truncate xl:block">{user.name}</span>
        <span className="hidden w-full truncate text-[11px] font-medium text-muted xl:block">{user.email}</span>
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
        className="inline-flex h-11 max-w-40 shrink-0 items-center gap-1 px-2 text-left text-sm font-bold tracking-[-0.01em] text-ink xl:max-w-48 xl:leading-tight"
      >
        <span className="xl:hidden">Account</span>
        <span className="hidden min-w-0 xl:block">
          <span className="block truncate">{user.name}</span>
          <span className="block truncate text-[11px] font-medium text-muted">{user.email}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 transition", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <div role="menu" aria-label="Account" className="absolute right-0 top-full z-50 mt-2 min-w-52 max-w-[min(18rem,calc(100vw-2.5rem))] rounded-2xl border border-stone bg-white py-2 shadow-lg">
          <div className="border-b border-stone px-5 py-3">
            <p className="truncate text-sm font-bold text-ink">{user.name}</p>
            <p className="truncate text-[11px] text-muted">{user.email}</p>
          </div>
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

function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <form action="/shop" role="search" className="hidden items-center gap-1 lg:flex">
        <label htmlFor="site-search" className="sr-only">Search products</label>
        <input
          id="site-search"
          name="q"
          placeholder="Search"
          className="h-11 w-44 min-w-0 rounded-full border border-stone bg-white px-4 text-sm xl:w-56"
        />
        <button type="submit" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-stone" aria-label="Search">
          <Search className="size-5" />
        </button>
      </form>
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-full hover:bg-stone lg:hidden"
        aria-expanded={open}
        aria-controls="header-search"
        aria-label="Search products"
        onClick={() => setOpen((value) => !value)}
      >
        <Search className="size-5" />
      </button>
      {open ? (
        <form
          id="header-search"
          action="/shop"
          role="search"
          className="absolute inset-x-0 top-full z-50 flex gap-2 border-b border-stone bg-paper px-5 py-3 sm:px-8 lg:hidden"
        >
          <label htmlFor="header-search-input" className="sr-only">Search products</label>
          <input
            id="header-search-input"
            name="q"
            placeholder="Search products"
            autoFocus
            className="h-12 min-w-0 flex-1 rounded-full border border-stone bg-white px-4 text-[17px]"
          />
          <button type="submit" className={buttonClassName("primary", "md", "shrink-0")}>
            Search
          </button>
        </form>
      ) : null}
    </>
  );
}

export function Header() {
  const { navItems, headerSlogan, company } = useSiteContent();
  const { count, setOpen } = useCart();
  const { setOpen: setMenuOpen } = useSiteMenu();
  const pathname = usePathname();
  const headerItems = navItems.filter((item) => item.area === "header" && !item.parentId);

  return (
    <header
      className={cn(
        "relative border-b border-stone bg-paper/95 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link href="/" className="shrink-0 [&_img]:h-9 [&_img]:w-auto max-sm:[&_img]:max-w-[6.5rem]" aria-label={`${company.brand} home. ${headerSlogan}`}>
          <span className="flex flex-col gap-0.5">
            <Logo />
            <span className="hidden whitespace-nowrap text-xs font-medium leading-none text-ink sm:block">
              {headerSlogan}
            </span>
          </span>
        </Link>
        <button
          type="button"
          className="hidden size-11 items-center justify-center rounded-full hover:bg-stone md:inline-flex xl:hidden"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="size-5" />
        </button>
        <nav className="hidden items-center gap-4 xl:flex xl:gap-5" aria-label="Primary">
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
                  "inline-flex min-h-11 items-center text-[15px] font-medium tracking-[-0.01em] hover:text-ink",
                  active ? "text-ink underline underline-offset-4" : "text-ink/80",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <HeaderSearch />
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
