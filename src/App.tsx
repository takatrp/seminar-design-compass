import { useEffect, useMemo, useRef, useState } from "react";
import { DesignChecks } from "./components/DesignChecks";
import { GanttChart } from "./components/GanttChart";
import { MetricsPanel } from "./components/MetricsPanel";
import { OutputPanel } from "./components/OutputPanel";
import { SegmentEditor } from "./components/SegmentEditor";
import { SegmentList } from "./components/SegmentList";
import { SeminarForm } from "./components/SeminarForm";
import { contextPacks, getContextPack } from "./contextPacks";
import {
  applyTemplateToPlan,
  changeContextPack,
  createBlankSegment,
  createDefaultPlan,
  makeId,
  normalizeImportedPlan,
  nowIso
} from "./domain/defaults";
import { generateAllOutputs, generateScriptText } from "./domain/exporters";
import { calculateMetrics, evaluatePlan } from "./domain/scoring";
import { autoSchedule, duplicateSegment, moveSegment, removeSegment } from "./domain/scheduling";
import { loadStoredState, saveStoredState } from "./domain/storage";
import type { SeminarPlan, Segment } from "./domain/types";
import { getPlanFileName, parsePlanJson, serializePlan } from "./domain/validation";

function touch(plan: SeminarPlan): SeminarPlan {
  return { ...plan, updatedAt: nowIso() };
}

function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
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

