"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "day" | "night";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("day");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "night" ? "night" : "day");
  }, []);

  function toggle() {
    const next: Theme = theme === "night" ? "day" : "night";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("joova-theme", next);
    setTheme(next);
  }

  const night = theme === "night";

  const label = night ? "Day mode" : "Night mode";

  return (
    <span className="group/tip relative inline-flex">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={night}
        aria-label={night ? "Switch to day mode" : "Switch to night mode"}
        className="flex size-11 items-center justify-center rounded-full border border-stone hover:bg-stone"
      >
        {night ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
      <span className="header-tip" aria-hidden="true">
        {label}
      </span>
    </span>
  );
}
