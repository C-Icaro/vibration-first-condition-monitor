import type {
  ConditionEvent,
  ConditionState,
  DemoScenario,
  DeviceSummary,
  SignalPoint,
  TelemetrySnapshot,
} from "./types";

const SCENARIO_CONFIG: Record<
  DemoScenario,
  {
    state: ConditionState;
    score: number;
    confidence: number;
    baseRms: number;
    recommendation: string;
    explanation: string;
  }
> = {
  nominal: {
    state: "nominal",
    score: 0.24,
    confidence: 0.91,
    baseRms: 0.17,
    recommendation: "Continuar observação",
    explanation: "O perfil permanece dentro da faixa caracterizada para esta montagem.",
  },
  inspect: {
    state: "inspect",
    score: 0.82,
    confidence: 0.88,
    baseRms: 0.41,
    recommendation: "Inspecionar fixação e carga",
    explanation: "RMS e energia espectral cresceram com persistência acima do limiar.",
  },
  degraded: {
    state: "degraded",
    score: 0.56,
    confidence: 0.42,
    baseRms: 0.29,
    recommendation: "Verificar sensor antes de decidir",
    explanation: "A perda de amostras reduz a qualidade da janela e bloqueia uma conclusão forte.",
  },
};

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, digits = 3): number {
  return Number(value.toFixed(digits));
}

function wave(seed: number, index: number, scale: number): number {
  const primary = Math.sin((seed + index) * 0.42) * scale;
  const harmonic = Math.sin((seed + index) * 1.31) * scale * 0.28;
  return primary + harmonic;
}

function makeSeries(
  now: Date,
  scenario: DemoScenario,
  seed: number,
  baseRms: number,
  baseScore: number,
): SignalPoint[] {
  return Array.from({ length: 48 }, (_, index) => {
    const elapsedSeconds = (index - 47) * 2;
    const pulse = scenario === "inspect" && index > 27 ? (index - 27) * 0.005 : 0;
    const qualityNoise = scenario === "degraded" && index % 9 === 0 ? 0.09 : 0;
    const rmsG = Math.max(
      0.03,
      baseRms + wave(seed, index, 0.045) + pulse + qualityNoise,
    );
    const score = clamp(
      baseScore + wave(seed + 5, index, 0.07) + pulse * 1.25 + qualityNoise,
    );

    return {
      timestamp: new Date(now.getTime() + elapsedSeconds * 1000).toISOString(),
      elapsedSeconds,
      rmsG: round(rmsG),
      score: round(score),
      threshold: 0.68,
    };
  });
}

function makeFleet(now: Date, scenario: DemoScenario): DeviceSummary[] {
  const active = SCENARIO_CONFIG[scenario];
  return [
    {
      id: "cm-lab-01",
      name: "Node 01",
      asset: "Ventilador de bancada",
      state: active.state,
      score: active.score,
      connected: scenario !== "degraded",
      lastSeen: now.toISOString(),
    },
    {
      id: "cm-lab-02",
      name: "Node 02",
      asset: "Motor de testes A",
      state: "nominal",
      score: 0.18,
      connected: true,
      lastSeen: new Date(now.getTime() - 3200).toISOString(),
    },
    {
      id: "cm-lab-03",
      name: "Node 03",
      asset: "Exaustor didático",
      state: "nominal",
      score: 0.31,
      connected: true,
      lastSeen: new Date(now.getTime() - 8100).toISOString(),
    },
    {
      id: "cm-lab-04",
      name: "Node 04",
      asset: "Bancada livre",
      state: "degraded",
      score: 0.49,
      connected: false,
      lastSeen: new Date(now.getTime() - 186000).toISOString(),
    },
  ];
}

