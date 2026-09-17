import { describe, expect, it } from "vitest";
import {
  calculateInss,
  calculateIrrf,
  calculateIrrfReduction,
  calculateClt,
  deriveCltDefaults,
  companyTransportVoucher,
} from "./clt";
import { sheetClt } from "./fixtures";

describe("INSS 2026", () => {
  it("é progressivo por faixa", () => {
    expect(calculateInss(5000)).toBeCloseTo(501.51, 1);
  });

  it("para no teto de contribuição", () => {
    expect(calculateInss(10000)).toBeCloseTo(988.09, 1);
    expect(calculateInss(50000)).toBeCloseTo(988.09, 1);
  });
});

describe("IRRF 2026", () => {
  it("zera em R$ 5.000 — a redução máxima da lei é exatamente o imposto com desconto simplificado", () => {
    // 5000 - 607,20 = 4392,80 -> x 22,5% - 675,49 = 312,89 = redução máxima.
    expect(calculateIrrf(5000, calculateInss(5000), 0)).toBeCloseTo(0, 6);
  });

  it("usa o desconto simplificado quando ele é maior que o INSS", () => {
    // R$ 5.500: INSS 571,51 < 607,20. Base 4892,80 -> 436,79; redução 246,32.
    expect(calculateIrrf(5500, calculateInss(5500), 0)).toBeCloseTo(190.47, 1);
  });

  it("usa as deduções legais quando o INSS é maior que o simplificado", () => {
    // R$ 6.000: INSS 641,51 > 607,20. Base 5358,49 -> 564,85; redução 179,75.
    expect(calculateIrrf(6000, calculateInss(6000), 0)).toBeCloseTo(385.1, 1);
  });

  it("não aplica redução acima de R$ 7.350", () => {
    // Base 10000 - 988,09 = 9011,91 -> x 27,5% - 908,73.
    expect(calculateIrrf(10000, calculateInss(10000), 0)).toBeCloseTo(1569.55, 1);
  });

  it("no 13º não existe desconto simplificado", () => {
    const inss = calculateInss(5500);
    const comSimplificado = calculateIrrf(5500, inss, 0);
    const semSimplificado = calculateIrrf(5500, inss, 0, { allowSimplifiedDeduction: false });
    expect(semSimplificado).toBeCloseTo(200.29, 1);
    expect(semSimplificado).toBeGreaterThan(comSimplificado);
  });

  it("dependentes reduzem o imposto", () => {
    const inss = calculateInss(10000);
    const semDependentes = calculateIrrf(10000, inss, 0);
    const comDois = calculateIrrf(10000, inss, 2);
    expect(semDependentes - comDois).toBeCloseTo(2 * 189.59 * 0.275, 1);
  });

  it("a redução é contínua na fronteira de R$ 5.000", () => {
    expect(calculateIrrfReduction(5000, 1000)).toBeCloseTo(312.89, 2);
    expect(calculateIrrfReduction(5000.01, 1000)).toBeCloseTo(312.89, 1);
    expect(calculateIrrfReduction(7350.01, 1000)).toBe(0);
  });

  it("até R$ 5.000 a redução nunca passa do próprio imposto", () => {
    expect(calculateIrrfReduction(4000, 50)).toBe(50);
  });
});

describe("provisões e encargos automáticos (salário R$ 10.000)", () => {
  const auto = deriveCltDefaults({ grossSalary: 10000, vacationBonus: null, thirteenth: null });

  it("adicional de férias e 13º diluídos por mês", () => {
    expect(auto.vacationBonus).toBeCloseTo(277.78, 2);
    expect(auto.thirteenth).toBeCloseTo(833.33, 2);
  });

  it("FGTS incide sobre salário, 13º e férias + 1/3, não só sobre o salário", () => {
    // 8% x (10.000 + 833,33 + 277,78) = 888,89. A planilha usava 8% x 10.000.
    expect(auto.fgts).toBeCloseTo(888.89, 2);
    expect(auto.fgtsFine).toBeCloseTo(355.56, 2);
  });

  it("FGTS acompanha 13º e férias quando eles são sobrescritos", () => {
    const semDecimo = deriveCltDefaults({ grossSalary: 10000, vacationBonus: null, thirteenth: 0 });
    expect(semDecimo.fgts).toBeCloseTo(0.08 * (10000 + 277.78), 1);
  });

  it("aviso prévio = salário / 24", () => {
    expect(auto.priorNotice).toBeCloseTo(416.67, 2);
  });

  it("encargos patronais sobre a folha inteira", () => {
    expect(auto.employerInss).toBeCloseTo(2222.22, 2);
    expect(auto.rat).toBeCloseTo(333.33, 2);
    expect(auto.sistemaS).toBeCloseTo(644.44, 2);
  });
});

describe("vale-transporte", () => {
  it("a empresa só paga o que passa de 6% do salário", () => {
    expect(companyTransportVoucher(600, 5000)).toBeCloseTo(300, 2);
  });

  it("não vira benefício quando 6% do salário já cobre o vale", () => {
    expect(companyTransportVoucher(600, 10000)).toBe(0);
    expect(companyTransportVoucher(200, 5000)).toBe(0);
  });
});

