import { Direction, TurfType, StructureType, ItemType, Tile, SpeciesType, SkinTone, Gender, PlayerMob } from '../types';
import { extractDmiMetadataFromBuffer, createImageFromBuffer, parseDmiText, DmiMetadata, DmiStateInfo } from './dmiParser';

export interface LoadedDmi {
  name: string;
  image: HTMLImageElement;
  metadata: DmiMetadata;
  ready: boolean;
  source: 'tgstation' | 'paradise' | 'local';
  sourceUrl: string;
}

// In-memory cache for loaded DMI assets
const dmiCache = new Map<string, LoadedDmi>();
const pendingLoads = new Map<string, Promise<LoadedDmi | null>>();

// Asset source setting: 'tgstation' references tgstation & paradise GitHub master icons, 'local' uses bundled Griefly icons
let currentAssetSource: 'tgstation' | 'local' = 'tgstation';

export function getAssetSource(): 'tgstation' | 'local' {
  return currentAssetSource;
}

export function setAssetSource(source: 'tgstation' | 'local') {
  currentAssetSource = source;
  // Flush cache and reload
  dmiCache.clear();
  preloadCommonDmis();
}

/**
 * Mapping table from Griefly / SS13 DMI names to their exact paths in
 * https://github.com/tgstation/tgstation/tree/master/icons
 */
export const TGSTATION_ICON_PATHS: Record<string, string> = {
  // Turfs
  'floors.dmi': 'turf/floors.dmi',
  'walls.dmi': 'turf/walls.dmi',
  'space.dmi': 'turf/space.dmi',
  'catwalk.dmi': 'obj/smooth_structures/catwalk.dmi',
  'reinforced_wall.dmi': 'turf/walls/reinforced_wall.dmi',

  // Doors / Airlocks
  'Doorsec.dmi': 'obj/doors/airlocks/station/security.dmi',
  'Doorcom.dmi': 'obj/doors/airlocks/station/command.dmi',
  'Dooreng.dmi': 'obj/doors/airlocks/station/engineering.dmi',
  'Doorext.dmi': 'obj/doors/airlocks/external/external.dmi',
  'Doorfire.dmi': 'obj/doors/airlocks/public/glass.dmi',
  'Doorglass.dmi': 'obj/doors/airlocks/public/glass.dmi',
  'Doormaint.dmi': 'obj/doors/airlocks/station/maintenance.dmi',
  'doormed.dmi': 'obj/doors/airlocks/station/medical.dmi',
  'Doorsecglass.dmi': 'obj/doors/airlocks/station/security.dmi',
  'windoor.dmi': 'obj/doors/windoor.dmi',

  // Structures & Machinery
  'closet.dmi': 'obj/storage/closet.dmi',
  'structures.dmi': 'obj/structures.dmi',
  'metaltables.dmi': 'obj/smooth_structures/table.dmi',
  'tables.dmi': 'obj/smooth_structures/table.dmi',
  'chairs.dmi': 'obj/chairs.dmi',
  'bed.dmi': 'obj/bed.dmi',
  'watercloset.dmi': 'obj/watercloset.dmi',
  'computer.dmi': 'obj/machines/computer.dmi',
  'tank.dmi': 'obj/canisters.dmi',
  'canisters.dmi': 'obj/canisters.dmi',
  'pipes.dmi': 'obj/pipes_n_cables/simple.dmi',
  'pipe_vent.dmi': 'obj/machines/atmospherics/unary_devices.dmi',
  'unary_devices.dmi': 'obj/machines/atmospherics/unary_devices.dmi',
  'binary_devices.dmi': 'obj/machines/atmospherics/binary_devices.dmi',
  'wallmounts.dmi': 'obj/wallmounts.dmi',
  'machines_wallmounts.dmi': 'obj/machines/wallmounts.dmi',
  'vending.dmi': 'obj/machines/vending.dmi',
  'lathes.dmi': 'obj/machines/lathes.dmi',
  'solar.dmi': 'obj/machines/solar.dmi',
  'signs.dmi': 'obj/signs.dmi',
  'lighting.dmi': 'obj/lighting.dmi',
  'plants.dmi': 'obj/fluff/flora/plants.dmi',

  // Items & Devices
  'items.dmi': 'obj/tools.dmi',
  'tools.dmi': 'obj/tools.dmi',
  'devices_tool.dmi': 'obj/devices/tool.dmi',
  'stack_objects.dmi': 'obj/stack_objects.dmi',
  'stack_medical.dmi': 'obj/medical/stack_medical.dmi',
  'scanner.dmi': 'obj/devices/scanner.dmi',
  'janitor.dmi': 'obj/service/janitor.dmi',
  'horn.dmi': 'obj/art/horn.dmi',
  'harvest.dmi': 'obj/service/hydroponics/harvest.dmi',
  'card.dmi': 'obj/card.dmi',
  'backpack.dmi': 'obj/storage/backpack.dmi',
  'tiles.dmi': 'obj/tiles.dmi',
  'debris.dmi': 'obj/debris.dmi',
  'shards.dmi': 'obj/debris.dmi',
  'drinks.dmi': 'obj/drinks/drinks.dmi',
  'food.dmi': 'obj/food/food.dmi',
  'chemical.dmi': 'obj/medical/chemical.dmi',
  'device.dmi': 'obj/devices/scanner.dmi',

  // Weapons & Guns
  'guns.dmi': 'obj/weapons/guns/ballistic.dmi',
  'ballistic.dmi': 'obj/weapons/guns/ballistic.dmi',
  'energy.dmi': 'obj/weapons/guns/energy.dmi',
  'ammo.dmi': 'obj/weapons/guns/ammo.dmi',
  'stabby.dmi': 'obj/weapons/stabby.dmi',
  'baton.dmi': 'obj/weapons/baton.dmi',
  'projectiles.dmi': 'obj/weapons/guns/projectiles.dmi',

  // Mobs & Clothing
  'human.dmi': 'mob/human/human.dmi',
  'uniform.dmi': 'obj/clothing/under/civilian.dmi',
  'uniforms.dmi': 'obj/clothing/under/color.dmi',
  'under_civilian.dmi': 'obj/clothing/under/civilian.dmi',
  'under_costume.dmi': 'obj/clothing/under/costume.dmi',
  'under_engineering.dmi': 'obj/clothing/under/engineering.dmi',
  'under_medical.dmi': 'obj/clothing/under/medical.dmi',
  'under_security.dmi': 'obj/clothing/under/security.dmi',
  'under_captain.dmi': 'obj/clothing/under/captain.dmi',
  'suit.dmi': 'obj/clothing/suits/armor.dmi',
  'suits.dmi': 'obj/clothing/suits/armor.dmi',
  'armor_suit.dmi': 'obj/clothing/suits/armor.dmi',
  'spacesuit.dmi': 'obj/clothing/suits/spacesuit.dmi',
  'utility_suit.dmi': 'obj/clothing/suits/utility.dmi',
  'bio_suit.dmi': 'obj/clothing/suits/bio.dmi',
  'labcoat.dmi': 'obj/clothing/suits/labcoat.dmi',
  'hats.dmi': 'obj/clothing/head/hats.dmi',
  'head.dmi': 'obj/clothing/head/helmet.dmi',
  'helmet.dmi': 'obj/clothing/head/helmet.dmi',
  'beret.dmi': 'obj/clothing/head/beret.dmi',
  'utility_head.dmi': 'obj/clothing/head/utility.dmi',
  'mask.dmi': 'obj/clothing/masks.dmi',
  'masks.dmi': 'obj/clothing/masks.dmi',
  'shoes.dmi': 'obj/clothing/shoes.dmi',
  'feet.dmi': 'obj/clothing/shoes.dmi',
  'back.dmi': 'obj/storage/backpack.dmi',
  'items_lefthand.dmi': 'mob/inhands/equipment/tools_lefthand.dmi',
  'items_righthand.dmi': 'mob/inhands/equipment/tools_righthand.dmi',

  // UI / HUD (SS13 Midnight UI)
  'screen_midnight.dmi': 'hud/screen_midnight.dmi',
  'screen1.dmi': 'hud/screen_midnight.dmi',
  'screen_retro.dmi': 'hud/screen_midnight.dmi',

  // Effects & Projectiles
  'blood.dmi': 'effects/blood.dmi',
  'fire.dmi': 'effects/fire.dmi',
  'dam_human.dmi': 'mob/effects/dam_mob.dmi',
  'dam_mob.dmi': 'mob/effects/dam_mob.dmi',
  'decals.dmi': 'turf/decals.dmi',
  'atmos.dmi': 'obj/machines/atmospherics/unary_devices.dmi',
};

