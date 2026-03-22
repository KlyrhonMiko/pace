"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, User, ShieldCheck, GraduationCap, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

interface LoginFormProps {
  defaultRole?: "ALUMNI" | "STAFF";
}

export function LoginForm({ defaultRole = "ALUMNI" }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<"ALUMNI" | "STAFF">(defaultRole);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiFetch<{
        success: boolean;
        data: {
          access_token: string;
          user_type: string;
          user_id: string;
        };
      }>("/auth/login", {
        method: "POST",
        body: formData,
      });

      if (response.success) {
        toast.success("Login successful!");
        
        // Use global login handler
        login({
          ...response.data,
          access_token: response.data.access_token
        });

        // Redirect based on user_type
        if (response.data.user_type === "ADMIN") {
          router.push("/dashboard/admin");
        } else if (response.data.user_type === "STAFF") {
          router.push("/dashboard/faculty");
        } else {
          router.push("/dashboard/alumni");
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Login failed. Please check your credentials.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Glassmorphism Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative px-8 py-10 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Role Selector */}
          <div className="flex p-1 bg-slate-100/50 rounded-xl mb-8">
            <button
              onClick={() => setRole("ALUMNI")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                role === "ALUMNI"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Alumni
            </button>
            <button
              onClick={() => setRole("STAFF")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                role === "STAFF"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Staff / Admin
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Please enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">Username</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-emerald-500 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <Input
                  type="text"
                  placeholder="Your username"
                  className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all rounded-xl"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Link
                  href="/reset-password"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-emerald-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all rounded-xl"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {role === "ALUMNI" && (
            <p className="text-center text-sm text-slate-500 mt-8">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Get Started
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
