import React from 'react';
import { Target, X, Crown, Sparkles } from 'lucide-react';
import { MemberNode } from '../types';

interface SpotlightBannerProps {
  spotlightNode: MemberNode | null;
  onClear: () => void;
  isSharedOwnerMode?: boolean;
}

export const SpotlightBanner: React.FC<SpotlightBannerProps> = ({
  spotlightNode,
  onClear,
  isSharedOwnerMode = false
}) => {
  if (!spotlightNode) return null;

  return (
    <div className={`px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md z-20 transition-all shrink-0 ${
      isSharedOwnerMode 
        ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 border-b border-amber-600' 
        : 'bg-amber-500 text-slate-950'
    }`}>
      <div className="flex items-center gap-2 truncate">
        {isSharedOwnerMode ? (
          <Crown className="w-4 h-4 text-slate-950 shrink-0 animate-bounce" />
        ) : (
          <Target className="w-4 h-4 text-slate-950 shrink-0" />
        )}
        <span className="truncate">
          {isSharedOwnerMode ? (
            <>
              <b>Shared Owner Access:</b> You are active on <b>{spotlightNode.name}</b> ({spotlightNode.relationship_to_root || 'Family'}). You can view, add relatives & edit your branch. Other branches are faded.
            </>
          ) : (
            <>
              Focused on <b>{spotlightNode.name}</b> ({spotlightNode.relationship_to_root}). Non-connected relatives are dimmed.
            </>
          )}
        </span>
      </div>
      <button
        onClick={onClear}
        className="px-2.5 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-bold text-[11px] shrink-0 ml-2 transition flex items-center gap-1 shadow-sm active:scale-95"
      >
        <X className="w-3.5 h-3.5" />
        <span>{isSharedOwnerMode ? 'View Full Master Tree' : 'Show All'}</span>
      </button>
    </div>
  );
};
