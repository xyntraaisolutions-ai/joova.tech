"use client";

import { useState, type ReactNode } from "react";
import type { CatalogProduct } from "@/content/catalog";
import { cn } from "@/lib/utils";

type AboutTab = {
  id: string;
  label: string;
  body: ReactNode;
};

export function ProductAbout({
  overview,
  note,
  story,
}: {
  overview: string;
  note: string;
  story?: CatalogProduct["story"];
}) {
  const paragraphs = overview.split(/\n\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const tabs: AboutTab[] = [];
  if (paragraphs.length) {
    tabs.push({
      id: "overview",
      label: "Overview",
      body: (
        <div className="space-y-4">
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
      ),
    });
  }
  if (story?.specifications.length) {
    tabs.push({
      id: "specifications",
      label: "Specifications",
      body: (
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {story.specifications.map((row) => (
            <div key={`${row.label}-${row.value}`} className="border-b border-stone pb-4">
              <dt className="text-sm font-bold text-ink">{row.label}</dt>
              <dd className="mt-1 text-muted">{row.value}</dd>
            </div>
          ))}
        </dl>
      ),
    });
  }
  if (story?.inTheBox.length) {
    tabs.push({
      id: "box",
      label: "In the box",
      body: (
        <ul className="grid gap-3 sm:grid-cols-2">
          {story.inTheBox.map((item) => (
            <li key={item} className="rounded-2xl border border-stone bg-white px-4 py-3">{item}</li>
          ))}
        </ul>
      ),
    });
  }
  if (story?.compatibility) {
    tabs.push({ id: "compatibility", label: "Compatibility", body: <p>{story.compatibility}</p> });
  }
  if (story?.care) {
    tabs.push({ id: "care", label: "Care", body: <p>{story.care}</p> });
  }
  if (story?.app) {
    tabs.push({ id: "app", label: "The app", body: <p>{story.app}</p> });
  }

  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const callout = note.trim() && !overview.includes(note.trim()) ? note.trim() : "";
  if (!tabs.length && !callout) return null;
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <div>
      {tabs.length ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="About this product">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={tab.id === current?.id}
                className={cn(
                  "min-h-11 shrink-0 rounded-full px-4 text-sm font-bold",
                  tab.id === current?.id ? "bg-ink text-paper" : "border border-stone bg-white text-ink",
                )}
                onClick={() => setActive(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="mt-6 text-muted">
            {current?.body}
          </div>
        </>
      ) : null}
      {callout ? <p className="mt-6 rounded-3xl border border-stone bg-white p-6 font-medium text-ink">{callout}</p> : null}
    </div>
  );
}
