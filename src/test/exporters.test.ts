import { describe, expect, it } from "vitest";
import { tkcContextPack } from "../contextPacks/tkc";
import { createPlanFromTemplate } from "../domain/defaults";
import {
  generateAllOutputs,
  generateAgendaTable,
  generateDiscussionSheet,
  generateFollowUpEmail,
  generatePlanningMemo,
  generateRoleNotes
} from "../domain/exporters";
import { evaluatePlan } from "../domain/scoring";

function plan() {
  const base = createPlanFromTemplate(tkcContextPack, tkcContextPack.templates[0]);
  base.title = "月次決算体制セミナー";
  base.seminar.host = "松本会計";
  base.seminar.mainMessage = "月次決算を経営者の意思決定につなげる";
  return base;
}

describe("exporters", () => {
  it("企画メモにタイトル、主催者、メインメッセージが含まれる", () => {
    const target = plan();
    const memo = generatePlanningMemo(target, tkcContextPack, evaluatePlan(target, tkcContextPack));
    expect(memo).toContain(target.title);
    expect(memo).toContain(target.seminar.host);
    expect(memo).toContain(target.seminar.mainMessage);
  });

  it("当日進行表に全segmentsが含まれる", () => {
    const target = plan();
    const agenda = generateAgendaTable(target, tkcContextPack);
    target.segments.forEach((segment) => expect(agenda).toContain(segment.title));
  });

  it("講師別メモがroleごとに分かれる", () => {
    const target = plan();
    const notes = generateRoleNotes(target, tkcContextPack);
    target.roles.forEach((role) => expect(notes).toContain(`## ${role.label}`));
  });

  it("ディスカッション設問シートがdiscussion区間のみを抽出する", () => {
    const target = plan();
    const sheet = generateDiscussionSheet(target);
    const discussionTitle = target.segments.find((segment) => segment.discussion?.enabled)?.title;
    const lectureTitle = target.segments.find((segment) => !segment.discussion?.enabled && segment.type === "lecture")?.title;
    expect(sheet).toContain(discussionTitle);
    expect(sheet).not.toContain(lectureTitle);
  });

  it("フォロー文面にdesiredActionが含まれる", () => {
    const target = plan();
    expect(generateFollowUpEmail(target)).toContain(target.seminar.desiredAction);
  });

  it("6種類の出力が順序とファイル名付きで生成される", () => {
    const target = plan();
    const outputs = generateAllOutputs(target, tkcContextPack, evaluatePlan(target, tkcContextPack));
    expect(outputs.map((output) => output.id)).toEqual([
      "planning",
      "agenda",
      "script",
      "role-notes",
      "discussion",
      "follow-up"
    ]);
    expect(outputs.map((output) => output.fileName)).toEqual([
      "planning-memo.md",
      "agenda.md",
      "facilitator-script.md",
      "role-notes.md",
      "discussion-sheet.md",
      "follow-up-email.md"
    ]);
    expect(outputs[2].content).toContain("ファシリテーター台本");
  });
});
