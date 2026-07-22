import type { ConditionState } from "@/lib/telemetry/types";

interface ScoreDialProps {
  score: number;
  threshold: number;
  state: ConditionState;
}

const colors: Record<ConditionState, string> = {
  nominal: "var(--state-nominal)",
  inspect: "var(--state-inspect)",
  degraded: "var(--state-degraded)",
  fault: "var(--state-fault)",
};

export function ScoreDial({ score, threshold, state }: ScoreDialProps) {
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, score)));
  const thresholdAngle = threshold * 360 - 90;
  const markerX = 96 + Math.cos((thresholdAngle * Math.PI) / 180) * radius;
  const markerY = 96 + Math.sin((thresholdAngle * Math.PI) / 180) * radius;

  return (
    <div className="scoreDial" style={{ "--dial-color": colors[state] } as React.CSSProperties}>
      <svg viewBox="0 0 192 192" role="img" aria-label={`Escore ${score.toFixed(2)}, limiar ${threshold.toFixed(2)}`}>
        <defs>
          <filter id="score-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle className="scoreDialTrack" cx="96" cy="96" r={radius} />
        <circle
          className="scoreDialProgress"
          cx="96"
          cy="96"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter="url(#score-glow)"
        />
        <circle className="scoreDialMarker" cx={markerX} cy={markerY} r="4" />
      </svg>
      <div className="scoreDialValue">
        <span>{score.toFixed(2)}</span>
        <small>ANOMALY SCORE</small>
      </div>
      <span className="scoreDialThreshold">limiar {threshold.toFixed(2)}</span>
    </div>
  );
}
