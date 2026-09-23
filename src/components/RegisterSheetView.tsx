import React, { useState, useMemo } from 'react';
import { 
  Table, 
  Search, 
  UserPlus, 
  Edit3, 
  Share2, 
  Target, 
  GitBranch, 
  Phone, 
  MapPin, 
  Heart, 
  Filter, 
  ArrowUpDown, 
  Sparkles,
  Download,
  Calendar
} from 'lucide-react';
import { MemberNode, RelationshipLink, Branch, LivingStatus } from '../types';
import { getRelativeSummary } from '../utils/treeUtils';
import { getDefaultSticker } from '../utils/stickerPresets';

interface RegisterSheetViewProps {
  nodes: MemberNode[];
  links: RelationshipLink[];
  activeBranch?: Branch | 'all';
  searchQuery?: string;
  spotlightNodeId?: string | null;
  activeSharedNodeId?: string | null;
  onSelectNode: (node: MemberNode) => void;
  onEditNode: (node: MemberNode) => void;
  onShareNode: (node: MemberNode, e: React.MouseEvent) => void;
  onAddRelative: (node: MemberNode, e: React.MouseEvent) => void;
  onDeleteNode?: (nodeId: string) => void;
  onOpenAddModal?: () => void;
  onLocateOnTree?: (node: MemberNode) => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
}

