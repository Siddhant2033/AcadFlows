import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SchoolCodeInput } from '../components/SchoolCodeInput';
import api from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';
import { cn } from '../lib/cn';

const inputClass =
  'mt-1.5 block w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors';

const labelClass = 'block text-sm font-medium text-foreground';

const primaryBtnClass =
  'rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

const backBtnClass = 'text-sm font-medium text-muted hover:text-foreground transition-colors';

function StepRoleSelection({ selectedRole, onRoleSelect, tenantName, schoolCode }: any) {
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
      {schoolCode && <p className="mt-1 text-sm text-muted">School code: {schoolCode}</p>}
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
        School administrator registration{tenantName ? ` — ${tenantName}` : ''}
      </h3>
      {schoolCode && <p className="text-sm text-muted">School code: {schoolCode}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {[
        ['firstName', 'First name'],
        ['lastName', 'Last name'],
        ['email', 'Email'],
        ['password', 'Password'],
        ['confirmPassword', 'Confirm password'],
      ].map(([field, label]) => (
        <label key={field} className={labelClass}>
          {label}
          <input
            required
            type={field.toLowerCase().includes('password') ? 'password' : 'text'}
            value={formData[field] || ''}
            onChange={event => onChange(field, event.target.value)}
            className={inputClass}
          />
        </label>
      ))}
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className={backBtnClass}>
          ← Back
        </button>
        <button type="submit" disabled={isLoading} className={primaryBtnClass}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </form>
  );
}

function StepGuardianForm({
  formData,
  onChange,
  onBack,
  onSubmit,
  isLoading,
  error,
  tenantName,
}: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">
        Guardian registration{tenantName ? ` — ${tenantName}` : ''}
      </h3>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {[
        ['firstName', 'First name'],
        ['lastName', 'Last name'],
        ['email', 'Email'],
        ['password', 'Password'],
        ['confirmPassword', 'Confirm password'],
        ['relationship', 'Relationship'],
        ['phone', 'Phone'],
        ['occupation', 'Occupation'],
      ].map(([field, label]) => (
        <label key={field} className={labelClass}>
          {label}
          <input
            required={['firstName', 'lastName', 'email', 'password', 'confirmPassword'].includes(
              field,
            )}
            type={field.toLowerCase().includes('password') ? 'password' : 'text'}
            value={formData[field] || ''}
            onChange={event => onChange(field, event.target.value)}
            className={inputClass}
          />
        </label>
      ))}
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className={backBtnClass}>
          ← Back
        </button>
        <button type="submit" disabled={isLoading} className={primaryBtnClass}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </form>
  );
}

function StepStudentForm({
  formData,
  onChange,
  onBack,
  onSubmit,
  isLoading,
  error,
  tenantName,
}: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">
        Student registration{tenantName ? ` — ${tenantName}` : ''}
      </h3>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {[
        ['firstName', 'First name'],
        ['lastName', 'Last name'],
        ['email', 'Email'],
        ['password', 'Password'],
        ['confirmPassword', 'Confirm password'],
        ['grade', 'Grade'],
        ['section', 'Section'],
        ['dateOfBirth', 'Date of birth'],
        ['parentName', 'Parent name'],
        ['parentPhone', 'Parent phone'],
        ['parentEmail', 'Parent email'],
        ['address', 'Address'],
      ].map(([field, label]) => (
        <label key={field} className={labelClass}>
          {label}
          <input
            required={['firstName', 'lastName', 'email', 'password', 'confirmPassword'].includes(
              field,
            )}
            type={
              field.toLowerCase().includes('password')
                ? 'password'
                : field === 'dateOfBirth'
                  ? 'date'
                  : 'text'
            }
            value={formData[field] || ''}
            onChange={event => onChange(field, event.target.value)}
            className={inputClass}
          />
        </label>
      ))}
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className={backBtnClass}>
          ← Back
        </button>
        <button type="submit" disabled={isLoading} className={primaryBtnClass}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </form>
  );
}

