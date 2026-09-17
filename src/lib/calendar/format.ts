import type { YearMonth } from "./workCalendar";

export const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export const WEEKDAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** { year: 2026, month: 9 } -> "setembro de 2026" */
export function formatYearMonth({ year, month }: YearMonth): string {
  return `${MONTH_NAMES[month - 1]} de ${year}`;
}

/** "2026-11-20" -> "20/11 (sexta)" */
export function formatHolidayDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")} (${WEEKDAY_NAMES[weekday]})`;
}
