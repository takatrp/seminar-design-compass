import {
  audienceMaturityLabels,
  audienceRoleLabels,
  discussionFormatLabels,
  joinLabels,
  segmentTypeLabels,
  venueTypeLabels
} from "./labels";
import type { ContextPack, ScoreSummary, SeminarPlan, Segment } from "./types";

export interface OutputDocument {
  id: string;
  label: string;
  fileName: string;
  content: string;
}

function line(value: string | undefined, fallback = "未設定"): string {
  return value && value.trim() ? value.trim() : fallback;
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function roleLabel(plan: SeminarPlan, id: string): string {
  return plan.roles.find((role) => role.id === id)?.label ?? id;
}

function pillarLabel(pack: ContextPack, id: string): string {
  return pack.pillars.find((pillar) => pillar.id === id)?.label ?? id;
}

function assetLabels(plan: SeminarPlan, ids: string[]): string {
  if (ids.length === 0) return "なし";
  return ids
    .map((id) => plan.assets.find((asset) => asset.id === id)?.label ?? id)
    .join("、");
}

export function formatMinuteRange(segment: Segment): string {
  return `${segment.startMin}〜${segment.startMin + segment.durationMin}分`;
}

function addMinutes(time: string, minutes: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return `${minutes}分`;
  const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]) + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function clockRange(plan: SeminarPlan, segment: Segment): string {
  if (!plan.seminar.startTime) return formatMinuteRange(segment);
  return `${addMinutes(plan.seminar.startTime, segment.startMin)}〜${addMinutes(
    plan.seminar.startTime,
    segment.startMin + segment.durationMin
  )}`;
}

function audienceText(plan: SeminarPlan): string {
  const roles = joinLabels(plan.seminar.audience.roles, audienceRoleLabels);
  const maturity = audienceMaturityLabels[plan.seminar.audience.maturity];
  return `${roles || "未設定"}（${maturity}）`;
}

export function generatePlanningMemo(plan: SeminarPlan, pack: ContextPack, score: ScoreSummary): string {
  const venue = `${venueTypeLabels[plan.seminar.venue.type]} ${line(plan.seminar.venue.name, "")}`.trim();
  const structure = plan.segments
    .map((segment, index) => `${index + 1}. ${formatMinuteRange(segment)} ${segment.title}：${line(segment.goal)}`)
    .join("\n");
  return `# 主催者向け企画メモ

## 基本情報

- セミナー名：${line(plan.title)}
- 開催日時：${line(plan.seminar.dateTime)}
- 開催場所：${venue || "未設定"}
- 主催者：${line(plan.seminar.host)}
- 所要時間：${plan.seminar.durationMin}分
- context pack：${pack.label}
- 対象者：${audienceText(plan)}
- 参加者の現在地：${plan.seminar.audience.painPoints.join("、") || "未設定"}

## メッセージ

- メインメッセージ：${line(plan.seminar.mainMessage)}
- サブメッセージ：${plan.seminar.subMessages.join(" / ") || "未設定"}
- 終了後に取ってほしい行動：${line(plan.seminar.desiredAction)}

## 全体構成

${structure}

## ディスカッション設計

- 有無：${plan.seminar.discussion.enabled ? "あり" : "なし"}
- 形式：${discussionFormatLabels[plan.seminar.discussion.format]}
- 目的：${line(plan.seminar.discussion.purpose)}
- 成果物：${line(plan.seminar.discussion.expectedOutput)}

## 設計上の注意点

${score.checks
  .filter((check) => check.status !== "ok")
  .map((check) => `- ${check.label}：${check.message} ${check.suggestion}`)
  .join("\n") || "- 大きな注意点はありません。"}

## ${score.contextLabel ?? score.label}

${score.overallScore}点
`;
}

export function generateAgendaTable(plan: SeminarPlan, pack: ContextPack): string {
  const rows = plan.segments.map((segment, index) =>
    [
      index + 1,
      clockRange(plan, segment),
      `${segment.durationMin}分`,
      escapeCell(segment.title),
      escapeCell(roleLabel(plan, segment.leadRoleId)),
      segmentTypeLabels[segment.type],
      escapeCell(pillarLabel(pack, segment.pillarId)),
      escapeCell(line(segment.participantAction, "")),
      escapeCell(assetLabels(plan, segment.assetIds))
    ].join(" | ")
  );
  return `# 当日進行表

| No. | 時間 | 所要 | 区間 | 主担当 | 形式 | 柱 | 参加者アクション | 使用素材 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.map((row) => `| ${row} |`).join("\n")}
`;
}

