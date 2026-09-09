import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface TeacherDashboardProps {
  data: any;
  tenant: any;
  user: any;
}

export default function TeacherDashboard({ data, tenant, user }: TeacherDashboardProps) {
  const { theme } = useTheme();

  const stats = [
    { label: 'My Students', value: '32', icon: '👨‍🎓', color: 'blue' },
    { label: 'Classes Today', value: '4', icon: '📚', color: 'green' },
    { label: 'Assignments', value: '8 Pending', icon: '📝', color: 'yellow' },
    { label: 'Attendance', value: '94%', icon: '📊', color: 'purple' },
  ];

  const quickActions = [
    { label: 'Take Attendance', icon: '📋', path: '/attendance' },
    { label: 'Create Assignment', icon: '📝', path: '/assignments/create' },
    { label: 'Grade Submissions', icon: '✅', path: '/grades' },
    { label: 'View Schedule', icon: '📅', path: '/schedule' },
  ];

  const todayClasses = [
    { subject: 'Mathematics', grade: 'Grade 5', time: '9:00 - 9:45', room: '101', students: 28 },
    { subject: 'Science', grade: 'Grade 6', time: '10:00 - 10:45', room: '102', students: 25 },
    { subject: 'English', grade: 'Grade 7', time: '11:00 - 11:45', room: '103', students: 30 },
    { subject: 'Mathematics', grade: 'Grade 8', time: '1:00 - 1:45', room: '104', students: 27 },
  ];

  const pendingTasks = [
    { title: 'Grade Mathematics Quiz', count: 8, priority: 'high' },
    { title: 'Prepare Lesson Plans', count: 3, priority: 'medium' },
    { title: 'Parent Meetings', count: 2, priority: 'low' },
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
            Welcome back, {user?.firstName || 'Teacher'}! 👋
          </h2>
          <p className={`mt-1 transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>
            You have {todayClasses.length} classes today at {tenant?.name || 'your school'}
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
        {/* Left Column - Classes & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Classes */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              📚 Today's Classes
            </h3>
            <div className="space-y-3">
              {todayClasses.map((cls, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                  theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                }`}>
                  <div className="flex-1">
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {cls.subject} - {cls.grade}
                    </p>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      {cls.time} · Room {cls.room} · {cls.students} students
                    </p>
                  </div>
                  <button className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
                    theme 
                      ? 'bg-primary-100 text-primary-600 hover:bg-primary-200' 
                      : 'dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50'
                  }`}>
                    Take Attendance
                  </button>
                </div>
              ))}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action) => (
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
                  <span className={`text-xs font-medium text-center transition-colors duration-200 ${
                    theme ? 'text-gray-700' : 'dark:text-[#CBD5E1]'
                  }`}>
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Tasks & Notifications */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              📋 Pending Tasks
            </h3>
            <div className="space-y-3">
              {pendingTasks.map((task, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                  task.priority === 'high' 
                    ? theme ? 'bg-red-50' : 'dark:bg-red-900/20'
                    : task.priority === 'medium'
                    ? theme ? 'bg-yellow-50' : 'dark:bg-yellow-900/20'
                    : theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
                }`}>
                  <div>
                    <p className={`font-medium transition-colors duration-200 ${
                      theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                    }`}>
                      {task.title}
                    </p>
                    <p className={`text-sm transition-colors duration-200 ${
                      theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                    }`}>
                      {task.count} pending
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.priority === 'high' 
                      ? theme ? 'bg-red-100 text-red-600' : 'dark:bg-red-900/30 dark:text-red-400'
                      : task.priority === 'medium'
                      ? theme ? 'bg-yellow-100 text-yellow-600' : 'dark:bg-yellow-900/30 dark:text-yellow-400'
                      : theme ? 'bg-gray-100 text-gray-600' : 'dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Summary */}
          <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
            theme ? 'bg-white' : 'dark:bg-[#1E293B]'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              📊 Today's Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-600' : 'dark:text-[#94A3B8]'
                }`}>
                  Classes Taught
                </span>
                <span className={`font-semibold transition-colors duration-200 ${
                  theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                }`}>
                  2 / 4
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-600' : 'dark:text-[#94A3B8]'
                }`}>
                  Attendance Submitted
                </span>
                <span className={`font-semibold text-green-600 dark:text-green-400`}>
                  2 / 4
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-600' : 'dark:text-[#94A3B8]'
                }`}>
                  Assignments Graded
                </span>
                <span className={`font-semibold text-yellow-600 dark:text-yellow-400`}>
                  3 / 8
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}