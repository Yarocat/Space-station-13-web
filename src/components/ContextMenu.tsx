import React, { useEffect, useRef } from 'react';
import { WorldObject, TurfType, PlayerMob } from '../types';
import {
  Eye,
  Hand,
  Crosshair,
  Shield,
  Lock,
  Unlock,
  Flame,
  Wrench,
  Key,
  Archive,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export interface ContextMenuTarget {
  type: 'turf' | 'object' | 'mob';
  id?: string;
  name: string;
  icon?: string;
  color?: string;
  examineText?: string;
  actions?: { id: string; label: string; icon?: string }[];
  data?: any;
}

interface ContextMenuProps {
  x: number;
  y: number;
  targets: ContextMenuTarget[];
  onClose: () => void;
  onAction: (action: string, target: ContextMenuTarget) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  targets,
  onClose,
  onAction,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Esc
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust menu position to avoid clipping offscreen
  const posX = Math.min(x, window.innerWidth - 240);
  const posY = Math.min(y, window.innerHeight - 300);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-slate-950/95 border-2 border-slate-700 rounded-xl shadow-2xl backdrop-blur-md p-1.5 min-w-[210px] text-xs font-mono text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100"
      style={{ left: `${posX}px`, top: `${posY}px` }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 flex items-center justify-between mb-1">
        <span>Goob Interaction Menu</span>
        <span className="text-slate-500">R-Click</span>
      </div>

      <div className="max-h-72 overflow-y-auto space-y-1">
        {targets.map((target, idx) => (
          <div
            key={`${target.type}_${target.id || idx}`}
            className="border border-slate-800/80 rounded-lg p-1.5 bg-slate-900/60"
          >
            {/* Target Header */}
            <div className="flex items-center space-x-2 px-1 py-0.5 text-slate-100 font-bold border-b border-slate-800/50 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: target.color || '#38bdf8' }}
              />
              <span className="truncate">{target.name}</span>
            </div>

            {/* Target Actions */}
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => onAction('examine', target)}
                className="w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors text-left"
              >
                <Eye className="w-3 h-3 text-cyan-400" />
                <span>Examine</span>
              </button>

              {target.type === 'object' && target.data.isItem && (
                <button
                  type="button"
                  onClick={() => onAction('pickup', target)}
                  className="w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-emerald-300 transition-colors text-left"
                >
                  <Hand className="w-3 h-3 text-emerald-400" />
                  <span>Pick up</span>
                </button>
              )}

              {target.type === 'object' && (target.data.isOpen !== undefined) && (
                <button
                  type="button"
                  onClick={() => onAction('toggle_open', target)}
                  className="w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-300 transition-colors text-left"
                >
                  <Archive className="w-3 h-3 text-amber-400" />
                  <span>{target.data.isOpen ? 'Close' : 'Open'}</span>
                </button>
              )}

              {target.type === 'object' && (target.data.isLocked !== undefined) && (
                <button
                  type="button"
                  onClick={() => onAction('toggle_lock', target)}
                  className="w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-rose-300 transition-colors text-left"
                >
                  {target.data.isLocked ? (
                    <Unlock className="w-3 h-3 text-rose-400" />
                  ) : (
                    <Lock className="w-3 h-3 text-rose-400" />
                  )}
                  <span>{target.data.isLocked ? 'Unlock (ID)' : 'Lock (ID)'}</span>
                </button>
              )}

              {target.type === 'object' && !target.data.isItem && (
                <>
                  <button
                    type="button"
                    onClick={() => onAction('wrench', target)}
                    className="w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-yellow-300 transition-colors text-left"
                  >
                    <Wrench className="w-3 h-3 text-yellow-400" />
                    <span>{target.data.anchored ? 'Unwrench & Bolt' : 'Wrench & Anchor'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAction('weld', target)}
                    className="w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-orange-300 transition-colors text-left"
                  >
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span>{target.data.welded ? 'Slice & Unweld' : 'Weld Shut'}</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => onAction('pull', target)}
                className="w-full flex items-center space-x-2 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-blue-300 transition-colors text-left"
              >
                <Hand className="w-3 h-3 text-blue-400" />
                <span>Pull / Grab</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
