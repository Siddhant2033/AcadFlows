import { Request, Response, NextFunction } from 'express';
import { Student } from '../../models/Student';
import { AcademicYear } from '../../models/AcademicYear';
import { Section } from '../../models/Section';
import { AuthRequest } from '../../middleware/auth';
import { sendCsv } from '../../utils/csv';

export class StudentExportController {
  /**
   * GET /students/export
   * Query: grade, section, status, search
   */
  static async export(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { grade, section, sectionId, status, search } = req.query;

      const query: any = {
        tenantId: authReq.user.tenantId,
        isDeleted: false,
      };

      if (grade) query.grade = grade;
      if (section) query.section = section;
      if (sectionId) query.sectionId = sectionId;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { admissionNo: { $regex: search, $options: 'i' } },
          { rollNo: { $regex: search, $options: 'i' } },
        ];
      }

      const students = await Student.find(query)
        .select(
          'admissionNo rollNo firstName lastName middleName grade section sectionId dateOfBirth gender bloodGroup nationality religion motherTongue address guardians emergencyContact status createdAt',
        )
        .sort({ grade: 1, section: 1, rollNo: 1 })
        .lean();

      // Section names for display
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

      const headers = [
        'Admission No',
        'Roll No',
        'First Name',
        'Middle Name',
        'Last Name',
        'Grade',
        'Section',
        'Date of Birth',
        'Gender',
        'Blood Group',
        'Nationality',
        'Religion',
        'Mother Tongue',
        'Phone',
        'City',
        'State',
        'Postal Code',
        'Guardian 1 Name',
        'Guardian 1 Phone',
        'Guardian 1 Email',
        'Guardian 1 Relationship',
        'Guardian 2 Name',
        'Guardian 2 Phone',
        'Guardian 2 Relationship',
        'Emergency Contact Name',
        'Emergency Contact Phone',
        'Emergency Contact Relationship',
        'Status',
        'Admitted On',
      ];

      const rows = students.map(s => {
        const sectionName = s.sectionId
          ? sectionMap.get(s.sectionId) || s.section || ''
          : s.section || '';
        const guardians = s.guardians || [];
        const g1 = guardians[0];
        const g2 = guardians[1];
        const ec = s.emergencyContact || {};

        return [
          s.admissionNo,
          s.rollNo,
          s.firstName,
          s.middleName || '',
          s.lastName,
          s.grade,
          sectionName,
          s.dateOfBirth,
          s.gender,
          s.bloodGroup || '',
          s.nationality || '',
          s.religion || '',
          s.motherTongue || '',
          '', // Phone is on user doc; leave blank for privacy in bulk export
          s.address?.city || '',
          s.address?.state || '',
          s.address?.postalCode || '',
          g1?.name || '',
          g1?.phone || '',
          g1?.email || '',
          g1?.relationship || '',
          g2?.name || '',
          g2?.phone || '',
          g2?.relationship || '',
          ec.name || '',
          ec.phone || '',
          ec.relationship || '',
          s.status,
          (s as typeof s & { createdAt?: Date }).createdAt || '',
        ];
      });

      const filename = `students_${new Date().toISOString().split('T')[0]}.csv`;
      sendCsv(res, filename, headers, rows);
    } catch (error) {
      next(error);
    }
  }
}