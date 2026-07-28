import { describe, expect, it } from "vitest";
import { createDefaultPlan } from "../domain/defaults";
import { migrateLegacyPlan, parsePlanJson, serializePlan } from "../domain/validation";

function legacyPlan() {
  return {
    version: "1.0.0",
    id: "legacy-plan",
    title: "旧セミナー",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-02T00:00:00.000Z",
    contextPackId: "generic",
    seminar: {
      dateTime: "2026年8月5日 14:00",
      startTime: "",
      durationMin: 50,
      host: "松本",
      coHosts: [],
      mainMessage: "明日から実践できる判断軸を持ち帰る",
      subMessages: ["背景を理解する"],
      desiredAction: "一つ試す",
      venue: {
        type: "onsite",
        name: "神戸会場",
        address: "神戸市中央区"
      },
      audience: {
        roles: ["firmOwner", "firmStaff"],
        maturity: "mixed",
        painPoints: ["進め方が分からない"],
        objections: []
      },
      discussion: {
        enabled: true,
        format: "group",
        purpose: "自分ごとにする",
        expectedOutput: "行動メモ"
      },
      notes: ""
    },
    roles: [
      { id: "speaker", label: "講師", shortLabel: "講師", type: "speaker" }
    ],
    assets: [
      {
        id: "image",
        label: "図解",
        kind: "image",
        description: "全体像",
        sourceLabel: "overview.png",
        sourceUrl: "data:image/png;base64,AA==",
        usageNote: "導入で見せる"
      },
      {
        id: "site",
        label: "参考サイト",
        kind: "url",
        description: "",
        sourceUrl: "https://example.com/reference"
      },
      {
        id: "memo",
        label: "手元メモ",
        kind: "memo",
        description: "補足事項"
      }
    ],
    segments: [
      {
        id: "intro",
        title: "導入",
        startMin: 0,
        durationMin: 10,
        leadRoleId: "speaker",
        pillarId: "purpose",
        type: "opening",
        audienceMaturity: "mixed",
        goal: "目的を共有する",
        keyQuestion: "何を持ち帰りますか",
        speakerNotes: { speaker: "本日はご参加ありがとうございます。" },
        participantAction: "ゴールを書く",
        takeaway: "今日のゴール",
        assetIds: ["image", "site", "memo"]
      },
      {
        id: "break",
        title: "休憩（10分）",
        startMin: 10,
        durationMin: 10,
        type: "break"
      },
      {
        id: "main",
        title: "本編",
        startMin: 20,
        durationMin: 30,
        leadRoleId: "speaker",
        pillarId: "practice",
        type: "lecture",
        goal: "実践方法を伝える",
        keyQuestion: "",
        speakerNotes: { speaker: "具体例を説明します。" },
        participantAction: "",
        takeaway: "実践手順",
        assetIds: []
      }
    ],
    selectedSegmentId: "intro",
    view: "gantt"
  };
}

describe("v2 JSON import/export", () => {
  it("画像data URLを含めて往復しても同じplanになる", () => {
    const plan = createDefaultPlan();
    plan.segments[0].attachments.push({
      id: "image-1",
      type: "image",
      fileName: "sample.png",
      dataUrl: "data:image/png;base64,AA==",
      alt: "サンプル"
    });
    const parsed = parsePlanJson(serializePlan(plan));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.plan).toEqual(plan);
      expect(parsed.migrated).toBe(false);
    }
  });

  it("将来version、JSON以外、無関係なobjectを拒否する", () => {
    expect(parsePlanJson("{broken").ok).toBe(false);
    expect(parsePlanJson("[]").ok).toBe(false);
    expect(parsePlanJson("{}").ok).toBe(false);
    expect(parsePlanJson('{"version":"1.0.0"}').ok).toBe(false);
    expect(
      parsePlanJson(JSON.stringify({ version: "3.0.0", metadata: {}, segments: [] })).ok
    ).toBe(false);
  });

  it("空または重複したカードIDと添付IDを一意な値へ補正する", () => {
    const raw = JSON.parse(serializePlan(createDefaultPlan()));
    raw.segments[0].id = "";
    raw.segments[0].attachments = [
      { id: "same", type: "url", label: "A", url: "https://example.com/a" },
      { id: "same", type: "url", label: "B", url: "https://example.com/b" }
    ];
    raw.segments[1].id = "duplicate";
    raw.segments[2].id = "duplicate";
    const parsed = parsePlanJson(JSON.stringify(raw));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      const segmentIds = parsed.plan.segments.map((segment) => segment.id);
      expect(new Set(segmentIds).size).toBe(segmentIds.length);
      const attachmentIds = parsed.plan.segments[0].attachments.map(
        (attachment) => attachment.id
      );
      expect(new Set(attachmentIds).size).toBe(attachmentIds.length);
      expect(parsed.warnings.some((warning) => warning.includes("ID"))).toBe(true);
    }
  });
});

describe("v1 migration", () => {
  it("旧planを非破壊でv2へ移し、柱・休憩・台本・問い・添付を保持する", () => {
    const legacy = legacyPlan();
    const snapshot = structuredClone(legacy);
    const migrated = migrateLegacyPlan(legacy);

    expect(legacy).toEqual(snapshot);
    expect(migrated.plan.version).toBe("2.0.0");
    expect(migrated.plan.id).toBe("legacy-plan");
    expect(migrated.plan.metadata.date).toBe("2026-08-05");
    expect(migrated.plan.metadata.startTime).toBe("14:00");
    expect(migrated.plan.metadata.hasBreak).toBe(true);
    expect(migrated.plan.metadata.breakDurationMin).toBe(10);
    expect(migrated.plan.metadata.breakAfterSegmentId).toBe("intro");
    expect(migrated.plan.segments.map((segment) => segment.id)).toEqual(["intro", "main"]);
    expect(migrated.plan.segments[0].question).toBe("何を持ち帰りますか");
    expect(migrated.plan.segments[0].script).toContain("本日はご参加ありがとうございます");
    expect(migrated.plan.segments[0].takeaway).toContain("ゴールを書く");
    expect(migrated.plan.segments[0].attachments.map((attachment) => attachment.type)).toEqual([
      "image",
      "url"
    ]);
    expect(migrated.plan.segments[0].notes).toContain("手元メモ");
    expect(migrated.plan.pillars.map((pillar) => pillar.id)).toContain("practice");
  });

  it("version未設定の旧JSONも認識して移行する", () => {
    const legacy = legacyPlan();
    delete (legacy as { version?: string }).version;
    const parsed = parsePlanJson(JSON.stringify(legacy));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.migrated).toBe(true);
      expect(parsed.plan.version).toBe("2.0.0");
    }
  });

  it("未知の柱参照を消さずにプレースホルダーを作る", () => {
    const legacy = legacyPlan();
    legacy.contextPackId = "unknown";
    legacy.segments[0].pillarId = "original-pillar";
    const migrated = migrateLegacyPlan(legacy);
    expect(migrated.plan.pillars).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "original-pillar", title: expect.stringContaining("旧データ") })
      ])
    );
    expect(migrated.plan.segments[0].pillarId).toBe("original-pillar");
  });
});
