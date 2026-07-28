import { describe, expect, it } from "vitest";
import { createDefaultPlan } from "../domain/defaults";
import {
  formatClockRange,
  generateAllOutputs,
  generateFacilitatorScript,
  generateMarkdown
} from "../domain/exporters";
import { buildTimeline } from "../domain/scheduling";

function plan() {
  const target = createDefaultPlan();
  target.title = "月次決算セミナー";
  target.instructor = "松本";
  target.metadata.date = "2026-08-05";
  target.metadata.startTime = "13:30";
  target.metadata.location = "神戸会場";
  target.metadata.audience = "経営者";
  target.metadata.purpose = "判断軸と最初の行動を持ち帰る";
  target.metadata.hasBreak = true;
  target.metadata.breakDurationMin = 10;
  target.metadata.breakAfterSegmentId = target.segments[1].id;
  target.segments[0].script = "本日はご参加ありがとうございます。";
  target.segments[0].attachments = [
    {
      id: "url-1",
      type: "url",
      label: "参考資料",
      url: "https://example.com/reference"
    },
    {
      id: "image-1",
      type: "image",
      fileName: "overview.png",
      dataUrl: "data:image/png;base64,AA==",
      alt: "全体像"
    }
  ];
  return target;
}

describe("Markdown・台本出力", () => {
  it("設計書に自由メタデータ、柱、全カード、添付が含まれる", () => {
    const target = plan();
    target.metadata.customFields.push({
      id: "meta-1",
      label: "持ち物",
      value: "筆記用具"
    });
    const markdown = generateMarkdown(target);
    expect(markdown).toContain(target.title);
    expect(markdown).toContain("持ち物: 筆記用具");
    target.pillars.forEach((pillar) => expect(markdown).toContain(pillar.title));
    target.segments.forEach((segment) => expect(markdown).toContain(segment.title));
    expect(markdown).toContain("[参考資料](https://example.com/reference)");
    expect(markdown).toContain("overview.png");
  });

  it("休憩を台本へ挿入し、後続カードの時刻を繰り下げる", () => {
    const target = plan();
    const timeline = buildTimeline(target);
    const breakItem = timeline.find((item) => item.kind === "break");
    const following = timeline[timeline.indexOf(breakItem!) + 1];
    const script = generateFacilitatorScript(target);

    expect(script).toContain("### 休憩");
    expect(script).toContain(formatClockRange(target, breakItem!));
    expect(script).toContain(formatClockRange(target, following));
    expect(script).toContain("問い:");
    expect(script).toContain("次へのつなぎ");
    expect(script).toContain("持ち帰り:");
    expect(script).toContain("参考資料");
  });

  it("設計書と講師台本の2種類をファイル名付きで生成する", () => {
    const outputs = generateAllOutputs(plan());
    expect(outputs.map((output) => output.id)).toEqual(["markdown", "script"]);
    expect(outputs.map((output) => output.fileName)).toEqual([
      "seminar-plan.md",
      "seminar-script.md"
    ]);
  });
});
