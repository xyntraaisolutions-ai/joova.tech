"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const product =
    pathname === "/band" ||
    pathname === "/ring" ||
    pathname === "/watch" ||
    pathname === "/glasses" ||
    pathname === "/buds" ||
    pathname === "/share";

  return (
    <div
      className={cn(
        "pb-[calc(var(--app-tab)+env(safe-area-inset-bottom))] md:pb-0",
        product && "max-md:pb-[calc(var(--app-tab)+4.75rem+env(safe-area-inset-bottom))]",
      )}
    >
      <div className="sticky top-0 z-40">
        <AnnouncementBar />
        <Header />
      </div>
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
