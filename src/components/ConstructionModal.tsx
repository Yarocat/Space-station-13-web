import React, { useState } from 'react';
import { ConstructionRecipe, WorldObject } from '../types';
import { CONSTRUCTION_RECIPES } from '../data/construction';
import { Hammer, X, Check, AlertTriangle, Layers, Wrench, Shield } from 'lucide-react';

interface ConstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerInventoryItems: WorldObject[];
  onConstruct: (recipe: ConstructionRecipe) => void;
}

export const ConstructionModal: React.FC<ConstructionModalProps> = ({
  isOpen,
  onClose,
  playerInventoryItems,
  onConstruct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Structure', 'Airlock', 'Furniture', 'Atmos', 'Power', 'Item'];

  const filteredRecipes = selectedCategory === 'All'
    ? CONSTRUCTION_RECIPES
    : CONSTRUCTION_RECIPES.filter((r) => r.category === selectedCategory);

  // Check if player has the required materials
  const checkCanBuild = (recipe: ConstructionRecipe) => {
    for (const req of recipe.materialsRequired) {
      const matchCount = playerInventoryItems.filter((i) => i.type === req.type).length;
      if (matchCount < req.count) return false;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl shadow-cyan-950/40 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-600 rounded-xl text-white shadow-md shadow-amber-900/40">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono text-slate-100">
                Goob Station Construction & Autolathe Blueprints
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Fabricate bulkheads, airlocks, machinery, and station equipment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 gap-2 py-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 font-mono text-xs rounded-lg transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Recipes Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredRecipes.map((recipe) => {
            const canBuild = checkCanBuild(recipe);
            return (
              <div
                key={recipe.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  canBuild
                    ? 'bg-slate-950 border-slate-700 hover:border-amber-400'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-sm text-slate-100">
                      {recipe.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
                      {recipe.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mb-3">
                    {recipe.description}
                  </p>

                  {/* Requirements */}
                  <div className="space-y-1 text-xs font-mono mb-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Required Materials:
                    </div>
                    {recipe.materialsRequired.map((mat, i) => (
                      <div key={i} className="text-slate-300 flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{mat.name}</span>
                      </div>
                    ))}
                    {recipe.requiredTool && recipe.requiredTool !== 'None' && (
                      <div className="text-amber-400 flex items-center space-x-1.5 pt-1">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Requires: {recipe.requiredTool}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onConstruct(recipe);
                    onClose();
                  }}
                  className={`w-full py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                    canBuild
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                  }`}
                >
                  <Hammer className="w-4 h-4" />
                  <span>{canBuild ? 'Fabricate Blueprint' : 'Build / Place'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
