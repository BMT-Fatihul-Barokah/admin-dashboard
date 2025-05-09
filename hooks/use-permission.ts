import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/lib/admin-auth-context';
import { supabase } from '@/lib/supabase';

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
 * Custom hook to check if the current user has a specific permission
 * @param permission The permission to check
 * @returns Object containing hasPermission boolean and isLoading state
 */
export function usePermission(permission: Permission) {
  const { user } = useAdminAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      if (!user?.id) {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }
      
      try {
        // Try to get from cache first
        if (permissionsCache[user.id]) {
          setHasPermission(permissionsCache[user.id].includes(permission));
          setIsLoading(false);
          return;
        }
        
        // Define role-based permissions mapping
        const rolePermissions: Record<string, Permission[]> = {
          admin: [
            'view_dashboard', 'view_users', 'edit_users', 'delete_users',
            'view_transactions', 'create_transactions', 'edit_transactions',
            'view_loans', 'approve_loans', 'reject_loans',
            'view_approvals', 'approve_customers', 'reject_customers',
            'view_reports', 'generate_reports', 'view_analytics',
            'view_notifications', 'manage_roles', 'import_data'
          ],
          ketua: [
            'view_dashboard', 'view_users', 'view_transactions',
            'view_loans', 'view_approvals', 'view_reports',
            'view_analytics', 'view_notifications'
          ],
          sekretaris: [
            'view_dashboard', 'view_users', 'edit_users', 'delete_users',
            'view_approvals', 'approve_customers', 'reject_customers',
            'view_notifications'
          ],
          bendahara: [
            'view_dashboard', 'view_users', 'view_transactions',
            'create_transactions', 'edit_transactions', 'view_loans',
            'view_reports', 'generate_reports', 'view_analytics'
          ]
        };
        
        // Get permissions based on user role
        if (user.role && rolePermissions[user.role]) {
          const userPermissions = rolePermissions[user.role];
          permissionsCache[user.id] = userPermissions;
          setHasPermission(userPermissions.includes(permission));
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkPermission();
  }, [user?.id, permission]);
  
  return { hasPermission, isLoading };
}

/**
 * Custom hook to check if the current user has any of the specified permissions
 * @param permissions Array of permissions to check
 * @returns Object containing hasAnyPermission boolean and isLoading state
 */
export function useAnyPermission(permissions: Permission[]) {
  const { user } = useAdminAuth();
  const [hasAnyPermission, setHasAnyPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkPermissions() {
      if (!user?.id || permissions.length === 0) {
        setHasAnyPermission(false);
        setIsLoading(false);
        return;
      }
      
      try {
        // Try to get from cache first
        if (permissionsCache[user.id]) {
          const hasAny = permissions.some(p => permissionsCache[user.id].includes(p));
          setHasAnyPermission(hasAny);
          setIsLoading(false);
          return;
        }
        
        // Define role-based permissions mapping
        const rolePermissions: Record<string, Permission[]> = {
          admin: [
            'view_dashboard', 'view_users', 'edit_users', 'delete_users',
            'view_transactions', 'create_transactions', 'edit_transactions',
            'view_loans', 'approve_loans', 'reject_loans',
            'view_approvals', 'approve_customers', 'reject_customers',
            'view_reports', 'generate_reports', 'view_analytics',
            'view_notifications', 'manage_roles', 'import_data'
          ],
          ketua: [
            'view_dashboard', 'view_users', 'view_transactions',
            'view_loans', 'view_approvals', 'view_reports',
            'view_analytics', 'view_notifications'
          ],
          sekretaris: [
            'view_dashboard', 'view_users', 'edit_users', 'delete_users',
            'view_approvals', 'approve_customers', 'reject_customers',
            'view_notifications'
          ],
          bendahara: [
            'view_dashboard', 'view_users', 'view_transactions',
            'create_transactions', 'edit_transactions', 'view_loans',
            'view_reports', 'generate_reports', 'view_analytics'
          ]
        };
        
        // Get permissions based on user role
        if (user.role && rolePermissions[user.role]) {
          const userPermissions = rolePermissions[user.role];
          permissionsCache[user.id] = userPermissions;
          
          // Check if user has any of the requested permissions
          const hasAny = permissions.some(p => userPermissions.includes(p));
          setHasAnyPermission(hasAny);
        } else {
          setHasAnyPermission(false);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasAnyPermission(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkPermissions();
  }, [user?.id, permissions]);
  
  return { hasAnyPermission, isLoading };
}
