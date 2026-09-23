// DMI (Dream Maker Image) Parser & Renderer for TGStation assets
// Handles walls, floors, airlocks, machinery, and station objects

interface CachedDmi {
  img: HTMLImageElement;
  loaded: boolean;
}

const dmiImageCache = new Map<string, CachedDmi>();
const pendingPromises = new Map<string, Promise<HTMLImageElement | null>>();

/**
 * Loads and caches an image for DMI rendering
 */
export function getCachedDmiImage(path: string): HTMLImageElement | null {
  const cached = dmiImageCache.get(path);
  if (cached && cached.loaded) return cached.img;

  if (!pendingPromises.has(path)) {
    const img = new Image();
    const promise = new Promise<HTMLImageElement | null>((resolve) => {
      img.onload = () => {
        dmiImageCache.set(path, { img, loaded: true });
        resolve(img);
      };
      img.onerror = () => {
        // Try fallback to /icons/ if in /assets/dmi/
        if (path.startsWith('/assets/dmi/')) {
          const fallbackPath = path.replace('/assets/dmi/', '/icons/');
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            dmiImageCache.set(path, { img: fallbackImg, loaded: true });
            resolve(fallbackImg);
          };
          fallbackImg.onerror = () => resolve(null);
          fallbackImg.src = fallbackPath;
        } else {
          resolve(null);
        }
      };
      img.src = path;
    });

    pendingPromises.set(path, promise);
  }

  return null;
}

/**
 * Direction indices for classic BYOND/TGStation DMI:
 * 0 = South, 1 = North, 2 = East, 3 = West
 */
export function getDmiDirIndex(dir: number | string): number {
  if (typeof dir === 'number') return dir % 4;
  switch (dir.toUpperCase()) {
    case 'NORTH':
      return 1;
    case 'EAST':
      return 2;
    case 'WEST':
      return 3;
    case 'SOUTH':
    default:
      return 0;
  }
}

/**
 * Draws a single DMI frame on the target canvas context.
 * Standard SS13 tiles are 32x32.
 */
export function drawDmiFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  iconStateIndex: number,
  dir: number,
  x: number,
  y: number,
  targetWidth = 32,
  targetHeight = 32
): boolean {
  if (!img || !img.complete || img.naturalWidth === 0) {
    return false;
  }

  const frameWidth = 32;
  const frameHeight = 32;
  const frameIndex = iconStateIndex * 4 + getDmiDirIndex(dir);

  const cols = Math.max(1, Math.floor(img.width / frameWidth));
  const srcX = (frameIndex % cols) * frameWidth;
  const srcY = Math.floor(frameIndex / cols) * frameHeight;

  // Verify coordinates within image bounds
  if (srcY + frameHeight <= img.height && srcX + frameWidth <= img.width) {
    ctx.drawImage(img, srcX, srcY, frameWidth, frameHeight, x, y, targetWidth, targetHeight);
    return true;
  }

  // Fallback: draw first 32x32 frame
  ctx.drawImage(img, 0, 0, Math.min(32, img.width), Math.min(32, img.height), x, y, targetWidth, targetHeight);
  return true;
}
