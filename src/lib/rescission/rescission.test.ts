import { describe, expect, it } from "vitest";
import {
  calculateRescission,
  compareRescissions,
  noticeModeFor,
  unemploymentInstallmentValue,
  type RescissionInput,
  type RescissionResult,
} from "./rescission";
import { completeMonths, formatDate, parseIsoDate } from "./dates";

const base: RescissionInput = {
  admissionDate: "2023-03-10",
  terminationDate: "2026-09-17",
  type: "SEM_JUSTA_CAUSA",
  noticeMode: "INDENIZADO",
  expiredVacationPeriods: 0,
  fgtsBalance: 10000,
  saqueAniversario: false,
  thirteenthAdvancePaid: false,
  unemploymentRequests: 0,
};

function calc(input: Partial<RescissionInput> = {}, salary = 3000, dependents = 0): RescissionResult {
  const outcome = calculateRescission(salary, dependents, { ...base, ...input });
  if (!outcome.ok) throw new Error(outcome.message);
  return outcome.result;
}

const item = (r: RescissionResult, key: string) =>
  [...r.earnings, ...r.discounts].find((i) => i.key === key)?.value ?? 0;

describe("datas", () => {
  it("rejeita datas que não existem", () => {
    expect(parseIsoDate("2026-02-29")).toBeNull();
    expect(parseIsoDate("2028-02-29")).not.toBeNull();
    expect(parseIsoDate("")).toBeNull();
  });

  it("conta meses completos incluindo o último dia", () => {
    expect(completeMonths({ year: 2026, month: 3, day: 10 }, { year: 2026, month: 4, day: 9 })).toEqual({ months: 1, days: 0 });
    expect(completeMonths({ year: 2026, month: 3, day: 10 }, { year: 2026, month: 4, day: 8 })).toEqual({ months: 0, days: 30 });
    expect(completeMonths({ year: 2023, month: 3, day: 10 }, { year: 2026, month: 9, day: 17 })).toEqual({ months: 42, days: 8 });
  });
});

describe("demissão sem justa causa, aviso indenizado (conta feita à mão)", () => {
  const r = calc();

  it("tempo de casa e aviso de 30 + 3 × 3 anos", () => {
    expect(r.service).toEqual({ years: 3, months: 6, days: 8, totalMonths: 42 });
    expect(r.notice).toEqual({ totalDays: 39, paidDays: 39, projectedDays: 39 });
    expect(formatDate(r.projectedEnd)).toBe("26/10/2026");
  });

  it("verbas", () => {
    expect(item(r, "saldo")).toBeCloseTo(1700, 2); // 17 dias
    expect(item(r, "aviso")).toBeCloseTo(3900, 2); // 39 dias
    expect(item(r, "decimo")).toBeCloseTo(2500, 2); // 10/12 (outubro projetado)
    expect(item(r, "ferias")).toBeCloseTo(2000, 2); // 8/12 desde 10/03
    expect(item(r, "terco")).toBeCloseTo(666.67, 2);
  });

  it("descontos só no saldo e no 13º", () => {
    expect(item(r, "inss-saldo")).toBeCloseTo(128.69, 2);
    expect(item(r, "inss-decimo")).toBeCloseTo(200.69, 2);
    expect(item(r, "irrf-saldo")).toBe(0);
    expect(r.net).toBeCloseTo(10766.67 - 329.37, 1);
  });

  it("FGTS: depósito da rescisão, multa de 40% e saque total", () => {
    expect(r.fgts.deposit).toBeCloseTo(0.08 * 8100, 2);
    expect(r.fgts.fine).toBeCloseTo(0.4 * 10648, 2);
    expect(r.fgts.withdrawable).toBeCloseTo(10648 + 4259.2, 2);
    expect(r.fgts.remaining).toBeCloseTo(0, 6);
  });

  it("seguro-desemprego: 5 parcelas com 24 meses ou mais", () => {
    expect(r.unemployment.installments).toBe(5);
    expect(r.unemployment.value).toBeCloseTo(1777.74 + (3000 - 2222.17) * 0.5, 2);
    expect(r.total).toBeCloseTo(r.net + r.fgts.withdrawable + r.unemployment.total, 6);
  });
});

