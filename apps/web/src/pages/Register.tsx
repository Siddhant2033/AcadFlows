import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SchoolCodeInput } from '../components/SchoolCodeInput';
import StepStudentVerify from '../components/StepStudentVerify';
import StepStudentPending from '../components/StepStudentPending';
import api from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';
import { cn } from '../lib/cn';

// ─── Shared input styles ───

const inputClass =
  'mt-1.5 block w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors';

const labelClass = 'block text-sm font-medium text-foreground';

const primaryBtnClass =
  'rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

const backBtnClass =
  'text-sm font-medium text-muted hover:text-foreground transition-colors';

// ─── Step components ───

function StepRoleSelection({
  selectedRole,
  onRoleSelect,
  tenantName,
  schoolCode,
}: any) {
  const roles = [
    ['student', 'Student', '🎓'],
    ['teacher', 'Teacher', '📘'],
    ['guardian', 'Guardian', '👪'],
    ['admin', 'School administrator', '🏫'],
  ] as const;

  return (
    <div>
      <h3 className="text-xl font-semibold text-foreground">
        Select your role{tenantName ? ` at ${tenantName}` : ''}
      </h3>
      {schoolCode && (
        <p className="mt-1 text-sm text-muted">School code: {schoolCode}</p>
      )}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {roles.map(([role, label, icon]) => (
          <button
            key={role}
            type="button"
            onClick={() => onRoleSelect(role)}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors',
              selectedRole === role
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                : 'border-border hover:border-primary-300 hover:bg-elevated',
            )}
          >
            <span className="text-xl">{icon}</span>
            <span className="text-sm font-medium text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

import StepStudentForm from '../components/StepStudentForm';
import StepTeacherForm from '../components/StepTeacherForm';

function StepGuardianForm({
  formData,
  onChange,
  onBack,
  onSubmit,
  isLoading,
  error,
  tenantName,
  tenantId,
}: any) {
  const [rollNo, setRollNo] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifiedStudents, setVerifiedStudents] = useState<any[]>([]);

  useEffect(() => {
    if (formData.children?.length) {
      setVerifiedStudents(formData.children);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async () => {
    if (!rollNo.trim()) {
      setVerifyError('Please enter a roll number');
      return;
    }

    if (
      verifiedStudents.some(s => s.rollNo === rollNo.trim().toUpperCase())
    ) {
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

      const student = response.data.data.student;

      if (student.hasGuardian) {
        setVerifyError('This student already has a registered guardian');
        return;
      }

      const newChild = {
        studentId: student.id,
        name: `${student.firstName} ${student.lastName}`,
        firstName: student.firstName,
        lastName: student.lastName,
        grade: student.grade,
        section: student.section,
        rollNo: student.rollNo,
      };

      setVerifiedStudents(prev => [...prev, newChild]);
      onChange('children', [...(formData.children || []), newChild]);
      setRollNo('');
    } catch (err: any) {
      setVerifyError(
        err.response?.data?.error || 'Failed to verify roll number',
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleRemove = (studentId: string) => {
    setVerifiedStudents(prev =>
      prev.filter(s => s.studentId !== studentId),
    );
    onChange(
      'children',
      (formData.children || []).filter(
        (c: any) => c.studentId !== studentId,
      ),
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <h3 className="text-xl font-semibold text-foreground">
        Guardian registration{tenantName ? ` — ${tenantName}` : ''}
      </h3>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="p-4 rounded-lg border border-border">
        <h4 className="text-sm font-medium text-foreground mb-3">
          Add Your Children (by Roll Number)
        </h4>
        <div className="flex gap-2">
          <input
            value={rollNo}
            onChange={e => setRollNo(e.target.value.toUpperCase())}
            placeholder="Enter student's roll number"
            className={cn(inputClass, 'mt-0 flex-1')}
            disabled={verifying}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleVerify();
              }
            }}
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || !rollNo.trim()}
            className={primaryBtnClass}
          >
            {verifying ? 'Verifying...' : 'Add Child'}
          </button>
        </div>
        {verifyError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {verifyError}
          </p>
        )}

        {verifiedStudents.length > 0 && (
          <div className="mt-3 space-y-2">
            {verifiedStudents.map((student: any) => (
              <div
                key={student.studentId}
                className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-muted">
                    {student.grade}
                    {student.section ? ` - Section ${student.section}` : ''} ·
                    Roll: {student.rollNo}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(student.studentId)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {[
        ['firstName', 'First name', 'text'],
        ['lastName', 'Last name', 'text'],
        ['email', 'Email', 'email'],
        ['phone', 'Phone (10 digits)', 'tel'],
        ['password', 'Password', 'password'],
        ['confirmPassword', 'Confirm password', 'password'],
        ['occupation', 'Occupation', 'text'],
      ].map(([field, label, type]) => (
        <label key={field} className={labelClass}>
          {label}
          {field === 'phone' && formData[field]
            ? ` (${formData[field]})`
            : ''}
          <input
            required={[
              'firstName',
              'lastName',
              'email',
              'password',
              'confirmPassword',
            ].includes(field)}
            type={type}
            value={formData[field] || ''}
            onChange={event =>
              onChange(
                field,
                field === 'phone'
                  ? event.target.value.replace(/\D/g, '').slice(0, 10)
                  : event.target.value,
              )
            }
            className={inputClass}
            maxLength={field === 'phone' ? 10 : undefined}
          />
        </label>
      ))}

      <label className={labelClass}>
        Relationship to Student
        <select
          value={formData.relationship || ''}
          onChange={e => onChange('relationship', e.target.value)}
          className={inputClass}
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
        </select>
      </label>

      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className={backBtnClass}>
          ← Back
        </button>
        <button
          type="submit"
          disabled={isLoading || verifiedStudents.length === 0}
          className={primaryBtnClass}
        >
          {isLoading ? 'Registering...' : 'Complete Registration'}
        </button>
      </div>
    </form>
  );
}

function StepAdminForm({
  formData,
  onChange,
  onBack,
  onSubmit,
  isLoading,
  error,
  tenantName,
  schoolCode,
}: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">
        School administrator registration
        {tenantName ? ` — ${tenantName}` : ''}
      </h3>
      {schoolCode && (
        <p className="text-sm text-muted">School code: {schoolCode}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {[
        ['firstName', 'First name', 'text'],
        ['lastName', 'Last name', 'text'],
        ['email', 'Email', 'email'],
        ['phone', 'Phone (10 digits)', 'tel'],
        ['password', 'Password', 'password'],
        ['confirmPassword', 'Confirm password', 'password'],
      ].map(([field, label, type]) => (
        <label key={field} className={labelClass}>
          {label}
          <input
            required={[
              'firstName',
              'lastName',
              'email',
              'password',
              'confirmPassword',
            ].includes(field)}
            type={type}
            value={formData[field] || ''}
            onChange={event =>
              onChange(
                field,
                field === 'phone'
                  ? event.target.value.replace(/\D/g, '').slice(0, 10)
                  : event.target.value,
              )
            }
            className={inputClass}
            maxLength={field === 'phone' ? 10 : undefined}
          />
        </label>
      ))}

      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className={backBtnClass}>
          ← Back
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={primaryBtnClass}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </form>
  );
}

// ─── Types ───

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

interface PendingSuccess {
  firstName: string;
  email: string;
  grade: string;
  section: string;
  wasVerified: boolean;
}

// ─── Main RegisterPage ───

export default function RegisterPage() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { register } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [schoolCode, setSchoolCode] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const [selectedRole, setSelectedRole] = useState<
    'student' | 'teacher' | 'guardian' | 'admin'
  >('student');

  // Sprint 5: student verification result
  const [studentVerified, setStudentVerified] =
    useState<VerifiedStudent | null>(null);
  // Set when the student skipped verification (record not found)
  const [studentSkippedVerify, setStudentSkippedVerify] = useState(false);

  // Success screen state
  const [pendingSuccess, setPendingSuccess] = useState<PendingSuccess | null>(
    null,
  );

  const [formData, setFormData] = useState<Record<string, any>>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',

    // Student
    grade: '',
    gradeId: '',
    section: '',
    sectionId: '',
    dateOfBirth: '',
    gender: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressPostalCode: '',
    addressCountry: 'India',

    // Teacher
    phone: '',
    employeeId: '',
    subject: '',
    qualification: '',
    experience: '',
    joiningDate: '',

    // Guardian
    relationship: '',
    occupation: '',
    children: [],
  });

  useEffect(() => {
    async function checkTenantFromSlug() {
      if (!tenantSlug) return;
      try {
        const response = await api.get(`/tenants/public/${tenantSlug}`);
        const tenant = response.data.data;
        setTenantId(tenant.id);
        setTenantName(tenant.name);
        setSchoolCode(tenant.schoolCode);
        setIsVerified(true);
        setCurrentStep(2);
      } catch {
        /* fallback */
      }
    }
    checkTenantFromSlug();
  }, [tenantSlug]);

  const handleSchoolCodeChange = (
    code: string,
    tId?: string,
    tName?: string,
  ) => {
    setSchoolCode(code);
    if (tId && tName) {
      setTenantId(tId);
      setTenantName(tName);
      setIsVerified(true);
      setCurrentStep(2);
    }
  };

  const handleRoleSelect = (
    role: 'student' | 'teacher' | 'guardian' | 'admin',
  ) => {
    setSelectedRole(role);
    if (role !== 'student') {
      setStudentVerified(null);
      setStudentSkippedVerify(false);
    }
    setCurrentStep(3);
  };

  const handleBackToRole = () => {
    if (selectedRole === 'student') {
      setStudentVerified(null);
      setStudentSkippedVerify(false);
    }
    setCurrentStep(2);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const registrationData: any = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: selectedRole,
        tenantId,
      };

      if (selectedRole === 'student') {
        registrationData.grade = formData.grade || studentVerified?.grade;
        registrationData.gradeId = formData.gradeId;
        registrationData.section = formData.section || studentVerified?.section;
        registrationData.sectionId =
          formData.sectionId || studentVerified?.sectionId || '';
        registrationData.dateOfBirth = formData.dateOfBirth;
        registrationData.gender = formData.gender;
        registrationData.parentName = formData.parentName;
        registrationData.parentPhone = formData.parentPhone;
        registrationData.parentEmail = formData.parentEmail;
        registrationData.address = {
          street: formData.addressStreet,
          city: formData.addressCity,
          state: formData.addressState,
          postalCode: formData.addressPostalCode,
          country: formData.addressCountry || 'India',
        };

        if (studentVerified) {
          registrationData.verifiedStudentId = studentVerified.id;
          registrationData.verificationData = {
            studentId: studentVerified.id,
          };
        }
      }

      if (selectedRole === 'teacher') {
        registrationData.phone = formData.phone;
        registrationData.dateOfBirth = formData.dateOfBirth;
        registrationData.gender = formData.gender;
        registrationData.subject = formData.subject;
        registrationData.qualification = formData.qualification;
        registrationData.experience = formData.experience;
        registrationData.joiningDate = formData.joiningDate;
        registrationData.address = {
          city: formData.addressCity,
          state: formData.addressState,
          country: 'India',
        };
      }

      if (selectedRole === 'guardian') {
        registrationData.phone = formData.phone;
        registrationData.relationship = formData.relationship;
        registrationData.occupation = formData.occupation;
        registrationData.children = formData.children || [];
      }

      if (selectedRole === 'admin') {
        registrationData.phone = formData.phone;
      }

      await register(registrationData);

      // ── Success: show pending screen for students, dashboard for others ──
      if (selectedRole === 'student') {
        setPendingSuccess({
          firstName: formData.firstName,
          email: formData.email,
          grade: formData.grade || studentVerified?.grade || 'N/A',
          section: formData.section || studentVerified?.section || '',
          wasVerified: !!studentVerified,
        });
        setIsLoading(false);
        return;
      }

      navigate(tenantSlug ? `/${tenantSlug}/dashboard` : '/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Registration failed. Please try again.',
      );
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SchoolCodeInput
            value={schoolCode}
            onChange={handleSchoolCodeChange}
          />
        );
      case 2:
        return (
          <StepRoleSelection
            selectedRole={selectedRole}
            onRoleSelect={handleRoleSelect}
            tenantName={tenantName}
            schoolCode={schoolCode}
          />
        );
      case 3:
        // Sprint 5: students go through optional verification first
        if (selectedRole === 'student' && !studentVerified && !studentSkippedVerify) {
          return (
            <StepStudentVerify
              tenantId={tenantId}
              tenantName={tenantName}
              onVerified={student => {
                setStudentVerified(student);
                setFormData(prev => ({
                  ...prev,
                  firstName: student.firstName,
                  lastName: student.lastName,
                  grade: student.grade,
                  section: student.section,
                  sectionId: student.sectionId || '',
                }));
              }}
              onSkip={({ rollNo, admissionNo }) => {
                setStudentSkippedVerify(true);
                // Pre-fill grade/section fields with whatever the student
                // typed so it's easier to correct later.
                setFormData(prev => ({
                  ...prev,
                  // Leave grade/section blank for the form to fill
                  _providedRollNo: rollNo,
                  _providedAdmissionNo: admissionNo,
                }));
              }}
              onBack={handleBackToRole}
            />
          );
        }

        switch (selectedRole) {
          case 'student':
            return (
              <StepStudentForm
                formData={formData}
                onChange={handleFormChange}
                onBack={handleBackToRole}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
                tenantName={tenantName}
                tenantId={tenantId}
              />
            );
          case 'teacher':
            return (
              <StepTeacherForm
                formData={formData}
                onChange={handleFormChange}
                onBack={handleBackToRole}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
                tenantName={tenantName}
              />
            );
          case 'guardian':
            return (
              <StepGuardianForm
                formData={formData}
                onChange={handleFormChange}
                onBack={handleBackToRole}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
                tenantName={tenantName}
                tenantId={tenantId}
              />
            );
          case 'admin':
            return (
              <StepAdminForm
                formData={formData}
                onChange={handleFormChange}
                onBack={handleBackToRole}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
                tenantName={tenantName}
                schoolCode={schoolCode}
              />
            );
          default:
            return null;
        }
      default:
        return null;
    }
  };

  const stepLabels = ['School code', 'Role', 'Details'];
  const stepSubtitle =
    currentStep === 1
      ? 'Enter your school code to get started'
      : currentStep === 2
        ? 'Select your role in the school'
        : selectedRole === 'student' &&
            !studentVerified &&
            !studentSkippedVerify
          ? 'Verify your identity to continue (optional)'
          : `Complete your ${selectedRole} registration`;

  // ─── Success screen (students) ───
  if (pendingSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 py-12">
        <div className="w-full max-w-lg animate-fade-up">
          <StepStudentPending
            firstName={pendingSuccess.firstName}
            email={pendingSuccess.email}
            grade={pendingSuccess.grade}
            section={pendingSuccess.section}
            tenantName={tenantName}
            wasVerified={pendingSuccess.wasVerified}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Left: form panel */}
      <div className="w-full lg:w-[46%] flex flex-col px-6 sm:px-12 lg:px-16 py-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-lg">🏫</span>
            </div>
            <span className="font-semibold text-foreground tracking-tight">
              Acad<span className="text-primary-600">Flows</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-foreground">
              Join your school
            </h1>
            <p className="mt-2 text-sm text-muted">{stepSubtitle}</p>

            {/* Progress */}
            <div className="mt-6 flex items-center gap-2">
              {stepLabels.map((label, idx) => {
                const step = idx + 1;
                const active = currentStep >= step;
                return (
                  <div
                    key={label}
                    className="flex items-center flex-1 last:flex-none"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0',
                          active
                            ? 'bg-primary-600 text-white'
                            : 'bg-elevated text-muted',
                        )}
                      >
                        {currentStep > step ? '✓' : step}
                      </div>
                      <span
                        className={cn(
                          'text-xs whitespace-nowrap',
                          active
                            ? 'text-foreground font-medium'
                            : 'text-muted',
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    {step < stepLabels.length && (
                      <div
                        className={cn(
                          'flex-1 h-px mx-3',
                          currentStep > step
                            ? 'bg-primary-600'
                            : 'bg-border',
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8">{renderStep()}</div>

            <p className="mt-6 text-center text-sm text-muted">
              Already have an account?{' '}
              <Link
                to={tenantSlug ? `/${tenantSlug}/login` : '/login'}
                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right: hero panel */}
      <div className="hidden lg:block relative w-[54%]">
        <img
          src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1400&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        <div className="relative h-full flex flex-col justify-between p-10">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90 bg-white/10 backdrop-blur rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
              Admissions open
            </span>
            <span className="text-xs text-white/70">
              Multi-role · Multi-school
            </span>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white leading-snug">
              Built for every seat in the school.
            </h2>
            <p className="mt-3 text-sm text-white/80 leading-relaxed">
              Students, teachers, guardians, and admins each get a setup made
              for their role, from day-one attendance to fee tracking.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-2xl font-bold text-white">4</p>
              <p className="text-xs text-white/70 mt-1">Roles supported</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-2xl font-bold text-white">2 min</p>
              <p className="text-xs text-white/70 mt-1">Average setup time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}