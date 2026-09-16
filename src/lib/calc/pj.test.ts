import { describe, expect, it } from "vitest";
import { calculatePjTax, calculatePjInss, calculateLostDaysCost, calculatePj } from "./pj";
import { calculateClt } from "./clt";
import { sheetClt, sheetPj } from "./fixtures";

describe("impostos e contribuições do PJ", () => {
  it("MEI paga DAS fixo, independente do faturamento", () => {
    expect(calculatePjTax(10000, "MEI", 0)).toBeCloseTo(86.05, 2);
  });

  it("Simples Anexo III cobra 6% do faturamento", () => {
    expect(calculatePjTax(10000, "SIMPLES_III", 0)).toBeCloseTo(600, 2);
  });

  it("taxa manual usa o percentual informado", () => {
    expect(calculatePjTax(10000, "MANUAL", 10)).toBeCloseTo(1000, 2);
  });

  it("INSS do MEI já vem no DAS", () => {
    expect(calculatePjInss(10000, "MEI", 0, 0)).toBe(0);
  });

  it("INSS do autônomo é 20%, limitado ao teto", () => {
    expect(calculatePjInss(5000, "AUTONOMO", 0, 0)).toBeCloseTo(1000, 2);
    expect(calculatePjInss(20000, "AUTONOMO", 0, 0)).toBeCloseTo(1695.11, 2);
  });

  it("custo dos dias parados sai da taxa diária", () => {
    const result = calculateLostDaysCost(11000, 22, 12, 5, 20);
    expect(result.dailyRate).toBeCloseTo(500, 2);
    expect(result.totalLostDays).toBe(37);
    expect(result.annualCost).toBeCloseTo(18500, 2);
  });
});

describe("lado PJ", () => {
  const clt = calculateClt(sheetClt);

  it("assume como custo todos os benefícios que a empresa bancava", () => {
    const pj = calculatePj(15000, sheetPj, clt);
    for (const benefit of clt.benefits) {
      const mirrored = pj.costs.find((c) => c.key === benefit.key);
      expect(mirrored?.value).toBeCloseTo(benefit.value, 6);
    }
  });

  it("líquida efetiva = faturamento menos todos os custos", () => {
    const pj = calculatePj(15000, sheetPj, clt);
    expect(pj.netEffective).toBeCloseTo(15000 - pj.totalCosts, 6);
  });

  it("para a empresa, o custo do PJ é apenas o valor da nota", () => {
    expect(calculatePj(15000, sheetPj, clt).employerCost).toBeCloseTo(15000, 2);
  });

  it("avisa quando o faturamento estoura o teto do MEI", () => {
    const mei = { ...sheetPj, taxRegime: "MEI" as const };
    expect(calculatePj(6000, mei, clt).exceedsMeiLimit).toBe(false);
    expect(calculatePj(15000, mei, clt).exceedsMeiLimit).toBe(true);
  });
});
