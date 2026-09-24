// DMI (Dream Maker Image) Parser & Engine
// Reverse-engineered from Griefly (https://github.com/griefly/griefly)
// Supports direct PNG zTXt/tEXt chunk decompression, state mapping, and directional sprite rendering

import { Direction } from '../types';

export interface DmiStateInfo {
  state: string;
  dirs: number;
  frames: number;
  delay?: number[];
  movement?: number;
  rewind?: number;
  first_frame_pos: number;
}

export interface DmiMetadata {
  info: {
    width: number;
    height: number;
    version?: number;
  };
  states: DmiStateInfo[];
  stateMap: Map<string, DmiStateInfo>;
}

export interface ParsedDmi {
  name: string;
  image: HTMLImageElement;
  metadata: DmiMetadata;
  ready: boolean;
  sourceUrl?: string;
}

/**
 * Direction indices for classic BYOND/TGStation DMI:
 * 0 = South, 1 = North, 2 = East, 3 = West
 */
export function getDmiDirIndex(dir: Direction | number | string): number {
  if (typeof dir === 'number') return Math.abs(dir) % 4;
  switch (String(dir).toUpperCase()) {
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
 * Parses Dream Maker DMI header/state text (embedded in PNG zTXt chunk).
 * Format:
 * # BEGIN DMI
 * version = 4.0
 *   width = 32
 *   height = 32
 * state = "floor"
 *   dirs = 1
 *   frames = 1
 * ...
 * # END DMI
 */
export function parseDmiText(text: string): DmiMetadata {
  const lines = text.split(/\r?\n/);
  const metadata: DmiMetadata = {
    info: { width: 32, height: 32, version: 4.0 },
    states: [],
    stateMap: new Map(),
  };

  let currentState: DmiStateInfo | null = null;
  let inDmi = false;
  let currentPos = 0;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line === '# BEGIN DMI') {
      inDmi = true;
      continue;
    }
    if (line === '# END DMI') {
      inDmi = false;
      continue;
    }

    if (!inDmi) continue;

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;

    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();

    if (key === 'version') {
      metadata.info.version = parseFloat(val) || 4.0;
    } else if (key === 'width') {
      metadata.info.width = parseInt(val, 10) || 32;
    } else if (key === 'height') {
      metadata.info.height = parseInt(val, 10) || 32;
    } else if (key === 'state') {
      if (currentState) {
        currentState.first_frame_pos = currentPos;
        currentPos += currentState.frames * currentState.dirs;
        metadata.states.push(currentState);
        if (!metadata.stateMap.has(currentState.state)) {
          metadata.stateMap.set(currentState.state, currentState);
        }
      }

      let stateName = val;
      if (stateName.startsWith('"') && stateName.endsWith('"')) {
        stateName = stateName.slice(1, -1);
      }
      currentState = {
        state: stateName,
        dirs: 1,
        frames: 1,
        delay: undefined,
        movement: 0,
        rewind: 0,
        first_frame_pos: 0,
      };
    } else if (currentState) {
      if (key === 'dirs') {
        currentState.dirs = parseInt(val, 10) || 1;
      } else if (key === 'frames') {
        currentState.frames = parseInt(val, 10) || 1;
      } else if (key === 'delay') {
        currentState.delay = val.split(',').map((v) => parseFloat(v.trim()));
      } else if (key === 'movement') {
        currentState.movement = parseInt(val, 10) || 0;
      } else if (key === 'rewind') {
        currentState.rewind = parseInt(val, 10) || 0;
      }
    }
  }

  if (currentState) {
    currentState.first_frame_pos = currentPos;
    currentPos += currentState.frames * currentState.dirs;
    metadata.states.push(currentState);
    if (!metadata.stateMap.has(currentState.state)) {
      metadata.stateMap.set(currentState.state, currentState);
    }
  }

  return metadata;
}

/**
 * Extracts and parses DMI metadata directly from raw PNG bytes.
 * Scans PNG chunks for zTXt or tEXt chunks with keyword "Description".
 */
