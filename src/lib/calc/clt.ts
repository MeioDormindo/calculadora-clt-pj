import type {
  InssBracket,
  IrrfBracket,
  CltInput,
  CltResult,
  Line,
  Payslip,
  Auto,
} from "./types";
import {
  INSS_BRACKETS,
  IRRF_BRACKETS,
  IRRF_DEPENDENT_DEDUCTION,
  IRRF_ISENCAO_GROSS_LIMIT,
  IRRF_REDUCAO_MAXIMA,
  IRRF_DESCONTO_SIMPLIFICADO,
  TRANSPORT_VOUCHER_EMPLOYEE_SHARE,
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

/** Redução mensal do IR da Lei 15.270/2025 (art. 3º-A da Lei 9.250). */
export function calculateIrrfReduction(taxableIncome: number, tax: number): number {
  if (taxableIncome <= IRRF_ISENCAO_GROSS_LIMIT) return Math.min(tax, IRRF_REDUCAO_MAXIMA);
  if (taxableIncome > IRRF_REDUTOR_GROSS_LIMIT) return 0;
  return Math.max(0, IRRF_REDUTOR_BASE - IRRF_REDUTOR_FACTOR * taxableIncome);
}

/**
 * IRRF sobre um rendimento. A base desconta as deduções legais (INSS +
 * dependentes) ou o desconto simplificado, o que for mais vantajoso — exceto
 * no 13º, que tem tributação exclusiva e não admite o simplificado. A
 * redução da lei é calculada sobre o rendimento bruto, não sobre a base.
 */
export function calculateIrrf(
  taxableIncome: number,
  inssPaid: number,
  dependents: number,
  { allowSimplifiedDeduction = true }: { allowSimplifiedDeduction?: boolean } = {},
  brackets: IrrfBracket[] = IRRF_BRACKETS,
): number {
  const legalDeductions = inssPaid + dependents * IRRF_DEPENDENT_DEDUCTION;
  const deduction = allowSimplifiedDeduction
    ? Math.max(legalDeductions, IRRF_DESCONTO_SIMPLIFICADO)
    : legalDeductions;

  const base = Math.max(0, taxableIncome - deduction);
  const bracket = brackets.find((b) => base <= b.upTo) ?? brackets[brackets.length - 1];
  const tax = Math.max(0, base * bracket.rate - bracket.deduction);

  return Math.max(0, tax - calculateIrrfReduction(taxableIncome, tax));
}

/** Usa o valor informado pelo usuário, ou a fórmula automática quando `null`. */
function resolve(override: Auto, automatic: number): number {
  return override ?? automatic;
}

/**
 * Valores que o site preenche sozinho. FGTS e encargos patronais incidem sobre
 * a folha do ano inteira — salário, 13º e férias + 1/3 —, e não só sobre o
 * salário do mês.
 */
export function deriveCltDefaults(input: Pick<CltInput, "grossSalary" | "vacationBonus" | "thirteenth">) {
  const { grossSalary } = input;
  const vacationBonus = resolve(input.vacationBonus, grossSalary / VACATION_BONUS_DIVISOR);
  const thirteenth = resolve(input.thirteenth, grossSalary / THIRTEENTH_DIVISOR);
  const payroll = grossSalary + vacationBonus + thirteenth;
  const fgts = payroll * FGTS_RATE;

  return {
    vacationBonus: grossSalary / VACATION_BONUS_DIVISOR,
    thirteenth: grossSalary / THIRTEENTH_DIVISOR,
    fgts,
    fgtsFine: fgts * FGTS_TERMINATION_FINE_RATE,
    priorNotice: grossSalary / PRIOR_NOTICE_DIVISOR,
    profitSharing: grossSalary / PROFIT_SHARING_DIVISOR,
    employerInss: payroll * EMPLOYER_INSS_RATE,
    rat: payroll * RAT_RATE,
    sistemaS: payroll * SISTEMA_S_RATE,
  };
}

/** Parte do vale-transporte que a empresa de fato paga. */
export function companyTransportVoucher(voucher: number, grossSalary: number): number {
  return Math.max(0, voucher - grossSalary * TRANSPORT_VOUCHER_EMPLOYEE_SHARE);
}

export function calculateClt(input: CltInput): CltResult {
  const auto = deriveCltDefaults(input);
  const { grossSalary, dependents } = input;

  const vacationBonus = resolve(input.vacationBonus, auto.vacationBonus);
  const thirteenth = resolve(input.thirteenth, auto.thirteenth);
  const directPay = grossSalary + vacationBonus + thirteenth;

  // Os impostos são a média mensal do ano: 11 meses de salário, 1 mês de
  // férias (salário + 1/3, tributados juntos) e o 13º, com tributação própria.
  const vacationMonth = grossSalary + vacationBonus * 12;
  const thirteenthPayment = thirteenth * 12;

  const inssRegular = calculateInss(grossSalary);
  const inssVacation = calculateInss(vacationMonth);
  const inssThirteenth = calculateInss(thirteenthPayment);

  const irrfRegular = calculateIrrf(grossSalary, inssRegular, dependents);
  const irrfVacation = calculateIrrf(vacationMonth, inssVacation, dependents);
  const irrfThirteenth = calculateIrrf(thirteenthPayment, inssThirteenth, dependents, {
    allowSimplifiedDeduction: false,
  });

  const inss = (11 * inssRegular + inssVacation + inssThirteenth) / 12;
  const irrf = (11 * irrfRegular + irrfVacation + irrfThirteenth) / 12;
  const totalCosts = inss + irrf;

  // Tudo o que a empresa banca hoje e o PJ teria que custear do próprio bolso.
  const benefits: Line[] = [
    { key: "fgts", label: "FGTS", value: resolve(input.fgts, auto.fgts) },
    { key: "fgtsFine", label: "Multa do FGTS (provisão)", value: resolve(input.fgtsFine, auto.fgtsFine) },
    { key: "priorNotice", label: "Aviso prévio (provisão)", value: resolve(input.priorNotice, auto.priorNotice) },
    {
      key: "transportVoucher",
      label: "Vale-transporte",
      value: companyTransportVoucher(input.transportVoucher, grossSalary),
    },
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

  // O que sai do seu bolso mesmo sendo CLT. As chaves são as mesmas dos
  // benefícios: como PJ você passa a pagar o custo inteiro (sua parte + a da
  // empresa), então o valor mínimo não muda — só o líquido fica honesto.
  const transportVoucherDiscount = Math.min(
    input.transportVoucher,
    grossSalary * TRANSPORT_VOUCHER_EMPLOYEE_SHARE,
  );
  const employeeShares: Line[] = [
    { key: "healthPlan", label: "Plano de saúde (sua parte)", value: input.healthPlanEmployeeShare },
    { key: "transportVoucher", label: "Vale-transporte (sua parte)", value: transportVoucherDiscount },
  ];
  const totalEmployeeShares = employeeShares.reduce((sum, line) => sum + line.value, 0);

  // Ajuda de custo é indenizatória: não paga INSS, IRRF nem FGTS, e não entra
  // no 13º nem nas férias.
  const allowance = input.allowance;

  // Valor pago por fora da folha: chega líquido, sem INSS nem IRRF, mas a
  // empresa desembolsa do mesmo jeito — entra nos dois lados da conta.
  const externalIncome = input.externalIncome;

  // A média mensal é o holerite de um mês comum mais estes dois valores
  // divididos por 12 — é o que liga os dois números mostrados na tela.
  const thirteenthNet = thirteenthPayment - inssThirteenth - irrfThirteenth;
  const vacationBonusNet =
    vacationBonus * 12 - (inssVacation - inssRegular) - (irrfVacation - irrfRegular);

  const payslipDiscounts =
    inssRegular + irrfRegular + input.healthPlanEmployeeShare + transportVoucherDiscount;
  const payslip: Payslip = {
    salary: grossSalary,
    allowance,
    inss: inssRegular,
    irrf: irrfRegular,
    healthPlanDiscount: input.healthPlanEmployeeShare,
    transportVoucherDiscount,
    totalEarnings: grossSalary + allowance,
    totalDiscounts: payslipDiscounts,
    net: grossSalary + allowance - payslipDiscounts,
    fgts: grossSalary * FGTS_RATE,
  };

  return {
    grossSalary,
    dependents,
    payslip,
    monthlyInPocket: payslip.net + externalIncome,
    thirteenthNet,
    vacationBonusNet,
    allowance,
    employeeShares,
    totalEmployeeShares,
    vacationBonus,
    thirteenth,
    externalIncome,
    directPay,
    inss,
    irrf,
    totalCosts,
    benefits,
    totalBenefits,
    employerCharges,
    totalEmployerCharges,
    netEffective: directPay - totalCosts + externalIncome + allowance - totalEmployeeShares,
    employerCost:
      directPay + externalIncome + allowance + totalBenefits + totalEmployerCharges,
  };
}
