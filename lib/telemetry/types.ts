export const conditionStates = [
  "nominal",
  "inspect",
  "degraded",
  "fault",
] as const;

export type ConditionState = (typeof conditionStates)[number];
export type DataMode = "synthetic" | "live";
export type DemoScenario = "nominal" | "inspect" | "degraded";

export interface SignalPoint {
  timestamp: string;
  elapsedSeconds: number;
  rmsG: number;
  score: number;
  threshold: number;
}

export interface AxisFeatures {
  x: number;
  y: number;
  z: number;
}

export interface FeatureVector {
  rmsG: AxisFeatures;
  peakG: number;
  crestFactor: number;
  kurtosis: number;
  spectralEnergy: number;
}

export interface DeviceSummary {
  id: string;
  name: string;
  asset: string;
  state: ConditionState;
  score: number;
  connected: boolean;
  lastSeen: string;
}

export interface ConditionEvent {
  id: string;
  timestamp: string;
  state: ConditionState;
  title: string;
  evidence: string;
  acknowledged: boolean;
}

export interface PipelineStage {
  id: string;
  label: string;
  value: string;
  status: "complete" | "active" | "warning";
}

export interface TelemetrySnapshot {
  schemaVersion: "condition-monitor/v1";
  dataMode: DataMode;
  generatedAt: string;
  provenance: string;
  device: {
    id: string;
    name: string;
    asset: string;
    state: ConditionState;
    quality: "valid" | "partial" | "invalid";
    connected: boolean;
    uptimeSeconds: number;
    sampleRateHz: number;
    droppedSamples: number;
  };
  decision: {
    score: number;
    threshold: number;
    confidence: number;
    recommendation: string;
    explanation: string;
  };
  features: FeatureVector;
  series: SignalPoint[];
  fleet: DeviceSummary[];
  events: ConditionEvent[];
  pipeline: PipelineStage[];
  versions: {
    hardware: string;
    firmware: string;
    features: string;
    model: string;
  };
}

export interface TelemetryError {
  error: string;
  code: "UPSTREAM_UNAVAILABLE" | "UPSTREAM_INVALID" | "UNKNOWN";
  generatedAt: string;
}
