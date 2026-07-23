"use client";

import {
  Activity,
  AlertTriangle,
  Check,
  ChevronRight,
  CircleDot,
  CloudOff,
  Cpu,
  Download,
  Gauge,
  HardDrive,
  Radio,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Waves,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { formatPercent, formatRelativeTime, formatTimestamp, formatUptime } from "@/lib/format";
import type {
  ConditionEvent,
  ConditionState,
  DemoScenario,
  TelemetryError,
  TelemetrySnapshot,
} from "@/lib/telemetry/types";

import { PipelineRail } from "./PipelineRail";
import { ScoreDial } from "./ScoreDial";
import { TelemetryChart } from "./TelemetryChart";

const stateMeta: Record<ConditionState, { label: string; detail: string }> = {
  nominal: { label: "Nominal", detail: "Dentro da referência" },
  inspect: { label: "Inspecionar", detail: "Mudança persistente" },
  degraded: { label: "Degradado", detail: "Qualidade reduzida" },
  fault: { label: "Falha", detail: "Aquisição inválida" },
};

const endpoint = process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT || "/api/telemetry";
const refreshInterval = Number(process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MS || "2000");

function StateBadge({ state }: { state: ConditionState }) {
  return (
    <span className="stateBadge" data-state={state}>
      <i />
      {stateMeta[state].label}
    </span>
  );
}

function MetricCard({
  label,
  value,
  unit,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit?: string;
  detail: string;
  icon: typeof Activity;
}) {
  return (
    <article className="metricCard">
      <div className="metricIcon"><Icon size={17} /></div>
      <span>{label}</span>
      <strong>{value}<small>{unit}</small></strong>
      <p>{detail}</p>
    </article>
  );
}

function EventRow({ event, acknowledged, onAcknowledge, referenceTime }: {
  event: ConditionEvent;
  acknowledged: boolean;
  onAcknowledge: () => void;
  referenceTime: number;
}) {
  return (
    <article className="eventRow">
      <div className="eventTimeline" data-state={event.state}><i /></div>
      <div className="eventContent">
        <div className="eventHeading">
          <strong>{event.title}</strong>
          <time>{formatRelativeTime(event.timestamp, referenceTime)}</time>
        </div>
        <p>{event.evidence}</p>
        {!acknowledged ? (
          <button className="textButton" onClick={onAcknowledge}>Reconhecer <ChevronRight size={13} /></button>
        ) : <span className="ackLabel"><Check size={12} /> reconhecido</span>}
      </div>
    </article>
  );
}

function LoadingView() {
  return (
    <main className="dashboardMain" aria-busy="true">
      <div className="loadingHeader skeleton" />
      <div className="loadingHero skeleton" />
      <div className="loadingGrid">
        <div className="loadingPanel skeleton" />
        <div className="loadingPanel skeleton" />
      </div>
      <span className="srOnly">Carregando telemetria</span>
    </main>
  );
}

export function ConditionDashboard({ initialSnapshot }: { initialSnapshot: TelemetrySnapshot }) {
  const [scenario, setScenario] = useState<DemoScenario>("inspect");
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot | null>(initialSnapshot);
  const [error, setError] = useState<TelemetryError | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  const loadTelemetry = useCallback(async (requestedScenario: DemoScenario = scenario) => {
    try {
      const response = await fetch(`${endpoint}?scenario=${requestedScenario}`, { cache: "no-store" });
      const payload: TelemetrySnapshot | TelemetryError = await response.json();
      if (!response.ok || "error" in payload) throw payload;
      setSnapshot(payload);
      setError(null);
    } catch (reason) {
      const fallback: TelemetryError = {
        error: "Não foi possível carregar a telemetria.",
        code: "UNKNOWN",
        generatedAt: new Date().toISOString(),
      };
      setError(typeof reason === "object" && reason && "error" in reason ? reason as TelemetryError : fallback);
    } finally {
      setRefreshing(false);
    }
  }, [scenario]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = window.setInterval(() => void loadTelemetry(scenario), refreshInterval);
    return () => window.clearInterval(interval);
  }, [autoRefresh, loadTelemetry, scenario]);

  const fleetSummary = useMemo(() => {
    if (!snapshot) return { online: 0, attention: 0 };
    return {
      online: snapshot.fleet.filter((device) => device.connected).length,
      attention: snapshot.fleet.filter((device) => device.state !== "nominal").length,
    };
  }, [snapshot]);

  function refreshTelemetry() {
    setRefreshing(true);
    void loadTelemetry(scenario);
  }

  function changeScenario(nextScenario: DemoScenario) {
    setScenario(nextScenario);
    setRefreshing(true);
    void loadTelemetry(nextScenario);
  }

  function exportSnapshot() {
    if (!snapshot) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `condition-monitor-${snapshot.device.id}-${snapshot.generatedAt}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!snapshot && !error) return <LoadingView />;

  if (!snapshot && error) {
    return (
      <main className="errorPage">
        <CloudOff size={30} />
        <span>TELEMETRIA INDISPONÍVEL</span>
        <h1>A conexão não respondeu.</h1>
        <p>{error.error}</p>
        <button className="primaryButton" onClick={refreshTelemetry}><RotateCcw size={15} /> Tentar novamente</button>
      </main>
    );
  }

  if (!snapshot) return null;

  const meta = stateMeta[snapshot.device.state];
  const referenceTime = new Date(snapshot.generatedAt).getTime();
  const activeEvents = snapshot.events.filter((event) => !event.acknowledged && !acknowledged.has(event.id)).length;

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brandMark"><Waves size={20} /><span>EDGE<span>CM</span></span></div>
        <nav aria-label="Navegação principal">
          <a className="navItem active" href="#overview"><Gauge size={17} /><span>Operação</span></a>
          <a className="navItem" href="#signals"><Activity size={17} /><span>Sinais</span></a>
          <a className="navItem" href="#fleet"><Radio size={17} /><span>Dispositivos</span><em>{snapshot.fleet.length}</em></a>
          <a className="navItem" href="#events"><AlertTriangle size={17} /><span>Eventos</span>{activeEvents ? <em className="warningCount">{activeEvents}</em> : null}</a>
        </nav>
        <div className="sidebarFoot">
          <span>EDGE INFERENCE</span>
          <div><ShieldCheck size={14} /> Dados locais por padrão</div>
          <small>Interface experimental<br />Não fornece diagnóstico</small>
        </div>
      </aside>

      <main className="dashboardMain" id="overview">
        <header className="topbar">
          <div>
            <div className="eyebrow"><CircleDot size={12} /> CONDITION ROOM / LAB 01</div>
            <h1>Operação em tempo real</h1>
          </div>
          <div className="topbarActions">
            <label className="scenarioControl">
              <span>Cenário</span>
              <select value={scenario} onChange={(event) => changeScenario(event.target.value as DemoScenario)}>
                <option value="nominal">Nominal</option>
                <option value="inspect">Inspecionar</option>
                <option value="degraded">Degradado</option>
              </select>
            </label>
            <button className="iconButton" onClick={refreshTelemetry} aria-label="Atualizar telemetria">
              <RefreshCw size={16} className={refreshing ? "spin" : ""} />
            </button>
            <button className="secondaryButton" onClick={exportSnapshot}><Download size={15} /> Exportar</button>
          </div>
        </header>

        <div className="provenanceBar" data-mode={snapshot.dataMode}>
          <Sparkles size={14} />
          <strong>{snapshot.dataMode === "synthetic" ? "SIMULAÇÃO ATIVA" : "FONTE AO VIVO"}</strong>
          <span>{snapshot.provenance}</span>
          <label><input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} /> atualização automática</label>
        </div>

        {error ? <div className="inlineError"><WifiOff size={14} /> Última leitura preservada. {error.error}</div> : null}

        <section className="decisionHero" data-state={snapshot.device.state}>
          <div className="heroIdentity">
            <div className="devicePulse"><i /><Waves size={24} /></div>
            <div>
              <span>{snapshot.device.name} · {snapshot.device.asset}</span>
              <h2>{meta.label}</h2>
              <p>{meta.detail}</p>
            </div>
          </div>
          <ScoreDial score={snapshot.decision.score} threshold={snapshot.decision.threshold} state={snapshot.device.state} />
          <div className="recommendation">
            <span>RECOMENDAÇÃO</span>
            <h3>{snapshot.decision.recommendation}</h3>
            <p>{snapshot.decision.explanation}</p>
            <div className="confidenceRow"><span>Confiança da evidência</span><strong>{formatPercent(snapshot.decision.confidence)}</strong></div>
            <div className="confidenceTrack"><i style={{ width: formatPercent(snapshot.decision.confidence) }} /></div>
          </div>
        </section>

        <PipelineRail stages={snapshot.pipeline} />

        <section className="metricGrid">
          <MetricCard icon={Activity} label="RMS composto" value={((snapshot.features.rmsG.x + snapshot.features.rmsG.y + snapshot.features.rmsG.z) / 3).toFixed(3)} unit="g" detail="Janela atual · 3 eixos" />
          <MetricCard icon={Waves} label="Pico" value={snapshot.features.peakG.toFixed(2)} unit="g" detail="Maior magnitude observada" />
          <MetricCard icon={Sparkles} label="Kurtosis" value={snapshot.features.kurtosis.toFixed(2)} detail="Impulsividade da janela" />
          <MetricCard icon={Cpu} label="Energia espectral" value={snapshot.features.spectralEnergy.toFixed(2)} detail="Feature versionada v1.2" />
        </section>

        <div className="contentGrid">
          <section className="panel signalPanel" id="signals">
            <div className="panelHeader"><div><span>SINAL + DECISÃO</span><h2>Tendência dos últimos 96 segundos</h2></div><div className="legend"><i className="cyan" /> RMS <i className="amber" /> score</div></div>
            <TelemetryChart points={snapshot.series} />
            <div className="axisReadout">
              <span>X <strong>{snapshot.features.rmsG.x.toFixed(3)} g</strong></span>
              <span>Y <strong>{snapshot.features.rmsG.y.toFixed(3)} g</strong></span>
              <span>Z <strong>{snapshot.features.rmsG.z.toFixed(3)} g</strong></span>
              <span>CREST <strong>{snapshot.features.crestFactor.toFixed(2)}</strong></span>
            </div>
          </section>

          <section className="panel fleetPanel" id="fleet">
            <div className="panelHeader"><div><span>FROTA LOCAL</span><h2>{fleetSummary.online}/{snapshot.fleet.length} conectados</h2></div><strong className="attentionLabel">{fleetSummary.attention} atenção</strong></div>
            <div className="deviceList">
              {snapshot.fleet.map((device) => (
                <article className="deviceRow" key={device.id}>
                  <div className="deviceOnline" data-online={device.connected} />
                  <div><strong>{device.name}</strong><span>{device.asset}</span></div>
                  <StateBadge state={device.state} />
                  <div className="miniScore"><span style={{ width: formatPercent(device.score) }} /><small>{device.score.toFixed(2)}</small></div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel eventsPanel" id="events">
            <div className="panelHeader"><div><span>TRILHA DE EVIDÊNCIA</span><h2>Eventos recentes</h2></div><span className="panelTime">{formatTimestamp(snapshot.generatedAt)}</span></div>
            <div className="eventList">
              {snapshot.events.map((event) => <EventRow key={event.id} event={event} acknowledged={event.acknowledged || acknowledged.has(event.id)} referenceTime={referenceTime} onAcknowledge={() => setAcknowledged((current) => new Set(current).add(event.id))} />)}
            </div>
          </section>

          <section className="panel healthPanel">
            <div className="panelHeader"><div><span>SAÚDE DO NÓ</span><h2>Diagnóstico operacional</h2></div>{snapshot.device.connected ? <Wifi size={16} /> : <WifiOff size={16} />}</div>
            <dl className="healthGrid">
              <div><dt>Qualidade</dt><dd>{snapshot.device.quality}</dd></div>
              <div><dt>Amostragem</dt><dd>{snapshot.device.sampleRateHz} Hz</dd></div>
              <div><dt>Perdas</dt><dd>{snapshot.device.droppedSamples}</dd></div>
              <div><dt>Uptime</dt><dd>{formatUptime(snapshot.device.uptimeSeconds)}</dd></div>
            </dl>
            <div className="versionStack">
              <div><HardDrive size={14} /><span>Hardware</span><strong>{snapshot.versions.hardware}</strong></div>
              <div><Cpu size={14} /><span>Firmware</span><strong>{snapshot.versions.firmware}</strong></div>
              <div><Activity size={14} /><span>Features</span><strong>{snapshot.versions.features}</strong></div>
              <div><Sparkles size={14} /><span>Modelo</span><strong>{snapshot.versions.model}</strong></div>
            </div>
          </section>
        </div>

        <footer><span>Schema {snapshot.schemaVersion}</span><span>Gerado {formatRelativeTime(snapshot.generatedAt, referenceTime)}</span><span>ID público {snapshot.device.id}</span></footer>
      </main>
    </div>
  );
}
