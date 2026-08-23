import { NextResponse } from "next/server";

import { getPlatformStatusResult } from "@/lib/api/opspulse";

export async function GET() {
  const result = await getPlatformStatusResult();

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
