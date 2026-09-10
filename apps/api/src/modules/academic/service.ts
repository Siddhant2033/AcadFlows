import mongoose from 'mongoose';
import { AcademicYear } from '../../models/AcademicYear';
import { Grade } from '../../models/Grade';
import { Section } from '../../models/Section';
import { Subject } from '../../models/Subject';
import { TeacherSubject } from '../../models/TeacherSubject';
import { Schedule } from '../../models/Schedule';
import { AppError } from '../../middleware/error-handler';

// Academic Year Service
export class AcademicYearService {
  static async create(data: any) {
    const academicYear = await AcademicYear.create(data);
    return academicYear;
  }

  static async getAll(tenantId: string) {
    return await AcademicYear.find({ tenantId }).sort({ startDate: -1 });
  }

  static async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const academicYear = await AcademicYear.findById(id);
    if (!academicYear) {
      throw new AppError('Academic year not found', 404);
    }
    return academicYear;
  }

  static async update(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const academicYear = await AcademicYear.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!academicYear) {
      throw new AppError('Academic year not found', 404);
    }
    return academicYear;
  }

  static async delete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const academicYear = await AcademicYear.findByIdAndDelete(id);
    if (!academicYear) {
      throw new AppError('Academic year not found', 404);
    }
    return academicYear;
  }

  static async setCurrent(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    // Remove current flag from all
    await AcademicYear.updateMany({}, { $set: { isCurrent: false } });
    // Set current flag for the selected
    const academicYear = await AcademicYear.findByIdAndUpdate(
      id,
      { $set: { isCurrent: true } },
      { new: true }
    );
    if (!academicYear) {
      throw new AppError('Academic year not found', 404);
    }
    return academicYear;
  }
}

// Grade Service
export class GradeService {
  static async create(data: any) {
    const grade = await Grade.create(data);
    return grade;
  }

  static async getAll(tenantId: string) {
    return await Grade.find({ tenantId }).sort({ sequence: 1 });
  }

  static async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const grade = await Grade.findById(id);
    if (!grade) {
      throw new AppError('Grade not found', 404);
    }
    return grade;
  }

  static async update(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const grade = await Grade.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!grade) {
      throw new AppError('Grade not found', 404);
    }
    return grade;
  }

  static async delete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const grade = await Grade.findByIdAndDelete(id);
    if (!grade) {
      throw new AppError('Grade not found', 404);
    }
    return grade;
  }
}

// Section Service
export class SectionService {
  static async create(data: any) {
    const section = await Section.create(data);
    return section;
  }

  static async getAll(tenantId: string, gradeId?: string) {
    const filter: any = { tenantId };
    if (gradeId) {
      filter.gradeId = gradeId;
    }
    return await Section.find(filter).sort({ name: 1 });
  }

  static async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const section = await Section.findById(id);
    if (!section) {
      throw new AppError('Section not found', 404);
    }
    return section;
  }

  static async update(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const section = await Section.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!section) {
      throw new AppError('Section not found', 404);
    }
    return section;
  }

  static async delete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const section = await Section.findByIdAndDelete(id);
    if (!section) {
      throw new AppError('Section not found', 404);
    }
    return section;
  }
}

// Subject Service
export class SubjectService {
  static async create(data: any) {
    const subject = await Subject.create(data);
    return subject;
  }

  static async getAll(tenantId: string, gradeId?: string) {
    const filter: any = { tenantId };
    if (gradeId) {
      filter.gradeId = gradeId;
    }
    return await Subject.find(filter).sort({ name: 1 });
  }

  static async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const subject = await Subject.findById(id);
    if (!subject) {
      throw new AppError('Subject not found', 404);
    }
    return subject;
  }

  static async update(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const subject = await Subject.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!subject) {
      throw new AppError('Subject not found', 404);
    }
    return subject;
  }

  static async delete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) {
      throw new AppError('Subject not found', 404);
    }
    return subject;
  }
}

// Teacher Subject Service
export class TeacherSubjectService {
  static async assign(data: any) {
    const teacherSubject = await TeacherSubject.create(data);
    return await TeacherSubject.findById(teacherSubject._id)
      .populate('teacherId', 'firstName lastName employeeId')
      .populate('subjectId', 'name code')
      .populate('sectionId', 'name');
  }

  static async getAll(tenantId: string, teacherId?: string, subjectId?: string) {
    const filter: any = { tenantId };
    if (teacherId) {
      filter.teacherId = teacherId;
    }
    if (subjectId) {
      filter.subjectId = subjectId;
    }
    return await TeacherSubject.find(filter)
      .populate('teacherId', 'firstName lastName email')
      .populate('subjectId', 'name code')
      .populate('gradeId', 'name code')
      .populate('sectionId', 'name code');
  }

  static async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const teacherSubject = await TeacherSubject.findById(id)
      .populate('teacherId', 'firstName lastName email')
      .populate('subjectId', 'name code')
      .populate('gradeId', 'name code')
      .populate('sectionId', 'name code');
    if (!teacherSubject) {
      throw new AppError('Assignment not found', 404);
    }
    return teacherSubject;
  }

  static async delete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const teacherSubject = await TeacherSubject.findByIdAndDelete(id);
    if (!teacherSubject) {
      throw new AppError('Assignment not found', 404);
    }
    return teacherSubject;
  }

  static async getByTeacher(teacherId: string, tenantId: string) {
    return await TeacherSubject.find({ teacherId, tenantId })
      .populate('subjectId', 'name code')
      .populate('gradeId', 'name code')
      .populate('sectionId', 'name code');
  }
}

// Schedule Service
export class ScheduleService {
  static async create(data: any) {
    // Check for conflicts
    const conflicts = await Schedule.findOne({
      tenantId: data.tenantId,
      teacherId: data.teacherId,
      dayOfWeek: data.dayOfWeek,
      $or: [
        { startTime: { $lt: data.endTime, $gte: data.startTime } },
        { endTime: { $gt: data.startTime, $lte: data.endTime } },
      ],
    });

    if (conflicts) {
      throw new AppError('Schedule conflict detected for this teacher', 409);
    }

    const schedule = await Schedule.create(data);
    return schedule;
  }

  static async getAll(tenantId: string, sectionId?: string, teacherId?: string) {
    const filter: any = { tenantId };
    if (sectionId) {
      filter.sectionId = sectionId;
    }
    if (teacherId) {
      filter.teacherId = teacherId;
    }
    return await Schedule.find(filter)
      .populate('gradeId', 'name code')
      .populate('sectionId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'firstName lastName email');
  }

  static async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const schedule = await Schedule.findById(id)
      .populate('gradeId', 'name code')
      .populate('sectionId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'firstName lastName email');
    if (!schedule) {
      throw new AppError('Schedule entry not found', 404);
    }
    return schedule;
  }

  static async update(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const schedule = await Schedule.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!schedule) {
      throw new AppError('Schedule entry not found', 404);
    }
    return schedule;
  }

  static async delete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid ID format', 400);
    }
    const schedule = await Schedule.findByIdAndDelete(id);
    if (!schedule) {
      throw new AppError('Schedule entry not found', 404);
    }
    return schedule;
  }

  static async getTimetableBySection(sectionId: string, tenantId: string) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const timetable: any = {};

    for (const day of days) {
      timetable[day] = await Schedule.find({
        tenantId,
        sectionId,
        dayOfWeek: day,
        status: 'active',
      })
        .populate('subjectId', 'name code')
        .populate('teacherId', 'firstName lastName')
        .populate('gradeId', 'name code')
        .sort({ startTime: 1 });
    }

    return timetable;
  }
}