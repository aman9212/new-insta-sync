import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from '../../lib/validators';

const NOTIFICATION_TYPE_CONFIG: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  campaign_approved: { icon: '✅', color: 'text-green-400', label: 'Campaign Approved' },
  campaign_rejected: { icon: '❌', color: 'text-red-400', label: 'Campaign Rejected' },
  submission_eligible: { icon: '🎉', color: 'text-green-400', label: 'Submission Eligible' },
  submission_rejected: { icon: '❌', color: 'text-red-400', label: 'Submission Rejected' },
  withdrawal_approved: { icon: '💰', color: 'text-green-400', label: 'Withdrawal Approved' },
  withdrawal_rejected: { icon: '❌', color: 'text-red-400', label: 'Withdrawal Rejected' },
  new_message: { icon: '💬', color: 'text-blue-400', label: 'New Message' },
  system_alert: { icon: '⚠️', color: 'text-yellow-400', label: 'System Alert' },
  fraud_alert: { icon: '🚨', color: 'text-red-400', label: 'Fraud Alert' },
  payout_processed: { icon: '💸', color: 'text-green-400', label: 'Payout Processed' },
  campaign_update: { icon: '📢', color: 'text-blue-400', label: 'Campaign Update' },
  default: { icon: '🔔', color: 'text-gray-400', label: 'Notification' },
};

function getNotificationConfig(type: string) {
  return NOTIFICATION_TYPE_CONFIG[type] || NOTIFICATION_TYPE_CONFIG.default;
}

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(10);

  useEffect(() => {
    // Mark notifications as read when dropdown opens
    if (notifications.length > 0) {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      unreadIds.forEach((id) => markAsRead(id));
    }
  }, [notifications, markAsRead]);

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(notificationId);
    }
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-96 max-h-[500px] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-300" />
          <h3 className="text-white font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium text-white bg-blue-500 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            title="Mark all as read"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-pulse">Loading notifications...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-1">
              We'll notify you when something important happens
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {notifications.map((notification) => {
              const config = getNotificationConfig(notification.type as string);
              const timeAgo = formatDistanceToNow(notification.created_at);
              const notificationLink = typeof notification.data?.link === 'string' ? notification.data.link : null;

              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-700/50 transition-colors ${
                    !notification.read ? 'bg-blue-500/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 text-xl">{config.icon as React.ReactNode}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              !notification.read ? 'text-white' : 'text-gray-300'
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-xs ${config.color}`}
                            >
                              {config.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              • {timeAgo}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {notificationLink && (
                            <Link
                              to={notificationLink}
                              onClick={() =>
                                handleNotificationClick(
                                  notification.id,
                                  notification.read
                                )
                              }
                              className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                              title="View"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="mt-2">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-700">
          <Link
            to="/creator/notifications"
            onClick={onClose}
            className="block w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
