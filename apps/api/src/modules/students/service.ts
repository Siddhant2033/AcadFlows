import mongoose from 'mongoose';
import { Student } from '../../models/Student';
import { User } from '../../models/User';
import { Tenant } from '../../models/Tenant';
import { AcademicYear } from '../../models/AcademicYear';
import { AppError } from '../../middleware/error-handler';

export class StudentService {
  /**
   * Public — minimal student list for a tenant.
   */
  static async getPublicStudentList(tenantId: string) {
    return await Student.find({
      tenantId,
      status: 'active',
      isDeleted: false,
    })
      .select('_id firstName lastName grade section rollNo admissionNo')
      .sort({ grade: 1, section: 1, rollNo: 1 });
  }

  /**
   * Public — verify a roll number and check if a guardian is already linked.
   */
  static async verifyRollNo(tenantId: string, rollNo: string) {
    const student = await Student.findOne({
      tenantId,
      rollNo,
      status: 'active',
      isDeleted: false,
    });

    if (!student) {
      throw new AppError('Student not found with this roll number', 404);
    }

    const hasGuardian = student.guardians.some(g => !!g.userId);

    return {
      student: {
        id: student._id.toString(),
        firstName: student.firstName,
        lastName: student.lastName,
        grade: student.grade,
        section: student.section || '',
        rollNo: student.rollNo,
        hasGuardian,
      },
    };
  }

  // ─── Authenticated operations ──────────────────────────────