/**
 * Mapping table for Paradise SS13 species and accessories:
 * https://github.com/ParadiseSS13/Paradise/tree/master/icons
 * Used for Tajaran, Vulpakanin, mutant markings, tails, and ears.
 */
export const PARADISE_ICON_PATHS: Record<string, string> = {
  // Species base bodies
  'r_tajaran.dmi': 'mob/human_races/r_tajaran.dmi',
  'r_vulpkanin.dmi': 'mob/human_races/r_vulpkanin.dmi',
  'r_lizard.dmi': 'mob/human_races/r_lizard.dmi',
  'r_skrell.dmi': 'mob/human_races/r_skrell.dmi',
  'r_diona.dmi': 'mob/human_races/r_diona.dmi',
  'r_kidan.dmi': 'mob/human_races/r_kidan.dmi',
  'r_slime.dmi': 'mob/human_races/r_slime.dmi',
  'r_human.dmi': 'mob/human_races/r_human.dmi',

  // Sprite accessories (tails, markings, ears)
  'tajaran_tail_markings.dmi': 'mob/sprite_accessories/tajaran/tajaran_tail_markings.dmi',
  'tajaran_head_accessories.dmi': 'mob/sprite_accessories/tajaran/tajaran_head_accessories.dmi',
  'tajaran_hair.dmi': 'mob/sprite_accessories/tajaran/tajaran_hair.dmi',
  'vulpkanin_tail_markings.dmi': 'mob/sprite_accessories/vulpkanin/vulpkanin_tail_markings.dmi',
  'vulpkanin_head_markings.dmi': 'mob/sprite_accessories/vulpkanin/vulpkanin_head_markings.dmi',
  'vulpkanin_hair.dmi': 'mob/sprite_accessories/vulpkanin/vulpkanin_hair.dmi',
  'body_accessory.dmi': 'mob/body_accessory.dmi',

  // Species-specific clothing & suits
  'tajaran_suit.dmi': 'mob/clothing/species/tajaran/suit.dmi',
  'tajaran_helmet.dmi': 'mob/clothing/species/tajaran/helmet.dmi',
  'tajaran_mask.dmi': 'mob/clothing/species/tajaran/mask.dmi',
  'tajaran_head.dmi': 'mob/clothing/species/tajaran/head.dmi',
  'vulpkanin_suit.dmi': 'mob/clothing/species/vulpkanin/suit.dmi',
  'vulpkanin_helmet.dmi': 'mob/clothing/species/vulpkanin/helmet.dmi',
  'vulpkanin_mask.dmi': 'mob/clothing/species/vulpkanin/mask.dmi',
  'vulpkanin_head.dmi': 'mob/clothing/species/vulpkanin/head.dmi',
};

// Listeners for load completion so canvas & UI can request redraw
type RedrawListener = () => void;
const redrawListeners = new Set<RedrawListener>();

export function addDmiRedrawListener(listener: RedrawListener) {
  redrawListeners.add(listener);
  return () => {
    redrawListeners.delete(listener);
  };
}

function notifyRedraw() {
  for (const listener of redrawListeners) {
    try {
      listener();
    } catch {
      // Ignore listener error
    }
  }
}

/**
 * Loads a DMI sprite sheet and its metadata.
 * First tries TGStation repository/CDN if enabled, then smoothly falls back to local /icons/.
 */
