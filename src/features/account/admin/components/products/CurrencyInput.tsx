import { useId, useState } from "react";
import { formatCurrency } from "./currency.utils";

interface CurrencyInputProps {
  id?: string;
  label?: string;
  value: number;
  onChange: (valueCents: number) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  error?: string;
  className?: string;
  minCents?: number;
  maxCents?: number;
}

const MAX_SAFE_CENTS = 2147483647;



export function CurrencyInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = "R$ 0,00",
  error,
  className = "",
  minCents = 0,
  maxCents = MAX_SAFE_CENTS,
}: CurrencyInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [focused, setFocused] = useState(false);

  const safeValue = Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : 0;

  const handleChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "");

    if (!digits) {
      onChange(0);
      return;
    }

    const parsed = Number(digits);

    if (!Number.isSafeInteger(parsed)) {
      return;
    }

    onChange(Math.min(parsed, maxCents));
  };

  const handleBlur = () => {
  setFocused(false);
};

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-700"
        >
          {label}

          {required && (
            <span className="ml-1 text-rose-600">*</span>
          )}
        </label>
      )}

      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        required={required}
        value={focused && safeValue === 0
          ? ""
          : formatCurrency(safeValue)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        onChange={(event) =>
          handleChange(event.target.value)
        }
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${inputId}-error` : undefined
        }
        className={[
          "min-h-12 w-full rounded-xl border",
          "bg-white px-4 py-3 text-sm font-semibold",
          "text-slate-900 outline-none",
          "transition-colors",
          "focus:ring-2",
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
            : "border-slate-200 focus:border-sky-500 focus:ring-sky-100",
          disabled
            ? "cursor-not-allowed bg-slate-100 opacity-60"
            : "",
        ].join(" ")}
      />

      {error && (
        <p
          id={`${inputId}-error`}
          className="text-xs font-medium text-rose-600"
        >
          {error}
        </p>
      )}

      {safeValue < minCents && (
        <p className="text-xs text-amber-600">
          O valor mínimo é {formatCurrency(minCents)}.
        </p>
      )}
    </div>
  );
}
