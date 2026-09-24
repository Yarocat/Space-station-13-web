import React from 'react';
import { WorldObject, ItemType } from '../types';
import { getItemDmiInfo, drawDmiSprite } from '../systems/dmiSystem';
import { X, Package, ArrowDown, ArrowUp } from 'lucide-react';

interface ContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  container: WorldObject | null;
  activeHandItem: WorldObject | null;
  onStoreActiveItem: () => void;
  onRetrieveItem: (index: number) => void;
}

export const ContainerModal: React.FC<ContainerModalProps> = ({
  isOpen,
  onClose,
  container,
  activeHandItem,
  onStoreActiveItem,
  onRetrieveItem,
}) => {
  if (!isOpen || !container) return null;

  const items = container.contains || [];
  const maxCapacity = container.type === 'Backpack' ? 7 : container.type === 'Toolbelt' ? 6 : 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Package className="w-5 h-5" />
            <h3 className="font-mono font-bold text-slate-100 text-sm">
              {container.name} ({items.length}/{maxCapacity})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Quick store active hand button */}
          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-xs font-mono text-slate-300">
              Active Hand:{' '}
              <span className="font-bold text-cyan-300">
                {activeHandItem ? activeHandItem.name : 'Empty'}
              </span>
            </div>
            <button
              type="button"
              disabled={!activeHandItem || items.length >= maxCapacity}
              onClick={onStoreActiveItem}
              className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center space-x-1 ${
                activeHandItem && items.length < maxCapacity
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Put Inside</span>
            </button>
          </div>

          {/* Stored Items Grid */}
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold block mb-2">
              Container Contents:
            </span>
            {items.length === 0 ? (
              <div className="text-center py-6 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-lg">
                Empty container. Put items in from your active hand.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {items.map((it, idx) => (
                  <div
                    key={`${it.id}_${idx}`}
                    className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800 hover:border-slate-700"
                  >
                    <span className="text-xs font-mono text-slate-200 truncate mr-2">
                      {it.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRetrieveItem(idx)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-cyan-700 text-cyan-300 hover:text-white rounded text-[10px] font-mono shrink-0 transition-colors flex items-center space-x-1"
                      title="Take out into active hand"
                    >
                      <ArrowUp className="w-3 h-3" />
                      <span>Take</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
