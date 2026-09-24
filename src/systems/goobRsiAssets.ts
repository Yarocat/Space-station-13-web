// Goob Station / Space Station 14 (SS14) RSI Asset Registry & Generator
// Directly models Resources/Textures from https://github.com/Goob-Station/Goob-Station
// Complies with SS14 Robust Sprite Interface (RSI) specification (meta.json + states + directions)

import { RsiMeta, RsiState } from '../types';

export interface GeneratedRsiBundle {
  meta: RsiMeta;
  canvas: HTMLCanvasElement;
}

const generatedRsiCache = new Map<string, GeneratedRsiBundle>();

/**
 * Normalizes an RSI path to standard Goob Station format
 */
export function normalizeRsiPath(path: string): string {
  let clean = path.replace(/^\/+/, '').replace(/\.rsi\/?$/, '');
  if (!clean.startsWith('Textures/')) {
    if (clean.startsWith('assets/rsi/')) {
      clean = clean.replace('assets/rsi/', '');
    }
  }
  return clean.toLowerCase();
}

/**
 * Creates an offscreen canvas of specified dimensions
 */
function createOffscreen(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

// ==========================================
// 1. PROCEDURAL PIXEL ART PAINTERS FOR RSI
// ==========================================

function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
}

function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

// ------------------------------------------
// Species Bodies (Human, Vulpakanin, Tajaran, Felinid, Lizard, Moth, Plasmaman, Abductor)
// ------------------------------------------
function drawRsiSpeciesBody(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  dir: number,
  baseColor: string,
  bellyColor: string,
  eyeColor: string,
  extra?: { snout?: boolean; muzzle?: boolean; lizardSpines?: boolean; mothFuff?: boolean; plasmaFlame?: boolean }
) {
  // dir: 0=South, 1=East, 2=North, 3=West (SS14 RSI convention)
  const isNorth = dir === 2;
  const isEast = dir === 1;
  const isWest = dir === 3;
  const isSide = isEast || isWest;

  // Head
  drawRect(ctx, ox + (isSide ? (isEast ? 12 : 8) : 10), oy + 6, isSide ? 12 : 12, 9, baseColor);
  drawRect(ctx, ox + (isSide ? (isEast ? 13 : 9) : 11), oy + 5, isSide ? 10 : 10, 1, baseColor);

  // Muzzle / Snout for Vulpakanin / Tajaran
  if (extra?.snout && !isNorth) {
    const mx = isEast ? ox + 22 : isWest ? ox + 7 : ox + 14;
    drawRect(ctx, mx, oy + 10, isSide ? 4 : 4, 3, bellyColor);
    drawPixel(ctx, isEast ? mx + 3 : isWest ? mx : ox + 15, oy + 10, '#1c1917'); // nose
  }

  // Eyes
  if (!isNorth) {
    if (isSide) {
      const ex = isEast ? ox + 20 : ox + 10;
      drawPixel(ctx, ex, oy + 9, eyeColor);
      drawPixel(ctx, ex, oy + 10, '#ffffff');
    } else {
      drawPixel(ctx, ox + 12, oy + 9, eyeColor);
      drawPixel(ctx, ox + 19, oy + 9, eyeColor);
      drawPixel(ctx, ox + 12, oy + 10, '#ffffff');
      drawPixel(ctx, ox + 19, oy + 10, '#ffffff');
    }
  }

  // Torso
  drawRect(ctx, ox + (isSide ? (isEast ? 12 : 10) : 10), oy + 15, isSide ? 10 : 12, 10, baseColor);
  if (!isNorth && bellyColor !== baseColor) {
    drawRect(ctx, ox + (isSide ? (isEast ? 15 : 11) : 13), oy + 16, isSide ? 5 : 6, 7, bellyColor);
  }

  // Lizard Spines
  if (extra?.lizardSpines) {
    ctx.fillStyle = '#14532d';
    if (isNorth) {
      for (let s = 0; s < 4; s++) drawPixel(ctx, ox + 15, oy + 7 + s * 4, '#14532d');
    } else if (isSide) {
      const sx = isEast ? ox + 11 : ox + 20;
      for (let s = 0; s < 4; s++) drawPixel(ctx, sx, oy + 7 + s * 4, '#14532d');
    }
  }

  // Moth fluff collar
  if (extra?.mothFuff && !isNorth) {
    drawRect(ctx, ox + 9, oy + 14, 14, 3, '#f5f5f4');
    drawRect(ctx, ox + 10, oy + 13, 12, 1, '#e7e5e4');
  }

  // Arms
  if (isSide) {
    drawRect(ctx, ox + (isEast ? 15 : 12), oy + 16, 4, 8, baseColor);
  } else {
    drawRect(ctx, ox + 7, oy + 16, 3, 8, baseColor);
    drawRect(ctx, ox + 22, oy + 16, 3, 8, baseColor);
  }

  // Legs
  if (isSide) {
    drawRect(ctx, ox + (isEast ? 14 : 13), oy + 25, 4, 6, baseColor);
  } else {
    drawRect(ctx, ox + 11, oy + 25, 3, 6, baseColor);
    drawRect(ctx, ox + 18, oy + 25, 3, 6, baseColor);
  }

  // Plasma flame particles inside Plasmaman
  if (extra?.plasmaFlame) {
    drawPixel(ctx, ox + 15, oy + 18, '#ec4899');
    drawPixel(ctx, ox + 16, oy + 19, '#a855f7');
    drawPixel(ctx, ox + 14, oy + 20, '#c084fc');
    if (!isNorth) {
      drawPixel(ctx, ox + 13, oy + 8, '#a855f7');
      drawPixel(ctx, ox + 18, oy + 8, '#ec4899');
    }
  }
}

