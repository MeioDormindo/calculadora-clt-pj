import type { PjInput } from "../../lib/calc/types";
import { PJ_TAX_PRESETS, PJ_INSS_PRESETS, MEI_MONTHLY_LIMIT } from "../../lib/calc/constants";
import { formatCurrency } from "../../lib/format";
import { Field, SelectField } from "../ui/Field";

interface PjInputsProps {
  value: PjInput;
  onChange: (value: PjInput) => void;
}

export function PjInputs({ value, onChange }: PjInputsProps) {
  function setField<K extends keyof PjInput>(key: K, fieldValue: PjInput[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  const inssPreset = PJ_INSS_PRESETS.find((p) => p.id === value.inssMode);
  const lostDays = value.holidaysPerYear + value.sickDaysPerYear + value.vacationDaysPerYear;
  const overMei = value.taxRegime === "MEI" && value.proposedGross > MEI_MONTHLY_LIMIT;

  return (
    <section className="card pj">
      <h2 className="card-title">
        <span className="dot" />
        PJ
      </h2>
      <p className="card-subtitle">A proposta que fizeram e o que ela te custa.</p>

      <Field
        label="Faturamento proposto (mensal)"
        prefix="R$"
        value={value.proposedGross}
        onChange={(v) => setField("proposedGross", v)}
      />

      <SelectField
        label="Regime tributário"
        value={value.taxRegime}
        options={PJ_TAX_PRESETS}
        onChange={(v) => setField("taxRegime", v)}
      />

      {overMei && (
        <p className="alert">
          Esse faturamento passa do teto do MEI ({formatCurrency(MEI_MONTHLY_LIMIT)}/mês, R$ 81.000
          por ano). Nesse valor você precisaria de Simples Nacional.
        </p>
      )}

      {value.taxRegime === "MANUAL" && (
        <Field
          label="Taxa de imposto"
          suffix="%"
          max={100}
          value={value.manualTaxRatePct}
          onChange={(v) => setField("manualTaxRatePct", v)}
        />
      )}

      <SelectField
        label="INSS (contribuinte individual)"
        value={value.inssMode}
        options={PJ_INSS_PRESETS}
        onChange={(v) => setField("inssMode", v)}
        hint={inssPreset?.description}
      />

      {value.inssMode === "CUSTOM" && (
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
        <summary>Dias sem faturamento · {lostDays} dias/ano</summary>
        <div className="group-body">
          <div className="field-row">
            <Field
              label="Feriados"
              suffix="dias"
              value={value.holidaysPerYear}
              onChange={(v) => setField("holidaysPerYear", v)}
            />
            <Field
              label="Médico / doença"
              suffix="dias"
              value={value.sickDaysPerYear}
              onChange={(v) => setField("sickDaysPerYear", v)}
            />
          </div>
          <div className="field-row">
            <Field
              label="Férias"
              suffix="dias"
              value={value.vacationDaysPerYear}
              onChange={(v) => setField("vacationDaysPerYear", v)}
            />
            <Field
              label="Dias úteis no mês"
              suffix="dias"
              min={1}
              value={value.workingDaysPerMonth}
              onChange={(v) => setField("workingDaysPerMonth", v)}
            />
          </div>
        </div>
      </details>
    </section>
  );
}
