import type { PjInput } from "../../lib/calc/types";
import {
  PJ_TAX_PRESETS,
  PJ_INSS_PRESETS,
  PJ_ACTIVITIES,
  MEI_MONTHLY_LIMIT,
} from "../../lib/calc/constants";
import { applyActivity } from "../../lib/calc/pj";
import {
  buildContractCalendar,
  currentYearMonth,
  parseYearMonth,
} from "../../lib/calendar/workCalendar";
import { formatYearMonth } from "../../lib/calendar/format";
import { formatCurrency } from "../../lib/format";
import { Field, SelectField, ToggleField } from "../ui/Field";

interface PjInputsProps {
  value: PjInput;
  onChange: (value: PjInput) => void;
}

export function PjInputs({ value, onChange }: PjInputsProps) {
  function setField<K extends keyof PjInput>(key: K, fieldValue: PjInput[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  const activity = PJ_ACTIVITIES.find((a) => a.id === value.activity) ?? PJ_ACTIVITIES[0];
  const isCustom = activity.id === "CUSTOM";
  const effective = applyActivity(value);
  const inssPreset = PJ_INSS_PRESETS.find((p) => p.id === effective.inssMode);

  // Trocar de atividade também grava regime e INSS dela, para que "escolher
  // manualmente" parta da última combinação em vez de valores antigos.
  function chooseActivity(id: string) {
    const next = PJ_ACTIVITIES.find((a) => a.id === id);
    if (!next) return;
    onChange(
      id === "CUSTOM"
        ? { ...effective, activity: id }
        : { ...value, activity: id, taxRegime: next.taxRegime, inssMode: next.inssMode },
    );
  }

  const start = parseYearMonth(value.contractStart);
  const calendar = buildContractCalendar(start, value.contractMonths, value.includeOptionalHolidays);
  const hourly = value.billingMode === "HOURLY";
  const hourlyRate = hourly && value.monthlyHours > 0 ? value.proposedGross / value.monthlyHours : 0;

  // Início: "este mês" (automático, acompanha a data de hoje) ou um dos
  // próximos 24 meses. Um valor salvo fora dessa janela continua na lista.
  const now = currentYearMonth();
  const startOptions = [
    { id: "AUTO", label: "Este mês (automático)" },
    ...Array.from({ length: 24 }, (_, i) => {
      const index = now.year * 12 + now.month - 1 + i;
      const ym = { year: Math.floor(index / 12), month: (index % 12) + 1 };
      return { id: `${ym.year}-${String(ym.month).padStart(2, "0")}`, label: formatYearMonth(ym) };
    }),
  ];
  if (value.contractStart && !startOptions.some((o) => o.id === value.contractStart)) {
    startOptions.splice(1, 0, { id: value.contractStart, label: formatYearMonth(start) });
  }

  const perYearDays =
    value.localHolidaysPerYear + value.sickDaysPerYear + value.vacationDaysPerYear;
  const overMei = effective.taxRegime === "MEI" && value.proposedGross > MEI_MONTHLY_LIMIT;

  return (
    <section className="card pj">
      <h2 className="card-title">
        <span className="dot" />
        PJ
      </h2>
      <p className="card-subtitle">A proposta que fizeram e o que ela te custa.</p>

      <Field
        label="Valor proposto por mês"
        prefix="R$"
        value={value.proposedGross}
        onChange={(v) => setField("proposedGross", v)}
      />

      <SelectField
        label="Como esse valor é pago"
        value={value.billingMode}
        options={[
          { id: "MONTHLY", label: "Valor fixo por mês" },
          { id: "HOURLY", label: "Por hora trabalhada" },
        ]}
        onChange={(v) => setField("billingMode", v)}
        hint={
          hourly
            ? "Você informa quantas horas por mês esse valor paga; o calendário real diz quantas horas cada mês tem de fato."
            : "O valor do dia é o valor mensal dividido pelos dias úteis de cada mês do calendário."
        }
      />

      {hourly && (
        <>
          <div className="field-row">
            <Field
              label="Horas mensais desse valor"
              suffix="h"
              min={1}
              value={value.monthlyHours}
              onChange={(v) => setField("monthlyHours", v)}
            />
            <Field
              label="Horas por dia"
              suffix="h"
              min={1}
              max={24}
              value={value.hoursPerDay}
              onChange={(v) => setField("hoursPerDay", v)}
            />
          </div>
          <p className="group-note">
            Valor da hora: <strong>{formatCurrency(hourlyRate)}</strong>
          </p>
        </>
      )}

      <details className="group" open>
        <summary>
          Contrato · {value.contractMonths} {value.contractMonths === 1 ? "mês" : "meses"} a partir de{" "}
          {formatYearMonth(start)}
        </summary>
        <div className="group-body">
          <div className="field-row">
            <SelectField
              label="Início"
              value={value.contractStart ?? "AUTO"}
              options={startOptions}
              onChange={(v) => setField("contractStart", v === "AUTO" ? null : v)}
            />
            <Field
              label="Duração"
              suffix="meses"
              min={1}
              max={60}
              value={value.contractMonths}
              onChange={(v) => setField("contractMonths", v)}
            />
          </div>
        </div>
      </details>

      <SelectField
        label="Qual atividade você exerce ou vai exercer?"
        value={activity.id}
        options={PJ_ACTIVITIES}
        onChange={chooseActivity}
        hint={activity.description}
      />

      {isCustom && (
        <SelectField
          label="Regime tributário"
          value={value.taxRegime}
          options={PJ_TAX_PRESETS}
          onChange={(v) => setField("taxRegime", v)}
        />
      )}

      {overMei && (
        <p className="alert">
          Esse faturamento passa do teto do MEI ({formatCurrency(MEI_MONTHLY_LIMIT)}/mês, R$ 81.000
          por ano). Nesse valor você precisaria de Simples Nacional.
        </p>
      )}

      {isCustom && value.taxRegime === "MANUAL" && (
        <Field
          label="Taxa de imposto"
          suffix="%"
          max={100}
          value={value.manualTaxRatePct}
          onChange={(v) => setField("manualTaxRatePct", v)}
        />
      )}

      {isCustom && (
        <SelectField
          label="INSS (contribuinte individual)"
          value={value.inssMode}
          options={PJ_INSS_PRESETS}
          onChange={(v) => setField("inssMode", v)}
          hint={inssPreset?.description}
        />
      )}

      {isCustom && value.inssMode === "CUSTOM" && (
        <div className="field-row">
          <Field
            label="Percentual"
            suffix="%"
            max={100}
            value={value.customInssRatePct}
            onChange={(v) => setField("customInssRatePct", v)}
          />
          <Field
            label="Base de cálculo"
            prefix="R$"
            value={value.customInssBase}
            onChange={(v) => setField("customInssBase", v)}
          />
        </div>
      )}

      <div className="field-row">
        <Field
          label="Contabilidade (mensal)"
          prefix="R$"
          value={value.accountantFee}
          onChange={(v) => setField("accountantFee", v)}
        />
        <Field
          label="Seguro de vida"
          prefix="R$"
          value={value.lifeInsurance}
          onChange={(v) => setField("lifeInsurance", v)}
        />
      </div>

      <details className="group" open>
        <summary>
          Dias parados · {calendar.totalHolidays} feriados no calendário + {perYearDays} dias/ano
        </summary>
        <div className="group-body">
          <p className="group-note">
            Os feriados nacionais vêm do calendário real do período do contrato:{" "}
            <strong>
              {calendar.totalHolidays} em dia útil nos {calendar.months.length} meses
            </strong>
            . Marque o que o contrato PJ cobre — o que a empresa paga deixa de ser custo seu.
          </p>

          <ToggleField
            label="Contar Carnaval e Corpus Christi"
            checked={value.includeOptionalHolidays}
            onChange={(v) => setField("includeOptionalHolidays", v)}
          />
          <Field
            label="Feriados estaduais e municipais"
            suffix="dias/ano"
            value={value.localHolidaysPerYear}
            onChange={(v) => setField("localHolidaysPerYear", v)}
            hint="O calendário só tem os nacionais. Some os da sua cidade e estado que caem em dia útil."
          />
          <ToggleField
            label="A empresa abona os feriados"
            checked={value.paidHolidays}
            onChange={(v) => setField("paidHolidays", v)}
          />

          <Field
            label="Médico / doença"
            suffix="dias/ano"
            value={value.sickDaysPerYear}
            onChange={(v) => setField("sickDaysPerYear", v)}
          />
          <ToggleField
            label="A empresa abona atestados"
            checked={value.paidSickDays}
            onChange={(v) => setField("paidSickDays", v)}
          />

          <div className="field-row">
            <Field
              label="Férias (dias úteis)"
              suffix="dias/ano"
              value={value.vacationDaysPerYear}
              onChange={(v) => setField("vacationDaysPerYear", v)}
            />
            <Field
              label="Dias de férias pagos"
              suffix="dias"
              max={value.vacationDaysPerYear}
              value={value.paidVacationDays}
              onChange={(v) => setField("paidVacationDays", v)}
            />
          </div>
        </div>
      </details>
    </section>
  );
}
