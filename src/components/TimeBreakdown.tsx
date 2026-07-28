import type { SeminarPlan } from "../domain/types";
import { getSegmentTypeLabel } from "./SegmentEditor";

interface Props {
  plan: SeminarPlan;
}

export function TimeBreakdown({ plan }: Props) {
  const total = Math.max(
    1,
    plan.segments.reduce((sum, segment) => sum + segment.durationMin, 0)
  );
  const pillarRows = plan.pillars.map((pillar) => {
    const minutes = plan.segments
      .filter((segment) => segment.pillarId === pillar.id)
      .reduce((sum, segment) => sum + segment.durationMin, 0);
    return { ...pillar, minutes, ratio: (minutes / total) * 100 };
  });
  const typeRows = Array.from(new Set(plan.segments.map((segment) => segment.type))).map((type) => {
    const minutes = plan.segments
      .filter((segment) => segment.type === type)
      .reduce((sum, segment) => sum + segment.durationMin, 0);
    return { type, minutes, ratio: (minutes / total) * 100 };
  });

  return (
    <section className="panel breakdownPanel">
      <div className="panelHeader">
        <div>
          <p className="sectionKicker">BALANCE</p>
          <h2>時間配分</h2>
        </div>
        <span className="pill">内容 {total}分</span>
      </div>
      <div className="breakdownColumns">
        <div className="breakdownBlock">
          <h3>柱別</h3>
          <div className="distributionList">
            {pillarRows.map((row) => (
              <div className="distributionRow" key={row.id}>
                <div className="distributionLabel">
                  <i style={{ background: row.color }} />
                  <span>{row.title}</span>
                </div>
                <div className="miniTrack">
                  <span style={{ width: `${row.ratio}%`, background: row.color }} />
                </div>
                <strong>{row.minutes}分</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="breakdownBlock">
          <h3>区分別</h3>
          <div className="distributionList">
            {typeRows.map((row) => (
              <div className="distributionRow" key={row.type}>
                <div className="distributionLabel">
                  <span>{getSegmentTypeLabel(row.type)}</span>
                </div>
                <div className="miniTrack neutralTrack">
                  <span style={{ width: `${row.ratio}%` }} />
                </div>
                <strong>{row.minutes}分</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
