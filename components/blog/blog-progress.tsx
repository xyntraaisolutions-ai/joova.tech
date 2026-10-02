"use client";

import { useEffect, useState } from "react";

export function BlogProgress() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    function onScroll() {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setValue(height > 0 ? Math.min(100, (window.scrollY / height) * 100) : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <div className="h-full bg-coral" style={{ width: `${value}%` }} />
    </div>
  );
}