function StepTeacherForm({
  formData,
  onChange,
  onBack,
  onSubmit,
  isLoading,
  error,
  tenantName,
}: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">
        Teacher registration{tenantName ? ` — ${tenantName}` : ''}
      </h3>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {[
        ['firstName', 'First name'],
        ['lastName', 'Last name'],
        ['email', 'Email'],
        ['password', 'Password'],
        ['confirmPassword', 'Confirm password'],
        ['employeeId', 'Employee ID'],
        ['subject', 'Subject'],
        ['qualification', 'Qualification'],
        ['experience', 'Experience'],
        ['joiningDate', 'Joining date'],
      ].map(([field, label]) => (
        <label key={field} className={labelClass}>
          {label}
          <input
            required={['firstName', 'lastName', 'email', 'password', 'confirmPassword'].includes(
              field,
            )}
            type={
              field.toLowerCase().includes('password')
                ? 'password'
                : field === 'joiningDate'
                  ? 'date'
                  : 'text'
            }
            value={formData[field] || ''}
            onChange={event => onChange(field, event.target.value)}
            className={inputClass}
          />
        </label>
      ))}
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className={backBtnClass}>
          ← Back
        </button>
        <button type="submit" disabled={isLoading} className={primaryBtnClass}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </form>
  );
}

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

  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'guardian' | 'admin'>(
    'student',
  );

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    grade: '',
    section: '',
    dateOfBirth: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    employeeId: '',
    subject: '',
    qualification: '',
    experience: '',
    joiningDate: '',
    relationship: '',
    children: [] as { name: string; grade: string; studentId: string }[],
    phone: '',
    occupation: '',
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
        /* user can enter code manually */
      }
    }
    checkTenantFromSlug();
  }, [tenantSlug]);

  const handleSchoolCodeChange = (code: string, tId?: string, tName?: string) => {
    setSchoolCode(code);
    if (tId && tName) {
      setTenantId(tId);
      setTenantName(tName);
      setIsVerified(true);
      setCurrentStep(2);
    }
  };

  const handleRoleSelect = (role: 'student' | 'teacher' | 'guardian' | 'admin') => {
    setSelectedRole(role);
    setCurrentStep(3);
  };

  const handleBackToRole = () => {
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
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: selectedRole,
        tenantId,
        ...(selectedRole === 'student' && {
          grade: formData.grade,
          section: formData.section,
          dateOfBirth: formData.dateOfBirth,
          parentName: formData.parentName,
          parentPhone: formData.parentPhone,
          parentEmail: formData.parentEmail,
          address: formData.address,
        }),
        ...(selectedRole === 'teacher' && {
          employeeId: formData.employeeId,
          subject: formData.subject,
          qualification: formData.qualification,
          experience: formData.experience,
          joiningDate: formData.joiningDate,
        }),
        ...(selectedRole === 'guardian' && {
          relationship: formData.relationship,
          children: formData.children,
          phone: formData.phone,
          occupation: formData.occupation,
        }),
      };

      await register(registrationData);
      navigate(tenantSlug ? `/${tenantSlug}/dashboard` : '/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || 'Registration failed. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <SchoolCodeInput value={schoolCode} onChange={handleSchoolCodeChange} />;
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
        : `Complete your ${selectedRole} registration`;

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
              School<span className="text-primary-600">Hub</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/" className="text-sm text-muted hover:text-foreground transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-foreground">Join your school</h1>
            <p className="mt-2 text-sm text-muted">{stepSubtitle}</p>

            {/* Progress steps */}
            <div className="mt-6 flex items-center gap-2">
              {stepLabels.map((label, idx) => {
                const step = idx + 1;
                const active = currentStep >= step;
                return (
                  <div key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0',
                          active ? 'bg-primary-600 text-white' : 'bg-elevated text-muted',
                        )}
                      >
                        {currentStep > step ? '✓' : step}
                      </div>
                      <span
                        className={cn(
                          'text-xs whitespace-nowrap',
                          active ? 'text-foreground font-medium' : 'text-muted',
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    {step < stepLabels.length && (
                      <div
                        className={cn(
                          'flex-1 h-px mx-3',
                          currentStep > step ? 'bg-primary-600' : 'bg-border',
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
            <span className="text-xs text-white/70">Multi-role · Multi-school</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white leading-snug">
              Built for every seat in the school.
            </h2>
            <p className="mt-3 text-sm text-white/80 leading-relaxed">
              Students, teachers, guardians, and admins each get a setup made for their role,
              from day-one attendance to fee tracking.
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