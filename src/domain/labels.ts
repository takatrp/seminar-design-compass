import type { AudienceMaturity, AudienceRole, DiscussionFormat, SegmentType, VenueType } from "./types";

export const venueTypeLabels: Record<VenueType, string> = {
  onsite: "現地",
  online: "オンライン",
  hybrid: "ハイブリッド"
};

export const audienceRoleLabels: Record<AudienceRole, string> = {
  taxAccountant: "税理士",
  firmOwner: "事務所所長",
  firmStaff: "職員",
  newMember: "新規入会者",
  clientExecutive: "顧問先経営者",
  general: "一般"
};

export const audienceMaturityLabels: Record<AudienceMaturity, string> = {
  beginner: "初学者",
  mixed: "混在",
  advanced: "経験者",
  skeptical: "懐疑的",
  practicing: "実践中"
};

export const discussionFormatLabels: Record<DiscussionFormat, string> = {
  none: "なし",
  wholeRoom: "全体討議",
  pair: "ペア",
  group: "グループ",
  panel: "パネル",
  caseStudy: "ケース検討",
  qa: "質疑応答"
};

export const segmentTypeLabels: Record<SegmentType, string> = {
  opening: "導入",
  context: "背景整理",
  lecture: "講義",
  dialogue: "対話",
  demo: "デモ",
  case: "事例",
  discussion: "討議",
  work: "ワーク",
  qa: "質疑応答",
  summary: "まとめ",
  closing: "クロージング"
};

export function joinLabels<T extends string>(values: T[], labels: Record<T, string>): string {
  return values.map((value) => labels[value] ?? value).join("、");
}
