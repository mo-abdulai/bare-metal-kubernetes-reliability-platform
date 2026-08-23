import { Network } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPlatformStatusResult } from "@/lib/api/opspulse";
import { services } from "@/lib/data/services";
import type { ServiceRecord } from "@/types/services";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const apiStatus = await getPlatformStatusResult();
  const serviceRows: ServiceRecord[] = [
    ...services,
    {
      id: "opspulse-api",
      name: "OpsPulse API",
      type: "Internal API",
      endpoint: "/api/platform/status",
      health: apiStatus.status === "connected" ? "connected" : "unavailable",
      lastCheck: apiStatus.status === "connected" ? `Version ${apiStatus.data.service.version}` : "Unavailable through frontend proxy",
      source: "backend",
    },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">Services</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Service records combine documented frontend definitions with the live backend connection state exposed through the frontend proxy.
          </p>
        </div>
        <StatusBadge status={apiStatus.status === "connected" ? "connected" : "unavailable"} label={apiStatus.status === "connected" ? "API Connected" : "API Unavailable"} />
      </section>

      {serviceRows.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-surface-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-surface-850 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Endpoint</th>
                  <th className="px-4 py-3">Health</th>
                  <th className="px-4 py-3">Last Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {serviceRows.map((service) => (
                  <tr key={service.id} className="align-top">
                    <td className="px-4 py-4 font-medium text-slate-950 dark:text-slate-50">{service.name}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{service.type}</td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">{service.endpoint}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={service.health} label={service.health === "connected" ? "Connected" : service.health === "unavailable" ? "Unavailable" : "Not live checked"} />
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{service.lastCheck}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Network aria-hidden="true" className="h-10 w-10" />}
          title="No services reported"
          description="Operational service health will appear here after the platform API is connected."
        />
      )}
    </div>
  );
}
