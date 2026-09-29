"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, ShoppingBag } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth } from "@/components/layout/auth-provider";
import { useCart } from "@/components/layout/cart-provider";
import { useWishlist } from "@/components/layout/wishlist-provider";
import { catalogCategories, categoryMenu } from "@/content/catalog";
import { supportMenu } from "@/content/site";
import { cn } from "@/lib/utils";

function ProductMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const groups = catalogCategories.map((category) => ({
    ...category,
    items: categoryMenu(category.id),
  }));
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
        Products
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

export function Header() {
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const pathname = usePathname();
  const aboutActive = pathname === "/about" || pathname.startsWith("/about/");

  return (
    <header
      className={cn(
        "relative border-b border-stone bg-paper/95 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link href="/" className="shrink-0" aria-label="Joova home. Smarter Tech | Bigger Tomorrow">
          <span className="flex w-fit flex-col gap-0.5">
            <Logo />
            <span className="@container block w-0 min-w-full">
              <span className="block whitespace-nowrap text-justify text-[6.5cqw] font-medium leading-none tracking-normal text-ink [text-align-last:justify]">
                Smarter Tech | Bigger Tomorrow
              </span>
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-4 xl:gap-5 md:flex" aria-label="Primary">
          <Link
            href="/shop"
            className={cn(
              "text-[15px] font-medium tracking-[-0.01em] hover:text-ink",
              pathname === "/shop" ? "text-ink underline underline-offset-4" : "text-ink/80",
            )}
          >
            Shop
          </Link>
          <Link
            href="/deals"
            className={cn(
              "text-[15px] font-medium tracking-[-0.01em] hover:text-ink",
              pathname === "/deals" ? "text-ink underline underline-offset-4" : "text-ink/80",
            )}
          >
            Deals
          </Link>
          <ProductMenu />
          <Link
            href="/videos"
            className={cn(
              "text-[15px] font-medium tracking-[-0.01em] hover:text-ink",
              pathname === "/videos" ? "text-ink underline underline-offset-4" : "text-ink/80",
            )}
          >
            Videos
          </Link>
          <Link
            href="/blog"
            className={cn(
              "text-[15px] font-medium tracking-[-0.01em] hover:text-ink",
              pathname === "/blog" || pathname.startsWith("/blog/")
                ? "text-ink underline underline-offset-4"
                : "text-ink/80",
            )}
          >
            Blogs
          </Link>
          <Link
            href="/about"
            className={cn(
              "text-[15px] font-medium tracking-[-0.01em] hover:text-ink",
              aboutActive ? "text-ink underline underline-offset-4" : "text-ink/80",
            )}
          >
            About
          </Link>
          <NavMenu label="Support" items={supportMenu} />
        </nav>
        <div className="flex items-center gap-1">
          <Link
            href={user ? "/account" : "/account?mode=sign-in"}
            className="inline-flex h-11 max-w-28 items-center truncate px-2 text-sm font-bold tracking-[-0.01em] text-ink"
          >
            {user ? user.name.split(" ")[0] : "Sign in"}
          </Link>
          <ThemeToggle />
          <span className="group/tip relative hidden md:inline-flex">
            <Link
              href="/wishlist"
              className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-stone"
              aria-label={`Wishlist, ${wishlistCount} ${wishlistCount === 1 ? "item" : "items"}`}
            >
              <Heart className="size-5" />
              {wishlistCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-coral text-[11px] font-bold text-[var(--fixed-ink)]">
                  {wishlistCount}
                </span>
              ) : null}
            </Link>
            <span className="header-tip" aria-hidden="true">
              Wishlist
            </span>
          </span>
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
