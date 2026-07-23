"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SignalPoint } from "@/lib/telemetry/types";

interface TelemetryChartProps {
  points: SignalPoint[];
}

export function TelemetryChart({ points }: TelemetryChartProps) {
  const data = points.map((point) => ({
    ...point,
    label: `${point.elapsedSeconds}s`,
  }));

  return (
    <div className="chartWrap" aria-label="Tendência temporal de vibração e escore">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="rms-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity={0.34} />
              <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            minTickGap={34}
            tick={{ fill: "#687076", fontSize: 10 }}
          />
          <YAxis
            yAxisId="rms"
            domain={[0, "auto"]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#687076", fontSize: 10 }}
          />
          <YAxis yAxisId="score" hide domain={[0, 1]} />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,.16)", strokeDasharray: "4 4" }}
            contentStyle={{
              background: "#111518",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 10,
              color: "#f4f7f8",
              fontSize: 12,
            }}
            labelStyle={{ color: "#899298", marginBottom: 5 }}
            formatter={(value, name) => [
              typeof value === "number" ? value.toFixed(3) : value,
              name === "rmsG" ? "RMS (g)" : "Score",
            ]}
          />
          <ReferenceLine
            yAxisId="score"
            y={0.68}
            stroke="var(--state-inspect)"
            strokeDasharray="5 5"
            strokeOpacity={0.64}
          />
          <Area
            yAxisId="rms"
            type="monotone"
            dataKey="rmsG"
            stroke="var(--accent-cyan)"
            strokeWidth={2}
            fill="url(#rms-fill)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--accent-cyan)", stroke: "#071014" }}
            isAnimationActive={false}
          />
          <Line
            yAxisId="score"
            type="monotone"
            dataKey="score"
            stroke="var(--state-inspect)"
            strokeWidth={1.5}
            strokeOpacity={0.76}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
