import mongoose from 'mongoose';
import { Student } from '../../models/Student';
import { AppError } from '../../middleware/error-handler';
import { v4 as uuidv4 } from 'uuid';

export class StudentService {
  static async verifyRollNo(rollNo: string, tenantId: string) {
    // Normalize roll number
    const normalizedRollNo = rollNo.trim().toUpperCase();
    
    const student = await Student.findOne({
      tenantId,
      rollNo: normalizedRollNo,
      status: 'active',
    });
    
    if (!student) {
      return { valid: false };
    }
    
    // Return limited student info for verification
    return {
      valid: true,
      student: {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        grade: student.grade,
        section: student.section,
        rollNo: student.rollNo,
        hasGuardian: student.guardians.length > 0,
      },
    };
  }

  static async getStudentsByTenant(tenantId: string) {
    const students = await Student.find({ tenantId, status: 'active' })
      .select('firstName lastName grade section rollNo guardians')
      .sort({ grade: 1, lastName: 1 });
    
    return students.map(s => ({
      id: s._id,
      firstName: s.firstName,
      lastName: s.lastName,
      grade: s.grade,
      section: s.section,
      rollNo: s.rollNo,
      hasGuardian: s.guardians.length > 0,
    }));
  }

  static async getStudentById(studentId: string) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID', 400);
    }
    
    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    
    return student;
  }

  static async createStudent(data: any) {
    // Check if roll number already exists for this tenant
    const existingRollNo = await Student.findOne({
      tenantId: data.tenantId,
      rollNo: data.rollNo,
    });
    
    if (existingRollNo) {
      throw new AppError('Roll number already exists for this school', 409);
    }
    
    const student = await Student.create(data);
    return student;
  }

  static async updateStudent(studentId: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID', 400);
    }
    
    const student = await Student.findByIdAndUpdate(
      studentId,
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    
    return student;
  }

  static async verifyGuardian(studentId: string, verificationCode: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID', 400);
    }
    
    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    
    // Find guardian with matching verification code
    const guardianIndex = student.guardians.findIndex(
      g => g.verificationCode === verificationCode && !g.isVerified
    );
    
    if (guardianIndex === -1) {
      throw new AppError('Invalid or already used verification code', 400);
    }
    
    // Update guardian
    student.guardians[guardianIndex].isVerified = true;
    student.guardians[guardianIndex].userId = userId;
    student.guardians[guardianIndex].verificationCode = undefined;
    
    await student.save();
    
    return {
      studentId: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      guardianName: student.guardians[guardianIndex].name,
    };
  }

  static async generateVerificationCode(): Promise<string> {
    // Generate a 6-digit alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return code;
  }
}