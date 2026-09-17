import { describe, expect, it } from "vitest";
import { buildContractCalendar, currentYearMonth, parseYearMonth } from "./workCalendar";

describe("calendário de trabalho", () => {
  it("2026 tem 261 dias de segunda a sexta", () => {
    // 365 dias começando numa quinta: 52 semanas (260) + a quinta de 31/12.
    expect(buildContractCalendar({ year: 2026, month: 1 }, 12, true).totalWeekdays).toBe(261);
  });

  it("em 2026, 9 feriados nacionais caem em dia útil (15/11 é domingo)", () => {
    expect(buildContractCalendar({ year: 2026, month: 1 }, 12, false).totalHolidays).toBe(9);
  });

  it("Carnaval e Corpus Christi somam 3 dias úteis quando ligados", () => {
    expect(buildContractCalendar({ year: 2026, month: 1 }, 12, true).totalHolidays).toBe(12);
  });

  it("fevereiro de 2026: 20 dias de semana, 2 de Carnaval", () => {
    const [fev] = buildContractCalendar({ year: 2026, month: 2 }, 1, true).months;
    expect(fev.weekdays).toBe(20);
    expect(fev.holidays.map((h) => h.date)).toEqual(["2026-02-16", "2026-02-17"]);
    expect(fev.workdays).toBe(18);
  });

  it("contrato atravessa a virada do ano", () => {
    const cal = buildContractCalendar({ year: 2026, month: 11 }, 4, false);
    expect(cal.months.map((m) => `${m.year}-${m.month}`)).toEqual(["2026-11", "2026-12", "2027-1", "2027-2"]);
  });

  it("indica quando algum ano saiu do cálculo, e não da tabela", () => {
    expect(buildContractCalendar({ year: 2026, month: 1 }, 12, true).allYearsFromTable).toBe(true);
    expect(buildContractCalendar({ year: 2032, month: 6 }, 12, true).allYearsFromTable).toBe(false);
  });

  it("parte sempre do mês atual quando não há início escolhido", () => {
    const hoje = new Date(2026, 8, 16);
    expect(currentYearMonth(hoje)).toEqual({ year: 2026, month: 9 });
    expect(parseYearMonth(null, hoje)).toEqual({ year: 2026, month: 9 });
    expect(parseYearMonth("2027-03", hoje)).toEqual({ year: 2027, month: 3 });
    expect(parseYearMonth("lixo", hoje)).toEqual({ year: 2026, month: 9 });
  });
});
