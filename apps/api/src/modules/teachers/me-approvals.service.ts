import mongoose from 'mongoose';
import { Teacher } from '../../models/Teacher';
import { Student } from '../../models/Student';
import { Section } from '../../models/Section';
import { User } from '../../models/User';
import { AppError } from '../../middleware/error-handler';
import {
  sendUserApprovedEmail,
  sendUserRejectedEmail,
} from '../../services/email.service';

const LOGIN_URL = `${
  process.env.FRONTEND_URL || 'http://localhost:5173'
}/login`;

/* ─────────────────────────────────────────────────────────────
   Local shapes
   ─────────────────────────────────────────────────────────────
   Guardian is a subdocument on Student. When using `.lean()`,
   Mongoose returns these as loosely-typed plain objects, which
   trips `noImplicitAny` in strict mode. We pin the shape here.
   ───────────────────────────────────────────────────────────── */

interface GuardianSub {
  userId?: string;
  name?: string;
  phone?: string;
  email?: string;
  isVerified?: boolean;
}

interface LeanStudent {
  _id: any;
  userId: string;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  grade: string;
  section?: string;
  sectionId?: string;
  status: string;
  dateOfBirth?: Date;
  gender?: string;
  guardians?: GuardianSub[];
  createdAt: Date;
}

/**
 * Teacher-side approval service.
 *
 * Scope: only students/guardians whose section has this teacher as
 * `Section.classTeacherId`. School admins still have their own broader
 * approval flow at /admin/approvals/*; this is the teacher-scoped view.
 *
 * Approval model: first-to-act wins. Once a student/guardian flips to
 * active/rejected, it disappears from both queues.
 */
export class TeacherApprovalsService {
  /* ─────────────────────────────────────────────────────────────
     Helpers
     ───────────────────────────────────────────────────────────── */

  /**
   * Return the section IDs this teacher is class teacher of.
   * Returns [] if the teacher is not a class teacher of any section.
   */
  static async getMySectionIds(
    tenantId: string,
    teacherUserId: string,
  ): Promise<string[]> {
    const teacher = await Teacher.findOne({
      tenantId,
      userId: teacherUserId,
      isDeleted: false,
    })
      .select('_id')
      .lean();

    if (!teacher) return [];

    const sections = await Section.find({
      tenantId,
      classTeacherId: teacher._id.toString(),
      status: 'active',
    })
      .select('_id')
      .lean();

    return sections.map(s => s._id.toString());
  }

  /**
   * Same as above but returns full section docs — used by the roster
   * page to display class name alongside students.
   */
  static async getMySections(tenantId: string, teacherUserId: string) {
    const teacher = await Teacher.findOne({
      tenantId,
      userId: teacherUserId,
      isDeleted: false,
    })
      .select('_id')
      .lean();

    if (!teacher) return [];

    return Section.find({
      tenantId,
      classTeacherId: teacher._id.toString(),
      status: 'active',
    })
      .select('_id name code gradeId classTeacherId')
      .lean();
  }

  /* ─────────────────────────────────────────────────────────────
     LISTS
     ───────────────────────────────────────────────────────────── */

