import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createSchool } from '../lib/tenant';
import { useAuth } from '../contexts/AuthContext';

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
    setSchoolData({
      ...schoolData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminData({
      ...adminData,
      [e.target.name]: e.target.value,
    });
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

      console.log('✅ School created:', school);
      
      // IMPORTANT: The school object might have _id or id, handle both
      const schoolId = school.id || school._id;
      const schoolCode = school.schoolCode || school.schoolCode;
      
      console.log('📌 School ID:', schoolId);
      console.log('📌 School Code:', schoolCode);
      
      if (!schoolId) {
        throw new Error('School ID not found in response');
      }
      
      setCreatedSchool({
        id: schoolId, // Use the correct ID field
        name: school.name,
        schoolCode: schoolCode,
        formattedSchoolCode: school.formattedSchoolCode || formatSchoolCode(schoolCode),
      });
      
      setStep('admin');
      setError('');
    } catch (err: any) {
      console.error('❌ School creation error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create school. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format school code
  const formatSchoolCode = (code: string): string => {
    if (!code || code.length !== 10) return code || '';
    return `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 10)}`;
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Registering admin with data:', {
      adminData,
      createdSchool
    });
    
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
      console.error('❌ No school ID found:', createdSchool);
      setError('Invalid school ID. Please go back and create your school.');
      return;
    }

    console.log('✅ Using school ID:', createdSchool.id);

    setIsLoading(true);
    setError('');

    try {
      const registrationData = {
        email: adminData.email,
        password: adminData.password,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: 'admin' as const,
        tenantId: createdSchool.id, // This is critical!
      };
      
      console.log('📤 Sending registration data:', registrationData);
      
      await register(registrationData);
      
      console.log('✅ Admin registered successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('❌ Admin registration error:', err);
      setError(err.response?.data?.error || err.message || 'Registration failed. Please try again.');
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
            {step === 'school' ? 'Register Your School' : 'Complete Your Admin Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'school' 
              ? 'Fill in your school details to get started' 
              : 'Create your admin account to manage your school'}
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
                School Details
              </span>
            </div>
            <div className="flex-1 h-0.5 mx-4 bg-gray-200">
              <div className={`h-0.5 bg-primary-600 transition-all duration-300 ${
                step === 'admin' ? 'w-full' : 'w-1/2'
              }`}></div>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'admin' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step === 'admin' ? '2' : '2'}
              </div>
              <span className={`ml-2 text-sm ${step === 'admin' ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                Admin Account
              </span>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* School Registration Step */}
          {step === 'school' && (
            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  School Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={schoolData.name}
                  onChange={handleSchoolChange}
                  placeholder="e.g., Springfield Elementary School"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  School Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={schoolData.address}
                  onChange={handleSchoolChange}
                  placeholder="e.g., 123 Education Street"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  School Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={schoolData.phone}
                  onChange={handleSchoolChange}
                  placeholder="e.g., +1-555-123-4567"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  School Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={schoolData.email}
                  onChange={handleSchoolChange}
                  placeholder="e.g., info@school.com"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !schoolData.name.trim()}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating School...' : 'Create School'}
              </button>
            </form>
          )}

          {/* Admin Registration Step */}
          {step === 'admin' && createdSchool && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <p className="text-sm text-green-800 font-medium">
                  ✅ School created successfully!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  School Name: <strong>{createdSchool.name}</strong>
                </p>
                <p className="text-sm text-green-700">
                  School ID: <strong className="font-mono text-xs">{createdSchool.id}</strong>
                </p>
                <p className="text-sm text-green-700">
                  School Code: <strong className="font-mono text-base">{createdSchool.formattedSchoolCode}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  ⚠️ Save this code! Students and teachers will need it to join your school.
                </p>
              </div>

              <form onSubmit={handleRegisterAdmin} className="space-y-4">
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
                      value={adminData.firstName}
                      onChange={handleAdminChange}
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
                      value={adminData.lastName}
                      onChange={handleAdminChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="adminEmail"
                    name="email"
                    type="email"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={adminData.email}
                    onChange={handleAdminChange}
                    placeholder="admin@school.com"
                  />
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
                    value={adminData.password}
                    onChange={handleAdminChange}
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
                    value={adminData.confirmPassword}
                    onChange={handleAdminChange}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Admin Account...' : 'Complete Registration'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}