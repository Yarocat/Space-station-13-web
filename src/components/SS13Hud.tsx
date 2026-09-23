import React from 'react';
import { PlayerMob, SlotName, WorldObject } from '../types';
import { 
  Hand, 
  ArrowLeftRight, 
  ArrowDownToLine, 
  BedDouble, 
  Ghost, 
  Heart, 
  Wind, 
  Biohazard, 
  Thermometer, 
  Sparkles,
  Shirt,
  Shield,
  Footprints
} from 'lucide-react';

interface SS13HudProps {
  player: PlayerMob;
  onSwapHands: () => void;
  onDropItem: () => void;
  onToggleLay: () => void;
  onToggleGhost: () => void;
  onTogglePull: () => void;
  onUseItem: (slot: SlotName) => void;
  onUnequipSlot: (slot: SlotName) => void;
}

export const SS13Hud: React.FC<SS13HudProps> = ({
  player,
  onSwapHands,
  onDropItem,
  onToggleLay,
  onToggleGhost,
  onTogglePull,
  onUseItem,
  onUnequipSlot,
}) => {
  const activeHand = player.inventory.activeHand;
  const activeItem = player.inventory[activeHand];

  const renderSlot = (slot: SlotName, label: string, iconNode: React.ReactNode) => {
    const item = player.inventory[slot];
    const isHand = slot === 'left_hand' || slot === 'right_hand';
    const isActive = isHand && activeHand === slot;

    return (
      <div
        id={`slot-${slot}`}
        onClick={() => (item ? onUseItem(slot) : isHand ? onSwapHands() : undefined)}
        onContextMenu={(e) => {
          e.preventDefault();
          if (item) onUnequipSlot(slot);
        }}
        title={item ? `${item.name} (${item.type}) - Click to use, Right-click to unequip` : `${label} Slot`}
        className={`relative flex flex-col items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${
          isActive
            ? 'w-14 h-14 bg-amber-500/20 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
            : isHand
            ? 'w-13 h-13 bg-neutral-900/80 border-neutral-700 hover:border-neutral-500'
            : 'w-11 h-11 bg-neutral-900/70 border-neutral-800 hover:border-neutral-600'
        }`}
      >
        {item ? (
          <div className="flex flex-col items-center justify-center">
            <span className="text-base font-mono" style={{ color: item.color || '#f8fafc' }}>
              {item.icon || '●'}
            </span>
            <span className="text-[9px] font-mono text-neutral-300 max-w-[48px] truncate leading-tight mt-0.5">
              {item.name.split(' ')[0]}
            </span>
            {item.charges !== undefined && (
              <span className="absolute top-1 right-1 text-[8px] font-mono bg-neutral-950/80 px-1 rounded text-amber-300 border border-neutral-700">
                {item.charges}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-neutral-500">
            {iconNode}
            <span className="text-[8px] font-mono mt-0.5 uppercase tracking-wider">{label}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-3 pointer-events-auto select-none">
      {/* Vitals / Status Monitor */}
      <div className="bg-neutral-900/90 backdrop-blur-md p-2.5 rounded-xl border border-neutral-700/60 shadow-xl flex flex-col gap-2 min-w-[130px]">
        {/* Health */}
        <div>
          <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 mb-0.5">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-red-500" /> HEALTH
            </span>
            <span className="text-neutral-200 font-bold">{Math.round(player.health)}%</span>
          </div>
          <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden border border-neutral-800">
            <div
              className={`h-full transition-all duration-300 ${
                player.health > 50 ? 'bg-emerald-500' : player.health > 25 ? 'bg-amber-500' : 'bg-red-600'
              }`}
              style={{ width: `${Math.max(0, player.health)}%` }}
            />
          </div>
        </div>

        {/* Oxygen */}
        <div>
          <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 mb-0.5">
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-sky-400" /> OXYGEN
            </span>
            <span className="text-neutral-200 font-bold">{Math.round(player.oxygen)}%</span>
          </div>
          <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden border border-neutral-800">
            <div
              className={`h-full transition-all duration-300 ${
                player.oxygen > 50 ? 'bg-sky-500' : 'bg-red-500 animate-pulse'
              }`}
              style={{ width: `${Math.max(0, player.oxygen)}%` }}
            />
          </div>
        </div>

        {/* Toxins / Plasma */}
        <div>
          <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 mb-0.5">
            <span className="flex items-center gap-1">
              <Biohazard className="w-3 h-3 text-pink-500" /> TOXINS
            </span>
            <span className={player.toxin > 0 ? 'text-pink-400 font-bold' : 'text-neutral-400'}>
              {Math.round(player.toxin)}%
            </span>
          </div>
          <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-pink-500 transition-all duration-300"
              style={{ width: `${Math.min(100, player.toxin)}%` }}
            />
          </div>
        </div>

        {/* Body Temperature */}
        <div className="flex items-center justify-between text-[10px] font-mono pt-0.5 border-t border-neutral-800">
          <span className="flex items-center gap-1 text-neutral-400">
            <Thermometer className="w-3 h-3 text-amber-400" /> TEMP
          </span>
          <span className="text-neutral-200 font-bold">
            {player.temperature.toFixed(1)}K ({(player.temperature - 273.15).toFixed(0)}°C)
          </span>
        </div>
      </div>

      {/* Equipment Slots Tray */}
      <div className="bg-neutral-900/90 backdrop-blur-md p-2 rounded-xl border border-neutral-700/60 shadow-xl flex items-center gap-1.5">
        {renderSlot('head', 'Head', <Sparkles className="w-3.5 h-3.5" />)}
        {renderSlot('mask', 'Mask', <Biohazard className="w-3.5 h-3.5" />)}
        {renderSlot('suit', 'Suit', <Shield className="w-3.5 h-3.5" />)}
        {renderSlot('uniform', 'Suit', <Shirt className="w-3.5 h-3.5" />)}
        {renderSlot('shoes', 'Shoes', <Footprints className="w-3.5 h-3.5" />)}
        {renderSlot('back', 'Back', <Hand className="w-3.5 h-3.5" />)}
      </div>

      {/* Hands & Quick Action Deck */}
      <div className="bg-neutral-900/90 backdrop-blur-md p-2 rounded-xl border border-neutral-700/60 shadow-xl flex items-center gap-2">
        {/* Left Hand */}
        {renderSlot('left_hand', 'L.Hand', <Hand className="w-4 h-4" />)}

        {/* Swap Hands Button */}
        <button
          id="swap-hands-btn"
          onClick={onSwapHands}
          title="Swap Active Hand (X)"
          className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:bg-amber-500/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors border border-neutral-700"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        {/* Right Hand */}
        {renderSlot('right_hand', 'R.Hand', <Hand className="w-4 h-4" />)}

        <div className="w-px h-10 bg-neutral-800 mx-1" />

        {/* Drop Button */}
        <button
          id="drop-active-btn"
          onClick={onDropItem}
          disabled={!activeItem}
          title="Drop Held Item (Q)"
          className="w-10 h-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 flex flex-col items-center justify-center transition-colors border border-neutral-700"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
          <span className="text-[8px] font-mono mt-0.5">DROP</span>
        </button>

        {/* Lay / Rest Toggle */}
        <button
          id="toggle-lay-btn"
          onClick={onToggleLay}
          title="Toggle Rest / Lay Down"
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-colors border ${
            player.isLying
              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          <BedDouble className="w-3.5 h-3.5" />
          <span className="text-[8px] font-mono mt-0.5">REST</span>
        </button>

        {/* Pull Toggle */}
        <button
          id="toggle-pull-btn"
          onClick={onTogglePull}
          title={player.pullingId ? 'Release Pulled Object' : 'No object pulled'}
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-colors border ${
            player.pullingId
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
              : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:bg-neutral-700'
          }`}
        >
          <Hand className="w-3.5 h-3.5" />
          <span className="text-[8px] font-mono mt-0.5">{player.pullingId ? 'PULL' : 'PULL'}</span>
        </button>

        {/* Ghost Mode Toggle */}
        <button
          id="toggle-ghost-btn"
          onClick={onToggleGhost}
          title={player.isGhost ? 'Return to Human Body' : 'Haunt Station as Ghost'}
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-colors border ${
            player.isGhost
              ? 'bg-purple-500/20 border-purple-400 text-purple-300'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          <Ghost className="w-3.5 h-3.5" />
          <span className="text-[8px] font-mono mt-0.5">GHOST</span>
        </button>
      </div>
    </div>
  );
};
