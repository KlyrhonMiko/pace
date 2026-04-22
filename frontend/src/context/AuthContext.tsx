"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

interface User {
  user_id: string;
  user_type: string;
  user_code?: string;
  access_token: string;
  first_name?: string | null;
  last_name?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: (message?: string) => void;
  getDashboardUrl: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch (e) {
          console.error("Failed to parse stored user", e);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(async (message?: string) => {
    try {
      // Optimistically try to call the backend logout, but don't wait for it if it fails
      const token = localStorage.getItem("token");
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }).catch(err => console.warn("Logout notification failed:", err));
      }
    } catch (e) {
      console.error("Logout error", e);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear cookies for middleware
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "userType=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    setUser(null);
    if (message) {
      toast.info(message);
    }

    // Hard redirect to login to ensure clean state
    window.location.href = "/login";
  }, []);

  const login = useCallback((userData: User) => {
    localStorage.setItem("token", userData.access_token);
    localStorage.setItem("user", JSON.stringify(userData));

    // Set cookies for middleware (7 days)
    const maxAge = 60 * 60 * 24 * 7;
    document.cookie = `token=${userData.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `userType=${userData.user_type}; path=/; max-age=${maxAge}; SameSite=Lax`;

    setUser(userData);
  }, []);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const getDashboardUrl = useCallback(() => {
    if (!user) return "/login";
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
