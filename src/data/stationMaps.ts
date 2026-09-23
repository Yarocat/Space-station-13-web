import { Tile, TurfType, StationMapData } from '../types';
import { TURFS_REGISTRY, createWorldObject } from './assets';

export function createEmptyMap(width: number, height: number, defaultTurf: TurfType = 'Space'): Tile[][] {
  const map: Tile[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < width; x++) {
      const meta = TURFS_REGISTRY[defaultTurf];
      row.push({
        x,
        y,
        turf: defaultTurf,
        objects: [],
        atmos: { ...meta.defaultAtmos },
      });
    }
    map.push(row);
  }
  return map;
}

// Helper to draw a bordered room with flooring and optional walls
function buildRoom(
  map: Tile[][],
  x1: number, y1: number, x2: number, y2: number,
  floorType: TurfType,
  wallType: TurfType = 'MetalWall'
) {
  const width = map[0].length;
  const height = map.length;
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const isWall = x === x1 || x === x2 || y === y1 || y === y2;
      const turf = isWall ? wallType : floorType;
      const meta = TURFS_REGISTRY[turf];
      map[y][x].turf = turf;
      map[y][x].atmos = { ...meta.defaultAtmos };
    }
  }
}

function placeObj(
  map: Tile[][],
  x: number, y: number,
  type: Parameters<typeof createWorldObject>[0],
  overrides = {}
) {
  if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
    map[y][x].objects.push(createWorldObject(type, overrides));
  }
}

