import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle, Badge } from '../ui';
import { cn } from '../../lib/cn';

interface TeacherDashboardProps {
  data: any;
  tenant: any;
  user: any;
}

export default function TeacherDashboard({ data, tenant, user }: TeacherDashboardProps) {
  const stats = [
    { label: 'My Students', value: '32', icon: '👨‍🎓', color: 'blue' },
    { label: 'Classes Today', value: '4', icon: '📚', color: 'green' },
    { label: 'Assignments', value: '8 Pending', icon: '📝', color: 'yellow' },
    { label: 'Attendance', value: '94%', icon: '📊', color: 'purple' },
  ];

  const quickActions = [
    { label: 'Take Attendance', icon: '📋', path: '/attendance' },
    { label: 'Create Assignment', icon: '📝', path: '/assignments/create' },
    { label: 'Grade Submissions', icon: '✅', path: '/grades' },
    { label: 'View Schedule', icon: '📅', path: '/schedule' },
  ];

  const todayClasses = [
    { subject: 'Mathematics', grade: 'Grade 5', time: '9:00 - 9:45', room: '101', students: 28 },
    { subject: 'Science', grade: 'Grade 6', time: '10:00 - 10:45', room: '102', students: 25 },
    { subject: 'English', grade: 'Grade 7', time: '11:00 - 11:45', room: '103', students: 30 },
    { subject: 'Mathematics', grade: 'Grade 8', time: '1:00 - 1:45', room: '104', students: 27 },
  ];

  const pendingTasks = [
    { title: 'Grade Mathematics Quiz', count: 8, priority: 'high' as const },
    { title: 'Prepare Lesson Plans', count: 3, priority: 'medium' as const },
    { title: 'Parent Meetings', count: 2, priority: 'low' as const },
  ];

  const bubbleColors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
  };

  const taskPriorityClasses: Record<string, string> = {
    high: 'bg-red-50 dark:bg-red-900/20',
    medium: 'bg-yellow-50 dark:bg-yellow-900/20',
    low: 'bg-elevated',
  };

  const taskBadgeVariant: Record<string, 'danger' | 'warning' | 'default'> = {
    high: 'danger',
    medium: 'warning',
    low: 'default',
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.firstName || 'Teacher'}! 👋
        </h2>
        <p className="mt-1 text-muted">
          You have {todayClasses.length} classes today at {tenant?.name || 'your school'}
        </p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center text-2xl',
                  bubbleColors[stat.color] || bubbleColors.blue,
                )}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-muted">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Classes */}
          <Card>
            <CardTitle className="mb-4">📚 Today's Classes</CardTitle>
            <div className="space-y-3">
              {todayClasses.map((cls, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-elevated"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {cls.subject} - {cls.grade}
                    </p>
                    <p className="text-sm text-muted">
                      {cls.time} · Room {cls.room} · {cls.students} students
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 text-sm rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 transition-colors"
                  >
                    Take Attendance
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardTitle className="mb-4">Quick Actions</CardTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map(action => (
                <Link
                  key={action.label}
                  to={action.path}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-border transition-all hover:border-primary-300 hover:bg-primary-50 dark:hover:border-primary-500/50 dark:hover:bg-primary-900/10"
                >
                  <span className="text-2xl mb-1">{action.icon}</span>
                  <span className="text-xs font-medium text-center text-foreground">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          <Card>
            <CardTitle className="mb-4">📋 Pending Tasks</CardTitle>
            <div className="space-y-3">
              {pendingTasks.map((task, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg',
                    taskPriorityClasses[task.priority],
                  )}
                >
                  <div>
                    <p className="font-medium text-foreground">{task.title}</p>
                    <p className="text-sm text-muted">{task.count} pending</p>
                  </div>
                  <Badge variant={taskBadgeVariant[task.priority]}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Today's Summary */}
          <Card>
            <CardTitle className="mb-4">📊 Today's Summary</CardTitle>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted">Classes Taught</span>
                <span className="font-semibold text-foreground">2 / 4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Attendance Submitted</span>
                <span className="font-semibold text-green-600 dark:text-green-400">2 / 4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Assignments Graded</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">3 / 8</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}