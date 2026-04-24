"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Loader2, Mail, Lock, KeyRound, CheckCircle2,
  ArrowLeft, Save, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";

type Step = "EMAIL" | "CODE" | "PASSWORD" | "SUCCESS";

export function ResetPasswordFlow() {
  const [step, setStep] = useState<Step>("EMAIL");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    otp_code: "",
    new_password: "",
    confirm_password: "",
  });

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiFetch<{ success: boolean; message?: string }>("/otp/send", {
        method: "POST",
        body: { email: formData.email },
      });

      if (response.success) {
        toast.success("Verification code sent to your email!");
        setStep("CODE");
      } else {
        toast.error(response.message || "Failed to send code.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // We'll just move to the password step. 
      // The actual verification happens on the final save step to be atomic.
      // But we can call /otp/verify here to be proactive.
      const response = await apiFetch<{ success: boolean; message?: string }>("/otp/verify", {
        method: "POST",
        body: { email: formData.email, otp_code: formData.otp_code },
      });

      if (response.success) {
        toast.success("Code verified!");
        setStep("PASSWORD");
      } else {
        toast.error(response.message || "Invalid code.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Verification failed.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }

    if (formData.new_password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch<{ success: boolean; message?: string }>("/auth/reset-password", {
        method: "POST",
        body: {
          email: formData.email,
          otp_code: formData.otp_code,
          new_password: formData.new_password,
        },
      });

      if (response.success) {
        toast.success("Password reset successfully!");
        setStep("SUCCESS");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reset password.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

        <div className="relative px-8 py-10 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden min-h-[450px] flex flex-col justify-center transition-all duration-500">

          {step !== "SUCCESS" && (
            <Link
              href="/?login=true"
              className="absolute top-6 left-6 text-slate-400 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}

          {step === "EMAIL" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Mail className="w-8 h-8" />
                </div>
              </div>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password?</h1>
                <p className="text-slate-500 text-sm mt-2">Enter your email and we'll send you a recovery code.</p>
              </div>
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-emerald-500 transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all rounded-xl"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] mt-4"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Code"}
                </Button>
              </form>
            </div>
          )}

          {step === "CODE" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <KeyRound className="w-8 h-8" />
                </div>
              </div>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Identity</h1>
                <p className="text-slate-500 text-sm mt-2">We sent a 6-digit code to <b>{formData.email}</b></p>
              </div>
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 ml-1 text-center block">Verification Code</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    className="h-14 text-center text-2xl font-mono tracking-[0.5em] bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all rounded-xl"
                    value={formData.otp_code}
                    onChange={(e) => setFormData({ ...formData, otp_code: e.target.value.replace(/\D/g, "") })}
                    required
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] mt-4"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code"}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("EMAIL")}
                  className="w-full text-xs font-semibold text-slate-500 hover:text-emerald-700 py-2 transition-colors"
                >
                  Didn&apos;t get the code? Try another email
                </button>
              </form>
            </div>
          )}

          {step === "PASSWORD" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <ShieldCheck className="w-8 h-8" />
                </div>
              </div>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Set New Password</h1>
                <p className="text-slate-500 text-sm mt-2">Choose a strong, unique password for your account.</p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 ml-1">New Password</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-emerald-500 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all rounded-xl"
                      value={formData.new_password}
                      onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 ml-1">Confirm New Password</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-emerald-500 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all rounded-xl"
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
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
                      <Save className="w-4 h-4 mr-2" />
                      Save Password
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {step === "SUCCESS" && (
            <div className="animate-in zoom-in-95 fade-in duration-500 text-center">
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full animate-bounce-slow">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All Done!</h1>
              <p className="text-slate-500 text-sm mt-3 mb-8">
                Your password has been reset successfully. You can now sign in with your new credentials.
              </p>
              <Link href="/?login=true">
                <Button className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