export function App() {
  const initialState = useMemo(() => loadStoredState(), []);
  const [plan, setPlan] = useState<SeminarPlan>(() => {
    if (!initialState) return createDefaultPlan();
    const pack = getContextPack(initialState.plan.contextPackId);
    return normalizeImportedPlan(initialState.plan, pack);
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => getContextPack(plan.contextPackId).templates[0]?.id ?? "");
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pack = useMemo(() => getContextPack(plan.contextPackId), [plan.contextPackId]);
  const score = useMemo(() => evaluatePlan(plan, pack), [pack, plan]);
  const metrics = useMemo(() => calculateMetrics(plan, pack), [pack, plan]);
  const outputs = useMemo(() => generateAllOutputs(plan, pack, score), [pack, plan, score]);
  const selectedSegment = plan.segments.find((segment) => segment.id === plan.selectedSegmentId);

  useEffect(() => {
    saveStoredState(plan);
  }, [plan]);

  useEffect(() => {
    if (!pack.templates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId(pack.templates[0]?.id ?? "");
    }
  }, [pack, selectedTemplateId]);

  const updatePlan = (next: SeminarPlan) => setPlan(touch(next));

  const setView = (view: SeminarPlan["view"]) => updatePlan({ ...plan, view });

  const updateSegment = (nextSegment: Segment, reschedule = true) => {
    const segments = plan.segments.map((segment) => (segment.id === nextSegment.id ? nextSegment : segment));
    updatePlan({ ...plan, segments: reschedule ? autoSchedule(segments) : segments });
  };

  const handleContextPackChange = (packId: string) => {
    const nextPack = getContextPack(packId);
    updatePlan(changeContextPack(plan, nextPack));
    setSelectedTemplateId(nextPack.templates[0]?.id ?? "");
  };

  const handleApplyTemplate = () => {
    const template = pack.templates.find((item) => item.id === selectedTemplateId) ?? pack.templates[0];
    if (!template) return;
    if (!window.confirm("現在の区間構成をテンプレートで置き換えます。よろしいですか。")) return;
    updatePlan(applyTemplateToPlan(plan, pack, template));
    setNotice("テンプレートを適用しました。");
  };

  const handleAddSegment = () => {
    const segment = createBlankSegment(plan, pack);
    const segments = autoSchedule([...plan.segments, segment]);
    updatePlan({ ...plan, segments, selectedSegmentId: segment.id, view: "agenda" });
  };

  const handleDeleteSegment = (segmentId: string) => {
    if (!window.confirm("この区間を削除します。よろしいですか。")) return;
    const index = plan.segments.findIndex((segment) => segment.id === segmentId);
    const segments = removeSegment(plan.segments, segmentId);
    const selectedSegmentId = segments[index]?.id ?? segments[index - 1]?.id ?? segments[0]?.id;
    updatePlan({ ...plan, segments, selectedSegmentId });
  };

  const handleDuplicateSegment = (segmentId: string) => {
    const segments = duplicateSegment(plan.segments, segmentId, () => makeId("segment"));
    const originalIndex = plan.segments.findIndex((segment) => segment.id === segmentId);
    updatePlan({ ...plan, segments, selectedSegmentId: segments[originalIndex + 1]?.id ?? segmentId });
  };

  const handleMoveSegment = (segmentId: string, direction: "up" | "down") => {
    updatePlan({ ...plan, segments: moveSegment(plan.segments, segmentId, direction), selectedSegmentId: segmentId });
  };

  const handleRecalculate = () => {
    updatePlan({ ...plan, segments: autoSchedule(plan.segments) });
    setNotice("開始時刻を再計算しました。");
  };

  const handleCopy = async (text: string) => {
    await copyText(text);
    setNotice("コピーしました。");
  };

  const handleJsonSave = () => {
    downloadText(getPlanFileName(), serializePlan(plan), "application/json;charset=utf-8");
  };

  const handleMarkdownSave = () => {
    const content = outputs.map((output) => output.content).join("\n\n---\n\n");
    downloadText("seminar-design-outputs.md", content, "text/markdown;charset=utf-8");
  };

  const handleTxtSave = () => {
    downloadText("seminar-script.txt", generateScriptText(plan, pack), "text/plain;charset=utf-8");
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const parsed = parsePlanJson(text);
    if (!parsed.ok) {
      setNotice(parsed.message);
      return;
    }
    const importedPack = getContextPack(parsed.plan.contextPackId);
    updatePlan(normalizeImportedPlan(parsed.plan, importedPack));
    setNotice("JSONを読み込みました。");
  };

  const headerScoreLabel = score.contextLabel ?? score.label;

  return (
    <div className="appShell">
      <header className="appHeader">
        <div>
          <p className="eyebrow">Seminar Design Compass</p>
          <h1>セミナー設計コンパス</h1>
          <p>{plan.title} / {pack.label} / 合計{metrics.totalDuration}分 / 目標との差{metrics.durationDiff}分</p>
        </div>
        <div className="headerScore" aria-label={headerScoreLabel}>
          <span>{headerScoreLabel}</span>
          <strong>{score.overallScore}</strong>
        </div>
        <nav className="headerActions" aria-label="主要操作">
          <button type="button" onClick={handleApplyTemplate}>テンプレート適用</button>
          <button type="button" onClick={handleAddSegment}>区間追加</button>
          <button type="button" onClick={handleRecalculate}>開始時刻を再計算</button>
          <button type="button" onClick={handleJsonSave}>JSON保存</button>
          <button type="button" onClick={() => fileInputRef.current?.click()}>JSON読込</button>
          <button type="button" onClick={handleMarkdownSave}>Markdown保存</button>
          <button type="button" onClick={() => window.print()}>印刷</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="visuallyHidden"
            onChange={(event) => {
              void handleImportFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </nav>
      </header>

      {notice && (
        <div className="notice" role="status">
          {notice}
          <button type="button" onClick={() => setNotice("")}>閉じる</button>
        </div>
      )}

      <main className="workspace">
        <SeminarForm
          plan={plan}
          pack={pack}
          packs={contextPacks}
          selectedTemplateId={selectedTemplateId}
          onTemplateSelect={setSelectedTemplateId}
          onTemplateApply={handleApplyTemplate}
          onPlanChange={updatePlan}
          onContextPackChange={handleContextPackChange}
        />

        <section className="centerRail">
          <div className="tabList" role="tablist" aria-label="中央表示">
            {[
              ["agenda", "全体構成"],
              ["gantt", "ガントチャート"],
              ["script", "進行台本"],
              ["outputs", "出力"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={plan.view === value ? "active" : ""}
                onClick={() => setView(value as SeminarPlan["view"])}
              >
                {label}
              </button>
            ))}
          </div>
          {plan.view === "agenda" && (
            <SegmentList
              plan={plan}
              pack={pack}
              selectedSegmentId={plan.selectedSegmentId}
              onSelect={(selectedSegmentId) => updatePlan({ ...plan, selectedSegmentId })}
              onChange={updateSegment}
              onMove={handleMoveSegment}
              onDuplicate={handleDuplicateSegment}
              onDelete={handleDeleteSegment}
            />
          )}
          {plan.view === "gantt" && <GanttChart plan={plan} pack={pack} onCopy={handleCopy} />}
          {plan.view === "script" && (
            <section className="panel mainPanel">
              <div className="panelHeader">
                <h2>進行台本</h2>
                <div className="inlineActions">
                  <button type="button" onClick={() => handleCopy(generateScriptText(plan, pack))}>台本コピー</button>
                  <button type="button" onClick={handleTxtSave}>TXT保存</button>
                  <button type="button" onClick={() => downloadText("facilitator-script.md", generateScriptText(plan, pack), "text/markdown;charset=utf-8")}>
                    Markdown保存
                  </button>
                </div>
              </div>
              <pre className="outputPre">{generateScriptText(plan, pack)}</pre>
            </section>
          )}
          {plan.view === "outputs" && (
            <OutputPanel outputs={outputs} onCopy={handleCopy} onSave={(filename, content) => downloadText(filename, content, "text/markdown;charset=utf-8")} />
          )}
        </section>

        <aside className="rightRail">
          <SegmentEditor
            plan={plan}
            pack={pack}
            segment={selectedSegment}
            onChange={(segment) => updateSegment(segment, segment.id !== selectedSegment?.id || segment.startMin === selectedSegment?.startMin)}
          />
          <DesignChecks score={score} />
          <MetricsPanel metrics={metrics} />
        </aside>
      </main>
    </div>
  );
}
