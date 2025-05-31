"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminUser, AdminRole, getAdminSession, verifyAdminSession, logoutAdmin } from './admin-auth';
import { useRouter, usePathname } from 'next/navigation';

interface AdminAuthContextType {
  user: AdminUser | null;
  role: AdminRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  setUser: (user: AdminUser) => void;
  hasPermission: (action: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
  setUser: () => {},
  hasPermission: () => false,
});

export const useAdminAuth = () => useContext(AdminAuthContext);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const session = getAdminSession();
      
      if (!session) {
        setIsLoading(false);
        if (pathname && pathname !== '/admin/login' && pathname.startsWith('/admin')) {
          router.push('/admin/login');
        }
        return;
      }
      
      try {
        const { valid, user: verifiedUser } = await verifyAdminSession(session.token);
        
        if (valid && verifiedUser) {
          setUser(verifiedUser);
        } else {
          logoutAdmin();
          if (pathname && pathname !== '/admin/login' && pathname.startsWith('/admin')) {
            router.push('/admin/login');
          }
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        logoutAdmin();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [pathname, router]);

  const logout = () => {
    logoutAdmin();
    setUser(null);
    router.push('/admin/login');
  };

  const hasPermission = (action: string): boolean => {
    if (!user) return false;
    
    const permissions = {
      ketua: ['view_all'],
      admin: ['view_all', 'edit_all', 'approve_all', 'reject_all', 'view_roles', 'edit_roles'],
      sekretaris: ['view_all', 'edit_users', 'approve_users', 'reject_users'],
      bendahara: ['view_all', 'edit_transactions', 'approve_transactions', 'reject_transactions']
    };
    
    return permissions[user.role]?.includes(action) || false;
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        isAuthenticated: !!user,
        logout,
        setUser,
        hasPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: string
) {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, isLoading, hasPermission } = useAdminAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/admin/login');
      }
      
      if (!isLoading && isAuthenticated && requiredPermission && !hasPermission(requiredPermission)) {
        router.push('/admin/unauthorized');
      }
    }, [isAuthenticated, isLoading, router, requiredPermission]);

    if (isLoading) {
      return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return null;
    }

    return <Component {...props} />;
  };
}