// 1. BoxStation (Iconic TGStation Flagship Layout)
export function generateBoxStationMap(): { map: Tile[][]; spawnX: number; spawnY: number } {
  const width = 36;
  const height = 32;
  const map = createEmptyMap(width, height, 'Space');

  // Central Cross Concourse
  buildRoom(map, 6, 14, 30, 18, 'Floor'); // E-W Hallway
  buildRoom(map, 16, 4, 20, 28, 'Floor'); // N-S Hallway

  // SS14 / Goob Station Corridor Fixtures & Mountings (From screenshot visual reference)
  // 1. Hydroponics Planter Garden with Wildflowers
  map[15][17].turf = 'FloorPlanter';
  map[15][18].turf = 'FloorPlanter';
  map[15][19].turf = 'FloorPlanter';
  placeObj(map, 17, 15, 'Plant', { name: 'Corridor Ficus Plant' });
  placeObj(map, 19, 15, 'Plant', { name: 'Blooming Planter Flora' });

  // 2. Waiting Room Benches & Water Cooler
  placeObj(map, 14, 15, 'Bench', { name: 'Padded Hallway Bench' });
  placeObj(map, 22, 15, 'Bench', { name: 'Padded Hallway Bench' });
  placeObj(map, 13, 15, 'WaterCooler', { name: 'Station Water Cooler' });

  // 3. Vending Machines (Drink-O-Matic & Snack)
  placeObj(map, 12, 15, 'VendingSoda', { name: 'Drink-O-Matic Vendor' });
  placeObj(map, 11, 15, 'VendingSnack', { name: 'Get-More-Chocolate Vendor' });

  // 4. Fire Extinguisher Cabinets
  placeObj(map, 16, 13, 'ExtinguisherCabinet', { name: 'Extinguisher Cabinet' });
  placeObj(map, 21, 14, 'ExtinguisherCabinet', { name: 'Extinguisher Cabinet' });
  placeObj(map, 15, 20, 'ExtinguisherCabinet', { name: 'Extinguisher Cabinet' });

  // 5. Wall Directional & Regulatory Signs (as in Goob Station)
  placeObj(map, 10, 14, 'WallSign', { name: 'SEC <' });
  placeObj(map, 14, 14, 'WallSign', { name: 'EVAC <' });
  placeObj(map, 22, 14, 'WallSign', { name: 'SCI >' });
  placeObj(map, 16, 12, 'WallSign', { name: 'ENG ^' });
  placeObj(map, 20, 20, 'WallSign', { name: 'NO SMOKING' });
  placeObj(map, 16, 22, 'WallSign', { name: 'WALK!' });
  placeObj(map, 8, 14, 'MedicalSign', { name: 'Medical Cross Sign' });

  // 6. Wall Lights along Bulkheads
  placeObj(map, 15, 14, 'WallLight', { name: 'Bulkhead Wall Light' });
  placeObj(map, 21, 14, 'WallLight', { name: 'Bulkhead Wall Light' });
  placeObj(map, 17, 10, 'WallLight', { name: 'Corridor Wall Light' });
  placeObj(map, 19, 10, 'WallLight', { name: 'Corridor Wall Light' });
  placeObj(map, 17, 22, 'WallLight', { name: 'Corridor Wall Light' });
  placeObj(map, 19, 22, 'WallLight', { name: 'Corridor Wall Light' });

  // 7. Circular Air Vents & Floor Scrubbers
  placeObj(map, 18, 16, 'Vent', { name: 'Central Concourse Vent' });
  placeObj(map, 18, 17, 'GasScrubber', { name: 'Central Concourse Scrubber' });
  placeObj(map, 12, 16, 'Vent', { name: 'West Concourse Vent' });
  placeObj(map, 24, 16, 'Vent', { name: 'East Concourse Vent' });

  // 8. Fire Alarms & Air Alarms
  placeObj(map, 16, 15, 'FireAlarm', { name: 'Hallway Fire Alarm' });
  placeObj(map, 20, 15, 'AirAlarm', { name: 'Hallway Air Alarm' });

  // 1. Bridge & Captain's Quarters (North)
  buildRoom(map, 14, 3, 22, 9, 'FloorTile', 'ReinforcedWall');
  map[9][18].turf = 'FloorTile';
  placeObj(map, 18, 9, 'SecurityDoor', { name: 'Bridge Airlock' });
  placeObj(map, 18, 5, 'Computer', { name: 'Command Telemetry Console' });
  placeObj(map, 17, 6, 'Chair', { name: "Captain's Chair" });
  placeObj(map, 20, 5, 'Table');
  placeObj(map, 20, 5, 'CaptainCap');
  placeObj(map, 20, 5, 'LaserGun');

  // 2. Medbay (North-West: x: 5 to 13, y: 5 to 13)
  buildRoom(map, 5, 5, 13, 13, 'FloorWhite');
  map[13][9].turf = 'FloorWhite';
  placeObj(map, 9, 13, 'GlassDoor', { name: 'Medbay Lobby Door' });
  placeObj(map, 7, 7, 'Bed', { name: 'Trauma Bay Bed' });
  placeObj(map, 7, 10, 'Bed');
  placeObj(map, 10, 7, 'Table');
  placeObj(map, 10, 7, 'HealthAnalyzer');
  placeObj(map, 10, 7, 'BruisePack');
  placeObj(map, 10, 8, 'Table');
  placeObj(map, 10, 8, 'Ointment');
  placeObj(map, 11, 11, 'Vent');

  // 3. Security & Brig (South-West: x: 5 to 13, y: 19 to 27)
  buildRoom(map, 5, 19, 13, 27, 'Floor', 'ReinforcedWall');
  map[19][9].turf = 'Floor';
  placeObj(map, 9, 19, 'SecurityDoor', { name: 'Brig Access Airlock' });
  placeObj(map, 7, 21, 'SecurityLocker', { name: 'Armory Locker' });
  placeObj(map, 7, 21, 'Armor');
  placeObj(map, 7, 21, 'StunBaton');
  placeObj(map, 7, 23, 'SecurityLocker');
  placeObj(map, 7, 23, 'Shotgun');
  placeObj(map, 7, 23, 'Taser');
  placeObj(map, 10, 23, 'Table');
  placeObj(map, 10, 23, 'Disabler');
  placeObj(map, 11, 25, 'Chair', { name: 'Interrogation Chair' });

  // 4. Engineering & Power (East: x: 23 to 31, y: 12 to 22)
  buildRoom(map, 23, 12, 31, 22, 'FloorTile', 'ReinforcedWall');
  map[16][23].turf = 'FloorTile';
  placeObj(map, 23, 16, 'Door', { name: 'Engineering Airlock' });
  placeObj(map, 28, 14, 'GasTank', { name: 'Core Coolant Reservoir' });
  placeObj(map, 28, 16, 'SolarPanel');
  placeObj(map, 28, 18, 'APC');
  placeObj(map, 29, 14, 'CanisterO2');
  placeObj(map, 29, 18, 'CanisterPlasma');
  placeObj(map, 26, 14, 'Table');
  placeObj(map, 26, 14, 'Toolbelt');
  placeObj(map, 26, 14, 'Crowbar');
  placeObj(map, 26, 14, 'Wrench');
  placeObj(map, 26, 14, 'Weldingtool');

  // 5. Bar & Service (South-East: x: 23 to 31, y: 23 to 29)
  buildRoom(map, 23, 23, 31, 29, 'FloorBar');
  map[23][27].turf = 'FloorBar';
  placeObj(map, 27, 23, 'Door', { name: 'Bar Entrance' });
  placeObj(map, 25, 26, 'Table', { name: 'Mahogany Bar Counter' });
  placeObj(map, 25, 26, 'Beer');
  placeObj(map, 25, 26, 'Vodka');
  placeObj(map, 25, 27, 'Stool');
  placeObj(map, 28, 26, 'Table');
  placeObj(map, 28, 26, 'Tea');
  placeObj(map, 29, 27, 'Stool');

  // 6. Science & R&D (North-East: x: 23 to 31, y: 5 to 11)
  buildRoom(map, 23, 5, 31, 11, 'FloorWhite');
  map[11][27].turf = 'FloorWhite';
  placeObj(map, 27, 11, 'GlassDoor', { name: 'Science Division' });
  placeObj(map, 25, 7, 'Autolathe');
  placeObj(map, 25, 9, 'Computer', { name: 'R&D Terminal' });
  placeObj(map, 28, 8, 'Table');
  placeObj(map, 28, 8, 'LaserGun');

  return { map, spawnX: 18, spawnY: 16 };
}

