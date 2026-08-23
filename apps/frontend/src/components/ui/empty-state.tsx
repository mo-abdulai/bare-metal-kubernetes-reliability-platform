import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-surface-900">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3">
        {icon ? <div className="text-slate-500 dark:text-slate-400">{icon}</div> : null}
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </section>
  );
}
