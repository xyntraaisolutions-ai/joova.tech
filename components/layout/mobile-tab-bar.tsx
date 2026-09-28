"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Home, Menu, ShoppingBag, Store, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/components/layout/cart-provider";
import { catalog } from "@/content/catalog";
import { supportMenu } from "@/content/site";
import { cn } from "@/lib/utils";

const groups = [
  {
    title: "Browse",
    links: [
      { href: "/shop", label: "All products" },
      { href: "/deals", label: "Deals" },
      { href: "/wishlist", label: "Wishlist" },
    ],
  },
  {
    title: "Products",
    links: catalog.map((product) => ({ href: product.href, label: product.menuLabel })),
  },
  {
    title: "Help",
    links: [
      { href: "/about", label: "About" },
      ...supportMenu,
      { href: "/warranty", label: "Warranty" },
      { href: "/returns", label: "Returns" },
    ],
  },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { count, setOpen } = useCart();
  const [more, setMore] = useState(false);

  useEffect(() => {
    setMore(false);
  }, [pathname]);
  const home = pathname === "/";
  const shop = pathname === "/shop" || pathname === "/deals";

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
                "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium",
                home ? "text-coral-ink" : "text-muted",
              )}
              aria-current={home ? "page" : undefined}
            >
              <span className={cn("flex size-8 items-center justify-center rounded-full", home && "bg-stone")}>
                <Home className="size-5" aria-hidden />
              </span>
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/shop"
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium",
                shop ? "text-coral-ink" : "text-muted",
              )}
              aria-current={shop ? "page" : undefined}
            >
              <span className={cn("flex size-8 items-center justify-center rounded-full", shop && "bg-stone")}>
                <Store className="size-5" aria-hidden />
              </span>
              Shop
            </Link>
          </li>
          <li>
            <button
              type="button"
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium",
                more ? "text-coral-ink" : "text-muted",
              )}
              aria-expanded={more}
              onClick={() => setMore(true)}
            >
              <span className={cn("flex size-8 items-center justify-center rounded-full", more && "bg-stone")}>
                <Menu className="size-5" aria-hidden />
              </span>
              Menu
            </button>
          </li>
          <li>
            <button
              type="button"
              className="relative flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted"
              onClick={() => setOpen(true)}
              aria-label={`Cart, ${count} items`}
            >
              <span className="flex size-8 items-center justify-center rounded-full">
                <ShoppingBag className="size-5" aria-hidden />
              </span>
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
            <div className="space-y-5">
              {groups.map((group) => (
                <section key={group.title}>
                  <h2 className="px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    {group.title}
                  </h2>
                  <ul className="mt-1">
                    {group.links.map((item) => (
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
                </section>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
