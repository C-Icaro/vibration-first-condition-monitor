import { generateMockTelemetry, parseScenario } from "./mock";
import type { TelemetrySnapshot } from "./types";
import { isTelemetrySnapshot } from "./validation";

export class TelemetryProviderError extends Error {
  constructor(
    message: string,
    public readonly code: "UPSTREAM_UNAVAILABLE" | "UPSTREAM_INVALID",
  ) {
    super(message);
  }
}

async function fetchUpstream(url: string, token?: string): Promise<TelemetrySnapshot> {
  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: AbortSignal.timeout(4500),
    });
  } catch {
    throw new TelemetryProviderError(
      "Não foi possível alcançar a fonte de telemetria configurada.",
      "UPSTREAM_UNAVAILABLE",
    );
  }

  if (!response.ok) {
    throw new TelemetryProviderError(
      `A fonte de telemetria respondeu com HTTP ${response.status}.`,
      "UPSTREAM_UNAVAILABLE",
    );
  }

  const payload: unknown = await response.json();
  if (!isTelemetrySnapshot(payload)) {
    throw new TelemetryProviderError(
      "A fonte configurada não atende ao schema condition-monitor/v1.",
      "UPSTREAM_INVALID",
    );
  }

  return { ...payload, dataMode: "live" };
}

export async function getTelemetry(
  scenarioValue: string | null,
): Promise<TelemetrySnapshot> {
  const upstreamUrl = process.env.TELEMETRY_UPSTREAM_URL?.trim();

  if (!upstreamUrl) {
    return generateMockTelemetry(parseScenario(scenarioValue));
  }

  return fetchUpstream(upstreamUrl, process.env.TELEMETRY_UPSTREAM_TOKEN);
}
