import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';

interface AttendanceStats {
  today: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    total: number;
    percentage: number;
  } | null;
  thisMonth: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    total: number;
    days: number;
    percentage: number;
    averagePercentage: number;
  };
  overall: {
    totalDays: number;
    averageAttendance: number;
    totalPresent: number;
    totalAbsent: number;
    bestDay: { date: string; percentage: number } | null;
    worstDay: { date: string; percentage: number } | null;
  };
}

export default function AttendanceWidget() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/attendance/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch attendance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
        theme ? 'bg-white' : 'dark:bg-[#1E293B]'
      }`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-[#334155] rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 dark:bg-[#334155] rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-[#334155] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`rounded-lg shadow p-6 transition-colors duration-200 ${
      theme ? 'bg-white' : 'dark:bg-[#1E293B]'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold transition-colors duration-200 ${
          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
        }`}>
          📊 Attendance Overview
        </h3>
        <Link
          to="/attendance/reports"
          className={`text-sm font-medium transition-colors duration-200 ${
            theme ? 'text-primary-600 hover:text-primary-700' : 'dark:text-primary-400 dark:hover:text-primary-300'
          }`}
        >
          View All →
        </Link>
      </div>

      {/* Today's Attendance */}
      <div className={`p-4 rounded-lg mb-4 transition-colors duration-200 ${
        theme ? 'bg-gray-50' : 'dark:bg-[#0F172A]'
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <p className={`text-sm transition-colors duration-200 ${
              theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
            }`}>
              Today's Attendance
            </p>
            {stats.today ? (
              <p className={`text-2xl font-bold transition-colors duration-200 ${
                theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
              }`}>
                {stats.today.percentage}%
              </p>
            ) : (
              <p className={`text-sm transition-colors duration-200 ${
                theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
              }`}>
                Not marked yet
              </p>
            )}
          </div>
          {stats.today && (
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-green-600 dark:text-green-400">✅ {stats.today.present}</span>
              </div>
              <div>
                <span className="text-red-600 dark:text-red-400">❌ {stats.today.absent}</span>
              </div>
              <div>
                <span className="text-yellow-600 dark:text-yellow-400">⏰ {stats.today.late}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* This Month */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className={`text-xs transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>
            This Month
          </p>
          <p className={`text-lg font-bold transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            {stats.thisMonth.averagePercentage}%
          </p>
          <p className={`text-xs transition-colors duration-200 ${
            theme ? 'text-gray-400' : 'dark:text-[#64748B]'
          }`}>
            {stats.thisMonth.days} days
          </p>
        </div>
        <div>
          <p className={`text-xs transition-colors duration-200 ${
            theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
          }`}>
            Overall
          </p>
          <p className={`text-lg font-bold transition-colors duration-200 ${
            theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
          }`}>
            {stats.overall.averageAttendance}%
          </p>
          <p className={`text-xs transition-colors duration-200 ${
            theme ? 'text-gray-400' : 'dark:text-[#64748B]'
          }`}>
            {stats.overall.totalDays} days
          </p>
        </div>
      </div>

      {/* Quick Action */}
      <div className={`mt-4 pt-4 border-t transition-colors duration-200 ${
        theme ? 'border-gray-200' : 'dark:border-[#334155]'
      }`}>
        <Link
          to="/attendance/mark"
          className={`w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            theme ? 'bg-primary-50 text-primary-600 hover:bg-primary-100' : 'dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30'
          }`}
        >
          📝 Mark Attendance
        </Link>
      </div>
    </div>
  );
}