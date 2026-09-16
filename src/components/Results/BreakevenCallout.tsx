import type { ComparisonResult } from "../../lib/calc/types";
import { formatCurrency } from "../../lib/format";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";

export function BreakevenCallout({ result }: { result: ComparisonResult }) {
  const { clt, proposed, minimumGross } = result;
  const animated = useAnimatedNumber(minimumGross ?? 0);

  if (minimumGross === null) {
    return (
      <section className="hero unreachable">
        <p className="hero-label">Ponto de equilíbrio</p>
        <p className="hero-figure">Fora do alcance</p>
        <p className="hero-sub">
          Nenhum faturamento até R$ 200.000/mês empata com esse CLT. Revise os custos do lado PJ.
        </p>
      </section>
    );
  }

  const gap = proposed.grossInvoice - minimumGross;
  const short = gap < 0;

  return (
    <section className="hero">
      <p className="hero-label">
        Para empatar com um CLT de {formatCurrency(clt.grossSalary)}, o PJ precisa faturar
      </p>
      <p className="hero-figure">{formatCurrency(animated)}</p>
      <p className="hero-sub">por mês, com todos os benefícios e custos na conta</p>

      <p className={`hero-verdict ${short ? "bad" : "good"}`}>
        {short
          ? `A proposta de ${formatCurrency(proposed.grossInvoice)} está ${formatCurrency(-gap)} abaixo disso`
          : `A proposta de ${formatCurrency(proposed.grossInvoice)} está ${formatCurrency(gap)} acima disso`}
      </p>
    </section>
  );
}
