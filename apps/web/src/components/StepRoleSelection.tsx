import React from 'react';
import { cn } from '../lib/cn';

interface StepRoleSelectionProps {
  selectedRole: 'student' | 'teacher' | 'guardian' | 'admin';
  onRoleSelect: (role: 'student' | 'teacher' | 'guardian' | 'admin') => void;
  tenantName: string;
  schoolCode: string;
}

const roles = [
  { id: 'student' as const, icon: '👨‍🎓', title: 'Student', description: 'I am a student at this school' },
  { id: 'teacher' as const, icon: '👨‍🏫', title: 'Teacher', description: 'I am a teacher at this school' },
  { id: 'guardian' as const, icon: '👨‍👩‍👧', title: 'Guardian', description: 'I am a parent/guardian of a student' },
  { id: 'admin' as const, icon: '👨‍💼', title: 'Admin', description: 'I am a school administrator' },
];

export default function StepRoleSelection({
  selectedRole,
  onRoleSelect,
  tenantName,
  schoolCode,
}: StepRoleSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 dark:bg-green-900/20 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-300">
            ✅ Verified: <strong>{tenantName}</strong>
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            School Code: <span className="font-mono">{schoolCode}</span>
          </p>
        </div>
        <h3 className="text-lg font-medium text-foreground">Select Your Role</h3>
        <p className="mt-1 text-sm text-muted">
          Choose how you want to register with this school
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(role => {
          const isActive = selectedRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onRoleSelect(role.id)}
              className={cn(
                'p-4 border-2 rounded-lg text-left transition-all',
                isActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-border hover:border-primary-300 hover:bg-elevated',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{role.icon}</div>
                <div>
                  <h4
                    className={cn(
                      'font-medium',
                      isActive ? 'text-primary-700 dark:text-primary-400' : 'text-foreground',
                    )}
                  >
                    {role.title}
                  </h4>
                  <p className="text-sm text-muted">{role.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted">
        You can change your role later in your profile settings
      </p>
    </div>
  );
}