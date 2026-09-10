import React from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Padding: none for tables, sm for compact, default for content, lg for hero-like sections */
  padding?: 'none' | 'sm' | 'default' | 'lg';
  /** Hover effect: subtle lift on hover */
  hoverable?: boolean;
  /** Background variant */
  variant?: 'default' | 'tint' | 'elevated';
}

export function Card({
  className,
  padding = 'default',
  hoverable = false,
  variant = 'default',
  children,
  ...props
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  const variantClasses = {
    default: 'bg-surface border-border',
    tint: 'bg-surface-tint border-border',
    elevated: 'bg-elevated border-border',
  };

  return (
    <div
      className={cn(
        'rounded-card border shadow-card transition-all duration-200',
        variantClasses[variant],
        paddingClasses[padding],
        hoverable && 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 mb-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold text-foreground tracking-tight',
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted mt-1', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-5 pt-5 border-t border-border flex items-center justify-end gap-3',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}