import { describe, expect, it } from "vitest";
import { findMinimumPjGross } from "./breakeven";
import { calculateClt } from "./clt";
import { calculatePj } from "./pj";
import { compareCltVsPj } from "./compare";
import { sheetClt, sheetPj } from "./fixtures";
import { buildContractCalendar } from "../calendar/workCalendar";

// 2026 inteiro, com Carnaval e Corpus Christi: 261 dias de semana, 12 feriados.
const cal = buildContractCalendar({ year: 2026, month: 1 }, 12, true);
const hoje = new Date(2026, 0, 10);

describe("ponto de equilíbrio", () => {
  const clt = calculateClt(sheetClt);

  it("iguala a líquida efetiva dos dois lados", () => {
    const minimum = findMinimumPjGross(clt, sheetPj, cal);
    expect(minimum).not.toBeNull();
    expect(calculatePj(minimum!, sheetPj, clt, cal).netEffective).toBeCloseTo(clt.netEffective, 1);
  });

  it("sobe quando o salário CLT sobe", () => {
    const low = findMinimumPjGross(calculateClt({ ...sheetClt, grossSalary: 6000 }), sheetPj, cal);
    const high = findMinimumPjGross(calculateClt({ ...sheetClt, grossSalary: 14000 }), sheetPj, cal);
    expect(high!).toBeGreaterThan(low!);
  });

  it("sobe quando há valor recebido por fora no CLT", () => {
    const semFora = findMinimumPjGross(clt, sheetPj, cal);
    const comFora = findMinimumPjGross(calculateClt({ ...sheetClt, externalIncome: 1500 }), sheetPj, cal);
    expect(comFora!).toBeGreaterThan(semFora!);
  });

  // A fixture tem feriados pagos e nenhum dia parado; aqui eles passam a custar.
  const comDias = { ...sheetPj, paidHolidays: false, sickDaysPerYear: 5, vacationDaysPerYear: 20 };

  it("sobe quando há dias sem faturamento", () => {
    expect(findMinimumPjGross(clt, comDias, cal)!).toBeGreaterThan(findMinimumPjGross(clt, sheetPj, cal)!);
  });

  it("sobe quando Carnaval e Corpus Christi deixam de ser pagos", () => {
    const semFacultativos = buildContractCalendar({ year: 2026, month: 1 }, 12, false);
    const com = findMinimumPjGross(clt, comDias, cal);
    const sem = findMinimumPjGross(clt, comDias, semFacultativos);
    expect(com!).toBeGreaterThan(sem!);
  });

  it("cai quando a empresa abona feriados e atestados", () => {
    const semAbono = findMinimumPjGross(clt, comDias, cal);
    const comAbono = findMinimumPjGross(clt, { ...comDias, paidHolidays: true, paidSickDays: true }, cal);
    expect(comAbono!).toBeLessThan(semAbono!);
  });

  it("cai quando a empresa paga dias de férias", () => {
    const semFerias = findMinimumPjGross(clt, comDias, cal);
    const comFerias = findMinimumPjGross(clt, { ...comDias, paidVacationDays: 20 }, cal);
    expect(comFerias!).toBeLessThan(semFerias!);
  });

  it("com tudo abonado, o mínimo iguala o cenário sem dias parados", () => {
    const semDias = findMinimumPjGross(clt, sheetPj, cal);
    const tudoPago = findMinimumPjGross(
      clt,
      { ...comDias, paidHolidays: true, paidSickDays: true, paidVacationDays: 20 },
      cal,
    );
    expect(tudoPago!).toBeCloseTo(semDias!, 1);
  });

  it("por hora, contratar mais horas pelo mesmo valor baixa o valor da hora e sobe o mínimo", () => {
    const porHora160 = findMinimumPjGross(clt, { ...sheetPj, billingMode: "HOURLY", monthlyHours: 160 }, cal);
    const porHora200 = findMinimumPjGross(clt, { ...sheetPj, billingMode: "HOURLY", monthlyHours: 200 }, cal);
    expect(porHora200!).toBeGreaterThan(porHora160!);
  });
});

describe("análise empresa vs empregado", () => {
  const result = compareCltVsPj(sheetClt, sheetPj, hoje);

  it("compara o custo da empresa nos dois regimes", () => {
    expect(result.analysisProposed.employerClt).toBeCloseTo(20705.56, 1);
    expect(result.analysisProposed.employerPj).toBeCloseTo(15000, 2);
    expect(result.analysisProposed.employerDelta).toBeCloseTo(-5705.56, 1);
    expect(result.analysisProposed.employerDeltaPct).toBeCloseTo(-27.56, 1);
  });

  it("mostra o quanto o custo do trabalhador aumenta", () => {
    expect(result.analysisProposed.workerDelta).toBeGreaterThan(0);
    expect(result.analysisProposed.workerPj).toBeGreaterThan(result.analysisProposed.workerClt);
  });

  it("no mínimo, a empresa ainda economiza mas o trabalhador empata", () => {
    expect(result.minimum).not.toBeNull();
    expect(result.minimum!.netEffective).toBeCloseTo(result.clt.netEffective, 1);
    expect(result.analysisMinimum!.employerDelta).toBeLessThan(0);
  });

  it("a variação da proposta é negativa quando ela fica abaixo do mínimo", () => {
    expect(result.proposed.grossInvoice).toBeLessThan(result.minimumGross!);
    expect(result.proposalDelta).toBeLessThan(0);
  });

  it("usa o calendário do contrato informado na fixture", () => {
    expect(result.calendar.months).toHaveLength(12);
    expect(result.calendar.start).toEqual({ year: 2026, month: 1 });
  });
});

describe("descontos seus e ajuda de custo no valor mínimo", () => {
  const cltBase = calculateClt(sheetClt);

  it("sua parte do plano não muda o mínimo: como PJ você paga o plano inteiro", () => {
    const semParte = findMinimumPjGross(cltBase, sheetPj, cal);
    const comParte = findMinimumPjGross(calculateClt({ ...sheetClt, healthPlanEmployeeShare: 400 }), sheetPj, cal);
    expect(comParte!).toBeCloseTo(semParte!, 1);
  });

  it("ajuda de custo sobe o mínimo, porque como PJ você a perde", () => {
    const semAjuda = findMinimumPjGross(cltBase, sheetPj, cal);
    const comAjuda = findMinimumPjGross(calculateClt({ ...sheetClt, allowance: 300 }), sheetPj, cal);
    expect(comAjuda!).toBeGreaterThan(semAjuda!);
  });
});

describe("empresa vs você com descontos seus", () => {
  it("seu desconto do plano conta como custo seu nos dois regimes", () => {
    const semDesconto = compareCltVsPj(sheetClt, sheetPj, hoje).analysisProposed;
    const comDesconto = compareCltVsPj({ ...sheetClt, healthPlanEmployeeShare: 300 }, sheetPj, hoje).analysisProposed;
    expect(comDesconto.workerClt).toBeCloseTo(semDesconto.workerClt + 300, 6);
    expect(comDesconto.workerPj).toBeCloseTo(semDesconto.workerPj + 300, 6);
    expect(comDesconto.workerDelta).toBeCloseTo(semDesconto.workerDelta, 6);
  });
});
