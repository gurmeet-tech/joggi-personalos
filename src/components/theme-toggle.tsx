"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const KEY = "myos-theme";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-full p-sm text-ink hover:bg-canvas-soft"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
