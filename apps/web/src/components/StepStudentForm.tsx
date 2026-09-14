import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

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

  // Best-effort verification state — no UI blocking
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<
    | { kind: 'idle' }
    | { kind: 'verifying' }
    | { kind: 'matched'; student: any }
    | { kind: 'no-match' }
    | { kind: 'error'; message: string }
  >({ kind: 'idle' });

  useEffect(() => {
    if (!tenantId) return;

    (async () => {
      try {
        const [gRes, sRes] = await Promise.all([
          axios.get(`${API_BASE}/academic/grades`).catch(() => null),
          axios.get(`${API_BASE}/academic/sections`).catch(() => null),
        ]);
        if (gRes) setGrades(gRes.data.data || []);
        if (sRes) setSections(sRes.data.data || []);
      } catch {
        /* Public context — lists will stay empty; the student can still submit */
      }
    })();
  }, [tenantId]);

  const sectionsForGrade = sections.filter(
    s => !formData.gradeId || s.gradeId === formData.gradeId,
  );

  /* ─────────────────────────────────────────────────────
     Best-effort identity lookup
     ─────────────────────────────────────────────────────
     Runs when the student clicks "Check my record" or blurs the
     admission-number field. Never blocks submit — the payload works
     with or without verification.
  */
  const runVerify = async () => {
    const rollNo = (formData.rollNo || '').trim().toUpperCase();
    const admissionNo = (formData.admissionNo || '').trim().toUpperCase();

    if (!rollNo || !admissionNo) {
      setVerifyResult({ kind: 'idle' });
      return;
    }

    setVerifying(true);
    setVerifyResult({ kind: 'verifying' });

    try {
      const res = await axios.post(
        `${API_BASE}/students/verify-identity`,
        { tenantId, rollNo, admissionNo },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: false,
        },
      );

      const data = res.data.data;
      if (data.found && data.student) {
        setVerifyResult({ kind: 'matched', student: data.student });
        // Link the verified record to the form so submit uses the
        // verifiedStudentId path (safer — no duplicate Student row).
        onChange('_verifiedStudentId', data.student.id);
      } else {
        setVerifyResult({ kind: 'no-match' });
        onChange('_verifiedStudentId', '');
      }
    } catch (err: any) {
      setVerifyResult({
        kind: 'error',
        message:
          err.response?.data?.error ||
          'Could not check your record right now. You can still submit.',
      });
      onChange('_verifiedStudentId', '');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="text-center">
        <div className="text-4xl mb-4">👨‍🎓</div>
        <h3 className="text-lg font-medium text-foreground">
          Student Registration
        </h3>
        <p className="mt-1 text-sm text-muted">
          Registering at <strong>{tenantName}</strong>
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* ── Name ── */}
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

      {/* ── Email ── */}
      <div>
        <Label required>Email</Label>
        <Input
          type="email"
          value={formData.email || ''}
          onChange={e => onChange('email', e.target.value)}
          required
        />
      </div>

      {/* ── DOB + Gender ── */}
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

      {/* ── Grade + Section ── */}
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
              placeholder="e.g., Class 5"
              required
            />
          )}
        </div>
        <div>
          <Label required>Section</Label>
          {sectionsForGrade.length > 0 ? (
            <Select
              value={formData.sectionId || ''}
              onChange={e => {
                const selected = sectionsForGrade.find(
                  s => s._id === e.target.value,
                );
                onChange('sectionId', e.target.value);
                onChange('section', selected?.name || '');
              }}
              required
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
              required
            />
          )}
        </div>
      </div>

      {/* ── Parent / Guardian ── */}
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

      {/* ── Address ── */}
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

      {/* ── Password ── */}
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

      {/* ── School record — roll + admission number (OPTIONAL) ── */}
      <div className="border-t-2 border-dashed border-border pt-5">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground">
            School Record (if you have it)
          </h4>
          <p className="mt-1 text-xs text-muted">
            Enter your roll number and admission number from your school
            ID card or fee receipt. This helps us match you to your
            record. If you don't have these yet, skip this — your
            teacher will verify your details when they approve.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Roll Number</Label>
            <Input
              value={formData.rollNo || ''}
              onChange={e => {
                onChange('rollNo', e.target.value.toUpperCase());
                setVerifyResult({ kind: 'idle' });
                onChange('_verifiedStudentId', '');
              }}
              onBlur={runVerify}
              placeholder="e.g., C5A001"
              disabled={verifying}
            />
          </div>
          <div>
            <Label>Admission Number</Label>
            <Input
              value={formData.admissionNo || ''}
              onChange={e => {
                onChange('admissionNo', e.target.value.toUpperCase());
                setVerifyResult({ kind: 'idle' });
                onChange('_verifiedStudentId', '');
              }}
              onBlur={runVerify}
              placeholder="e.g., 25-SUN-0001"
              disabled={verifying}
            />
          </div>
        </div>

        {/* Verification feedback (inline, non-blocking) */}
        {verifyResult.kind === 'verifying' && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted">
            <div className="w-3 h-3 rounded-full border-2 border-border border-t-primary-500 animate-spin" />
            <span>Checking your record…</span>
          </div>
        )}

        {verifyResult.kind === 'matched' && (
          <div className="mt-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400">
              ✓ We found your record
            </p>
            <p className="text-sm text-foreground mt-1">
              {verifyResult.student.firstName}{' '}
              {verifyResult.student.lastName} ·{' '}
              {verifyResult.student.grade}
              {verifyResult.student.section
                ? ` - ${verifyResult.student.section}`
                : ''}
            </p>
            <p className="text-xs text-muted mt-1">
              Your account will be linked to this existing student
              record once approved.
            </p>
          </div>
        )}

        {verifyResult.kind === 'no-match' && (
          <div className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
              ℹ️ We couldn't find your record
            </p>
            <p className="text-xs text-muted mt-1">
              No problem — submit anyway. Your class teacher or school
              admin will verify your details when they review your
              registration.
            </p>
          </div>
        )}

        {verifyResult.kind === 'error' && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400">
              Couldn't check right now
            </p>
            <p className="text-xs text-muted mt-1">
              {verifyResult.message}
            </p>
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" loading={isLoading}>
          {isLoading ? 'Submitting…' : 'Submit Registration'}
        </Button>
      </div>
    </form>
  );
}