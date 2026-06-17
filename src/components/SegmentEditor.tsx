import { audienceMaturityLabels, discussionFormatLabels, segmentTypeLabels } from "../domain/labels";
import type { AudienceMaturity, ContextPack, DiscussionFormat, Segment, SegmentType, SeminarPlan } from "../domain/types";

interface Props {
  plan: SeminarPlan;
  pack: ContextPack;
  segment?: Segment;
  onChange: (segment: Segment) => void;
}

export function SegmentEditor({ plan, pack, segment, onChange }: Props) {
  if (!segment) {
    return (
      <section className="panel">
        <div className="panelHeader">
          <h2>選択中区間の編集</h2>
        </div>
        <p className="mutedText">編集する区間を選択してください。</p>
      </section>
    );
  }

  const updateDiscussion = (patch: Partial<NonNullable<Segment["discussion"]>>) =>
    onChange({
      ...segment,
      discussion: {
        enabled: segment.discussion?.enabled ?? true,
        format: segment.discussion?.format ?? "group",
        question: segment.discussion?.question ?? "",
        output: segment.discussion?.output ?? "",
        ...patch
      }
    });

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>選択中区間の編集</h2>
        <span className="pill">{segment.startMin}分開始</span>
      </div>
      <label>
        タイトル
        <input value={segment.title} onChange={(event) => onChange({ ...segment, title: event.target.value })} />
      </label>
      <div className="fieldGrid">
        <label>
          開始分
          <input
            type="number"
            min={0}
            value={segment.startMin}
            onChange={(event) => onChange({ ...segment, startMin: Number(event.target.value) })}
          />
        </label>
        <label>
          所要分
          <input
            type="number"
            min={0}
            value={segment.durationMin}
            onChange={(event) => onChange({ ...segment, durationMin: Number(event.target.value) })}
          />
        </label>
      </div>
      <div className="fieldGrid">
        <label>
          主担当
          <select value={segment.leadRoleId} onChange={(event) => onChange({ ...segment, leadRoleId: event.target.value })}>
            {plan.roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          柱
          <select value={segment.pillarId} onChange={(event) => onChange({ ...segment, pillarId: event.target.value })}>
            {pack.pillars.map((pillar) => (
              <option key={pillar.id} value={pillar.id}>
                {pillar.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="fieldGrid">
        <label>
          区分
          <select value={segment.type} onChange={(event) => onChange({ ...segment, type: event.target.value as SegmentType })}>
            {Object.entries(segmentTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          対象成熟度
          <select
            value={segment.audienceMaturity}
            onChange={(event) => onChange({ ...segment, audienceMaturity: event.target.value as AudienceMaturity })}
          >
            {Object.entries(audienceMaturityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        狙い
        <textarea rows={3} value={segment.goal} onChange={(event) => onChange({ ...segment, goal: event.target.value })} />
      </label>
      <label>
        キークエスチョン
        <textarea
          rows={3}
          value={segment.keyQuestion}
          onChange={(event) => onChange({ ...segment, keyQuestion: event.target.value })}
        />
      </label>
      <fieldset>
        <legend>講師別メモ</legend>
        {plan.roles.map((role) => (
          <label key={role.id}>
            {role.label}
            <textarea
              rows={2}
              value={segment.speakerNotes?.[role.id] ?? ""}
              onChange={(event) =>
                onChange({
                  ...segment,
                  speakerNotes: { ...segment.speakerNotes, [role.id]: event.target.value }
                })
              }
            />
          </label>
        ))}
      </fieldset>
      <label>
        参加者アクション
        <textarea
          rows={2}
          value={segment.participantAction}
          onChange={(event) => onChange({ ...segment, participantAction: event.target.value })}
        />
      </label>
      <label>
        持ち帰り
        <textarea rows={2} value={segment.takeaway} onChange={(event) => onChange({ ...segment, takeaway: event.target.value })} />
      </label>
      <label>
        素材ID
        <input
          value={segment.assetIds.join(", ")}
          onChange={(event) =>
            onChange({
              ...segment,
              assetIds: event.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            })
          }
        />
      </label>
      <fieldset>
        <legend>ディスカッション設定</legend>
        <label className="checkLabel">
          <input
            type="checkbox"
            checked={segment.discussion?.enabled ?? false}
            onChange={(event) => updateDiscussion({ enabled: event.target.checked })}
          />
          この区間で扱う
        </label>
        <label>
          形式
          <select
            value={segment.discussion?.format ?? "none"}
            onChange={(event) => updateDiscussion({ format: event.target.value as DiscussionFormat })}
          >
            {Object.entries(discussionFormatLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          設問
          <textarea
            rows={2}
            value={segment.discussion?.question ?? ""}
            onChange={(event) => updateDiscussion({ question: event.target.value })}
          />
        </label>
        <label>
          成果物
          <input value={segment.discussion?.output ?? ""} onChange={(event) => updateDiscussion({ output: event.target.value })} />
        </label>
      </fieldset>
    </section>
  );
}
