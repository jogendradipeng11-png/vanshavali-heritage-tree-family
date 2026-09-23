import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Minus, RotateCcw, Crosshair, Printer, Sparkles, Layers, Maximize2 } from 'lucide-react';
import { MemberNode, RelationshipLink, Branch } from '../types';
import { MemberCard } from './MemberCard';
import { CARD_WIDTH, CARD_HEIGHT } from '../initialData';
import { getAllDescendantIds, getGenerationTiers } from '../utils/treeUtils';

interface TreeCanvasProps {
  nodes: MemberNode[];
  links: RelationshipLink[];
  activeBranch: Branch | 'all';
  searchQuery: string;
  spotlightNodeId: string | null;
  activeSharedNodeId?: string | null;
  collapsedNodes: Set<string>;
  onSelectNode: (node: MemberNode) => void;
  onEditNode: (node: MemberNode) => void;
  onShareNode: (node: MemberNode, e: React.MouseEvent) => void;
  onAddRelative: (node: MemberNode, e: React.MouseEvent) => void;
  onToggleCollapse: (nodeId: string, e: React.MouseEvent) => void;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
  onDragFinish?: () => void;
  onPrintArchitecture?: () => void;
  onAutoArrange?: () => void;
  isAutoAligned?: boolean;
  autoFitTrigger?: number;
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
  onEditNode,
  onShareNode,
  onAddRelative,
  onToggleCollapse,
  onUpdateNodePosition,
  onDragFinish,
  onPrintArchitecture,
  onAutoArrange,
  isAutoAligned,
  autoFitTrigger
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 80, y: 100 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [showGenerationLines, setShowGenerationLines] = useState(true);
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

  // Compute complete active family cluster of the spotlight/shared node
  const activeClusterIds = useMemo(() => {
    if (!spotlightNodeId) return new Set<string>();
    const cluster = new Set<string>();
    cluster.add(spotlightNodeId);

    // 1. Spouses of spotlight
    links.forEach(l => {
      if (l.type === 'spouse') {
        if (l.source === spotlightNodeId) cluster.add(l.target);
        if (l.target === spotlightNodeId) cluster.add(l.source);
      }
    });

    // 2. Parents of spotlight
    links.forEach(l => {
      if (l.type === 'parent' && l.target === spotlightNodeId) {
        cluster.add(l.source);
        links.forEach(sl => {
          if (sl.type === 'spouse' && (sl.source === l.source || sl.target === l.source)) {
            cluster.add(sl.source === l.source ? sl.target : sl.source);
          }
        });
      }
    });

    // 3. Siblings of spotlight
    links.forEach(l => {
      if (l.type === 'sibling') {
        if (l.source === spotlightNodeId) cluster.add(l.target);
        if (l.target === spotlightNodeId) cluster.add(l.source);
      }
    });

    // 4. All descendants (children, grandchildren, etc.) and their spouses
    const queue = Array.from(cluster);
    while (queue.length > 0) {
      const current = queue.shift()!;
      links.forEach(l => {
        if (l.type === 'parent' && l.source === current) {
          if (!cluster.has(l.target)) {
            cluster.add(l.target);
            queue.push(l.target);
          }
        }
      });
      links.forEach(l => {
        if (l.type === 'spouse') {
          if (l.source === current && !cluster.has(l.target)) {
            cluster.add(l.target);
            queue.push(l.target);
          } else if (l.target === current && !cluster.has(l.source)) {
            cluster.add(l.source);
            queue.push(l.source);
          }
        }
      });
    }

    return cluster;
  }, [spotlightNodeId, links]);

  // Check spotlight dimming: members outside the active cluster are faded
  const isDimmed = useCallback((node: MemberNode): boolean => {
    if (!matchesSearch(node)) return true;
    if (!spotlightNodeId) return false;
    return !activeClusterIds.has(node.id);
  }, [spotlightNodeId, activeClusterIds, matchesSearch]);

