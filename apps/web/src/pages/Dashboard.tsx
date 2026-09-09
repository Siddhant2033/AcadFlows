import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { formatSchoolCodeForDisplay } from '../lib/tenant';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { tenant, isLoading } = useTenant();

  return (
    <div className="min-h-screen bg-gray-50">
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
          {/* School Code Card */}
          {tenant && (
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-6 mb-6 text-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h2 className="text-2xl font-bold">{tenant.name}</h2>
                  <p className="text-primary-100 mt-1">Welcome to your school dashboard!</p>
                </div>
                <div className="mt-4 sm:mt-0 bg-white/20 rounded-lg px-6 py-3 backdrop-blur-sm">
                  <p className="text-xs text-primary-100 uppercase tracking-wider">School Code</p>
                  <p className="text-2xl font-mono font-bold tracking-wider">
                    {formatSchoolCodeForDisplay(tenant.schoolCode)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Welcome to your Dashboard!</h2>
            <p className="text-gray-600">
              This is the MVP dashboard. More features will be added as we build out the platform.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800">Students</h3>
                <p className="text-2xl font-bold text-blue-900">0</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-800">Teachers</h3>
                <p className="text-2xl font-bold text-green-900">0</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-800">Classes</h3>
                <p className="text-2xl font-bold text-purple-900">0</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}