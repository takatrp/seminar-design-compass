import { audienceMaturities, segmentTypes, templateSegment } from "./shared";
import { sumDuration } from "../domain/scheduling";
import type { CheckResult, ContextPack, SeminarPlan, SeminarTemplate, Segment } from "../domain/types";

const tkcRoles = [
  { id: "facilitator", label: "ファシリテーター", shortLabel: "進行", type: "facilitator" as const },
  { id: "speaker", label: "講師", shortLabel: "講師", type: "speaker" as const },
  { id: "panelist", label: "事例共有者", shortLabel: "事例", type: "panelist" as const },
  { id: "staff", label: "運営担当", shortLabel: "運営", type: "staff" as const }
];

const tkcSeminarPatch = {
  mainMessage: "信頼できる月次決算を土台に、経営者の意思決定と次の行動につなげる",
  subMessages: ["自計化を土台にする", "巡回監査と月次決算体制を整える", "経営助言・継続MASへ接続する"],
  desiredAction: "まず1社を選び、次回面談で月次決算体制の確認と次の打ち手を実践する",
  discussion: {
    enabled: true,
    format: "group" as const,
    purpose: "参加者の現在地をそろえ、まず1社で実践する具体策を作る",
    expectedOutput: "まず1社で試す行動メモ"
  }
};

