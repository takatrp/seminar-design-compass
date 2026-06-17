import { segmentTypeLabels } from "../domain/labels";
import { formatMinuteRange } from "../domain/exporters";
import type { ContextPack, SeminarPlan, Segment } from "../domain/types";

interface Props {
  plan: SeminarPlan;
  pack: ContextPack;
  selectedSegmentId?: string;
  onSelect: (segmentId: string) => void;
  onChange: (segment: Segment) => void;
  onMove: (segmentId: string, direction: "up" | "down") => void;
  onDuplicate: (segmentId: string) => void;
  onDelete: (segmentId: string) => void;
}

export function SegmentList({ plan, pack, selectedSegmentId, onSelect, onChange, onMove, onDuplicate, onDelete }: Props) {
  return (
    <section className="panel mainPanel">
      <div className="panelHeader">
        <h2>区間カード</h2>
        <span className="pill">{plan.segments.length}区間</span>
      </div>
      <div className="segmentStack">
        {plan.segments.map((segment, index) => {
          const role = plan.roles.find((item) => item.id === segment.leadRoleId);
          const pillar = pack.pillars.find((item) => item.id === segment.pillarId);
          const selected = selectedSegmentId === segment.id;
          return (
            <article
              key={segment.id}
              className={`segmentCard ${selected ? "selected" : ""}`}
              data-color={pillar?.colorToken ?? "purpose"}
            >
              <button type="button" className="segmentSelect" onClick={() => onSelect(segment.id)}>
                <span className="segmentNo">{index + 1}</span>
                <span>
                  <strong>{segment.title}</strong>
                  <small>{formatMinuteRange(segment)}・{role?.shortLabel ?? role?.label ?? "未設定"}</small>
                </span>
              </button>
              <dl className="segmentFacts">
                <div>
                  <dt>柱</dt>
                  <dd>{pillar?.label ?? segment.pillarId}</dd>
                </div>
                <div>
                  <dt>区分</dt>
                  <dd>{segmentTypeLabels[segment.type]}</dd>
                </div>
                <div>
                  <dt>狙い</dt>
                  <dd>{segment.goal || "未設定"}</dd>
                </div>
                <div>
                  <dt>持ち帰り</dt>
                  <dd>{segment.takeaway || "未設定"}</dd>
                </div>
              </dl>
              <div className="cardActions">
                <label className="durationInput">
                  所要
                  <input
                    type="number"
                    min={0}
                    value={segment.durationMin}
                    onChange={(event) => onChange({ ...segment, durationMin: Number(event.target.value) })}
                  />
                </label>
                <button type="button" onClick={() => onMove(segment.id, "up")} disabled={index === 0}>
                  上へ
                </button>
                <button type="button" onClick={() => onMove(segment.id, "down")} disabled={index === plan.segments.length - 1}>
                  下へ
                </button>
                <button type="button" onClick={() => onDuplicate(segment.id)}>
                  複製
                </button>
                <button type="button" className="dangerButton" onClick={() => onDelete(segment.id)}>
                  削除
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
