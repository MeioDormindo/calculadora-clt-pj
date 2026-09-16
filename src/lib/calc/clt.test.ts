import { describe, expect, it } from "vitest";
import { calculateInss, calculateIrrf, calculateIrrfRedutor, calculateClt, deriveCltDefaults } from "./clt";
import { sheetClt } from "./fixtures";

describe("tabelas 2026", () => {
  it("calcula INSS progressivo para salário de R$ 5.000", () => {
    expect(calculateInss(5000)).toBeCloseTo(501.51, 1);
  });

  it("limita o INSS ao teto de contribuição", () => {
    expect(calculateInss(10000)).toBeCloseTo(988.09, 1);
    expect(calculateInss(50000)).toBeCloseTo(988.09, 1);
  });

  it("isenta o IRRF para rendimento bruto até R$ 5.000 (Lei 15.270/2025)", () => {
    expect(calculateIrrf(5000, 5000 - calculateInss(5000), 0)).toBe(0);
  });

  it("aplica o redutor progressivo entre R$ 5.000 e R$ 7.350", () => {
    expect(calculateIrrfRedutor(6000)).toBeCloseTo(179.75, 1);
    expect(calculateIrrfRedutor(7350.01)).toBe(0);
    expect(calculateIrrfRedutor(10000)).toBe(0);
  });
});

describe("provisões automáticas (critério da planilha, salário R$ 10.000)", () => {
  const auto = deriveCltDefaults(10000);

  it("adicional de férias = salário / 36", () => {
    expect(auto.vacationBonus).toBeCloseTo(277.78, 2);
  });

  it("décimo terceiro = salário / 12", () => {
    expect(auto.thirteenth).toBeCloseTo(833.33, 2);
  });

  it("FGTS e multa do FGTS", () => {
    expect(auto.fgts).toBeCloseTo(800, 2);
    expect(auto.fgtsFine).toBeCloseTo(320, 2);
  });

  it("aviso prévio = salário / 24", () => {
    expect(auto.priorNotice).toBeCloseTo(416.67, 2);
  });

  it("encargos patronais: INSS 20%, RAT 3%, Sistema S 5,8%", () => {
    expect(auto.employerInss).toBeCloseTo(2000, 2);
    expect(auto.rat).toBeCloseTo(300, 2);
    expect(auto.sistemaS).toBeCloseTo(580, 2);
  });
});

describe("agregados do CLT contra a planilha de referência", () => {
  const clt = calculateClt(sheetClt);

  it("remuneração direta = bruto + adicional de férias + 13º", () => {
    expect(clt.directPay).toBeCloseTo(11111.11, 2);
  });

  it("total de benefícios bancados pela empresa", () => {
    expect(clt.totalBenefits).toBeCloseTo(6870, 2);
  });

  it("total de encargos patronais", () => {
    expect(clt.totalEmployerCharges).toBeCloseTo(2880, 2);
  });

  it("custo total do empregado para a empresa", () => {
    expect(clt.employerCost).toBeCloseTo(20861.11, 2);
  });

  it("remuneração líquida efetiva desconta apenas INSS e IRRF", () => {
    expect(clt.netEffective).toBeCloseTo(clt.directPay - clt.inss - clt.irrf, 6);
  });

  it("respeita valores sobrescritos pelo usuário", () => {
    const overridden = calculateClt({ ...sheetClt, rat: 100, profitSharing: 0 });
    expect(overridden.totalEmployerCharges).toBeCloseTo(2000 + 100 + 580, 2);
    expect(overridden.totalBenefits).toBeCloseTo(6870 - 833.33, 1);
  });
});
