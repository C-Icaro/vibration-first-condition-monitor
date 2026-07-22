import { describe, expect, it } from "vitest";

import { generateMockTelemetry, parseScenario } from "@/lib/telemetry/mock";
import { isTelemetrySnapshot } from "@/lib/telemetry/validation";

const fixedNow = new Date("2026-07-14T03:00:00.000Z");

describe("mock telemetry", () => {
  it.each([
    ["nominal", "nominal"],
    ["inspect", "inspect"],
    ["degraded", "degraded"],
  ] as const)("maps %s to %s", (scenario, state) => {
    const snapshot = generateMockTelemetry(scenario, fixedNow);

    expect(snapshot.device.state).toBe(state);
    expect(snapshot.dataMode).toBe("synthetic");
    expect(snapshot.series).toHaveLength(48);
    expect(snapshot.provenance).toContain("sintético");
    expect(isTelemetrySnapshot(snapshot)).toBe(true);
  });

  it("keeps scores and confidence in normalized ranges", () => {
    const snapshot = generateMockTelemetry("inspect", fixedNow);

    expect(snapshot.decision.score).toBeGreaterThanOrEqual(0);
    expect(snapshot.decision.score).toBeLessThanOrEqual(1);
    expect(snapshot.decision.confidence).toBeGreaterThanOrEqual(0);
    expect(snapshot.decision.confidence).toBeLessThanOrEqual(1);
    expect(snapshot.series.every((point) => point.score >= 0 && point.score <= 1)).toBe(true);
  });

  it("falls back to inspect for unsupported scenarios", () => {
    expect(parseScenario("anything")).toBe("inspect");
    expect(parseScenario(null)).toBe("inspect");
  });

  it("rejects an incomplete upstream payload", () => {
    expect(isTelemetrySnapshot({ schemaVersion: "condition-monitor/v1" })).toBe(false);
  });
});
