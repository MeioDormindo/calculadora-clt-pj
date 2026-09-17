export type HolidayKind = "nacional" | "facultativo";

export interface Holiday {
  /** Data no formato AAAA-MM-DD. */
  date: string;
  name: string;
  /**
   * "nacional": feriado em lei federal. "facultativo": ponto facultativo que
   * se repete todo ano e que a maioria das empresas dá (Carnaval e Corpus
   * Christi) — dá para desligar na tela.
   */
  kind: HolidayKind;
}

/**
 * Feriados de 2025 a 2032, escritos por extenso para poderem ser conferidos.
 * 2026 bate com a Portaria MGI nº 11.460/2025. As datas móveis vêm da Páscoa
 * (Paixão = Páscoa − 2, Carnaval = − 48 e − 47, Corpus Christi = + 60).
 * Ficam de fora os pontos facultativos só do serviço público (Dia do
 * Servidor, "pontes" decretadas a cada ano, meio expediente de 24 e 31/12).
 * Acrescente um ano novo aqui quando a portaria dele sair.
 */
export const HOLIDAYS_BY_YEAR: Record<number, Holiday[]> = {
  2025: [
    { date: "2025-01-01", name: "Confraternização Universal", kind: "nacional" },
    { date: "2025-03-03", name: "Carnaval (segunda)", kind: "facultativo" },
    { date: "2025-03-04", name: "Carnaval (terça)", kind: "facultativo" },
    { date: "2025-04-18", name: "Paixão de Cristo", kind: "nacional" },
    { date: "2025-04-21", name: "Tiradentes", kind: "nacional" },
    { date: "2025-05-01", name: "Dia do Trabalho", kind: "nacional" },
    { date: "2025-06-19", name: "Corpus Christi", kind: "facultativo" },
    { date: "2025-09-07", name: "Independência do Brasil", kind: "nacional" },
    { date: "2025-10-12", name: "Nossa Senhora Aparecida", kind: "nacional" },
    { date: "2025-11-02", name: "Finados", kind: "nacional" },
    { date: "2025-11-15", name: "Proclamação da República", kind: "nacional" },
    { date: "2025-11-20", name: "Consciência Negra", kind: "nacional" },
    { date: "2025-12-25", name: "Natal", kind: "nacional" },
  ],
  2026: [
    { date: "2026-01-01", name: "Confraternização Universal", kind: "nacional" },
    { date: "2026-02-16", name: "Carnaval (segunda)", kind: "facultativo" },
    { date: "2026-02-17", name: "Carnaval (terça)", kind: "facultativo" },
    { date: "2026-04-03", name: "Paixão de Cristo", kind: "nacional" },
    { date: "2026-04-21", name: "Tiradentes", kind: "nacional" },
    { date: "2026-05-01", name: "Dia do Trabalho", kind: "nacional" },
    { date: "2026-06-04", name: "Corpus Christi", kind: "facultativo" },
    { date: "2026-09-07", name: "Independência do Brasil", kind: "nacional" },
    { date: "2026-10-12", name: "Nossa Senhora Aparecida", kind: "nacional" },
    { date: "2026-11-02", name: "Finados", kind: "nacional" },
    { date: "2026-11-15", name: "Proclamação da República", kind: "nacional" },
    { date: "2026-11-20", name: "Consciência Negra", kind: "nacional" },
    { date: "2026-12-25", name: "Natal", kind: "nacional" },
  ],
  2027: [
    { date: "2027-01-01", name: "Confraternização Universal", kind: "nacional" },
    { date: "2027-02-08", name: "Carnaval (segunda)", kind: "facultativo" },
    { date: "2027-02-09", name: "Carnaval (terça)", kind: "facultativo" },
    { date: "2027-03-26", name: "Paixão de Cristo", kind: "nacional" },
    { date: "2027-04-21", name: "Tiradentes", kind: "nacional" },
    { date: "2027-05-01", name: "Dia do Trabalho", kind: "nacional" },
    { date: "2027-05-27", name: "Corpus Christi", kind: "facultativo" },
    { date: "2027-09-07", name: "Independência do Brasil", kind: "nacional" },
    { date: "2027-10-12", name: "Nossa Senhora Aparecida", kind: "nacional" },
    { date: "2027-11-02", name: "Finados", kind: "nacional" },
    { date: "2027-11-15", name: "Proclamação da República", kind: "nacional" },
    { date: "2027-11-20", name: "Consciência Negra", kind: "nacional" },
    { date: "2027-12-25", name: "Natal", kind: "nacional" },
  ],
  2028: [
    { date: "2028-01-01", name: "Confraternização Universal", kind: "nacional" },
    { date: "2028-02-28", name: "Carnaval (segunda)", kind: "facultativo" },
    { date: "2028-02-29", name: "Carnaval (terça)", kind: "facultativo" },
    { date: "2028-04-14", name: "Paixão de Cristo", kind: "nacional" },
    { date: "2028-04-21", name: "Tiradentes", kind: "nacional" },
    { date: "2028-05-01", name: "Dia do Trabalho", kind: "nacional" },
    { date: "2028-06-15", name: "Corpus Christi", kind: "facultativo" },
    { date: "2028-09-07", name: "Independência do Brasil", kind: "nacional" },
    { date: "2028-10-12", name: "Nossa Senhora Aparecida", kind: "nacional" },
    { date: "2028-11-02", name: "Finados", kind: "nacional" },
    { date: "2028-11-15", name: "Proclamação da República", kind: "nacional" },
    { date: "2028-11-20", name: "Consciência Negra", kind: "nacional" },
    { date: "2028-12-25", name: "Natal", kind: "nacional" },
  ],
  2029: [
    { date: "2029-01-01", name: "Confraternização Universal", kind: "nacional" },
    { date: "2029-02-12", name: "Carnaval (segunda)", kind: "facultativo" },
    { date: "2029-02-13", name: "Carnaval (terça)", kind: "facultativo" },
    { date: "2029-03-30", name: "Paixão de Cristo", kind: "nacional" },
    { date: "2029-04-21", name: "Tiradentes", kind: "nacional" },
    { date: "2029-05-01", name: "Dia do Trabalho", kind: "nacional" },
    { date: "2029-05-31", name: "Corpus Christi", kind: "facultativo" },
    { date: "2029-09-07", name: "Independência do Brasil", kind: "nacional" },
    { date: "2029-10-12", name: "Nossa Senhora Aparecida", kind: "nacional" },
    { date: "2029-11-02", name: "Finados", kind: "nacional" },
    { date: "2029-11-15", name: "Proclamação da República", kind: "nacional" },
    { date: "2029-11-20", name: "Consciência Negra", kind: "nacional" },
    { date: "2029-12-25", name: "Natal", kind: "nacional" },
  ],
  2030: [
    { date: "2030-01-01", name: "Confraternização Universal", kind: "nacional" },
    { date: "2030-03-04", name: "Carnaval (segunda)", kind: "facultativo" },
    { date: "2030-03-05", name: "Carnaval (terça)", kind: "facultativo" },
    { date: "2030-04-19", name: "Paixão de Cristo", kind: "nacional" },
    { date: "2030-04-21", name: "Tiradentes", kind: "nacional" },
    { date: "2030-05-01", name: "Dia do Trabalho", kind: "nacional" },
    { date: "2030-06-20", name: "Corpus Christi", kind: "facultativo" },
    { date: "2030-09-07", name: "Independência do Brasil", kind: "nacional" },
    { date: "2030-10-12", name: "Nossa Senhora Aparecida", kind: "nacional" },
    { date: "2030-11-02", name: "Finados", kind: "nacional" },
    { date: "2030-11-15", name: "Proclamação da República", kind: "nacional" },
    { date: "2030-11-20", name: "Consciência Negra", kind: "nacional" },
    { date: "2030-12-25", name: "Natal", kind: "nacional" },
  ],
  2031: [
    { date: "2031-01-01", name: "Confraternização Universal", kind: "nacional" },
    { date: "2031-02-24", name: "Carnaval (segunda)", kind: "facultativo" },
    { date: "2031-02-25", name: "Carnaval (terça)", kind: "facultativo" },
    { date: "2031-04-11", name: "Paixão de Cristo", kind: "nacional" },
    { date: "2031-04-21", name: "Tiradentes", kind: "nacional" },
    { date: "2031-05-01", name: "Dia do Trabalho", kind: "nacional" },
    { date: "2031-06-12", name: "Corpus Christi", kind: "facultativo" },
    { date: "2031-09-07", name: "Independência do Brasil", kind: "nacional" },
    { date: "2031-10-12", name: "Nossa Senhora Aparecida", kind: "nacional" },
    { date: "2031-11-02", name: "Finados", kind: "nacional" },
    { date: "2031-11-15", name: "Proclamação da República", kind: "nacional" },
    { date: "2031-11-20", name: "Consciência Negra", kind: "nacional" },
    { date: "2031-12-25", name: "Natal", kind: "nacional" },
  ],
  2032: [
    { date: "2032-01-01", name: "Confraternização Universal", kind: "nacional" },
    { date: "2032-02-09", name: "Carnaval (segunda)", kind: "facultativo" },
    { date: "2032-02-10", name: "Carnaval (terça)", kind: "facultativo" },
    { date: "2032-03-26", name: "Paixão de Cristo", kind: "nacional" },
    { date: "2032-04-21", name: "Tiradentes", kind: "nacional" },
    { date: "2032-05-01", name: "Dia do Trabalho", kind: "nacional" },
    { date: "2032-05-27", name: "Corpus Christi", kind: "facultativo" },
    { date: "2032-09-07", name: "Independência do Brasil", kind: "nacional" },
    { date: "2032-10-12", name: "Nossa Senhora Aparecida", kind: "nacional" },
    { date: "2032-11-02", name: "Finados", kind: "nacional" },
    { date: "2032-11-15", name: "Proclamação da República", kind: "nacional" },
    { date: "2032-11-20", name: "Consciência Negra", kind: "nacional" },
    { date: "2032-12-25", name: "Natal", kind: "nacional" },
  ],
};

