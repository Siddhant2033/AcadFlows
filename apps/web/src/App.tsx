import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import SchoolRegistrationPage from './pages/SchoolRegistration';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Public routes */}
          <Route path="/school/register" element={<SchoolRegistrationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/:tenantSlug/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:tenantSlug/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;