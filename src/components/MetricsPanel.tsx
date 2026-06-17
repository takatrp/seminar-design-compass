import type { PlanMetrics } from "../domain/types";

interface Props {
  metrics: PlanMetrics;
}

function Distribution({ title, items }: { title: string; items: { label: string; minutes: number; ratio: number; colorToken?: string }[] }) {
  return (
    <section className="metricBlock">
      <h3>{title}</h3>
      <div className="distributionList">
        {items.filter((item) => item.minutes > 0).map((item) => (
          <div className="distributionRow" key={item.label}>
            <span>{item.label}</span>
            <div className="miniTrack">
              <span
                data-color={item.colorToken ?? "purpose"}
                style={{ width: `${Math.max(4, item.ratio * 100)}%` }}
              />
            </div>
            <strong>{item.minutes}分</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MetricsPanel({ metrics }: Props) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>時間配分</h2>
      </div>
      <div className="metricNumbers">
        <div>
          <span>合計時間</span>
          <strong>{metrics.totalDuration}分</strong>
        </div>
        <div>
          <span>目標との差</span>
          <strong>{metrics.durationDiff}分</strong>
        </div>
        <div>
          <span>対話・事例・ワーク</span>
          <strong>{metrics.interactiveDuration}分</strong>
        </div>
        <div>
          <span>講義</span>
          <strong>{metrics.lectureDuration}分</strong>
        </div>
      </div>
      <Distribution title="役割バランス" items={metrics.roleMinutes} />
      <Distribution title="柱別配分" items={metrics.pillarMinutes} />
      <Distribution title="区分別配分" items={metrics.typeMinutes} />
    </section>
  );
}