export async function extractDmiMetadataFromBuffer(
  buffer: ArrayBuffer | Uint8Array
): Promise<DmiMetadata | null> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length < 8 ||
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47
  ) {
    return null;
  }

  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const chunkLength = dataView.getUint32(offset);
    const chunkType = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );

    if (chunkType === 'zTXt') {
      const chunkData = bytes.subarray(offset + 8, offset + 8 + chunkLength);
      let nullIdx = -1;
      for (let i = 0; i < chunkData.length; i++) {
        if (chunkData[i] === 0) {
          nullIdx = i;
          break;
        }
      }

      if (nullIdx !== -1) {
        const keyword = new TextDecoder('utf-8').decode(chunkData.subarray(0, nullIdx));
        if (keyword === 'Description') {
          const compMethod = chunkData[nullIdx + 1];
          if (compMethod === 0) {
            // Deflate compression
            const compressed = chunkData.subarray(nullIdx + 2);
            try {
              let text = '';
              if (typeof DecompressionStream !== 'undefined') {
                const ds = new DecompressionStream('deflate');
                const writer = ds.writable.getWriter();
                await writer.write(compressed as unknown as BufferSource);
                await writer.close();
                const reader = ds.readable.getReader();
                const chunks: Uint8Array[] = [];
                while (true) {
                  const { value, done } = await reader.read();
                  if (done) break;
                  chunks.push(value);
                }
                const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
                const out = new Uint8Array(totalLen);
                let p = 0;
                for (const c of chunks) {
                  out.set(c, p);
                  p += c.length;
                }
                text = new TextDecoder('utf-8').decode(out);
              }
              if (text && text.includes('# BEGIN DMI')) {
                return parseDmiText(text);
              }
            } catch (err) {
              console.warn('DecompressionStream error:', err);
            }
          }
        }
      }
    } else if (chunkType === 'tEXt') {
      const chunkData = bytes.subarray(offset + 8, offset + 8 + chunkLength);
      let nullIdx = -1;
      for (let i = 0; i < chunkData.length; i++) {
        if (chunkData[i] === 0) {
          nullIdx = i;
          break;
        }
      }
      if (nullIdx !== -1) {
        const keyword = new TextDecoder('utf-8').decode(chunkData.subarray(0, nullIdx));
        if (keyword === 'Description') {
          const text = new TextDecoder('utf-8').decode(chunkData.subarray(nullIdx + 1));
          if (text.includes('# BEGIN DMI')) {
            return parseDmiText(text);
          }
        }
      }
    } else if (chunkType === 'IEND') {
      break;
    }

    offset += 12 + chunkLength;
  }

  return null;
}

/**
 * Creates an HTMLImageElement from binary PNG/DMI bytes via Blob URL
 */
export function createImageFromBuffer(buffer: ArrayBuffer | Uint8Array): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blobPart = buffer instanceof Uint8Array ? (buffer as unknown as BlobPart) : buffer;
    const blob = new Blob([blobPart], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image from buffer'));
    };
    img.src = url;
  });
}

/**
 * Draws a single DMI frame on the target canvas context.
 */
export function drawDmiFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  iconStateIndex: number,
  dir: number | Direction,
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

  if (srcY + frameHeight <= img.height && srcX + frameWidth <= img.width) {
    ctx.drawImage(img, srcX, srcY, frameWidth, frameHeight, x, y, targetWidth, targetHeight);
    return true;
  }

  // Fallback: draw first frame
  ctx.drawImage(img, 0, 0, Math.min(32, img.width), Math.min(32, img.height), x, y, targetWidth, targetHeight);
  return true;
}

// In-memory simple cache for fallback image lookups
const dmiSimpleCache = new Map<string, HTMLImageElement>();
export function getCachedDmiImage(path: string): HTMLImageElement | null {
  if (dmiSimpleCache.has(path)) {
    return dmiSimpleCache.get(path)!;
  }
  const img = new Image();
  img.onload = () => dmiSimpleCache.set(path, img);
  img.src = path;
  return null;
}
