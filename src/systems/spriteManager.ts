// Unified Sprite Manager for Griefly / Space Station 14 & Goob Station
// Coordinates Goob Station RSI assets (Characters, Clothing, Species, Doors, Structures, Walls)
// and TGStation DMI fallback format

import { SpriteSource, PlayerMob, Direction, WorldObject, TurfType } from '../types';
import { drawDmiFrame, getCachedDmiImage } from './dmiParser';
import { drawRsiFrame, getCachedRsi, drawGoobRsiSprite } from './rsiParser';

/**
 * Universal drawSprite interface matching the Sprite Manager pattern
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  source: SpriteSource,
  x: number,
  y: number,
  options?: { scale?: number; alpha?: number }
): boolean {
  ctx.save();
  if (options?.alpha !== undefined) {
    ctx.globalAlpha = options.alpha;
  }

  const targetSize = options?.scale ? Math.round(32 * options.scale) : 32;
  let drawn = false;

  if (source.format === 'dmi') {
    const img = getCachedDmiImage(source.path);
    drawn = drawDmiFrame(ctx, img, 0, source.dir, x, y, targetSize, targetSize);
  } else if (source.format === 'rsi') {
    const { img, meta } = getCachedRsi(source.path);
    drawn = drawRsiFrame(ctx, img, meta, source.stateName, source.dir, x, y, targetSize, targetSize);
  }

  ctx.restore();
  return drawn;
}

/**
 * Maps player mob direction string ('NORTH', 'SOUTH', 'EAST', 'WEST') to numeric index (0=S, 1=N, 2=E, 3=W)
 */
