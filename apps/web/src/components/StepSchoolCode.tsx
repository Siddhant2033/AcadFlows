import React from 'react';
import { Link } from 'react-router-dom';
import { SchoolCodeInput } from './SchoolCodeInput';

interface StepSchoolCodeProps {
  schoolCode: string;
  onSchoolCodeChange: (code: string, tenantId?: string, tenantName?: string) => void;
  tenantSlug?: string;
}

export default function StepSchoolCode({
  schoolCode,
  onSchoolCodeChange,
  tenantSlug,
}: StepSchoolCodeProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-4">🔑</div>
        <h3 className="text-lg font-medium text-foreground">Verify Your School</h3>
        <p className="mt-1 text-sm text-muted">
          Enter the school code provided by your school administrator
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <SchoolCodeInput
          value={schoolCode}
          onChange={onSchoolCodeChange}
          disabled={!!tenantSlug}
          required
          placeholder="Enter 10-digit school code (e.g., AB12CD34EF)"
          autoVerify={true}
        />
      </div>

      <p className="text-center text-xs text-muted">
        Don't have a code?{' '}
        <Link to="/school/register" className="text-primary-600 hover:text-primary-700">
          Register your school
        </Link>
      </p>
    </div>
  );
}