import React, { useState, useRef } from 'react';
import { PASSIVE_SKILL_TREE } from '../game/constants';
import type { SkillNode } from '../game/constants';
import { apiFetch } from '../utils/api';

interface PassiveSkillTreeProps {
  character: any;
  onUpdateCharacter: (char: any) => void;
}

export const PassiveSkillTree: React.FC<PassiveSkillTreeProps> = ({ character, onUpdateCharacter }) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoverNode, setHoverNode] = useState<SkillNode | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const allocated: string[] = JSON.parse(character.passives || '[]');
  const spentPoints = allocated.length; // "start" node is free but included, so spent points is total allocated
  const maxPoints = character.level; // 1 point starting at lvl 1, 1 per lvl up. Total = level.
  const pointsAvailable = maxPoints - spentPoints;

  // Zooming
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      newZoom = Math.min(2.0, zoom * zoomFactor);
    } else {
      newZoom = Math.max(0.4, zoom / zoomFactor);
    }
    setZoom(newZoom);
  };

  // Drag panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Left click only
    isDragging.current = true;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging.current) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setHoverPos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15
      });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Check if a node is connectable
  const isConnectable = (nodeId: string): boolean => {
    if (allocated.includes(nodeId)) return false;
    const node = PASSIVE_SKILL_TREE[nodeId];
    if (!node) return false;

    // Check if any of its connections are already allocated
    return node.connections.some(connId => allocated.includes(connId));
  };

  // Click handler to allocate a node
  const handleNodeClick = async (nodeId: string) => {
    if (allocated.includes(nodeId)) return; // Already allocated
    if (pointsAvailable <= 0) return; // No points
    if (nodeId !== 'start' && !isConnectable(nodeId)) return; // Not connected

    const newAllocations = [...allocated, nodeId];
    try {
      const updatedChar = await apiFetch('/character/allocate-passives', {
        method: 'POST',
        body: JSON.stringify({ passives: newAllocations })
      });
      onUpdateCharacter(updatedChar);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Reset Tree
  const handleReset = async () => {
    if (window.confirm('Reset your passive skill tree? This will refund all points to start.')) {
      try {
        const updatedChar = await apiFetch('/character/allocate-passives', {
          method: 'POST',
          body: JSON.stringify({ passives: ['start'] }) // Keep only start node
        });
        onUpdateCharacter(updatedChar);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Color mapper based on node type
  const getNodeColor = (node: SkillNode) => {
    const isAlloc = allocated.includes(node.id);
    if (!isAlloc) {
      switch (node.type) {
        case 'life': return '#331515';
        case 'atk': return '#332c15';
        case 'crit': return '#2f1533';
        case 'speed': return '#153319';
        case 'def': return '#152b33';
        case 'start': return '#333333';
      }
    } else {
      switch (node.type) {
        case 'life': return '#ff453a';
        case 'atk': return '#ffcc00';
        case 'crit': return '#bf5af2';
        case 'speed': return '#30d158';
        case 'def': return '#64d2ff';
        case 'start': return '#ffffff';
      }
    }
  };

  const getNodeStrokeColor = (node: SkillNode) => {
    const isAlloc = allocated.includes(node.id);
    if (isAlloc) return '#ffffff';
    if (isConnectable(node.id) && pointsAvailable > 0) return '#00d8ff';
    return '#444444';
  };

  // Draw lines first (so they render behind nodes)
  const renderedLinks: React.ReactNode[] = [];
  const processedLinks = new Set<string>();

  Object.values(PASSIVE_SKILL_TREE).forEach(node => {
    node.connections.forEach(connId => {
      const key1 = `${node.id}-${connId}`;
      const key2 = `${connId}-${node.id}`;
      if (processedLinks.has(key1) || processedLinks.has(key2)) return;

      processedLinks.add(key1);
      const target = PASSIVE_SKILL_TREE[connId];
      if (!target) return;

      const isAllocatedLink = allocated.includes(node.id) && allocated.includes(target.id);

      renderedLinks.push(
        <line
          key={key1}
          x1={node.x}
          y1={node.y}
          x2={target.x}
          y2={target.y}
          stroke={isAllocatedLink ? '#00d8ff' : '#222630'}
          strokeWidth={isAllocatedLink ? 3 : 1.5}
          strokeDasharray={!isAllocatedLink && (allocated.includes(node.id) || allocated.includes(target.id)) ? '3,3' : undefined}
          style={{
            filter: isAllocatedLink ? 'drop-shadow(0 0 4px rgba(0, 216, 255, 0.6))' : 'none',
            transition: 'all 0.3s'
          }}
        />
      );
    });
  });

  return (
    <div className="relative w-full h-[550px] bg-[#05080f] rounded-xl border border-white/5 overflow-hidden select-none">
      {/* HUD Info */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
        <h4 className="m-0 text-white font-display text-sm tracking-wide">PASSIVE SKILL TREE</h4>
        <div className="text-xs text-slate-400">
          Points Spent: <span className="text-[#00d8ff] font-bold">{spentPoints - 1}</span> / {maxPoints - 1}
        </div>
        <div className="text-xs text-slate-400">
          Available: <span className="text-emerald-400 font-bold">{pointsAvailable}</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleReset}
          className="px-3 py-1 bg-red-950/40 text-red-400 border border-red-800/40 rounded text-xs hover:bg-red-900/40 hover:text-red-300 transition"
        >
          Reset Tree
        </button>
      </div>

      {/* SVG Viewport */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ background: '#05070c' }}
      >
        {/* Ambient Grid Background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.015)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Draggable/Zoomable Canvas Group */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: 'center' }}>
          {/* Links */}
          {renderedLinks}

          {/* Nodes */}
          {Object.values(PASSIVE_SKILL_TREE).map((node: SkillNode) => {
            const isAlloc = allocated.includes(node.id);
            const canAlloc = isConnectable(node.id) && pointsAvailable > 0;
            
            const isKeystone = node.id.startsWith('r10_') && (parseInt(node.id.split('_')[1], 10) % 16 === 0);
            const isNotable = node.name.includes('Notable') || node.name.startsWith('Grand');
            const r = node.id === 'start' ? 16 : (isKeystone ? 18 : (isNotable ? 12 : 9));

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => setHoverNode(node)}
                onMouseLeave={() => setHoverNode(null)}
                className="cursor-pointer"
              >
                {/* Neon Glow Outer ring for notable Grand Nodes and Keystones */}
                {(isNotable || isKeystone) && (
                  <circle
                    r={r + 6}
                    fill="none"
                    stroke={getNodeColor(node)}
                    strokeWidth={isKeystone ? "2" : "1.5"}
                    strokeDasharray={isKeystone ? undefined : "4,2"}
                    opacity={isAlloc ? 0.8 : 0.3}
                    style={{
                      animation: isAlloc ? 'spin 10s linear infinite' : 'none',
                      filter: isKeystone && isAlloc ? `drop-shadow(0 0 8px ${getNodeColor(node)})` : 'none'
                    }}
                  />
                )}

                {/* Glow filter under allocated nodes */}
                {isAlloc && (
                  <circle
                    r={r + 3}
                    fill="none"
                    stroke={getNodeColor(node)}
                    strokeWidth="3"
                    opacity="0.3"
                    style={{ filter: `blur(4px)` }}
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r={r}
                  fill={getNodeColor(node)}
                  stroke={getNodeStrokeColor(node)}
                  strokeWidth={isAlloc ? 2.5 : (canAlloc ? 1.5 : 1)}
                  style={{
                    transition: 'all 0.2s',
                    filter: isAlloc ? `drop-shadow(0 0 6px ${getNodeColor(node)})` : 'none'
                  }}
                />

                {/* Concentric node center */}
                {isAlloc && (
                  <circle
                    r={3}
                    fill="#ffffff"
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover Node Tooltip */}
      {hoverNode && (
        <div
          className="absolute z-20 w-52 p-3 bg-[#0d121e] border border-white/10 rounded-lg shadow-xl pointer-events-none text-xs"
          style={{ left: hoverPos.x, top: hoverPos.y }}
        >
          <div className="font-display font-semibold text-white mb-1 tracking-wide">{hoverNode.name}</div>
          <div className="text-slate-400 leading-relaxed mb-2">{hoverNode.description}</div>
          <div className="border-t border-white/5 pt-2 flex flex-col gap-1">
            <span className="text-slate-500 font-medium">Node Type: <span className="uppercase" style={{ color: getNodeColor(hoverNode) }}>{hoverNode.type}</span></span>
            {allocated.includes(hoverNode.id) ? (
              <span className="text-[#00d8ff] font-semibold">Allocated</span>
            ) : isConnectable(hoverNode.id) && pointsAvailable > 0 ? (
              <span className="text-emerald-400 font-semibold">Click to allocate (1 Point)</span>
            ) : isConnectable(hoverNode.id) ? (
              <span className="text-slate-500">Requires 1 Skill Point</span>
            ) : hoverNode.id !== 'start' ? (
              <span className="text-slate-600">Locked (Path from start)</span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
