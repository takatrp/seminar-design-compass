import { describe, expect, it } from "vitest";
import { createBlankPillar, createDefaultPlan } from "../domain/defaults";
import { addPillar, movePillar, removePillar, updatePillar } from "../domain/pillars";

describe("柱の編集", () => {
  it("追加・編集・並べ替えでorderを連番に保つ", () => {
    const plan = createDefaultPlan();
    const added = addPillar(plan.pillars, {
      ...createBlankPillar(plan.pillars.length),
      id: "custom"
    });
    const updated = updatePillar(added, "custom", {
      title: "自由な柱",
      description: "自由に編集できる",
      color: "#112233",
      id: "ignored"
    });
    const moved = movePillar(updated, "custom", "up");
    expect(moved.at(-2)).toEqual(
      expect.objectContaining({
        id: "custom",
        title: "自由な柱",
        description: "自由に編集できる",
        color: "#112233"
      })
    );
    expect(moved.map((pillar) => pillar.order)).toEqual([0, 1, 2, 3, 4]);
  });

  it("使用中の柱を削除したら先頭の残存柱へカードを付け替える", () => {
    const plan = createDefaultPlan();
    const removedId = plan.segments[0].pillarId;
    const next = removePillar(plan, removedId);
    expect(next.pillars.some((pillar) => pillar.id === removedId)).toBe(false);
    expect(next.segments[0].pillarId).toBe(next.pillars[0].id);
  });
});