const templates: SeminarTemplate[] = [
  {
    id: "tkc-monthly-close-120",
    label: "月次決算体制構築セミナー 120分",
    description: "自計化から巡回監査、月次決算体制、経営助言へ接続する標準構成です。",
    recommendedDurationMin: 120,
    seminarPatch: { ...tkcSeminarPatch, durationMin: 120 },
    segments: [
      templateSegment({
        title: "導入：月次決算体制がなぜ今の基本なのか",
        durationMin: 10,
        type: "opening",
        pillarId: "tkc-context",
        goal: "月次決算体制を扱う意味を確認する",
        keyQuestion: "なぜ今、月次決算体制を改めて扱う必要がありますか。",
        takeaway: "本日の論点と到達点"
      }),
      templateSegment({
        title: "現在地確認：自計化・月次決算のつまずき",
        durationMin: 15,
        type: "discussion",
        pillarId: "tkc-context",
        goal: "参加者の現状とつまずきをそろえる",
        keyQuestion: "自計化・月次決算で一番詰まっている点はどこですか。",
        takeaway: "現状のつまずき",
        participantAction: "自所または顧問先のつまずきを書き出す",
        discussion: {
          enabled: true,
          format: "group",
          question: "月次決算体制をつくる上で、現場では何が止まりやすいですか。",
          output: "つまずき一覧"
        }
      }),
      templateSegment({
        title: "土台：TKC方式の自計化をどう位置づけるか",
        durationMin: 20,
        type: "lecture",
        pillarId: "tkc-self-accounting",
        goal: "自計化を月次決算の土台として理解する",
        keyQuestion: "自計化は何のための土台ですか。",
        takeaway: "自計化の位置づけ"
      }),
      templateSegment({
        title: "中核：巡回監査と月次決算体制の設計",
        durationMin: 25,
        type: "lecture",
        pillarId: "tkc-monthly-close-audit",
        goal: "巡回監査と月次決算体制の要点を押さえる",
        keyQuestion: "信頼できる月次決算体制には何が必要ですか。",
        takeaway: "巡回監査と月次決算体制の要点"
      }),
      templateSegment({
        title: "実践：経営者に数字をどう伝えるか",
        durationMin: 20,
        type: "case",
        pillarId: "tkc-performance",
        goal: "数字を経営者の意思決定につなげる",
        keyQuestion: "経営者はどの数字を見て次の打ち手を決めますか。",
        takeaway: "業績管理と意思決定の接続",
        leadRoleId: "panelist",
        participantAction: "伝え方の候補を1つ選ぶ"
      }),
      templateSegment({
        title: "接続：経営助言・継続MASへどう進めるか",
        durationMin: 15,
        type: "dialogue",
        pillarId: "tkc-advisory-mas",
        goal: "月次決算後の経営助言につなげる",
        keyQuestion: "継続MASへ進む前に、どの状態を整えますか。",
        takeaway: "経営助言への接続条件",
        participantAction: "次回面談で確認する問いを選ぶ"
      }),
      templateSegment({
        title: "行動宣言：まず1社で何を変えるか",
        durationMin: 15,
        type: "closing",
        pillarId: "tkc-action-standardization",
        goal: "まず1社で実践する行動を決める",
        keyQuestion: "まず1社で何を変えますか。",
        takeaway: "まず1社で実践する行動",
        participantAction: "まず1社・次回面談で実践する内容を宣言する"
      })
    ]
  },
  {
    id: "tkc-self-accounting-90",
    label: "TKC方式の自計化導入セミナー 90分",
    description: "自計化の意味と導入初期の進め方を実践に落とす構成です。",
    recommendedDurationMin: 90,
    seminarPatch: {
      ...tkcSeminarPatch,
      durationMin: 90,
      mainMessage: "自計化を経営者の意思決定につながる土台として導入する"
    },
    segments: [
      templateSegment({
        title: "導入：自計化を扱う目的",
        durationMin: 10,
        type: "opening",
        pillarId: "tkc-context",
        goal: "自計化の目的を確認する",
        keyQuestion: "自計化は誰の何を変えるために必要ですか。",
        takeaway: "自計化の目的"
      }),
      templateSegment({
        title: "土台：会計帳簿と仕訳の意味",
        durationMin: 20,
        type: "lecture",
        pillarId: "tkc-self-accounting",
        goal: "自計化の基本を理解する",
        keyQuestion: "経営者が自社の数字を見るために何が必要ですか。",
        takeaway: "会計帳簿と仕訳の位置づけ"
      }),
      templateSegment({
        title: "導入手順：まず確認すること",
        durationMin: 20,
        type: "lecture",
        pillarId: "tkc-self-accounting",
        goal: "導入の手順を具体化する",
        keyQuestion: "導入初期に確認すべき業務は何ですか。",
        takeaway: "導入初期チェック"
      }),
      templateSegment({
        title: "事例：つまずきと支援の仕方",
        durationMin: 15,
        type: "case",
        pillarId: "tkc-monthly-close-audit",
        goal: "導入時のつまずきに備える",
        keyQuestion: "どのつまずきに先回りしますか。",
        takeaway: "つまずき対応"
      }),
      templateSegment({
        title: "ワーク：まず1社の導入計画",
        durationMin: 15,
        type: "work",
        pillarId: "tkc-action-standardization",
        goal: "まず1社の導入計画を作る",
        keyQuestion: "まず1社で、いつ何を確認しますか。",
        takeaway: "導入計画",
        participantAction: "対象先と初回確認項目を書く",
        discussion: {
          enabled: true,
          format: "pair",
          question: "まず1社を選ぶなら、どの顧問先から始めますか。",
          output: "対象先と初回確認項目"
        }
      }),
      templateSegment({
        title: "まとめ：次回面談につなげる",
        durationMin: 10,
        type: "closing",
        pillarId: "tkc-action-standardization",
        goal: "次回面談の行動を決める",
        keyQuestion: "次回面談で何を話しますか。",
        takeaway: "次回面談の問い",
        participantAction: "次回面談で使う問いを1つ決める"
      })
    ]
  },
  {
    id: "tkc-mas-performance-120",
    label: "業績管理・継続MAS接続セミナー 120分",
    description: "業績管理から経営助言、継続MASへの接続を扱います。",
    recommendedDurationMin: 120,
    seminarPatch: {
      ...tkcSeminarPatch,
      durationMin: 120,
      mainMessage: "月次決算を業績管理と経営助言につなげ、経営者の次の打ち手を支える"
    },
    segments: [
      templateSegment({
        title: "導入：月次決算後に何を支援するか",
        durationMin: 10,
        type: "opening",
        pillarId: "tkc-context",
        goal: "月次決算後の支援の論点を確認する",
        keyQuestion: "月次決算後、経営者は何を決めたいですか。",
        takeaway: "月次決算後の支援論点"
      }),
      templateSegment({
        title: "前提：自計化と月次決算体制",
        durationMin: 20,
        type: "lecture",
        pillarId: "tkc-monthly-close-audit",
        goal: "業績管理に進む前提を確認する",
        keyQuestion: "業績管理の前提として何を整えますか。",
        takeaway: "業績管理の前提条件"
      }),
      templateSegment({
        title: "業績管理：限界利益と打ち手",
        durationMin: 25,
        type: "lecture",
        pillarId: "tkc-performance",
        goal: "業績管理の観点を理解する",
        keyQuestion: "限界利益から何を判断しますか。",
        takeaway: "業績管理の見方"
      }),
      templateSegment({
        title: "ケース：経営者への伝え方",
        durationMin: 20,
        type: "case",
        pillarId: "tkc-performance",
        goal: "数字を行動につなげる伝え方を学ぶ",
        keyQuestion: "経営者が動ける伝え方は何ですか。",
        takeaway: "経営者に届く問い",
        leadRoleId: "panelist"
      }),
      templateSegment({
        title: "接続：経営助言・継続MASの入口",
        durationMin: 20,
        type: "dialogue",
        pillarId: "tkc-advisory-mas",
        goal: "経営助言と継続MASへの接続を考える",
        keyQuestion: "継続MASに進む前に、どの合意が必要ですか。",
        takeaway: "継続MASへの接続条件",
        participantAction: "面談で確認する合意事項を書く"
      }),
      templateSegment({
        title: "ワーク：次の面談設計",
        durationMin: 15,
        type: "work",
        pillarId: "tkc-action-standardization",
        goal: "次の面談で使う問いを設計する",
        keyQuestion: "まず1社でどの問いを投げますか。",
        takeaway: "面談設計メモ",
        participantAction: "まず1社の面談設計を書く",
        discussion: {
          enabled: true,
          format: "group",
          question: "経営者に次の打ち手を考えてもらう問いは何ですか。",
          output: "面談設計メモ"
        }
      }),
      templateSegment({
        title: "まとめ：実践宣言",
        durationMin: 10,
        type: "closing",
        pillarId: "tkc-action-standardization",
        goal: "実践宣言を残す",
        keyQuestion: "次回面談で実践することは何ですか。",
        takeaway: "実践宣言",
        participantAction: "次回面談で実践する問いを宣言する"
      })
    ]
  },
  {
    id: "tkc-new-member-90",
    label: "新規・若手向けTKC本筋理解セミナー 90分",
    description: "新規・若手向けに、基本の流れを短時間で理解する構成です。",
    recommendedDurationMin: 90,
    seminarPatch: {
      ...tkcSeminarPatch,
      durationMin: 90,
      mainMessage: "自計化、月次決算体制、経営助言の流れを一つの筋として理解する",
      audience: {
        roles: ["newMember", "firmStaff"],
        maturity: "beginner",
        painPoints: ["全体像がつながりにくい"],
        objections: ["個別機能の理解で止まりやすい"]
      }
    },
    segments: [
      templateSegment({
        title: "導入：全体像をつなげて見る",
        durationMin: 10,
        type: "opening",
        pillarId: "tkc-context",
        goal: "本筋の全体像を確認する",
        keyQuestion: "自計化から経営助言まで、どこがつながっていますか。",
        takeaway: "全体像"
      }),
      templateSegment({
        title: "土台：自計化と会計帳簿",
        durationMin: 15,
        type: "lecture",
        pillarId: "tkc-self-accounting",
        goal: "自計化の土台を理解する",
        keyQuestion: "経営者が数字を見られる状態とは何ですか。",
        takeaway: "自計化の土台"
      }),
      templateSegment({
        title: "中核：月次決算体制と巡回監査",
        durationMin: 20,
        type: "lecture",
        pillarId: "tkc-monthly-close-audit",
        goal: "月次決算体制と巡回監査の役割を理解する",
        keyQuestion: "月次決算体制は何を支えていますか。",
        takeaway: "月次決算体制の役割"
      }),
      templateSegment({
        title: "接続：業績管理と経営者の意思決定",
        durationMin: 15,
        type: "case",
        pillarId: "tkc-performance",
        goal: "業績管理が意思決定につながる流れを理解する",
        keyQuestion: "数字から経営者は何を決めますか。",
        takeaway: "業績管理と意思決定"
      }),
      templateSegment({
        title: "対話：自分の言葉で説明する",
        durationMin: 15,
        type: "dialogue",
        pillarId: "tkc-advisory-mas",
        goal: "本筋を自分の言葉にする",
        keyQuestion: "顧問先に説明するならどう伝えますか。",
        takeaway: "自分の説明文",
        participantAction: "説明文をペアで話す",
        discussion: {
          enabled: true,
          format: "pair",
          question: "顧問先に説明するなら、どんな順序で話しますか。",
          output: "説明文"
        }
      }),
      templateSegment({
        title: "まとめ：まず1社で見るポイント",
        durationMin: 15,
        type: "closing",
        pillarId: "tkc-action-standardization",
        goal: "まず1社で確認するポイントを決める",
        keyQuestion: "まず1社で何を観察しますか。",
        takeaway: "まず1社で見るポイント",
        participantAction: "まず1社で確認するポイントを1つ書く"
      })
    ]
  }
];

