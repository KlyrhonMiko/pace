import { Metadata } from "next";
import { Navbar } from "../_components/Navbar";
import { Footer } from "../_components/Footer";
import { ResetPasswordFlow } from "../_components/auth/ResetPasswordFlow";

export const metadata: Metadata = {
  title: "Reset Password | P.A.C.E.",
  description: "Reset your P.A.C.E. account password",
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50/50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-4 py-20 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[120px]"></div>
          <div className="absolute top-[60%] -left-[10%] w-[40%] h-[40%] bg-teal-100/40 rounded-full blur-[120px]"></div>
        </div>

        <ResetPasswordFlow />
      </main>

      <Footer />
    </div>
  );
}
