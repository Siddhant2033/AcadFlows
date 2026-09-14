import { useState } from 'react';
import axios from 'axios';
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
  onSkip: (meta: { rollNo: string; admissionNo: string }) => void;
  onBack: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export default function StepStudentVerify({
  tenantId,
  tenantName,
  onVerified,
  onSkip,
  onBack,
}: StepStudentVerifyProps) {
  const [rollNo, setRollNo] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState<string | null>(null);
  const [found, setFound] = useState<VerifiedStudent | null>(null);

  const handleVerify = async () => {
    if (!rollNo.trim() || !admissionNo.trim()) {
      setError('Please enter both roll number and admission number');
      return;
    }

    setVerifying(true);
    setError('');
    setNotFound(null);
    setFound(null);

    try {
      const res = await axios.post(
        `${API_BASE}/students/verify-identity`,
        {
          tenantId,
          rollNo: rollNo.trim().toUpperCase(),
          admissionNo: admissionNo.trim().toUpperCase(),
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: false,
        },
      );

      const data = res.data.data;

      if (data.found && data.student) {
        setFound(data.student);
      } else {
        // Non-error "not found" — student can still register
        setNotFound(
          data.message ||
            'We couldn’t find your record. You can still register; your teacher will verify your details.',
        );
      }
    } catch (err: any) {
      // Only hard errors land here (bad tenant, server error, etc.)
      setError(
        err.response?.data?.error ||
          'Something went wrong. Please try again in a moment.',
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirm = () => {
    if (!found) return;
    onVerified(found);
  };

  const handleSkip = () => {
    onSkip({
      rollNo: rollNo.trim().toUpperCase(),
      admissionNo: admissionNo.trim().toUpperCase(),
    });
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
          Optional — but if we find your record, we'll pre-fill your details
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {!found && !notFound && (
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

      {notFound && (
        <>
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-yellow-500/20 text-xl">
                ℹ️
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                  We couldn't find your record
                </p>
                <p className="text-sm text-foreground mt-1">
                  You can still register. Your class teacher or school
                  admin will verify your details at approval time.
                </p>
                <p className="text-xs text-muted mt-2">
                  Make sure your roll number and admission number are
                  correct — or continue and update them later.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setNotFound(null);
                setRollNo('');
                setAdmissionNo('');
              }}
            >
              ← Try Again
            </Button>
            <Button type="button" variant="primary" onClick={handleSkip}>
              Continue Without Verification →
            </Button>
          </div>
        </>
      )}
    </div>
  );
}