// ------------------------------------------
// Species Tail & Ears Markings
// ------------------------------------------
function drawRsiSpeciesMarkings(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  dir: number,
  type: 'vulp_tail' | 'vulp_ears' | 'cat_tail' | 'cat_ears' | 'moth_wings',
  color: string,
  tipColor: string
) {
  const isNorth = dir === 2;
  const isEast = dir === 1;
  const isWest = dir === 3;

  if (type === 'vulp_tail') {
    // Large fluffy fox tail with white/light tip
    if (isNorth) {
      drawRect(ctx, ox + 18, oy + 17, 7, 10, color);
      drawRect(ctx, ox + 21, oy + 14, 4, 4, tipColor);
    } else if (isEast) {
      drawRect(ctx, ox + 5, oy + 18, 8, 9, color);
      drawRect(ctx, ox + 3, oy + 15, 4, 4, tipColor);
    } else if (isWest) {
      drawRect(ctx, ox + 19, oy + 18, 8, 9, color);
      drawRect(ctx, ox + 25, oy + 15, 4, 4, tipColor);
    } else {
      drawRect(ctx, ox + 21, oy + 19, 6, 8, color);
      drawRect(ctx, ox + 23, oy + 16, 4, 4, tipColor);
    }
  } else if (type === 'cat_tail') {
    // Sleek feline tail
    if (isNorth) {
      drawRect(ctx, ox + 20, oy + 18, 3, 8, color);
      drawPixel(ctx, ox + 21, oy + 17, tipColor);
    } else if (isEast) {
      drawRect(ctx, ox + 7, oy + 20, 5, 3, color);
      drawPixel(ctx, ox + 6, oy + 19, tipColor);
    } else if (isWest) {
      drawRect(ctx, ox + 20, oy + 20, 5, 3, color);
      drawPixel(ctx, ox + 25, oy + 19, tipColor);
    } else {
      drawRect(ctx, ox + 21, oy + 20, 4, 5, color);
      drawPixel(ctx, ox + 22, oy + 19, tipColor);
    }
  } else if (type === 'vulp_ears' || type === 'cat_ears') {
    // Pointed ears on top of head
    const earH = type === 'vulp_ears' ? 5 : 4;
    if (isEast) {
      drawRect(ctx, ox + 16, oy + 2, 4, earH, color);
      drawPixel(ctx, ox + 17, oy + 4, tipColor);
    } else if (isWest) {
      drawRect(ctx, ox + 12, oy + 2, 4, earH, color);
      drawPixel(ctx, ox + 14, oy + 4, tipColor);
    } else {
      drawRect(ctx, ox + 10, oy + 2, 3, earH, color);
      drawRect(ctx, ox + 19, oy + 2, 3, earH, color);
      drawPixel(ctx, ox + 11, oy + 4, tipColor);
      drawPixel(ctx, ox + 20, oy + 4, tipColor);
    }
  } else if (type === 'moth_wings') {
    // Feathered Moth Wings
    drawRect(ctx, ox + 4, oy + 12, 6, 14, '#e7e5e4');
    drawRect(ctx, ox + 22, oy + 12, 6, 14, '#e7e5e4');
    drawPixel(ctx, ox + 6, oy + 16, '#78716c');
    drawPixel(ctx, ox + 24, oy + 16, '#78716c');
  }
}

// ------------------------------------------
// Hairstyles
// ------------------------------------------
function drawRsiHairstyle(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  dir: number,
  style: string,
  hairColor: string
) {
  const isNorth = dir === 2;
  const isEast = dir === 1;
  const isWest = dir === 3;
  const isSide = isEast || isWest;

  switch (style) {
    case 'crewcut':
    case 'buzz':
      drawRect(ctx, ox + (isSide ? (isEast ? 12 : 8) : 10), oy + 4, 12, 3, hairColor);
      break;
    case 'afro':
      drawRect(ctx, ox + (isSide ? 9 : 8), oy + 2, 16, 7, hairColor);
      drawRect(ctx, ox + (isSide ? 8 : 7), oy + 5, 18, 5, hairColor);
      break;
    case 'bedhead':
    case 'messy':
      drawRect(ctx, ox + 9, oy + 3, 14, 4, hairColor);
      drawPixel(ctx, ox + 11, oy + 2, hairColor);
      drawPixel(ctx, ox + 16, oy + 1, hairColor);
      drawPixel(ctx, ox + 20, oy + 2, hairColor);
      break;
    case 'mohawk':
      drawRect(ctx, ox + 15, oy + 1, 2, 8, hairColor);
      break;
    case 'ponytail':
      drawRect(ctx, ox + 10, oy + 4, 12, 4, hairColor);
      if (isNorth || isSide) {
        drawRect(ctx, ox + (isEast ? 9 : isWest ? 21 : 15), oy + 6, 3, 8, hairColor);
      }
      break;
    case 'long':
    default:
      drawRect(ctx, ox + 10, oy + 4, 12, 4, hairColor);
      drawRect(ctx, ox + 9, oy + 8, 3, 9, hairColor);
      drawRect(ctx, ox + 20, oy + 8, 3, 9, hairColor);
      break;
  }
}

// ------------------------------------------
// Doors & Airlocks (SS14 Goob Station Airlock standard)
// ------------------------------------------
function drawRsiAirlock(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  frameType: 'closed' | 'open' | 'opening' | 'closing' | 'bolted' | 'welded',
  themeColor: string,
  stripeColor: string
) {
  // Base outer frame
  drawRect(ctx, ox, oy, 32, 32, '#1e293b');
  drawRect(ctx, ox + 1, oy + 1, 30, 30, '#0f172a');

  // Frame jambs
  drawRect(ctx, ox + 1, oy + 1, 5, 30, '#334155');
  drawRect(ctx, ox + 26, oy + 1, 5, 30, '#334155');
  drawRect(ctx, ox + 6, oy + 1, 20, 4, '#334155');

  if (frameType === 'open') {
    // Airlock fully open: dark threshold with floor access
    drawRect(ctx, ox + 6, oy + 5, 20, 24, '#090d16');
    drawRect(ctx, ox + 6, oy + 28, 20, 3, '#1e293b');
    // Open door panels tucked into the frame
    drawRect(ctx, ox + 4, oy + 6, 3, 22, themeColor);
    drawRect(ctx, ox + 25, oy + 6, 3, 22, themeColor);
    // Green sensor light
    drawPixel(ctx, ox + 15, oy + 3, '#22c55e');
    drawPixel(ctx, ox + 16, oy + 3, '#22c55e');
    return;
  }

  if (frameType === 'opening' || frameType === 'closing') {
    // Halfway split panels
    drawRect(ctx, ox + 6, oy + 5, 20, 24, '#090d16');
    drawRect(ctx, ox + 6, oy + 5, 6, 23, themeColor);
    drawRect(ctx, ox + 20, oy + 5, 6, 23, themeColor);
    // Yellow blinking lights
    drawPixel(ctx, ox + 15, oy + 3, '#eab308');
    drawPixel(ctx, ox + 16, oy + 3, '#eab308');
    return;
  }

  // Closed door leaves (two central panels)
  drawRect(ctx, ox + 6, oy + 5, 20, 24, themeColor);
  // Center seam
  drawRect(ctx, ox + 15, oy + 5, 2, 24, '#0f172a');

  // Department stripe / warning hazard line
  drawRect(ctx, ox + 7, oy + 14, 8, 4, stripeColor);
  drawRect(ctx, ox + 17, oy + 14, 8, 4, stripeColor);

  // Reinforced Glass viewport window
  drawRect(ctx, ox + 9, oy + 8, 5, 4, '#38bdf8');
  drawRect(ctx, ox + 18, oy + 8, 5, 4, '#38bdf8');
  drawPixel(ctx, ox + 10, oy + 9, '#ffffff');
  drawPixel(ctx, ox + 19, oy + 9, '#ffffff');

  // Bolted status: Red glow indicators
  if (frameType === 'bolted') {
    drawRect(ctx, ox + 10, oy + 24, 4, 2, '#ef4444');
    drawRect(ctx, ox + 18, oy + 24, 4, 2, '#ef4444');
    drawPixel(ctx, ox + 15, oy + 3, '#ef4444');
    drawPixel(ctx, ox + 16, oy + 3, '#ef4444');
  } else if (frameType === 'welded') {
    // Metal weld beads across the seam
    ctx.fillStyle = '#f97316';
    for (let w = 0; w < 6; w++) {
      drawPixel(ctx, ox + 15 + (w % 2), oy + 7 + w * 3, '#f97316');
      drawPixel(ctx, ox + 14 + (w % 2), oy + 8 + w * 3, '#ea580c');
    }
  } else {
    // Normal active sensor light
    drawPixel(ctx, ox + 15, oy + 3, '#38bdf8');
    drawPixel(ctx, ox + 16, oy + 3, '#38bdf8');
  }
}

