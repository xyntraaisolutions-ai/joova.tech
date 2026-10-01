"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import type { ReactNode } from "react";

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/portal")) {
    return <main id="main">{children}</main>;
  }

  return (
    <div className="pb-[calc(var(--app-tab)+env(safe-area-inset-bottom))] md:pb-0">
      <div className="sticky top-0 z-40">
        <AnnouncementBar />
        <Header />
      </div>
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
