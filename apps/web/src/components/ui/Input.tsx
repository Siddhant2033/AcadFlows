import React from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'block w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-foreground',
        'placeholder:text-muted',
        'transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        error
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
          : 'border-border focus:border-primary-500 focus:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'block w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-foreground',
        'placeholder:text-muted',
        'transition-colors',
        'focus:outline-none focus:ring-2',
        error
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
          : 'border-border focus:border-primary-500 focus:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'block w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-foreground',
        'transition-colors',
        'focus:outline-none focus:ring-2',
        error
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
          : 'border-border focus:border-primary-500 focus:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';