  // Auto-center canvas on spotlight node when it changes
  useEffect(() => {
    if (spotlightNodeId && containerRef.current) {
      const target = nodes.find(n => n.id === spotlightNodeId);
      if (target) {
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;
        const targetX = target.x + CARD_WIDTH / 2;
        const targetY = target.y + CARD_HEIGHT / 2;
        setPan({
          x: containerW / 2 - targetX * zoom,
          y: containerH / 2 - targetY * zoom
        });
      }
    }
  }, [spotlightNodeId]);

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
    if (draggingNodeRef.current && onDragFinish) {
      onDragFinish();
    }
    draggingNodeRef.current = null;
  }, [onDragFinish]);

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
    if (draggingNodeRef.current && onDragFinish) {
      onDragFinish();
    }
    draggingNodeRef.current = null;
  }, [onDragFinish]);

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

  // Filter visible nodes & links
  const visibleNodes = useMemo(() => {
    return nodes.filter(n => isVisibleInBranch(n) && !isHiddenByCollapse(n.id));
  }, [nodes, isVisibleInBranch, isHiddenByCollapse]);

  const visibleNodeMap = useMemo(() => {
    return new Map(visibleNodes.map(n => [n.id, n]));
  }, [visibleNodes]);

  // Compute generation tiers with labels, line coordinates, and colors
  const generationTiers = useMemo(() => {
    return getGenerationTiers(visibleNodes, links);
  }, [visibleNodes, links]);

  // Auto-fit & auto-resize canvas to seamlessly display all generations on screen
  const fitToScreen = useCallback((padding = 70) => {
    if (visibleNodes.length === 0 || !containerRef.current) return;
    const minX = Math.min(...visibleNodes.map(n => n.x));
    const maxX = Math.max(...visibleNodes.map(n => n.x + CARD_WIDTH));
    const minY = Math.min(...visibleNodes.map(n => n.y));
    const maxY = Math.max(...visibleNodes.map(n => n.y + CARD_HEIGHT));

    // Account for generation labels placed above the cards
    const effectiveMinY = Math.max(0, minY - 44);
    const effectiveMinX = Math.max(0, minX - 44);

    const treeW = (maxX - effectiveMinX) + padding * 2;
    const treeH = (maxY - effectiveMinY) + padding * 2;
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;

    if (containerW <= 0 || containerH <= 0) return;

    const scale = Math.min(1.15, Math.max(0.28, Math.min(containerW / treeW, containerH / treeH)));
    const centerX = (effectiveMinX + maxX) / 2;
    const centerY = (effectiveMinY + maxY) / 2;

    setZoom(scale);
    setPan({
      x: Math.round(containerW / 2 - centerX * scale),
      y: Math.round(containerH / 2 - centerY * scale)
    });
  }, [visibleNodes]);

  // Auto-fit on initial canvas mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToScreen(70);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Auto-fit when autoFitTrigger changes (e.g. after Auto Arrange)
  useEffect(() => {
    if (autoFitTrigger) {
      const timer = setTimeout(() => {
        fitToScreen(70);
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [autoFitTrigger, fitToScreen]);

  const handleCanvasAutoArrange = () => {
    if (onAutoArrange) {
      onAutoArrange();
      setTimeout(() => {
        fitToScreen(70);
      }, 100);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className="flex-1 relative overflow-hidden canvas-bg w-full h-full cursor-grab active:cursor-grabbing select-none"
    >
      {/* Top Floating Quick Action Bar: Auto Arrange, Auto Resize, and Generation Lines */}
      <div className="absolute top-4 left-4 right-4 sm:right-auto flex flex-wrap items-center gap-2 z-20 pointer-events-auto">
        {onAutoArrange && (
          <button
            onClick={handleCanvasAutoArrange}
            title="Automatically arrange family members by generation with zero overlap, and auto-resize view to fit"
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 border border-amber-300/60 flex items-center gap-1.5 transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>Auto Arrange & Fit</span>
          </button>
        )}

        <button
          onClick={() => fitToScreen(70)}
          title="Auto-resize canvas zoom & center all generations to fit comfortably in view"
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs shadow-xl border border-slate-700/80 backdrop-blur-md flex items-center gap-1.5 transition active:scale-95"
        >
          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Auto Resize View</span>
        </button>

        <button
          onClick={() => setShowGenerationLines(!showGenerationLines)}
          title="Toggle generation divider guidelines and titles"
          className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xl border backdrop-blur-md flex items-center gap-1.5 transition active:scale-95 ${
            showGenerationLines
              ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50 hover:bg-indigo-900/80'
              : 'bg-slate-900/90 text-slate-400 border-slate-700/80 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>{showGenerationLines ? 'Generation Lines: On' : 'Generation Lines: Off'}</span>
        </button>

        {/* Dedicated Color Code Legend for Main Line vs Wife's Family Section */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-[11px] font-semibold backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-1.5 text-indigo-300">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-400/30" />
            <span className="font-bold">👑 Main Line</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-rose-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-400/30 animate-pulse" />
            <span className="font-bold">🌸 Wife's Family</span>
          </div>
        </div>

        {generationTiers.length > 0 && (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 font-semibold backdrop-blur-md">
            <span>🌿 {visibleNodes.length} Members</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">{generationTiers.length} Generations</span>
          </div>
        )}
      </div>

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
          {/* Generation Demarcation Lines with Dedicated Wife's Family Sections & Color Codes */}
          {showGenerationLines && generationTiers.map(tier => {
            return (
              <g key={`gen-tier-${tier.level}`} className="generation-guide pointer-events-none select-none">
                {/* Subtle Generation Baseline spanning across the tier */}
                <line
                  x1={tier.minX - 15}
                  y1={tier.lineY}
                  x2={tier.maxX + 15}
                  y2={tier.lineY}
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="4,6"
                  strokeOpacity="0.25"
                />

                {/* Render each Family Section Segment (Main Line vs Wife's Family Section) */}
                {tier.segments.map(seg => {
                  const segCards = seg.nodeIds.map(id => visibleNodeMap.get(id)).filter(Boolean) as MemberNode[];
                  const maxCardY = segCards.length > 0
                    ? Math.max(...segCards.map(c => c.y + CARD_HEIGHT))
                    : seg.lineY + CARD_HEIGHT + 40;
                  const laneHeight = Math.max(CARD_HEIGHT + 50, (maxCardY - seg.lineY) + 20);
                  const isWifeFamily = seg.branch === 'maternal';

                  return (
                    <g key={seg.id} className="branch-generation-segment">
                      {/* Soft Generation Lane Background Tint */}
                      <rect
                        x={seg.minX - 10}
                        y={seg.lineY - 4}
                        width={(seg.maxX - seg.minX) + 20}
                        height={laneHeight}
                        rx="16"
                        fill={seg.accentColor}
                        fillOpacity={isWifeFamily ? 0.038 : 0.024}
                        stroke={seg.accentColor}
                        strokeWidth={isWifeFamily ? 1.5 : 1}
                        strokeOpacity={isWifeFamily ? 0.22 : 0.12}
                        strokeDasharray={isWifeFamily ? '6,4' : '8,6'}
                      />

                      {/* Section Demarcation Guideline (All cards sit BELOW this line) */}
                      <line
                        x1={seg.minX}
                        y1={seg.lineY}
                        x2={seg.maxX}
                        y2={seg.lineY}
                        stroke={seg.accentColor}
                        strokeWidth={isWifeFamily ? 2.5 : 2}
                        strokeDasharray={isWifeFamily ? '6,4' : '8,5'}
                        strokeOpacity={isWifeFamily ? 0.85 : 0.75}
                      />

                      {/* Glowing End Nodes on the Guideline */}
                      <circle cx={seg.minX} cy={seg.lineY} r={isWifeFamily ? 4.5 : 4} fill={seg.accentColor} fillOpacity="0.95" />
                      <circle cx={seg.maxX} cy={seg.lineY} r={isWifeFamily ? 4.5 : 4} fill={seg.accentColor} fillOpacity="0.95" />

                      {/* Generation Header Ribbon / Badge */}
                      <foreignObject
                        x={seg.minX}
                        y={seg.lineY - 28}
                        width={Math.max(480, (seg.maxX - seg.minX) + 120)}
                        height={36}
                        className="overflow-visible pointer-events-none"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black shadow-xl backdrop-blur-md border transition ${
                              isWifeFamily
                                ? 'ring-2 ring-rose-500/30'
                                : 'ring-2 ring-indigo-500/20'
                            }`}
                            style={{
                              backgroundColor: seg.badgeBg,
                              borderColor: seg.badgeBorder,
                              color: seg.badgeText
                            }}
                          >
                            <span className="text-sm">{seg.branchIcon}</span>
                            <span
                              className={`tracking-wider uppercase font-black text-[10px] px-1.5 py-0.5 rounded ${
                                isWifeFamily
                                  ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                                  : 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                              }`}
                            >
                              {seg.branchLabel}
                            </span>
                            <span className="font-extrabold text-[11px] text-white">
                              {seg.title}
                            </span>
                            <span className="opacity-90 font-medium text-[11px]">
                              • {seg.subtitle}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono tracking-tight font-bold ${
                                isWifeFamily
                                  ? 'bg-rose-950/90 text-rose-200 border border-rose-500/40'
                                  : 'bg-slate-900/90 text-slate-200 border border-slate-700/50'
                              }`}
                            >
                              {seg.count} {seg.count === 1 ? 'member' : 'members'}
                            </span>
                          </div>
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Relationship Links */}
          {links.map(link => {
            const sourceNode = visibleNodeMap.get(link.source);
            const targetNode = visibleNodeMap.get(link.target);
            if (!sourceNode || !targetNode) return null;

            const isConnectedToCluster = Boolean(
              !spotlightNodeId || (activeClusterIds.has(link.source) && activeClusterIds.has(link.target))
            );
            const linkOpacity = spotlightNodeId ? (isConnectedToCluster ? 1 : 0.12) : 0.9;


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
                  onEdit={onEditNode}
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
          onClick={() => fitToScreen()}
          title="Fit All on Screen"
          className="w-10 h-10 rounded-xl hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center transition active:scale-95"
        >
          <Crosshair className="w-4 h-4 text-amber-400" />
        </button>
        {onPrintArchitecture && (
          <button
            onClick={onPrintArchitecture}
            title="Print Visual Tree Architecture As It Is"
            className="w-10 h-10 rounded-xl hover:bg-slate-800 text-indigo-400 hover:text-white font-bold text-sm flex items-center justify-center transition active:scale-95 border-t border-slate-700/60 pt-1"
          >
            <Printer className="w-4 h-4 text-indigo-300" />
          </button>
        )}
      </div>
    </div>
  );
};
