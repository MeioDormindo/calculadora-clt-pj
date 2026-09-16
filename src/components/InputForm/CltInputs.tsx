import type { CltInput, Auto } from "../../lib/calc/types";
import { deriveCltDefaults } from "../../lib/calc/clt";
import { Field, AutoField } from "../ui/Field";

interface CltInputsProps {
  value: CltInput;
  onChange: (value: CltInput) => void;
}

export function CltInputs({ value, onChange }: CltInputsProps) {
  const auto = deriveCltDefaults(value);

  function setField<K extends keyof CltInput>(key: K, fieldValue: CltInput[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  const setAuto = (key: keyof CltInput) => (v: Auto) => setField(key, v as CltInput[typeof key]);

  return (
    <section className="card clt">
      <h2 className="card-title">
        <span className="dot" />
        CLT
      </h2>
      <p className="card-subtitle">O que você tem hoje na carteira assinada.</p>

      <Field
        label="Salário bruto mensal"
        prefix="R$"
        value={value.grossSalary}
        onChange={(v) => setField("grossSalary", v)}
      />

      <Field
        label="Dependentes (IRRF)"
        value={value.dependents}
        onChange={(v) => setField("dependents", v)}
        hint="Cada dependente reduz R$ 189,59 da base do imposto."
      />

      <Field
        label="Recebido por fora (líquido)"
        prefix="R$"
        value={value.externalIncome}
        onChange={(v) => setField("externalIncome", v)}
        hint="Valor pago fora da folha. Entra inteiro no seu líquido, sem INSS nem IRRF, e sobe o mínimo que o PJ precisa faturar."
      />

      <details className="group" open>
        <summary>Benefícios pagos pela empresa</summary>
        <div className="group-body">
          <div className="field-row">
            <Field
              label="Vale-transporte"
              prefix="R$"
              value={value.transportVoucher}
              onChange={(v) => setField("transportVoucher", v)}
              hint="Valor total. Por lei você banca até 6% do salário; só o que passa disso é benefício."
            />
            <Field
              label="Vale-refeição"
              prefix="R$"
              value={value.mealVoucher}
              onChange={(v) => setField("mealVoucher", v)}
              hint="Já sem a parte descontada de você, se houver."
            />
          </div>
          <Field
            label="Plano de saúde"
            prefix="R$"
            value={value.healthPlan}
            onChange={(v) => setField("healthPlan", v)}
          />
          <AutoField
            label="Participação nos lucros"
            value={value.profitSharing}
            auto={auto.profitSharing}
            onChange={setAuto("profitSharing")}
            hint="Automático: uma PLR de um salário por ano, diluída por mês."
          />
          <div className="field-row">
            <Field
              label="Auxílio maternidade"
              prefix="R$"
              value={value.maternityAid}
              onChange={(v) => setField("maternityAid", v)}
            />
            <Field
              label="Outros (creche etc.)"
              prefix="R$"
              value={value.otherBenefits}
              onChange={(v) => setField("otherBenefits", v)}
            />
          </div>
        </div>
      </details>

      <details className="group">
        <summary>Provisões · preenchidas sozinhas</summary>
        <div className="group-body">
          <AutoField
            label="Adicional de férias"
            value={value.vacationBonus}
            auto={auto.vacationBonus}
            onChange={setAuto("vacationBonus")}
            hint="Automático: 1/3 de um salário, diluído por mês (salário ÷ 36)."
          />
          <AutoField
            label="Décimo terceiro salário"
            value={value.thirteenth}
            auto={auto.thirteenth}
            onChange={setAuto("thirteenth")}
            hint="Automático: salário ÷ 12."
          />
          <div className="field-row">
            <AutoField
              label="FGTS"
              value={value.fgts}
              auto={auto.fgts}
              onChange={setAuto("fgts")}
              hint="8% do salário, 13º e férias + 1/3."
            />
            <AutoField
              label="Multa do FGTS"
              value={value.fgtsFine}
              auto={auto.fgtsFine}
              onChange={setAuto("fgtsFine")}
              hint="40% do FGTS."
            />
          </div>
          <AutoField
            label="Aviso prévio"
            value={value.priorNotice}
            auto={auto.priorNotice}
            onChange={setAuto("priorNotice")}
            hint="Automático: salário ÷ 24."
          />
        </div>
      </details>

      <details className="group">
        <summary>Encargos da empresa · preenchidos sozinhos</summary>
        <div className="group-body">
          <AutoField
            label="INSS patronal"
            value={value.employerInss}
            auto={auto.employerInss}
            onChange={setAuto("employerInss")}
            hint="20% da folha (salário, 13º e férias). Empresa no Simples Nacional não paga — zere o campo."
          />
          <div className="field-row">
            <AutoField
              label="RAT"
              value={value.rat}
              auto={auto.rat}
              onChange={setAuto("rat")}
              hint="1% a 3% conforme o risco."
            />
            <AutoField
              label="Sistema S"
              value={value.sistemaS}
              auto={auto.sistemaS}
              onChange={setAuto("sistemaS")}
              hint="5,8% da folha."
            />
          </div>
        </div>
      </details>
    </section>
  );
}
