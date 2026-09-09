import React, { useState } from 'react';
import { validateSchoolCode } from '../lib/tenant';
import type { TenantInfo } from '../lib/tenant';

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
    // Clean the code
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
        if (onVerified) {
          onVerified({
            id: result.tenant.id,
            name: result.tenant.name,
            schoolCode: result.tenant.schoolCode,
            formattedSchoolCode: result.tenant.formattedSchoolCode,
          } as any);
        }
        setError(null);
      } else {
        setIsVerified(false);
        setTenantName(null);
        setError('Invalid school code. Please check and try again.');
        onChange(value, undefined);
      }
    } catch (err) {
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
    // Allow hyphens for display but limit to 12 characters (with hyphens)
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
    // Auto-verify on blur if not verified and value is long enough
    if (autoVerify && !isVerified && value.replace(/[-\s]/g, '').length >= 8) {
      handleVerify();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            onBlur={handleBlur}
            disabled={disabled || isVerifying}
            required={required}
            placeholder={placeholder}
            maxLength={12} // Allow for hyphens
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase font-mono text-lg tracking-wider ${
              isVerified ? 'border-green-500 bg-green-50' : 'border-gray-300'
            }`}
          />
        </div>
        <button
          type="button"
          onClick={handleVerify}
          disabled={disabled || isVerifying || !value || value.replace(/[-\s]/g, '').length < 5}
          className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 whitespace-nowrap ${
            isVerified
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isVerifying ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
          ) : isVerified ? (
            '✅ Verified'
          ) : (
            'Verify'
          )}
        </button>
      </div>
      
      {tenantName && isVerified && (
        <div className="text-sm text-green-600 bg-green-50 p-2 rounded-md">
          <span className="font-medium">✓ School found:</span> {tenantName}
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
          {error}
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        Format: 10 characters (letters and numbers). Example: AB12CD34EF
      </div>
    </div>
  );
}