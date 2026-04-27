"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, User, ArrowRight, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

interface LoginFormProps {
  onSuccess?: () => void;
  isModal?: boolean;
  onRegisterAlumniClick?: () => void;
  onRegisterEmployerClick?: () => void;
}

export function LoginForm({ onSuccess, isModal, onRegisterAlumniClick, onRegisterEmployerClick }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const isModalView = Boolean(isModal);

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
          force_password_reset?: boolean;
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

        // If account requires a forced first-login password reset, redirect there first
        if (response.data.force_password_reset) {
          router.push("/change-password");
          if (onSuccess) onSuccess();
          return;
        }

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

        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: unknown) {
      let message = "Login failed. Please try again.";
      if (error instanceof ApiError) {
        switch (error.code) {
          case "INVALID_CREDENTIALS":
            message = "Incorrect username or password. Please try again.";
            break;
          case "ACCOUNT_DEACTIVATED":
            message = "Your account has been deactivated. Please contact the administrator.";
            break;
          default:
            message = error.message || message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Back to Home */}
      {!isModal && (
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-700 transition-colors mb-6 group/back">
          <ChevronLeft className="w-4 h-4 mr-1 group-hover/back:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>
      )}

      {/* Header */}
      <div className={isModalView ? "mb-6" : "mb-8"}>
        <h1
          className={`font-extrabold text-slate-900 tracking-tight leading-tight ${isModalView ? "text-[24px]" : "text-[28px]"
            }`}
        >
          Welcome back
        </h1>
        <p
          className={`text-slate-500 mt-1.5 leading-relaxed ${isModalView ? "text-[14px]" : "text-[15px] mt-2"
            }`}
        >
          Sign in to your account to continue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={isModalView ? "space-y-4" : "space-y-5"}>
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
              className={`pl-11 bg-white border-slate-200 shadow-sm hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all rounded-xl text-slate-900 placeholder:text-slate-400 ${isModalView ? "h-11 text-[14px]" : "h-12 text-[15px]"
                }`}
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
              placeholder="Enter your password"
              className={`pl-11 pr-11 bg-white border-slate-200 shadow-sm hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all rounded-xl text-slate-900 placeholder:text-slate-400 ${isModalView ? "h-11 text-[14px]" : "h-12 text-[15px]"
                }`}
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
              aria-label={showPassword ? "Hide password" : "Show password"}
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
          className={`w-full bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 active:from-emerald-800 active:to-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-700/25 hover:shadow-emerald-700/35 transition-all duration-200 active:scale-[0.98] mt-2 group ${isModalView ? "h-11 text-[14px]" : "h-12 text-[15px]"
            }`}
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

      {/* Employer Register Link */}
      <div className={`relative ${isModalView ? "my-5" : "my-7"}`}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200/80" />
        </div>
        <div className="relative flex justify-center">
          <span className={`px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 ${isModalView ? "bg-white" : "bg-slate-50 lg:bg-white"}`}>
            Employers & Partners
          </span>
        </div>
      </div>

      <div className="block">
        <Button
          type="button"
          onClick={onRegisterEmployerClick}
          variant="outline"
          className={`w-full rounded-xl font-semibold text-emerald-700 border-emerald-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all duration-200 group ${isModalView ? "h-11 text-[14px]" : "h-12 text-[15px]"
            }`}
        >
          Register your Company
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>

    </div>
  );
}
