export const PLAN_VERSION = "2.0.0" as const;

export type SegmentType =
  | "opening"
  | "context"
  | "lecture"
  | "dialogue"
  | "demo"
  | "case"
  | "discussion"
  | "work"
  | "qa"
  | "summary"
  | "closing";

export type PlanView = "cards" | "gantt" | "script";

export interface SeminarPlan {
  version: typeof PLAN_VERSION;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  instructor: string;
  metadata: SeminarMetadata;
  pillars: Pillar[];
  segments: Segment[];
  selectedSegmentId?: string;
  view?: PlanView;
}

export interface SeminarMetadata {
  date: string;
  startTime: string;
  totalDurationMin: number;
  hasBreak: boolean;
  breakDurationMin: number;
  breakAfterSegmentId?: string;
  breakLabel: string;
  location: string;
  audience: string;
  purpose: string;
  customFields: CustomMetaField[];
}

export interface CustomMetaField {
  id: string;
  label: string;
  value: string;
}

export interface Pillar {
  id: string;
  title: string;
  description: string;
  color: string;
  order: number;
}

export interface Segment {
  id: string;
  title: string;
  startMin: number;
  durationMin: number;
  pillarId: string;
  type: SegmentType;
  goal: string;
  question: string;
  script: string;
  transition: string;
  takeaway: string;
  notes: string;
  attachments: Attachment[];
}

export type Attachment = ImageAttachment | UrlAttachment;

export interface ImageAttachment {
  id: string;
  type: "image";
  fileName: string;
  dataUrl: string;
  alt?: string;
}

export interface UrlAttachment {
  id: string;
  type: "url";
  label: string;
  url: string;
}

export interface TimelineItem {
  kind: "segment" | "break";
  id: string;
  title: string;
  startMin: number;
  durationMin: number;
  pillarId?: string;
  segment?: Segment;
}

export interface PlanMetrics {
  contentDuration: number;
  breakDuration: number;
  totalDuration: number;
  durationDiff: number;
  pillarMinutes: {
    pillarId: string;
    title: string;
    minutes: number;
    ratio: number;
    color: string;
  }[];
  typeMinutes: {
    type: SegmentType;
    label: string;
    minutes: number;
    ratio: number;
  }[];
}

export interface OutputDocument {
  id: "markdown" | "script";
  label: string;
  fileName: string;
  content: string;
}

export interface CheckResult {
  id: string;
  label: string;
  status: "ok" | "warn" | "bad";
  score: number;
  maxScore: number;
  message: string;
  suggestion: string;
}

export interface ScoreSummary {
  label: string;
  overallScore: number;
  totalScore: number;
  totalMaxScore: number;
  checks: CheckResult[];
}
