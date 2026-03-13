import { Download, FileText } from "lucide-react";
import { SettingsCard } from "./SettingsUI";

export function DataExport() {
    return (
        <SettingsCard
            title="Data & Export"
            subtitle="Download or export your account data"
            icon={<Download size={18} />}
            iconContainerClass="bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20"
        >
            <div className="flex flex-col sm:flex-row gap-3 py-3">
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 flex-1">
                    <Download size={16} className="text-gray-500" />
                    Download My Data
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 flex-1">
                    <FileText size={16} className="text-gray-500" />
                    Export Profile as PDF
                </button>
            </div>
            <p className="text-xs text-gray-400 pb-3 leading-relaxed">
                Your data will be compiled and available for download. This may take a few moments.
            </p>
        </SettingsCard>
    );
}
