import mongoose from 'mongoose';
import { Teacher } from '../../models/Teacher';
import { Leave } from '../../models/Leave';
import { User } from '../../models/User';
import { Tenant } from '../../models/Tenant';
import { AppError } from '../../middleware/error-handler';

export class TeacherService {
  // Create teacher with user account
  static async createTeacher(data: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Generate employee ID
      const employeeId = await this.generateEmployeeId(data.tenantId);

      // Check if user already exists
      let userId = data.userId;
      if (!userId) {
        // Create user account for teacher
        const user = await User.create([{
          tenantId: data.tenantId,
          email: data.email,
          passwordHash: data.password || 'Teacher@' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'teacher',
          status: 'active',
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          address: data.address?.street,
        }], { session });

        userId = user[0]._id.toString();
      }

      // Create teacher
      const teacher = await Teacher.create([{
        tenantId: data.tenantId,
        userId,
        employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        nationality: data.nationality,
        religion: data.religion,
        phone: data.phone,
        email: data.email,
        alternativeEmail: data.alternativeEmail,
        address: data.address || {
          city: '',
          state: '',
          country: 'India',
          postalCode: '',
        },
        qualifications: data.qualifications || [],
        experience: data.experience || [],
        subjects: data.subjects || [],
        assignedSections: data.assignedSections || [],
        specialization: data.specialization || [],
        joiningDate: data.joiningDate || new Date(),
        employmentType: data.employmentType || 'permanent',
        contractEndDate: data.contractEndDate,
        salary: data.salary,
        bankDetails: data.bankDetails,
        emergencyContact: data.emergencyContact,
        leaveBalance: {
          annual: 20,
          sick: 10,
          casual: 12,
          other: 5,
        },
        status: 'active',
      }], { session });

      await session.commitTransaction();
      session.endSession();

      return teacher[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Get all teachers with filters
  static async getTeachers(
    tenantId: string,
    filters: {
      status?: string;
      subject?: string;
      employmentType?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const query: any = { tenantId, isDeleted: false };

    if (filters.status) query.status = filters.status;
    if (filters.employmentType) query.employmentType = filters.employmentType;
    if (filters.subject) query.subjects = filters.subject;

    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { employeeId: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [teachers, total] = await Promise.all([
      Teacher.find(query)
        .populate('userId', 'email phone profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Teacher.countDocuments(query),
    ]);

    return {
      items: teachers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get teacher by ID
  static async getTeacherById(teacherId: string) {
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new AppError('Invalid teacher ID', 400);
    }

    const teacher = await Teacher.findById(teacherId)
      .populate('userId', 'email phone profilePicture');

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    return teacher;
  }

  // Update teacher
  static async updateTeacher(teacherId: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new AppError('Invalid teacher ID', 400);
    }

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    // Update user if needed
    if (data.email || data.phone || data.firstName || data.lastName) {
      await User.findByIdAndUpdate(teacher.userId, {
        $set: {
          email: data.email,
          phone: data.phone,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
        },
      });
    }

    return teacher;
  }

  // Soft delete teacher
  static async deleteTeacher(teacherId: string) {
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new AppError('Invalid teacher ID', 400);
    }

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          status: 'inactive',
        },
      },
      { new: true }
    );

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    // Also deactivate user
    await User.findByIdAndUpdate(teacher.userId, {
      $set: { status: 'inactive' },
    });

    return teacher;
  }

  // Assign subject to teacher
  static async assignSubject(teacherId: string, subjectData: any) {
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new AppError('Invalid teacher ID', 400);
    }

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      {
        $push: {
          subjects: subjectData.subjectId,
          assignedSections: {
            sectionId: subjectData.sectionId,
            academicYearId: subjectData.academicYearId,
            subjectId: subjectData.subjectId,
            isPrimary: subjectData.isPrimary || false,
          },
        },
      },
      { new: true }
    );

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    return teacher;
  }

  // Remove subject assignment
  static async removeSubject(teacherId: string, subjectId: string, sectionId: string) {
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new AppError('Invalid teacher ID', 400);
    }

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      {
        $pull: {
          subjects: subjectId,
          assignedSections: { subjectId, sectionId },
        },
      },
      { new: true }
    );

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    return teacher;
  }

  // Get teacher's schedule
  static async getTeacherSchedule(teacherId: string, date?: Date) {
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new AppError('Invalid teacher ID', 400);
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    // Get schedule from Schedule model
    const Schedule = mongoose.model('Schedule');
    const query: any = {
      tenantId: teacher.tenantId,
      teacherId: teacherId,
    };

    if (date) {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      query.date = { $gte: startOfWeek, $lte: endOfWeek };
    }

    const schedule = await Schedule.find(query)
      .populate('subjectId', 'name code')
      .populate('sectionId', 'name')
      .populate('gradeId', 'name')
      .sort({ date: 1, startTime: 1 });

    return schedule;
  }

  // Get teacher statistics
  static async getTeacherStats(tenantId: string) {
    const stats = await Teacher.aggregate([
      { $match: { tenantId, isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const subjectStats = await Teacher.aggregate([
      { $match: { tenantId, isDeleted: false, status: 'active' } },
      { $unwind: '$subjects' },
      {
        $group: {
          _id: '$subjects',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      byStatus: stats,
      bySubject: subjectStats,
      total: stats.reduce((acc, curr) => acc + curr.count, 0),
    };
  }

  // Helper: Generate employee ID
  private static async generateEmployeeId(tenantId: string): Promise<string> {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    const year = new Date().getFullYear().toString().slice(-2);
    const count = await Teacher.countDocuments({ tenantId, isDeleted: false });
    const sequence = String(count + 1).padStart(4, '0');

    return `EMP-${year}-${tenant.slug.toUpperCase().slice(0, 3)}-${sequence}`;
  }
}

// Leave Service
export class LeaveService {
  static async createLeave(data: any) {
    const leave = await Leave.create(data);
    return leave;
  }

  static async getLeaves(
    tenantId: string,
    filters: {
      teacherId?: string;
      status?: string;
      type?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const query: any = { tenantId };

    if (filters.teacherId) query.teacherId = filters.teacherId;
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.startDate && filters.endDate) {
      query.startDate = { $gte: filters.startDate };
      query.endDate = { $lte: filters.endDate };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [leaves, total] = await Promise.all([
      Leave.find(query)
        .populate('teacherId', 'firstName lastName employeeId')
        .populate('approvedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Leave.countDocuments(query),
    ]);

    return {
      items: leaves,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getLeaveById(leaveId: string) {
    if (!mongoose.Types.ObjectId.isValid(leaveId)) {
      throw new AppError('Invalid leave ID', 400);
    }

    const leave = await Leave.findById(leaveId)
      .populate('teacherId', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName');

    if (!leave) {
      throw new AppError('Leave request not found', 404);
    }

    return leave;
  }

  static async updateLeaveStatus(
    leaveId: string,
    status: string,
    approvedBy: string,
    rejectionReason?: string
  ) {
    if (!mongoose.Types.ObjectId.isValid(leaveId)) {
      throw new AppError('Invalid leave ID', 400);
    }

    const update: any = {
      status,
      approvedBy,
      approvedAt: new Date(),
    };

    if (status === 'rejected' && rejectionReason) {
      update.rejectionReason = rejectionReason;
    }

    const leave = await Leave.findByIdAndUpdate(
      leaveId,
      { $set: update },
      { new: true }
    );

    if (!leave) {
      throw new AppError('Leave request not found', 404);
    }

    // Update teacher's leave balance if approved
    if (status === 'approved') {
      const teacher = await Teacher.findById(leave.teacherId);
      if (teacher && teacher.leaveBalance) {
        const balanceKey = leave.type as keyof typeof teacher.leaveBalance;
        if (teacher.leaveBalance[balanceKey] !== undefined) {
          teacher.leaveBalance[balanceKey] -= leave.totalDays;
          await teacher.save();
        }
      }
    }

    return leave;
  }

  static async getLeaveBalance(teacherId: string) {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    return teacher.leaveBalance;
  }

  static async deleteLeave(leaveId: string) {
    if (!mongoose.Types.ObjectId.isValid(leaveId)) {
      throw new AppError('Invalid leave ID', 400);
    }

    const leave = await Leave.findByIdAndDelete(leaveId);
    if (!leave) {
      throw new AppError('Leave request not found', 404);
    }

    return leave;
  }
}