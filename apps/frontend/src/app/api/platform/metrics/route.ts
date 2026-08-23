import { NextResponse } from "next/server";

import { getMetricsSummary } from "@/lib/api/opspulse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = await getMetricsSummary();
    return NextResponse.json({ status: "connected", data: metrics });
  } catch {
    return NextResponse.json(
      {
        status: "unavailable",
        message: "Metrics service is currently unavailable.",
      },
      { status: 503 },
    );
  }
}
