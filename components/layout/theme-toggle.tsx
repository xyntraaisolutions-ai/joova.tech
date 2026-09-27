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

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={night}
      aria-label={night ? "Switch to day mode" : "Switch to night mode"}
      className="flex size-10 items-center justify-center rounded-full border border-stone hover:bg-stone"
    >
      {night ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
