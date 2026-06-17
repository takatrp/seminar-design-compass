import type { ContextPack, SeminarTemplate } from "../domain/types";

interface Props {
  pack: ContextPack;
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
  onApply: () => void;
}

export function TemplateSelector({ pack, selectedTemplateId, onSelect, onApply }: Props) {
  const selected = pack.templates.find((template) => template.id === selectedTemplateId) ?? pack.templates[0];
  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>テンプレート</h2>
        <button type="button" className="primaryButton" onClick={onApply}>
          テンプレート適用
        </button>
      </div>
      <label>
        テンプレート選択
        <select value={selectedTemplateId} onChange={(event) => onSelect(event.target.value)}>
          {pack.templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.label}
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <p className="mutedText">
          {selected.description} 目標時間：{selected.recommendedDurationMin}分
        </p>
      )}
    </section>
  );
}
