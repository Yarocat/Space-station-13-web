import { Direction, TurfType, StructureType, ItemType, Tile, SpeciesType, SkinTone, Gender } from '../types';

export interface DmiState {
  state: string;
  dirs?: number;
  frames?: number;
  delay?: number[];
  loop?: number;
  first_frame_pos?: number;
}

export interface DmiMetadata {
  info: {
    width: number;
    height: number;
    version?: number;
  };
  states: DmiState[];
  stateMap?: Map<string, DmiState>;
}

export interface LoadedDmi {
  name: string;
  image: HTMLImageElement;
  metadata: DmiMetadata;
  ready: boolean;
}

// In-memory cache for loaded DMI assets
const dmiCache = new Map<string, LoadedDmi>();
const pendingLoads = new Map<string, Promise<LoadedDmi | null>>();

// Listeners for load completion so canvas can request redraw
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
 * Load a DMI sprite sheet and its metadata json.
 */
export async function loadDmi(dmiFileName: string): Promise<LoadedDmi | null> {
  const cleanName = dmiFileName.replace(/\.png$/, '');
  if (dmiCache.has(cleanName)) {
    return dmiCache.get(cleanName)!;
  }

  if (pendingLoads.has(cleanName)) {
    return pendingLoads.get(cleanName)!;
  }

  const loadPromise = (async () => {
    try {
      // Fetch metadata json
      const jsonUrl = `/icons/${cleanName}.json`;
      const metaRes = await fetch(jsonUrl);
      if (!metaRes.ok) {
        console.warn(`Failed to fetch DMI metadata: ${jsonUrl}`);
        return null;
      }
      const metadata: DmiMetadata = await metaRes.json();

      // Index states and calculate first_frame_pos
      metadata.stateMap = new Map();
      let currentPos = 0;
      for (const s of metadata.states) {
        s.first_frame_pos = currentPos;
        s.dirs = s.dirs || 1;
        s.frames = s.frames || 1;
        currentPos += s.frames * s.dirs;
        if (!metadata.stateMap.has(s.state)) {
          metadata.stateMap.set(s.state, s);
        }
      }

      // Load image
      const img = new Image();
      // Try .dmi first, with fallback to .dmi.png
      img.src = `/icons/${cleanName}`;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => {
          // Fallback to .png extension
          img.src = `/icons/${cleanName}.png`;
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load DMI image: ${cleanName}`));
        };
      });

      const loaded: LoadedDmi = {
        name: cleanName,
        image: img,
        metadata,
        ready: true,
      };

      dmiCache.set(cleanName, loaded);
      notifyRedraw();
      return loaded;
    } catch (err) {
      console.warn(`Error loading DMI ${cleanName}:`, err);
      return null;
    } finally {
      pendingLoads.delete(cleanName);
    }
  })();

  pendingLoads.set(cleanName, loadPromise);
  return loadPromise;
}

/**
 * Preload standard TGStation DMI assets for smooth gameplay
 */
export function preloadCommonDmis() {
  const common = [
    'floors.dmi',
    'walls.dmi',
    'Doorsec.dmi',
    'Doorcom.dmi',
    'Dooreng.dmi',
    'Doorext.dmi',
    'Doorfire.dmi',
    'Doorglass.dmi',
    'Doormaint.dmi',
    'doormed.dmi',
    'human.dmi',
    'objects.dmi',
    'structures.dmi',
    'items.dmi',
    'guns.dmi',
    'device.dmi',
    'drinks.dmi',
    'chemical.dmi',
    'blood.dmi',
    'fire.dmi',
    'projectiles.dmi',
    'hats.dmi',
    'shoes.dmi',
    'feet.dmi',
    'head.dmi',
    'mask.dmi',
    'masks.dmi',
    'suit.dmi',
    'suits.dmi',
    'uniform.dmi',
    'uniforms.dmi',
    'closet.dmi',
    'computer.dmi',
    'tank.dmi',
    'space.dmi',
    'pipe_vent.dmi',
    'pipes.dmi',
    'shards.dmi',
    'screen_midnight.dmi',
    'dam_human.dmi',
    'back.dmi',
    'items_lefthand.dmi',
    'items_righthand.dmi',
  ];

  for (const name of common) {
    loadDmi(name);
  }
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
 * Draw a sprite from a loaded DMI sheet.
 * Returns true if drawn successfully, false if not loaded yet or state missing.
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
  let loaded = dmiCache.get(cleanName);

  if (!loaded || !loaded.ready) {
    // Queue load in background
    loadDmi(cleanName);
    return false;
  }

  const meta = loaded.metadata;
  let state = meta.stateMap?.get(stateName);
  if (!state) {
    // Try empty state or first state fallback
    state = meta.stateMap?.get('') || meta.states[0];
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
    ctx.globalAlpha = options.alpha;
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

  // North (y - 1)
  if (y > 0 && isWallTurf(map[y - 1][x].turf)) mask |= 1;
  // South (y + 1)
  if (y < height - 1 && isWallTurf(map[y + 1][x].turf)) mask |= 2;
  // East (x + 1)
  if (x < width - 1 && isWallTurf(map[y][x + 1].turf)) mask |= 4;
  // West (x - 1)
  if (x > 0 && isWallTurf(map[y][x - 1].turf)) mask |= 8;

  return mask;
}

function isWallTurf(turf: TurfType): boolean {
  return turf === 'MetalWall' || turf === 'ReinforcedWall';
}

/**
 * Mapping table from TurfType to DMI file and state generator
 */
export function getTurfDmiInfo(
  turf: TurfType,
  map: Tile[][],
  x: number,
  y: number
): { dmi: string; state: string } {
  switch (turf) {
    case 'Space': {
      // Deterministic space tile variant
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
    case 'Plating':
      return { dmi: 'floors.dmi', state: 'plating' };
    case 'MetalWall': {
      const mask = getWallAutotileMask(map, x, y, turf);
      return { dmi: 'walls.dmi', state: `metal${mask}` };
    }
    case 'ReinforcedWall': {
      const mask = getWallAutotileMask(map, x, y, turf);
      return { dmi: 'walls.dmi', state: `rwall${mask}` };
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
      return { dmi: 'objects.dmi', state: 'chair' };
    case 'Stool':
      return { dmi: 'objects.dmi', state: 'stool' };
    case 'Bed':
      return { dmi: 'objects.dmi', state: 'bed' };
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
      return { dmi: 'objects.dmi', state: 'watertank' };
    case 'FuelTank':
      return { dmi: 'objects.dmi', state: 'weldtank' };
    case 'GasTank':
    case 'PlasmaGasTank':
      return { dmi: 'tank.dmi', state: 'tank' };
    case 'Vent':
      return { dmi: 'pipe_vent.dmi', state: 'pipe_vent' };
    case 'PipePump':
    case 'Pipe':
      return { dmi: 'pipes.dmi', state: 'pipe-0' };
    default:
      return { dmi: 'objects.dmi', state: 'stool' };
  }
}

/**
 * Mapping from ItemType to DMI file and state
 */
export function getItemDmiInfo(type: ItemType): { dmi: string; state: string } {
  switch (type) {
    case 'Crowbar':
      return { dmi: 'items.dmi', state: 'crowbar' };
    case 'Wrench':
      return { dmi: 'items.dmi', state: 'wrench' };
    case 'Screwdriver':
      return { dmi: 'items.dmi', state: 'screwdriver' };
    case 'Weldingtool':
      return { dmi: 'items.dmi', state: 'welder' };
    case 'Wirecutters':
      return { dmi: 'items.dmi', state: 'wirecutters' };
    case 'HealthAnalyzer':
      return { dmi: 'device.dmi', state: 'health' };
    case 'AtmosTool':
      return { dmi: 'device.dmi', state: 'atmos' };
    case 'Gun':
    case 'Revolver':
      return { dmi: 'guns.dmi', state: 'revolver' };
    case 'LaserGun':
      return { dmi: 'guns.dmi', state: 'caplaser' };
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
    case 'Helmet':
      return { dmi: 'hats.dmi', state: 'helmet' };
    case 'Tophat':
      return { dmi: 'hats.dmi', state: 'tophat' };
    case 'CaptainCap':
      return { dmi: 'hats.dmi', state: 'captain' };
    case 'Hardhat':
      return { dmi: 'hats.dmi', state: 'hardhat0' };
    case 'WeldingMask':
      return { dmi: 'hats.dmi', state: 'welding' };
    case 'Armor':
      return { dmi: 'suits.dmi', state: 'armor' };
    case 'SpaceSuit':
      return { dmi: 'suits.dmi', state: 'space' };
    case 'FireSuit':
      return { dmi: 'suits.dmi', state: 'fire' };
    case 'Labcoat':
      return { dmi: 'suits.dmi', state: 'labcoat' };
    case 'ClownUniform':
      return { dmi: 'uniforms.dmi', state: 'clown' };
    case 'ClownBoots':
      return { dmi: 'shoes.dmi', state: 'clown' };
    case 'BarmanUniform':
      return { dmi: 'uniforms.dmi', state: 'barman' };
    case 'JanitorUniform':
      return { dmi: 'uniforms.dmi', state: 'janitor' };
    case 'MedicalUniform':
      return { dmi: 'uniforms.dmi', state: 'medical' };
    case 'EngineUniform':
      return { dmi: 'uniforms.dmi', state: 'yellow' };
    case 'AssistantUniform':
      return { dmi: 'uniforms.dmi', state: 'grey' };
    case 'SecurityUniform':
      return { dmi: 'uniforms.dmi', state: 'red' };
    case 'CaptainUniform':
      return { dmi: 'uniforms.dmi', state: 'captain' };
    case 'BlackBoots':
      return { dmi: 'shoes.dmi', state: 'boots' };
    case 'WhiteShoes':
      return { dmi: 'shoes.dmi', state: 'white' };
    case 'Galoshes':
      return { dmi: 'shoes.dmi', state: 'galoshes' };
    case 'Magboots':
      return { dmi: 'shoes.dmi', state: 'magboots0' };
    case 'Backpack':
      return { dmi: 'back.dmi', state: 'backpack' };
    case 'Toolbelt':
      return { dmi: 'items.dmi', state: 'fcardholder0' };
    case 'IDCard':
      return { dmi: 'items_righthand.dmi', state: 'card-id' };
    case 'BruisePack':
      return { dmi: 'items.dmi', state: 'brutepack' };
    case 'Ointment':
      return { dmi: 'items.dmi', state: 'ointment' };
    case 'StunBaton':
      return { dmi: 'items_righthand.dmi', state: 'baton' };
    case 'Mop':
      return { dmi: 'items_righthand.dmi', state: 'mop' };
    case 'Banana':
      return { dmi: 'items.dmi', state: 'banana' };
    case 'BikeHorn':
      return { dmi: 'items.dmi', state: 'bike_horn' };
    case 'HandGasTank':
      return { dmi: 'items.dmi', state: 'an_tank' };
    case 'Shard':
      return { dmi: 'shards.dmi', state: 'medium' };
    case 'FloorTileItem':
      return { dmi: 'items.dmi', state: 'sheet' };
    case 'Metal':
      return { dmi: 'items.dmi', state: 'sheet' };
    case 'Rod':
      return { dmi: 'items.dmi', state: 'rod' };
    default:
      return { dmi: 'items.dmi', state: 'crowbar' };
  }
}

/**
 * Mapping for Mob Base Species sprite layer
 */
export function getSpeciesDmiInfo(
  species: SpeciesType = 'Human',
  skinTone: SkinTone = 'caucasian1',
  gender: Gender = 'male'
): { dmi: string; state: string } {
  const g = gender === 'female' ? 'f' : 'm';
  switch (species) {
    case 'Human': {
      const tone = skinTone || 'caucasian1';
      return { dmi: 'human.dmi', state: `${tone}_${g}_s` };
    }
    case 'Lizard':
      return { dmi: 'human.dmi', state: `lizard_${g}_s` };
    case 'Vulpakanin':
      // Goob Station foxfolk base sprite with tail and ears
      return { dmi: 'human.dmi', state: `lizard_${g}_s` };
    case 'Tajaran':
      // Goob Station / Baystation feline race
      return { dmi: 'human.dmi', state: `${skinTone || 'albino'}_${g}_s` };
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
