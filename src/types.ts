export type TurfType = 
  | 'Space'
  | 'Floor'
  | 'FloorTile'
  | 'FloorBar'
  | 'FloorCafeteria'
  | 'FloorFreezer'
  | 'FloorWhite'
  | 'Plating'
  | 'MetalWall'
  | 'ReinforcedWall'
  | 'ReinforcedFloor'
  | 'FloorCatwalk'
  | 'FloorPlanter';

export type StructureType =
  | 'Door'
  | 'GlassDoor'
  | 'MaintenanceDoor'
  | 'SecurityDoor'
  | 'ExternalDoor'
  | 'Table'
  | 'MetalTable'
  | 'Chair'
  | 'Stool'
  | 'Bed'
  | 'Closet'
  | 'SecurityLocker'
  | 'Computer'
  | 'Vent'
  | 'PipePump'
  | 'Pipe'
  | 'GasTank'
  | 'PlasmaGasTank'
  | 'FuelTank'
  | 'WaterTank'
  | 'PressureIndicator'
  | 'WallSign'
  | 'Grille'
  | 'Girder'
  | 'FlatGlass'
  | 'SolarPanel'
  | 'APC'
  | 'AirAlarm'
  | 'GasScrubber'
  | 'GasPumpStation'
  | 'CanisterO2'
  | 'CanisterPlasma'
  | 'CanisterN2'
  | 'Autolathe'
  | 'ExtinguisherCabinet'
  | 'WallLight'
  | 'FireAlarm'
  | 'Plant'
  | 'Bench'
  | 'VendingSoda'
  | 'VendingSnack'
  | 'WaterCooler'
  | 'MedicalSign';

export type ItemType =
  | 'Crowbar'
  | 'Wrench'
  | 'Screwdriver'
  | 'Weldingtool'
  | 'Wirecutters'
  | 'HealthAnalyzer'
  | 'AtmosTool'
  | 'Gun'
  | 'Revolver'
  | 'LaserGun'
  | 'Shotgun'
  | 'Taser'
  | 'Disabler'
  | 'CombatKnife'
  | 'AmmunitionBox'
  | 'Bullet'
  | 'Shard'
  | 'Beer'
  | 'Vodka'
  | 'Tea'
  | 'GasMask'
  | 'SterileMask'
  | 'MimeMask'
  | 'Helmet'
  | 'Tophat'
  | 'CaptainCap'
  | 'Hardhat'
  | 'WeldingMask'
  | 'Beret'
  | 'ChefHat'
  | 'Armor'
  | 'SpaceSuit'
  | 'FireSuit'
  | 'BioSuit'
  | 'SecurityHardsuit'
  | 'PlasmamanSuit'
  | 'PlasmamanHelmet'
  | 'Labcoat'
  | 'ClownUniform'
  | 'ClownBoots'
  | 'BarmanUniform'
  | 'JanitorUniform'
  | 'MedicalUniform'
  | 'EngineUniform'
  | 'AssistantUniform'
  | 'SecurityUniform'
  | 'CaptainUniform'
  | 'MimeUniform'
  | 'BlackBoots'
  | 'WhiteShoes'
  | 'Galoshes'
  | 'Magboots'
  | 'Backpack'
  | 'Toolbelt'
  | 'IDCard'
  | 'BruisePack'
  | 'Ointment'
  | 'StunBaton'
  | 'Mop'
  | 'Soap'
  | 'Banana'
  | 'BikeHorn'
  | 'HandGasTank'
  | 'Extinguisher'
  | 'FloorTileItem'
  | 'Metal'
  | 'Rod'
  | 'GlassSheet';

export type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';

// Paradise SS13 playable races: Humans, Tajaran, Vulpakanin, Lizardpeople, Felinids, Grey, Plasmamen, Slimepeople, Moth
export type SpeciesType =
  | 'Human'
  | 'Tajaran'
  | 'Vulpakanin'
  | 'Lizard'
  | 'Felinid'
  | 'Grey'
  | 'Plasmaman'
  | 'Slimeperson'
  | 'Moth'
  | 'Abductor';

