import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
    return (
        <section className="py-20 bg-emerald-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-800 to-indigo-900 opacity-20" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Your Future Starts Here.</h2>
                <p className="text-emerald-100 mb-8 max-w-xl mx-auto text-lg">Join the official P.A.C.E. platform and take the first step towards your dream career.</p>
                <Link href="/dashboard/alumni">
                    <Button size="lg" className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold h-14 px-8 rounded-lg shadow-xl shadow-emerald-900/20 transition-all hover:-translate-y-0.5">
                        Join the Network <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
            </div>
        </section>
    );
}
