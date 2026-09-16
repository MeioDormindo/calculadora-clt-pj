import type { PjInput, PjResult, CltResult, Line, LostDaysCost } from "./types";
import { PJ_TAX_PRESETS, MINIMUM_WAGE, INSS_CEILING, MEI_MONTHLY_LIMIT } from "./constants";

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
    case "AUTONOMO":
      return Math.min(grossInvoice, INSS_CEILING) * 0.2;
    case "CUSTOM":
      return customInssBase * (customInssRatePct / 100);
    default:
      return 0;
  }
}

export function calculateLostDaysCost(
  grossInvoice: number,
  workingDaysPerMonth: number,
  holidaysPerYear: number,
  sickDaysPerYear: number,
  vacationDaysPerYear: number,
): LostDaysCost {
  const dailyRate = workingDaysPerMonth > 0 ? grossInvoice / workingDaysPerMonth : 0;

  const breakdown = [
    { key: "lostHolidays", label: "Feriados", days: holidaysPerYear },
    { key: "lostSick", label: "Médico / doença", days: sickDaysPerYear },
    { key: "lostVacation", label: "Férias", days: vacationDaysPerYear },
  ].map((item) => ({ ...item, monthlyCost: (dailyRate * item.days) / 12 }));

  const totalLostDays = holidaysPerYear + sickDaysPerYear + vacationDaysPerYear;
  const annualCost = dailyRate * totalLostDays;

  return { dailyRate, breakdown, totalLostDays, annualCost, monthlyEquivalent: annualCost / 12 };
}

/**
 * Calcula o lado PJ para um dado faturamento bruto. Todo benefício que a
 * empresa banca no CLT vira custo do próprio bolso aqui — é essa assimetria
 * que faz a comparação ser justa.
 */
export function calculatePj(grossInvoice: number, input: PjInput, clt: CltResult): PjResult {
  const lostDays = calculateLostDaysCost(
    grossInvoice,
    input.workingDaysPerMonth,
    input.holidaysPerYear,
    input.sickDaysPerYear,
    input.vacationDaysPerYear,
  );

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
      label: `${item.label} sem faturar (${item.days} dias/ano)`,
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
