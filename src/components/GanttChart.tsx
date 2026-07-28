import type { CSSProperties } from "react";
import { buildTimeline } from "../domain/scheduling";
import type { SeminarPlan } from "../domain/types";

interface Props {
  plan: SeminarPlan;
  onEdit: (segmentId: string) => void;
}

function addMinutes(time: string, minutes: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return `${minutes}分`;
  const total = Number(match[1]) * 60 + Number(match[2]) + minutes;
  const normalized = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

export function GanttChart({ plan, onEdit }: Props) {
  const timeline = buildTimeline(plan);
  const scheduledDuration = timeline.reduce(
    (max, item) => Math.max(max, item.startMin + item.durationMin),
    0
  );
  const scaleDuration = Math.max(plan.metadata.totalDurationMin, scheduledDuration, 1);
  const markers = [0, 0.25, 0.5, 0.75, 1];
  const difference = scheduledDuration - plan.metadata.totalDurationMin;

  return (
    <section className="panel mainPanel ganttPanel">
      <div className="panelHeader">
        <div>
          <p className="sectionKicker">TIMELINE</p>
          <h2>ガントチャート</h2>
        </div>
        <span className={`differenceBadge ${difference === 0 ? "isExact" : ""}`}>
          {difference === 0
            ? "全体時間と一致"
            : difference > 0
              ? `${difference}分超過`
              : `${Math.abs(difference)}分余裕`}
        </span>
      </div>

      <div className="ganttScroll">
        <div className="ganttCanvas">
          <div className="ganttScale">
            <span className="scaleSpacer" />
            <div className="scaleTrack">
              {markers.map((marker) => (
                <span key={marker} style={{ left: `${marker * 100}%` }}>
                  <strong>{addMinutes(plan.metadata.startTime, Math.round(scaleDuration * marker))}</strong>
                  <small>{Math.round(scaleDuration * marker)}分</small>
                </span>
              ))}
            </div>
          </div>

          <div className="ganttRows">
            {timeline.map((item) => {
              const pillar =
                item.kind === "segment"
                  ? plan.pillars.find((candidate) => candidate.id === item.pillarId)
                  : undefined;
              const segmentNumber =
                item.kind === "segment"
                  ? plan.segments.findIndex((segment) => segment.id === item.id) + 1
                  : 0;
              const style = {
                "--bar-color": item.kind === "break" ? "#94a3b8" : pillar?.color ?? "#2563eb",
                left: `${(item.startMin / scaleDuration) * 100}%`,
                width: `${Math.max(1.5, (item.durationMin / scaleDuration) * 100)}%`
              } as CSSProperties;
              return (
                <div className={`ganttRow ${item.kind === "break" ? "breakRow" : ""}`} key={`${item.kind}-${item.id}`}>
                  <div className="ganttLabel">
                    <span>{item.kind === "break" ? "休" : segmentNumber}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>
                        {addMinutes(plan.metadata.startTime, item.startMin)}〜
                        {addMinutes(plan.metadata.startTime, item.startMin + item.durationMin)}
                      </small>
                    </div>
                  </div>
                  <div className="ganttTrack">
                    <div className="ganttGridLines" aria-hidden="true">
                      {markers.map((marker) => (
                        <i key={marker} style={{ left: `${marker * 100}%` }} />
                      ))}
                    </div>
                    <button
                      type="button"
                      className={`ganttBar ${item.kind === "break" ? "breakBar" : ""}`}
                      style={style}
                      disabled={item.kind === "break"}
                      onClick={() => {
                        if (item.kind === "segment") onEdit(item.id);
                      }}
                      title={`${item.title}（${item.durationMin}分）`}
                    >
                      <span>{item.durationMin}分</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="ganttLegend">
        {plan.pillars.map((pillar) => (
          <span key={pillar.id}>
            <i style={{ background: pillar.color }} />
            {pillar.title}
          </span>
        ))}
        {plan.metadata.hasBreak && (
          <span>
            <i className="breakLegend" />
            {plan.metadata.breakLabel || "休憩"}
          </span>
        )}
      </div>
    </section>
  );
}
