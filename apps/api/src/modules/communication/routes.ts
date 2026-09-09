import { Router } from 'express';
import { CommunicationController } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

// ============ Notifications ============
router.get('/notifications', CommunicationController.getNotifications);
router.put('/notifications/:id/read', CommunicationController.markNotificationRead);
router.put('/notifications/read-all', CommunicationController.markAllNotificationsRead);
router.delete('/notifications/:id', CommunicationController.deleteNotification);
router.get('/notifications/unread-count', CommunicationController.getUnreadCount);

// ============ Announcements ============
router.get('/announcements', CommunicationController.getAnnouncements);
router.post('/announcements', requireRole('admin', 'teacher'), CommunicationController.createAnnouncement);
router.get('/announcements/:id', CommunicationController.getAnnouncementById);
router.put('/announcements/:id', requireRole('admin', 'teacher'), CommunicationController.updateAnnouncement);
router.delete('/announcements/:id', requireRole('admin', 'teacher'), CommunicationController.deleteAnnouncement);
router.put('/announcements/:id/read', CommunicationController.markAnnouncementRead);
router.get('/announcements/unread-count', CommunicationController.getAnnouncementUnreadCount);

// ============ Messages ============
router.post('/messages', CommunicationController.startConversation);
router.post('/messages/:conversationId/reply', CommunicationController.replyToConversation);
router.get('/messages/conversations', CommunicationController.getConversations);
router.get('/messages/:conversationId', CommunicationController.getConversationMessages);
router.delete('/messages/:messageId', CommunicationController.deleteMessage);
router.get('/messages/unread-count', CommunicationController.getMessageUnreadCount);

export default router;