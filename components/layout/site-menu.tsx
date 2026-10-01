"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SiteMenuValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SiteMenuContext = createContext<SiteMenuValue | null>(null);

export function SiteMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <SiteMenuContext.Provider value={{ open, setOpen }}>{children}</SiteMenuContext.Provider>;
}

export function useSiteMenu() {
  const value = useContext(SiteMenuContext);
  if (!value) throw new Error("useSiteMenu requires SiteMenuProvider");
  return value;
}
