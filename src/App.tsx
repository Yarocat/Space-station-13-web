import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Tile, 
  PlayerMob, 
  Projectile, 
  ChatMessage, 
  EditorTool, 
  TurfType, 
  StructureType, 
  ItemType, 
  SlotName,
  WorldObject,
  Direction,
  SpeciesType,
  SkinTone,
  Gender,
  IntentType,
  TargetZone,
  MoveMode,
  DedicatedServerConfig,
  ConstructionRecipe,
  DepartmentType,
  HairstyleType,
  FacialHairType,
} from './types';
import { 
  generateSector13Map, 
  generateBoxStationMap,
  generateMetaStationMap,
  generateDeltaStationMap,
  generateKiloStationMap,
  generateTinySpaceMap, 
  createEmptyMap, 
  serializeMapToGrieflyJson, 
  parseGrieflyMapJson 
} from './data/stationMaps';
import { TURFS_REGISTRY, STRUCTURES_REGISTRY, ITEMS_REGISTRY, createWorldObject } from './data/assets';
import { simulateAtmosTick } from './systems/atmosSystem';
import { preloadCommonDmis } from './systems/dmiSystem';
import { SoundSystem } from './audio';
import { StationCanvas } from './components/StationCanvas';
import { MidnightHud } from './components/MidnightHud';
import { CharacterSetupModal } from './components/CharacterSetupModal';
import { ContainerModal } from './components/ContainerModal';
import { ChatConsole } from './components/ChatConsole';
import { MapEditorSidebar } from './components/MapEditorSidebar';
import { MenuBar } from './components/MenuBar';
import { ContextMenu, ContextMenuTarget } from './components/ContextMenu';
import { MultiplayerModal } from './components/MultiplayerModal';
import { ConstructionModal } from './components/ConstructionModal';
import { DmiAssetModal } from './components/DmiAssetModal';
import { SoundSettingsModal } from './components/SoundSettingsModal';

/**
 * Validates whether an item can be equipped in a given inventory slot
 */
export function canEquipInSlot(itemType: ItemType, slot: SlotName): boolean {
  if (slot === 'left_hand' || slot === 'right_hand') return true;
  if (slot === 'pocket1' || slot === 'pocket2') {
    const largeItems = ['Backpack', 'Armor', 'SpaceSuit', 'FireSuit', 'Metal', 'FloorTileItem'];
    return !largeItems.includes(itemType);
  }
  if (slot === 'head') {
    return ['Helmet', 'Tophat', 'CaptainCap', 'Hardhat', 'WeldingMask', 'Beret', 'ChefHat', 'PlasmamanHelmet'].includes(itemType);
  }
  if (slot === 'mask') {
    return ['GasMask', 'SterileMask', 'MimeMask'].includes(itemType);
  }
  if (slot === 'glasses') {
    return true; // Any glasses/HUD
  }
  if (slot === 'ears') {
    return true; // Radio headset
  }
  if (slot === 'suit') {
    return ['Armor', 'SpaceSuit', 'FireSuit', 'Labcoat', 'BioSuit', 'SecurityHardsuit', 'PlasmamanSuit'].includes(itemType);
  }
  if (slot === 'uniform') {
    return itemType.includes('Uniform');
  }
  if (slot === 'gloves') {
    return true;
  }
  if (slot === 'shoes') {
    return ['BlackBoots', 'WhiteShoes', 'Galoshes', 'Magboots', 'ClownBoots'].includes(itemType);
  }
  if (slot === 'back') {
    return ['Backpack', 'HandGasTank'].includes(itemType);
  }
  if (slot === 'suit_storage') {
    return ['HandGasTank', 'StunBaton', 'Gun', 'Revolver', 'LaserGun', 'HealthAnalyzer', 'AtmosTool'].includes(itemType);
  }
  if (slot === 'belt') {
    return ['Toolbelt', 'Crowbar', 'Wrench', 'Screwdriver', 'Weldingtool', 'Wirecutters', 'StunBaton', 'HealthAnalyzer', 'AtmosTool'].includes(itemType);
  }
  if (slot === 'id') {
    return itemType === 'IDCard';
  }
  return false;
}

