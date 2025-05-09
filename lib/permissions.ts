import { supabase } from './supabase';

// Define permission types based on your database
export type Permission = 
  | 'view_dashboard'
  | 'view_users'
  | 'edit_users'
  | 'delete_users'
  | 'view_transactions'
  | 'create_transactions'
  | 'edit_transactions'
  | 'view_loans'
  | 'approve_loans'
  | 'reject_loans'
  | 'view_approvals'
  | 'approve_customers'
  | 'reject_customers'
  | 'view_reports'
  | 'generate_reports'
  | 'view_analytics'
  | 'view_notifications'
  | 'manage_roles'
  | 'import_data';

// Cache for permissions to avoid repeated database queries
const permissionsCache: Record<string, Permission[]> = {};

/**
 * Check if a user has a specific permission
 * @param userId The user ID to check permissions for
 * @param permission The permission to check
 * @returns Promise<boolean> True if the user has the permission
 */
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  if (!userId) return false;
  
  // Try to get from cache first
  if (permissionsCache[userId]) {
    return permissionsCache[userId].includes(permission);
  }
  
  try {
    // Fetch user's role and permissions from database
    const { data: userData, error: userError } = await supabase
      .from('admin_users')
      .select('role_id')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('Error fetching user role:', userError);
      return false;
    }
    
    const { data: permissions, error: permissionsError } = await supabase
      .from('admin_role_permissions')
      .select(`
        admin_permissions (
          code
        )
      `)
      .eq('role_id', userData.role_id);
    
    if (permissionsError || !permissions) {
      console.error('Error fetching permissions:', permissionsError);
      return false;
    }
    
    // Extract permission codes
    const userPermissions = permissions.map(p => p.admin_permissions.code) as Permission[];
    
    // Cache the permissions
    permissionsCache[userId] = userPermissions;
    
    return userPermissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if a user has any of the specified permissions
 * @param userId The user ID to check permissions for
 * @param permissions Array of permissions to check
 * @returns Promise<boolean> True if the user has any of the permissions
 */
export async function hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(userId, permission)) {
      return true;
    }
  }
  return false;
}

/**
 * React hook for permission checking
 * @param permission The permission to check
 * @returns Object with hasPermission boolean and isLoading state
 */
export function usePermission(userId: string | undefined, permission: Permission) {
  const [hasPermissionValue, setHasPermission] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    async function checkPermission() {
      if (!userId) {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }
      
      const result = await hasPermission(userId, permission);
      setHasPermission(result);
      setIsLoading(false);
    }
    
    checkPermission();
  }, [userId, permission]);
  
  return { hasPermission: hasPermissionValue, isLoading };
}

// Add missing React import
import React from 'react';
