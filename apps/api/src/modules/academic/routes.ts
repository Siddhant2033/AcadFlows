import { Router } from 'express';
import {
  AcademicYearController,
  GradeController,
  SectionController,
  SubjectController,
  TeacherSubjectController,
  ScheduleController,
} from './controller';
import { authenticate, requireRole, ensureTenantMatch } from '../../middleware/auth';

const router: Router = Router();

/* ─────────────────────────────────────────────────────────────
   PUBLIC — Grades & Sections
   ─────────────────────────────────────────────────────────────
   These are read-only academic metadata used by the register flow
   (student & guardian forms) to populate dropdowns. A visitor does
   not have a session yet, so `authenticate` cannot run.

   IMPORTANT: These must be mounted BEFORE `router.use(authenticate)`
   and `router.use(ensureTenantMatch)`.
   ───────────────────────────────────────────────────────────── */

router.get('/grades', GradeController.getAll);
router.get('/sections', SectionController.getAll);

/* ─────────────────────────────────────────────────────────────
   Everything below is protected.
   ───────────────────────────────────────────────────────────── */

router.use(ensureTenantMatch);
router.use(authenticate);

// Academic Years
router.get('/academic-years', AcademicYearController.getAll);
router.post('/academic-years', requireRole('admin'), AcademicYearController.create);
router.get('/academic-years/:id', AcademicYearController.getById);
router.put('/academic-years/:id', requireRole('admin'), AcademicYearController.update);
router.delete('/academic-years/:id', requireRole('admin'), AcademicYearController.delete);
router.post('/academic-years/:id/set-current', requireRole('admin'), AcademicYearController.setCurrent);

// Grades (protected write endpoints; the public GET is above)
router.post('/grades', requireRole('admin'), GradeController.create);
router.get('/grades/:id', GradeController.getById);
router.put('/grades/:id', requireRole('admin'), GradeController.update);
router.delete('/grades/:id', requireRole('admin'), GradeController.delete);

// Sections (protected write endpoints; the public GET is above)
router.post('/sections', requireRole('admin'), SectionController.create);
router.get('/sections/:id', SectionController.getById);
router.put('/sections/:id', requireRole('admin'), SectionController.update);
router.delete('/sections/:id', requireRole('admin'), SectionController.delete);

// Subjects
router.get('/subjects', SubjectController.getAll);
router.post('/subjects', requireRole('admin'), SubjectController.create);
router.get('/subjects/:id', SubjectController.getById);
router.put('/subjects/:id', requireRole('admin'), SubjectController.update);
router.delete('/subjects/:id', requireRole('admin'), SubjectController.delete);

// Teacher Subjects
router.get('/teacher-subjects', TeacherSubjectController.getAll);
router.post('/teacher-subjects', requireRole('admin'), TeacherSubjectController.assign);
router.get('/teacher-subjects/:id', TeacherSubjectController.getById);
router.delete('/teacher-subjects/:id', requireRole('admin'), TeacherSubjectController.delete);
router.get('/teacher-subjects/teacher/:teacherId', TeacherSubjectController.getByTeacher);

// Schedules
router.get('/schedules', ScheduleController.getAll);
router.post('/schedules', requireRole('admin'), ScheduleController.create);
router.get('/schedules/:id', ScheduleController.getById);
router.put('/schedules/:id', requireRole('admin'), ScheduleController.update);
router.delete('/schedules/:id', requireRole('admin'), ScheduleController.delete);
router.get('/schedules/timetable/:sectionId', ScheduleController.getTimetableBySection);

export default router;