// 2. MetaStation (Expansive Research & Cargo Complex)
export function generateMetaStationMap(): { map: Tile[][]; spawnX: number; spawnY: number } {
  const width = 38;
  const height = 34;
  const map = createEmptyMap(width, height, 'Space');

  // Central Ring & Main Concourse
  buildRoom(map, 8, 10, 30, 24, 'Floor');
  // Internal Courtyard Garden
  buildRoom(map, 14, 14, 24, 20, 'FloorCafeteria');
  placeObj(map, 19, 17, 'Table', { name: 'Courtyard Fountain' });
  placeObj(map, 17, 16, 'Chair');
  placeObj(map, 21, 16, 'Chair');

  // Command Deck (North: x: 13 to 25, y: 3 to 9)
  buildRoom(map, 13, 3, 25, 9, 'FloorTile', 'ReinforcedWall');
  map[9][19].turf = 'FloorTile';
  placeObj(map, 19, 9, 'SecurityDoor', { name: 'Bridge Blast Door' });
  placeObj(map, 19, 5, 'Computer', { name: 'Station Command Console' });
  placeObj(map, 16, 6, 'Chair');
  placeObj(map, 22, 6, 'Chair');

  // Medbay & Chemistry (West: x: 3 to 11, y: 11 to 23)
  buildRoom(map, 3, 11, 11, 23, 'FloorWhite');
  map[17][11].turf = 'FloorWhite';
  placeObj(map, 11, 17, 'GlassDoor', { name: 'Medbay Wing' });
  placeObj(map, 6, 14, 'Bed');
  placeObj(map, 6, 17, 'Bed');
  placeObj(map, 6, 20, 'Bed');
  placeObj(map, 9, 15, 'Table');
  placeObj(map, 9, 15, 'HealthAnalyzer');
  placeObj(map, 9, 15, 'BruisePack');
  placeObj(map, 9, 18, 'Table');
  placeObj(map, 9, 18, 'Ointment');

  // Cargo Bay & Supply (South: x: 12 to 26, y: 25 to 31)
  buildRoom(map, 12, 25, 26, 31, 'Floor', 'ReinforcedWall');
  map[25][19].turf = 'Floor';
  placeObj(map, 19, 25, 'Door', { name: 'Cargo Bay Airlock' });
  placeObj(map, 15, 28, 'Computer', { name: 'Supply Shuttle Terminal' });
  placeObj(map, 18, 28, 'Metal');
  placeObj(map, 19, 28, 'Metal');
  placeObj(map, 20, 28, 'Rod');
  placeObj(map, 23, 28, 'Autolathe');

  // Engineering / Atmospherics (East: x: 27 to 35, y: 11 to 23)
  buildRoom(map, 27, 11, 35, 23, 'FloorTile', 'ReinforcedWall');
  map[17][27].turf = 'FloorTile';
  placeObj(map, 27, 17, 'Door', { name: 'Engineering Gateway' });
  placeObj(map, 31, 14, 'GasTank', { name: 'O2 Tank' });
  placeObj(map, 31, 17, 'GasTank', { name: 'Plasma Tank' });
  placeObj(map, 33, 15, 'CanisterO2');
  placeObj(map, 33, 19, 'CanisterPlasma');
  placeObj(map, 29, 19, 'Table');
  placeObj(map, 29, 19, 'Toolbelt');
  placeObj(map, 29, 19, 'Crowbar');

  return { map, spawnX: 19, spawnY: 12 };
}

