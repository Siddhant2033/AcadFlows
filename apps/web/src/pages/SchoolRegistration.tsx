import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createSchool } from '../lib/tenant';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

export default function SchoolRegistrationPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState<'school' | 'admin'>('school');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [schoolData, setSchoolData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  });
  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [createdSchool, setCreatedSchool] = useState<{
    id: string;
    name: string;
    schoolCode: string;
    formattedSchoolCode: string;
  } | null>(null);

  const handleSchoolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSchoolData({ ...schoolData, [e.target.name]: e.target.value });
  };

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminData({ ...adminData, [e.target.name]: e.target.value });
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schoolData.name.trim()) {
      setError('School name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const school = await createSchool({
        name: schoolData.name,
        address: schoolData.address,
        phone: schoolData.phone,
        email: schoolData.email || undefined,
      });

      const schoolId = school.id || (school as any)._id;
      const schoolCode = school.schoolCode;

      if (!schoolId) {
        throw new Error('School ID not found in response');
      }

      setCreatedSchool({
        id: schoolId,
        name: school.name,
        schoolCode,
        formattedSchoolCode:
          school.formattedSchoolCode || formatSchoolCode(schoolCode),
      });

      setStep('admin');
      setError('');
    } catch (err: any) {
      console.error('❌ School creation error:', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to create school. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatSchoolCode = (code: string): string => {
    if (!code || code.length !== 10) return code || '';
    return `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 10)}`;
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adminData.password !== adminData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (adminData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!createdSchool) {
      setError('School not created. Please go back and create your school.');
      return;
    }

    if (!createdSchool.id) {
      setError('Invalid school ID. Please go back and create your school.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await register({
        email: adminData.email,
        password: adminData.password,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: 'admin',
        tenantId: createdSchool.id,
      });

      navigate('/dashboard');
    } catch (err: any) {
      console.error('❌ Admin registration error:', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Registration failed. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'mt-1.5 block w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors';
  const labelClass = 'block text-sm font-medium text-foreground';

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Left: form panel */}
      <div className="w-full lg:w-[46%] flex flex-col px-6 sm:px-12 lg:px-16 py-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-lg">🏫</span>
            </div>
            <span className="font-semibold text-foreground tracking-tight">
              Acad<span className="text-primary-500">Flows</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
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
              {step === 'school'
                ? 'Register your school'
                : 'Complete your admin account'}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {step === 'school'
                ? 'Fill in your school details to get started'
                : 'Create your admin account to manage your school'}
            </p>

            {/* Progress steps */}
            <div className="mt-6 flex items-center gap-2">
              <div className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-colors ${
                      step === 'school'
                        ? 'bg-primary-500 text-white'
                        : 'bg-success text-white'
                    }`}
                  >
                    {step === 'school' ? '1' : '✓'}
                  </div>
                  <span
                    className={`text-xs whitespace-nowrap ${
                      step === 'school'
                        ? 'text-foreground font-medium'
                        : 'text-success'
                    }`}
                  >
                    School details
                  </span>
                </div>
                <div
                  className={`flex-1 h-px mx-3 transition-colors ${
                    step === 'admin' ? 'bg-primary-500' : 'bg-border'
                  }`}
                />
              </div>
              <div className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                    step === 'admin'
                      ? 'bg-primary-500 text-white'
                      : 'bg-elevated text-muted'
                  }`}
                >
                  2
                </div>
                <span
                  className={`ml-2 text-xs whitespace-nowrap ${
                    step === 'admin'
                      ? 'text-foreground font-medium'
                      : 'text-muted'
                  }`}
                >
                  Admin account
                </span>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* School Registration Step */}
            {step === 'school' && (
              <form onSubmit={handleCreateSchool} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    School name <span className="text-primary-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className={inputClass}
                    value={schoolData.name}
                    onChange={handleSchoolChange}
                    placeholder="e.g., Springfield Elementary School"
                  />
                </div>

                <div>
                  <label htmlFor="address" className={labelClass}>
                    School address
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    className={inputClass}
                    value={schoolData.address}
                    onChange={handleSchoolChange}
                    placeholder="e.g., 123 Education Street"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className={labelClass}>
                    School phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className={inputClass}
                    value={schoolData.phone}
                    onChange={handleSchoolChange}
                    placeholder="e.g., 9876543210"
                  />
                </div>

                <div>
                  <label htmlFor="email" className={labelClass}>
                    School email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={inputClass}
                    value={schoolData.email}
                    onChange={handleSchoolChange}
                    placeholder="e.g., info@school.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !schoolData.name.trim()}
                  className="w-full flex justify-center rounded-lg bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Creating school...' : 'Create school'}
                </button>
              </form>
            )}

            {/* Admin Registration Step */}
            {step === 'admin' && createdSchool && (
              <>
                <div className="mt-6 rounded-lg border border-success/30 bg-success/10 p-4">
                  <p className="text-sm font-medium text-success">
                    ✅ School created successfully
                  </p>
                  <p className="text-sm mt-1.5 text-foreground">
                    School name: <strong>{createdSchool.name}</strong>
                  </p>
                  <p className="text-sm text-foreground">
                    School code:{' '}
                    <strong className="font-mono text-base">
                      {createdSchool.formattedSchoolCode}
                    </strong>
                  </p>
                  <p className="text-xs mt-2 text-muted">
                    ⚠️ Save this code — students and teachers will need it to
                    join your school.
                  </p>
                </div>

                <form onSubmit={handleRegisterAdmin} className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="firstName" className={labelClass}>
                        First name <span className="text-primary-500">*</span>
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        className={inputClass}
                        value={adminData.firstName}
                        onChange={handleAdminChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className={labelClass}>
                        Last name <span className="text-primary-500">*</span>
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        className={inputClass}
                        value={adminData.lastName}
                        onChange={handleAdminChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="adminEmail" className={labelClass}>
                      Email <span className="text-primary-500">*</span>
                    </label>
                    <input
                      id="adminEmail"
                      name="email"
                      type="email"
                      required
                      className={inputClass}
                      value={adminData.email}
                      onChange={handleAdminChange}
                      placeholder="admin@school.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className={labelClass}>
                      Password <span className="text-primary-500">*</span>
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className={inputClass}
                      value={adminData.password}
                      onChange={handleAdminChange}
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className={labelClass}>
                      Confirm password <span className="text-primary-500">*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      className={inputClass}
                      value={adminData.confirmPassword}
                      onChange={handleAdminChange}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center rounded-lg bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Creating admin account...' : 'Complete registration'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: hero panel */}
      <div className="hidden lg:block relative w-[54%]">
        <img
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1400&q=80"
          alt="School building"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        <div className="relative h-full flex flex-col justify-between p-10">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90 bg-white/10 backdrop-blur rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
              New school setup
            </span>
            <span className="text-xs text-white/70">Takes about 2 minutes</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white leading-snug">
              Your school, live in minutes.
            </h2>
            <p className="mt-3 text-sm text-white/80 leading-relaxed">
              Create your school workspace and get a unique join code your
              staff, students, and guardians can use to sign up under it.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-2xl font-bold text-white">1</p>
              <p className="text-xs text-white/70 mt-1">Join code per school</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-2xl font-bold text-white">∞</p>
              <p className="text-xs text-white/70 mt-1">Students & staff</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}