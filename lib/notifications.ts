import { supabase } from '@/lib/supabase';

// Types for notifications
export type GlobalNotification = {
  id: string;
  judul: string;
  pesan: string;
  jenis: string;
  data?: any;
  created_at: Date;
  updated_at: Date;
};

export type GlobalNotificationRead = {
  id: string;
  global_notifikasi_id: string;
  anggota_id: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
};

export type TransactionNotification = {
  id: string;
  judul: string;
  pesan: string;
  jenis: string;
  data?: any;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
  transaksi_id?: string;
};

export type CombinedNotification = {
  id: string;
  judul: string;
  pesan: string;
  jenis: string;
  is_read: boolean;
  data?: any;
  created_at: Date;
  updated_at: Date;
  source: 'global' | 'transaction';
  transaksi_id?: string;
};

// Get all global notifications
export async function getGlobalNotifications(): Promise<GlobalNotification[]> {
  try {
    console.log('Fetching global notifications...');
    const { data, error } = await supabase
      .from('global_notifikasi')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching global notifications:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getGlobalNotifications:', error);
    return [];
  }
}

// Get global notification read status for a specific user
export async function getGlobalNotificationReadStatus(
  anggotaId: string
): Promise<GlobalNotificationRead[]> {
  try {
    const { data, error } = await supabase
      .from('global_notifikasi_read')
      .select('*')
      .eq('anggota_id', anggotaId);

    if (error) {
      console.error('Error fetching notification read status:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getGlobalNotificationReadStatus:', error);
    return [];
  }
}

// Get transaction notifications
export async function getTransactionNotifications(): Promise<TransactionNotification[]> {
  try {
    console.log('Fetching transaction notifications...');
    const { data, error } = await supabase
      .from('transaksi_notifikasi')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transaction notifications:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTransactionNotifications:', error);
    return [];
  }
}

// Get combined notifications (global + transaction)
export async function getCombinedNotifications(
  anggotaId?: string
): Promise<CombinedNotification[]> {
  try {
    console.log('Fetching combined notifications...');
    // Get global notifications
    const globalNotifications = await getGlobalNotifications();
    
    // Get read status for global notifications if anggotaId is provided
    let readStatusMap: Record<string, boolean> = {};
    if (anggotaId) {
      const readStatus = await getGlobalNotificationReadStatus(anggotaId);
      readStatusMap = readStatus.reduce((acc, item) => {
        acc[item.global_notifikasi_id] = item.is_read;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // Get transaction notifications
    const transactionNotifications = await getTransactionNotifications();
    
    // Combine notifications
    const combined: CombinedNotification[] = [
      ...globalNotifications.map(notification => ({
        ...notification,
        is_read: readStatusMap[notification.id] || false,
        source: 'global' as const
      })),
      ...transactionNotifications.map(notification => ({
        ...notification,
        source: 'transaction' as const
      }))
    ];
    
    // Sort by created_at (newest first)
    return combined.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  } catch (error) {
    console.error('Error in getCombinedNotifications:', error);
    return [];
  }
}

// Mark global notification as read
export async function markGlobalNotificationAsRead(
  notificationId: string,
  anggotaId: string
): Promise<boolean> {
  try {
    // Check if read status exists
    const { data: existingStatus } = await supabase
      .from('global_notifikasi_read')
      .select('*')
      .eq('global_notifikasi_id', notificationId)
      .eq('anggota_id', anggotaId)
      .single();
    
    if (existingStatus) {
      // Update existing status
      const { error } = await supabase
        .from('global_notifikasi_read')
        .update({ is_read: true, updated_at: new Date() })
        .eq('id', existingStatus.id);
      
      if (error) throw error;
    } else {
      // Create new read status
      const { error } = await supabase
        .from('global_notifikasi_read')
        .insert({
          global_notifikasi_id: notificationId,
          anggota_id: anggotaId,
          is_read: true
        });
      
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error marking global notification as read:', error);
    return false;
  }
}

// Mark transaction notification as read
export async function markTransactionNotificationAsRead(
  notificationId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('transaksi_notifikasi')
      .update({ is_read: true, updated_at: new Date() })
      .eq('id', notificationId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking transaction notification as read:', error);
    return false;
  }
}

// Mark notification as read (handles both types)
export async function markNotificationAsRead(
  notification: CombinedNotification,
  anggotaId?: string
): Promise<boolean> {
  if (notification.source === 'global' && anggotaId) {
    return markGlobalNotificationAsRead(notification.id, anggotaId);
  } else if (notification.source === 'transaction') {
    return markTransactionNotificationAsRead(notification.id);
  }
  return false;
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(
  anggotaId: string
): Promise<boolean> {
  try {
    // Get all global notifications
    const globalNotifications = await getGlobalNotifications();
    
    // Create read status for each global notification
    for (const notification of globalNotifications) {
      await markGlobalNotificationAsRead(notification.id, anggotaId);
    }
    
    // Mark all transaction notifications as read
    const { error } = await supabase
      .from('transaksi_notifikasi')
      .update({ is_read: true, updated_at: new Date() })
      .eq('is_read', false);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(
  anggotaId?: string
): Promise<number> {
  try {
    const notifications = await getCombinedNotifications(anggotaId);
    return notifications.filter(notification => !notification.is_read).length;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}
