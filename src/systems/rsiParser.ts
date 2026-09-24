// RSI (Robust Station Image) Parser & Renderer for Goob Station / SS14 assets
// Handles species bodies, hairstyles, facial hair, clothing, doors, walls, furniture, and UI

import { RsiMeta, RsiState } from '../types';
import { getOrCreateGoobRsiBundle } from './goobRsiAssets';

export interface CachedRsi {
  img: HTMLImageElement | HTMLCanvasElement | null;
  meta: RsiMeta | null;
  loaded: boolean;
}

const rsiCache = new Map<string, CachedRsi>();
const pendingRsiLoads = new Map<string, Promise<{ img: HTMLImageElement | HTMLCanvasElement | null; meta: RsiMeta | null }>>();

/**
 * Loads an RSI directory's meta.json and textures.png
 * Falls back immediately to high-fidelity procedural Goob Station RSI bundle if network file isn't present
 */
export async function loadRsi(path: string): Promise<{ img: HTMLImageElement | HTMLCanvasElement | null; meta: RsiMeta | null }> {
  if (rsiCache.has(path)) {
    const entry = rsiCache.get(path)!;
    return { img: entry.img, meta: entry.meta };
  }

  if (pendingRsiLoads.has(path)) {
    return pendingRsiLoads.get(path)!;
  }

  const promise = (async () => {
    let meta: RsiMeta | null = null;
    let img: HTMLImageElement | HTMLCanvasElement | null = null;

    try {
      // 1. Fetch meta.json
      const metaRes = await fetch(`${path}/meta.json`);
      if (metaRes.ok) {
        meta = await metaRes.json();
      }
    } catch {
      // Use procedural bundle
    }

    try {
      // 2. Fetch textures.png
      const realImg = new Image();
      await new Promise<void>((resolve) => {
        realImg.onload = () => {
          img = realImg;
          resolve();
        };
        realImg.onerror = () => {
          resolve();
        };
        realImg.src = `${path}/textures.png`;
      });
    } catch {
      // Use procedural bundle
    }

    // If external files weren't loaded, generate canonical Goob Station RSI
    if (!img || !meta) {
      const generated = getOrCreateGoobRsiBundle(path);
      img = generated.canvas;
      meta = generated.meta;
    }

    const cached: CachedRsi = {
      img,
      meta,
      loaded: true,
    };
    rsiCache.set(path, cached);
    return { img, meta };
  })();

  pendingRsiLoads.set(path, promise);
  return promise;
}

/**
 * Synchronous fetch from cache for render loop
 * Guarantees immediate texture availability via Goob Station RSI generator
 */
export function getCachedRsi(path: string): { img: HTMLImageElement | HTMLCanvasElement | null; meta: RsiMeta | null } {
  const cached = rsiCache.get(path);
  if (cached) return { img: cached.img, meta: cached.meta };

  // Generate on the fly so there is no 1-frame blank glitch
  const generated = getOrCreateGoobRsiBundle(path);
  const entry: CachedRsi = {
    img: generated.canvas,
    meta: generated.meta,
    loaded: true,
  };
  rsiCache.set(path, entry);

  // Still attempt background load in case user put custom textures on disk
  loadRsi(path);

  return { img: entry.img, meta: entry.meta };
}

/**
 * SS14 RSI Direction Mapping:
 * In SS14 RSI: 0 = South, 1 = East, 2 = North, 3 = West
 * In SS13/DMI: 0 = South, 1 = North, 2 = East, 3 = West
 */
export function getRsiDirIndex(dir: number): number {
  const rsiDirMap: Record<number, number> = {
    0: 0, // South -> South
    1: 2, // North -> North (SS14 index 2)
    2: 1, // East -> East (SS14 index 1)
    3: 3, // West -> West (SS14 index 3)
  };
  return rsiDirMap[dir] ?? 0;
}

/**
 * Draws an RSI frame from an RSI sprite sheet using meta.json state index
 */
export function drawRsiFrame(
  ctx: CanvasRenderingContext2D,
  rsiImg: HTMLImageElement | HTMLCanvasElement | null,
  meta: RsiMeta | null,
  stateName: string,
  dir: number,
  x: number,
  y: number,
  targetWidth = 32,
  targetHeight = 32
): boolean {
  if (!rsiImg || !meta || !meta.states || meta.states.length === 0) {
    return false;
  }

  const spriteWidth = meta.size?.x || 32;
  const spriteHeight = meta.size?.y || 32;

  // Find state index and calculate frame offset
  let stateIndex = -1;
  let totalFramesBefore = 0;

  for (let i = 0; i < meta.states.length; i++) {
    const s = meta.states[i] as any;
    const nameMatch = s.name === stateName || s.state === stateName;
    if (nameMatch) {
      stateIndex = i;
      break;
    }
    const dirs = s.directions || 1;
    totalFramesBefore += dirs;
  }

  // Fallback to first state if exact state name not found
  if (stateIndex === -1) {
    stateIndex = 0;
    totalFramesBefore = 0;
  }

  const state = meta.states[stateIndex] as any;
  const directions = state.directions || 1;
  const dirOffset = directions === 4 ? getRsiDirIndex(dir) : 0;
  const frameIndex = totalFramesBefore + dirOffset;

  const cols = Math.max(1, Math.floor(rsiImg.width / spriteWidth));
  const srcX = (frameIndex % cols) * spriteWidth;
  const srcY = Math.floor(frameIndex / cols) * spriteHeight;

  if (srcY + spriteHeight <= rsiImg.height && srcX + spriteWidth <= rsiImg.width) {
    ctx.drawImage(rsiImg, srcX, srcY, spriteWidth, spriteHeight, x, y, targetWidth, targetHeight);
    return true;
  }

  return false;
}

/**
 * High level helper to draw any Goob Station RSI asset in a single call
 */
export function drawGoobRsiSprite(
  ctx: CanvasRenderingContext2D,
  rsiPath: string,
  stateName: string,
  dir: number,
  x: number,
  y: number,
  options?: { targetWidth?: number; targetHeight?: number; alpha?: number }
): boolean {
  const { img, meta } = getCachedRsi(rsiPath);
  if (options?.alpha !== undefined) {
    ctx.save();
    ctx.globalAlpha = options.alpha;
  }

  const drawn = drawRsiFrame(
    ctx,
    img,
    meta,
    stateName,
    dir,
    x,
    y,
    options?.targetWidth ?? 32,
    options?.targetHeight ?? 32
  );

  if (options?.alpha !== undefined) {
    ctx.restore();
  }
  return drawn;
}

