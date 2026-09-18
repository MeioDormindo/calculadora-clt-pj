import type { Auto } from "../calc/types";
import { calculateInss, calculateIrrf } from "../calc/clt";
import {
  AGREEMENT_NOTICE_SHARE,
  FGTS_AGREEMENT_FINE_RATE,
  FGTS_AGREEMENT_WITHDRAWAL,
  FGTS_RATE,
  FGTS_TERMINATION_FINE_RATE,
  MINIMUM_WAGE,
  NOTICE_BASE_DAYS,
  NOTICE_DAYS_PER_YEAR,
  NOTICE_MAX_DAYS,
  UNEMPLOYMENT_CEILING,
  UNEMPLOYMENT_FIRST_LIMIT,
  UNEMPLOYMENT_FIRST_RATE,
  UNEMPLOYMENT_SECOND_BASE,
  UNEMPLOYMENT_SECOND_LIMIT,
  UNEMPLOYMENT_SECOND_RATE,
} from "../calc/constants";
import { formatCurrency } from "../format";
import {
  addDays,
  addMonths,
  completeMonths,
  daysInMonth,
  formatDate,
  parseIsoDate,
  toDayNumber,
  todayDate,
  type SimpleDate,
} from "./dates";

export type RescissionType = "SEM_JUSTA_CAUSA" | "PEDIDO" | "ACORDO";
export type NoticeMode = "INDENIZADO" | "TRABALHADO" | "DISPENSADO" | "NAO_CUMPRIDO";

export interface RescissionInput {
  /** "AAAA-MM-DD". */
  admissionDate: string | null;
  /** Último dia trabalhado, "AAAA-MM-DD". null = hoje. */
  terminationDate: string | null;
  type: RescissionType;
  noticeMode: NoticeMode;
  /**
   * Dias de férias vencidas ainda não tiradas (30 por período de 12 meses
   * completos). Os que passam de 30 são de períodos mais antigos, pagos em dobro.
   */
  expiredVacationDays: number;
  /** Saldo do FGTS deste emprego. null = estimar pelo salário. */
  fgtsBalance: Auto;
  saqueAniversario: boolean;
  /** 1ª parcela do 13º deste ano já recebida (paga até 30/11). */
  thirteenthAdvancePaid: boolean;
  /** Quantas vezes já pediu seguro-desemprego antes (2 = duas ou mais). */
  unemploymentRequests: number;
}

export const RESCISSION_TYPES: { id: RescissionType; label: string; short: string }[] = [
  { id: "SEM_JUSTA_CAUSA", label: "Demitido sem justa causa", short: "Sem justa causa" },
  { id: "PEDIDO", label: "Pedido de demissão", short: "Pedido de demissão" },
  { id: "ACORDO", label: "Acordo com a empresa (art. 484-A)", short: "Acordo" },
];

export const NOTICE_OPTIONS: Record<RescissionType, { id: NoticeMode; label: string }[]> = {
  SEM_JUSTA_CAUSA: [
    { id: "INDENIZADO", label: "Indenizado (a empresa paga e você sai na hora)" },
    { id: "TRABALHADO", label: "Trabalhado (você trabalhou os 30 dias)" },
  ],
  ACORDO: [
    { id: "INDENIZADO", label: "Indenizado (a empresa paga metade)" },
    { id: "TRABALHADO", label: "Trabalhado (você trabalhou os 30 dias)" },
  ],
  PEDIDO: [
    { id: "TRABALHADO", label: "Cumprido (você trabalhou os 30 dias)" },
    { id: "DISPENSADO", label: "Dispensado pela empresa (sem desconto)" },
    { id: "NAO_CUMPRIDO", label: "Não cumprido (descontam 30 dias)" },
  ],
};

/**
 * Aviso equivalente em outro tipo de demissão, para comparar os três com a
 * mesma data de saída: trabalhado continua trabalhado; o resto vira
 * indenizado quando a empresa demite, e dispensado no pedido de demissão.
 */
export function noticeModeFor(type: RescissionType, mode: NoticeMode): NoticeMode {
  if (NOTICE_OPTIONS[type].some((o) => o.id === mode)) return mode;
  if (mode === "TRABALHADO") return "TRABALHADO";
  return type === "PEDIDO" ? "DISPENSADO" : "INDENIZADO";
}

export interface RescissionItem {
  key: string;
  label: string;
  value: number;
  /** A conta por trás do valor, em linguagem simples. */
  detail: string;
}

