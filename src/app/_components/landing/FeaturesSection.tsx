import { Briefcase, GraduationCap, Users } from "lucide-react";

export function FeaturesSection() {
    return (
        <section className="py-24 bg-white" id="features">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Why P.A.C.E.?</h2>
                    <p className="text-slate-600">Our comprehensive platform is custom-built to support the unique journey of every alumni from Pamantasan ng Lungsod ng Pasig.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                    <FeatureCard
                        icon={<Briefcase className="h-6 w-6 text-emerald-700" />}
                        title="Career Opportunities"
                        description="Explore a centralized board of job openings and internships tailored for the Pasig community."
                    />
                    <FeatureCard
                        icon={<GraduationCap className="h-6 w-6 text-amber-500" />}
                        title="Professional Growth"
                        description="Stay updated on seminars, workshops, and resources designed to advance your skills and career."
                    />
                    <FeatureCard
                        icon={<Users className="h-6 w-6 text-blue-600" />}
                        title="Community Network"
                        description="Reconnect with batchmates and build professional relationships within the alumni ecosystem."
                    />
                </div>
            </div>
        </section>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/40 hover:-translate-y-1 transition-all duration-300 group">
            <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600 leading-relaxed">{description}</p>
        </div>
    );
}
