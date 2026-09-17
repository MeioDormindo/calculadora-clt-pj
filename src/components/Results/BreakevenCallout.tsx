import type { ComparisonResult } from "../../lib/calc/types";
import { formatCurrency } from "../../lib/format";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";

export function BreakevenCallout({ result }: { result: ComparisonResult }) {
  const { clt, proposed, minimumGross, goal, goalGross, goalExtra, goalNet } = result;
  const hasGoal = goalExtra > 0;
  const animated = useAnimatedNumber(goalGross ?? 0);

  if (goalGross === null) {
    return (
      <section className="hero unreachable">
        <p className="hero-label">{hasGoal ? "Sua meta" : "Ponto de equilíbrio"}</p>
        <p className="hero-figure">Fora do alcance</p>
        <p className="hero-sub">
          {hasGoal
            ? `Nenhum faturamento até R$ 200.000/mês deixa ${formatCurrency(goalNet)} líquidos por mês. Revise a meta ou os custos do lado PJ.`
            : "Nenhum faturamento até R$ 200.000/mês empata com esse CLT. Revise os custos do lado PJ."}
        </p>
        {hasGoal && minimumGross !== null && (
          <p className="hero-sub">Só para empatar com o CLT: {formatCurrency(minimumGross)} por mês.</p>
        )}
      </section>
    );
  }

  const gap = proposed.grossInvoice - goalGross;
  const short = gap < 0;

  return (
    <section className="hero">
      <p className="hero-label">
        {hasGoal
          ? `Para ganhar ${formatCurrency(goalExtra)} a mais por mês que um CLT de ${formatCurrency(clt.grossSalary)}, o PJ precisa faturar`
          : `Para empatar com um CLT de ${formatCurrency(clt.grossSalary)}, o PJ precisa faturar`}
      </p>
      <p className="hero-figure">{formatCurrency(animated)}</p>
      <p className="hero-sub">
        por mês, com todos os benefícios e custos na conta
        {goal?.billing.hourlyRate != null && ` — ${formatCurrency(goal.billing.hourlyRate)} por hora`}
      </p>
      {hasGoal && (
        <p className="hero-sub hero-goal">
          Sobram {formatCurrency(goalNet)} líquidos por mês, contra {formatCurrency(clt.netEffective)} no CLT.
          {minimumGross !== null && ` Só para empatar: ${formatCurrency(minimumGross)}.`}
        </p>
      )}

      <p className={`hero-verdict ${short ? "bad" : "good"}`}>
        {short
          ? `A proposta de ${formatCurrency(proposed.grossInvoice)} está ${formatCurrency(-gap)} abaixo disso`
          : `A proposta de ${formatCurrency(proposed.grossInvoice)} está ${formatCurrency(gap)} acima disso`}
      </p>
    </section>
  );
}
