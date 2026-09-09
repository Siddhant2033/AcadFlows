import React from 'react';

interface StepTeacherFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
  tenantName: string;
}

export default function StepTeacherForm({
  formData,
  onChange,
  onBack,
  onSubmit,
  isLoading,
  error,
  tenantName
}: StepTeacherFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-4">👨‍🏫</div>
        <h3 className="text-lg font-medium text-gray-900">Teacher Registration</h3>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Employee ID *</label>
            <input
              type="text"
              value={formData.employeeId}
              onChange={(e) => onChange('employeeId', e.target.value)}
              required
              placeholder="e.g., T-2024-001"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => onChange('subject', e.target.value)}
              required
              placeholder="e.g., Mathematics"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Qualification *</label>
          <input
            type="text"
            value={formData.qualification}
            onChange={(e) => onChange('qualification', e.target.value)}
            required
            placeholder="e.g., M.Sc. Mathematics"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
            <input
              type="number"
              value={formData.experience}
              onChange={(e) => onChange('experience', e.target.value)}
              min="0"
              placeholder="e.g., 5"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Joining Date</label>
            <input
              type="date"
              value={formData.joiningDate}
              onChange={(e) => onChange('joiningDate', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
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
          disabled={isLoading}
          className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
    </form>
  );
}