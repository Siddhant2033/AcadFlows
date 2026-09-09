import React from 'react';

interface StudentDashboardProps {
  data: any;
  tenant: any;
  user: any;
}

export default function StudentDashboard({ data, tenant, user }: StudentDashboardProps) {
  const stats = [
    { label: 'Attendance', value: '92%', icon: '📊', color: 'green' },
    { label: 'Assignments', value: '5 Pending', icon: '📝', color: 'yellow' },
    { label: 'Grades', value: 'A+', icon: '⭐', color: 'purple' },
    { label: 'Upcoming Tests', value: '3', icon: '📋', color: 'red' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div>
          <h2 className="text-2xl font-bold">
            Welcome back, {user.firstName}! 👋
          </h2>
          <p className="text-blue-100 mt-1">
            Student at {tenant?.name}
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

      {/* Timetable */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Timetable</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900">9:00 - 9:45</span>
              <span className="ml-4 text-sm text-gray-700">Mathematics</span>
            </div>
            <span className="text-xs text-gray-500">Room 101</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900">10:00 - 10:45</span>
              <span className="ml-4 text-sm text-gray-700">Science</span>
            </div>
            <span className="text-xs text-gray-500">Room 102</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900">11:00 - 11:45</span>
              <span className="ml-4 text-sm text-gray-700">English</span>
            </div>
            <span className="text-xs text-gray-500">Room 103</span>
          </div>
        </div>
      </div>

      {/* Recent Grades */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Grades</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Mathematics Quiz</p>
              <p className="text-xs text-gray-500">Completed: 2 days ago</p>
            </div>
            <span className="text-lg font-bold text-green-600">A</span>
          </div>
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Science Lab Report</p>
              <p className="text-xs text-gray-500">Completed: 5 days ago</p>
            </div>
            <span className="text-lg font-bold text-blue-600">B+</span>
          </div>
          <div className="flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-medium text-gray-900">English Essay</p>
              <p className="text-xs text-gray-500">Completed: 1 week ago</p>
            </div>
            <span className="text-lg font-bold text-purple-600">A-</span>
          </div>
        </div>
      </div>
    </div>
  );
}