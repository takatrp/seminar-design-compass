import { TemplateSelector } from "./TemplateSelector";
import {
  audienceMaturityLabels,
  audienceRoleLabels,
  discussionFormatLabels,
  venueTypeLabels
} from "../domain/labels";
import type { AudienceRole, ContextPack, DiscussionFormat, SeminarPlan, VenueType } from "../domain/types";

interface Props {
  plan: SeminarPlan;
  pack: ContextPack;
  packs: ContextPack[];
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
  onTemplateApply: () => void;
  onPlanChange: (plan: SeminarPlan) => void;
  onContextPackChange: (packId: string) => void;
}

function linesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function SeminarForm({
  plan,
  pack,
  packs,
  selectedTemplateId,
  onTemplateSelect,
  onTemplateApply,
  onPlanChange,
  onContextPackChange
}: Props) {
  const updatePlan = (patch: Partial<SeminarPlan>) => onPlanChange({ ...plan, ...patch });
  const updateSeminar = (patch: Partial<SeminarPlan["seminar"]>) =>
    onPlanChange({ ...plan, seminar: { ...plan.seminar, ...patch } });
  const updateVenue = (patch: Partial<SeminarPlan["seminar"]["venue"]>) =>
    updateSeminar({ venue: { ...plan.seminar.venue, ...patch } });
  const updateAudience = (patch: Partial<SeminarPlan["seminar"]["audience"]>) =>
    updateSeminar({ audience: { ...plan.seminar.audience, ...patch } });
  const updateDiscussion = (patch: Partial<SeminarPlan["seminar"]["discussion"]>) =>
    updateSeminar({ discussion: { ...plan.seminar.discussion, ...patch } });

  const toggleAudienceRole = (role: AudienceRole) => {
    const exists = plan.seminar.audience.roles.includes(role);
    const roles = exists
      ? plan.seminar.audience.roles.filter((item) => item !== role)
      : [...plan.seminar.audience.roles, role];
    updateAudience({ roles });
  };

  return (
    <aside className="leftRail">
      <section className="panel">
        <div className="panelHeader">
          <h2>セミナー設計シート</h2>
        </div>
        <label>
          セミナータイトル
          <input value={plan.title} onChange={(event) => updatePlan({ title: event.target.value })} />
        </label>
        <div className="fieldGrid">
          <label>
            開催日時
            <input
              type="text"
              value={plan.seminar.dateTime}
              placeholder="2026年7月1日 13:30"
              onChange={(event) => updateSeminar({ dateTime: event.target.value })}
            />
          </label>
          <label>
            開始時刻
            <input
              type="time"
              value={plan.seminar.startTime}
              onChange={(event) => updateSeminar({ startTime: event.target.value })}
            />
          </label>
        </div>
        <div className="fieldGrid">
          <label>
            開催場所タイプ
            <select
              value={plan.seminar.venue.type}
              onChange={(event) => updateVenue({ type: event.target.value as VenueType })}
            >
              {Object.entries(venueTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            所要時間
            <input
              type="number"
              min={0}
              value={plan.seminar.durationMin}
              onChange={(event) => updateSeminar({ durationMin: Number(event.target.value) })}
            />
          </label>
        </div>
        <label>
          開催場所名
          <input value={plan.seminar.venue.name} onChange={(event) => updateVenue({ name: event.target.value })} />
        </label>
        <label>
          会場レイアウト
          <input
            value={plan.seminar.venue.roomLayout ?? ""}
            onChange={(event) => updateVenue({ roomLayout: event.target.value })}
          />
        </label>
        <div className="fieldGrid">
          <label>
            主催者
            <input value={plan.seminar.host} onChange={(event) => updateSeminar({ host: event.target.value })} />
          </label>
          <label>
            context pack
            <select value={plan.contextPackId} onChange={(event) => onContextPackChange(event.target.value)}>
              {packs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          共催者
          <textarea
            rows={2}
            value={plan.seminar.coHosts.join("\n")}
            onChange={(event) => updateSeminar({ coHosts: linesToArray(event.target.value) })}
          />
        </label>
        <fieldset>
          <legend>対象者ロール</legend>
          <div className="checkGrid">
            {Object.entries(audienceRoleLabels).map(([value, label]) => (
              <label className="checkLabel" key={value}>
                <input
                  type="checkbox"
                  checked={plan.seminar.audience.roles.includes(value as AudienceRole)}
                  onChange={() => toggleAudienceRole(value as AudienceRole)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          対象者成熟度
          <select
            value={plan.seminar.audience.maturity}
            onChange={(event) => updateAudience({ maturity: event.target.value as SeminarPlan["seminar"]["audience"]["maturity"] })}
          >
            {Object.entries(audienceMaturityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          参加者の課題
          <textarea
            rows={3}
            value={plan.seminar.audience.painPoints.join("\n")}
            onChange={(event) => updateAudience({ painPoints: linesToArray(event.target.value) })}
          />
        </label>
        <label>
          参加者の抵抗・誤解
          <textarea
            rows={3}
            value={plan.seminar.audience.objections.join("\n")}
            onChange={(event) => updateAudience({ objections: linesToArray(event.target.value) })}
          />
        </label>
        <label>
          メインメッセージ
          <textarea
            rows={3}
            value={plan.seminar.mainMessage}
            onChange={(event) => updateSeminar({ mainMessage: event.target.value })}
          />
        </label>
        <label>
          サブメッセージ
          <textarea
            rows={3}
            value={plan.seminar.subMessages.join("\n")}
            onChange={(event) => updateSeminar({ subMessages: linesToArray(event.target.value) })}
          />
        </label>
        <label>
          終了後に取ってほしい行動
          <textarea
            rows={3}
            value={plan.seminar.desiredAction}
            onChange={(event) => updateSeminar({ desiredAction: event.target.value })}
          />
        </label>
        <fieldset>
          <legend>ディスカッション設計</legend>
          <label className="checkLabel">
            <input
              type="checkbox"
              checked={plan.seminar.discussion.enabled}
              onChange={(event) => updateDiscussion({ enabled: event.target.checked })}
            />
            ディスカッションを有効にする
          </label>
          <label>
            形式
            <select
              value={plan.seminar.discussion.format}
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
            目的
            <input
              value={plan.seminar.discussion.purpose}
              onChange={(event) => updateDiscussion({ purpose: event.target.value })}
            />
          </label>
          <label>
            成果物
            <input
              value={plan.seminar.discussion.expectedOutput}
              onChange={(event) => updateDiscussion({ expectedOutput: event.target.value })}
            />
          </label>
        </fieldset>
        <label>
          備考
          <textarea rows={4} value={plan.seminar.notes} onChange={(event) => updateSeminar({ notes: event.target.value })} />
        </label>
      </section>
      <TemplateSelector
        pack={pack}
        selectedTemplateId={selectedTemplateId}
        onSelect={onTemplateSelect}
        onApply={onTemplateApply}
      />
    </aside>
  );
}
