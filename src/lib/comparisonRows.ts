import type { ComparisonResult, PjResult } from "./calc/types";

export interface ComparisonRow {
  label: string;
  clt: number | null;
  min: number | null;
  prop: number | null;
}

const cost = (pj: PjResult | null, key: string): number | null => {
  if (!pj) return null;
  const value = pj.costs.find((c) => c.key === key)?.value ?? 0;
  return value === 0 ? 0 : -value;
};

/** Linhas do comparativo CLT x PJ mínimo x PJ proposta, usadas na tela e no PDF. */
export function buildComparisonRows(result: ComparisonResult): ComparisonRow[] {
  const { clt, minimum, proposed } = result;
  return [
    {
      label: "Salário bruto / faturamento",
      clt: clt.grossSalary,
      min: minimum?.grossInvoice ?? null,
      prop: proposed.grossInvoice,
    },
    { label: "Adicional de férias", clt: clt.vacationBonus, min: null, prop: null },
    { label: "Décimo terceiro salário", clt: clt.thirteenth, min: null, prop: null },
    ...(clt.allowance > 0
      ? [{ label: "Ajuda de custo (não tributável)", clt: clt.allowance, min: null, prop: null }]
      : []),
    ...(clt.externalIncome > 0
      ? [{ label: "Recebido por fora (líquido)", clt: clt.externalIncome, min: null, prop: null }]
      : []),
    ...clt.benefits.map((benefit) => ({
      label: benefit.label,
      clt: benefit.value,
      min: cost(minimum, benefit.key),
      prop: cost(proposed, benefit.key),
    })),
    ...clt.employeeShares
      .filter((share) => share.value > 0)
      .map((share) => ({ label: share.label, clt: -share.value, min: null, prop: null })),
    { label: "Seguro de vida", clt: null, min: cost(minimum, "lifeInsurance"), prop: cost(proposed, "lifeInsurance") },
    {
      label: "Serviços de contabilidade",
      clt: null,
      min: cost(minimum, "accountantFee"),
      prop: cost(proposed, "accountantFee"),
    },
    { label: "INSS", clt: -clt.inss, min: cost(minimum, "inss"), prop: cost(proposed, "inss") },
    {
      label: "IRRF (no PJ, sobre o pró-labore)",
      clt: -clt.irrf,
      min: cost(minimum, "proLaboreIrrf"),
      prop: cost(proposed, "proLaboreIrrf"),
    },
    { label: "Simples Nacional ou MEI", clt: null, min: cost(minimum, "tax"), prop: cost(proposed, "tax") },
    ...proposed.billing.lines.map((item) => ({
      label: item.label,
      clt: null,
      min: cost(minimum, item.key),
      prop: cost(proposed, item.key),
    })),
  ];
}
