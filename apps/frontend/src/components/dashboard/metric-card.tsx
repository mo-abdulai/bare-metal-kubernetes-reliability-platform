import { StatusBadge } from "@/components/ui/status-badge";
import type { PlatformSummary } from "@/types/infrastructure";

export function MetricCard({ item }: { item: PlatformSummary }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-surface-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.label}</h2>
          <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-50">{item.value}</p>
        </div>
        <StatusBadge status={item.state} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.description}</p>
    </article>
  );
}
