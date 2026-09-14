import { User } from '../models/User';
import { Teacher } from '../models/Teacher';
import { Student } from '../models/Student';
import { Tenant } from '../models/Tenant';
import { sendApprovalReminderEmail } from '../services/email.service';

/* ─────────────────────────────────────────────────────────────
   Approval deadline configuration
   ───────────────────────────────────────────────────────────── */

const APPROVAL_WINDOWS = {
  school: 48 * 60 * 60 * 1000,        // 48 hours for platform admin
  admin: 24 * 60 * 60 * 1000,          // 24 hours for existing admin
  teacher: 72 * 60 * 60 * 1000,        // 72 hours for school admin
  student: 48 * 60 * 60 * 1000,        // 48 hours for class teacher
  guardian: 48 * 60 * 60 * 1000,       // 48 hours for class teacher
};

/* ─────────────────────────────────────────────────────────────
   Approval decision helpers
   ───────────────────────────────────────────────────────────── */

export interface ApprovalContext {
  tenantId: string;
  role: 'admin' | 'teacher' | 'student' | 'guardian';
}

/**
 * Determine who should approve a given role's registration.
 * Returns null if auto-approval applies.
 */
export async function getApprover(
  ctx: ApprovalContext,
): Promise<{ type: 'auto' } | { type: 'user'; userId: string; email: string; name: string } | { type: 'platform' } | { type: 'none' }> {
  // ADMINS: first admin is auto-approved; subsequent require existing admin
  if (ctx.role === 'admin') {
    const existingAdmin = await User.findOne({
      tenantId: ctx.tenantId,
      role: 'admin',
      status: 'active',
    }).lean();

    if (!existingAdmin) {
      return { type: 'auto' };
    }

    return {
      type: 'user',
      userId: existingAdmin._id.toString(),
      email: existingAdmin.email,
      name: `${existingAdmin.firstName} ${existingAdmin.lastName}`,
    };
  }

  // TEACHERS: approved by any school admin
  if (ctx.role === 'teacher') {
    const admin = await User.findOne({
      tenantId: ctx.tenantId,
      role: 'admin',
      status: 'active',
    }).lean();

    if (!admin) {
      return { type: 'platform' };
    }

    return {
      type: 'user',
      userId: admin._id.toString(),
      email: admin.email,
      name: `${admin.firstName} ${admin.lastName}`,
    };
  }

  // STUDENTS/GUARDIANS: approved by class teacher, fallback to admin
  if (ctx.role === 'student' || ctx.role === 'guardian') {
    // We don't know the section yet at this point — caller must supply it
    // For now, defer to admin. Caller can override.
    const admin = await User.findOne({
      tenantId: ctx.tenantId,
      role: 'admin',
      status: 'active',
    }).lean();

    if (admin) {
      return {
        type: 'user',
        userId: admin._id.toString(),
        email: admin.email,
        name: `${admin.firstName} ${admin.lastName}`,
      };
    }

    return { type: 'platform' };
  }

  return { type: 'none' };
}

/**
 * Set the approval deadline on a pending record.
 */
export function setApprovalDeadline(
  role: 'admin' | 'teacher' | 'student' | 'guardian' | 'school',
  fromDate: Date = new Date(),
): Date {
  const window = APPROVAL_WINDOWS[role] || 48 * 60 * 60 * 1000;
  return new Date(fromDate.getTime() + window);
}

/**
 * Approve a User (updates status, sets audit fields).
 */
export async function approveUser(
  userId: string,
  approverEmail: string,
): Promise<any> {
  return User.findByIdAndUpdate(
    userId,
    {
      $set: {
        status: 'active',
        approvedBy: approverEmail,
        approvedAt: new Date(),
        approvalDueBy: undefined,
        escalatedAt: undefined,
      },
    },
    { new: true },
  );
}

/**
 * Reject a User.
 */
export async function rejectUser(
  userId: string,
  approverEmail: string,
  reason: string,
): Promise<any> {
  return User.findByIdAndUpdate(
    userId,
    {
      $set: {
        status: 'rejected',
        rejectedBy: approverEmail,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    },
    { new: true },
  );
}

/**
 * Approve a Teacher.
 */
export async function approveTeacher(
  teacherId: string,
  approverEmail: string,
): Promise<any> {
  const teacher = await Teacher.findByIdAndUpdate(
    teacherId,
    {
      $set: {
        status: 'active',
        approvedBy: approverEmail,
        approvedAt: new Date(),
        approvalDueBy: undefined,
        escalatedAt: undefined,
      },
    },
    { new: true },
  );

  if (teacher) {
    await User.findByIdAndUpdate(teacher.userId, {
      $set: {
        status: 'active',
        approvedBy: approverEmail,
        approvedAt: new Date(),
      },
    });
  }

  return teacher;
}

/**
 * Approve a Student.
 */
export async function approveStudent(
  studentId: string,
  approverEmail: string,
): Promise<any> {
  const student = await Student.findByIdAndUpdate(
    studentId,
    {
      $set: {
        status: 'active',
        approvedBy: approverEmail,
        approvedAt: new Date(),
        approvalDueBy: undefined,
        escalatedAt: undefined,
      },
    },
    { new: true },
  );

  if (student) {
    await User.findByIdAndUpdate(student.userId, {
      $set: {
        status: 'active',
        approvedBy: approverEmail,
        approvedAt: new Date(),
      },
    });
  }

  return student;
}

/**
 * Get pending count for a user (their approval inbox).
 */
export async function getPendingCountForApprover(
  tenantId: string,
  approverRole: 'admin' | 'teacher',
): Promise<number> {
  if (approverRole === 'admin') {
    return Teacher.countDocuments({
      tenantId,
      status: 'pending',
      isDeleted: false,
    });
  }

  // Teachers see pending students in their sections
  // (this requires knowing their sections, caller should filter)
  return 0;
}

/**
 * Find all approvals that are overdue and need escalation.
 * Used by a cron job or manual trigger.
 */
export async function findOverdueApprovals(tenantId?: string): Promise<{
  users: any[];
  teachers: any[];
  students: any[];
}> {
  const now = new Date();
  const baseFilter: any = {
    status: 'pending',
    approvalDueBy: { $lt: now },
    escalatedAt: { $exists: false },
  };

  if (tenantId) {
    baseFilter.tenantId = tenantId;
  }

  const [users, teachers, students] = await Promise.all([
    User.find(baseFilter).lean(),
    Teacher.find({ ...baseFilter, isDeleted: false }).lean(),
    Student.find({ ...baseFilter, isDeleted: false }).lean(),
  ]);

  return { users, teachers, students };
}