import React, { useState } from 'react';
import { TurfType, StructureType, ItemType, EditorTool, PaletteCategory, Tile } from '../types';
import { TURFS_REGISTRY, STRUCTURES_REGISTRY, ITEMS_REGISTRY } from '../data/assets';
import { 
  Paintbrush, 
  PaintBucket, 
  Eraser, 
  Info, 
  Trash2, 
  Download, 
  Upload, 
  Layers, 
  Flame, 
  Box, 
  Wrench, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface MapEditorSidebarProps {
  currentTool: EditorTool;
  setCurrentTool: (tool: EditorTool) => void;
  selectedTurf: TurfType;
  setSelectedTurf: (t: TurfType) => void;
  selectedObject: StructureType | ItemType | null;
  setSelectedObject: (o: StructureType | ItemType | null) => void;
  inspectedTile: Tile | null;
  onRemoveObjectFromTile: (tileX: number, tileY: number, objId: string) => void;
  onClearTile: (tileX: number, tileY: number) => void;
  onLoadPreset: (preset: 'sector13' | 'tiny_space' | 'blank') => void;
  onExportJson: () => void;
  onImportJson: (json: string) => void;
}

export const MapEditorSidebar: React.FC<MapEditorSidebarProps> = ({
  currentTool,
  setCurrentTool,
  selectedTurf,
  setSelectedTurf,
  selectedObject,
  setSelectedObject,
  inspectedTile,
  onRemoveObjectFromTile,
  onClearTile,
  onLoadPreset,
  onExportJson,
  onImportJson,
}) => {
  const [activeCategory, setActiveCategory] = useState<PaletteCategory>('TURFS');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const tools: { id: EditorTool; label: string; icon: React.ReactNode }[] = [
    { id: 'BRUSH', label: 'Brush', icon: <Paintbrush className="w-3.5 h-3.5" /> },
    { id: 'FILL', label: 'Fill', icon: <PaintBucket className="w-3.5 h-3.5" /> },
    { id: 'ERASE', label: 'Erase', icon: <Eraser className="w-3.5 h-3.5" /> },
    { id: 'INSPECT', label: 'Inspect', icon: <Info className="w-3.5 h-3.5" /> },
  ];

  const categories: { id: PaletteCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'TURFS', label: 'Turfs', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'STRUCTURES', label: 'Structures', icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'ATMOS', label: 'Atmos', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'ITEMS', label: 'Items', icon: <Wrench className="w-3.5 h-3.5" /> },
  ];

  const atmosTypes: StructureType[] = [
    'Vent',
    'Pipe',
    'PipePump',
    'GasTank',
    'PlasmaGasTank',
    'FuelTank',
    'WaterTank',
    'PressureIndicator',
  ];

  return (
    <div className="flex flex-col h-full w-80 bg-neutral-900 border-l border-neutral-800 text-xs font-mono select-none overflow-hidden">
      {/* Editor Header */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-neutral-200 tracking-wide text-sm font-display">
            GRIEFLY MAP EDITOR
          </span>
        </div>
      </div>

      {/* Tool Selection Ribbon */}
      <div className="p-2 border-b border-neutral-800 bg-neutral-950/40 grid grid-cols-4 gap-1.5">
        {tools.map((t) => (
          <button
            key={t.id}
            id={`tool-${t.id.toLowerCase()}`}
            onClick={() => setCurrentTool(t.id)}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded font-medium transition-colors border ${
              currentTool === t.id
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/60 shadow-sm'
                : 'bg-neutral-800/80 text-neutral-400 border-neutral-700 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            {t.icon}
            <span className="text-[10px]">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-neutral-800 bg-neutral-950/50">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 py-2 flex items-center justify-center gap-1 text-[10px] uppercase font-semibold transition-colors border-b-2 ${
              activeCategory === cat.id
                ? 'border-sky-400 text-sky-300 bg-neutral-800/40'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Palette Items Grid */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1 scrollbar-thin scrollbar-thumb-neutral-700">
        {activeCategory === 'TURFS' && (
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(TURFS_REGISTRY).map((turf) => (
              <button
                key={turf.type}
                onClick={() => {
                  setSelectedTurf(turf.type);
                  setSelectedObject(null);
                  if (currentTool === 'INSPECT' || currentTool === 'ERASE') setCurrentTool('BRUSH');
                }}
                className={`p-2 rounded border text-left flex items-center gap-2 transition-all ${
                  selectedTurf === turf.type && !selectedObject
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                    : 'bg-neutral-800/60 border-neutral-700/80 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-sm border border-white/20 shrink-0"
                  style={{ backgroundColor: turf.color }}
                />
                <div className="truncate">
                  <div className="text-[11px] font-semibold truncate">{turf.name}</div>
                  <div className="text-[9px] text-neutral-500 truncate">{turf.type}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeCategory === 'STRUCTURES' && (
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(STRUCTURES_REGISTRY)
              .filter((s) => !atmosTypes.includes(s.type as StructureType))
              .map((struct) => (
                <button
                  key={struct.type}
                  onClick={() => {
                    setSelectedObject(struct.type);
                    if (currentTool === 'INSPECT' || currentTool === 'ERASE') setCurrentTool('BRUSH');
                  }}
                  className={`p-2 rounded border text-left flex items-center gap-2 transition-all ${
                    selectedObject === struct.type
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                      : 'bg-neutral-800/60 border-neutral-700/80 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-sm font-mono shrink-0 w-4 text-center" style={{ color: struct.color }}>
                    {struct.symbol}
                  </span>
                  <div className="truncate">
                    <div className="text-[11px] font-semibold truncate">{struct.name}</div>
                    <div className="text-[9px] text-neutral-500 truncate">{struct.type}</div>
                  </div>
                </button>
              ))}
          </div>
        )}

        {activeCategory === 'ATMOS' && (
          <div className="grid grid-cols-2 gap-1.5">
            {atmosTypes.map((type) => {
              const meta = STRUCTURES_REGISTRY[type];
              return (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedObject(type);
                    if (currentTool === 'INSPECT' || currentTool === 'ERASE') setCurrentTool('BRUSH');
                  }}
                  className={`p-2 rounded border text-left flex items-center gap-2 transition-all ${
                    selectedObject === type
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                      : 'bg-neutral-800/60 border-neutral-700/80 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-sm font-mono shrink-0 w-4 text-center" style={{ color: meta.color }}>
                    {meta.symbol}
                  </span>
                  <div className="truncate">
                    <div className="text-[11px] font-semibold truncate">{meta.name}</div>
                    <div className="text-[9px] text-neutral-500 truncate">{meta.type}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {activeCategory === 'ITEMS' && (
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(ITEMS_REGISTRY).map((item) => (
              <button
                key={item.type}
                onClick={() => {
                  setSelectedObject(item.type);
                  if (currentTool === 'INSPECT' || currentTool === 'ERASE') setCurrentTool('BRUSH');
                }}
                className={`p-2 rounded border text-left flex items-center gap-2 transition-all ${
                  selectedObject === item.type
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                    : 'bg-neutral-800/60 border-neutral-700/80 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <span className="text-sm font-mono shrink-0 w-4 text-center" style={{ color: item.color }}>
                  {item.symbol}
                </span>
                <div className="truncate">
                  <div className="text-[11px] font-semibold truncate">{item.name}</div>
                  <div className="text-[9px] text-neutral-500 truncate">{item.type}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Inspected Tile Details (if in INSPECT tool) */}
      {inspectedTile && (
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/70 flex flex-col gap-2 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-200">
              Tile ({inspectedTile.x}, {inspectedTile.y})
            </span>
            <button
              onClick={() => onClearTile(inspectedTile.x, inspectedTile.y)}
              className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear Tile
            </button>
          </div>

          <div className="text-[11px] text-neutral-400 flex justify-between">
            <span>Turf:</span>
            <span className="text-neutral-200 font-semibold">{inspectedTile.turf}</span>
          </div>

          <div className="text-[11px] text-neutral-400 flex justify-between">
            <span>Atmos Pressure:</span>
            <span className="text-sky-300 font-semibold">{inspectedTile.atmos.pressure.toFixed(1)} kPa</span>
          </div>

          {/* Objects on Tile */}
          <div className="space-y-1 pt-1 border-t border-neutral-800">
            <span className="text-[10px] text-neutral-500 uppercase">Contents ({inspectedTile.objects.length})</span>
            {inspectedTile.objects.map((obj) => (
              <div key={obj.id} className="flex items-center justify-between text-[10px] bg-neutral-800/80 px-1.5 py-1 rounded">
                <span className="truncate text-neutral-300">{obj.name}</span>
                <button
                  onClick={() => onRemoveObjectFromTile(inspectedTile.x, inspectedTile.y, obj.id)}
                  className="text-neutral-500 hover:text-red-400 ml-1"
                  title="Remove Object"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map File / Preset Bar */}
      <div className="p-2.5 border-t border-neutral-800 bg-neutral-950/90 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-semibold">
          <span>STATION MAPS</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onLoadPreset('sector13')}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[9px]"
              title="Load full Sector 13 station"
            >
              Sector 13
            </button>
            <button
              onClick={() => onLoadPreset('tiny_space')}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[9px]"
              title="Load Tiny Space map"
            >
              Tiny Space
            </button>
            <button
              onClick={() => onLoadPreset('blank')}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[9px]"
              title="Blank Space canvas"
            >
              Blank
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportJson}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs border border-neutral-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Export JSON
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs border border-neutral-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" /> Import JSON
          </button>
        </div>
      </div>

      {/* Import JSON Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 w-full max-w-lg shadow-2xl flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-100 text-sm">Import Griefly Map (.gen.json)</span>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste Griefly / SS13 map JSON content here..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-sky-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onImportJson(importText);
                  setShowImportModal(false);
                  setImportText('');
                }}
                disabled={!importText.trim()}
                className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs"
              >
                Load Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