// ------------------------------------------
// Walls & Windows
// ------------------------------------------
function drawRsiWall(ctx: CanvasRenderingContext2D, ox: number, oy: number, type: 'solid' | 'reinforced' | 'window' | 'grille') {
  if (type === 'solid') {
    drawRect(ctx, ox, oy, 32, 32, '#475569');
    drawRect(ctx, ox + 1, oy + 1, 30, 30, '#334155');
    // Sub-panel bevel lines
    drawRect(ctx, ox + 2, oy + 2, 28, 1, '#64748b');
    drawRect(ctx, ox + 2, oy + 2, 1, 28, '#64748b');
    drawRect(ctx, ox + 2, oy + 29, 28, 1, '#1e293b');
    drawRect(ctx, ox + 29, oy + 2, 1, 28, '#1e293b');
    // Rivets
    drawPixel(ctx, ox + 4, oy + 4, '#94a3b8');
    drawPixel(ctx, ox + 27, oy + 4, '#94a3b8');
    drawPixel(ctx, ox + 4, oy + 27, '#94a3b8');
    drawPixel(ctx, ox + 27, oy + 27, '#94a3b8');
  } else if (type === 'reinforced') {
    drawRect(ctx, ox, oy, 32, 32, '#334155');
    drawRect(ctx, ox + 1, oy + 1, 30, 30, '#1e293b');
    // Diagonal reinforcement girders
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox + 4, oy + 4);
    ctx.lineTo(ox + 28, oy + 28);
    ctx.moveTo(ox + 28, oy + 4);
    ctx.lineTo(ox + 4, oy + 28);
    ctx.stroke();
  } else if (type === 'window') {
    // Glass window with frame
    drawRect(ctx, ox, oy, 32, 32, 'rgba(15, 23, 42, 0.4)');
    drawRect(ctx, ox, oy, 32, 2, '#475569');
    drawRect(ctx, ox, oy + 30, 32, 2, '#475569');
    drawRect(ctx, ox, oy, 2, 32, '#475569');
    drawRect(ctx, ox + 30, oy, 2, 32, '#475569');
    // Cyan glass tint & glint
    drawRect(ctx, ox + 2, oy + 2, 28, 28, 'rgba(56, 189, 248, 0.35)');
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox + 6, oy + 26);
    ctx.lineTo(ox + 26, oy + 6);
    ctx.stroke();
  } else if (type === 'grille') {
    // Metal security lattice
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 4; i <= 28; i += 6) {
      ctx.moveTo(ox + i, oy + 2);
      ctx.lineTo(ox + i, oy + 30);
      ctx.moveTo(ox + 2, oy + i);
      ctx.lineTo(ox + 30, oy + i);
    }
    ctx.stroke();
  }
}

// ------------------------------------------
// Interface & HUD Elements (Goob Station / SS14 Modern HUD)
// ------------------------------------------
function drawRsiInterfaceElement(ctx: CanvasRenderingContext2D, ox: number, oy: number, name: string) {
  if (name === 'slot_empty') {
    drawRect(ctx, ox + 1, oy + 1, 30, 30, 'rgba(15, 23, 42, 0.85)');
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox + 1.5, oy + 1.5, 29, 29);
  } else if (name === 'slot_active') {
    drawRect(ctx, ox + 1, oy + 1, 30, 30, 'rgba(14, 116, 144, 0.3)');
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox + 1.5, oy + 1.5, 29, 29);
  } else if (name === 'intent_help') {
    drawRect(ctx, ox + 4, oy + 4, 24, 24, '#15803d');
    drawRect(ctx, ox + 10, oy + 12, 12, 8, '#86efac');
    drawRect(ctx, ox + 14, oy + 8, 4, 12, '#86efac');
  } else if (name === 'intent_disarm') {
    drawRect(ctx, ox + 4, oy + 4, 24, 24, '#0369a1');
    drawRect(ctx, ox + 8, oy + 10, 16, 12, '#7dd3fc');
  } else if (name === 'intent_grab') {
    drawRect(ctx, ox + 4, oy + 4, 24, 24, '#a16207');
    drawRect(ctx, ox + 10, oy + 8, 12, 16, '#fde047');
  } else if (name === 'intent_harm') {
    drawRect(ctx, ox + 4, oy + 4, 24, 24, '#b91c1c');
    drawRect(ctx, ox + 9, oy + 9, 14, 14, '#fca5a5');
  } else if (name === 'health_full') {
    drawRect(ctx, ox + 6, oy + 6, 20, 20, '#16a34a');
    drawPixel(ctx, ox + 16, oy + 16, '#ffffff');
  } else if (name === 'health_damaged') {
    drawRect(ctx, ox + 6, oy + 6, 20, 20, '#ea580c');
  } else if (name === 'health_critical') {
    drawRect(ctx, ox + 6, oy + 6, 20, 20, '#dc2626');
  } else if (name === 'oxy_alert') {
    drawRect(ctx, ox + 6, oy + 6, 20, 20, '#0284c7');
  } else if (name === 'tox_alert') {
    drawRect(ctx, ox + 6, oy + 6, 20, 20, '#9333ea');
  } else if (name === 'fire_alert') {
    drawRect(ctx, ox + 6, oy + 6, 20, 20, '#e11d48');
  } else {
    drawRect(ctx, ox + 2, oy + 2, 28, 28, '#1e293b');
  }
}

