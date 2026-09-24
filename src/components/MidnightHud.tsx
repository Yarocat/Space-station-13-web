import React, { useState, useEffect, useRef } from 'react';
import {
  PlayerMob,
  SlotName,
  IntentType,
  TargetZone,
  WorldObject,
  ItemType,
} from '../types';
import { drawDmiSprite, getItemDmiInfo, addDmiRedrawListener } from '../systems/dmiSystem';
import {
  Shield,
  Activity,
  Heart,
  Wind,
  Droplet,
  Zap,
  Sliders,
  ChevronUp,
  ChevronDown,
  User,
  Package,
  Layers,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface MidnightHudProps {
  player: PlayerMob;
  onEquipSlot: (slot: SlotName) => void;
  onDropItem: () => void;
  onToggleThrow: () => void;
  onResist: () => void;
  onSwapHand: () => void;
  onSetIntent: (intent: IntentType) => void;
  onSetTargetZone: (zone: TargetZone) => void;
  onToggleMoveMode: () => void;
  onToggleSleeves: () => void;
  onToggleMagboots: () => void;
  onToggleVisor: () => void;
  onToggleInternals: () => void;
  onToggleShoelaces: () => void;
  onOpenCharacterSetup: () => void;
  onOpenContainer?: (container: WorldObject) => void;
  onQuickEquip?: () => void;
}

// Slot visual configuration
interface SlotConfig {
  slot: SlotName;
  screenState: string;
  label: string;
  tooltip: string;
}

const PAPERDOLL_SLOTS: SlotConfig[] = [
  { slot: 'head', screenState: 'head', label: 'HEAD', tooltip: 'Helmet / Hat / Cap' },
  { slot: 'mask', screenState: 'mask', label: 'MASK', tooltip: 'Gas Mask / Sterile Mask' },
  { slot: 'glasses', screenState: 'glasses', label: 'EYES', tooltip: 'Glasses / HUD' },
  { slot: 'ears', screenState: 'ears', label: 'EARS', tooltip: 'Radio Headset' },
  { slot: 'suit', screenState: 'suit', label: 'SUIT', tooltip: 'Armor / Space Suit / Labcoat' },
  { slot: 'uniform', screenState: 'uniform', label: 'JUMPSUIT', tooltip: 'Uniform / Overalls' },
  { slot: 'back', screenState: 'back', label: 'BACK', tooltip: 'Backpack / Jetpack / Oxygen Tank' },
  { slot: 'belt', screenState: 'belt', label: 'BELT', tooltip: 'Toolbelt / Holster' },
  { slot: 'gloves', screenState: 'gloves', label: 'GLOVES', tooltip: 'Insulated / Latex Gloves' },
  { slot: 'shoes', screenState: 'shoes', label: 'FEET', tooltip: 'Boots / Shoes / Galoshes' },
  { slot: 'suit_storage', screenState: 'suit_storage', label: 'S-STOR', tooltip: 'Oxygen Tank / Weapon Holster' },
  { slot: 'id', screenState: 'id', label: 'ID', tooltip: 'Access Card / PDA' },
  { slot: 'pocket1', screenState: 'pocket', label: 'L-PKT', tooltip: 'Left Pocket' },
  { slot: 'pocket2', screenState: 'pocket', label: 'R-PKT', tooltip: 'Right Pocket' },
];

/**
 * Individual TGStation HUD Slot with Canvas DMI Rendering
 */
const HudSlotItem: React.FC<{
  config: SlotConfig;
  item: WorldObject | null;
  isActiveHand?: boolean;
  redrawKey?: number;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}> = ({ config, item, isActiveHand, redrawKey, onClick, onContextMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Slot Background from screen_midnight.dmi
    const bgDrawn = drawDmiSprite(ctx, 'screen_midnight.dmi', config.screenState, 0, 0, {
      destW: 34,
      destH: 34,
    });

    if (!bgDrawn) {
      // Fallback border box
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 34, 34);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(1, 1, 32, 32);
    }

    // 2. If active hand, draw active hand overlay
    if (isActiveHand) {
      drawDmiSprite(ctx, 'screen_midnight.dmi', 'hand_active', 0, 0, {
        destW: 34,
        destH: 34,
      });
    }

    // 3. If item is equipped in this slot, render item sprite
    if (item && item.type) {
      const itemInfo = getItemDmiInfo(item.type as ItemType);
      drawDmiSprite(ctx, itemInfo.dmi, itemInfo.state, 1, 1, {
        destW: 32,
        destH: 32,
      });
    }
  }, [config.screenState, item, isActiveHand, redrawKey]);

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`relative group cursor-pointer rounded transition-transform active:scale-95 ${
        isActiveHand ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950' : ''
      }`}
      title={`${config.tooltip}${item ? ` [Equipped: ${item.name}] (Right-click for options)` : ' (Click to equip/unequip)'}`}
    >
      <canvas
        ref={canvasRef}
        width={34}
        height={34}
        className="block border border-slate-700/80 rounded bg-slate-900 shadow"
      />
      {item && (
        <span className="absolute -bottom-1 right-0 text-[8px] font-mono bg-slate-950/90 text-cyan-300 px-0.5 rounded pointer-events-none truncate max-w-[32px]">
          {item.name.slice(0, 4)}
        </span>
      )}
    </div>
  );
};

