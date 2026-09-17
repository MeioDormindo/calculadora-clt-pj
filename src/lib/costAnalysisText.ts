import type { CostAnalysis } from "./calc/types";
import { formatCurrency } from "./format";

export const formatPct = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export const formatDelta = (value: number) => `${value > 0 ? "+" : ""}${formatCurrency(value)}`;

/** Frase que acompanha os números, para o painel nunca afirmar algo que eles desmentem. */
export function describeScenario(scenario: string, data: CostAnalysis): string {
  const company =
    Math.abs(data.employerDelta) < 0.005
      ? "a empresa gasta o mesmo"
      : `a empresa gasta ${formatCurrency(Math.abs(data.employerDelta))} ${
          data.employerDelta < 0 ? "a menos" : "a mais"
        } (${formatPct(data.employerDeltaPct)})`;
  const worker =
    data.workerDelta >= 0
      ? `seus custos sobem ${formatCurrency(data.workerDelta)} por mês`
      : `seus custos caem ${formatCurrency(-data.workerDelta)} por mês`;
  return `${scenario}, ${company} e ${worker}.`;
}
