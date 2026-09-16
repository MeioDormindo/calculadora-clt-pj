import { describe, expect, it } from "vitest";
import {
  calculatePjTax,
  calculatePjInss,
  calculateLostDaysCost,
  calculatePj,
  applyActivity,
} from "./pj";
import { PJ_ACTIVITIES, PJ_TAX_PRESETS, PJ_INSS_PRESETS, INSS_CEILING } from "./constants";
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

describe("atividade do PJ", () => {
  it("INSS no Fator R é 11% sobre pró-labore de 28% do faturamento", () => {
    // 15.000 x 28% = 4.200 de pró-labore; 11% disso = 462.
    expect(calculatePjInss(15000, "FATOR_R", 0, 0)).toBeCloseTo(462, 2);
  });

  it("pró-labore do Fator R respeita salário mínimo e teto do INSS", () => {
    expect(calculatePjInss(1000, "FATOR_R", 0, 0)).toBeCloseTo(1621 * 0.11, 2);
    expect(calculatePjInss(100000, "FATOR_R", 0, 0)).toBeCloseTo(INSS_CEILING * 0.11, 2);
  });

  it("Comércio usa o Anexo I, de 4%", () => {
    expect(calculatePjTax(10000, "SIMPLES_I", 0)).toBeCloseTo(400, 2);
  });

  it("toda atividade aponta para regime e INSS que existem", () => {
    const regimes = PJ_TAX_PRESETS.map((p) => p.id);
    const inss = PJ_INSS_PRESETS.map((p) => p.id);
    for (const activity of PJ_ACTIVITIES) {
      expect(regimes).toContain(activity.taxRegime);
      expect(inss).toContain(activity.inssMode);
    }
  });

  it("fora do modo manual, a atividade manda no regime e no INSS", () => {
    const resolvido = applyActivity({
      ...sheetPj,
      activity: "TI",
      taxRegime: "SIMPLES_V",
      inssMode: "AUTONOMO",
    });
    expect(resolvido.taxRegime).toBe("SIMPLES_III");
    expect(resolvido.inssMode).toBe("FATOR_R");
  });

  it("corrige estado antigo salvo no navegador, de antes das atividades", () => {
    // Merge do localStorage: activity vem do padrão novo, o resto do salvo.
    const antigo = { ...sheetPj, activity: "TI", inssMode: "SIMPLES_PROLABORE" as const };
    expect(applyActivity(antigo).inssMode).toBe("FATOR_R");
  });

  it("no modo manual, respeita o que foi escolhido", () => {
    const manual = { ...sheetPj, activity: "CUSTOM", taxRegime: "SIMPLES_V" as const };
    expect(applyActivity(manual)).toEqual(manual);
  });

  it("atividade desconhecida não quebra o cálculo", () => {
    const estranho = { ...sheetPj, activity: "NAO_EXISTE" };
    expect(applyActivity(estranho)).toEqual(estranho);
  });
});
