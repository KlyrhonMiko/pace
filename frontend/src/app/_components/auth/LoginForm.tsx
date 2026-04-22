"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, User, ArrowRight, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
        } else if (response.data.user_type === "EMPLOYER") {
          router.push("/dashboard/employer");
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
    <div className="w-full">
      {/* Back to Home */}
      <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-700 transition-colors mb-6 group/back">
        <ChevronLeft className="w-4 h-4 mr-1 group-hover/back:-translate-x-0.5 transition-transform" />
        Back to Home
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight leading-tight">
          Welcome back
        </h1>
        <p className="text-slate-500 text-[15px] mt-2 leading-relaxed">
          Sign in to your account to continue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Username */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-slate-700 ml-0.5">
            Username
          </label>
          <div className={`relative rounded-xl transition-all duration-200 ${focusedField === "username"
            ? "ring-2 ring-emerald-500/20"
            : ""
            }`}>
            <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200 ${focusedField === "username" ? "text-emerald-600" : "text-slate-400"
              }`}>
              <User className="w-[18px] h-[18px]" />
            </div>
            <Input
              type="text"
              placeholder="Enter your username"
              className="pl-11 h-12 bg-slate-50/80 border-slate-200/80 hover:border-slate-300 focus:border-emerald-500 focus:ring-0 transition-all rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              onFocus={() => setFocusedField("username")}
              onBlur={() => setFocusedField(null)}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between ml-0.5">
            <label className="text-[13px] font-semibold text-slate-700">
              Password
            </label>
            <Link
              href="/reset-password"
              className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className={`relative rounded-xl transition-all duration-200 ${focusedField === "password"
            ? "ring-2 ring-emerald-500/20"
            : ""
            }`}>
            <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200 ${focusedField === "password" ? "text-emerald-600" : "text-slate-400"
              }`}>
              <Lock className="w-[18px] h-[18px]" />
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-11 pr-11 h-12 bg-slate-50/80 border-slate-200/80 hover:border-slate-300 focus:border-emerald-500 focus:ring-0 transition-all rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-[18px] h-[18px]" />
              ) : (
                <Eye className="w-[18px] h-[18px]" />
              )}
            </button>
          </div>
        </div>

        {/* Sign In Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl font-semibold text-[15px] shadow-lg shadow-emerald-700/20 hover:shadow-emerald-700/30 transition-all duration-200 active:scale-[0.98] mt-2 group"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200/80" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-slate-50 lg:bg-white px-3 text-slate-400 font-medium">
            New to P.A.C.E.?
          </span>
        </div>
      </div>

      {/* Register Link */}
      <Link href="/register" className="block">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-xl font-semibold text-[15px] text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 group"
        >
          Create an Account
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </Link>
    </div>
  );
}
