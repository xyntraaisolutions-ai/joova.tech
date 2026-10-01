"use client";

import { createContext, useContext, type ReactNode } from "react";
import { staticBundle } from "@/lib/content/static";
import type { ContentBundle } from "@/lib/content/types";

const SiteContentContext = createContext<ContentBundle | null>(null);

export function SiteContentProvider({ value, children }: { value: ContentBundle; children: ReactNode }) {
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext) ?? staticBundle();
}