describe("regras de cada tipo", () => {
  it("pedido de demissão: sem aviso, sem multa, sem saque, sem seguro", () => {
    const r = calc({ type: "PEDIDO", noticeMode: "TRABALHADO" });
    expect(item(r, "aviso")).toBe(0);
    expect(r.notice.projectedDays).toBe(0);
    expect(item(r, "decimo")).toBeCloseTo(2250, 2); // 9/12, sem projeção
    expect(item(r, "ferias")).toBeCloseTo(1500, 2); // 6/12: 10/09 a 17/09 tem só 8 dias
    expect(r.fgts.fine).toBe(0);
    expect(r.fgts.withdrawable).toBe(0);
    expect(r.fgts.remaining).toBeCloseTo(r.fgts.balance + r.fgts.deposit, 6);
    expect(r.unemployment.eligible).toBe(false);
  });

  it("pedido sem cumprir o aviso desconta um salário", () => {
    const r = calc({ type: "PEDIDO", noticeMode: "NAO_CUMPRIDO" });
    expect(item(r, "aviso-nao-cumprido")).toBe(3000);
    const dispensado = calc({ type: "PEDIDO", noticeMode: "DISPENSADO" });
    expect(r.net).toBeCloseTo(dispensado.net - 3000, 6);
  });

  it("acordo: metade do aviso, projeção inteira, multa de 20% e saque de 80%", () => {
    const r = calc({ type: "ACORDO" });
    expect(item(r, "aviso")).toBeCloseTo(1950, 2);
    expect(r.notice.projectedDays).toBe(39);
    expect(item(r, "decimo")).toBeCloseTo(2500, 2);
    const account = 10000 + 0.08 * (1700 + 1950 + 2500);
    expect(r.fgts.fine).toBeCloseTo(account * 0.2, 2);
    expect(r.fgts.withdrawable).toBeCloseTo(account * 0.8 + account * 0.2, 2);
    expect(r.unemployment.eligible).toBe(false);
  });

  it("aviso trabalhado paga e projeta só os dias a mais", () => {
    const r = calc({ noticeMode: "TRABALHADO" });
    expect(r.notice.paidDays).toBe(9);
    expect(item(r, "aviso")).toBeCloseTo(900, 2);
    expect(formatDate(r.projectedEnd)).toBe("26/09/2026");
  });

  it("aviso limitado a 90 dias", () => {
    expect(calc({ admissionDate: "2000-01-01" }).notice.totalDays).toBe(90);
  });

  it("saque-aniversário libera só a multa", () => {
    const r = calc({ saqueAniversario: true });
    expect(r.fgts.withdrawable).toBeCloseTo(r.fgts.fine, 6);
    expect(r.fgts.remaining).toBeCloseTo(r.fgts.balance + r.fgts.deposit, 6);
  });
});

