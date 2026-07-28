import { createDefaultMetadata, createDefaultPillars } from "./defaults";
import { autoSchedule, normalizeDuration } from "./scheduling";
import {
  PLAN_VERSION,
  type Attachment,
  type CustomMetaField,
  type Pillar,
  type SeminarPlan,
  type Segment,
  type SegmentType
} from "./types";

export interface ParseResult {
  ok: true;
  plan: SeminarPlan;
  warnings: string[];
  migrated: boolean;
}

export interface ParseError {
  ok: false;
  message: string;
}

type RecordValue = Record<string, unknown>;

const SEGMENT_TYPES = new Set<SegmentType>([
  "opening",
  "context",
  "lecture",
  "dialogue",
  "demo",
  "case",
  "discussion",
  "work",
  "qa",
  "summary",
  "closing"
]);

const LEGACY_PILLARS: Record<string, Array<Omit<Pillar, "order">>> = {
  generic: [
    {
      id: "purpose",
      title: "目的・問題提起",
      description: "扱う意味と参加者の課題をそろえる",
      color: "#2563eb"
    },
    {
      id: "principle",
      title: "基本思想・判断軸",
      description: "判断に使う考え方を提示する",
      color: "#7c3aed"
    },
    {
      id: "practice",
      title: "実践方法・手順",
      description: "明日からの進め方を具体化する",
      color: "#059669"
    },
    {
      id: "case",
      title: "事例・デモ",
      description: "具体例から理解を深める",
      color: "#0891b2"
    },
    {
      id: "dialogue",
      title: "対話・ワーク",
      description: "自分の現場へ置き換える",
      color: "#d97706"
    },
    {
      id: "action",
      title: "行動宣言・フォロー",
      description: "終了後の行動まで落とす",
      color: "#ea580c"
    }
  ],
  tkc: [
    {
      id: "tkc-context",
      title: "①現在地・問題提起",
      description: "参加者の課題認識をそろえる",
      color: "#2563eb"
    },
    {
      id: "tkc-self-accounting",
      title: "②TKC方式の自計化",
      description: "経営状況をタイムリーに把握するための土台",
      color: "#7c3aed"
    },
    {
      id: "tkc-monthly-close-audit",
      title: "③月次決算体制・巡回監査",
      description: "信頼できる月次決算体制と巡回監査",
      color: "#059669"
    },
    {
      id: "tkc-performance",
      title: "④業績管理・限界利益",
      description: "業績把握と意思決定への接続",
      color: "#0891b2"
    },
    {
      id: "tkc-advisory-mas",
      title: "⑤経営助言・継続MAS",
      description: "経営助言と具体的な打ち手への接続",
      color: "#d97706"
    },
    {
      id: "tkc-action-standardization",
      title: "⑥標準化・翌日実践",
      description: "聞いて終わらせず実践へ落とす",
      color: "#ea580c"
    }
  ]
};

const AUDIENCE_ROLE_LABELS: Record<string, string> = {
  taxAccountant: "税理士",
  firmOwner: "事務所所長",
  firmStaff: "職員",
  newMember: "新規入会者",
  clientExecutive: "顧問先経営者",
  general: "一般"
};

const AUDIENCE_MATURITY_LABELS: Record<string, string> = {
  beginner: "初学者",
  mixed: "経験混在",
  advanced: "経験者",
  skeptical: "懐疑的",
  practicing: "実践中"
};

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function uniqueId(value: unknown, fallback: string, seen: Set<string>): string {
  const base = text(value).trim() || fallback;
  let candidate = base;
  let suffix = 2;
  while (seen.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  seen.add(candidate);
  return candidate;
}

function finiteNonNegative(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? normalizeDuration(value)
    : fallback;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.filter((value): value is string => typeof value === "string")));
}

function segmentType(value: unknown): SegmentType {
  return typeof value === "string" && SEGMENT_TYPES.has(value as SegmentType)
    ? (value as SegmentType)
    : "lecture";
}

function safeUrl(value: unknown): string {
  const candidate = text(value).trim();
  return /^https?:\/\/\S+$/i.test(candidate) ? candidate : "";
}

