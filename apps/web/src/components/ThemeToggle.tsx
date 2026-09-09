import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      style={{
        backgroundColor: mode === 'dark' ? '#334155' : '#CBD5E1',
      }}
      aria-label="Toggle theme"
    >
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200 flex items-center justify-center text-xs ${
          mode === 'dark' ? 'translate-x-6 bg-primary-500' : 'translate-x-0 bg-white'
        }`}
      >
        {mode === 'dark' ? (
          <span className="text-white">🌙</span>
        ) : (
          <span className="text-gray-700">☀️</span>
        )}
      </div>
    </button>
  );
}