export type SkinTone =
  | 'caucasian1'
  | 'caucasian2'
  | 'caucasian3'
  | 'latino'
  | 'mediterranean'
  | 'asian1'
  | 'asian2'
  | 'arab'
  | 'indian'
  | 'african1'
  | 'african2'
  | 'albino'
  | 'fur_orange'
  | 'fur_snow'
  | 'fur_black'
  | 'fur_grey'
  | 'fur_brown'
  | 'fur_calico'
  | 'scales_green'
  | 'scales_red'
  | 'scales_black'
  | 'scales_desert'
  | 'plasma_purple'
  | 'plasma_blue'
  | 'plasma_cyan'
  | 'grey_alien'
  | 'slime_green'
  | 'slime_blue'
  | 'slime_purple';

export type HairstyleType =
  | 'Bald'
  | 'Crewcut'
  | 'Short'
  | 'Long'
  | 'Ponytail'
  | 'HighPonytail'
  | 'Bob'
  | 'Afro'
  | 'Mohawk'
  | 'Braids'
  | 'LongBraid'
  | 'Dreadlocks'
  | 'Anime'
  | 'Spiky'
  | 'Bedhead'
  | 'Bun'
  | 'Slick'
  | 'Undercut'
  | 'VulpineTuft'
  | 'FoxFluff'
  | 'FelineMane'
  | 'LynxTufts'
  | 'LizardHornsCurved'
  | 'LizardHornsCrown'
  | 'LizardFrills'
  | 'PlasmaFlame'
  | 'VioletFlame'
  | 'VoidFlame';

export type FacialHairType =
  | 'Shaved'
  | 'Stubble'
  | 'FullBeard'
  | 'Goatee'
  | 'Mustache'
  | 'VanDyke'
  | 'Sideburns'
  | 'Whiskers';

export type Gender = 'male' | 'female' | 'neuter';

export type IntentType = 'HELP' | 'DISARM' | 'GRAB' | 'HARM';

export type TargetZone =
  | 'head'
  | 'eyes'
  | 'mouth'
  | 'chest'
  | 'groin'
  | 'l_arm'
  | 'r_arm'
  | 'l_leg'
  | 'r_leg';

export type MoveMode = 'walk' | 'run';

export type DepartmentType =
  | 'Command'
  | 'Security'
  | 'Engineering'
  | 'Medical'
  | 'Science'
  | 'Service'
  | 'Civilian';

export interface GasComposition {
  pressure: number;     // kPa (normal ~ 101.3 kPa)
  temperature: number;  // Kelvin (normal ~ 293.15 K / 20 C)
  o2: number;          // mol%
  n2: number;          // mol%
  plasma: number;      // mol% (dangerous flammable/toxic gas)
  co2: number;         // mol%
  n2o?: number;        // mol% (sleeping gas)
  waterVapor?: number; // mol%
  fire?: boolean;      // burning flag
  fireIntensity?: number;
}

export interface WorldObject {
  id: string;
  type: StructureType | ItemType;
  name: string;
  isItem: boolean;
  isOpen?: boolean;
  isLocked?: boolean;
  welded?: boolean;
  anchored?: boolean;
  contains?: WorldObject[];
  charges?: number;
  maxCharges?: number;
  color?: string;
  icon?: string;
  description?: string;
  doorAnimFrame?: number;
  doorState?: 'closed' | 'opening' | 'open' | 'closing';
}

export interface Tile {
  x: number;
  y: number;
  turf: TurfType;
  objects: WorldObject[];
  atmos: GasComposition;
}

export type SlotName = 
  | 'head'
  | 'mask'
  | 'glasses'
  | 'ears'
  | 'suit'
  | 'uniform'
  | 'gloves'
  | 'shoes'
  | 'back'
  | 'belt'
  | 'suit_storage'
  | 'id'
  | 'pocket1'
  | 'pocket2'
  | 'left_hand'
  | 'right_hand';

export interface PlayerInventory {
  head: WorldObject | null;
  mask: WorldObject | null;
  glasses: WorldObject | null;
  ears: WorldObject | null;
  suit: WorldObject | null;
  uniform: WorldObject | null;
  gloves: WorldObject | null;
  shoes: WorldObject | null;
  back: WorldObject | null;
  belt: WorldObject | null;
  suit_storage: WorldObject | null;
  id: WorldObject | null;
  pocket1: WorldObject | null;
  pocket2: WorldObject | null;
  left_hand: WorldObject | null;
  right_hand: WorldObject | null;
  activeHand: 'left_hand' | 'right_hand';
}

