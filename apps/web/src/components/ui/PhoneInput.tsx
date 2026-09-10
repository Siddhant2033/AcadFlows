import React from 'react';
import { INDIA } from '@school-platform/shared';
import { cn } from '../../lib/cn';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

/**
 * Indian phone input with a fixed +91 prefix.
 * Stores the raw 10-digit number (no country code) in the value prop.
 */
export function PhoneInput({
  value,
  onChange,
  error,
  disabled,
  required,
  placeholder = '98765 43210',
  className,
  id,
  name,
}: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only digits, cap at 10
    const digits = e.target.value.replace(/\D/g, '').slice(0, INDIA.phone.maxLength);
    onChange(digits);
  };

  return (
    <div className={cn('flex', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1 px-3 rounded-l-lg border border-r-0 text-sm font-medium',
          'bg-elevated text-muted',
          error ? 'border-red-500' : 'border-border',
        )}
      >
        <span aria-hidden>🇮🇳</span>
        <span>{INDIA.phone.code}</span>
      </span>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        maxLength={INDIA.phone.maxLength}
        className={cn(
          'flex-1 rounded-r-lg border bg-surface px-3.5 py-2.5 text-sm text-foreground',
          'placeholder:text-muted transition-colors',
          'focus:outline-none focus:ring-2',
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-border focus:border-primary-500 focus:ring-primary-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      />
    </div>
  );
}