export interface RescissionResult {
  type: RescissionType;
  salary: number;
  noticeMode: NoticeMode;
  admission: SimpleDate;
  termination: SimpleDate;
  /** Fim do contrato contando a projeção do aviso indenizado. */
  projectedEnd: SimpleDate;
  service: { years: number; months: number; days: number; totalMonths: number };
  notice: {
    /** Aviso a que você tem direito (30 + 3 por ano), ou 30 no pedido. */
    totalDays: number;
    /** Dias pagos em dinheiro na rescisão. */
    paidDays: number;
    /** Dias somados ao tempo de serviço (13º e férias). */
    projectedDays: number;
  };
  earnings: RescissionItem[];
  discounts: RescissionItem[];
  grossEarnings: number;
  totalDiscounts: number;
  /** Líquido do termo de rescisão (TRCT), pago pela empresa. */
  net: number;
  fgts: {
    balance: number;
    balanceEstimated: boolean;
    deposit: number;
    fineRate: number;
    fine: number;
    /** O que dá para sacar agora (saldo liberado + multa). */
    withdrawable: number;
    /** O que continua na conta do FGTS, ainda seu. */
    remaining: number;
    detail: string;
  };
  unemployment: {
    eligible: boolean;
    reason: string;
    installments: number;
    value: number;
    total: number;
  };
  /** Rescisão líquida + FGTS sacável + seguro-desemprego. */
  total: number;
}

export type RescissionOutcome =
  | { ok: true; result: RescissionResult }
  | { ok: false; message: string };

