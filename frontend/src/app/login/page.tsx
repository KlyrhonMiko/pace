import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "../_components/auth/LoginForm";
import { LoginNotice } from "../_components/auth/LoginNotice";

export const metadata: Metadata = {
  title: "Sign In | P.A.C.E.",
  description: "Sign in to your P.A.C.E. account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex font-sans bg-slate-50">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-[15%] left-[10%] w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[20%] right-[5%] w-96 h-96 bg-teal-300/15 rounded-full blur-3xl animate-pulse [animation-delay:1.5s]" />
          <div className="absolute top-[60%] left-[30%] w-64 h-64 bg-emerald-300/10 rounded-full blur-3xl animate-pulse [animation-delay:3s]" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top: Logo */}
          <Link href="/" className="flex items-center gap-3 w-fit group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/plp-logo.png?v=2"
              alt="PLP Logo"
              width="44"
              height="44"
              className="object-contain drop-shadow-lg group-hover:drop-shadow-emerald-500/30 transition-all duration-300"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white/95 leading-tight tracking-tight group-hover:text-white transition-colors">
                Pamantasan ng Lungsod ng Pasig
              </span>
              <span className="text-[10px] font-semibold text-emerald-200/80 uppercase tracking-[0.2em] mt-0.5 group-hover:text-emerald-200 transition-colors">
                Alumni & Career
              </span>
            </div>
          </Link>

          {/* Center: Hero Copy */}
          <div className="space-y-6 max-w-sm">
            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              Your career{" "}
              <span className="text-emerald-200">journey</span>{" "}
              starts here.
            </h1>
            <p className="text-base text-emerald-100/70 leading-relaxed">
              Connect with fellow alumni, explore career opportunities, and track your professional growth — all in one place.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {["Career Insights", "Alumni Network", "Job Matching"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-emerald-100 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3.5 py-1.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom: Quote / Testimonial */}
          <div className="space-y-3">
            <div className="w-10 h-px bg-emerald-300/30" />
            <blockquote className="text-sm text-emerald-100/60 italic leading-relaxed max-w-xs">
              &ldquo;P.A.C.E. helped me connect with opportunities I never knew existed.&rdquo;
            </blockquote>
            <p className="text-xs text-emerald-200/40 font-medium">— PLP Alumni, Class of 2023</p>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden border-b border-slate-100 bg-white sticky top-0 z-50">
          <Link href="/" className="px-4 h-16 flex items-center gap-3 w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/plp-logo.png?v=2"
              alt="PLP Logo"
              width="36"
              height="36"
              className="object-contain"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 leading-none">
                Pamantasan ng Lungsod ng Pasig
              </span>
              <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-[0.15em] mt-0.5">
                Alumni & Career
              </span>
            </div>
          </Link>
        </div>

        {/* Form area */}
        <main className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-[420px] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Suspense>
              <LoginNotice />
            </Suspense>
            <LoginForm />
          </div>
        </main>

        {/* Bottom bar */}
        <div className="text-center py-5 text-xs text-slate-400 border-t border-slate-100">
          © {new Date().getFullYear()} Pamantasan ng Lungsod ng Pasig. All rights reserved.
        </div>
      </div>
    </div>
  );
}
