import { Request, Response, NextFunction } from 'express';
import { Attendance, AttendanceSession } from '../../models/Attendance';
import { Student } from '../../models/Student';
import { Section } from '../../models/Section';
import { AuthRequest } from '../../middleware/auth';
import { sendCsv } from '../../utils/csv';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export class AttendanceWarningsController {
  /**
   * GET /attendance/warnings
   * Query: threshold (default 75), gradeId, sectionId, academicYearId
   *
   * Returns students whose attendance percentage is below the threshold.
   */
  static async getWarnings(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const {
        threshold = '75',
        gradeId,
        sectionId,
        academicYearId,
      } = req.query;

      const thresholdNum = Math.max(0, Math.min(100, parseFloat(threshold as string)));

      // Student filter
      const studentQuery: any = {
        tenantId: authReq.user.tenantId,
        isDeleted: false,
        status: 'active',
      };
      if (gradeId) studentQuery.grade = gradeId;
      if (sectionId) studentQuery.sectionId = sectionId;

      const students = await Student.find(studentQuery)
        .select('_id firstName lastName admissionNo rollNo grade section sectionId guardians')
        .lean();

      if (students.length === 0) {
        return res.json({
          success: true,
          data: {
            threshold: thresholdNum,
            items: [],
            total: 0,
            totalStudentsChecked: 0,
          },
        });
      }

      // Section map
      const sectionIds = students
        .map(s => s.sectionId)
        .filter((id): id is string => Boolean(id));
      const sections = await Section.find({
        tenantId: authReq.user.tenantId,
        _id: { $in: sectionIds },
      })
        .select('_id name')
        .lean();
      const sectionMap = new Map(sections.map(s => [s._id.toString(), s.name]));

      // Fetch all attendance records for these students
      const studentIds = students.map(s => s._id.toString());
      const attendanceQuery: any = {
        tenantId: authReq.user.tenantId,
        entityId: { $in: studentIds },
        type: 'student',
      };
      if (academicYearId) attendanceQuery.academicYearId = academicYearId;

      const records = await Attendance.find(attendanceQuery)
        .select('entityId status')
        .lean();

      // Group by student
      const studentStats = new Map<
        string,
        { present: number; absent: number; late: number; halfDay: number; total: number }
      >();
      for (const r of records) {
        const sid = r.entityId;
        if (!studentStats.has(sid)) {
          studentStats.set(sid, {
            present: 0,
            absent: 0,
            late: 0,
            halfDay: 0,
            total: 0,
          });
        }
        const stats = studentStats.get(sid)!;
        stats.total += 1;
        if (r.status === 'present') stats.present += 1;
        else if (r.status === 'absent') stats.absent += 1;
        else if (r.status === 'late') stats.late += 1;
        else if (r.status === 'half_day') stats.halfDay += 1;
      }

      // Build warning list
      const items = students
        .map(s => {
          const sid = s._id.toString();
          const stats = studentStats.get(sid);
          if (!stats || stats.total === 0) return null;

          const effectivePresent = stats.present + stats.late + stats.halfDay;
          const percentage = Math.round((effectivePresent / stats.total) * 100);

          if (percentage >= thresholdNum) return null;

          const guardian = s.guardians?.[0];
          const sectionName = s.sectionId
            ? sectionMap.get(s.sectionId) || s.section || ''
            : s.section || '';

          return {
            studentId: sid,
            admissionNo: s.admissionNo,
            rollNo: s.rollNo,
            firstName: s.firstName,
            lastName: s.lastName,
            name: `${s.firstName} ${s.lastName}`.trim(),
            grade: s.grade,
            section: sectionName,
            sectionId: s.sectionId || null,
            present: stats.present,
            absent: stats.absent,
            late: stats.late,
            halfDay: stats.halfDay,
            total: stats.total,
            percentage,
            guardianName: guardian?.name || '',
            guardianPhone: guardian?.phone || '',
            guardianEmail: guardian?.email || '',
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => a.percentage - b.percentage);

      res.json({
        success: true,
        data: {
          threshold: thresholdNum,
          items,
          total: items.length,
          totalStudentsChecked: students.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /attendance/warnings/export
   * Same filters as getWarnings, returns CSV.
   */
  static async exportWarnings(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { threshold = '75', gradeId, sectionId, academicYearId } = req.query;
      const thresholdNum = Math.max(0, Math.min(100, parseFloat(threshold as string)));

      // Reuse the warnings logic by calling the same static method via HTTP? No —
      // inline it to avoid a round-trip.
      const fakeReq = {
        ...req,
        query: { threshold, gradeId, sectionId, academicYearId },
      } as any;

      let data: any = null;
      const fakeRes = {
        json: (payload: any) => {
          data = payload.data;
        },
        status: () => fakeRes,
      } as any;

      await AttendanceWarningsController.getWarnings(fakeReq, fakeRes, () => {});
      if (!data) {
        return res.status(500).json({ success: false, error: 'Failed to build warnings' });
      }

      const headers = [
        'Admission No',
        'Roll No',
        'Student Name',
        'Grade',
        'Section',
        'Present',
        'Absent',
        'Late',
        'Half Day',
        'Total Days',
        'Percentage',
        'Guardian Name',
        'Guardian Phone',
        'Guardian Email',
      ];

      const rows = data.items.map((w: any) => [
        w.admissionNo,
        w.rollNo,
        w.name,
        w.grade,
        w.section,
        w.present,
        w.absent,
        w.late,
        w.halfDay,
        w.total,
        `${w.percentage}%`,
        w.guardianName,
        w.guardianPhone,
        w.guardianEmail,
      ]);

      const filename = `low-attendance-${thresholdNum}pct-${new Date().toISOString().split('T')[0]}.csv`;
      sendCsv(res, filename, headers, rows);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /attendance/sections/:sectionId/export?month=YYYY-MM
   * Monthly attendance CSV for a section.
   */
  static async exportSectionAttendance(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const { sectionId } = req.params;
      const { month, academicYearId } = req.query;

      // Parse month (YYYY-MM)
      let targetMonth = new Date().getMonth();
      let targetYear = new Date().getFullYear();
      if (month && typeof month === 'string') {
        const [yStr, mStr] = month.split('-');
        const y = parseInt(yStr, 10);
        const m = parseInt(mStr, 10) - 1;
        if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
          targetYear = y;
          targetMonth = m;
        }
      }

      const startDate = new Date(
        Date.UTC(targetYear, targetMonth, 1) - IST_OFFSET_MS,
      );
      const endDate = new Date(
        Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59) - IST_OFFSET_MS,
      );

      const sessionQuery: any = {
        tenantId: authReq.user.tenantId,
        sectionId,
        type: 'student',
        date: { $gte: startDate, $lte: endDate },
      };
      if (academicYearId) sessionQuery.academicYearId = academicYearId;

      const sessions = await AttendanceSession.find(sessionQuery).sort({ date: 1 });
      const sessionDates = sessions.map(s =>
        new Date(s.date).toISOString().split('T')[0],
      );

      const students = await Student.find({
        tenantId: authReq.user.tenantId,
        status: 'active',
        isDeleted: false,
        $or: [{ sectionId }, { section: sectionId }],
      })
        .select('_id firstName lastName rollNo admissionNo')
        .sort({ rollNo: 1 })
        .lean();

      const attendanceData = await Attendance.find({
        tenantId: authReq.user.tenantId,
        sectionId,
        type: 'student',
        date: { $gte: startDate, $lte: endDate },
      }).lean();

      // Build a lookup: { studentId: { dateOnly: status } }
      const lookup = new Map<string, Map<string, string>>();
      for (const r of attendanceData) {
        const sid = r.entityId;
        const dateOnly =
          r.dateOnly || new Date(r.date).toISOString().split('T')[0];
        if (!lookup.has(sid)) lookup.set(sid, new Map());
        lookup.get(sid)!.set(dateOnly, r.status);
      }

      const headers = [
        'Roll No',
        'Student Name',
        ...sessionDates.map(d => {
          const [y, m, day] = d.split('-');
          return `${day}/${m}`;
        }),
        'Present',
        'Absent',
        'Percentage',
      ];

      const rows = students.map(s => {
        const sid = s._id.toString();
        const statusMap = lookup.get(sid) || new Map();
        const row: any[] = [
          s.rollNo,
          `${s.firstName} ${s.lastName}`.trim(),
        ];

        let present = 0;
        let absent = 0;

        for (const date of sessionDates) {
          const status = statusMap.get(date);
          if (!status) {
            row.push('-');
          } else if (status === 'present') {
            row.push('P');
            present += 1;
          } else if (status === 'absent') {
            row.push('A');
            absent += 1;
          } else if (status === 'late') {
            row.push('L');
            present += 1; // late counts as present
          } else if (status === 'half_day') {
            row.push('H');
            present += 1; // half day counts as present
          } else {
            row.push('-');
          }
        }

        const total = present + absent;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        row.push(present, absent, `${percentage}%`);
        return row;
      });

      const [yy, mm] = (month as string)?.split('-') || [
        String(targetYear),
        String(targetMonth + 1).padStart(2, '0'),
      ];
      const filename = `attendance_${yy}-${mm}.csv`;
      sendCsv(res, filename, headers, rows);
    } catch (error) {
      next(error);
    }
  }
}