export interface PlayerMob {
  id: string;
  name: string;
  job: string;
  department: DepartmentType;
  species: SpeciesType;
  skinTone: SkinTone;
  gender: Gender;
  age: number;
  hairstyle: HairstyleType;
  hairColor: string;
  facialHair: FacialHairType;
  facialHairColor: string;
  eyeColor: string;
  furColor?: string;
  earType?: string;
  tailType?: string;
  wingType?: string;
  x: number;
  y: number;
  dir: Direction;
  isGhost: boolean;
  isLying: boolean;
  flipAngle?: number;       // 0 to 360 for /flip emote
  pullingId: string | null;
  health: number;           // 0 - 100
  bruteDamage: number;      // 0 - 100
  burnDamage: number;       // 0 - 100
  oxygen: number;           // 0 - 100
  toxin: number;            // 0 - 100
  stamina: number;          // 0 - 100
  temperature: number;      // Kelvin (310.15K normal)
  intent: IntentType;
  targetZone: TargetZone;
  moveMode: MoveMode;
  throwMode: boolean;
  rolledSleeves: boolean;
  magbootsActive: boolean;
  visorDown: boolean;
  internalsOn: boolean;
  shoelacesUntied: boolean;
  grabbedMobId: string | null;
  cuffed: boolean;
  inventory: PlayerInventory;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'laser' | 'bullet' | 'disabler' | 'taser' | 'pellet';
  rangeLeft: number;
  damage: number;
  sourceId: string;
}

export interface ChatMessage {
  id: string;
  channel: 'RADIO' | 'OOC' | 'SAY' | 'EMOTE' | 'ATMOS' | 'SYSTEM' | 'COMBAT';
  sender: string;
  text: string;
  timestamp: string;
}

export type EditorTool = 'BRUSH' | 'FILL' | 'ERASE' | 'INSPECT' | 'LINE';

export type PaletteCategory = 'TURFS' | 'STRUCTURES' | 'ATMOS' | 'ITEMS' | 'MOBS';

export interface StationMapData {
  width: number;
  height: number;
  depth: number;
  tiles: {
    x: number;
    y: number;
    z: number;
    turf: {
      type: string;
      variables?: Record<string, unknown>;
    };
    objects: {
      type: string;
      variables?: Record<string, unknown>;
    }[];
    atmos?: Partial<GasComposition>;
  }[];
}

// Construction & Crafting System
export interface ConstructionRecipe {
  id: string;
  name: string;
  category: 'Structure' | 'Airlock' | 'Atmos' | 'Power' | 'Furniture' | 'Item';
  materialsRequired: { type: ItemType; count: number; name: string }[];
  resultType: StructureType | TurfType | ItemType;
  isTurf?: boolean;
  isItem?: boolean;
  requiredTool: 'Wrench' | 'Screwdriver' | 'Weldingtool' | 'Crowbar' | 'None';
  description: string;
}

// Mouse Context Menu for Goob Station Mouse Interactions
export interface ContextMenuItem {
  label: string;
  icon?: string;
  action: () => void;
  color?: string;
  disabled?: boolean;
}

export interface ContextMenuState {
  x: number;
  y: number;
  tileX: number;
  tileY: number;
  title: string;
  items: ContextMenuItem[];
}

// Multiplayer & Dedicated Server Architecture
export interface ServerPlayer {
  id: string;
  name: string;
  job: string;
  species: SpeciesType;
  ping: number;
  ip: string;
  isHost: boolean;
  health: number;
}

export interface DedicatedServerConfig {
  isRunning: boolean;
  serverName: string;
  port: number;
  tickRate: number; // 20 - 60 Hz
  maxPlayers: number;
  currentRoundId?: number;
  roundDuration?: number;
  mapName: string;
  gameMode: string;
  activeGameMode?: 'Secret' | 'Traitor' | 'Extended' | 'Blob' | 'NuclearOperatives';
  connectedPlayers: ServerPlayer[];
  players?: ServerPlayer[];
  serverLogs?: string[];
}

// Unified Sprite Manager Types (DMI for Station & World, RSI for Goob Station Characters & Clothing)
export type SpriteFormat = 'dmi' | 'rsi';

export interface SpriteSource {
  format: SpriteFormat;
  path: string;       // Path to DMI file or RSI directory
  stateName: string;  // icon_state (SS13) or state name (SS14)
  dir: number;        // Direction: 0=South, 1=North, 2=East, 3=West
}

export interface RsiState {
  name: string;
  directions?: number; // 1 or 4
  delays?: number[][];
}

export interface RsiMeta {
  version: number;
  license?: string;
  copyright?: string;
  size: {
    x: number;
    y: number;
  };
  states: RsiState[];
}
