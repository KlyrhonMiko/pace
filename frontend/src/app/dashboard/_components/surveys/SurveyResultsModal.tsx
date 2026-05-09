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
    CalendarDays,
    Quote
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                showCloseButton={true}
                className="sm:max-w-5xl p-0 gap-0 rounded-2xl border-0 overflow-hidden shadow-2xl h-[90vh] flex flex-col bg-slate-50"
            >
                {/* Header */}
                <DialogHeader className="p-6 md:px-8 pt-8 pb-0 bg-white border-b border-slate-100 z-10">
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold text-slate-900">
                                    Survey Results
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-500 mt-1.5 flex items-center gap-2.5">
                                    <span className="font-medium text-slate-700 line-clamp-1">{survey?.title}</span>
                                    <span className="h-1 w-1 rounded-full bg-slate-300 shrink-0" />
                                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider shrink-0 ${
                                        survey?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        survey?.status === 'CLOSED' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                        'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                        {survey?.status}
                                    </span>
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="mr-8">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors gap-2 text-sm font-medium shadow-sm">
                                        <Download className="h-4 w-4" />
                                        Export Data
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-100 p-1">
                                    <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2.5 cursor-pointer py-2 px-3 rounded-lg focus:bg-slate-50 focus:text-emerald-700 font-medium">
                                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                        Download CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('json')} className="gap-2.5 cursor-pointer py-2 px-3 rounded-lg focus:bg-slate-50 focus:text-indigo-700 font-medium">
                                        <FileJson className="h-4 w-4 text-indigo-600" />
                                        Download JSON
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-8">
                        <button
                            type="button"
                            onClick={() => setActiveTab('analytics')}
                            className={`flex items-center gap-2.5 pb-4 border-b-2 text-sm font-medium transition-colors ${activeTab === 'analytics'
                                ? 'border-emerald-500 text-emerald-700'
                                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                }`}
                        >
                            <PieChart className="w-4 h-4" />
                            Analytics Summary
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('responses')}
                            className={`flex items-center gap-2.5 pb-4 border-b-2 text-sm font-medium transition-colors ${activeTab === 'responses'
                                ? 'border-emerald-500 text-emerald-700'
                                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Individual Responses
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto custom-scrollbar relative">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-50 z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                            <p className="text-sm text-slate-500 font-medium">Loading insights...</p>
                        </div>
                    ) : results ? (
                        <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto w-full">
                            {activeTab === 'analytics' ? (
                                <>
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
                                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 transition-shadow hover:shadow-md">
                                            <div className="flex items-center gap-2.5 text-slate-500">
                                                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                                    <Users className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-medium">Total Responses</span>
                                            </div>
                                            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{results.total_responses}</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 transition-shadow hover:shadow-md">
                                            <div className="flex items-center gap-2.5 text-slate-500">
                                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                                    <MessageSquare className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-medium">Questions</span>
                                            </div>
                                            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{results.questions?.length || 0}</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 transition-shadow hover:shadow-md">
                                            <div className="flex items-center gap-2.5 text-slate-500">
                                                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-medium">Completion</span>
                                            </div>
                                            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{results.total_responses > 0 ? '100%' : '0%'}</p>
                                        </div>
                                    </div>

                                    {/* Question Analysis */}
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                            Question Breakdown
                                        </h3>
                                        <div className="space-y-6">
                                            {results.questions?.map((q, idx) => (
                                                <QuestionCard key={q.question_id} stats={q} index={idx + 1} />
                                            ))}
                                        </div>
                                        {(!results.questions || results.questions?.length === 0) && (
                                            <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-slate-500 font-medium">No question-level analysis available yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    {exportData?.responses && exportData.responses.length > 0 ? (
                                        exportData.responses.map((resp) => (
                                            <div 
                                                key={resp.response_id} 
                                                className={`bg-white rounded-2xl shadow-sm transition-all duration-200 border ${
                                                    expandedResponseId === resp.response_id 
                                                        ? 'border-emerald-200 ring-4 ring-emerald-500/5' 
                                                        : 'border-slate-100 hover:border-slate-300'
                                                }`}
                                            >
                                                <button
                                                    onClick={() => setExpandedResponseId(expandedResponseId === resp.response_id ? null : resp.response_id)}
                                                    className="w-full px-6 py-5 flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors ${
                                                            expandedResponseId === resp.response_id ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500 group-hover:bg-slate-100'
                                                        }`}>
                                                            <User className="h-5 w-5" />
                                                        </div>
                                                        <div className="text-left">
                                                            <h4 className="text-base font-semibold text-slate-900">
                                                                {survey?.is_anonymous ? `Anonymous Respondent` : resp.alumni_name}
                                                            </h4>
                                                            <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-500 font-medium">
                                                                {!survey?.is_anonymous && (
                                                                    <>
                                                                        <span>ID: {resp.alumni_id || 'N/A'}</span>
                                                                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                                    </>
                                                                )}
                                                                <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{resp.submitted_at}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                                                        expandedResponseId === resp.response_id ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                                                    }`}>
                                                        {expandedResponseId === resp.response_id ? (
                                                            <ChevronUp className="h-5 w-5" />
                                                        ) : (
                                                            <ChevronDown className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                </button>
                                                
                                                {expandedResponseId === resp.response_id && (
                                                    <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="h-px bg-slate-100 mb-6" />
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                                                            {resp.answers.map((ans, idx) => (
                                                                <div key={idx} className="space-y-3">
                                                                    <p className="text-sm font-medium text-slate-600 flex gap-2">
                                                                        <span className="text-slate-400 font-semibold">{idx + 1}.</span> 
                                                                        <span className="line-clamp-2 leading-relaxed">{ans.question_text}</span>
                                                                    </p>
                                                                    <div className="text-sm text-slate-900 bg-slate-50 rounded-xl p-4 border border-slate-100 ml-5 font-medium">
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
                                                                            if (ans.answer_scale !== undefined && ans.answer_scale !== null) return <span className="font-bold text-emerald-600 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Score: {ans.answer_scale}</span>;
                                                                            if (ans.answer_number !== undefined && ans.answer_number !== null) return String(ans.answer_number);
                                                                            if (ans.answer_bool !== undefined && ans.answer_bool !== null) return ans.answer_bool ? 'Yes' : 'No';
                                                                            if (ans.answer_date) return ans.answer_date;
                                                                            return <span className="text-slate-400 italic font-normal">No answer provided</span>;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                                            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-5">
                                                <Users className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900">No Responses Found</h3>
                                            <p className="text-slate-500 mt-2 text-sm font-medium">
                                                No individual responses have been submitted for this survey yet.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-5">
                                <BarChart3 className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Analysis Unavailable</h3>
                            <p className="text-slate-500 mt-2 max-w-sm text-sm">
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 md:gap-5">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center font-semibold text-base shadow-sm">
                    {index}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="pt-1.5">
                        <h4 className="text-lg font-semibold text-slate-900 leading-snug">{stats.question_text}</h4>
                        <div className="flex items-center gap-3 mt-3 text-sm text-slate-500 font-medium">
                            <span className="capitalize bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                {stats.question_type.replace('_', ' ').toLowerCase()}
                            </span>
                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-emerald-600">
                                {stats.total_responses} Responses
                            </span>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="mt-8">
                        {/* Distribution Chart for Choices/Select/Boolean */}
                        {stats.distribution && (
                            <div className="space-y-4">
                                {Object.entries(stats.distribution)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([label, count]) => {
                                        const percentage = stats.total_responses > 0 ? Math.round((count / stats.total_responses) * 100) : 0;
                                        return (
                                            <div key={label} className="relative group/bar">
                                                <div className="flex items-center justify-between text-sm mb-2">
                                                    <span className="font-medium text-slate-700">{label}</span>
                                                    <span className="text-slate-500 font-medium">{count} <span className="text-slate-400">({percentage}%)</span></span>
                                                </div>
                                                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                    <div 
                                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out group-hover/bar:bg-emerald-400" 
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
                            <div className="flex gap-8 py-3 bg-slate-50 rounded-xl px-6 border border-slate-100 w-fit">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Average</span>
                                    <span className="text-3xl font-bold text-emerald-600">{stats.average.toFixed(1)}</span>
                                </div>
                                <div className="w-px bg-slate-200" />
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Min</span>
                                    <span className="text-3xl font-bold text-slate-700">{stats.min ?? 'N/A'}</span>
                                </div>
                                <div className="w-px bg-slate-200" />
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Max</span>
                                    <span className="text-3xl font-bold text-slate-700">{stats.max ?? 'N/A'}</span>
                                </div>
                            </div>
                        )}

                        {/* Sample Responses for Text */}
                        {stats.samples && stats.samples.length > 0 && (
                            <div className="space-y-4 mt-2">
                                <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                                    Recent Responses
                                </p>
                                <div className="grid gap-3">
                                    {stats.samples.map((sample, i) => (
                                        <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-sm text-slate-700 flex gap-3.5 items-start transition-colors hover:border-emerald-100 hover:bg-emerald-50/30">
                                            <Quote className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                            <span className="leading-relaxed font-medium italic">"{sample}"</span>
                                        </div>
                                    ))}
                                </div>
                                {stats.total_responses > stats.samples.length && (
                                    <p className="text-sm text-slate-400 pt-2 font-medium flex items-center justify-center bg-slate-50 py-2 rounded-lg border border-slate-100">
                                        + {stats.total_responses - stats.samples.length} more responses in full export
                                    </p>
                                )}
                            </div>
                        )}
                        
                        {!stats.distribution && stats.average === undefined && (!stats.samples || stats.samples?.length === 0) && (
                            <div className="py-6 text-slate-400 text-sm font-medium bg-slate-50 rounded-xl text-center border border-slate-100 mt-4">
                                No detailed data available for this question.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

