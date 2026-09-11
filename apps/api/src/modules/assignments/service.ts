import mongoose from 'mongoose';
import { Assignment, Submission, Gradebook, ReportCard } from '../../models/Assignment';
import { Student } from '../../models/Student';
import { Subject } from '../../models/Subject';
import { Section } from '../../models/Section';
import { Teacher } from '../../models/Teacher';
import { AppError } from '../../middleware/error-handler';
import { attachRefs } from '../../utils/attach-refs';

// Reusable populate maps
const assignmentRefs = {
  subjectId: { model: Subject, fields: 'name code' },
  sectionId: { model: Section, fields: 'name code' },
  teacherId: { model: Teacher, fields: 'firstName lastName employeeId' },
};

const submissionRefs = {
  studentId: { model: Student, fields: 'firstName lastName rollNo admissionNo' },
  assignmentId: { model: Assignment, fields: 'title maxScore dueDate' },
};

export class AssignmentService {
  // ============ Assignments ============

  static async createAssignment(tenantId: string, data: any) {
    const assignment = await Assignment.create({
      tenantId,
      ...data,
      status: data.isPublished ? 'published' : 'draft',
      publishedAt: data.isPublished ? new Date() : undefined,
    });

    return assignment;
  }

  static async getAssignments(
    tenantId: string,
    filters: {
      sectionId?: string;
      subjectId?: string;
      teacherId?: string;
      status?: string;
      type?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const query: any = { tenantId };

    if (filters.sectionId) query.sectionId = filters.sectionId;
    if (filters.subjectId) query.subjectId = filters.subjectId;
    if (filters.teacherId) query.teacherId = filters.teacherId;
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [rawAssignments, total] = await Promise.all([
      Assignment.find(query)
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Assignment.countDocuments(query),
    ]);

    const items = await attachRefs(rawAssignments, assignmentRefs);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getAssignmentById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid assignment ID', 400);
    }

    const raw = await Assignment.findById(id).lean();
    if (!raw) {
      throw new AppError('Assignment not found', 404);
    }

    const [assignment] = await attachRefs([raw], assignmentRefs);
    return assignment;
  }

  static async updateAssignment(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid assignment ID', 400);
    }

    if (data.isPublished && !data.publishedAt) {
      data.publishedAt = new Date();
      data.status = 'published';
    }