export async function loadDmi(dmiFileName: string): Promise<LoadedDmi | null> {
  const cleanName = dmiFileName.replace(/\.png$/, '');
  const altKey = cleanName.endsWith('.dmi') ? cleanName.replace(/\.dmi$/, '') : `${cleanName}.dmi`;

  if (dmiCache.has(cleanName)) {
    return dmiCache.get(cleanName)!;
  }
  if (dmiCache.has(altKey)) {
    return dmiCache.get(altKey)!;
  }

  if (pendingLoads.has(cleanName)) {
    return pendingLoads.get(cleanName)!;
  }
  if (pendingLoads.has(altKey)) {
    return pendingLoads.get(altKey)!;
  }

  const loadPromise = (async (): Promise<LoadedDmi | null> => {
    // 1. First priority: Check local /icons/ folder (all authentic TGStation & Paradise textures)
    try {
      let metadata: DmiMetadata | null = null;
      let img: HTMLImageElement | null = null;

      const baseName = cleanName.replace(/\.dmi$/, '');
      const jsonUrls = [
        `/icons/${cleanName}.json`,
        `/icons/${baseName}.json`,
        `/icons/${baseName}.dmi.json`,
      ];

      for (const jUrl of jsonUrls) {
        const metaRes = await fetch(jUrl).catch(() => null);
        if (metaRes && metaRes.ok) {
          const rawJson = await metaRes.json();
          const stateMap = new Map<string, DmiStateInfo>();
          let currentPos = 0;
          const states: DmiStateInfo[] = (rawJson.states || []).map((s: any) => {
            const item: DmiStateInfo = {
              state: s.state,
              dirs: s.dirs || 1,
              frames: s.frames || 1,
              delay: s.delay,
              movement: s.movement || 0,
              rewind: s.rewind || 0,
              first_frame_pos: currentPos,
            };
            currentPos += item.frames * item.dirs;
            if (!stateMap.has(item.state)) {
              stateMap.set(item.state, item);
            }
            return item;
          });

          metadata = {
            info: rawJson.info || { width: 32, height: 32, version: 4.0 },
            states,
            stateMap,
          };
          break;
        }
      }

      // Fetch the binary .dmi file or .png image
      const dmiUrls = [
        `/icons/${baseName}.dmi`,
        `/icons/${cleanName}`,
        `/icons/${baseName}.dmi.png`,
        `/icons/${baseName}.png`,
      ];

      for (const dUrl of dmiUrls) {
        const dmiRes = await fetch(dUrl).catch(() => null);
        if (dmiRes && dmiRes.ok) {
          const arrayBuf = await dmiRes.arrayBuffer();
          if (!metadata) {
            metadata = await extractDmiMetadataFromBuffer(arrayBuf);
          }
          img = await createImageFromBuffer(arrayBuf);
          if (img && metadata && metadata.states.length > 0) {
            const loaded: LoadedDmi = {
              name: cleanName,
              image: img,
              metadata,
              ready: true,
              source: 'tgstation',
              sourceUrl: dUrl,
            };
            dmiCache.set(cleanName, loaded);
            dmiCache.set(altKey, loaded);
            notifyRedraw();
            return loaded;
          }
        }
      }
    } catch {
      // Fall through to remote repositories
    }

    // 2. Try remote repositories (TGStation & Paradise Station)
    // Check if this is a Paradise SS13 asset (Tajaran, Vulpakanin, mutant features)
    const paradiseSubpath = PARADISE_ICON_PATHS[cleanName] || PARADISE_ICON_PATHS[`${cleanName}.dmi`];
    if (paradiseSubpath) {
      try {
        const cdnUrl = `https://cdn.jsdelivr.net/gh/ParadiseSS13/Paradise@master/icons/${paradiseSubpath}`;
        const fallbackRawUrl = `https://raw.githubusercontent.com/ParadiseSS13/Paradise/master/icons/${paradiseSubpath}`;
        let res = await fetch(cdnUrl, { mode: 'cors' }).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(fallbackRawUrl, { mode: 'cors' }).catch(() => null);
        }
        if (res && res.ok) {
          const arrayBuf = await res.arrayBuffer();
          const metadata = await extractDmiMetadataFromBuffer(arrayBuf);
          if (metadata && metadata.states.length > 0) {
            const img = await createImageFromBuffer(arrayBuf);
            const loaded: LoadedDmi = {
              name: cleanName,
              image: img,
              metadata,
              ready: true,
              source: 'paradise',
              sourceUrl: cdnUrl,
            };
            dmiCache.set(cleanName, loaded);
            dmiCache.set(altKey, loaded);
            notifyRedraw();
            return loaded;
          }
        }
      } catch {
        // Fall through
      }
    }

    // Check standard TGStation repository
    const tgSubpath = TGSTATION_ICON_PATHS[cleanName] || TGSTATION_ICON_PATHS[`${cleanName}.dmi`];
    if (tgSubpath) {
      try {
        const cdnUrl = `https://cdn.jsdelivr.net/gh/tgstation/tgstation@master/icons/${tgSubpath}`;
        const fallbackRawUrl = `https://raw.githubusercontent.com/tgstation/tgstation/master/icons/${tgSubpath}`;
        let res = await fetch(cdnUrl, { mode: 'cors' }).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(fallbackRawUrl, { mode: 'cors' }).catch(() => null);
        }
        if (res && res.ok) {
          const arrayBuf = await res.arrayBuffer();
          const metadata = await extractDmiMetadataFromBuffer(arrayBuf);
          if (metadata && metadata.states.length > 0) {
            const img = await createImageFromBuffer(arrayBuf);
            const loaded: LoadedDmi = {
              name: cleanName,
              image: img,
              metadata,
              ready: true,
              source: 'tgstation',
              sourceUrl: cdnUrl,
            };
            dmiCache.set(cleanName, loaded);
            dmiCache.set(altKey, loaded);
            notifyRedraw();
            return loaded;
          }
        }
      } catch {
        // Fall through
      }
    }

    return null;
  })();

  pendingLoads.set(cleanName, loadPromise);
  try {
    const res = await loadPromise;
    return res;
  } finally {
    pendingLoads.delete(cleanName);
  }
}

/**
 * Preloads standard Space Station 13 / Griefly DMI assets
 */
