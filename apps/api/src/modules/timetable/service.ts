import mongoose from 'mongoose';
import { Timetable, TimetableEntry, Room, TimeSlot } from '../../models/Timetable';
import { AppError } from '../../middleware/error-handler';

export class TimetableService {
  // ============ Timetable Management ============

  static async createTimetable(tenantId: string, data: any) {
    const timetable = await Timetable.create({
      tenantId,
      ...data,
      entries: [],
    });

    return timetable;
  }

  static async getTimetables(
    tenantId: string,
    filters: {
      academicYearId?: string;
      type?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    }
  ) {
    const query: any = { tenantId };

    if (filters.academicYearId) query.academicYearId = filters.academicYearId;
    if (filters.type) query.type = filters.type;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [timetables, total] = await Promise.all([
      Timetable.find(query)
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Timetable.countDocuments(query),
    ]);

    return {
      items: timetables,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getTimetableById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid timetable ID', 400);
    }

    const timetable = await Timetable.findById(id)
      .populate('createdBy', 'firstName lastName');

    if (!timetable) {
      throw new AppError('Timetable not found', 404);
    }

    return timetable;
  }

  static async updateTimetable(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid timetable ID', 400);
    }

    const timetable = await Timetable.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!timetable) {
      throw new AppError('Timetable not found', 404);
    }

    return timetable;
  }

  static async deleteTimetable(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid timetable ID', 400);
    }

    // Delete all entries
    await TimetableEntry.deleteMany({ timetableId: id });

    const timetable = await Timetable.findByIdAndDelete(id);
    if (!timetable) {
      throw new AppError('Timetable not found', 404);
    }

    return timetable;
  }

  // ============ Timetable Entries ============

  static async addEntry(tenantId: string, timetableId: string, data: any) {
    // Check if timetable exists
    const timetable = await Timetable.findOne({ _id: timetableId, tenantId });
    if (!timetable) {
      throw new AppError('Timetable not found', 404);
    }

    // Validate time format
    this.validateTime(data.startTime, data.endTime);

    // Check for conflicts
    const conflicts = await this.checkConflicts(tenantId, {
      teacherId: data.teacherId,
      sectionId: data.sectionId,
      roomId: data.roomId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      excludeEntryId: data.excludeEntryId,
    });

    if (conflicts.length > 0) {
      throw new AppError(`Conflict detected: ${conflicts.join(', ')}`, 409);
    }

    const entry = await TimetableEntry.create({
      tenantId,
      timetableId,
      ...data,
    });

    // Add entry to timetable
    await Timetable.findByIdAndUpdate(timetableId, {
      $push: { entries: entry._id },
    });

    return entry;
  }

  static async updateEntry(tenantId: string, entryId: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(entryId)) {
      throw new AppError('Invalid entry ID', 400);
    }

    // Check for conflicts excluding current entry
    if (data.startTime || data.endTime || data.teacherId || data.sectionId || data.roomId || data.dayOfWeek) {
      const conflicts = await this.checkConflicts(tenantId, {
        teacherId: data.teacherId,
        sectionId: data.sectionId,
        roomId: data.roomId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        excludeEntryId: entryId,
      });

      if (conflicts.length > 0) {
        throw new AppError(`Conflict detected: ${conflicts.join(', ')}`, 409);
      }
    }

    const entry = await TimetableEntry.findByIdAndUpdate(
      entryId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!entry) {
      throw new AppError('Timetable entry not found', 404);
    }

    return entry;
  }

  static async deleteEntry(entryId: string) {
    if (!mongoose.Types.ObjectId.isValid(entryId)) {
      throw new AppError('Invalid entry ID', 400);
    }

    const entry = await TimetableEntry.findByIdAndDelete(entryId);
    if (!entry) {
      throw new AppError('Timetable entry not found', 404);
    }

    // Remove entry from timetable
    await Timetable.findByIdAndUpdate(entry.timetableId, {
      $pull: { entries: entryId },
    });

    return entry;
  }

  // ============ Conflict Detection ============

  static async checkConflicts(
    tenantId: string,
    data: {
      teacherId?: string;
      sectionId?: string;
      roomId?: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      excludeEntryId?: string;
    }
  ): Promise<string[]> {
    const conflicts: string[] = [];

    // Build query
    const query: any = {
      tenantId,
      dayOfWeek: data.dayOfWeek,
      $or: [
        { startTime: { $lt: data.endTime, $gte: data.startTime } },
        { endTime: { $gt: data.startTime, $lte: data.endTime } },
        { startTime: { $gte: data.startTime, $lte: data.endTime } },
        { endTime: { $gte: data.startTime, $lte: data.endTime } },
      ],
    };

    if (data.excludeEntryId) {
      query._id = { $ne: data.excludeEntryId };
    }

    // Check teacher conflicts
    if (data.teacherId) {
      const teacherConflicts = await TimetableEntry.find({
        ...query,
        teacherId: data.teacherId,
      }).populate('teacherId', 'firstName lastName');

      if (teacherConflicts.length > 0) {
        const names = teacherConflicts.map((e: any) => 
          e.teacherId?.firstName && e.teacherId?.lastName 
            ? `${e.teacherId.firstName} ${e.teacherId.lastName}`
            : 'Unknown Teacher'
        );
        conflicts.push(`Teacher ${names.join(', ')} is already booked at this time`);
      }
    }

    // Check section conflicts
    if (data.sectionId) {
      const sectionConflicts = await TimetableEntry.find({
        ...query,
        sectionId: data.sectionId,
      }).populate('sectionId', 'name');

      if (sectionConflicts.length > 0) {
        const names = sectionConflicts.map((e: any) => e.sectionId?.name || 'Unknown Section');
        conflicts.push(`Section ${names.join(', ')} is already booked at this time`);
      }
    }

    // Check room conflicts
    if (data.roomId) {
      const roomConflicts = await TimetableEntry.find({
        ...query,
        roomId: data.roomId,
      }).populate('roomId', 'name code');

      if (roomConflicts.length > 0) {
        const names = roomConflicts.map((e: any) => e.roomId?.name || e.roomNumber || 'Unknown Room');
        conflicts.push(`Room ${names.join(', ')} is already booked at this time`);
      }
    }

    return conflicts;
  }

  // ============ Timetable Views ============

  static async getSectionTimetable(tenantId: string, sectionId: string, startDate?: Date, endDate?: Date) {
    const query: any = {
      tenantId,
      sectionId,
    };

    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const entries = await TimetableEntry.find(query)
      .populate('subjectId', 'name code')
      .populate('teacherId', 'firstName lastName')
      .populate('gradeId', 'name')
      .populate('roomId', 'name code')
      .sort({ dayOfWeek: 1, startTime: 1 });

    return this.groupByDay(entries);
  }

  static async getTeacherTimetable(tenantId: string, teacherId: string, startDate?: Date, endDate?: Date) {
    const query: any = {
      tenantId,
      teacherId,
    };

    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const entries = await TimetableEntry.find(query)
      .populate('subjectId', 'name code')
      .populate('sectionId', 'name')
      .populate('gradeId', 'name')
      .populate('roomId', 'name code')
      .sort({ dayOfWeek: 1, startTime: 1 });

    return this.groupByDay(entries);
  }

  static async getRoomTimetable(tenantId: string, roomId: string, startDate?: Date, endDate?: Date) {
    const query: any = {
      tenantId,
      roomId,
    };

    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const entries = await TimetableEntry.find(query)
      .populate('subjectId', 'name code')
      .populate('teacherId', 'firstName lastName')
      .populate('sectionId', 'name')
      .populate('gradeId', 'name')
      .sort({ dayOfWeek: 1, startTime: 1 });

    return this.groupByDay(entries);
  }

  private static groupByDay(entries: any[]) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const grouped: any = {};

    days.forEach(day => {
      grouped[day] = entries.filter(e => e.dayOfWeek === day);
    });

    return grouped;
  }

  // ============ Time Slots ============

  static async createTimeSlot(tenantId: string, data: any) {
    const timeSlot = await TimeSlot.create({
      tenantId,
      ...data,
    });

    return timeSlot;
  }

  static async getTimeSlots(tenantId: string, dayOfWeek?: string) {
    const query: any = { tenantId, isActive: true };
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;

    return await TimeSlot.find(query).sort({ startTime: 1 });
  }

  static async updateTimeSlot(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid time slot ID', 400);
    }

    const timeSlot = await TimeSlot.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!timeSlot) {
      throw new AppError('Time slot not found', 404);
    }

    return timeSlot;
  }

  static async deleteTimeSlot(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid time slot ID', 400);
    }

    const timeSlot = await TimeSlot.findByIdAndDelete(id);
    if (!timeSlot) {
      throw new AppError('Time slot not found', 404);
    }

    return timeSlot;
  }

  // ============ Rooms ============

  static async createRoom(tenantId: string, data: any) {
    const room = await Room.create({
      tenantId,
      ...data,
    });

    return room;
  }

  static async getRooms(
    tenantId: string,
    filters: {
      type?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    }
  ) {
    const query: any = { tenantId };

    if (filters.type) query.type = filters.type;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      Room.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Room.countDocuments(query),
    ]);

    return {
      items: rooms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getRoomById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid room ID', 400);
    }

    const room = await Room.findById(id);
    if (!room) {
      throw new AppError('Room not found', 404);
    }

    return room;
  }

  static async updateRoom(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid room ID', 400);
    }

    const room = await Room.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!room) {
      throw new AppError('Room not found', 404);
    }

    return room;
  }

  static async deleteRoom(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid room ID', 400);
    }

    const room = await Room.findByIdAndDelete(id);
    if (!room) {
      throw new AppError('Room not found', 404);
    }

    return room;
  }

  // ============ Helpers ============

  private static validateTime(startTime: string, endTime: string) {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);

    if (start >= end) {
      throw new AppError('Start time must be before end time', 400);
    }

    return true;
  }

  static async getTimetableStats(tenantId: string) {
    const totalTimetables = await Timetable.countDocuments({ tenantId });
    const activeTimetables = await Timetable.countDocuments({ tenantId, isActive: true });
    const totalEntries = await TimetableEntry.countDocuments({ tenantId });

    return {
      totalTimetables,
      activeTimetables,
      totalEntries,
    };
  }
}