import { audienceMaturities, segmentTypes, templateSegment } from "./shared";
import type { ContextPack, SeminarTemplate } from "../domain/types";

const genericRoles = [
  { id: "facilitator", label: "進行役", shortLabel: "進行", type: "facilitator" as const },
  { id: "speaker", label: "講師", shortLabel: "講師", type: "speaker" as const },
  { id: "staff", label: "運営担当", shortLabel: "運営", type: "staff" as const }
];

const baseSeminarPatch = {
  mainMessage: "参加者が自分の現場で使える判断軸と最初の行動を持ち帰る",
  subMessages: ["現在地をそろえる", "実践手順を言語化する", "明日からの行動を決める"],
  desiredAction: "自分の現場で試す最初の一歩を決め、次回の場で結果を共有する"
};

const templates: SeminarTemplate[] = [
  {
    id: "understanding-60",
    label: "理解促進型 60分",
    description: "短時間で背景、判断軸、持ち帰りをそろえる構成です。",
    recommendedDurationMin: 60,
    seminarPatch: { ...baseSeminarPatch, durationMin: 60 },
    segments: [
      templateSegment({
        title: "導入：今日の目的と到達点",
        durationMin: 8,
        type: "opening",
        pillarId: "purpose",
        goal: "学ぶ理由と到達点をそろえる",
        keyQuestion: "今日の終了時に何が分かっていればよいですか。",
        takeaway: "今日扱う問いと到達点"
      }),
      templateSegment({
        title: "背景：なぜ今このテーマか",
        durationMin: 12,
        type: "context",
        pillarId: "purpose",
        goal: "参加者の課題認識をそろえる",
        keyQuestion: "現場で一番詰まりやすい点はどこですか。",
        takeaway: "取り組むべき背景"
      }),
      templateSegment({
        title: "判断軸：基本思想を押さえる",
        durationMin: 18,
        type: "lecture",
        pillarId: "principle",
        goal: "テーマを見るための判断軸を得る",
        keyQuestion: "何を基準に判断すると迷いが減りますか。",
        takeaway: "判断に使う3つの観点"
      }),
      templateSegment({
        title: "対話：自分の現場に置き換える",
        durationMin: 12,
        type: "dialogue",
        pillarId: "dialogue",
        goal: "理解を自分ごとにする",
        keyQuestion: "自分の現場ではどこから試せそうですか。",
        takeaway: "現場で使う場面の候補",
        participantAction: "隣の人と実践場面を共有する",
        discussion: {
          enabled: true,
          format: "pair",
          question: "自分の現場に持ち帰るなら、どの場面で使いますか。",
          output: "実践場面メモ"
        }
      }),
      templateSegment({
        title: "まとめ：最初の一歩を決める",
        durationMin: 10,
        type: "closing",
        pillarId: "action",
        goal: "終了後の行動を明確にする",
        keyQuestion: "明日まず何をしますか。",
        takeaway: "最初の一歩",
        participantAction: "明日やることを1つ書く"
      })
    ]
  },
  {
    id: "implementation-90",
    label: "実践導入型 90分",
    description: "判断軸から実践手順、ワークまで進める標準構成です。",
    recommendedDurationMin: 90,
    seminarPatch: { ...baseSeminarPatch, durationMin: 90 },
    segments: [
      templateSegment({
        title: "導入：今日扱う課題とゴール",
        durationMin: 10,
        type: "opening",
        pillarId: "purpose",
        goal: "課題とゴールを確認する",
        keyQuestion: "今日扱う課題は、現場のどの困りごとにつながっていますか。",
        takeaway: "扱う課題と到達点"
      }),
      templateSegment({
        title: "判断軸：なぜこの実践が必要か",
        durationMin: 15,
        type: "context",
        pillarId: "principle",
        goal: "実践の意味を判断軸として理解する",
        keyQuestion: "なぜこの実践を先送りしない方がよいですか。",
        takeaway: "実践を始める判断軸"
      }),
      templateSegment({
        title: "実践手順：明日からの進め方",
        durationMin: 25,
        type: "lecture",
        pillarId: "practice",
        goal: "明日からの手順を理解する",
        keyQuestion: "最初に確認すべき情報は何ですか。",
        takeaway: "実践手順の全体像"
      }),
      templateSegment({
        title: "事例・デモ：具体的な進め方を見る",
        durationMin: 15,
        type: "case",
        pillarId: "case",
        goal: "具体例から実践イメージを持つ",
        keyQuestion: "この事例のどこを自分の現場に使えますか。",
        takeaway: "事例から使える型",
        participantAction: "使えそうな型に印を付ける"
      }),
      templateSegment({
        title: "ワーク：自分の現場に置き換える",
        durationMin: 15,
        type: "work",
        pillarId: "dialogue",
        goal: "自分の現場での実践案を作る",
        keyQuestion: "誰に、いつ、何を試しますか。",
        takeaway: "現場用の実践案",
        participantAction: "実践案を1つ書く",
        discussion: {
          enabled: true,
          format: "group",
          question: "自分の現場で最初に試すなら、どの相手・場面ですか。",
          output: "実践案"
        }
      }),
      templateSegment({
        title: "まとめ：最初の一歩を決める",
        durationMin: 10,
        type: "closing",
        pillarId: "action",
        goal: "明日からの行動を決める",
        keyQuestion: "最初の一歩は何ですか。",
        takeaway: "実行する一歩",
        participantAction: "実行日と行動を記入する"
      })
    ]
  },
  {
    id: "case-sharing-120",
    label: "事例共有型 120分",
    description: "複数事例と対話で、実務上の勘所を持ち帰る構成です。",
    recommendedDurationMin: 120,
    seminarPatch: { ...baseSeminarPatch, durationMin: 120 },
    segments: [
      templateSegment({
        title: "導入：本日の論点整理",
        durationMin: 10,
        type: "opening",
        pillarId: "purpose",
        goal: "論点と期待値をそろえる",
        keyQuestion: "今日、どの論点を持ち帰りたいですか。",
        takeaway: "本日の論点"
      }),
      templateSegment({
        title: "基本思想：事例を見る観点",
        durationMin: 15,
        type: "lecture",
        pillarId: "principle",
        goal: "事例を読み解く観点を持つ",
        keyQuestion: "良い実践と一時的な成功をどう見分けますか。",
        takeaway: "事例を見る観点"
      }),
      templateSegment({
        title: "事例1：導入期のつまずき",
        durationMin: 20,
        type: "case",
        pillarId: "case",
        goal: "導入期の注意点を理解する",
        keyQuestion: "この事例では何が転換点でしたか。",
        takeaway: "導入期の注意点"
      }),
      templateSegment({
        title: "事例2：定着までの工夫",
        durationMin: 20,
        type: "case",
        pillarId: "case",
        goal: "定着のための工夫を理解する",
        keyQuestion: "続いた理由は何ですか。",
        takeaway: "定着の工夫"
      }),
      templateSegment({
        title: "グループ討議：自社・自所への適用",
        durationMin: 25,
        type: "discussion",
        pillarId: "dialogue",
        goal: "事例を自分の現場に変換する",
        keyQuestion: "自分の現場で再現するなら何を変えますか。",
        takeaway: "適用時の変更点",
        participantAction: "グループで適用案を共有する",
        discussion: {
          enabled: true,
          format: "group",
          question: "自分の現場で再現するために変えるべき点は何ですか。",
          output: "適用案"
        }
      }),
      templateSegment({
        title: "実践設計：次の面談で使う",
        durationMin: 20,
        type: "work",
        pillarId: "practice",
        goal: "実践場面を具体化する",
        keyQuestion: "次の面談で何を試しますか。",
        takeaway: "面談で使う実践メモ",
        participantAction: "次の面談で試す内容を書く"
      }),
      templateSegment({
        title: "まとめ：持ち帰り共有",
        durationMin: 10,
        type: "closing",
        pillarId: "action",
        goal: "各自の行動を言語化する",
        keyQuestion: "最初に試すことは何ですか。",
        takeaway: "実行する行動",
        participantAction: "持ち帰りを1つ発表する"
      })
    ]
  },
  {
    id: "discussion-120",
    label: "討議・合意形成型 120分",
    description: "参加者の考えをそろえ、合意と行動宣言まで進める構成です。",
    recommendedDurationMin: 120,
    seminarPatch: {
      ...baseSeminarPatch,
      durationMin: 120,
      discussion: {
        enabled: true,
        format: "group",
        purpose: "論点を整理し、合意できる行動基準を作る",
        expectedOutput: "合意事項と実行担当"
      }
    },
    segments: [
      templateSegment({
        title: "導入：合意したい論点",
        durationMin: 10,
        type: "opening",
        pillarId: "purpose",
        goal: "合意形成の目的を明確にする",
        keyQuestion: "今日どの論点で合意したいですか。",
        takeaway: "合意したい論点"
      }),
      templateSegment({
        title: "論点整理：現状と障害",
        durationMin: 20,
        type: "discussion",
        pillarId: "dialogue",
        goal: "現状と障害を出し切る",
        keyQuestion: "進まない理由はどこにありますか。",
        takeaway: "現状と障害の一覧",
        participantAction: "現状と障害を書き出す",
        discussion: {
          enabled: true,
          format: "group",
          question: "進まない理由を事実と解釈に分けると何が見えますか。",
          output: "論点メモ"
        }
      }),
      templateSegment({
        title: "判断軸：優先順位の決め方",
        durationMin: 20,
        type: "lecture",
        pillarId: "principle",
        goal: "合意に使う判断軸を共有する",
        keyQuestion: "何を優先すると次の行動が決まりますか。",
        takeaway: "優先順位の判断軸"
      }),
      templateSegment({
        title: "ケース検討：選択肢を比べる",
        durationMin: 20,
        type: "case",
        pillarId: "case",
        goal: "選択肢の違いを理解する",
        keyQuestion: "この選択肢の良い点とリスクは何ですか。",
        takeaway: "比較観点"
      }),
      templateSegment({
        title: "ワーク：合意案を作る",
        durationMin: 30,
        type: "work",
        pillarId: "dialogue",
        goal: "合意案と実行条件を作る",
        keyQuestion: "合意案として何を残しますか。",
        takeaway: "合意案",
        participantAction: "合意案を1つに絞る",
        discussion: {
          enabled: true,
          format: "group",
          question: "合意案に入れる条件と、入れない条件は何ですか。",
          output: "合意案"
        }
      }),
      templateSegment({
        title: "まとめ：担当と期限を決める",
        durationMin: 20,
        type: "closing",
        pillarId: "action",
        goal: "合意を行動に変える",
        keyQuestion: "誰がいつまでに何をしますか。",
        takeaway: "担当・期限・次回確認",
        participantAction: "担当と期限を宣言する"
      })
    ]
  }
];

export const genericContextPack: ContextPack = {
  id: "generic",
  label: "汎用",
  description: "研修・セミナー全般に使える基本の設計パックです。",
  pillars: [
    { id: "purpose", label: "目的・問題提起", description: "扱う意味と参加者の課題をそろえる", colorToken: "purpose" },
    { id: "principle", label: "基本思想・判断軸", description: "判断に使う考え方を提示する", colorToken: "principle" },
    { id: "practice", label: "実践方法・手順", description: "明日からの進め方を具体化する", colorToken: "practice" },
    { id: "case", label: "事例・デモ", description: "具体例から理解を深める", colorToken: "case" },
    { id: "dialogue", label: "対話・ワーク", description: "自分の現場へ置き換える", colorToken: "dialogue" },
    { id: "action", label: "行動宣言・フォロー", description: "終了後の行動まで落とす", colorToken: "action" }
  ],
  defaultRoles: genericRoles,
  segmentTypes,
  audienceMaturities,
  templates,
  checks: [],
  recommendedWords: ["目的", "実践", "行動", "判断軸", "課題", "現場", "持ち帰り", "次回"],
  riskWords: []
};
