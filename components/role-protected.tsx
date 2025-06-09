"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { AdminRole } from "@/lib/admin-auth";

interface RoleProtectedProps {
  children: React.ReactNode;
  allowedRoles: AdminRole[];
  requiredPermission?: string;
}

export function RoleProtected({ 
  children, 
  allowedRoles, 
  requiredPermission 
}: RoleProtectedProps) {
  const { user, isAuthenticated, isLoading, hasPermission } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      // If user doesn't have the required role, redirect to unauthorized
      if (user && !allowedRoles.includes(user.role as string)) {
        router.push("/unauthorized");
        return;
      }

      // If specific permission is required and user doesn't have it, redirect to unauthorized
      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push("/unauthorized");
      }
    }
  }, [
    isAuthenticated, 
    isLoading, 
    router, 
    user, 
    allowedRoles, 
    requiredPermission, 
    hasPermission
  ]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated or doesn't have the required role, don't render anything
  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return null;
  }

  // If specific permission is required and user doesn't have it, don't render anything
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  // Otherwise, render the children
  return <>{children}</>;
}

// Higher-order component for role-based protection
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: AdminRole[],
  requiredPermission?: string
) {
  return function ProtectedComponent(props: P) {
    return (
      <RoleProtected 
        allowedRoles={allowedRoles} 
        requiredPermission={requiredPermission}
      >
        <Component {...props} />
      </RoleProtected>
    );
  };
}
