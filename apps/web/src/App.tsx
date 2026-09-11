import { Routes, Route } from 'react-router-dom';
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
import NotFoundPage from './pages/NotFound';

// Academic
import AcademicYearsPage from './pages/admin/academic/AcademicYears';
import GradesPage from './pages/admin/academic/Grades';
import SectionsPage from './pages/admin/academic/Sections';
import SubjectsPage from './pages/admin/academic/Subjects';
import TeacherAssignmentsPage from './pages/admin/academic/TeacherAssignments';

// Admin
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
import InvoiceDetailPage from './pages/admin/InvoiceDetail';
import RecordPaymentPage from './pages/admin/RecordPayment';
import DiscountsPage from './pages/admin/Discounts';
import FeeReportsPage from './pages/admin/FeeReports';
import StudentFeeHistoryPage from './pages/admin/StudentFeeHistory';
import LeavesPage from './pages/admin/Leaves';
import TeacherAttendancePage from './pages/admin/TeacherAttendance';
import LowAttendancePage from './pages/admin/LowAttendance';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            {/* Landing */}
            <Route path="/" element={<LandingPage />} />

            {/* Public auth */}
            <Route path="/school/register" element={<SchoolRegistrationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Tenant-slug variants */}
            <Route path="/:tenantSlug/login" element={<LoginPage />} />
            <Route path="/:tenantSlug/register" element={<RegisterPage />} />
            <Route path="/:tenantSlug/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/:tenantSlug/reset-password" element={<ResetPasswordPage />} />

            {/* Dashboard */}
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

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* ────────────── Academic (admin only) ────────────── */}
            <Route
              path="/academic/years"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AcademicYearsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic/grades"
              element={
                <ProtectedRoute requiredRole="admin">
                  <GradesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic/sections"
              element={
                <ProtectedRoute requiredRole="admin">
                  <SectionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic/subjects"
              element={
                <ProtectedRoute requiredRole="admin">
                  <SubjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic/assignments"
              element={
                <ProtectedRoute requiredRole="admin">
                  <TeacherAssignmentsPage />
                </ProtectedRoute>
              }
            />

            {/* ────────────── Students (admin only) ────────────── */}
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

            {/* ────────────── Teachers (admin only) ────────────── */}
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

            {/* ────────────── Attendance (admin + teacher) ────────────── */}
            <Route
              path="/attendance/mark"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <MarkAttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <AttendanceReportsPage />
                </ProtectedRoute>
              }
            />

            {/* ────────────── Fees (admin only) ────────────── */}
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

            {/* ────────────── Assignments ────────────── */}
            <Route
              path="/assignments"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                  <AssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/create"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <CreateAssignmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <CreateAssignmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/:id/submissions"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <AssignmentSubmissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                  <AssignmentSubmissionsPage />
                </ProtectedRoute>
              }
            />

            {/* Gradebook (student only) */}
            <Route
              path="/gradebook"
              element={
                <ProtectedRoute requiredRole="student">
                  <GradebookPage />
                </ProtectedRoute>
              }
            />

            {/* Report cards */}
            <Route
              path="/report-cards"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <ReportCardsPage />
                </ProtectedRoute>
              }
            />

            {/* Communication */}
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

            {/* Timetable */}
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

            {/* Invoices */}
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
              path="/fees/invoices/:id"
              element={
                <ProtectedRoute requiredRole="admin">
                  <InvoiceDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees/invoices/:id/pay"
              element={
                <ProtectedRoute requiredRole="admin">
                  <RecordPaymentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees/discounts"
              element={
                <ProtectedRoute requiredRole="admin">
                  <DiscountsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees/reports"
              element={
                <ProtectedRoute requiredRole="admin">
                  <FeeReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees/students/:studentId/fees"
              element={
                <ProtectedRoute requiredRole="admin">
                  <StudentFeeHistoryPage />
                </ProtectedRoute>
              }
            />
            {/* Leaves */}
            <Route
              path="/leaves"
              element={
                <ProtectedRoute requiredRole="admin">
                  <LeavesPage />
                </ProtectedRoute>
              }
            />

            {/* Teacher attendance */}
            <Route
              path="/attendance/teachers"
              element={
                <ProtectedRoute requiredRole="admin">
                  <TeacherAttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/warnings"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <LowAttendancePage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;