// 3. DeltaStation (4-Quadrant Modular Station)
export function generateDeltaStationMap(): { map: Tile[][]; spawnX: number; spawnY: number } {
  const width = 34;
  const height = 34;
  const map = createEmptyMap(width, height, 'Space');

  // Center Rotunda
  buildRoom(map, 12, 12, 22, 22, 'FloorTile');
  placeObj(map, 17, 17, 'Computer', { name: 'Sector Navigation Beacon' });

  // NW Quadrant: Medical Research
  buildRoom(map, 4, 4, 12, 12, 'FloorWhite');
  map[12][9].turf = 'FloorWhite';
  placeObj(map, 9, 12, 'GlassDoor', { name: 'Medical Lab' });
  placeObj(map, 7, 7, 'Bed');
  placeObj(map, 9, 8, 'Table');
  placeObj(map, 9, 8, 'HealthAnalyzer');

  // NE Quadrant: Command & Science
  buildRoom(map, 22, 4, 30, 12, 'FloorTile', 'ReinforcedWall');
  map[12][25].turf = 'FloorTile';
  placeObj(map, 25, 12, 'SecurityDoor', { name: 'Command Gate' });
  placeObj(map, 26, 7, 'Computer', { name: 'Mainframe AI Core' });
  placeObj(map, 27, 8, 'LaserGun');

  // SW Quadrant: Security Brig
  buildRoom(map, 4, 22, 12, 30, 'Floor', 'ReinforcedWall');
  map[22][9].turf = 'Floor';
  placeObj(map, 9, 22, 'SecurityDoor', { name: 'Brig Checkpoint' });
  placeObj(map, 7, 26, 'SecurityLocker');
  placeObj(map, 7, 26, 'StunBaton');
  placeObj(map, 7, 26, 'Shotgun');

  // SE Quadrant: Engineering & Atmos
  buildRoom(map, 22, 22, 30, 30, 'FloorTile', 'ReinforcedWall');
  map[22][25].turf = 'FloorTile';
  placeObj(map, 25, 22, 'Door', { name: 'Engine Wing' });
  placeObj(map, 26, 26, 'SolarPanel');
  placeObj(map, 27, 26, 'CanisterO2');
  placeObj(map, 28, 27, 'CanisterPlasma');

  return { map, spawnX: 17, spawnY: 15 };
}

