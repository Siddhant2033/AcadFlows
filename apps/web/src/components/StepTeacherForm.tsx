import React from 'react';
import { Input, Label, PhoneInput, Select, Button } from './ui';

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

      {/* Name */}
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

      {/* Email */}
      <div>
        <Label required>Email</Label>
        <Input
          type="email"
          value={formData.email || ''}
          onChange={e => onChange('email', e.target.value)}
          required
        />
      </div>

      {/* Phone */}
      <div>
        <Label required>Phone</Label>
        <PhoneInput
          value={formData.phone || ''}
          onChange={v => onChange('phone', v)}
          required
        />
      </div>

      {/* DOB + Gender */}
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
          <Label required>Gender</Label>
          <Select
            value={formData.gender || ''}
            onChange={e => onChange('gender', e.target.value)}
            required
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </div>
      </div>

      {/* Subject + Qualification */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>Primary Subject</Label>
          <Input
            value={formData.subject || ''}
            onChange={e => onChange('subject', e.target.value)}
            placeholder="e.g., Mathematics"
            required
          />
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
      </div>

      {/* Experience + Joining Date */}
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

      {/* Address */}
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Address (optional)</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>City</Label>
            <Input
              value={formData.addressCity || ''}
              onChange={e => onChange('addressCity', e.target.value)}
            />
          </div>
          <div>
            <Label>State</Label>
            <Input
              value={formData.addressState || ''}
              onChange={e => onChange('addressState', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
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