  /**
   * Pending students in sections this teacher is class teacher of.
   */
  static async listPendingStudents(
    tenantId: string,
    teacherUserId: string,
  ) {
    const sectionIds = await this.getMySectionIds(tenantId, teacherUserId);

    if (sectionIds.length === 0) {
      return { items: [], total: 0 };
    }

    const students = await Student.find({
      tenantId,
      sectionId: { $in: sectionIds },
      status: 'pending',
      isDeleted: false,
    })
      .select(
        '_id userId admissionNo rollNo firstName lastName grade section sectionId dateOfBirth gender guardians createdAt',
      )
      .sort({ createdAt: -1 })
      .lean();

    const sectionMap = await this.buildSectionMap(tenantId, sectionIds);

    const items = (students as unknown as LeanStudent[]).map(s => ({
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

  /**
   * Pending guardians linked to students in sections this teacher owns.
   *
   * "Pending guardian" = a User with role 'guardian' and status 'pending'
   * whose _id appears in any of my students' guardians[].userId.
   */
  static async listPendingGuardians(
    tenantId: string,
    teacherUserId: string,
  ) {
    const sectionIds = await this.getMySectionIds(tenantId, teacherUserId);

    if (sectionIds.length === 0) {
      return { items: [], total: 0 };
    }

    // Students in my sections that have at least one linked guardian userId
    const students = await Student.find({
      tenantId,
      sectionId: { $in: sectionIds },
      isDeleted: false,
      'guardians.userId': { $exists: true, $ne: null },
    })
      .select('_id firstName lastName grade section sectionId guardians')
      .lean();

    // Collect unique guardian user IDs
    const guardianIds = new Set<string>();
    for (const s of students as unknown as LeanStudent[]) {
      for (const g of s.guardians || []) {
        if (g.userId) guardianIds.add(g.userId);
      }
    }

    if (guardianIds.size === 0) {
      return { items: [], total: 0 };
    }

    // Fetch guardian User docs that are still pending
    const guardians = await User.find({
      tenantId,
      _id: { $in: [...guardianIds] },
      role: 'guardian',
      status: 'pending',
    })
      .select('_id email firstName lastName phone createdAt')
      .sort({ createdAt: -1 })
      .lean();

    if (guardians.length === 0) {
      return { items: [], total: 0 };
    }

    // For each pending guardian, find which of my students they're linked to
    const guardianIdList = guardians.map(g => g._id.toString());

    const linkedStudents = await Student.find({
      tenantId,
      sectionId: { $in: sectionIds },
      isDeleted: false,
      'guardians.userId': { $in: guardianIdList },
    })
      .select('_id firstName lastName grade section admissionNo guardians')
      .lean();

    const byGuardian = new Map<
      string,
      {
        _id: string;
        name: string;
        grade: string;
        section: string;
        admissionNo: string;
      }[]
    >();

    for (const s of linkedStudents as unknown as LeanStudent[]) {
      const student = {
        _id: s._id.toString(),
        name: `${s.firstName} ${s.lastName}`.trim(),
        grade: s.grade,
        section: s.section || '',
        admissionNo: s.admissionNo,
      };

      for (const g of s.guardians || []) {
        if (!g.userId) continue;
        if (!guardianIdList.includes(g.userId)) continue;

        const list = byGuardian.get(g.userId) || [];
        list.push(student);
        byGuardian.set(g.userId, list);
      }
    }

    const items = guardians.map(g => ({
      _id: g._id.toString(),
      email: g.email,
      firstName: g.firstName,
      lastName: g.lastName,
      name: `${g.firstName} ${g.lastName}`.trim(),
      phone: g.phone || '',
      children: byGuardian.get(g._id.toString()) || [],
      createdAt: (g as typeof g & { createdAt?: Date }).createdAt,
    }));

    return { items, total: items.length };
  }

  /**
   * Full roster of students in my sections (any status), enriched with
   * guardian verification status. Used by the Class Roster page.
   */
  static async getClassRoster(
    tenantId: string,
    teacherUserId: string,
  ) {
    const sections = await this.getMySections(tenantId, teacherUserId);

    if (sections.length === 0) {
      return { sections: [], students: [], total: 0 };
    }

    const sectionIds = sections.map(s => s._id.toString());

    const students = await Student.find({
      tenantId,
      sectionId: { $in: sectionIds },
      isDeleted: false,
    })
      .select(
        '_id userId admissionNo rollNo firstName lastName grade section sectionId status guardians createdAt',
      )
      .sort({ rollNo: 1 })
      .lean();

    const items = (students as unknown as LeanStudent[]).map(s => {
      const linkedGuardians = (s.guardians || []).filter(
        g => !!g.userId,
      );
      const verifiedGuardians = linkedGuardians.filter(
        g => g.isVerified === true,
      );

      return {
        _id: s._id.toString(),
        userId: s.userId,
        admissionNo: s.admissionNo,
        rollNo: s.rollNo,
        name: `${s.firstName} ${s.lastName}`.trim(),
        firstName: s.firstName,
        lastName: s.lastName,
        grade: s.grade,
        sectionId: s.sectionId || null,
        status: s.status,
        guardianCount: linkedGuardians.length,
        verifiedGuardianCount: verifiedGuardians.length,
        createdAt: s.createdAt,
      };
    });

    return {
      sections: sections.map(s => ({
        _id: s._id.toString(),
        name: s.name,
        code: s.code,
      })),
      students: items,
      total: items.length,
    };
  }

  /* ─────────────────────────────────────────────────────────────
     ACTIONS — STUDENTS
     ───────────────────────────────────────────────────────────── */

  static async approveStudent(
    tenantId: string,
    teacherUserId: string,
    studentId: string,
    approverEmail: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID', 400);
    }

    const sectionIds = await this.getMySectionIds(tenantId, teacherUserId);

    const student = await Student.findOne({
      _id: studentId,
      tenantId,
      sectionId: { $in: sectionIds },
      isDeleted: false,
    });

    if (!student) {
      throw new AppError(
        'Student not found in any section you are class teacher of',
        404,
      );
    }

    if (student.status !== 'pending') {
      throw new AppError('Student is not pending', 400);
    }

    student.status = 'active';
    student.approvedBy = approverEmail;
    student.approvedAt = new Date();
    await student.save();

    // Also flip the linked User so they can log in
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
        console.error('Failed to send student approval email:', err);
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
    teacherUserId: string,
    studentId: string,
    rejectorEmail: string,
    reason: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID', 400);
    }

    const sectionIds = await this.getMySectionIds(tenantId, teacherUserId);

    const student = await Student.findOne({
      _id: studentId,
      tenantId,
      sectionId: { $in: sectionIds },
      isDeleted: false,
    });

    if (!student) {
      throw new AppError(
        'Student not found in any section you are class teacher of',
        404,
      );
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
        console.error('Failed to send student rejection email:', err);
      }
    }

    return {
      _id: student._id.toString(),
      status: student.status,
      rejectionReason: reason,
    };
  }

  /* ─────────────────────────────────────────────────────────────
     ACTIONS — GUARDIANS
     ───────────────────────────────────────────────────────────── */

  static async approveGuardian(
    tenantId: string,
    teacherUserId: string,
    guardianUserId: string,
    approverEmail: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(guardianUserId)) {
      throw new AppError('Invalid guardian ID', 400);
    }

    const sectionIds = await this.getMySectionIds(tenantId, teacherUserId);

    if (sectionIds.length === 0) {
      throw new AppError('You are not a class teacher of any section', 403);
    }

    // Ensure this guardian is linked to at least one of my students
    const linked = await Student.findOne({
      tenantId,
      sectionId: { $in: sectionIds },
      isDeleted: false,
      'guardians.userId': guardianUserId,
    }).select('_id');

    if (!linked) {
      throw new AppError(
        'Guardian is not linked to any student in your sections',
        404,
      );
    }

    const user = await User.findOneAndUpdate(
      {
        _id: guardianUserId,
        tenantId,
        role: 'guardian',
      },
      {
        $set: {
          status: 'active',
          approvedBy: approverEmail,
          approvedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!user) {
      throw new AppError('Guardian not found', 404);
    }

    // Flip isVerified on every linked student's guardian record
    await Student.updateMany(
      {
        tenantId,
        sectionId: { $in: sectionIds },
        'guardians.userId': guardianUserId,
      },
      { $set: { 'guardians.$[g].isVerified': true } },
      { arrayFilters: [{ 'g.userId': guardianUserId }] },
    );

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
        console.error('Failed to send guardian approval email:', err);
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
    teacherUserId: string,
    guardianUserId: string,
    rejectorEmail: string,
    reason: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(guardianUserId)) {
      throw new AppError('Invalid guardian ID', 400);
    }

    const sectionIds = await this.getMySectionIds(tenantId, teacherUserId);

    if (sectionIds.length === 0) {
      throw new AppError('You are not a class teacher of any section', 403);
    }

    const linked = await Student.findOne({
      tenantId,
      sectionId: { $in: sectionIds },
      isDeleted: false,
      'guardians.userId': guardianUserId,
    }).select('_id');

    if (!linked) {
      throw new AppError(
        'Guardian is not linked to any student in your sections',
        404,
      );
    }

    const user = await User.findOneAndUpdate(
      {
        _id: guardianUserId,
        tenantId,
        role: 'guardian',
      },
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
        console.error('Failed to send guardian rejection email:', err);
      }
    }

    return {
      _id: user._id.toString(),
      status: user.status,
      rejectionReason: reason,
    };
  }

  /* ─────────────────────────────────────────────────────────────
     Internal helpers
     ───────────────────────────────────────────────────────────── */

  private static async buildSectionMap(
    tenantId: string,
    sectionIds: string[],
  ): Promise<Map<string, string>> {
    const sections = await Section.find({
      tenantId,
      _id: { $in: sectionIds },
    })
      .select('_id name')
      .lean();

    return new Map(sections.map(s => [s._id.toString(), s.name]));
  }
}