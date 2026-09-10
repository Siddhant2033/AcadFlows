import React from 'react';
import { Input, Label, PhoneInput, Button } from './ui';

interface StepTeacherFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
  tenantName: string;
}

export default function StepTeacherForm({
  formData,
  onChange,
  onBack,
  onSubmit,
  isLoading,
  error,
  tenantName,
}: StepTeacherFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="text-center">
        <div className="text-4xl mb-4">👨‍🏫</div>
        <h3 className="text-lg font-medium text-foreground">Teacher Registration</h3>
        <p className="mt-1 text-sm text-muted">
          Registering at <strong>{tenantName}</strong>
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

      <div>
        <Label required>Phone</Label>
        <PhoneInput
          value={formData.phone || ''}
          onChange={v => onChange('phone', v)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>Employee ID</Label>
          <Input
            value={formData.employeeId || ''}
            onChange={e => onChange('employeeId', e.target.value)}
            placeholder="e.g., T-2024-001"
            required
          />
        </div>
        <div>
          <Label required>Subject</Label>
          <Input
            value={formData.subject || ''}
            onChange={e => onChange('subject', e.target.value)}
            placeholder="e.g., Mathematics"
            required
          />
        </div>
      </div>

      <div>
        <Label required>Qualification</Label>
        <Input
          value={formData.qualification || ''}
          onChange={e => onChange('qualification', e.target.value)}
          placeholder="e.g., M.Sc. Mathematics"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Years of Experience</Label>
          <Input
            type="number"
            min="0"
            value={formData.experience || ''}
            onChange={e => onChange('experience', e.target.value)}
            placeholder="e.g., 5"
          />
        </div>
        <div>
          <Label>Joining Date</Label>
          <Input
            type="date"
            value={formData.joiningDate || ''}
            onChange={e => onChange('joiningDate', e.target.value)}
          />
        </div>
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
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
}