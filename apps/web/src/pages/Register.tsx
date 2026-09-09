import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SchoolCodeInput } from '../components/SchoolCodeInput';
import { getTenantBySchoolCode } from '../lib/tenant';
import api from '../lib/api';

function StepRoleSelection({ selectedRole, onRoleSelect, tenantName, schoolCode }: any) {
  const roles = [
    ['student', 'Student'],
    ['teacher', 'Teacher'],
    ['guardian', 'Guardian'],
    ['admin', 'School administrator'],
  ] as const;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">
        Select your role{tenantName ? ` - ${tenantName}` : ''}
      </h3>
      {schoolCode && <p className="text-sm text-gray-600">School code: {schoolCode}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map(([role, label]) => (
          <button
            key={role}
            type="button"
            onClick={() => onRoleSelect(role)}
            className={`rounded-md border px-4 py-3 text-left ${
              selectedRole === role
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-primary-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepAdminForm({ formData, onChange, onBack, onSubmit, isLoading, error, tenantName, schoolCode }: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold">School administrator registration{tenantName ? ` - ${tenantName}` : ''}</h3>
      {schoolCode && <p className="text-sm text-gray-600">School code: {schoolCode}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {[
        ['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Email'],
        ['password', 'Password'], ['confirmPassword', 'Confirm password'],
      ].map(([field, label]) => (
        <label key={field} className="block text-sm font-medium text-gray-700">
          {label}
          <input
            required
            type={field.toLowerCase().includes('password') ? 'password' : 'text'}
            value={formData[field] || ''}
            onChange={(event) => onChange(field, event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </label>
      ))}
      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="text-primary-600">Back</button>
        <button type="submit" disabled={isLoading} className="rounded-md bg-primary-600 px-4 py-2 text-white disabled:opacity-50">
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </form>
  );
}

function StepGuardianForm({ formData, onChange, onBack, onSubmit, isLoading, error, tenantName }: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold">Guardian registration{tenantName ? ` - ${tenantName}` : ''}</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {[
        ['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Email'],
        ['password', 'Password'], ['confirmPassword', 'Confirm password'],
        ['relationship', 'Relationship'], ['phone', 'Phone'], ['occupation', 'Occupation'],
      ].map(([field, label]) => (
        <label key={field} className="block text-sm font-medium text-gray-700">
          {label}
          <input
            required={['firstName', 'lastName', 'email', 'password', 'confirmPassword'].includes(field)}
            type={field.toLowerCase().includes('password') ? 'password' : 'text'}
            value={formData[field] || ''}
            onChange={(event) => onChange(field, event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </label>
      ))}
      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="text-primary-600">Back</button>
        <button type="submit" disabled={isLoading} className="rounded-md bg-primary-600 px-4 py-2 text-white disabled:opacity-50">
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </form>
  );
}

function StepStudentForm({ formData, onChange, onBack, onSubmit, isLoading, error, tenantName }: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold">Student registration{tenantName ? ` - ${tenantName}` : ''}</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {[
        ['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Email'],
        ['password', 'Password'], ['confirmPassword', 'Confirm password'],
        ['grade', 'Grade'], ['section', 'Section'], ['dateOfBirth', 'Date of birth'],
        ['parentName', 'Parent name'], ['parentPhone', 'Parent phone'],
        ['parentEmail', 'Parent email'], ['address', 'Address'],
      ].map(([field, label]) => (
        <label key={field} className="block text-sm font-medium text-gray-700">
          {label}
          <input
            required={['firstName', 'lastName', 'email', 'password', 'confirmPassword'].includes(field)}
            type={field.toLowerCase().includes('password') ? 'password' : field === 'dateOfBirth' ? 'date' : 'text'}
            value={formData[field] || ''}
            onChange={(event) => onChange(field, event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </label>
      ))}
      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="text-primary-600">Back</button>
        <button type="submit" disabled={isLoading} className="rounded-md bg-primary-600 px-4 py-2 text-white disabled:opacity-50">
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </form>
  );
}

function StepTeacherForm({ formData, onChange, onBack, onSubmit, isLoading, error, tenantName }: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold">Teacher registration{tenantName ? ` - ${tenantName}` : ''}</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {[
        ['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Email'],
        ['password', 'Password'], ['confirmPassword', 'Confirm password'],
        ['employeeId', 'Employee ID'], ['subject', 'Subject'],
        ['qualification', 'Qualification'], ['experience', 'Experience'],
        ['joiningDate', 'Joining date'],
      ].map(([field, label]) => (
        <label key={field} className="block text-sm font-medium text-gray-700">
          {label}
          <input
            required={['firstName', 'lastName', 'email', 'password', 'confirmPassword'].includes(field)}
            type={field.toLowerCase().includes('password') ? 'password' : field === 'joiningDate' ? 'date' : 'text'}
            value={formData[field] || ''}
            onChange={(event) => onChange(field, event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </label>
      ))}
      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="text-primary-600">Back</button>
        <button type="submit" disabled={isLoading} className="rounded-md bg-primary-600 px-4 py-2 text-white disabled:opacity-50">
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
  
  // Steps: 1 = School Code, 2 = Role Selection, 3 = Registration Form
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: School Code
  const [schoolCode, setSchoolCode] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  
  // Step 2: Role Selection
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'guardian' | 'admin'>('student');
  
  // Step 3: Registration Form Data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Student specific
    grade: '',
    section: '',
    dateOfBirth: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    // Teacher specific
    employeeId: '',
    subject: '',
    qualification: '',
    experience: '',
    joiningDate: '',
    // Guardian specific
    relationship: '',
    children: [] as { name: string; grade: string; studentId: string }[],
    phone: '',
    occupation: '',
    // Admin specific (already have school details from step 1)
  });

  // Auto-detect tenant from URL
  useEffect(() => {
    async function checkTenantFromSlug() {
      if (tenantSlug) {
        try {
          const response = await api.get(`/tenants/public/${tenantSlug}`);
          const tenant = response.data.data;
          setTenantId(tenant.id);
          setTenantName(tenant.name);
          setSchoolCode(tenant.schoolCode);
          setIsVerified(true);
          setCurrentStep(2);
        } catch (err) {
          // Silent fail - user can enter code manually
        }
      }
    }
    checkTenantFromSlug();
  }, [tenantSlug]);

  const handleSchoolCodeChange = (code: string, tenantId?: string, tenantName?: string) => {
    setSchoolCode(code);
    if (tenantId && tenantName) {
      setTenantId(tenantId);
      setTenantName(tenantName);
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password match
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
        tenantId: tenantId,
        // Additional data based on role
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
      setError(err.response?.data?.error || err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render step content
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm">
            ← Back to Home
          </Link>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Join Your School
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {currentStep === 1 && 'Enter your school code to get started'}
            {currentStep === 2 && 'Select your role in the school'}
            {currentStep === 3 && `Complete your ${selectedRole} registration`}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step ? '✓' : step}
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep >= step ? 'text-primary-600 font-medium' : 'text-gray-400'
                }`}>
                  {step === 1 && 'School Code'}
                  {step === 2 && 'Role'}
                  {step === 3 && 'Details'}
                </span>
                {step < 3 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step ? 'bg-primary-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow px-6 py-8">
          {renderStep()}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to={tenantSlug ? `/${tenantSlug}/login` : '/login'} className="font-medium text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}