type CheckStatus = CheckResult["status"];

function ratio(part: number, total: number): number {
  if (total <= 0) return 0;
  return part / total;
}

function hasContent(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function containsAny(text: string, words: string[]): boolean {
  return words.some((word) => word.trim() && text.includes(word.trim()));
}

function textOfSegment(segment: Segment): string {
  return [
    segment.title,
    segment.goal,
    segment.keyQuestion,
    segment.participantAction,
    segment.takeaway,
    ...Object.values(segment.speakerNotes ?? {}),
    segment.discussion?.question ?? "",
    segment.discussion?.output ?? ""
  ].join(" ");
}

function checkResult(
  id: string,
  label: string,
  status: CheckStatus,
  weight: number,
  message: string,
  suggestion: string
): CheckResult {
  const score = status === "ok" ? weight : status === "warn" ? weight / 2 : 0;
  return { id, label, status, score, maxScore: weight, message, suggestion };
}

function evaluateTkcChecks(plan: SeminarPlan, pack: ContextPack): CheckResult[] {
  const total = sumDuration(plan.segments);
  const usedPillars = new Set(plan.segments.map((segment) => segment.pillarId));
  const monthlyCloseTime = plan.segments
    .filter((segment) => segment.pillarId === "tkc-monthly-close-audit")
    .reduce((sum, segment) => sum + segment.durationMin, 0);
  const selfIndex = plan.segments.findIndex((segment) => segment.pillarId === "tkc-self-accounting");
  const masIndex = plan.segments.findIndex((segment) => segment.pillarId === "tkc-advisory-mas");
  const performanceIndex = plan.segments.findIndex((segment) => segment.pillarId === "tkc-performance");
  const riskTime = plan.segments
    .filter((segment) => containsAny(textOfSegment(segment), pack.riskWords))
    .reduce((sum, segment) => sum + segment.durationMin, 0);
  const foundationRatio = ratio(
    plan.segments
      .filter((segment) => segment.pillarId === "tkc-self-accounting" || segment.pillarId === "tkc-monthly-close-audit")
      .reduce((sum, segment) => sum + segment.durationMin, 0),
    total
  );
  const actionText = [
    plan.seminar.desiredAction,
    ...plan.segments
      .filter((segment) => segment.type === "closing" || segment.type === "summary")
      .map((segment) => segment.participantAction)
  ].join(" ");
  const closingAction = plan.segments
    .filter((segment) => segment.type === "closing" || segment.type === "summary")
    .some((segment) => hasContent(segment.participantAction));
  const actionWords = ["まず", "1社", "一社", "次回", "面談", "実践"];
  const demoSegments = plan.segments
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment }) => segment.type === "demo");
  const demoOk = demoSegments.every(({ segment, index }) => {
    const next = plan.segments[index + 1];
    return (
      hasContent(segment.participantAction) ||
      hasContent(segment.takeaway) ||
      hasContent(next?.participantAction) ||
      hasContent(next?.takeaway)
    );
  });
  const demoHasNotes = demoSegments.some(({ segment }) => Object.values(segment.speakerNotes ?? {}).some(hasContent));
  const tkcPillarCount = pack.pillars.filter((pillar) => usedPillars.has(pillar.id)).length;
  const riskRatio = ratio(riskTime, total);
  const riskStatus =
    riskRatio <= 0.35 || (foundationRatio >= 0.3 && riskRatio <= 0.5)
      ? "ok"
      : riskRatio <= 0.5 || (foundationRatio >= 0.3 && riskRatio <= 0.6)
        ? "warn"
        : "bad";

  return [
    checkResult(
      "T1",
      "TKC本筋の柱の存在",
      tkcPillarCount >= 4 ? "ok" : tkcPillarCount === 3 ? "warn" : "bad",
      10,
      `6本柱のうち${tkcPillarCount}本が登場しています。`,
      "自計化、月次決算体制、業績管理、経営助言、行動宣言の流れが見えるよう区間を追加してください。"
    ),
    checkResult(
      "T2",
      "月次決算体制・巡回監査の厚み",
      ratio(monthlyCloseTime, total) >= 0.15 ? "ok" : ratio(monthlyCloseTime, total) >= 0.1 ? "warn" : "bad",
      15,
      `月次決算体制・巡回監査は${monthlyCloseTime}分です。`,
      "経営助言や便利機能の話に進む前に、信頼できる月次決算の土台を扱う区間を増やしてください。"
    ),
    checkResult(
      "T3",
      "自計化が土台として扱われているか",
      selfIndex >= 0 && masIndex >= 0 && selfIndex < masIndex ? "ok" : selfIndex >= 0 && masIndex < 0 ? "warn" : "bad",
      10,
      selfIndex >= 0 ? "自計化の区間は登場しています。" : "自計化の区間がありません。",
      "経営助言・継続MASへ進む前に、自計化を月次決算体制の土台として扱ってください。"
    ),
    checkResult(
      "T4",
      "業績管理から経営助言への接続",
      performanceIndex >= 0 && masIndex >= 0 && performanceIndex < masIndex
        ? "ok"
        : performanceIndex >= 0 || masIndex >= 0
          ? "warn"
          : "bad",
      10,
      "業績管理と経営助言の登場順を確認しました。",
      "業績管理で経営者の意思決定を扱ってから、経営助言・継続MASへ接続してください。"
    ),
    checkResult(
      "T5",
      "未来・AI・便利機能の出過ぎ防止",
      riskStatus,
      10,
      `リスク語彙を含む区間は全体の${Math.round(riskRatio * 100)}%です。`,
      "便利機能や将来像の前に、自計化・月次決算体制・巡回監査の本筋を十分に扱ってください。"
    ),
    checkResult(
      "T6",
      "まず1社への落とし込み",
      containsAny(actionText, actionWords) ? "ok" : closingAction ? "warn" : "bad",
      15,
      containsAny(actionText, actionWords) ? "具体的な実践先や次回行動が見えています。" : "まず1社への落とし込みが弱いです。",
      "終了後行動やまとめ区間に、まず1社、次回面談、実践などの言葉を入れてください。"
    ),
    checkResult(
      "T7",
      "システム紹介だけで終わらないか",
      demoSegments.length === 0 || demoOk ? "ok" : demoHasNotes ? "warn" : "bad",
      10,
      demoSegments.length === 0 ? "デモ区間はありません。" : "デモ区間の着地を確認しました。",
      "デモ区間の直後に、参加者アクションや持ち帰りを置いて実践へ接続してください。"
    )
  ];
}

