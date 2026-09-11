/**
 * Seed a full test dataset for Sunrise Public School.
 * Run with: tsx src/scripts/seed-sunrise-test.ts
 *
 * IMPORTANT: Passwords are passed as plaintext. The User pre-save hook
 * hashes them exactly once. Do NOT call bcrypt.hash() here — that would
 * result in a double-hash and break login.
 */
import mongoose from 'mongoose';
import { config } from '../config';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { AcademicYear } from '../models/AcademicYear';
import { Grade } from '../models/Grade';
import { Section } from '../models/Section';
import { Subject } from '../models/Subject';
import { generateSchoolCode } from '../utils/random';

async function seed() {
  await mongoose.connect(config.mongodb.uri);
  console.log('🌱 Connected');

  // Clear any existing test data for this school
  const existing = await Tenant.findOne({ slug: 'sunrise-public-school' });
  if (existing) {
    console.log('🧹 Cleaning up existing Sunrise test data...');
    const tid = existing._id.toString();
    await Promise.all([
      User.deleteMany({ tenantId: tid }),
      Student.deleteMany({ tenantId: tid }),
      Teacher.deleteMany({ tenantId: tid }),
      Grade.deleteMany({ tenantId: tid }),
      Section.deleteMany({ tenantId: tid }),
      Subject.deleteMany({ tenantId: tid }),
      AcademicYear.deleteMany({ tenantId: tid }),
    ]);
    await Tenant.deleteOne({ _id: existing._id });
  }

  // 1. Tenant
  const tenant = await Tenant.create({
    name: 'Sunrise Public School',
    slug: 'sunrise-public-school',
    schoolCode: generateSchoolCode(),
    address: 'Sector 62, Greater Noida, Uttar Pradesh',
    phone: '9876543201',
    email: 'info@sunrisegpn.edu.in',
    status: 'active',
    settings: {
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      language: 'en-IN',
    },
  });
  const tid = tenant._id.toString();
  console.log(`🏫 School created: ${tenant.schoolCode}`);

  // 2. Academic year
  const academicYear = await AcademicYear.create({
    tenantId: tid,
    name: '2025-26',
    code: 'AY2025',
    startDate: new Date('2025-04-01'),
    endDate: new Date('2026-03-31'),
    isCurrent: true,
    status: 'active',
  });

  // 3. Grades
  const grade5 = await Grade.create({
    tenantId: tid,
    name: 'Class 5',
    code: 'C5',
    sequence: 5,
  });
  const grade6 = await Grade.create({
    tenantId: tid,
    name: 'Class 6',
    code: 'C6',
    sequence: 6,
  });
  const grade7 = await Grade.create({
    tenantId: tid,
    name: 'Class 7',
    code: 'C7',
    sequence: 7,
  });

  // 4. Sections
  const c5a = await Section.create({
    tenantId: tid,
    gradeId: grade5._id.toString(),
    name: 'A',
    code: 'C5A',
    capacity: 40,
  });
  const c5b = await Section.create({
    tenantId: tid,
    gradeId: grade5._id.toString(),
    name: 'B',
    code: 'C5B',
    capacity: 40,
  });
  const c6a = await Section.create({
    tenantId: tid,
    gradeId: grade6._id.toString(),
    name: 'A',
    code: 'C6A',
    capacity: 40,
  });
  const c7a = await Section.create({
    tenantId: tid,
    gradeId: grade7._id.toString(),
    name: 'A',
    code: 'C7A',
    capacity: 40,
  });

  // 5. Subjects
  await Subject.insertMany([
    { tenantId: tid, name: 'Mathematics', code: 'MATH', isElective: false },
    { tenantId: tid, name: 'Science', code: 'SCI', isElective: false },
    { tenantId: tid, name: 'English', code: 'ENG', isElective: false },
    { tenantId: tid, name: 'Hindi', code: 'HIN', isElective: false },
    { tenantId: tid, name: 'Social Studies', code: 'SST', isElective: false },
    { tenantId: tid, name: 'Computer Science', code: 'CS', isElective: false },
  ]);

  // 6. Admin — plaintext password; pre-save hook hashes once
  await User.create({
    tenantId: tid,
    email: 'principal@sunrisegpn.edu.in',
    passwordHash: 'Admin@2024', // ← hashed by the User model hook
    firstName: 'Rajesh',
    lastName: 'Kumar',
    role: 'admin',
    phone: '9876543201',
    status: 'active',
    emailVerified: true,
  });

  // 7. Teachers — plaintext passwords
  const teacherData = [
    {
      email: 'priya.sharma@sunrisegpn.edu.in',
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '9876543101',
      subject: 'Mathematics',
      qualification: 'M.Sc. Mathematics',
      gender: 'female' as const,
      dob: '1988-08-15',
    },
    {
      email: 'amit.verma@sunrisegpn.edu.in',
      firstName: 'Amit',
      lastName: 'Verma',
      phone: '9876543102',
      subject: 'Science',
      qualification: 'M.Sc. Physics, B.Ed.',
      gender: 'male' as const,
      dob: '1985-03-22',
    },
    {
      email: 'neha.singh@sunrisegpn.edu.in',
      firstName: 'Neha',
      lastName: 'Singh',
      phone: '9876543103',
      subject: 'English',
      qualification: 'M.A. English',
      gender: 'female' as const,
      dob: '1992-11-10',
    },
  ];

  for (let i = 0; i < teacherData.length; i++) {
    const t = teacherData[i];
    const user = await User.create({
      tenantId: tid,
      email: t.email,
      passwordHash: 'Teacher@2024', // ← hashed by hook
      firstName: t.firstName,
      lastName: t.lastName,
      role: 'teacher',
      phone: t.phone,
      dateOfBirth: new Date(t.dob),
      gender: t.gender,
      status: 'active',
      emailVerified: true,
    });

    await Teacher.create({
      tenantId: tid,
      userId: user._id.toString(),
      employeeId: `EMP-25-SUN-${String(i + 1).padStart(4, '0')}`,
      firstName: t.firstName,
      lastName: t.lastName,
      dateOfBirth: new Date(t.dob),
      gender: t.gender,
      phone: t.phone,
      email: t.email,
      address: { city: 'Noida', state: 'Uttar Pradesh', country: 'India', postalCode: '201301' },
      qualifications: [{ degree: t.qualification, institution: 'N/A', year: 2020 }],
      experience: [],
      subjects: [t.subject],
      assignedSections: [],
      specialization: [],
      joiningDate: new Date('2023-04-01'),
      employmentType: 'permanent',
      emergencyContact: { name: t.firstName, phone: t.phone, relationship: 'self' },
      status: 'active',
      isDeleted: false,
    });
  }

  // 8. Students — plaintext passwords
  const studentsData = [
    { firstName: 'Arjun', lastName: 'Mehta', grade: 'Class 5', section: c5a, gender: 'male' as const, dob: '2013-06-15' },
    { firstName: 'Ananya', lastName: 'Iyer', grade: 'Class 5', section: c5a, gender: 'female' as const, dob: '2013-09-03' },
    { firstName: 'Rohan', lastName: 'Gupta', grade: 'Class 5', section: c5a, gender: 'male' as const, dob: '2012-12-28' },
    { firstName: 'Kavya', lastName: 'Reddy', grade: 'Class 5', section: c5b, gender: 'female' as const, dob: '2013-04-12' },
    { firstName: 'Aditya', lastName: 'Nair', grade: 'Class 6', section: c6a, gender: 'male' as const, dob: '2012-07-07' },
    { firstName: 'Ishaan', lastName: 'Kapoor', grade: 'Class 6', section: c6a, gender: 'male' as const, dob: '2012-02-19' },
    { firstName: 'Diya', lastName: 'Joshi', grade: 'Class 7', section: c7a, gender: 'female' as const, dob: '2011-08-25' },
    { firstName: 'Ved', lastName: 'Patel', grade: 'Class 7', section: c7a, gender: 'male' as const, dob: '2011-11-14' },
  ];

  for (let i = 0; i < studentsData.length; i++) {
    const s = studentsData[i];
    const email = `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@student.sunrisegpn.edu.in`;

    const user = await User.create({
      tenantId: tid,
      email,
      passwordHash: 'Student@2024', // ← hashed by hook
      firstName: s.firstName,
      lastName: s.lastName,
      role: 'student',
      dateOfBirth: new Date(s.dob),
      gender: s.gender,
      status: 'active',
      emailVerified: true,
    });

    const rollNo = `${s.section.code}${String(i + 1).padStart(3, '0')}`;

    await Student.create({
      tenantId: tid,
      userId: user._id.toString(),
      admissionNo: `25-SUN-${String(i + 1).padStart(4, '0')}`,
      rollNo,
      firstName: s.firstName,
      lastName: s.lastName,
      grade: s.grade,
      section: s.section.name,
      sectionId: s.section._id.toString(),
      dateOfBirth: new Date(s.dob),
      gender: s.gender,
      guardians: [],
      address: { city: 'Noida', state: 'Uttar Pradesh', country: 'India', postalCode: '201301' },
      emergencyContact: { name: 'Parent', phone: '9876540000', relationship: 'guardian' },
      enrollments: [
        {
          academicYearId: academicYear._id.toString(),
          sectionId: s.section._id.toString(),
          rollNo,
          enrollmentDate: new Date(),
          status: 'active',
        },
      ],
      status: 'active',
      isDeleted: false,
    });
  }

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Login credentials:');
  console.log('─────────────────────────────────────────────');
  console.log(`School Code: ${tenant.schoolCode}`);
  console.log('');
  console.log('👨‍💼 Admin:      principal@sunrisegpn.edu.in / Admin@2024');
  console.log('👨‍🏫 Teacher:    priya.sharma@sunrisegpn.edu.in / Teacher@2024');
  console.log('👨‍🎓 Student:    arjun.mehta@student.sunrisegpn.edu.in / Student@2024');
  console.log('─────────────────────────────────────────────');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});