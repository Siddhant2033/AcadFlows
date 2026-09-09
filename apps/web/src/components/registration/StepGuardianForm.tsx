import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';

interface StepGuardianFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
  tenantName: string;
  tenantId: string;
}

interface VerifiedStudent {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  rollNo: string;
}

export default function StepGuardianForm({
  formData,
  onChange,
  onBack,
  onSubmit,
  isLoading,
  error,
  tenantName,
  tenantId
}: StepGuardianFormProps) {
  const { theme, mode } = useTheme();
  const [rollNo, setRollNo] = useState('');
  const [verifiedStudents, setVerifiedStudents] = useState<VerifiedStudent[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [studentsList, setStudentsList] = useState<VerifiedStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const getInputClass = () =>
    `mt-1.5 block w-full rounded-lg border px-3.5 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 ${
      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
    }`;

  const getLabelClass = () =>
    `block text-sm font-medium transition-colors duration-200 ${
      theme ? 'text-gray-700' : 'dark:text-[#94A3B8]'
    }`;

  const inputClass = getInputClass();
  const labelClass = getLabelClass();

  // Load existing students for the tenant
  useEffect(() => {
    async function fetchStudents() {
      if (!tenantId) return;
      
      setLoadingStudents(true);
      try {
        const response = await api.get(`/students/tenant/${tenantId}`);
        setStudentsList(response.data.data);
      } catch (error) {
        console.error('Failed to fetch students:', error);
      } finally {
        setLoadingStudents(false);
      }
    }
    fetchStudents();
  }, [tenantId]);

  const handleVerifyRollNo = async () => {
    if (!rollNo.trim()) {
      setVerifyError('Please enter a roll number');
      return;
    }

    // Check if already verified
    if (verifiedStudents.some(s => s.rollNo === rollNo.trim().toUpperCase())) {
      setVerifyError('This student is already added');
      return;
    }

    setVerifying(true);
    setVerifyError('');

    try {
      const response = await api.post('/students/verify-rollno', {
        rollNo: rollNo.trim().toUpperCase(),
        tenantId: tenantId,
      });

      if (response.data.success && response.data.data) {
        const student = response.data.data.student;
        
        // Check if student already has a guardian
        if (student.hasGuardian) {
          setVerifyError('This student already has a registered guardian');
          return;
        }

        // Add to verified students
        setVerifiedStudents(prev => [...prev, student]);
        
        // Update form data
        const currentChildren = formData.children || [];
        onChange('children', [
          ...currentChildren,
          {
            studentId: student.id,
            name: `${student.firstName} ${student.lastName}`,
            grade: student.grade,
            rollNo: student.rollNo,
          }
        ]);

        setRollNo('');
      }
    } catch (err: any) {
      setVerifyError(err.response?.data?.error || 'Failed to verify roll number');
    } finally {
      setVerifying(false);
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    setVerifiedStudents(prev => prev.filter(s => s.id !== studentId));
    const currentChildren = formData.children || [];
    onChange('children', currentChildren.filter((c: any) => c.studentId !== studentId));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-4">👨‍👩‍👧</div>
        <h3 className={`text-xl font-semibold transition-colors duration-200 ${
          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
        }`}>
          Guardian Registration
        </h3>
        <p className={`mt-1 text-sm transition-colors duration-200 ${
          theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
        }`}>
          Registering at <strong>{tenantName}</strong>
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Roll Number Verification Section */}
      <div className={`p-4 rounded-lg border transition-colors duration-200 ${
        verifiedStudents.length > 0 
          ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
          : 'border-gray-200 dark:border-[#334155]'
      }`}>
        <h4 className={`text-sm font-medium mb-3 transition-colors duration-200 ${
          theme ? 'text-gray-700' : 'dark:text-[#F1F5F9]'
        }`}>
          Add Your Children (by Roll Number)
        </h4>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value.toUpperCase())}
              placeholder="Enter student's roll number"
              className={inputClass}
              disabled={verifying}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleVerifyRollNo();
                }
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleVerifyRollNo}
            disabled={verifying || !rollNo.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {verifying ? 'Verifying...' : 'Add Child'}
          </button>
        </div>
        
        {verifyError && (
          <p className="mt-2 text-sm text-red-600">{verifyError}</p>
        )}
        
        <p className="mt-2 text-xs text-gray-500">
          Enter the roll number provided by the school for each of your children
        </p>

        {/* Verified Students List */}
        {verifiedStudents.length > 0 && (
          <div className="mt-3 space-y-2">
            {verifiedStudents.map((student) => (
              <div key={student.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                theme 
                  ? 'bg-white border-gray-200' 
                  : 'dark:bg-[#1E293B] dark:border-[#334155]'
              }`}>
                <div>
                  <p className={`font-medium transition-colors duration-200 ${
                    theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                  }`}>
                    {student.firstName} {student.lastName}
                  </p>
                  <p className={`text-sm transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>
                    {student.grade} {student.section ? `- Section ${student.section}` : ''} · Roll: {student.rollNo}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveStudent(student.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>First Name *</label>
            <input
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => onChange('firstName', e.target.value)}
              required
              className={inputClass}
              placeholder="Enter first name"
            />
          </div>
          <div>
            <label className={labelClass}>Last Name *</label>
            <input
              type="text"
              value={formData.lastName || ''}
              onChange={(e) => onChange('lastName', e.target.value)}
              required
              className={inputClass}
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Email *</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => onChange('email', e.target.value)}
            required
            className={inputClass}
            placeholder="Enter email address"
          />
        </div>

        <div>
          <label className={labelClass}>Phone *</label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => onChange('phone', e.target.value)}
            required
            className={inputClass}
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className={labelClass}>Relationship to Student *</label>
          <select
            value={formData.relationship || ''}
            onChange={(e) => onChange('relationship', e.target.value)}
            required
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
        </div>

        <div>
          <label className={labelClass}>Occupation</label>
          <input
            type="text"
            value={formData.occupation || ''}
            onChange={(e) => onChange('occupation', e.target.value)}
            className={inputClass}
            placeholder="Enter your occupation"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Password *</label>
            <input
              type="password"
              value={formData.password || ''}
              onChange={(e) => onChange('password', e.target.value)}
              required
              className={inputClass}
              placeholder="Create password"
            />
          </div>
          <div>
            <label className={labelClass}>Confirm Password *</label>
            <input
              type="password"
              value={formData.confirmPassword || ''}
              onChange={(e) => onChange('confirmPassword', e.target.value)}
              required
              className={inputClass}
              placeholder="Confirm password"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-[#334155]">
        <button
          type="button"
          onClick={onBack}
          className={`text-sm font-medium transition-colors duration-200 ${
            theme ? 'text-gray-500 hover:text-gray-700' : 'dark:text-[#94A3B8] dark:hover:text-[#F1F5F9]'
          }`}
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isLoading || verifiedStudents.length === 0}
          className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Creating Account...' : 'Complete Registration'}
        </button>
      </div>
    </form>
  );
}