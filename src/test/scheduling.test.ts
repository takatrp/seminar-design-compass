import { describe, expect, it } from "vitest";
import { createDefaultPlan } from "../domain/defaults";
import {
  autoSchedule,
  buildTimeline,
  duplicateSegment,
  moveSegment,
  removeSegment
} from "../domain/scheduling";
import type { Segment } from "../domain/types";

function segment(id: string, durationMin: number): Segment {
  return {
    id,
    title: id,
    startMin: 999,
    durationMin,
    pillarId: "introduction",
    type: "lecture",
    goal: "",
    question: "",
    script: "",
    transition: "",
    takeaway: "",
    notes: "",
    attachments: []
  };
}

describe("カードの並べ替えと時間計算", () => {
  it("startMinを順番に再計算し、負の所要時間を0にする", () => {
    const scheduled = autoSchedule([segment("a", 10), segment("b", -8), segment("c", 5)]);
    expect(scheduled.map((item) => item.durationMin)).toEqual([10, 0, 5]);
    expect(scheduled.map((item) => item.startMin)).toEqual([0, 10, 10]);
  });

  it("複製、移動、削除後も再計算し、添付を深く複製する", () => {
    const original = segment("a", 10);
    original.attachments = [
      { id: "image-1", type: "image", fileName: "sample.png", dataUrl: "data:image/png;base64,AA==" }
    ];
    const duplicated = duplicateSegment(
      autoSchedule([original, segment("b", 20)]),
      "a",
      () => "copy"
    );
    expect(duplicated.map((item) => item.id)).toEqual(["a", "copy", "b"]);
    expect(duplicated.map((item) => item.startMin)).toEqual([0, 10, 20]);
    expect(duplicated[1].title).toBe("a（複製）");
    expect(duplicated[1].attachments).not.toBe(duplicated[0].attachments);

    const moved = moveSegment(duplicated, "b", "up");
    expect(moved.map((item) => item.id)).toEqual(["a", "b", "copy"]);
    const removed = removeSegment(moved, "a");
    expect(removed.map((item) => [item.id, item.startMin])).toEqual([
      ["b", 0],
      ["copy", 20]
    ]);
  });
});

describe("buildTimeline", () => {
  it("指定したカードの直後へ休憩を挿入し、後続の実開始分へ反映する", () => {
    const plan = createDefaultPlan();
    plan.segments = autoSchedule([segment("a", 10), segment("b", 20)]);
    plan.metadata.hasBreak = true;
    plan.metadata.breakDurationMin = 5;
    plan.metadata.breakAfterSegmentId = "a";
    plan.metadata.breakLabel = "コーヒーブレイク";

    const timeline = buildTimeline(plan);
    expect(timeline.map((item) => [item.kind, item.id, item.startMin])).toEqual([
      ["segment", "a", 0],
      ["break", "seminar-break", 10],
      ["segment", "b", 15]
    ]);
    expect(timeline[1].title).toBe("コーヒーブレイク");
  });

  it("休憩位置が未設定または不正なら全カードの後へ置く", () => {
    const plan = createDefaultPlan();
    plan.segments = autoSchedule([segment("a", 10), segment("b", 20)]);
    plan.metadata.hasBreak = true;
    plan.metadata.breakDurationMin = 5;
    plan.metadata.breakAfterSegmentId = "missing";

    expect(buildTimeline(plan).map((item) => [item.kind, item.startMin])).toEqual([
      ["segment", 0],
      ["segment", 10],
      ["break", 30]
    ]);
  });
});
