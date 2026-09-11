import { Request, Response, NextFunction } from 'express';
import { NotificationService, AnnouncementService, MessagingService } from './service';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';

// Validation Schemas
const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['info', 'success', 'warning', 'error', 'system']),
  title: z.string().min(1),
  message: z.string().min(1),
  link: z.string().optional(),
  linkText: z.string().optional(),
});

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['general', 'academic', 'event', 'emergency', 'holiday']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  targetAudience: z.enum(['all', 'students', 'teachers', 'guardians', 'specific']).default('all'),
  targetUserIds: z.array(z.string()).optional(),
  targetGrades: z.array(z.string()).optional(),
  targetSections: z.array(z.string()).optional(),
  expiresAt: z.string().transform(str => new Date(str)).optional(),
  isPublished: z.boolean().default(true),
});

const startConversationSchema = z.object({
  recipientId: z.string().min(1),
  recipientType: z.enum(['admin', 'teacher', 'guardian', 'student']),
  subject: z.string().optional(),
  content: z.string().min(1),
});

const replyToConversationSchema = z.object({
  content: z.string().min(1),
  parentMessageId: z.string().optional(),
});

export class CommunicationController {
  // ============ Notifications ============

  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { read, type, page, limit } = req.query;

      const result = await NotificationService.getNotifications(
        authReq.user.tenantId,
        authReq.user.id,
        {
          read: read === 'true' ? true : read === 'false' ? false : undefined,
          type: type as string,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        },
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async markNotificationRead(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;

      const notification = await NotificationService.markAsRead(
        authReq.user.tenantId,
        id,
        authReq.user.id,
      );

      res.json({
        success: true,
        data: notification,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;

      const result = await NotificationService.markAllAsRead(
        authReq.user.tenantId,
        authReq.user.id,
      );

      res.json({
        success: true,
        data: result,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;

      await NotificationService.deleteNotification(
        authReq.user.tenantId,
        id,
        authReq.user.id,
      );

      res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const count = await NotificationService.getUnreadCount(
        authReq.user.tenantId,
        authReq.user.id,
      );
      res.json({ success: true, data: { count } });
    } catch (error) {
      console.error('❌ Unread count error:', error);
      // Return 0 rather than 500 — the badge just won't show.
      res.json({ success: true, data: { count: 0 } });
    }
  }

  // ============ Announcements ============

  static async createAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = createAnnouncementSchema.parse(req.body);

      const announcement = await AnnouncementService.createAnnouncement(
        authReq.user.tenantId,
        {
          ...validated,
          createdBy: authReq.user.id,
        },
      );

      res.status(201).json({
        success: true,
        data: announcement,
        message: 'Announcement created successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAnnouncements(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { type, priority, isPublished, userId, page, limit } = req.query;

      const result = await AnnouncementService.getAnnouncements(
        authReq.user.tenantId,
        {
          type: type as string,
          priority: priority as string,
          isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
          userId: (userId as string) || authReq.user.id,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        },
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getAnnouncementById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const announcement = await AnnouncementService.getAnnouncementById(id);

      res.json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }

  static async updateAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = createAnnouncementSchema.partial().parse(req.body);

      const announcement = await AnnouncementService.updateAnnouncement(id, validated);

      res.json({
        success: true,
        data: announcement,
        message: 'Announcement updated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await AnnouncementService.deleteAnnouncement(id);

      res.json({ success: true, message: 'Announcement deleted successfully!' });
    } catch (error) {
      next(error);
    }
  }

  static async markAnnouncementRead(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;

      const announcement = await AnnouncementService.markAsRead(
        authReq.user.tenantId,
        id,
        authReq.user.id,
      );

      res.json({
        success: true,
        data: announcement,
        message: 'Announcement marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAnnouncementUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const count = await AnnouncementService.getUnreadCount(
        authReq.user.tenantId,
        authReq.user.id,
      );
      res.json({ success: true, data: { count } });
    } catch (error) {
      console.error('❌ Announcement unread count error:', error);
      res.json({ success: true, data: { count: 0 } });
    }
  }

  // ============ Messages ============

  static async startConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = startConversationSchema.parse(req.body);

      const result = await MessagingService.startConversation(
        authReq.user.tenantId,
        {
          senderId: authReq.user.id,
          senderType: authReq.user.role,
          ...validated,
        },
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Message sent successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async replyToConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { conversationId } = req.params;
      const validated = replyToConversationSchema.parse(req.body);

      const result = await MessagingService.replyToConversation(
        authReq.user.tenantId,
        conversationId,
        {
          senderId: authReq.user.id,
          senderType: authReq.user.role,
          ...validated,
        },
      );

      res.json({
        success: true,
        data: result,
        message: 'Reply sent successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { page, limit } = req.query;

      const result = await MessagingService.getConversations(
        authReq.user.tenantId,
        authReq.user.id,
        {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        },
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getConversationMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { conversationId } = req.params;
      const { page, limit } = req.query;

      const result = await MessagingService.getConversationMessages(
        authReq.user.tenantId,
        conversationId,
        authReq.user.id,
        {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 50,
        },
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { messageId } = req.params;

      await MessagingService.deleteMessage(
        authReq.user.tenantId,
        messageId,
        authReq.user.id,
      );

      res.json({ success: true, message: 'Message deleted successfully!' });
    } catch (error) {
      next(error);
    }
  }

  static async getMessageUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const count = await MessagingService.getUnreadCount(
        authReq.user.tenantId,
        authReq.user.id,
      );
      res.json({ success: true, data: { count } });
    } catch (error) {
      console.error('❌ Message unread count error:', error);
      res.json({ success: true, data: { count: 0 } });
    }
  }

  /**
   * List possible message recipients for the current user.
   * Used by the "New Message" modal.
   *
   * Admins / teachers: can message anyone at the school.
   * Students: can message their teachers and admins.
   * Guardians: can message their children's teachers and admins.
   */
  static async listMessageRecipients(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { search } = req.query;

      const recipients = await MessagingService.listRecipients(
        authReq.user.tenantId,
        authReq.user.id,
        authReq.user.role,
        (search as string) || '',
      );

      res.json({ success: true, data: recipients });
    } catch (error) {
      next(error);
    }
  }
}