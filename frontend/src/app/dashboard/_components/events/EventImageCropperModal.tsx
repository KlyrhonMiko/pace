import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Crop, Loader2 } from 'lucide-react';
import getCroppedImg from '@/lib/cropImage';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface EventImageCropperModalProps {
    isOpen: boolean;
    imageSrc: string;
    onClose: () => void;
    onCropComplete: (file: File) => void;
}

export function EventImageCropperModal({
    isOpen,
    imageSrc,
    onClose,
    onCropComplete,
}: EventImageCropperModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [mediaAspect, setMediaAspect] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(672);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, [isOpen]);

    const onMediaLoaded = useCallback((mediaSize: any) => {
        setMediaAspect(mediaSize.width / mediaSize.height);
    }, []);

    const handleCropChange = (newCrop: { x: number, y: number }) => {
        let finalX = newCrop.x;
        let finalY = newCrop.y;

        if (zoom < 1) {
            const cropBoxAspect = 350 / 200;
            // The max height of the container is 400px, so max crop box width is 400 * 1.75 = 700
            const actualCropBoxWidth = Math.min(containerWidth, 400 * cropBoxAspect);
            
            // Calculate exactly how far the image extends beyond the crop box at this zoom level
            const maxX = (actualCropBoxWidth / 2) * Math.max(0, (zoom * mediaAspect / cropBoxAspect) - 1);
            const maxY = (actualCropBoxWidth / 2) * Math.max(0, (zoom / mediaAspect) - (1 / cropBoxAspect));
            
            // Clamp the coordinates EXACTLY, no buffer
            finalX = Math.max(-maxX, Math.min(maxX, newCrop.x));
            finalY = Math.max(-maxY, Math.min(maxY, newCrop.y));
        }
        
        setCrop({ x: finalX, y: finalY });
    };

    const handleCropComplete = useCallback(
        (_croppedArea: any, croppedAreaPixels: any) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        try {
            setIsCropping(true);
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
            if (croppedImage) {
                const eventImageFile = new File([croppedImage], 'event_banner.png', { type: 'image/png' });
                onCropComplete(eventImageFile);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsCropping(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0 bg-white border-none rounded-2xl shadow-2xl">
                <DialogHeader className="p-4 border-b border-neutral-100 flex-row items-center gap-2 space-y-0">
                    <Crop className="w-5 h-5 text-emerald-600" />
                    <div>
                        <DialogTitle className="text-lg font-semibold text-neutral-800 m-0">
                            Crop Event Banner
                        </DialogTitle>
                        <DialogDescription className="sr-only">Adjust and crop your event image to fit the banner dimensions.</DialogDescription>
                    </div>
                </DialogHeader>

                <div ref={containerRef} className="relative w-full h-[400px] bg-white overflow-hidden">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={350 / 200}
                        onCropChange={handleCropChange}
                        onCropComplete={handleCropComplete}
                        onZoomChange={setZoom}
                        onMediaLoaded={onMediaLoaded}
                        showGrid={true}
                        minZoom={0.95}
                        restrictPosition={zoom >= 1}
                    />
                </div>

                <div className="p-4 sm:p-5 bg-neutral-50 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-neutral-600 min-w-10">Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={0.95}
                            max={3}
                            step={0.05}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
                            disabled={isCropping}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            disabled={isCropping}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            disabled={isCropping}
                        >
                            {isCropping ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Set Event Banner'
                            )}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
