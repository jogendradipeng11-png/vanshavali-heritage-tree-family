import React from 'react';
import { Share2, UserPlus, Heart, Briefcase, Calendar, MapPin, Edit3, Camera } from 'lucide-react';
import { MemberNode } from '../types';
import { getDefaultSticker } from '../utils/stickerPresets';

interface MemberCardProps {
  node: MemberNode;
  isSpotlight: boolean;
  isDimmed: boolean;
  isCollapsed: boolean;
  descendantCount: number;
  isSharedOwner?: boolean;
  onSelect: (node: MemberNode) => void;
  onEdit: (node: MemberNode, e: React.MouseEvent) => void;
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
  onEdit,
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
    cardBorder = isMaternal ? 'border-rose-300/80 bg-rose-50/25' : 'border-slate-300 bg-slate-50/95';
  } else if (isMaternal) {
    cardBorder = 'border-rose-400/90 bg-gradient-to-b from-rose-50/45 via-white to-white shadow-xs';
  } else if (node.gender === 'female') {
    cardBorder = 'border-pink-400 bg-gradient-to-b from-pink-50/40 via-white to-white';
  }

  const spotlightRing = isSharedOwner
    ? 'ring-4 ring-amber-400 ring-offset-4 ring-offset-slate-900 z-40 shadow-2xl scale-[1.02]'
    : isSpotlight 
    ? 'spotlight-active ring-4 ring-amber-400 ring-offset-4 ring-offset-slate-900 z-30' 
    : '';

  const stickerEmoji = node.sticker || (isDeceased ? '🕊️' : getDefaultSticker(node.gender, node.status, node.age, node.relationship_to_root));

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
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node, e);
            }}
            className="mb-1.5 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-[9px] uppercase tracking-wider flex items-center justify-between shadow-xs cursor-pointer border border-amber-600/30"
            title="Click to edit your node"
          >
            <span>👑 Your Active Node</span>
            <span className="flex items-center gap-0.5 underline">
              <Edit3 className="w-2.5 h-2.5" />
              Edit
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-1 mb-1.5">
          {/* Branch Badge */}
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
            isMaternal 
              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xs' 
              : 'bg-indigo-600 text-white shadow-xs'
          }`}>
            <span>{isMaternal ? '🌸' : '👑'}</span>
            <span>{isMaternal ? "Wife's Side" : 'Main Line'}</span>
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

        {/* Member Name & Relationship with Sticker / Picture Portrait */}
        <div className="flex items-start gap-2 pt-0.5">
          {/* Sticker / Photo Portrait Frame */}
          <div 
            className="relative w-9 h-9 shrink-0 group/sticker"
            title={node.photo_url ? `Photo of ${node.name}` : `Sticker portrait of ${node.name}`}
          >
            {node.photo_url ? (
              <div className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-white shadow-md border border-slate-300 bg-slate-100 flex items-center justify-center transform transition-transform group-hover/sticker:scale-105">
                <img 
                  src={node.photo_url} 
                  alt={node.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={`w-9 h-9 rounded-xl ring-2 ring-white shadow-md border border-slate-200 flex items-center justify-center text-lg transform transition-transform group-hover/sticker:scale-110 group-hover/sticker:rotate-[-3deg] ${
                isMaternal 
                  ? 'bg-gradient-to-tr from-rose-100 via-pink-50 to-amber-50' 
                  : 'bg-gradient-to-tr from-indigo-100 via-sky-50 to-amber-50'
              }`}>
                <span>{stickerEmoji}</span>
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 text-[8px] bg-white rounded-full px-0.5 shadow-xs border border-slate-200">
              🏷️
            </span>
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
      <div className="pt-0.5 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(node, e);
          }}
          title="Edit relative details"
          className="flex-1 py-1 px-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[10px] transition flex items-center justify-center gap-1 shadow-xs active:scale-95"
        >
          <Edit3 className="w-3 h-3 text-slate-950" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={(e) => onAddRelative(node, e)}
          title="Add parent, spouse, or child"
          className="flex-1 py-1 px-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[10px] transition flex items-center justify-center gap-1 shadow-xs active:scale-95"
        >
          <UserPlus className="w-3 h-3" />
          <span>+ Relative</span>
        </button>

        <button
          type="button"
          onClick={(e) => onShare(node, e)}
          title="Share lineage record"
          className="py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] transition flex items-center justify-center gap-1 shadow-xs active:scale-95"
        >
          <Share2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
