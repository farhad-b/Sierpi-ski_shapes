import React, { useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { FractalCanvas } from './components/FractalCanvas';
import { AppState, DEFAULT_STATE } from './types';
import { Info, MousePointer2 } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Ref to expose canvas download function
  const downloadRef = useRef<(() => void) | null>(null);
  // Ref to trigger canvas reset
  const resetRef = useRef<(() => void) | null>(null);

  const handleParamChange = (key: keyof AppState, value: number | string) => {
    setState((prev) => {
      const newState = { ...prev, [key]: value };
      return newState;
    });
  };

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const handleReset = () => {
    setIsPlaying(false);
    if (resetRef.current) resetRef.current();
  };

  const handleDownload = () => {
    if (downloadRef.current) downloadRef.current();
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Controls */}
      <Sidebar 
        state={state} 
        onChange={handleParamChange}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onReset={handleReset}
        onDownload={handleDownload}
      />

      {/* Main Canvas Area */}
      <main className="flex-1 relative flex items-center justify-center bg-slate-950 overflow-hidden shadow-inner group cursor-grab active:cursor-grabbing">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ 
               backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', 
               backgroundSize: '24px 24px' 
             }}>
        </div>

        <FractalCanvas 
          state={state}
          isPlaying={isPlaying}
          downloadRef={downloadRef}
          resetRef={resetRef}
        />
        
        {/* Overlay Info */}
        <div className="absolute bottom-6 right-6 pointer-events-none flex flex-col gap-3">
           {/* Instructions Tag */}
           <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3 text-xs text-slate-400 shadow-xl max-w-xs">
             <div className="flex items-center gap-2 mb-2 text-slate-300 font-semibold">
                <MousePointer2 size={14} className="text-indigo-400" />
                Interactive Canvas
             </div>
             <ul className="space-y-1 list-disc list-inside opacity-80">
               <li>Scroll to <strong>Zoom</strong></li>
               <li>Drag to <strong>Pan</strong></li>
             </ul>
           </div>

           {/* About Tag */}
           <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3 text-xs text-slate-400 max-w-xs shadow-xl">
             <div className="flex items-center gap-2 mb-1">
               <Info size={14} className="text-blue-400" />
               <span className="font-semibold text-slate-200">About</span>
             </div>
             <p>
               The Chaos Game iterates a point moving towards a random vertex by a fraction (ratio).
               <br />
               <span className="text-blue-400">N=3, Ratio=0.5</span> generates the Sierpiński Triangle.
             </p>
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;