function normalizeAttachment(raw: unknown, fallbackId: string): Attachment | null {
  if (!isRecord(raw)) return null;
  if (raw.type === "image") {
    const dataUrl = text(raw.dataUrl);
    if (!/^data:image\/[^;,]+(?:;[^,]*)?,/i.test(dataUrl)) return null;
    return {
      id: text(raw.id, fallbackId),
      type: "image",
      fileName: text(raw.fileName, "image"),
      dataUrl,
      ...(text(raw.alt) ? { alt: text(raw.alt) } : {})
    };
  }
  if (raw.type === "url") {
    const url = safeUrl(raw.url);
    if (!url) return null;
    return {
      id: text(raw.id, fallbackId),
      type: "url",
      label: text(raw.label, url),
      url
    };
  }
  return null;
}

function normalizePillars(raw: unknown): Pillar[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.flatMap((value, index) => {
    if (!isRecord(value)) return [];
    const id = text(value.id, `pillar-${index + 1}`);
    if (seen.has(id)) return [];
    seen.add(id);
    return [
      {
        id,
        title: text(value.title, text(value.label, `柱${index + 1}`)),
        description: text(value.description),
        color: text(value.color, text(value.colorToken, "#64748b")),
        order: index
      }
    ];
  });
}

function ensureReferencedPillars(pillars: Pillar[], segments: Segment[]): Pillar[] {
  const result = [...pillars];
  const ids = new Set(result.map((pillar) => pillar.id));
  segments.forEach((segment) => {
    if (!segment.pillarId || ids.has(segment.pillarId)) return;
    ids.add(segment.pillarId);
    result.push({
      id: segment.pillarId,
      title: `旧データの柱（${segment.pillarId}）`,
      description: "旧データから移行した柱です。名称と説明を編集してください。",
      color: "#64748b",
      order: result.length
    });
  });
  return result.map((pillar, order) => ({ ...pillar, order }));
}

function normalizeCustomFields(raw: unknown): CustomMetaField[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.flatMap((value, index) => {
    if (!isRecord(value)) return [];
    return [
      {
        id: uniqueId(value.id, `meta-${index + 1}`, seen),
        label: text(value.label),
        value: text(value.value)
      }
    ];
  });
}

