import { Router } from 'express';
import { CommunicationController } from './controller';
import { requireRole } from '../../middleware/auth';

const router: Router = Router();

// Authentication + tenant match are applied at the app level.

/* ── Notifications ── */
router.get('/notifications', CommunicationController.getNotifications);
router.get('/notifications/unread-count', CommunicationController.getUnreadCount);
router.put('/notifications/read-all', CommunicationController.markAllNotificationsRead);
router.put('/notifications/:id/read', CommunicationController.markNotificationRead);
router.delete('/notifications/:id', CommunicationController.deleteNotification);

/* ── Announcements ── */
router.get('/announcements', CommunicationController.getAnnouncements);
router.get('/announcements/unread-count', CommunicationController.getAnnouncementUnreadCount);
router.post(
  '/announcements',
  requireRole('admin', 'teacher'),
  CommunicationController.createAnnouncement,
);
router.get('/announcements/:id', CommunicationController.getAnnouncementById);
router.put(
  '/announcements/:id',
  requireRole('admin', 'teacher'),
  CommunicationController.updateAnnouncement,
);
router.delete(
  '/announcements/:id',
  requireRole('admin', 'teacher'),
  CommunicationController.deleteAnnouncement,
);
router.put('/announcements/:id/read', CommunicationController.markAnnouncementRead);

/* ── Messages ── */
router.get('/messages/unread-count', CommunicationController.getMessageUnreadCount);
router.get('/messages/recipients', CommunicationController.listMessageRecipients);
router.get('/messages/conversations', CommunicationController.getConversations);
router.post('/messages', CommunicationController.startConversation);
router.post('/messages/:conversationId/reply', CommunicationController.replyToConversation);
router.get('/messages/:conversationId', CommunicationController.getConversationMessages);
router.delete('/messages/:messageId', CommunicationController.deleteMessage);

export default router;