// ------------------------------------------
// Tiles & Floors (SS14 Standard Steel, Medbay, Catwalk, Planter, Plating)
// ------------------------------------------
function drawRsiTile(ctx: CanvasRenderingContext2D, ox: number, oy: number, tileType: string) {
  if (tileType === 'floor' || tileType === 'steel') {
    // SS14 Standard Station Steel Floor: Light grey with crisp 1px borders & corner rivets
    drawRect(ctx, ox, oy, 32, 32, '#7a8292');
    drawRect(ctx, ox + 1, oy + 1, 30, 30, '#8891a2');
    // Inner beveled square
    drawRect(ctx, ox + 2, oy + 2, 28, 1, '#9ba5b8');
    drawRect(ctx, ox + 2, oy + 2, 1, 28, '#9ba5b8');
    drawRect(ctx, ox + 2, oy + 29, 28, 1, '#666e7d');
    drawRect(ctx, ox + 29, oy + 2, 1, 28, '#666e7d');
    // Center faint cross seam
    drawRect(ctx, ox + 15, oy + 2, 2, 28, '#7e8798');
    drawRect(ctx, ox + 2, oy + 15, 28, 2, '#7e8798');
    // 4 Corner rivets
    drawPixel(ctx, ox + 4, oy + 4, '#383d47');
    drawPixel(ctx, ox + 5, oy + 5, '#c5cfdf');
    drawPixel(ctx, ox + 27, oy + 4, '#383d47');
    drawPixel(ctx, ox + 26, oy + 5, '#c5cfdf');
    drawPixel(ctx, ox + 4, oy + 27, '#383d47');
    drawPixel(ctx, ox + 5, oy + 26, '#c5cfdf');
    drawPixel(ctx, ox + 27, oy + 27, '#383d47');
    drawPixel(ctx, ox + 26, oy + 26, '#c5cfdf');
  } else if (tileType === 'medbay' || tileType === 'white') {
    // SS14 Medbay Sterile White & Cyan Floor
    drawRect(ctx, ox, oy, 32, 32, '#d6e2f0');
    drawRect(ctx, ox + 1, oy + 1, 30, 30, '#edf3fc');
    // Light cyan center quadrant
    drawRect(ctx, ox + 8, oy + 8, 16, 16, '#93c5fd');
    drawRect(ctx, ox + 10, oy + 10, 12, 12, '#bfdbfe');
    // Corner accent rivets
    drawPixel(ctx, ox + 3, oy + 3, '#94a3b8');
    drawPixel(ctx, ox + 28, oy + 3, '#94a3b8');
    drawPixel(ctx, ox + 3, oy + 28, '#94a3b8');
    drawPixel(ctx, ox + 28, oy + 28, '#94a3b8');
  } else if (tileType === 'catwalk') {
    // SS14 Blue-Grey Industrial Catwalk with cross-hatch metal mesh
    drawRect(ctx, ox, oy, 32, 32, '#1e2632');
    drawRect(ctx, ox + 2, oy + 2, 28, 28, '#2d3848');
    // Steel crosshatch diamond lattice
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 32; i += 6) {
      ctx.moveTo(ox + i, oy);
      ctx.lineTo(ox + i + 16, oy + 32);
      ctx.moveTo(ox + i + 16, oy);
      ctx.lineTo(ox + i, oy + 32);
    }
    ctx.stroke();
    // Border rim with rivets
    drawRect(ctx, ox, oy, 32, 2, '#475569');
    drawRect(ctx, ox, oy + 30, 32, 2, '#475569');
    drawRect(ctx, ox, oy, 2, 32, '#475569');
    drawRect(ctx, ox + 30, oy, 2, 32, '#475569');
    drawPixel(ctx, ox + 3, oy + 3, '#94a3b8');
    drawPixel(ctx, ox + 28, oy + 3, '#94a3b8');
    drawPixel(ctx, ox + 3, oy + 28, '#94a3b8');
    drawPixel(ctx, ox + 28, oy + 28, '#94a3b8');
  } else if (tileType === 'planter') {
    // SS14 Planter Bed: Rich dark soil, stones, lush green moss, tropical ferns & wildflowers
    drawRect(ctx, ox, oy, 32, 32, '#33271c');
    drawRect(ctx, ox + 1, oy + 1, 30, 30, '#423325');
    // Pebbles / Stones
    drawRect(ctx, ox + 5, oy + 7, 4, 3, '#64748b');
    drawRect(ctx, ox + 19, oy + 18, 5, 4, '#57534e');
    drawRect(ctx, ox + 23, oy + 6, 3, 3, '#78716c');
    drawRect(ctx, ox + 8, oy + 22, 4, 3, '#64748b');
    // Lush moss patches
    drawRect(ctx, ox + 3, oy + 12, 10, 8, '#2d5a27');
    drawRect(ctx, ox + 16, oy + 4, 8, 10, '#1e4b1a');
    drawRect(ctx, ox + 14, oy + 20, 14, 9, '#2d5a27');
    // Tropical fern fronds
    drawRect(ctx, ox + 6, oy + 14, 5, 4, '#22c55e');
    drawRect(ctx, ox + 18, oy + 8, 4, 6, '#4ade80');
    drawRect(ctx, ox + 17, oy + 22, 6, 5, '#16a34a');
    // Blooming Wildflowers (pink, yellow, white petals)
    drawPixel(ctx, ox + 8, oy + 15, '#f472b6');
    drawPixel(ctx, ox + 9, oy + 15, '#f472b6');
    drawPixel(ctx, ox + 20, oy + 10, '#fde047');
    drawPixel(ctx, ox + 21, oy + 10, '#fde047');
    drawPixel(ctx, ox + 25, oy + 24, '#ffffff');
    drawPixel(ctx, ox + 26, oy + 24, '#f43f5e');
  } else {
    // Plating / Sub-floor
    drawRect(ctx, ox, oy, 32, 32, '#181e28');
    drawRect(ctx, ox + 1, oy + 1, 30, 30, '#242c3b');
    // Diagonal metal brace
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox + 4, oy + 4);
    ctx.lineTo(ox + 28, oy + 28);
    ctx.stroke();
    // Hex bolts
    drawPixel(ctx, ox + 6, oy + 6, '#64748b');
    drawPixel(ctx, ox + 25, oy + 25, '#64748b');
  }
}

