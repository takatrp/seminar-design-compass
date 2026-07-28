import type { Pillar } from "../domain/types";

interface Props {
  pillars: Pillar[];
  onChange: (pillars: Pillar[]) => void;
  onAdd: () => void;
  onDelete: (pillarId: string) => void;
}

function moveItem(items: Pillar[], index: number, direction: -1 | 1): Pillar[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((pillar, order) => ({ ...pillar, order }));
}

export function PillarManager({ pillars, onChange, onAdd, onDelete }: Props) {
  const updatePillar = (pillarId: string, patch: Partial<Pillar>) => {
    onChange(
      pillars.map((pillar) =>
        pillar.id === pillarId ? { ...pillar, ...patch } : pillar
      )
    );
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <p className="sectionKicker">STRUCTURE</p>
          <h2>柱の設計</h2>
        </div>
        <button type="button" className="primaryButton compactButton" onClick={onAdd}>
          ＋ 柱を追加
        </button>
      </div>
      <p className="mutedText">
        セミナーを貫くテーマを自由に作れます。順番と色はカード・ガントにも反映されます。
      </p>
      <div className="pillarEditorList">
        {pillars.map((pillar, index) => (
          <article className="pillarEditor" key={pillar.id}>
            <input
              className="colorInput"
              type="color"
              value={pillar.color}
              aria-label={`${pillar.title || `${index + 1}番目の柱`}の色`}
              onChange={(event) => updatePillar(pillar.id, { color: event.target.value })}
            />
            <div className="pillarEditorFields">
              <label>
                柱 {index + 1}
                <input
                  value={pillar.title}
                  placeholder="例：課題の共有"
                  onChange={(event) => updatePillar(pillar.id, { title: event.target.value })}
                />
              </label>
              <label>
                説明
                <textarea
                  rows={2}
                  value={pillar.description}
                  placeholder="この柱で伝えたいこと"
                  onChange={(event) => updatePillar(pillar.id, { description: event.target.value })}
                />
              </label>
            </div>
            <div className="verticalActions" aria-label={`${pillar.title}の並べ替え`}>
              <button
                type="button"
                title="上へ"
                aria-label={`${pillar.title}を上へ`}
                onClick={() => onChange(moveItem(pillars, index, -1))}
                disabled={index === 0}
              >
                ↑
              </button>
              <button
                type="button"
                title="下へ"
                aria-label={`${pillar.title}を下へ`}
                onClick={() => onChange(moveItem(pillars, index, 1))}
                disabled={index === pillars.length - 1}
              >
                ↓
              </button>
              <button
                type="button"
                className="dangerButton"
                title="削除"
                aria-label={`${pillar.title}を削除`}
                onClick={() => onDelete(pillar.id)}
                disabled={pillars.length === 1}
              >
                ×
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
