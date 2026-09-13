export interface OptimizedImageResult {
  fileName: string;
  dataUrl: string;
  base64Payload: string;
  mimeType: string;
  width: number;
  height: number;
  originalBytes: number;
  optimizedBytes: number;
}

/**
 * Optimizes an uploaded artwork photo directly in browser canvas:
 * 1. Resizes down large multi-megapixel camera shots to optimal web dimensions (max 1600px width/height).
 * 2. Compresses using high-efficiency JPEG/WebP with 0.82 quality.
 * 3. Returns base64 payload ready for direct GitHub Contents API commit.
 */
export async function optimizeArtworkImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed reading image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed parsing image format'));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context unavailable'));
        }

        // Use high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to webp if supported, else jpeg
        let mimeType = 'image/jpeg';
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (dataUrl.startsWith('data:image/webp')) {
          mimeType = 'image/webp';
        } else {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const base64Payload = dataUrl.split(',')[1] || '';
        const approxBytes = Math.round((base64Payload.length * 3) / 4);

        // Clean filename (e.g. "sunset at beach.JPG" -> "sunset_at_beach.jpg")
        const ext = mimeType === 'image/webp' ? '.webp' : '.jpeg';
        const cleanBase = file.name
          .toLowerCase()
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-z0-9_-]+/g, '_');
        const fileName = `${cleanBase}_${Date.now()}${ext}`;

        resolve({
          fileName,
          dataUrl,
          base64Payload,
          mimeType,
          width,
          height,
          originalBytes: file.size,
          optimizedBytes: approxBytes,
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
