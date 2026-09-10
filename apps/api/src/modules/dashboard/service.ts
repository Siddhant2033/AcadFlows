import mongoose from 'mongoose';
import { User } from '../../models/User';
import { Tenant } from '../../models/Tenant';
import { Student } from '../../models/Student';
import { Teacher } from '../../models/Teacher';
import { Invoice } from '../../models/Fee';
import { Attendance } from '../../models/Attendance';
import { AppError } from '../../middleware/error-handler';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface TenantData {
  id: string;
  name: string;
  schoolCode: string;
  formattedSchoolCode: string;
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  attendance: string;
  feeCollection: string;
  revenue: number;
  pendingInvoices: number;
}

interface ActivityItem {
  id: string;
  icon: string;
  message: string;
  timestamp: string;
  type: string;
}

interface QuickAction {
  label: string;
  icon: string;
  path: string;
  color: string;
}

interface QuickStats {
  totalStudents: number;
  totalTeachers: number;
  totalInvoices: number;
  pendingInvoices: number;
  newMessages: number;
  leaveRequests: number;
}

interface AdminData {
  quickActions: QuickAction[];
  quickStats: QuickStats;
}

interface MyClass {
  name: string;
  section: string;
  time: string;
}

interface PendingTask {
  title: string;
  count: number;
}

interface TeacherData {
  myClasses: MyClass[];
  pendingTasks: PendingTask[];
}

interface TimetableClass {
  subject: string;
  time: string;
  room: string;
  teacher: string;
}

interface Grade {
  subject: string;
  grade: string;
  score: string;
  date: string;
}

interface StudentData {
  timetable: TimetableClass[];
  recentGrades: Grade[];
  upcomingTests: any[];
  grade: string;
  section: string;
}

interface Child {
  name: string;
  grade: string;
  attendance: string;
  grades: string;
}

interface FeeStatus {
  current: string;
  nextDue: string;
  amount: string;
}

interface GuardianData {
  children: Child[];
  feeStatus: FeeStatus;
}

interface DashboardResponse {
  user: UserData;
  tenant: TenantData;
  stats: DashboardStats;
  recentActivity: ActivityItem[];
  quickActions?: QuickAction[];
  quickStats?: QuickStats;
  myClasses?: MyClass[];
  pendingTasks?: PendingTask[];
  timetable?: TimetableClass[];
  recentGrades?: Grade[];
  children?: Child[];
  feeStatus?: FeeStatus;
}

