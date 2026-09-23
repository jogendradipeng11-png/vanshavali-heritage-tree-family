import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Plus, Minus, RotateCcw, Crosshair } from 'lucide-react';
import { MemberNode, RelationshipLink, Branch } from '../types';
import { MemberCard } from './MemberCard';
import { CARD_WIDTH, CARD_HEIGHT } from '../initialData';
import { getAllDescendantIds } from '../utils/treeUtils';

interface TreeCanvasProps {
  nodes: MemberNode[];
  links: RelationshipLink[];
  activeBranch: Branch | 'all';
  searchQuery: string;
  spotlightNodeId: string | null;
  activeSharedNodeId?: string | null;
  collapsedNodes: Set<string>;
  onSelectNode: (node: MemberNode) => void;
  onShareNode: (node: MemberNode, e: React.MouseEvent) => void;
  onAddRelative: (node: MemberNode, e: React.MouseEvent) => void;
  onToggleCollapse: (nodeId: string, e: React.MouseEvent) => void;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
}

export const TreeCanvas: React.FC<TreeCanvasProps> = ({
  nodes,
  links,
  activeBranch,
  searchQuery,
  spotlightNodeId,
  activeSharedNodeId = null,
  collapsedNodes,
  onSelectNode,
  onShareNode,
  onAddRelative,
  onToggleCollapse,
  onUpdateNodePosition
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 80, y: 100 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Node Dragging State
  const draggingNodeRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Hidden nodes check from ancestor collapses
  const isHiddenByCollapse = useCallback((nodeId: string): boolean => {
    for (const cId of collapsedNodes) {
      const descendants = getAllDescendantIds(cId, links);
      if (descendants.has(nodeId)) return true;
    }
    return false;
  }, [collapsedNodes, links]);

  // Check branch visibility
  const isVisibleInBranch = useCallback((node: MemberNode): boolean => {
    if (activeBranch === 'all') return true;
    return node.branch === activeBranch;
  }, [activeBranch]);

  // Check search query matching
  const matchesSearch = useCallback((node: MemberNode): boolean => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return Boolean(
      node.name.toLowerCase().includes(q) ||
      (node.gotra && node.gotra.toLowerCase().includes(q)) ||
      (node.bansa && node.bansa.toLowerCase().includes(q)) ||
      (node.relationship_to_root && node.relationship_to_root.toLowerCase().includes(q)) ||
      (node.phone && node.phone.toLowerCase().includes(q)) ||
      (node.profession && node.profession.toLowerCase().includes(q)) ||
      (node.address && node.address.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Check spotlight dimming
  const isDimmed = useCallback((node: MemberNode): boolean => {
    if (!matchesSearch(node)) return true;
    if (!spotlightNodeId) return false;
    if (node.id === spotlightNodeId) return false;

    // Is directly connected to spotlight node
    const isDirectNeighbor = links.some(
      l => (l.source === spotlightNodeId && l.target === node.id) ||
           (l.target === spotlightNodeId && l.source === node.id)
    );
    return !isDirectNeighbor;
  }, [spotlightNodeId, links, matchesSearch]);

  // Handle canvas pan with mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node-card')) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    } else if (draggingNodeRef.current) {
      const { id, startX, startY, origX, origY } = draggingNodeRef.current;
      const dx = (e.clientX - startX) / zoom;
      const dy = (e.clientY - startY) / zoom;
      onUpdateNodePosition(id, origX + dx, origY + dy);
    }
  }, [isPanning, zoom, onUpdateNodePosition]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    draggingNodeRef.current = null;
  }, []);

  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.node-card')) return;
    if (e.touches.length === 1) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      };
    }
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      setPan({
        x: e.touches[0].clientX - panStartRef.current.x,
        y: e.touches[0].clientY - panStartRef.current.y
      });
    } else if (draggingNodeRef.current && e.touches.length === 1) {
      const { id, startX, startY, origX, origY } = draggingNodeRef.current;
      const dx = (e.touches[0].clientX - startX) / zoom;
      const dy = (e.touches[0].clientY - startY) / zoom;
      onUpdateNodePosition(id, origX + dx, origY + dy);
    }
  }, [isPanning, zoom, onUpdateNodePosition]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    draggingNodeRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Node Drag Initiation
  const startDragNode = (node: MemberNode, clientX: number, clientY: number) => {
    draggingNodeRef.current = {
      id: node.id,
      startX: clientX,
      startY: clientY,
      origX: node.x,
      origY: node.y
    };
  };

  // Zoom handlers
  const handleZoom = (factor: number) => {
    setZoom(prev => Math.max(0.2, Math.min(3.5, prev * factor)));
  };

  const resetView = () => {
    setPan({ x: 80, y: 100 });
    setZoom(1);
  };

  const fitToScreen = () => {
    if (nodes.length === 0 || !containerRef.current) return;
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x + CARD_WIDTH));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y + CARD_HEIGHT));

    const treeW = maxX - minX + 160;
    const treeH = maxY - minY + 160;
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;

    const scale = Math.min(1.2, Math.max(0.35, Math.min(containerW / treeW, containerH / treeH)));
    setZoom(scale);
    setPan({
      x: containerW / 2 - (minX + (maxX - minX) / 2) * scale,
      y: containerH / 2 - (minY + (maxY - minY) / 2) * scale
    });
  };

  // Filter visible nodes & links
  const visibleNodes = nodes.filter(n => isVisibleInBranch(n) && !isHiddenByCollapse(n.id));
  const visibleNodeMap = new Map(visibleNodes.map(n => [n.id, n]));

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className="flex-1 relative overflow-hidden canvas-bg w-full h-full cursor-grab active:cursor-grabbing select-none"
    >
      <svg className="w-full h-full absolute inset-0 pointer-events-none">
        <defs>
          <marker
            id="heritage-arrow"
            viewBox="0 0 10 10"
            refX="28"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#818cf8" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Relationship Links */}
          {links.map(link => {
            const sourceNode = visibleNodeMap.get(link.source);
            const targetNode = visibleNodeMap.get(link.target);
            if (!sourceNode || !targetNode) return null;

            const isConnectedToSpotlight = Boolean(
              spotlightNodeId && (link.source === spotlightNodeId || link.target === spotlightNodeId)
            );
            const linkOpacity = spotlightNodeId ? (isConnectedToSpotlight ? 1 : 0.15) : 0.9;

            if (link.type === 'spouse') {
              const x1 = sourceNode.x < targetNode.x ? sourceNode.x + CARD_WIDTH : sourceNode.x;
              const x2 = sourceNode.x < targetNode.x ? targetNode.x : targetNode.x + CARD_WIDTH;
              const y = sourceNode.y + CARD_HEIGHT / 2;
              return (
                <path
                  key={link.id}
                  d={`M ${x1} ${y} L ${x2} ${y}`}
                  stroke="#f43f5e"
                  strokeWidth="3"
                  strokeDasharray="6,5"
                  opacity={linkOpacity}
                />
              );
            }

            if (link.type === 'sibling') {
              const x1 = sourceNode.x < targetNode.x ? sourceNode.x + CARD_WIDTH : sourceNode.x;
              const x2 = sourceNode.x < targetNode.x ? targetNode.x : targetNode.x + CARD_WIDTH;
              const y = sourceNode.y + CARD_HEIGHT / 2 + 15;
              return (
                <path
                  key={link.id}
                  d={`M ${x1} ${y} L ${x2} ${y}`}
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeDasharray="5,4"
                  opacity={linkOpacity}
                />
              );
            }

            // Parent to Child generation curved Bezier link
            const x1 = sourceNode.x + CARD_WIDTH / 2;
            const y1 = sourceNode.y + CARD_HEIGHT;
            const x2 = targetNode.x + CARD_WIDTH / 2;
            const y2 = targetNode.y;
            const midY = (y1 + y2) / 2;

            return (
              <path
                key={link.id}
                d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                stroke="#818cf8"
                strokeWidth="3"
                fill="none"
                markerEnd="url(#heritage-arrow)"
                opacity={linkOpacity}
              />
            );
          })}

          {/* Member Node Cards */}
          {visibleNodes.map(node => {
            const isSpotlight = node.id === spotlightNodeId;
            const dimmed = isDimmed(node);
            const isCollapsed = collapsedNodes.has(node.id);
            const descendantCount = getAllDescendantIds(node.id, links).size;

            return (
              <foreignObject
                key={node.id}
                x={node.x}
                y={node.y}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                className="node-card overflow-visible pointer-events-auto"
                onMouseDown={(e) => {
                  startDragNode(node, e.clientX, e.clientY);
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  if (e.touches.length === 1) {
                    startDragNode(node, e.touches[0].clientX, e.touches[0].clientY);
                    e.stopPropagation();
                  }
                }}
              >
                <MemberCard
                  node={node}
                  isSpotlight={isSpotlight}
                  isDimmed={dimmed}
                  isCollapsed={isCollapsed}
                  descendantCount={descendantCount}
                  isSharedOwner={node.id === activeSharedNodeId}
                  onSelect={onSelectNode}
                  onShare={onShareNode}
                  onAddRelative={onAddRelative}
                  onToggleCollapse={onToggleCollapse}
                />
              </foreignObject>
            );
          })}
        </g>
      </svg>

      {/* Floating Canvas Navigation Controls */}
      <div className="absolute bottom-20 sm:bottom-6 right-4 flex flex-col space-y-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-1.5 shadow-2xl z-20">
        <button
          onClick={() => handleZoom(1.2)}
          title="Zoom In (+)"
          className="w-10 h-10 rounded-xl hover:bg-slate-800 text-white font-bold text-lg flex items-center justify-center transition active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleZoom(0.8)}
          title="Zoom Out (-)"
          className="w-10 h-10 rounded-xl hover:bg-slate-800 text-white font-bold text-lg flex items-center justify-center transition active:scale-95"
        >
          <Minus className="w-5 h-5" />
        </button>
        <button
          onClick={resetView}
          title="Reset View"
          className="w-10 h-10 rounded-xl hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center transition active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={fitToScreen}
          title="Fit All on Screen"
          className="w-10 h-10 rounded-xl hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center transition active:scale-95"
        >
          <Crosshair className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
};
