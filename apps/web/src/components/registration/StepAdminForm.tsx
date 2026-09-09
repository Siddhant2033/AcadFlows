import React from 'react';

interface StepAdminFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
  tenantName: string;
  schoolCode: string;
}

export default function StepAdminForm({
  formData,
  onChange,
  onBack,
  onSubmit,
  isLoading,
  error,
  tenantName,
  schoolCode
}: StepAdminFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-4">👨‍💼</div>
        <h3 className="text-lg font-medium text-gray-900">Admin Registration</h3>
        <p className="mt-1 text-sm text-gray-500">
          Completing admin account for <strong>{tenantName}</strong>
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <p className="text-sm text-green-800 font-medium">
          ✅ School already created!
        </p>
        <p className="text-sm text-green-700">
          School: <strong>{tenantName}</strong>
        </p>
        <p className="text-sm text-green-700">
          School Code: <span className="font-mono">{schoolCode}</span>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          You are the first admin of this school. Complete your registration below.
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
          {isLoading ? 'Creating Admin Account...' : 'Create Admin Account'}
        </button>
      </div>
    </form>
  );
}