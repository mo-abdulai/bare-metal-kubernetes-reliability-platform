import { NextResponse } from "next/server";

import { getClusterInventoryResult } from "@/lib/api/opspulse";

export async function GET() {
  const result = await getClusterInventoryResult();

  if (result.status === "unavailable") {
    return NextResponse.json(
      {
        status: "unavailable",
        message: result.message,
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      status: "connected",
      data: result.data,
    },
    { status: 200 },
  );
}
