import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GanttChart } from "./components/GanttChart";
import { OverviewSummary } from "./components/OverviewSummary";
import { PillarManager } from "./components/PillarManager";
import { ScriptView } from "./components/ScriptView";
import { SegmentEditor } from "./components/SegmentEditor";
import { SegmentList } from "./components/SegmentList";
import { SeminarForm } from "./components/SeminarForm";
import { TimeBreakdown } from "./components/TimeBreakdown";
import {
  createBlankPillar,
  createBlankSegment,
  createDefaultPlan,
  makeId,
  normalizeImportedPlan,
  nowIso
} from "./domain/defaults";
import { generateMarkdown, generateScriptText } from "./domain/exporters";
import {
  autoSchedule,
  duplicateSegment,
  moveSegment,
  removeSegment
} from "./domain/scheduling";
import { loadStoredState, saveStoredState } from "./domain/storage";
import type { Attachment, PlanView, SeminarPlan, Segment } from "./domain/types";
import { getPlanFileName, parsePlanJson, serializePlan } from "./domain/validation";

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function touch(plan: SeminarPlan): SeminarPlan {
  return { ...plan, updatedAt: nowIso() };
}

export function App() {
  const initialState = useMemo(() => loadStoredState(), []);
  const [plan, setPlan] = useState<SeminarPlan>(() =>
    initialState ? normalizeImportedPlan(initialState.plan) : createDefaultPlan()
  );
  const [editingSegmentId, setEditingSegmentId] = useState<string>();
  const [notice, setNotice] = useState("");
  const [autoSaveFailed, setAutoSaveFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedSegment = plan.segments.find(
    (segment) => segment.id === editingSegmentId
  );
  const scriptText = useMemo(() => generateScriptText(plan), [plan]);
  const closeSegmentEditor = useCallback(() => setEditingSegmentId(undefined), []);

  useEffect(() => {
    try {
      saveStoredState(plan);
      setAutoSaveFailed(false);
    } catch {
      setAutoSaveFailed((failed) => {
        if (!failed) {
          setNotice(
            "自動保存が端末の容量上限を超えました。JSON保存でデータを残してください。"
          );
        }
        return true;
      });
    }
  }, [plan]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 6500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const updatePlan = (next: SeminarPlan) => setPlan(touch(next));

  const updateSegment = (nextSegment: Segment) => {
    setPlan((currentPlan) =>
      touch({
        ...currentPlan,
        segments: autoSchedule(
          currentPlan.segments.map((segment) =>
            segment.id === nextSegment.id ? nextSegment : segment
          )
        )
      })
    );
  };

  const appendSegmentAttachments = (
    segmentId: string,
    attachments: Attachment[]
  ) => {
    setPlan((currentPlan) =>
      touch({
        ...currentPlan,
        segments: currentPlan.segments.map((segment) =>
          segment.id === segmentId
            ? {
                ...segment,
                attachments: [...segment.attachments, ...attachments]
              }
            : segment
        )
      })
    );
  };

  const handleAddSegment = () => {
    const segment = createBlankSegment(plan);
    const segments = autoSchedule([...plan.segments, segment]);
    updatePlan({
      ...plan,
      segments,
      selectedSegmentId: segment.id,
      view: "cards"
    });
    setEditingSegmentId(segment.id);
  };

  const handleMoveSegment = (segmentId: string, direction: "up" | "down") => {
    updatePlan({
      ...plan,
      segments: moveSegment(plan.segments, segmentId, direction),
      selectedSegmentId: segmentId
    });
  };

  const handleDuplicateSegment = (segmentId: string) => {
    const originalIndex = plan.segments.findIndex((segment) => segment.id === segmentId);
    const segments = duplicateSegment(plan.segments, segmentId, () => makeId("segment"));
    const duplicate = segments[originalIndex + 1];
    updatePlan({
      ...plan,
      segments,
      selectedSegmentId: duplicate?.id ?? segmentId
    });
    if (duplicate) setEditingSegmentId(duplicate.id);
  };

  const handleDeleteSegment = (segmentId: string) => {
    const segment = plan.segments.find((candidate) => candidate.id === segmentId);
    if (!window.confirm(`「${segment?.title || "このカード"}」を削除しますか？`)) return;
    const originalIndex = plan.segments.findIndex((candidate) => candidate.id === segmentId);
    const segments = removeSegment(plan.segments, segmentId);
    const selectedSegmentId =
      segments[originalIndex]?.id ?? segments[originalIndex - 1]?.id ?? segments[0]?.id;
    updatePlan({
      ...plan,
      metadata: {
        ...plan.metadata,
        breakAfterSegmentId:
          plan.metadata.breakAfterSegmentId === segmentId
            ? undefined
            : plan.metadata.breakAfterSegmentId
      },
      segments,
      selectedSegmentId
    });
    if (editingSegmentId === segmentId) setEditingSegmentId(undefined);
  };

  const handleDeletePillar = (pillarId: string) => {
    if (plan.pillars.length <= 1) return;
    const pillar = plan.pillars.find((candidate) => candidate.id === pillarId);
    const usedCount = plan.segments.filter((segment) => segment.pillarId === pillarId).length;
    const message =
      usedCount > 0
        ? `「${pillar?.title || "この柱"}」は${usedCount}枚のカードで使用中です。削除すると別の柱へ付け替えます。よろしいですか？`
        : `「${pillar?.title || "この柱"}」を削除しますか？`;
    if (!window.confirm(message)) return;
    const pillars = plan.pillars
      .filter((candidate) => candidate.id !== pillarId)
      .map((candidate, order) => ({ ...candidate, order }));
    const fallbackId = pillars[0]?.id ?? "";
    const segments = plan.segments.map((segment) =>
      segment.pillarId === pillarId ? { ...segment, pillarId: fallbackId } : segment
    );
    updatePlan({ ...plan, pillars, segments });
  };

  const handleJsonSave = () => {
    downloadText(getPlanFileName(), serializePlan(plan), "application/json;charset=utf-8");
    setNotice("セミナー設計をJSONで保存しました。");
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parsePlanJson(await file.text());
    if (!parsed.ok) {
      setNotice(parsed.message);
      return;
    }
    const imported = normalizeImportedPlan(parsed.plan);
    setPlan(imported);
    setEditingSegmentId(undefined);
    const warningText =
      parsed.warnings.length > 0
        ? `（補完情報 ${parsed.warnings.length}件）`
        : "";
    setNotice(
      parsed.migrated
        ? `旧形式のJSONを新形式へ移行して読み込みました。${warningText}`
        : `JSONを読み込みました。${warningText}`
    );
  };

  const handleCopy = async (text: string) => {
    await copyText(text);
    setNotice("クリップボードにコピーしました。");
  };

  const handleScriptSave = (format: "txt" | "md") => {
    const markdown = format === "md";
    downloadText(
      markdown ? "seminar-script.md" : "seminar-script.txt",
      scriptText,
      markdown ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8"
    );
    setNotice(`進行台本を${markdown ? "Markdown" : "TXT"}で保存しました。`);
  };

  const handleMarkdownSave = () => {
    downloadText(
      "seminar-design.md",
      generateMarkdown(plan),
      "text/markdown;charset=utf-8"
    );
    setNotice("セミナー設計をMarkdownで保存しました。");
  };

  const setView = (view: PlanView) => updatePlan({ ...plan, view });

  const handlePrint = () => {
    if (plan.view !== "script") {
      updatePlan({ ...plan, view: "script" });
      window.setTimeout(() => window.print(), 120);
      return;
    }
    window.print();
  };

  return (
    <div className="appShell">
      <header className="appHeader">
        <div className="headerInner">
          <div className="headerBrand">
            <p className="eyebrow">SEMINAR DESIGN COMPASS</p>
            <h1>{plan.title || "新しいセミナー"}</h1>
            <p className="headerSubline">
              {plan.instructor || "講師未設定"}が一人で実施するセミナーを、カードから台本まで一体設計
            </p>
            <p className={`saveStatus ${autoSaveFailed ? "isError" : ""}`}>
              <span aria-hidden="true">{autoSaveFailed ? "!" : "✓"}</span>
              {autoSaveFailed
                ? "自動保存できていません。JSON保存してください"
                : "この端末に自動保存中"}
            </p>
          </div>
          <nav className="headerActions" aria-label="主な操作">
            <button type="button" className="primaryHeaderButton" onClick={handleAddSegment}>
              ＋ カード追加
            </button>
            <button type="button" onClick={handleJsonSave}>
              JSON保存
            </button>
            <label className="fileAction">
              JSON読込
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  void handleImportFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            <button type="button" onClick={handleMarkdownSave}>
              Markdown保存
            </button>
            <button type="button" onClick={handlePrint}>
              印刷
            </button>
          </nav>
        </div>
      </header>

      <OverviewSummary plan={plan} />

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="お知らせを閉じる">
            ×
          </button>
        </div>
      )}

      <main className="mainContent">
        <div className="viewToolbar">
          <div className="tabList" role="tablist" aria-label="表示の切り替え">
            {[
              ["cards", "カード設計"],
              ["gantt", "ガント"],
              ["script", "進行台本"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={plan.view === value}
                className={plan.view === value ? "active" : ""}
                onClick={() => setView(value as PlanView)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="viewActions">
            {plan.view !== "cards" && (
              <button type="button" onClick={() => setView("cards")}>
                設計を編集
              </button>
            )}
            <button type="button" className="primaryButton" onClick={handleAddSegment}>
              ＋ カード追加
            </button>
          </div>
        </div>

        {(plan.view ?? "cards") === "cards" && (
          <>
            <SegmentList
              plan={plan}
              selectedSegmentId={plan.selectedSegmentId}
              onSelect={(selectedSegmentId) => updatePlan({ ...plan, selectedSegmentId })}
              onEdit={setEditingSegmentId}
              onChange={updateSegment}
              onMove={handleMoveSegment}
              onDuplicate={handleDuplicateSegment}
              onDelete={handleDeleteSegment}
            />
            <div className="settingsGrid">
              <SeminarForm
                plan={plan}
                autoSaveFailed={autoSaveFailed}
                onChange={updatePlan}
                onMakeId={makeId}
              />
              <div className="settingsSide">
                <PillarManager
                  pillars={plan.pillars}
                  onChange={(pillars) => updatePlan({ ...plan, pillars })}
                  onAdd={() =>
                    updatePlan({
                      ...plan,
                      pillars: [...plan.pillars, createBlankPillar(plan.pillars.length)]
                    })
                  }
                  onDelete={handleDeletePillar}
                />
                <TimeBreakdown plan={plan} />
              </div>
            </div>
          </>
        )}

        {plan.view === "gantt" && (
          <>
            <GanttChart plan={plan} onEdit={setEditingSegmentId} />
            <TimeBreakdown plan={plan} />
          </>
        )}

        {plan.view === "script" && (
          <ScriptView
            plan={plan}
            scriptText={scriptText}
            onCopy={(text) => {
              void handleCopy(text);
            }}
            onSave={handleScriptSave}
          />
        )}
      </main>

      {selectedSegment && (
        <SegmentEditor
          plan={plan}
          segment={selectedSegment}
          onChange={updateSegment}
          onAppendAttachments={(attachments) =>
            appendSegmentAttachments(selectedSegment.id, attachments)
          }
          onClose={closeSegmentEditor}
          onMakeId={makeId}
          onNotice={setNotice}
          autoSaveFailed={autoSaveFailed}
        />
      )}
    </div>
  );
}
