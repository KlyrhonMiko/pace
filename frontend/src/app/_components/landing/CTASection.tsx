import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
    return (
        <section className="py-20 bg-emerald-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-800 to-indigo-900 opacity-20" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Your Account Is Already Waiting.</h2>
                <p className="text-emerald-100 mb-8 max-w-xl mx-auto text-lg">
                    Every PLP graduate has been provisioned a P.A.C.E. account through the university&apos;s alumni records.
                    Sign in with your registered email to access your portal.
                </p>
                <Link href="/?login=true">
                    <Button size="lg" className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold h-14 px-8 rounded-lg shadow-xl shadow-emerald-900/20 transition-all hover:-translate-y-0.5">
                        Sign In to Your Portal <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
                <p className="text-emerald-200/70 text-xs mt-6">
                    Can&apos;t locate your account? Reach out to the PLP Alumni Office for assistance.
                </p>
            </div>
        </section>
    );
}