function normalizeV2Plan(raw: RecordValue): { plan: SeminarPlan; warnings: string[] } {
  const warnings: string[] = [];
  const fallbackMetadata = createDefaultMetadata();
  const rawMetadata = isRecord(raw.metadata) ? raw.metadata : {};
  if (!isRecord(raw.metadata)) warnings.push("metadata が不足していたため既定値で補いました。");
  const rawSegments = Array.isArray(raw.segments) ? raw.segments : [];
  if (!Array.isArray(raw.segments)) warnings.push("segments が不足していたため空の配列で補いました。");
  const segmentIds = new Set<string>();

  const segments = autoSchedule(
    rawSegments.flatMap((value, index): Segment[] => {
      if (!isRecord(value)) {
        warnings.push(`区間${index + 1}を読み飛ばしました。`);
        return [];
      }
      const originalId = text(value.id).trim();
      const id = uniqueId(value.id, `segment-${index + 1}`, segmentIds);
      if (!originalId || id !== originalId) {
        warnings.push(`区間${index + 1}のIDを一意な値「${id}」へ補正しました。`);
      }
      const attachmentIds = new Set<string>();
      const attachments = Array.isArray(value.attachments)
        ? value.attachments.flatMap((attachment, attachmentIndex) => {
            const normalized = normalizeAttachment(
              attachment,
              `attachment-${index + 1}-${attachmentIndex + 1}`
            );
            if (!normalized) {
              warnings.push(`区間${index + 1}の不正な添付を読み飛ばしました。`);
              return [];
            }
            const attachmentId = uniqueId(
              normalized.id,
              `attachment-${index + 1}-${attachmentIndex + 1}`,
              attachmentIds
            );
            if (attachmentId !== normalized.id) {
              warnings.push(
                `区間${index + 1}の添付IDを一意な値「${attachmentId}」へ補正しました。`
              );
            }
            return [{ ...normalized, id: attachmentId }];
          })
        : [];
      return [
        {
          id,
          title: text(value.title, `カード${index + 1}`),
          startMin: 0,
          durationMin: finiteNonNegative(value.durationMin),
          pillarId: text(value.pillarId),
          type: segmentType(value.type),
          goal: text(value.goal),
          question: text(value.question),
          script: text(value.script),
          transition: text(value.transition),
          takeaway: text(value.takeaway),
          notes: text(value.notes),
          attachments
        }
      ];
    })
  );

  let pillars = normalizePillars(raw.pillars);
  if (pillars.length === 0 && segments.length > 0) {
    pillars = createDefaultPillars();
    warnings.push("柱が不足していたため既定の柱を補いました。");
  }
  pillars = ensureReferencedPillars(pillars, segments);
  const fallbackPillarId = pillars[0]?.id ?? "";
  const normalizedSegments = segments.map((segment) => ({
    ...segment,
    pillarId: segment.pillarId || fallbackPillarId
  }));

  const plan: SeminarPlan = {
    version: PLAN_VERSION,
    id: text(raw.id, "plan-imported"),
    title: text(raw.title, "読み込んだセミナー"),
    createdAt: text(raw.createdAt, new Date(0).toISOString()),
    updatedAt: text(raw.updatedAt, text(raw.createdAt, new Date(0).toISOString())),
    instructor: text(raw.instructor).trim() || "松本",
    metadata: {
      date: text(rawMetadata.date),
      startTime: text(rawMetadata.startTime, fallbackMetadata.startTime),
      totalDurationMin: finiteNonNegative(
        rawMetadata.totalDurationMin,
        normalizedSegments.reduce((sum, segment) => sum + segment.durationMin, 0)
      ),
      hasBreak: bool(rawMetadata.hasBreak),
      breakDurationMin: finiteNonNegative(
        rawMetadata.breakDurationMin,
        fallbackMetadata.breakDurationMin
      ),
      breakAfterSegmentId: text(rawMetadata.breakAfterSegmentId) || undefined,
      breakLabel: text(rawMetadata.breakLabel, fallbackMetadata.breakLabel),
      location: text(rawMetadata.location),
      audience: text(rawMetadata.audience),
      purpose: text(rawMetadata.purpose),
      customFields: normalizeCustomFields(rawMetadata.customFields)
    },
    pillars,
    segments: normalizedSegments,
    selectedSegmentId: normalizedSegments.some(
      (segment) => segment.id === text(raw.selectedSegmentId)
    )
      ? text(raw.selectedSegmentId)
      : normalizedSegments[0]?.id,
    view:
      raw.view === "cards" ||
      raw.view === "gantt" ||
      raw.view === "script"
        ? raw.view
        : "cards"
  };
  return { plan, warnings };
}

function extractLegacyDate(
  dateTime: string
): { date: string; time: string; unparsed: string } {
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T|\s)?(\d{1,2}:\d{2})?/.exec(dateTime);
  if (iso) {
    return {
      date: `${iso[1]}-${iso[2]}-${iso[3]}`,
      time: iso[4] ?? "",
      unparsed: ""
    };
  }
  const slash = /^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}:\d{2}))?/.exec(dateTime);
  if (slash) {
    return {
      date: `${slash[1]}-${slash[2].padStart(2, "0")}-${slash[3].padStart(2, "0")}`,
      time: slash[4] ?? "",
      unparsed: ""
    };
  }
  const japanese = /^(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*(\d{1,2}:\d{2}))?/.exec(dateTime);
  if (japanese) {
    return {
      date: `${japanese[1]}-${japanese[2].padStart(2, "0")}-${japanese[3].padStart(2, "0")}`,
      time: japanese[4] ?? "",
      unparsed: ""
    };
  }
  return { date: "", time: "", unparsed: dateTime };
}

function isLegacyBreak(raw: RecordValue): boolean {
  if (raw.type === "break" || raw.type === "rest") return true;
  return /^(休憩|break)(?:\s|$|[（(])/i.test(text(raw.title).trim());
}

function joinNonEmpty(values: unknown[], separator = "\n"): string {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  ).join(separator);
}

function legacyAssetDescription(asset: RecordValue): string {
  const details = [
    text(asset.label),
    text(asset.description),
    text(asset.sourceLabel),
    text(asset.sourceUrl),
    text(asset.usageNote)
  ].filter(Boolean);
  return details.join(" / ");
}

