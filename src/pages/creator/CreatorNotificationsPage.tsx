import { useState } from 'react';
import { Bell, CheckCheck, Trash2, Filter } from 'lucide-react';
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

type FilterType = 'all' | 'unread' | 'read';

export function CreatorNotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications(50);
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(id);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-400 mt-1">
            Stay updated with your campaign and account activity
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2">
          {(['all', 'unread', 'read'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Read'}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-400/20 rounded-full text-xs">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No notifications
            </h3>
            <p className="text-gray-500">
              {filter === 'all'
                ? "You're all caught up! No notifications to show."
                : filter === 'unread'
                ? 'No unread notifications'
                : 'No read notifications'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredNotifications.map((notification) => {
              const config = getNotificationConfig(notification.type);
              const timeAgo = formatDistanceToNow(notification.created_at);

              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-700/30 transition-colors ${
                    !notification.read ? 'bg-blue-500/5' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 text-2xl">
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3
                              className={`text-sm font-medium ${
                                !notification.read
                                  ? 'text-white'
                                  : 'text-gray-300'
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span
                              className={`text-xs ${config.color}`}
                            >
                              {config.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {timeAgo}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id, notification.read)}
                              className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                              title="Mark as read"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
