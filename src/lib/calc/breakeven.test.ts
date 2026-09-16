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

  it("sobe quando há mais dias sem faturamento", () => {
    const without = findMinimumPjGross(clt, sheetPj);
    const withDays = findMinimumPjGross(clt, {
      ...sheetPj,
      holidaysPerYear: 12,
      sickDaysPerYear: 5,
      vacationDaysPerYear: 20,
    });
    expect(withDays!).toBeGreaterThan(without!);
  });
});

describe("análise empresa vs empregado", () => {
  const result = compareCltVsPj(sheetClt, sheetPj);

  it("compara o custo da empresa nos dois regimes", () => {
    expect(result.analysisProposed.employerClt).toBeCloseTo(20861.11, 2);
    expect(result.analysisProposed.employerPj).toBeCloseTo(15000, 2);
    expect(result.analysisProposed.employerDelta).toBeCloseTo(-5861.11, 2);
    expect(result.analysisProposed.employerDeltaPct).toBeCloseTo(-28.1, 1);
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
