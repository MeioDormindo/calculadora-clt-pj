import type {
  InssBracket,
  IrrfBracket,
  CltInput,
  CltResult,
  Line,
  Auto,
} from "./types";
import {
  INSS_BRACKETS,
  IRRF_BRACKETS,
  IRRF_DEPENDENT_DEDUCTION,
  IRRF_ISENCAO_GROSS_LIMIT,
  IRRF_REDUTOR_GROSS_LIMIT,
  IRRF_REDUTOR_BASE,
  IRRF_REDUTOR_FACTOR,
  FGTS_RATE,
  FGTS_TERMINATION_FINE_RATE,
  VACATION_BONUS_DIVISOR,
  THIRTEENTH_DIVISOR,
  PRIOR_NOTICE_DIVISOR,
  PROFIT_SHARING_DIVISOR,
  EMPLOYER_INSS_RATE,
  RAT_RATE,
  SISTEMA_S_RATE,
} from "./constants";

export function calculateInss(grossSalary: number, brackets: InssBracket[] = INSS_BRACKETS): number {
  let total = 0;
  let previousUpTo = 0;
  for (const bracket of brackets) {
    const taxableInBracket = Math.max(0, Math.min(grossSalary, bracket.upTo) - previousUpTo);
    total += taxableInBracket * bracket.rate;
    previousUpTo = bracket.upTo;
    if (grossSalary <= bracket.upTo) break;
  }
  return total;
}

// Redutor da Lei 15.270/2025: reduz progressivamente o IRRF calculado para
// quem tem rendimento bruto entre IRRF_ISENCAO_GROSS_LIMIT e
// IRRF_REDUTOR_GROSS_LIMIT. A fórmula usa o rendimento BRUTO, não a base
// após INSS/dependentes.
export function calculateIrrfRedutor(grossSalary: number): number {
  if (grossSalary > IRRF_REDUTOR_GROSS_LIMIT) return 0;
  return Math.max(0, IRRF_REDUTOR_BASE - IRRF_REDUTOR_FACTOR * grossSalary);
}

export function calculateIrrf(
  grossSalary: number,
  baseAfterInss: number,
  dependents: number,
  brackets: IrrfBracket[] = IRRF_BRACKETS,
): number {
  if (grossSalary <= IRRF_ISENCAO_GROSS_LIMIT) return 0;

  const base = Math.max(0, baseAfterInss - dependents * IRRF_DEPENDENT_DEDUCTION);
  const bracket = brackets.find((b) => base <= b.upTo) ?? brackets[brackets.length - 1];
  const normalIrrf = Math.max(0, base * bracket.rate - bracket.deduction);

  return Math.max(0, normalIrrf - calculateIrrfRedutor(grossSalary));
}

/** Usa o valor informado pelo usuário, ou a fórmula automática quando `null`. */
function resolve(override: Auto, automatic: number): number {
  return override ?? automatic;
}

/** Valores que o site preenche sozinho a partir do salário bruto. */
export function deriveCltDefaults(grossSalary: number) {
  const fgts = grossSalary * FGTS_RATE;
  return {
    vacationBonus: grossSalary / VACATION_BONUS_DIVISOR,
    thirteenth: grossSalary / THIRTEENTH_DIVISOR,
    fgts,
    fgtsFine: fgts * FGTS_TERMINATION_FINE_RATE,
    priorNotice: grossSalary / PRIOR_NOTICE_DIVISOR,
    profitSharing: grossSalary / PROFIT_SHARING_DIVISOR,
    employerInss: grossSalary * EMPLOYER_INSS_RATE,
    rat: grossSalary * RAT_RATE,
    sistemaS: grossSalary * SISTEMA_S_RATE,
  };
}

export function calculateClt(input: CltInput): CltResult {
  const auto = deriveCltDefaults(input.grossSalary);

  const vacationBonus = resolve(input.vacationBonus, auto.vacationBonus);
  const thirteenth = resolve(input.thirteenth, auto.thirteenth);
  const directPay = input.grossSalary + vacationBonus + thirteenth;

  const inss = calculateInss(input.grossSalary);
  const irrf = calculateIrrf(input.grossSalary, input.grossSalary - inss, input.dependents);
  const totalCosts = inss + irrf;

  // Tudo o que a empresa banca hoje e o PJ teria que custear do próprio bolso.
  const benefits: Line[] = [
    { key: "fgts", label: "FGTS", value: resolve(input.fgts, auto.fgts) },
    { key: "fgtsFine", label: "Multa do FGTS (provisão)", value: resolve(input.fgtsFine, auto.fgtsFine) },
    { key: "priorNotice", label: "Aviso prévio (provisão)", value: resolve(input.priorNotice, auto.priorNotice) },
    { key: "transportVoucher", label: "Vale-transporte", value: input.transportVoucher },
    { key: "mealVoucher", label: "Vale-refeição", value: input.mealVoucher },
    { key: "healthPlan", label: "Plano de saúde", value: input.healthPlan },
    { key: "profitSharing", label: "Participação nos lucros", value: resolve(input.profitSharing, auto.profitSharing) },
    { key: "otherBenefits", label: "Outros benefícios", value: input.otherBenefits },
    { key: "maternityAid", label: "Auxílio maternidade", value: input.maternityAid },
  ];
  const totalBenefits = benefits.reduce((sum, line) => sum + line.value, 0);

  const employerCharges: Line[] = [
    { key: "employerInss", label: "INSS patronal", value: resolve(input.employerInss, auto.employerInss) },
    { key: "rat", label: "RAT (risco ambiental)", value: resolve(input.rat, auto.rat) },
    { key: "sistemaS", label: "Sistema S", value: resolve(input.sistemaS, auto.sistemaS) },
  ];
  const totalEmployerCharges = employerCharges.reduce((sum, line) => sum + line.value, 0);

  return {
    grossSalary: input.grossSalary,
    vacationBonus,
    thirteenth,
    directPay,
    inss,
    irrf,
    totalCosts,
    benefits,
    totalBenefits,
    employerCharges,
    totalEmployerCharges,
    netEffective: directPay - totalCosts,
    employerCost: directPay + totalBenefits + totalEmployerCharges,
  };
}
