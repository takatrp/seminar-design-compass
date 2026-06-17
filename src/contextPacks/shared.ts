import type { AudienceMaturity, ContextPack, SegmentType } from "../domain/types";

export const segmentTypes: ContextPack["segmentTypes"] = [
  { value: "opening", label: "導入" },
  { value: "context", label: "背景整理" },
  { value: "lecture", label: "講義" },
  { value: "dialogue", label: "対話" },
  { value: "demo", label: "デモ" },
  { value: "case", label: "事例" },
  { value: "discussion", label: "討議" },
  { value: "work", label: "ワーク" },
  { value: "qa", label: "質疑応答" },
  { value: "summary", label: "まとめ" },
  { value: "closing", label: "クロージング" }
];

export const audienceMaturities: ContextPack["audienceMaturities"] = [
  { value: "beginner", label: "初学者" },
  { value: "mixed", label: "混在" },
  { value: "advanced", label: "経験者" },
  { value: "skeptical", label: "懐疑的" },
  { value: "practicing", label: "実践中" }
];

export function templateSegment(
  input: {
    title: string;
    durationMin: number;
    type: SegmentType;
    pillarId: string;
    goal: string;
    keyQuestion: string;
    takeaway: string;
    participantAction?: string;
    leadRoleId?: string;
    audienceMaturity?: AudienceMaturity;
    speakerNotes?: Record<string, string>;
    discussion?: {
      enabled: boolean;
      format: "none" | "wholeRoom" | "pair" | "group" | "panel" | "caseStudy" | "qa";
      question: string;
      output: string;
    };
    assetIds?: string[];
  }
) {
  return {
    title: input.title,
    durationMin: input.durationMin,
    leadRoleId: input.leadRoleId ?? (input.type === "opening" || input.type === "discussion" || input.type === "closing" ? "facilitator" : "speaker"),
    pillarId: input.pillarId,
    type: input.type,
    audienceMaturity: input.audienceMaturity ?? "mixed",
    goal: input.goal,
    keyQuestion: input.keyQuestion,
    speakerNotes: input.speakerNotes ?? {},
    participantAction: input.participantAction ?? "",
    takeaway: input.takeaway,
    assetIds: input.assetIds ?? [],
    discussion: input.discussion
  };
}
