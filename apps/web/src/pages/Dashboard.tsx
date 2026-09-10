import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatSchoolCodeForDisplay } from '../lib/tenant';
import api from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';

// Import role-specific dashboard components
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
  // Role-specific data
  myClasses?: any[];
  pendingTasks?: any[];
  timetable?: any[];
  recentGrades?: any[];
  children?: any[];
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { tenant, isLoading: tenantLoading } = useTenant();
  const { mode } = useTheme();
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
        console.log('📊 Fetching dashboard data...');
        const response = await api.get('/dashboard');
        console.log('✅ Dashboard data received:', response.data);
        setDashboardData(response.data.data);
      } catch (err: any) {
        console.error('❌ Failed to fetch dashboard data:', err);

        if (err.response?.status === 401) {
          setError('Please login to view your dashboard');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (err.response?.status === 404) {
          setError('Dashboard API not found. Please check if the backend is running.');
        } else {
          setError(err.response?.data?.error || 'Failed to load dashboard data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const renderDashboard = () => {
    if (isLoading || tenantLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          <p className="mt-4 text-muted">Loading your dashboard...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error Loading Dashboard
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 text-sm text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="text-center py-12">
          <p className="text-muted">Please login to view your dashboard</p>
          <button
            type="button"
            onClick={() => (window.location.href = '/login')}
            className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            Go to Login
          </button>
        </div>
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Unknown role: {user?.role}. Please contact support.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen bg-background}`}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🏫</span>
                <h1 className="text-xl font-bold text-foreground">SchoolPlatform</h1>
              </Link>
              {tenant && (
                <span className="text-sm px-3 py-1 rounded-full bg-elevated text-muted">
                  {tenant.name}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />

              <Link
                to="/profile"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-foreground hover:bg-elevated"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </span>
                </div>
                <span className="text-sm hidden md:inline">
                  {user?.firstName} {user?.lastName}
                </span>
              </Link>

              <button
                type="button"
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">{renderDashboard()}</div>
      </main>
    </div>
  );
}