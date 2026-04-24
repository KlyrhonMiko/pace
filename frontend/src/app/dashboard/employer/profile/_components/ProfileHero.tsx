import { User, Globe, Camera, Loader2 } from "lucide-react";
import { EmployerProfile, uploadLogo } from "../_lib/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ImageCropperModal } from "./ImageCropperModal";
import { getLogoColors } from "../_lib/colors";

interface ProfileHeroProps {
    profile: EmployerProfile;
    onLogoUploaded?: () => void;
}

export function ProfileHero({ profile, onLogoUploaded }: ProfileHeroProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const [cardColors, setCardColors] = useState<{ primary: string; secondary: string; accent: string } | null>(null);

    useEffect(() => {
        if (profile.company_logo_url) {
            getLogoColors(profile.company_logo_url).then(colors => {
                setCardColors(colors);
            });
        } else {
            setCardColors(null);
        }
    }, [profile.company_logo_url]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const imageDataUrl = URL.createObjectURL(file);
        setSelectedImageSrc(imageDataUrl);
        e.target.value = ''; // Reset input to allow selecting the same file again
    };

    const handleCropComplete = async (croppedFile: File) => {
        setSelectedImageSrc(null); // Close modal
        setIsUploading(true);
        const res = await uploadLogo(croppedFile);
        if (res.success) {
            toast.success(res.message);
            onLogoUploaded?.(); // trigger refetch
        } else {
            toast.error(res.message);
        }
        setIsUploading(false);
    };

    const initials =
        `${profile.contact_person_first_name?.[0] ?? ""}${profile.contact_person_last_name?.[0] ?? ""}`.toUpperCase() || "EP";

    const dynamicBgStyle = cardColors ? {
        background: `linear-gradient(135deg, ${cardColors.secondary} 0%, ${cardColors.primary} 50%, ${cardColors.accent} 100%)`
    } : {};

    return (
        <>
            <div
                className={`relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white transition-all duration-700 ${!cardColors ? 'bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-500' : ''}`}
                style={dynamicBgStyle}
            >
                {/* Decorative mesh */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
                </div>
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: "24px 24px",
                }} />

                <div className="relative flex flex-col md:flex-row items-center gap-6">
                    {/* Avatar */}
                    <div className="relative group">
                        <label htmlFor="logo-upload" className={`flex-shrink-0 w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold ring-4 ring-white/30 shadow-2xl overflow-hidden ${isUploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                            {profile.company_logo_url ? (
                                <img src={profile.company_logo_url} alt="Company Logo" className="w-full h-full object-cover" />
                            ) : (
                                initials
                            )}

                            {/* Hover Overlay */}
                            {!isUploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                            )}

                            {/* Loading Spinner */}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                            )}
                        </label>
                        <input
                            type="file"
                            id="logo-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                        <p className={`text-xs font-medium mb-1 tracking-wider uppercase ${!cardColors ? 'text-emerald-100' : 'opacity-80'}`}>Employer Partner</p>
                        <h2 className="text-3xl font-bold tracking-tight">
                            {profile.company_name}
                        </h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-md">
                                <User className="w-3.5 h-3.5" strokeWidth={2} />
                                {profile.contact_person_first_name} {profile.contact_person_last_name}
                            </span>
                            {profile.company_website && (
                                <a href={profile.company_website.startsWith('http') ? profile.company_website : `https://${profile.company_website}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-md hover:bg-white/25 transition-colors">
                                    <Globe className="w-3.5 h-3.5" strokeWidth={2} />
                                    {profile.company_website.replace(/^https?:\/\/(www\.)?/, '')}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Cropper Modal */}
            {selectedImageSrc && (
                <ImageCropperModal
                    isOpen={!!selectedImageSrc}
                    imageSrc={selectedImageSrc}
                    onClose={() => setSelectedImageSrc(null)}
                    onCropComplete={handleCropComplete}
                />
            )}
        </>
    );
}
