"use client";

import { useState, useEffect } from "react";
import { 
    BarChart3, 
    X, 
    Download, 
    Loader2, 
    MessageSquare,
    CheckCircle2,
    PieChart,
    ArrowRight,
    TrendingUp,
    FileJson,
    FileSpreadsheet,
    Users,
    ChevronDown,
    ChevronUp,
    User,
    CalendarDays
} from "lucide-react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
    fetchSurveyResults,
    fetchSurveyExport,
    SurveyResults, 
    Survey,
    QuestionStats,
    IndividualResponse,
    SurveyExportData
} from "../../_lib/surveys";
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SurveyResultsModalProps {
    survey: Survey | null;
    isOpen: boolean;
    onClose: () => void;
}

export function SurveyResultsModal({ survey, isOpen, onClose }: SurveyResultsModalProps) {
    const [results, setResults] = useState<SurveyResults | null>(null);
    const [exportData, setExportData] = useState<SurveyExportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'analytics' | 'responses'>('analytics');
    const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && survey) {
            loadResults();
            loadIndividualResponses();
        } else {
            setResults(null);
            setExportData(null);
            setActiveTab('analytics');
        }
    }, [isOpen, survey]);

    async function loadResults() {
        if (!survey) return;
        setLoading(true);
        try {
            const data = await fetchSurveyResults(survey.survey_id);
            setResults(data);
        } catch (error) {
            console.error("Failed to load survey results", error);
        } finally {
            setLoading(false);
        }
    }

    async function loadIndividualResponses() {
        if (!survey) return;
        try {
            const data = await fetchSurveyExport(survey.survey_id);
            setExportData(data);
        } catch (error) {
            console.error("Failed to load individual responses", error);
        }
    }

    async function handleExport(format: 'json' | 'csv') {
        if (!survey) return;
        const data = await fetchSurveyExport(survey.survey_id);
        if (!data) return;

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `survey_${survey.survey_id}_results.json`;
            a.click();
        } else {
            // Simple JSON to CSV conversion for responses
            const responses = data.responses || [];
            if (responses.length === 0) return;
            
            const headers = Object.keys(responses[0]);
            const csvRows = [
                headers.join(','),
                ...responses.map((row: any) => headers.map(h => `"${row[h] || ''}"`).join(','))
            ];
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `survey_${survey.survey_id}_results.csv`;
            a.click();
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col p-0 border-none rounded-[2.5rem] shadow-2xl transition-all duration-500 ease-in-out">
                <DialogHeader className="px-12 pt-12 pb-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-white relative">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-2xl bg-indigo-500/20 backdrop-blur-xl flex items-center justify-center border border-indigo-400/30 shadow-inner group transition-all duration-300">
                                <BarChart3 className="h-8 w-8 text-indigo-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-bold tracking-tight">Survey Results</DialogTitle>
                                <DialogDescription className="sr-only">Detailed analytics and individual responses for this survey.</DialogDescription>
                                <div className="flex items-center gap-4 mt-2">
                                    <p className="text-base text-slate-300 font-medium line-clamp-1 max-w-2xl">{survey?.title}</p>
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
                                        survey?.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                                        survey?.status === 'CLOSED' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-slate-500/20 text-slate-400'
                                    }`}>
                                        {survey?.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-10 px-5 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-all gap-2">
                                        <Download className="h-4 w-4" />
                                        Export Data
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl border-slate-200 w-48 p-1.5 shadow-xl">
                                    <DropdownMenuItem onClick={() => handleExport('csv')} className="rounded-lg gap-2 cursor-pointer font-medium py-2.5">
                                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                        Download CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('json')} className="rounded-lg gap-2 cursor-pointer font-medium py-2.5">
                                        <FileJson className="h-4 w-4 text-indigo-600" />
                                        Download JSON
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <button 
                                onClick={onClose}
                                className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-10 border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`pb-5 text-[11px] font-bold tracking-[0.2em] uppercase transition-all relative ${
                                activeTab === 'analytics' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span className="flex items-center gap-2.5">
                                <PieChart className="h-4 w-4" />
                                Analytics Summary
                            </span>
                            {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full shadow-[0_0_15px_rgba(99,102,241,0.6)]" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('responses')}
                            className={`pb-5 text-[11px] font-bold tracking-[0.2em] uppercase transition-all relative ${
                                activeTab === 'responses' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span className="flex items-center gap-2.5">
                                <Users className="h-4 w-4" />
                                Individual Responses
                            </span>
                            {activeTab === 'responses' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full shadow-[0_0_15px_rgba(99,102,241,0.6)]" />}
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/80">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <Loader2 className="h-16 w-16 animate-spin text-indigo-600" strokeWidth={1.5} />
                                <div className="absolute inset-0 blur-2xl bg-indigo-400/20 animate-pulse" />
                            </div>
                            <p className="text-xs font-bold text-slate-400 tracking-[0.3em] uppercase animate-pulse">Analyzing Responses...</p>
                        </div>
                    ) : results ? (
                        <div className="flex-1 overflow-auto custom-scrollbar px-12 py-10 space-y-12">
                            {activeTab === 'analytics' ? (
                                <>
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6 transition-all hover:shadow-md hover:border-emerald-100 group">
                                            <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <CheckCircle2 className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Responses</p>
                                                <p className="text-3xl font-black text-slate-900">{results.total_responses}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6 transition-all hover:shadow-md hover:border-indigo-100 group">
                                            <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <MessageSquare className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Questions</p>
                                                <p className="text-3xl font-black text-slate-900">{results.questions?.length || 0}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6 transition-all hover:shadow-md hover:border-amber-100 group">
                                            <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <TrendingUp className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Completion Rate</p>
                                                <p className="text-3xl font-black text-slate-900">{results.total_responses > 0 ? '100%' : '0%'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Question Analysis */}
                                    <div className="space-y-10 pb-12">
                                        {results.questions?.map((q, idx) => (
                                            <QuestionCard key={q.question_id} stats={q} index={idx + 1} />
                                        ))}
                                        {(!results.questions || results.questions?.length === 0) && (
                                            <div className="py-20 text-center">
                                                <p className="text-slate-400 font-medium italic">No question-level analysis available yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 pb-12">
                                    {exportData?.responses && exportData.responses.length > 0 ? (
                                        exportData.responses.map((resp) => (
                                            <div 
                                                key={resp.response_id} 
                                                className={`bg-white border rounded-[2rem] shadow-sm overflow-hidden transition-all duration-300 ${
                                                    expandedResponseId === resp.response_id 
                                                        ? 'border-indigo-300 ring-4 ring-indigo-500/5' 
                                                        : 'border-slate-200 hover:border-indigo-200'
                                                }`}
                                            >
                                                <button
                                                    onClick={() => setExpandedResponseId(expandedResponseId === resp.response_id ? null : resp.response_id)}
                                                    className="w-full px-8 py-7 flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-6 text-left">
                                                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                            <User className="h-7 w-7" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-bold text-slate-900 leading-tight tracking-tight">
                                                                {survey?.is_anonymous ? `Anonymous Response (${resp.response_id})` : resp.alumni_name}
                                                            </h4>
                                                            <div className="flex items-center gap-4 mt-2">
                                                                {!survey?.is_anonymous && (
                                                                    <>
                                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] bg-slate-100 px-2.5 py-1 rounded-full">
                                                                            ID: {resp.alumni_id || 'N/A'}
                                                                        </span>
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                                                    </>
                                                                )}
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                                    {resp.submitted_at}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                                                        expandedResponseId === resp.response_id ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'
                                                    }`}>
                                                        {expandedResponseId === resp.response_id ? (
                                                            <ChevronUp className="h-5 w-5" />
                                                        ) : (
                                                            <ChevronDown className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                </button>
                                                
                                                {expandedResponseId === resp.response_id && (
                                                    <div className="px-10 pb-10 pt-0 animate-in fade-in slide-in-from-top-4 duration-500">
                                                        <div className="h-px bg-slate-100 mb-10" />
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                                            {resp.answers.map((ans, idx) => (
                                                                <div key={idx} className="space-y-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm shadow-indigo-100">
                                                                            {idx + 1}
                                                                        </span>
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{ans.question_text}</p>
                                                                    </div>
                                                                    <div className="pl-9">
                                                                        <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                                                                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                                                                {(() => {
                                                                                    if (ans.answer_text) return ans.answer_text;
                                                                                    if (ans.answer_choice) return ans.answer_choice;
                                                                                    if (ans.answer_choices) {
                                                                                        try {
                                                                                            const parsed = typeof ans.answer_choices === 'string' 
                                                                                                ? JSON.parse(ans.answer_choices) 
                                                                                                : ans.answer_choices;
                                                                                            return Array.isArray(parsed) ? parsed.join(', ') : String(parsed);
                                                                                        } catch { return String(ans.answer_choices); }
                                                                                    }
                                                                                    if (ans.answer_scale !== undefined && ans.answer_scale !== null) return `Scale Score: ${ans.answer_scale}`;
                                                                                    if (ans.answer_number !== undefined && ans.answer_number !== null) return String(ans.answer_number);
                                                                                    if (ans.answer_bool !== undefined && ans.answer_bool !== null) return ans.answer_bool ? 'Yes' : 'No';
                                                                                    if (ans.answer_date) return ans.answer_date;
                                                                                    return <span className="text-slate-400 italic font-medium">No answer provided</span>;
                                                                                })()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-32 text-center flex flex-col items-center col-span-full">
                                            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-8 shadow-inner">
                                                <Users className="h-12 w-12 text-slate-300" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">No Responses Found</h3>
                                            <p className="text-slate-500 mt-3 max-w-sm text-lg">
                                                No individual responses have been submitted for this survey yet.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                                <BarChart3 className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Analysis Unavailable</h3>
                            <p className="text-slate-500 mt-2 max-w-sm">
                                We couldn't retrieve the analysis for this survey. It might be due to a lack of responses.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function QuestionCard({ stats, index }: { stats: QuestionStats, index: number }) {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-indigo-100 group">
            <div className="px-10 py-8 border-b border-slate-50 flex items-start gap-6 bg-gradient-to-r from-white to-slate-50/30">
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-300">
                    {index}
                </div>
                <div className="pt-1 flex-1">
                    <h4 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">{stats.question_text}</h4>
                    <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] bg-white border border-slate-100 px-3 py-1 rounded-full shadow-sm">
                            {stats.question_type.replace('_', ' ')}
                        </span>
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">
                            {stats.total_responses} Responses Collected
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-10">
                {/* Distribution Chart for Choices/Select/Boolean */}
                {stats.distribution && (
                    <div className="space-y-6">
                        {Object.entries(stats.distribution)
                            .sort(([, a], [, b]) => b - a)
                            .map(([label, count]) => {
                                const percentage = stats.total_responses > 0 ? Math.round((count / stats.total_responses) * 100) : 0;
                                return (
                                    <div key={label} className="space-y-2.5">
                                        <div className="flex items-center justify-between text-sm font-bold">
                                            <span className="text-slate-700 tracking-tight">{label}</span>
                                            <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{count} ({percentage}%)</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                            <div 
                                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.2)]" 
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}

                {/* Statistics for Scale/Number */}
                {stats.average !== undefined && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center group/stat transition-all hover:bg-indigo-50 hover:border-indigo-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Group Average</p>
                            <p className="text-4xl font-black text-indigo-600 group-hover/stat:scale-110 transition-transform">{stats.average.toFixed(1)}</p>
                        </div>
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center group/stat transition-all hover:bg-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Minimum Value</p>
                            <p className="text-4xl font-black text-slate-900 group-hover/stat:scale-110 transition-transform">{stats.min ?? 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center group/stat transition-all hover:bg-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Maximum Value</p>
                            <p className="text-4xl font-black text-slate-900 group-hover/stat:scale-110 transition-transform">{stats.max ?? 'N/A'}</p>
                        </div>
                    </div>
                )}

                {/* Sample Responses for Text */}
                {stats.samples && stats.samples.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px flex-1 bg-slate-100" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <MessageSquare className="h-3 w-3" />
                                Qualitative Feedback
                            </p>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {stats.samples.map((sample, i) => (
                                <div key={i} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex gap-4 transition-all hover:bg-white hover:shadow-md hover:border-indigo-100">
                                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                                        <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                                    </div>
                                    <p className="text-sm text-slate-600 font-bold leading-relaxed italic">"{sample}"</p>
                                </div>
                            ))}
                        </div>
                        {stats.total_responses > stats.samples.length && (
                            <div className="pt-4 text-center">
                                <p className="text-[11px] text-slate-400 font-bold tracking-widest bg-slate-50 inline-block px-4 py-2 rounded-full border border-slate-100">
                                    + {stats.total_responses - stats.samples.length} MORE RESPONSES IN FULL EXPORT
                                </p>
                            </div>
                        )}
                    </div>
                )}
                
                {!stats.distribution && stats.average === undefined && (!stats.samples || stats.samples?.length === 0) && (
                    <div className="py-10 text-center italic text-slate-400 text-base font-medium">
                        Detailed visualization for this question type is being generated.
                    </div>
                )}
            </div>
        </div>
    );
}
