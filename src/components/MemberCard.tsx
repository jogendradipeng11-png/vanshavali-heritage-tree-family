import React from 'react';
import { Share2, UserPlus, Heart, Briefcase, Calendar, MapPin } from 'lucide-react';
import { MemberNode } from '../types';

interface MemberCardProps {
  node: MemberNode;
  isSpotlight: boolean;
  isDimmed: boolean;
  isCollapsed: boolean;
  descendantCount: number;
  isSharedOwner?: boolean;
  onSelect: (node: MemberNode) => void;
  onShare: (node: MemberNode, e: React.MouseEvent) => void;
  onAddRelative: (node: MemberNode, e: React.MouseEvent) => void;
  onToggleCollapse: (nodeId: string, e: React.MouseEvent) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  node,
  isSpotlight,
  isDimmed,
  isCollapsed,
  descendantCount,
  isSharedOwner = false,
  onSelect,
  onShare,
  onAddRelative,
  onToggleCollapse
}) => {
  const isDeceased = node.status === 'deceased';
  const isMaternal = node.branch === 'maternal';
  const isMarried = node.marital_status === 'married';

  // Distinct styling based on role & status
  let cardBorder = 'border-indigo-400/90 bg-gradient-to-b from-indigo-50/40 via-white to-white';
  if (isSharedOwner) {
    cardBorder = 'border-amber-400 bg-gradient-to-b from-amber-50 via-white to-white';
  } else if (isDeceased) {
    cardBorder = 'border-slate-300 bg-slate-50/95';
  } else if (isMaternal) {
    cardBorder = 'border-amber-400 bg-gradient-to-b from-amber-50/50 via-white to-white';
  } else if (node.gender === 'female') {
    cardBorder = 'border-pink-400 bg-gradient-to-b from-pink-50/40 via-white to-white';
  }

  const spotlightRing = isSharedOwner
    ? 'ring-4 ring-amber-400 ring-offset-4 ring-offset-slate-900 z-40 shadow-2xl scale-[1.02]'
    : isSpotlight 
    ? 'spotlight-active ring-4 ring-amber-400 ring-offset-4 ring-offset-slate-900 z-30' 
    : '';

  const avatarIcon = isDeceased 
    ? '🕊️' 
    : (node.gender === 'female' ? '👩' : (node.age && node.age < 16 ? '👦' : '👨'));

  return (
    <div
      onClick={() => onSelect(node)}
      style={{ opacity: isDimmed ? 0.20 : 1 }}
      className={`h-full w-full tree-card border-2 ${cardBorder} ${spotlightRing} p-3 flex flex-col justify-between select-none cursor-pointer transition-all duration-150`}
    >
      {/* Top Header: Badges & Controls */}
      <div>
        {/* If Shared Node Owner: Show prominent gold badge */}
        {isSharedOwner && (
          <div className="mb-1.5 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider flex items-center justify-between shadow-xs">
            <span>👑 Your Active Node</span>
            <span>Edit & Add Active</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-1 mb-1.5">
          {/* Branch Badge */}
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
            isMaternal 
              ? 'bg-amber-500 text-slate-950' 
              : 'bg-indigo-600 text-white'
          }`}>
            {isMaternal ? "Wife's Side" : 'Main Line'}
          </span>

          <div className="flex items-center gap-1">
            {/* Fold / Unfold Button if has descendants */}
            {descendantCount > 0 && (
              <button
                type="button"
                onClick={(e) => onToggleCollapse(node.id, e)}
                title={isCollapsed ? "Expand descendants" : "Fold descendants"}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition flex items-center gap-0.5 ${
                  isCollapsed ? 'bg-amber-400 text-slate-950' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {isCollapsed ? `➕ Show (${descendantCount})` : '➖ Fold'}
              </button>
            )}

            {/* Living Status */}
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              isDeceased 
                ? 'bg-slate-200 text-slate-700 border border-slate-300' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
            }`}>
              {isDeceased ? '🕊️ Deceased' : '🌱 Living'}
            </span>
          </div>
        </div>

        {/* Member Name & Relationship */}
        <div className="flex items-start gap-2 pt-0.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-sm shrink-0 shadow-xs">
            {avatarIcon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-black text-slate-950 text-[13px] leading-tight tracking-tight truncate ${
              isDeceased ? 'text-slate-600 line-through decoration-slate-400' : ''
            }`}>
              {node.name}
            </h3>
            <div className="flex items-center justify-between gap-1 mt-0.5">
              <span className="text-[11px] font-extrabold text-indigo-700 tracking-wide truncate">
                {node.relationship_to_root}
              </span>
              <span className={`shrink-0 px-1.5 py-0.2 rounded-full text-[9px] font-medium border flex items-center gap-0.5 ${
                isMarried 
                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {isMarried ? '💍 Married' : 'Single'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Attributes: Gotra, Bansa, Vitals */}
      <div className="text-[10px] space-y-1 py-1.5 px-2 bg-slate-50/90 rounded-xl border border-slate-200/70 my-1">
        <div className="flex items-center justify-between font-semibold text-slate-800">
          <span className="truncate">
            <span className="text-slate-500 font-bold">Gotra:</span> {node.gotra || '-'}
          </span>
          <span className="truncate ml-1 text-right">
            <span className="text-slate-500 font-bold">Bansa:</span> {node.bansa || '-'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium pt-0.5 border-t border-slate-200/50">
          <span className="font-bold text-slate-700">
            {node.age != null ? (isDeceased ? `Passed at ${node.age}y` : `Age: ${node.age}y`) : 'Age: -'}
          </span>
          <span className="truncate ml-1 font-semibold text-slate-800">
            {node.profession || ''}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-0.5 flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={(e) => onShare(node, e)}
          className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] transition flex items-center justify-center gap-1 shadow-xs"
        >
          <Share2 className="w-3 h-3" />
          <span>Share</span>
        </button>

        <button
          type="button"
          onClick={(e) => onAddRelative(node, e)}
          className="flex-1 py-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[10px] transition flex items-center justify-center gap-1 shadow-xs"
        >
          <UserPlus className="w-3 h-3" />
          <span>+ Relative</span>
        </button>
      </div>
    </div>
  );
};
