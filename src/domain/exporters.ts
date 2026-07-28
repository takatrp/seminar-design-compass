import { segmentTypeLabels } from "./labels";
import { buildTimeline, sumDuration, sumTimelineDuration } from "./scheduling";
import type {
  Attachment,
  OutputDocument,
  SeminarPlan,
  Segment,
  TimelineItem
} from "./types";

export type { OutputDocument } from "./types";

function line(value: string | undefined, fallback = "未設定"): string {
  return value && value.trim() ? value.trim() : fallback;
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function pillarTitle(plan: SeminarPlan, pillarId: string | undefined): string {
  if (!pillarId) return "—";
  return plan.pillars.find((pillar) => pillar.id === pillarId)?.title ?? pillarId;
}

function addMinutes(time: string, minutes: number): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 23 || mins > 59) return null;
  const total = hours * 60 + mins + minutes;
  const normalized = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(
    normalized % 60
  ).padStart(2, "0")}`;
}

export function formatMinuteRange(
  item: Pick<TimelineItem, "startMin" | "durationMin">
): string {
  return `${item.startMin}〜${item.startMin + item.durationMin}分`;
}

export function formatClockRange(
  plan: SeminarPlan,
  item: Pick<TimelineItem, "startMin" | "durationMin">
): string {
  const start = addMinutes(plan.metadata.startTime, item.startMin);
  const end = addMinutes(plan.metadata.startTime, item.startMin + item.durationMin);
  return start && end ? `${start}〜${end}` : formatMinuteRange(item);
}

function attachmentLines(attachments: Attachment[]): string[] {
  if (attachments.length === 0) return ["- 添付: なし"];
  return attachments.map((attachment) =>
    attachment.type === "image"
      ? `- 画像: ${attachment.fileName}${attachment.alt ? `（${attachment.alt}）` : ""}`
      : `- 参考URL: [${attachment.label || attachment.url}](${attachment.url})`
  );
}

function metadataLines(plan: SeminarPlan): string[] {
  const metadata = plan.metadata;
  const standard = [
    `- 実施日: ${line(metadata.date)}`,
    `- 開始時刻: ${line(metadata.startTime)}`,
    `- 全体時間: ${metadata.totalDurationMin}分`,
    `- 休憩: ${metadata.hasBreak ? `${line(metadata.breakLabel, "休憩")} ${metadata.breakDurationMin}分` : "なし"}`,
    `- 場所: ${line(metadata.location)}`,
    `- 対象者: ${line(metadata.audience)}`,
    `- 目的: ${line(metadata.purpose)}`
  ];
  const custom = metadata.customFields
    .filter((field) => field.label.trim() || field.value.trim())
    .map((field) => `- ${line(field.label, "追加項目")}: ${line(field.value)}`);
  return [...standard, ...custom];
}

export function generateAgendaTable(plan: SeminarPlan): string {
  const rows = buildTimeline(plan).map((item, index) => {
    const type =
      item.kind === "break"
        ? "休憩"
        : segmentTypeLabels[item.segment?.type ?? "lecture"];
    const goal = item.kind === "segment" ? item.segment?.goal ?? "" : "";
    return `| ${index + 1} | ${formatClockRange(plan, item)} | ${item.durationMin}分 | ${escapeCell(
      item.title
    )} | ${escapeCell(pillarTitle(plan, item.pillarId))} | ${type} | ${escapeCell(goal)} |`;
  });
  return `## 当日の進行

| No. | 時刻 | 所要 | カード | 柱 | 種別 | 狙い |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n") || "| — | — | — | カード未設定 | — | — | — |"}
`;
}

function segmentSection(
  plan: SeminarPlan,
  segment: Segment,
  item: TimelineItem,
  number: number
): string {
  return `### ${number}. ${segment.title}

- 時刻: ${formatClockRange(plan, item)}（${segment.durationMin}分）
- 柱: ${pillarTitle(plan, segment.pillarId)}
- 種別: ${segmentTypeLabels[segment.type]}
- 狙い: ${line(segment.goal)}
- 問い: ${line(segment.question)}
- 持ち帰り: ${line(segment.takeaway)}

#### 話す内容

${line(segment.script)}

