import { describe, expect, it } from "vitest";
import { HOLIDAYS_BY_YEAR, computeHolidays, easterSunday, getHolidays } from "./holidays";

describe("tabela de feriados", () => {
  it("cobre o ano passado e pelo menos 5 anos à frente de 2026", () => {
    for (let year = 2025; year <= 2031; year++) expect(HOLIDAYS_BY_YEAR[year]).toBeDefined();
  });

  it("2025 tem Carnaval em 3 e 4/3 e Corpus Christi em 19/6", () => {
    const datas = HOLIDAYS_BY_YEAR[2025].filter((h) => h.kind === "facultativo").map((h) => h.date);
    expect(datas).toEqual(["2025-03-03", "2025-03-04", "2025-06-19"]);
  });

  it("2026 bate com a Portaria MGI nº 11.460/2025", () => {
    const nacionais = HOLIDAYS_BY_YEAR[2026].filter((h) => h.kind === "nacional").map((h) => h.date);
    expect(nacionais).toEqual([
      "2026-01-01", "2026-04-03", "2026-04-21", "2026-05-01", "2026-09-07",
      "2026-10-12", "2026-11-02", "2026-11-15", "2026-11-20", "2026-12-25",
    ]);
    const facultativos = HOLIDAYS_BY_YEAR[2026].filter((h) => h.kind === "facultativo").map((h) => h.date);
    expect(facultativos).toEqual(["2026-02-16", "2026-02-17", "2026-06-04"]);
  });

  it("todo ano da tabela tem 10 feriados nacionais e 3 facultativos", () => {
    for (const lista of Object.values(HOLIDAYS_BY_YEAR)) {
      expect(lista.filter((h) => h.kind === "nacional")).toHaveLength(10);
      expect(lista.filter((h) => h.kind === "facultativo")).toHaveLength(3);
    }
  });

  it("a tabela escrita confere com o cálculo em todos os anos", () => {
    for (const [year, lista] of Object.entries(HOLIDAYS_BY_YEAR)) {
      expect(lista).toEqual(computeHolidays(Number(year)));
    }
  });
});

describe("Páscoa e datas móveis", () => {
  it("bate com as datas publicadas de 2025 a 2030", () => {
    expect(easterSunday(2025)).toEqual({ month: 4, day: 20 });
    expect(easterSunday(2026)).toEqual({ month: 4, day: 5 });
    expect(easterSunday(2027)).toEqual({ month: 3, day: 28 });
    expect(easterSunday(2028)).toEqual({ month: 4, day: 16 });
    expect(easterSunday(2029)).toEqual({ month: 4, day: 1 });
    expect(easterSunday(2030)).toEqual({ month: 4, day: 21 });
  });

  it("Paixão de Cristo cai sempre numa sexta e Corpus Christi numa quinta", () => {
    for (let year = 2026; year <= 2060; year++) {
      const lista = computeHolidays(year);
      const dia = (nome: string) => new Date(`${lista.find((h) => h.name === nome)!.date}T00:00:00Z`).getUTCDay();
      expect(dia("Paixão de Cristo")).toBe(5);
      expect(dia("Corpus Christi")).toBe(4);
      expect(dia("Carnaval (terça)")).toBe(2);
    }
  });

  it("anos fora da tabela são calculados, sem quebrar", () => {
    const lista = getHolidays(2045);
    expect(lista).toHaveLength(13);
    expect(lista[0].date).toBe("2045-01-01");
  });
});
