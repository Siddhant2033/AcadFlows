import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

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
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Student Registered',
      message: 'Michael Johnson has been registered as a student',
      type: 'success',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: '2',
      title: 'Fee Payment Received',
      message: 'Fee payment of $500 received from Sarah Wilson',
      type: 'info',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: '3',
      title: 'Teacher Leave Request',
      message: 'Robert Anderson has requested leave for tomorrow',
      type: 'warning',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: '4',
      title: 'System Update',
      message: 'New features available in the dashboard',
      type: 'info',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  // Stats from API or fallback
  const stats = [
    { 
      label: 'Total Students', 
      value: data?.stats?.totalStudents || 0, 
      icon: '👨‍🎓', 
      color: 'blue',
      change: '+12%',
      trend: 'up'
    },
    { 
      label: 'Total Teachers', 
      value: data?.stats?.totalTeachers || 0, 
      icon: '👨‍🏫', 
      color: 'green',
      change: '+5%',
      trend: 'up'
    },
    { 
      label: 'Attendance Today', 
      value: data?.stats?.attendance || '0%', 
      icon: '📊', 
      color: 'purple',
      change: '-2%',
      trend: 'down'
    },
    { 
      label: 'Revenue This Month', 
      value: '$12,450', 
      icon: '💰', 
      color: 'orange',
      change: '+18%',
      trend: 'up'
    },
  ];

  const quickActions = data?.quickActions || [
    { label: 'Add Student', icon: '➕', path: '/students/add', color: 'blue' },
    { label: 'Add Teacher', icon: '👨‍🏫', path: '/teachers/add', color: 'green' },
    { label: 'Create Class', icon: '📚', path: '/classes/add', color: 'purple' },
    { label: 'Manage Fees', icon: '💰', path: '/fees', color: 'orange' },
    { label: 'Generate Reports', icon: '📊', path: '/reports', color: 'red' },
    { label: 'Send Announcement', icon: '📢', path: '/announcements', color: 'teal' },
  ];

  const recentActivities = data?.recentActivity || [
    {
      id: '1',
      icon: '👨‍🎓',
      message: 'Michael Johnson registered as a student',
      timestamp: '2 hours ago',
      type: 'student_registration'
    },
    {
      id: '2',
      icon: '💰',
      message: 'Fee payment received from Sarah Wilson',
      timestamp: '4 hours ago',
      type: 'fee_payment'
    },
    {
      id: '3',
      icon: '📝',
      message: 'New assignment created: Mathematics Quiz',
      timestamp: '6 hours ago',
      type: 'assignment'
    },
    {
      id: '4',
      icon: '👨‍🏫',
      message: 'Robert Anderson joined as a teacher',
      timestamp: '1 day ago',
      type: 'teacher_registration'
    },
  ];

  // Calendar events for the week
  const calendarEvents = [
    { date: '2024-06-10', title: 'Staff Meeting', time: '10:00 AM', type: 'meeting' },
    { date: '2024-06-11', title: 'Parent-Teacher Conference', time: '2:00 PM', type: 'event' },
    { date: '2024-06-12', title: 'Science Fair', time: '9:00 AM', type: 'event' },
    { date: '2024-06-13', title: 'Board Meeting', time: '3:00 PM', type: 'meeting' },
    { date: '2024-06-14', title: 'Sports Day', time: '8:00 AM', type: 'event' },
  ];

  // Get today's events
  const today = new Date().toISOString().split('T')[0];
  const todayEvents = calendarEvents.filter(e => e.date === today);
  const upcomingEvents = calendarEvents.filter(e => e.date > today).slice(0, 3);

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
                <div className={`text-sm ${
                  stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
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
              {recentActivities.map((activity: Activity) => (
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
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Calendar */}
        <div className="space-y-6">
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              📅 Calendar
            </h3>
            
            {/* Today's Events */}
            {todayEvents.length > 0 && (
              <div className="mb-4">
                <h4 className={`text-sm font-medium mb-2 transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#CBD5E1]'
                }`}>
                  Today
                </h4>
                {todayEvents.map((event, index) => (
                  <div key={index} className={`p-3 rounded-lg mb-2 transition-colors duration-200 ${
                    theme ? 'bg-blue-50' : 'dark:bg-blue-900/20'
                  }`}>
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      theme ? 'text-blue-800' : 'dark:text-blue-300'
                    }`}>
                      {event.title}
                    </p>
                    <p className={`text-xs transition-colors duration-200 ${
                      theme ? 'text-blue-600' : 'dark:text-blue-400'
                    }`}>
                      {event.time}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming Events */}
            <div>
              <h4 className={`text-sm font-medium mb-2 transition-colors duration-200 ${
                theme ? 'text-gray-700' : 'dark:text-[#CBD5E1]'
              }`}>
                Upcoming
              </h4>
              {upcomingEvents.map((event, index) => (
                <div key={index} className={`flex items-center justify-between py-2 border-b last:border-0 ${
                  theme ? 'border-gray-100' : 'dark:border-[#334155]'
                }`}>
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {event.title}
                    </p>
                    <p className={`text-xs transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      {new Date(event.date).toLocaleDateString()} · {event.time}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    event.type === 'meeting' 
                      ? theme ? 'bg-purple-100 text-purple-600' : 'dark:bg-purple-900/30 dark:text-purple-400'
                      : theme ? 'bg-green-100 text-green-600' : 'dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {event.type}
                  </span>
                </div>
              ))}
              {upcomingEvents.length === 0 && todayEvents.length === 0 && (
                <p className={`text-sm text-center py-4 transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  No events scheduled
                </p>
              )}
            </div>

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
                  $45,230
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-600' : 'dark:text-[#94A3B8]'
                }`}>
                  Pending Invoices
                </span>
                <span className={`font-semibold text-yellow-600 dark:text-yellow-400`}>
                  12
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-600' : 'dark:text-[#94A3B8]'
                }`}>
                  New Messages
                </span>
                <span className={`font-semibold text-blue-600 dark:text-blue-400`}>
                  5
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-600' : 'dark:text-[#94A3B8]'
                }`}>
                  Leave Requests
                </span>
                <span className={`font-semibold text-orange-600 dark:text-orange-400`}>
                  3
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}