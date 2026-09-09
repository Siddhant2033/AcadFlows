import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';

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

export default function AdminDashboard({ data, tenant, user }: AdminDashboardProps) {
  const { theme, mode } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from API
  useEffect(() => {
    fetchNotifications();
    fetchRecentActivities();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/communication/notifications?limit=5');
      const items = response.data.data?.items || [];
      setNotifications(items.map((item: any) => ({
        id: item._id,
        title: item.title,
        message: item.message,
        type: item.type || 'info',
        read: item.read || false,
        createdAt: item.createdAt,
      })));
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
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/communication/notifications/read-all');
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Get real stats from API data
  const stats = [
    { 
      label: 'Total Students', 
      value: data?.stats?.totalStudents || 0, 
      icon: '👨‍🎓', 
      color: 'blue',
      change: '0%',
      trend: 'neutral'
    },
    { 
      label: 'Total Teachers', 
      value: data?.stats?.totalTeachers || 0, 
      icon: '👨‍🏫', 
      color: 'green',
      change: '0%',
      trend: 'neutral'
    },
    { 
      label: 'Attendance Today', 
      value: data?.stats?.attendance || '0%', 
      icon: '📊', 
      color: 'purple',
      change: '0%',
      trend: 'neutral'
    },
    { 
      label: 'Revenue This Month', 
      value: `₹${data?.stats?.revenue || 0}`, 
      icon: '💰', 
      color: 'orange',
      change: '0%',
      trend: 'neutral'
    },
  ];

  const quickActions = data?.quickActions || [
    { label: 'Add Student', icon: '➕', path: '/students/add', color: 'blue' },
    { label: 'Add Teacher', icon: '👨‍🏫', path: '/teachers/add', color: 'green' },
    { label: 'Create Class', icon: '📚', path: '/academic/sections/add', color: 'purple' },
    { label: 'Manage Fees', icon: '💰', path: '/fees/invoices', color: 'orange' },
    { label: 'Generate Reports', icon: '📊', path: '/reports', color: 'red' },
    { label: 'Send Announcement', icon: '📢', path: '/announcements', color: 'teal' },
  ];

  // Get real quick stats from data
  const quickStats = data?.quickStats || {
    totalRevenue: '₹0',
    pendingInvoices: 0,
    newMessages: 0,
    leaveRequests: 0,
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; light: string }> = {
      blue: { 
        bg: 'bg-blue-500', 
        text: 'text-blue-600',
        light: 'bg-blue-50 dark:bg-blue-900/20'
      },
      green: { 
        bg: 'bg-green-500', 
        text: 'text-green-600',
        light: 'bg-green-50 dark:bg-green-900/20'
      },
      purple: { 
        bg: 'bg-purple-500', 
        text: 'text-purple-600',
        light: 'bg-purple-50 dark:bg-purple-900/20'
      },
      orange: { 
        bg: 'bg-orange-500', 
        text: 'text-orange-600',
        light: 'bg-orange-50 dark:bg-orange-900/20'
      },
      red: { 
        bg: 'bg-red-500', 
        text: 'text-red-600',
        light: 'bg-red-50 dark:bg-red-900/20'
      },
      teal: { 
        bg: 'bg-teal-500', 
        text: 'text-teal-600',
        light: 'bg-teal-50 dark:bg-teal-900/20'
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section with Notifications */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h2 className={`text-2xl font-bold transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Welcome back, {user?.firstName || 'Admin'}! 👋
            </h2>
            <p className={`mt-1 transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              Here's what's happening at {tenant?.name || 'your school'}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg transition-colors duration-200 ${
                  theme 
                    ? 'hover:bg-gray-100 text-gray-600' 
                    : 'dark:hover:bg-[#1E293B] dark:text-[#94A3B8]'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-lg shadow-lg border overflow-hidden z-50 transition-colors duration-200 ${
                  theme 
                    ? 'bg-white border-gray-200' 
                    : 'dark:bg-[#1E293B] dark:border-[#334155]'
                }`}>
                  <div className={`p-3 border-b flex justify-between items-center ${
                    theme ? 'border-gray-200' : 'dark:border-[#334155]'
                  }`}>
                    <h3 className={`font-semibold transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className={`text-xs transition-colors duration-200 ${
                          theme ? 'text-primary-600 hover:text-primary-700' : 'dark:text-primary-400 dark:hover:text-primary-300'
                        }`}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className={`p-4 text-center text-sm ${
                        theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                      }`}>
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`p-3 border-b cursor-pointer transition-colors duration-200 ${
                            !notification.read 
                              ? theme ? 'bg-blue-50' : 'dark:bg-blue-900/10'
                              : ''
                          } ${
                            theme ? 'border-gray-100 hover:bg-gray-50' : 'dark:border-[#334155] dark:hover:bg-[#1E293B]/50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`text-lg ${
                              notification.type === 'success' ? 'text-green-500' :
                              notification.type === 'warning' ? 'text-yellow-500' :
                              notification.type === 'error' ? 'text-red-500' :
                              'text-blue-500'
                            }`}>
                              {notification.type === 'success' ? '✅' :
                               notification.type === 'warning' ? '⚠️' :
                               notification.type === 'error' ? '❌' :
                               'ℹ️'}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium transition-colors duration-200 ${
                                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                              }`}>
                                {notification.title}
                              </p>
                              <p className={`text-xs transition-colors duration-200 ${
                                theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                              }`}>
                                {notification.message}
                              </p>
                              <p className={`text-xs mt-1 transition-colors duration-200 ${
                                theme ? 'text-gray-400' : 'dark:text-[#64748B]'
                              }`}>
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {tenant?.schoolCode && (
              <div className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                theme ? 'bg-gray-100' : 'dark:bg-[#1E293B]'
              }`}>
                <p className={`text-xs transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  School Code
                </p>
                <p className={`font-mono font-bold text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                }`}>
                  {tenant.formattedSchoolCode || tenant.schoolCode}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const colors = getColorClasses(stat.color);
          return (
            <div key={stat.label} className={`rounded-lg shadow p-6 transition-colors duration-200 ${
              theme ? 'bg-white' : 'dark:bg-[#1E293B]'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg ${colors.light} flex items-center justify-center text-2xl`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      {stat.label}
                    </p>
                    <p className={`text-2xl font-bold transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
                <div className={`text-sm text-gray-400`}>
                  {stat.change}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Activity & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickActions.map((action: any) => {
                const colors = getColorClasses(action.color);
                return (
                  <Link
                    key={action.label}
                    to={action.path}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
                      theme 
                        ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50' 
                        : 'dark:border-[#334155] dark:hover:border-primary-500/50 dark:hover:bg-primary-900/10'
                    }`}
                  >
                    <span className="text-2xl mb-1">{action.icon}</span>
                    <span className={`text-sm font-medium text-center transition-colors duration-200 ${
                      theme ? 'text-gray-700' : 'dark:text-[#CBD5E1]'
                    }`}>
                      {action.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Recent Activity
            </h3>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : recentActivities.length === 0 ? (
                <p className={`text-sm text-center py-4 transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  No recent activity
                </p>
              ) : (
                recentActivities.map((activity: Activity) => (
                  <div key={activity.id} className={`flex items-start space-x-3 pb-3 border-b last:border-0 ${
                    theme ? 'border-gray-100' : 'dark:border-[#334155]'
                  }`}>
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <p className={`text-sm transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>
                        {activity.message}
                      </p>
                      <p className={`text-xs transition-colors duration-200 ${
                        theme ? 'text-gray-400' : 'dark:text-[#64748B]'
                      }`}>
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Calendar & Quick Stats */}
        <div className="space-y-6">
          {/* Calendar */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              📅 Calendar
            </h3>
            
            <p className={`text-sm text-center py-4 transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              No events scheduled
            </p>

            <Link
              to="/calendar"
              className={`block text-center mt-4 text-sm font-medium transition-colors duration-200 ${
                theme ? 'text-primary-600 hover:text-primary-700' : 'dark:text-primary-400 dark:hover:text-primary-300'
              }`}
            >
              View Full Calendar →
            </Link>
          </div>

          {/* Quick Stats */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-600' : 'dark:text-[#94A3B8]'
                }`}>
                  Total Revenue
                </span>
                <span className={`font-semibold transition-colors duration-200 ${
                  theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                }`}>
                  {quickStats.totalRevenue || '₹0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-600' : 'dark:text-[#94A3B8]'
                }`}>
                  Pending Invoices
                </span>
                <span className={`font-semibold ${
                  quickStats.pendingInvoices > 0 
                    ? 'text-yellow-600 dark:text-yellow-400' 
                    : theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                }`}>
                  {quickStats.pendingInvoices || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-600' : 'dark:text-[#94A3B8]'
                }`}>
                  New Messages
                </span>
                <span className={`font-semibold ${
                  quickStats.newMessages > 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                }`}>
                  {quickStats.newMessages || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-600' : 'dark:text-[#94A3B8]'
                }`}>
                  Leave Requests
                </span>
                <span className={`font-semibold ${
                  quickStats.leaveRequests > 0 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                }`}>
                  {quickStats.leaveRequests || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}