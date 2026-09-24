import { Tile } from '../types';
import { TURFS_REGISTRY } from '../data/assets';

// Checks if gas can flow between two tiles or through doors
export function canGasFlow(tile: Tile): boolean {
  if (!TURFS_REGISTRY[tile.turf].isPassable) {
    return false;
  }
  for (const obj of tile.objects) {
    if (obj.type.includes('Door') && !obj.isOpen) {
      return false; // Closed door blocks air flow
    }
  }
  return true;
}

export interface AtmosSimulationResult {
  breachesDetected: number;
  firesActive: number;
  plasmaLeaks: number;
}

export function simulateAtmosTick(map: Tile[][]): AtmosSimulationResult {
  const height = map.length;
  const width = map[0]?.length || 0;
  let breachesDetected = 0;
  let firesActive = 0;
  let plasmaLeaks = 0;

  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = map[y][x];

      // If this tile is Space, it is an infinite vacuum sink
      if (tile.turf === 'Space') {
        tile.atmos.pressure = 0;
        tile.atmos.o2 = 0;
        tile.atmos.n2 = 0;
        tile.atmos.plasma = 0;
        tile.atmos.co2 = 0;
        tile.atmos.n2o = 0;
        tile.atmos.temperature = 2.7;
        tile.atmos.fire = false;
        continue;
      }

      if (!canGasFlow(tile)) {
        continue;
      }

      // Check objects on this tile (Vents, Scrubbers, Gas Canisters)
      for (const obj of tile.objects) {
        if (obj.type === 'Vent') {
          // Vent supplies breathable air towards 101.3 kPa
          if (tile.atmos.pressure < 101.3) {
            const refill = Math.min(3.0, 101.3 - tile.atmos.pressure);
            tile.atmos.pressure += refill;
            tile.atmos.o2 = 21;
            tile.atmos.n2 = 78;
            tile.atmos.co2 = 1;
            tile.atmos.temperature = 293.15;
          }
        } else if (obj.type === 'GasScrubber') {
          // Active scrubber scrubs toxic plasma and excess CO2
          if (tile.atmos.plasma > 0) {
            tile.atmos.plasma = Math.max(0, tile.atmos.plasma - 3.5);
          }
          if (tile.atmos.co2 > 1) {
            tile.atmos.co2 = Math.max(1, tile.atmos.co2 - 2.0);
          }
          if ((tile.atmos.n2o || 0) > 0) {
            tile.atmos.n2o = Math.max(0, (tile.atmos.n2o || 0) - 2.0);
          }
        } else if (obj.type === 'CanisterPlasma' && obj.isOpen) {
          // Leaking plasma canister!
          tile.atmos.plasma = Math.min(100, tile.atmos.plasma + 6);
          tile.atmos.pressure = Math.min(350, tile.atmos.pressure + 4);
          plasmaLeaks++;
        } else if (obj.type === 'CanisterO2' && obj.isOpen) {
          // Pure oxygen release!
          tile.atmos.o2 = Math.min(100, tile.atmos.o2 + 8);
          tile.atmos.pressure = Math.min(350, tile.atmos.pressure + 4);
        }
      }

      // Equalization and decompression with neighbors
      let totalPressureDiff = 0;

      for (const { dx, dy } of directions) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

        const neighbor = map[ny][nx];

        // If neighbor is Space, rapid vacuum venting occurs!
        if (neighbor.turf === 'Space') {
          if (tile.atmos.pressure > 0.5) {
            breachesDetected++;
            const loss = tile.atmos.pressure * 0.4;
            totalPressureDiff -= loss;
          }
          continue;
        }

        if (canGasFlow(neighbor)) {
          const pDiff = neighbor.atmos.pressure - tile.atmos.pressure;
          const transferRate = 0.15; // 15% gas flow per tick
          const transfer = pDiff * transferRate;
          totalPressureDiff += transfer;

          // Gas molar diffusion
          if (neighbor.atmos.plasma > tile.atmos.plasma) {
            const diff = (neighbor.atmos.plasma - tile.atmos.plasma) * 0.12;
            tile.atmos.plasma += diff;
          }
          if (neighbor.atmos.o2 > tile.atmos.o2) {
            const diff = (neighbor.atmos.o2 - tile.atmos.o2) * 0.1;
            tile.atmos.o2 += diff;
          }

          // Thermal conduction between tiles
          if (neighbor.atmos.temperature > tile.atmos.temperature) {
            const tDiff = (neighbor.atmos.temperature - tile.atmos.temperature) * 0.1;
            tile.atmos.temperature += tDiff;
          }
        }
      }

      const updatedPressure = Math.max(0, tile.atmos.pressure + totalPressureDiff);
      tile.atmos.pressure = Math.round(updatedPressure * 10) / 10;

      // TGStation Plasma Fire Combustion Reaction
      // Plasma + O2 burn intensely when temperature > 373 K (100 C)
      const canBurn = tile.atmos.plasma > 1 && tile.atmos.o2 > 5 && tile.atmos.temperature >= 373;
      if (canBurn || (tile.atmos.fire && tile.atmos.plasma > 0.5 && tile.atmos.o2 > 2)) {
        tile.atmos.fire = true;
        firesActive++;
        const burnRate = Math.min(tile.atmos.plasma, tile.atmos.o2 * 0.5, 4);
        tile.atmos.plasma -= burnRate;
        tile.atmos.o2 -= burnRate;
        tile.atmos.co2 = Math.min(100, tile.atmos.co2 + burnRate * 1.5);
        tile.atmos.temperature = Math.min(1800, tile.atmos.temperature + burnRate * 45);
        tile.atmos.fireIntensity = Math.min(5, Math.ceil(burnRate));
      } else if (tile.atmos.fire) {
        tile.atmos.fire = false;
        tile.atmos.fireIntensity = 0;
      }

      // Cooling towards ambient room temperature (293.15 K)
      if (!tile.atmos.fire && tile.atmos.temperature > 293.15) {
        tile.atmos.temperature = Math.max(293.15, tile.atmos.temperature - 8);
      }
    }
  }

  return {
    breachesDetected,
    firesActive,
    plasmaLeaks,
  };
}