export class DashboardService {
  static async getDashboardData(userId: string, tenantId: string, role: string): Promise<DashboardResponse> {
    console.log('🔍 Fetching dashboard data for:', { userId, tenantId, role });

    // Get tenant info
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get real stats based on role
    const stats = await this.getStats(tenantId, role);
    const recentActivity = await this.getRecentActivity(tenantId, userId, role);

    // Role-specific data
    let roleSpecificData = {};
    switch (role) {
      case 'admin':
        roleSpecificData = await this.getAdminData(tenantId);
        break;
      case 'teacher':
        roleSpecificData = await this.getTeacherData(userId, tenantId);
        break;
      case 'student':
        roleSpecificData = await this.getStudentData(userId, tenantId);
        break;
      case 'guardian':
        roleSpecificData = await this.getGuardianData(userId, tenantId);
        break;
      default:
        break;
    }

    return {
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        schoolCode: tenant.schoolCode,
        formattedSchoolCode: this.formatSchoolCode(tenant.schoolCode),
      },
      stats,
      recentActivity,
      ...roleSpecificData,
    };
  }

  static async getStats(tenantId: string, role: string): Promise<DashboardStats> {
    // Get real counts from database
    const [totalStudents, totalTeachers, totalInvoices] = await Promise.all([
      Student.countDocuments({ tenantId, isDeleted: false }),
      Teacher.countDocuments({ tenantId, isDeleted: false }),
      Invoice.countDocuments({ tenantId }),
    ]);

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.countDocuments({
      tenantId,
      date: today,
      status: { $in: ['present', 'late', 'half_day'] },
    });

    const totalAttendance = await Attendance.countDocuments({
      tenantId,
      date: today,
    });

    const attendancePercentage = totalAttendance > 0
      ? Math.round((todayAttendance / totalAttendance) * 100)
      : 0;

    // Get fee collection and revenue
    const paidInvoices = await Invoice.aggregate([
      { $match: { tenantId, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const totalInvoicesAmount = await Invoice.aggregate([
      { $match: { tenantId } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const totalRevenue = totalInvoicesAmount.length > 0 ? totalInvoicesAmount[0].total : 0;

    const feeCollection = totalInvoicesAmount.length > 0 && totalInvoicesAmount[0].total > 0
      ? Math.round((paidInvoices[0]?.total || 0) / totalInvoicesAmount[0].total * 100)
      : 0;

    // Get pending invoices count
    const pendingInvoices = await Invoice.countDocuments({
      tenantId,
      status: { $in: ['sent', 'partially_paid', 'overdue'] },
    });

    return {
      totalStudents: totalStudents || 0,
      totalTeachers: totalTeachers || 0,
      attendance: `${attendancePercentage}%`,
      feeCollection: `${feeCollection}%`,
      revenue: totalRevenue || 0,
      pendingInvoices: pendingInvoices || 0,
    };
  }

  static async getRecentActivity(tenantId: string, userId: string, role: string): Promise<ActivityItem[]> {
    // Get real recent activities
    const activities: ActivityItem[] = [];

    // Recent students
    const recentStudents = await Student.find({ tenantId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('firstName lastName createdAt');

    recentStudents.forEach((student: any) => {
      activities.push({
        id: `student_${student._id}`,
        icon: '👨‍🎓',
        message: `${student.firstName} ${student.lastName} registered as a student`,
        timestamp: this.getTimeAgo(student.createdAt),
        type: 'student_registration',
      });
    });

    // Recent teachers
    const recentTeachers = await Teacher.find({ tenantId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(2)
      .select('firstName lastName createdAt');

    recentTeachers.forEach((teacher: any) => {
      activities.push({
        id: `teacher_${teacher._id}`,
        icon: '👨‍🏫',
        message: `${teacher.firstName} ${teacher.lastName} joined as a teacher`,
        timestamp: this.getTimeAgo(teacher.createdAt),
        type: 'teacher_registration',
      });
    });

    // Recent invoices/payments
    const recentInvoices = await Invoice.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(2)
      .select('invoiceNumber total status createdAt');

    recentInvoices.forEach((invoice: any) => {
      const statusIcon = invoice.status === 'paid' ? '💰' : '📄';
      activities.push({
        id: `invoice_${invoice._id}`,
        icon: statusIcon,
        message: `Invoice ${invoice.invoiceNumber} ${invoice.status === 'paid' ? 'paid' : 'generated'} - ₹${invoice.total}`,
        timestamp: this.getTimeAgo(invoice.createdAt),
        type: 'invoice',
      });
    });

    // Sort by timestamp (newest first)
    activities.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    return activities.slice(0, 10);
  }

  static async getAdminData(tenantId: string): Promise<AdminData> {
    // Get real admin data
    const [totalStudents, totalTeachers, totalInvoices, pendingInvoices] = await Promise.all([
      Student.countDocuments({ tenantId, isDeleted: false }),
      Teacher.countDocuments({ tenantId, isDeleted: false }),
      Invoice.countDocuments({ tenantId }),
      Invoice.countDocuments({
        tenantId,
        status: { $in: ['sent', 'partially_paid', 'overdue'] },
      }),
    ]);

    // Get unread messages count (from communication module)
    let newMessages = 0;
    try {
      const Message = mongoose.model('Message');
      // Get all teachers and count unread messages (simplified)
      const teachers = await Teacher.find({ tenantId, isDeleted: false }).select('userId');
      const teacherIds = teachers.map(t => t.userId);
      newMessages = await Message.countDocuments({
        tenantId,
        recipientId: { $in: teacherIds },
        isRead: false,
        isDeleted: false,
      });
    } catch (error) {
      console.log('Message model not available yet');
    }

    // Get leave requests count
    let leaveRequests = 0;
    try {
      const Leave = mongoose.model('Leave');
      leaveRequests = await Leave.countDocuments({
        tenantId,
        status: 'pending',
      });
    } catch (error) {
      console.log('Leave model not available yet');
    }

    return {
      quickActions: [
        { label: 'Add Student', icon: '➕', path: '/students/add', color: 'blue' },
        { label: 'Add Teacher', icon: '👨‍🏫', path: '/teachers/add', color: 'green' },
        { label: 'Create Class', icon: '📚', path: '/academic/sections/add', color: 'purple' },
        { label: 'Manage Fees', icon: '💰', path: '/fees/invoices', color: 'orange' },
        { label: 'Generate Reports', icon: '📊', path: '/reports', color: 'red' },
        { label: 'Send Announcement', icon: '📢', path: '/announcements', color: 'teal' },
      ],
      quickStats: {
        totalStudents,
        totalTeachers,
        totalInvoices,
        pendingInvoices,
        newMessages,
        leaveRequests,
      },
    };
  }

  static async getTeacherData(userId: string, tenantId: string): Promise<TeacherData> {
    // Get real teacher data
    const teacher = await Teacher.findOne({ userId, tenantId, isDeleted: false });

    if (!teacher) {
      return {
        myClasses: [],
        pendingTasks: [],
      };
    }

    // Get teacher's classes from timetable
    try {
      const TimetableEntry = mongoose.model('TimetableEntry');
      const classes = await TimetableEntry.find({
        tenantId,
        teacherId: teacher._id,
      })
        .populate('subjectId', 'name')
        .populate('sectionId', 'name')
        .populate('gradeId', 'name')
        .limit(5);

      const myClasses = classes.map((cls: any) => ({
        name: `${cls.subjectId?.name || 'Unknown'} - ${cls.gradeId?.name || 'Unknown'}`,
        section: cls.sectionId?.name || 'N/A',
        time: `${cls.startTime} - ${cls.endTime}`,
      }));

      // Get pending assignments to grade
      const Assignment = mongoose.model('Assignment');
      const pendingAssignments = await Assignment.countDocuments({
        tenantId,
        teacherId: teacher._id,
        status: 'published',
      });

      return {
        myClasses: myClasses.slice(0, 5),
        pendingTasks: [
          { title: 'Grade assignments', count: pendingAssignments || 0 },
          { title: 'Prepare lesson plans', count: 0 },
          { title: 'Parent meetings', count: 0 },
        ],
      };
    } catch (error) {
      return {
        myClasses: [],
        pendingTasks: [],
      };
    }
  }

  static async getStudentData(userId: string, tenantId: string): Promise<StudentData> {
    // Get real student data
    const student = await Student.findOne({ userId, tenantId, isDeleted: false });

    if (!student) {
      return {
        timetable: [],
        recentGrades: [],
        upcomingTests: [],
        grade: 'N/A',
        section: 'N/A',
      };
    }

    try {
      // Get student's timetable
      const TimetableEntry = mongoose.model('TimetableEntry');
      const today = new Date();
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = days[today.getDay()];

      const timetable = await TimetableEntry.find({
        tenantId,
        sectionId: student.section || '',
        dayOfWeek: dayName,
      })
        .populate('subjectId', 'name')
        .populate('teacherId', 'firstName lastName')
        .sort({ startTime: 1 })
        .limit(5);

      // Get student's grades
      const Gradebook = mongoose.model('Gradebook');
      const grades = await Gradebook.find({
        tenantId,
        studentId: student._id,
      })
        .populate('subjectId', 'name')
        .sort({ updatedAt: -1 })
        .limit(5);

      // Get student's overall grade
      const overallGrade = grades.length > 0
        ? grades.reduce((acc, g) => acc + (g.averageScore || 0), 0) / grades.length
        : 0;

      // Get upcoming assignments
      const Assignment = mongoose.model('Assignment');
      const assignments = await Assignment.find({
        tenantId,
        sectionId: student.section,
        isPublished: true,
        dueDate: { $gte: new Date() },
      })
        .populate('subjectId', 'name')
        .sort({ dueDate: 1 })
        .limit(5);

      return {
        timetable: timetable.map((cls: any) => ({
          subject: cls.subjectId?.name || 'Unknown',
          time: `${cls.startTime} - ${cls.endTime}`,
          room: cls.roomNumber || 'N/A',
          teacher: cls.teacherId ? `${cls.teacherId.firstName} ${cls.teacherId.lastName}` : 'N/A',
        })),
        recentGrades: grades.map((g: any) => ({
          subject: g.subjectId?.name || 'Unknown',
          grade: g.grade || 'N/A',
          score: `${Math.round(g.averageScore || 0)}%`,
          date: g.updatedAt ? this.getTimeAgo(g.updatedAt) : 'N/A',
        })),
        upcomingTests: assignments.map((a: any) => ({
          title: a.title,
          subject: a.subjectId?.name || 'Unknown',
          dueDate: a.dueDate,
          priority: 'medium',
        })),
        grade: this.calculateGrade(overallGrade),
        section: student.section || 'N/A',
      };
    } catch (error) {
      console.error('Error fetching student data:', error);
      return {
        timetable: [],
        recentGrades: [],
        upcomingTests: [],
        grade: 'N/A',
        section: student.section || 'N/A',
      };
    }
  }

  // Helper method to calculate grade
  private static calculateGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    return 'F';
  }

  static async getGuardianData(userId: string, tenantId: string): Promise<GuardianData> {
    // Get real guardian data
    const students = await Student.find({
      tenantId,
      'guardians.userId': userId,
      isDeleted: false,
    }).select('firstName lastName grade section');

    return {
      children: students.map((s: any) => ({
        name: `${s.firstName} ${s.lastName}`,
        grade: s.grade || 'N/A',
        attendance: '0%',
        grades: 'N/A',
      })),
      feeStatus: {
        current: 'Pending',
        nextDue: 'N/A',
        amount: '₹0',
      },
    };
  }

  private static getTimeAgo(date: Date): string {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  private static formatSchoolCode(code: string): string {
    if (!code || code.length !== 10) return code || '';
    return `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 10)}`;
  }

  static async getStudents(tenantId: string): Promise<any[]> {
    return await Student.find({ tenantId, isDeleted: false })
      .select('firstName lastName grade section')
      .limit(10);
  }

  static async getTeachers(tenantId: string): Promise<any[]> {
    return await Teacher.find({ tenantId, isDeleted: false })
      .select('firstName lastName')
      .limit(10);
  }

  static async getClasses(tenantId: string): Promise<any[]> {
    try {
      const TimetableEntry = mongoose.model('TimetableEntry');
      const sections = await TimetableEntry.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$sectionId', count: { $sum: 1 } } },
        { $limit: 10 },
      ]);
      return sections;
    } catch (error) {
      return [];
    }
  }
}