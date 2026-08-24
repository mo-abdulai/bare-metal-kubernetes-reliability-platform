"use client";

import {
  Activity,
  AlertTriangle,
  BookOpen,
  Boxes,
  GitBranch,
  FileText,
  Github,
  Home,
  Network,
  Server,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/infrastructure", label: "Infrastructure", icon: Server },
  { href: "/workloads", label: "Workloads", icon: Boxes },
  { href: "/services", label: "Services", icon: Network },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/runbooks", label: "Runbooks", icon: BookOpen },
  { href: "/gitops", label: "GitOps", icon: GitBranch },
];

const secondaryItems = [
  { href: "/docs", label: "Platform Docs", icon: FileText, disabled: true },
  { href: "#", label: "GitHub Repository", icon: Github, disabled: true },
];

function OpsPulseMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-200">
        <Activity aria-hidden="true" className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-semibold tracking-wide text-slate-950 dark:text-white">OpsPulse</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Reliability Console</div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 border-r border-slate-200 bg-slate-50 px-4 py-5 dark:border-slate-800 dark:bg-surface-950 lg:flex lg:flex-col">
      <Link href="/" className="rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        <OpsPulseMark />
      </Link>

      <nav aria-label="Primary navigation" className="mt-8 flex flex-1 flex-col justify-between">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <ul className="space-y-1 border-t border-slate-200 pt-4 dark:border-slate-800">
          {secondaryItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <span
                  className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 dark:text-slate-600"
                  title="TODO: configure repository metadata or documentation route"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export { navItems, OpsPulseMark };
