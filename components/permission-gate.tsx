import React from 'react';
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Permission, hasPermission } from '@/lib/permissions';

interface PermissionGateProps {
  /**
   * The permission required to render the children
   */
  permission?: Permission;
  
  /**
   * Array of permissions - if any of these are granted, children will render
   */
  anyPermission?: Permission[];
  
  /**
   * Content to render when the user has permission
   */
  children: React.ReactNode;
  
  /**
   * Optional fallback content to render when the user doesn't have permission
   * If not provided, nothing will be rendered when permission is denied
   */
  fallback?: React.ReactNode;
}

/**
 * A component that conditionally renders its children based on user permissions
 */
export function PermissionGate({ 
  permission, 
  anyPermission, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { user } = useAdminAuth();
  const [hasAccess, setHasAccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function checkPermission() {
      if (!user?.id) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        let permitted = false;
        
        // Check single permission
        if (permission) {
          permitted = await hasPermission(user.id, permission);
        }
        
        // Check any of the permissions
        if (!permitted && anyPermission && anyPermission.length > 0) {
          for (const perm of anyPermission) {
            const result = await hasPermission(user.id, perm);
            if (result) {
              permitted = true;
              break;
            }
          }
        }
        
        setHasAccess(permitted);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkPermission();
  }, [user?.id, permission, anyPermission]);

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // Render children if user has permission, otherwise render fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
