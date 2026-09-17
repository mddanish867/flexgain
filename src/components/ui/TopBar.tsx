"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { BrandMark } from "@/components/ui/BrandMark";
import { UserMenu } from "@/components/ui/UserMenu";
import { cn } from "@/lib/cn";

interface TopBarProps {
  /** When true, render only the brand + login button (dashboard variant). */
  minimal?: boolean;
}

const NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/#pricing", label: "Pricing" },
];

export function TopBar({ minimal = false }: TopBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group">
          <BrandMark />
        </Link>

        {!minimal ? (
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-2 text-sm text-fg-muted hover:text-fg transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          {!minimal ? (
            <>
              <div className="hidden md:block">
                <UserMenu />
              </div>
              <button
                aria-label="Toggle menu"
                onClick={() => setOpen((v) => !v)}
                className="md:hidden h-10 w-10 grid place-items-center rounded border border-border text-fg-muted hover:text-fg"
              >
                {open ? <X size={18} /> : <Menu size={18} />}
              </button>
            </>
          ) : (
            <Link
              href="/dashboard"
              className={buttonClass({ variant: "ghost", size: "sm" })}
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>

      {!minimal ? (
        <div
          className={cn(
            "md:hidden border-t border-border overflow-hidden transition-[max-height] duration-200",
            open ? "max-h-64" : "max-h-0",
          )}
        >
          <nav className="flex flex-col px-5 py-3 gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="px-2 py-2 text-sm text-fg-muted hover:text-fg"
              >
                {n.label}
              </Link>
            ))}
            <div className="px-2 py-2">
              <UserMenu />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
