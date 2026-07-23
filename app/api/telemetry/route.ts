import { NextRequest, NextResponse } from "next/server";

import { getTelemetry, TelemetryProviderError } from "@/lib/telemetry/provider";
import type { TelemetryError } from "@/lib/telemetry/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const snapshot = await getTelemetry(request.nextUrl.searchParams.get("scenario"));
    return NextResponse.json(snapshot, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const knownError = error instanceof TelemetryProviderError;
    const payload: TelemetryError = {
      error: knownError ? error.message : "Falha inesperada ao carregar telemetria.",
      code: knownError ? error.code : "UNKNOWN",
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      status: knownError ? 502 : 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
