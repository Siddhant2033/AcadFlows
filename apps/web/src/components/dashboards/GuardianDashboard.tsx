import React from 'react';

interface GuardianDashboardProps {
  data: any;
  tenant: any;
  user: any;
}

export default function GuardianDashboard({ data, tenant, user }: GuardianDashboardProps) {
  // Mock children data (will come from API)
  const children = [
    { name: 'Michael Johnson', grade: '5th Grade', attendance: '95%', grades: 'A' },
    { name: 'Emma Johnson', grade: '3rd Grade', attendance: '92%', grades: 'B+' },
  ];

  const stats = [
    { label: 'Children', value: children.length, icon: '👨‍👩‍👧', color: 'purple' },
    { label: 'Attendance', value: '94%', icon: '📊', color: 'green' },
    { label: 'Fee Status', value: 'Paid', icon: '💰', color: 'blue' },
    { label: 'Upcoming Events', value: '3', icon: '📅', color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div>
          <h2 className="text-2xl font-bold">
            Welcome back, {user.firstName}! 👋
          </h2>
          <p className="text-purple-100 mt-1">
            Guardian at {tenant?.name}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`text-3xl mr-3`}>{stat.icon}</div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Children Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">My Children</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-medium text-gray-900">{child.name}</h4>
                  <p className="text-sm text-gray-500">{child.grade}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Attendance</p>
                  <p className="text-sm font-semibold text-green-600">{child.attendance}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Overall Grade</p>
                  <p className="text-lg font-bold text-primary-600">{child.grades}</p>
                </div>
                <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📚</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Homework</p>
              <p className="text-xs text-gray-500">2 pending assignments</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">💰</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Fees</p>
              <p className="text-xs text-gray-500">Next due: June 15</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📅</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Events</p>
              <p className="text-xs text-gray-500">3 upcoming events</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}