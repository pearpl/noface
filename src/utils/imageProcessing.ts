// EXIF removal and image processing utilities

export const removeExifData = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Create canvas to remove EXIF data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Potentially downscale very large images to mitigate mobile memory pressure
        const maxDimDesktop = 3200; // keep generous on desktop
        const maxDimMobile = 2200;  // tighter on mobile to avoid reloads
        const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
        const maxDim = isIOS ? maxDimMobile : maxDimDesktop;
        const largest = Math.max(img.naturalWidth, img.naturalHeight);
        let targetW = img.naturalWidth;
        let targetH = img.naturalHeight;
        let scale = 1;
        if (largest > maxDim) {
          scale = maxDim / largest;
          targetW = Math.round(img.naturalWidth * scale);
          targetH = Math.round(img.naturalHeight * scale);
        }
        canvas.width = targetW;
        canvas.height = targetH;
        
        // Draw image to canvas (this strips EXIF data)
  ctx.drawImage(img, 0, 0, targetW, targetH);
        
        // Convert back to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          0.92 // High quality
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const applyBlurToRegion = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  intensity: number
): void => {
  // Adaptive blur: scale radius with region size & overall image resolution
  const baseDim = Math.max(canvas.width, canvas.height);
  const regionDim = Math.max(width, height);
  // scaleFactor ~1 for small images, increases for very large (>2000px)
  const globalScale = baseDim / 1200; // 1200 baseline
  const localScale = regionDim / 150; // 150px face baseline
  const adaptiveMultiplier = Math.max(1, Math.min(4, (globalScale + localScale) / 2));
  const radius = Math.max(4, intensity * 3 * adaptiveMultiplier);

  const tmp = document.createElement('canvas');
  tmp.width = width;
  tmp.height = height;
  const tctx = tmp.getContext('2d');
  if (!tctx) return;
  tctx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
  tctx.filter = `blur(${radius.toFixed(1)}px)`;
  // Multiple passes mild improvement (optional); keep single for performance
  tctx.drawImage(tmp, 0, 0);
  ctx.drawImage(tmp, x, y);
};

export const applyPixelationToRegion = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  intensity: number
): void => {
  // Adaptive pixel size; scale up on large faces / high-res images
  const baseDim = Math.max(canvas.width, canvas.height);
  const regionDim = Math.max(width, height);
  const globalScale = baseDim / 1200;
  const localScale = regionDim / 150;
  const adaptiveMultiplier = Math.max(1, Math.min(6, (globalScale + localScale) / 2));
  const pixelSize = Math.max(4, Math.round(intensity * 3 * adaptiveMultiplier));
  
  for (let px = x; px < x + width; px += pixelSize) {
    for (let py = y; py < y + height; py += pixelSize) {
      // Get the color of the top-left pixel of this block
  const imageData = ctx.getImageData(px, py, 1, 1); // reading single pixel sufficient
      const color = `rgb(${imageData.data[0]}, ${imageData.data[1]}, ${imageData.data[2]})`;
      
      // Fill the entire block with this color
      ctx.fillStyle = color;
      ctx.fillRect(
        px,
        py,
        Math.min(pixelSize, x + width - px),
        Math.min(pixelSize, y + height - py)
      );
    }
  }
};

export const downloadImage = (canvas: HTMLCanvasElement, filename: string): void => {
  // iOS Safari & some Android browsers have limited support for programmatic downloads
  // Strategy:
  // 1. Try object URL + download attribute.
  // 2. If not supported (iOS), fallback to opening the image in a new tab so user can long‑press/save.
  // 3. Avoid very large data URLs for memory; still use blob -> object URL.
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    // Detect lack of download attribute support
    const supportsDownloadAttr = 'download' in a && !isIOS; // iOS reports attr but blocks
    if (supportsDownloadAttr) {
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke after a tick to allow some browsers to start download
      setTimeout(()=>URL.revokeObjectURL(url), 4000);
    } else {
      // Fallback: open in new tab/window. On iOS this lets user tap share/save.
      const newTab = window.open();
      if (newTab) {
        // Build minimal HTML wrapper so filename hint can be shown in title.
        const blobUrl = url; // keep name separate; cannot force filename but show instructions.
        newTab.document.title = filename;
        newTab.document.body.style.margin = '0';
        newTab.document.body.innerHTML = `<div style="font:14px system-ui;padding:8px;background:#111;color:#fff;">Tap and hold the image to save</div><img src="${blobUrl}" style="width:100%;height:auto;display:block" alt="${filename}" />`;
        // Do not revoke immediately; rely on user closing tab. Optionally revoke later.
      } else {
        // Last resort: navigate current tab
        location.href = url;
      }
    }
  }, 'image/jpeg', 0.9);
};

export const isHEICFile = (file: File): boolean => {
  return file.type === 'image/heic' || file.type === 'image/heif' || 
         file.name.toLowerCase().endsWith('.heic') || 
         file.name.toLowerCase().endsWith('.heif');
};

export const isSupportedImageType = (file: File): boolean => {
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return supportedTypes.includes(file.type);
};