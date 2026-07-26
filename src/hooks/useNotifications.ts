import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
  type Notification,
} from '../services/notification.service';

export function useNotifications(limit = 20) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [notifs, count] = await Promise.all([
        getNotifications({ limit }),
        getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return;

    const { unsubscribe } = subscribeToNotifications((payload) => {
      if (payload.eventType === 'INSERT') {
        setNotifications((prev) => [payload.new, ...prev].slice(0, limit));
        setUnreadCount((prev) => prev + 1);
      } else if (payload.eventType === 'UPDATE') {
        setNotifications((prev) =>
          prev.map((n) => (n.id === payload.new.id ? payload.new : n))
        );
        if (payload.new.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } else if (payload.eventType === 'DELETE') {
        setNotifications((prev) => prev.filter((n) => n.id !== payload.new.id));
      }
    });

    return unsubscribe;
  }, [user, limit]);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silently fail
    }
  }, [user]);

  const markAsReadHandler = useCallback(
    async (notificationId: string) => {
      try {
        await markAsRead(notificationId);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silently fail
      }
    },
    []
  );

  const markAllAsReadHandler = useCallback(async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }, []);

  const deleteNotificationHandler = useCallback(
    async (notificationId: string) => {
      try {
        await deleteNotification(notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      } catch {
        // Silently fail
      }
    },
    []
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    refreshUnreadCount,
    markAsRead: markAsReadHandler,
    markAllAsRead: markAllAsReadHandler,
    deleteNotification: deleteNotificationHandler,
  };
}
