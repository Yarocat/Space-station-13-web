import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Music,
  Bell,
  Waves,
  Disc,
  Radio,
  X,
  Volume1,
} from 'lucide-react';
import { soundManager, SoundCategory, TG_SOUNDS } from '../systems/soundManager';

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [volumes, setVolumes] = useState<Record<SoundCategory, number>>({
    master: soundManager.getVolume('master'),
    effects: soundManager.getVolume('effects'),
    ambience: soundManager.getVolume('ambience'),
    music: soundManager.getVolume('music'),
    ui: soundManager.getVolume('ui'),
  });

  const [mutes, setMutes] = useState<Record<SoundCategory, boolean>>({
    master: soundManager.isMuted('master'),
    effects: soundManager.isMuted('effects'),
    ambience: soundManager.isMuted('ambience'),
    music: soundManager.isMuted('music'),
    ui: soundManager.isMuted('ui'),
  });

  const [ambiencePlaying, setAmbiencePlaying] = useState<boolean>(false);
  const [stats, setStats] = useState(soundManager.getStats());

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setStats(soundManager.getStats());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVolumeChange = (category: SoundCategory, value: number) => {
    soundManager.setVolume(category, value);
    setVolumes((prev) => ({ ...prev, [category]: value }));
  };

  const handleToggleMute = (category: SoundCategory) => {
    const isMuted = soundManager.toggleMute(category);
    setMutes((prev) => ({ ...prev, [category]: isMuted }));
  };

  const handleTestSpatial = (dx: number) => {
    // Player is at (0, 0), sound is at (dx, 0)
    soundManager.playSound(TG_SOUNDS.AIRLOCK_OPEN, dx, 0, 0, 0, 15, {
      category: 'effects',
      volume: 0.9,
    });
  };

  const handleToggleAmbience = () => {
    if (ambiencePlaying) {
      soundManager.stopAmbience();
      setAmbiencePlaying(false);
    } else {
      soundManager.playAmbience(TG_SOUNDS.AMBIENCE_GENERAL, volumes.ambience);
      setAmbiencePlaying(true);
    }
  };

  const channels: {
    id: SoundCategory;
    name: string;
    icon: React.ReactNode;
    color: string;
    description: string;
  }[] = [
    {
      id: 'master',
      name: 'Master Output',
      icon: <Sliders className="w-4 h-4" />,
      color: 'text-amber-400',
      description: 'Overall audio gain across all station systems',
    },
    {
      id: 'effects',
      name: 'Sound Effects (SFX)',
      icon: <Bell className="w-4 h-4" />,
      color: 'text-emerald-400',
      description: 'Airlocks, footsteps, tools, weapons, impacts',
    },
    {
      id: 'ambience',
      name: 'Station Ambience',
      icon: <Waves className="w-4 h-4" />,
      color: 'text-sky-400',
      description: 'Atmospheric circulation, reactor hum, station background',
    },
    {
      id: 'music',
      name: 'Music & Jukebox',
      icon: <Music className="w-4 h-4" />,
      color: 'text-pink-400',
      description: 'Title score, round events, bar jukebox',
    },
    {
      id: 'ui',
      name: 'UI & Consoles',
      icon: <Radio className="w-4 h-4" />,
      color: 'text-indigo-400',
      description: 'Interface clicks, PDA alerts, scanner beeps',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 font-display uppercase tracking-wider">
                Station Audio Synthesizer & Sound Channels
              </h2>
              <p className="text-[11px] text-neutral-400">
                Modular Web Audio API • 2D Spatial Positional Audio • TGStation Audio Graph
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Channels List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {channels.map((ch) => {
            const vol = volumes[ch.id];
            const isMuted = mutes[ch.id];

            return (
              <div
                key={ch.id}
                className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={ch.color}>{ch.icon}</span>
                    <span className="text-xs font-semibold text-neutral-200">
                      {ch.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-400 w-9 text-right font-mono">
                      {isMuted ? 'MUTED' : `${Math.round(vol * 100)}%`}
                    </span>
                    <button
                      onClick={() => handleToggleMute(ch.id)}
                      title={isMuted ? 'Unmute' : 'Mute'}
                      className={`p-1 rounded text-xs transition-colors ${
                        isMuted
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {isMuted ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume1 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={isMuted ? 0 : vol}
                    disabled={isMuted}
                    onChange={(e) => handleVolumeChange(ch.id, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-40"
                  />
                </div>

                <p className="text-[10px] text-neutral-500">{ch.description}</p>
              </div>
            );
          })}

          {/* 2D Spatial Positional Audio Interactive Test Bench */}
          <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                2D Spatial Positional Audio Test
              </span>
              <span className="text-[10px] text-neutral-400">Listener at center (0,0)</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <button
                onClick={() => handleTestSpatial(-9)}
                className="py-1.5 px-2 rounded bg-neutral-900 border border-neutral-700/60 hover:bg-neutral-800 text-[11px] text-neutral-300 transition-colors flex flex-col items-center gap-0.5"
              >
                <span>⬅ Left Door</span>
                <span className="text-[9px] text-neutral-500">Pan -0.85</span>
              </button>
              <button
                onClick={() => handleTestSpatial(0)}
                className="py-1.5 px-2 rounded bg-neutral-900 border border-neutral-700/60 hover:bg-neutral-800 text-[11px] text-neutral-300 transition-colors flex flex-col items-center gap-0.5"
              >
                <span>⏺ Airlock</span>
                <span className="text-[9px] text-neutral-500">Center</span>
              </button>
              <button
                onClick={() => handleTestSpatial(9)}
                className="py-1.5 px-2 rounded bg-neutral-900 border border-neutral-700/60 hover:bg-neutral-800 text-[11px] text-neutral-300 transition-colors flex flex-col items-center gap-0.5"
              >
                <span>➡ Right Door</span>
                <span className="text-[9px] text-neutral-500">Pan +0.85</span>
              </button>
              <button
                onClick={() => soundManager.play(TG_SOUNDS.CLOSET_OPEN, { category: 'effects', volume: 0.9 })}
                className="py-1.5 px-2 rounded bg-sky-950/40 border border-sky-600/40 hover:bg-sky-900/40 text-[11px] text-sky-300 transition-colors flex flex-col items-center gap-0.5"
              >
                <span>🗄 Closet Open</span>
                <span className="text-[9px] text-sky-400/70">TG Closet</span>
              </button>
              <button
                onClick={() => soundManager.play(TG_SOUNDS.BIKE_HORN, { category: 'effects', volume: 0.9 })}
                className="py-1.5 px-2 rounded bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-[11px] text-amber-300 font-bold transition-colors flex flex-col items-center gap-0.5"
              >
                <span>🎺 Clown Honk!</span>
                <span className="text-[9px] text-amber-400/70">Iconic SS13</span>
              </button>
            </div>

            {/* Background Ambience Stream Toggle */}
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-200">
                  Continuous Station Ambience
                </span>
                <p className="text-[10px] text-neutral-500">
                  Atmospheric air handling & reactor background loop
                </p>
              </div>
              <button
                onClick={handleToggleAmbience}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  ambiencePlaying
                    ? 'bg-sky-500/20 border border-sky-400 text-sky-300'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
              >
                <Disc className={`w-3.5 h-3.5 ${ambiencePlaying ? 'animate-spin' : ''}`} />
                {ambiencePlaying ? 'Active' : 'Turn On'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Diagnostics */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-3">
            <span>Audio Context: <strong className="text-emerald-400">Active</strong></span>
            <span>Cached Buffers: <strong className="text-neutral-200">{stats.cachedBuffers}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SoundSettingsModal;
