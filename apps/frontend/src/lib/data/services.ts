import type { ServiceRecord } from "@/types/services";

export const services: ServiceRecord[] = [
  {
    id: "opspulse-web",
    name: "OpsPulse Web",
    type: "Next.js frontend",
    endpoint: "/api/health",
    health: "not-checked",
    lastCheck: "Static route configured; no live polling",
    source: "static",
  },
];
