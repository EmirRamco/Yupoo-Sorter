/**
 * Downscale a locally selected image file to a compact JPEG thumbnail encoded
 * as a base64 data URL. Keeping images small and self-contained means the whole
 * collection stays inside one portable JSON file.
 */
export async function fileToThumbnail(
  file: File,
  maxSize = 640,
  quality = 0.82,
): Promise<string> {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (width > maxSize || height > maxSize) {
    const scale = Math.min(maxSize / width, maxSize / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl; // fallback: store original
  ctx.drawImage(img, 0, 0, width, height);

  // PNG for transparency-bearing formats, otherwise JPEG for size.
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  return canvas.toDataURL(type, quality);
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
    img.src = src;
  });
}
