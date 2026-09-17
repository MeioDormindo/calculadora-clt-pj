import type { CltInput, PjInput } from "./types";

/** Cenário da planilha de referência: salário de R$ 10.000 e proposta de R$ 15.000. */
export const sheetClt: CltInput = {
  grossSalary: 10000,
  dependents: 0,
  vacationBonus: null,
  thirteenth: null,
  fgts: null,
  fgtsFine: null,
  priorNotice: null,
  profitSharing: null,
  transportVoucher: 600,
  mealVoucher: 600,
  healthPlan: 2800,
  otherBenefits: 0,
  maternityAid: 500,
  healthPlanEmployeeShare: 0,
  allowance: 0,
  externalIncome: 0,
  employerInss: null,
  rat: null,
  sistemaS: null,
};

export const sheetPj: PjInput = {
  proposedGross: 15000,
  activity: "CUSTOM",
  taxRegime: "SIMPLES_III",
  manualTaxRatePct: 6,
  inssMode: "SIMPLES_PROLABORE",
  customInssRatePct: 11,
  customInssBase: 0,
  accountantFee: 600,
  lifeInsurance: 300,
  billingMode: "MONTHLY",
  monthlyHours: 160,
  hoursPerDay: 8,
  contractMonths: 12,
  contractStart: "2026-01",
  includeOptionalHolidays: true,
  localHolidaysPerYear: 0,
  sickDaysPerYear: 0,
  vacationDaysPerYear: 0,
  // Sem dias parados por padrão: os testes que precisam deles ligam explicitamente.
  paidHolidays: true,
  paidSickDays: false,
  paidVacationDays: 0,
};
