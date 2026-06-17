import { genericContextPack } from "../contextPacks/generic";
import { tkcContextPack } from "../contextPacks/tkc";
import { autoSchedule } from "./scheduling";
import type { ContextPack, SeminarMeta, SeminarPlan, SeminarTemplate, Segment } from "./types";

export function makeId(prefix: string): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createDefaultSeminarMeta(): SeminarMeta {
  return {
    dateTime: "",
    startTime: "13:30",
    venue: {
      type: "onsite",
      name: "",
      roomLayout: ""
    },
    host: "",
    coHosts: [],
    durationMin: 120,
    mainMessage: "明日から実践に移す判断軸と最初の一歩を持ち帰る",
    subMessages: ["現状をそろえる", "実践手順を具体化する", "終了後の行動を決める"],
    desiredAction: "まず1社・1テーマを選び、次回面談で実践する",
    audience: {
      roles: ["firmOwner", "firmStaff"],
      maturity: "mixed",
      painPoints: ["実践に落ちる設計が難しい"],
      objections: ["聞いて終わりになりやすい"]
    },
    discussion: {
      enabled: true,
      format: "group",
      purpose: "参加者の現在地をそろえ、実践の障害を言語化する",
      expectedOutput: "明日から試す行動案"
    },
    notes: ""
  };
}

function cloneSegmentTemplate(segment: Omit<Segment, "id" | "startMin">): Segment {
  return {
    ...structuredClone(segment),
    id: makeId("segment"),
    startMin: 0,
    speakerNotes: { ...segment.speakerNotes },
    assetIds: [...segment.assetIds]
  };
}

export function ensureSpeakerNotesForRoles(segment: Segment, roles: { id: string }[]): Segment {
  const speakerNotes = { ...segment.speakerNotes };
  roles.forEach((role) => {
    if (!(role.id in speakerNotes)) speakerNotes[role.id] = "";
  });
  return { ...segment, speakerNotes };
}

export function createPlanFromTemplate(
  contextPack: ContextPack,
  template: SeminarTemplate,
  preserve?: Partial<SeminarPlan>
): SeminarPlan {
  const createdAt = preserve?.createdAt ?? nowIso();
  const baseSeminar = createDefaultSeminarMeta();
  const seminar: SeminarMeta = {
    ...baseSeminar,
    ...template.seminarPatch,
    venue: { ...baseSeminar.venue, ...template.seminarPatch.venue },
    audience: { ...baseSeminar.audience, ...template.seminarPatch.audience },
    discussion: { ...baseSeminar.discussion, ...template.seminarPatch.discussion },
    coHosts: template.seminarPatch.coHosts ?? baseSeminar.coHosts,
    subMessages: template.seminarPatch.subMessages ?? baseSeminar.subMessages,
    durationMin: template.recommendedDurationMin
  };
  const roles = structuredClone(contextPack.defaultRoles);
  const segments = autoSchedule(template.segments.map(cloneSegmentTemplate)).map((segment) =>
    ensureSpeakerNotesForRoles(segment, roles)
  );
  return {
    version: "1.0.0",
    id: preserve?.id ?? makeId("plan"),
    title: preserve?.title || template.label,
    createdAt,
    updatedAt: nowIso(),
    contextPackId: contextPack.id,
    seminar,
    roles,
    segments,
    assets: preserve?.assets ?? [],
    selectedSegmentId: segments[0]?.id,
    view: preserve?.view ?? "agenda"
  };
}

export function createDefaultPlan(contextPack: ContextPack = tkcContextPack): SeminarPlan {
  const template = contextPack.templates[0] ?? genericContextPack.templates[0];
  return createPlanFromTemplate(contextPack, template);
}

export function applyTemplateToPlan(plan: SeminarPlan, contextPack: ContextPack, template: SeminarTemplate): SeminarPlan {
  const next = createPlanFromTemplate(contextPack, template, {
    id: plan.id,
    title: plan.title || template.label,
    createdAt: plan.createdAt,
    assets: plan.assets,
    view: plan.view
  });
  return {
    ...next,
    seminar: {
      ...next.seminar,
      dateTime: plan.seminar.dateTime,
      startTime: plan.seminar.startTime,
      host: plan.seminar.host,
      venue: {
        ...next.seminar.venue,
        name: plan.seminar.venue.name,
        address: plan.seminar.venue.address,
        onlineUrlLabel: plan.seminar.venue.onlineUrlLabel,
        roomLayout: plan.seminar.venue.roomLayout
      }
    }
  };
}