export function preloadCommonDmis() {
  const common = [
    // Turfs
    'floors.dmi',
    'walls.dmi',
    'space.dmi',
    'catwalk.dmi',
    'reinforced_wall.dmi',
    'tiles.dmi',
    'debris.dmi',

    // Doors / Airlocks
    'Doorsec.dmi',
    'Doorcom.dmi',
    'Dooreng.dmi',
    'Doorext.dmi',
    'Doorfire.dmi',
    'Doorglass.dmi',
    'Doormaint.dmi',
    'doormed.dmi',
    'windoor.dmi',

    // Mobs & Body Layers
    'human.dmi',
    'objects.dmi',
    'structures.dmi',
    'dam_mob.dmi',
    'dam_human.dmi',

    // Structures & Machinery
    'chairs.dmi',
    'bed.dmi',
    'watercloset.dmi',
    'canisters.dmi',
    'vending.dmi',
    'lathes.dmi',
    'solar.dmi',
    'signs.dmi',
    'lighting.dmi',
    'plants.dmi',
    'wallmounts.dmi',
    'machines_wallmounts.dmi',
    'unary_devices.dmi',
    'binary_devices.dmi',
    'pipes.dmi',
    'closet.dmi',
    'computer.dmi',
    'tank.dmi',

    // Items & Tools
    'tools.dmi',
    'items.dmi',
    'stack_objects.dmi',
    'stack_medical.dmi',
    'scanner.dmi',
    'device.dmi',
    'janitor.dmi',
    'horn.dmi',
    'harvest.dmi',
    'card.dmi',
    'backpack.dmi',
    'back.dmi',
    'drinks.dmi',
    'food.dmi',
    'chemical.dmi',
    'shards.dmi',

    // Weapons
    'ballistic.dmi',
    'energy.dmi',
    'ammo.dmi',
    'stabby.dmi',
    'baton.dmi',
    'guns.dmi',
    'projectiles.dmi',

    // Clothing & Uniforms
    'beret.dmi',
    'utility_head.dmi',
    'utility_suit.dmi',
    'spacesuit.dmi',
    'bio_suit.dmi',
    'under_civilian.dmi',
    'under_costume.dmi',
    'under_engineering.dmi',
    'under_medical.dmi',
    'under_security.dmi',
    'under_captain.dmi',
    'uniform.dmi',
    'uniforms.dmi',
    'suit.dmi',
    'suits.dmi',
    'hats.dmi',
    'head.dmi',
    'mask.dmi',
    'masks.dmi',
    'shoes.dmi',
    'feet.dmi',
    'items_lefthand.dmi',
    'items_righthand.dmi',

    // Paradise SS13 species (Tajaran & Vulpakanin) and accessories
    'r_tajaran.dmi',
    'r_vulpkanin.dmi',
    'tajaran_tail_markings.dmi',
    'tajaran_head_accessories.dmi',
    'vulpkanin_tail_markings.dmi',
    'vulpkanin_head_markings.dmi',
    'body_accessory.dmi',

    // UI & Effects
    'screen_midnight.dmi',
    'blood.dmi',
    'fire.dmi',
  ];

  for (const name of common) {
    loadDmi(name);
  }
}

/**
 * Gets DMI asset cache stats (number loaded, active source, list of sheets)
 */
export function getDmiAssetStats(): {
  source: 'tgstation' | 'local';
  totalLoaded: number;
  totalCached: number;
  sheets: { name: string; statesCount: number; source: string }[];
} {
  const sheets: { name: string; statesCount: number; source: string }[] = [];
  for (const [name, loaded] of dmiCache.entries()) {
    sheets.push({
      name,
      statesCount: loaded.metadata.states.length,
      source: loaded.source,
    });
  }
  return {
    source: currentAssetSource,
    totalLoaded: sheets.length,
    totalCached: dmiCache.size,
    sheets,
  };
}

/**
 * Direction shift in TGStation BYOND DMI:
 * SOUTH = 0, NORTH = 1, EAST = 2, WEST = 3
 */
export function getByondDirShift(dir: Direction = 'SOUTH'): number {
  switch (dir) {
    case 'SOUTH':
      return 0;
    case 'NORTH':
      return 1;
    case 'EAST':
      return 2;
    case 'WEST':
      return 3;
    default:
      return 0;
  }
}

/**
 * Draws a sprite from a loaded DMI sheet onto Canvas.
 */
export function drawDmiSprite(
  ctx: CanvasRenderingContext2D,
  dmiFile: string,
  stateName: string,
  destX: number,
  destY: number,
  options?: {
    dir?: Direction;
    frame?: number;
    destW?: number;
    destH?: number;
    alpha?: number;
    tintColor?: string;
  }
): boolean {
  const cleanName = dmiFile.replace(/\.png$/, '');
  const altKey = cleanName.endsWith('.dmi') ? cleanName.replace(/\.dmi$/, '') : `${cleanName}.dmi`;
  let loaded = dmiCache.get(cleanName) || dmiCache.get(altKey);

  if (!loaded || !loaded.ready) {
    loadDmi(cleanName);
    return false;
  }

  const meta = loaded.metadata;
  let state = meta.stateMap.get(stateName);
  if (!state) {
    state = meta.stateMap.get('') || meta.states[0];
    if (!state) return false;
  }

  const tileW = meta.info.width || 32;
  const tileH = meta.info.height || 32;

  const dirs = state.dirs || 1;
  const frames = state.frames || 1;
  const dirShift = dirs === 4 ? getByondDirShift(options?.dir || 'SOUTH') : 0;
  const frameIdx = options?.frame !== undefined ? Math.floor(options.frame) % frames : 0;

  const spriteIdx = (state.first_frame_pos || 0) + frameIdx * dirs + dirShift;

  const cols = Math.max(1, Math.floor(loaded.image.width / tileW));
  const srcCol = spriteIdx % cols;
  const srcRow = Math.floor(spriteIdx / cols);

  const srcX = srcCol * tileW;
  const srcY = srcRow * tileH;

  const destW = options?.destW || tileW;
  const destH = options?.destH || tileH;

  if (options?.alpha !== undefined && options.alpha < 1) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, options.alpha);
    ctx.drawImage(loaded.image, srcX, srcY, tileW, tileH, destX, destY, destW, destH);
    ctx.restore();
  } else {
    ctx.drawImage(loaded.image, srcX, srcY, tileW, tileH, destX, destY, destW, destH);
  }

  return true;
}

/**
 * Calculate the 4-bit autotiling connection mask for walls.
 * Returns a number 0..15 corresponding to connected directions:
 * NORTH: +1, SOUTH: +2, EAST: +4, WEST: +8.
 */
export function getWallAutotileMask(map: Tile[][], x: number, y: number, wallTurf: TurfType): number {
  let mask = 0;
  const height = map.length;
  const width = map[0]?.length || 0;

  if (y > 0 && isWallTurf(map[y - 1][x].turf)) mask |= 1;
  if (y < height - 1 && isWallTurf(map[y + 1][x].turf)) mask |= 2;
  if (x < width - 1 && isWallTurf(map[y][x + 1].turf)) mask |= 4;
  if (x > 0 && isWallTurf(map[y][x - 1].turf)) mask |= 8;

  return mask;
}

function isWallTurf(turf: TurfType): boolean {
  return turf === 'MetalWall' || turf === 'ReinforcedWall';
}

/**
 * Mapping table from TurfType to DMI file and state
 */
