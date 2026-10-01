"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSiteContent } from "@/components/layout/site-content";
import { Input } from "@/components/ui/input";

export function HelpSearch() {
  const { helpArticles } = useSiteContent();
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return helpArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(q) ||
        article.body.toLowerCase().includes(q) ||
        article.summary.toLowerCase().includes(q),
    );
  }, [helpArticles, query]);

  return (
    <div className="mt-8 max-w-xl">
      <label htmlFor="help-search" className="text-sm text-muted">
        Search articles
      </label>
      <Input
        id="help-search"
        className="mt-2"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Charging, strap, sync…"
      />
      {query ? (
        <ul className="mt-3 space-y-2">
          {results.length === 0 ? (
            <li className="text-sm text-muted">No matching articles.</li>
          ) : (
            results.map((article) => (
              <li key={article.slug}>
                <Link href={`/help/${article.slug}`} className="text-ink underline">
                  {article.title}
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
