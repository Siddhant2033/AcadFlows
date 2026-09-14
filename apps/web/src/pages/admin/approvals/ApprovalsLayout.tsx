import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardLayout, PageHeader } from '../../../components/layout';
import { cn } from '../../../lib/cn';

const TABS = [
  { id: 'teachers', label: 'Teachers', icon: '👨‍🏫', path: '/admin/approvals/teachers' },
  { id: 'students', label: 'Students', icon: '👨‍🎓', path: '/admin/approvals/students' },
  { id: 'guardians', label: 'Guardians', icon: '👪', path: '/admin/approvals/guardians' },
];

interface ApprovalsLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

export default function ApprovalsLayout({
  children,
  title,
  description,
}: ApprovalsLayoutProps) {
  return (
    <DashboardLayout>
      <PageHeader
        title={title}
        description={description}
        breadcrumb={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Approvals' },
        ]}
      />

      <div className="mb-6 border-b border-border">
        <nav className="flex overflow-x-auto" aria-label="Approval tabs">
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