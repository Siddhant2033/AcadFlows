import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/cn';

/**
 * Themed toggle switch.
 * Light mode: cream background, primary-colored knob
 * Dark mode: warm brown background, amber-colored knob
 */
export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative w-14 h-7 rounded-full',
        'transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isDark ? 'bg-secondary-500/30' : 'bg-primary-500/15',
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div
        className={cn(
          'absolute top-0.5 left-0.5 w-6 h-6 rounded-full',
          'flex items-center justify-center text-xs',
          'transition-transform duration-200 ease-out',
          'shadow-sm',
          isDark
            ? 'translate-x-7 bg-secondary-500'
            : 'translate-x-0 bg-primary-500',
        )}
      >
        <span className="text-white" aria-hidden="true">
          {isDark ? '🌙' : '☀️'}
        </span>
      </div>
    </button>
  );
}