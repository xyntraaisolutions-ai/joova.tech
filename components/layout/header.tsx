"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useCart } from "@/components/layout/cart-provider";
import { nav } from "@/content/site";
import { cn } from "@/lib/utils";

export function Header() {
  const { count, setOpen } = useCart();
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-transparent transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        compact && "border-stone bg-paper/95 backdrop-blur-md",
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
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            className="relative rounded-full p-2 hover:bg-stone"
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
      <nav
        className="flex gap-4 overflow-auto border-t border-stone px-5 py-2 text-sm md:hidden"
        aria-label="Mobile"
      >
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap text-muted">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