// ------------------------------------------
// Fixtures & Wall Mountings (Extinguisher Cabinet, Lights, Vents, Alarms, Signs)
// ------------------------------------------
function drawRsiFixture(ctx: CanvasRenderingContext2D, ox: number, oy: number, name: string) {
  if (name === 'extinguisher_cabinet') {
    // Red Emergency Extinguisher Cabinet mounted on wall
    drawRect(ctx, ox + 6, oy + 4, 20, 24, '#991b1b');
    drawRect(ctx, ox + 7, oy + 5, 18, 22, '#dc2626');
    // Glass window pane
    drawRect(ctx, ox + 9, oy + 7, 14, 18, '#bae6fd');
    drawRect(ctx, ox + 10, oy + 8, 12, 16, '#0f172a');
    // Fire extinguisher inside
    drawRect(ctx, ox + 13, oy + 11, 6, 11, '#ef4444');
    drawRect(ctx, ox + 14, oy + 9, 4, 2, '#475569'); // valve
    drawRect(ctx, ox + 12, oy + 12, 2, 8, '#1e293b'); // hose
    drawPixel(ctx, ox + 15, oy + 10, '#facc15'); // gauge
    // Glass highlight glare
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox + 10, oy + 21);
    ctx.lineTo(ox + 20, oy + 9);
    ctx.stroke();
    // Chrome handle
    drawRect(ctx, ox + 23, oy + 14, 2, 6, '#e2e8f0');
  } else if (name === 'floor_vent') {
    // Circular Air Vent with rim & fan blades
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(ox + 16, oy + 16, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(ox + 16, oy + 16, 10, 0, Math.PI * 2);
    ctx.fill();
    // 4 radial fan blades
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox + 16, oy + 7);
    ctx.lineTo(ox + 16, oy + 25);
    ctx.moveTo(ox + 7, oy + 16);
    ctx.lineTo(ox + 25, oy + 16);
    ctx.stroke();
    // Center hub
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(ox + 16, oy + 16, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (name === 'floor_scrubber') {
    // Rectangular atmospheric scrubber grate
    drawRect(ctx, ox + 6, oy + 8, 20, 16, '#475569');
    drawRect(ctx, ox + 7, oy + 9, 18, 14, '#1e293b');
    // Horizontal grate louvers
    for (let r = 11; r <= 21; r += 3) {
      drawRect(ctx, ox + 9, oy + r, 14, 1.5, '#64748b');
    }
    // Red status light
    drawPixel(ctx, ox + 16, oy + 9, '#ef4444');
  } else if (name === 'wall_light') {
    // Sleek fluorescent wall tube light glowing warm white
    drawRect(ctx, ox + 4, oy + 13, 24, 6, '#334155');
    drawRect(ctx, ox + 6, oy + 14, 20, 4, '#fef08a');
    drawRect(ctx, ox + 8, oy + 15, 16, 2, '#ffffff');
    drawPixel(ctx, ox + 5, oy + 15, '#64748b');
    drawPixel(ctx, ox + 26, oy + 15, '#64748b');
  } else if (name === 'wall_air_alarm') {
    // Wall Air Alarm with blue display
    drawRect(ctx, ox + 6, oy + 8, 20, 16, '#334155');
    drawRect(ctx, ox + 8, oy + 10, 16, 12, '#0284c7');
    // "AIR" text
    drawPixel(ctx, ox + 11, oy + 13, '#38bdf8');
    drawPixel(ctx, ox + 13, oy + 13, '#38bdf8');
    drawPixel(ctx, ox + 15, oy + 13, '#38bdf8');
    // Status LEDs
    drawPixel(ctx, ox + 19, oy + 13, '#22c55e');
    drawPixel(ctx, ox + 21, oy + 13, '#22c55e');
  } else if (name === 'wall_fire_alarm') {
    // Red fire alarm pull station
    drawRect(ctx, ox + 10, oy + 8, 12, 16, '#dc2626');
    drawRect(ctx, ox + 12, oy + 10, 8, 8, '#ffffff');
    drawRect(ctx, ox + 14, oy + 13, 4, 3, '#991b1b');
  } else if (name === 'wall_apc') {
    // Area Power Controller
    drawRect(ctx, ox + 8, oy + 6, 16, 20, '#475569');
    drawRect(ctx, ox + 9, oy + 7, 14, 18, '#1e293b');
    // Green power light
    drawRect(ctx, ox + 14, oy + 9, 4, 3, '#22c55e');
    // Yellow/black warning bar on bottom
    drawRect(ctx, ox + 10, oy + 21, 4, 2, '#eab308');
    drawRect(ctx, ox + 14, oy + 21, 4, 2, '#1e293b');
    drawRect(ctx, ox + 18, oy + 21, 4, 2, '#eab308');
  } else if (name === 'medical_cross_sign') {
    // Glowing cyan/white medical cross sign
    drawRect(ctx, ox + 4, oy + 4, 24, 24, '#0f172a');
    drawRect(ctx, ox + 6, oy + 6, 20, 20, '#0284c7');
    // Plus Cross
    drawRect(ctx, ox + 14, oy + 9, 4, 14, '#ffffff');
    drawRect(ctx, ox + 9, oy + 14, 14, 4, '#ffffff');
  } else if (name === 'potted_plant') {
    // Tall potted snake plant / ficus
    drawRect(ctx, ox + 10, oy + 18, 12, 12, '#78350f'); // pot
    drawRect(ctx, ox + 9, oy + 17, 14, 3, '#92400e'); // rim
    // Leaves
    drawRect(ctx, ox + 14, oy + 5, 4, 13, '#15803d');
    drawRect(ctx, ox + 11, oy + 8, 4, 10, '#16a34a');
    drawRect(ctx, ox + 17, oy + 7, 4, 11, '#22c55e');
    drawPixel(ctx, ox + 15, oy + 4, '#4ade80');
  } else if (name === 'bonsai_shelf') {
    // Wall shelf with miniature bonsai tree
    drawRect(ctx, ox + 4, oy + 22, 24, 3, '#475569'); // shelf
    drawRect(ctx, ox + 10, oy + 17, 12, 5, '#1e293b'); // small pot
    // Gnarled trunk
    drawRect(ctx, ox + 15, oy + 12, 3, 5, '#78350f');
    drawRect(ctx, ox + 12, oy + 9, 7, 3, '#78350f');
    // Cherry blossoms / foliage
    drawRect(ctx, ox + 10, oy + 6, 6, 4, '#f472b6');
    drawRect(ctx, ox + 16, oy + 5, 7, 4, '#fbcfe8');
    drawPixel(ctx, ox + 13, oy + 5, '#f43f5e');
  } else if (name === 'bench') {
    // Waiting room bench with brown leather cushions
    drawRect(ctx, ox + 4, oy + 10, 24, 14, '#92400e');
    drawRect(ctx, ox + 5, oy + 11, 22, 12, '#b45309');
    drawRect(ctx, ox + 15, oy + 11, 2, 12, '#78350f'); // cushion split
    // Chrome support bars
    drawRect(ctx, ox + 6, oy + 24, 3, 6, '#94a3b8');
    drawRect(ctx, ox + 23, oy + 24, 3, 6, '#94a3b8');
  } else if (name === 'vending_soda') {
    // Drink-O-Matic soda vending machine
    drawRect(ctx, ox + 4, oy + 2, 24, 28, '#991b1b');
    drawRect(ctx, ox + 6, oy + 4, 20, 16, '#0f172a');
    // Glowing drinks window
    drawRect(ctx, ox + 8, oy + 6, 16, 12, '#38bdf8');
    drawRect(ctx, ox + 10, oy + 8, 3, 4, '#ef4444');
    drawRect(ctx, ox + 15, oy + 8, 3, 4, '#22c55e');
    drawRect(ctx, ox + 20, oy + 8, 3, 4, '#eab308');
    // Dispenser tray
    drawRect(ctx, ox + 8, oy + 22, 16, 6, '#1e293b');
  } else if (name === 'vending_snack') {
    // Get-More-Chocolate snack vending machine
    drawRect(ctx, ox + 4, oy + 2, 24, 28, '#ea580c');
    drawRect(ctx, ox + 6, oy + 4, 20, 16, '#0f172a');
    // Shelves with snack bars
    drawRect(ctx, ox + 8, oy + 6, 16, 12, '#fde047');
    drawRect(ctx, ox + 8, oy + 22, 16, 6, '#1e293b');
  } else if (name === 'water_cooler') {
    // Office water cooler
    drawRect(ctx, ox + 10, oy + 14, 12, 16, '#f1f5f9');
    // Inverted blue water bottle
    drawRect(ctx, ox + 11, oy + 4, 10, 10, '#38bdf8');
    drawRect(ctx, ox + 12, oy + 2, 8, 2, '#0284c7');
    // Tap
    drawPixel(ctx, ox + 15, oy + 17, '#0ea5e9');
    drawPixel(ctx, ox + 15, oy + 18, '#0ea5e9');
  } else if (name.startsWith('wall_sign')) {
    // Station Direction Signs
    drawRect(ctx, ox + 4, oy + 6, 24, 12, '#0f172a');
    drawRect(ctx, ox + 5, oy + 7, 22, 10, '#1e293b');
    if (name.includes('sec')) {
      drawRect(ctx, ox + 5, oy + 7, 22, 10, '#7f1d1d');
      drawPixel(ctx, ox + 9, oy + 10, '#ffffff'); // S
      drawPixel(ctx, ox + 13, oy + 10, '#ffffff'); // E
      drawPixel(ctx, ox + 17, oy + 10, '#ffffff'); // C
      drawPixel(ctx, ox + 21, oy + 10, '#fca5a5'); // <
    } else if (name.includes('evac')) {
      drawRect(ctx, ox + 5, oy + 7, 22, 10, '#991b1b');
      drawPixel(ctx, ox + 8, oy + 10, '#fecaca');
      drawPixel(ctx, ox + 12, oy + 10, '#fecaca');
      drawPixel(ctx, ox + 16, oy + 10, '#fecaca');
      drawPixel(ctx, ox + 20, oy + 10, '#ffffff');
    } else if (name.includes('sci')) {
      drawRect(ctx, ox + 5, oy + 7, 22, 10, '#581c87');
      drawPixel(ctx, ox + 8, oy + 10, '#f3e8ff');
      drawPixel(ctx, ox + 12, oy + 10, '#f3e8ff');
      drawPixel(ctx, ox + 16, oy + 10, '#f3e8ff');
      drawPixel(ctx, ox + 20, oy + 10, '#ffffff');
    } else if (name.includes('law')) {
      drawRect(ctx, ox + 5, oy + 7, 22, 10, '#1e3a8a');
      drawPixel(ctx, ox + 11, oy + 10, '#93c5fd');
      drawPixel(ctx, ox + 15, oy + 10, '#93c5fd');
      drawPixel(ctx, ox + 19, oy + 10, '#ffffff');
    } else if (name.includes('walk')) {
      drawRect(ctx, ox + 5, oy + 7, 22, 10, '#1e293b');
      drawPixel(ctx, ox + 15, oy + 9, '#38bdf8');
      drawPixel(ctx, ox + 15, oy + 10, '#38bdf8');
      drawPixel(ctx, ox + 15, oy + 12, '#38bdf8');
    } else if (name.includes('no_smoking')) {
      drawRect(ctx, ox + 7, oy + 7, 18, 10, '#ffffff');
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ox + 16, oy + 12, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ox + 13, oy + 9);
      ctx.lineTo(ox + 19, oy + 15);
      ctx.stroke();
    } else {
      drawRect(ctx, ox + 5, oy + 7, 22, 10, '#eab308');
      drawPixel(ctx, ox + 15, oy + 9, '#000000');
    }
  } else {
    drawRect(ctx, ox + 4, oy + 4, 24, 24, '#334155');
  }
}

