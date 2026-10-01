"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Home, Menu, ShoppingBag, Store, X } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { useCart } from "@/components/layout/cart-provider";
import { useSiteContent } from "@/components/layout/site-content";
import { useSiteMenu } from "@/components/layout/site-menu";
import { buttonClassName } from "@/components/ui/button";
import { categoryMenu } from "@/lib/content/helpers";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const { catalog, catalogCategories, navItems } = useSiteContent();
  const pathname = usePathname();
  const headerLinks = navItems.filter((item) => item.area === "header" && !item.parentId && item.kind === "link");
  const support = navItems.find((item) => item.area === "header" && item.kind === "menu" && !item.parentId);
  const footerLinks = navItems.filter((item) => item.area === "footer" && item.parentId);
  const groups = [
    {
      title: "Browse",
      links: headerLinks,
    },
    {
      title: "Products",
      links: catalogCategories.flatMap((category) => [
        { href: category.href, label: category.label },
        ...categoryMenu(catalog, category.id).map((item) => ({
          href: item.href,
          label: item.label,
          nested: true,
        })),
      ]),
    },
    {
      title: "Help",
      links: [
        ...(support ? navItems.filter((item) => item.parentId === support.id) : []),
        ...footerLinks,
        { href: "/returns", label: "Returns" },
        { href: "/account", label: "Sign in" },
      ],
    },
  ];
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const menuGroups = groups.map((group) =>
    group.title === "Help"
      ? {
          ...group,
          links: group.links.map((link) =>
            link.href === "/account"
              ? user && user.role && user.role !== "customer"
                ? { href: "/portal", label: "Portal" }
                : { ...link, label: user ? "Account" : "Sign in" }
              : link,
          ),
        }
      : group,
  );
  const { open: more, setOpen: setMore } = useSiteMenu();

  useEffect(() => {
    setMore(false);
  }, [pathname, setMore]);
  if (pathname.startsWith("/portal")) return null;
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
                home ? "text-ink" : "text-muted",
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
                shop ? "text-ink" : "text-muted",
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
                more ? "text-ink" : "text-muted",
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
                <span className="absolute right-[22%] top-1.5 flex size-4 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-[var(--fixed-ink)]">
                  {count}
                </span>
              ) : null}
            </button>
          </li>
        </ul>
      </nav>

      <Dialog.Root open={more} onOpenChange={setMore}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--fixed-ink)]/45 xl:hidden" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-auto rounded-t-3xl bg-paper p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl xl:hidden">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="font-display text-2xl">Menu</Dialog.Title>
              <Dialog.Close className="flex size-11 items-center justify-center rounded-full hover:bg-stone" aria-label="Close menu">
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <form action="/shop" role="search" className="mb-5 flex gap-2">
              <label htmlFor="menu-search" className="sr-only">Search products</label>
              <input
                id="menu-search"
                name="q"
                placeholder="Search products"
                className="h-12 min-w-0 flex-1 rounded-full border border-stone bg-white px-4 text-[17px]"
              />
              <button type="submit" className={buttonClassName("primary", "md", "shrink-0")}>
                Search
              </button>
            </form>
            <div className="space-y-5">
              {menuGroups.map((group) => (
                <section key={group.title}>
                  <h2 className="px-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">
                    {group.title}
                  </h2>
                  <ul className="mt-1">
                    {group.links.map((item, index) => {
                      const nested = "nested" in item && item.nested;
                      return (
                        <li key={`${item.label}-${item.href}-${index}`}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center rounded-2xl px-3 font-medium",
                              nested
                                ? "min-h-11 pl-7 text-base text-muted"
                                : "min-h-12 text-lg",
                              pathname === item.href && "bg-stone text-ink",
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
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
