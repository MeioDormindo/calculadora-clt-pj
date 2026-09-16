import { useId } from "react";
import type { Auto } from "../../lib/calc/types";

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
  const shown = isAuto ? Math.round(auto * 100) / 100 : value;

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
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          value={shown}
          onFocus={(e) => e.target.select()}
          onWheel={(e) => e.currentTarget.blur()}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
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
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-control">
        {prefix && <span className="field-affix">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={value}
          onFocus={(e) => e.target.select()}
          onWheel={(e) => e.currentTarget.blur()}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        />
        {suffix && <span className="field-affix trailing">{suffix}</span>}
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
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
