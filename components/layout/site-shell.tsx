import { AppFrame } from "@/components/layout/app-frame";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import type { ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-paper focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <AppFrame>{children}</AppFrame>
      <MobileTabBar />
      <CartDrawer />
    </>
  );
}
