import React, { useState, useRef, useEffect } from 'react';
import { 
  GitBranch, 
  Search, 
  Sparkles, 
  Share2, 
  Download, 
  UserPlus, 
  FileText, 
  Table, 
  Printer, 
  BarChart3, 
  UserCheck, 
  ShieldCheck,
  ChevronDown,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { Branch } from '../types';

export type ViewMode = 'tree' | 'sheet' | 'timeline' | 'split';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  activeBranch: Branch | 'all';
  onBranchChange: (branch: Branch | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAutoArrange: () => void;
  onOpenAddModal: () => void;
  onShareTree: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onExportWord: () => void;
  onPrint: () => void;
  onOpenInsights: () => void;
  onOpenAuth: () => void;
  userName: string;
  isOnline?: boolean;
  isSyncing?: boolean;
  lastSyncTime?: string | null;
  hasPermissionError?: boolean;
  onOpenSyncModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  activeBranch,
  onBranchChange,
  searchQuery,
  onSearchChange,
  onAutoArrange,
  onOpenAddModal,
  onShareTree,
  onExportPDF,
  onExportExcel,
  onExportWord,
  onPrint,
  onOpenInsights,
  onOpenAuth,
  userName,
  isOnline = true,
  isSyncing = false,
  lastSyncTime = null,
  hasPermissionError = false,
  onOpenSyncModal
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-lg z-30 flex-wrap gap-2.5">
      {/* Brand & Lineage Info */}
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-500/30">
          🌿
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              Vanshavali Heritage Tree
            </h1>
            <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              Verified Lineage
            </span>

            {/* Real-time Cloud Online Sync Status */}
            <button 
              type="button"
              onClick={onOpenSyncModal}
              className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm transition cursor-pointer hover:brightness-110 active:scale-95 ${
                hasPermissionError
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                  : isSyncing
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : isOnline
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={
                hasPermissionError
                  ? 'Firebase Realtime Database Permission Denied: Click to view setup guide and fix rules.'
                  : isSyncing 
                  ? 'Synchronizing live to Firebase Realtime Database... Click for details.' 
                  : isOnline 
                  ? `Cloud Online & Synchronized${lastSyncTime ? ` (${lastSyncTime})` : ''}. Click for details.` 
                  : 'Offline / Connecting to Cloud... Click for details.'
              }
            >
              <span className={`w-2 h-2 rounded-full ${
                hasPermissionError
                  ? 'bg-rose-500 animate-ping'
                  : isSyncing 
                  ? 'bg-amber-400 animate-ping' 
                  : isOnline 
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse' 
                  : 'bg-slate-500'
              }`} />
              <span>
                {hasPermissionError ? 'Sync Alert (Rules)' : isSyncing ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
              </span>
              {isOnline && !isSyncing && !hasPermissionError && lastSyncTime && (
                <span className="text-[9px] text-emerald-400/70 hidden lg:inline">
                  • {lastSyncTime}
                </span>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">Ancestral Lineage, Gotra & In-Law Heritage Archive</p>
        </div>
      </div>

      {/* View Switcher: Tree vs Timeline vs Split */}
      <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
        <button
          onClick={() => onViewModeChange('tree')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
            viewMode === 'tree'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Full Tree Graph Canvas"
        >
          <span>🌳</span>
          <span className="hidden md:inline">Tree Graph</span>
        </button>

        <button
          onClick={() => onViewModeChange('sheet')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
            viewMode === 'sheet'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Master Heritage Register Sheet"
        >
          <Table className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Sheet Register</span>
        </button>

        <button
          onClick={() => onViewModeChange('timeline')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
            viewMode === 'timeline'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Chronological Timeline View"
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Timeline</span>
        </button>

        <button
          onClick={() => onViewModeChange('split')}
          className={`hidden lg:flex px-3 py-1.5 rounded-lg text-xs font-bold items-center gap-1.5 transition ${
            viewMode === 'split'
              ? 'bg-slate-700 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Side-by-side Tree Canvas & Timeline"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Split View</span>
        </button>
      </div>

      {/* Center Controls: Branch Filter & Search */}
      <div className="flex items-center gap-2 flex-1 max-w-md justify-center sm:justify-start">
        {/* Branch Filter */}
        <div className="flex items-center space-x-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-slate-700/80 text-xs shrink-0">
          <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400 font-medium hidden md:inline">Branch:</span>
          <select 
            value={activeBranch} 
            onChange={(e) => onBranchChange(e.target.value as Branch | 'all')}
            aria-label="Filter branch view"
            className="bg-transparent text-indigo-300 font-bold focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-800 text-white">🌐 All Lines</option>
            <option value="paternal" className="bg-slate-800 text-white">🧔 Main Line</option>
            <option value="maternal" className="bg-slate-800 text-white">👩 In-Law Line</option>
          </select>
        </div>

        {/* Live Search */}
        <div className="relative w-32 sm:w-48">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search person..."
            aria-label="Search members"
            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="hidden sm:flex items-center space-x-2">
        {/* Insights / Stats */}
        <button 
          onClick={onOpenInsights}
          title="Lineage statistics & Gotra overview"
          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
        >
          <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">Insights</span>
        </button>

        {/* Auto Align */}
        <button 
          onClick={onAutoArrange}
          title="Auto arrange generational layout"
          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span className="hidden lg:inline">Align Generations</span>
        </button>

        {/* Share Link */}
        <button 
          onClick={onShareTree}
          title="Share lineage link"
          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-sm"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setExportOpen(!exportOpen)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {exportOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-xs py-1 animate-in fade-in duration-100">
              <button 
                onClick={() => { setExportOpen(false); onExportPDF(); }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2.5 border-b border-slate-100"
              >
                <FileText className="w-4 h-4 text-rose-500" />
                <span>Lineage Register PDF</span>
              </button>
              <button 
                onClick={() => { setExportOpen(false); onExportExcel(); }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2.5 border-b border-slate-100"
              >
                <Table className="w-4 h-4 text-emerald-600" />
                <span>Export to Excel (.xlsx)</span>
              </button>
              <button 
                onClick={() => { setExportOpen(false); onExportWord(); }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2.5 border-b border-slate-100"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Export to Word (.doc)</span>
              </button>
              <button 
                onClick={() => { setExportOpen(false); onPrint(); }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2.5"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Register View</span>
              </button>
            </div>
          )}
        </div>

        {/* User Account / Profile */}
        <button 
          onClick={onOpenAuth}
          title="Tree Custodian Profile"
          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span className="max-w-[80px] truncate">{userName || 'Custodian'}</span>
        </button>

        {/* Add Member Button */}
        <button 
          onClick={onOpenAddModal}
          className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Member</span>
        </button>
      </div>
    </header>
  );
};
