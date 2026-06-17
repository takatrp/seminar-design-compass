import { describe, expect, it } from "vitest";
import { autoSchedule, duplicateSegment, removeSegment } from "../domain/scheduling";
import type { Segment } from "../domain/types";

function segment(id: string, durationMin: number): Segment {
  return {
    id,
    title: id,
    startMin: 999,
    durationMin,
    leadRoleId: "speaker",
    pillarId: "purpose",
    type: "lecture",
    audienceMaturity: "mixed",
    goal: "",
    keyQuestion: "",
    speakerNotes: {},
    participantAction: "",
    takeaway: "",
    assetIds: []
  };
}

describe("autoSchedule", () => {
  it("startMinを順番に再計算する", () => {
    const scheduled = autoSchedule([segment("a", 10), segment("b", 20), segment("c", 5)]);
    expect(scheduled.map((item) => item.startMin)).toEqual([0, 10, 30]);
  });

  it("durationMinが負数の場合に0に丸める", () => {
    const scheduled = autoSchedule([segment("a", 10), segment("b", -8), segment("c", 5)]);
    expect(scheduled.map((item) => item.durationMin)).toEqual([10, 0, 5]);
    expect(scheduled.map((item) => item.startMin)).toEqual([0, 10, 10]);
  });

  it("複製・削除後も再計算する", () => {
    const duplicated = duplicateSegment(autoSchedule([segment("a", 10), segment("b", 20)]), "a", () => "copy");
    expect(duplicated.map((item) => item.startMin)).toEqual([0, 10, 20]);
    const removed = removeSegment(duplicated, "a");
    expect(removed.map((item) => item.startMin)).toEqual([0, 10]);
  });
});