export function createBlankSegment(plan: SeminarPlan, contextPack: ContextPack): Segment {
  const firstRoleId = plan.roles[0]?.id ?? contextPack.defaultRoles[0]?.id ?? "facilitator";
  const firstPillarId = contextPack.pillars[0]?.id ?? "purpose";
  return ensureSpeakerNotesForRoles(
    {
      id: makeId("segment"),
      title: "追加区間",
      startMin: 0,
      durationMin: 10,
      leadRoleId: firstRoleId,
      pillarId: firstPillarId,
      type: "discussion",
      audienceMaturity: plan.seminar.audience.maturity,
      goal: "",
      keyQuestion: "この区間で何を問い、何を持ち帰ってもらうかを設定してください。",
      speakerNotes: {},
      participantAction: "",
      takeaway: "",
      assetIds: [],
      discussion: {
        enabled: true,
        format: plan.seminar.discussion.format,
        question: "参加者の現場では何が障害になっていますか。",
        output: "実践に移すための課題メモ"
      }
    },
    plan.roles
  );
}

export function changeContextPack(plan: SeminarPlan, contextPack: ContextPack): SeminarPlan {
  const validPillars = new Set(contextPack.pillars.map((pillar) => pillar.id));
  const fallbackPillar = contextPack.pillars[0]?.id ?? "purpose";
  const defaultRole = contextPack.defaultRoles[0]?.id ?? plan.roles[0]?.id ?? "facilitator";
  const validRoles = new Set(contextPack.defaultRoles.map((role) => role.id));
  const segments = autoSchedule(
    plan.segments.map((segment) =>
      ensureSpeakerNotesForRoles(
        {
          ...segment,
          pillarId: validPillars.has(segment.pillarId) ? segment.pillarId : fallbackPillar,
          leadRoleId: validRoles.has(segment.leadRoleId) ? segment.leadRoleId : defaultRole
        },
        contextPack.defaultRoles
      )
    )
  );
  return {
    ...plan,
    updatedAt: nowIso(),
    contextPackId: contextPack.id,
    roles: structuredClone(contextPack.defaultRoles),
    segments,
    selectedSegmentId: segments.some((segment) => segment.id === plan.selectedSegmentId)
      ? plan.selectedSegmentId
      : segments[0]?.id
  };
}

export function normalizeImportedPlan(plan: SeminarPlan, contextPack: ContextPack): SeminarPlan {
  const baseSeminar = createDefaultSeminarMeta();
  const rawSeminar = plan.seminar ?? baseSeminar;
  const seminar: SeminarMeta = {
    ...baseSeminar,
    ...rawSeminar,
    venue: { ...baseSeminar.venue, ...(rawSeminar.venue ?? {}) },
    audience: {
      ...baseSeminar.audience,
      ...(rawSeminar.audience ?? {}),
      roles: Array.isArray(rawSeminar.audience?.roles) ? rawSeminar.audience.roles : baseSeminar.audience.roles,
      painPoints: Array.isArray(rawSeminar.audience?.painPoints)
        ? rawSeminar.audience.painPoints
        : baseSeminar.audience.painPoints,
      objections: Array.isArray(rawSeminar.audience?.objections)
        ? rawSeminar.audience.objections
        : baseSeminar.audience.objections
    },
    discussion: { ...baseSeminar.discussion, ...(rawSeminar.discussion ?? {}) },
    coHosts: Array.isArray(rawSeminar.coHosts) ? rawSeminar.coHosts : baseSeminar.coHosts,
    subMessages: Array.isArray(rawSeminar.subMessages) ? rawSeminar.subMessages : baseSeminar.subMessages
  };
  const roles = plan.roles?.length ? plan.roles : structuredClone(contextPack.defaultRoles);
  const validPillars = new Set(contextPack.pillars.map((pillar) => pillar.id));
  const fallbackPillar = contextPack.pillars[0]?.id ?? "purpose";
  const validRoles = new Set(roles.map((role) => role.id));
  const fallbackRole = roles[0]?.id ?? "facilitator";
  const segments = autoSchedule(
    (plan.segments ?? []).map((segment) =>
      ensureSpeakerNotesForRoles(
        {
          ...segment,
          id: segment.id || makeId("segment"),
          pillarId: validPillars.has(segment.pillarId) ? segment.pillarId : fallbackPillar,
          leadRoleId: validRoles.has(segment.leadRoleId) ? segment.leadRoleId : fallbackRole,
          assetIds: Array.isArray(segment.assetIds) ? segment.assetIds : [],
          speakerNotes: segment.speakerNotes ?? {},
          audienceMaturity: segment.audienceMaturity ?? seminar.audience.maturity
        },
        roles
      )
    )
  );
  return {
    ...plan,
    version: "1.0.0",
    updatedAt: nowIso(),
    contextPackId: contextPack.id,
    seminar,
    roles,
    segments,
    assets: plan.assets ?? [],
    selectedSegmentId: segments.some((segment) => segment.id === plan.selectedSegmentId)
      ? plan.selectedSegmentId
      : segments[0]?.id,
    view: plan.view ?? "agenda"
  };
}
