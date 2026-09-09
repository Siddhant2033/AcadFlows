import React, { useState, useEffect } from 'react';
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

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
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
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      setLoadingStudents(true);
      try {
        const response = await api.get(`/students/tenant/${tenantId}`);
        setStudents(response.data.data);
      } catch (error) {
        console.error('Failed to fetch students:', error);
      } finally {
        setLoadingStudents(false);
      }
    }
    fetchStudents();
  }, [tenantId]);

  const handleChildToggle = (student: Student) => {
    const currentChildren = formData.children || [];
    const exists = currentChildren.find((c: any) => c.studentId === student._id);
    
    if (exists) {
      onChange('children', currentChildren.filter((c: any) => c.studentId !== student._id));
    } else {
      onChange('children', [
        ...currentChildren,
        {
          studentId: student._id,
          name: `${student.firstName} ${student.lastName}`,
          grade: student.grade
        }
      ]);
    }
  };

  const isChildSelected = (studentId: string) => {
    return (formData.children || []).some((c: any) => c.studentId === studentId);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-4">👨‍👩‍👧</div>
        <h3 className="text-lg font-medium text-gray-900">Guardian Registration</h3>
        <p className="mt-1 text-sm text-gray-500">
          Registering at <strong>{tenantName}</strong>
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            required
            placeholder="e.g., +1-555-123-4567"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Relationship to Student *</label>
          <select
            value={formData.relationship}
            onChange={(e) => onChange('relationship', e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select relationship</option>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="guardian">Guardian</option>
            <option value="grandfather">Grandfather</option>
            <option value="grandmother">Grandmother</option>
            <option value="uncle">Uncle</option>
            <option value="aunt">Aunt</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Occupation</label>
          <input
            type="text"
            value={formData.occupation}
            onChange={(e) => onChange('occupation', e.target.value)}
            placeholder="e.g., Software Engineer"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Children Selection */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            My Children (select all that apply) *
          </label>
          {loadingStudents ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-700">
                No students found in this school. Please contact the school administrator.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <label
                  key={student._id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChildSelected(student._id)}
                    onChange={() => handleChildToggle(student)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    {student.firstName} {student.lastName} - {student.grade}
                    {student.section && ` (Section ${student.section})`}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => onChange('password', e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => onChange('confirmPassword', e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isLoading || (formData.children || []).length === 0}
          className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
    </form>
  );
}