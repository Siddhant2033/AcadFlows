import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import SchoolRegistrationPage from './pages/SchoolRegistration';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import ForgotPasswordPage from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPassword';
import ProfilePage from './pages/Profile';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Public routes */}
            <Route path="/school/register" element={<SchoolRegistrationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Tenant-specific public routes */}
            <Route path="/:tenantSlug/login" element={<LoginPage />} />
            <Route path="/:tenantSlug/register" element={<RegisterPage />} />
            <Route path="/:tenantSlug/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/:tenantSlug/reset-password" element={<ResetPasswordPage />} />

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
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;