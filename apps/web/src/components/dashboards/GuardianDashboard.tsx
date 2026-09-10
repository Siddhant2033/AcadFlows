import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '../ui';
import { formatCurrency, formatDate } from '../../lib/format';

interface GuardianDashboardProps {
  data: any;
  tenant: any;
  user: any;
}

export default function GuardianDashboard({ data, tenant, user }: GuardianDashboardProps) {
  const children: any[] = data?.children || [];
  const feeStatus = data?.feeStatus || {
    current: 'N/A',
    nextDue: null,
    amount: 0,
  };

  const stats = [
    { label: 'Children', value: children.length, icon: '👨‍👩‍👧' },
    {
      label: 'Average Attendance',
      value:
        children.length > 0
          ? `${Math.round(
            children.reduce(
              (sum, c) => sum + parseInt(c.attendance?.replace('%', '') || '0', 10),
              0,
            ) / children.length,
          )}%`
          : '0%',
      icon: '📊',
    },
    {
      label: 'Fee Status',
      value: feeStatus.current,
      icon: '💰',
    },
    {
      label: 'Total Due',
      value: formatCurrency(feeStatus.amount || 0),
      icon: '💳',
    },
  ];

  const gradeColor = (grade: string) => {
    if (!grade) return 'text-muted';
    if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400';
    if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.firstName || 'Guardian'}! 👋
        </h2>
        <p className="mt-1 text-muted">
          {children.length > 0
            ? `${children.length} ${children.length === 1 ? 'child' : 'children'} at ${tenant?.name || 'your school'
            }`
            : `Welcome to ${tenant?.name || 'your school'}`}
        </p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{stat.icon}</div>
              <div>
                <p className="text-sm text-muted">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Children */}
      <Card>
        <CardTitle className="mb-4">👨‍👩‍👧 My Children</CardTitle>
        {children.length === 0 ? (
          <p className="text-sm text-center py-6 text-muted">
            No children linked to your account yet. Contact your school administrator.
          </p>
        ) : (
          <div className="space-y-4">
            {children.map((child: any) => (
              <div
                key={child.id}
                className="border border-border rounded-lg p-4 transition-colors hover:border-primary-300 dark:hover:border-primary-500/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">{child.name}</h4>
                    <p className="text-sm text-muted">
                      {child.grade}
                      {child.section ? ` · Section ${child.section}` : ''} · Attendance:{' '}
                      {child.attendance}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted">Overall Grade</p>
                      <p className={`text-lg font-bold ${gradeColor(child.grades)}`}>
                        {child.grades}
                      </p>
                    </div>
                    <Link
                      to={`/students/${child.id}`}
                      className="px-3 py-1 text-sm rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 transition-colors"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>

                {child.subjects && child.subjects.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {child.subjects.map((subject: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-lg bg-elevated">
                        <p className="text-xs text-muted">{subject.name}</p>
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm font-semibold ${gradeColor(subject.grade)}`}
                          >
                            {subject.grade}
                          </span>
                          <span className="text-xs text-muted">{subject.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Fee Status */}
      {feeStatus.amount > 0 && (
        <Card>
          <CardTitle className="mb-4">💰 Fee Status</CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted">Total Due</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(feeStatus.amount)}
              </span>
            </div>
            {feeStatus.nextDue && (
              <div className="flex justify-between">
                <span className="text-sm text-muted">Next Due</span>
                <span className="font-semibold text-foreground">
                  {formatDate(feeStatus.nextDue)}
                </span>
              </div>
            )}
          </div>
          <Link
            to="/fees/invoices"
            className="block text-center mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            View All Invoices →
          </Link>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/fees', icon: '💰', title: 'Fee Status', subtitle: 'View payments' },
          { to: '/attendance', icon: '📊', title: 'Attendance', subtitle: 'View reports' },
          { to: '/announcements', icon: '📢', title: 'Announcements', subtitle: 'School updates' },
          { to: '/fees/invoices', icon: '💰', title: 'Fee Status', subtitle: 'View payments' },
        ].map(action => (
          <Link
            key={action.to}
            to={action.to}
            className="flex items-center gap-3 p-4 rounded-lg bg-surface border border-border transition-all hover:border-primary-300 hover:shadow-md dark:hover:border-primary-500/50"
          >
            <span className="text-2xl">{action.icon}</span>
            <div>
              <p className="font-medium text-foreground">{action.title}</p>
              <p className="text-sm text-muted">{action.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}