function makeEvents(now: Date, scenario: DemoScenario): ConditionEvent[] {
  const activeEvent: ConditionEvent =
    scenario === "inspect"
      ? {
          id: "evt-1048",
          timestamp: new Date(now.getTime() - 74000).toISOString(),
          state: "inspect",
          title: "Mudança persistente no perfil",
          evidence: "Score > 0,68 por 6 janelas; RMS +43% sobre referência.",
          acknowledged: false,
        }
      : scenario === "degraded"
        ? {
            id: "evt-1048",
            timestamp: new Date(now.getTime() - 54000).toISOString(),
            state: "degraded",
            title: "Qualidade de aquisição reduzida",
            evidence: "12 amostras perdidas; decisão forte suspensa.",
            acknowledged: false,
          }
        : {
            id: "evt-1048",
            timestamp: new Date(now.getTime() - 54000).toISOString(),
            state: "nominal",
            title: "Janela nominal concluída",
            evidence: "Score abaixo do limiar e qualidade válida.",
            acknowledged: true,
          };

  return [
    activeEvent,
    {
      id: "evt-1047",
      timestamp: new Date(now.getTime() - 624000).toISOString(),
      state: "nominal",
      title: "Referência atualizada",
      evidence: "Perfil nominal registrado para a sessão demo-07.",
      acknowledged: true,
    },
    {
      id: "evt-1046",
      timestamp: new Date(now.getTime() - 1482000).toISOString(),
      state: "degraded",
      title: "Broker temporariamente indisponível",
      evidence: "Inferência local preservada; 3 mensagens descartadas.",
      acknowledged: true,
    },
  ];
}

export function generateMockTelemetry(
  scenario: DemoScenario = "inspect",
  now = new Date(),
): TelemetrySnapshot {
  const config = SCENARIO_CONFIG[scenario];
  const seed = Math.floor(now.getTime() / 2000) % 997;
  const series = makeSeries(now, scenario, seed, config.baseRms, config.score);
  const rmsOffset = wave(seed, 3, 0.018);

  return {
    schemaVersion: "condition-monitor/v1",
    dataMode: "synthetic",
    generatedAt: now.toISOString(),
    provenance: "Dataset sintético determinístico para demonstração; não representa medição física.",
    device: {
      id: "cm-lab-01",
      name: "Node 01",
      asset: "Ventilador de bancada",
      state: config.state,
      quality: scenario === "degraded" ? "partial" : "valid",
      connected: scenario !== "degraded",
      uptimeSeconds: 18432 + seed,
      sampleRateHz: 1600,
      droppedSamples: scenario === "degraded" ? 12 : 0,
    },
    decision: {
      score: round(clamp(config.score + wave(seed, 9, 0.025))),
      threshold: 0.68,
      confidence: config.confidence,
      recommendation: config.recommendation,
      explanation: config.explanation,
    },
    features: {
      rmsG: {
        x: round(config.baseRms + rmsOffset),
        y: round(config.baseRms * 0.72 + rmsOffset * 0.6),
        z: round(config.baseRms * 1.17 + rmsOffset * 0.35),
      },
      peakG: round(config.baseRms * 3.8 + rmsOffset),
      crestFactor: round(scenario === "inspect" ? 4.42 : 3.11, 2),
      kurtosis: round(scenario === "inspect" ? 4.86 : 3.04, 2),
      spectralEnergy: round(config.baseRms * 11.4 + rmsOffset, 2),
    },
    series,
    fleet: makeFleet(now, scenario),
    events: makeEvents(now, scenario),
    pipeline: [
      { id: "sensor", label: "Sensor", value: "1.6 kHz", status: scenario === "degraded" ? "warning" : "complete" },
      { id: "features", label: "Features", value: "12 ms", status: "complete" },
      { id: "baseline", label: "Baseline", value: "v1.2", status: "complete" },
      { id: "model", label: "TinyML", value: "8 ms", status: "active" },
      { id: "policy", label: "Política", value: config.state.toUpperCase(), status: config.state === "nominal" ? "complete" : "warning" },
    ],
    versions: {
      hardware: "P0-devkit",
      firmware: "0.3.0-demo",
      features: "features-v1.2",
      model: "isolation-v0.4-demo",
    },
  };
}

export function parseScenario(value: string | null): DemoScenario {
  if (value === "nominal" || value === "degraded") {
    return value;
  }
  return "inspect";
}
