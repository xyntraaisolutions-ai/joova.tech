"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ShoppingBag } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useCart } from "@/components/layout/cart-provider";
import { nav, supportMenu } from "@/content/site";
import { cn } from "@/lib/utils";

function SupportMenu({ inline = false }: { inline?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = supportMenu.some(
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
          "inline-flex items-center gap-1 text-sm font-medium hover:text-ink",
          open || active ? "text-ink underline underline-offset-4" : "text-ink/80",
          inline && !(open || active) && "text-muted no-underline",
        )}
      >
        Support
        <ChevronDown className={cn("size-4 transition", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Support"
          className={cn(
            "z-50 min-w-48 border border-stone bg-white py-2 shadow-lg",
            inline
              ? "absolute left-0 top-full mt-2 rounded-2xl"
              : "absolute left-0 top-full mt-3 rounded-2xl",
          )}
        >
          {supportMenu.map((item) => (
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
  const pathname = usePathname();
  const aboutActive = pathname === "/about" || pathname.startsWith("/about/");

  return (
    <header
      className={cn(
        "border-b border-stone bg-paper/95 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link href="/" className="shrink-0" aria-label="Joova home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink/80 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/about"
            className={cn(
              "text-sm font-medium hover:text-ink",
              aboutActive ? "text-ink underline underline-offset-4" : "text-ink/80",
            )}
          >
            About
          </Link>
          <SupportMenu />
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            className="relative hidden size-11 items-center justify-center rounded-full hover:bg-stone md:inline-flex"
            onClick={() => setOpen(true)}
            aria-label={`Open cart, ${count} items`}
          >
            <ShoppingBag className="size-5" />
            {count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-coral text-[11px] font-semibold text-[var(--fixed-ink)]">
                {count}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
