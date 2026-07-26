import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  read?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}

// Get notifications for current user
export async function getNotifications(
  filters: NotificationFilters = {}
): Promise<Notification[]> {
  if (!supabase) return [];

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.read !== undefined) {
    query = query.eq('read', filters.read);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Notification[];
}

// Get unread count
export async function getUnreadCount(): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc('get_unread_notification_count');
  if (error) throw error;
  return data ?? 0;
}

// Mark notification as read
export async function markAsRead(notificationId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

// Mark all notifications as read
export async function markAllAsRead(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('mark_all_notifications_read');
  if (error) throw error;
}

// Delete notification
export async function deleteNotification(notificationId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
}

// Create notification (for system use)
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data: Record<string, unknown> = {}
): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured');

  const { data: result, error } = await supabase.rpc('create_notification', {
    p_user_id: userId,
    p_type: type,
    p_title: title,
    p_message: message,
    p_data: data,
  });

  if (error) throw error;
  return result as string;
}

// Subscribe to real-time notifications
export function subscribeToNotifications(
  callback: (payload: { new: Notification; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => void
) {
  if (!supabase) return { unsubscribe: () => {} };
  const client = supabase;

  const channel = client
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => {
        callback({
          new: payload.new as Notification,
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        });
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      client.removeChannel(channel);
    },
  };
}
