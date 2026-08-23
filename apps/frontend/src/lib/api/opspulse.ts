export interface OpsPulsePlatformStatus {
  platform: {
    name: string;
    environment: string;
    orchestrator: string;
    architecture: string;
  };
  service: {
    name: string;
    version: string;
    status: string;
  };
}

export type OpsPulseApiResult =
  | {
      status: "connected";
      data: OpsPulsePlatformStatus;
    }
  | {
      status: "unavailable";
      message: string;
    };

export class OpsPulseApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpsPulseApiError";
  }
}

function getApiBaseUrl(): string {
  return process.env.OPSPULSE_API_URL || "http://localhost:8000";
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 3000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getPlatformStatus(): Promise<OpsPulsePlatformStatus> {
  const baseUrl = getApiBaseUrl();
  const response = await fetchWithTimeout(`${baseUrl}/api/status`, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new OpsPulseApiError(`OpsPulse API returned HTTP ${response.status}.`);
  }

  return (await response.json()) as OpsPulsePlatformStatus;
}

export async function getPlatformStatusResult(): Promise<OpsPulseApiResult> {
  try {
    return {
      status: "connected",
      data: await getPlatformStatus(),
    };
  } catch {
    return {
      status: "unavailable",
      message: "OpsPulse API is currently unavailable.",
    };
  }
}
