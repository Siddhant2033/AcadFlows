import mongoose from 'mongoose';
import { User } from '../../models/User';
import { Teacher } from '../../models/Teacher';
import { Student } from '../../models/Student';
import { Section } from '../../models/Section';
import { AppError } from '../../middleware/error-handler';
import {
  sendUserApprovedEmail,
  sendUserRejectedEmail,
} from '../../services/email.service';

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

const LOGIN_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

/* ─────────────────────────────────────────────────────────────
   Service
   ───────────────────────────────────────────────────────────── */

export class ApprovalsService {
  /* ═══════════════════════════════════════════════════════════
     LISTS
     ═══════════════════════════════════════════════════════════ */

  static async listPendingTeachers(tenantId: string) {
    const teachers = await Teacher.find({
      tenantId,
      status: 'pending',
      isDeleted: false,
    })
      .select(
        '_id userId employeeId firstName lastName email phone subjects qualifications createdAt status',
      )
      .sort({ createdAt: -1 })
      .lean();

    // Enrich subject names
    const Subject = mongoose.model('Subject');
    const allSubjectIds = teachers.flatMap(t => t.subjects || []);
    const subjects = await Subject.find({
      tenantId,
      _id: { $in: allSubjectIds },
    })
      .select('_id name code')
      .lean();
    const subjectMap = new Map(subjects.map((s: any) => [s._id.toString(), s]));

    const items = teachers.map((t: any) => ({
      _id: t._id.toString(),
      userId: t.userId,
      employeeId: t.employeeId,
      firstName: t.firstName,
      lastName: t.lastName,
      name: `${t.firstName} ${t.lastName}`.trim(),
      email: t.email,
      phone: t.phone || '',
      subjects: (t.subjects || [])
        .map((id: string) => subjectMap.get(id) || null)
        .filter(Boolean)
        .map((s: any) => ({ name: s.name, code: s.code })),
      qualifications: t.qualifications || [],
      createdAt: t.createdAt,
    }));

    return { items, total: items.length };
  }

  static async listPendingStudents(tenantId: string) {
    const students = await Student.find({
      tenantId,
      status: 'pending',
      isDeleted: false,
    })
      .select(
        '_id userId admissionNo rollNo firstName lastName grade section sectionId dateOfBirth gender guardians createdAt',
      )
      .sort({ createdAt: -1 })
      .lean();

    // Section names
    const sectionIds = students
      .map((s: any) => s.sectionId)
      .filter((id): id is string => Boolean(id));
    const sections = await Section.find({
      tenantId,
      _id: { $in: sectionIds },
    })
      .select('_id name')
      .lean();
    const sectionMap = new Map(sections.map((s: any) => [s._id.toString(), s.name]));

    const items = students.map((s: any) => ({
      _id: s._id.toString(),
      userId: s.userId,
      admissionNo: s.admissionNo,
      rollNo: s.rollNo,
      firstName: s.firstName,
      lastName: s.lastName,
      name: `${s.firstName} ${s.lastName}`.trim(),
      grade: s.grade,
      section: s.sectionId
        ? sectionMap.get(s.sectionId) || s.section || ''
        : s.section || '',
      sectionId: s.sectionId || null,
      dateOfBirth: s.dateOfBirth,
      gender: s.gender,
      guardianName: s.guardians?.[0]?.name || '',
      guardianPhone: s.guardians?.[0]?.phone || '',
      createdAt: s.createdAt,
    }));

    return { items, total: items.length };
  }

  static async listPendingGuardians(tenantId: string) {
    const guardians = await User.find({
      tenantId,
      role: 'guardian',
      status: 'pending',
    })
      .select('_id email firstName lastName phone createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // For each guardian, find their linked students
    const items = await Promise.all(
      guardians.map(async (g: any) => {
        const linkedStudents = await Student.find({
          tenantId,
          'guardians.userId': g._id.toString(),
          isDeleted: false,
        })
          .select('_id firstName lastName grade section admissionNo')
          .lean();

        return {
          _id: g._id.toString(),
          email: g.email,
          firstName: g.firstName,
          lastName: g.lastName,
          name: `${g.firstName} ${g.lastName}`.trim(),
          phone: g.phone || '',
          children: linkedStudents.map((s: any) => ({
            _id: s._id.toString(),
            name: `${s.firstName} ${s.lastName}`.trim(),
            grade: s.grade,
            section: s.section || '',
            admissionNo: s.admissionNo,
          })),
          createdAt: g.createdAt,
        };
      }),
    );

    return { items, total: items.length };
  }

  static async getPendingCounts(tenantId: string) {
    const [teachers, students, guardians] = await Promise.all([
      Teacher.countDocuments({ tenantId, status: 'pending', isDeleted: false }),
      Student.countDocuments({ tenantId, status: 'pending', isDeleted: false }),
      User.countDocuments({ tenantId, role: 'guardian', status: 'pending' }),
    ]);

    return {
      teachers,
      students,
      guardians,
      total: teachers + students + guardians,
    };
  }

  /* ═══════════════════════════════════════════════════════════
     ACTIONS — TEACHERS
     ═══════════════════════════════════════════════════════════ */

  static async approveTeacher(
    tenantId: string,
    teacherId: string,
    approverEmail: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new AppError('Invalid teacher ID', 400);
    }

    const teacher = await Teacher.findOne({
      _id: teacherId,
      tenantId,
      isDeleted: false,
    });

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    if (teacher.status !== 'pending') {
      throw new AppError('Teacher is not in pending state', 400);
    }

    // Approve teacher
    teacher.status = 'active';
    teacher.approvedBy = approverEmail;
    teacher.approvedAt = new Date();
    await teacher.save();

    // Approve linked user
    const user = await User.findByIdAndUpdate(
      teacher.userId,
      {
        $set: {
          status: 'active',
          approvedBy: approverEmail,
          approvedAt: new Date(),
        },
      },
      { new: true },
    );

    // Send email (stubbed)
    if (user?.email) {
      try {
        await sendUserApprovedEmail(
          user.email,
          `${user.firstName} ${user.lastName}`.trim(),
          'Teacher',
          'your school',
          LOGIN_URL,
        );
      } catch (err) {
        console.error('Failed to send approval email:', err);
      }
    }

    return {
      _id: teacher._id.toString(),
      status: teacher.status,
      name: `${teacher.firstName} ${teacher.lastName}`.trim(),
    };
  }

