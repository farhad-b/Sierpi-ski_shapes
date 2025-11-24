import React from 'react';
import { Play, Pause, RotateCcw, Download, Settings, Share2 } from 'lucide-react';
import { AppState } from '../types';

interface SidebarProps {
  state: AppState;
  isPlaying: boolean;
  onChange: (key: keyof AppState, value: number | string) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onDownload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  state,
  isPlaying,
  onChange,
  onTogglePlay,
  onReset,
  onDownload,
}) => {
  return (
    <aside className="w-full md:w-80 flex-shrink-0 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col h-auto md:h-full z-10 transition-all duration-300">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-900 sticky top-0">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Chaos Explorer
        </h1>
        <p className="text-xs text-slate-500 mt-1">Generalised Sierpiński Generator</p>
      </div>

      {/* Controls Container - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Geometry Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Share2 size={16} /> Geometry
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <label>Vertices (N)</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="3"
                max="12"
                step="1"
                value={state.vertices}
                onChange={(e) => onChange('vertices', parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-colors"
              />
              <input
                type="number"
                min="3"
                max="12"
                value={state.vertices}
                onChange={(e) => onChange('vertices', parseInt(e.target.value))}
                className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <label>Compression Ratio (r)</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.01"
                max="0.99"
                step="0.001"
                value={state.ratio}
                onChange={(e) => onChange('ratio', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-colors"
              />
              <input
                type="number"
                min="0.01"
                max="0.99"
                step="0.001"
                value={state.ratio}
                onChange={(e) => onChange('ratio', parseFloat(e.target.value))}
                className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 px-1">
              <span>0%</span>
              <span className="cursor-pointer hover:text-indigo-400" onClick={() => onChange('ratio', 0.5)}>Mid (0.5)</span>
              <span className="cursor-pointer hover:text-indigo-400" onClick={() => onChange('ratio', 0.618)}>Gold (0.618)</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Animation Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Settings size={16} /> Simulation
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <label>Speed (points/frame)</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="5000"
                step="10"
                value={state.speed}
                onChange={(e) => onChange('speed', parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-colors"
              />
              <input
                type="number"
                min="1"
                max="10000"
                step="10"
                value={state.speed}
                onChange={(e) => onChange('speed', parseInt(e.target.value))}
                className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Style Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <div className="w-4 h-4 rounded-full border border-slate-500" style={{backgroundColor: state.color}}></div>
            Style
          </div>

          <div className="grid grid-cols-5 gap-2">
             {['#60A5FA', '#34D399', '#F472B6', '#A78BFA', '#FBBF24', '#FFFFFF'].map(c => (
               <button
                key={c}
                onClick={() => onChange('color', c)}
                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 ring-offset-slate-900 ${state.color === c ? 'ring-white scale-110' : 'ring-transparent'}`}
                style={{backgroundColor: c}}
                aria-label={`Select color ${c}`}
               />
             ))}
          </div>

          <div className="space-y-1 pt-2">
            <div className="flex justify-between text-xs text-slate-400">
              <label>Point Size</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.5"
                value={state.pointSize}
                onChange={(e) => onChange('pointSize', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400 hover:accent-slate-300 transition-colors"
              />
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={state.pointSize}
                onChange={(e) => onChange('pointSize', parseFloat(e.target.value))}
                className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-xs text-slate-200 focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-slate-800 bg-slate-900 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onTogglePlay}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
              isPlaying 
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50 hover:bg-amber-500/20' 
              : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            {isPlaying ? 'Pause' : 'Start'}
          </button>

          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>

        <button
          onClick={onDownload}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <Download size={14} />
          Save Image
        </button>
      </div>
    </aside>
  );
};