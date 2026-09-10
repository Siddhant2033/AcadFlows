import React from 'react';
import { cn } from '../../lib/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'block text-sm font-medium text-foreground mb-1.5',
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-primary-500 ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export interface FieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper for form fields: Label + Input + error/hint text.
 * Standardizes spacing and error display across the app.
 */
export function Field({
  label,
  required,
  error,
  hint,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-danger flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}