/** Valor derivado do salário. `null` = calcular automaticamente pela fórmula. */
export type Auto = number | null;

export interface InssBracket {
  upTo: number;
  rate: number;
}

export interface IrrfBracket {
  upTo: number;
  rate: number;
  deduction: number;
}

export type PjTaxRegimeId = "MEI" | "SIMPLES_I" | "SIMPLES_III" | "SIMPLES_V" | "MANUAL";

export type PjInssModeId = "MEI" | "SIMPLES_PROLABORE" | "FATOR_R" | "AUTONOMO" | "CUSTOM";

export interface CltInput {
  grossSalary: number;
  dependents: number;

  // Derivados do salário bruto (null = automático).
  vacationBonus: Auto;
  thirteenth: Auto;
  fgts: Auto;
  fgtsFine: Auto;
  priorNotice: Auto;
  profitSharing: Auto;

  // Benefícios informados pelo usuário.
  transportVoucher: number;
  mealVoucher: number;
  healthPlan: number;
  otherBenefits: number;
  maternityAid: number;

  /** Valor líquido recebido por fora da folha. Entra inteiro, sem impostos. */
  externalIncome: number;

  // Encargos pagos pela empresa (null = automático).
  employerInss: Auto;
  rat: Auto;
  sistemaS: Auto;
}

export interface PjInput {
  proposedGross: number;
  /** Atividade escolhida; define regime e INSS, exceto em "CUSTOM". */
  activity: string;
  taxRegime: PjTaxRegimeId;
  manualTaxRatePct: number;
  inssMode: PjInssModeId;
  customInssRatePct: number;
  customInssBase: number;
  accountantFee: number;
  lifeInsurance: number;
  workingDaysPerMonth: number;
  holidaysPerYear: number;
  sickDaysPerYear: number;
  vacationDaysPerYear: number;

  // Alguns contratos PJ cobrem parte dos dias parados. O que a empresa paga
  // deixa de ser custo seu.
  paidHolidays: boolean;
  paidSickDays: boolean;
  paidVacationDays: number;
}

export interface Line {
  key: string;
  label: string;
  value: number;
}

export interface CltResult {
  grossSalary: number;
  vacationBonus: number;
  thirteenth: number;
  externalIncome: number;
  directPay: number;
  inss: number;
  irrf: number;
  totalCosts: number;
  benefits: Line[];
  totalBenefits: number;
  employerCharges: Line[];
  totalEmployerCharges: number;
  netEffective: number;
  employerCost: number;
}

export interface LostDaysBreakdown {
  key: string;
  label: string;
  days: number;
  paidDays: number;
  unpaidDays: number;
  monthlyCost: number;
}

export interface LostDaysCost {
  dailyRate: number;
  breakdown: LostDaysBreakdown[];
  totalLostDays: number;
  totalUnpaidDays: number;
  annualCost: number;
  monthlyEquivalent: number;
}

export interface PjResult {
  grossInvoice: number;
  costs: Line[];
  totalCosts: number;
  netEffective: number;
  employerCost: number;
  lostDays: LostDaysCost;
  exceedsMeiLimit: boolean;
}

export interface CostAnalysis {
  employerClt: number;
  employerPj: number;
  employerDelta: number;
  employerDeltaPct: number;
  workerClt: number;
  workerPj: number;
  workerDelta: number;
  workerDeltaPct: number;
}

export interface ComparisonResult {
  clt: CltResult;
  minimum: PjResult | null;
  proposed: PjResult;
  minimumGross: number | null;
  analysisMinimum: CostAnalysis | null;
  analysisProposed: CostAnalysis;
  proposalDelta: number;
  proposalDeltaPct: number;
}
