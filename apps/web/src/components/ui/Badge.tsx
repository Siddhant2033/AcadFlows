import React from 'react';
import { cn } from '../../lib/cn';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Show a small dot before the text */
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-elevated text-foreground border border-border',
  primary:
    'bg-primary-50 text-primary-700 border border-primary-100 dark:bg-primary-500/15 dark:text-primary-300 dark:border-primary-500/20',
  secondary:
    'bg-secondary-50 text-secondary-700 border border-secondary-100 dark:bg-secondary-500/15 dark:text-secondary-300 dark:border-secondary-500/20',
  accent:
    'bg-accent-50 text-accent-700 border border-accent-100 dark:bg-accent-500/15 dark:text-accent-300 dark:border-accent-500/20',
  success:
    'bg-green-50 text-green-700 border border-green-100 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/20',
  warning:
    'bg-yellow-50 text-yellow-700 border border-yellow-100 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/20',
  danger:
    'bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/20',
  info:
    'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/20',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-0.5 text-xs gap-1.5',
  lg: 'px-3 py-1 text-sm gap-1.5',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-muted',
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  accent: 'bg-accent-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
};

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}