import { useState } from "react";
import {
    Plus,
    Search,
    HelpCircle,
    ClipboardCheck,
    Eye,
    Edit2,
    Trash2,
    Globe,
    Lock,
    Archive,
    Calendar,
    ChevronRight,
    ClipboardList,
    Clock,
    User,
    Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Survey, SURVEY_STATUSES } from "../../_lib/surveys";
import SurveyFilters from "./SurveyFilters";
import ActionsCard from "../ActionsCard";

interface SurveysViewProps {
    surveys: Survey[];
    onCreateSurvey: () => void;
    onCreateTracerStudy: () => void;
    onEditSurvey: (survey: Survey) => void;
    onDeleteSurvey: (id: string) => void;
    onPublishSurvey: (id: string) => void;
    onCloseSurvey: (id: string) => void;
    onArchiveSurvey: (id: string) => void;
    onReopenSurvey: (id: string) => void;
    onViewResults: (survey: Survey) => void;
}

// ─── Status Badge Helper ───────────────────────────────────────────────────────
function SurveyStatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; dot: string }> = {
        'DRAFT': { bg: "bg-slate-50 text-slate-600 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
        'ACTIVE': { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
        'CLOSED': { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
        'ARCHIVED': { bg: "bg-rose-50 text-rose-700 border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
    };
    const c = config[status] || config['DRAFT'];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${c.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
            {status}
        </span>
    );
}

export default function SurveysView({
    surveys = [],
    onCreateSurvey,
    onCreateTracerStudy,
    onEditSurvey,
    onDeleteSurvey,
    onPublishSurvey,
    onCloseSurvey,
    onArchiveSurvey,
    onReopenSurvey,
    onViewResults,
}: SurveysViewProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [showAnonymousOnly, setShowAnonymousOnly] = useState(false);

    // Calculate status counts
    const statusCounts = SURVEY_STATUSES.reduce((acc, status) => {
        acc[status] = surveys.filter(s => s.status === status).length;
        return acc;
    }, {} as Record<string, number>);

    const filteredSurveys = surveys.filter(s => {
        const matchesSearch =
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = selectedStatus ? s.status === selectedStatus : true;
        const matchesAnon = showAnonymousOnly ? s.is_anonymous === true : true;

        return matchesSearch && matchesStatus && matchesAnon;
    });

    const handleClearFilters = () => {
        setSelectedStatus(null);
        setShowAnonymousOnly(false);
        setSearchQuery("");
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col-reverse lg:flex-row-reverse gap-8 items-start">
                {/* Sidebar Filters */}
                <div className="w-full lg:w-80 flex-shrink-0">
                    <div className="flex flex-col gap-4 sticky top-24">
                        <ActionsCard
                            title="Survey Actions"
                            description="Create surveys"
                            icon={<Plus className="h-5 w-5" />}
                            actions={[
                                {
                                    label: "Create Survey",
                                    onClick: onCreateSurvey,
                                    icon: <Plus className="h-4 w-4 stroke-2" />,
                                    variant: "primary"
                                },
                                {
                                    label: "Tracer Study",
                                    onClick: onCreateTracerStudy,
                                    icon: <ClipboardCheck className="h-4 w-4 stroke-2" />,
                                    variant: "secondary"
                                }
                            ]}
                        />
                        <SurveyFilters
                            statusCounts={statusCounts}
                            selectedStatus={selectedStatus}
                            setSelectedStatus={setSelectedStatus}
                            showAnonymousOnly={showAnonymousOnly}
                            setShowAnonymousOnly={setShowAnonymousOnly}
                            onClearFilters={handleClearFilters}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                        />
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 min-w-0">
                    <div className="group/card rounded-2xl bg-white border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 flex flex-col shadow-sm">
                        {/* Header Area */}
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                                    <ClipboardList className="h-5 w-5" strokeWidth={2} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">
                                        Surveys Masterlist
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Manage and track surveys ({filteredSurveys.length})
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Table Content */}
                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50/30 border-b border-slate-100">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Survey Details</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/80">
                                    {filteredSurveys.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-32 text-center bg-slate-50/20">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center">
                                                        <HelpCircle className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">No surveys found</p>
                                                        <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSurveys.map((survey) => (
                                            <tr key={survey.survey_id} className="group transition-all duration-200 hover:bg-slate-50/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                            <ClipboardList className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0 max-w-[300px]">
                                                            <h4 className="font-bold text-slate-900 text-sm truncate">
                                                                {survey.title}
                                                            </h4>
                                                            <p className="text-xs text-slate-500 mt-0.5 truncate italic">
                                                                {survey.description || "No description provided"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <SurveyStatusBadge status={survey.status} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {survey.is_anonymous ? (
                                                            <>
                                                                <Lock className="h-3.5 w-3.5 text-slate-400" />
                                                                <span className="text-[13px] font-medium text-slate-600 italic">Anonymous</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <User className="h-3.5 w-3.5 text-slate-400" />
                                                                <span className="text-[13px] font-medium text-slate-600">Standard</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => onViewResults(survey)}
                                                            className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="View Results"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {survey.status === 'DRAFT' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => onPublishSurvey(survey.survey_id)}
                                                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Publish"
                                                            >
                                                                <Globe className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {(survey.status === 'ACTIVE' || survey.status === 'CLOSED' || survey.status === 'ARCHIVED') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const link = `${window.location.origin}/surveys/${survey.survey_id}`;
                                                                    navigator.clipboard.writeText(link);
                                                                    toast.success("Survey link copied to clipboard");
                                                                }}
                                                                className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                title="Copy Link"
                                                            >
                                                                <LinkIcon className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => onEditSurvey(survey)}
                                                            className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => onDeleteSurvey(survey.survey_id)}
                                                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
