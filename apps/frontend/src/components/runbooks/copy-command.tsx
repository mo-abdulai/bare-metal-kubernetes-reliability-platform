"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyCommandProps {
  command: string;
  label: string;
}

export function CopyCommand({ command, label }: CopyCommandProps) {
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{label}</p>
        <button
          type="button"
          onClick={copyCommand}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-offset-surface-850"
          aria-label={`Copy ${label.toLowerCase()} command`}
          title={copied ? "Copied" : `Copy ${label.toLowerCase()} command`}
        >
          {copied ? <Check aria-hidden="true" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>
      <code className="mt-2 block overflow-x-auto whitespace-nowrap text-xs text-slate-900 dark:text-slate-100">{command}</code>
    </div>
  );
}
