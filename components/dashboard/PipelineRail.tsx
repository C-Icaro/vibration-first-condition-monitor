import { Check, Cpu, Radio, SlidersHorizontal, Sparkles } from "lucide-react";

import type { PipelineStage } from "@/lib/telemetry/types";

interface PipelineRailProps {
  stages: PipelineStage[];
}

const icons = [Radio, SlidersHorizontal, Cpu, Sparkles, Check];

export function PipelineRail({ stages }: PipelineRailProps) {
  return (
    <div className="pipelineRail">
      {stages.map((stage, index) => {
        const Icon = icons[index] ?? Check;
        return (
          <div className="pipelineStep" key={stage.id} data-status={stage.status}>
            <div className="pipelineIcon">
              <Icon size={15} strokeWidth={1.8} />
            </div>
            <div>
              <span>{stage.label}</span>
              <strong>{stage.value}</strong>
            </div>
            {index < stages.length - 1 ? <i aria-hidden="true" /> : null}
          </div>
        );
      })}
    </div>
  );
}
