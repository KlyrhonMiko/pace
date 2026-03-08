"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { EmployabilityResult } from "../../_lib/api";
import CareerAdvisorChat from "./CareerAdvisorChat";

export default function AskAIButton({
    insightsData,
}: {
    insightsData: EmployabilityResult;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-green-500 transition-all duration-300 cursor-pointer"
            >
                <Sparkles
                    className="h-4 w-4 group-hover:animate-pulse"
                    strokeWidth={2}
                />
                Ask AI
            </button>

            <CareerAdvisorChat
                insightsData={insightsData}
                open={open}
                onOpenChange={setOpen}
            />
        </>
    );
}
