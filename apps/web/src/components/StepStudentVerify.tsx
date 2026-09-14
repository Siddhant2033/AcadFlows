import { useState } from 'react';
import api from '../lib/api';
import { Input, Label, Button } from './ui';

interface VerifiedStudent {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  sectionId: string | null;
  rollNo: string;
  admissionNo: string;
}

interface StepStudentVerifyProps {
  tenantId: string;
  tenantName: string;
  onVerified: (student: VerifiedStudent) => void;
  onBack: () => void;
}

export default function StepStudentVerify({
  tenantId,
  tenantName,
  onVerified,
  onBack,
}: StepStudentVerifyProps) {
  const [rollNo, setRollNo] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [found, setFound] = useState<VerifiedStudent | null>(null);

  const handleVerify = async () => {
    if (!rollNo.trim() || !admissionNo.trim()) {
      setError('Please enter both roll number and admission number');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const res = await api.post('/students/verify-identity', {
        tenantId,
        rollNo: rollNo.trim().toUpperCase(),
        admissionNo: admissionNo.trim().toUpperCase(),
      });

      setFound(res.data.data.student);
    } catch (err: any) {
      setFound(null);
      setError(
        err.response?.data?.error ||
          'Could not verify your identity. Please check and try again.',
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirm = () => {
    if (!found) return;
    onVerified(found);
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-4xl mb-4">🔐</div>
        <h3 className="text-lg font-medium text-foreground">
          Verify your identity
        </h3>
        <p className="mt-1 text-sm text-muted">
          Registering at <strong>{tenantName}</strong>
        </p>
        <p className="mt-1 text-xs text-muted">
          We need to confirm you're on your school's student list
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {!found && (
        <>
          <div>
            <Label required>Roll Number</Label>
            <Input
              value={rollNo}
              onChange={e => setRollNo(e.target.value.toUpperCase())}
              placeholder="e.g., C5A001"
              disabled={verifying}
            />
          </div>

          <div>
            <Label required>Admission Number</Label>
            <Input
              value={admissionNo}
              onChange={e => setAdmissionNo(e.target.value.toUpperCase())}
              placeholder="e.g., 25-SUN-0001"
              disabled={verifying}
            />
            <p className="mt-1.5 text-xs text-muted">
              Found on your school ID card or fee receipt
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={onBack}>
              ← Back
            </Button>
            <Button
              type="button"
              onClick={handleVerify}
              loading={verifying}
              disabled={!rollNo.trim() || !admissionNo.trim()}
            >
              Verify Identity
            </Button>
          </div>
        </>
      )}

      {found && (
        <>
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-green-500/20 text-xl">
                ✓
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Identity confirmed
                </p>
                <p className="text-sm text-foreground mt-1">
                  {found.firstName} {found.lastName}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {found.grade}
                  {found.section ? ` - ${found.section}` : ''} · Roll:{' '}
                  {found.rollNo} · Adm: {found.admissionNo}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted text-center">
            Not you?{' '}
            <button
              type="button"
              onClick={() => {
                setFound(null);
                setRollNo('');
                setAdmissionNo('');
              }}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
            >
              Try again
            </button>
          </p>

          <div className="flex justify-between pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={onBack}>
              ← Back
            </Button>
            <Button type="button" onClick={handleConfirm}>
              Continue →
            </Button>
          </div>
        </>
      )}
    </div>
  );
}