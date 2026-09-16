import type { PjInput, PjResult, CltResult, Line, LostDaysCost } from "./types";
import {
  PJ_TAX_PRESETS,
  MINIMUM_WAGE,
  INSS_CEILING,
  MEI_MONTHLY_LIMIT,
  FATOR_R_MIN,
  PJ_ACTIVITIES,
} from "./constants";

/**
 * Aplica a atividade escolhida sobre regime e INSS. Fora de "CUSTOM", a
 * atividade manda: isso também corrige estados antigos salvos no navegador,
 * de antes da atividade existir, que teriam regime e INSS descombinados.
 */
export function applyActivity(input: PjInput): PjInput {
  const activity = PJ_ACTIVITIES.find((a) => a.id === input.activity);
  if (!activity || activity.id === "CUSTOM") return input;
  return { ...input, taxRegime: activity.taxRegime, inssMode: activity.inssMode };
}

export function calculatePjTax(
  grossInvoice: number,
  taxRegime: PjInput["taxRegime"],
  manualTaxRatePct: number,
): number {
  const preset = PJ_TAX_PRESETS.find((p) => p.id === taxRegime);
  if (!preset) return 0;
  if (preset.fixedMonthly != null) return preset.fixedMonthly;
  if (preset.rate != null) return grossInvoice * preset.rate;
  return grossInvoice * (manualTaxRatePct / 100);
}

export function calculatePjInss(
  grossInvoice: number,
  inssMode: PjInput["inssMode"],
  customInssRatePct: number,
  customInssBase: number,
): number {
  switch (inssMode) {
    case "MEI":
      return 0;
    case "SIMPLES_PROLABORE":
      return MINIMUM_WAGE * 0.11;
    case "FATOR_R":
      // Pró-labore nunca abaixo do salário mínimo nem acima do teto do INSS.
      return Math.min(Math.max(grossInvoice * FATOR_R_MIN, MINIMUM_WAGE), INSS_CEILING) * 0.11;
    case "AUTONOMO":
      return Math.min(grossInvoice, INSS_CEILING) * 0.2;
    case "CUSTOM":
      return customInssBase * (customInssRatePct / 100);
    default:
      return 0;
  }
}

function describeDays(name: string, days: number, unpaidDays: number): string {
  if (days === 0) return `${name} (nenhum dia)`;
  if (unpaidDays === 0) return `${name} (${days} dias/ano · pagos pela empresa)`;
  if (unpaidDays === days) return `${name} sem faturar (${days} dias/ano)`;
  return `${name} sem faturar (${unpaidDays} de ${days} dias/ano)`;
}

export function calculateLostDaysCost(grossInvoice: number, input: PjInput): LostDaysCost {
  const dailyRate =
    input.workingDaysPerMonth > 0 ? grossInvoice / input.workingDaysPerMonth : 0;

  const breakdown = [
    {
      key: "lostHolidays",
      name: "Feriados",
      days: input.holidaysPerYear,
      paidDays: input.paidHolidays ? input.holidaysPerYear : 0,
    },
    {
      key: "lostSick",
      name: "Médico / doença",
      days: input.sickDaysPerYear,
      paidDays: input.paidSickDays ? input.sickDaysPerYear : 0,
    },
    {
      key: "lostVacation",
      name: "Férias",
      days: input.vacationDaysPerYear,
      paidDays: Math.min(Math.max(0, input.paidVacationDays), input.vacationDaysPerYear),
    },
  ].map(({ key, name, days, paidDays }) => {
    const unpaidDays = Math.max(0, days - paidDays);
    return {
      key,
      label: describeDays(name, days, unpaidDays),
      days,
      paidDays,
      unpaidDays,
      monthlyCost: (dailyRate * unpaidDays) / 12,
    };
  });

  const totalLostDays = breakdown.reduce((sum, item) => sum + item.days, 0);
  const totalUnpaidDays = breakdown.reduce((sum, item) => sum + item.unpaidDays, 0);
  const annualCost = dailyRate * totalUnpaidDays;

  return {
    dailyRate,
    breakdown,
    totalLostDays,
    totalUnpaidDays,
    annualCost,
    monthlyEquivalent: annualCost / 12,
  };
}

/**
 * Calcula o lado PJ para um dado faturamento bruto. Todo benefício que a
 * empresa banca no CLT vira custo do próprio bolso aqui — é essa assimetria
 * que faz a comparação ser justa.
 */
export function calculatePj(grossInvoice: number, input: PjInput, clt: CltResult): PjResult {
  const lostDays = calculateLostDaysCost(grossInvoice, input);

  const costs: Line[] = [
    ...clt.benefits.map((line) => ({ ...line })),
    { key: "lifeInsurance", label: "Seguro de vida", value: input.lifeInsurance },
    { key: "accountantFee", label: "Serviços de contabilidade", value: input.accountantFee },
    {
      key: "inss",
      label: "INSS",
      value: calculatePjInss(
        grossInvoice,
        input.inssMode,
        input.customInssRatePct,
        input.customInssBase,
      ),
    },
    {
      key: "tax",
      label: "Simples Nacional ou MEI",
      value: calculatePjTax(grossInvoice, input.taxRegime, input.manualTaxRatePct),
    },
    ...lostDays.breakdown.map((item) => ({
      key: item.key,
      label: item.label,
      value: item.monthlyCost,
    })),
  ];

  const totalCosts = costs.reduce((sum, line) => sum + line.value, 0);

  return {
    grossInvoice,
    costs,
    totalCosts,
    netEffective: grossInvoice - totalCosts,
    employerCost: grossInvoice,
    lostDays,
    exceedsMeiLimit: input.taxRegime === "MEI" && grossInvoice > MEI_MONTHLY_LIMIT,
  };
}
