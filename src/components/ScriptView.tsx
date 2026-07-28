import { buildTimeline } from "../domain/scheduling";
import type { SeminarPlan } from "../domain/types";

interface Props {
  plan: SeminarPlan;
  scriptText: string;
  onCopy: (text: string) => void;
  onSave: (format: "txt" | "md") => void;
}

function addMinutes(time: string, minutes: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return `${minutes}分`;
  const total = Number(match[1]) * 60 + Number(match[2]) + minutes;
  const normalized = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

export function ScriptView({ plan, scriptText, onCopy, onSave }: Props) {
  const timeline = buildTimeline(plan);

  return (
    <section className="panel mainPanel scriptPanel">
      <div className="panelHeader">
        <div>
          <p className="sectionKicker">RUN OF SHOW</p>
          <h2>進行台本</h2>
        </div>
        <div className="inlineActions">
          <button type="button" onClick={() => onCopy(scriptText)}>
            台本をコピー
          </button>
          <button type="button" onClick={() => onSave("txt")}>
            TXT保存
          </button>
          <button type="button" onClick={() => onSave("md")}>
            Markdown保存
          </button>
          <button type="button" onClick={() => window.print()}>
            印刷
          </button>
        </div>
      </div>

      <div className="scriptHeaderCard">
        <div>
          <span>タイトル</span>
          <strong>{plan.title || "タイトル未設定"}</strong>
        </div>
        <div>
          <span>講師</span>
          <strong>{plan.instructor || "未設定"}</strong>
        </div>
        <div>
          <span>日時</span>
          <strong>
            {plan.metadata.date || "日付未設定"} {plan.metadata.startTime}
          </strong>
        </div>
        <div>
          <span>到達点</span>
          <strong>{plan.metadata.purpose || "未設定"}</strong>
        </div>
      </div>

      <div className="scriptFlow">
        {timeline.map((item) => {
          if (item.kind === "break") {
            return (
              <article className="scriptBreak" key={`break-${item.id}`}>
                <span>
                  {addMinutes(plan.metadata.startTime, item.startMin)}〜
                  {addMinutes(plan.metadata.startTime, item.startMin + item.durationMin)}
                </span>
                <strong>{item.title}</strong>
                <span>{item.durationMin}分</span>
              </article>
            );
          }

          const segment = plan.segments.find((candidate) => candidate.id === item.id);
          if (!segment) return null;
          const pillar = plan.pillars.find((candidate) => candidate.id === segment.pillarId);
          const urls = segment.attachments.filter((attachment) => attachment.type === "url");
          const images = segment.attachments.filter((attachment) => attachment.type === "image");
          const segmentNumber = plan.segments.findIndex((candidate) => candidate.id === segment.id) + 1;

          return (
            <article className="scriptCard" key={segment.id}>
              <div className="scriptTimeColumn">
                <span>{segmentNumber}</span>
                <strong>{addMinutes(plan.metadata.startTime, item.startMin)}</strong>
                <small>{segment.durationMin}分</small>
              </div>
              <div className="scriptCardBody">
                <div className="scriptCardTitle">
                  <div>
                    <span className="scriptPillar" style={{ color: pillar?.color }}>
                      {pillar?.title || "柱未設定"}
                    </span>
                    <h3>{segment.title}</h3>
                  </div>
                  <span className="scriptEndTime">
                    〜 {addMinutes(plan.metadata.startTime, item.startMin + item.durationMin)}
                  </span>
                </div>

                {segment.goal && (
                  <div className="scriptField">
                    <span>狙い</span>
                    <p>{segment.goal}</p>
                  </div>
                )}
                <div className="scriptField mainScript">
                  <span>話す内容</span>
                  <p>{segment.script || "台本・話すポイントを設定してください。"}</p>
                </div>
                {segment.question && (
                  <div className="scriptField promptScript">
                    <span>参加者への問い</span>
                    <p>{segment.question}</p>
                  </div>
                )}
                {segment.transition && (
                  <div className="scriptField">
                    <span>次へのつなぎ</span>
                    <p>{segment.transition}</p>
                  </div>
                )}
                {segment.takeaway && (
                  <div className="scriptField">
                    <span>持ち帰り</span>
                    <p>{segment.takeaway}</p>
                  </div>
                )}
                {segment.notes && (
                  <details className="scriptNotes">
                    <summary>講師用メモ</summary>
                    <p>{segment.notes}</p>
                  </details>
                )}

                {(urls.length > 0 || images.length > 0) && (
                  <div className="scriptAssets">
                    <span>見せるもの</span>
                    <div>
                      {images.map((attachment) =>
                        attachment.type === "image" ? (
                          <span className="assetChip" key={attachment.id}>
                            画像：{attachment.alt || attachment.fileName}
                          </span>
                        ) : null
                      )}
                      {urls.map((attachment) =>
                        attachment.type === "url" ? (
                          <a
                            className="assetChip"
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {attachment.label} ↗
                          </a>
                        ) : null
                      )}
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {timeline.length === 0 && (
        <div className="emptyState">
          <strong>台本に表示するカードがありません</strong>
          <span>カードを追加すると、ここに時間順で表示されます。</span>
        </div>
      )}
    </section>
  );
}
