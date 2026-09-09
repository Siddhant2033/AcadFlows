import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { formatSchoolCodeForDisplay } from '../lib/tenant';
import api from '../lib/api';

// Import role-specific dashboard components
import AdminDashboard from '../components/dashboards/AdminDashboard';
import TeacherDashboard from '../components/dashboards/TeacherDashboard';
import StudentDashboard from '../components/dashboards/StudentDashboard';
import GuardianDashboard from '../components/dashboards/GuardianDashboard';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { tenant, isLoading: tenantLoading } = useTenant();
  const [dashboardData, setDashboardData] = useState<any>(null);
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
          // Redirect to login after 2 seconds
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-500">Loading your dashboard...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm text-red-600 hover:text-red-500 font-medium"
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
          <p className="text-gray-500">Please login to view your dashboard</p>
          <button
            onClick={() => window.location.href = '/login'}
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-700">Unknown role: {user?.role}. Please contact support.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">School Platform</h1>
              {tenant && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {tenant.name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName} ({user?.role})
              </span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
}