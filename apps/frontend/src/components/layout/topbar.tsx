"use client";

import { usePathname } from "next/navigation";

import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { StatusBadge } from "@/components/ui/status-badge";
import { appConfig } from "@/lib/utils/env";

const titles: Record<string, string> = {
  "/": "Overview",
  "/infrastructure": "Infrastructure",
  "/workloads": "Workloads",
  "/services": "Services",
  "/incidents": "Incidents",
  "/runbooks": "Runbooks",
};

export function Topbar() {
  const pathname = usePathname();
  const title = titles[pathname] || "OpsPulse";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-surface-950/90 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-slate-950 dark:text-slate-50">{title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Infrastructure Reliability & Operations Console</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <StatusBadge status="Documented" label="Static source" />
            <span className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">
              Bare Metal
            </span>
            <span className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">
              K3s
            </span>
            <span className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">
              v{appConfig.version}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
