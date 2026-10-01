"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PortalMenuItem = { id: string; label: string };
export type PortalMenuGroup = { id: string; label: string; items: PortalMenuItem[] };

const PortalSectionContext = createContext("");

export function PortalMenu({
  groups,
  children,
  className = "mt-8",
}: {
  groups: PortalMenuGroup[];
  children: ReactNode;
  className?: string;
}) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [itemId, setItemId] = useState(groups[0]?.items[0]?.id ?? "");
  const group = groups.find((entry) => entry.id === groupId) ?? groups[0];
  const active = group?.items.some((item) => item.id === itemId) ? itemId : group?.items[0]?.id ?? "";

  return (
    <PortalSectionContext.Provider value={active}>
      <div className={className}>
        <nav className="flex flex-wrap gap-2" aria-label="Sections">
          {groups.map((entry) => {
            const selected = entry.id === group?.id;
            return (
              <button
                key={entry.id}
                type="button"
                aria-pressed={selected}
                className={cn(
                  "min-h-11 rounded-full px-4 text-sm font-bold",
                  selected ? "bg-ink text-paper" : "border border-stone text-ink",
                )}
                onClick={() => {
                  setGroupId(entry.id);
                  setItemId(entry.items[0]?.id ?? "");
                }}
              >
                {entry.label}
              </button>
            );
          })}
        </nav>
        {group && group.items.length > 1 ? (
          <nav className="mt-3 flex flex-wrap gap-2" aria-label={group.label}>
            {group.items.map((item) => {
              const selected = item.id === active;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  className={cn(
                    "min-h-11 rounded-full px-4 text-sm",
                    selected ? "border border-ink font-bold text-ink" : "text-muted",
                  )}
                  onClick={() => setItemId(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>
    </PortalSectionContext.Provider>
  );
}

export function PortalPanel({ id, children }: { id: string; children: ReactNode }) {
  const active = useContext(PortalSectionContext);
  return <div hidden={active !== id}>{children}</div>;
}
