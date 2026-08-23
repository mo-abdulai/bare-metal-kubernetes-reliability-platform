export type ServiceHealth = "ok" | "connected" | "unavailable" | "unknown" | "not-checked";

export interface ServiceRecord {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  health: ServiceHealth;
  lastCheck: string;
  source: "static" | "self-check" | "backend";
}