#### 次へのつなぎ

${line(segment.transition)}

#### メモ

${line(segment.notes)}

#### 添付

${attachmentLines(segment.attachments).join("\n")}
`;
}

export function generateFacilitatorScript(
  plan: SeminarPlan
): string {
  let segmentIndex = 0;
  const sections = buildTimeline(plan).map((item) => {
    if (item.kind === "break") {
      return `### ${item.title}

- 時刻: ${formatClockRange(plan, item)}（${item.durationMin}分）
`;
    }
    segmentIndex += 1;
    const segment = item.segment ?? plan.segments.find((candidate) => candidate.id === item.id);
    return segment ? segmentSection(plan, segment, item, segmentIndex) : "";
  });
  return `# ${line(plan.title)} 台本

- 講師: ${line(plan.instructor, "松本")}
${metadataLines(plan).join("\n")}

---

${sections.filter(Boolean).join("\n---\n\n")}
`;
}

export function generateSeminarMarkdown(plan: SeminarPlan): string {
  const pillarList =
    plan.pillars.length > 0
      ? plan.pillars
          .map(
            (pillar, index) =>
              `${index + 1}. **${pillar.title}**${pillar.description ? ` — ${pillar.description}` : ""}`
          )
          .join("\n")
      : "柱は未設定です。";
  const contentDuration = sumDuration(plan.segments);
  const scheduledDuration = sumTimelineDuration(plan);
  return `# ${line(plan.title)}

## 基本情報

- 講師: ${line(plan.instructor, "松本")}
${metadataLines(plan).join("\n")}
- カード合計: ${contentDuration}分
- 休憩を含む構成時間: ${scheduledDuration}分
- 設定した全体時間との差: ${scheduledDuration - plan.metadata.totalDurationMin}分

## 柱

${pillarList}

${generateAgendaTable(plan)}

## カード詳細

${plan.segments
  .map((segment, index) => {
    const timelineItem = buildTimeline(plan).find(
      (item) => item.kind === "segment" && item.id === segment.id
    );
    const item: TimelineItem =
      timelineItem ?? {
        kind: "segment",
        id: segment.id,
        title: segment.title,
        startMin: segment.startMin,
        durationMin: segment.durationMin,
        pillarId: segment.pillarId,
        segment
      };
    return segmentSection(plan, segment, item, index + 1);
  })
  .join("\n---\n\n")}
`;
}

export const generateMarkdown = generateSeminarMarkdown;

export function generatePlanningMemo(
  plan: SeminarPlan
): string {
  return generateSeminarMarkdown(plan);
}

export function generateScriptText(plan: SeminarPlan): string {
  return generateFacilitatorScript(plan);
}

export function generateRoleNotes(plan: SeminarPlan): string {
  return generateFacilitatorScript(plan);
}

export function generateDiscussionSheet(plan: SeminarPlan): string {
  const sections = plan.segments
    .filter((segment) =>
      ["dialogue", "discussion", "work", "qa"].includes(segment.type)
    )
    .map(
      (segment) => `## ${segment.title}

- 問い: ${line(segment.question)}
- 狙い: ${line(segment.goal)}
- 持ち帰り: ${line(segment.takeaway)}
`
    );
  return `# 対話・ワークの問い

${sections.join("\n") || "対話・ワークのカードはありません。"}
`;
}

export function generateFollowUpEmail(plan: SeminarPlan): string {
  return `件名: 「${line(plan.title)}」ご参加のお礼

本日は「${line(plan.title)}」にご参加いただき、ありがとうございました。

本日の目的は「${line(plan.metadata.purpose)}」でした。
セミナーで決めた持ち帰りや最初の一歩を、ぜひ実践に移してください。

${line(plan.instructor, "松本")}
`;
}

export function generateAllOutputs(
  plan: SeminarPlan
): OutputDocument[] {
  return [
    {
      id: "markdown",
      label: "セミナー設計書",
      fileName: "seminar-plan.md",
      content: generateSeminarMarkdown(plan)
    },
    {
      id: "script",
      label: "講師台本",
      fileName: "seminar-script.md",
      content: generateFacilitatorScript(plan)
    }
  ];
}