// 4. KiloStation (Dense Asteroid Outpost)
export function generateKiloStationMap(): { map: Tile[][]; spawnX: number; spawnY: number } {
  const width = 32;
  const height = 30;
  const map = createEmptyMap(width, height, 'Space');

  // Main fortified hangar corridor
  buildRoom(map, 6, 8, 26, 22, 'Floor', 'ReinforcedWall');

  // EVA External Airlock (West)
  map[15][6].turf = 'Floor';
  placeObj(map, 6, 15, 'ExternalDoor', { name: 'Outer Space Airlock' });

  // Central mining barracks & terminal
  placeObj(map, 16, 12, 'Computer', { name: 'Asteroid Ore Scanner' });
  placeObj(map, 12, 12, 'Table');
  placeObj(map, 12, 12, 'Crowbar');
  placeObj(map, 12, 12, 'Wrench');
  placeObj(map, 20, 12, 'Table');
  placeObj(map, 20, 12, 'LaserGun');

  // High-pressure canisters along bulkhead
  placeObj(map, 10, 19, 'CanisterO2');
  placeObj(map, 13, 19, 'CanisterN2');
  placeObj(map, 16, 19, 'GasScrubber');
  placeObj(map, 19, 19, 'APC');
  placeObj(map, 22, 19, 'Autolathe');

  // Bunks
  placeObj(map, 23, 10, 'Bed');
  placeObj(map, 23, 13, 'Bed');

  return { map, spawnX: 15, spawnY: 15 };
}

// 5. Sector 13 (Original Griefly Engineering Complex)
export function generateSector13Map(): { map: Tile[][]; spawnX: number; spawnY: number } {
  const width = 34;
  const height = 30;
  const map = createEmptyMap(width, height, 'Space');

  // 1. Central Corridor (y: 13 to 17, x: 4 to 28)
  buildRoom(map, 4, 13, 28, 17, 'Floor');

  // 2. Medbay (North-West: x: 4 to 12, y: 3 to 13)
  buildRoom(map, 4, 3, 12, 13, 'FloorWhite');
  map[13][8].turf = 'FloorWhite';
  placeObj(map, 8, 13, 'GlassDoor', { name: 'Medbay Airlock' });

  // Medbay furnishings
  placeObj(map, 6, 6, 'Bed');
  placeObj(map, 6, 9, 'Bed');
  placeObj(map, 10, 6, 'Table');
  placeObj(map, 10, 6, 'HealthAnalyzer');
  placeObj(map, 10, 6, 'BruisePack');
  placeObj(map, 10, 9, 'Table');
  placeObj(map, 10, 9, 'Ointment');
  placeObj(map, 7, 4, 'Vent');

  // 3. Security (South-West: x: 4 to 12, y: 17 to 27)
  buildRoom(map, 4, 17, 12, 27, 'Floor', 'ReinforcedWall');
  map[17][8].turf = 'Floor';
  placeObj(map, 8, 17, 'SecurityDoor', { name: 'Security Airlock' });

  // Security furnishings
  placeObj(map, 6, 20, 'SecurityLocker');
  placeObj(map, 6, 20, 'Armor');
  placeObj(map, 6, 20, 'StunBaton');
  placeObj(map, 6, 24, 'SecurityLocker');
  placeObj(map, 6, 24, 'Gun');
  placeObj(map, 6, 24, 'AmmunitionBox');
  placeObj(map, 9, 21, 'Table');
  placeObj(map, 9, 21, 'Revolver');
  placeObj(map, 10, 24, 'Chair');

  // 4. Engineering (East: x: 20 to 28, y: 3 to 13)
  buildRoom(map, 20, 3, 28, 13, 'FloorTile', 'ReinforcedWall');
  map[13][24].turf = 'FloorTile';
  placeObj(map, 24, 13, 'Door', { name: 'Engineering Airlock' });

  // Engineering furnishings
  placeObj(map, 23, 6, 'GasTank');
  placeObj(map, 25, 6, 'PlasmaGasTank');
  placeObj(map, 23, 10, 'Pipe');
  placeObj(map, 24, 10, 'PipePump');
  placeObj(map, 25, 10, 'Pipe');
  placeObj(map, 26, 9, 'Table');
  placeObj(map, 26, 9, 'Crowbar');
  placeObj(map, 26, 9, 'Wrench');
  placeObj(map, 26, 9, 'Weldingtool');
  placeObj(map, 22, 4, 'Vent');

  // 5. Bar & Lounge (South-East: x: 20 to 28, y: 17 to 27)
  buildRoom(map, 20, 17, 28, 27, 'FloorBar');
  map[17][24].turf = 'FloorBar';
  placeObj(map, 24, 17, 'Door', { name: 'Bar Airlock' });

  // Bar furnishings
  placeObj(map, 23, 20, 'Table');
  placeObj(map, 23, 20, 'Beer');
  placeObj(map, 23, 20, 'Vodka');
  placeObj(map, 23, 21, 'Stool');
  placeObj(map, 26, 20, 'Table');
  placeObj(map, 26, 20, 'Tea');
  placeObj(map, 26, 21, 'Stool');
  placeObj(map, 24, 25, 'Vent');

  // 6. Western EVA Airlock to Space
  map[15][4].turf = 'Floor';
  placeObj(map, 4, 15, 'ExternalDoor', { name: 'EVA Airlock West' });
  placeObj(map, 5, 14, 'Closet');
  placeObj(map, 5, 14, 'SpaceSuit');
  placeObj(map, 5, 14, 'Helmet');
  placeObj(map, 5, 14, 'HandGasTank');

  return { map, spawnX: 16, spawnY: 15 };
}

