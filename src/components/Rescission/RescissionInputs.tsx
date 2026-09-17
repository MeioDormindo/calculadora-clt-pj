import type { Auto, CltInput } from "../../lib/calc/types";
import {
  NOTICE_OPTIONS,
  RESCISSION_TYPES,
  noticeModeFor,
  type RescissionInput,
} from "../../lib/rescission/rescission";
import { toIsoDate, todayDate } from "../../lib/rescission/dates";
import { AutoField, DateField, Field, SelectField, ToggleField } from "../ui/Field";

interface RescissionInputsProps {
  clt: CltInput;
  value: RescissionInput;
  estimatedFgts: number;
  onCltChange: (clt: CltInput) => void;
  onChange: (value: RescissionInput) => void;
}

export function RescissionInputs({ clt, value, estimatedFgts, onCltChange, onChange }: RescissionInputsProps) {
  function setField<K extends keyof RescissionInput>(key: K, fieldValue: RescissionInput[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  const today = toIsoDate(todayDate());
  const noticeMode = noticeModeFor(value.type, value.noticeMode);

  return (
    <>
      <section className="card clt">
        <h2 className="card-title">
          <span className="dot" />
          Seu contrato
        </h2>
        <p className="card-subtitle">Salário e dependentes são os mesmos da aba Calculadora.</p>

        <Field
          label="Salário bruto mensal"
          prefix="R$"
          value={clt.grossSalary}
          onChange={(v) => onCltChange({ ...clt, grossSalary: v })}
          hint="Se recebe horas extras, comissões ou adicionais fixos, some a média deles."
        />
        <Field
          label="Dependentes (IRRF)"
          value={clt.dependents}
          onChange={(v) => onCltChange({ ...clt, dependents: v })}
        />

        <div className="field-row">
          <DateField
            label="Data de admissão"
            value={value.admissionDate ?? ""}
            max={value.terminationDate ?? today}
            onChange={(v) => setField("admissionDate", v || null)}
            hint="Está na carteira de trabalho digital."
          />
          <DateField
            label="Último dia trabalhado"
            value={value.terminationDate ?? today}
            min={value.admissionDate ?? undefined}
            onChange={(v) => setField("terminationDate", v || null)}
            hint="Em branco, usa a data de hoje."
          />
        </div>

        <SelectField
          label="Tipo de demissão"
          value={value.type}
          options={RESCISSION_TYPES}
          onChange={(type) => onChange({ ...value, type, noticeMode: noticeModeFor(type, value.noticeMode) })}
        />
        <SelectField
          label="Aviso prévio"
          value={noticeMode}
          options={NOTICE_OPTIONS[value.type]}
          onChange={(v) => setField("noticeMode", v)}
          hint={
            value.type === "PEDIDO"
              ? "Quem pede demissão deve 30 dias de aviso; a empresa pode dispensar."
              : "30 dias + 3 por ano completo de empresa, até 90 dias (Lei 12.506/2011)."
          }
        />
      </section>

      <section className="card pj">
        <h2 className="card-title">
          <span className="dot" />
          Férias, FGTS e seguro
        </h2>
        <p className="card-subtitle">Ajuste o que souber; o resto é estimado.</p>

        <Field
          label="Períodos de férias vencidas (não tiradas)"
          max={3}
          value={value.expiredVacationPeriods}
          onChange={(v) => setField("expiredVacationPeriods", Math.round(v))}
          hint="Cada 12 meses completos de empresa em que você não tirou férias. Com 2 ou mais, as mais antigas são pagas em dobro."
        />

        <AutoField
          label="Saldo do FGTS deste emprego"
          value={value.fgtsBalance}
          auto={estimatedFgts}
          onChange={(v: Auto) => setField("fgtsBalance", v)}
          hint="Veja o valor exato no app FGTS. A estimativa soma os depósitos de 8%, sem o rendimento da conta."
        />
        <ToggleField
          label="Aderi ao saque-aniversário do FGTS"
          checked={value.saqueAniversario}
          onChange={(v) => setField("saqueAniversario", v)}
        />
        <ToggleField
          label="Já recebi a 1ª parcela do 13º deste ano"
          checked={value.thirteenthAdvancePaid}
          onChange={(v) => setField("thirteenthAdvancePaid", v)}
        />

        <SelectField
          label="Seguro-desemprego já pedido antes"
          value={String(Math.min(2, value.unemploymentRequests))}
          options={[
            { id: "0", label: "Nunca pedi" },
            { id: "1", label: "Pedi 1 vez" },
            { id: "2", label: "Pedi 2 vezes ou mais" },
          ]}
          onChange={(v) => setField("unemploymentRequests", Number(v))}
          hint="Muda quantos meses de trabalho são exigidos: 12, 9 ou 6."
        />
      </section>
    </>
  );
}
