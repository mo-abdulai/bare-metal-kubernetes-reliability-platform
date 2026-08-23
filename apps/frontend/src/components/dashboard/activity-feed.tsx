import { CheckCircle2, FileText } from "lucide-react";

import type { PlatformActivity } from "@/types/infrastructure";

interface ActivityFeedProps {
  activity: PlatformActivity[];
  title?: string;
  description?: string;
}

export function ActivityFeed({
  activity,
  title = "Recent Activity",
  description = "Repository-backed project milestones, not live operational events.",
}: ActivityFeedProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
      <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>

      <ol className="mt-5 space-y-4">
        {activity.map((item) => {
          const Icon = item.status === "completed" ? CheckCircle2 : FileText;

          return (
            <li key={item.id} className="flex gap-3">
              <div className="mt-0.5 text-blue-700 dark:text-blue-300">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{item.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
