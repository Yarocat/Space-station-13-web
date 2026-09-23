import React, { useState } from 'react';
import { 
  Rocket, 
  Flame, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  RotateCcw, 
  Edit3, 
  Play, 
  Radio,
  RadioTower,
  Sparkles,
  User,
  Server,
  Hammer,
  MapPin,
} from 'lucide-react';
import { toggleAudio, isAudioEnabled } from '../audio';

interface MenuBarProps {
  isEditorMode: boolean;
  setIsEditorMode: (val: boolean) => void;
  showAtmosOverlay: boolean;
  setShowAtmosOverlay: (val: boolean | ((prev: boolean) => boolean)) => void;
  onResetRound: () => void;
  onOpenCharacterSetup: () => void;
  onOpenMultiplayer: () => void;
  onOpenConstruction: () => void;
  onSelectMap: (mapName: 'boxstation' | 'metastation' | 'deltastation' | 'kilostation' | 'sector13' | 'tiny_space' | 'blank') => void;
  currentMapName: string;
  stationTick: number;
  breachesCount: number;
  firesCount: number;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  isEditorMode,
  setIsEditorMode,
  showAtmosOverlay,
  setShowAtmosOverlay,
  onResetRound,
  onOpenCharacterSetup,
  onOpenMultiplayer,
  onOpenConstruction,
  onSelectMap,
  currentMapName,
  stationTick,
  breachesCount,
  firesCount,
}) => {
  const [audioActive, setAudioActive] = useState<boolean>(isAudioEnabled());
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showMapMenu, setShowMapMenu] = useState<boolean>(false);

  const handleToggleAudio = () => {
    const next = toggleAudio();
    setAudioActive(next);
  };

  return (
    <header className="h-12 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-4 text-xs font-mono select-none z-30">
      {/* Brand & Station Telemetry */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <Rocket className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-neutral-100 tracking-wider text-sm font-display">
              GRIEFLY
            </span>
            <span className="text-[10px] text-neutral-500 ml-2 font-mono">
              SECTOR 13 v0.2.1
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

        {/* Telemetry badges */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-neutral-400">
          <span>TICK: <strong className="text-neutral-200">{stationTick}</strong></span>
          {breachesCount > 0 && (
            <span className="text-blue-400 font-bold animate-pulse">
              ⚠ VACUUM BREACH ({breachesCount})
            </span>
          )}
          {firesCount > 0 && (
            <span className="text-red-400 font-bold animate-pulse">
              🔥 FIRE HAZARD ({firesCount})
            </span>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Mode Switcher */}
        <div className="bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 flex items-center">
          <button
            id="mode-play-btn"
            onClick={() => setIsEditorMode(false)}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              !isEditorMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Play className="w-3 h-3" /> Play
          </button>
          <button
            id="mode-editor-btn"
            onClick={() => setIsEditorMode(true)}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isEditorMode
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Edit3 className="w-3 h-3" /> Map Editor
          </button>
        </div>

        {/* Atmos Overlay Toggle */}
        <button
          id="toggle-atmos-btn"
          onClick={() => setShowAtmosOverlay((prev) => !prev)}
          title="Toggle Atmospheric Gas & Pressure Overlay"
          className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 ${
            showAtmosOverlay
              ? 'bg-pink-500/20 border-pink-400 text-pink-300'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Atmos Vision</span>
        </button>

        {/* Sound Toggle */}
        <button
          id="toggle-audio-btn"
          onClick={handleToggleAudio}
          title={audioActive ? 'Mute Audio' : 'Unmute Audio'}
          className={`p-2 rounded-lg border transition-colors ${
            audioActive
              ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
              : 'bg-red-500/20 border-red-500/40 text-red-400'
          }`}
        >
          {audioActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Reset Station Round */}
        <button
          id="reset-round-btn"
          onClick={onResetRound}
          title="Reset Station to Default State"
          className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Station Map Selector */}
        <div className="relative">
          <button
            id="station-map-select-btn"
            onClick={() => setShowMapMenu(!showMapMenu)}
            title="TGStation Iconic Maps"
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-amber-400 hover:text-amber-200 hover:bg-neutral-800 transition-colors flex items-center gap-1"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-bold">{currentMapName}</span>
          </button>

          {showMapMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs font-mono">
              <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 mb-1">
                TGStation Maps
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectMap('boxstation');
                  setShowMapMenu(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-amber-300"
              >
                BoxStation (TG Classic)
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectMap('metastation');
                  setShowMapMenu(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-amber-300"
              >
                MetaStation (Expanded)
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectMap('deltastation');
                  setShowMapMenu(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-amber-300"
              >
                DeltaStation (4-Quadrant)
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectMap('kilostation');
                  setShowMapMenu(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-amber-300"
              >
                KiloStation (Asteroid)
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectMap('sector13');
                  setShowMapMenu(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-amber-300"
              >
                Sector 13 (Griefly)
              </button>
            </div>
          )}
        </div>

        {/* Construction & Autolathe Blueprints */}
        <button
          id="construction-btn"
          onClick={onOpenConstruction}
          title="Construction & Autolathe Blueprints"
          className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-yellow-400 hover:text-yellow-200 hover:bg-neutral-800 transition-colors flex items-center gap-1"
        >
          <Hammer className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[11px]">Craft</span>
        </button>

        {/* Dedicated Server & Multiplayer */}
        <button
          id="dedicated-server-btn"
          onClick={onOpenMultiplayer}
          title="Dedicated Server & Multiplayer Lobby"
          className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-emerald-400 hover:text-emerald-200 hover:bg-neutral-800 transition-colors flex items-center gap-1"
        >
          <Server className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[11px]">Server</span>
        </button>

        {/* Character Setup & Role Dossier */}
        <button
          id="character-dossier-btn"
          onClick={onOpenCharacterSetup}
          title="Character Manifest & Role Dossier"
          className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-cyan-400 hover:text-cyan-200 hover:bg-neutral-800 transition-colors flex items-center gap-1"
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px]">Character</span>
        </button>

        {/* Manual / Help Modal Toggle */}
        <button
          id="help-btn"
          onClick={() => setShowHelp(true)}
          title="Game Controls & Manual"
          className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Space Station Manual Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-text">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-2xl shadow-2xl flex flex-col gap-4 font-mono max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-neutral-100 font-display">
                  SPACE STATION 13 — GRIEFLY SURVIVAL MANUAL
                </h2>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-neutral-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
              <div>
                <h3 className="text-amber-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  🎮 Controls & Navigation
                </h3>
                <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <div><strong className="text-neutral-100">W / A / S / D or Arrows:</strong> Move character</div>
                  <div><strong className="text-neutral-100">Left Click on Tile/Door:</strong> Walk or interact</div>
                  <div><strong className="text-neutral-100">X:</strong> Swap active hands (Left/Right)</div>
                  <div><strong className="text-neutral-100">Q:</strong> Drop item from active hand</div>
                  <div><strong className="text-neutral-100">R:</strong> Toggle Rest / Lay down</div>
                  <div><strong className="text-neutral-100">Middle Click / Alt-Drag:</strong> Pan camera</div>
                </div>
              </div>

              <div>
                <h3 className="text-sky-400 font-bold uppercase tracking-wider mb-1.5">
                  🔧 Tools & Interactions
                </h3>
                <ul className="list-disc list-inside space-y-1 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <li><strong className="text-neutral-200">Airlocks & Doors:</strong> Click to cycle open/close. Glass airlocks let you see through.</li>
                  <li><strong className="text-neutral-200">Crowbar:</strong> Pry open locked/powered-down airlocks, or lift floor tiles.</li>
                  <li><strong className="text-neutral-200">Welding Tool & Wrench:</strong> Weld airlocks shut or anchor engineering pipes.</li>
                  <li><strong className="text-neutral-200">Health Analyzer:</strong> Click any crew member to scan health, brute, burn, toxin, and suffocation levels.</li>
                  <li><strong className="text-neutral-200">Guns & Lasers:</strong> Click in any direction while holding a firearm to shoot!</li>
                  <li><strong className="text-neutral-200">Drinks (Beer, Vodka, Tea):</strong> Click the item in hand to sip and enjoy.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-pink-400 font-bold uppercase tracking-wider mb-1.5">
                  ☣ Atmospheric Physics & Breaches
                </h3>
                <p className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  Atmospheric gas flows between connected rooms. If an external bulkhead opens to the vacuum of space, air will rapidly rush out, causing decompression!
                  Wear a <strong>Space Helmet</strong> and <strong>Oxygen Tank</strong> before stepping out into vacuum. Toggle <strong>Atmos Vision</strong> to see live pressure gradients, plasma leaks, and fires.
                </p>
              </div>

              <div>
                <h3 className="text-emerald-400 font-bold uppercase tracking-wider mb-1.5">
                  💬 Comms & Commands
                </h3>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-1">
                  <div><code>say &lt;message&gt;</code> — speak aloud in room</div>
                  <div><code>:me &lt;emote&gt;</code> — perform emote (e.g. <code>:me laughs</code>)</div>
                  <div><code>/spawn &lt;item&gt;</code> — spawn an item on your tile (e.g. <code>/spawn Revolver</code>, <code>/spawn Beer</code>)</div>
                  <div><code>/ghost</code> — Haunt the station as a free-floating ghost!</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition-colors"
              >
                Close Manual
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
