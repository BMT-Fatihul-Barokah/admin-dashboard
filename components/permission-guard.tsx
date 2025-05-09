import React from 'react';
import { usePermission, useAnyPermission, Permission } from '@/hooks/use-permission';

interface PermissionGuardProps {
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
  
  /**
   * Whether to show a loading state while permissions are being checked
   * Default is false - nothing will be shown during loading
   */
  showLoading?: boolean;
}

/**
 * A component that conditionally renders its children based on user permissions
 */
export function PermissionGuard({ 
  permission, 
  anyPermission, 
  children, 
  fallback = null,
  showLoading = false
}: PermissionGuardProps) {
  // Use the appropriate hook based on whether we're checking a single permission or multiple
  const singlePermission = usePermission(permission as Permission);
  const multiplePermissions = useAnyPermission(anyPermission || []);
  
  const isLoading = permission ? singlePermission.isLoading : multiplePermissions.isLoading;
  const hasAccess = permission 
    ? singlePermission.hasPermission 
    : multiplePermissions.hasAnyPermission;

  // Don't render anything while loading unless showLoading is true
  if (isLoading) {
    return showLoading ? (
      <div className="animate-pulse bg-muted rounded h-8 w-full max-w-[100px]"></div>
    ) : null;
  }

  // Render children if user has permission, otherwise render fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
