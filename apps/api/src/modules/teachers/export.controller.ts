import { Request, Response, NextFunction } from 'express';
import { Teacher } from '../../models/Teacher';
import { AuthRequest } from '../../middleware/auth';
import { sendCsv } from '../../utils/csv';

export class TeacherExportController {
  /**
   * GET /teachers/export
   * Query: status, employmentType, subject, search
   */
  static async export(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { status, employmentType, subject, search } = req.query;

      const query: any = {
        tenantId: authReq.user.tenantId,
        isDeleted: false,
      };

      if (status) query.status = status;
      if (employmentType) query.employmentType = employmentType;
      if (subject) query.subjects = subject;
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const teachers = await Teacher.find(query)
        .select(
          'employeeId firstName lastName middleName email phone alternativeEmail dateOfBirth gender maritalStatus nationality religion address qualifications experience subjects joiningDate employmentType contractEndDate status salary',
        )
        .sort({ firstName: 1, lastName: 1 })
        .lean();

      const headers = [
        'Employee ID',
        'First Name',
        'Middle Name',
        'Last Name',
        'Email',
        'Alternative Email',
        'Phone',
        'Date of Birth',
        'Gender',
        'Marital Status',
        'Nationality',
        'Religion',
        'City',
        'State',
        'Postal Code',
        'Highest Qualification',
        'Qualification Institution',
        'Qualification Year',
        'Total Experience Entries',
        'Joining Date',
        'Employment Type',
        'Contract End Date',
        'Monthly Salary (INR)',
        'Subjects (count)',
        'Status',
        'Created At',
      ];

      const rows = teachers.map(t => {
        const qual = t.qualifications?.[0];
        return [
          t.employeeId,
          t.firstName,
          t.middleName || '',
          t.lastName,
          t.email,
          t.alternativeEmail || '',
          t.phone,
          t.dateOfBirth,
          t.gender,
          t.maritalStatus || '',
          t.nationality || '',
          t.religion || '',
          t.address?.city || '',
          t.address?.state || '',
          t.address?.postalCode || '',
          qual?.degree || '',
          qual?.institution || '',
          qual?.year || '',
          t.experience?.length || 0,
          t.joiningDate,
          t.employmentType,
          t.contractEndDate || '',
          t.salary?.amount || 0,
          t.subjects?.length || 0,
          t.status,
          (t as unknown as { createdAt?: Date }).createdAt || '',
        ];
      });

      const filename = `teachers_${new Date().toISOString().split('T')[0]}.csv`;
      sendCsv(res, filename, headers, rows);
    } catch (error) {
      next(error);
    }
  }
}