// 7. Tiny Space Outpost (Minimalist 16x16 Testbed)
export function generateTinySpaceMap(): { map: Tile[][]; spawnX: number; spawnY: number } {
  const width = 16;
  const height = 16;
  const map = createEmptyMap(width, height, 'Space');
  buildRoom(map, 4, 4, 11, 11, 'Floor', 'MetalWall');
  map[11][7].turf = 'Floor';
  placeObj(map, 7, 11, 'Door', { name: 'Airlock' });
  placeObj(map, 6, 6, 'Table');
  placeObj(map, 6, 6, 'Crowbar');
  placeObj(map, 8, 6, 'Computer', { name: 'Outpost Terminal' });
  return { map, spawnX: 7, spawnY: 7 };
}

// Map Serialization to JSON format
export function serializeMapToGrieflyJson(map: Tile[][]): string {
  const height = map.length;
  const width = map[0]?.length || 0;
  const data: StationMapData = {
    depth: 1,
    height,
    width,
    tiles: [],
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = map[y][x];
      data.tiles.push({
        x,
        y,
        z: 0,
        turf: {
          type: tile.turf,
        },
        objects: tile.objects.map((obj) => ({
          type: obj.type,
          variables: {
            name_: obj.name,
            isOpen: obj.isOpen,
            isLocked: obj.isLocked,
          },
        })),
        atmos: { ...tile.atmos },
      });
    }
  }

  return JSON.stringify(data, null, 2);
}

export function parseGrieflyMapJson(jsonString: string): Tile[][] | null {
  try {
    const data = JSON.parse(jsonString) as StationMapData;
    if (!data.tiles || !Array.isArray(data.tiles)) return null;

    let maxX = 0;
    let maxY = 0;
    for (const t of data.tiles) {
      if (t.x > maxX) maxX = t.x;
      if (t.y > maxY) maxY = t.y;
    }

    const map = createEmptyMap(maxX + 1, maxY + 1, 'Space');

    for (const t of data.tiles) {
      if (t.y < map.length && t.x < map[0].length) {
        const turfType = (t.turf?.type as TurfType) || 'Space';
        map[t.y][t.x].turf = TURFS_REGISTRY[turfType] ? turfType : 'Floor';
        if (t.atmos) {
          map[t.y][t.x].atmos = {
            ...map[t.y][t.x].atmos,
            ...t.atmos,
          };
        }
        if (Array.isArray(t.objects)) {
          map[t.y][t.x].objects = t.objects.map((o) =>
            createWorldObject(o.type as Parameters<typeof createWorldObject>[0], {
              name: (o.variables?.name_ as string) || undefined,
              isOpen: (o.variables?.isOpen as boolean) || undefined,
              isLocked: (o.variables?.isLocked as boolean) || undefined,
            })
          );
        }
      }
    }

    return map;
  } catch (err) {
    console.error('Failed to parse station map JSON:', err);
    return null;
  }
}
