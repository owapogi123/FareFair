import { type ChangeEvent, useId } from 'react';

interface PesoInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
}

export function PesoInput({
  label = 'Amount Charged',
  value,
  onChange,
  placeholder = '0.00',
  error,
  hint,
  className = '',
  disabled = false,
}: PesoInputProps) {
  const id = useId();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d.]/g, '');
    // Allow only valid decimal numbers
    const parts = raw.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    onChange(raw);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="ff-label">
          {label}
        </label>
      )}
      <div className="relative">
        <span
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ff-onyx)] font-semibold text-lg select-none"
          aria-hidden
        >
          ₱
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]{0,2}"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`ff-input pl-9 text-lg font-semibold ${error ? 'border-red-400 focus:border-red-500' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
}
