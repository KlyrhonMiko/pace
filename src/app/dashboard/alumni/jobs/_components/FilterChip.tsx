interface FilterChipProps {
    label: string;
    value: string;
    onRemove: () => void;
}

export default function FilterChip({ label, value, onRemove }: FilterChipProps) {
    return (
        <div className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 text-sm transition-all duration-200 hover:shadow-md hover:border-emerald-300">
            <span className="text-slate-600 font-medium">{label}:</span>
            <span className="text-emerald-700 font-semibold">{value}</span>
            <button
                onClick={onRemove}
                className="ml-1 p-0.5 rounded-full hover:bg-emerald-200 transition-colors"
                aria-label={`Remove ${label} filter`}
            >
                <svg
                    className="h-3.5 w-3.5 text-emerald-800 hover:text-emerald-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
