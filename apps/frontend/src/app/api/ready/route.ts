import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      status: "ready",
      service: "opspulse-web",
      checks: {
        nextServer: "ok",
      },
    },
    { status: 200 },
  );
}
