import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createSchool } from '../lib/tenant';
import ThemeToggle from '../components/ThemeToggle';

interface CreatedSchool {
  id: string;
  name: string;
  schoolCode: string;
  formattedSchoolCode: string;
}

export default function SchoolRegistrationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [schoolData, setSchoolData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  });
  const [createdSchool, setCreatedSchool] = useState<CreatedSchool | null>(
    null,
  );

  const handleSchoolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSchoolData({ ...schoolData, [e.target.name]: e.target.value });
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
      if (!schoolId) {
        throw new Error('School ID not found in response');
      }

      setCreatedSchool({
        id: schoolId,
        name: school.name,
        schoolCode: school.schoolCode,
        formattedSchoolCode:
          school.formattedSchoolCode || formatSchoolCode(school.schoolCode),
      });
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

  const inputClass =
    'mt-1.5 block w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors';
  const labelClass = 'block text-sm font-medium text-foreground';

  /* ─────────────────────────────────────────────────────────────
     PENDING APPROVAL STATE
     ───────────────────────────────────────────────────────────── */

  if (createdSchool) {
    return (
      <div className="min-h-screen flex bg-background text-foreground">
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
            <ThemeToggle />
          </div>

          <div className="flex-1 flex items-center">
            <div className="w-full max-w-md mx-auto text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-secondary-500/15 flex items-center justify-center mb-6">
                <span className="text-4xl">⏳</span>
              </div>

              <h1 className="text-3xl font-bold text-foreground">
                Waiting for approval
              </h1>

              <p className="mt-3 text-sm text-muted leading-relaxed">
                Your school has been registered and is now awaiting
                review by the platform administrator.
              </p>

              <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  School
                </p>
                <p className="text-base font-bold text-foreground">
                  {createdSchool.name}
                </p>

                <div className="mt-5 pt-5 border-t border-border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                    School Code
                  </p>
                  <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                    <p className="font-mono text-lg font-bold tracking-wider text-primary-700 dark:text-primary-400 text-center">
                      {createdSchool.formattedSchoolCode}
                    </p>
                  </div>
                  <p className="mt-3 text-xs text-muted leading-relaxed">
                    Save this code now. Once your school is approved,
                    you'll need it to register as the school
                    administrator and share it with your teachers,
                    students, and guardians.
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-3 text-left rounded-2xl border border-border bg-elevated p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  What happens next?
                </p>
                <ol className="space-y-2 text-sm text-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span>
                      The platform admin reviews your registration.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <span>
                      You'll receive an email at{' '}
                      <strong>{schoolData.email || 'your email'}</strong>{' '}
                      once it's approved.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <span>
                      Then visit <strong>/register</strong>, enter your
                      school code, and create your admin account.
                    </span>
                  </li>
                </ol>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground hover:bg-elevated transition-colors"
                >
                  Go to Login
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedSchool(null);
                    setSchoolData({
                      name: '',
                      address: '',
                      phone: '',
                      email: '',
                    });
                  }}
                  className="text-xs text-muted hover:text-foreground transition-colors"
                >
                  Register another school
                </button>
              </div>
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
                Registration received
              </span>
              <span className="text-xs text-white/70">
                Approved within 24 hours
              </span>
            </div>

            <div className="max-w-md">
              <h2 className="text-3xl font-bold text-white leading-snug">
                One quick review, then you're live.
              </h2>
              <p className="mt-3 text-sm text-white/80 leading-relaxed">
                We verify every school manually to keep AcadFlows safe
                and trustworthy for teachers, students, and guardians
                alike.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-2xl font-bold text-white">24h</p>
                <p className="text-xs text-white/70 mt-1">
                  Typical review time
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-white/70 mt-1">
                  Manual verification
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     FORM STATE
     ───────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen flex bg-background text-foreground">
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
              Register your school
            </h1>
            <p className="mt-2 text-sm text-muted">
              Fill in your school details. We'll review your registration
              and send you a school code once approved.
            </p>

            {error && (
              <div className="mt-6 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

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
                {isLoading ? 'Creating school...' : 'Register your school'}
              </button>

              <p className="text-xs text-muted text-center">
                Already have a school code?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  Join with a school code
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

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
            <span className="text-xs text-white/70">
              Reviewed within 24 hours
            </span>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white leading-snug">
              Your school, verified and ready.
            </h2>
            <p className="mt-3 text-sm text-white/80 leading-relaxed">
              Every school on AcadFlows is reviewed by a person before
              it goes live. Once you're approved, you'll get a unique
              join code for your staff, students, and guardians.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-2xl font-bold text-white">1</p>
              <p className="text-xs text-white/70 mt-1">
                Join code per school
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-2xl font-bold text-white">∞</p>
              <p className="text-xs text-white/70 mt-1">
                Students & staff
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}