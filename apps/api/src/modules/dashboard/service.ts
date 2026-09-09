import mongoose from 'mongoose';
import { User } from '../../models/User';
import { Tenant } from '../../models/Tenant';
import { AppError } from '../../middleware/error-handler';

// Mock data for MVP - Replace with actual database queries
export class DashboardService {
  static async getDashboardData(userId: string, tenantId: string, role: string) {
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

    // Get stats based on role
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
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        schoolCode: tenant.schoolCode,
        formattedSchoolCode: this.formatSchoolCode(tenant.schoolCode),
      },
      stats,
      recentActivity,
      ...roleSpecificData,
    };
  }

  static async getStats(tenantId: string, role: string) {
    // For MVP, return mock stats
    // In production, these would be actual database counts
    return {
      totalStudents: 156,
      totalTeachers: 24,
      totalClasses: 12,
      totalSubjects: 8,
      attendance: '94%',
      assignmentsPending: 5,
      upcomingEvents: 3,
      feeCollection: '85%',
    };
  }

  static async getRecentActivity(tenantId: string, userId: string, role: string) {
    // Mock recent activities
    return [
      {
        id: '1',
        icon: '👨‍🎓',
        message: 'New student registered: Michael Johnson',
        timestamp: '2 hours ago',
        type: 'student_registration',
      },
      {
        id: '2',
        icon: '📝',
        message: 'Assignment submitted: Mathematics Quiz',
        timestamp: '4 hours ago',
        type: 'assignment_submission',
      },
      {
        id: '3',
        icon: '💰',
        message: 'Fee payment received: $500 from Sarah Wilson',
        timestamp: '1 day ago',
        type: 'fee_payment',
      },
      {
        id: '4',
        icon: '👨‍🏫',
        message: 'New teacher added: Robert Anderson',
        timestamp: '2 days ago',
        type: 'teacher_registration',
      },
    ];
  }

  static async getAdminData(tenantId: string) {
    return {
      quickActions: [
        { label: 'Add Student', icon: '➕', path: '/students/add' },
        { label: 'Add Teacher', icon: '➕', path: '/teachers/add' },
        { label: 'Create Class', icon: '📚', path: '/classes/add' },
        { label: 'Manage Fees', icon: '💰', path: '/fees' },
      ],
    };
  }

  static async getTeacherData(userId: string, tenantId: string) {
    return {
      myClasses: [
        { name: 'Mathematics - Grade 5', students: 28, time: '9:00 AM' },
        { name: 'Science - Grade 6', students: 25, time: '10:00 AM' },
        { name: 'English - Grade 7', students: 30, time: '11:00 AM' },
      ],
      pendingTasks: [
        { title: 'Grade assignments', count: 8 },
        { title: 'Prepare lesson plans', count: 3 },
        { title: 'Parent meetings', count: 2 },
      ],
    };
  }

  static async getStudentData(userId: string, tenantId: string) {
    return {
      timetable: [
        { subject: 'Mathematics', time: '9:00 - 9:45', room: '101' },
        { subject: 'Science', time: '10:00 - 10:45', room: '102' },
        { subject: 'English', time: '11:00 - 11:45', room: '103' },
      ],
      recentGrades: [
        { subject: 'Mathematics', grade: 'A', date: '2 days ago' },
        { subject: 'Science', grade: 'B+', date: '5 days ago' },
        { subject: 'English', grade: 'A-', date: '1 week ago' },
      ],
      upcomingTests: [
        { subject: 'Mathematics', date: '2024-06-15', weight: '20%' },
        { subject: 'Science', date: '2024-06-18', weight: '25%' },
      ],
    };
  }

  static async getGuardianData(userId: string, tenantId: string) {
    return {
      children: [
        { name: 'Michael Johnson', grade: '5th Grade', attendance: '95%', grades: 'A' },
        { name: 'Emma Johnson', grade: '3rd Grade', attendance: '92%', grades: 'B+' },
      ],
      feeStatus: {
        current: 'Paid',
        nextDue: '2024-06-15',
        amount: '$500',
      },
    };
  }

  static async getStudents(tenantId: string) {
    // Mock students
    return [
      { _id: '1', firstName: 'Michael', lastName: 'Johnson', grade: '5th', section: 'A' },
      { _id: '2', firstName: 'Emma', lastName: 'Williams', grade: '4th', section: 'B' },
      { _id: '3', firstName: 'James', lastName: 'Brown', grade: '3rd', section: 'A' },
    ];
  }

  static async getTeachers(tenantId: string) {
    // Mock teachers
    return [
      { _id: '1', firstName: 'Sarah', lastName: 'Wilson', subject: 'Mathematics' },
      { _id: '2', firstName: 'Robert', lastName: 'Anderson', subject: 'Science' },
      { _id: '3', firstName: 'Lisa', lastName: 'Martinez', subject: 'English' },
    ];
  }

  static async getClasses(tenantId: string) {
    // Mock classes
    return [
      { _id: '1', name: 'Grade 5 - Section A', teacher: 'Sarah Wilson', students: 28 },
      { _id: '2', name: 'Grade 6 - Section B', teacher: 'Robert Anderson', students: 25 },
      { _id: '3', name: 'Grade 7 - Section A', teacher: 'Lisa Martinez', students: 30 },
    ];
  }

  private static formatSchoolCode(code: string): string {
    if (!code || code.length !== 10) return code || '';
    return `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 10)}`;
  }
}