"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSiteContent } from "@/components/layout/site-content";

export function CountryMenu() {
  const { market, markets } = useSiteContent();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return markets.filter((country) => {
      if (!needle) return true;
      return country.name.toLowerCase().includes(needle) || country.code.toLowerCase().includes(needle) || country.currency.toLowerCase().includes(needle);
    });
  }, [markets, query]);

  async function choose(code: string) {
    if (code === market.code || pending) {
      setOpen(false);
      return;
    }
    setPending(true);
    const response = await fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setPending(false);
    if (!response.ok) return;
    setOpen(false);
    setQuery("");
    router.refresh();
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="inline-flex h-11 items-center rounded-full px-2 text-sm font-medium hover:bg-stone sm:px-3"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${market.name}, ${market.currency}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sm:hidden">{market.code}</span>
        <span className="hidden sm:inline">{market.code} · {market.currency}</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(18rem,calc(100vw-2.5rem))] rounded-2xl border border-stone bg-paper p-3 shadow-lg">
          <p className="px-2 text-sm font-bold">{market.name}</p>
          <p className="mt-1 px-2 text-xs text-muted">Payment at checkout is in US dollars.</p>
          <label className="mt-3 block text-sm">
            <span className="sr-only">Search countries</span>
            <input
              className="h-10 w-full rounded-xl border border-stone bg-white px-3 text-sm"
              value={query}
              placeholder="Search countries"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <ul className="mt-2 max-h-64 overflow-auto" role="listbox" aria-label="Countries">
            {matches.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={country.code === market.code}
                  className="flex min-h-11 w-full items-center justify-between rounded-xl px-2 text-left text-sm hover:bg-stone/50"
                  disabled={pending}
                  onClick={() => void choose(country.code)}
                >
                  <span>{country.name}</span>
                  <span className="text-muted">{country.currency}</span>
                </button>
              </li>
            ))}
            {matches.length === 0 ? <li className="px-2 py-2 text-sm text-muted">No matching country.</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
