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
import StudentsPage from './pages/admin/Students';
import AddStudentPage from './pages/admin/AddStudent';
import StudentDetailPage from './pages/admin/StudentDetail';
import BulkImportPage from './pages/admin/BulkImport';
import TeachersPage from './pages/admin/Teachers';
import AddTeacherPage from './pages/admin/AddTeacher';
import TeacherDetailPage from './pages/admin/TeacherDetail';

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
            <Route
              path="/students"
              element={
                <ProtectedRoute requiredRole="admin">
                  <StudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/add"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AddStudentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/:id"
              element={
                <ProtectedRoute requiredRole="admin">
                  <StudentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/:id/edit"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AddStudentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/import"
              element={
                <ProtectedRoute requiredRole="admin">
                  <BulkImportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers"
              element={
                <ProtectedRoute requiredRole="admin">
                  <TeachersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers/add"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AddTeacherPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers/:id"
              element={
                <ProtectedRoute requiredRole="admin">
                  <TeacherDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers/:id/edit"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AddTeacherPage />
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