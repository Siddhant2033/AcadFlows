import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Card, CardTitle } from '../ui';

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
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-elevated rounded w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-elevated rounded" />
            <div className="h-16 bg-elevated rounded" />
          </div>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <CardTitle>📊 Attendance Overview</CardTitle>
        <Link
          to="/attendance/reports"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          View All →
        </Link>
      </div>

      {/* Today's Attendance */}
      <div className="p-4 rounded-lg mb-4 bg-elevated">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted">Today's Attendance</p>
            {stats.today ? (
              <p className="text-2xl font-bold text-foreground">{stats.today.percentage}%</p>
            ) : (
              <p className="text-sm text-muted">Not marked yet</p>
            )}
          </div>
          {stats.today && (
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 dark:text-green-400">✅ {stats.today.present}</span>
              <span className="text-red-600 dark:text-red-400">❌ {stats.today.absent}</span>
              <span className="text-yellow-600 dark:text-yellow-400">⏰ {stats.today.late}</span>
            </div>
          )}
        </div>
      </div>

      {/* This Month / Overall */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted">This Month</p>
          <p className="text-lg font-bold text-foreground">
            {stats.thisMonth.averagePercentage}%
          </p>
          <p className="text-xs text-muted">{stats.thisMonth.days} days</p>
        </div>
        <div>
          <p className="text-xs text-muted">Overall</p>
          <p className="text-lg font-bold text-foreground">
            {stats.overall.averageAttendance}%
          </p>
          <p className="text-xs text-muted">{stats.overall.totalDays} days</p>
        </div>
      </div>

      {/* Quick Action */}
      <div className="mt-4 pt-4 border-t border-border">
        <Link
          to="/attendance/mark"
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30 transition-colors"
        >
          📝 Mark Attendance
        </Link>
      </div>
    </Card>
  );
}