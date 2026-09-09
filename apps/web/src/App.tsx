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
import MarkAttendancePage from './pages/admin/MarkAttendance';
import AttendanceReportsPage from './pages/admin/AttendanceReports';
import FeeStructuresPage from './pages/admin/FeeStructures';
import AddFeeStructurePage from './pages/admin/AddFeeStructure';
import InvoicesPage from './pages/admin/Invoices';
import GenerateInvoicePage from './pages/admin/GenerateInvoice';
import AssignmentsPage from './pages/admin/Assignments';
import CreateAssignmentPage from './pages/admin/CreateAssignment';
import AssignmentSubmissionsPage from './pages/admin/AssignmentSubmissions';
import GradebookPage from './pages/student/Gradebook';
import ReportCardsPage from './pages/admin/ReportCards';
import AnnouncementsPage from './pages/Announcements';
import MessagesPage from './pages/Messages';
import TimetablesPage from './pages/admin/Timetables';
import CreateTimetablePage from './pages/admin/CreateTimetable';
import TimetableViewPage from './pages/TimetableView';

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
            <Route
              path="/attendance/mark"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MarkAttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/reports"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AttendanceReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees/structures"
              element={
                <ProtectedRoute requiredRole="admin">
                  <FeeStructuresPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees/structures/add"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AddFeeStructurePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees/structures/:id/edit"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AddFeeStructurePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees/invoices"
              element={
                <ProtectedRoute requiredRole="admin">
                  <InvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees/invoices/generate"
              element={
                <ProtectedRoute requiredRole="admin">
                  <GenerateInvoicePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments"
              element={
                <ProtectedRoute>
                  <AssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/create"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CreateAssignmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/:id/edit"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CreateAssignmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/:id/submissions"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AssignmentSubmissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/:id"
              element={
                <ProtectedRoute>
                  <AssignmentSubmissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gradebook"
              element={
                <ProtectedRoute requiredRole="student">
                  <GradebookPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-cards"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ReportCardsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <ProtectedRoute>
                  <AnnouncementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/timetable"
              element={
                <ProtectedRoute>
                  <TimetablesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/timetable/create"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CreateTimetablePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/timetable/:id"
              element={
                <ProtectedRoute>
                  <TimetableViewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/timetable/:id/edit"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CreateTimetablePage />
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