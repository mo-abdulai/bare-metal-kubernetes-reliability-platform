import { ArrowLeft, Terminal } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { StatusBadge } from "@/components/ui/status-badge";
import { getRunbook, OpsPulseApiError } from "@/lib/api/opspulse";

export const dynamic = "force-dynamic";

interface RunbookDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function renderMarkdown(content: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const lines = content.split("\n");
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let inFence = false;

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }
    const items = listItems;
    listItems = [];
    nodes.push(
      <ul key={`list-${nodes.length}`} className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>,
    );
  };

  const flushCode = () => {
    if (codeLines.length === 0) {
      return;
    }
    const code = codeLines.join("\n");
    codeLines = [];
    nodes.push(
      <pre key={`code-${nodes.length}`} className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs leading-5 text-slate-100 dark:border-slate-800">
        <code>{code}</code>
      </pre>,
    );
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith("<!--")) {
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushList();
      if (inFence) {
        flushCode();
      }
      inFence = !inFence;
      continue;
    }

    if (inFence) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      flushList();
      flushCode();
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      flushCode();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      flushCode();
      nodes.push(
        <h2 key={`h2-${nodes.length}`} className="pt-4 text-lg font-semibold text-slate-950 dark:text-slate-50">
          {trimmed.slice(3)}
        </h2>,
      );
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushCode();
      listItems.push(trimmed.slice(2));
      continue;
    }

    if (trimmed.startsWith("sudo ") || trimmed.startsWith("kubectl ") || trimmed.startsWith("curl ") || trimmed.startsWith("helm ")) {
      flushList();
      codeLines.push(trimmed);
      continue;
    }

    flushList();
    flushCode();
    nodes.push(
      <p key={`p-${nodes.length}`} className="text-sm leading-6 text-slate-700 dark:text-slate-300">
        {trimmed}
      </p>,
    );
  }

  flushList();
  flushCode();
  return nodes;
}

export default async function RunbookDetailPage({ params }: RunbookDetailPageProps) {
  const { id } = await params;
  let runbook;

  try {
    runbook = await getRunbook(id);
  } catch (error) {
    if (error instanceof OpsPulseApiError) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Link href="/runbooks" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200">
        <ArrowLeft className="h-4 w-4" />
        Back to runbooks
      </Link>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{runbook.category}</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{runbook.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">{runbook.purpose}</p>
          </div>
          <StatusBadge status="Documented" label={`Updated ${runbook.lastUpdated}`} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {runbook.linkedSignals.map((signal) => (
            <StatusBadge key={signal} status="Documented" label={signal} />
          ))}
          {runbook.reproducible ? <StatusBadge status="connected" label="Reproducible" /> : null}
        </div>
        {runbook.reproducible ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
              <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Reproduce</p>
              <code className="mt-2 block overflow-x-auto text-xs text-slate-900 dark:text-slate-100">{runbook.reproductionCommand}</code>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-surface-850">
              <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Cleanup</p>
              <code className="mt-2 block overflow-x-auto text-xs text-slate-900 dark:text-slate-100">{runbook.cleanupCommand}</code>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <div className="mb-4 flex items-center gap-2">
          <Terminal className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Procedure</h2>
        </div>
        <div className="flex flex-col gap-4">{renderMarkdown(runbook.content)}</div>
      </section>
    </div>
  );
}
