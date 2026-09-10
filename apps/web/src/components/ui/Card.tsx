import React from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Padding: none for tables, default for content, sm for compact */
  padding?: 'none' | 'sm' | 'default' | 'lg';
}

export function Card({ className, padding = 'default', children, ...props }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface shadow-card transition-colors',
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-foreground', className)} {...props}>
      {children}
    </h3>
  );
}