/** Domingo de Páscoa pelo algoritmo gregoriano anônimo (Meeus/Jones/Butcher). */
export function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftFromEaster(year: number, days: number): string {
  const { month, day } = easterSunday(year);
  return isoDate(new Date(Date.UTC(year, month - 1, day + days)));
}

/** Calcula os feriados de qualquer ano. Usado para anos fora da tabela. */
export function computeHolidays(year: number): Holiday[] {
  const list: Holiday[] = [
    { date: `${year}-01-01`, name: "Confraternização Universal", kind: "nacional" },
    { date: shiftFromEaster(year, -48), name: "Carnaval (segunda)", kind: "facultativo" },
    { date: shiftFromEaster(year, -47), name: "Carnaval (terça)", kind: "facultativo" },
    { date: shiftFromEaster(year, -2), name: "Paixão de Cristo", kind: "nacional" },
    { date: `${year}-04-21`, name: "Tiradentes", kind: "nacional" },
    { date: `${year}-05-01`, name: "Dia do Trabalho", kind: "nacional" },
    { date: shiftFromEaster(year, 60), name: "Corpus Christi", kind: "facultativo" },
    { date: `${year}-09-07`, name: "Independência do Brasil", kind: "nacional" },
    { date: `${year}-10-12`, name: "Nossa Senhora Aparecida", kind: "nacional" },
    { date: `${year}-11-02`, name: "Finados", kind: "nacional" },
    { date: `${year}-11-15`, name: "Proclamação da República", kind: "nacional" },
    { date: `${year}-11-20`, name: "Consciência Negra", kind: "nacional" },
    { date: `${year}-12-25`, name: "Natal", kind: "nacional" },
  ];
  return list.sort((x, y) => x.date.localeCompare(y.date));
}

/** Feriados do ano: da tabela quando existe, senão calculados. */
export function getHolidays(year: number): Holiday[] {
  return HOLIDAYS_BY_YEAR[year] ?? computeHolidays(year);
}

export function isHolidayTableYear(year: number): boolean {
  return year in HOLIDAYS_BY_YEAR;
}
