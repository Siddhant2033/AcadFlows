import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SchoolCodeInput } from '../components/SchoolCodeInput';
import { createSchool } from '../lib/tenant';
import api from '../lib/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'teacher' | 'student' | 'guardian';
    schoolCode: string;
    tenantId: string;
    schoolName: string;
    schoolAddress: string;
    schoolPhone: string;
  }>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student',
    schoolCode: '',
    tenantId: '',
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
  });
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);

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
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as 'admin' | 'teacher' | 'student' | 'guardian';
    setFormData(prev => ({
      ...prev,
      role,
      // Reset school-related fields when switching to admin
      ...(role === 'admin' ? {
        schoolCode: '',
        tenantId: '',
        schoolName: '',
      } : {}),
    }));
    setIsVerified(false);
    setError('');
  };

  const handleCreateSchool = async () => {
    if (!formData.schoolName.trim()) {
      setError('School name is required');
      return;
    }

    setIsCreatingSchool(true);
    setError('');

    try {
      const school = await createSchool({
        name: formData.schoolName,
        address: formData.schoolAddress,
        phone: formData.schoolPhone,
        email: formData.email || undefined,
      });

      setFormData(prev => ({
        ...prev,
        tenantId: school.id,
        schoolCode: school.schoolCode,
      }));
      setIsVerified(true);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create school. Please try again.');
    } finally {
      setIsCreatingSchool(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For admin, tenantId should be set after school creation
    if (formData.role === 'admin') {
      if (!isVerified || !formData.tenantId) {
        setError('Please create your school first');
        return;
      }
    } else {
      // For non-admin, verify school code
      if (!isVerified || !formData.tenantId) {
        setError('Please verify your school code first');
        return;
      }
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

  const isAdmin = formData.role === 'admin';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Account          </h2>
          {formData.schoolName && isVerified && !isAdmin && (
            <p className="mt-2 text-center text-sm text-green-600 font-medium">
              Registering for: {formData.schoolName}
            </p>
          )}
          {isAdmin && isVerified && (
            <p className="mt-2 text-center text-sm text-green-600 font-medium">
              Creating school: {formData.schoolName}
            </p>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            {isAdmin ? 'Create your school account' : 'Join your school community'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="rounded-md shadow-sm space-y-4">
            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                I am a
              </label>
              <select
                id="role"
                name="role"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.role}
                onChange={handleRoleChange}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="guardian">Guardian</option>
                <option value="admin">Admin (School Owner)</option>
              </select>
            </div>

            {/* School Code Field - Only for non-admin roles */}
            {!isAdmin && (
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
                />
                <p className="mt-1 text-xs text-gray-500">
                  Don't have a code? Ask your school administrator.
                </p>
              </div>
            )}

            {/* School Creation - For Admin only */}
            {isAdmin && (
              <div className="space-y-3 border-l-4 border-primary-500 pl-4 bg-gray-50 p-4 rounded-md">
                <div className="text-sm font-medium text-gray-700">
                  🏫 Create Your School
                </div>
                
                <div>
                  <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">
                    School Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="schoolName"
                    name="schoolName"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={formData.schoolName}
                    onChange={handleChange}
                    placeholder="e.g., Springfield Elementary School"
                  />
                </div>

                <div>
                  <label htmlFor="schoolAddress" className="block text-sm font-medium text-gray-700">
                    School Address
                  </label>
                  <input
                    id="schoolAddress"
                    name="schoolAddress"
                    type="text"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={formData.schoolAddress}
                    onChange={handleChange}
                    placeholder="e.g., 123 Education St"
                  />
                </div>

                <div>
                  <label htmlFor="schoolPhone" className="block text-sm font-medium text-gray-700">
                    School Phone
                  </label>
                  <input
                    id="schoolPhone"
                    name="schoolPhone"
                    type="text"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={formData.schoolPhone}
                    onChange={handleChange}
                    placeholder="e.g., +1234567890"
                  />
                </div>

                {!isVerified && formData.schoolName && (
                  <button
                    type="button"
                    onClick={handleCreateSchool}
                    disabled={isCreatingSchool || !formData.schoolName.trim()}
                    className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingSchool ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating School...
                      </span>
                    ) : (
                      'Create School'
                    )}
                  </button>
                )}

                {isVerified && formData.schoolName && (
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm text-green-800">
                      ✅ School created successfully!
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      School Code: <span className="font-mono font-bold">{formData.schoolCode}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Share this code with your students and teachers.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.password}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={
                isLoading || 
                (isAdmin ? !isVerified : !isVerified) ||
                (isAdmin && !formData.schoolName)
              }
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-sm text-center">
            <Link to={tenantSlug ? `/${tenantSlug}/login` : '/login'} className="font-medium text-primary-600 hover:text-primary-500">
              Already have an account? Sign in
            </Link>
          </div>
          
          {!isAdmin && (
            <div className="text-center text-xs text-gray-400">
              Need a school code? Contact your school administrator.
            </div>
          )}
          
          {isAdmin && (
            <div className="text-center text-xs text-gray-400">
              You're creating a new school. You'll be the first admin.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}