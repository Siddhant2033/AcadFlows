import mongoose from 'mongoose';
import { Notification, Announcement, Message, Conversation } from '../../models/Communication';
import { User } from '../../models/User';
import { Student } from '../../models/Student';
import { Teacher } from '../../models/Teacher';
import { AppError } from '../../middleware/error-handler';

/* ─────────────────────────────────────────────────────────────
   Safe wrappers
   ─────────────────────────────────────────────────────────────
   On a fresh MongoDB database with no collections, `.countDocuments()`
   and `.aggregate()` can throw. These wrappers return safe fallbacks
   so the API never 500s on an empty tenant.
   ───────────────────────────────────────────────────────────── */

async function safeCount(
  model: mongoose.Model<any>,
  query: any,
): Promise<number> {
  try {
    return await model.countDocuments(query);
  } catch (err) {
    console.warn(
      `[communication] countDocuments failed on ${model.modelName} — returning 0`,
      err instanceof Error ? err.message : err,
    );
    return 0;
  }
}

async function safeFind<T = any>(
  model: mongoose.Model<any>,
  query: any,
  options?: { sort?: any; limit?: number; select?: string },
): Promise<T[]> {
  try {
    let q = model.find(query);
    if (options?.select) q = q.select(options.select);
    if (options?.sort) q = q.sort(options.sort);
    if (options?.limit) q = q.limit(options.limit);
    return (await q.lean()) as T[];
  } catch (err) {
    console.warn(
      `[communication] find failed on ${model.modelName} — returning []`,
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

/* ─────────────────────────────────────────────────────────────
   NotificationService
   ───────────────────────────────────────────────────────────── */

export class NotificationService {
  static async createNotification(tenantId: string, data: any) {
    const notification = await Notification.create({
      tenantId,
      ...data,
    });

    console.log(`📢 Notification created for user ${data.userId}: ${data.title}`);

    return notification;
  }

  static async createBulkNotifications(tenantId: string, userIds: string[], data: any) {
    if (userIds.length === 0) return [];

    const notifications = userIds.map(userId => ({
      tenantId,
      userId,
      ...data,
    }));

    const results = await Notification.insertMany(notifications);

    console.log(`📢 ${results.length} notifications created`);

    return results;
  }

  static async getNotifications(
    tenantId: string,
    userId: string,
    filters: {
      read?: boolean;
      type?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const query: any = { tenantId, userId };

    if (filters.read !== undefined) query.read = filters.read;
    if (filters.type) query.type = filters.type;

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    let items: any[] = [];
    let total = 0;

    try {
      [items, total] = await Promise.all([
        Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Notification.countDocuments(query),
      ]);
    } catch (err) {
      console.warn(
        '[notifications] query failed — returning empty list',
        err instanceof Error ? err.message : err,
      );
    }

    const unreadCount = await safeCount(Notification, {
      tenantId,
      userId,
      read: false,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  static async markAsRead(tenantId: string, notificationId: string, userId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, tenantId, userId },
      { $set: { read: true, readAt: new Date() } },
      { new: true },
    );

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return notification;
  }

  static async markAllAsRead(tenantId: string, userId: string) {
    try {
      const result = await Notification.updateMany(
        { tenantId, userId, read: false },
        { $set: { read: true, readAt: new Date() } },
      );
      return { modifiedCount: result.modifiedCount };
    } catch (err) {
      console.warn('[notifications] updateMany failed', err);
      return { modifiedCount: 0 };
    }
  }

  static async deleteNotification(
    tenantId: string,
    notificationId: string,
    userId: string,
  ) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      tenantId,
      userId,
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return notification;
  }

  // ─── Safe: returns 0 on missing collection ───
  static async getUnreadCount(tenantId: string, userId: string) {
    return safeCount(Notification, { tenantId, userId, read: false });
  }
}

/* ─────────────────────────────────────────────────────────────
   AnnouncementService
   ───────────────────────────────────────────────────────────── */

export class AnnouncementService {
  static async createAnnouncement(tenantId: string, data: any) {
    const announcement = await Announcement.create({
      tenantId,
      ...data,
      publishedAt: data.isPublished ? new Date() : undefined,
    });

    if (data.isPublished) {
      await this.sendAnnouncementNotifications(tenantId, announcement);
    }

    return announcement;
  }

  static async getAnnouncements(
    tenantId: string,
    filters: {
      type?: string;
      priority?: string;
      isPublished?: boolean;
      userId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const query: any = { tenantId };

    if (filters.type) query.type = filters.type;
    if (filters.priority) query.priority = filters.priority;
    if (filters.isPublished !== undefined) query.isPublished = filters.isPublished;

    if (filters.userId) {
      try {
        const user = await User.findById(filters.userId).lean();
        if (user) {
          query.$or = [
            { targetAudience: 'all' },
            {
              targetAudience:
                user.role === 'student'
                  ? 'students'
                  : user.role === 'teacher'
                    ? 'teachers'
                    : 'guardians',
            },
          ];
        }
      } catch {
        /* ignore */
      }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    let items: any[] = [];
    let total = 0;

    try {
      [items, total] = await Promise.all([
        Announcement.find(query)
          .populate('createdBy', 'firstName lastName')
          .sort({ priority: -1, publishedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Announcement.countDocuments(query),
      ]);
    } catch (err) {
      console.warn('[announcements] query failed — returning empty', err);
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getAnnouncementById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    const announcement = await Announcement.findById(id).populate(
      'createdBy',
      'firstName lastName',
    );

    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    return announcement;
  }

  static async updateAnnouncement(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    return announcement;
  }

  static async deleteAnnouncement(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    return announcement;
  }

  static async markAsRead(tenantId: string, announcementId: string, userId: string) {
    const announcement = await Announcement.findOneAndUpdate(
      { _id: announcementId, tenantId },
      { $addToSet: { readBy: { userId, readAt: new Date() } } },
      { new: true },
    );

    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    return announcement;
  }

  static async getTargetUsers(tenantId: string, announcement: any) {
    let userIds: string[] = [];

    if (announcement.targetAudience === 'all') {
      const users = await safeFind(User, { tenantId, status: 'active' }, { select: '_id' });
      userIds = users.map((u: any) => u._id.toString());
    } else if (announcement.targetAudience === 'students') {
      const students = await safeFind(
        Student,
        { tenantId, isDeleted: false },
        { select: 'userId' },
      );
      userIds = students.map((s: any) => s.userId);
    } else if (announcement.targetAudience === 'teachers') {
      const teachers = await safeFind(
        Teacher,
        { tenantId, isDeleted: false },
        { select: 'userId' },
      );
      userIds = teachers.map((t: any) => t.userId);
    } else if (announcement.targetAudience === 'guardians') {
      const students = await safeFind(
        Student,
        { tenantId, isDeleted: false },
        { select: 'guardians' },
      );
      const guardianIds = students.flatMap((s: any) =>
        (s.guardians || [])
          .map((g: any) => g.userId)
          .filter((userId: any): userId is string => Boolean(userId)),
      );
      userIds = [...new Set(guardianIds)];
    } else if (
      announcement.targetAudience === 'specific' &&
      announcement.targetUserIds
    ) {
      userIds = announcement.targetUserIds;
    }

    if (announcement.targetGrades?.length || announcement.targetSections?.length) {
      const filter: any = { tenantId, isDeleted: false };
      if (announcement.targetGrades?.length) {
        filter.grade = { $in: announcement.targetGrades };
      }
      if (announcement.targetSections?.length) {
        filter.section = { $in: announcement.targetSections };
      }
      const students = await safeFind(Student, filter, { select: 'userId' });
      const studentUserIds = students.map((s: any) => s.userId);
      userIds = userIds.filter(id => studentUserIds.includes(id));
    }

    return userIds;
  }

  private static async sendAnnouncementNotifications(tenantId: string, announcement: any) {
    const userIds = await this.getTargetUsers(tenantId, announcement);

    if (userIds.length === 0) return;

    await NotificationService.createBulkNotifications(tenantId, userIds, {
      type: announcement.priority === 'urgent' ? 'error' : 'info',
      title: `📢 ${announcement.title}`,
      message: announcement.content.substring(0, 200),
      link: `/announcements/${announcement._id}`,
      linkText: 'View Announcement',
      metadata: { announcementId: announcement._id },
    });

    console.log(`📢 Announcement notifications sent to ${userIds.length} users`);
  }

  static async getUnreadCount(tenantId: string, userId: string) {
    let announcements: any[] = [];
    try {
      announcements = await Announcement.find({
        tenantId,
        isPublished: true,
        expiresAt: { $or: [{ $gte: new Date() }, { $exists: false }] },
      }).lean();
    } catch {
      return 0;
    }

    let user: any = null;
    try {
      user = await User.findById(userId).lean();
    } catch {
      return 0;
    }
    if (!user) return 0;

    const visibleAnnouncements = announcements.filter(a => {
      if (a.targetAudience === 'all') return true;
      if (a.targetAudience === 'students' && user.role === 'student') return true;
      if (a.targetAudience === 'teachers' && user.role === 'teacher') return true;
      if (a.targetAudience === 'guardians' && user.role === 'guardian') return true;
      return false;
    });

    let unreadCount = 0;
    for (const announcement of visibleAnnouncements) {
      const hasRead = (announcement.readBy || []).some(
        (r: any) => r.userId === userId,
      );
      if (!hasRead) unreadCount++;
    }

    return unreadCount;
  }
}

/* ─────────────────────────────────────────────────────────────
   MessagingService
   ───────────────────────────────────────────────────────────── */

export class MessagingService {
  static async startConversation(
    tenantId: string,
    data: {
      senderId: string;
      senderType: string;
      recipientId: string;
      recipientType: string;
      subject?: string;
      content: string;
      attachments?: any[];
    },
  ) {
    let conversation = await Conversation.findOne({
      tenantId,
      participants: {
        $all: [
          { $elemMatch: { userId: data.senderId } },
          { $elemMatch: { userId: data.recipientId } },
        ],
      },
      isActive: true,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        tenantId,
        participants: [
          { userId: data.senderId, userType: data.senderType, lastReadAt: new Date() },
          { userId: data.recipientId, userType: data.recipientType },
        ],
        isActive: true,
      });
    }

    const message = await Message.create({
      tenantId,
      senderId: data.senderId,
      senderType: data.senderType,
      recipientId: data.recipientId,
      recipientType: data.recipientType,
      subject: data.subject,
      content: data.content,
      attachments: data.attachments || [],
      conversationId: conversation._id,
      isRead: false,
    });

    conversation.lastMessage = data.content.substring(0, 200);
    conversation.lastMessageAt = new Date();
    await conversation.save();

    await NotificationService.createNotification(tenantId, {
      userId: data.recipientId,
      type: 'info',
      title: `New message from ${data.senderType}`,
      message: data.content.substring(0, 100),
      link: `/messages/${conversation._id}`,
      linkText: 'View Message',
      metadata: { conversationId: conversation._id },
    });

    return { conversation, message };
  }

  static async replyToConversation(
    tenantId: string,
    conversationId: string,
    data: {
      senderId: string;
      senderType: string;
      content: string;
      attachments?: any[];
      parentMessageId?: string;
    },
  ) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      tenantId,
      isActive: true,
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    const recipient = conversation.participants.find(
      p => p.userId !== data.senderId,
    );

    if (!recipient) {
      throw new AppError('Recipient not found', 404);
    }

    const message = await Message.create({
      tenantId,
      senderId: data.senderId,
      senderType: data.senderType,
      recipientId: recipient.userId,
      recipientType: recipient.userType,
      content: data.content,
      attachments: data.attachments || [],
      conversationId: conversation._id,
      parentMessageId: data.parentMessageId,
      isRead: false,
    });

    conversation.lastMessage = data.content.substring(0, 200);
    conversation.lastMessageAt = new Date();
    await conversation.save();

    await NotificationService.createNotification(tenantId, {
      userId: recipient.userId,
      type: 'info',
      title: `New reply from ${data.senderType}`,
      message: data.content.substring(0, 100),
      link: `/messages/${conversation._id}`,
      linkText: 'View Message',
      metadata: { conversationId: conversation._id },
    });

    return { conversation, message };
  }

  static async getConversations(
    tenantId: string,
    userId: string,
    filters: { page?: number; limit?: number },
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    let conversations: any[] = [];
    let total = 0;

    try {
      [conversations, total] = await Promise.all([
        Conversation.find({
          tenantId,
          'participants.userId': userId,
          isActive: true,
        })
          .sort({ lastMessageAt: -1 })
          .skip(skip)
          .limit(limit),
        Conversation.countDocuments({
          tenantId,
          'participants.userId': userId,
          isActive: true,
        }),
      ]);
    } catch (err) {
      console.warn('[messages] conversations query failed', err);
    }

    const conversationsWithDetails = await Promise.all(
      conversations.map(async conv => {
        const unreadCount = await safeCount(Message, {
          tenantId,
          conversationId: conv._id,
          recipientId: userId,
          isRead: false,
          isDeleted: false,
        });

        let lastMessage: any = null;
        try {
          lastMessage = await Message.findOne({
            tenantId,
            conversationId: conv._id,
            isDeleted: false,
          }).sort({ createdAt: -1 });
        } catch {
          /* ignore */
        }

        return {
          ...conv.toObject(),
          unreadCount,
          lastMessage: lastMessage || null,
        };
      }),
    );

    return {
      items: conversationsWithDetails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getConversationMessages(
    tenantId: string,
    conversationId: string,
    userId: string,
    filters: { page?: number; limit?: number },
  ) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      tenantId,
      isActive: true,
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new AppError('Unauthorized', 403);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    await Message.updateMany(
      { tenantId, conversationId, recipientId: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );

    const participant = conversation.participants.find(p => p.userId === userId);
    if (participant) {
      participant.lastReadAt = new Date();
      await conversation.save();
    }

    let messages: any[] = [];
    let total = 0;

    try {
      [messages, total] = await Promise.all([
        Message.find({
          tenantId,
          conversationId,
          isDeleted: false,
        })
          .sort({ createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Message.countDocuments({
          tenantId,
          conversationId,
          isDeleted: false,
        }),
      ]);
    } catch (err) {
      console.warn('[messages] messages query failed', err);
    }

    return {
      items: messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async deleteMessage(tenantId: string, messageId: string, userId: string) {
    const message = await Message.findOneAndUpdate(
      { _id: messageId, tenantId, senderId: userId },
      { $set: { isDeleted: true, deletedBy: userId } },
      { new: true },
    );

    if (!message) {
      throw new AppError('Message not found or unauthorized', 404);
    }

    return message;
  }

  static async getUnreadCount(tenantId: string, userId: string) {
    return safeCount(Message, {
      tenantId,
      recipientId: userId,
      isRead: false,
      isDeleted: false,
    });
  }

  static async listRecipients(
    tenantId: string,
    userId: string,
    role: string,
    search: string,
  ) {
    const query: any = {
      tenantId,
      _id: { $ne: userId },
      status: 'active',
    };

    if (role === 'student' || role === 'guardian') {
      query.role = { $in: ['teacher', 'admin'] };
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    let users: any[] = [];
    try {
      users = await User.find(query)
        .select('_id firstName lastName email role')
        .limit(50)
        .lean();
    } catch (err) {
      console.warn('[messages] listRecipients query failed', err);
      users = [];
    }

    return users.map(u => ({
      _id: u._id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role,
    }));
  }
}