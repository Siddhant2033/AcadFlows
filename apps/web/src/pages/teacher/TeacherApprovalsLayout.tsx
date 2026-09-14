import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardLayout, PageHeader } from '../../components/layout';
import { cn } from '../../lib/cn';

const TABS = [
  {
    id: 'students',
    label: 'Pending Students',
    icon: '👨‍🎓',
    path: '/teacher/approvals/students',
  },
  {
    id: 'guardians',
    label: 'Pending Guardians',
    icon: '👪',
    path: '/teacher/approvals/guardians',
  },
  {
    id: 'roster',
    label: 'Class Roster',
    icon: '📋',
    path: '/teacher/approvals/roster',
  },
];

interface TeacherApprovalsLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

export default function TeacherApprovalsLayout({
  children,
  title,
  description,
}: TeacherApprovalsLayoutProps) {
  return (
    <DashboardLayout>
      <PageHeader
        title={title}
        description={description}
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'My Class' },
        ]}
      />

      <div className="mb-6 border-b border-border">
        <nav className="flex overflow-x-auto" aria-label="Teacher approvals tabs">
          {TABS.map(tab => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                cn(
                  'px-6 py-4 text-sm font-medium whitespace-nowrap',
                  'border-b-2 transition-colors duration-200',
                  'flex items-center gap-2',
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-muted hover:text-foreground hover:border-border',
                )
              }
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {children}
    </DashboardLayout>
  );
}