function legacyAttachment(
  asset: RecordValue,
  id: string
): { attachment: Attachment | null; note: string } {
  const sourceUrl = text(asset.sourceUrl);
  const label = text(asset.label, text(asset.sourceLabel, sourceUrl));
  const detailNote = joinNonEmpty([text(asset.description), text(asset.usageNote)], " / ");
  if (/^data:image\/[^;,]+(?:;[^,]*)?,/i.test(sourceUrl)) {
    return {
      attachment: {
        id,
        type: "image",
        fileName: text(asset.sourceLabel, label || `${id}.png`),
        dataUrl: sourceUrl,
        ...(label ? { alt: label } : {})
      },
      note: detailNote
    };
  }
  const url = safeUrl(sourceUrl) || safeUrl(asset.description);
  if (url) {
    return {
      attachment: {
        id,
        type: "url",
        label: label || url,
        url
      },
      note: detailNote
    };
  }
  return {
    attachment: null,
    note: legacyAssetDescription(asset)
  };
}

function customFieldFactory() {
  let index = 0;
  return (label: string, value: string): CustomMetaField | null => {
    if (!value.trim()) return null;
    index += 1;
    return { id: `legacy-meta-${index}`, label, value };
  };
}

export function migrateLegacyPlan(
  raw: RecordValue
): { plan: SeminarPlan; warnings: string[] } {
  const warnings: string[] = [];
  const seminar = isRecord(raw.seminar) ? raw.seminar : {};
  const venue = isRecord(seminar.venue) ? seminar.venue : {};
  const audience = isRecord(seminar.audience) ? seminar.audience : {};
  const discussion = isRecord(seminar.discussion) ? seminar.discussion : {};
  const roles = Array.isArray(raw.roles) ? raw.roles.filter(isRecord) : [];
  const roleLabels = new Map(roles.map((role) => [text(role.id), text(role.label, text(role.id))]));
  const rawAssets = Array.isArray(raw.assets) ? raw.assets.filter(isRecord) : [];
  const assetsById = new Map<string, RecordValue>();
  rawAssets.forEach((asset) => {
    const id = text(asset.id);
    if (id && !assetsById.has(id)) assetsById.set(id, asset);
  });
  const referencedAssets = new Set<string>();
  const usedAttachmentIds = new Set<string>();
  const usedSegmentIds = new Set<string>();
  const rawSegments = Array.isArray(raw.segments) ? raw.segments : [];
  if (!Array.isArray(raw.segments)) warnings.push("旧データの segments がなかったため空で移行しました。");

  let firstBreakAfterSegmentId: string | undefined;
  let breakDurationMin = 0;
  let breakLabel = "休憩";
  let breakFound = false;
  let previousSegmentId: string | undefined;
  const migratedSegments: Segment[] = [];

  rawSegments.forEach((value, rawIndex) => {
    if (!isRecord(value)) {
      warnings.push(`旧データの区間${rawIndex + 1}を読み飛ばしました。`);
      return;
    }
    if (isLegacyBreak(value)) {
      if (!breakFound) {
        firstBreakAfterSegmentId = previousSegmentId;
        breakLabel = text(value.title, "休憩");
      }
      breakFound = true;
      breakDurationMin += finiteNonNegative(value.durationMin);
      return;
    }

    const originalId = text(value.id).trim();
    const id = uniqueId(value.id, `segment-${rawIndex + 1}`, usedSegmentIds);
    if (!originalId || id !== originalId) {
      warnings.push(`旧データの区間${rawIndex + 1}のIDを「${id}」へ補正しました。`);
    }
    const speakerNotes = isRecord(value.speakerNotes) ? value.speakerNotes : {};
    const noteEntries = Object.entries(speakerNotes)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1].trim()))
      .sort(([left], [right]) => {
        const lead = text(value.leadRoleId);
        if (left === lead) return -1;
        if (right === lead) return 1;
        return 0;
      });
    const script =
      noteEntries.length <= 1
        ? noteEntries[0]?.[1] ?? ""
        : noteEntries
            .map(([roleId, note]) => `【${roleLabels.get(roleId) || roleId}】\n${note}`)
            .join("\n\n");

    const attachments: Attachment[] = [];
    const assetNotes: string[] = [];
    const assetIds = uniqueStrings(value.assetIds);
    assetIds.forEach((assetId) => {
      referencedAssets.add(assetId);
      const asset = assetsById.get(assetId);
      if (!asset) {
        assetNotes.push(`参照切れ素材: ${assetId}`);
        return;
      }
      let attachmentId = `legacy-${id}-${assetId}`;
      let suffix = 2;
      while (usedAttachmentIds.has(attachmentId)) {
        attachmentId = `legacy-${id}-${assetId}-${suffix}`;
        suffix += 1;
      }
      usedAttachmentIds.add(attachmentId);
      const converted = legacyAttachment(asset, attachmentId);
      if (converted.attachment) attachments.push(converted.attachment);
      if (converted.note) assetNotes.push(`旧素材「${text(asset.label, assetId)}」: ${converted.note}`);
    });

    const discussionValue = isRecord(value.discussion) ? value.discussion : {};
    const notes = joinNonEmpty([
      text(value.notes),
      text(value.leadRoleId) ? `旧担当: ${roleLabels.get(text(value.leadRoleId)) || text(value.leadRoleId)}` : "",
      text(value.audienceMaturity) ? `旧対象者成熟度: ${text(value.audienceMaturity)}` : "",
      text(discussionValue.format) ? `旧対話形式: ${text(discussionValue.format)}` : "",
      ...assetNotes
    ]);
    migratedSegments.push({
      id,
      title: text(value.title, `カード${rawIndex + 1}`),
      startMin: 0,
      durationMin: finiteNonNegative(value.durationMin),
      pillarId: text(value.pillarId),
      type: segmentType(value.type),
      goal: text(value.goal),
      question: text(value.keyQuestion) || text(discussionValue.question),
      script,
      transition: "",
      takeaway: joinNonEmpty([
        text(value.takeaway),
        text(value.participantAction),
        text(discussionValue.output)
      ]),
      notes,
      attachments
    });
    previousSegmentId = id;
  });

  const contextPackId = text(raw.contextPackId);
  let pillars = (LEGACY_PILLARS[contextPackId] ?? []).map((pillar, order) => ({
    ...pillar,
    order
  }));
  pillars = ensureReferencedPillars(pillars, migratedSegments);
  if (pillars.length === 0 && migratedSegments.length > 0) {
    pillars = createDefaultPillars();
    warnings.push("旧データの柱を特定できなかったため既定の柱を補いました。");
  }
  const fallbackPillarId = pillars[0]?.id ?? "";
  const segments = autoSchedule(
    migratedSegments.map((segment) => ({
      ...segment,
      pillarId: segment.pillarId || fallbackPillarId
    }))
  );

  const dateParts = extractLegacyDate(text(seminar.dateTime));
  const audienceRoles = uniqueStrings(audience.roles).map(
    (role) => AUDIENCE_ROLE_LABELS[role] || role
  );
  const maturity = AUDIENCE_MATURITY_LABELS[text(audience.maturity)] || text(audience.maturity);
  const legacyHost = text(seminar.host).trim();
  const addCustom = customFieldFactory();
  const customFields = [
    addCustom("旧主催", legacyHost && legacyHost !== "松本" ? legacyHost : ""),
    addCustom("旧開催日時", dateParts.unparsed),
    addCustom("サブメッセージ", uniqueStrings(seminar.subMessages).join("\n")),
    addCustom("終了後の行動", text(seminar.desiredAction)),
    addCustom("対象者の課題", uniqueStrings(audience.painPoints).join("\n")),
    addCustom("想定される反論", uniqueStrings(audience.objections).join("\n")),
    addCustom("共同開催者", uniqueStrings(seminar.coHosts).join("\n")),
    addCustom("対話の目的", text(discussion.purpose)),
    addCustom("対話の成果物", text(discussion.expectedOutput)),
    addCustom("会場形式", text(venue.type)),
    addCustom("会場レイアウト", text(venue.roomLayout)),
    addCustom("旧備考", text(seminar.notes))
  ].filter((field): field is CustomMetaField => field !== null);

  const orphanAssets = rawAssets.filter((asset) => !referencedAssets.has(text(asset.id)));
  if (orphanAssets.length > 0) {
    const orphanField = addCustom(
      "未割当素材",
      orphanAssets.map((asset) => legacyAssetDescription(asset)).filter(Boolean).join("\n")
    );
    if (orphanField) customFields.push(orphanField);
  }

  const location = joinNonEmpty([
    text(venue.name),
    text(venue.address),
    text(venue.onlineUrlLabel)
  ]);
  const contentAndBreakDuration =
    segments.reduce((sum, segment) => sum + segment.durationMin, 0) + breakDurationMin;
  const durationMin = finiteNonNegative(seminar.durationMin, contentAndBreakDuration);
  const timestamp = text(raw.createdAt, new Date(0).toISOString());
  const plan: SeminarPlan = {
    version: PLAN_VERSION,
    id: text(raw.id, "plan-imported"),
    title: text(raw.title, "読み込んだセミナー"),
    createdAt: timestamp,
    updatedAt: text(raw.updatedAt, timestamp),
    instructor: "松本",
    metadata: {
      date: dateParts.date,
      startTime: text(seminar.startTime) || dateParts.time || "13:30",
      totalDurationMin: durationMin,
      hasBreak: breakFound,
      breakDurationMin: breakFound ? breakDurationMin : 10,
      breakAfterSegmentId: breakFound ? firstBreakAfterSegmentId : undefined,
      breakLabel,
      location,
      audience: joinNonEmpty([...audienceRoles, maturity], "・"),
      purpose: text(seminar.mainMessage),
      customFields
    },
    pillars,
    segments,
    selectedSegmentId: segments.some((segment) => segment.id === text(raw.selectedSegmentId))
      ? text(raw.selectedSegmentId)
      : segments[0]?.id,
    view: raw.view === "gantt" || raw.view === "script" ? raw.view : "cards"
  };
  return { plan, warnings };
}

