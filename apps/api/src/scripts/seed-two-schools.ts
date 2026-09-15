/**
 * Seed two fully-populated schools for end-to-end testing.
 *
 * Run with:
 *   cd apps/api && pnpm tsx src/scripts/seed-two-schools.ts
 *
 * Or add to package.json:
 *   "seed:two-schools": "tsx src/scripts/seed-two-schools.ts"
 *
 * Idempotent — deletes prior test data for both schools before re-creating.
 *
 * IMPORTANT: Passwords are plaintext. The User pre-save hook hashes them
 * exactly once. Do NOT call bcrypt.hash() here — that would double-hash.
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

/* ─────────────────────────────────────────────────────────────
   Sample data
   ───────────────────────────────────────────────────────────── */

interface SchoolSpec {
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  admin: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  teachers: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    subject: string;
    qualification: string;
    gender: 'male' | 'female';
    dob: string;
    isClassTeacherOf?: { gradeCode: string; sectionCode: string };
  }[];
  students: {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female';
    dob: string;
    gradeCode: string;
    sectionCode: string;
    rollNo: string;
    admissionNo: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
  }[];
  guardians: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    relationship: 'father' | 'mother' | 'guardian';
    linkedStudentRollNo: string;
  }[];
}

const SCHOOLS: SchoolSpec[] = [
  {
    name: 'Sunrise Public School',
    slug: 'sunrise-public-school',
    address: 'Sector 62, Greater Noida, Uttar Pradesh',
    phone: '9876543201',
    email: 'info@sunrisegpn.edu.in',
    admin: {
      email: 'principal@sunrisegpn.edu.in',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '9876543201',
    },
    teachers: [
      {
        email: 'priya.sharma@sunrisegpn.edu.in',
        firstName: 'Priya',
        lastName: 'Sharma',
        phone: '9876543101',
        subject: 'Mathematics',
        qualification: 'M.Sc. Mathematics',
        gender: 'female',
        dob: '1988-08-15',
        isClassTeacherOf: { gradeCode: 'C5', sectionCode: 'C5A' },
      },
      {
        email: 'amit.verma@sunrisegpn.edu.in',
        firstName: 'Amit',
        lastName: 'Verma',
        phone: '9876543102',
        subject: 'Science',
        qualification: 'M.Sc. Physics, B.Ed.',
        gender: 'male',
        dob: '1985-03-22',
        isClassTeacherOf: { gradeCode: 'C5', sectionCode: 'C5B' },
      },
      {
        email: 'neha.singh@sunrisegpn.edu.in',
        firstName: 'Neha',
        lastName: 'Singh',
        phone: '9876543103',
        subject: 'English',
        qualification: 'M.A. English',
        gender: 'female',
        dob: '1992-11-10',
        isClassTeacherOf: { gradeCode: 'C6', sectionCode: 'C6A' },
      },
    ],
    students: [
      {
        firstName: 'Arjun',
        lastName: 'Mehta',
        gender: 'male',
        dob: '2013-06-15',
        gradeCode: 'C5',
        sectionCode: 'C5A',
        rollNo: 'C5A001',
        admissionNo: '25-SUN-0001',
        parentName: 'Suresh Mehta',
        parentPhone: '9876540001',
        parentEmail: 'suresh.mehta@gmail.com',
      },
      {
        firstName: 'Ananya',
        lastName: 'Iyer',
        gender: 'female',
        dob: '2013-09-03',
        gradeCode: 'C5',
        sectionCode: 'C5A',
        rollNo: 'C5A002',
        admissionNo: '25-SUN-0002',
        parentName: 'Ramesh Iyer',
        parentPhone: '9876540002',
        parentEmail: 'ramesh.iyer@gmail.com',
      },
      {
        firstName: 'Rohan',
        lastName: 'Gupta',
        gender: 'male',
        dob: '2012-12-28',
        gradeCode: 'C5',
        sectionCode: 'C5A',
        rollNo: 'C5A003',
        admissionNo: '25-SUN-0003',
        parentName: 'Naveen Gupta',
        parentPhone: '9876540003',
        parentEmail: 'naveen.gupta@gmail.com',
      },
      {
        firstName: 'Kavya',
        lastName: 'Reddy',
        gender: 'female',
        dob: '2013-04-12',
        gradeCode: 'C5',
        sectionCode: 'C5B',
        rollNo: 'C5B001',
        admissionNo: '25-SUN-0004',
        parentName: 'Mohan Reddy',
        parentPhone: '9876540004',
        parentEmail: 'mohan.reddy@gmail.com',
      },
      {
        firstName: 'Aditya',
        lastName: 'Nair',
        gender: 'male',
        dob: '2012-07-07',
        gradeCode: 'C6',
        sectionCode: 'C6A',
        rollNo: 'C6A001',
        admissionNo: '25-SUN-0005',
        parentName: 'Vijay Nair',
        parentPhone: '9876540005',
        parentEmail: 'vijay.nair@gmail.com',
      },
    ],
    guardians: [
      {
        email: 'suresh.mehta@gmail.com',
        firstName: 'Suresh',
        lastName: 'Mehta',
        phone: '9876540001',
        relationship: 'father',
        linkedStudentRollNo: 'C5A001',
      },
      {
        email: 'ramesh.iyer@gmail.com',
        firstName: 'Ramesh',
        lastName: 'Iyer',
        phone: '9876540002',
        relationship: 'father',
        linkedStudentRollNo: 'C5A002',
      },
    ],
  },
  {
    name: 'Green Valley International School',
    slug: 'green-valley-international',
    address: 'Whitefield, Bengaluru, Karnataka',
    phone: '9876543210',
    email: 'info@greenvalley.edu.in',
    admin: {
      email: 'principal@greenvalley.edu.in',
      firstName: 'Meera',
      lastName: 'Pillai',
      phone: '9876543210',
    },
    teachers: [
      {
        email: 'kavita.rao@greenvalley.edu.in',
        firstName: 'Kavita',
        lastName: 'Rao',
        phone: '9876543201',
        subject: 'Mathematics',
        qualification: 'M.Sc. Mathematics, B.Ed.',
        gender: 'female',
        dob: '1987-05-20',
        isClassTeacherOf: { gradeCode: 'C5', sectionCode: 'C5A' },
      },
      {
        email: 'vikram.desai@greenvalley.edu.in',
        firstName: 'Vikram',
        lastName: 'Desai',
        phone: '9876543202',
        subject: 'Science',
        qualification: 'M.Sc. Chemistry',
        gender: 'male',
        dob: '1984-09-12',
        isClassTeacherOf: { gradeCode: 'C6', sectionCode: 'C6A' },
      },
    ],
    students: [
      {
        firstName: 'Aarav',
        lastName: 'Kulkarni',
        gender: 'male',
        dob: '2013-08-18',
        gradeCode: 'C5',
        sectionCode: 'C5A',
        rollNo: 'C5A001',
        admissionNo: '25-GVI-0001',
        parentName: 'Sanjay Kulkarni',
        parentPhone: '9876541001',
        parentEmail: 'sanjay.kulkarni@gmail.com',
      },
      {
        firstName: 'Diya',
        lastName: 'Rao',
        gender: 'female',
        dob: '2013-10-05',
        gradeCode: 'C5',
        sectionCode: 'C5A',
        rollNo: 'C5A002',
        admissionNo: '25-GVI-0002',
        parentName: 'Ashok Rao',
        parentPhone: '9876541002',
        parentEmail: 'ashok.rao@gmail.com',
      },
      {
        firstName: 'Ishaan',
        lastName: 'Patel',
        gender: 'male',
        dob: '2012-05-22',
        gradeCode: 'C6',
        sectionCode: 'C6A',
        rollNo: 'C6A001',
        admissionNo: '25-GVI-0003',
        parentName: 'Nikhil Patel',
        parentPhone: '9876541003',
        parentEmail: 'nikhil.patel@gmail.com',
      },
    ],
    guardians: [
      {
        email: 'sanjay.kulkarni@gmail.com',
        firstName: 'Sanjay',
        lastName: 'Kulkarni',
        phone: '9876541001',
        relationship: 'father',
        linkedStudentRollNo: 'C5A001',
      },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

async function cleanupTenant(slug: string) {
  const existing = await Tenant.findOne({ slug });
  if (!existing) return;

  console.log(`🧹 Cleaning up existing data for "${slug}"…`);
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

/* ─────────────────────────────────────────────────────────────
   Main seeder
   ───────────────────────────────────────────────────────────── */

async function seedSchool(spec: SchoolSpec) {
  /* ── 1. Tenant ── */
  const tenant = await Tenant.create({
    name: spec.name,
    slug: spec.slug,
    schoolCode: generateSchoolCode(),
    address: spec.address,
    phone: spec.phone,
    email: spec.email,
    status: 'active',
    emailVerified: true,
    approvedBy: 'seed-script',
    approvedAt: new Date(),
    settings: {
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      language: 'en-IN',
      allowedTeacherEmailDomains: [], // empty = allow all
    },
  });

  const tid = tenant._id.toString();
  console.log(`🏫 Created school: ${tenant.name} (${tenant.schoolCode})`);

  /* ── 2. Academic Year ── */
  const academicYear = await AcademicYear.create({
    tenantId: tid,
    name: '2025-26',
    code: 'AY2025',
    startDate: new Date('2025-04-01'),
    endDate: new Date('2026-03-31'),
    isCurrent: true,
    status: 'active',
  });

  /* ── 3. Grades ── */
  const gradesMap = new Map<string, mongoose.Types.ObjectId>();

  const gradeSpecs = [
    { name: 'Class 5', code: 'C5', sequence: 5 },
    { name: 'Class 6', code: 'C6', sequence: 6 },
    { name: 'Class 7', code: 'C7', sequence: 7 },
  ];

  for (const g of gradeSpecs) {
    const grade = await Grade.create({
      tenantId: tid,
      name: g.name,
      code: g.code,
      sequence: g.sequence,
    });
    gradesMap.set(g.code, grade._id as mongoose.Types.ObjectId);
  }

  /* ── 4. Sections ── */
  const sectionsMap = new Map<string, mongoose.Types.ObjectId>();

  const sectionSpecs = [
    { code: 'C5A', name: 'A', gradeCode: 'C5', capacity: 40 },
    { code: 'C5B', name: 'B', gradeCode: 'C5', capacity: 40 },
    { code: 'C6A', name: 'A', gradeCode: 'C6', capacity: 40 },
    { code: 'C7A', name: 'A', gradeCode: 'C7', capacity: 40 },
  ];

  for (const s of sectionSpecs) {
    const section = await Section.create({
      tenantId: tid,
      gradeId: gradesMap.get(s.gradeCode)!.toString(),
      name: s.name,
      code: s.code,
      capacity: s.capacity,
    });
    sectionsMap.set(s.code, section._id as mongoose.Types.ObjectId);
  }

  /* ── 5. Subjects ── */
  await Subject.insertMany([
    { tenantId: tid, name: 'Mathematics', code: 'MATH', isElective: false },
    { tenantId: tid, name: 'Science', code: 'SCI', isElective: false },
    { tenantId: tid, name: 'English', code: 'ENG', isElective: false },
    { tenantId: tid, name: 'Hindi', code: 'HIN', isElective: false },
    { tenantId: tid, name: 'Social Studies', code: 'SST', isElective: false },
    { tenantId: tid, name: 'Computer Science', code: 'CS', isElective: false },
  ]);

  /* ── 6. Admin ── */
  await User.create({
    tenantId: tid,
    email: spec.admin.email,
    passwordHash: 'Admin@2024',
    firstName: spec.admin.firstName,
    lastName: spec.admin.lastName,
    role: 'admin',
    phone: spec.admin.phone,
    status: 'active',
    emailVerified: true,
    approvedBy: 'seed-script',
    approvedAt: new Date(),
  });

  /* ── 7. Teachers ── */
  for (let i = 0; i < spec.teachers.length; i++) {
    const t = spec.teachers[i];

    const user = await User.create({
      tenantId: tid,
      email: t.email,
      passwordHash: 'Teacher@2024',
      firstName: t.firstName,
      lastName: t.lastName,
      role: 'teacher',
      phone: t.phone,
      dateOfBirth: new Date(t.dob),
      gender: t.gender,
      status: 'active',
      emailVerified: true,
      approvedBy: spec.admin.email,
      approvedAt: new Date(),
    });

    const teacher = await Teacher.create({
      tenantId: tid,
      userId: user._id.toString(),
      employeeId: `EMP-25-${spec.slug.toUpperCase().slice(0, 3)}-${String(i + 1).padStart(4, '0')}`,
      firstName: t.firstName,
      lastName: t.lastName,
      dateOfBirth: new Date(t.dob),
      gender: t.gender,
      phone: t.phone,
      email: t.email,
      address: {
        city: 'N/A',
        state: 'N/A',
        country: 'India',
        postalCode: '000000',
      },
      qualifications: [
        {
          degree: t.qualification,
          institution: 'N/A',
          year: 2020,
        },
      ],
      experience: [],
      subjects: [t.subject],
      assignedSections: [],
      specialization: [],
      joiningDate: new Date('2023-04-01'),
      employmentType: 'permanent',
      emergencyContact: {
        name: t.firstName,
        phone: t.phone,
        relationship: 'self',
      },
      status: 'active',
      approvedBy: spec.admin.email,
      approvedAt: new Date(),
      isDeleted: false,
    });

    // Assign as class teacher if specified
    if (t.isClassTeacherOf) {
      const sectionId = sectionsMap.get(t.isClassTeacherOf.sectionCode);
      if (sectionId) {
        await Section.updateOne(
          { _id: sectionId },
          { $set: { classTeacherId: teacher._id.toString() } },
        );
      }
    }
  }

  /* ── 8. Students ── */
  const studentDocMap = new Map<string, mongoose.Types.ObjectId>();

  for (let i = 0; i < spec.students.length; i++) {
    const s = spec.students[i];
    const email = `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@student.${spec.slug.split('-')[0]}.edu.in`;

    const user = await User.create({
      tenantId: tid,
      email,
      passwordHash: 'Student@2024',
      firstName: s.firstName,
      lastName: s.lastName,
      role: 'student',
      dateOfBirth: new Date(s.dob),
      gender: s.gender,
      status: 'active',
      emailVerified: true,
      approvedBy: spec.admin.email,
      approvedAt: new Date(),
    });

    const sectionId = sectionsMap.get(s.sectionCode);

    const student = await Student.create({
      tenantId: tid,
      userId: user._id.toString(),
      admissionNo: s.admissionNo,
      rollNo: s.rollNo,
      firstName: s.firstName,
      lastName: s.lastName,
      grade: gradeSpecs.find(g => g.code === s.gradeCode)!.name,
      section: sectionSpecs.find(sec => sec.code === s.sectionCode)!.name,
      sectionId: sectionId?.toString(),
      dateOfBirth: new Date(s.dob),
      gender: s.gender,
      guardians: [
        {
          name: s.parentName,
          phone: s.parentPhone,
          email: s.parentEmail,
          relationship: 'father',
          isVerified: false,
        },
      ],
      address: {
        city: 'N/A',
        state: 'N/A',
        country: 'India',
        postalCode: '000000',
      },
      emergencyContact: {
        name: s.parentName,
        phone: s.parentPhone,
        relationship: 'guardian',
      },
      enrollments: [
        {
          academicYearId: academicYear._id.toString(),
          sectionId: sectionId!.toString(),
          rollNo: s.rollNo,
          enrollmentDate: new Date(),
          status: 'active',
        },
      ],
      status: 'active',
      approvedBy: spec.admin.email,
      approvedAt: new Date(),
      isDeleted: false,
    });

    studentDocMap.set(s.rollNo, student._id as mongoose.Types.ObjectId);
  }

  /* ── 9. Guardians ── */
  for (let i = 0; i < spec.guardians.length; i++) {
    const g = spec.guardians[i];

    const user = await User.create({
      tenantId: tid,
      email: g.email,
      passwordHash: 'Guardian@2024',
      firstName: g.firstName,
      lastName: g.lastName,
      role: 'guardian',
      phone: g.phone,
      status: 'active',
      emailVerified: true,
      approvedBy: spec.admin.email,
      approvedAt: new Date(),
    });

    // Link the guardian to the referenced student
    const studentId = studentDocMap.get(g.linkedStudentRollNo);
    if (studentId) {
      await Student.updateOne(
        { _id: studentId },
        {
          $push: {
            guardians: {
              userId: user._id.toString(),
              name: `${g.firstName} ${g.lastName}`,
              phone: g.phone,
              email: g.email,
              relationship: g.relationship,
              isVerified: true,
            },
          },
        },
      );
    }
  }

  /* ── Return summary ── */
  return {
    tenant,
    academicYear,
    counts: {
      grades: gradesMap.size,
      sections: sectionsMap.size,
      teachers: spec.teachers.length,
      students: spec.students.length,
      guardians: spec.guardians.length,
    },
  };
}

/* ─────────────────────────────────────────────────────────────
   Entrypoint
   ───────────────────────────────────────────────────────────── */

async function main() {
  await mongoose.connect(config.mongodb.uri);
  console.log('🌱 Connected to MongoDB\n');

  // Clean up any prior test data
  for (const spec of SCHOOLS) {
    await cleanupTenant(spec.slug);
  }

  const results = [];

  for (const spec of SCHOOLS) {
    console.log(`\n▶️  Seeding ${spec.name}…`);
    const result = await seedSchool(spec);
    results.push({ spec, result });
    console.log(`✅ ${spec.name} seeded`);
  }

  /* ── Print summary ── */
  console.log('\n\n══════════════════════════════════════════════════════════');
  console.log('🎉 SEED COMPLETE');
  console.log('══════════════════════════════════════════════════════════\n');

  for (const { spec, result } of results) {
    console.log(`\n🏫 ${spec.name}`);
    console.log(`   School Code: ${result.tenant.schoolCode}`);
    console.log(`   Formatted:   ${formatSchoolCode(result.tenant.schoolCode)}`);
    console.log(`   Slug:        ${spec.slug}`);
    console.log('');
    console.log('   👨‍💼 Admin');
    console.log(`      Email:    ${spec.admin.email}`);
    console.log(`      Password: Admin@2024`);
    console.log('');
    console.log('   👨‍🏫 Teachers (password: Teacher@2024)');
    for (const t of spec.teachers) {
      const ct = t.isClassTeacherOf
        ? ` — class teacher of ${t.isClassTeacherOf.sectionCode}`
        : '';
      console.log(`      ${t.email}${ct}`);
    }
    console.log('');
    console.log('   👨‍🎓 Students (password: Student@2024)');
    for (const s of spec.students) {
      const email = `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@student.${spec.slug.split('-')[0]}.edu.in`;
      console.log(`      ${email} (roll: ${s.rollNo}, adm: ${s.admissionNo})`);
    }
    console.log('');
    console.log('   👪 Guardians (password: Guardian@2024)');
    for (const g of spec.guardians) {
      console.log(`      ${g.email} — parent of ${g.linkedStudentRollNo}`);
    }
    console.log('');
    console.log('   📊 Counts');
    console.log(`      Grades:   ${result.counts.grades}`);
    console.log(`      Sections: ${result.counts.sections}`);
    console.log(`      Teachers: ${result.counts.teachers}`);
    console.log(`      Students: ${result.counts.students}`);
    console.log(`      Guardians: ${result.counts.guardians}`);
  }

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('🧪 QUICK TEST CHECKLIST');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`
1. Student self-registration (verified path)
   → /register
   → Enter school code (Sunrise)
   → Pick Student
   → Fill details
   → Roll: C5A001, Admission: 25-SUN-0001
   → Should show "✓ We found your record"
   → Submit → "Waiting for approval"

2. Student self-registration (unverified path)
   → /register
   → Enter school code (Sunrise)
   → Pick Student
   → Fill details
   → Leave roll + admission blank
   → Submit → "Waiting for approval"

3. Teacher approves a student
   → Log in as priya.sharma@sunrisegpn.edu.in (Teacher@2024)
   → /teacher/approvals/students
   → Approve the pending student

4. Admin approves a student
   → Log in as principal@sunrisegpn.edu.in (Admin@2024)
   → /admin/approvals/students
   → Approve any remaining pending students

5. Add student from admin panel
   → Log in as admin
   → /students/add
   → Fill form → should generate a temp password

6. Cross-tenant isolation
   → Log in as Sunrise admin → check /students
   → Only Sunrise students should appear
   → Log in as Green Valley admin → only Green Valley students
`);

  await mongoose.disconnect();
  console.log('\n👋 Disconnected. Done.\n');
}

function formatSchoolCode(code: string): string {
  if (!code || code.length !== 10) return code || '';
  return `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 10)}`;
}

main().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});