    const assignment = await Assignment.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    return assignment;
  }

  static async deleteAssignment(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid assignment ID', 400);
    }

    await Submission.deleteMany({ assignmentId: id });

    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    return assignment;
  }

  // ============ Submissions ============

  static async submitAssignment(tenantId: string, data: any) {
    const assignment = await Assignment.findOne({
      _id: data.assignmentId,
      tenantId,
      status: 'published',
    });

    if (!assignment) {
      throw new AppError('Assignment not found or not published', 404);
    }

    const existingSubmission = await Submission.findOne({
      assignmentId: data.assignmentId,
      studentId: data.studentId,
    });

    if (existingSubmission) {
      throw new AppError('You have already submitted this assignment', 409);
    }

    const isLate = new Date() > assignment.dueDate;

    const submission = await Submission.create({
      tenantId,
      ...data,
      isLate,
      status: 'submitted',
      submittedAt: new Date(),
    });

    return submission;
  }

  static async getSubmissions(
    tenantId: string,
    filters: {
      assignmentId?: string;
      studentId?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const query: any = { tenantId };

    if (filters.assignmentId) query.assignmentId = filters.assignmentId;
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.status) query.status = filters.status;

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [rawSubmissions, total] = await Promise.all([
      Submission.find(query)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Submission.countDocuments(query),
    ]);

    const items = await attachRefs(rawSubmissions, submissionRefs);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getSubmissionById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid submission ID', 400);
    }

    const raw = await Submission.findById(id).lean();
    if (!raw) {
      throw new AppError('Submission not found', 404);
    }

    const [submission] = await attachRefs([raw], submissionRefs);
    return submission;
  }

  static async gradeSubmission(
    submissionId: string,
    data: { score: number; feedback: string; gradedBy: string },
  ) {
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      throw new AppError('Invalid submission ID', 400);
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new AppError('Submission not found', 404);
    }

    submission.score = data.score;
    submission.feedback = data.feedback;
    submission.gradedBy = data.gradedBy;
    submission.gradedAt = new Date();
    submission.status = 'graded';

    await submission.save();

    await this.updateGradebook(
      submission.tenantId,
      submission.studentId,
      submission.assignmentId,
      data.score,
    );

    return submission;
  }

  // ============ Gradebook ============

  static async updateGradebook(
    tenantId: string,
    studentId: string,
    assignmentId: string,
    score: number,
  ) {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return;

    let gradebook = await Gradebook.findOne({
      tenantId,
      studentId,
      subjectId: assignment.subjectId,
      academicYearId: assignment.academicYearId,
    });

    if (!gradebook) {
      gradebook = new Gradebook({
        tenantId,
        studentId,
        subjectId: assignment.subjectId,
        academicYearId: assignment.academicYearId,
        assignments: [],
      });
    }

    // Compare as strings to avoid ObjectId vs string mismatch
    const existingIndex = gradebook.assignments.findIndex(
      (a: any) => a.assignmentId.toString() === assignmentId,
    );

    if (existingIndex >= 0) {
      gradebook.assignments[existingIndex].score = score;
    } else {
      gradebook.assignments.push({
        assignmentId,
        score,
        maxScore: assignment.maxScore,
        weightage: assignment.weightage,
        submittedAt: new Date(),
      });
    }

    let totalWeightedScore = 0;
    let totalWeightage = 0;

    for (const a of gradebook.assignments) {
      totalWeightedScore += (a.score / a.maxScore) * a.weightage;
      totalWeightage += a.weightage;
    }

    gradebook.totalScore = totalWeightedScore;
    gradebook.averageScore =
      totalWeightage > 0 ? (totalWeightedScore / totalWeightage) * 100 : 0;

    gradebook.grade = this.calculateGrade(gradebook.averageScore);
    gradebook.gradePoint = this.calculateGradePoint(gradebook.averageScore);

    await gradebook.save();
    return gradebook;
  }

  static async getGradebook(tenantId: string, studentId: string, academicYearId: string) {
    const gradebooks = await Gradebook.find({
      tenantId,
      studentId,
      academicYearId,
    }).lean();

    return await attachRefs(gradebooks, {
      subjectId: { model: Subject, fields: 'name code' },
    });
  }

  static async getStudentProgress(tenantId: string, studentId: string, academicYearId: string) {
    const gradebooks = await Gradebook.find({
      tenantId,
      studentId,
      academicYearId,
    }).lean();

    const withRefs = await attachRefs(gradebooks, {
      subjectId: { model: Subject, fields: 'name code' },
    });

    let totalScore = 0;
    let subjectCount = 0;

    const subjects = withRefs.map((g: any) => ({
      subject: g.subjectId,
      score: g.averageScore,
      grade: g.grade,
      gradePoint: g.gradePoint,
    }));

    for (const g of withRefs) {
      totalScore += g.averageScore || 0;
      subjectCount++;
    }

    const overallAverage = subjectCount > 0 ? totalScore / subjectCount : 0;
    const overallGrade = this.calculateGrade(overallAverage);

    return {
      subjects,
      overallAverage,
      overallGrade,
      overallGradePoint: this.calculateGradePoint(overallAverage),
      totalSubjects: subjectCount,
    };
  }

  // ============ Report Cards ============

  static async generateReportCard(
    tenantId: string,
    data: {
      studentId: string;
      academicYearId: string;
      term: string;
      createdBy: string;
    },
  ) {
    const student = await Student.findOne({
      _id: data.studentId,
      tenantId,
      isDeleted: false,
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const gradebooks = await Gradebook.find({
      tenantId,
      studentId: data.studentId,
      academicYearId: data.academicYearId,
    }).lean();

    if (gradebooks.length === 0) {
      throw new AppError('No grades found for this student', 404);
    }

    const withRefs = await attachRefs(gradebooks, {
      subjectId: { model: Subject, fields: 'name code' },
    });

    const subjects = withRefs.map((g: any) => ({
      subjectId:
        typeof g.subjectId === 'object' && g.subjectId
          ? g.subjectId._id.toString()
          : String(g.subjectId),
      name:
        typeof g.subjectId === 'object' && g.subjectId
          ? g.subjectId.name
          : 'Unknown',
      score: g.averageScore,
      grade: g.grade,
      gradePoint: g.gradePoint,
    }));

    let totalScore = 0;
    let totalGradePoint = 0;

    for (const s of subjects) {
      totalScore += s.score;
      totalGradePoint += s.gradePoint;
    }

    const averageScore = subjects.length > 0 ? totalScore / subjects.length : 0;
    const averageGradePoint =
      subjects.length > 0 ? totalGradePoint / subjects.length : 0;

    const attendance = 0; // TODO: integrate with attendance service

    let reportCard = await ReportCard.findOne({
      tenantId,
      studentId: data.studentId,
      academicYearId: data.academicYearId,
      term: data.term,
    });

    if (reportCard) {
      reportCard.subjects = subjects;
      reportCard.totalScore = totalScore;
      reportCard.averageScore = averageScore;
      reportCard.grade = this.calculateGrade(averageScore);
      reportCard.gradePoint = averageGradePoint;
      reportCard.attendance = attendance;
      reportCard.generatedAt = new Date();
      reportCard.createdBy = data.createdBy;
    } else {
      reportCard = new ReportCard({
        tenantId,
        studentId: data.studentId,
        academicYearId: data.academicYearId,
        term: data.term,
        subjects,
        totalScore,
        averageScore,
        grade: this.calculateGrade(averageScore),
        gradePoint: averageGradePoint,
        attendance,
        generatedAt: new Date(),
        createdBy: data.createdBy,
        status: 'draft',
      });
    }

    await reportCard.save();
    return reportCard;
  }

  static async getReportCards(
    tenantId: string,
    filters: {
      studentId?: string;
      academicYearId?: string;
      term?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const query: any = { tenantId };

    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.academicYearId) query.academicYearId = filters.academicYearId;
    if (filters.term) query.term = filters.term;
    if (filters.status) query.status = filters.status;

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [rawCards, total] = await Promise.all([
      ReportCard.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReportCard.countDocuments(query),
    ]);

    const items = await attachRefs(rawCards, {
      studentId: { model: Student, fields: 'firstName lastName rollNo grade section' },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getReportCardById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid report card ID', 400);
    }

    const raw = await ReportCard.findById(id).lean();
    if (!raw) {
      throw new AppError('Report card not found', 404);
    }

    const [card] = await attachRefs([raw], {
      studentId: { model: Student, fields: 'firstName lastName rollNo grade section' },
    });

    return card;
  }

  static async publishReportCard(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid report card ID', 400);
    }

    const reportCard = await ReportCard.findByIdAndUpdate(
      id,
      { $set: { status: 'published' } },
      { new: true },
    );

    if (!reportCard) {
      throw new AppError('Report card not found', 404);
    }

    return reportCard;
  }

  // ============ Helper Functions ============

  static calculateGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    return 'F';
  }

  static calculateGradePoint(score: number): number {
    if (score >= 90) return 10;
    if (score >= 80) return 9;
    if (score >= 70) return 8;
    if (score >= 60) return 7;
    if (score >= 50) return 6;
    if (score >= 40) return 5;
    return 0;
  }

  static async getAssignmentStats(tenantId: string, assignmentId: string) {
    const submissions = await Submission.find({
      tenantId,
      assignmentId,
    });

    const total = submissions.length;
    const graded = submissions.filter(s => s.status === 'graded').length;
    const pending = submissions.filter(s => s.status === 'submitted').length;
    const notSubmitted = 0;

    const scores = submissions
      .filter(s => s.score !== undefined)
      .map(s => s.score!);
    const averageScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return {
      total,
      graded,
      pending,
      notSubmitted,
      averageScore,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
    };
  }
}