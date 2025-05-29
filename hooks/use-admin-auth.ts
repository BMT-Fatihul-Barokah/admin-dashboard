"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface AdminUser {
  id: string;
  username: string;
  role: string;
  nama: string;
  email: string;
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session?.user) {
          setUser(null);
          return;
        }

        const { data: adminUser, error } = await supabase
          .from("admin_users")
          .select("*")
          .eq("id", session.session.user.id)
          .single();

        if (error) throw error;
        setUser(adminUser);
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
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

  return { user, isLoading };
}