  static async rejectTeacher(
    tenantId: string,
    teacherId: string,
    rejectorEmail: string,
    reason: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new AppError('Invalid teacher ID', 400);
    }

    const teacher = await Teacher.findOne({
      _id: teacherId,
      tenantId,
      isDeleted: false,
    });

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    teacher.status = 'rejected';
    teacher.rejectedBy = rejectorEmail;
    teacher.rejectedAt = new Date();
    teacher.rejectionReason = reason;
    await teacher.save();

    const user = await User.findByIdAndUpdate(
      teacher.userId,
      {
        $set: {
          status: 'rejected',
          rejectedBy: rejectorEmail,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      },
      { new: true },
    );

    if (user?.email) {
      try {
        await sendUserRejectedEmail(
          user.email,
          `${user.firstName} ${user.lastName}`.trim(),
          'Teacher',
          'your school',
          reason,
        );
      } catch (err) {
        console.error('Failed to send rejection email:', err);
      }
    }

    return {
      _id: teacher._id.toString(),
      status: teacher.status,
      rejectionReason: reason,
    };
  }

  /* ═══════════════════════════════════════════════════════════
     ACTIONS — STUDENTS
     ═══════════════════════════════════════════════════════════ */

  static async approveStudent(
    tenantId: string,
    studentId: string,
    approverEmail: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID', 400);
    }

    const student = await Student.findOne({
      _id: studentId,
      tenantId,
      isDeleted: false,
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    if (student.status !== 'pending') {
      throw new AppError('Student is not in pending state', 400);
    }

    student.status = 'active';
    student.approvedBy = approverEmail;
    student.approvedAt = new Date();
    await student.save();

    const user = await User.findByIdAndUpdate(
      student.userId,
      {
        $set: {
          status: 'active',
          approvedBy: approverEmail,
          approvedAt: new Date(),
        },
      },
      { new: true },
    );

    if (user?.email) {
      try {
        await sendUserApprovedEmail(
          user.email,
          `${user.firstName} ${user.lastName}`.trim(),
          'Student',
          'your school',
          LOGIN_URL,
        );
      } catch (err) {
        console.error('Failed to send approval email:', err);
      }
    }

    return {
      _id: student._id.toString(),
      status: student.status,
      name: `${student.firstName} ${student.lastName}`.trim(),
    };
  }

  static async rejectStudent(
    tenantId: string,
    studentId: string,
    rejectorEmail: string,
    reason: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID', 400);
    }

    const student = await Student.findOne({
      _id: studentId,
      tenantId,
      isDeleted: false,
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    student.status = 'rejected';
    student.rejectedBy = rejectorEmail;
    student.rejectedAt = new Date();
    student.rejectionReason = reason;
    await student.save();

    const user = await User.findByIdAndUpdate(
      student.userId,
      {
        $set: {
          status: 'rejected',
          rejectedBy: rejectorEmail,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      },
      { new: true },
    );

    if (user?.email) {
      try {
        await sendUserRejectedEmail(
          user.email,
          `${user.firstName} ${user.lastName}`.trim(),
          'Student',
          'your school',
          reason,
        );
      } catch (err) {
        console.error('Failed to send rejection email:', err);
      }
    }

    return {
      _id: student._id.toString(),
      status: student.status,
      rejectionReason: reason,
    };
  }

  /* ═══════════════════════════════════════════════════════════
     ACTIONS — GUARDIANS
     ═══════════════════════════════════════════════════════════ */

  static async approveGuardian(
    tenantId: string,
    userId: string,
    approverEmail: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    const user = await User.findOne({
      _id: userId,
      tenantId,
      role: 'guardian',
    });

    if (!user) {
      throw new AppError('Guardian not found', 404);
    }

    user.status = 'active';
    user.approvedBy = approverEmail;
    user.approvedAt = new Date();
    await user.save();

    if (user.email) {
      try {
        await sendUserApprovedEmail(
          user.email,
          `${user.firstName} ${user.lastName}`.trim(),
          'Guardian',
          'your school',
          LOGIN_URL,
        );
      } catch (err) {
        console.error('Failed to send approval email:', err);
      }
    }

    return {
      _id: user._id.toString(),
      status: user.status,
      email: user.email,
    };
  }

  static async rejectGuardian(
    tenantId: string,
    userId: string,
    rejectorEmail: string,
    reason: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, tenantId, role: 'guardian' },
      {
        $set: {
          status: 'rejected',
          rejectedBy: rejectorEmail,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      },
      { new: true },
    );

    if (!user) {
      throw new AppError('Guardian not found', 404);
    }

    if (user.email) {
      try {
        await sendUserRejectedEmail(
          user.email,
          `${user.firstName} ${user.lastName}`.trim(),
          'Guardian',
          'your school',
          reason,
        );
      } catch (err) {
        console.error('Failed to send rejection email:', err);
      }
    }

    return {
      _id: user._id.toString(),
      status: user.status,
      rejectionReason: reason,
    };
  }
}