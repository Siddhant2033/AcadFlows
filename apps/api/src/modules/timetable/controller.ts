import { Request, Response, NextFunction } from 'express';
import { TimetableService } from './service';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';

// Validation Schemas
const createTimetableSchema = z.object({
  academicYearId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['regular', 'exam', 'holiday', 'special']).default('regular'),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
});

const addEntrySchema = z.object({
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  sectionId: z.string().min(1),
  gradeId: z.string().min(1),
  roomId: z.string().optional(),
  roomNumber: z.string().optional(),
  isBreak: z.boolean().default(false),
  breakType: z.enum(['short', 'lunch', 'recess']).optional(),
  isOptional: z.boolean().default(false),
  notes: z.string().optional(),
});

const createRoomSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(['classroom', 'laboratory', 'library', 'auditorium', 'office', 'other']),
  capacity: z.number().min(1),
  floor: z.string().optional(),
  building: z.string().optional(),
  facilities: z.array(z.string()).optional(),
});

const createTimeSlotSchema = z.object({
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  type: z.enum(['class', 'break', 'assembly', 'other']).default('class'),
  name: z.string().optional(),
});

export class TimetableController {
  // ============ Timetable Management ============

  static async createTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = createTimetableSchema.parse(req.body);

      const timetable = await TimetableService.createTimetable(
        authReq.user.tenantId,
        {
          ...validated,
          createdBy: authReq.user.id,
        }
      );

      res.status(201).json({
        success: true,
        data: timetable,
        message: 'Timetable created successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTimetables(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { academicYearId, type, isActive, page, limit } = req.query;

      const result = await TimetableService.getTimetables(
        authReq.user.tenantId,
        {
          academicYearId: academicYearId as string,
          type: type as string,
          isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTimetableById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const timetable = await TimetableService.getTimetableById(id);

      res.json({
        success: true,
        data: timetable,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = createTimetableSchema.partial().parse(req.body);

      const timetable = await TimetableService.updateTimetable(id, validated);

      res.json({
        success: true,
        data: timetable,
        message: 'Timetable updated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await TimetableService.deleteTimetable(id);

      res.json({
        success: true,
        message: 'Timetable deleted successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Timetable Entries ============

  static async addEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { timetableId } = req.params;
      const validated = addEntrySchema.parse(req.body);

      const entry = await TimetableService.addEntry(
        authReq.user.tenantId,
        timetableId,
        validated
      );

      res.status(201).json({
        success: true,
        data: entry,
        message: 'Timetable entry added successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { entryId } = req.params;
      const validated = addEntrySchema.partial().parse(req.body);

      const entry = await TimetableService.updateEntry(
        authReq.user.tenantId,
        entryId,
        validated
      );

      res.json({
        success: true,
        data: entry,
        message: 'Timetable entry updated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const { entryId } = req.params;
      await TimetableService.deleteEntry(entryId);

      res.json({
        success: true,
        message: 'Timetable entry deleted successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Timetable Views ============

  static async getSectionTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { sectionId } = req.params;
      const { startDate, endDate } = req.query;

      const timetable = await TimetableService.getSectionTimetable(
        authReq.user.tenantId,
        sectionId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: timetable,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeacherTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { teacherId } = req.params;
      const { startDate, endDate } = req.query;

      const timetable = await TimetableService.getTeacherTimetable(
        authReq.user.tenantId,
        teacherId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: timetable,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRoomTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { roomId } = req.params;
      const { startDate, endDate } = req.query;

      const timetable = await TimetableService.getRoomTimetable(
        authReq.user.tenantId,
        roomId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: timetable,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Time Slots ============

  static async createTimeSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = createTimeSlotSchema.parse(req.body);

      const timeSlot = await TimetableService.createTimeSlot(
        authReq.user.tenantId,
        validated
      );

      res.status(201).json({
        success: true,
        data: timeSlot,
        message: 'Time slot created successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTimeSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { dayOfWeek } = req.query;

      const timeSlots = await TimetableService.getTimeSlots(
        authReq.user.tenantId,
        dayOfWeek as string
      );

      res.json({
        success: true,
        data: timeSlots,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTimeSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = createTimeSlotSchema.partial().parse(req.body);

      const timeSlot = await TimetableService.updateTimeSlot(id, validated);

      res.json({
        success: true,
        data: timeSlot,
        message: 'Time slot updated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTimeSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await TimetableService.deleteTimeSlot(id);

      res.json({
        success: true,
        message: 'Time slot deleted successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Rooms ============

  static async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = createRoomSchema.parse(req.body);

      const room = await TimetableService.createRoom(
        authReq.user.tenantId,
        validated
      );

      res.status(201).json({
        success: true,
        data: room,
        message: 'Room created successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { type, isActive, page, limit } = req.query;

      const result = await TimetableService.getRooms(
        authReq.user.tenantId,
        {
          type: type as string,
          isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRoomById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const room = await TimetableService.getRoomById(id);

      res.json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = createRoomSchema.partial().parse(req.body);

      const room = await TimetableService.updateRoom(id, validated);

      res.json({
        success: true,
        data: room,
        message: 'Room updated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await TimetableService.deleteRoom(id);

      res.json({
        success: true,
        message: 'Room deleted successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Stats ============

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;

      const stats = await TimetableService.getTimetableStats(
        authReq.user.tenantId
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}