import React from 'react';

interface StepRoleSelectionProps {
  selectedRole: 'student' | 'teacher' | 'guardian' | 'admin';
  onRoleSelect: (role: 'student' | 'teacher' | 'guardian' | 'admin') => void;
  tenantName: string;
  schoolCode: string;
}

const roles = [
  {
    id: 'student',
    icon: '👨‍🎓',
    title: 'Student',
    description: 'I am a student at this school',
    color: 'blue'
  },
  {
    id: 'teacher',
    icon: '👨‍🏫',
    title: 'Teacher',
    description: 'I am a teacher at this school',
    color: 'green'
  },
  {
    id: 'guardian',
    icon: '👨‍👩‍👧',
    title: 'Guardian',
    description: 'I am a parent/guardian of a student',
    color: 'purple'
  },
  {
    id: 'admin',
    icon: '👨‍💼',
    title: 'Admin',
    description: 'I am a school administrator',
    color: 'red'
  }
];

export default function StepRoleSelection({ 
  selectedRole, 
  onRoleSelect, 
  tenantName,
  schoolCode 
}: StepRoleSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
          <p className="text-sm text-green-800">
            ✅ Verified: <strong>{tenantName}</strong>
          </p>
          <p className="text-xs text-green-600">
            School Code: <span className="font-mono">{schoolCode}</span>
          </p>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Select Your Role</h3>
        <p className="mt-1 text-sm text-gray-500">
          Choose how you want to register with this school
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => onRoleSelect(role.id as any)}
            className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
              selectedRole === role.id
                ? `border-${role.color}-500 bg-${role.color}-50`
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start">
              <div className="text-3xl mr-3">{role.icon}</div>
              <div>
                <h4 className={`font-medium ${
                  selectedRole === role.id ? `text-${role.color}-700` : 'text-gray-900'
                }`}>
                  {role.title}
                </h4>
                <p className="text-sm text-gray-500">{role.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="text-center text-xs text-gray-400">
        You can change your role later in your profile settings
      </div>
    </div>
  );
}