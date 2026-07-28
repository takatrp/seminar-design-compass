import type { CSSProperties } from "react";
import { buildTimeline } from "../domain/scheduling";
import type { SeminarPlan, Segment } from "../domain/types";
import { getSegmentTypeLabel } from "./SegmentEditor";

interface Props {
  plan: SeminarPlan;
  selectedSegmentId?: string;
  onSelect: (segmentId: string) => void;
  onEdit: (segmentId: string) => void;
  onChange: (segment: Segment) => void;
  onMove: (segmentId: string, direction: "up" | "down") => void;
  onDuplicate: (segmentId: string) => void;
  onDelete: (segmentId: string) => void;
}

function addMinutes(time: string, minutes: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return `${minutes}分`;
  const total = Number(match[1]) * 60 + Number(match[2]) + minutes;
  const normalized = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function clipText(value: string, fallback: string): string {
  return value.trim() || fallback;
}

export function SegmentList({
  plan,
  selectedSegmentId,
  onSelect,
  onEdit,
  onChange,
  onMove,
  onDuplicate,
  onDelete
}: Props) {
  const timeline = buildTimeline(plan);

  if (plan.segments.length === 0) {
    return (
      <section className="panel mainPanel">
        <div className="emptyState">
          <span className="emptyIcon">＋</span>
          <strong>最初のカードを追加しましょう</strong>
          <span>導入、講義、ワーク、まとめなどを時間順に並べて設計します。</span>
        </div>
      </section>
    );
  }

  return (
    <section className="panel mainPanel segmentBoardPanel">
      <div className="panelHeader">
        <div>
          <p className="sectionKicker">SEMINAR FLOW</p>
          <h2>カードで全体を組み立てる</h2>
        </div>
        <span className="pill">{plan.segments.length}カード</span>
      </div>
      <div className="segmentStack" aria-label="セミナーのカード一覧">
        {plan.segments.map((segment, index) => {
          const pillar = plan.pillars.find((item) => item.id === segment.pillarId);
          const selected = selectedSegmentId === segment.id;
          const timelineItem = timeline.find((item) => item.kind === "segment" && item.id === segment.id);
          const startMin = timelineItem?.startMin ?? segment.startMin;
          const imageAttachments = segment.attachments.filter((attachment) => attachment.type === "image");
          const urlCount = segment.attachments.filter((attachment) => attachment.type === "url").length;
          const cardStyle = {
            "--pillar-color": pillar?.color ?? "#2563eb"
          } as CSSProperties;

          return (
            <article
              key={segment.id}
              className={`segmentCard ${selected ? "selected" : ""}`}
              style={cardStyle}
              onClick={() => onSelect(segment.id)}
            >
              <div className="segmentCardTop">
                <span className="segmentNo">{index + 1}</span>
                <div className="segmentCardHeading">
                  <span className="timeRange">
                    {addMinutes(plan.metadata.startTime, startMin)}
                    <span aria-hidden="true"> — </span>
                    {addMinutes(plan.metadata.startTime, startMin + segment.durationMin)}
                  </span>
                  <h3>{segment.title || "タイトル未設定"}</h3>
                </div>
                <button
                  type="button"
                  className="editCardButton"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(segment.id);
                  }}
                >
                  編集
                </button>
              </div>

              <div className="tagRow">
                <span className="pillarTag">
                  <span className="tagDot" aria-hidden="true" />
                  {pillar?.title || "柱未設定"}
                </span>
                <span className="softTag">{getSegmentTypeLabel(segment.type)}</span>
                <span className="softTag">{segment.durationMin}分</span>
              </div>

              <div className="cardTextBlock">
                <span>狙い</span>
                <p>{clipText(segment.goal, "このカードの狙いを設定してください。")}</p>
              </div>
              <div className="cardTextBlock">
                <span>話すポイント</span>
                <p>{clipText(segment.script, "台本・話すポイントを設定してください。")}</p>
              </div>
              {segment.question.trim() && (
                <div className="questionCallout">
                  <span>問い</span>
                  <p>{segment.question}</p>
                </div>
              )}

              {imageAttachments.length > 0 && (
                <div className="cardImageStrip">
                  {imageAttachments.slice(0, 3).map((attachment) =>
                    attachment.type === "image" ? (
                      <button
                        type="button"
                        className="cardThumbnail"
                        key={attachment.id}
                        title={attachment.alt || attachment.fileName}
                        onClick={(event) => {
                          event.stopPropagation();
                          window.open(attachment.dataUrl, "_blank", "noopener,noreferrer");
                        }}
                      >
                        <img src={attachment.dataUrl} alt={attachment.alt || attachment.fileName} />
                      </button>
                    ) : null
                  )}
                  {imageAttachments.length > 3 && (
                    <span className="moreAttachments">＋{imageAttachments.length - 3}</span>
                  )}
                </div>
              )}

              <div className="segmentCardFooter">
                <div className="attachmentCounts">
                  {imageAttachments.length > 0 && <span>画像 {imageAttachments.length}</span>}
                  {urlCount > 0 && <span>URL {urlCount}</span>}
                  {segment.attachments.length === 0 && <span>添付なし</span>}
                </div>
                <label className="durationInput" onClick={(event) => event.stopPropagation()}>
                  <span>所要</span>
                  <input
                    type="number"
                    min={1}
                    value={segment.durationMin}
                    aria-label={`${segment.title}の所要時間`}
                    onChange={(event) =>
                      onChange({
                        ...segment,
                        durationMin: Math.max(1, Number(event.target.value) || 1)
                      })
                    }
                  />
                  <span>分</span>
                </label>
              </div>

              <div className="cardActions" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onMove(segment.id, "up")}
                  disabled={index === 0}
                >
                  ← 前へ
                </button>
                <button
                  type="button"
                  onClick={() => onMove(segment.id, "down")}
                  disabled={index === plan.segments.length - 1}
                >
                  次へ →
                </button>
                <button type="button" onClick={() => onDuplicate(segment.id)}>
                  複製
                </button>
                <button
                  type="button"
                  className="dangerButton"
                  onClick={() => onDelete(segment.id)}
                >
                  削除
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="scrollHint">横にスクロールして全体を見渡せます</p>
    </section>
  );
}
