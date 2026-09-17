"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Dumbbell,
  LayoutDashboard,
  LineChart,
  LogOut,
  Salad,
  Settings,
} from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

interface SidebarLayoutProps {
  user: { name: string; email: string };
  children: React.ReactNode;
}

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/dashboard/nutrition", label: "Nutrition", icon: Salad },
  { href: "/dashboard/progress", label: "Progress", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarLayout({ user, children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="flex">
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border h-screen sticky top-0">
          <SidebarContent pathname={pathname} onSignOut={signOut} user={user} />
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  pathname: string;
  onSignOut: () => void;
  user: { name: string; email: string };
  onNavigate?: () => void;
}

export function SidebarContent({
  pathname,
  onSignOut,
  user,
  onNavigate,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full p-5">
      <div className="mb-8">
        <BrandMark />
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors",
                active
                  ? "bg-bg-panel text-fg border border-border"
                  : "text-fg-muted hover:text-fg hover:bg-bg-panel/60 border border-transparent",
              )}
            >
              <Icon
                size={16}
                className={active ? "text-accent-red" : "text-fg-muted"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-5 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={user.name} />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-fg-dim truncate">{user.email}</div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className={cn(
            "w-full inline-flex items-center justify-center gap-2 rounded text-sm h-9 px-3",
            "bg-transparent text-fg-muted hover:text-fg border border-border hover:border-border-strong",
          )}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {/* Decorative bottom strip — references the red accent */}
      <div className="mt-4 flex items-center gap-2 text-fg-dim">
        <Activity size={12} className="text-accent-red" />
        <span className="font-mono-label text-[10px]">v0.1 · DEMO BUILD</span>
      </div>
    </div>
  );
}
