import { NextResponse } from "next/server";
import { getGitHubTelemetry } from "@/lib/github";
export const dynamic = "force-dynamic";
export async function GET() {
  const data = await getGitHubTelemetry();
  return NextResponse.json(data, {
    status: data.status === "error" ? 503 : 200,
    headers: {
      "Cache-Control": "no-store",
      ...(data.status === "error" && data.retryAt
        ? {
            "Retry-After": String(
              Math.max(1, Math.ceil((Date.parse(data.retryAt) - Date.now()) / 1000)),
            ),
          }
        : {}),
    },
  });
}
