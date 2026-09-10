import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Input, Label, Select, PhoneInput, Textarea, Button } from './ui';

interface StepStudentFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
  tenantName: string;
  tenantId: string;
}

interface Grade {
  _id: string;
  name: string;
}

interface Section {
  _id: string;
  name: string;
  gradeId: string;
}

export default function StepStudentForm({
  formData,
  onChange,
  onBack,
  onSubmit,
  isLoading,
  error,
  tenantName,
  tenantId,
}: StepStudentFormProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    if (!tenantId) return;

    // Public-lookup: fetch grades & sections for this tenant.
    // If the endpoint requires auth, fall back to empty lists
    // (user can still register — admin will assign grade/section later).
    (async () => {
      try {
        const [gRes, sRes] = await Promise.all([
          api.get('/academic/grades'),
          api.get('/academic/sections'),
        ]);
        setGrades(gRes.data.data || []);
        setSections(sRes.data.data || []);
      } catch {
        // Non-authenticated context — leave lists empty
      }
    })();
  }, [tenantId]);

  const sectionsForGrade = sections.filter(
    s => !formData.gradeId || s.gradeId === formData.gradeId,
  );

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

      {/* Grade + Section */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>Grade / Class</Label>
          {grades.length > 0 ? (
            <Select
              value={formData.gradeId || ''}
              onChange={e => {
                const selected = grades.find(g => g._id === e.target.value);
                onChange('gradeId', e.target.value);
                onChange('grade', selected?.name || '');
                onChange('sectionId', '');
                onChange('section', '');
              }}
              required
            >
              <option value="">Select Grade</option>
              {grades.map(g => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              value={formData.grade || ''}
              onChange={e => onChange('grade', e.target.value)}
              placeholder="e.g., 5"
              required
            />
          )}
        </div>
        <div>
          <Label>Section</Label>
          {sectionsForGrade.length > 0 ? (
            <Select
              value={formData.sectionId || ''}
              onChange={e => {
                const selected = sectionsForGrade.find(s => s._id === e.target.value);
                onChange('sectionId', e.target.value);
                onChange('section', selected?.name || '');
              }}
            >
              <option value="">Select Section</option>
              {sectionsForGrade.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              value={formData.section || ''}
              onChange={e => onChange('section', e.target.value)}
              placeholder="e.g., A"
            />
          )}
        </div>
      </div>

      {/* Parent / Guardian info */}
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium text-foreground mb-3">
          Parent/Guardian Information
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Parent Name</Label>
            <Input
              value={formData.parentName || ''}
              onChange={e => onChange('parentName', e.target.value)}
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

      {/* Address */}
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Address</h4>

        <div className="space-y-3">
          <div>
            <Label>Street</Label>
            <Input
              value={formData.addressStreet || ''}
              onChange={e => onChange('addressStreet', e.target.value)}
              placeholder="House number, building, street"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City</Label>
              <Input
                value={formData.addressCity || ''}
                onChange={e => onChange('addressCity', e.target.value)}
                placeholder="e.g., Noida"
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={formData.addressState || ''}
                onChange={e => onChange('addressState', e.target.value)}
                placeholder="e.g., Uttar Pradesh"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pincode</Label>
              <Input
                value={formData.addressPostalCode || ''}
                onChange={e => onChange('addressPostalCode', e.target.value)}
                placeholder="e.g., 201301"
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={formData.addressCountry || 'India'}
                onChange={e => onChange('addressCountry', e.target.value)}
              />
            </div>
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