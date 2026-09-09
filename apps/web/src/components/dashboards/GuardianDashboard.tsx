import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface GuardianDashboardProps {
  data: any;
  tenant: any;
  user: any;
}

export default function GuardianDashboard({ data, tenant, user }: GuardianDashboardProps) {
  const { theme } = useTheme();

  const children = [
    { 
      id: '1',
      name: 'Michael Johnson', 
      grade: '5th Grade', 
      attendance: '95%', 
      grades: 'A',
      subjects: [
        { name: 'Mathematics', grade: 'A', score: '94%' },
        { name: 'Science', grade: 'A-', score: '91%' },
        { name: 'English', grade: 'B+', score: '88%' },
      ]
    },
    { 
      id: '2',
      name: 'Emma Johnson', 
      grade: '3rd Grade', 
      attendance: '92%', 
      grades: 'B+',
      subjects: [
        { name: 'Mathematics', grade: 'B+', score: '87%' },
        { name: 'Science', grade: 'A-', score: '90%' },
        { name: 'English', grade: 'B', score: '84%' },
      ]
    },
  ];

  const stats = [
    { label: 'Children', value: children.length, icon: '👨‍👩‍👧', color: 'purple' },
    { label: 'Average Attendance', value: '94%', icon: '📊', color: 'green' },
    { label: 'Fee Status', value: 'Paid', icon: '💰', color: 'blue' },
    { label: 'Upcoming Events', value: '3', icon: '📅', color: 'orange' },
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
            Welcome back, {user?.firstName || 'Guardian'}! 👋
          </h2>
          <p className={`mt-1 transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>
            {children.length} children at {tenant?.name || 'your school'}
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

      {/* Children Section */}
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
        }`}>
          👨‍👩‍👧 My Children
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {children.map((child) => (
            <div key={child.id} className={`border rounded-lg p-4 transition-colors duration-200 ${
              theme ? 'border-gray-200 hover:shadow-md' : 'dark:border-[#334155] dark:hover:border-[#475569]'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className={`text-lg font-semibold transition-colors duration-200 ${
                    theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                  }`}>
                    {child.name}
                  </h4>
                  <p className={`text-sm transition-colors duration-200 ${
                    theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                  }`}>
                    {child.grade} · Attendance: {child.attendance}
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                  <div className="text-right">
                    <p className={`text-xs transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      Overall Grade
                    </p>
                    <p className={`text-lg font-bold ${
                      child.grades === 'A' || child.grades === 'A-' 
                        ? 'text-green-600 dark:text-green-400'
                        : child.grades === 'B+' 
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {child.grades}
                    </p>
                  </div>
                  <Link
                    to={`/students/${child.id}`}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
                      theme 
                        ? 'bg-primary-100 text-primary-600 hover:bg-primary-200' 
                        : 'dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50'
                    }`}
                  >
                    View Details →
                  </Link>
                </div>
              </div>

              {/* Subject Grades */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {child.subjects.map((subject, idx) => (
                  <div key={idx} className={`p-2 rounded-lg transition-colors duration-200 ${
                    theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                  }`}>
                    <p className={`text-xs transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      {subject.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${
                        subject.grade === 'A' || subject.grade === 'A-' 
                          ? 'text-green-600 dark:text-green-400'
                          : subject.grade === 'B+' 
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {subject.grade}
                      </span>
                      <span className={`text-xs transition-colors duration-200 ${
                        theme ? 'text-gray-400' : 'dark:text-[#64748B]'
                      }`}>
                        {subject.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/fees"
          className={`flex items-center justify-center space-x-3 p-4 rounded-lg shadow transition-all duration-200 ${
            theme 
              ? 'bg-white hover:shadow-md' 
              : 'dark:bg-[#1E293B] dark:hover:bg-[#1E293B]/80'
          }`}
        >
          <span className="text-2xl">💰</span>
          <div>
            <p className={`font-medium transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Fee Status
            </p>
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              View payments
            </p>
          </div>
        </Link>

        <Link
          to="/attendance"
          className={`flex items-center justify-center space-x-3 p-4 rounded-lg shadow transition-all duration-200 ${
            theme 
              ? 'bg-white hover:shadow-md' 
              : 'dark:bg-[#1E293B] dark:hover:bg-[#1E293B]/80'
          }`}
        >
          <span className="text-2xl">📊</span>
          <div>
            <p className={`font-medium transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Attendance
            </p>
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              View reports
            </p>
          </div>
        </Link>

        <Link
          to="/calendar"
          className={`flex items-center justify-center space-x-3 p-4 rounded-lg shadow transition-all duration-200 ${
            theme 
              ? 'bg-white hover:shadow-md' 
              : 'dark:bg-[#1E293B] dark:hover:bg-[#1E293B]/80'
          }`}
        >
          <span className="text-2xl">📅</span>
          <div>
            <p className={`font-medium transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Calendar
            </p>
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              School events
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}