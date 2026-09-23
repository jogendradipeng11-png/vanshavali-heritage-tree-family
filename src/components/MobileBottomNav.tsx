import React from 'react';
import { UserPlus, Sparkles, Share2, Download, BarChart3, Clock, Table } from 'lucide-react';
import { ViewMode } from './Header';

interface MobileBottomNavProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAddModal: () => void;
  onAutoArrange: () => void;
  onShareTree: () => void;
  onExportPDF: () => void;
  onOpenInsights: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  viewMode,
  onViewModeChange,
  onOpenAddModal,
  onAutoArrange,
  onShareTree,
  onExportPDF,
  onOpenInsights
}) => {
  return (
    <nav className="sm:hidden bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 py-2 text-white z-30 shrink-0">
      <button
        onClick={() => onViewModeChange('tree')}
        className={`flex flex-col items-center justify-center text-[10px] font-bold ${
          viewMode === 'tree' ? 'text-indigo-400' : 'text-slate-400'
        }`}
      >
        <span className="text-base">🌳</span>
        <span>Tree</span>
      </button>

      <button
        onClick={() => onViewModeChange('sheet')}
        className={`flex flex-col items-center justify-center text-[10px] font-bold ${
          viewMode === 'sheet' ? 'text-emerald-400' : 'text-slate-400'
        }`}
      >
        <Table className="w-4 h-4 mb-0.5" />
        <span>Sheet</span>
      </button>

      <button
        onClick={() => onViewModeChange('timeline')}
        className={`flex flex-col items-center justify-center text-[10px] font-bold ${
          viewMode === 'timeline' ? 'text-amber-400' : 'text-slate-400'
        }`}
      >
        <Clock className="w-4 h-4 mb-0.5" />
        <span>Timeline</span>
      </button>

      <button
        onClick={onOpenAddModal}
        className="flex flex-col items-center justify-center text-[10px] text-slate-200 font-bold"
      >
        <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
          <UserPlus className="w-4 h-4 text-white" />
        </div>
        <span className="mt-0.5">Add</span>
      </button>

      <button
        onClick={onShareTree}
        className="flex flex-col items-center justify-center text-[10px] text-slate-400 font-medium hover:text-emerald-400"
      >
        <Share2 className="w-4 h-4 mb-0.5" />
        <span>Share</span>
      </button>
    </nav>
  );
};


