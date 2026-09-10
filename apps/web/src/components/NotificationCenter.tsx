import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { cn } from '../lib/cn';
import { formatTimeAgo } from '../lib/format';

interface Notification {
  _id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  title: string;
  message: string;
  link?: string;
  linkText?: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  onClose?: () => void;
  isOpen?: boolean;
  onNotificationRead?: () => void;
}

export default function NotificationCenter({
  onClose,
  isOpen = true,
  onNotificationRead,
}: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isOpen, page]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/communication/notifications?page=${page}&limit=20`);
      const data = response.data.data;
      if (page === 1) setNotifications(data.items);
      else setNotifications(prev => [...prev, ...data.items]);
      setHasMore(data.items.length === 20);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/communication/notifications/unread-count');
      setUnreadCount(response.data.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/communication/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
      onNotificationRead?.();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/communication/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      onNotificationRead?.();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/communication/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (!notifications.find(n => n._id === id)?.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getIcon = (type: string) =>
    ({ info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌', system: '🔔' }[type] || '📢');

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      info: 'text-blue-600 dark:text-blue-400',
      success: 'text-green-600 dark:text-green-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      error: 'text-red-600 dark:text-red-400',
      system: 'text-purple-600 dark:text-purple-400',
    };
    return colors[type] || 'text-muted';
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-96 max-h-[500px] rounded-lg shadow-xl border border-border bg-surface overflow-hidden z-50">
      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Mark all read
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-muted hover:text-foreground transition-colors"
              aria-label="Close notifications"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-[400px]">
        {loading && page === 1 ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted">No notifications</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification._id}
              className={cn(
                'p-4 border-b border-border transition-colors',
                !notification.read && 'bg-blue-50 dark:bg-blue-900/10',
                'hover:bg-elevated',
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('text-xl', getTypeColor(notification.type))}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{notification.title}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                      <button
                        type="button"
                        onClick={() => deleteNotification(notification._id)}
                        className="text-xs text-muted hover:text-red-600 dark:hover:text-red-400"
                        aria-label="Delete notification"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <p className="text-sm mt-1 text-muted">{notification.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                    {notification.link && (
                      <Link
                        to={notification.link}
                        onClick={() => {
                          if (!notification.read) markAsRead(notification._id);
                          onClose?.();
                        }}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        {notification.linkText || 'View →'}
                      </Link>
                    )}
                    {!notification.read && !notification.link && (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification._id)}
                        className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && notifications.length > 0 && (
        <div className="p-3 text-center border-t border-border">
          <button
            type="button"
            onClick={() => setPage(p => p + 1)}
            disabled={loading}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}