export const RegisterSheetView: React.FC<RegisterSheetViewProps> = ({
  nodes,
  links,
  activeBranch = 'all',
  searchQuery: initialSearch = '',
  spotlightNodeId,
  activeSharedNodeId,
  onSelectNode,
  onEditNode,
  onShareNode,
  onAddRelative,
  onDeleteNode,
  onOpenAddModal,
  onLocateOnTree,
  onExportExcel,
  onExportPDF
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [branchFilter, setBranchFilter] = useState<Branch | 'all'>(activeBranch);
  const [statusFilter, setStatusFilter] = useState<LivingStatus | 'all'>('all');
  const [sortField, setSortField] = useState<'name' | 'branch' | 'dob' | 'gotra'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      if (branchFilter !== 'all' && node.branch !== branchFilter) return false;
      if (statusFilter !== 'all' && node.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = (
          node.name.toLowerCase().includes(q) ||
          (node.gotra && node.gotra.toLowerCase().includes(q)) ||
          (node.bansa && node.bansa.toLowerCase().includes(q)) ||
          (node.relationship_to_root && node.relationship_to_root.toLowerCase().includes(q)) ||
          (node.profession && node.profession.toLowerCase().includes(q)) ||
          (node.phone && node.phone.toLowerCase().includes(q)) ||
          (node.address && node.address.toLowerCase().includes(q))
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [nodes, branchFilter, statusFilter, searchQuery]);

  // Sort nodes
  const sortedNodes = useMemo(() => {
    return [...filteredNodes].sort((a, b) => {
      let comp = 0;
      if (sortField === 'name') {
        comp = a.name.localeCompare(b.name);
      } else if (sortField === 'branch') {
        comp = a.branch.localeCompare(b.branch);
      } else if (sortField === 'gotra') {
        comp = (a.gotra || '').localeCompare(b.gotra || '');
      } else if (sortField === 'dob') {
        const da = a.dob ? new Date(a.dob).getTime() : 0;
        const db = b.dob ? new Date(b.dob).getTime() : 0;
        comp = da - db;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredNodes, sortField, sortOrder]);

  const toggleSort = (field: 'name' | 'branch' | 'dob' | 'gotra') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Banner / Toolbar */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 shrink-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg border border-indigo-500/30 shadow-sm">
              📋
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                Ancestral Heritage Sheet & Register
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {sortedNodes.length} / {nodes.length} Listed
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Master family spreadsheet with lineage relations, Gotra, contact, and live synchronization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-indigo-600/30 active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add New Relative</span>
            </button>
          </div>
        </div>

        {/* Filters and search bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, Gotra, phone, address..."
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value as Branch | 'all')}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="all">🌐 All Branches</option>
              <option value="paternal">🧔 Main / Paternal Line</option>
              <option value="maternal">👩 In-Law / Wife Line</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LivingStatus | 'all')}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="all">🌱 All Status</option>
              <option value="alive">Living Members</option>
              <option value="deceased">🕊️ Deceased Elders</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[10px] font-bold sticky top-0 z-10 border-b border-slate-800 backdrop-blur-md">
            <tr>
              <th className="py-3 px-4">#</th>
              <th 
                onClick={() => toggleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1">
                  <span>Relative / Member</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4">Relationship</th>
              <th 
                onClick={() => toggleSort('gotra')}
                className="py-3 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1">
                  <span>Gotra & Bansa</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                onClick={() => toggleSort('branch')}
                className="py-3 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1">
                  <span>Lineage Side</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                onClick={() => toggleSort('dob')}
                className="py-3 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1">
                  <span>DOB / Age</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4">Contact & Location</th>
              <th className="py-3 px-4 text-center">Family Links</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {sortedNodes.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="text-sm font-bold text-slate-300">No relatives match the current filter</p>
                    <p className="text-[11px] text-slate-500">Try changing branch filters or clearing the search bar.</p>
                    <button
                      onClick={onOpenAddModal}
                      className="mt-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs"
                    >
                      + Add Family Member
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sortedNodes.map((node, index) => {
                const summary = getRelativeSummary(node.id, nodes, links);
                const isShared = node.id === activeSharedNodeId;

                return (
                  <tr 
                    key={node.id} 
                    className={`hover:bg-slate-800/50 transition group ${
                      isShared ? 'bg-amber-500/10 border-l-4 border-amber-500' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {index + 1}
                    </td>

                    {/* Member Name & Status */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-8 h-8 shrink-0">
                          {node.photo_url ? (
                            <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-white/60 shadow-xs border border-slate-700 bg-slate-900 flex items-center justify-center">
                              <img src={node.photo_url} alt={node.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className={`w-8 h-8 rounded-lg ring-1 ring-white/40 shadow-xs border border-slate-700 flex items-center justify-center text-base ${
                              node.branch === 'maternal' ? 'bg-rose-950/60' : 'bg-slate-900'
                            }`}>
                              <span>{node.sticker || (node.status === 'deceased' ? '🕊️' : getDefaultSticker(node.gender, node.status, node.age, node.relationship_to_root))}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span 
                              onClick={() => onSelectNode(node)}
                              className="font-bold text-white hover:text-indigo-400 transition cursor-pointer text-sm"
                            >
                              {node.name}
                            </span>
                            {isShared && (
                              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[9px] rounded-md tracking-wider">
                                👑 ACTIVE
                              </span>
                            )}
                            {node.status === 'deceased' && (
                              <span className="text-[10px] text-slate-400 font-medium" title="Deceased">
                                🕊️
                              </span>
                            )}
                          </div>
                          {node.profession && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                              {node.profession}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Relationship */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-indigo-300">
                        {node.relationship_to_root || 'Family Member'}
                      </span>
                    </td>

                    {/* Gotra & Bansa */}
                    <td className="py-3 px-4">
                      {node.gotra || node.bansa ? (
                        <div className="space-y-0.5">
                          {node.gotra && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md font-bold text-[10px] inline-block">
                              🕉️ {node.gotra}
                            </span>
                          )}
                          {node.bansa && (
                            <span className="text-[10px] text-slate-400 block">
                              Bansa: {node.bansa}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[10px] italic">—</span>
                      )}
                    </td>

                    {/* Branch */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                        node.branch === 'paternal'
                          ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                          : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                      }`}>
                        {node.branch === 'paternal' ? '🧔 Main / Paternal' : '👩 Wife / In-Law'}
                      </span>
                    </td>

                    {/* DOB & Age */}
                    <td className="py-3 px-4">
                      <div className="text-slate-300 text-[11px] font-medium">
                        {node.dob ? (
                          <span>{node.dob}</span>
                        ) : node.age ? (
                          <span className="text-slate-400">Age: {node.age}y</span>
                        ) : (
                          <span className="text-slate-500 italic">Not set</span>
                        )}
                        {node.age != null && node.dob && (
                          <span className="text-slate-400 text-[10px] block">({node.age} yrs)</span>
                        )}
                      </div>
                    </td>

                    {/* Contact & Village */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 max-w-[160px]">
                        {node.phone ? (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span className="truncate">{node.phone}</span>
                          </div>
                        ) : null}
                        {node.address ? (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                            <span className="truncate">{node.address}</span>
                          </div>
                        ) : null}
                        {!node.phone && !node.address && (
                          <span className="text-slate-600 text-[10px] italic">—</span>
                        )}
                      </div>
                    </td>

                    {/* Connected Family */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2 text-[10px] text-slate-300 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60">
                        {summary.children.length > 0 && (
                          <span title={`${summary.children.length} Children`}>
                            👶 {summary.children.length}
                          </span>
                        )}
                        {summary.spouses.length > 0 && (
                          <span title={`${summary.spouses.length} Spouse(s)`}>
                            💍 {summary.spouses.length}
                          </span>
                        )}
                        {summary.parents.length > 0 && (
                          <span title={`${summary.parents.length} Parent(s)`}>
                            ⬆️ {summary.parents.length}
                          </span>
                        )}
                        {summary.children.length === 0 && summary.spouses.length === 0 && summary.parents.length === 0 && (
                          <span className="text-slate-500 italic">Root / Solo</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditNode(node);
                          }}
                          title="Edit details"
                          className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddRelative(node, e);
                          }}
                          title="Add child, spouse, or parent"
                          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLocateOnTree?.(node);
                          }}
                          title="View on Heritage Tree Canvas"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          <Target className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onShareNode(node, e);
                          }}
                          title="Share lineage record"
                          className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 transition"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
