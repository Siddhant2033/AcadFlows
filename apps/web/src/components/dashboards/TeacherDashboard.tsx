import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Card, CardTitle, Badge } from '../ui';
import { cn } from '../../lib/cn';

interface TeacherDashboardProps {
  data: any;
  tenant: any;
  user: any;
}

interface MyClass {
  name: string;
  section: string;
  time: string;
}

interface PendingTask {
  title: string;
  count: number;
}

export default function TeacherDashboard({ data, tenant, user }: TeacherDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [myClasses, setMyClasses] = useState<MyClass[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    classesToday: 0,
    pendingAssignments: 0,
    attendancePercentage: '0%',
  });

  useEffect(() => {
    fetchTeacherData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);

      // 1. Teacher's classes from the dashboard API
      const classes = data?.myClasses || [];
      setMyClasses(classes);

      // 2. Pending tasks
      const tasks = data?.pendingTasks || [];
      setPendingTasks(tasks);

      // 3. Stats from the dashboard stats endpoint
      const statsRes = await api.get('/dashboard/stats');
      const s = statsRes.data.data || {};

      // 4. Count students in teacher's sections
      // 5. Count classes today from the timetable
      setStats({
        totalStudents: s.totalStudents || 0,
        classesToday: classes.length,
        pendingAssignments:
          tasks.find((t: PendingTask) => t.title.toLowerCase().includes('grade'))?.count || 0,
        attendancePercentage: s.attendance || '0%',
      });
    } catch (error) {
      console.error('Failed to fetch teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const bubbleColors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
  };

  const statCards = [
    {
      label: 'My Students',
      value: stats.totalStudents,
      icon: '👨‍🎓',
      color: 'blue',
    },
    {
      label: 'Classes Today',
      value: stats.classesToday,
      icon: '📚',
      color: 'green',
    },
    {
      label: 'Assignments',
      value: `${stats.pendingAssignments} Pending`,
      icon: '📝',
      color: 'yellow',
    },
    {
      label: 'Attendance',
      value: stats.attendancePercentage,
      icon: '📊',
      color: 'purple',
    },
  ];

  const quickActions = [
    { label: 'Take Attendance', icon: '📋', path: '/attendance/mark' },
    { label: 'Create Assignment', icon: '📝', path: '/assignments/create' },
    { label: 'Grade Submissions', icon: '✅', path: '/assignments' },
    { label: 'View Timetable', icon: '📅', path: '/timetable' },
  ];

  const taskPriority = (count: number): 'high' | 'medium' | 'low' => {
    if (count >= 5) return 'high';
    if (count >= 2) return 'medium';
    return 'low';
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
          {myClasses.length > 0
            ? `You have ${myClasses.length} classes today at ${tenant?.name || 'your school'}`
            : `Welcome to ${tenant?.name || 'your school'}`}
        </p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(stat => (
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
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Classes */}
          <Card>
            <CardTitle className="mb-4">📚 Today's Classes</CardTitle>
            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-center py-4 text-muted">Loading classes...</p>
              ) : myClasses.length === 0 ? (
                <p className="text-sm text-center py-4 text-muted">
                  No classes scheduled for today
                </p>
              ) : (
                myClasses.map((cls, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-elevated"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{cls.name}</p>
                      <p className="text-sm text-muted">
                        {cls.section} · {cls.time}
                      </p>
                    </div>
                    <Link
                      to="/attendance/mark"
                      className="px-3 py-1 text-sm rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 transition-colors"
                    >
                      Take Attendance
                    </Link>
                  </div>
                ))
              )}
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
              {pendingTasks.length === 0 ? (
                <p className="text-sm text-center py-4 text-muted">No pending tasks</p>
              ) : (
                pendingTasks.map((task, index) => {
                  const priority = taskPriority(task.count);
                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg',
                        taskPriorityClasses[priority],
                      )}
                    >
                      <div>
                        <p className="font-medium text-foreground">{task.title}</p>
                        <p className="text-sm text-muted">{task.count} pending</p>
                      </div>
                      <Badge variant={taskBadgeVariant[priority]}>{priority}</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Today's Summary */}
          <Card>
            <CardTitle className="mb-4">📊 Today's Summary</CardTitle>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted">Classes Today</span>
                <span className="font-semibold text-foreground">{myClasses.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Students</span>
                <span className="font-semibold text-foreground">{stats.totalStudents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Pending Grading</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {stats.pendingAssignments}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}