export function generateFacilitatorScript(plan: SeminarPlan, pack: ContextPack): string {
  const items = plan.segments
    .map((segment, index) => {
      const speakerNotes = Object.entries(segment.speakerNotes ?? {})
        .filter(([, note]) => line(note, "") !== "")
        .map(([roleId, note]) => `  - ${roleLabel(plan, roleId)}：${note}`)
        .join("\n") || "  - 未設定";
      return `## 〖${index + 1}〗${formatMinuteRange(segment)} ${segment.title}

- 時間：${clockRange(plan, segment)}
- 主担当：${roleLabel(plan, segment.leadRoleId)}
- 柱：${pillarLabel(pack, segment.pillarId)}
- 区分：${segmentTypeLabels[segment.type]}
- 狙い：${line(segment.goal)}
- 導入の一言：ここでは「${line(segment.goal)}」を確認します。後半で実践に落とすため、まず皆さんの現在地をそろえます。
- キークエスチョン：${line(segment.keyQuestion)}
- 講師に振る内容：
${speakerNotes}
- 参加者に促す行動：${line(segment.participantAction)}
- 着地・持ち帰り：${line(segment.takeaway)}
`;
    })
    .join("\n---\n\n");
  return `# ファシリテーター台本

【${line(plan.title)}】
開催日時：${line(plan.seminar.dateTime)}
主催者：${line(plan.seminar.host)}
対象者：${audienceText(plan)}
メインメッセージ：${line(plan.seminar.mainMessage)}
終了後に取ってほしい行動：${line(plan.seminar.desiredAction)}

================================================

${items}
`;
}

export function generateRoleNotes(plan: SeminarPlan, pack: ContextPack): string {
  const sections = plan.roles.map((role) => {
    const assigned = plan.segments.filter((segment) => segment.leadRoleId === role.id || hasRoleNote(segment, role.id));
    const total = assigned
      .filter((segment) => segment.leadRoleId === role.id)
      .reduce((sum, segment) => sum + segment.durationMin, 0);
    const rows = assigned.map((segment) => {
      const note = segment.speakerNotes?.[role.id] ?? "";
      return `- ${formatMinuteRange(segment)} ${segment.title}
  - 話すべきポイント：${line(note || segment.goal)}
  - 話しすぎ注意点：持ち帰りと参加者アクションへ接続してから次へ進む
  - 必ず残すべき持ち帰り：${line(segment.takeaway)}`;
    });
    return `## ${role.label}

- 担当時間合計：${total}分
- 担当区間数：${assigned.length}

${rows.join("\n") || "- 担当区間は未設定です。"}`;
  });
  return `# 講師別メモ

${sections.join("\n\n")}

## 柱の確認

${pack.pillars.map((pillar) => `- ${pillar.label}：${pillar.description}`).join("\n")}
`;
}

function hasRoleNote(segment: Segment, roleId: string): boolean {
  return Boolean(segment.speakerNotes?.[roleId]?.trim());
}

export function generateDiscussionSheet(plan: SeminarPlan): string {
  const discussionSegments = plan.segments.filter((segment) => segment.discussion?.enabled);
  const rows = discussionSegments.map((segment) => {
    const format = segment.discussion?.format ?? "none";
    return `## ${formatMinuteRange(segment)} ${segment.title}

- 設問：${line(segment.discussion?.question || segment.keyQuestion)}
- 形式：${discussionFormatLabels[format]}
- 時間：${segment.durationMin}分
- グループサイズの目安：${format === "pair" ? "2人" : format === "group" ? "3〜5人" : "全体"}
- 成果物：${line(segment.discussion?.output || segment.takeaway)}
- 発表方法：1グループ30秒で要点共有
- ファシリテーターの回収コメント：今出た実践の障害を、次の行動に変換して持ち帰りましょう。`;
  });
  return `# ディスカッション設問シート

${rows.join("\n\n") || "ディスカッション区間は未設定です。"}
`;
}

export function generateFollowUpEmail(plan: SeminarPlan): string {
  return `# 終了後フォロー文面

件名：【${line(plan.title)}】ご参加ありがとうございました

${audienceText(plan)}の皆さま

本日はご参加いただき、ありがとうございました。

本日のメインメッセージは「${line(plan.seminar.mainMessage)}」でした。

終了後に取っていただきたい行動は、次のとおりです。

${line(plan.seminar.desiredAction)}

まずは、今日決めた一歩を小さく実践してください。必要な資料やメモは、主催者から別途ご案内します。

アンケートにもご協力ください。次回以降の内容改善に活用します。

${line(plan.seminar.host)}
`;
}

export function generateScriptText(plan: SeminarPlan, pack: ContextPack): string {
  return generateFacilitatorScript(plan, pack).replace(/^# ファシリテーター台本\n\n/, "");
}

export function generateAllOutputs(plan: SeminarPlan, pack: ContextPack, score: ScoreSummary): OutputDocument[] {
  return [
    {
      id: "planning",
      label: "主催者向け企画メモ",
      fileName: "planning-memo.md",
      content: generatePlanningMemo(plan, pack, score)
    },
    {
      id: "agenda",
      label: "当日進行表",
      fileName: "agenda.md",
      content: generateAgendaTable(plan, pack)
    },
    {
      id: "script",
      label: "ファシリテーター台本",
      fileName: "facilitator-script.md",
      content: generateFacilitatorScript(plan, pack)
    },
    {
      id: "role-notes",
      label: "講師別メモ",
      fileName: "role-notes.md",
      content: generateRoleNotes(plan, pack)
    },
    {
      id: "discussion",
      label: "ディスカッション設問シート",
      fileName: "discussion-sheet.md",
      content: generateDiscussionSheet(plan)
    },
    {
      id: "follow-up",
      label: "終了後フォロー文面",
      fileName: "follow-up-email.md",
      content: generateFollowUpEmail(plan)
    }
  ];
}
