import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ActivityLogType = {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  description: string;
  metadata: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  admin_users?: {
    username: string;
    nama: string;
    role: string;
  };
};

export async function logActivity({
  userId,
  actionType,
  entityType,
  entityId,
  description,
  metadata = {},
}: {
  userId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, any>;
}): Promise<string | null> {
  try {
    // Get client IP and user agent if available
    let ipAddress = '';
    let userAgent = '';
    
    if (typeof window !== 'undefined') {
      userAgent = window.navigator.userAgent;
    }
    
    const { data, error } = await supabase.rpc('log_activity', {
      p_user_id: userId,
      p_action_type: actionType,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_description: description,
      p_metadata: metadata,
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    });
    
    if (error) {
      console.error('Error logging activity:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in logActivity:', error);
    return null;
  }
}

export async function getActivityLogs({
  userId = null,
  actionType = null,
  entityType = null,
  entityId = null,
  limit = 50,
  offset = 0,
}: {
  userId?: string | null;
  actionType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  limit?: number;
  offset?: number;
} = {}): Promise<ActivityLogType[]> {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*, admin_users!inner(username, nama, role)')
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (actionType) {
      query = query.eq('action_type', actionType);
    }
    
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    
    if (entityId) {
      query = query.eq('entity_id', entityId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }
    
    return data as ActivityLogType[];
  } catch (error) {
    console.error('Error in getActivityLogs:', error);
    return [];
  }
}