  static async createStudent(data: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const admissionNo = await this.generateAdmissionNumber(data.tenantId);
      const rollNo = await this.generateRollNumber(data.tenantId, data.grade);

      let userId = data.userId;
      if (!userId) {
        const user = await User.create(
          [
            {
              tenantId: data.tenantId,
              email: data.email,
              passwordHash: data.password,
              firstName: data.firstName,
              lastName: data.lastName,
              role: 'student',
              status: 'active',
              phone: data.phone,
              dateOfBirth: data.dateOfBirth,
              gender: data.gender,
              address: data.address?.street,
            },
          ],
          { session },
        );

        userId = user[0]._id.toString();
      }

      // Auto-create enrollment if sectionId provided
      const enrollments: any[] = data.enrollments || [];
      if (enrollments.length === 0 && data.sectionId) {
        const currentYear = await AcademicYear.findOne({
          tenantId: data.tenantId,
          isCurrent: true,
        });

        if (currentYear) {
          enrollments.push({
            academicYearId: currentYear._id.toString(),
            sectionId: data.sectionId,
            rollNo,
            enrollmentDate: new Date(),
            status: 'active',
          });
        }
      }

      const student = await Student.create(
        [
          {
            tenantId: data.tenantId,
            userId,
            admissionNo,
            rollNo,
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName,
            grade: data.grade,
            section: data.section,
            sectionId: data.sectionId || undefined,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            bloodGroup: data.bloodGroup,
            nationality: data.nationality,
            religion: data.religion,
            motherTongue: data.motherTongue,
            guardians: data.guardians || [],
            address: data.address || {
              city: '',
              state: '',
              country: 'India',
              postalCode: '',
            },
            emergencyContact: data.emergencyContact,
            previousSchool: data.previousSchool,
            medicalInfo: data.medicalInfo,
            enrollments,
            status: 'active',
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return student[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async getStudents(
    tenantId: string,
    filters: {
      grade?: string;
      section?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const query: any = { tenantId, isDeleted: false };

    if (filters.grade) query.grade = filters.grade;
    if (filters.section) query.section = filters.section;
    if (filters.status) query.status = filters.status;

    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { admissionNo: { $regex: filters.search, $options: 'i' } },
        { rollNo: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('userId', 'email phone profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Student.countDocuments(query),
    ]);

    return {
      items: students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getStudentById(studentId: string) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID', 400);
    }

    const student = await Student.findById(studentId).populate(
      'userId',
      'email phone profilePicture',
    );

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    return student;
  }

  static async getStudentByAdmissionNo(admissionNo: string, tenantId: string) {
    const student = await Student.findOne({ tenantId, admissionNo, isDeleted: false });
    if (!student) {
      throw new AppError('Student not found with this admission number', 404);
    }
    return student;
  }

  static async updateStudent(studentId: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID', 400);
    }

    if (data.grade) {
      const student = await Student.findById(studentId);
      if (student && student.grade !== data.grade) {
        data.rollNo = await this.generateRollNumber(student.tenantId, data.grade);
      }
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    if (data.email || data.phone || data.firstName || data.lastName) {
      await User.findByIdAndUpdate(student.userId, {
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

    return student;
  }

  static async deleteStudent(studentId: string) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID', 400);
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          status: 'inactive',
        },
      },
      { new: true },
    );

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    await User.findByIdAndUpdate(student.userId, {
      $set: { status: 'inactive' },
    });

    return student;
  }

  static async enrollStudent(studentId: string, enrollmentData: any) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID', 400);
    }

    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const existingEnrollment = student.enrollments.find(
      e => e.academicYearId === enrollmentData.academicYearId,
    );

    if (existingEnrollment) {
      throw new AppError('Student already enrolled in this academic year', 409);
    }

    const rollNo = await this.generateRollNumber(
      student.tenantId,
      student.grade,
      enrollmentData.sectionId,
    );

    student.enrollments.push({
      academicYearId: enrollmentData.academicYearId,
      sectionId: enrollmentData.sectionId,
      rollNo,
      enrollmentDate: new Date(),
      status: 'active',
    });

    if (!student.grade) student.grade = enrollmentData.grade;
    if (!student.section) student.section = enrollmentData.sectionName;
    if (!student.sectionId) student.sectionId = enrollmentData.sectionId;

    await student.save();
    return student;
  }

  static async withdrawStudent(studentId: string, reason: string) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID', 400);
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          status: 'withdrawn',
          'enrollments.$[elem].status': 'withdrawn',
          'enrollments.$[elem].withdrawalDate': new Date(),
          'enrollments.$[elem].withdrawalReason': reason,
        },
      },
      {
        new: true,
        arrayFilters: [{ 'elem.status': 'active' }],
      },
    );

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    return student;
  }

  static async bulkImportStudents(tenantId: string, studentsData: any[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const data of studentsData) {
      try {
        if (!data.firstName || !data.lastName || !data.email || !data.grade) {
          results.failed++;
          results.errors.push({
            row: data,
            error: 'Missing required fields (firstName, lastName, email, grade)',
          });
          continue;
        }

        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
          results.failed++;
          results.errors.push({
            row: data,
            error: `User with email ${data.email} already exists`,
          });
          continue;
        }

        const tempPassword =
          'Student@' + Math.random().toString(36).substring(2, 8).toUpperCase();

        await this.createStudent({
          tenantId,
          email: data.email,
          password: tempPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          grade: data.grade,
          section: data.section,
          dateOfBirth: data.dateOfBirth
            ? new Date(data.dateOfBirth)
            : new Date('2000-01-01'),
          gender: data.gender || 'other',
          phone: data.phone,
          address: {
            street: data.address,
            city: data.city || '',
            state: data.state || '',
            country: data.country || 'India',
            postalCode: data.postalCode || '',
          },
          guardians: data.guardianName
            ? [
                {
                  name: data.guardianName,
                  phone: data.guardianPhone || '',
                  relationship: data.guardianRelationship || 'guardian',
                  isVerified: false,
                },
              ]
            : [],
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: data,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  static async uploadDocument(studentId: string, documentData: any) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID', 400);
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      {
        $push: {
          documents: {
            ...documentData,
            uploadedAt: new Date(),
          },
        },
      },
      { new: true },
    );

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    return student.documents[student.documents.length - 1];
  }

  static async getStudentStats(tenantId: string) {
    const stats = await Student.aggregate([
      { $match: { tenantId, isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const gradeStats = await Student.aggregate([
      { $match: { tenantId, isDeleted: false, status: 'active' } },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      byStatus: stats,
      byGrade: gradeStats,
      total: stats.reduce((acc, curr) => acc + curr.count, 0),
    };
  }

  // ─── Helpers ───────────────────────────────────────────────

  private static async generateAdmissionNumber(tenantId: string): Promise<string> {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    const year = new Date().getFullYear().toString().slice(-2);
    const count = await Student.countDocuments({ tenantId, isDeleted: false });
    const sequence = String(count + 1).padStart(4, '0');

    return `${year}-${tenant.slug.toUpperCase().slice(0, 3)}-${sequence}`;
  }

  private static async generateRollNumber(
    tenantId: string,
    grade: string,
    sectionId?: string,
  ): Promise<string> {
    const studentsInGrade = await Student.countDocuments({
      tenantId,
      grade,
      isDeleted: false,
    });

    const gradePrefix = grade.replace(/\s/g, '').toUpperCase();
    const sectionPrefix = sectionId ? sectionId.slice(-1).toUpperCase() : '';
    const number = String(studentsInGrade + 1).padStart(3, '0');

    return `${gradePrefix}${sectionPrefix}${number}`;
  }
}