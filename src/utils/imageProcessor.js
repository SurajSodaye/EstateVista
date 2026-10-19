/**
 * EstateVista — Client-Side Profile Image Processor
 * 
 * Resizes, center-crops, and compresses profile photos in the browser
 * into compact, high-quality Base64 Data URLs without requiring Firebase Storage.
 * 
 * Constraints:
 * - Square crop 256x256 px.
 * - Strict conservative payload size limit (max 150 KB, typically 20-35 KB).
 * - Supported formats: JPEG, PNG, WebP.
 * - Hardware-accelerated browser Canvas 2D API.
 */

const MAX_PAYLOAD_BYTES = 150 * 1024; // 150 KB safe limit for Firestore document
const TARGET_DIMENSION = 256; // 256x256 px square avatar

/**
 * Extracts clean 1 or 2 letter initials from a display name
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name = '') {
  if (!name || typeof name !== 'string') return 'AV';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Validates that an image file is of acceptable type and can be decoded
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
export function validateAndLoadImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No image file selected.'));
    }

    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const mime = (file.type || '').toLowerCase();

    if (!validMimes.includes(mime)) {
      return reject(
        new Error('Unsupported file format. Please select a valid JPG, PNG, or WebP image.')
      );
    }

    // Reject initial raw file if it exceeds 10MB to prevent browser memory exhaustion
    if (file.size > 10 * 1024 * 1024) {
      return reject(new Error('The selected image is too large. Please select an image under 10MB.'));
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        return reject(new Error('The image could not be decoded. The file may be corrupt.'));
      }
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image. The file format is invalid or corrupted.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Processes, crops, resizes, and compresses an image into a Base64 data URL
 * 
 * @param {File} file
 * @param {Object} [options]
 * @param {number} [options.dimension=256] Output square size (default 256)
 * @param {number} [options.maxBytes=153600] Max encoded string length in bytes
 * @returns {Promise<{ dataUrl: string, sizeBytes: number, width: number, height: number }>}
 */
export async function processProfileImage(file, options = {}) {
  const dimension = options.dimension || TARGET_DIMENSION;
  const maxBytes = options.maxBytes || MAX_PAYLOAD_BYTES;

  // 1. Verify decoding
  const img = await validateAndLoadImage(file);

  // 2. Setup Canvas
  const canvas = document.createElement('canvas');
  canvas.width = dimension;
  canvas.height = dimension;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D rendering context is not supported in this browser.');
  }

  // 3. Center-square crop calculation
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const minDim = Math.min(srcW, srcH);
  const srcX = (srcW - minDim) / 2;
  const srcY = (srcH - minDim) / 2;

  // Fill background white in case of transparent PNGs
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, dimension, dimension);

  // High quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw center-cropped square
  ctx.drawImage(img, srcX, srcY, minDim, minDim, 0, 0, dimension, dimension);

  // 4. Compress to JPEG with quality adjustment
  let quality = 0.85;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);

  // If size exceeds maxBytes, iteratively lower quality
  if (dataUrl.length > maxBytes && quality > 0.6) {
    quality = 0.72;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUrl.length > maxBytes && quality > 0.5) {
    quality = 0.55;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  // 5. Final size guard
  if (dataUrl.length > maxBytes) {
    throw new Error(
      `The compressed image size (${Math.round(dataUrl.length / 1024)} KB) exceeds the maximum allowed limit of ${Math.round(maxBytes / 1024)} KB. Please select a smaller photo.`
    );
  }

  return {
    dataUrl,
    sizeBytes: dataUrl.length,
    width: dimension,
    height: dimension,
  };
}

// ========================================================
// PROPERTY PHOTOGRAPHY PROCESSING (Direct Firestore Base64)
// ========================================================

export const MAX_PROPERTY_IMAGES = 8;
export const MAX_PROPERTY_IMAGE_BYTES = 75 * 1024; // 75 KB max per compressed property image
export const MAX_GALLERY_BUDGET_BYTES = 400 * 1024; // 400 KB total gallery payload limit for Firestore

/**
 * Calculates total byte footprint of base64 data URLs in a property gallery
 * @param {Array<string>} imageUrls
 * @returns {number}
 */
export function calculateGallerySize(imageUrls = []) {
  if (!Array.isArray(imageUrls)) return 0;
  return imageUrls.reduce((acc, url) => {
    if (typeof url === 'string' && url.startsWith('data:')) {
      return acc + url.length;
    }
    return acc;
  }, 0);
}

/**
 * Resizes and compresses a property photo to standard landscape resolution
 * (max 960 × 640 px), optimizing down to ~35-55 KB per photo.
 * 
 * @param {File} file
 * @param {Object} [options]
 * @returns {Promise<{ dataUrl: string, sizeBytes: number, width: number, height: number, name: string }>}
 */
export async function processPropertyImage(file, options = {}) {
  const maxW = options.maxWidth || 960;
  const maxH = options.maxHeight || 640;
  const maxBytes = options.maxBytes || MAX_PROPERTY_IMAGE_BYTES;

  // 1. Validate MIME and decode
  const img = await validateAndLoadImage(file);

  // 2. Compute proportional aspect ratio
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  let targetW = srcW;
  let targetH = srcH;

  if (targetW > maxW || targetH > maxH) {
    const scale = Math.min(maxW / targetW, maxH / targetH);
    targetW = Math.max(1, Math.round(targetW * scale));
    targetH = Math.max(1, Math.round(targetH * scale));
  }

  // 3. Render on Canvas 2D
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D rendering is not supported in this browser.');
  }

  // Neutral background fill
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetW, targetH);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // 4. Adaptive compression
  let quality = 0.78;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);

  if (dataUrl.length > maxBytes && quality > 0.6) {
    quality = 0.68;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUrl.length > maxBytes && quality > 0.5) {
    quality = 0.55;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  if (dataUrl.length > maxBytes) {
    throw new Error(
      `Property image "${file.name}" compressed to ${Math.round(dataUrl.length / 1024)} KB, exceeding the single-photo limit of ${Math.round(maxBytes / 1024)} KB. Please choose a smaller photo.`
    );
  }

  return {
    dataUrl,
    sizeBytes: dataUrl.length,
    width: targetW,
    height: targetH,
    name: file.name,
  };
}

/**
 * Processes a property image locally in the browser to an optimized Base64 data URL
 * for direct persistence in Cloud Firestore without external storage dependencies.
 * 
 * @param {File} file
 * @param {Object} [options]
 * @returns {Promise<{ url: string, sizeBytes: number, name: string }>}
 */
export async function uploadPropertyImage(file, options = {}) {
  const processed = await processPropertyImage(file, options);
  return {
    url: processed.dataUrl,
    sizeBytes: processed.sizeBytes,
    name: processed.name,
  };
}
