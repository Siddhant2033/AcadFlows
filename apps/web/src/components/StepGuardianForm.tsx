import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Input, Label, Select, PhoneInput, Button, Card } from './ui';

interface StepGuardianFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
  tenantName: string;
  tenantId: string;
}

interface VerifiedStudent {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  rollNo: string;
}

export default function StepGuardianForm({
  formData,
  onChange,
  onBack,
  onSubmit,
  isLoading,
  error,
  tenantName,
  tenantId,
}: StepGuardianFormProps) {
  const [rollNo, setRollNo] = useState('');
  const [verifiedStudents, setVerifiedStudents] = useState<VerifiedStudent[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Load existing verified children on mount
  useEffect(() => {
    if (formData.children?.length) {
      setVerifiedStudents(formData.children.map((c: any) => c));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifyRollNo = async () => {
    if (!rollNo.trim()) {
      setVerifyError('Please enter a roll number');
      return;
    }

    if (verifiedStudents.some(s => s.rollNo === rollNo.trim().toUpperCase())) {
      setVerifyError('This student is already added');
      return;
    }

    setVerifying(true);
    setVerifyError('');

    try {
      const response = await api.post('/students/verify-rollno', {
        rollNo: rollNo.trim().toUpperCase(),
        tenantId,
      });

      if (response.data.success && response.data.data) {
        const student = response.data.data.student;

        if (student.hasGuardian) {
          setVerifyError('This student already has a registered guardian');
          return;
        }

        setVerifiedStudents(prev => [...prev, student]);

        const currentChildren = formData.children || [];
        onChange('children', [
          ...currentChildren,
          {
            studentId: student.id,
            name: `${student.firstName} ${student.lastName}`,
            grade: student.grade,
            rollNo: student.rollNo,
          },
        ]);

        setRollNo('');
      }
    } catch (err: any) {
      setVerifyError(err.response?.data?.error || 'Failed to verify roll number');
    } finally {
      setVerifying(false);
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    setVerifiedStudents(prev => prev.filter(s => s.id !== studentId));
    const currentChildren = formData.children || [];
    onChange(
      'children',
      currentChildren.filter((c: any) => c.studentId !== studentId),
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-4">👨‍👩‍👧</div>
        <h3 className="text-xl font-semibold text-foreground">Guardian Registration</h3>
        <p className="mt-1 text-sm text-muted">
          Registering at <strong>{tenantName}</strong>
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Roll Number Verification */}
      <div className="p-4 rounded-lg border border-border">
        <h4 className="text-sm font-medium text-foreground mb-3">
          Add Your Children (by Roll Number)
        </h4>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={rollNo}
              onChange={e => setRollNo(e.target.value.toUpperCase())}
              placeholder="Enter student's roll number"
              disabled={verifying}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleVerifyRollNo();
                }
              }}
            />
          </div>
          <Button
            type="button"
            onClick={handleVerifyRollNo}
            disabled={verifying || !rollNo.trim()}
            loading={verifying}
          >
            {verifying ? 'Verifying...' : 'Add Child'}
          </Button>
        </div>

        {verifyError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{verifyError}</p>}

        <p className="mt-2 text-xs text-muted">
          Enter the roll number provided by the school for each of your children
        </p>

        {/* Verified list */}
        {verifiedStudents.length > 0 && (
          <div className="mt-3 space-y-2">
            {verifiedStudents.map(student => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-muted">
                    {student.grade}
                    {student.section ? ` - Section ${student.section}` : ''} · Roll: {student.rollNo}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveStudent(student.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personal Info */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
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

        <div>
          <Label required>Relationship to Student</Label>
          <Select
            value={formData.relationship || ''}
            onChange={e => onChange('relationship', e.target.value)}
            required
          >
            <option value="">Select relationship</option>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="guardian">Guardian</option>
            <option value="grandfather">Grandfather</option>
            <option value="grandmother">Grandmother</option>
            <option value="uncle">Uncle</option>
            <option value="aunt">Aunt</option>
            <option value="other">Other</option>
          </Select>
        </div>

        <div>
          <Label>Occupation</Label>
          <Input
            value={formData.occupation || ''}
            onChange={e => onChange('occupation', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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
      </div>

      <div className="flex justify-between pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading || verifiedStudents.length === 0}
        >
          {isLoading ? 'Creating Account...' : 'Complete Registration'}
        </Button>
      </div>
    </form>
  );
}