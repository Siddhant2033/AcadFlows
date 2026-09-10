import React from 'react';
import { Input, Label, Button } from './ui';

interface StepAdminFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
  tenantName: string;
  schoolCode: string;
}

export default function StepAdminForm({
  formData,
  onChange,
  onBack,
  onSubmit,
  isLoading,
  error,
  tenantName,
  schoolCode,
}: StepAdminFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="text-center">
        <div className="text-4xl mb-4">👨‍💼</div>
        <h3 className="text-lg font-medium text-foreground">Admin Registration</h3>
        <p className="mt-1 text-sm text-muted">
          Completing admin account for <strong>{tenantName}</strong>
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/20 dark:border-green-800">
        <p className="text-sm text-green-800 dark:text-green-300 font-medium">
          ✅ School already created
        </p>
        <p className="text-sm text-green-700 dark:text-green-400 mt-1">
          School: <strong>{tenantName}</strong>
        </p>
        <p className="text-sm text-green-700 dark:text-green-400">
          School Code: <span className="font-mono">{schoolCode}</span>
        </p>
        <p className="text-xs text-muted mt-2">
          You are the first admin of this school. Complete your registration below.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>First Name</Label>
          <Input
            value={formData.firstName || ''}
            onChange={e => onChange('firstName', e.target.value)}
            required
          />
        </div>
        <div>
          <Label required>Last Name</Label>
          <Input
            value={formData.lastName || ''}
            onChange={e => onChange('lastName', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label required>Email</Label>
        <Input
          type="email"
          value={formData.email || ''}
          onChange={e => onChange('email', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>Password</Label>
          <Input
            type="password"
            value={formData.password || ''}
            onChange={e => onChange('password', e.target.value)}
            required
          />
        </div>
        <div>
          <Label required>Confirm Password</Label>
          <Input
            type="password"
            value={formData.confirmPassword || ''}
            onChange={e => onChange('confirmPassword', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" loading={isLoading}>
          {isLoading ? 'Creating Admin Account...' : 'Create Admin Account'}
        </Button>
      </div>
    </form>
  );
}