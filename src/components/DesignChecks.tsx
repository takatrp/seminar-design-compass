import type { ScoreSummary } from "../domain/types";

interface Props {
  score: ScoreSummary;
}

export function DesignChecks({ score }: Props) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>{score.contextLabel ?? score.label}</h2>
        <span className="scoreBadge">{score.overallScore}</span>
      </div>
      <div className="checkList">
        {score.checks.map((check) => (
          <article key={check.id} className="checkItem" data-status={check.status}>
            <div className="checkTitle">
              <strong>{check.id}. {check.label}</strong>
              <span>{check.status.toUpperCase()} / {check.maxScore}点</span>
            </div>
            <p>{check.message}</p>
            {check.status !== "ok" && <p className="suggestion">改善提案：{check.suggestion}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
