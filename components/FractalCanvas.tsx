import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AppState, Point } from '../types';

interface FractalCanvasProps {
  state: AppState;
  isPlaying: boolean;
  downloadRef: React.MutableRefObject<(() => void) | null>;
  resetRef: React.MutableRefObject<(() => void) | null>;
}

// 2.5M points is a safe balance between history depth and memory/performance
const MAX_POINTS = 2500000;
const LOGICAL_RADIUS = 1000; // The polygon fits within this radius in "World Space"

export const FractalCanvas: React.FC<FractalCanvasProps> = ({
  state,
  isPlaying,
  downloadRef,
  resetRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  
  // --- Simulation State ---
  // Store points in typed arrays for performance (World Space Coordinates)
  // We use a Ring Buffer strategy
  const historyX = useRef(new Float32Array(MAX_POINTS));
  const historyY = useRef(new Float32Array(MAX_POINTS));
  const writeIdxRef = useRef(0);
  const totalPointsRef = useRef(0);
  
  const verticesRef = useRef<Point[]>([]);
  const currentPointRef = useRef<Point | null>(null);
  
  // --- View State ---
  // Transform: Screen = (World * k) + offset
  const viewRef = useRef({ x: 0, y: 0, k: 1 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // --- UI State ---
  const [displayCount, setDisplayCount] = useState(0);

  // --- Helpers ---
  const worldToScreen = (wx: number, wy: number, view: {x: number, y: number, k: number}) => {
    return {
      x: wx * view.k + view.x,
      y: wy * view.k + view.y
    };
  };

  // --- Core Logic ---

  const calculateVertices = useCallback((n: number) => {
    // Generate vertices in Logical World Space (centered at 0,0)
    const verts: Point[] = [];
    // Rotate so first vertex is at top (-PI/2)
    const angleOffset = -Math.PI / 2;

    for (let i = 0; i < n; i++) {
      const angle = angleOffset + (2 * Math.PI * i) / n;
      verts.push({
        x: LOGICAL_RADIUS * Math.cos(angle),
        y: LOGICAL_RADIUS * Math.sin(angle),
      });
    }
    return verts;
  }, []);

  const fitViewToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Fit the LOGICAL_RADIUS with some padding (0.9) into the canvas
    const minDim = Math.min(canvas.width, canvas.height);
    const scale = (minDim / 2 / LOGICAL_RADIUS) * 0.85;
    
    viewRef.current = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      k: scale
    };
  }, []);

  // Full Redraw of everything (Vertices + History)
  // Called on Init, Reset, Param Change, and Pan/Zoom
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const view = viewRef.current;

    // 1. Background
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Polygon Outline
    const verts = verticesRef.current;
    if (verts.length > 0) {
        ctx.strokeStyle = '#1e293b'; // slate-800
        ctx.lineWidth = 1; // standard width
        ctx.beginPath();
        verts.forEach((v, i) => {
          const s = worldToScreen(v.x, v.y, view);
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        });
        ctx.closePath();
        ctx.stroke();

        // 3. Draw Vertices
        ctx.fillStyle = '#e2e8f0'; // slate-200
        verts.forEach(v => {
          const s = worldToScreen(v.x, v.y, view);
          ctx.beginPath();
          ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
    }

    // 4. Draw History Points
    ctx.fillStyle = state.color;
    const count = Math.min(totalPointsRef.current, MAX_POINTS);
    const hX = historyX.current;
    const hY = historyY.current;
    const pSize = state.pointSize;
    
    // Optimization: If points are huge, we might skip some if zooming out? 
    // For now, raw power of Canvas 2D is usually enough for <1M rects.
    for (let i = 0; i < count; i++) {
        // Transform inline for speed
        const sx = hX[i] * view.k + view.x;
        const sy = hY[i] * view.k + view.y;
        
        // Cull off-screen points
        if (sx >= -pSize && sx < width && sy >= -pSize && sy < height) {
            ctx.fillRect(sx, sy, pSize, pSize);
        }
    }

  }, [state.color, state.pointSize]);


  const resetSimulation = useCallback(() => {
    // Reset Data
    writeIdxRef.current = 0;
    totalPointsRef.current = 0;
    
    // Recalculate Geometry
    verticesRef.current = calculateVertices(state.vertices);
    
    // Reset View
    fitViewToCanvas();
    
    // Pick random start point inside/around the shape
    // (Using (0,0) is fine, it converges instantly)
    currentPointRef.current = { x: 0, y: 0 };
    
    setDisplayCount(0);
    redraw();
  }, [state.vertices, calculateVertices, fitViewToCanvas, redraw]);

  // --- Initialization & Resizing ---

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // We set the internal resolution to match screen pixels
        canvasRef.current.width = width * dpr;
        canvasRef.current.height = height * dpr;
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;

        // If we resize, we should probably re-center or keep relative view?
        // Simpler UX: Just fit view again.
        fitViewToCanvas();
        redraw();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial trigger

    return () => window.removeEventListener('resize', handleResize);
  }, [fitViewToCanvas, redraw]);


  // Re-init on structure change
  useEffect(() => {
    resetSimulation();
  }, [state.vertices, state.ratio, resetSimulation]);
  
  // Re-draw on style change (without resetting simulation)
  useEffect(() => {
    redraw();
  }, [state.color, state.pointSize, redraw]);

  // Expose refs
  useEffect(() => {
    resetRef.current = resetSimulation;
  }, [resetSimulation, resetRef]);

  useEffect(() => {
    downloadRef.current = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `chaos-n${state.vertices}-r${state.ratio}-zoom.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
  }, [state, downloadRef]);


  // --- Animation Loop ---

  const animate = useCallback(() => {
    if (!isPlaying) return;
    
    const canvas = canvasRef.current;
    if (!canvas || !currentPointRef.current || verticesRef.current.length === 0) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const verts = verticesRef.current;
    let p = currentPointRef.current;
    const { ratio, speed, color, pointSize } = state;
    const view = viewRef.current;
    const width = canvas.width;
    const height = canvas.height;
    
    // Arrays
    const hX = historyX.current;
    const hY = historyY.current;
    let idx = writeIdxRef.current;

    // We only draw the NEW points in this frame to keep it fast
    // Unless we are dragging (which triggers full redraws via event handlers)
    // If dragging, we update history but rely on redraw() to show it.
    // If NOT dragging, we draw incrementally on top.
    
    // However, since we are using requestAnimationFrame for this loop, 
    // and redraw() also likely syncs with RAF (or runs immediately),
    // we need to be careful not to double-draw or clear incorrectly.
    
    // Strategy:
    // Always compute physics.
    // Update buffer.
    // If NOT dragging, draw the new points directly to canvas.
    
    ctx.fillStyle = color;

    for (let i = 0; i < speed; i++) {
      const randIndex = Math.floor(Math.random() * verts.length);
      const v = verts[randIndex];

      // Chaos Game Math (World Space)
      p.x = p.x + (v.x - p.x) * ratio;
      p.y = p.y + (v.y - p.y) * ratio;

      // Store in History Ring Buffer
      hX[idx] = p.x;
      hY[idx] = p.y;
      
      // Draw Incremental (Optimization)
      // Only if not dragging (during drag, full redraws happen)
      if (!isDraggingRef.current) {
          const sx = p.x * view.k + view.x;
          const sy = p.y * view.k + view.y;
          // Bounds check for cleanliness
          if (sx >= -pointSize && sx < width && sy >= -pointSize && sy < height) {
              ctx.fillRect(sx, sy, pointSize, pointSize);
          }
      }

      idx = (idx + 1) % MAX_POINTS;
    }

    currentPointRef.current = p;
    writeIdxRef.current = idx;
    totalPointsRef.current += speed;

    requestRef.current = requestAnimationFrame(animate);
  }, [isPlaying, state]);


  // --- Start/Stop ---
  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate]);


  // --- Interaction Handlers ---

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom towards mouse pointer
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Use offsetX/Y if possible, but rect method is robust
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const zoomIntensity = 0.1;
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = 1 + (zoomIntensity * direction);

    const view = viewRef.current;
    
    // Point in World Space before zoom
    const wx = (mouseX - view.x) / view.k;
    const wy = (mouseY - view.y) / view.k;

    // Update Scale
    // Limit min/max zoom? Maybe not needed for chaos game, infinite is fun.
    view.k *= factor;
    // Limit Min Zoom to prevent losing the shape entirely? 
    if (view.k < 0.01) view.k = 0.01;

    // Adjust Offset to keep World Point under Mouse Point
    // mouseX = newX + wx * newK
    // newX = mouseX - wx * newK
    view.x = mouseX - wx * view.k;
    view.y = mouseY - wy * view.k;

    redraw();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    // Update View Offset (Need to account for DPR scaling if we were working in CSS pixels, 
    // but here we are moving the Canvas Context origin.
    // However, mouse movement is in screen pixels. Canvas internal is DPR scaled.
    // So we must multiply delta by DPR.)
    const dpr = window.devicePixelRatio || 1;
    
    viewRef.current.x += dx * dpr;
    viewRef.current.y += dy * dpr;

    redraw();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Sync count for display
  useEffect(() => {
      let f: number;
      const updateUi = () => {
          setDisplayCount(totalPointsRef.current);
          f = requestAnimationFrame(updateUi);
      }
      if(isPlaying) updateUi();
      else setDisplayCount(totalPointsRef.current); // Update once if paused
      
      return () => cancelAnimationFrame(f);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center overflow-hidden">
      <div 
        ref={containerRef} 
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        <canvas 
            ref={canvasRef} 
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="block touch-none"
        />
      </div>

      {/* Point Counter Overlay */}
      <div className="absolute top-6 left-6 font-mono text-sm text-slate-500 bg-slate-900/50 backdrop-blur px-3 py-1 rounded-full border border-slate-800 pointer-events-none select-none">
        Points: <span className="text-slate-200">{displayCount.toLocaleString()}</span>
      </div>
    </div>
  );
};