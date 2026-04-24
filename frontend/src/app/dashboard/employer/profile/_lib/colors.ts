/**
 * Extracts a dominant color from an image URL or DataURL using Canvas.
 * Generates a gradient palette based on the dominant color.
 */
export async function getLogoColors(imageUrl: string): Promise<{
    primary: string;
    secondary: string;
    accent: string;
} | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                resolve(null);
                return;
            }

            // Downscale for performance
            const size = 100;
            canvas.width = size;
            canvas.height = size;
            ctx.drawImage(img, 0, 0, size, size);

            try {
                const imageData = ctx.getImageData(0, 0, size, size).data;
                let r = 0, g = 0, b = 0, count = 0;

                const validPixels: { r: number, g: number, b: number }[] = [];

                // Simple average with skip for speed
                for (let i = 0; i < imageData.length; i += 8) { // sampled more for accuracy
                    const pr = imageData[i];
                    const pg = imageData[i + 1];
                    const pb = imageData[i + 2];
                    const alpha = imageData[i + 3];

                    if (alpha < 150) continue; // Skip semi-transparent

                    // Calculate brightness (0-255)
                    const brightness = (0.299 * pr + 0.587 * pg + 0.114 * pb);

                    // Ignore very light (near white) and very dark (near black)
                    if (brightness > 225 || brightness < 30) continue;

                    validPixels.push({ r: pr, g: pg, b: pb });
                }

                if (validPixels.length === 0) {
                    // If no "vibrant" pixels found, try to just average everything non-white
                    for (let i = 0; i < imageData.length; i += 8) {
                        const pr = imageData[i];
                        const pg = imageData[i + 1];
                        const pb = imageData[i + 2];
                        const alpha = imageData[i + 3];
                        if (alpha > 150 && (pr < 250 || pg < 250 || pb < 250)) {
                            r += pr; g += pg; b += pb; count++;
                        }
                    }
                    if (count === 0) {
                        resolve(null);
                        return;
                    }
                    r = Math.floor(r / count);
                    g = Math.floor(g / count);
                    b = Math.floor(b / count);
                } else {
                    let sumR = 0, sumG = 0, sumB = 0;
                    for (const p of validPixels) {
                        sumR += p.r;
                        sumG += p.g;
                        sumB += p.b;
                    }
                    r = Math.floor(sumR / validPixels.length);
                    g = Math.floor(sumG / validPixels.length);
                    b = Math.floor(sumB / validPixels.length);
                }

                // Helper to adjust brightness
                const adjust = (c: number, amount: number) => Math.min(255, Math.max(0, c + amount));

                // Ensure the color isn't TOO dark for the white text
                const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
                if (brightness < 60) {
                    r = adjust(r, 40);
                    g = adjust(g, 40);
                    b = adjust(b, 40);
                }

                // Color derived from logo
                const primary = `rgb(${r}, ${g}, ${b})`;
                // Darker version for gradient base
                const secondary = `rgb(${Math.floor(r * 0.6)}, ${Math.floor(g * 0.6)}, ${Math.floor(b * 0.6)})`;
                // More vibrant accent
                const accent = `rgb(${adjust(r, 30)}, ${adjust(g, 30)}, ${adjust(b, 30)})`;

                resolve({ primary, secondary, accent });
            } catch (e) {
                console.error("Failed to get image data", e);
                resolve(null);
            }
        };

        img.onerror = () => {
            console.warn("Failed to load image for color extraction");
            resolve(null);
        };
    });
}