describe("detalhes", () => {
  it("férias vencidas: a mais antiga de duas é paga em dobro, com 1/3", () => {
    const r = calc({ expiredVacationPeriods: 2 });
    expect(item(r, "ferias-vencidas")).toBe(9000);
    expect(item(r, "terco-vencidas")).toBe(3000);
    // Não passa do número de anos completos.
    expect(item(calc({ expiredVacationPeriods: 3, admissionDate: "2025-01-01" }), "ferias-vencidas")).toBe(3000);
  });

  it("mês com menos de 15 dias não conta avo", () => {
    const r = calc({ type: "PEDIDO", noticeMode: "DISPENSADO", terminationDate: "2026-09-14" });
    expect(item(r, "decimo")).toBeCloseTo(2000, 2); // setembro com 14 dias não conta
  });

  it("saldo de salário do mês inteiro é 30 dias, inclusive em fevereiro", () => {
    expect(item(calc({ terminationDate: "2026-02-28" }), "saldo")).toBeCloseTo(3000, 2);
    expect(item(calc({ terminationDate: "2026-03-31" }), "saldo")).toBeCloseTo(3000, 2);
    expect(item(calc({ admissionDate: "2026-09-10", terminationDate: "2026-09-17" }), "saldo")).toBeCloseTo(800, 2);
  });

  it("projeção que passa do ano conta avos do ano seguinte", () => {
    const r = calc({ terminationDate: "2026-12-20" }); // +39 dias = 28/01/2027
    expect(formatDate(r.projectedEnd)).toBe("28/01/2027");
    expect(item(r, "decimo")).toBeCloseTo(3250, 2); // 12 + 1 avos
  });

  it("1ª parcela do 13º sai da rescisão", () => {
    const r = calc({ thirteenthAdvancePaid: true, terminationDate: "2026-12-10" });
    expect(item(r, "adiantamento-decimo")).toBe(1500);
  });

  it("IRRF aparece em salários altos", () => {
    const r = calc({}, 15000, 1);
    expect(item(r, "irrf-saldo")).toBeGreaterThan(0);
    expect(item(r, "irrf-decimo")).toBeGreaterThan(0);
  });

  it("estima o saldo do FGTS quando não informado", () => {
    const r = calc({ fgtsBalance: null });
    expect(r.fgts.balanceEstimated).toBe(true);
    // ~41,6 meses de salário + 13º de 2023-2025 (33 meses) + 3 férias tiradas
    expect(r.fgts.balance).toBeCloseTo(0.08 * 3000 * (42 + 8 / 30 - 17 / 30 + 33 / 12 + 1), 2);
  });

  it("valida as datas", () => {
    expect(calculateRescission(3000, 0, { ...base, admissionDate: null }).ok).toBe(false);
    expect(calculateRescission(3000, 0, { ...base, terminationDate: "2020-01-01" }).ok).toBe(false);
    const hoje = calculateRescission(3000, 0, { ...base, terminationDate: null }, new Date(2026, 8, 17));
    expect(hoje.ok && formatDate(hoje.result.termination)).toBe("17/09/2026");
  });
});

describe("seguro-desemprego", () => {
  it("faixas de 2026 e piso do salário mínimo", () => {
    expect(unemploymentInstallmentValue(1621)).toBe(1621);
    expect(unemploymentInstallmentValue(2222.17)).toBeCloseTo(1777.74, 2);
    expect(unemploymentInstallmentValue(3703.99)).toBeCloseTo(2518.65, 1);
    expect(unemploymentInstallmentValue(20000)).toBe(2518.65);
  });

  it("carência por número de solicitações", () => {
    const tenMonths = { admissionDate: "2025-11-01" };
    expect(calc({ ...tenMonths, unemploymentRequests: 0 }).unemployment.eligible).toBe(false);
    const second = calc({ ...tenMonths, unemploymentRequests: 1 }).unemployment;
    expect(second.eligible).toBe(true);
    expect(second.installments).toBe(3);
    expect(calc({ admissionDate: "2025-09-01" }).unemployment.installments).toBe(4);
  });
});

describe("comparação", () => {
  it("usa o aviso equivalente em cada tipo", () => {
    expect(noticeModeFor("PEDIDO", "INDENIZADO")).toBe("DISPENSADO");
    expect(noticeModeFor("ACORDO", "NAO_CUMPRIDO")).toBe("INDENIZADO");
    expect(noticeModeFor("PEDIDO", "TRABALHADO")).toBe("TRABALHADO");
  });

  it("sem justa causa rende mais que acordo, que rende mais que pedido", () => {
    const [sem, pedido, acordo] = compareRescissions(3000, 0, base).map((c) => {
      if (!c.outcome.ok) throw new Error();
      return c.outcome.result.total;
    });
    expect(sem).toBeGreaterThan(acordo);
    expect(acordo).toBeGreaterThan(pedido);
  });
});

describe("textos", () => {
  it("dias fracionados com vírgula", () => {
    const r = calculateRescission(3000, 0, { ...base, type: "ACORDO", admissionDate: "2019-05-02" });
    expect(r.ok && r.result.earnings.find((i) => i.key === "aviso")?.detail).toContain("25,5 dias");
  });
});
