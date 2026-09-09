import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SchoolCodeInput } from '../components/SchoolCodeInput';
import api from '../lib/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { register } = useAuth();
  
  const [step, setStep] = useState<'school' | 'user'>('school');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as const,
    schoolCode: '',
    tenantId: '',
    schoolName: '',
  });
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if we already have a tenant from URL
  useEffect(() => {
    async function checkTenantFromSlug() {
      if (tenantSlug) {
        try {
          const response = await api.get(`/tenants/public/${tenantSlug}`);
          const tenant = response.data.data;
          setFormData(prev => ({
            ...prev,
            tenantId: tenant.id,
            schoolName: tenant.name,
            schoolCode: tenant.schoolCode,
          }));
          setIsVerified(true);
          setStep('user');
        } catch (err) {
          // Silent fail - user can enter code manually
        }
      }
    }
    checkTenantFromSlug();
  }, [tenantSlug]);

  const handleSchoolCodeChange = (code: string, tenantId?: string, tenantName?: string) => {
    setFormData(prev => ({
      ...prev,
      schoolCode: code,
      tenantId: tenantId || '',
      schoolName: tenantName || '',
    }));
    setIsVerified(!!tenantId);
    if (tenantId) {
      setError('');
      setStep('user'); // Move to user details step
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isVerified || !formData.tenantId) {
      setError('Please verify your school code first');
      return;
    }

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
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        tenantId: formData.tenantId,
      });
      
      navigate(tenantSlug ? `/${tenantSlug}/dashboard` : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm">
            ← Back to Home
          </Link>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Join Your School
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'school' ? 'Enter your school code to get started' : 'Create your account'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow px-6 py-8">
          {/* Progress Indicator */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'school' ? 'bg-primary-600 text-white' : 'bg-green-500 text-white'
              }`}>
                {step === 'school' ? '1' : '✓'}
              </div>
              <span className={`ml-2 text-sm ${step === 'school' ? 'text-primary-600 font-medium' : 'text-green-600'}`}>
                School Code
              </span>
            </div>
            <div className="flex-1 h-0.5 mx-4 bg-gray-200">
              <div className={`h-0.5 bg-primary-600 transition-all duration-300 ${
                step === 'user' ? 'w-full' : 'w-1/2'
              }`}></div>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step === 'user' ? '2' : '2'}
              </div>
              <span className={`ml-2 text-sm ${step === 'user' ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                User Details
              </span>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* School Code Step */}
          {step === 'school' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Code <span className="text-red-500">*</span>
                </label>
                <SchoolCodeInput
                  value={formData.schoolCode}
                  onChange={handleSchoolCodeChange}
                  disabled={!!tenantSlug}
                  required
                  placeholder="Enter 10-digit school code (e.g., AB12CD34EF)"
                  autoVerify={true}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Don't have a code? Ask your school administrator.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Or, if you're an admin, <Link to="/school/register" className="text-primary-600 hover:text-primary-700">register your school</Link>
                </p>
              </div>
            </div>
          )}

          {/* User Details Step */}
          {step === 'user' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formData.schoolName && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-800">
                    ✅ Joining: <strong>{formData.schoolName}</strong>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  I am a <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}