export function directionToNumeric(dir: Direction): number {
  switch (dir) {
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
 * Draws a fully composite Goob Station Character Mob via RSI layers:
 * Base Species -> Tail/Ears Markings -> Jumpsuit -> Armor -> Boots -> Hair -> Facial Hair -> Headgear -> Handheld
 */
export function drawMobSprite(
  ctx: CanvasRenderingContext2D,
  player: PlayerMob,
  px: number,
  py: number
) {
  const dirNum = directionToNumeric(player.dir);
  const species = (player.species || 'Human').toLowerCase();
  const speciesRsi = `Textures/Mobs/Species/${species}.rsi`;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Lying / Resting mode rotation
  if (player.isLying) {
    ctx.translate(px + 16, py + 16);
    ctx.rotate(Math.PI / 2);
    ctx.translate(-(px + 16), -(py + 16));
  }

  // 1. Base Species Markings (Tails / Wings behind body)
  if (species === 'vulpakanin') {
    drawGoobRsiSprite(ctx, 'Textures/Mobs/Customization/markings.rsi', 'vulp_tail', dirNum, px, py);
  } else if (species === 'tajaran' || species === 'felinid') {
    drawGoobRsiSprite(ctx, 'Textures/Mobs/Customization/markings.rsi', 'cat_tail', dirNum, px, py);
  } else if (species === 'moth') {
    drawGoobRsiSprite(ctx, 'Textures/Mobs/Customization/markings.rsi', 'moth_wings', dirNum, px, py);
  }

  // 2. Base Species Body (Goob Station RSI)
  drawGoobRsiSprite(ctx, speciesRsi, `${species}_torso`, dirNum, px, py);

  // 3. Species Head & Ears
  drawGoobRsiSprite(ctx, speciesRsi, `${species}_head`, dirNum, px, py);
  if (species === 'vulpakanin') {
    drawGoobRsiSprite(ctx, 'Textures/Mobs/Customization/markings.rsi', 'vulp_ears', dirNum, px, py);
  } else if (species === 'tajaran' || species === 'felinid') {
    drawGoobRsiSprite(ctx, 'Textures/Mobs/Customization/markings.rsi', 'cat_ears', dirNum, px, py);
  }

  // 4. Uniform & Clothing RSI
  if (player.inventory.uniform) {
    const uniformType = player.inventory.uniform.type.toLowerCase();
    drawGoobRsiSprite(ctx, 'Textures/Clothing/Uniform/jumpsuits.rsi', uniformType, dirNum, px, py);
  }

  // 5. Suit & Armor RSI
  if (player.inventory.suit) {
    const suitType = player.inventory.suit.type.toLowerCase();
    drawGoobRsiSprite(ctx, 'Textures/Clothing/Suit/suits.rsi', suitType, dirNum, px, py);
  }

  // 6. Shoes / Boots RSI
  if (player.inventory.shoes) {
    const shoeType = player.inventory.shoes.type.toLowerCase();
    drawGoobRsiSprite(ctx, 'Textures/Clothing/Shoes/boots.rsi', shoeType, dirNum, px, py);
  }

  // 7. Gloves
  if (player.inventory.gloves) {
    ctx.fillStyle = player.inventory.gloves.color || '#eab308';
    if (dirNum === 0) {
      ctx.fillRect(px + 7, py + 22, 3, 3);
      ctx.fillRect(px + 22, py + 22, 3, 3);
    }
  }

  // 8. Hair & Facial Hair RSI
  const style = (player.hairstyle || 'crewcut').toLowerCase();
  drawGoobRsiSprite(ctx, 'Textures/Mobs/Customization/hair.rsi', style, dirNum, px, py);

  if (player.facialHair && player.facialHair !== 'Shaved') {
    const facial = player.facialHair.toLowerCase();
    drawGoobRsiSprite(ctx, 'Textures/Mobs/Customization/facial_hair.rsi', facial, dirNum, px, py);
  }

  // 9. Mask & Helmet RSI
  if (player.inventory.mask) {
    const maskType = player.inventory.mask.type.toLowerCase();
    drawGoobRsiSprite(ctx, 'Textures/Clothing/Mask/masks.rsi', maskType, dirNum, px, py);
  }
  if (player.inventory.head) {
    const headType = player.inventory.head.type.toLowerCase();
    drawGoobRsiSprite(ctx, 'Textures/Clothing/Head/headgear.rsi', headType, dirNum, px, py);
  }

  // 10. In-Hand Items
  const leftItem = player.inventory.left_hand;
  const rightItem = player.inventory.right_hand;

  if (leftItem) {
    ctx.fillStyle = leftItem.color || '#38bdf8';
    ctx.fillRect(px + (dirNum === 3 ? 12 : 5), py + 19, 4, 4);
  }
  if (rightItem) {
    ctx.fillStyle = rightItem.color || '#38bdf8';
    ctx.fillRect(px + (dirNum === 2 ? 16 : 23), py + 19, 4, 4);
  }

  ctx.restore();
}

/**
 * Draws structures and doors using authentic Goob Station RSI format
 */
export function drawStructureRsiSprite(
  ctx: CanvasRenderingContext2D,
  obj: WorldObject,
  x: number,
  y: number
): boolean {
  const isDoor = obj.type.includes('Door') || obj.type.includes('Airlock');
  if (isDoor) {
    const isEng = obj.type.includes('Engine');
    const isSec = obj.type.includes('Sec');
    const isMed = obj.type.includes('Med');
    const isGlass = obj.type.includes('Glass');
    const isSci = obj.type.includes('Science');

    const path = isEng
      ? 'Textures/Structures/Doors/Airlocks/engineering.rsi'
      : isSec
      ? 'Textures/Structures/Doors/Airlocks/security.rsi'
      : isMed
      ? 'Textures/Structures/Doors/Airlocks/medical.rsi'
      : isGlass
      ? 'Textures/Structures/Doors/Airlocks/glass.rsi'
      : isSci
      ? 'Textures/Structures/Doors/Airlocks/science.rsi'
      : 'Textures/Structures/Doors/Airlocks/standard.rsi';

    const state = obj.isOpen
      ? 'open'
      : obj.isLocked
      ? 'bolted'
      : obj.welded
      ? 'welded'
      : 'closed';

    return drawGoobRsiSprite(ctx, path, state, 0, x, y);
  }

  // Goob Station Fixtures & Mountings
  if (obj.type === 'ExtinguisherCabinet') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/fixtures.rsi', 'extinguisher_cabinet', 0, x, y);
  }
  if (obj.type === 'Vent') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/fixtures.rsi', 'floor_vent', 0, x, y);
  }
  if (obj.type === 'GasScrubber') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/fixtures.rsi', 'floor_scrubber', 0, x, y);
  }
  if (obj.type === 'WallLight') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/fixtures.rsi', 'wall_light', 0, x, y);
  }
  if (obj.type === 'AirAlarm') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/fixtures.rsi', 'wall_air_alarm', 0, x, y);
  }
  if (obj.type === 'FireAlarm') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/fixtures.rsi', 'wall_fire_alarm', 0, x, y);
  }
  if (obj.type === 'APC') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/fixtures.rsi', 'wall_apc', 0, x, y);
  }
  if (obj.type === 'MedicalSign') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/fixtures.rsi', 'medical_cross_sign', 0, x, y);
  }
  if (obj.type === 'Plant') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/fixtures.rsi', 'potted_plant', 0, x, y);
  }
  if (obj.type === 'Bench') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/fixtures.rsi', 'bench', 0, x, y);
  }
  if (obj.type === 'VendingSoda') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/fixtures.rsi', 'vending_soda', 0, x, y);
  }
  if (obj.type === 'VendingSnack') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/fixtures.rsi', 'vending_snack', 0, x, y);
  }
  if (obj.type === 'WaterCooler') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/fixtures.rsi', 'water_cooler', 0, x, y);
  }
  if (obj.type === 'WallSign') {
    const signName = (obj.name || '').toLowerCase();
    const signState = signName.includes('sec')
      ? 'wall_sign_sec'
      : signName.includes('evac')
      ? 'wall_sign_evac'
      : signName.includes('sci')
      ? 'wall_sign_sci'
      : signName.includes('eng')
      ? 'wall_sign_eng'
      : signName.includes('law')
      ? 'wall_sign_law'
      : signName.includes('smoke')
      ? 'wall_sign_no_smoking'
      : 'wall_sign_walk';
    return drawGoobRsiSprite(ctx, 'Textures/Structures/fixtures.rsi', signState, 0, x, y);
  }

  if (obj.type === 'Table' || obj.type === 'MetalTable') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/Furniture/tables.rsi', 'table', 0, x, y);
  }
  if (obj.type === 'Chair' || obj.type === 'Stool') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/Furniture/chairs.rsi', 'chair', 0, x, y);
  }
  if (obj.type === 'Grille') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/Grilles/grille.rsi', 'grille', 0, x, y);
  }
  if (obj.type === 'FlatGlass') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/Windows/window.rsi', 'window', 0, x, y);
  }
  if (obj.type === 'Autolathe') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/Machines/autolathe.rsi', 'autolathe', 0, x, y);
  }
  if (obj.type.includes('Canister') || obj.type === 'GasTank' || obj.type === 'PlasmaGasTank') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/Atmospherics/canister.rsi', 'canister', 0, x, y);
  }

  return false;
}

