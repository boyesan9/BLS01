/**
 * Image compressor utility for reducing mobile camera/upload photos
 * Prevents QuotaExceededError in browser storage while keeping visual sharpness and watermarks crisp.
 */

export async function compressImage(
  dataUrlOrFile: string | File,
  maxWidth = 1080,
  maxHeight = 1080,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    let src = '';
    if (typeof dataUrlOrFile === 'string') {
      src = dataUrlOrFile;
    } else {
      src = URL.createObjectURL(dataUrlOrFile);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (typeof dataUrlOrFile !== 'string') {
        URL.revokeObjectURL(src);
      }

      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : src);
        return;
      }

      // Fill white background for transparent PNGs converted to JPEG
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // High quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as compressed JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = (err) => {
      if (typeof dataUrlOrFile !== 'string') {
        URL.revokeObjectURL(src);
      }
      reject(err);
    };

    img.src = src;
  });
}