export function parsePlanJson(textValue: string): ParseResult | ParseError {
  let raw: unknown;
  try {
    raw = JSON.parse(textValue);
  } catch {
    return { ok: false, message: "JSONを読み込めませんでした。ファイル形式を確認してください。" };
  }
  if (!isRecord(raw)) {
    return { ok: false, message: "JSONの内容がセミナー設計データではありません。" };
  }
  const version = text(raw.version);
  if (version && version !== PLAN_VERSION && version !== "1.0.0") {
    return { ok: false, message: `version ${version} はこのツールでは読み込めません。` };
  }

  if (version === PLAN_VERSION || (!version && isRecord(raw.metadata))) {
    const normalized = normalizeV2Plan(raw);
    return {
      ok: true,
      plan: normalized.plan,
      warnings: normalized.warnings,
      migrated: false
    };
  }

  const looksLegacy =
    version === "1.0.0" ||
    isRecord(raw.seminar) ||
    "contextPackId" in raw ||
    "roles" in raw ||
    "assets" in raw;
  if (!looksLegacy) {
    return { ok: false, message: "JSONの内容がセミナー設計データではありません。" };
  }
  if (!isRecord(raw.seminar) || !Array.isArray(raw.segments)) {
    return {
      ok: false,
      message: "旧形式のJSONに必要なセミナー情報またはカード一覧がありません。"
    };
  }
  const migrated = migrateLegacyPlan(raw);
  return {
    ok: true,
    plan: migrated.plan,
    warnings: migrated.warnings,
    migrated: true
  };
}

function serializablePlan(plan: SeminarPlan): SeminarPlan {
  return {
    version: PLAN_VERSION,
    id: plan.id,
    title: plan.title,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    instructor: plan.instructor,
    metadata: {
      ...plan.metadata,
      customFields: plan.metadata.customFields.map((field) => ({ ...field }))
    },
    pillars: plan.pillars.map((pillar, order) => ({ ...pillar, order })),
    segments: autoSchedule(plan.segments).map((segment) => ({
      id: segment.id,
      title: segment.title,
      startMin: segment.startMin,
      durationMin: segment.durationMin,
      pillarId: segment.pillarId,
      type: segment.type,
      goal: segment.goal,
      question: segment.question,
      script: segment.script,
      transition: segment.transition,
      takeaway: segment.takeaway,
      notes: segment.notes,
      attachments: segment.attachments.map((attachment) => ({ ...attachment }))
    })),
    selectedSegmentId: plan.selectedSegmentId,
    view: plan.view
  };
}

export function serializePlan(plan: SeminarPlan): string {
  return JSON.stringify(serializablePlan(plan), null, 2);
}

export function getPlanFileName(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `seminar-design-plan-${year}${month}${day}-${hour}${minute}.json`;
}
