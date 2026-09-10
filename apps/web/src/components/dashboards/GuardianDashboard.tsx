import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '../ui';

interface GuardianDashboardProps {
  data: any;
  tenant: any;
  user: any;
}

export default function GuardianDashboard({ data, tenant, user }: GuardianDashboardProps) {
  // TODO: replace with real data from `data.children`
  const children = [
    {
      id: '1',
      name: 'Michael Johnson',
      grade: '5th Grade',
      attendance: '95%',
      grades: 'A',
      subjects: [
        { name: 'Mathematics', grade: 'A', score: '94%' },
        { name: 'Science', grade: 'A-', score: '91%' },
        { name: 'English', grade: 'B+', score: '88%' },
      ],
    },
    {
      id: '2',
      name: 'Emma Johnson',
      grade: '3rd Grade',
      attendance: '92%',
      grades: 'B+',
      subjects: [
        { name: 'Mathematics', grade: 'B+', score: '87%' },
        { name: 'Science', grade: 'A-', score: '90%' },
        { name: 'English', grade: 'B', score: '84%' },
      ],
    },
  ];

  const stats = [
    { label: 'Children', value: children.length, icon: '👨‍👩‍👧' },
    { label: 'Average Attendance', value: '94%', icon: '📊' },
    { label: 'Fee Status', value: 'Paid', icon: '💰' },
    { label: 'Upcoming Events', value: '3', icon: '📅' },
  ];

  const gradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400';
    if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.firstName || 'Guardian'}! 👋
        </h2>
        <p className="mt-1 text-muted">
          {children.length} children at {tenant?.name || 'your school'}
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
        <div className="space-y-4">
          {children.map(child => (
            <div
              key={child.id}
              className="border border-border rounded-lg p-4 transition-colors hover:border-primary-300 dark:hover:border-primary-500/50"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="text-lg font-semibold text-foreground">{child.name}</h4>
                  <p className="text-sm text-muted">
                    {child.grade} · Attendance: {child.attendance}
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

              {/* Subject Grades */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {child.subjects.map((subject, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-elevated">
                    <p className="text-xs text-muted">{subject.name}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${gradeColor(subject.grade)}`}>
                        {subject.grade}
                      </span>
                      <span className="text-xs text-muted">{subject.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/fees', icon: '💰', title: 'Fee Status', subtitle: 'View payments' },
          { to: '/attendance', icon: '📊', title: 'Attendance', subtitle: 'View reports' },
          { to: '/calendar', icon: '📅', title: 'Calendar', subtitle: 'School events' },
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