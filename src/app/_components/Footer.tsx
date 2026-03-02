// Footer component
import Link from "next/link";

import { MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-emerald-950 text-emerald-100 py-16 border-t border-emerald-900/50">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="md:col-span-5 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="relative w-20 h-20 shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/plp-logo.png?v=2"
                                    alt="PLP Logo"
                                    width="80"
                                    height="80"
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-2xl font-black text-white tracking-tighter leading-tight">
                                Pamantasan ng<br />Lungsod ng Pasig
                            </span>
                        </div>
                        <p className="text-emerald-300/80 leading-relaxed max-w-md text-sm">
                            The Official Career & Employability System. Dedicated to bridging the gap between education and employment, empowering every PLPian to succeed in their professional journey.
                        </p>
                    </div>

                    {/* Location Section */}
                    <div className="md:col-span-3">
                        <div className="space-y-4">
                            <h3 className="text-white font-semibold flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-emerald-400" />
                                Location
                            </h3>
                            <p className="text-sm text-emerald-300/60 leading-relaxed">
                                Alcalde Jose Street,<br />
                                Kapasigan, Pasig City<br />
                                Metro Manila, Philippines
                            </p>
                        </div>
                    </div>

                    {/* Contact & Socials */}
                    <div className="md:col-span-4">
                        <div className="space-y-4">
                            <h3 className="text-white font-semibold">Contact Us</h3>
                            <div className="space-y-3 text-sm text-emerald-300/60">
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-emerald-500" />
                                    <span>2-8643-1014</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-emerald-500" />
                                    <span>inquiry@plpasig.edu.ph</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-emerald-800/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-emerald-500/60">
                    <p>&copy; {new Date().getFullYear()} Pamantasan ng Lungsod ng Pasig.</p>
                    <div className="flex gap-6 items-center">
                        <Link href="#" className="hover:text-emerald-300 transition-colors">
                            Terms of Conditions
                        </Link>
                        <div className="h-4 w-px bg-emerald-800/50" />
                        <p>Powered by P.A.C.E.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
