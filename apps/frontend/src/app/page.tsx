import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ClusterTopology } from "@/components/dashboard/cluster-topology";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPlatformStatusResult } from "@/lib/api/opspulse";
import { clusterNodes, platformActivity, platformCapabilities, platformSummary } from "@/lib/data/infrastructure";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const apiStatus = await getPlatformStatusResult();
  const platform =
    apiStatus.status === "connected"
      ? apiStatus.data.platform
      : {
          name: "Bare-Metal Kubernetes Reliability & Operations Platform",
          environment: "bare-metal",
          orchestrator: "K3s",
          architecture: "ARM64",
        };
  const apiVersion = apiStatus.status === "connected" ? apiStatus.data.service.version : "Unavailable";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">OpsPulse Infrastructure Console</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              {platform.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              A production-style operations frontend for the documented two-node ARM64 K3s platform. Platform metadata is read from the internal
              OpsPulse API when available and falls back to documented repository facts during backend outages.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="Documented" label={`${platform.environment} · ${platform.architecture} · ${platform.orchestrator}`} />
            <StatusBadge status={apiStatus.status === "connected" ? "connected" : "unavailable"} label={apiStatus.status === "connected" ? "Backend Connected" : "Backend Unavailable"} />
          </div>
        </div>
      </section>

      {apiStatus.status === "unavailable" ? (
        <section className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-100">
          OpsPulse API is currently unavailable. Static infrastructure information remains available while backend communication recovers.
        </section>
      ) : null}

      <section aria-label="Platform summary" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {platformSummary.map((item) => (
          <MetricCard key={item.label} item={item} />
        ))}
      </section>

      <section aria-label="API platform metadata" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Environment", platform.environment],
          ["Orchestrator", platform.orchestrator],
          ["Architecture", platform.architecture],
          ["API Version", apiVersion],
          ["Backend", apiStatus.status === "connected" ? "Connected" : "Unavailable"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-surface-900">
            <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">{value}</p>
          </div>
        ))}
      </section>

      <ClusterTopology nodes={clusterNodes} />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Current Platform Capabilities</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Capabilities verified from repository architecture documentation.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {platformCapabilities.map((capability) => (
              <li key={capability} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-800 dark:bg-surface-850 dark:text-slate-200">
                {capability}
              </li>
            ))}
          </ul>
        </section>

        <ActivityFeed activity={platformActivity} />
      </div>
    </div>
  );
}