// ------------------------------------------
// Furniture & Machines
// ------------------------------------------
function drawRsiFurniture(ctx: CanvasRenderingContext2D, ox: number, oy: number, type: 'table' | 'chair' | 'canister' | 'autolathe') {
  if (type === 'table') {
    drawRect(ctx, ox + 2, oy + 4, 28, 20, '#64748b');
    drawRect(ctx, ox + 3, oy + 5, 26, 18, '#475569');
    drawRect(ctx, ox + 4, oy + 24, 3, 6, '#334155');
    drawRect(ctx, ox + 25, oy + 24, 3, 6, '#334155');
  } else if (type === 'chair') {
    drawRect(ctx, ox + 6, oy + 6, 20, 6, '#0284c7');
    drawRect(ctx, ox + 8, oy + 12, 16, 12, '#38bdf8');
    drawRect(ctx, ox + 8, oy + 24, 3, 6, '#0f172a');
    drawRect(ctx, ox + 21, oy + 24, 3, 6, '#0f172a');
  } else if (type === 'canister') {
    drawRect(ctx, ox + 8, oy + 4, 16, 24, '#f59e0b');
    drawRect(ctx, ox + 10, oy + 2, 12, 2, '#d97706');
    drawRect(ctx, ox + 12, oy + 8, 8, 4, '#1e293b');
    drawPixel(ctx, ox + 15, oy + 9, '#ef4444');
  } else if (type === 'autolathe') {
    drawRect(ctx, ox + 2, oy + 2, 28, 28, '#334155');
    drawRect(ctx, ox + 4, oy + 4, 24, 12, '#0f172a');
    drawRect(ctx, ox + 6, oy + 6, 20, 8, '#06b6d4');
    drawRect(ctx, ox + 8, oy + 20, 16, 8, '#1e293b');
  }
}

