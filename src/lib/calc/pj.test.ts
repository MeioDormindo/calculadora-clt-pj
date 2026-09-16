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

  const dias = { ...sheetPj, holidaysPerYear: 12, sickDaysPerYear: 5, vacationDaysPerYear: 20 };

  it("custo dos dias parados sai da taxa diária", () => {
    const result = calculateLostDaysCost(11000, dias);
    expect(result.dailyRate).toBeCloseTo(500, 2);
    expect(result.totalLostDays).toBe(37);
    expect(result.annualCost).toBeCloseTo(18500, 2);
  });

  it("separa feriados, doença e férias em linhas próprias", () => {
    const { breakdown } = calculateLostDaysCost(11000, dias);
    expect(breakdown.map((b) => b.key)).toEqual(["lostHolidays", "lostSick", "lostVacation"]);
    // Taxa diária de R$ 500: 12 feriados = 6.000/ano = 500/mês.
    expect(breakdown[0].monthlyCost).toBeCloseTo(500, 2);
    expect(breakdown[1].monthlyCost).toBeCloseTo(208.33, 2);
    expect(breakdown[2].monthlyCost).toBeCloseTo(833.33, 2);
  });

  it("zera o custo de feriados e atestados quando a empresa abona", () => {
    const result = calculateLostDaysCost(11000, {
      ...dias,
      paidHolidays: true,
      paidSickDays: true,
    });
    expect(result.breakdown[0].monthlyCost).toBe(0);
    expect(result.breakdown[1].monthlyCost).toBe(0);
    expect(result.breakdown[2].monthlyCost).toBeCloseTo(833.33, 2);
    expect(result.totalUnpaidDays).toBe(20);
    expect(result.totalLostDays).toBe(37);
  });

  it("cobra só os dias de férias que a empresa não paga", () => {
    const result = calculateLostDaysCost(11000, { ...dias, paidVacationDays: 15 });
    // Sobram 5 dos 20 dias: 5 x 500 = 2.500/ano.
    expect(result.breakdown[2].unpaidDays).toBe(5);
    expect(result.breakdown[2].monthlyCost).toBeCloseTo(208.33, 2);
  });

  it("não deixa dias pagos passarem do total de férias", () => {
    const result = calculateLostDaysCost(11000, { ...dias, paidVacationDays: 99 });
    expect(result.breakdown[2].unpaidDays).toBe(0);
    expect(result.breakdown[2].monthlyCost).toBe(0);
  });

  it("descreve no rótulo quando a empresa cobre os dias", () => {
    const abonado = calculateLostDaysCost(11000, { ...dias, paidHolidays: true });
    expect(abonado.breakdown[0].label).toContain("pagos pela empresa");

    const parcial = calculateLostDaysCost(11000, { ...dias, paidVacationDays: 15 });
    expect(parcial.breakdown[2].label).toContain("5 de 20");
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

  it("expõe cada tipo de dia parado como custo separado", () => {
    const pj = calculatePj(
      11000,
      { ...sheetPj, holidaysPerYear: 12, sickDaysPerYear: 5, vacationDaysPerYear: 20 },
      clt,
    );
    const keys = pj.costs.map((c) => c.key);
    expect(keys).toContain("lostHolidays");
    expect(keys).toContain("lostSick");
    expect(keys).toContain("lostVacation");
    expect(keys).not.toContain("lostDays");
  });

  it("avisa quando o faturamento estoura o teto do MEI", () => {
    const mei = { ...sheetPj, taxRegime: "MEI" as const };
    expect(calculatePj(6000, mei, clt).exceedsMeiLimit).toBe(false);
    expect(calculatePj(15000, mei, clt).exceedsMeiLimit).toBe(true);
  });
});