export const tkcContextPack: ContextPack = {
  id: "tkc",
  label: "TKC",
  description: "自計化、月次決算体制、巡回監査、業績管理、経営助言、継続MASの流れを扱う設計パックです。",
  pillars: [
    {
      id: "tkc-context",
      label: "①現在地・問題提起",
      description: "参加者の課題認識をそろえ、なぜ今このテーマを扱うのかを明確にする",
      colorToken: "purpose"
    },
    {
      id: "tkc-self-accounting",
      label: "②TKC方式の自計化",
      description: "顧問先が自社の経営状況をタイムリーに把握するための土台",
      colorToken: "principle"
    },
    {
      id: "tkc-monthly-close-audit",
      label: "③月次決算体制・巡回監査",
      description: "信頼できる月次決算体制と巡回監査を中心に置く",
      colorToken: "practice"
    },
    {
      id: "tkc-performance",
      label: "④業績管理・限界利益",
      description: "月次決算後の業績把握、限界利益、意思決定への接続",
      colorToken: "case"
    },
    {
      id: "tkc-advisory-mas",
      label: "⑤経営助言・継続MAS",
      description: "経営計画、予実管理、業績検討会、具体的な打ち手への接続",
      colorToken: "dialogue"
    },
    {
      id: "tkc-action-standardization",
      label: "⑥標準化・翌日実践",
      description: "聞いて終わりにせず、まず1社・まず1業務に落とす",
      colorToken: "action"
    }
  ],
  defaultRoles: tkcRoles,
  segmentTypes,
  audienceMaturities,
  templates,
  checks: [],
  contextScoreLabel: "TKC文脈整合度",
  evaluateChecks: evaluateTkcChecks,
  recommendedWords: [
    "自計化",
    "月次決算",
    "巡回監査",
    "会計帳簿",
    "仕訳",
    "経営者",
    "意思決定",
    "業績管理",
    "限界利益",
    "経営助言",
    "経営計画",
    "継続MAS",
    "予実管理",
    "業績検討会",
    "まず1社",
    "標準化"
  ],
  riskWords: ["AI", "未来", "DX", "効率化", "自動化", "便利機能", "デモだけ", "システム紹介"]
};
