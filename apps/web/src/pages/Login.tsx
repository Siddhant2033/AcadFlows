import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { getTenantSlugFromURL } from '../lib/tenant';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantSlug } = useParams();
  const { login, user } = useAuth();
  const { tenant } = useTenant();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirectTo = location.state?.from?.pathname || (tenantSlug ? `/${tenantSlug}/dashboard` : '/dashboard');
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, location, tenantSlug]);

  // Auto-detect tenant from URL
  useEffect(() => {
    if (tenantSlug) {
      // Already have tenant from URL params
    } else {
      const slug = getTenantSlugFromURL();
      if (slug) {
        // Could auto-redirect to tenant-specific login
        // navigate(`/${slug}/login`, { replace: true });
      }
    }
  }, [tenantSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login(email, password);

      // Get redirect path
      const from = location.state?.from?.pathname || (tenantSlug ? `/${tenantSlug}/dashboard` : '/dashboard');
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);

      // Handle specific error messages
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else if (err.response?.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate(tenantSlug ? `/${tenantSlug}/forgot-password` : '/forgot-password');
  };

  const handleRegister = () => {
    navigate(tenantSlug ? `/${tenantSlug}/register` : '/register');
  };

  const displayName = tenantSlug || tenant?.name;

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left: form panel */}
      <div className="w-full lg:w-[46%] flex flex-col px-6 sm:px-12 lg:px-16 py-10">
        {/* Top row: logo + status chip */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-lg">🏫</span>
            </div>
            <span className="font-semibold text-gray-900 tracking-tight">
              School<span className="text-primary-600">Hub</span>
            </span>
          </Link>
          {displayName && (
            <span className="text-xs font-medium text-primary-700 bg-primary-50 border border-primary-100 rounded-full px-3 py-1">
              {displayName}
            </span>
          )}
        </div>

        {/* Form body, vertically centered */}
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to pick up where you left off.
              {!tenantSlug && !tenant?.name && (
                <>
                  {' '}
                  New here?{' '}
                  <button
                    onClick={handleRegister}
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    Create an account
                  </button>
                </>
              )}
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                  <div className="flex">
                    <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="ml-2.5 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="name@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-sm text-gray-600">Remember me for 30 days</span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>

              {!tenantSlug && !tenant?.name && (
                <p className="text-center text-sm text-gray-500 lg:hidden">
                  Don't have an account?{' '}
                  <button type="button" onClick={handleRegister} className="font-medium text-primary-600 hover:text-primary-700">
                    Register here
                  </button>
                </p>
              )}
            </form>

            {/* Demo Credentials (for testing) */}
            {import.meta.env.DEV && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <p className="text-xs text-center text-gray-400 mb-3">Demo credentials</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-lg text-center">
                    <p className="font-medium text-gray-700">Admin</p>
                    <p className="text-gray-500">admin@school.com</p>
                    <p className="text-gray-500">Admin@2024!</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg text-center">
                    <p className="font-medium text-gray-700">Student</p>
                    <p className="text-gray-500">student@school.com</p>
                    <p className="text-gray-500">Student@2024!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: hero panel */}
      <div className="hidden lg:block relative w-[54%]">
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        <div className="relative h-full flex flex-col justify-between p-10">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90 bg-white/10 backdrop-blur rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
              Term 2025-26
            </span>
            <span className="text-xs text-white/70">Attendance · Grades · Fees</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white leading-snug">
              One workspace for every classroom.
            </h2>
            <p className="mt-3 text-sm text-white/80 leading-relaxed">
              Students, teachers, and guardians all check attendance, grades, and
              fee status in one place, tuned to your school.
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 max-w-md">
            <p className="text-sm text-gray-700 leading-relaxed">
              "Switching to one login for my kid's attendance, grades, and fees
              saved me a dozen phone calls a term."
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                MP
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Meera Pillai</p>
                <p className="text-xs text-gray-500">Parent, Class 6</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}