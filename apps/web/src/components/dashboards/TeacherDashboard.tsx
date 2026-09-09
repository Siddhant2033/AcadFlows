import React from 'react';

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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
        <div>
          <h2 className="text-2xl font-bold">
            Welcome back, {user.firstName}! 👋
          </h2>
          <p className="text-green-100 mt-1">
            Teacher at {tenant?.name}
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

      {/* Today's Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Classes</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Grade 5 - Mathematics</p>
                <p className="text-xs text-gray-500">9:00 - 9:45 | Room 101</p>
              </div>
              <span className="text-xs text-blue-600 font-medium">In Progress</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Grade 6 - Science</p>
                <p className="text-xs text-gray-500">10:00 - 10:45 | Room 102</p>
              </div>
              <span className="text-xs text-gray-500">Upcoming</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Grade 7 - English</p>
                <p className="text-xs text-gray-500">11:00 - 11:45 | Room 103</p>
              </div>
              <span className="text-xs text-gray-500">Upcoming</span>
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Tasks</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Grade assignments</p>
                <p className="text-xs text-gray-500">8 assignments pending</p>
              </div>
              <button className="text-xs text-yellow-600 font-medium">Review</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Prepare lesson plans</p>
                <p className="text-xs text-gray-500">3 lessons to prepare</p>
              </div>
              <button className="text-xs text-yellow-600 font-medium">Start</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Parent meetings</p>
                <p className="text-xs text-gray-500">2 meetings scheduled</p>
              </div>
              <button className="text-xs text-red-600 font-medium">View</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}