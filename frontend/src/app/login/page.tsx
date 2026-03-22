import { Suspense } from "react";
import { Metadata } from "next";
import { Navbar } from "../_components/Navbar";
import { Footer } from "../_components/Footer";
import { LoginForm } from "../_components/auth/LoginForm";
import { LoginNotice } from "../_components/auth/LoginNotice";

export const metadata: Metadata = {
  title: "Sign In | P.A.C.E.",
  description: "Sign in to your P.A.C.E. account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50/50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-4 py-20 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[120px]"></div>
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] bg-teal-100/40 rounded-full blur-[120px]"></div>
        </div>

        <div className="w-full max-w-md flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Suspense>
            <LoginNotice />
          </Suspense>
          <LoginForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
