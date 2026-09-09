import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <Routes>
          {/* Public routes with optional tenant */}
          <Route path="/:tenantSlug/login" element={<LoginPage />} />
          <Route path="/:tenantSlug/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route
            path="/:tenantSlug/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;