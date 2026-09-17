import type {
  PjInput,
  PjResult,
  CltResult,
  Line,
  SimplesBracket,
  BillingLine,
  MonthBilling,
  PjBilling,
} from "./types";
import type { ContractCalendar } from "../calendar/workCalendar";
import { calculateIrrf } from "./clt";
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

/**
 * DAS do Simples Nacional no mês. A alíquota efetiva depende da receita dos
 * últimos 12 meses (RBT12): (RBT12 x nominal - parcela a deduzir) / RBT12.
 * Aqui o RBT12 é o faturamento mensal x 12, supondo renda estável.
 */
export function calculateSimplesTax(grossInvoice: number, brackets: SimplesBracket[]): number {
  const rbt12 = grossInvoice * 12;
  if (rbt12 <= 0) return 0;
  const bracket = brackets.find((b) => rbt12 <= b.upTo) ?? brackets[brackets.length - 1];
  return Math.max(0, (rbt12 * bracket.rate - bracket.deduction) / 12);
}

export function calculatePjTax(
  grossInvoice: number,
  taxRegime: PjInput["taxRegime"],
  manualTaxRatePct: number,
  inssPaid = 0,
  dependents = 0,
): number {
  const preset = PJ_TAX_PRESETS.find((p) => p.id === taxRegime);
  if (!preset) return 0;
  if (preset.fixedMonthly != null) return preset.fixedMonthly;
  if (preset.brackets) return calculateSimplesTax(grossInvoice, preset.brackets);
  // Sem CNPJ, o rendimento vai inteiro para a tabela mensal do IR (carnê-leão).
  if (taxRegime === "CARNE_LEAO") return calculateIrrf(grossInvoice, inssPaid, dependents);
  return grossInvoice * (manualTaxRatePct / 100);
}

/** Pró-labore que o sócio retira da empresa, quando o modo de INSS prevê um. */
export function calculatePjProLabore(grossInvoice: number, inssMode: PjInput["inssMode"]): number {
  if (inssMode === "FATOR_R") return Math.max(grossInvoice * FATOR_R_MIN, MINIMUM_WAGE);
  if (inssMode === "SIMPLES_PROLABORE" || inssMode === "ANEXO_IV") return MINIMUM_WAGE;
  return 0;
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
    case "FATOR_R":
      return Math.min(calculatePjProLabore(grossInvoice, inssMode), INSS_CEILING) * 0.11;
    case "ANEXO_IV":
      // 11% do sócio + 20% de CPP que, no Anexo IV, não vem dentro do DAS.
      return Math.min(MINIMUM_WAGE, INSS_CEILING) * (0.11 + 0.2);
    case "AUTONOMO":
      return Math.min(grossInvoice, INSS_CEILING) * 0.2;
    case "CUSTOM":
      return customInssBase * (customInssRatePct / 100);
    default:
      return 0;
  }
}

