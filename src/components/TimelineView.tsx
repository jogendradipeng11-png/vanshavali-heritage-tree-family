import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ArrowUpDown, 
  Filter, 
  Target, 
  FileText, 
  Edit3, 
  Search, 
  Shield, 
  Sparkles, 
  Clock, 
  Users, 
  GitBranch,
  X,
  MapPin,
  Briefcase
} from 'lucide-react';
import { MemberNode, RelationshipLink, Branch, LivingStatus } from '../types';
import { buildTimelineItems, TimelineMemberItem } from '../utils/timelineUtils';
import { getRelativeSummary } from '../utils/treeUtils';
import { getDefaultSticker } from '../utils/stickerPresets';

interface TimelineViewProps {
  nodes: MemberNode[];
  links: RelationshipLink[];
  onSelectNode: (node: MemberNode) => void;
  onLocateOnTree: (node: MemberNode) => void;
  onEditNode: (node: MemberNode) => void;
  onClose?: () => void;
  isSideDrawer?: boolean;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  nodes,
  links,
  onSelectNode,
  onLocateOnTree,
  onEditNode,
  onClose,
  isSideDrawer = false
}) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [branchFilter, setBranchFilter] = useState<Branch | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<LivingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter nodes first
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      if (branchFilter !== 'all' && n.branch !== branchFilter) return false;
      if (statusFilter !== 'all' && n.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = (
          n.name.toLowerCase().includes(q) ||
          (n.gotra && n.gotra.toLowerCase().includes(q)) ||
          (n.bansa && n.bansa.toLowerCase().includes(q)) ||
          (n.relationship_to_root && n.relationship_to_root.toLowerCase().includes(q)) ||
          (n.profession && n.profession.toLowerCase().includes(q)) ||
          (n.address && n.address.toLowerCase().includes(q)) ||
          (n.dob && n.dob.includes(q))
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [nodes, branchFilter, statusFilter, searchQuery]);

  // Compute timeline items sorted by birth date
  const timelineItems = useMemo(() => {
    return buildTimelineItems(filteredNodes, sortOrder);
  }, [filteredNodes, sortOrder]);

  // Chronological summary statistics
  const stats = useMemo(() => {
    if (nodes.length === 0) return { earliest: null, latest: null, spanYears: 0 };
    const allItems = buildTimelineItems(nodes, 'asc');
    const earliest = allItems[0];
    const latest = allItems[allItems.length - 1];
    const spanYears = Math.max(0, latest.birthYear - earliest.birthYear);
    return { earliest, latest, spanYears };
  }, [nodes]);

  // Group items by era for visual chapter headers
  const groupedByEra = useMemo(() => {
    const groups: { era: string; items: TimelineMemberItem[] }[] = [];
    timelineItems.forEach(item => {
      const existing = groups.find(g => g.era === item.eraName);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ era: item.eraName, items: [item] });
      }
    });
    return groups;
  }, [timelineItems]);

  return (
    <div className={`flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden ${
      isSideDrawer ? 'border-l border-slate-800 shadow-2xl' : 'w-full'
    }`}>
      {/* Top Banner / Controls Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg shadow-sm">
              ⏳
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                Chronological Lineage Timeline
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {timelineItems.length} {timelineItems.length === 1 ? 'Relative' : 'Relatives'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Sorted chronologically by date of birth alongside ancestral branches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort order toggle button */}
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                {sortOrder === 'asc' ? 'Oldest First (Ancestors ⬆️)' : 'Newest First (Recent ⬇️)'}
              </span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
                title="Close timeline"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Timeline Quick Span Metrics */}
        {stats.earliest && stats.latest && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Earliest Ancestor</span>
              <span className="font-extrabold text-amber-300 truncate block">
                {stats.earliest.node.name} ({stats.earliest.birthYear})
              </span>
            </div>
            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Latest Scion</span>
              <span className="font-extrabold text-emerald-300 truncate block">
                {stats.latest.node.name} ({stats.latest.birthYear})
              </span>
            </div>
            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Lineage Span</span>
              <span className="font-extrabold text-indigo-300 truncate block">
                {stats.spanYears} Years Recorded
              </span>
            </div>
          </div>
        )}

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[140px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter timeline person, Gotra..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value as Branch | 'all')}
            className="bg-slate-900 text-indigo-300 font-semibold border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">All Branches</option>
            <option value="paternal">🧔 Main / Paternal Line</option>
            <option value="maternal">👩 Wife / In-Law Line</option>
          </select>

          {/* Living Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LivingStatus | 'all')}
            className="bg-slate-900 text-slate-300 font-semibold border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="alive">🌱 Living Only</option>
            <option value="deceased">🕊️ Deceased Ancestors</option>
          </select>
        </div>
      </div>

      {/* Vertical Timeline Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 relative">
        {timelineItems.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-bold text-slate-300 text-sm">No lineage members match these timeline filters.</p>
            <p className="text-xs text-slate-500">Try clearing the search query or changing branch filters.</p>
          </div>
        ) : (
          groupedByEra.map((group, groupIdx) => (
            <div key={group.era} className="space-y-4">
              {/* Era Section Header */}
              <div className="sticky top-0 z-10 flex items-center gap-3 py-1.5 bg-slate-900/95 backdrop-blur-md">
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-300 font-extrabold text-[11px] shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {group.era}
                </span>
                <div className="flex-1 border-t border-slate-800/80"></div>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {group.items.length} {group.items.length === 1 ? 'member' : 'members'}
                </span>
              </div>

              {/* Relative Items in Era */}
              <div className="relative pl-6 sm:pl-8 space-y-5">
                {/* Vertical Spine Line */}
                <div className="absolute left-2.5 sm:left-3.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-500 via-amber-500 to-emerald-500 opacity-40"></div>

                {group.items.map((item, idx) => {
                  const { node } = item;
                  const isDeceased = node.status === 'deceased';
                  const isMaternal = node.branch === 'maternal';
                  const isMarried = node.marital_status === 'married';
                  const rels = getRelativeSummary(node.id, nodes, links);

                  const stickerEmoji = node.sticker || (isDeceased ? '🕊️' : getDefaultSticker(node.gender, node.status, node.age, node.relationship_to_root));

                  const spineDotColor = isDeceased 
                    ? 'bg-slate-400 ring-slate-600' 
                    : (isMaternal ? 'bg-rose-500 ring-rose-400' : 'bg-indigo-400 ring-indigo-500');

                  return (
                    <div key={node.id} className="relative group">
                      {/* Spine Dot Indicator */}
                      <div className={`absolute -left-[22px] sm:-left-[26px] top-4 w-3.5 h-3.5 rounded-full ${spineDotColor} ring-4 ring-slate-900 z-10 transition-transform group-hover:scale-125 shadow-md`}></div>

                      {/* Timeline Card */}
                      <div className="bg-slate-800/90 hover:bg-slate-800 rounded-2xl border border-slate-700/80 p-4 shadow-xl transition-all duration-150 hover:border-indigo-500/50">
                        {/* Top Meta Line: Birth Date / Lifespan & Branch */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-700/60 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-extrabold text-[11px] border border-amber-500/30 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-amber-400" />
                              Born: {item.birthDisplay}
                            </span>
                            <span className="text-[11px] text-slate-400 font-semibold">
                              {item.lifespanDisplay}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              isMaternal 
                                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white' 
                                : 'bg-indigo-600 text-white'
                            }`}>
                              {isMaternal ? "Wife's Side" : 'Main Line'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              isDeceased ? 'bg-slate-700 text-slate-300' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                            }`}>
                              {isDeceased ? '🕊️ Deceased' : '🌱 Living'}
                            </span>
                          </div>
                        </div>

                        {/* Relative Details Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {/* Sticker / Photo Frame */}
                            <div className="relative w-10 h-10 shrink-0">
                              {node.photo_url ? (
                                <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white/80 shadow-md border border-slate-700 bg-slate-900 flex items-center justify-center">
                                  <img src={node.photo_url} alt={node.name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className={`w-10 h-10 rounded-xl ring-2 ring-white/60 shadow-md border border-slate-700 flex items-center justify-center text-xl ${
                                  isMaternal ? 'bg-rose-950/60' : 'bg-slate-900'
                                }`}>
                                  <span>{stickerEmoji}</span>
                                </div>
                              )}
                              <span className="absolute -bottom-1 -right-1 text-[8px] bg-slate-900 text-white rounded-full px-0.5 shadow border border-slate-700">
                                🏷️
                              </span>
                            </div>
                            <div>
                              <h3 
                                onClick={() => onSelectNode(node)}
                                className={`text-sm sm:text-base font-black text-white hover:text-indigo-400 cursor-pointer transition ${
                                  isDeceased ? 'text-slate-300 line-through decoration-slate-500' : ''
                                }`}
                              >
                                {node.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold text-indigo-400">
                                  {node.relationship_to_root}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full border ${
                                  isMarried ? 'text-rose-300 border-rose-800 bg-rose-950/40' : 'text-slate-400 border-slate-700'
                                }`}>
                                  {isMarried ? '💍 Married' : 'Single'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => onLocateOnTree(node)}
                              title="Highlight & zoom to this member on the tree canvas"
                              className="px-2.5 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm active:scale-95"
                            >
                              <Target className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Locate on Tree</span>
                            </button>

                            <button
                              onClick={() => onSelectNode(node)}
                              title="View full relative dossier"
                              className="p-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                            >
                              <FileText className="w-4 h-4 text-indigo-300" />
                            </button>

                            <button
                              onClick={() => onEditNode(node)}
                              title="Edit details"
                              className="p-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                            >
                              <Edit3 className="w-4 h-4 text-amber-300" />
                            </button>
                          </div>
                        </div>

                        {/* Attributes: Gotra, Bansa, Vitals */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-700/50 text-[11px]">
                          <div>
                            <span className="text-slate-400 font-semibold block text-[10px]">Gotra</span>
                            <span className="font-bold text-slate-200">{node.gotra || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block text-[10px]">Bansa</span>
                            <span className="font-bold text-slate-200">{node.bansa || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block text-[10px]">Profession</span>
                            <span className="font-bold text-slate-200 truncate block">{node.profession || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block text-[10px]">Homeland / City</span>
                            <span className="font-bold text-slate-200 truncate block">{node.address || '-'}</span>
                          </div>
                        </div>

                        {/* Connections Ribbon */}
                        <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
                          {rels.parents.length > 0 && (
                            <div>
                              <span className="font-bold text-slate-300">Parents: </span>
                              <span className="text-indigo-300">{rels.parentNames}</span>
                            </div>
                          )}
                          {rels.spouses.length > 0 && (
                            <div>
                              <span className="font-bold text-slate-300">Spouse: </span>
                              <span className="text-rose-300">{rels.spouseNames}</span>
                            </div>
                          )}
                          {rels.children.length > 0 && (
                            <div>
                              <span className="font-bold text-slate-300">Children: </span>
                              <span className="text-emerald-300">{rels.childrenNames}</span>
                            </div>
                          )}
                        </div>

                        {/* Lore Notes Snippet */}
                        {node.notes && (
                          <p className="mt-2 text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                            "{node.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
