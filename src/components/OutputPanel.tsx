import { useMemo, useState } from "react";
import type { OutputDocument } from "../domain/exporters";

interface Props {
  outputs: OutputDocument[];
  onCopy: (text: string) => void;
  onSave: (filename: string, content: string) => void;
}

export function OutputPanel({ outputs, onCopy, onSave }: Props) {
  const [activeId, setActiveId] = useState(outputs[0]?.id ?? "");
  const active = useMemo(() => outputs.find((output) => output.id === activeId) ?? outputs[0], [activeId, outputs]);

  return (
    <section className="panel mainPanel">
      <div className="panelHeader">
        <h2>出力</h2>
        {active && (
          <div className="inlineActions">
            <button type="button" onClick={() => onCopy(active.content)}>
              コピー
            </button>
            <button type="button" onClick={() => onSave(active.fileName, active.content)}>
              Markdown保存
            </button>
          </div>
        )}
      </div>
      <div className="tabList compactTabs" role="tablist" aria-label="出力種別">
        {outputs.map((output) => (
          <button
            key={output.id}
            type="button"
            className={active?.id === output.id ? "active" : ""}
            onClick={() => setActiveId(output.id)}
          >
            {output.label}
          </button>
        ))}
      </div>
      <pre className="outputPre">{active?.content}</pre>
    </section>
  );
}
