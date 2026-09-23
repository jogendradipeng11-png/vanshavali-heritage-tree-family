import React from 'react';
import { UserPlus, Sparkles, Share2, Download, BarChart3, Clock } from 'lucide-react';
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
        onClick={() => onViewModeChange(viewMode === 'timeline' ? 'tree' : 'timeline')}
        className={`flex flex-col items-center justify-center text-[10px] font-bold ${
          viewMode === 'timeline' ? 'text-amber-400' : 'text-indigo-400'
        }`}
      >
        {viewMode === 'timeline' ? (
          <>
            <span className="text-lg">🌳</span>
            <span>Tree</span>
          </>
        ) : (
          <>
            <Clock className="w-5 h-5 mb-0.5" />
            <span>Timeline</span>
          </>
        )}
      </button>

      <button
        onClick={onOpenAddModal}
        className="flex flex-col items-center justify-center text-[10px] text-slate-300 font-medium"
      >
        <UserPlus className="w-5 h-5 mb-0.5 text-indigo-400" />
        <span>Add</span>
      </button>

      <button
        onClick={onAutoArrange}
        className="flex flex-col items-center justify-center text-[10px] text-slate-300 font-medium"
      >
        <Sparkles className="w-5 h-5 mb-0.5 text-yellow-400" />
        <span>Align</span>
      </button>

      <button
        onClick={onShareTree}
        className="flex flex-col items-center justify-center text-[10px] text-emerald-400 font-medium"
      >
        <Share2 className="w-5 h-5 mb-0.5" />
        <span>Share</span>
      </button>

      <button
        onClick={onOpenInsights}
        className="flex flex-col items-center justify-center text-[10px] text-amber-400 font-medium"
      >
        <BarChart3 className="w-5 h-5 mb-0.5" />
        <span>Insights</span>
      </button>
    </nav>
  );
};

