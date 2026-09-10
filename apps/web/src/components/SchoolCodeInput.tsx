import React, { useState } from 'react';
import { validateSchoolCode } from '../lib/tenant';
import type { TenantInfo } from '../lib/tenant';
import { cn } from '../lib/cn';

interface SchoolCodeInputProps {
  value: string;
  onChange: (value: string, tenantId?: string, tenantName?: string) => void;
  onVerified?: (tenant: TenantInfo) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  autoVerify?: boolean;
}

export function SchoolCodeInput({
  value,
  onChange,
  onVerified,
  disabled = false,
  required = false,
  placeholder = 'Enter 10-digit school code (e.g., AB12CD34EF)',
  autoVerify = true,
}: SchoolCodeInputProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);

  const handleVerify = async () => {
    const cleanCode = value.replace(/[-\s]/g, '').toUpperCase();

    if (!cleanCode || cleanCode.length < 5) {
      setError('Please enter a valid school code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await validateSchoolCode(cleanCode);

      if (result.valid && result.tenant) {
        setIsVerified(true);
        setTenantName(result.tenant.name);
        onChange(value, result.tenant.id, result.tenant.name);
        onVerified?.({
          id: result.tenant.id,
          name: result.tenant.name,
          schoolCode: result.tenant.schoolCode,
          formattedSchoolCode: result.tenant.formattedSchoolCode,
        } as any);
        setError(null);
      } else {
        setIsVerified(false);
        setTenantName(null);
        setError('Invalid school code. Please check and try again.');
        onChange(value, undefined);
      }
    } catch {
      setIsVerified(false);
      setTenantName(null);
      setError('Failed to verify school code. Please try again.');
      onChange(value, undefined);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const cleanValue = newValue.replace(/-/g, '');
    if (cleanValue.length <= 10) {
      setIsVerified(false);
      setTenantName(null);
      setError(null);
      onChange(newValue, undefined);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  };

  const handleBlur = () => {
    if (autoVerify && !isVerified && value.replace(/[-\s]/g, '').length >= 8) {
      handleVerify();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          onBlur={handleBlur}
          disabled={disabled || isVerifying}
          required={required}
          placeholder={placeholder}
          maxLength={12}
          className={cn(
            'flex-1 px-3 py-2 rounded-md border bg-surface text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'uppercase font-mono text-lg tracking-wider',
            isVerified
              ? 'border-green-500'
              : error
                ? 'border-red-500'
                : 'border-border',
          )}
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={disabled || isVerifying || !value || value.replace(/[-\s]/g, '').length < 5}
          className={cn(
            'px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isVerified
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-primary-600 text-white hover:bg-primary-700',
          )}
        >
          {isVerifying ? 'Verifying...' : isVerified ? '✅ Verified' : 'Verify'}
        </button>
      </div>

      {tenantName && isVerified && (
        <div className="text-sm text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-2 rounded-md">
          <span className="font-medium">✓ School found:</span> {tenantName}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-2 rounded-md">
          {error}
        </div>
      )}

      <p className="text-xs text-muted">
        Format: 10 characters (letters and numbers). Example: AB12CD34EF
      </p>
    </div>
  );
}