import type { CustomMetaField, SeminarPlan } from "../domain/types";

interface Props {
  plan: SeminarPlan;
  autoSaveFailed: boolean;
  onChange: (plan: SeminarPlan) => void;
  onMakeId: (prefix: string) => string;
  onClose?: () => void;
}

export function SeminarForm({
  plan,
  autoSaveFailed,
  onChange,
  onMakeId,
  onClose
}: Props) {
  const updatePlan = (patch: Partial<SeminarPlan>) => onChange({ ...plan, ...patch });
  const updateMetadata = (patch: Partial<SeminarPlan["metadata"]>) =>
    onChange({ ...plan, metadata: { ...plan.metadata, ...patch } });

  const updateCustomField = (id: string, patch: Partial<CustomMetaField>) => {
    updateMetadata({
      customFields: plan.metadata.customFields.map((field) =>
        field.id === id ? { ...field, ...patch } : field
      )
    });
  };

  const addCustomField = () => {
    updateMetadata({
      customFields: [
        ...plan.metadata.customFields,
        { id: onMakeId("meta"), label: "", value: "" }
      ]
    });
  };

  const deleteCustomField = (id: string) => {
    updateMetadata({
      customFields: plan.metadata.customFields.filter((field) => field.id !== id)
    });
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <p className="sectionKicker">BASIC INFO</p>
          <h2>セミナー情報</h2>
        </div>
        <div className="panelHeaderActions">
          <span className={`privacyPill ${autoSaveFailed ? "isError" : ""}`}>
            {autoSaveFailed ? "自動保存エラー" : "端末内に自動保存"}
          </span>
          {onClose && (
            <button type="button" className="compactButton" onClick={onClose}>
              編集を閉じる
            </button>
          )}
        </div>
      </div>

      <label className="titleField">
        セミナータイトル
        <input
          value={plan.title}
          placeholder="セミナータイトルを入力"
          onChange={(event) => updatePlan({ title: event.target.value })}
        />
      </label>

      <div className="fieldGrid">
        <label>
          講師名
          <input
            value={plan.instructor}
            placeholder="松本"
            onChange={(event) => updatePlan({ instructor: event.target.value })}
          />
        </label>
        <label>
          実施日
          <input
            type="date"
            value={plan.metadata.date}
            onChange={(event) => updateMetadata({ date: event.target.value })}
          />
        </label>
      </div>

      <div className="fieldGrid threeColumns">
        <label>
          開始時刻
          <input
            type="time"
            value={plan.metadata.startTime}
            onChange={(event) => updateMetadata({ startTime: event.target.value })}
          />
        </label>
        <label>
          全体時間（分）
          <input
            type="number"
            min={1}
            value={plan.metadata.totalDurationMin}
            onChange={(event) =>
              updateMetadata({ totalDurationMin: Math.max(1, Number(event.target.value) || 1) })
            }
          />
        </label>
        <label>
          実施場所
          <input
            value={plan.metadata.location}
            placeholder="会場名／オンライン"
            onChange={(event) => updateMetadata({ location: event.target.value })}
          />
        </label>
      </div>

      <div className="fieldGrid">
        <label>
          対象者
          <textarea
            rows={3}
            value={plan.metadata.audience}
            placeholder="誰に向けたセミナーか"
            onChange={(event) => updateMetadata({ audience: event.target.value })}
          />
        </label>
        <label>
          目的・到達点
          <textarea
            rows={3}
            value={plan.metadata.purpose}
            placeholder="参加者にどうなってほしいか"
            onChange={(event) => updateMetadata({ purpose: event.target.value })}
          />
        </label>
      </div>

      <fieldset className="breakSettings">
        <legend>休憩設定</legend>
        <label className="switchLabel">
          <input
            type="checkbox"
            checked={plan.metadata.hasBreak}
            onChange={(event) => updateMetadata({ hasBreak: event.target.checked })}
          />
          <span className="switchTrack" aria-hidden="true" />
          休憩を入れる
        </label>
        {plan.metadata.hasBreak && (
          <div className="fieldGrid threeColumns">
            <label>
              表示名
              <input
                value={plan.metadata.breakLabel}
                placeholder="休憩"
                onChange={(event) => updateMetadata({ breakLabel: event.target.value })}
              />
            </label>
            <label>
              休憩時間（分）
              <input
                type="number"
                min={1}
                value={plan.metadata.breakDurationMin}
                onChange={(event) =>
                  updateMetadata({ breakDurationMin: Math.max(1, Number(event.target.value) || 1) })
                }
              />
            </label>
            <label>
              入れる位置
              <select
                value={plan.metadata.breakAfterSegmentId ?? ""}
                onChange={(event) =>
                  updateMetadata({ breakAfterSegmentId: event.target.value || undefined })
                }
              >
                <option value="">最後のカードの後</option>
                {plan.segments.map((segment, index) => (
                  <option key={segment.id} value={segment.id}>
                    {index + 1}. {segment.title} の後
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </fieldset>

      <div className="customMetaHeader">
        <div>
          <h3>追加情報</h3>
          <p className="mutedText">形式、定員、担当部署など必要な項目を自由に追加できます。</p>
        </div>
        <button type="button" className="compactButton" onClick={addCustomField}>
          ＋ 項目を追加
        </button>
      </div>
      {plan.metadata.customFields.length > 0 && (
        <div className="customMetaList">
          {plan.metadata.customFields.map((field) => (
            <div className="customMetaRow" key={field.id}>
              <label>
                項目名
                <input
                  value={field.label}
                  placeholder="例：定員"
                  onChange={(event) => updateCustomField(field.id, { label: event.target.value })}
                />
              </label>
              <label>
                内容
                <input
                  value={field.value}
                  placeholder="例：30名"
                  onChange={(event) => updateCustomField(field.id, { value: event.target.value })}
                />
              </label>
              <button
                type="button"
                className="iconButton dangerButton"
                aria-label={`${field.label || "追加情報"}を削除`}
                onClick={() => deleteCustomField(field.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
