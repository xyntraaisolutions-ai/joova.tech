"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Home, Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/components/layout/cart-provider";
import { electronicsMenu, productsMenu, supportMenu } from "@/content/site";
import { cn } from "@/lib/utils";

const moreLinks = [
  ...productsMenu,
  ...electronicsMenu,
  { href: "/about", label: "About" },
  ...supportMenu,
  { href: "/warranty", label: "Warranty" },
  { href: "/returns", label: "Returns" },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { count, setOpen } = useCart();
  const [more, setMore] = useState(false);

  useEffect(() => {
    setMore(false);
  }, [pathname]);
  const home = pathname === "/";
  const band = pathname === "/band" || pathname.startsWith("/band/");

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        aria-label="App"
      >
        <ul className="grid h-[var(--app-tab)] grid-cols-4">
          <li>
            <Link
              href="/"
              className={cn(
                "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                home ? "text-coral-ink" : "text-muted",
              )}
              aria-current={home ? "page" : undefined}
            >
              <Home className="size-5" aria-hidden />
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/band"
              className={cn(
                "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                band ? "text-coral-ink" : "text-muted",
              )}
              aria-current={band ? "page" : undefined}
            >
              <span className="size-5 rounded-full border-2 border-current" aria-hidden />
              Band
            </Link>
          </li>
          <li>
            <button
              type="button"
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                more ? "text-coral-ink" : "text-muted",
              )}
              aria-expanded={more}
              onClick={() => setMore(true)}
            >
              <Menu className="size-5" aria-hidden />
              Menu
            </button>
          </li>
          <li>
            <button
              type="button"
              className="relative flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted"
              onClick={() => setOpen(true)}
              aria-label={`Cart, ${count} items`}
            >
              <ShoppingBag className="size-5" aria-hidden />
              Cart
              {count > 0 ? (
                <span className="absolute right-[22%] top-1.5 flex size-4 items-center justify-center rounded-full bg-coral text-[10px] font-semibold text-[var(--fixed-ink)]">
                  {count}
                </span>
              ) : null}
            </button>
          </li>
        </ul>
      </nav>

      <Dialog.Root open={more} onOpenChange={setMore}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--fixed-ink)]/45 md:hidden" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-auto rounded-t-3xl bg-paper p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl md:hidden">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="font-display text-2xl">Menu</Dialog.Title>
              <Dialog.Close className="flex size-11 items-center justify-center rounded-full hover:bg-stone" aria-label="Close menu">
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <ul className="space-y-1">
              {moreLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex min-h-12 items-center rounded-2xl px-3 text-lg font-medium",
                      pathname === item.href && "bg-stone",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
