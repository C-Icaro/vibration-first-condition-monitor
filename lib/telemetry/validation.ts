import { conditionStates, type TelemetrySnapshot } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isTelemetrySnapshot(value: unknown): value is TelemetrySnapshot {
  if (!isRecord(value)) {
    return false;
  }

  const device = value.device;
  const decision = value.decision;
  const features = value.features;
  const versions = value.versions;

  return (
    value.schemaVersion === "condition-monitor/v1" &&
    (value.dataMode === "synthetic" || value.dataMode === "live") &&
    typeof value.generatedAt === "string" &&
    typeof value.provenance === "string" &&
    isRecord(device) &&
    typeof device.id === "string" &&
    typeof device.name === "string" &&
    typeof device.asset === "string" &&
    conditionStates.includes(device.state as (typeof conditionStates)[number]) &&
    typeof device.connected === "boolean" &&
    isRecord(decision) &&
    isNumber(decision.score) &&
    isNumber(decision.threshold) &&
    isNumber(decision.confidence) &&
    typeof decision.recommendation === "string" &&
    typeof decision.explanation === "string" &&
    isRecord(features) &&
    Array.isArray(value.series) &&
    Array.isArray(value.fleet) &&
    Array.isArray(value.events) &&
    Array.isArray(value.pipeline) &&
    isRecord(versions)
  );
}
