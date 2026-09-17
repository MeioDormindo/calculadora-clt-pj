import { describe, expect, it } from "vitest";
import { findMinimumPjGross } from "./breakeven";
import { calculateClt } from "./clt";
import { calculatePj } from "./pj";
import { compareCltVsPj } from "./compare";
import { sheetClt, sheetPj } from "./fixtures";

describe("ponto de equilíbrio", () => {
  const clt = calculateClt(sheetClt);

  it("iguala a líquida efetiva dos dois lados", () => {
    const minimum = findMinimumPjGross(clt, sheetPj);
    expect(minimum).not.toBeNull();

    const pj = calculatePj(minimum!, sheetPj, clt);
    expect(pj.netEffective).toBeCloseTo(clt.netEffective, 1);
  });

  it("sobe quando o salário CLT sobe", () => {
    const low = findMinimumPjGross(calculateClt({ ...sheetClt, grossSalary: 6000 }), sheetPj);
    const high = findMinimumPjGross(calculateClt({ ...sheetClt, grossSalary: 14000 }), sheetPj);
    expect(high!).toBeGreaterThan(low!);
  });

  it("sobe quando há valor recebido por fora no CLT", () => {
    const semFora = findMinimumPjGross(clt, sheetPj);
    const comFora = findMinimumPjGross(calculateClt({ ...sheetClt, externalIncome: 1500 }), sheetPj);
    expect(comFora!).toBeGreaterThan(semFora!);
  });

  const comDias = {
    ...sheetPj,
    holidaysPerYear: 12,
    sickDaysPerYear: 5,
    vacationDaysPerYear: 20,
  };

  it("sobe quando há mais dias sem faturamento", () => {
    const without = findMinimumPjGross(clt, sheetPj);
    const withDays = findMinimumPjGross(clt, comDias);
    expect(withDays!).toBeGreaterThan(without!);
  });

  it("cai quando a empresa abona feriados e atestados", () => {
    const semAbono = findMinimumPjGross(clt, comDias);
    const comAbono = findMinimumPjGross(clt, {
      ...comDias,
      paidHolidays: true,
      paidSickDays: true,
    });
    expect(comAbono!).toBeLessThan(semAbono!);
  });

  it("cai quando a empresa paga dias de férias", () => {
    const semFerias = findMinimumPjGross(clt, comDias);
    const comFerias = findMinimumPjGross(clt, { ...comDias, paidVacationDays: 20 });
    expect(comFerias!).toBeLessThan(semFerias!);
  });

  it("com tudo abonado, o mínimo iguala o cenário sem dias parados", () => {
    const semDias = findMinimumPjGross(clt, sheetPj);
    const tudoPago = findMinimumPjGross(clt, {
      ...comDias,
      paidHolidays: true,
      paidSickDays: true,
      paidVacationDays: 20,
    });
    expect(tudoPago!).toBeCloseTo(semDias!, 1);
  });
});

describe("análise empresa vs empregado", () => {
  const result = compareCltVsPj(sheetClt, sheetPj);

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
});

describe("descontos seus e ajuda de custo no valor mínimo", () => {
  const cltBase = calculateClt(sheetClt);

  it("sua parte do plano não muda o mínimo: como PJ você paga o plano inteiro", () => {
    const semParte = findMinimumPjGross(cltBase, sheetPj);
    const comParte = findMinimumPjGross(calculateClt({ ...sheetClt, healthPlanEmployeeShare: 400 }), sheetPj);
    expect(comParte!).toBeCloseTo(semParte!, 1);
  });

  it("ajuda de custo sobe o mínimo, porque como PJ você a perde", () => {
    const semAjuda = findMinimumPjGross(cltBase, sheetPj);
    const comAjuda = findMinimumPjGross(calculateClt({ ...sheetClt, allowance: 300 }), sheetPj);
    expect(comAjuda!).toBeGreaterThan(semAjuda!);
  });
});

describe("empresa vs você com descontos seus", () => {
  it("seu desconto do plano conta como custo seu nos dois regimes", () => {
    const semDesconto = compareCltVsPj(sheetClt, sheetPj).analysisProposed;
    const comDesconto = compareCltVsPj({ ...sheetClt, healthPlanEmployeeShare: 300 }, sheetPj).analysisProposed;
    expect(comDesconto.workerClt).toBeCloseTo(semDesconto.workerClt + 300, 6);
    expect(comDesconto.workerPj).toBeCloseTo(semDesconto.workerPj + 300, 6);
    expect(comDesconto.workerDelta).toBeCloseTo(semDesconto.workerDelta, 6);
  });
});