export function getTurfDmiInfo(
  turf: TurfType,
  map: Tile[][],
  x: number,
  y: number
): { dmi: string; state: string } {
  switch (turf) {
    case 'Space': {
      const tileNum = 1 + (((x * 13 + y * 29) % 25 + 25) % 25);
      return { dmi: 'space.dmi', state: String(tileNum) };
    }
    case 'Floor':
      return { dmi: 'floors.dmi', state: 'floor' };
    case 'FloorTile':
      return { dmi: 'floors.dmi', state: 'cafeteria' };
    case 'FloorBar':
      return { dmi: 'floors.dmi', state: 'bar' };
    case 'FloorCafeteria':
      return { dmi: 'floors.dmi', state: 'cafeteria' };
    case 'FloorFreezer':
      return { dmi: 'floors.dmi', state: 'white' };
    case 'FloorWhite':
      return { dmi: 'floors.dmi', state: 'white' };
    case 'FloorCatwalk':
      return { dmi: 'catwalk.dmi', state: 'catwalk-0' };
    case 'FloorPlanter':
      return { dmi: 'floors.dmi', state: 'grass0' };
    case 'ReinforcedFloor':
      return { dmi: 'floors.dmi', state: 'reinforced_hull' };
    case 'Plating':
      return { dmi: 'floors.dmi', state: 'plating' };
    case 'MetalWall': {
      const mask = getWallAutotileMask(map, x, y, turf);
      return { dmi: 'walls.dmi', state: `iron${mask}` };
    }
    case 'ReinforcedWall': {
      const mask = getWallAutotileMask(map, x, y, turf);
      return { dmi: 'reinforced_wall.dmi', state: `reinforced_wall-${mask}` };
    }
    default:
      return { dmi: 'floors.dmi', state: 'floor' };
  }
}

/**
 * Mapping from StructureType to DMI file and state
 */
export function getStructureDmiInfo(
  type: StructureType,
  isOpen?: boolean,
  welded?: boolean,
  isLocked?: boolean,
  animFrame?: number
): { dmi: string; state: string; frame?: number } {
  switch (type) {
    case 'SecurityDoor': {
      const dmi = 'Doorsec.dmi';
      if (welded) return { dmi, state: 'welded' };
      if (isLocked) return { dmi, state: 'door_locked' };
      if (animFrame !== undefined && animFrame >= 0 && animFrame < 6) {
        return { dmi, state: isOpen ? 'door_opening' : 'door_closing', frame: animFrame };
      }
      return { dmi, state: isOpen ? 'door_open' : 'door_closed' };
    }
    case 'GlassDoor': {
      const dmi = 'Doorglass.dmi';
      if (welded) return { dmi, state: 'welded' };
      if (animFrame !== undefined && animFrame >= 0 && animFrame < 6) {
        return { dmi, state: isOpen ? 'door_opening' : 'door_closing', frame: animFrame };
      }
      return { dmi, state: isOpen ? 'door_open' : 'door_closed' };
    }
    case 'MaintenanceDoor':
    case 'Door': {
      const dmi = 'Doormaint.dmi';
      if (welded) return { dmi, state: 'welded' };
      if (animFrame !== undefined && animFrame >= 0 && animFrame < 6) {
        return { dmi, state: isOpen ? 'door_opening' : 'door_closing', frame: animFrame };
      }
      return { dmi, state: isOpen ? 'door_open' : 'door_closed' };
    }
    case 'ExternalDoor': {
      const dmi = 'Doorext.dmi';
      if (welded) return { dmi, state: 'welded' };
      if (animFrame !== undefined && animFrame >= 0 && animFrame < 6) {
        return { dmi, state: isOpen ? 'door_opening' : 'door_closing', frame: animFrame };
      }
      return { dmi, state: isOpen ? 'door_open' : 'door_closed' };
    }
    case 'Table':
    case 'MetalTable':
      return { dmi: 'structures.dmi', state: 'table' };
    case 'Chair':
      return { dmi: 'chairs.dmi', state: 'chair' };
    case 'Stool':
      return { dmi: 'chairs.dmi', state: 'stool' };
    case 'Bench':
      return { dmi: 'chairs.dmi', state: 'chair_greyscale' };
    case 'Bed':
      return { dmi: 'bed.dmi', state: 'rollerbed' };
    case 'Closet':
      return { dmi: 'closet.dmi', state: isOpen ? 'open' : 'closed' };
    case 'SecurityLocker':
      return { dmi: 'closet.dmi', state: isOpen ? 'bio_securityopen' : 'bio_security' };
    case 'Computer':
      return { dmi: 'computer.dmi', state: 'arcade' };
    case 'Grille':
      return { dmi: 'structures.dmi', state: 'grille' };
    case 'Girder':
      return { dmi: 'structures.dmi', state: 'girder' };
    case 'FlatGlass':
      return { dmi: 'structures.dmi', state: 'window' };
    case 'WaterTank':
      return { dmi: 'watercloset.dmi', state: 'sink' };
    case 'WaterCooler':
      return { dmi: 'watercloset.dmi', state: 'shower' };
    case 'FuelTank':
      return { dmi: 'canisters.dmi', state: 'emergency' };
    case 'GasTank':
      return { dmi: 'canisters.dmi', state: 'oxygen' };
    case 'PlasmaGasTank':
      return { dmi: 'canisters.dmi', state: 'plasma' };
    case 'CanisterO2':
      return { dmi: 'canisters.dmi', state: 'oxygen' };
    case 'CanisterPlasma':
      return { dmi: 'canisters.dmi', state: 'plasma' };
    case 'CanisterN2':
      return { dmi: 'canisters.dmi', state: 'generic' };
    case 'APC':
      return { dmi: 'machines_wallmounts.dmi', state: 'apc0' };
    case 'AirAlarm':
      return { dmi: 'machines_wallmounts.dmi', state: 'alarm0' };
    case 'FireAlarm':
      return { dmi: 'machines_wallmounts.dmi', state: 'alarm1' };
    case 'WallLight':
      return { dmi: 'lighting.dmi', state: 'tube' };
    case 'ExtinguisherCabinet':
      return { dmi: 'wallmounts.dmi', state: 'extinguisher_default' };
    case 'VendingSoda':
      return { dmi: 'vending.dmi', state: 'soda' };
    case 'VendingSnack':
      return { dmi: 'vending.dmi', state: 'snack' };
    case 'Autolathe':
      return { dmi: 'lathes.dmi', state: 'autolathe' };
    case 'SolarPanel':
      return { dmi: 'solar.dmi', state: 'solar_panel_glass' };
    case 'WallSign':
    case 'MedicalSign':
      return { dmi: 'signs.dmi', state: 'medbay' };
    case 'Plant':
      return { dmi: 'plants.dmi', state: 'plant-01' };
    case 'Vent':
      return { dmi: 'unary_devices.dmi', state: 'vent_map-2' };
    case 'GasScrubber':
      return { dmi: 'unary_devices.dmi', state: 'scrub_map-2' };
    case 'GasPumpStation':
      return { dmi: 'binary_devices.dmi', state: 'mvalve_off-1' };
    case 'PipePump':
    case 'Pipe':
      return { dmi: 'pipes.dmi', state: 'pipe-0' };
    case 'PressureIndicator':
      return { dmi: 'machines_wallmounts.dmi', state: 'gsensor0' };
    default:
      return { dmi: 'chairs.dmi', state: 'chair' };
  }
}