export const MidnightHud: React.FC<MidnightHudProps> = ({
  player,
  onEquipSlot,
  onDropItem,
  onToggleThrow,
  onResist,
  onSwapHand,
  onSetIntent,
  onSetTargetZone,
  onToggleMoveMode,
  onToggleSleeves,
  onToggleMagboots,
  onToggleVisor,
  onToggleInternals,
  onToggleShoelaces,
  onOpenCharacterSetup,
  onOpenContainer,
  onQuickEquip,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    slot: SlotName;
    item: WorldObject | null;
  } | null>(null);

  const [dollExpanded, setDollExpanded] = useState(true);
  const [dmiRedrawTick, setDmiRedrawTick] = useState(0);

  useEffect(() => {
    return addDmiRedrawListener(() => {
      setDmiRedrawTick((t) => t + 1);
    });
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) setContextMenu(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  // Handle right-click on clothing slot
  const handleSlotContextMenu = (e: React.MouseEvent, slot: SlotName, item: WorldObject | null) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      slot,
      item,
    });
  };

  const activeHandItem =
    player.inventory.activeHand === 'left_hand'
      ? player.inventory.left_hand
      : player.inventory.right_hand;

  // Total damage & health percentage calculation
  const totalDamage =
    (player.bruteDamage || 0) +
    (player.burnDamage || 0) +
    (player.toxin || 0) +
    (100 - (player.oxygen || 100));
  const healthPercent = Math.max(0, Math.min(100, 100 - totalDamage));

  return (
    <>
      {/* 1. LEFT SIDE: SS13 TGStation Midnight Clothing Paperdoll Panel */}
      <div className="fixed left-3 bottom-24 z-30 flex flex-col items-start select-none">
        <div className="bg-slate-950/90 border-2 border-slate-700/80 rounded-lg p-2 shadow-2xl backdrop-blur-sm">
          {/* Header with expand toggle and Character Profile button */}
          <div className="flex items-center justify-between w-full mb-1.5 pb-1 border-b border-slate-800">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              Equipment
            </span>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={onOpenCharacterSetup}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-[9px] font-mono flex items-center space-x-1 transition-colors"
                title="Open Character Dossier / Setup"
              >
                <User className="w-2.5 h-2.5" />
                <span>ID</span>
              </button>
              <button
                type="button"
                onClick={() => setDollExpanded(!dollExpanded)}
                className="p-1 text-slate-400 hover:text-slate-200"
                title={dollExpanded ? 'Collapse Inventory' : 'Expand Inventory'}
              >
                {dollExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {dollExpanded && (
            <div className="flex flex-col space-y-2">
              {/* Paperdoll Slot Grid: 4 columns x 4 rows layout */}
              <div className="grid grid-cols-4 gap-1.5">
                {PAPERDOLL_SLOTS.map((slotConf) => (
                  <HudSlotItem
                    key={slotConf.slot}
                    config={slotConf}
                    item={player.inventory[slotConf.slot]}
                    redrawKey={dmiRedrawTick}
                    onClick={() => onEquipSlot(slotConf.slot)}
                    onContextMenu={(e) =>
                      handleSlotContextMenu(e, slotConf.slot, player.inventory[slotConf.slot])
                    }
                  />
                ))}
              </div>

              {/* Quick Clothing Feature Status Toggles */}
              <div className="pt-1.5 border-t border-slate-800 grid grid-cols-2 gap-1 text-[9px] font-mono">
                {/* Sleeves */}
                <button
                  type="button"
                  onClick={onToggleSleeves}
                  className={`px-1.5 py-1 rounded text-left flex items-center justify-between border transition-colors ${
                    player.rolledSleeves
                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle Jumpsuit Sleeves (Rolled up / Down)"
                >
                  <span>Sleeves:</span>
                  <span className="font-bold">{player.rolledSleeves ? 'UP' : 'DN'}</span>
                </button>

                {/* Magboots */}
                <button
                  type="button"
                  onClick={onToggleMagboots}
                  className={`px-1.5 py-1 rounded text-left flex items-center justify-between border transition-colors ${
                    player.magbootsActive
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle Magboots Magnets (Anti-slip, Anti-vacuum drift, -30% speed)"
                >
                  <span>Magboots:</span>
                  <span className="font-bold">{player.magbootsActive ? 'ON' : 'OFF'}</span>
                </button>

                {/* Welding Visor */}
                <button
                  type="button"
                  onClick={onToggleVisor}
                  className={`px-1.5 py-1 rounded text-left flex items-center justify-between border transition-colors ${
                    player.visorDown
                      ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle Helmet/Welder Visor (Flash eye protection)"
                >
                  <span>Visor:</span>
                  <span className="font-bold">{player.visorDown ? 'DOWN' : 'UP'}</span>
                </button>

                {/* Internals (Oxygen Tank) */}
                <button
                  type="button"
                  onClick={onToggleInternals}
                  className={`px-1.5 py-1 rounded text-left flex items-center justify-between border transition-colors ${
                    player.internalsOn
                      ? 'bg-blue-950/60 border-blue-500/50 text-blue-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle Oxygen Tank Internals (Breathe from tank vs atmosphere)"
                >
                  <span>Internals:</span>
                  <span className="font-bold">{player.internalsOn ? 'ACTIVE' : 'OFF'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. BOTTOM CENTER: TGStation Hands & Action Bar */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-end space-x-2 select-none">
        <div className="bg-slate-950/95 border-2 border-slate-700/80 rounded-xl p-2 shadow-2xl backdrop-blur-md flex items-center space-x-3">
          {/* Left Hand Slot */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-400 uppercase mb-0.5">
              L Hand {player.inventory.activeHand === 'left_hand' && '★'}
            </span>
            <HudSlotItem
              config={{
                slot: 'left_hand',
                screenState: 'hand_l',
                label: 'LEFT HAND',
                tooltip: 'Left Hand (Active hand toggle)',
              }}
              item={player.inventory.left_hand}
              isActiveHand={player.inventory.activeHand === 'left_hand'}
              redrawKey={dmiRedrawTick}
              onClick={() => onEquipSlot('left_hand')}
              onContextMenu={(e) => handleSlotContextMenu(e, 'left_hand', player.inventory.left_hand)}
            />
          </div>

          {/* Hand Swap & Quick Actions Center Control */}
          <div className="flex flex-col items-center space-y-1">
            <button
              type="button"
              onClick={onSwapHand}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-cyan-900 border border-slate-600 rounded text-xs font-mono font-bold text-cyan-300 shadow transition-colors flex items-center space-x-1"
              title="Swap Active Hand (Hotkey: X)"
            >
              <span>SWAP [X]</span>
            </button>

            <div className="flex items-center space-x-1">
              {/* Drop item */}
              <button
                type="button"
                onClick={onDropItem}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded text-[10px] font-mono"
                title="Drop Item from Active Hand (Hotkey: Q)"
              >
                DROP [Q]
              </button>

              {/* Throw toggle */}
              <button
                type="button"
                onClick={onToggleThrow}
                className={`px-2 py-0.5 border rounded text-[10px] font-mono transition-colors ${
                  player.throwMode
                    ? 'bg-amber-500/30 border-amber-400 text-amber-300 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Throw Mode (Hotkey: R)"
              >
                THROW [R]
              </button>
            </div>
          </div>

          {/* Right Hand Slot */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-400 uppercase mb-0.5">
              R Hand {player.inventory.activeHand === 'right_hand' && '★'}
            </span>
            <HudSlotItem
              config={{
                slot: 'right_hand',
                screenState: 'hand_r',
                label: 'RIGHT HAND',
                tooltip: 'Right Hand (Active hand toggle)',
              }}
              item={player.inventory.right_hand}
              isActiveHand={player.inventory.activeHand === 'right_hand'}
              redrawKey={dmiRedrawTick}
              onClick={() => onEquipSlot('right_hand')}
              onContextMenu={(e) => handleSlotContextMenu(e, 'right_hand', player.inventory.right_hand)}
            />
          </div>

          {/* Secondary Action Column: Resist & Move Mode */}
          <div className="pl-2 border-l border-slate-800 flex flex-col space-y-1">
            <button
              type="button"
              onClick={onResist}
              className="px-2 py-1 bg-red-950/70 hover:bg-red-900 border border-red-500/50 text-red-300 rounded text-[10px] font-mono font-bold flex items-center space-x-1 transition-colors"
              title="Resist (Extinguish Fire / Break Grab / Stand up - Hotkey: B)"
            >
              <Zap className="w-3 h-3" />
              <span>RESIST [B]</span>
            </button>

            <button
              type="button"
              onClick={onToggleMoveMode}
              className={`px-2 py-1 border rounded text-[10px] font-mono font-bold flex items-center justify-between transition-colors ${
                player.moveMode === 'run'
                  ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle Run / Walk speed"
            >
              <span>MODE:</span>
              <span className="ml-1 uppercase">{player.moveMode}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM RIGHT: Combat Intent, Target Zone Doll & Health Meters */}
      <div className="fixed right-3 bottom-24 z-30 flex flex-col items-end select-none space-y-2">
        {/* Intent & Target Zone Panel */}
        <div className="bg-slate-950/90 border-2 border-slate-700/80 rounded-lg p-2 shadow-2xl backdrop-blur-sm flex items-center space-x-3">
          {/* Intent 2x2 Grid */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-400 uppercase mb-1 font-bold">
              Combat Intent
            </span>
            <div className="grid grid-cols-2 gap-1">
              {/* HELP (Green) */}
              <button
                type="button"
                onClick={() => onSetIntent('HELP')}
                className={`w-9 h-7 rounded border font-mono text-[10px] font-bold transition-all ${
                  player.intent === 'HELP'
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-900/40 ring-1 ring-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-emerald-400 hover:border-emerald-700'
                }`}
                title="Help: Heal, CPR, hug, handshake, pull out embedded glass"
              >
                HELP
              </button>

              {/* DISARM (Blue) */}
              <button
                type="button"
                onClick={() => onSetIntent('DISARM')}
                className={`w-9 h-7 rounded border font-mono text-[10px] font-bold transition-all ${
                  player.intent === 'DISARM'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-900/40 ring-1 ring-blue-400'
                    : 'bg-slate-900 border-slate-800 text-blue-400 hover:border-blue-700'
                }`}
                title="Disarm: Shove down, knock weapons out of enemy hands"
              >
                DISARM
              </button>

              {/* GRAB (Yellow) */}
              <button
                type="button"
                onClick={() => onSetIntent('GRAB')}
                className={`w-9 h-7 rounded border font-mono text-[10px] font-bold transition-all ${
                  player.intent === 'GRAB'
                    ? 'bg-amber-600 border-amber-400 text-white shadow-md shadow-amber-900/40 ring-1 ring-amber-400'
                    : 'bg-slate-900 border-slate-800 text-amber-400 hover:border-amber-700'
                }`}
                title="Grab: Passive grab -> Aggressive hold -> Neck choke"
              >
                GRAB
              </button>

              {/* HARM (Red) */}
              <button
                type="button"
                onClick={() => onSetIntent('HARM')}
                className={`w-9 h-7 rounded border font-mono text-[10px] font-bold transition-all ${
                  player.intent === 'HARM'
                    ? 'bg-red-600 border-red-400 text-white shadow-md shadow-red-900/40 ring-1 ring-red-400'
                    : 'bg-slate-900 border-slate-800 text-red-400 hover:border-red-700'
                }`}
                title="Harm: Punch, tackle, shoot, strike with held weapon"
              >
                HARM
              </button>
            </div>
          </div>

          {/* Body Target Zone Selector */}
          <div className="flex flex-col items-center pl-2 border-l border-slate-800">
            <span className="text-[9px] font-mono text-slate-400 uppercase mb-1 font-bold">
              Target Zone: <span className="text-cyan-300">{player.targetZone}</span>
            </span>
            <div className="grid grid-cols-3 gap-0.5 w-16 text-[8px] font-mono">
              {/* Row 1: Eyes, Head, Mouth */}
              <button
                type="button"
                onClick={() => onSetTargetZone('eyes')}
                className={`p-0.5 rounded text-center border ${
                  player.targetZone === 'eyes'
                    ? 'bg-red-600 text-white border-red-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                EYES
              </button>
              <button
                type="button"
                onClick={() => onSetTargetZone('head')}
                className={`p-0.5 rounded text-center border ${
                  player.targetZone === 'head'
                    ? 'bg-red-600 text-white border-red-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                HEAD
              </button>
              <button
                type="button"
                onClick={() => onSetTargetZone('mouth')}
                className={`p-0.5 rounded text-center border ${
                  player.targetZone === 'mouth'
                    ? 'bg-red-600 text-white border-red-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                MOUTH
              </button>

              {/* Row 2: L Arm, Chest, R Arm */}
              <button
                type="button"
                onClick={() => onSetTargetZone('l_arm')}
                className={`p-0.5 rounded text-center border ${
                  player.targetZone === 'l_arm'
                    ? 'bg-red-600 text-white border-red-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                L-ARM
              </button>
              <button
                type="button"
                onClick={() => onSetTargetZone('chest')}
                className={`p-0.5 rounded text-center border ${
                  player.targetZone === 'chest'
                    ? 'bg-red-600 text-white border-red-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                CHEST
              </button>
              <button
                type="button"
                onClick={() => onSetTargetZone('r_arm')}
                className={`p-0.5 rounded text-center border ${
                  player.targetZone === 'r_arm'
                    ? 'bg-red-600 text-white border-red-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                R-ARM
              </button>

              {/* Row 3: L Leg, Groin, R Leg */}
              <button
                type="button"
                onClick={() => onSetTargetZone('l_leg')}
                className={`p-0.5 rounded text-center border ${
                  player.targetZone === 'l_leg'
                    ? 'bg-red-600 text-white border-red-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                L-LEG
              </button>
              <button
                type="button"
                onClick={() => onSetTargetZone('groin')}
                className={`p-0.5 rounded text-center border ${
                  player.targetZone === 'groin'
                    ? 'bg-red-600 text-white border-red-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                GROIN
              </button>
              <button
                type="button"
                onClick={() => onSetTargetZone('r_leg')}
                className={`p-0.5 rounded text-center border ${
                  player.targetZone === 'r_leg'
                    ? 'bg-red-600 text-white border-red-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                R-LEG
              </button>
            </div>
          </div>
        </div>

        {/* Health & Vital Damage Indicators */}
        <div className="bg-slate-950/90 border-2 border-slate-700/80 rounded-lg p-2.5 shadow-2xl backdrop-blur-sm w-56 text-xs font-mono">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center space-x-1">
              <Heart className="w-3 h-3 text-red-500" />
              <span>Vitals ({player.species})</span>
            </span>
            <span
              className={`font-bold ${
                healthPercent > 60
                  ? 'text-emerald-400'
                  : healthPercent > 30
                  ? 'text-amber-400'
                  : 'text-red-500'
              }`}
            >
              {Math.round(healthPercent)}% HP
            </span>
          </div>

          {/* Health Bar */}
          <div className="w-full bg-slate-800 h-2 rounded overflow-hidden mb-2">
            <div
              className={`h-full transition-all ${
                healthPercent > 60
                  ? 'bg-emerald-500'
                  : healthPercent > 30
                  ? 'bg-amber-500'
                  : 'bg-red-600'
              }`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>

          {/* Damage Categories */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>Brute:</span>
              <span className={player.bruteDamage > 0 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                {Math.round(player.bruteDamage || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Burn:</span>
              <span className={player.burnDamage > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                {Math.round(player.burnDamage || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Toxin:</span>
              <span className={player.toxin > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {Math.round(player.toxin || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Oxygen:</span>
              <span className={player.oxygen < 90 ? 'text-blue-400 font-bold' : 'text-slate-400'}>
                {Math.round(player.oxygen || 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Context Menu for Clothing & Item Interactions */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-slate-900 border-2 border-slate-600 rounded-lg shadow-2xl p-1 w-48 text-xs font-mono"
          style={{ top: Math.min(window.innerHeight - 200, contextMenu.y), left: Math.min(window.innerWidth - 200, contextMenu.x) }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 border-b border-slate-800 text-[10px] text-cyan-400 font-bold uppercase truncate">
            {contextMenu.item ? contextMenu.item.name : `Slot: ${contextMenu.slot}`}
          </div>

          <div className="flex flex-col py-1">
            {contextMenu.item ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onEquipSlot(contextMenu.slot);
                    setContextMenu(null);
                  }}
                  className="px-2 py-1 text-left text-slate-200 hover:bg-slate-800 rounded transition-colors"
                >
                  Unequip to Active Hand
                </button>

                {/* Container inspection (Backpack / Toolbelt) */}
                {(contextMenu.item.type === 'Backpack' || contextMenu.item.type === 'Toolbelt') && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenContainer) onOpenContainer(contextMenu.item!);
                      setContextMenu(null);
                    }}
                    className="px-2 py-1 text-left text-cyan-300 hover:bg-slate-800 rounded transition-colors flex items-center space-x-1"
                  >
                    <Package className="w-3 h-3" />
                    <span>Open Contents</span>
                  </button>
                )}

                {/* Specific Clothing Operations */}
                {contextMenu.slot === 'uniform' && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleSleeves();
                      setContextMenu(null);
                    }}
                    className="px-2 py-1 text-left text-amber-300 hover:bg-slate-800 rounded transition-colors"
                  >
                    {player.rolledSleeves ? 'Roll Sleeves Down' : 'Roll Sleeves Up'}
                  </button>
                )}

                {contextMenu.slot === 'shoes' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onToggleShoelaces();
                        setContextMenu(null);
                      }}
                      className="px-2 py-1 text-left text-slate-300 hover:bg-slate-800 rounded transition-colors"
                    >
                      {player.shoelacesUntied ? 'Tie Shoelaces' : 'Untie Shoelaces'}
                    </button>
                    {contextMenu.item.type === 'Magboots' && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleMagboots();
                          setContextMenu(null);
                        }}
                        className="px-2 py-1 text-left text-emerald-300 hover:bg-slate-800 rounded transition-colors"
                      >
                        {player.magbootsActive ? 'Turn Off Mag-Clamps' : 'Engage Mag-Clamps'}
                      </button>
                    )}
                  </>
                )}

                {(contextMenu.slot === 'head' || contextMenu.item.type === 'WeldingMask') && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleVisor();
                      setContextMenu(null);
                    }}
                    className="px-2 py-1 text-left text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                  >
                    {player.visorDown ? 'Flip Visor Up' : 'Flip Visor Down'}
                  </button>
                )}

                {(contextMenu.slot === 'mask' || contextMenu.slot === 'back' || contextMenu.slot === 'suit_storage') && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleInternals();
                      setContextMenu(null);
                    }}
                    className="px-2 py-1 text-left text-blue-300 hover:bg-slate-800 rounded transition-colors"
                  >
                    {player.internalsOn ? 'Disconnect Internals' : 'Connect Breathing Internals'}
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onEquipSlot(contextMenu.slot);
                  setContextMenu(null);
                }}
                className="px-2 py-1 text-left text-slate-300 hover:bg-slate-800 rounded transition-colors"
              >
                Equip Held Item Here
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
