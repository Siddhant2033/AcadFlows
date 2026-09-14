import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { formatCurrency, formatTimeAgo } from '../../lib/format';
import { Card, CardTitle, Button } from '../ui';
import { cn } from '../../lib/cn';

interface AdminDashboardProps {
  data: any;
  tenant: any;
  user: any;
}

interface Activity {
  id: string;
  icon: string;
  message: string;
  timestamp: string;
  type: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export default function AdminDashboard({
  data,
  tenant,
  user,
}: AdminDashboardProps) {
  const { isPlatformAdmin } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    fetchRecentActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/communication/notifications?limit=5');
      const items = response.data.data?.items || [];
      setNotifications(
        items.map((item: any) => ({
          id: item._id,
          title: item.title,
          message: item.message,
          type: item.type || 'info',
          read: item.read || false,
          createdAt: item.createdAt,
        })),
      );
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/recent-activity');
      setRecentActivities(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/communication/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/communication/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // ── Stats from API ──
  const stats = [
    {
      label: 'Total Students',
      value: data?.stats?.totalStudents ?? 0,
      icon: '👨‍🎓',
      color: 'blue',
      change: '0%',
    },
    {
      label: 'Total Teachers',
      value: data?.stats?.totalTeachers ?? 0,
      icon: '👨‍🏫',
      color: 'green',
      change: '0%',
    },
    {
      label: 'Attendance Today',
      value: data?.stats?.attendance ?? '0%',
      icon: '📊',
      color: 'purple',
      change: '0%',
    },
    {
      label: 'Revenue This Month',
      value: formatCurrency(data?.stats?.revenue ?? 0),
      icon: '💰',
      color: 'orange',
      change: '0%',
    },
  ];

  const quickActions: any[] = data?.quickActions ?? [];

  const quickStats = data?.quickStats ?? {
    totalRevenue: formatCurrency(0),
    pendingInvoices: 0,
    newMessages: 0,
    leaveRequests: 0,
  };

  const bubbleColors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    orange: 'bg-orange-50 dark:bg-orange-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    teal: 'bg-teal-50 dark:bg-teal-900/20',
  };

  return (
    <div className="space-y-6">
      {/* ─── Founder banner (only for platform admin) ─── */}
      {isPlatformAdmin && (
        <Card className="border-primary-500/30 bg-gradient-to-r from-primary-500/10 to-secondary-500/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-500 text-white text-2xl flex-shrink-0">
                ⚡
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  Founder Account
                </p>
                <p className="text-base font-semibold text-foreground mt-0.5">
                  You have platform-wide access
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Manage all schools, users, and approvals from the platform
                  admin portal.
                </p>
              </div>
            </div>
            <Link to="/platform-admin" className="flex-shrink-0">
              <Button variant="primary" leftIcon="⚡">
                Open Platform Admin
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* ─── Welcome + Notifications ─── */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Welcome back, {user?.firstName || 'Admin'}! 👋
            </h2>
            <p className="mt-1 text-muted">
              Here's what's happening at {tenant?.name || 'your school'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(v => !v)}
                className="relative p-2 rounded-lg text-muted hover:text-foreground hover:bg-elevated transition-colors"
                aria-label="Notifications"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg shadow-lg border border-border bg-surface overflow-hidden z-50">
                  <div className="p-3 border-b border-border flex justify-between items-center">
                    <h3 className="font-semibold text-foreground">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted">
                        No notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => markAsRead(n.id)}
                          className={cn(
                            'w-full text-left p-3 border-b border-border transition-colors hover:bg-elevated',
                            !n.read && 'bg-blue-50 dark:bg-blue-900/10',
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-lg">
                              {n.type === 'success' && '✅'}
                              {n.type === 'warning' && '⚠️'}
                              {n.type === 'error' && '❌'}
                              {n.type === 'info' && 'ℹ️'}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {n.title}
                              </p>
                              <p className="text-xs text-muted">{n.message}</p>
                              <p className="text-xs text-muted mt-1">
                                {formatTimeAgo(n.createdAt)}
                              </p>
                            </div>
                            {!n.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {tenant?.schoolCode && (
              <div className="px-4 py-2 rounded-lg bg-elevated">
                <p className="text-xs text-muted">School Code</p>
                <p className="font-mono font-bold text-sm text-foreground">
                  {tenant.formattedSchoolCode || tenant.schoolCode}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ─── Stats Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
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
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className="text-sm text-muted">{stat.change}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ─── Two Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <Card>
              <CardTitle className="mb-4">Quick Actions</CardTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {quickActions.map((action: any) => (
                  <Link
                    key={action.label}
                    to={action.path}
                    className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-border transition-all hover:border-primary-300 hover:bg-primary-50 dark:hover:border-primary-500/50 dark:hover:bg-primary-900/10"
                  >
                    <span className="text-2xl mb-1">{action.icon}</span>
                    <span className="text-sm font-medium text-center text-foreground">
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardTitle className="mb-4">Recent Activity</CardTitle>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
              ) : recentActivities.length === 0 ? (
                <p className="text-sm text-center py-4 text-muted">
                  No recent activity
                </p>
              ) : (
                recentActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b border-border last:border-0"
                  >
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted">{activity.timestamp}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Calendar */}
          <Card>
            <CardTitle className="mb-4">📅 Schedule</CardTitle>
            <p className="text-sm text-center py-4 text-muted">
              View school timetable and upcoming classes
            </p>
            <Link
              to="/timetable"
              className="block text-center mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              View Timetable →
            </Link>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardTitle className="mb-4">Quick Stats</CardTitle>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Total Revenue</span>
                <span className="font-semibold text-foreground">
                  {quickStats.totalRevenue || formatCurrency(0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Pending Invoices</span>
                <span
                  className={cn(
                    'font-semibold',
                    quickStats.pendingInvoices > 0
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-foreground',
                  )}
                >
                  {quickStats.pendingInvoices || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">New Messages</span>
                <span
                  className={cn(
                    'font-semibold',
                    quickStats.newMessages > 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-foreground',
                  )}
                >
                  {quickStats.newMessages || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Leave Requests</span>
                <span
                  className={cn(
                    'font-semibold',
                    quickStats.leaveRequests > 0
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-foreground',
                  )}
                >
                  {quickStats.leaveRequests || 0}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}