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
  externalIncome: 0,
  employerInss: null,
  rat: null,
  sistemaS: null,
};

export const sheetPj: PjInput = {
  proposedGross: 15000,
  taxRegime: "SIMPLES_III",
  manualTaxRatePct: 6,
  inssMode: "SIMPLES_PROLABORE",
  customInssRatePct: 11,
  customInssBase: 0,
  accountantFee: 600,
  lifeInsurance: 300,
  workingDaysPerMonth: 22,
  holidaysPerYear: 0,
  sickDaysPerYear: 0,
  vacationDaysPerYear: 0,
  paidHolidays: false,
  paidSickDays: false,
  paidVacationDays: 0,
};
