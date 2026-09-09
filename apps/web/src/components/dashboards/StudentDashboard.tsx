import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface StudentDashboardProps {
  data: any;
  tenant: any;
  user: any;
}

export default function StudentDashboard({ data, tenant, user }: StudentDashboardProps) {
  const { theme } = useTheme();

  const stats = [
    { label: 'Attendance', value: '92%', icon: '📊', color: 'green' },
    { label: 'Assignments', value: '5 Pending', icon: '📝', color: 'yellow' },
    { label: 'Overall Grade', value: 'A-', icon: '⭐', color: 'purple' },
    { label: 'Upcoming Tests', value: '3', icon: '📋', color: 'red' },
  ];

  const timetable = [
    { subject: 'Mathematics', time: '9:00 - 9:45', room: '101', teacher: 'Ms. Wilson' },
    { subject: 'Science', time: '10:00 - 10:45', room: '102', teacher: 'Mr. Anderson' },
    { subject: 'English', time: '11:00 - 11:45', room: '103', teacher: 'Ms. Martinez' },
    { subject: 'History', time: '12:00 - 12:45', room: '104', teacher: 'Mr. Thompson' },
  ];

  const recentGrades = [
    { subject: 'Mathematics', grade: 'A', date: '2 days ago', score: '95%' },
    { subject: 'Science', grade: 'B+', date: '5 days ago', score: '88%' },
    { subject: 'English', grade: 'A-', date: '1 week ago', score: '91%' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div>
          <h2 className={`text-2xl font-bold transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            Welcome back, {user?.firstName || 'Student'}! 👋
          </h2>
          <p className={`mt-1 transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>
            {tenant?.name || 'Your school'} · Grade 5 · Section A
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{stat.icon}</div>
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
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Timetable & Grades */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Timetable */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              📅 Today's Timetable
            </h3>
            <div className="space-y-3">
              {timetable.map((cls, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                  theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                }`}>
                  <div>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {cls.subject}
                    </p>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      {cls.time} · Room {cls.room} · {cls.teacher}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    index < 2 
                      ? theme ? 'bg-green-100 text-green-600' : 'dark:bg-green-900/30 dark:text-green-400'
                      : theme ? 'bg-gray-100 text-gray-600' : 'dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {index < 2 ? 'Completed' : 'Upcoming'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Grades */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              📊 Recent Grades
            </h3>
            <div className="space-y-3">
              {recentGrades.map((grade, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                  theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                }`}>
                  <div>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {grade.subject}
                    </p>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      {grade.date} · Score: {grade.score}
                    </p>
                  </div>
                  <span className={`text-lg font-bold ${
                    grade.grade === 'A' || grade.grade === 'A-' 
                      ? 'text-green-600 dark:text-green-400'
                      : grade.grade === 'B+' 
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {grade.grade}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Notifications & Quick Stats */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              ⏰ Upcoming Deadlines
            </h3>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg border-l-4 border-red-500 ${
                theme ? 'bg-red-50' : 'dark:bg-red-900/20'
              }`}>
                <p className={`text-sm font-medium transition-colors duration-200 ${
                  theme ? 'text-red-800' : 'dark:text-red-300'
                }`}>
                  Mathematics Assignment
                </p>
                <p className={`text-xs transition-colors duration-200 ${
                  theme ? 'text-red-600' : 'dark:text-red-400'
                }`}>
                  Due Tomorrow
                </p>
              </div>
              <div className={`p-3 rounded-lg border-l-4 border-yellow-500 ${
                theme ? 'bg-yellow-50' : 'dark:bg-yellow-900/20'
              }`}>
                <p className={`text-sm font-medium transition-colors duration-200 ${
                  theme ? 'text-yellow-800' : 'dark:text-yellow-300'
                }`}>
                  Science Project
                </p>
                <p className={`text-xs transition-colors duration-200 ${
                  theme ? 'text-yellow-600' : 'dark:text-yellow-400'
                }`}>
                  Due in 3 days
                </p>
              </div>
              <div className={`p-3 rounded-lg border-l-4 border-green-500 ${
                theme ? 'bg-green-50' : 'dark:bg-green-900/20'
              }`}>
                <p className={`text-sm font-medium transition-colors duration-200 ${
                  theme ? 'text-green-800' : 'dark:text-green-300'
                }`}>
                  History Quiz
                </p>
                <p className={`text-xs transition-colors duration-200 ${
                  theme ? 'text-green-600' : 'dark:text-green-400'
                }`}>
                  Due in 5 days
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/assignments"
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                  theme 
                    ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50' 
                    : 'dark:border-[#334155] dark:hover:border-primary-500/50 dark:hover:bg-primary-900/10'
                }`}
              >
                <span className="text-xl mb-1">📝</span>
                <span className={`text-xs text-center transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#CBD5E1]'
                }`}>
                  Assignments
                </span>
              </Link>
              <Link
                to="/grades"
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                  theme 
                    ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50' 
                    : 'dark:border-[#334155] dark:hover:border-primary-500/50 dark:hover:bg-primary-900/10'
                }`}
              >
                <span className="text-xl mb-1">📊</span>
                <span className={`text-xs text-center transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#CBD5E1]'
                }`}>
                  Grades
                </span>
              </Link>
              <Link
                to="/attendance"
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                  theme 
                    ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50' 
                    : 'dark:border-[#334155] dark:hover:border-primary-500/50 dark:hover:bg-primary-900/10'
                }`}
              >
                <span className="text-xl mb-1">✅</span>
                <span className={`text-xs text-center transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#CBD5E1]'
                }`}>
                  Attendance
                </span>
              </Link>
              <Link
                to="/timetable"
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                  theme 
                    ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50' 
                    : 'dark:border-[#334155] dark:hover:border-primary-500/50 dark:hover:bg-primary-900/10'
                }`}
              >
                <span className="text-xl mb-1">📅</span>
                <span className={`text-xs text-center transition-colors duration-200 ${
                  theme ? 'text-gray-700' : 'dark:text-[#CBD5E1]'
                }`}>
                  Timetable
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}