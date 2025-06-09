"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface AdminUser {
  id: string;
  username: string;
  role_id: string;
  role?: string;
  nama: string;
  email: string;
}

interface Permission {
  id: string;
  code: string;
  description: string;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session?.user) {
          setUser(null);
          setIsAuthenticated(false);
          return;
        }

        // Get admin user
        const { data: adminUser, error } = await supabase
          .from("admin_users")
          .select("*")
          .eq("id", session.session.user.id)
          .single();

        if (error) throw error;

        // Get role name
        const { data: roleData } = await supabase
          .from("admin_roles")
          .select("name")
          .eq("id", adminUser.role_id)
          .single();

        // Get user permissions
        const { data: rolePermissions } = await supabase
          .from("admin_role_permissions")
          .select("permission_id")
          .eq("role_id", adminUser.role_id);

        // Get permission codes
        const permissionIds = rolePermissions?.map(rp => rp.permission_id) || [];
        const { data: permissions } = await supabase
          .from("admin_permissions")
          .select("code")
          .in("id", permissionIds);

        const permissionCodes = permissions?.map(p => p.code) || [];
        
        // Check for special permissions that grant all access
        if (permissionCodes.includes('view_all')) {
          const { data: allViewPermissions } = await supabase
            .from("admin_permissions")
            .select("code")
            .like("code", "view_%");
            
          permissionCodes.push(...(allViewPermissions?.map(p => p.code) || []));
        }
        
        // Add role name to user object
        const userWithRole = {
          ...adminUser,
          role: roleData?.name || ''
        };

        setUser(userWithRole);
        setUserPermissions([...new Set(permissionCodes)]);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
        setIsAuthenticated(false);
        setUserPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async () => {
      await fetchUser();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const hasPermission = (permission: string): boolean => {
    // Special case for view_roles permission needed for role management
    if (permission === 'view_roles' && userPermissions.includes('manage_roles')) {
      return true;
    }
    
    return userPermissions.includes(permission);
  };

  return { 
    user, 
    isLoading, 
    isAuthenticated, 
    hasPermission,
    permissions: userPermissions
  };
}
