import mongoose from 'mongoose';
import { Notification, Announcement, Message, Conversation } from '../../models/Communication';
import { User } from '../../models/User';
import { Student } from '../../models/Student';
import { Teacher } from '../../models/Teacher';
import { AppError } from '../../middleware/error-handler';

export class NotificationService {
  // Create notification for a user
  static async createNotification(tenantId: string, data: any) {
    const notification = await Notification.create({
      tenantId,
      ...data,
    });

    // In production, emit via WebSocket here
    console.log(`📢 Notification created for user ${data.userId}: ${data.title}`);

    return notification;
  }

  // Create notification for multiple users
  static async createBulkNotifications(tenantId: string, userIds: string[], data: any) {
    const notifications = userIds.map(userId => ({
      tenantId,
      userId,
      ...data,
    }));

    const results = await Notification.insertMany(notifications);
    
    console.log(`📢 ${results.length} notifications created`);

    return results;
  }

  // Get user notifications
  static async getNotifications(
    tenantId: string,
    userId: string,
    filters: {
      read?: boolean;
      type?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const query: any = { tenantId, userId };

    if (filters.read !== undefined) query.read = filters.read;
    if (filters.type) query.type = filters.type;

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(query),
    ]);

    return {
      items: notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount: await Notification.countDocuments({ tenantId, userId, read: false }),
    };
  }

  // Mark notification as read
  static async markAsRead(tenantId: string, notificationId: string, userId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, tenantId, userId },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return notification;
  }

  // Mark all notifications as read
  static async markAllAsRead(tenantId: string, userId: string) {
    const result = await Notification.updateMany(
      { tenantId, userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    return { modifiedCount: result.modifiedCount };
  }

  // Delete notification
  static async deleteNotification(tenantId: string, notificationId: string, userId: string) {
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

  // Get notification count
  static async getUnreadCount(tenantId: string, userId: string) {
    return await Notification.countDocuments({ tenantId, userId, read: false });
  }
}

export class AnnouncementService {
  // Create announcement
  static async createAnnouncement(tenantId: string, data: any) {
    const announcement = await Announcement.create({
      tenantId,
      ...data,
      publishedAt: data.isPublished ? new Date() : undefined,
    });

    // Send notifications to target users
    if (data.isPublished) {
      await this.sendAnnouncementNotifications(tenantId, announcement);
    }

    return announcement;
  }

  // Get announcements
  static async getAnnouncements(
    tenantId: string,
    filters: {
      type?: string;
      priority?: string;
      isPublished?: boolean;
      userId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const query: any = { tenantId };

    if (filters.type) query.type = filters.type;
    if (filters.priority) query.priority = filters.priority;
    if (filters.isPublished !== undefined) query.isPublished = filters.isPublished;

    // Filter by user visibility
    if (filters.userId) {
      const user = await User.findById(filters.userId);
      if (user) {
        query.$or = [
          { targetAudience: 'all' },
          { targetAudience: user.role === 'student' ? 'students' : 
                          user.role === 'teacher' ? 'teachers' : 
                          'guardians' },
        ];
      }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate('createdBy', 'firstName lastName')
        .sort({ priority: -1, publishedAt: -1 })
        .skip(skip)
        .limit(limit),
      Announcement.countDocuments(query),
    ]);

    return {
      items: announcements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get announcement by ID
  static async getAnnouncementById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    const announcement = await Announcement.findById(id)
      .populate('createdBy', 'firstName lastName');

    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    return announcement;
  }

  // Update announcement
  static async updateAnnouncement(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    return announcement;
  }

  // Delete announcement
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

  // Mark announcement as read by user
  static async markAsRead(tenantId: string, announcementId: string, userId: string) {
    const announcement = await Announcement.findOneAndUpdate(
      { _id: announcementId, tenantId },
      { $addToSet: { readBy: { userId, readAt: new Date() } } },
      { new: true }
    );

    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    return announcement;
  }

  // Get target users for announcement
  static async getTargetUsers(tenantId: string, announcement: any) {
    let userIds: string[] = [];

    if (announcement.targetAudience === 'all') {
      const users = await User.find({ tenantId, status: 'active' });
      userIds = users.map(u => u._id.toString());
    } else if (announcement.targetAudience === 'students') {
      const students = await Student.find({ tenantId, isDeleted: false });
      userIds = students.map(s => s.userId);
    } else if (announcement.targetAudience === 'teachers') {
      const teachers = await Teacher.find({ tenantId, isDeleted: false });
      userIds = teachers.map(t => t.userId);
    } else if (announcement.targetAudience === 'guardians') {
      // Get guardians from students
      const students = await Student.find({ tenantId, isDeleted: false });
      const guardianIds = students.flatMap(s =>
        s.guardians
          .map(g => g.userId)
          .filter((userId): userId is string => Boolean(userId))
      );
      userIds = [...new Set(guardianIds)];
    } else if (announcement.targetAudience === 'specific' && announcement.targetUserIds) {
      userIds = announcement.targetUserIds;
    }

    // Filter by grades/sections if specified
    if (announcement.targetGrades?.length || announcement.targetSections?.length) {
      const students = await Student.find({
        tenantId,
        isDeleted: false,
        ...(announcement.targetGrades?.length ? { grade: { $in: announcement.targetGrades } } : {}),
        ...(announcement.targetSections?.length ? { section: { $in: announcement.targetSections } } : {}),
      });
      const studentUserIds = students.map(s => s.userId);
      userIds = userIds.filter(id => studentUserIds.includes(id));
    }

    return userIds;
  }

  // Send announcement notifications
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

  // Get unread announcements count for user
  static async getUnreadCount(tenantId: string, userId: string) {
    // Get all published announcements
    const announcements = await Announcement.find({
      tenantId,
      isPublished: true,
      expiresAt: { $or: [{ $gte: new Date() }, { $exists: false }] },
    });

    // Filter by user visibility
    const user = await User.findById(userId);
    if (!user) return 0;

    const visibleAnnouncements = announcements.filter(a => {
      if (a.targetAudience === 'all') return true;
      if (a.targetAudience === 'students' && user.role === 'student') return true;
      if (a.targetAudience === 'teachers' && user.role === 'teacher') return true;
      if (a.targetAudience === 'guardians' && user.role === 'guardian') return true;
      return false;
    });

    // Count unread
    let unreadCount = 0;
    for (const announcement of visibleAnnouncements) {
      const hasRead = announcement.readBy.some(r => r.userId === userId);
      if (!hasRead) unreadCount++;
    }

    return unreadCount;
  }
}

export class MessagingService {
  // Start a new conversation
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
    }
  ) {
    // Check if conversation already exists
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

    // Create message
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

    // Update conversation
    conversation.lastMessage = data.content.substring(0, 200);
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Create notification for recipient
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

  // Reply to conversation
  static async replyToConversation(
    tenantId: string,
    conversationId: string,
    data: {
      senderId: string;
      senderType: string;
      content: string;
      attachments?: any[];
      parentMessageId?: string;
    }
  ) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      tenantId,
      isActive: true,
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Find recipient (the other participant)
    const recipient = conversation.participants.find(
      p => p.userId !== data.senderId
    );

    if (!recipient) {
      throw new AppError('Recipient not found', 404);
    }

    // Create message
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

    // Update conversation
    conversation.lastMessage = data.content.substring(0, 200);
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Create notification for recipient
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

  // Get user conversations
  static async getConversations(
    tenantId: string,
    userId: string,
    filters: {
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      tenantId,
      'participants.userId': userId,
      isActive: true,
    })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          tenantId,
          conversationId: conv._id,
          recipientId: userId,
          isRead: false,
          isDeleted: false,
        });

        // Get last message
        const lastMessage = await Message.findOne({
          tenantId,
          conversationId: conv._id,
          isDeleted: false,
        }).sort({ createdAt: -1 });

        return {
          ...conv.toObject(),
          unreadCount,
          lastMessage: lastMessage || null,
        };
      })
    );

    const total = await Conversation.countDocuments({
      tenantId,
      'participants.userId': userId,
      isActive: true,
    });

    return {
      items: conversationsWithDetails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get conversation messages
  static async getConversationMessages(
    tenantId: string,
    conversationId: string,
    userId: string,
    filters: {
      page?: number;
      limit?: number;
    }
  ) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      tenantId,
      isActive: true,
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new AppError('Unauthorized', 403);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    // Mark messages as read
    await Message.updateMany(
      {
        tenantId,
        conversationId,
        recipientId: userId,
        isRead: false,
      },
      { $set: { isRead: true, readAt: new Date() } }
    );

    // Update participant's lastReadAt
    const participant = conversation.participants.find(p => p.userId === userId);
    if (participant) {
      participant.lastReadAt = new Date();
      await conversation.save();
    }

    const [messages, total] = await Promise.all([
      Message.find({
        tenantId,
        conversationId,
        isDeleted: false,
      })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({
        tenantId,
        conversationId,
        isDeleted: false,
      }),
    ]);

    return {
      items: messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Delete message (soft delete)
  static async deleteMessage(tenantId: string, messageId: string, userId: string) {
    const message = await Message.findOneAndUpdate(
      { _id: messageId, tenantId, senderId: userId },
      { $set: { isDeleted: true, deletedBy: userId } },
      { new: true }
    );

    if (!message) {
      throw new AppError('Message not found or unauthorized', 404);
    }

    return message;
  }

  // Get unread message count
  static async getUnreadCount(tenantId: string, userId: string) {
    return await Message.countDocuments({
      tenantId,
      recipientId: userId,
      isRead: false,
      isDeleted: false,
    });
  }
}