import { getHolidays, isHolidayTableYear, type Holiday } from "./holidays";

export interface YearMonth {
  year: number;
  /** 1 a 12. */
  month: number;
}

export interface CalendarMonth extends YearMonth {
  /** Segunda a sexta do mês, com ou sem feriado. */
  weekdays: number;
  /** Feriados que caem em dia útil e contam no cálculo. */
  holidays: Holiday[];
  /** Todos os feriados do mês, inclusive em fim de semana ou desligados. */
  allHolidays: Holiday[];
  /** Dias úteis de fato: weekdays - holidays. */
  workdays: number;
}

export interface ContractCalendar {
  start: YearMonth;
  months: CalendarMonth[];
  totalWeekdays: number;
  totalHolidays: number;
  totalWorkdays: number;
  /** false quando algum ano do período veio do cálculo e não da tabela escrita. */
  allYearsFromTable: boolean;
}

/** Mês corrente: o calendário parte sempre do ano e do mês de hoje. */
export function currentYearMonth(today: Date = new Date()): YearMonth {
  return { year: today.getFullYear(), month: today.getMonth() + 1 };
}

/** "2026-09" -> { year: 2026, month: 9 }; valores inválidos voltam ao mês atual. */
export function parseYearMonth(value: string | null, today: Date = new Date()): YearMonth {
  const match = value ? /^(\d{4})-(\d{2})$/.exec(value) : null;
  if (!match) return currentYearMonth(today);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return currentYearMonth(today);
  return { year: Number(match[1]), month };
}

function addMonths({ year, month }: YearMonth, count: number): YearMonth {
  const index = year * 12 + (month - 1) + count;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

function buildMonth({ year, month }: YearMonth, includeOptional: boolean): CalendarMonth {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  const allHolidays = getHolidays(year).filter((h) => h.date.startsWith(prefix));

  let weekdays = 0;
  const holidays: Holiday[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    weekdays++;
    const date = `${prefix}${String(day).padStart(2, "0")}`;
    const holiday = allHolidays.find((h) => h.date === date);
    if (holiday && (holiday.kind === "nacional" || includeOptional)) holidays.push(holiday);
  }

  return { year, month, weekdays, holidays, allHolidays, workdays: weekdays - holidays.length };
}

export function buildContractCalendar(
  start: YearMonth,
  monthsCount: number,
  includeOptional: boolean,
): ContractCalendar {
  const count = Math.max(1, Math.round(monthsCount));
  const months = Array.from({ length: count }, (_, i) => buildMonth(addMonths(start, i), includeOptional));
  const sum = (pick: (m: CalendarMonth) => number) => months.reduce((acc, m) => acc + pick(m), 0);

  return {
    start,
    months,
    totalWeekdays: sum((m) => m.weekdays),
    totalHolidays: sum((m) => m.holidays.length),
    totalWorkdays: sum((m) => m.workdays),
    allYearsFromTable: months.every((m) => isHolidayTableYear(m.year)),
  };
}