/**
 * Mapping from ItemType to DMI file and state
 */
export function getItemDmiInfo(type: ItemType): { dmi: string; state: string } {
  switch (type) {
    case 'Crowbar':
      return { dmi: 'tools.dmi', state: 'crowbar' };
    case 'Wrench':
      return { dmi: 'tools.dmi', state: 'wrench' };
    case 'Screwdriver':
      return { dmi: 'tools.dmi', state: 'screwdriver' };
    case 'Weldingtool':
      return { dmi: 'tools.dmi', state: 'welder' };
    case 'Wirecutters':
      return { dmi: 'tools.dmi', state: 'cutters' };
    case 'Extinguisher':
      return { dmi: 'tools.dmi', state: 'fire_extinguisher1' };
    case 'HealthAnalyzer':
      return { dmi: 'scanner.dmi', state: 'health' };
    case 'AtmosTool':
      return { dmi: 'tools.dmi', state: 'multitool' };
    case 'Gun':
    case 'Revolver':
      return { dmi: 'ballistic.dmi', state: 'revolver' };
    case 'Shotgun':
      return { dmi: 'ballistic.dmi', state: 'shotgun' };
    case 'LaserGun':
      return { dmi: 'energy.dmi', state: 'laser' };
    case 'Taser':
      return { dmi: 'energy.dmi', state: 'taser' };
    case 'Disabler':
      return { dmi: 'energy.dmi', state: 'energy_disable' };
    case 'CombatKnife':
      return { dmi: 'stabby.dmi', state: 'survivalknife' };
    case 'StunBaton':
      return { dmi: 'baton.dmi', state: 'stunbaton' };
    case 'AmmunitionBox':
      return { dmi: 'ammo.dmi', state: '9mmbox' };
    case 'Bullet':
      return { dmi: 'ammo.dmi', state: '.50mag-ammo' };
    case 'Beer':
      return { dmi: 'drinks.dmi', state: 'beer' };
    case 'Vodka':
      return { dmi: 'drinks.dmi', state: 'vodkabottle' };
    case 'Tea':
      return { dmi: 'drinks.dmi', state: 'tea' };
    case 'GasMask':
      return { dmi: 'masks.dmi', state: 'gas_mask' };
    case 'SterileMask':
      return { dmi: 'masks.dmi', state: 'sterile' };
    case 'MimeMask':
      return { dmi: 'masks.dmi', state: 'mime' };
    case 'Helmet':
      return { dmi: 'hats.dmi', state: 'helmet' };
    case 'Tophat':
      return { dmi: 'hats.dmi', state: 'tophat' };
    case 'CaptainCap':
      return { dmi: 'hats.dmi', state: 'captain' };
    case 'Hardhat':
      return { dmi: 'utility_head.dmi', state: 'hardhat0_yellow' };
    case 'WeldingMask':
      return { dmi: 'masks.dmi', state: 'weldingmask' };
    case 'Beret':
      return { dmi: 'beret.dmi', state: 'beret' };
    case 'ChefHat':
      return { dmi: 'hats.dmi', state: 'tophat' };
    case 'Armor':
      return { dmi: 'suits.dmi', state: 'armor' };
    case 'SpaceSuit':
      return { dmi: 'spacesuit.dmi', state: 'space' };
    case 'FireSuit':
      return { dmi: 'utility_suit.dmi', state: 'fire' };
    case 'BioSuit':
      return { dmi: 'bio_suit.dmi', state: 'bio' };
    case 'SecurityHardsuit':
      return { dmi: 'spacesuit.dmi', state: 'syndicate' };
    case 'PlasmamanSuit':
      return { dmi: 'spacesuit.dmi', state: 'plasmaman_suit' };
    case 'PlasmamanHelmet':
      return { dmi: 'hats.dmi', state: 'helmet' };
    case 'Labcoat':
      return { dmi: 'suits.dmi', state: 'labcoat' };
    case 'ClownUniform':
      return { dmi: 'under_civilian.dmi', state: 'clown' };
    case 'ClownBoots':
      return { dmi: 'shoes.dmi', state: 'clown' };
    case 'BarmanUniform':
      return { dmi: 'under_civilian.dmi', state: 'purplebartender' };
    case 'JanitorUniform':
      return { dmi: 'under_civilian.dmi', state: 'janitor' };
    case 'MedicalUniform':
      return { dmi: 'under_medical.dmi', state: 'medical' };
    case 'EngineUniform':
      return { dmi: 'under_engineering.dmi', state: 'engine' };
    case 'AssistantUniform':
      return { dmi: 'uniforms.dmi', state: 'grey' };
    case 'SecurityUniform':
      return { dmi: 'under_security.dmi', state: 'security' };
    case 'CaptainUniform':
      return { dmi: 'under_captain.dmi', state: 'captain' };
    case 'MimeUniform':
      return { dmi: 'under_civilian.dmi', state: 'mime' };
    case 'BlackBoots':
      return { dmi: 'shoes.dmi', state: 'boots' };
    case 'WhiteShoes':
      return { dmi: 'shoes.dmi', state: 'white' };
    case 'Galoshes':
      return { dmi: 'shoes.dmi', state: 'galoshes' };
    case 'Magboots':
      return { dmi: 'shoes.dmi', state: 'magboots0' };
    case 'Backpack':
      return { dmi: 'backpack.dmi', state: 'backpack' };
    case 'Toolbelt':
      return { dmi: 'items.dmi', state: 'fcardholder0' };
    case 'IDCard':
      return { dmi: 'card.dmi', state: 'card_grey' };
    case 'BruisePack':
      return { dmi: 'stack_medical.dmi', state: 'brutepack' };
    case 'Ointment':
      return { dmi: 'stack_medical.dmi', state: 'ointment' };
    case 'StunBaton':
      return { dmi: 'baton.dmi', state: 'stunbaton' };
    case 'Mop':
      return { dmi: 'janitor.dmi', state: 'mop' };
    case 'Soap':
      return { dmi: 'watercloset.dmi', state: 'soap' };
    case 'Banana':
      return { dmi: 'harvest.dmi', state: 'banana' };
    case 'BikeHorn':
      return { dmi: 'horn.dmi', state: 'bike_horn' };
    case 'HandGasTank':
      return { dmi: 'canisters.dmi', state: 'oxygen_f' };
    case 'Shard':
      return { dmi: 'debris.dmi', state: 'medium' };
    case 'FloorTileItem':
      return { dmi: 'tiles.dmi', state: 'tile_default' };
    case 'Metal':
      return { dmi: 'stack_objects.dmi', state: 'sheet-metal' };
    case 'Rod':
      return { dmi: 'stack_objects.dmi', state: 'rods' };
    case 'GlassSheet':
      return { dmi: 'stack_objects.dmi', state: 'sheet-glass' };
    default:
      return { dmi: 'tools.dmi', state: 'crowbar' };
  }
}