/**
 * Draws station walls, windows, and floors using Goob Station RSI format
 */
export function drawTurfRsiSprite(
  ctx: CanvasRenderingContext2D,
  turf: TurfType,
  x: number,
  y: number
): boolean {
  if (turf === 'MetalWall') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/Walls/solid.rsi', 'solid', 0, x, y);
  }
  if (turf === 'ReinforcedWall') {
    return drawGoobRsiSprite(ctx, 'Textures/Structures/Walls/reinforced.rsi', 'reinforced', 0, x, y);
  }
  if (turf === 'Floor' || turf === 'FloorTile') {
    return drawGoobRsiSprite(ctx, 'Textures/Tiles/tiles.rsi', 'floor', 0, x, y);
  }
  if (turf === 'FloorWhite') {
    return drawGoobRsiSprite(ctx, 'Textures/Tiles/tiles.rsi', 'medbay', 0, x, y);
  }
  if (turf === 'FloorCatwalk') {
    return drawGoobRsiSprite(ctx, 'Textures/Tiles/tiles.rsi', 'catwalk', 0, x, y);
  }
  if (turf === 'FloorPlanter') {
    return drawGoobRsiSprite(ctx, 'Textures/Tiles/tiles.rsi', 'planter', 0, x, y);
  }
  if (turf === 'Plating' || turf === 'ReinforcedFloor') {
    return drawGoobRsiSprite(ctx, 'Textures/Tiles/tiles.rsi', 'plating', 0, x, y);
  }
  if (turf === 'FloorBar') {
    return drawGoobRsiSprite(ctx, 'Textures/Tiles/tiles.rsi', 'bar', 0, x, y);
  }
  if (turf === 'FloorFreezer') {
    return drawGoobRsiSprite(ctx, 'Textures/Tiles/tiles.rsi', 'freezer', 0, x, y);
  }
  return false;
}

/**
 * Preload Goob Station RSI assets
 */
export function preloadSpriteAssets() {
  // Preload TGStation DMI files
  const dmiFiles = [
    '/assets/dmi/walls.dmi',
    '/assets/dmi/floors.dmi',
    '/assets/dmi/doors.dmi',
    '/assets/dmi/machinery.dmi',
    '/assets/dmi/items.dmi',
  ];
  dmiFiles.forEach((p) => getCachedDmiImage(p));

  // Preload Goob Station RSI bundles
  const rsiPaths = [
    'Textures/Mobs/Species/human.rsi',
    'Textures/Mobs/Species/vulpakanin.rsi',
    'Textures/Mobs/Species/tajaran.rsi',
    'Textures/Mobs/Species/felinid.rsi',
    'Textures/Mobs/Species/lizard.rsi',
    'Textures/Mobs/Species/moth.rsi',
    'Textures/Mobs/Species/plasmaman.rsi',
    'Textures/Mobs/Species/abductor.rsi',
    'Textures/Mobs/Customization/hair.rsi',
    'Textures/Mobs/Customization/markings.rsi',
    'Textures/Structures/Doors/Airlocks/standard.rsi',
    'Textures/Structures/Doors/Airlocks/engineering.rsi',
    'Textures/Structures/Doors/Airlocks/security.rsi',
    'Textures/Structures/Doors/Airlocks/medical.rsi',
    'Textures/Structures/Walls/solid.rsi',
    'Textures/Structures/Walls/reinforced.rsi',
    'Textures/Structures/Windows/window.rsi',
    'Textures/Structures/Grilles/grille.rsi',
  ];
  rsiPaths.forEach((p) => {
    getCachedRsi(p);
  });
}
