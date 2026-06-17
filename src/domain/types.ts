export type VenueType = "onsite" | "online" | "hybrid";

export type AudienceRole =
  | "taxAccountant"
  | "firmOwner"
  | "firmStaff"
  | "newMember"
  | "clientExecutive"
  | "general";

export type AudienceMaturity =
  | "beginner"
  | "mixed"
  | "advanced"
  | "skeptical"
  | "practicing";

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

export type DiscussionFormat =
  | "none"
  | "wholeRoom"
  | "pair"
  | "group"
  | "panel"
  | "caseStudy"
  | "qa";

export interface SeminarPlan {
  version: "1.0.0";
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  contextPackId: string;
  seminar: SeminarMeta;
  roles: SeminarRole[];
  segments: Segment[];
  assets: AssetRef[];
  selectedSegmentId?: string;
  view?: "agenda" | "gantt" | "script" | "outputs";
}

export interface SeminarMeta {
  dateTime: string;
  startTime: string;
  venue: {
    type: VenueType;
    name: string;
    address?: string;
    onlineUrlLabel?: string;
    roomLayout?: string;
  };
  host: string;
  coHosts: string[];
  durationMin: number;
  mainMessage: string;
  subMessages: string[];
  desiredAction: string;
  audience: {
    roles: AudienceRole[];
    maturity: AudienceMaturity;
    painPoints: string[];
    objections: string[];
  };
  discussion: {
    enabled: boolean;
    format: DiscussionFormat;
    purpose: string;
    expectedOutput: string;
  };
  notes: string;
}

export interface SeminarRole {
  id: string;
  label: string;
  shortLabel: string;
  type: "facilitator" | "speaker" | "panelist" | "staff" | "participant";
}

export interface Segment {
  id: string;
  title: string;
  startMin: number;
  durationMin: number;
  leadRoleId: string;
  pillarId: string;
  type: SegmentType;
  audienceMaturity: AudienceMaturity;
  goal: string;
  keyQuestion: string;
  speakerNotes: Record<string, string>;
  participantAction: string;
  takeaway: string;
  assetIds: string[];
  discussion?: {
    enabled: boolean;
    format: DiscussionFormat;
    question: string;
    output: string;
  };
}

export interface AssetRef {
  id: string;
  label: string;
  kind: "slide" | "document" | "url" | "image" | "memo";
  description: string;
  sourceLabel?: string;
  sourceUrl?: string;
  usageNote?: string;
}

export interface ContextPack {
  id: string;
  label: string;
  description: string;
  pillars: Pillar[];
  defaultRoles: SeminarRole[];
  segmentTypes: { value: SegmentType; label: string }[];
  audienceMaturities: { value: AudienceMaturity; label: string }[];
  templates: SeminarTemplate[];
  checks: CheckDefinition[];
  recommendedWords: string[];
  riskWords: string[];
  contextScoreLabel?: string;
  evaluateChecks?: (plan: SeminarPlan, pack: ContextPack) => CheckResult[];
}

export interface Pillar {
  id: string;
  label: string;
  description: string;
  colorToken?: string;
  recommendedMinRatio?: number;
  recommendedMaxRatio?: number;
  order?: number;
}

export interface SeminarTemplate {
  id: string;
  label: string;
  description: string;
  recommendedDurationMin: number;
  seminarPatch: Partial<SeminarMeta>;
  segments: Omit<Segment, "id" | "startMin">[];
}

export interface CheckDefinition {
  id: string;
  label: string;
  description: string;
  weight: number;
  scope: "common" | "context";
  severity: "info" | "warning" | "critical";
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
  contextLabel?: string;
  overallScore: number;
  totalScore: number;
  totalMaxScore: number;
  checks: CheckResult[];
}

export interface PlanMetrics {
  totalDuration: number;
  durationDiff: number;
  interactiveDuration: number;
  lectureDuration: number;
  roleMinutes: { roleId: string; label: string; minutes: number; ratio: number }[];
  pillarMinutes: { pillarId: string; label: string; minutes: number; ratio: number; colorToken?: string }[];
  typeMinutes: { type: SegmentType; label: string; minutes: number; ratio: number }[];
}