describe("CLT completo (salário R$ 10.000)", () => {
  const clt = calculateClt(sheetClt);

  it("remuneração direta = bruto + adicional de férias + 13º", () => {
    expect(clt.directPay).toBeCloseTo(11111.11, 2);
  });

  it("INSS e IRRF são a média do ano, com férias e 13º tributados", () => {
    // São 13 pagamentos em 12 meses. INSS: 988,09 (no teto) x 13 / 12.
    // IRRF: 11 meses a 1.569,55 + férias (13.333,33) a 2.486,21 + 13º a 1.569,55.
    expect(clt.inss).toBeCloseTo((988.09 * 13) / 12, 1);
    expect(clt.irrf).toBeCloseTo(1776.73, 1);
    expect(clt.irrf).toBeGreaterThan(calculateIrrf(10000, calculateInss(10000), 0));
  });

  it("líquida efetiva desconta impostos médios e a sua parte do VT", () => {
    // VT de 600 com salário de 10.000: os 6% (600) saem inteiros do seu holerite.
    expect(clt.totalEmployeeShares).toBeCloseTo(600, 2);
    expect(clt.netEffective).toBeCloseTo(clt.directPay - clt.inss - clt.irrf - 600, 6);
    expect(clt.netEffective).toBeCloseTo(8263.95 - 600, 1);
  });

  it("benefícios: FGTS sobre a folha e VT zerado pela regra dos 6%", () => {
    // 888,89 + 355,56 + 416,67 + 0 (VT) + 600 + 2.800 + 833,33 + 0 + 500.
    expect(clt.totalBenefits).toBeCloseTo(6394.44, 1);
  });

  it("encargos e custo total para a empresa", () => {
    expect(clt.totalEmployerCharges).toBeCloseTo(3200, 1);
    expect(clt.employerCost).toBeCloseTo(11111.11 + 6394.44 + 3200, 1);
  });

  it("soma o valor recebido por fora sem cobrar imposto sobre ele", () => {
    const comFora = calculateClt({ ...sheetClt, externalIncome: 1500 });
    expect(comFora.inss).toBeCloseTo(clt.inss, 6);
    expect(comFora.irrf).toBeCloseTo(clt.irrf, 6);
    expect(comFora.netEffective).toBeCloseTo(clt.netEffective + 1500, 6);
    expect(comFora.employerCost).toBeCloseTo(clt.employerCost + 1500, 6);
  });

  it("respeita valores sobrescritos pelo usuário", () => {
    const sobrescrito = calculateClt({ ...sheetClt, rat: 100, profitSharing: 0 });
    expect(sobrescrito.totalEmployerCharges).toBeCloseTo(2222.22 + 100 + 644.44, 1);
    expect(sobrescrito.totalBenefits).toBeCloseTo(6394.44 - 833.33, 1);
  });
});

describe("holerite do mês", () => {
  // Valores de um holerite real (agosto/2026), usados só como números.
  const holerite = calculateClt({
    ...sheetClt,
    grossSalary: 3980.02,
    transportVoucher: 0,
    healthPlanEmployeeShare: 341.55,
    allowance: 100,
  }).payslip;

  it("INSS bate com o holerite (diferença de centavo é arredondamento da folha)", () => {
    // Holerite: 366,19. Faixa a faixa exato: 366,2022.
    expect(holerite.inss).toBeCloseTo(366.19, 1);
  });

  it("IRRF zerado abaixo de R$ 5.000, como no holerite", () => {
    expect(holerite.irrf).toBeCloseTo(0, 6);
  });

  it("FGTS do mês bate com o holerite", () => {
    expect(holerite.fgts).toBeCloseTo(318.4, 2);
  });

  it("vencimentos, descontos e líquido batem com o holerite", () => {
    expect(holerite.totalEarnings).toBeCloseTo(4080.02, 2);
    expect(holerite.totalDiscounts).toBeCloseTo(707.74, 1);
    expect(holerite.net).toBeCloseTo(3372.28, 1);
  });

  it("desconta o VT até 6% do salário", () => {
    const comVt = calculateClt({ ...sheetClt, grossSalary: 3000, transportVoucher: 400 }).payslip;
    expect(comVt.transportVoucherDiscount).toBeCloseTo(180, 2);
    const vtBarato = calculateClt({ ...sheetClt, grossSalary: 3000, transportVoucher: 100 }).payslip;
    expect(vtBarato.transportVoucherDiscount).toBeCloseTo(100, 2);
  });
});

describe("ajuda de custo e sua parte do plano", () => {
  const base = calculateClt(sheetClt);

  it("ajuda de custo entra no líquido e no custo da empresa, sem imposto", () => {
    const comAjuda = calculateClt({ ...sheetClt, allowance: 100 });
    expect(comAjuda.inss).toBeCloseTo(base.inss, 6);
    expect(comAjuda.irrf).toBeCloseTo(base.irrf, 6);
    expect(comAjuda.netEffective).toBeCloseTo(base.netEffective + 100, 6);
    expect(comAjuda.employerCost).toBeCloseTo(base.employerCost + 100, 6);
    expect(comAjuda.benefits.find((b) => b.key === "fgts")?.value).toBeCloseTo(
      base.benefits.find((b) => b.key === "fgts")!.value,
      6,
    );
  });

  it("sua parte do plano sai do líquido, mas não é custo da empresa", () => {
    const comCoparticipacao = calculateClt({ ...sheetClt, healthPlanEmployeeShare: 300 });
    expect(comCoparticipacao.netEffective).toBeCloseTo(base.netEffective - 300, 6);
    expect(comCoparticipacao.employerCost).toBeCloseTo(base.employerCost, 6);
  });
});
