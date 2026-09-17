/** Data sem hora nem fuso: evita que meia-noite vire o dia anterior. */
export interface SimpleDate {
  year: number;
  month: number; // 1-12
  day: number;
}

const DAY_MS = 86_400_000;

export function toDayNumber({ year, month, day }: SimpleDate): number {
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS);
}

export function fromDayNumber(dayNumber: number): SimpleDate {
  const date = new Date(dayNumber * DAY_MS);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** "AAAA-MM-DD" -> data; null se vazio ou inexistente (ex.: 31/02). */
export function parseIsoDate(value: string | null): SimpleDate | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  if (date.year < 1900 || date.month < 1 || date.month > 12) return null;
  if (date.day < 1 || date.day > daysInMonth(date.year, date.month)) return null;
  return date;
}

export function toIsoDate({ year, month, day }: SimpleDate): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatDate({ year, month, day }: SimpleDate): string {
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

export function todayDate(today: Date = new Date()): SimpleDate {
  return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
}

export function addDays(date: SimpleDate, days: number): SimpleDate {
  return fromDayNumber(toDayNumber(date) + days);
}

/** Soma meses mantendo o dia; 31/01 + 1 mês = 28/02 (ou 29). */
export function addMonths(date: SimpleDate, months: number): SimpleDate {
  const index = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

/**
 * Meses completos entre o início e o fim, contando os dois dias: de 10/03 a
 * 09/04 é um mês inteiro. Devolve também os dias que sobram.
 */
export function completeMonths(start: SimpleDate, end: SimpleDate): { months: number; days: number } {
  const limit = toDayNumber(end) + 1;
  let months = Math.max(0, (end.year - start.year) * 12 + (end.month - start.month) - 1);
  while (toDayNumber(addMonths(start, months + 1)) <= limit) months++;
  while (months > 0 && toDayNumber(addMonths(start, months)) > limit) months--;
  return { months, days: Math.max(0, limit - toDayNumber(addMonths(start, months))) };
}
