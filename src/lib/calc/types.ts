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

export type PjTaxRegimeId =
  | "MEI"
  | "SIMPLES_I"
  | "SIMPLES_II"
  | "SIMPLES_III"
  | "SIMPLES_IV"
  | "SIMPLES_V"
  | "CARNE_LEAO"
  | "MANUAL";

export interface SimplesBracket {
  upTo: number;
  rate: number;
  deduction: number;
}

export type PjInssModeId =
  | "MEI"
  | "SIMPLES_PROLABORE"
  | "FATOR_R"
  | "ANEXO_IV"
  | "AUTONOMO"
  | "CUSTOM";

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

  /** Parte do plano de saúde descontada no seu holerite. */
  healthPlanEmployeeShare: number;
  /** Ajuda de custo não tributável (home office etc.), paga no holerite. */
  allowance: number;

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

/** O que aparece num holerite de mês comum, sem 13º nem férias. */
export interface Payslip {
  salary: number;
  allowance: number;
  inss: number;
  irrf: number;
  healthPlanDiscount: number;
  transportVoucherDiscount: number;
  totalEarnings: number;
  totalDiscounts: number;
  net: number;
  fgts: number;
}

export interface CltResult {
  grossSalary: number;
  dependents: number;
  payslip: Payslip;
  /** O que chega por mês num mês comum: líquido do holerite + recebido por fora. */
  monthlyInPocket: number;
  /** 13º líquido no ano (depois do INSS e do IRRF dele). */
  thirteenthNet: number;
  /** 1/3 de férias líquido no ano: o 1/3 menos o INSS e o IRRF a mais do mês de férias. */
  vacationBonusNet: number;
  allowance: number;
  /** Descontos seus no holerite (plano de saúde, vale-transporte). */
  employeeShares: Line[];
  totalEmployeeShares: number;
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
