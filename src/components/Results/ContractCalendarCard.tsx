import { useState } from "react";
import type { ComparisonResult } from "../../lib/calc/types";
import type { CalendarMonth } from "../../lib/calendar/workCalendar";
import { MONTH_NAMES, formatHolidayDate } from "../../lib/calendar/format";
import { formatCurrency } from "../../lib/format";

const WEEK_HEADER = ["D", "S", "T", "Q", "Q", "S", "S"];
const VISIBLE_MONTHS = 12;

function MonthGrid({
  month,
  billed,
  hours,
  workedHours,
}: {
  month: CalendarMonth;
  billed: number;
  hours: number | null;
  workedHours: number;
}) {
  const daysInMonth = new Date(Date.UTC(month.year, month.month, 0)).getUTCDate();
  const offset = new Date(Date.UTC(month.year, month.month - 1, 1)).getUTCDay();
  const counted = new Set(month.holidays.map((h) => h.date));

  const cells = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = `${month.year}-${String(month.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const weekday = (offset + i) % 7;
    const holiday = month.allHolidays.find((h) => h.date === date);
    const weekend = weekday === 0 || weekday === 6;

    let className = "cal-day";
    if (weekend) className += " weekend";
    if (holiday) className += counted.has(date) ? " holiday" : " holiday-off";

    const title = holiday
      ? `${formatHolidayDate(date)} — ${holiday.name}${
          counted.has(date) ? "" : weekend ? " (fim de semana)" : " (não contado)"
        }`
      : undefined;

    return (
      <span key={date} className={className} title={title} aria-label={title}>
        {day}
      </span>
    );
  });

  return (
    <article className="cal-month">
      <header className="cal-month-title">
        {MONTH_NAMES[month.month - 1]} <span>{month.year}</span>
      </header>
      <div className="cal-grid" aria-hidden={false}>
        {WEEK_HEADER.map((d, i) => (
          <span key={i} className="cal-head">
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`vazio-${i}`} />
        ))}
        {cells}
      </div>
      <footer className="cal-month-foot">
        <span>
          {month.workdays} dias úteis
          {month.holidays.length > 0 &&
            ` · ${month.holidays.length} ${month.holidays.length === 1 ? "feriado" : "feriados"}`}
        </span>
        <span className="cal-billed">
          {hours !== null
            ? `${Math.round(hours * 10) / 10}h · `
            : `${Math.round(workedHours * 10) / 10}h trabalhadas · `}
          {formatCurrency(billed)}
        </span>
      </footer>
    </article>
  );
}

export function ContractCalendarCard({ result }: { result: ComparisonResult }) {
  const { calendar, proposed } = result;
  const [showAll, setShowAll] = useState(false);
  const { perMonth, hourlyRate, totalWorkedHours, effectiveHourlyRate, contractedHourlyRate } =
    proposed.billing;

  const months = showAll ? calendar.months : calendar.months.slice(0, VISIBLE_MONTHS);
  const hidden = calendar.months.length - months.length;
  const holidays = calendar.months.flatMap((m) => m.allHolidays.map((h) => ({ ...h, counted: m.holidays.includes(h) })));
  const totalBilled = perMonth.reduce((sum, m) => sum + m.billed, 0);
  const totalHours = perMonth.reduce((sum, m) => sum + (m.hours ?? 0), 0);

  return (
    <section className="card">
      <h3 className="card-title">Calendário real do contrato</h3>
      <p className="card-subtitle">
        Dias úteis e feriados nacionais de cada mês, com o que você fatura como PJ
        {hourlyRate !== null ? ` a ${formatCurrency(hourlyRate)} por hora` : ""}. Doença, férias e
        feriados locais não têm data marcada, então entram na média e não aparecem aqui.
      </p>

      <div className="cal-summary">
        <div>
          <span>Dias úteis</span>
          <strong>{calendar.totalWorkdays}</strong>
        </div>
        <div>
          <span>Feriados em dia útil</span>
          <strong>{calendar.totalHolidays}</strong>
        </div>
        {hourlyRate !== null ? (
          <div>
            <span>Horas faturadas</span>
            <strong>{Math.round(totalHours).toLocaleString("pt-BR")}h</strong>
          </div>
        ) : (
          <div>
            <span>Horas trabalhadas</span>
            <strong>{Math.round(totalWorkedHours).toLocaleString("pt-BR")}h</strong>
          </div>
        )}
        <div>
          <span>Hora efetiva (contratada {formatCurrency(contractedHourlyRate)})</span>
          <strong>{formatCurrency(effectiveHourlyRate)}</strong>
        </div>
        <div>
          <span>Faturado no período</span>
          <strong>{formatCurrency(totalBilled)}</strong>
        </div>
      </div>

      <div className="cal-legend">
        <span>
          <i className="cal-swatch" /> dia útil
        </span>
        <span>
          <i className="cal-swatch weekend" /> fim de semana
        </span>
        <span>
          <i className="cal-swatch holiday" /> feriado que conta
        </span>
        <span>
          <i className="cal-swatch holiday-off" /> feriado que não conta
        </span>
      </div>

      <div className="cal-months">
        {months.map((m, i) => (
          <MonthGrid
            key={`${m.year}-${m.month}`}
            month={m}
            billed={perMonth[i].billed}
            hours={perMonth[i].hours}
            workedHours={perMonth[i].workedHours}
          />
        ))}
      </div>

      {hidden > 0 && (
        <button type="button" className="cal-more" onClick={() => setShowAll(true)}>
          Mostrar os outros {hidden} meses
        </button>
      )}

      <details className="cal-holidays">
        <summary>Feriados do período ({holidays.length})</summary>
        <ul>
          {holidays.map((h) => (
            <li key={h.date} className={h.counted ? "" : "off"}>
              <span>{formatHolidayDate(h.date)}</span>
              <span>{h.name}</span>
              <span className="cal-kind">
                {h.counted ? (h.kind === "nacional" ? "nacional" : "facultativo") : "não conta"}
              </span>
            </li>
          ))}
        </ul>
      </details>

      {!calendar.allYearsFromTable && (
        <p className="group-note">
          Algum ano do período está fora da tabela escrita no código (2025 a 2032): os feriados
          dele foram calculados pela regra da Páscoa.
        </p>
      )}
    </section>
  );
}
