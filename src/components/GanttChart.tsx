import { formatMinuteRange } from "../domain/exporters";
import type { ContextPack, SeminarPlan } from "../domain/types";

interface Props {
  plan: SeminarPlan;
  pack: ContextPack;
  onCopy: (text: string) => void;
}

export function createGanttSummary(plan: SeminarPlan): string {
  return plan.segments
    .map((segment, index) => `${index + 1}. ${formatMinuteRange(segment)} ${segment.title}`)
    .join("\n");
}

export function GanttChart({ plan, pack, onCopy }: Props) {
  const lastEnd = plan.segments.reduce((max, segment) => Math.max(max, segment.startMin + segment.durationMin), 0);
  const total = Math.max(plan.seminar.durationMin, lastEnd, 1);
  const markers = [0, 25, 50, 75, 100];
  return (
    <section className="panel mainPanel">
      <div className="panelHeader">
        <h2>ガントチャート</h2>
        <button type="button" onClick={() => onCopy(createGanttSummary(plan))}>
          ガント概要コピー
        </button>
      </div>
      <div className="ganttScale">
        {markers.map((marker) => (
          <span key={marker} style={{ left: `${marker}%` }}>
            {Math.round((total * marker) / 100)}分
          </span>
        ))}
      </div>
      <div className="gantt">
        {plan.segments.map((segment, index) => {
          const pillar = pack.pillars.find((item) => item.id === segment.pillarId);
          return (
            <div className="ganttRow" key={segment.id}>
              <span className="ganttLabel">{index + 1}</span>
              <div className="ganttTrack">
                <div
                  className="ganttBar"
                  data-color={pillar?.colorToken ?? "purpose"}
                  style={{
                    marginLeft: `${Math.max(0, (segment.startMin / total) * 100)}%`,
                    width: `${Math.max(2, (segment.durationMin / total) * 100)}%`
                  }}
                >
                  {segment.title} / {formatMinuteRange(segment)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mutedText">
        目標時間との差：{plan.segments.reduce((sum, segment) => sum + segment.durationMin, 0) - plan.seminar.durationMin}分
      </p>
    </section>
  );
}
