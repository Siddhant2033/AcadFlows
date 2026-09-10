import React from 'react';
import { Link } from 'react-router-dom';
import { Input, Label, PhoneInput, Button } from './ui';

interface StepStudentFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
  tenantName: string;
}

export default function StepStudentForm({
  formData,
  onChange,
  onBack,
  onSubmit,
  isLoading,
  error,
  tenantName,
}: StepStudentFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="text-center">
        <div className="text-4xl mb-4">👨‍🎓</div>
        <h3 className="text-lg font-medium text-foreground">Student Registration</h3>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>Date of Birth</Label>
          <Input
            type="date"
            value={formData.dateOfBirth || ''}
            onChange={e => onChange('dateOfBirth', e.target.value)}
            required
          />
        </div>
        <div>
          <Label required>Grade/Class</Label>
          <Input
            value={formData.grade || ''}
            onChange={e => onChange('grade', e.target.value)}
            placeholder="e.g., 5th Grade"
            required
          />
        </div>
      </div>

      <div>
        <Label>Section</Label>
        <Input
          value={formData.section || ''}
          onChange={e => onChange('section', e.target.value)}
          placeholder="e.g., A"
        />
      </div>

      {/* Parent / Guardian Information */}
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium text-foreground mb-3">
          Parent/Guardian Information
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>Parent Name</Label>
            <Input
              value={formData.parentName || ''}
              onChange={e => onChange('parentName', e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Parent Phone</Label>
            <PhoneInput
              value={formData.parentPhone || ''}
              onChange={v => onChange('parentPhone', v)}
            />
          </div>
        </div>

        <div className="mt-3">
          <Label>Parent Email</Label>
          <Input
            type="email"
            value={formData.parentEmail || ''}
            onChange={e => onChange('parentEmail', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Address</Label>
        <Input
          value={formData.address || ''}
          onChange={e => onChange('address', e.target.value)}
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
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
}