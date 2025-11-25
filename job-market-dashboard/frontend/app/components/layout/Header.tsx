"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { Moon, Sun, BarChart3, Settings } from "lucide-react";

export function Header() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check initial theme
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Script to run on page load (prevent flash)
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="dashboard-container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="hidden font-semibold sm:inline-block">
              Job Market Intelligence
            </span>
          </Link>

          <nav className="hidden items-center gap-4 md:flex">
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/admin"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Admin
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Disclaimer */}
          <span className="hidden text-xs text-muted-foreground lg:block">
            Data for personal/research use only
          </span>

          {/* Dark Mode Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="h-9 w-9 p-0"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle dark mode</span>
            </Button>
          )}

          {/* Admin Link (mobile) */}
          <Link href="/admin" className="md:hidden">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Admin</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
