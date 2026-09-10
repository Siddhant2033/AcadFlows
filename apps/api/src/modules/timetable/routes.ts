import { Router } from 'express';
import { TimetableController } from './controller';
import { authenticate, requireRole, ensureTenantMatch } from '../../middleware/auth';

const router: Router = Router();

router.use(ensureTenantMatch);

// ============ Timetable Management ============
router.get('/', TimetableController.getTimetables);
router.post('/', requireRole('admin'), TimetableController.createTimetable);
router.get('/stats', TimetableController.getStats);
router.get('/:id', TimetableController.getTimetableById);
router.put('/:id', requireRole('admin'), TimetableController.updateTimetable);
router.delete('/:id', requireRole('admin'), TimetableController.deleteTimetable);

// ============ Timetable Entries ============
router.post('/:timetableId/entries', requireRole('admin'), TimetableController.addEntry);
router.put('/entries/:entryId', requireRole('admin'), TimetableController.updateEntry);
router.delete('/entries/:entryId', requireRole('admin'), TimetableController.deleteEntry);

// ============ Timetable Views ============
router.get('/sections/:sectionId', TimetableController.getSectionTimetable);
router.get('/teachers/:teacherId', TimetableController.getTeacherTimetable);
router.get('/rooms/:roomId', TimetableController.getRoomTimetable);

// ============ Rooms ============
router.get('/rooms', TimetableController.getRooms);
router.post('/rooms', requireRole('admin'), TimetableController.createRoom);
router.get('/rooms/:id', TimetableController.getRoomById);
router.put('/rooms/:id', requireRole('admin'), TimetableController.updateRoom);
router.delete('/rooms/:id', requireRole('admin'), TimetableController.deleteRoom);

// ============ Time Slots ============
router.get('/time-slots', TimetableController.getTimeSlots);
router.post('/time-slots', requireRole('admin'), TimetableController.createTimeSlot);
router.put('/time-slots/:id', requireRole('admin'), TimetableController.updateTimeSlot);
router.delete('/time-slots/:id', requireRole('admin'), TimetableController.deleteTimeSlot);

export default router;