import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import api from '../lib/api';
import { Card } from '../components/ui';
import { DashboardLayout } from '../components/layout';

// Role-specific dashboards
import AdminDashboard from '../components/dashboards/AdminDashboard';
import TeacherDashboard from '../components/dashboards/TeacherDashboard';
import StudentDashboard from '../components/dashboards/StudentDashboard';
import GuardianDashboard from '../components/dashboards/GuardianDashboard';

interface DashboardData {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalSubjects: number;
    attendance: string;
  };
  recentActivity: any[];
  quickActions: any[];
  myClasses?: any[];
  pendingTasks?: any[];
  timetable?: any[];
  recentGrades?: any[];
  children?: any[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await api.get('/dashboard');
        setDashboardData(response.data.data);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);

        if (err.response?.status === 401) {
          setError('Please login to view your dashboard');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (err.response?.status === 404) {
          setError('Dashboard API not found. Please check if the backend is running.');
        } else {
          setError(
            err.response?.data?.error || 'Failed to load dashboard data. Please try again.',
          );
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const renderDashboard = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-border border-t-primary-500" />
          <p className="mt-4 text-muted text-sm animate-pulse-soft">
            Loading your dashboard...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <Card className="max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 text-danger flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                Error Loading Dashboard
              </h3>
              <p className="text-sm text-muted mt-1">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Retry
              </button>
            </div>
          </div>
        </Card>
      );
    }

    if (!user) {
      return (
        <Card className="max-w-2xl mx-auto text-center py-12">
          <p className="text-muted">Please login to view your dashboard</p>
          <button
            type="button"
            onClick={() => (window.location.href = '/login')}
            className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Go to Login
          </button>
        </Card>
      );
    }

    switch (user?.role) {
      case 'admin':
        return <AdminDashboard data={dashboardData} tenant={tenant} user={user} />;
      case 'teacher':
        return <TeacherDashboard data={dashboardData} tenant={tenant} user={user} />;
      case 'student':
        return <StudentDashboard data={dashboardData} tenant={tenant} user={user} />;
      case 'guardian':
        return <GuardianDashboard data={dashboardData} tenant={tenant} user={user} />;
      default:
        return (
          <Card>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Unknown role: {user?.role}. Please contact support.
            </p>
          </Card>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-up">{renderDashboard()}</div>
    </DashboardLayout>
  );
}