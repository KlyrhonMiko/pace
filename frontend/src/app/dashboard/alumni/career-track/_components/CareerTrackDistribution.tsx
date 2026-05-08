"use client";

import { PieChart, Sparkles } from "lucide-react";
import { getTrackMeta } from "../_lib/track-meta";

interface Props {
    predicted: string;
    allProbabilities: Record<string, number>;
}

export default function CareerTrackDistribution({ predicted, allProbabilities }: Props) {
    const sorted = Object.entries(allProbabilities).sort(([, a], [, b]) => b - a).slice(0, 5);

    return (
        <div className="rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 h-full">
            <div className="p-6 flex flex-col gap-5 h-full">
                {/* Header */}
                <div className="flex items-center gap-3 pb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                        <PieChart className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground">
                            Track Distribution
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Top matching career paths
                        </p>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-6 flex-1">
                    {sorted.map(([track, prob], idx) => {
                        const meta = getTrackMeta(track);
                        const isPredicted = track === predicted;
                        const rank = idx + 1;

                        return (
                            <div key={track} className="relative group">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3.5">
                                        {/* Rank Indicator */}
                                        <div className={`flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold ${isPredicted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            {rank}
                                        </div>
                                        
                                        {/* Track Info */}
                                        <div className="flex items-center gap-2">
                                            <meta.icon 
                                                className="w-4 h-4 transition-colors" 
                                                style={isPredicted ? { color: meta.accent } : { color: 'var(--muted-foreground)' }} 
                                                strokeWidth={isPredicted ? 2.5 : 2} 
                                            />
                                            <span className={`text-[14px] font-medium transition-colors ${isPredicted ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/80'}`}>
                                                {track}
                                            </span>
                                            {isPredicted && (
                                                <Sparkles className="w-3.5 h-3.5 ml-0.5" style={{ color: meta.accent }} />
                                            )}
                                        </div>
                                    </div>

                                    {/* Probability */}
                                    <span 
                                        className={`text-[14px] font-semibold tabular-nums ${isPredicted ? '' : 'text-muted-foreground'}`}
                                        style={isPredicted ? { color: meta.accent } : undefined}
                                    >
                                        {prob.toFixed(1)}%
                                    </span>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{
                                            width: `${Math.max(1, prob)}%`,
                                            background: isPredicted 
                                                ? `linear-gradient(90deg, ${meta.gradient.from}, ${meta.gradient.to})`
                                                : 'var(--muted-foreground)',
                                            opacity: isPredicted ? 1 : 0.25
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
