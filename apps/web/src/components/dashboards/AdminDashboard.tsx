import React from 'react';
import { Link } from 'react-router-dom';

interface AdminDashboardProps {
  data: any;
  tenant: any;
  user: any;
}

export default function AdminDashboard({ data, tenant, user }: AdminDashboardProps) {
  // Use data from API or fallback to defaults
  const stats = [
    { label: 'Total Students', value: data?.stats?.totalStudents || 0, icon: '👨‍🎓', color: 'blue' },
    { label: 'Total Teachers', value: data?.stats?.totalTeachers || 0, icon: '👨‍🏫', color: 'green' },
    { label: 'Total Classes', value: data?.stats?.totalClasses || 0, icon: '📚', color: 'purple' },
    { label: 'Attendance', value: data?.stats?.attendance || '0%', icon: '📊', color: 'orange' },
  ];

  const quickActions = data?.quickActions || [
    { label: 'Add Student', icon: '➕', path: '/students/add' },
    { label: 'Add Teacher', icon: '➕', path: '/teachers/add' },
    { label: 'Create Class', icon: '📚', path: '/classes/add' },
    { label: 'Manage Fees', icon: '💰', path: '/fees' },
  ];

  const recentActivities = data?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">
              Welcome back, {user?.firstName || 'Admin'}! 👋
            </h2>
            <p className="text-primary-100 mt-1">
              Here's what's happening at {tenant?.name || 'your school'}
            </p>
          </div>
          {tenant?.schoolCode && (
            <div className="mt-4 sm:mt-0 bg-white/20 rounded-lg px-6 py-3 backdrop-blur-sm">
              <p className="text-xs text-primary-100 uppercase tracking-wider">School Code</p>
              <p className="text-2xl font-mono font-bold tracking-wider">
                {tenant.formattedSchoolCode || tenant.schoolCode}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-3">{stat.icon}</div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action: any) => (
            <Link
              key={action.label}
              to={action.path}
              className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-colors"
            >
              <span className="text-2xl mr-2">{action.icon}</span>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        {recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity: any, index: number) => (
              <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                <div className="text-2xl">{activity.icon || '📌'}</div>
                <div>
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No recent activity</p>
        )}
      </div>
    </div>
  );
}