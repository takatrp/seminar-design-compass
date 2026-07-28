import { buildTimeline } from "../domain/scheduling";
import type { SeminarPlan } from "../domain/types";

interface Props {
  plan: SeminarPlan;
}

function addMinutes(time: string, minutes: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return "未設定";
  const total = Number(match[1]) * 60 + Number(match[2]) + minutes;
  const normalized = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

export function OverviewSummary({ plan }: Props) {
  const timeline = buildTimeline(plan);
  const contentDuration = plan.segments.reduce((sum, segment) => sum + segment.durationMin, 0);
  const breakDuration = plan.metadata.hasBreak ? plan.metadata.breakDurationMin : 0;
  const scheduledDuration = contentDuration + breakDuration;
  const difference = scheduledDuration - plan.metadata.totalDurationMin;
  const endTime = addMinutes(plan.metadata.startTime, scheduledDuration);

  return (
    <section className="overviewSummary" aria-label="時間配分の概要">
      <div className="summaryMetric">
        <span>全体枠</span>
        <strong>{plan.metadata.totalDurationMin}</strong>
        <small>分</small>
      </div>
      <div className="summaryMetric">
        <span>内容</span>
        <strong>{contentDuration}</strong>
        <small>分</small>
      </div>
      <div className="summaryMetric">
        <span>休憩</span>
        <strong>{breakDuration}</strong>
        <small>分</small>
      </div>
      <div className={`summaryMetric differenceMetric ${difference === 0 ? "isExact" : ""}`}>
        <span>枠との差</span>
        <strong>{difference > 0 ? `+${difference}` : difference}</strong>
        <small>分</small>
      </div>
      <div className="summaryMetric">
        <span>終了予定</span>
        <strong className="timeValue">{endTime}</strong>
        <small>{timeline.length}区間</small>
      </div>
      <div className={`summaryMessage ${difference === 0 ? "isExact" : difference > 0 ? "isOver" : ""}`}>
        <span className="summaryMessageIcon" aria-hidden="true">
          {difference === 0 ? "✓" : difference > 0 ? "!" : "＋"}
        </span>
        <div>
          <strong>
            {difference === 0
              ? "時間配分はぴったりです"
              : difference > 0
                ? `${difference}分の超過があります`
                : `${Math.abs(difference)}分の余裕があります`}
          </strong>
          <span>
            {difference === 0
              ? "カードを編集すると、ここに差分がすぐ反映されます。"
              : difference > 0
                ? "所要時間を短くするか、全体枠を見直してください。"
                : "質疑応答や予備時間として使うか、カードを追加できます。"}
          </span>
        </div>
      </div>
    </section>
  );
}
