import mongoose from 'mongoose';
import { Attendance, AttendanceSession } from '../../models/Attendance';
import { Student } from '../../models/Student';
import { Teacher } from '../../models/Teacher';
import { AppError } from '../../middleware/error-handler';

// IST is UTC+05:30. Used to normalize dates so "today" means the same
// calendar day regardless of server timezone.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Normalize an input date to IST midnight.
 * Returns both the Date (as a real UTC instant) and the YYYY-MM-DD string.
 */
function normalizeToIST(dateInput: Date | string): { date: Date; dateOnly: string } {
  const raw = new Date(dateInput);
  const istShifted = new Date(raw.getTime() + IST_OFFSET_MS);
  const dateOnly = istShifted.toISOString().split('T')[0];
  const istMidnight = new Date(`${dateOnly}T00:00:00+05:30`);
  return { date: istMidnight, dateOnly };
}

export class AttendanceService {
  // ═══════════════════════════════════════════════════════════
  // Mark student attendance
  // ═══════════════════════════════════════════════════════════

  static async markStudentAttendance(
    tenantId: string,
    data: {
      sectionId: string;
      academicYearId: string;
      date: Date;
      records: {
        studentId: string;
        status: 'present' | 'absent' | 'late' | 'half_day';
        checkInTime?: Date;
        remarks?: string;
      }[];
      markedBy: string;
    },
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { date, dateOnly } = normalizeToIST(data.date);

      // Check for existing session
      const existing = await AttendanceSession.findOne({
        tenantId,
        sectionId: data.sectionId,
        dateOnly,
        type: 'student',
      });

      if (existing) {
        throw new AppError('Attendance already marked for this date and section', 409);
      }

      // Fetch students in the section
      const students = await Student.find({
        tenantId,
        status: 'active',
        isDeleted: false,
        $or: [
          { sectionId: data.sectionId },
          { section: data.sectionId },
        ],
      });

      if (students.length === 0) {
        throw new AppError('No students found in this section', 404);
      }

      // Build attendance records from provided data
      const attendanceRecords = data.records.map(record => ({
        tenantId,
        date,
        dateOnly,
        type: 'student',
        entityId: record.studentId,
        sectionId: data.sectionId,
        academicYearId: data.academicYearId,
        status: record.status,
        checkInTime: record.checkInTime || new Date(),
        markedBy: data.markedBy,
        remarks: record.remarks || '',
        isHoliday: false,
      }));

      // Auto-mark absent for unrecorded students
      const studentIds = students.map(s => s._id.toString());
      const recordedIds = data.records.map(r => r.studentId);

      for (const studentId of studentIds) {
        if (!recordedIds.includes(studentId)) {
          attendanceRecords.push({
            tenantId,
            date,
            dateOnly,
            type: 'student',
            entityId: studentId,
            sectionId: data.sectionId,
            academicYearId: data.academicYearId,
            status: 'absent',
            checkInTime: date,
            markedBy: data.markedBy,
            remarks: 'Auto-marked absent',
            isHoliday: false,
          });
        }
      }

      await Attendance.insertMany(attendanceRecords, { session });

      const stats = await this.calculateAttendanceStats(
        tenantId,
        date,
        data.sectionId,
        'student',
        session,
      );

      const attendanceSession = await AttendanceSession.create(
        [
          {
            tenantId,
            academicYearId: data.academicYearId,
            sectionId: data.sectionId,
            date,
            dateOnly,
            type: 'student',
            totalPresent: stats.present,
            totalAbsent: stats.absent,
            totalLate: stats.late,
            totalHalfDay: stats.halfDay,
            totalStudents: studentIds.length,
            attendancePercentage: stats.percentage,
            markedBy: data.markedBy,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      await this.sendAttendanceNotifications(tenantId, date, data.sectionId, 'student');

      return {
        session: attendanceSession[0],
        stats,
        totalStudents: studentIds.length,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Mark teacher attendance
  // ═══════════════════════════════════════════════════════════

  static async markTeacherAttendance(
    tenantId: string,
    data: {
      academicYearId: string;
      date: Date;
      records: {
        teacherId: string;
        status: 'present' | 'absent' | 'late' | 'half_day';
        checkInTime?: Date;
        checkOutTime?: Date;
        remarks?: string;
      }[];
      markedBy: string;
    },
  ) {
    const { date, dateOnly } = normalizeToIST(data.date);

    // Check for existing session
    const existing = await AttendanceSession.findOne({
      tenantId,
      dateOnly,
      type: 'teacher',
    });

    if (existing) {
      throw new AppError('Teacher attendance already marked for this date', 409);
    }

    const teachers = await Teacher.find({
      tenantId,
      status: 'active',
      isDeleted: false,
    });

    if (teachers.length === 0) {
      throw new AppError('No active teachers found', 404);
    }

    const attendanceRecords = data.records.map(record => ({
      tenantId,
      date,
      dateOnly,
      type: 'teacher',
      entityId: record.teacherId,
      academicYearId: data.academicYearId,
      status: record.status,
      checkInTime: record.checkInTime || new Date(),
      checkOutTime: record.checkOutTime,
      markedBy: data.markedBy,
      remarks: record.remarks || '',
      isHoliday: false,
    }));

    // Auto-mark absent for unrecorded teachers
    const teacherIds = teachers.map(t => t._id.toString());
    const recordedIds = data.records.map(r => r.teacherId);

    for (const teacherId of teacherIds) {
      if (!recordedIds.includes(teacherId)) {
        attendanceRecords.push({
          tenantId,
          date,
          dateOnly,
          type: 'teacher',
          entityId: teacherId,
          academicYearId: data.academicYearId,
          status: 'absent',
          checkInTime: date,
          checkOutTime: undefined,
          markedBy: data.markedBy,
          remarks: 'Auto-marked absent',
          isHoliday: false,
        });
      }
    }

    await Attendance.insertMany(attendanceRecords);

    const stats = await this.calculateAttendanceStats(
      tenantId,
      date,
      undefined,
      'teacher',
    );

    const attendanceSession = await AttendanceSession.create({
      tenantId,
      academicYearId: data.academicYearId,
      date,
      dateOnly,
      type: 'teacher',
      totalPresent: stats.present,
      totalAbsent: stats.absent,
      totalLate: stats.late,
      totalHalfDay: stats.halfDay,
      totalStudents: teacherIds.length,
      attendancePercentage: stats.percentage,
      markedBy: data.markedBy,
    });

    return {
      session: attendanceSession,
      stats,
      totalTeachers: teacherIds.length,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // Stats helper
  // ═══════════════════════════════════════════════════════════

  private static async calculateAttendanceStats(
    tenantId: string,
    date: Date,
    sectionId?: string,
    type: 'student' | 'teacher' = 'student',
    session?: mongoose.ClientSession,
  ) {
    const query: any = { tenantId, date, type };
    if (sectionId) query.sectionId = sectionId;

    const records = await Attendance.find(query).session(session || null);

    const stats = {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      halfDay: records.filter(r => r.status === 'half_day').length,
      total: records.length,
      percentage: 0,
    };

    if (stats.total > 0) {
      stats.percentage = Math.round(
        ((stats.present + stats.late + stats.halfDay) / stats.total) * 100,
      );
    }

    return stats;
  }

  // ═══════════════════════════════════════════════════════════
  // Get attendance for a student
  // ═══════════════════════════════════════════════════════════

  static async getStudentAttendance(
    tenantId: string,
    studentId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const query: any = {
      tenantId,
      entityId: studentId,
      type: 'student',
    };

    if (filters.startDate) query.date = { $gte: filters.startDate };
    if (filters.endDate) query.date = { ...query.date, $lte: filters.endDate };
    if (filters.status) query.status = filters.status;

    const page = filters.page || 1;
    const limit = filters.limit || 30;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Attendance.find(query).sort({ date: -1 }).skip(skip).limit(limit),
      Attendance.countDocuments(query),
    ]);

    const summary = await this.getAttendanceSummary(tenantId, studentId, 'student');

    return {
      items: records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // Get attendance for a teacher
  // ═══════════════════════════════════════════════════════════

  static async getTeacherAttendance(
    tenantId: string,
    teacherId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const query: any = {
      tenantId,
      entityId: teacherId,
      type: 'teacher',
    };

    if (filters.startDate) query.date = { $gte: filters.startDate };
    if (filters.endDate) query.date = { ...query.date, $lte: filters.endDate };
    if (filters.status) query.status = filters.status;

    const page = filters.page || 1;
    const limit = filters.limit || 30;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Attendance.find(query).sort({ date: -1 }).skip(skip).limit(limit),
      Attendance.countDocuments(query),
    ]);

    const summary = await this.getAttendanceSummary(tenantId, teacherId, 'teacher');

    return {
      items: records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // Summary for a single entity (last 30 days)
  // ═══════════════════════════════════════════════════════════

  static async getAttendanceSummary(
    tenantId: string,
    entityId: string,
    type: 'student' | 'teacher',
  ) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const records = await Attendance.find({
      tenantId,
      entityId,
      type,
      date: { $gte: startDate },
    });

    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const halfDay = records.filter(r => r.status === 'half_day').length;

    const percentage =
      total > 0 ? Math.round(((present + late + halfDay) / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      late,
      halfDay,
      percentage,
      thisMonth: { total, present, percentage },
    };
  }

  // ═══════════════════════════════════════════════════════════
  // Section attendance report (student)
  // ═══════════════════════════════════════════════════════════

  static async getSectionAttendanceReport(
    tenantId: string,
    sectionId: string,
    academicYearId: string,
    month?: number,
    year?: number,
  ) {
    const date = new Date();
    const targetMonth = month !== undefined ? month : date.getMonth();
    const targetYear = year !== undefined ? year : date.getFullYear();

    const startDate = new Date(
      Date.UTC(targetYear, targetMonth, 1) - IST_OFFSET_MS,
    );
    const endDate = new Date(
      Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59) - IST_OFFSET_MS,
    );

    const sessions = await AttendanceSession.find({
      tenantId,
      sectionId,
      academicYearId,
      type: 'student',
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    const students = await Student.find({
      tenantId,
      status: 'active',
      isDeleted: false,
      $or: [{ sectionId }, { section: sectionId }],
    }).select('_id firstName lastName rollNo sectionId section');

    const attendanceData = await Attendance.find({
      tenantId,
      sectionId,
      type: 'student',
      date: { $gte: startDate, $lte: endDate },
    });

    const studentAttendance: any = {};
    for (const student of students) {
      const studentId = student._id.toString();
      const records = attendanceData.filter(a => a.entityId === studentId);

      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const late = records.filter(r => r.status === 'late').length;
      const halfDay = records.filter(r => r.status === 'half_day').length;
      const total = records.length;

      studentAttendance[studentId] = {
        student: {
          id: studentId,
          name: `${student.firstName} ${student.lastName}`,
          rollNo: student.rollNo,
        },
        present,
        absent,
        late,
        halfDay,
        total,
        percentage:
          total > 0 ? Math.round(((present + late + halfDay) / total) * 100) : 0,
      };
    }

    const totalStudents = students.length;
    const totalDays = sessions.length;

    return {
      students: Object.values(studentAttendance),
      sessions: sessions.map(s => ({
        date: s.date,
        present: s.totalPresent,
        absent: s.totalAbsent,
        late: s.totalLate,
        halfDay: s.totalHalfDay,
        percentage: s.attendancePercentage,
      })),
      summary: {
        totalStudents,
        totalDays,
        averageAttendance:
          sessions.length > 0
            ? sessions.reduce((acc, s) => acc + s.attendancePercentage, 0) /
              sessions.length
            : 0,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════
  // Teacher attendance report — one row per teacher for the month
  // ═══════════════════════════════════════════════════════════

  static async getTeacherAttendanceReport(
    tenantId: string,
    academicYearId: string,
    month?: number,
    year?: number,
  ) {
    const date = new Date();
    const targetMonth = month !== undefined ? month : date.getMonth();
    const targetYear = year !== undefined ? year : date.getFullYear();

    const startDate = new Date(
      Date.UTC(targetYear, targetMonth, 1) - IST_OFFSET_MS,
    );
    const endDate = new Date(
      Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59) - IST_OFFSET_MS,
    );

    const sessions = await AttendanceSession.find({
      tenantId,
      academicYearId,
      type: 'teacher',
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    const teachers = await Teacher.find({
      tenantId,
      status: 'active',
      isDeleted: false,
    }).select('_id firstName lastName employeeId email');

    const attendanceData = await Attendance.find({
      tenantId,
      type: 'teacher',
      date: { $gte: startDate, $lte: endDate },
    });

    const teacherAttendance: any[] = [];
    for (const teacher of teachers) {
      const teacherId = teacher._id.toString();
      const records = attendanceData.filter(a => a.entityId === teacherId);

      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const late = records.filter(r => r.status === 'late').length;
      const halfDay = records.filter(r => r.status === 'half_day').length;
      const total = records.length;

      teacherAttendance.push({
        teacher: {
          id: teacherId,
          name: `${teacher.firstName} ${teacher.lastName}`,
          employeeId: teacher.employeeId,
          email: teacher.email,
        },
        present,
        absent,
        late,
        halfDay,
        total,
        percentage:
          total > 0
            ? Math.round(((present + late + halfDay) / total) * 100)
            : 0,
      });
    }

    return {
      teachers: teacherAttendance.sort((a, b) =>
        a.teacher.name.localeCompare(b.teacher.name),
      ),
      sessions: sessions.map(s => ({
        date: s.date,
        present: s.totalPresent,
        absent: s.totalAbsent,
        late: s.totalLate,
        halfDay: s.totalHalfDay,
        percentage: s.attendancePercentage,
      })),
      summary: {
        totalTeachers: teachers.length,
        totalDays: sessions.length,
        averageAttendance:
          sessions.length > 0
            ? Math.round(
                sessions.reduce((acc, s) => acc + s.attendancePercentage, 0) /
                  sessions.length,
              )
            : 0,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════
  // Notifications (stub — logs to console)
  // ═══════════════════════════════════════════════════════════

  private static async sendAttendanceNotifications(
    tenantId: string,
    date: Date,
    sectionId: string,
    type: 'student' | 'teacher',
  ) {
    const absentStudents = await Attendance.find({
      tenantId,
      date,
      sectionId,
      type: 'student',
      status: 'absent',
    });

    if (absentStudents.length === 0) return;

    console.log(
      `📧 Sending attendance notifications for ${absentStudents.length} students`,
    );
    console.log(`📅 Date: ${date.toISOString().split('T')[0]}`);

    for (const record of absentStudents) {
      const student = await Student.findById(record.entityId);
      if (student) {
        console.log(`❌ Absent: ${student.firstName} ${student.lastName}`);
        if (student.guardians && student.guardians.length > 0) {
          const guardian = student.guardians[0];
          console.log(`📱 Guardian: ${guardian.name} (${guardian.phone})`);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Mark holiday
  // ═══════════════════════════════════════════════════════════

  static async markHoliday(
    tenantId: string,
    data: {
      date: Date;
      reason: string;
      sectionId?: string;
      academicYearId: string;
      markedBy: string;
    },
  ) {
    const { date, dateOnly } = normalizeToIST(data.date);

    const existing = await Attendance.findOne({
      tenantId,
      dateOnly,
      isHoliday: true,
    });

    if (existing) {
      throw new AppError('Holiday already marked for this date', 409);
    }

    const holiday = await Attendance.create({
      tenantId,
      date,
      dateOnly,
      type: 'student',
      entityId: 'holiday',
      sectionId: data.sectionId || '',
      academicYearId: data.academicYearId,
      status: 'holiday',
      markedBy: data.markedBy,
      isHoliday: true,
      holidayReason: data.reason,
    });

    if (data.sectionId) {
      await AttendanceSession.create({
        tenantId,
        academicYearId: data.academicYearId,
        sectionId: data.sectionId,
        date,
        dateOnly,
        type: 'student',
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0,
        totalHalfDay: 0,
        totalStudents: 0,
        attendancePercentage: 100,
        markedBy: data.markedBy,
      });
    }

    return holiday;
  }

  // ═══════════════════════════════════════════════════════════
  // Dashboard stats
  // ═══════════════════════════════════════════════════════════

  static async getAttendanceStats(
    tenantId: string,
    academicYearId: string,
    sectionId?: string,
  ) {
    const todayRaw = new Date();
    const { dateOnly: todayDateOnly } = normalizeToIST(todayRaw);

    const todaySession = await AttendanceSession.findOne({
      tenantId,
      academicYearId,
      sectionId: sectionId || { $exists: true },
      dateOnly: todayDateOnly,
    });

    const monthStartRaw = new Date(todayRaw.getFullYear(), todayRaw.getMonth(), 1);
    const { date: monthStart } = normalizeToIST(monthStartRaw);
    const { date: today } = normalizeToIST(todayRaw);

    const monthSessions = await AttendanceSession.find({
      tenantId,
      academicYearId,
      sectionId: sectionId || { $exists: true },
      date: { $gte: monthStart, $lte: today },
    });

    const monthStats = monthSessions.reduce(
      (acc, s) => ({
        present: acc.present + s.totalPresent,
        absent: acc.absent + s.totalAbsent,
        late: acc.late + s.totalLate,
        halfDay: acc.halfDay + s.totalHalfDay,
        total: acc.total + s.totalStudents,
        days: acc.days + 1,
        percentage: acc.percentage + s.attendancePercentage,
      }),
      { present: 0, absent: 0, late: 0, halfDay: 0, total: 0, days: 0, percentage: 0 },
    );

    const avgPercentage =
      monthStats.days > 0
        ? Math.round(monthStats.percentage / monthStats.days)
        : 0;

    return {
      today: todaySession
        ? {
            present: todaySession.totalPresent,
            absent: todaySession.totalAbsent,
            late: todaySession.totalLate,
            halfDay: todaySession.totalHalfDay,
            total: todaySession.totalStudents,
            percentage: todaySession.attendancePercentage,
          }
        : null,
      thisMonth: {
        ...monthStats,
        averagePercentage: avgPercentage,
      },
      overall: await this.getOverallAttendanceStats(tenantId, academicYearId, sectionId),
    };
  }

  private static async getOverallAttendanceStats(
    tenantId: string,
    academicYearId: string,
    sectionId?: string,
  ) {
    const query: any = { tenantId, academicYearId, type: 'student' };
    if (sectionId) query.sectionId = sectionId;

    const sessions = await AttendanceSession.find(query);

    if (sessions.length === 0) {
      return {
        totalDays: 0,
        averageAttendance: 0,
        bestDay: null,
        worstDay: null,
      };
    }

    const totalStudents = sessions.reduce((acc, s) => acc + s.totalStudents, 0);
    const totalPresent = sessions.reduce((acc, s) => acc + s.totalPresent, 0);
    const totalAbsent = sessions.reduce((acc, s) => acc + s.totalAbsent, 0);

    const sortedByPercentage = [...sessions].sort(
      (a, b) => b.attendancePercentage - a.attendancePercentage,
    );

    return {
      totalDays: sessions.length,
      averageAttendance: Math.round(
        sessions.reduce((acc, s) => acc + s.attendancePercentage, 0) /
          sessions.length,
      ),
      totalPresent,
      totalAbsent,
      bestDay: sortedByPercentage[0]
        ? {
            date: sortedByPercentage[0].date,
            percentage: sortedByPercentage[0].attendancePercentage,
          }
        : null,
      worstDay: sortedByPercentage[sortedByPercentage.length - 1]
        ? {
            date: sortedByPercentage[sortedByPercentage.length - 1].date,
            percentage:
              sortedByPercentage[sortedByPercentage.length - 1].attendancePercentage,
          }
        : null,
    };
  }
}