export interface SpeciesDmiResult {
  dmi: string;
  state: string;
  tailDmi?: string;
  tailState?: string;
  earsDmi?: string;
  earsState?: string;
  isParadise?: boolean;
}

/**
 * Mapping for Mob Base Species sprite layer.
 * Humanoid species reference TGStation (human.dmi),
 * while Tajaran and Vulpakanin reference Paradise SS13 (r_tajaran.dmi and r_vulpkanin.dmi).
 */
export function getSpeciesDmiInfo(
  species: SpeciesType = 'Human',
  skinTone: SkinTone = 'caucasian1',
  gender: Gender = 'male'
): SpeciesDmiResult {
  const g = gender === 'female' ? 'f' : 'm';
  switch (species) {
    case 'Tajaran':
      return {
        dmi: 'r_tajaran.dmi',
        state: 'preview',
        tailDmi: 'tajaran_tail_markings.dmi',
        tailState: 'default_wingler_s',
        earsDmi: 'tajaran_head_accessories.dmi',
        earsState: 'ears',
        isParadise: true,
      };
    case 'Vulpakanin':
      return {
        dmi: 'r_vulpkanin.dmi',
        state: 'preview',
        tailDmi: 'vulpkanin_tail_markings.dmi',
        tailState: 'bushfluff_s',
        earsDmi: 'body_accessory.dmi',
        earsState: 'bushy',
        isParadise: true,
      };
    case 'Human': {
      const tone = skinTone || 'caucasian1';
      return { dmi: 'human.dmi', state: `${tone}_${g}_s` };
    }
    case 'Lizard':
      return { dmi: 'human.dmi', state: `lizard_${g}_s` };
    case 'Felinid':
      return { dmi: 'human.dmi', state: `${skinTone || 'caucasian1'}_${g}_s` };
    case 'Moth':
      return { dmi: 'human.dmi', state: `lizard_${g}_s` };
    case 'Plasmaman':
      return { dmi: 'human.dmi', state: `zombie_s` };
    case 'Abductor':
      return { dmi: 'human.dmi', state: `grey_${g}_s` };
    default:
      return { dmi: 'human.dmi', state: 'caucasian1_m_s' };
  }
}

/**
 * Mapping for worn mob equipment
 */
export function getWornEquipmentDmi(
  slot: 'uniform' | 'shoes' | 'head' | 'mask' | 'suit' | 'back' | 'belt',
  itemType: string,
  rolledSleeves: boolean = false
): { dmi: string; state: string } | null {
  if (!itemType) return null;
  const suffix = rolledSleeves ? '_l' : '_s';

  switch (slot) {
    case 'uniform': {
      if (itemType === 'ClownUniform') return { dmi: 'uniform.dmi', state: `clown${suffix}` };
      if (itemType === 'MimeUniform') return { dmi: 'uniform.dmi', state: `black${suffix}` };
      if (itemType === 'EngineUniform') return { dmi: 'uniform.dmi', state: `yellow${suffix}` };
      if (itemType === 'MedicalUniform') return { dmi: 'uniform.dmi', state: `medical${suffix}` };
      if (itemType === 'JanitorUniform') return { dmi: 'uniform.dmi', state: `purple${suffix}` };
      if (itemType === 'BarmanUniform') return { dmi: 'uniform.dmi', state: `black${suffix}` };
      if (itemType === 'AssistantUniform') return { dmi: 'uniform.dmi', state: `grey${suffix}` };
      if (itemType === 'SecurityUniform') return { dmi: 'uniform.dmi', state: `red${suffix}` };
      if (itemType === 'CaptainUniform') return { dmi: 'uniform.dmi', state: `captain${suffix}` };
      return { dmi: 'uniform.dmi', state: `grey${suffix}` };
    }
    case 'shoes': {
      if (itemType === 'ClownBoots') return { dmi: 'feet.dmi', state: 'clown' };
      if (itemType === 'Galoshes') return { dmi: 'feet.dmi', state: 'galoshes' };
      if (itemType === 'WhiteShoes') return { dmi: 'feet.dmi', state: 'white' };
      if (itemType === 'Magboots') return { dmi: 'feet.dmi', state: 'magboots0' };
      return { dmi: 'feet.dmi', state: 'boots' };
    }
    case 'head': {
      if (itemType === 'Tophat') return { dmi: 'head.dmi', state: 'tophat' };
      if (itemType === 'CaptainCap') return { dmi: 'head.dmi', state: 'captain' };
      if (itemType === 'Hardhat') return { dmi: 'head.dmi', state: 'hardhat0' };
      if (itemType === 'WeldingMask') return { dmi: 'head.dmi', state: 'welding' };
      if (itemType === 'Beret') return { dmi: 'head.dmi', state: 'beret' };
      if (itemType === 'ChefHat') return { dmi: 'head.dmi', state: 'tophat' };
      return { dmi: 'head.dmi', state: 'helmet' };
    }
    case 'mask': {
      if (itemType === 'SterileMask') return { dmi: 'mask.dmi', state: 'sterile' };
      if (itemType === 'MimeMask') return { dmi: 'mask.dmi', state: 'mime' };
      return { dmi: 'mask.dmi', state: 'gas_mask' };
    }
    case 'suit': {
      if (itemType === 'SpaceSuit') return { dmi: 'suit.dmi', state: 'space' };
      if (itemType === 'FireSuit') return { dmi: 'suit.dmi', state: 'fire' };
      if (itemType === 'Labcoat') return { dmi: 'suit.dmi', state: 'labcoat' };
      if (itemType === 'BioSuit') return { dmi: 'suit.dmi', state: 'bio' };
      if (itemType === 'SecurityHardsuit') return { dmi: 'suit.dmi', state: 'space' };
      return { dmi: 'suit.dmi', state: 'armor' };
    }
    case 'back': {
      if (itemType === 'HandGasTank') return { dmi: 'back.dmi', state: 'oxygen' };
      return { dmi: 'back.dmi', state: 'backpack' };
    }
    default:
      return null;
  }
}

