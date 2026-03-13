import { Calendar, Users, EyeOff, FileText, CheckCircle2, Clock, Archive } from "lucide-react";
import { Survey } from "../../_lib/surveys";

interface SurveyCardProps {
    survey: Survey;
    onEdit: () => void;
    onDelete: () => void;
}

export default function SurveyCard({ survey, onEdit, onDelete }: SurveyCardProps) {

    // Status color mapping
    const getStatusStyle = () => {
        switch (survey.status) {
            case 'ACTIVE':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'DRAFT':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'CLOSED':
                return 'bg-slate-100 text-slate-700 border-slate-300';
            case 'ARCHIVED':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = () => {
        switch (survey.status) {
            case 'ACTIVE':
                return <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />;
            case 'DRAFT':
                return <FileText className="h-3.5 w-3.5" strokeWidth={2.5} />;
            case 'CLOSED':
                return <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />;
            case 'ARCHIVED':
                return <Archive className="h-3.5 w-3.5" strokeWidth={2.5} />;
            default:
                return null;
        }
    };

    return (
        <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-200 flex flex-col h-full">
            {/* Status Badge */}
            <div className="flex items-start justify-between mb-4">
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${getStatusStyle()} shadow-sm`}>
                    {getStatusIcon()}
                    {survey.status}
                </div>

                {/* Anonymous Badge */}
                {survey.is_anonymous && (
                    <div className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100" title="Anonymous Responses">
                        <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                        Anon
                    </div>
                )}
            </div>

            {/* Title & Description */}
            <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2">
                    {survey.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-5">
                    {survey.description}
                </p>
            </div>

            {/* Details Footer */}
            <div className="space-y-4 pt-4 border-t border-slate-100 mt-auto">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">Opens</span>
                            <span className="font-semibold">{survey.opens_at ? survey.opens_at.split(/[T ]/)[0] : '—'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <Users className="h-4 w-4 text-slate-400 shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">Responses</span>
                            <span className="font-semibold text-emerald-700">{survey.question_count ?? 0}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <button
                        onClick={onEdit}
                        className="flex-1 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-100"
                    >
                        Edit
                    </button>
                    <button
                        onClick={onDelete}
                        className="flex-1 py-2 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-100"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
