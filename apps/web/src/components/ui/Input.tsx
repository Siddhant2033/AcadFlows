import React from 'react';
import { cn } from '../../lib/cn';

/* ────────────────────────────────────────────────────────────
   Input
   ──────────────────────────────────────────────────────────── */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  /** Left icon (emoji or JSX) */
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = 'text', leftIcon, ...props }, ref) => {
    const baseClasses = cn(
      'block w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-foreground',
      'placeholder:text-muted/70',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400',
      error
        ? 'border-danger focus:border-danger focus:ring-danger'
        : 'border-border focus:border-primary-500 focus:ring-primary-500',
    );

    if (leftIcon) {
      return (
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted text-base">
            {leftIcon}
          </div>
          <input
            ref={ref}
            type={type}
            className={cn(baseClasses, 'pl-10', className)}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        ref={ref}
        type={type}
        className={cn(baseClasses, className)}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

/* ────────────────────────────────────────────────────────────
   Textarea
   ──────────────────────────────────────────────────────────── */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'block w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-foreground',
        'placeholder:text-muted/70',
        'transition-all duration-200 resize-y min-h-[80px]',
        'focus:outline-none focus:ring-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error
          ? 'border-danger focus:border-danger focus:ring-danger'
          : 'border-border focus:border-primary-500 focus:ring-primary-500',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

/* ────────────────────────────────────────────────────────────
   Select
   ──────────────────────────────────────────────────────────── */

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'block w-full rounded-lg border bg-surface px-3.5 py-2.5 pr-10 text-sm text-foreground',
          'appearance-none',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-danger focus:border-danger focus:ring-danger'
            : 'border-border focus:border-primary-500 focus:ring-primary-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  ),
);
Select.displayName = 'Select';

/* ────────────────────────────────────────────────────────────
   Checkbox
   ──────────────────────────────────────────────────────────── */

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={cn(
            'h-4 w-4 rounded border-border bg-surface text-primary-500',
            'transition-all duration-200 cursor-pointer',
            'focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
            'checked:bg-primary-500 checked:border-primary-500',
            className,
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm text-foreground cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';