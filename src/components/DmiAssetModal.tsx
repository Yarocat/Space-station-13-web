import React, { useState, useEffect } from 'react';
import {
  getAssetSource,
  setAssetSource,
  getDmiAssetStats,
  preloadCommonDmis,
  addDmiRedrawListener,
} from '../systems/dmiSystem';
import {
  FolderGit2,
  Database,
  ExternalLink,
  RefreshCw,
  X,
  CheckCircle2,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface DmiAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DmiAssetModal: React.FC<DmiAssetModalProps> = ({ isOpen, onClose }) => {
  const [source, setSource] = useState<'tgstation' | 'local'>(getAssetSource());
  const [stats, setStats] = useState(getDmiAssetStats());
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStats(getDmiAssetStats());
    }
  }, [isOpen]);

  useEffect(() => {
    return addDmiRedrawListener(() => {
      setStats(getDmiAssetStats());
    });
  }, []);

  if (!isOpen) return null;

  const handleSourceChange = (newSource: 'tgstation' | 'local') => {
    setSource(newSource);
    setIsReloading(true);
    setAssetSource(newSource);
    setTimeout(() => {
      setStats(getDmiAssetStats());
      setIsReloading(false);
    }, 600);
  };

  const handleReload = () => {
    setIsReloading(true);
    preloadCommonDmis();
    setTimeout(() => {
      setStats(getDmiAssetStats());
      setIsReloading(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                DMI Asset Engine: TGStation & Paradise SS13
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Griefly v0.2
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Direct PNG zTXt parser referencing TGStation & Paradise Station (Tajaran & Vulpakanin)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Source Selection Card */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 space-y-3">
            <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
              Asset Repository Source
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* TGStation & Paradise Station GitHub Master */}
              <button
                type="button"
                onClick={() => handleSourceChange('tgstation')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  source === 'tgstation'
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                    <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />
                    TGStation + Paradise Master
                  </span>
                  {source === 'tgstation' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </div>
                <p className="text-[10px] text-neutral-400 leading-relaxed mb-2">
                  Fetches live binary DMI files directly from tgstation/tgstation icons repository + Paradise Station for Tajaran & Vulpakanin species and accessories.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href="https://github.com/tgstation/tgstation/tree/master/icons"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 underline"
                  >
                    tgstation/icons <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <span className="text-neutral-600">•</span>
                  <a
                    href="https://github.com/ParadiseSS13/Paradise/tree/master/icons"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 underline"
                  >
                    Paradise/icons <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </button>

              {/* Local Griefly Bundle */}
              <button
                type="button"
                onClick={() => handleSourceChange('local')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  source === 'local'
                    ? 'bg-cyan-500/10 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    Local Griefly Bundle
                  </span>
                  {source === 'local' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>
                <p className="text-[10px] text-neutral-400 leading-relaxed mb-2">
                  High-speed offline bundle with authentic Space Station 13 sprites extracted from Griefly.
                </p>
                <a
                  href="https://github.com/griefly/griefly"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 underline"
                >
                  griefly/griefly <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </button>
            </div>
          </div>

          {/* DMI Engine Status Bar */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-neutral-200">
                  {stats.totalLoaded} Sprite Sheets Loaded
                </span>
                <p className="text-[10px] text-neutral-400">
                  Active Source:{' '}
                  <strong className="text-amber-400 uppercase">{stats.source}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReload}
              disabled={isReloading}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Reload DMIs</span>
            </button>
          </div>

          {/* Loaded Sprite Sheets Table */}
          <div className="border border-neutral-800 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-neutral-950 border-b border-neutral-800 text-[11px] font-bold text-neutral-400 flex justify-between items-center">
              <span>Parsed DMI Packages</span>
              <span className="text-[10px] text-neutral-500">{stats.sheets.length} total</span>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-neutral-800/60 bg-neutral-900/60 text-[11px]">
              {stats.sheets.map((sheet) => (
                <div key={sheet.name} className="px-3 py-1.5 flex items-center justify-between hover:bg-neutral-800/40">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-300 font-bold">{sheet.name}</span>
                    <span className="text-[10px] text-neutral-500">
                      ({sheet.statesCount} states)
                    </span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                      sheet.source === 'paradise'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : sheet.source === 'tgstation'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {sheet.source}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-neutral-400 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            100% TGStation, Paradise & Griefly DMI Compatibility
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
