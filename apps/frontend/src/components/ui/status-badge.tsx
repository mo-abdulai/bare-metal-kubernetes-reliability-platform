import { Circle } from "lucide-react";

import { statusClasses } from "@/lib/utils/styles";
import type { NodeStatus } from "@/types/infrastructure";
import type { ServiceHealth } from "@/types/services";

type StatusValue = NodeStatus | ServiceHealth | "Static" | "Verified" | "Documented" | "Ready";

interface StatusBadgeProps {
  status: StatusValue;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const display = label || status;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${statusClasses(status === "Ready" ? "Verified" : status)}`}>
      <Circle aria-hidden="true" className="h-2 w-2 fill-current" />
      {display}
    </span>
  );
}
