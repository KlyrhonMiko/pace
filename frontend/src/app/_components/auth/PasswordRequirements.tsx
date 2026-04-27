import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirementsProps {
    password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
    const requirements = [
        { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
        { label: "At least one uppercase", test: (p: string) => /[A-Z]/.test(p) },
        { label: "At least one lowercase", test: (p: string) => /[a-z]/.test(p) },
        { label: "At least one number", test: (p: string) => /\d/.test(p) },
    ];

    if (!password) {
        return (
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100 mt-2">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 text-left">Password Requirements</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    {requirements.map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-full bg-gray-200 flex items-center justify-center">
                                <Check size={8} className="text-gray-400" strokeWidth={4} />
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium">{req.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-emerald-50/30 rounded-xl p-3 border border-emerald-100/50 mt-2 transition-all duration-300">
            <p className="text-[11px] font-semibold text-emerald-800/60 uppercase tracking-wider mb-2 text-left">Password Requirements</p>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {requirements.map((req, i) => {
                    const met = req.test(password);
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <div className={cn(
                                "w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300",
                                met ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"
                            )}>
                                <Check size={8} strokeWidth={4} />
                            </div>
                            <span className={cn(
                                "text-[11px] font-medium transition-colors duration-300",
                                met ? "text-emerald-700" : "text-gray-500"
                            )}>
                                {req.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