const MONTH_ABBR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${n === 1 ? one : many}`;
}

/** Meses do ano (calendário) com 15 dias ou mais de trabalho entre as datas. */
function thirteenthAvos(start: SimpleDate, end: SimpleDate): number {
  let avos = 0;
  let cursor = { year: start.year, month: start.month, day: 1 };
  while (toDayNumber(cursor) <= toDayNumber(end)) {
    const monthEnd = { ...cursor, day: daysInMonth(cursor.year, cursor.month) };
    const first = Math.max(toDayNumber(cursor), toDayNumber(start));
    const last = Math.min(toDayNumber(monthEnd), toDayNumber(end));
    if (last - first + 1 >= 15) avos++;
    cursor = addMonths(cursor, 1);
  }
  return avos;
}

/** Frações de mês do período aquisitivo com 15 dias ou mais de trabalho. */
function vacationAvos(periodStart: SimpleDate, end: SimpleDate): number {
  let avos = 0;
  for (let k = 0; toDayNumber(addMonths(periodStart, k)) <= toDayNumber(end); k++) {
    const first = toDayNumber(addMonths(periodStart, k));
    const last = Math.min(toDayNumber(addMonths(periodStart, k + 1)) - 1, toDayNumber(end));
    if (last - first + 1 >= 15) avos++;
  }
  return avos;
}

export function unemploymentInstallmentValue(averageSalary: number): number {
  const value =
    averageSalary <= UNEMPLOYMENT_FIRST_LIMIT
      ? averageSalary * UNEMPLOYMENT_FIRST_RATE
      : averageSalary <= UNEMPLOYMENT_SECOND_LIMIT
        ? UNEMPLOYMENT_SECOND_BASE + (averageSalary - UNEMPLOYMENT_FIRST_LIMIT) * UNEMPLOYMENT_SECOND_RATE
        : UNEMPLOYMENT_CEILING;
  return Math.max(MINIMUM_WAGE, value);
}

function unemployment(
  type: RescissionType,
  salary: number,
  monthsWorked: number,
  previousRequests: number,
): RescissionResult["unemployment"] {
  const none = { installments: 0, value: 0, total: 0 };
  if (type === "PEDIDO") {
    return { eligible: false, reason: "Quem pede demissão não tem direito ao seguro-desemprego.", ...none };
  }
  if (type === "ACORDO") {
    return { eligible: false, reason: "A demissão por acordo não dá direito ao seguro-desemprego.", ...none };
  }

  const request = Math.min(Math.max(0, Math.round(previousRequests)), 2);
  const required = [12, 9, 6][request];
  const ordinal = ["1ª", "2ª", "3ª (ou mais)"][request];
  if (monthsWorked < required) {
    return {
      eligible: false,
      reason: `Na ${ordinal} solicitação são precisos ${required} meses trabalhados; este emprego tem ${plural(monthsWorked, "mês", "meses")}. Empregos anteriores recentes podem completar o prazo.`,
      ...none,
    };
  }

  const installments = monthsWorked >= 24 ? 5 : monthsWorked >= 12 ? 4 : 3;
  const value = unemploymentInstallmentValue(salary);
  return {
    eligible: true,
    reason: `${ordinal} solicitação com ${plural(monthsWorked, "mês", "meses")} trabalhados: ${installments} parcelas de ${formatCurrency(value)} (média dos últimos 3 salários).`,
    installments,
    value,
    total: installments * value,
  };
}

export function calculateRescission(
  salary: number,
  dependents: number,
  input: RescissionInput,
  today: Date = new Date(),
): RescissionOutcome {
  const admission = parseIsoDate(input.admissionDate);
  if (!admission) return { ok: false, message: "Informe a data de admissão para ver o cálculo." };
  const termination = input.terminationDate ? parseIsoDate(input.terminationDate) : todayDate(today);
  if (!termination) return { ok: false, message: "A data de saída não é válida." };
  if (toDayNumber(termination) < toDayNumber(admission)) {
    return { ok: false, message: "A data de saída precisa ser depois da admissão." };
  }

  const { type } = input;
  const noticeMode = noticeModeFor(type, input.noticeMode);
  const daily = salary / 30;

  // ---------- tempo de serviço e aviso ----------
  const span = completeMonths(admission, termination);
  const years = Math.floor(span.months / 12);
  const employerNotice = Math.min(NOTICE_BASE_DAYS + NOTICE_DAYS_PER_YEAR * years, NOTICE_MAX_DAYS);
  const extraDays = employerNotice - NOTICE_BASE_DAYS;

  let totalDays = employerNotice;
  let paidDays = 0;
  let projectedDays = 0;
  let noticeDetail = "";
  if (type === "PEDIDO") {
    totalDays = NOTICE_BASE_DAYS;
  } else if (noticeMode === "INDENIZADO") {
    projectedDays = employerNotice;
    paidDays = type === "ACORDO" ? employerNotice * AGREEMENT_NOTICE_SHARE : employerNotice;
    noticeDetail =
      `30 dias + 3 por ano completo (${years} × 3 = ${extraDays}) = ${employerNotice} dias` +
      (type === "ACORDO" ? `; no acordo a empresa paga metade: ${plural(paidDays, "dia", "dias")}` : "") +
      ` × ${formatCurrency(daily)} por dia (salário ÷ 30)`;
  } else {
    // Trabalhado: os 30 dias já vieram como salário; o acréscimo por tempo de
    // casa não pode ser exigido em trabalho e é pago à parte.
    projectedDays = extraDays;
    paidDays = type === "ACORDO" ? extraDays * AGREEMENT_NOTICE_SHARE : extraDays;
    noticeDetail =
      `Os 30 dias trabalhados vieram como salário. Os ${extraDays} dias a mais (3 por ano completo) são pagos` +
      (type === "ACORDO" ? ` pela metade: ${plural(paidDays, "dia", "dias")}` : "") +
      ` × ${formatCurrency(daily)} por dia`;
  }
  const projectedEnd = addDays(termination, projectedDays);

  const earnings: RescissionItem[] = [];
  const discounts: RescissionItem[] = [];

  // ---------- saldo de salário ----------
  const sameMonth = admission.year === termination.year && admission.month === termination.month;
  const startDay = sameMonth ? admission.day : 1;
  const lastDayOfMonth = termination.day === daysInMonth(termination.year, termination.month);
  const salaryDays = startDay === 1 && lastDayOfMonth ? 30 : Math.min(30, termination.day - startDay + 1);
  const salaryBalance = daily * salaryDays;
  earnings.push({
    key: "saldo",
    label: "Saldo de salário",
    value: salaryBalance,
    detail: `${plural(salaryDays, "dia trabalhado", "dias trabalhados")} em ${MONTH_ABBR[termination.month - 1]}/${termination.year} × ${formatCurrency(daily)} (salário ÷ 30)`,
  });

  // ---------- aviso prévio ----------
  const noticePay = daily * paidDays;
  earnings.push({
    key: "aviso",
    label: type === "PEDIDO" ? "Aviso prévio" : noticeMode === "INDENIZADO" ? "Aviso prévio indenizado" : "Aviso prévio (dias a mais)",
    value: noticePay,
    detail:
      type === "PEDIDO"
        ? "Quem pede demissão não recebe aviso: cumpre 30 dias ou é dispensado deles."
        : paidDays === 0
          ? "Menos de 1 ano completo: o aviso é só os 30 dias, que você trabalhou."
          : noticeDetail,
  });

  // ---------- 13º proporcional ----------
  const yearStart = { year: termination.year, month: 1, day: 1 };
  const thirteenthStart = toDayNumber(admission) > toDayNumber(yearStart) ? admission : yearStart;
  const thirteenthMonths = thirteenthAvos(thirteenthStart, projectedEnd);
  const thirteenth = (salary * thirteenthMonths) / 12;
  earnings.push({
    key: "decimo",
    label: "13º salário proporcional",
    value: thirteenth,
    detail: `${formatCurrency(salary)} ÷ 12 × ${thirteenthMonths} ${thirteenthMonths === 1 ? "mês" : "meses"} (conta o mês com 15 dias ou mais de trabalho, de ${formatDate(thirteenthStart)} a ${formatDate(projectedEnd)}${projectedDays > 0 ? ", já com a projeção do aviso" : ""})`,
  });

  // ---------- férias ----------
  // Só o período mais recente ainda está no prazo de 12 meses para tirar; os
  // dias além dos 30 dele são de períodos anteriores e saem em dobro.
  const expiredLimit = 30 * years;
  const expiredAsked = Math.max(0, Math.round(input.expiredVacationDays));
  const expired = Math.min(expiredAsked, expiredLimit);
  const doubled = Math.max(0, expired - 30);
  if (expired > 0) {
    const value = daily * (expired + doubled);
    earnings.push({
      key: "ferias-vencidas",
      label: "Férias vencidas",
      value,
      detail:
        `${plural(expired, "dia", "dias")} sem tirar × ${formatCurrency(daily)} por dia (salário ÷ 30)` +
        (doubled > 0
          ? `; ${plural(doubled, "dia passou", "dias passaram")} do prazo de 12 meses para tirar e ${doubled === 1 ? "é pago" : "são pagos"} em dobro (art. 137 da CLT)`
          : "") +
        (expiredAsked > expired
          ? `. Limitado a ${expiredLimit} dias: 30 por ano completo de empresa`
          : ""),
    });
    earnings.push({
      key: "terco-vencidas",
      label: "1/3 sobre férias vencidas",
      value: value / 3,
      detail: `Um terço de ${formatCurrency(value)}`,
    });
  }

  const periodStart = addMonths(admission, years * 12);
  const vacationMonths = vacationAvos(periodStart, projectedEnd);
  const vacation = (salary * vacationMonths) / 12;
  earnings.push({
    key: "ferias",
    label: "Férias proporcionais",
    value: vacation,
    detail: `${formatCurrency(salary)} ÷ 12 × ${vacationMonths} ${vacationMonths === 1 ? "mês" : "meses"} desde o último aniversário de contrato (${formatDate(periodStart)}), contando frações de 15 dias ou mais`,
  });
  earnings.push({
    key: "terco",
    label: "1/3 sobre férias proporcionais",
    value: vacation / 3,
    detail: `Um terço de ${formatCurrency(vacation)}`,
  });

  // ---------- descontos ----------
  // Aviso indenizado e férias indenizadas (+ 1/3) não têm INSS nem IR.
  const inssSalary = calculateInss(salaryBalance);
  discounts.push({
    key: "inss-saldo",
    label: "INSS sobre o saldo de salário",
    value: inssSalary,
    detail: "Tabela progressiva do INSS aplicada ao saldo de salário",
  });
  const irrfSalary = calculateIrrf(salaryBalance, inssSalary, dependents);
  discounts.push({
    key: "irrf-saldo",
    label: "IRRF sobre o saldo de salário",
    value: irrfSalary,
    detail:
      irrfSalary > 0
        ? "Tabela do IR com o desconto mais vantajoso (INSS + dependentes ou simplificado)"
        : "Isento: abaixo do limite ou zerado pela redução da Lei 15.270/2025",
  });
  const inssThirteenth = calculateInss(thirteenth);
  discounts.push({
    key: "inss-decimo",
    label: "INSS sobre o 13º",
    value: inssThirteenth,
    detail: "Calculado separado do salário, pela mesma tabela",
  });
  const irrfThirteenth = calculateIrrf(thirteenth, inssThirteenth, dependents, {
    allowSimplifiedDeduction: false,
  });
  discounts.push({
    key: "irrf-decimo",
    label: "IRRF sobre o 13º",
    value: irrfThirteenth,
    detail:
      irrfThirteenth > 0
        ? "Tributação exclusiva do 13º, sem desconto simplificado"
        : "Isento: abaixo do limite ou zerado pela redução da Lei 15.270/2025",
  });
  if (input.thirteenthAdvancePaid && thirteenth > 0) {
    discounts.push({
      key: "adiantamento-decimo",
      label: "1ª parcela do 13º já recebida",
      value: Math.min(salary / 2, thirteenth),
      detail: "Metade do salário, paga até 30/11, sai do 13º da rescisão",
    });
  }
  if (type === "PEDIDO" && noticeMode === "NAO_CUMPRIDO") {
    discounts.push({
      key: "aviso-nao-cumprido",
      label: "Aviso prévio não cumprido",
      value: salary,
      detail: "Quem pede demissão e não cumpre os 30 dias tem um salário descontado (art. 487, § 2º, da CLT)",
    });
  }

  const grossEarnings = earnings.reduce((sum, item) => sum + item.value, 0);
  const totalDiscounts = discounts.reduce((sum, item) => sum + item.value, 0);

  // ---------- FGTS ----------
  // Sem saldo informado, estima os depósitos: 8% dos salários, dos 13º de anos
  // anteriores e do 1/3 das férias já tiradas. Não inclui o rendimento da conta.
  const monthsBeforeLastMonth = span.months + span.days / 30 - salaryDays / 30;
  const monthsBeforeThisYear = Math.max(0, completeMonths(admission, addDays(yearStart, -1)).months);
  const vacationsTaken = Math.max(0, years - expired / 30);
  const estimatedBalance =
    FGTS_RATE * salary * (Math.max(0, monthsBeforeLastMonth) + monthsBeforeThisYear / 12 + vacationsTaken / 3);
  const balanceEstimated = input.fgtsBalance === null;
  const balance = input.fgtsBalance ?? estimatedBalance;
  const deposit = FGTS_RATE * (salaryBalance + noticePay + thirteenth);
  const fineRate = type === "SEM_JUSTA_CAUSA" ? FGTS_TERMINATION_FINE_RATE : type === "ACORDO" ? FGTS_AGREEMENT_FINE_RATE : 0;
  const account = balance + deposit;
  const fine = account * fineRate;
  const withdrawable =
    type === "PEDIDO"
      ? 0
      : input.saqueAniversario
        ? fine
        : (type === "ACORDO" ? account * FGTS_AGREEMENT_WITHDRAWAL : account) + fine;
  const fgtsDetail =
    type === "PEDIDO"
      ? "No pedido de demissão não há multa e o saldo fica na conta — continua seu, para sacar em outras situações (compra da casa própria, aposentadoria etc.)."
      : input.saqueAniversario
        ? "Quem aderiu ao saque-aniversário recebe só a multa; o saldo continua bloqueado na conta."
        : type === "ACORDO"
          ? "No acordo você saca até 80% do saldo e recebe a multa de 20%; o resto fica na conta."
          : "Sem justa causa você saca todo o saldo e recebe a multa de 40%.";

  const unemploymentResult = unemployment(type, salary, span.months, input.unemploymentRequests);
  const net = grossEarnings - totalDiscounts;

  return {
    ok: true,
    result: {
      type,
      salary,
      noticeMode,
      admission,
      termination,
      projectedEnd,
      service: { years, months: span.months % 12, days: span.days, totalMonths: span.months },
      notice: { totalDays, paidDays, projectedDays },
      earnings,
      discounts,
      grossEarnings,
      totalDiscounts,
      net,
      fgts: {
        balance,
        balanceEstimated,
        deposit,
        fineRate,
        fine,
        withdrawable,
        remaining: account + fine - withdrawable,
        detail: fgtsDetail,
      },
      unemployment: unemploymentResult,
      total: net + withdrawable + unemploymentResult.total,
    },
  };
}

/** Os três tipos de demissão com os mesmos dados e a mesma data de saída. */
export function compareRescissions(
  salary: number,
  dependents: number,
  input: RescissionInput,
  today: Date = new Date(),
): { type: RescissionType; outcome: RescissionOutcome }[] {
  return RESCISSION_TYPES.map(({ id }) => ({
    type: id,
    outcome: calculateRescission(
      salary,
      dependents,
      { ...input, type: id, noticeMode: noticeModeFor(id, input.noticeMode) },
      today,
    ),
  }));
}
