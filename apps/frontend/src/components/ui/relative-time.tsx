"use client";

import { useEffect, useState } from "react";

interface RelativeTimeProps {
  value: string;
  prefix?: string;
}

function formatElapsedSeconds(value: string): string {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "unknown";
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (elapsedSeconds < 5) {
    return "just now";
  }

  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s ago`;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  return `${elapsedHours}h ago`;
}

export function RelativeTime({ value, prefix = "Last updated" }: RelativeTimeProps) {
  const [label, setLabel] = useState("just now");

  useEffect(() => {
    const updateLabel = () => setLabel(formatElapsedSeconds(value));

    updateLabel();
    const interval = window.setInterval(updateLabel, 1000);

    return () => window.clearInterval(interval);
  }, [value]);

  return (
    <time dateTime={value} className="text-xs font-medium text-slate-500 dark:text-slate-400">
      {prefix}: {label}
    </time>
  );
}
