"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { apiGet } from "@/lib/client";

interface PublicUser {
  id: string;
  email: string;
  name: string;
}

export function UserMenu() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    apiGet<{ user: PublicUser }>("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-9 items-center rounded border border-border px-4 text-sm font-medium text-fg hover:border-accent-red hover:text-accent-red transition-colors"
      >
        Login
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded border border-border bg-bg-panel px-2 h-9 hover:border-border-strong"
      >
        <Avatar name={user.name} size="sm" />
        <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
          {user.name.split(" ")[0]}
        </span>
        <ChevronDown size={14} className="text-fg-muted" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded border border-border bg-bg-panel shadow-2xl overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-border">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-fg-dim truncate">{user.email}</div>
          </div>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg-raised",
            )}
          >
            <LayoutDashboard size={14} className="text-fg-muted" /> Dashboard
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg-raised"
          >
            <Settings size={14} className="text-fg-muted" /> Settings
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-red hover:bg-bg-raised border-t border-border"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
