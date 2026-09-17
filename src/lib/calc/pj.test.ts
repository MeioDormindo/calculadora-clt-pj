import { describe, expect, it } from "vitest";
import {
  calculateSimplesTax,
  calculatePjTax,
  calculatePjInss,
  calculatePjBilling,
  calculatePj,
  applyActivity,
} from "./pj";
import {
  PJ_ACTIVITIES,
  PJ_TAX_PRESETS,
  PJ_INSS_PRESETS,
  INSS_CEILING,
  SIMPLES_ANEXO_III,
} from "./constants";
import { calculateClt } from "./clt";
import { sheetClt, sheetPj } from "./fixtures";
import { buildContractCalendar } from "../calendar/workCalendar";

// 2026 inteiro, com Carnaval e Corpus Christi: 261 dias de semana, 12 feriados.
const cal = buildContractCalendar({ year: 2026, month: 1 }, 12, true);

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
});

describe("lado PJ", () => {
  const clt = calculateClt(sheetClt);

  it("assume o custo inteiro de cada benefício: parte da empresa + a sua", () => {
    const pj = calculatePj(15000, sheetPj, clt, cal);
    for (const benefit of clt.benefits) {
      const share = clt.employeeShares.find((s) => s.key === benefit.key)?.value ?? 0;
      const mirrored = pj.costs.find((c) => c.key === benefit.key);
      expect(mirrored?.value).toBeCloseTo(benefit.value + share, 6);
    }
    // VT: a empresa pagava 0, você pagava 600 — como PJ, 600.
    expect(pj.costs.find((c) => c.key === "transportVoucher")?.value).toBeCloseTo(600, 2);
  });

  it("líquida efetiva = faturamento menos todos os custos", () => {
    const pj = calculatePj(15000, sheetPj, clt, cal);
    expect(pj.netEffective).toBeCloseTo(15000 - pj.totalCosts, 6);
  });

  it("para a empresa, o custo do PJ é apenas o valor da nota", () => {
    expect(calculatePj(15000, sheetPj, clt, cal).employerCost).toBeCloseTo(15000, 2);
  });

  it("expõe cada tipo de dia parado como custo separado", () => {
    const pj = calculatePj(
      11000,
      { ...sheetPj, paidHolidays: false, sickDaysPerYear: 5, vacationDaysPerYear: 20 },
      clt,
      cal,
    );
    const keys = pj.costs.map((c) => c.key);
    expect(keys).toContain("lostHolidays");
    expect(keys).toContain("lostSick");
    expect(keys).toContain("lostVacation");
    expect(keys).not.toContain("lostDays");
  });

  it("avisa quando o faturamento estoura o teto do MEI", () => {
    const mei = { ...sheetPj, taxRegime: "MEI" as const };
    expect(calculatePj(6000, mei, clt, cal).exceedsMeiLimit).toBe(false);
    expect(calculatePj(15000, mei, clt, cal).exceedsMeiLimit).toBe(true);
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

describe("Simples Nacional progressivo", () => {
  it("na 1ª faixa (até R$ 15 mil/mês) usa a alíquota nominal", () => {
    expect(calculateSimplesTax(15000, SIMPLES_ANEXO_III)).toBeCloseTo(900, 2);
  });

  it("na 2ª faixa aplica a alíquota efetiva publicada", () => {
    // RBT12 de R$ 300 mil no Anexo III: efetiva de 8,08%.
    expect(calculateSimplesTax(25000, SIMPLES_ANEXO_III)).toBeCloseTo(25000 * 0.0808, 0);
  });

  it("não dá salto na mudança de faixa", () => {
    const naFronteira = calculateSimplesTax(15000, SIMPLES_ANEXO_III);
    const logoAcima = calculateSimplesTax(15000.01, SIMPLES_ANEXO_III);
    expect(logoAcima - naFronteira).toBeLessThan(0.01);
  });
});

describe("IR do PJ", () => {
  const clt = calculateClt(sheetClt);
  const ti = { ...sheetPj, activity: "TI", inssMode: "FATOR_R" as const };

  it("pró-labore até R$ 5.000 fica isento", () => {
    // Faturamento 15.000 -> pró-labore 4.200.
    const pj = calculatePj(15000, ti, clt, cal);
    expect(pj.costs.find((c) => c.key === "proLaboreIrrf")?.value).toBe(0);
  });

  it("pró-labore maior paga IR como salário", () => {
    // Faturamento 25.000 -> pró-labore 7.000, INSS 770. Base 6.230 -> 804,52;
    // redução 978,62 - 0,133145 x 7.000 = 46,60.
    const pj = calculatePj(25000, ti, clt, cal);
    expect(pj.costs.find((c) => c.key === "proLaboreIrrf")?.value).toBeCloseTo(757.91, 1);
  });

  it("autônomo sem CNPJ paga a tabela do IR sobre tudo (carnê-leão)", () => {
    const inss = calculatePjInss(10000, "AUTONOMO", 0, 0);
    // 10.000 - 1.695,11 = 8.304,89 -> x 27,5% - 908,73.
    expect(calculatePjTax(10000, "CARNE_LEAO", 0, inss, 0)).toBeCloseTo(1375.11, 1);
  });
});

describe("Anexos II e IV", () => {
  it("Anexo II (indústria) começa em 4,5%", () => {
    expect(calculatePjTax(10000, "SIMPLES_II", 0)).toBeCloseTo(450, 2);
  });

  it("Anexo IV (advocacia) começa em 4,5% e tem faixas próprias", () => {
    expect(calculatePjTax(10000, "SIMPLES_IV", 0)).toBeCloseTo(450, 2);
    // RBT12 de 300 mil: (300.000 x 9% - 8.100) / 12.
    expect(calculatePjTax(25000, "SIMPLES_IV", 0)).toBeCloseTo((300000 * 0.09 - 8100) / 12, 2);
  });

  it("no Anexo IV o INSS inclui os 20% de CPP fora do DAS", () => {
    expect(calculatePjInss(10000, "ANEXO_IV", 0, 0)).toBeCloseTo(1621 * 0.31, 2);
  });

  it("advocacia aplica Anexo IV com a contribuição própria", () => {
    const r = applyActivity({ ...sheetPj, activity: "ADVOCACIA" });
    expect(r.taxRegime).toBe("SIMPLES_IV");
    expect(r.inssMode).toBe("ANEXO_IV");
  });

  it("marketing e publicidade estão sujeitos ao Fator R", () => {
    expect(applyActivity({ ...sheetPj, activity: "MARKETING" }).inssMode).toBe("FATOR_R");
  });
});

describe("faturamento com calendário real", () => {
  const semPagos = { ...sheetPj, paidHolidays: false };

  it("valor fixo: cada feriado custa o valor mensal ÷ dias de semana daquele mês", () => {
    // Fevereiro de 2026: 20 dias de semana, 2 de Carnaval -> 11.000 ÷ 20 x 2 = 1.100.
    const fev = buildContractCalendar({ year: 2026, month: 2 }, 1, true);
    const billing = calculatePjBilling(11000, semPagos, fev);
    expect(billing.perMonth[0].billed).toBeCloseTo(9900, 2);
    expect(billing.lines.find((l) => l.key === "lostHolidays")!.monthlyCost).toBeCloseTo(1100, 2);
  });

  it("valor fixo: contrato de 3 meses faz a média do período", () => {
    // Fev (20 dias, 2 feriados) + mar (22, 0) + abr (22, 3/4 e 21/4):
    // 1.100 + 0 + 11.000 ÷ 22 x 2 = 2.100 -> 700 por mês.
    const tri = buildContractCalendar({ year: 2026, month: 2 }, 3, true);
    const billing = calculatePjBilling(11000, semPagos, tri);
    expect(billing.months).toBe(3);
    expect(billing.billedMonthly).toBeCloseTo(11000 - 700, 2);
  });

  it("por hora: o calendário real dá mais horas que as contratadas", () => {
    // 16.000 por 160h = R$ 100/h. 2026 tem 261 dias de semana x 8h = 174h/mês.
    // Só feriados nacionais (9): 100 x 8 x 9 ÷ 12 = 600/mês de perda.
    const nacionais = buildContractCalendar({ year: 2026, month: 1 }, 12, false);
    const billing = calculatePjBilling(
      16000,
      { ...semPagos, billingMode: "HOURLY", monthlyHours: 160, hoursPerDay: 8 },
      nacionais,
    );
    expect(billing.hourlyRate).toBeCloseTo(100, 6);
    expect(billing.lines.find((l) => l.key === "calendarHours")!.monthlyCost).toBeCloseTo(-1400, 2);
    expect(billing.lines.find((l) => l.key === "lostHolidays")!.monthlyCost).toBeCloseTo(600, 2);
    // 100 x 8 x (261 - 9) ÷ 12.
    expect(billing.billedMonthly).toBeCloseTo(16800, 2);
    const somaMeses = billing.perMonth.reduce((acc, m) => acc + m.billed, 0);
    expect(somaMeses).toBeCloseTo(16800 * 12, 2);
    expect(billing.perMonth.reduce((acc, m) => acc + (m.hours ?? 0), 0)).toBe(252 * 8);
  });

  it("valor fixo não tem ajuste de horas", () => {
    const billing = calculatePjBilling(16000, semPagos, cal);
    expect(billing.hourlyRate).toBeNull();
    expect(billing.lines.some((l) => l.key === "calendarHours")).toBe(false);
  });

  it("feriados pagos pela empresa não custam nada e contam como faturados", () => {
    const billing = calculatePjBilling(11000, { ...sheetPj, paidHolidays: true }, cal);
    expect(billing.lines.find((l) => l.key === "lostHolidays")!.monthlyCost).toBe(0);
    expect(billing.perMonth.every((m) => m.billed === 11000)).toBe(true);
  });

  it("doença, férias e feriados locais entram proporcionais por mês", () => {
    // Valor do dia médio = 11.000 ÷ (261 ÷ 12). 5 dias/ano de doença -> x 5 ÷ 12.
    const billing = calculatePjBilling(11000, { ...semPagos, sickDaysPerYear: 5, localHolidaysPerYear: 2 }, cal);
    const diaMedio = 11000 / (261 / 12);
    expect(billing.dailyValue).toBeCloseTo(diaMedio, 6);
    expect(billing.lines.find((l) => l.key === "lostSick")!.monthlyCost).toBeCloseTo((diaMedio * 5) / 12, 6);
    expect(billing.lines.find((l) => l.key === "lostLocalHolidays")!.monthlyCost).toBeCloseTo((diaMedio * 2) / 12, 6);
  });

  it("não mostra linha de feriados locais quando não há nenhum", () => {
    const billing = calculatePjBilling(11000, sheetPj, cal);
    expect(billing.lines.some((l) => l.key === "lostLocalHolidays")).toBe(false);
  });

  it("não deixa dias de férias pagos passarem do total", () => {
    const billing = calculatePjBilling(11000, { ...sheetPj, vacationDaysPerYear: 20, paidVacationDays: 99 }, cal);
    expect(billing.lines.find((l) => l.key === "lostVacation")!.unpaidDays).toBe(0);
  });

  it("impostos incidem sobre o que é de fato faturado", () => {
    const clt = calculateClt(sheetClt);
    const nacionais = buildContractCalendar({ year: 2026, month: 1 }, 12, false);
    const pj = calculatePj(
      16000,
      { ...semPagos, activity: "CUSTOM", taxRegime: "SIMPLES_III", billingMode: "HOURLY", monthlyHours: 160, hoursPerDay: 8 },
      clt,
      nacionais,
    );
    expect(pj.billedInvoice).toBeCloseTo(16800, 2);
    // RBT12 de 201.600 no Anexo III: (201.600 x 11,2% - 9.360) ÷ 12.
    expect(pj.costs.find((c) => c.key === "tax")!.value).toBeCloseTo((201600 * 0.112 - 9360) / 12, 2);
    expect(pj.employerCost).toBeCloseTo(16800, 2);
  });
});
