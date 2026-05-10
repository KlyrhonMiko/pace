"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/api-base-url";

interface User {
  user_id: string;
  user_type: string;
  access_token?: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  company_logo_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: (message?: string) => void;
  updateUser: (updates: Partial<User>) => void;
  getDashboardUrl: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function bootstrapSession() {
      try {
        const res = await fetch(`${getApiBaseUrl()}/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Session invalid");
        const json = await res.json();
        if (json.success && json.data) {
          const me = json.data;
          if (!cancelled) {
            setUser({
              user_id: me.user_id,
              user_type: me.user_type,
              first_name: me.first_name ?? null,
              last_name: me.last_name ?? null,
              company_name: me.company_name ?? null,
              company_logo_url: me.company_logo_url ?? null,
            });
          }
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    bootstrapSession();
    return () => { cancelled = true; };
  }, []);

  const logout = useCallback(async (message?: string) => {
    try {
      await fetch(`${getApiBaseUrl()}/auth/logout`, {
        method: "POST",
        credentials: "include",
        keepalive: true,
      });
    } catch (e) {
      console.warn("Logout notification failed:", e);
    }

    setUser(null);
    if (typeof message === "string") {
      toast.info(message);
    }

    window.location.href = "/?login=true";
  }, []);

  const login = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      return { ...prevUser, ...updates };
    });
  }, []);

  const getDashboardUrl = useCallback(() => {
    if (!user) return "/?login=true";
    switch (user.user_type) {
      case "ADMIN":
        return "/dashboard/admin";
      case "STAFF":
        return "/dashboard/faculty";
      case "EMPLOYER":
        return "/dashboard/employer";
      case "USER":
        return "/dashboard/alumni";
      default:
        return "/";
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
        getDashboardUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