export default function App() {
  // Map State
  const [map, setMap] = useState<Tile[][]>(() => generateSector13Map().map);
  const [stationTick, setStationTick] = useState<number>(1);
  const [breachesCount, setBreachesCount] = useState<number>(0);
  const [firesCount, setFiresCount] = useState<number>(0);

  // Player State with full 16-slot inventory & TGStation mob mechanics
  const [player, setPlayer] = useState<PlayerMob>(() => {
    const initial = generateSector13Map();
    return {
      id: 'mob_player_1',
      name: 'Dr. John Griefly',
      job: 'Chief Engineer',
      department: 'Engineering' as DepartmentType,
      species: 'Human',
      skinTone: 'caucasian1',
      gender: 'male',
      age: 32,
      hairstyle: 'Crewcut' as HairstyleType,
      hairColor: '#451a03',
      facialHair: 'CleanShaven' as FacialHairType,
      facialHairColor: '#451a03',
      eyeColor: '#1e3a8a',
      x: initial.spawnX,
      y: initial.spawnY,
      dir: 'SOUTH',
      isGhost: false,
      isLying: false,
      pullingId: null,
      health: 100,
      bruteDamage: 0,
      burnDamage: 0,
      oxygen: 100,
      toxin: 0,
      stamina: 100,
      temperature: 310.15,
      intent: 'HELP',
      targetZone: 'chest',
      moveMode: 'run',
      throwMode: false,
      rolledSleeves: false,
      magbootsActive: false,
      visorDown: false,
      internalsOn: false,
      shoelacesUntied: false,
      grabbedMobId: null,
      cuffed: false,
      inventory: {
        head: null,
        mask: null,
        glasses: null,
        ears: null,
        suit: null,
        uniform: createWorldObject('EngineUniform'),
        gloves: null,
        shoes: createWorldObject('BlackBoots'),
        back: createWorldObject('Backpack'),
        belt: createWorldObject('Wrench'),
        suit_storage: null,
        id: createWorldObject('IDCard'),
        pocket1: null,
        pocket2: null,
        left_hand: createWorldObject('Crowbar'),
        right_hand: createWorldObject('HealthAnalyzer'),
        activeHand: 'left_hand',
      },
    };
  });

  // Projectiles (flying lasers / bullets)
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  // Comms Messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg_0',
      channel: 'SYSTEM',
      sender: 'Central Command',
      text: 'Welcome to Griefly: Sector 13. Atmospheric systems are operating normally. Have a safe shift.',
      timestamp: '08:00:00',
    },
    {
      id: 'msg_1',
      channel: 'RADIO',
      sender: 'Station Intercom',
      text: 'Station alert: Maintenance tunnels require routine inspection with crowbar and gas analyzer.',
      timestamp: '08:00:02',
    },
  ]);

  // UI & Mode State
  const [currentMapName, setCurrentMapName] = useState<string>('Sector 13');
  const [isEditorMode, setIsEditorMode] = useState<boolean>(false);
  const [showAtmosOverlay, setShowAtmosOverlay] = useState<boolean>(false);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  // Character Setup Dossier Modal (open upon entering/login)
  const [showCharacterSetup, setShowCharacterSetup] = useState<boolean>(true);

  // Goob Station Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    targets: ContextMenuTarget[];
  } | null>(null);

  // Construction & Autolathe Blueprints Modal
  const [isConstructionOpen, setIsConstructionOpen] = useState<boolean>(false);

  // TGStation & Griefly DMI Asset Manager Modal
  const [isDmiModalOpen, setIsDmiModalOpen] = useState<boolean>(false);

  // Audio Synthesizer & Spatial Sound Settings Modal
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState<boolean>(false);

  // Dedicated Server & Multiplayer Modal State
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState<boolean>(false);
  const [serverConfig, setServerConfig] = useState<DedicatedServerConfig>({
    isRunning: true,
    serverName: 'Sector 13 Dedicated Host [Goob Station Edition]',
    port: 3000,
    tickRate: 20,
    maxPlayers: 32,
    mapName: 'Sector 13',
    gameMode: 'Extended',
    connectedPlayers: [
      {
        id: 'p_host',
        name: 'Dr. John Griefly',
        job: 'Chief Engineer',
        species: 'Human',
        ping: 12,
        ip: '127.0.0.1',
        isHost: true,
        health: 100,
      },
      {
        id: 'p_2',
        name: 'Vulpix-K9',
        job: 'Security Officer',
        species: 'Vulpakanin',
        ping: 26,
        ip: '192.168.1.104',
        isHost: false,
        health: 100,
      },
      {
        id: 'p_3',
        name: 'Taj Shen',
        job: 'Atmospheric Technician',
        species: 'Tajaran',
        ping: 34,
        ip: '192.168.1.112',
        isHost: false,
        health: 98,
      },
    ],
    serverLogs: [
      'Dedicated daemon initialized on port 3000.',
      'TGStation atmospheric simulation pipeline active.',
      'Goob Station combat & mouse interaction module attached.',
      'Host player Dr. John Griefly connected as session authority.',
      'Client Vulpix-K9 (Vulpakanin Security) connected from 192.168.1.104.',
      'Client Taj Shen (Tajaran Atmostech) connected from 192.168.1.112.',
    ],
  });

  // Container Inspector Modal (for backpack, toolbelt, etc.)
  const [openContainer, setOpenContainer] = useState<WorldObject | null>(null);

  // Editor specific states
  const [currentEditorTool, setCurrentEditorTool] = useState<EditorTool>('BRUSH');
  const [selectedEditorTurf, setSelectedEditorTurf] = useState<TurfType>('Floor');
  const [selectedEditorObject, setSelectedEditorObject] = useState<StructureType | ItemType | null>(null);
  const [inspectedTile, setInspectedTile] = useState<Tile | null>(null);

  // Preload essential DMI sprites on startup
  useEffect(() => {
    preloadCommonDmis();
  }, []);

  // Helper to append chat message
  const addMessage = useCallback((channel: ChatMessage['channel'], sender: string, text: string) => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      channel,
      sender,
      text,
      timestamp,
    };
    setMessages((prev) => [...prev.slice(-150), newMsg]);
  }, []);

  // 1. Movement logic with automatic door passage & slipping hazards
  const movePlayer = useCallback((dx: number, dy: number, dir: Direction) => {
    setPlayer((prev) => {
      if (prev.isLying) {
        addMessage('SYSTEM', 'Info', "You can't walk while resting or knocked down! Click RESIST [B] to stand up.");
        return prev;
      }

      const newX = prev.x + dx;
      const newY = prev.y + dy;
      const mapHeight = map.length;
      const mapWidth = map[0]?.length || 0;

      if (newX < 0 || newX >= mapWidth || newY < 0 || newY >= mapHeight) {
        return { ...prev, dir };
      }

      const targetTile = map[newY][newX];

      // Ghost mode can fly through anything
      if (prev.isGhost) {
        return { ...prev, x: newX, y: newY, dir };
      }

      // Check wall passability
      const turfMeta = TURFS_REGISTRY[targetTile.turf];
      if (!turfMeta || !turfMeta.isPassable) {
        return { ...prev, dir };
      }

      // Check doors and blocking structures
      for (const obj of targetTile.objects) {
        if (obj.type.includes('Door')) {
          if (!obj.isOpen) {
            if (obj.welded) {
              SoundSystem.crowbar();
              addMessage('SYSTEM', 'Airlock', `${obj.name} is welded shut!`);
              return { ...prev, dir };
            }
            if (obj.isLocked) {
              SoundSystem.crowbar();
              addMessage('SYSTEM', 'Airlock', `${obj.name} is bolted locked! Access denied.`);
              return { ...prev, dir };
            }

            // Normal closed airlock: Bumping automatically opens it and allows passing through!
            obj.isOpen = true;
            obj.doorState = 'open';
            if (obj.type === 'ExternalDoor') {
              SoundSystem.airlock();
            } else {
              SoundSystem.door(true);
            }
            addMessage('SAY', prev.name, `opens the ${obj.name}.`);

            // Schedule auto-close after 3.5 seconds if unoccupied
            const closeX = newX;
            const closeY = newY;
            const doorRef = obj;
            setTimeout(() => {
              setPlayer((currPlayer) => {
                if (currPlayer.x !== closeX || currPlayer.y !== closeY) {
                  doorRef.isOpen = false;
                  doorRef.doorState = 'closed';
                  SoundSystem.door(false);
                  setMap((m) => [...m]);
                }
                return currPlayer;
              });
            }, 3500);
          }
          // Door is open: allow player to pass right through!
          continue;
        }

        if (!obj.isItem) {
          const structMeta = STRUCTURES_REGISTRY[obj.type as StructureType];
          if (structMeta && !structMeta.isPassable) {
            return { ...prev, dir };
          }
        }
      }

      // === SLIPPING HAZARD: Banana Peel ===
      const hasBananaPeel = targetTile.objects.some((o) => o.type === 'Banana');
      if (hasBananaPeel) {
        const hasSlipImmunity = prev.magbootsActive || prev.inventory.shoes?.type === 'Galoshes';
        if (!hasSlipImmunity && prev.moveMode === 'run') {
          SoundSystem.slip();
          addMessage('COMBAT', prev.name, `slips on the banana peel and falls flat on their back!`);
          return {
            ...prev,
            x: newX,
            y: newY,
            dir,
            isLying: true,
            bruteDamage: Math.min(100, (prev.bruteDamage || 0) + 5),
          };
        }
      }

      // === UNTIED SHOELACES TRIP RISK ===
      if (prev.shoelacesUntied && prev.moveMode === 'run' && Math.random() < 0.12) {
        SoundSystem.slip();
        addMessage('COMBAT', prev.name, `trips over their untied shoelaces and tumbles to the ground!`);
        return {
          ...prev,
          x: newX,
          y: newY,
          dir,
          isLying: true,
        };
      }

      // Play step sound (Clown shoes squeak, normal boots step)
      const isClown = prev.inventory.shoes?.type === 'ClownBoots';
      SoundSystem.step(isClown);

      return {
        ...prev,
        x: newX,
        y: newY,
        dir,
      };
    });
  }, [map, addMessage]);

  // Active keys and click-to-move destination
  const keysHeldRef = useRef<Set<string>>(new Set());
  const clickTargetRef = useRef<{ x: number; y: number } | null>(null);

  // Process movement step based on held keys or click-to-move
  const processMovement = useCallback(() => {
    const keys = keysHeldRef.current;
    let dx = 0;
    let dy = 0;

    if (keys.has('w') || keys.has('W') || keys.has('ArrowUp')) dy -= 1;
    if (keys.has('s') || keys.has('S') || keys.has('ArrowDown')) dy += 1;
    if (keys.has('a') || keys.has('A') || keys.has('ArrowLeft')) dx -= 1;
    if (keys.has('d') || keys.has('D') || keys.has('ArrowRight')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      clickTargetRef.current = null;
      let dir: Direction = 'SOUTH';
      if (dy < 0) dir = 'NORTH';
      else if (dy > 0) dir = 'SOUTH';
      else if (dx < 0) dir = 'WEST';
      else if (dx > 0) dir = 'EAST';

      movePlayer(dx, dy, dir);
      return true;
    }

    // Process click-to-move navigation
    if (clickTargetRef.current) {
      const target = clickTargetRef.current;
      const curX = player.x;
      const curY = player.y;

      if (curX === target.x && curY === target.y) {
        clickTargetRef.current = null;
        return false;
      }

      const diffX = target.x - curX;
      const diffY = target.y - curY;
      let stepDx = 0;
      let stepDy = 0;
      let stepDir: Direction = 'SOUTH';

      if (Math.abs(diffX) >= Math.abs(diffY)) {
        stepDx = diffX > 0 ? 1 : -1;
        stepDir = stepDx > 0 ? 'EAST' : 'WEST';
      } else {
        stepDy = diffY > 0 ? 1 : -1;
        stepDir = stepDy > 0 ? 'SOUTH' : 'NORTH';
      }

      movePlayer(stepDx, stepDy, stepDir);
      return true;
    }

    return false;
  }, [movePlayer, player.x, player.y]);

  // Swap active hands (Left/Right)
  const handleSwapHands = () => {
    setPlayer((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        activeHand: prev.inventory.activeHand === 'left_hand' ? 'right_hand' : 'left_hand',
      },
    }));
  };

  // Drop active item onto current tile
  const handleDropItem = () => {
    setPlayer((prev) => {
      const activeHand = prev.inventory.activeHand;
      const itemToDrop = prev.inventory[activeHand];
      if (!itemToDrop) return prev;

      // Add to tile
      setMap((currentMap) => {
        const nextMap = currentMap.map((row) => row.slice());
        const tile = { ...nextMap[prev.y][prev.x] };
        tile.objects = [...tile.objects, itemToDrop];
        nextMap[prev.y][prev.x] = tile;
        return nextMap;
      });

      addMessage('SAY', prev.name, `drops ${itemToDrop.name} on the floor.`);
      SoundSystem.pickup();

      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          [activeHand]: null,
        },
      };
    });
  };

  // Toggle lay / rest mode
  const handleToggleLay = () => {
    setPlayer((prev) => {
      const nextLying = !prev.isLying;
      addMessage('EMOTE', prev.name, nextLying ? 'lies down on the floor to rest.' : 'stands back up on their feet.');
      return { ...prev, isLying: nextLying };
    });
  };

  // Toggle Ghost mode
  const handleToggleGhost = () => {
    setPlayer((prev) => {
      const nextGhost = !prev.isGhost;
      if (nextGhost) {
        addMessage('COMBAT', 'Ghost Form', 'Your physical form dissolves into an ethereal spirit! You can float through station walls.');
        SoundSystem.honk();
      } else {
        addMessage('SYSTEM', 'Re-materialize', 'You condense back into a living crew member.');
      }
      return { ...prev, isGhost: nextGhost };
    });
  };

  // Resist action (Hotkeys: B)
  const handleResist = () => {
    setPlayer((prev) => {
      SoundSystem.disarm();
      if (prev.isLying) {
        addMessage('EMOTE', prev.name, 'scrambles and stands back up onto their feet!');
        return { ...prev, isLying: false };
      }
      addMessage('EMOTE', prev.name, 'resists with all their might! (Extinguishing sparks / breaking holds)');
      return prev;
    });
  };

  // Toggle sleeves
  const handleToggleSleeves = () => {
    setPlayer((prev) => {
      const next = !prev.rolledSleeves;
      addMessage('EMOTE', prev.name, next ? 'rolls up the sleeves of their jumpsuit.' : 'rolls down the sleeves of their jumpsuit.');
      SoundSystem.pickup();
      return { ...prev, rolledSleeves: next };
    });
  };

  // Toggle magboots
  const handleToggleMagboots = () => {
    setPlayer((prev) => {
      const hasMagboots = prev.inventory.shoes?.type === 'Magboots';
      if (!hasMagboots) {
        addMessage('SYSTEM', 'Equipment', 'You must be wearing Magboots to engage magnetic soles!');
        return prev;
      }
      const next = !prev.magbootsActive;
      SoundSystem.door(false);
      addMessage('EMOTE', prev.name, next ? 'engages their magboots with a loud metallic CLACK! (Slip & drift immune)' : 'disengages their magboots.');
      return { ...prev, magbootsActive: next };
    });
  };

  // Toggle visor
  const handleToggleVisor = () => {
    setPlayer((prev) => {
      const next = !prev.visorDown;
      SoundSystem.pickup();
      addMessage('EMOTE', prev.name, next ? 'flips down their protective welding visor.' : 'flips up their protective visor.');
      return { ...prev, visorDown: next };
    });
  };

  // Toggle breathing internals
  const handleToggleInternals = () => {
    setPlayer((prev) => {
      const hasMask = !!prev.inventory.mask;
      const hasTank = prev.inventory.back?.type === 'HandGasTank' || prev.inventory.suit_storage?.type === 'HandGasTank';
      if (!hasMask && !prev.internalsOn) {
        addMessage('SYSTEM', 'Internals', 'You need a gas mask equipped to connect internal breathing supply!');
        return prev;
      }
      if (!hasTank && !prev.internalsOn) {
        addMessage('SYSTEM', 'Internals', 'You need an oxygen tank on your back or in suit storage to draw internals!');
        return prev;
      }
      const next = !prev.internalsOn;
      SoundSystem.airlock();
      addMessage('EMOTE', prev.name, next ? 'connects their mask to the internal oxygen tank. *HISS*' : 'disconnects from internal oxygen supply.');
      return { ...prev, internalsOn: next };
    });
  };

  // Toggle shoelaces
  const handleToggleShoelaces = () => {
    setPlayer((prev) => {
      const next = !prev.shoelacesUntied;
      SoundSystem.pickup();
      addMessage('EMOTE', prev.name, next ? 'unties their shoelaces carelessly.' : 'neatly ties their shoelaces tight.');
      return { ...prev, shoelacesUntied: next };
    });
  };

  // Toggle Move Mode (Run / Walk)
  const handleToggleMoveMode = () => {
    setPlayer((prev) => {
      const next = prev.moveMode === 'run' ? 'walk' : 'run';
      addMessage('SYSTEM', 'Movement', `Movement mode set to: ${next.toUpperCase()}`);
      return { ...prev, moveMode: next };
    });
  };

  // Set Combat Intent
  const handleSetIntent = (intent: IntentType) => {
    setPlayer((prev) => ({ ...prev, intent }));
    addMessage('SYSTEM', 'Combat', `Intent set to: ${intent}`);
  };

  // Set Target Zone
  const handleSetTargetZone = (targetZone: TargetZone) => {
    setPlayer((prev) => ({ ...prev, targetZone }));
    addMessage('SYSTEM', 'Targeting', `Targeting zone: ${targetZone.toUpperCase()}`);
  };

  // Keyboard navigation & continuous movement loop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const moveKeys = [
        'w', 'W', 's', 'S', 'a', 'A', 'd', 'D',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      ];

      if (moveKeys.includes(e.key)) {
        e.preventDefault();
        const wasEmpty = keysHeldRef.current.size === 0;
        keysHeldRef.current.add(e.key);
        if (wasEmpty) {
          processMovement();
        }
        return;
      }

      switch (e.key) {
        case 'x':
        case 'X':
          e.preventDefault();
          handleSwapHands();
          break;
        case 'q':
        case 'Q':
          e.preventDefault();
          handleDropItem();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          setPlayer((prev) => ({ ...prev, throwMode: !prev.throwMode }));
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          handleResist();
          break;
        case '1':
          handleSetIntent('HELP');
          break;
        case '2':
          handleSetIntent('DISARM');
          break;
        case '3':
          handleSetIntent('GRAB');
          break;
        case '4':
          handleSetIntent('HARM');
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          handleToggleGhost();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          handleToggleLay();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.key);
    };

    const handleBlur = () => {
      keysHeldRef.current.clear();
      clickTargetRef.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Continuous movement ticker (~160ms cadence)
    const interval = setInterval(() => {
      processMovement();
    }, 160);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      clearInterval(interval);
    };
  }, [processMovement]);

  // Use held item
  const handleUseItem = (slot: SlotName) => {
    const item = player.inventory[slot];
    if (!item) return;

    if (item.type === 'Banana') {
      // Eat banana, toss slippery peel on tile
      setPlayer((prev) => ({
        ...prev,
        inventory: { ...prev.inventory, [slot]: null },
        stamina: Math.min(100, (prev.stamina || 0) + 15),
      }));
      setMap((m) => {
        const next = m.map((row) => row.slice());
        const curTile = { ...next[player.y][player.x], objects: [...next[player.y][player.x].objects] };
        curTile.objects.push(createWorldObject('Banana'));
        next[player.y][player.x] = curTile;
        return next;
      });
      SoundSystem.step();
      addMessage('EMOTE', player.name, 'eats the banana and tosses the slippery peel onto the floor!');
    } else if (item.type === 'BikeHorn') {
      SoundSystem.honk();
      addMessage('EMOTE', player.name, 'HONK! Squeezes the bike horn enthusiastically!');
    } else if (item.type === 'Beer' || item.type === 'Vodka' || item.type === 'Tea') {
      if ((item.charges ?? 5) > 0) {
        item.charges = (item.charges ?? 5) - 1;
        SoundSystem.step(false);
        addMessage('EMOTE', player.name, `takes a refreshing swig of ${item.name}. Ahhh!`);
        setPlayer((prev) => ({
          ...prev,
          stamina: Math.min(100, (prev.stamina || 0) + 20),
          temperature: item.type === 'Vodka' ? Math.min(320, prev.temperature + 1.5) : prev.temperature,
          health: Math.min(100, prev.health + 2),
        }));
      } else {
        addMessage('SAY', player.name, `${item.name} is completely empty!`);
      }
    } else if (item.type === 'BruisePack') {
      if (player.bruteDamage > 0) {
        setPlayer((prev) => ({
          ...prev,
          bruteDamage: Math.max(0, prev.bruteDamage - 25),
          inventory: { ...prev.inventory, [slot]: null },
        }));
        SoundSystem.pickup();
        addMessage('EMOTE', player.name, `applies a trauma patch to their ${player.targetZone}. Brute bleeding stabilized.`);
      } else {
        addMessage('SYSTEM', 'Medical', `Your ${player.targetZone} has no brute trauma wounds to dress.`);
      }
    } else if (item.type === 'Ointment') {
      if (player.burnDamage > 0) {
        setPlayer((prev) => ({
          ...prev,
          burnDamage: Math.max(0, prev.burnDamage - 25),
          inventory: { ...prev.inventory, [slot]: null },
        }));
        SoundSystem.pickup();
        addMessage('EMOTE', player.name, `soothes the plasma burns on their ${player.targetZone} with burn ointment.`);
      } else {
        addMessage('SYSTEM', 'Medical', `Your ${player.targetZone} has no burns to treat.`);
      }
    } else if (item.type === 'HealthAnalyzer') {
      SoundSystem.scanner();
      addMessage(
        'SYSTEM',
        'Health Analyzer',
        `VITALS: Subject: ${player.name} [${player.species}] | Health: ${Math.round(player.health)}% | Brute: ${Math.round(player.bruteDamage)} | Burn: ${Math.round(player.burnDamage)} | Toxin: ${Math.round(player.toxin)} | O2: ${Math.round(player.oxygen)}% | Temp: ${(player.temperature - 273.15).toFixed(1)}°C`
      );
    } else if (item.type === 'AtmosTool') {
      const tile = map[player.y][player.x];
      SoundSystem.scanner();
      addMessage(
        'ATMOS',
        'Gas Analyzer',
        `TILE (${player.x}, ${player.y}): Pressure: ${tile.atmos.pressure.toFixed(1)} kPa | Temp: ${tile.atmos.temperature.toFixed(1)} K | O2: ${tile.atmos.o2.toFixed(1)}% | Plasma: ${tile.atmos.plasma.toFixed(1)}%`
      );
    } else if (item.type === 'Backpack' || item.type === 'Toolbelt') {
      setOpenContainer(item);
    }
  };

  // Generalized equip/unequip for all 16 slots
  const handleEquipSlot = (slot: SlotName) => {
    setPlayer((prev) => {
      const activeHand = prev.inventory.activeHand;
      const handItem = prev.inventory[activeHand];
      const slotItem = prev.inventory[slot];

      // If clicking on hand slot:
      if (slot === 'left_hand' || slot === 'right_hand') {
        if (prev.inventory.activeHand !== slot) {
          return {
            ...prev,
            inventory: {
              ...prev.inventory,
              activeHand: slot,
            },
          };
        } else if (slotItem) {
          handleUseItem(slot);
          return prev;
        }
        return prev;
      }

      // If slot has item and active hand is empty: Unequip to active hand!
      if (slotItem && !handItem) {
        SoundSystem.pickup();
        addMessage('EMOTE', prev.name, `takes off the ${slotItem.name} and holds it.`);
        return {
          ...prev,
          inventory: {
            ...prev.inventory,
            [slot]: null,
            [activeHand]: slotItem,
          },
        };
      }

      // If active hand holds item:
      if (handItem) {
        if (!canEquipInSlot(handItem.type as ItemType, slot)) {
          addMessage('SYSTEM', 'Inventory', `You cannot equip ${handItem.name} in your ${slot} slot!`);
          SoundSystem.crowbar();
          return prev;
        }

        SoundSystem.pickup();
        addMessage('EMOTE', prev.name, `equips ${handItem.name} to their ${slot}.`);
        return {
          ...prev,
          inventory: {
            ...prev.inventory,
            [slot]: handItem,
            [activeHand]: slotItem || null,
          },
        };
      }

      return prev;
    });
  };

  // Fire Gun / Weapon in direction of target tile (Goob Station Gunplay)
  const fireWeapon = (weapon: WorldObject, targetX: number, targetY: number) => {
    if (weapon.charges !== undefined && weapon.charges <= 0) {
      addMessage('COMBAT', player.name, `*click* - ${weapon.name} is out of ammunition!`);
      SoundSystem.crowbar();
      return;
    }

    if (weapon.charges !== undefined) {
      weapon.charges -= 1;
    }

    // Direction vector
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const dist = Math.hypot(dx, dy) || 1;
    const baseAngle = Math.atan2(dy, dx);
    const speed = 0.55;

    // Extinguisher Spray
    if (weapon.type === 'Extinguisher') {
      SoundSystem.airlock();
      addMessage('SAY', player.name, `sprays cold water/foam extinguishing propellant!`);
      // Extinguish target and adjacent tiles
      setMap((prevMap) => {
        const next = prevMap.map((row) => row.map((t) => ({ ...t, atmos: { ...t.atmos }, objects: [...t.objects] })));
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const ny = Math.floor(targetY + oy);
            const nx = Math.floor(targetX + ox);
            if (ny >= 0 && ny < next.length && nx >= 0 && nx < next[0].length) {
              next[ny][nx].atmos.fire = false;
              next[ny][nx].atmos.fireIntensity = 0;
              next[ny][nx].atmos.temperature = Math.min(next[ny][nx].atmos.temperature, 290);
            }
          }
        }
        return next;
      });
      return;
    }

    // Shotgun Buckshot Spread (3 pellets)
    if (weapon.type === 'Shotgun') {
      SoundSystem.gunshot();
      const spreadAngles = [-0.14, 0, 0.14];
      const newProjs: Projectile[] = spreadAngles.map((offset, i) => {
        const angle = baseAngle + offset;
        return {
          id: `proj_buckshot_${Date.now()}_${i}`,
          x: player.x + 0.5,
          y: player.y + 0.5,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          type: 'bullet',
          rangeLeft: 12,
          damage: 25,
          sourceId: player.id,
        };
      });
      setProjectiles((prev) => [...prev, ...newProjs]);
      addMessage('COMBAT', player.name, `fires shotgun buckshot blast towards (${targetX}, ${targetY})!`);
      return;
    }

    const isLaser = weapon.type === 'LaserGun';
    const isTaser = weapon.type === 'Taser';
    const isDisabler = weapon.type === 'Disabler';

    if (isLaser) {
      SoundSystem.laser();
    } else if (isTaser) {
      SoundSystem.scanner();
    } else if (isDisabler) {
      SoundSystem.scanner();
    } else {
      SoundSystem.gunshot();
    }

    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    const newProjectile: Projectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      x: player.x + 0.5,
      y: player.y + 0.5,
      vx,
      vy,
      type: isLaser ? 'laser' : isTaser ? 'taser' : isDisabler ? 'disabler' : 'bullet',
      rangeLeft: 18,
      damage: isLaser ? 30 : isTaser ? 5 : isDisabler ? 10 : 25,
      sourceId: player.id,
    };

    setProjectiles((prev) => [...prev, newProjectile]);
    addMessage('COMBAT', player.name, `fires ${weapon.name} towards (${targetX}, ${targetY})!`);
  };

  // Context Menu Action Handler
  const handleContextMenuAction = (actionId: string, target: ContextMenuTarget) => {
    setContextMenu(null);
    if (actionId === 'examine') {
      addMessage('SYSTEM', 'Examine', target.examineText || `You look at ${target.name}.`);
      SoundSystem.scanner();
      return;
    }
    if (actionId === 'resist') {
      setPlayer((p) => ({
        ...p,
        isLying: false,
        stamina: Math.min(100, p.stamina + 20),
      }));
      SoundSystem.step();
      addMessage('EMOTE', player.name, 'resists and gets back onto their feet.');
      return;
    }
    if (actionId === 'pickup') {
      for (let ty = 0; ty < map.length; ty++) {
        for (let tx = 0; tx < map[0].length; tx++) {
          const objIdx = map[ty][tx].objects.findIndex((o) => o.id === target.id);
          if (objIdx !== -1) {
            const item = map[ty][tx].objects[objIdx];
            const activeHand = player.inventory.activeHand;
            if (player.inventory[activeHand]) {
              addMessage('SYSTEM', 'Inventory', `Your active hand (${activeHand}) is already holding something!`);
              SoundSystem.crowbar();
              return;
            }
            map[ty][tx].objects.splice(objIdx, 1);
            setMap((m) => [...m]);
            setPlayer((p) => ({
              ...p,
              inventory: {
                ...p.inventory,
                [activeHand]: item,
              },
            }));
            SoundSystem.pickup();
            addMessage('EMOTE', player.name, `picks up ${item.name}.`);
            return;
          }
        }
      }
    }
    if (actionId === 'toggle_open' || actionId === 'toggle_lock' || actionId === 'weld') {
      for (let ty = 0; ty < map.length; ty++) {
        for (let tx = 0; tx < map[0].length; tx++) {
          const obj = map[ty][tx].objects.find((o) => o.id === target.id);
          if (obj) {
            const isLocker = obj.type.includes('Locker') || obj.type === 'Closet';
            if (actionId === 'toggle_open') {
              obj.isOpen = !obj.isOpen;
              if (isLocker) {
                SoundSystem.closet(obj.isOpen, tx, ty, player.x, player.y);
              } else {
                SoundSystem.door(obj.isOpen, tx, ty, player.x, player.y);
              }
              addMessage('SAY', player.name, `${obj.isOpen ? 'opens' : 'closes'} the ${obj.name}.`);
            } else if (actionId === 'toggle_lock') {
              obj.isLocked = !obj.isLocked;
              if (isLocker) {
                SoundSystem.closetLock(obj.isLocked, tx, ty, player.x, player.y);
              } else {
                SoundSystem.crowbar(tx, ty, player.x, player.y);
              }
              addMessage('SAY', player.name, `${obj.isLocked ? 'engages the bolts on' : 'disengages the bolts on'} the ${obj.name}.`);
            } else if (actionId === 'weld') {
              obj.welded = !obj.welded;
              SoundSystem.welder();
              addMessage('SAY', player.name, `${obj.welded ? 'welds shut' : 'unwelds'} the ${obj.name}.`);
            }
            setMap((m) => [...m]);
            return;
          }
        }
      }
    }
    if (actionId === 'pry_floor') {
      for (let ty = 0; ty < map.length; ty++) {
        for (let tx = 0; tx < map[0].length; tx++) {
          if (`turf_${tx}_${ty}` === target.id) {
            map[ty][tx].turf = 'Plating';
            map[ty][tx].objects.push(createWorldObject('FloorTileItem'));
            SoundSystem.crowbar();
            addMessage('SAY', player.name, `pries up the floor tile exposing the sub-plating.`);
            setMap((m) => [...m]);
            return;
          }
        }
      }
    }
  };

  // Primary Tile Click Handler (Handles Left Click Actions & Right Click Goob Station Context Menu)
  const handleTileClick = (x: number, y: number, isRightClick?: boolean, screenPos?: { x: number; y: number }) => {
    if (x < 0 || x >= (map[0]?.length || 0) || y < 0 || y >= map.length) return;

    // === RIGHT CLICK: Goob Station Context Menu ===
    if (isRightClick) {
      const tile = map[y][x];
      const targets: ContextMenuTarget[] = [];

      // 1. Mob target (if player or crew on tile)
      if (player.x === x && player.y === y) {
        targets.push({
          id: player.id,
          name: `${player.name} (${player.job})`,
          type: 'mob',
          examineText: `[${player.species}] ${player.name} (${player.job}) - Health: ${player.health}%, Intent: ${player.intent}`,
          actions: [
            { id: 'examine', label: 'Examine Dossier', icon: 'User' },
            { id: 'resist', label: 'Resist / Stand Up', icon: 'RefreshCw' },
          ],
          data: { player },
        });
      }

      // 2. Objects on tile
      for (const obj of tile.objects) {
        const isDoor = obj.type.includes('Door');
        const isLocker = obj.type.includes('Locker') || obj.type === 'Closet';
        const isItem = !!ITEMS_REGISTRY[obj.type as ItemType];

        const actions = [
          { id: 'examine', label: `Examine ${obj.name}`, icon: 'Search' },
        ];

        if (isItem) {
          actions.push({ id: 'pickup', label: `Pick Up into Active Hand`, icon: 'Hand' });
        }

        if (isDoor || isLocker) {
          actions.push({
            id: 'toggle_open',
            label: obj.isOpen ? 'Close' : 'Open',
            icon: 'DoorOpen',
          });
          actions.push({
            id: 'toggle_lock',
            label: obj.isLocked ? 'Bolt Up (Unlock)' : 'Bolt Down (Lock)',
            icon: 'Lock',
          });
        }

        if (isDoor) {
          actions.push({
            id: 'weld',
            label: obj.welded ? 'Slice Welds' : 'Weld Airlock Shut',
            icon: 'Flame',
          });
        }

        targets.push({
          id: obj.id,
          name: obj.name,
          type: 'object',
          examineText: `${obj.name}: A station entity. Status: ${obj.isOpen ? 'Open' : 'Closed'}${obj.welded ? ' [WELDED]' : ''}${obj.isLocked ? ' [BOLTED]' : ''}.`,
          actions,
          data: obj,
        });
      }

      // 3. Turf Target
      targets.push({
        id: `turf_${x}_${y}`,
        name: `${tile.turf} (${x}, ${y})`,
        type: 'turf',
        examineText: `${tile.turf} at (${x}, ${y}). Atmosphere: ${tile.atmos.pressure.toFixed(1)} kPa | O2: ${tile.atmos.o2.toFixed(1)} | N2: ${tile.atmos.n2.toFixed(1)} | Plasma: ${tile.atmos.plasma.toFixed(1)} | Temp: ${tile.atmos.temperature.toFixed(1)}K${tile.atmos.fire ? ' [BURNING]' : ''}`,
        actions: [
          { id: 'examine', label: 'Examine Turf & Atmosphere', icon: 'Compass' },
          ...(tile.turf.startsWith('Floor') ? [{ id: 'pry_floor', label: 'Pry Floor Tile (Crowbar)', icon: 'Wrench' }] : []),
        ],
        data: { turf: tile.turf, atmos: tile.atmos },
      });

      setContextMenu({
        x: screenPos?.x ?? 250,
        y: screenPos?.y ?? 250,
        targets,
      });
      return;
    }

    // Dismiss context menu on left click
    if (contextMenu) {
      setContextMenu(null);
    }
    if (x < 0 || x >= (map[0]?.length || 0) || y < 0 || y >= map.length) return;

    // === 1. MAP EDITOR INTERACTIONS ===
    if (isEditorMode) {
      setMap((currentMap) => {
        const nextMap = currentMap.map((row) => row.slice());
        const tile = { ...nextMap[y][x], objects: [...nextMap[y][x].objects] };

        if (currentEditorTool === 'BRUSH') {
          if (selectedEditorObject) {
            tile.objects.push(createWorldObject(selectedEditorObject));
            SoundSystem.pickup();
          } else {
            tile.turf = selectedEditorTurf;
            tile.atmos = { ...TURFS_REGISTRY[selectedEditorTurf].defaultAtmos };
            SoundSystem.step();
          }
        } else if (currentEditorTool === 'ERASE') {
          if (tile.objects.length > 0) {
            tile.objects.pop();
          } else {
            tile.turf = 'Space';
            tile.atmos = { ...TURFS_REGISTRY['Space'].defaultAtmos };
          }
          SoundSystem.welder();
        } else if (currentEditorTool === 'FILL') {
          const targetTurf = tile.turf;
          const fillTurf = selectedEditorTurf;
          if (targetTurf !== fillTurf) {
            const queue: [number, number][] = [[x, y]];
            const visited = new Set<string>();
            while (queue.length > 0) {
              const [cx, cy] = queue.pop()!;
              const key = `${cx},${cy}`;
              if (visited.has(key)) continue;
              visited.add(key);

              if (cx >= 0 && cx < (nextMap[0]?.length || 0) && cy >= 0 && cy < nextMap.length) {
                if (nextMap[cy][cx].turf === targetTurf) {
                  nextMap[cy][cx] = {
                    ...nextMap[cy][cx],
                    turf: fillTurf,
                    atmos: { ...TURFS_REGISTRY[fillTurf].defaultAtmos },
                  };
                  queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
                }
              }
            }
          }
        } else if (currentEditorTool === 'INSPECT') {
          setInspectedTile(tile);
        }

        nextMap[y][x] = tile;
        if (currentEditorTool === 'INSPECT') {
          setInspectedTile(tile);
        }
        return nextMap;
      });
      return;
    }

    // === 2. SIMULATION / PLAY INTERACTIONS ===
    const isAdjacent = Math.abs(x - player.x) <= 1 && Math.abs(y - player.y) <= 1;
    const activeHand = player.inventory.activeHand;
    const heldItem = player.inventory[activeHand];

    // If holding a gun and clicked further away: SHOOT!
    if (heldItem && (heldItem.type === 'Gun' || heldItem.type === 'Revolver' || heldItem.type === 'LaserGun')) {
      if (!isAdjacent) {
        fireWeapon(heldItem, x, y);
        return;
      }
    } else if (!isAdjacent) {
      // Click-to-walk to target destination
      clickTargetRef.current = { x, y };
      processMovement();
      return;
    }

    // Adjacent / Current tile interaction
    if (isAdjacent) {
      const tile = map[y][x];

      // Check for Door
      const doorObj = tile.objects.find((o) => o.type.includes('Door'));
      if (doorObj) {
        // If holding crowbar, pry open door
        if (heldItem && heldItem.type === 'Crowbar') {
          doorObj.isOpen = !doorObj.isOpen;
          doorObj.isLocked = false;
          SoundSystem.crowbar();
          addMessage('SAY', player.name, `pries the ${doorObj.name} ${doorObj.isOpen ? 'open' : 'closed'} with the crowbar.`);
          setMap((m) => [...m]);
          return;
        }

        // If holding welder, weld/unweld door
        if (heldItem && heldItem.type === 'Weldingtool') {
          doorObj.welded = !doorObj.welded;
          SoundSystem.welder();
          addMessage('SAY', player.name, `${doorObj.welded ? 'welds shut' : 'unwelds'} the ${doorObj.name}.`);
          setMap((m) => [...m]);
          return;
        }

        if (doorObj.welded) {
          addMessage('SYSTEM', 'Airlock', `${doorObj.name} is welded shut! Use a welding tool to slice it open.`);
          return;
        }

        // Toggle airlock
        doorObj.isOpen = !doorObj.isOpen;
        if (doorObj.type === 'ExternalDoor') {
          SoundSystem.airlock();
        } else {
          SoundSystem.door(doorObj.isOpen);
        }
        addMessage('SAY', player.name, `${doorObj.isOpen ? 'opens' : 'closes'} the ${doorObj.name}.`);
        setMap((m) => [...m]);
        return;
      }

      // Check for Crowbar on floor -> pry up tile
      if (heldItem && heldItem.type === 'Crowbar' && tile.turf.startsWith('Floor')) {
        tile.turf = 'Plating';
        tile.objects.push(createWorldObject('FloorTileItem'));
        SoundSystem.crowbar();
        addMessage('SAY', player.name, 'pries up a floor tile, exposing bare subfloor plating.');
        setMap((m) => [...m]);
        return;
      }

      // Check for FloorTile on Plating -> install floor
      if (heldItem && heldItem.type === 'FloorTileItem' && tile.turf === 'Plating') {
        tile.turf = 'Floor';
        player.inventory[activeHand] = null;
        SoundSystem.step();
        addMessage('SAY', player.name, 'installs the floor tile onto the plating.');
        setMap((m) => [...m]);
        return;
      }

      // Check for Health Analyzer on crew
      if (heldItem && heldItem.type === 'HealthAnalyzer') {
        SoundSystem.scanner();
        addMessage('SYSTEM', 'Medical Scan', `Scanning target at (${x}, ${y}): No fractures detected. Vitals stable.`);
        return;
      }

      // Check for Closet / Locker
      const closetObj = tile.objects.find((o) => o.type === 'Closet' || o.type === 'SecurityLocker');
      if (closetObj) {
        closetObj.isOpen = !closetObj.isOpen;
        SoundSystem.closet(closetObj.isOpen, x, y, player.x, player.y);
        addMessage('SAY', player.name, `${closetObj.isOpen ? 'opens' : 'closes'} ${closetObj.name}.`);
        setMap((m) => [...m]);
        return;
      }

      // Check for Pickup Item if active hand is empty
      if (!heldItem) {
        const itemOnTileIndex = tile.objects.findIndex((o) => o.isItem);
        if (itemOnTileIndex !== -1) {
          const pickedItem = tile.objects.splice(itemOnTileIndex, 1)[0];
          player.inventory[activeHand] = pickedItem;
          SoundSystem.pickup();
          addMessage('SAY', player.name, `picks up ${pickedItem.name}.`);
          setMap((m) => [...m]);
          return;
        }
      }

      // Step onto adjacent tile if passable
      const dx = x - player.x;
      const dy = y - player.y;
      const dir: Direction = dx > 0 ? 'EAST' : dx < 0 ? 'WEST' : dy > 0 ? 'SOUTH' : 'NORTH';
      movePlayer(dx, dy, dir);
    } else {
      // Step towards target tile
      const dx = Math.sign(x - player.x);
      const dy = Math.sign(y - player.y);
      const dir: Direction = dx !== 0 ? (dx > 0 ? 'EAST' : 'WEST') : dy > 0 ? 'SOUTH' : 'NORTH';
      movePlayer(dx, dy, dir);
    }
  };

  // Container storage handlers
  const handleStoreInContainer = () => {
    if (!openContainer) return;
    const activeHand = player.inventory.activeHand;
    const heldItem = player.inventory[activeHand];
    if (!heldItem) return;

    if (!openContainer.contains) openContainer.contains = [];
    openContainer.contains.push(heldItem);

    setPlayer((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [activeHand]: null,
      },
    }));
    SoundSystem.pickup();
    addMessage('EMOTE', player.name, `places the ${heldItem.name} into their ${openContainer.name}.`);
  };

  const handleRetrieveFromContainer = (index: number) => {
    if (!openContainer || !openContainer.contains) return;
    const item = openContainer.contains[index];
    if (!item) return;

    const activeHand = player.inventory.activeHand;
    if (player.inventory[activeHand] !== null) {
      addMessage('SYSTEM', 'Inventory', 'Your active hand is full! Put away what you are holding first.');
      return;
    }

    openContainer.contains.splice(index, 1);
    setPlayer((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [activeHand]: item,
      },
    }));
    SoundSystem.pickup();
    addMessage('EMOTE', player.name, `takes out the ${item.name} from their ${openContainer.name}.`);
  };

  // Save Character Profile from Setup Modal
  const handleSaveProfile = (profile: {
    name: string;
    gender: Gender;
    age: number;
    species: SpeciesType;
    skinTone: SkinTone;
    job: string;
    startingItems: {
      head?: ItemType;
      mask?: ItemType;
      uniform?: ItemType;
      suit?: ItemType;
      shoes?: ItemType;
      back?: ItemType;
      left_hand?: ItemType;
      right_hand?: ItemType;
      id?: ItemType;
    };
  }) => {
    setPlayer((prev) => ({
      ...prev,
      name: profile.name,
      gender: profile.gender,
      age: profile.age,
      species: profile.species,
      skinTone: profile.skinTone,
      job: profile.job,
      inventory: {
        ...prev.inventory,
        head: profile.startingItems.head ? createWorldObject(profile.startingItems.head) : null,
        mask: profile.startingItems.mask ? createWorldObject(profile.startingItems.mask) : null,
        uniform: profile.startingItems.uniform ? createWorldObject(profile.startingItems.uniform) : null,
        suit: profile.startingItems.suit ? createWorldObject(profile.startingItems.suit) : null,
        shoes: profile.startingItems.shoes ? createWorldObject(profile.startingItems.shoes) : null,
        back: profile.startingItems.back ? createWorldObject(profile.startingItems.back) : null,
        left_hand: profile.startingItems.left_hand ? createWorldObject(profile.startingItems.left_hand) : null,
        right_hand: profile.startingItems.right_hand ? createWorldObject(profile.startingItems.right_hand) : null,
        id: profile.startingItems.id ? createWorldObject(profile.startingItems.id) : null,
      },
    }));
    addMessage('SYSTEM', 'Central Command', `Personnel manifest registered: ${profile.name}, ${profile.species} ${profile.job} onboard Sector 13.`);
  };

  // 3. Projectile Updates and Atmos Simulation Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setStationTick((t) => t + 1);

      // Run atmospheric simulation tick
      setMap((prevMap) => {
        const nextMap = prevMap.map((row) =>
          row.map((tile) => ({
            ...tile,
            atmos: { ...tile.atmos },
            objects: [...tile.objects],
          }))
        );

        const stats = simulateAtmosTick(nextMap);
        setBreachesCount(stats.breachesDetected);
        setFiresCount(stats.firesActive);

        return nextMap;
      });

      // Update flying projectiles
      setProjectiles((prev) => {
        if (prev.length === 0) return prev;
        const nextList: Projectile[] = [];

        for (const p of prev) {
          const nextX = p.x + p.vx;
          const nextY = p.y + p.vy;
          const tileX = Math.floor(nextX);
          const tileY = Math.floor(nextY);

          if (
            tileY < 0 ||
            tileY >= map.length ||
            tileX < 0 ||
            tileX >= (map[0]?.length || 0)
          ) {
            continue;
          }

          const targetTile = map[tileY][tileX];
          const turfMeta = TURFS_REGISTRY[targetTile.turf];

          if (!turfMeta || !turfMeta.isPassable) {
            SoundSystem.punch();
            continue;
          }

          if (p.rangeLeft <= 1) {
            continue;
          }

          nextList.push({
            ...p,
            x: nextX,
            y: nextY,
            rangeLeft: p.rangeLeft - 1,
          });
        }

        return nextList;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [map]);

  // Chat message send handler
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    if (text.startsWith('/me ')) {
      addMessage('EMOTE', player.name, text.slice(4));
    } else if (text.startsWith('/ooc ')) {
      addMessage('OOC', player.name, text.slice(5));
    } else if (text.startsWith('/r ') || text.startsWith(';')) {
      const radioText = text.startsWith(';') ? text.slice(1) : text.slice(3);
      addMessage('RADIO', `${player.name} (${player.job})`, `[Common]: "${radioText}"`);
      SoundSystem.scanner();
    } else {
      addMessage('SAY', player.name, `says, "${text}"`);
    }
  };

  // Map Preset loader for all TGStation map layouts
  const handleSelectMap = (mapName: 'boxstation' | 'metastation' | 'deltastation' | 'kilostation' | 'sector13' | 'tiny_space' | 'blank') => {
    let newMap: Tile[][];
    let spawnX = 16;
    let spawnY = 14;
    let displayName = 'Sector 13';

    if (mapName === 'boxstation') {
      const res = generateBoxStationMap();
      newMap = res.map;
      spawnX = res.spawnX;
      spawnY = res.spawnY;
      displayName = 'BoxStation';
    } else if (mapName === 'metastation') {
      const res = generateMetaStationMap();
      newMap = res.map;
      spawnX = res.spawnX;
      spawnY = res.spawnY;
      displayName = 'MetaStation';
    } else if (mapName === 'deltastation') {
      const res = generateDeltaStationMap();
      newMap = res.map;
      spawnX = res.spawnX;
      spawnY = res.spawnY;
      displayName = 'DeltaStation';
    } else if (mapName === 'kilostation') {
      const res = generateKiloStationMap();
      newMap = res.map;
      spawnX = res.spawnX;
      spawnY = res.spawnY;
      displayName = 'KiloStation';
    } else if (mapName === 'tiny_space') {
      const res = generateTinySpaceMap();
      newMap = res.map;
      spawnX = res.spawnX;
      spawnY = res.spawnY;
      displayName = 'Tiny Space';
    } else if (mapName === 'sector13') {
      const res = generateSector13Map();
      newMap = res.map;
      spawnX = res.spawnX;
      spawnY = res.spawnY;
      displayName = 'Sector 13';
    } else {
      newMap = createEmptyMap(32, 32, 'Space');
      spawnX = 16;
      spawnY = 16;
      displayName = 'Empty Grid';
    }

    setMap(newMap);
    setCurrentMapName(displayName);
    setPlayer((prev) => ({
      ...prev,
      x: spawnX,
      y: spawnY,
    }));
    addMessage('SYSTEM', 'Central Command', `Loaded station layout: [${displayName}].`);
  };

  const handleLoadPreset = (preset: 'sector13' | 'tiny_space' | 'blank') => {
    handleSelectMap(preset);
  };

  // Construction fabrication handler
  const handleConstruct = (recipe: ConstructionRecipe) => {
    const tx = player.x;
    const ty = player.y;
    setMap((prev) => {
      const next = prev.map((row) => row.slice());
      if (recipe.isTurf) {
        next[ty][tx].turf = recipe.resultType as TurfType;
      } else if (recipe.isItem) {
        next[ty][tx].objects.push(createWorldObject(recipe.resultType as ItemType));
      } else {
        next[ty][tx].objects.push(createWorldObject(recipe.resultType as StructureType));
      }
      return next;
    });
    SoundSystem.wrench();
    addMessage('SYSTEM', 'Construction', `Fabricated ${recipe.name}!`);
    setIsConstructionOpen(false);
  };

  // Inventory array for construction requirements
  const allInventoryItems: WorldObject[] = Object.values(player.inventory).filter(
    (item): item is WorldObject => item !== null && typeof item === 'object' && 'type' in item
  );

  // Export JSON
  const handleExportJson = () => {
    const json = serializeMapToGrieflyJson(map);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `station_map_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addMessage('SYSTEM', 'Editor', 'Map configuration downloaded as JSON.');
  };

  // Import JSON
  const handleImportJson = (jsonString: string) => {
    const loaded = parseGrieflyMapJson(jsonString);
    if (loaded) {
      setMap(loaded);
      addMessage('SYSTEM', 'Editor', 'Map successfully loaded from JSON.');
    } else {
      addMessage('SYSTEM', 'Editor', 'Failed to parse JSON map file.');
    }
  };

  // Remove single object from tile in Map Editor
  const handleRemoveObjectFromTile = (tileX: number, tileY: number, objId: string) => {
    setMap((currentMap) => {
      const nextMap = currentMap.map((row) => row.slice());
      const tile = { ...nextMap[tileY][tileX] };
      tile.objects = tile.objects.filter((o) => o.id !== objId);
      nextMap[tileY][tileX] = tile;
      if (inspectedTile && inspectedTile.x === tileX && inspectedTile.y === tileY) {
        setInspectedTile(tile);
      }
      return nextMap;
    });
  };

  // Clear all objects on tile in Map Editor
  const handleClearTile = (tileX: number, tileY: number) => {
    setMap((currentMap) => {
      const nextMap = currentMap.map((row) => row.slice());
      const tile = {
        ...nextMap[tileY][tileX],
        objects: [],
        turf: 'Space' as TurfType,
        atmos: { ...TURFS_REGISTRY['Space'].defaultAtmos },
      };
      nextMap[tileY][tileX] = tile;
      if (inspectedTile && inspectedTile.x === tileX && inspectedTile.y === tileY) {
        setInspectedTile(tile);
      }
      return nextMap;
    });
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-neutral-950 font-mono text-neutral-100 select-none">
      {/* Top Menu Bar */}
      <MenuBar
        isEditorMode={isEditorMode}
        setIsEditorMode={setIsEditorMode}
        showAtmosOverlay={showAtmosOverlay}
        setShowAtmosOverlay={setShowAtmosOverlay}
        onResetRound={() => handleSelectMap('sector13')}
        onOpenCharacterSetup={() => setShowCharacterSetup(true)}
        onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
        onOpenConstruction={() => setIsConstructionOpen(true)}
        onOpenDmiManager={() => setIsDmiModalOpen(true)}
        onOpenSoundSettings={() => setIsSoundSettingsOpen(true)}
        onSelectMap={handleSelectMap}
        currentMapName={currentMapName}
        stationTick={stationTick}
        breachesCount={breachesCount}
        firesCount={firesCount}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Central Game Viewport */}
        <div className="flex-1 relative h-full">
          <StationCanvas
            map={map}
            player={player}
            projectiles={projectiles}
            onTileClick={handleTileClick}
            showAtmosOverlay={showAtmosOverlay}
            isEditorMode={isEditorMode}
            selectedEditorTurf={selectedEditorTurf}
            selectedEditorObject={selectedEditorObject || undefined}
            currentEditorTool={currentEditorTool}
            hoveredTile={hoveredTile}
            setHoveredTile={setHoveredTile}
          />

          {/* Space Station 13 TGStation Midnight HUD (shown in Play mode) */}
          {!isEditorMode && (
            <MidnightHud
              player={player}
              onEquipSlot={handleEquipSlot}
              onDropItem={handleDropItem}
              onToggleThrow={() => setPlayer((p) => ({ ...p, throwMode: !p.throwMode }))}
              onResist={handleResist}
              onSwapHand={handleSwapHands}
              onSetIntent={handleSetIntent}
              onSetTargetZone={handleSetTargetZone}
              onToggleMoveMode={handleToggleMoveMode}
              onToggleSleeves={handleToggleSleeves}
              onToggleMagboots={handleToggleMagboots}
              onToggleVisor={handleToggleVisor}
              onToggleInternals={handleToggleInternals}
              onToggleShoelaces={handleToggleShoelaces}
              onOpenCharacterSetup={() => setShowCharacterSetup(true)}
              onOpenContainer={(c) => setOpenContainer(c)}
            />
          )}
        </div>

        {/* Right Sidebar: Chat Console or Map Editor Sidebar */}
        <div className="w-84 md:w-96 h-full flex flex-col shrink-0 z-20">
          {isEditorMode ? (
            <MapEditorSidebar
              currentTool={currentEditorTool}
              setCurrentTool={setCurrentEditorTool}
              selectedTurf={selectedEditorTurf}
              setSelectedTurf={setSelectedEditorTurf}
              selectedObject={selectedEditorObject}
              setSelectedObject={setSelectedEditorObject}
              inspectedTile={inspectedTile}
              onRemoveObjectFromTile={handleRemoveObjectFromTile}
              onClearTile={handleClearTile}
              onLoadPreset={handleLoadPreset}
              onExportJson={handleExportJson}
              onImportJson={handleImportJson}
            />
          ) : (
            <ChatConsole messages={messages} onSendMessage={handleSendMessage} />
          )}
        </div>
      </div>

      {/* Character Dossier & Customization Modal */}
      <CharacterSetupModal
        isOpen={showCharacterSetup}
        onClose={() => setShowCharacterSetup(false)}
        player={player}
        onSaveProfile={handleSaveProfile}
      />

      {/* Container Drawer (Backpack, Toolbelt) */}
      <ContainerModal
        isOpen={!!openContainer}
        onClose={() => setOpenContainer(null)}
        container={openContainer}
        activeHandItem={player.inventory[player.inventory.activeHand]}
        onStoreActiveItem={handleStoreInContainer}
        onRetrieveItem={handleRetrieveFromContainer}
      />

      {/* Goob Station Mouse Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targets={contextMenu.targets}
          onClose={() => setContextMenu(null)}
          onAction={handleContextMenuAction}
        />
      )}

      {/* Construction & Autolathe Blueprints Modal */}
      <ConstructionModal
        isOpen={isConstructionOpen}
        onClose={() => setIsConstructionOpen(false)}
        playerInventoryItems={allInventoryItems}
        onConstruct={handleConstruct}
      />

      {/* Dedicated Server & Multiplayer Modal */}
      <MultiplayerModal
        isOpen={isMultiplayerOpen}
        onClose={() => setIsMultiplayerOpen(false)}
        serverConfig={serverConfig}
        onUpdateConfig={setServerConfig}
        onToggleServer={(running) => setServerConfig((prev) => ({ ...prev, isRunning: running }))}
        serverLogs={[
          '[INFO] TGStation Atmosphere engine initialized (20 ticks/sec)',
          '[INFO] Goob Station RSI sprites and cosmetics loaded successfully',
          '[INFO] TGStation DMI world structures and object registry active',
          '[NET] Dedicated server listening on 0.0.0.0:3000',
        ]}
      />
      {/* TGStation & Griefly DMI Asset Manager Modal */}
      <DmiAssetModal
        isOpen={isDmiModalOpen}
        onClose={() => setIsDmiModalOpen(false)}
      />
      {/* Station Audio Channels & Synthesizer Modal */}
      <SoundSettingsModal
        isOpen={isSoundSettingsOpen}
        onClose={() => setIsSoundSettingsOpen(false)}
      />
    </div>
  );
}