// ==========================================
// 2. MAIN REGISTRY CREATOR & LOADER
// ==========================================

/**
 * Builds or fetches the complete Goob Station RSI bundle for a given path
 */
export function getOrCreateGoobRsiBundle(cleanPath: string): GeneratedRsiBundle {
  const norm = normalizeRsiPath(cleanPath);
  if (generatedRsiCache.has(norm)) {
    return generatedRsiCache.get(norm)!;
  }

  // Determine what type of RSI this is
  let meta: RsiMeta;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  if (norm.includes('species/') || norm.includes('human') || norm.includes('vulpakanin') || norm.includes('tajaran') || norm.includes('moth')) {
    // ----------------- SPECIES RSI -----------------
    const species = norm.includes('vulpakanin')
      ? 'vulpakanin'
      : norm.includes('tajaran')
      ? 'tajaran'
      : norm.includes('felinid')
      ? 'felinid'
      : norm.includes('lizard')
      ? 'lizard'
      : norm.includes('moth')
      ? 'moth'
      : norm.includes('plasmaman')
      ? 'plasmaman'
      : norm.includes('abductor')
      ? 'abductor'
      : 'human';

    meta = {
      version: 1,
      size: { x: 32, y: 32 },
      states: [
        { name: `${species}_torso`, directions: 4 },
        { name: `${species}_head`, directions: 4 },
        { name: 'torso', directions: 4 },
        { name: 'head', directions: 4 },
      ],
    };

    const out = createOffscreen(32 * 4, 32 * meta.states.length);
    canvas = out.canvas;
    ctx = out.ctx;

    const baseColor =
      species === 'vulpakanin'
        ? '#d97706'
        : species === 'tajaran'
        ? '#78716c'
        : species === 'lizard'
        ? '#15803d'
        : species === 'moth'
        ? '#f5f5f4'
        : species === 'plasmaman'
        ? '#581c87'
        : species === 'abductor'
        ? '#84cc16'
        : '#fde0c8';

    const bellyColor =
      species === 'vulpakanin'
        ? '#fef3c7'
        : species === 'tajaran'
        ? '#e7e5e4'
        : species === 'lizard'
        ? '#86efac'
        : baseColor;

    const eyeColor =
      species === 'vulpakanin'
        ? '#16a34a'
        : species === 'plasmaman'
        ? '#f43f5e'
        : species === 'abductor'
        ? '#000000'
        : '#2563eb';

    // Draw 4 directions for each state
    for (let s = 0; s < meta.states.length; s++) {
      for (let d = 0; d < 4; d++) {
        drawRsiSpeciesBody(ctx, d * 32, s * 32, d, baseColor, bellyColor, eyeColor, {
          snout: species === 'vulpakanin' || species === 'tajaran',
          lizardSpines: species === 'lizard',
          mothFuff: species === 'moth',
          plasmaFlame: species === 'plasmaman',
        });
      }
    }
  } else if (norm.includes('customization/hair') || norm.includes('hair')) {
    // ----------------- HAIR RSI -----------------
    const hairStyles = ['crewcut', 'afro', 'bedhead', 'long', 'ponytail', 'bob', 'buzz', 'mohawk', 'dreadlocks'];
    meta = {
      version: 1,
      size: { x: 32, y: 32 },
      states: hairStyles.map((h) => ({ name: h, directions: 4 })),
    };

    const out = createOffscreen(32 * 4, 32 * hairStyles.length);
    canvas = out.canvas;
    ctx = out.ctx;

    for (let s = 0; s < hairStyles.length; s++) {
      for (let d = 0; d < 4; d++) {
        drawRsiHairstyle(ctx, d * 32, s * 32, d, hairStyles[s], '#451a03');
      }
    }
  } else if (norm.includes('markings') || norm.includes('tails') || norm.includes('ears')) {
    // ----------------- MARKINGS (TAILS & EARS) RSI -----------------
    const markings = [
      { name: 'vulp_tail', type: 'vulp_tail' as const, color: '#d97706', tip: '#ffffff' },
      { name: 'vulp_ears', type: 'vulp_ears' as const, color: '#d97706', tip: '#ffffff' },
      { name: 'cat_tail', type: 'cat_tail' as const, color: '#78716c', tip: '#44403c' },
      { name: 'cat_ears', type: 'cat_ears' as const, color: '#78716c', tip: '#f5d0fe' },
      { name: 'moth_wings', type: 'moth_wings' as const, color: '#f5f5f4', tip: '#78716c' },
    ];
    meta = {
      version: 1,
      size: { x: 32, y: 32 },
      states: markings.map((m) => ({ name: m.name, directions: 4 })),
    };

    const out = createOffscreen(32 * 4, 32 * markings.length);
    canvas = out.canvas;
    ctx = out.ctx;

    for (let s = 0; s < markings.length; s++) {
      for (let d = 0; d < 4; d++) {
        drawRsiSpeciesMarkings(ctx, d * 32, s * 32, d, markings[s].type, markings[s].color, markings[s].tip);
      }
    }
  } else if (norm.includes('doors') || norm.includes('airlock')) {
    // ----------------- AIRLOCKS & DOORS RSI -----------------
    const isEng = norm.includes('engineering');
    const isSec = norm.includes('security');
    const isMed = norm.includes('medical');
    const isCmd = norm.includes('command');
    const isSci = norm.includes('science');

    const themeColor = isEng
      ? '#d97706'
      : isSec
      ? '#dc2626'
      : isMed
      ? '#0284c7'
      : isCmd
      ? '#2563eb'
      : isSci
      ? '#9333ea'
      : '#475569';

    const stripeColor = isEng
      ? '#f59e0b'
      : isSec
      ? '#ef4444'
      : isMed
      ? '#38bdf8'
      : isCmd
      ? '#60a5fa'
      : isSci
      ? '#c084fc'
      : '#94a3b8';

    const statesList: ('closed' | 'open' | 'opening' | 'closing' | 'bolted' | 'welded')[] = [
      'closed',
      'open',
      'opening',
      'closing',
      'bolted',
      'welded',
    ];

    meta = {
      version: 1,
      size: { x: 32, y: 32 },
      states: statesList.map((s) => ({ name: s, directions: 1 })),
    };

    const out = createOffscreen(32, 32 * statesList.length);
    canvas = out.canvas;
    ctx = out.ctx;

    for (let s = 0; s < statesList.length; s++) {
      drawRsiAirlock(ctx, 0, s * 32, statesList[s], themeColor, stripeColor);
    }
  } else if (norm.includes('walls') || norm.includes('windows') || norm.includes('grilles')) {
    // ----------------- WALLS & WINDOWS RSI -----------------
    const wallTypes: ('solid' | 'reinforced' | 'window' | 'grille')[] = ['solid', 'reinforced', 'window', 'grille'];
    meta = {
      version: 1,
      size: { x: 32, y: 32 },
      states: [
        { name: 'solid', directions: 1 },
        { name: 'reinforced', directions: 1 },
        { name: 'window', directions: 1 },
        { name: 'grille', directions: 1 },
        { name: 'full', directions: 1 },
      ],
    };

    const out = createOffscreen(32, 32 * 5);
    canvas = out.canvas;
    ctx = out.ctx;

    drawRsiWall(ctx, 0, 0, 'solid');
    drawRsiWall(ctx, 0, 32, 'reinforced');
    drawRsiWall(ctx, 0, 64, 'window');
    drawRsiWall(ctx, 0, 96, 'grille');
    drawRsiWall(ctx, 0, 128, norm.includes('reinforced') ? 'reinforced' : 'solid');
  } else if (norm.includes('tiles') || norm.includes('floors')) {
    // ----------------- TILES & FLOORS RSI -----------------
    const tileStates = ['floor', 'steel', 'medbay', 'white', 'catwalk', 'planter', 'plating', 'bar', 'freezer'];
    meta = {
      version: 1,
      size: { x: 32, y: 32 },
      states: tileStates.map((s) => ({ name: s, directions: 1 })),
    };

    const out = createOffscreen(32, 32 * tileStates.length);
    canvas = out.canvas;
    ctx = out.ctx;

    for (let s = 0; s < tileStates.length; s++) {
      drawRsiTile(ctx, 0, s * 32, tileStates[s]);
    }
  } else if (norm.includes('fixtures') || norm.includes('decorations') || norm.includes('devices')) {
    // ----------------- FIXTURES & WALL MOUNTINGS RSI -----------------
    const fixtureStates = [
      'extinguisher_cabinet',
      'floor_vent',
      'floor_scrubber',
      'wall_light',
      'wall_air_alarm',
      'wall_fire_alarm',
      'wall_apc',
      'medical_cross_sign',
      'potted_plant',
      'bonsai_shelf',
      'bench',
      'vending_soda',
      'vending_snack',
      'water_cooler',
      'wall_sign_sec',
      'wall_sign_evac',
      'wall_sign_sci',
      'wall_sign_eng',
      'wall_sign_law',
      'wall_sign_walk',
      'wall_sign_no_smoking',
      'table',
      'chair',
    ];
    meta = {
      version: 1,
      size: { x: 32, y: 32 },
      states: fixtureStates.map((s) => ({ name: s, directions: 1 })),
    };

    const out = createOffscreen(32, 32 * fixtureStates.length);
    canvas = out.canvas;
    ctx = out.ctx;

    for (let s = 0; s < fixtureStates.length; s++) {
      if (fixtureStates[s] === 'table' || fixtureStates[s] === 'chair') {
        drawRsiFurniture(ctx, 0, s * 32, fixtureStates[s] as any);
      } else {
        drawRsiFixture(ctx, 0, s * 32, fixtureStates[s]);
      }
    }
  } else if (norm.includes('interface') || norm.includes('hud')) {
    // ----------------- GOOB STATION SS14 HUD & INTERFACE RSI -----------------
    const hudStates = [
      'slot_empty',
      'slot_active',
      'intent_help',
      'intent_disarm',
      'intent_grab',
      'intent_harm',
      'health_full',
      'health_damaged',
      'health_critical',
      'oxy_alert',
      'tox_alert',
      'fire_alert',
    ];
    meta = {
      version: 1,
      size: { x: 32, y: 32 },
      states: hudStates.map((s) => ({ name: s, directions: 1 })),
    };

    const out = createOffscreen(32, 32 * hudStates.length);
    canvas = out.canvas;
    ctx = out.ctx;

    for (let s = 0; s < hudStates.length; s++) {
      drawRsiInterfaceElement(ctx, 0, s * 32, hudStates[s]);
    }
  } else {
    // ----------------- GENERAL FURNITURE & OBJECTS RSI -----------------
    meta = {
      version: 1,
      size: { x: 32, y: 32 },
      states: [
        { name: 'table', directions: 1 },
        { name: 'chair', directions: 1 },
        { name: 'canister', directions: 1 },
        { name: 'autolathe', directions: 1 },
      ],
    };

    const out = createOffscreen(32, 32 * 4);
    canvas = out.canvas;
    ctx = out.ctx;

    drawRsiFurniture(ctx, 0, 0, 'table');
    drawRsiFurniture(ctx, 0, 32, 'chair');
    drawRsiFurniture(ctx, 0, 64, 'canister');
    drawRsiFurniture(ctx, 0, 96, 'autolathe');
  }

  const bundle: GeneratedRsiBundle = { meta, canvas };
  generatedRsiCache.set(norm, bundle);
  return bundle;
}
