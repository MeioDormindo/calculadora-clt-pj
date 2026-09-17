import { useId, useState } from "react";
import type { Auto } from "../../lib/calc/types";
import {
  sanitizeNumericInput,
  parseNumericInput,
  formatForInput,
  clampNumber,
} from "../../lib/numberInput";

interface NumberInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

/**
 * Campo numérico de texto. Não usa `type="number"`: o nativo devolve string
 * vazia para entradas que ele reprova (inclusive "1.500,00"), deixa passar
 * sinal e notação científica, e não impede zero à esquerda.
 *
 * Enquanto está em foco, mostra exatamente o que a pessoa digitou — assim dá
 * para escrever "1500," sem o campo brigar. Ao sair, normaliza e aplica os
 * limites.
 */
function NumberInput({ id, value, onChange, min = 0, max }: NumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={draft ?? formatForInput(value)}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const text = sanitizeNumericInput(e.target.value);
        setDraft(text);
        onChange(clampNumber(parseNumericInput(text), min, max));
      }}
      onBlur={() => {
        // Só confirma se houve digitação: entrar e sair de um campo automático
        // não pode transformá-lo em valor manual.
        if (draft !== null) onChange(clampNumber(parseNumericInput(draft), min, max));
        setDraft(null);
      }}
    />
  );
}

interface AutoFieldProps {
  label: string;
  value: Auto;
  auto: number;
  onChange: (value: Auto) => void;
  prefix?: string;
  hint?: string;
}

/** Campo preenchido sozinho a partir do salário, que o usuário pode sobrescrever. */
export function AutoField({ label, value, auto, onChange, prefix = "R$", hint }: AutoFieldProps) {
  const id = useId();
  const isAuto = value === null;

  return (
    <div className="field">
      <span className="field-label">
        <label htmlFor={id}>{label}</label>
        {isAuto ? (
          <span className="badge auto">auto</span>
        ) : (
          <button type="button" className="badge reset" onClick={() => onChange(null)}>
            ↺ automático
          </button>
        )}
      </span>
      <span className={`field-control${isAuto ? " is-auto" : ""}`}>
        {prefix && <span className="field-affix">{prefix}</span>}
        <NumberInput id={id} value={isAuto ? auto : value} onChange={onChange} />
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

interface FieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  min?: number;
  max?: number;
}

export function Field({ label, value, onChange, prefix, suffix, hint, min = 0, max }: FieldProps) {
  const id = useId();

  return (
    <div className="field">
      <span className="field-label">
        <label htmlFor={id}>{label}</label>
      </span>
      <span className="field-control">
        {prefix && <span className="field-affix">{prefix}</span>}
        <NumberInput id={id} value={value} onChange={onChange} min={min} max={max} />
        {suffix && <span className="field-affix trailing">{suffix}</span>}
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (value: T) => void;
  hint?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: SelectFieldProps<T>) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-control select">
        <select value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleField({ label, checked, onChange }: ToggleFieldProps) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-label">{label}</span>
    </label>
  );
}

interface DateFieldProps {
  label: string;
  /** "AAAA-MM-DD" ou "" */
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  min?: string;
  max?: string;
}

export function DateField({ label, value, onChange, hint, min, max }: DateFieldProps) {
  const id = useId();

  return (
    <div className="field">
      <span className="field-label">
        <label htmlFor={id}>{label}</label>
      </span>
      <span className="field-control">
        <input id={id} type="date" value={value} min={min} max={max} onChange={(e) => onChange(e.target.value)} />
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
