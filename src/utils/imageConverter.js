import { supabase } from "../lib/supabaseClient";

/**
 * Converts any image file (PNG, JPG, JPEG, GIF, SVG, etc.) to an optimized .webp File using HTML5 Canvas.
 * @param {File|Blob} file The input image file
 * @param {Object} options Configuration options
 * @param {number} options.quality WebP quality compression (0.1 to 1.0, default 0.85)
 * @param {number} options.maxWidth Max width limit (default 2560px)
 * @param {number} options.maxHeight Max height limit (default 2560px)
 * @returns {Promise<{file: File, originalSize: number, webpSize: number, compressionRatio: number, width: number, height: number, dataUrl: string}>}
 */
export async function convertToWebP(file, options = {}) {
  const { quality = 0.85, maxWidth = 2560, maxHeight = 2560 } = options;

  if (!file) {
    throw new Error("No image file provided for WebP conversion.");
  }

  // Read image into an Image element
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Downscale while preserving aspect ratio if dimensions exceed max
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Draw to Offscreen Canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) {
          return reject(new Error("Could not initialize 2D canvas context."));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to WebP Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Failed to convert image to WebP format."));
            }

            const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "image";
            const cleanName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
            const webpFile = new File([blob], `${cleanName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            const originalSize = file.size || 0;
            const webpSize = webpFile.size || 0;
            const compressionRatio =
              originalSize > 0 ? Math.round(((originalSize - webpSize) / originalSize) * 100) : 0;

            const dataUrl = canvas.toDataURL("image/webp", quality);

            resolve({
              file: webpFile,
              blob,
              originalSize,
              webpSize,
              compressionRatio,
              width,
              height,
              dataUrl,
            });
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image file for conversion."));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read image file."));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Converts image to WebP and uploads it directly to the Supabase 'store-media' storage bucket.
 * Returns the permanent public CDN URL to store in the database.
 * @param {File|Blob} file Image file to convert and upload
 * @param {string} folder Target folder inside bucket (e.g. 'products', 'hero', 'ads', 'categories')
 * @param {string} bucket Target storage bucket (default 'store-media')
 * @returns {Promise<{url: string, path: string, webpSize: number, originalSize: number, compressionRatio: number}>}
 */
export async function uploadImageToSupabase(file, folder = "products", bucket = "store-media") {
  // 1. Convert to WebP format
  const converted = await convertToWebP(file);

  // 2. Generate unique storage path
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const fileName = `${timestamp}_${randomStr}_${converted.file.name}`;
  const filePath = `${folder}/${fileName}`;

  // 3. Upload to Supabase Storage
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, converted.file, {
      contentType: "image/webp",
      cacheControl: "31536000", // 1 year caching
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase Storage Upload Error: ${error.message}`);
  }

  // 4. Retrieve permanent public CDN URL
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  const cleanUrl = publicUrlData.publicUrl;

  return {
    url: cleanUrl,
    path: filePath,
    webpSize: converted.webpSize,
    originalSize: converted.originalSize,
    compressionRatio: converted.compressionRatio,
    width: converted.width,
    height: converted.height,
    toString() {
      return cleanUrl;
    },
    valueOf() {
      return cleanUrl;
    },
  };
}