function describeDays(name: string, days: number, unpaidDays: number, unit: string): string {
  if (days === 0) return `${name} (nenhum dia)`;
  if (unpaidDays === 0) return `${name} (${days} ${unit} · pagos pela empresa)`;
  if (unpaidDays === days) return `${name} sem faturar (${days} ${unit})`;
  return `${name} sem faturar (${unpaidDays} de ${days} ${unit})`;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Quanto o PJ fatura de verdade no período do contrato, mês a mês, usando o
 * calendário real (dias de semana e feriados de cada ano).
 *
 * - Valor fixo por mês: o valor do dia é o valor mensal dividido pelos dias
 *   de semana daquele mês; cada dia não trabalhado e não pago sai dele.
 * - Por hora: valor da hora = valor ÷ horas mensais contratadas, e cada mês
 *   fatura dias úteis x horas por dia. Meses com mais dias rendem mais.
 *
 * Todas as perdas viram média mensal do contrato, para somar com os demais
 * custos mensais. Doença, férias e feriados locais são dias por ano, então
 * entram proporcionalmente (dias ÷ 12 por mês).
 */
export function calculatePjBilling(
  proposal: number,
  input: PjInput,
  calendar: ContractCalendar,
): PjBilling {
  const months = calendar.months.length;
  const hourly = input.billingMode === "HOURLY";
  const hourlyRate = hourly && input.monthlyHours > 0 ? proposal / input.monthlyHours : null;
  const hoursPerDay = Math.max(0, input.hoursPerDay);

  const dayValue = (weekdays: number) =>
    hourly ? (hourlyRate ?? 0) * hoursPerDay : weekdays > 0 ? proposal / weekdays : 0;
  const averageDailyValue = dayValue(calendar.totalWeekdays / months);

  const perMonth: MonthBilling[] = calendar.months.map((m) => {
    const unpaidHolidays = input.paidHolidays ? 0 : m.holidays.length;
    const billedDays = m.weekdays - unpaidHolidays;
    return {
      year: m.year,
      month: m.month,
      weekdays: m.weekdays,
      workdays: m.workdays,
      holidays: m.holidays.length,
      hours: hourly ? billedDays * hoursPerDay : null,
      billed: hourly
        ? (hourlyRate ?? 0) * hoursPerDay * billedDays
        : proposal - dayValue(m.weekdays) * unpaidHolidays,
    };
  });

  const lines: BillingLine[] = [];

  if (hourly) {
    // Horas que o calendário real dá contra as horas que o valor pressupõe.
    // Positivo é custo (menos horas); negativo é ganho (mais horas).
    const calendarHours = (calendar.totalWeekdays * hoursPerDay) / months;
    lines.push({
      key: "calendarHours",
      label: `Calendário real: ${round2(calendarHours)}h/mês de média contra ${input.monthlyHours}h do valor`,
      days: 0,
      paidDays: 0,
      unpaidDays: 0,
      monthlyCost: (hourlyRate ?? 0) * (input.monthlyHours - calendarHours),
    });
  }

  const holidayLoss = calendar.months.reduce(
    (sum, m) => sum + (input.paidHolidays ? 0 : dayValue(m.weekdays) * m.holidays.length),
    0,
  );
  lines.push({
    key: "lostHolidays",
    label: input.paidHolidays
      ? `Feriados em dia útil (${calendar.totalHolidays} em ${months} meses · pagos pela empresa)`
      : `Feriados em dia útil sem faturar (${calendar.totalHolidays} em ${months} meses)`,
    days: calendar.totalHolidays,
    paidDays: input.paidHolidays ? calendar.totalHolidays : 0,
    unpaidDays: input.paidHolidays ? 0 : calendar.totalHolidays,
    monthlyCost: holidayLoss / months,
  });

  const perYear = [
    input.localHolidaysPerYear > 0 && {
      key: "lostLocalHolidays",
      name: "Feriados estaduais/municipais",
      days: input.localHolidaysPerYear,
      paidDays: input.paidHolidays ? input.localHolidaysPerYear : 0,
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
  ].filter((item): item is { key: string; name: string; days: number; paidDays: number } => Boolean(item));

  for (const { key, name, days, paidDays } of perYear) {
    const unpaidDays = Math.max(0, days - paidDays);
    lines.push({
      key,
      label: describeDays(name, days, unpaidDays, "dias úteis/ano"),
      days,
      paidDays,
      unpaidDays,
      monthlyCost: (averageDailyValue * unpaidDays) / 12,
    });
  }

  const totalLoss = lines.reduce((sum, line) => sum + line.monthlyCost, 0);

  return {
    months,
    hourlyRate,
    dailyValue: averageDailyValue,
    lines,
    billedMonthly: proposal - totalLoss,
    perMonth,
  };
}

/**
 * Calcula o lado PJ para um valor proposto. Todo benefício que a empresa banca
 * no CLT vira custo do próprio bolso aqui — é essa assimetria que faz a
 * comparação ser justa. Impostos incidem sobre o que é de fato faturado.
 */
export function calculatePj(
  proposal: number,
  input: PjInput,
  clt: CltResult,
  calendar: ContractCalendar,
): PjResult {
  const billing = calculatePjBilling(proposal, input, calendar);
  const invoice = Math.max(0, billing.billedMonthly);

  const inss = calculatePjInss(invoice, input.inssMode, input.customInssRatePct, input.customInssBase);
  const proLabore = calculatePjProLabore(invoice, input.inssMode);
  // Só os 11% do sócio abatem o IR do pró-labore; a CPP é despesa da empresa.
  const partnerInss = Math.min(proLabore, INSS_CEILING) * 0.11;
  const proLaboreIrrf = proLabore > 0 ? calculateIrrf(proLabore, partnerInss, clt.dependents) : 0;
  const tax = calculatePjTax(invoice, input.taxRegime, input.manualTaxRatePct, inss, clt.dependents);

  const costs: Line[] = [
    // Como PJ você paga o custo inteiro: a parte que a empresa bancava e a
    // parte que já saía do seu holerite.
    ...clt.benefits.map((line) => ({
      ...line,
      value: line.value + (clt.employeeShares.find((s) => s.key === line.key)?.value ?? 0),
    })),
    { key: "lifeInsurance", label: "Seguro de vida", value: input.lifeInsurance },
    { key: "accountantFee", label: "Serviços de contabilidade", value: input.accountantFee },
    { key: "inss", label: "INSS", value: inss },
    // O pró-labore é salário do sócio e paga IR como qualquer salário; o resto
    // sai como lucro distribuído, que é isento.
    { key: "proLaboreIrrf", label: "IRRF sobre o pró-labore", value: proLaboreIrrf },
    { key: "tax", label: "Simples Nacional ou MEI", value: tax },
    ...billing.lines.map((line) => ({ key: line.key, label: line.label, value: line.monthlyCost })),
  ];

  const totalCosts = costs.reduce((sum, line) => sum + line.value, 0);

  return {
    grossInvoice: proposal,
    billedInvoice: invoice,
    costs,
    totalCosts,
    netEffective: proposal - totalCosts,
    employerCost: invoice,
    billing,
    exceedsMeiLimit: input.taxRegime === "MEI" && invoice > MEI_MONTHLY_LIMIT,
  };
}