/**
 * Mapping for items held in hand (using items_lefthand.dmi and items_righthand.dmi)
 */
export function getInHandDmiInfo(
  hand: 'left' | 'right',
  itemType: string
): { dmi: string; state: string; useDirectional: boolean } {
  const dmi = hand === 'left' ? 'items_lefthand.dmi' : 'items_righthand.dmi';

  switch (itemType) {
    case 'Crowbar':
      return { dmi: 'items.dmi', state: 'crowbar', useDirectional: false };
    case 'Wrench':
      return { dmi, state: 'wrench', useDirectional: true };
    case 'Screwdriver':
      return { dmi, state: 'screwdriver', useDirectional: true };
    case 'Weldingtool':
      return { dmi, state: 'welder', useDirectional: true };
    case 'Wirecutters':
      return { dmi, state: 'cutters', useDirectional: true };
    case 'Gun':
    case 'Revolver':
    case 'LaserGun':
    case 'Shotgun':
    case 'Taser':
    case 'Disabler':
      return { dmi, state: 'gun', useDirectional: true };
    case 'StunBaton':
      return { dmi, state: 'baton', useDirectional: true };
    case 'CombatKnife':
      return { dmi, state: 'knife', useDirectional: true };
    case 'Extinguisher':
      return { dmi, state: 'extinguisher', useDirectional: true };
    case 'Mop':
      return { dmi, state: 'mop', useDirectional: true };
    case 'IDCard':
      return { dmi, state: 'card-id', useDirectional: true };
    case 'BruisePack':
      return { dmi, state: 'brutepack', useDirectional: true };
    case 'Beer':
    case 'Vodka':
    case 'Tea':
      return { dmi, state: 'beer', useDirectional: true };
    case 'Backpack':
      return { dmi, state: 'backpack', useDirectional: true };
    default: {
      const fallback = getItemDmiInfo(itemType as ItemType);
      return { dmi: fallback.dmi, state: fallback.state, useDirectional: false };
    }
  }
}

/**
 * Pure SS13 / Griefly Composite DMI Mob Paperdoll Renderer
 * Layers: Base Body -> Shoes -> Uniform -> Suit -> Mask -> Helmet -> Back -> Belt -> Left Hand -> Right Hand -> Damage
 */
export function drawDmiMob(
  ctx: CanvasRenderingContext2D,
  player: PlayerMob,
  px: number,
  py: number
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Lying / Resting mode rotation
  if (player.isLying) {
    ctx.translate(px + 16, py + 16);
    ctx.rotate(Math.PI / 2);
    ctx.translate(-(px + 16), -(py + 16));
  }

  // 1. Base Species Body & Tail Layering
  const base = getSpeciesDmiInfo(player.species, player.skinTone, player.gender);

  // Tail: behind mob when facing SOUTH, EAST, or WEST
  if (base.tailDmi && player.dir !== 'NORTH') {
    drawDmiSprite(ctx, base.tailDmi, base.tailState || '', px, py, { dir: player.dir });
  }

  // Base Species Body (from TGStation human.dmi or Paradise r_tajaran.dmi / r_vulpkanin.dmi)
  drawDmiSprite(ctx, base.dmi, base.state, px, py, { dir: player.dir });

  // Tail: in front of mob when facing NORTH
  if (base.tailDmi && player.dir === 'NORTH') {
    drawDmiSprite(ctx, base.tailDmi, base.tailState || '', px, py, { dir: player.dir });
  }

  // Species Ears accessory if head is not covered by a helmet
  if (base.earsDmi && !player.inventory.head) {
    drawDmiSprite(ctx, base.earsDmi, base.earsState || '', px, py, { dir: player.dir });
  }

  // 2. Uniform (Jumpsuit)
  if (player.inventory.uniform) {
    const eq = getWornEquipmentDmi('uniform', player.inventory.uniform.type, player.rolledSleeves);
    if (eq) drawDmiSprite(ctx, eq.dmi, eq.state, px, py, { dir: player.dir });
  }

  // 3. Shoes / Boots
  if (player.inventory.shoes) {
    const eq = getWornEquipmentDmi('shoes', player.inventory.shoes.type);
    if (eq) drawDmiSprite(ctx, eq.dmi, eq.state, px, py, { dir: player.dir });
  }

  // 4. Suit / Armor / Labcoat
  if (player.inventory.suit) {
    const eq = getWornEquipmentDmi('suit', player.inventory.suit.type);
    if (eq) drawDmiSprite(ctx, eq.dmi, eq.state, px, py, { dir: player.dir });
  }

  // 5. Mask
  if (player.inventory.mask) {
    const eq = getWornEquipmentDmi('mask', player.inventory.mask.type);
    if (eq) drawDmiSprite(ctx, eq.dmi, eq.state, px, py, { dir: player.dir });
  }

  // 6. Headgear / Helmet
  if (player.inventory.head) {
    const eq = getWornEquipmentDmi('head', player.inventory.head.type);
    if (eq) drawDmiSprite(ctx, eq.dmi, eq.state, px, py, { dir: player.dir });
  }

  // 7. Back Item / Oxygen Tank
  if (player.inventory.back) {
    const eq = getWornEquipmentDmi('back', player.inventory.back.type);
    if (eq) drawDmiSprite(ctx, eq.dmi, eq.state, px, py, { dir: player.dir });
  }

  // 8. In-hand items (items_lefthand.dmi and items_righthand.dmi)
  if (player.inventory.left_hand) {
    const inHand = getInHandDmiInfo('left', player.inventory.left_hand.type);
    drawDmiSprite(ctx, inHand.dmi, inHand.state, px, py, {
      dir: inHand.useDirectional ? player.dir : undefined,
    });
  }

  if (player.inventory.right_hand) {
    const inHand = getInHandDmiInfo('right', player.inventory.right_hand.type);
    drawDmiSprite(ctx, inHand.dmi, inHand.state, px, py, {
      dir: inHand.useDirectional ? player.dir : undefined,
    });
  }

  // 9. Damage overlay from dam_human.dmi
  if (player.health < 100 || player.bruteDamage > 0 || player.burnDamage > 0) {
    const dmgAlpha = Math.min(0.85, (100 - player.health) / 100);
    drawDmiSprite(ctx, 'dam_human.dmi', 'damage', px, py, {
      dir: player.dir,
      alpha: dmgAlpha,
    });
  }

  ctx.restore();
}
