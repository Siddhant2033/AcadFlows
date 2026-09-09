import mongoose from 'mongoose';
import { Assignment, Submission, Gradebook, ReportCard } from '../../models/Assignment';
import { Student } from '../../models/Student';
import { Subject } from '../../models/Subject';
import { AppError } from '../../middleware/error-handler';

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
      page?: number;
      limit?: number;
    }
  ) {
    const query: any = { tenantId };

    if (filters.sectionId) query.sectionId = filters.sectionId;
    if (filters.subjectId) query.subjectId = filters.subjectId;
    if (filters.teacherId) query.teacherId = filters.teacherId;
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [assignments, total] = await Promise.all([
      Assignment.find(query)
        .populate('subjectId', 'name code')
        .populate('sectionId', 'name')
        .populate('teacherId', 'firstName lastName')
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limit),
      Assignment.countDocuments(query),
    ]);

    return {
      items: assignments,
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

    const assignment = await Assignment.findById(id)
      .populate('subjectId', 'name code')
      .populate('sectionId', 'name')
      .populate('teacherId', 'firstName lastName');

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

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
      { new: true, runValidators: true }
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

    // Also delete all submissions
    await Submission.deleteMany({ assignmentId: id });

    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    return assignment;
  }

  // ============ Submissions ============

  static async submitAssignment(tenantId: string, data: any) {
    // Check if assignment exists and is published
    const assignment = await Assignment.findOne({
      _id: data.assignmentId,
      tenantId,
      status: 'published',
    });

    if (!assignment) {
      throw new AppError('Assignment not found or not published', 404);
    }

    // Check if student already submitted
    const existingSubmission = await Submission.findOne({
      assignmentId: data.assignmentId,
      studentId: data.studentId,
    });

    if (existingSubmission) {
      throw new AppError('You have already submitted this assignment', 409);
    }

    // Check if late
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
    }
  ) {
    const query: any = { tenantId };

    if (filters.assignmentId) query.assignmentId = filters.assignmentId;
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.status) query.status = filters.status;

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .populate('studentId', 'firstName lastName rollNo')
        .populate('assignmentId', 'title maxScore dueDate')
        .populate('gradedBy', 'firstName lastName')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      Submission.countDocuments(query),
    ]);

    return {
      items: submissions,
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

    const submission = await Submission.findById(id)
      .populate('studentId', 'firstName lastName rollNo')
      .populate('assignmentId', 'title maxScore dueDate')
      .populate('gradedBy', 'firstName lastName');

    if (!submission) {
      throw new AppError('Submission not found', 404);
    }

    return submission;
  }

  static async gradeSubmission(
    submissionId: string,
    data: {
      score: number;
      feedback: string;
      gradedBy: string;
    }
  ) {
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      throw new AppError('Invalid submission ID', 400);
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new AppError('Submission not found', 404);
    }

    // Update submission
    submission.score = data.score;
    submission.feedback = data.feedback;
    submission.gradedBy = data.gradedBy;
    submission.gradedAt = new Date();
    submission.status = 'graded';

    await submission.save();

    // Update gradebook
    await this.updateGradebook(
      submission.tenantId,
      submission.studentId,
      submission.assignmentId,
      data.score
    );

    return submission;
  }

  // ============ Gradebook ============

  static async updateGradebook(tenantId: string, studentId: string, assignmentId: string, score: number) {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return;

    // Find or create gradebook entry
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

    // Update or add assignment
    const existingIndex = gradebook.assignments.findIndex(
      (a: any) => a.assignmentId === assignmentId
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

    // Calculate totals
    let totalWeightedScore = 0;
    let totalWeightage = 0;

    for (const a of gradebook.assignments) {
      totalWeightedScore += (a.score / a.maxScore) * a.weightage;
      totalWeightage += a.weightage;
    }

    gradebook.totalScore = totalWeightedScore;
    gradebook.averageScore = totalWeightage > 0 ? (totalWeightedScore / totalWeightage) * 100 : 0;

    // Calculate grade
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
    }).populate('subjectId', 'name code');

    return gradebooks;
  }

  static async getStudentProgress(tenantId: string, studentId: string, academicYearId: string) {
    const gradebooks = await Gradebook.find({
      tenantId,
      studentId,
      academicYearId,
    }).populate('subjectId', 'name code');

    // Calculate overall averages
    let totalScore = 0;
    let subjectCount = 0;

    const subjects = gradebooks.map((g) => ({
      subject: g.subjectId,
      score: g.averageScore,
      grade: g.grade,
      gradePoint: g.gradePoint,
    }));

    for (const g of gradebooks) {
      totalScore += g.averageScore;
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
    }
  ) {
    // Get student
    const student = await Student.findOne({
      _id: data.studentId,
      tenantId,
      isDeleted: false,
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    // Get gradebook for all subjects
    const gradebooks = await Gradebook.find({
      tenantId,
      studentId: data.studentId,
      academicYearId: data.academicYearId,
    }).populate('subjectId', 'name code');

    if (gradebooks.length === 0) {
      throw new AppError('No grades found for this student', 404);
    }

    // Build report card subjects
    const subjects = gradebooks.map((g) => ({
      subjectId:
        typeof g.subjectId === 'string'
          ? g.subjectId
          : (g.subjectId as { _id: string })._id,
      name: typeof g.subjectId === 'string' ? g.subjectId : (g.subjectId as { name: string }).name,
      score: g.averageScore,
      grade: g.grade,
      gradePoint: g.gradePoint,
    }));

    // Calculate totals
    let totalScore = 0;
    let totalGradePoint = 0;

    for (const s of subjects) {
      totalScore += s.score;
      totalGradePoint += s.gradePoint;
    }

    const averageScore = subjects.length > 0 ? totalScore / subjects.length : 0;
    const averageGradePoint = subjects.length > 0 ? totalGradePoint / subjects.length : 0;

    // Get attendance (from attendance service)
    // For MVP, we'll use mock data or 0
    const attendance = 0; // TODO: Integrate with attendance service

    // Check if report card already exists
    let reportCard = await ReportCard.findOne({
      tenantId,
      studentId: data.studentId,
      academicYearId: data.academicYearId,
      term: data.term,
    });

    if (reportCard) {
      // Update existing
      reportCard.subjects = subjects;
      reportCard.totalScore = totalScore;
      reportCard.averageScore = averageScore;
      reportCard.grade = this.calculateGrade(averageScore);
      reportCard.gradePoint = averageGradePoint;
      reportCard.attendance = attendance;
      reportCard.generatedAt = new Date();
      reportCard.createdBy = data.createdBy;
    } else {
      // Create new
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
    }
  ) {
    const query: any = { tenantId };

    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.academicYearId) query.academicYearId = filters.academicYearId;
    if (filters.term) query.term = filters.term;
    if (filters.status) query.status = filters.status;

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [reportCards, total] = await Promise.all([
      ReportCard.find(query)
        .populate('studentId', 'firstName lastName rollNo grade section')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ReportCard.countDocuments(query),
    ]);

    return {
      items: reportCards,
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

    const reportCard = await ReportCard.findById(id)
      .populate('studentId', 'firstName lastName rollNo grade section')
      .populate('subjects.subjectId', 'name code');

    if (!reportCard) {
      throw new AppError('Report card not found', 404);
    }

    return reportCard;
  }

  static async publishReportCard(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid report card ID', 400);
    }

    const reportCard = await ReportCard.findByIdAndUpdate(
      id,
      { $set: { status: 'published' } },
      { new: true }
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

  // Get assignment statistics
  static async getAssignmentStats(tenantId: string, assignmentId: string) {
    const submissions = await Submission.find({
      tenantId,
      assignmentId,
    });

    const total = submissions.length;
    const graded = submissions.filter(s => s.status === 'graded').length;
    const pending = submissions.filter(s => s.status === 'submitted').length;
    const notSubmitted = 0; // Would need to get total students

    const scores = submissions.filter(s => s.score !== undefined).map(s => s.score!);
    const averageScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;

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