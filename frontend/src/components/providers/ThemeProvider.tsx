"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const effectiveDark = theme === "dark" || (theme === "system" && getSystemPrefersDark());
  root.classList.toggle("dark", effectiveDark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("theme");
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeState(stored);
        applyThemeClass(stored);
      } else {
        applyThemeClass("system");
      }
    } catch {}

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      setThemeState((prev) => {
        if (prev === "system") applyThemeClass("system");
        return prev;
      });
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      window.localStorage.setItem("theme", t);
    } catch {}
    applyThemeClass(t);
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}


