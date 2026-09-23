import React from 'react';
import { X, Edit3, Target, Share2, FileDown, Heart, Users, MapPin, Phone, Briefcase, Printer, Camera } from 'lucide-react';
import { MemberNode, RelationshipLink } from '../types';
import { getRelativeSummary } from '../utils/treeUtils';
import { getDefaultSticker } from '../utils/stickerPresets';

interface DetailsModalProps {
  node: MemberNode | null;
  nodes: MemberNode[];
  links: RelationshipLink[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (node: MemberNode) => void;
  onSpotlight: (nodeId: string) => void;
  onShare: (node: MemberNode) => void;
  onExportPDF: (node: MemberNode) => void;
  onPrintBranch?: (node: MemberNode) => void;
  onJumpToRelative: (nodeId: string) => void;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({
  node,
  nodes,
  links,
  isOpen,
  onClose,
  onEdit,
  onSpotlight,
  onShare,
  onExportPDF,
  onPrintBranch,
  onJumpToRelative
}) => {
  if (!isOpen || !node) return null;

  const rels = getRelativeSummary(node.id, nodes, links);
  const isDeceased = node.status === 'deceased';
  const isMaternal = node.branch === 'maternal';
  const isMarried = node.marital_status === 'married';
  const stickerEmoji = node.sticker || (isDeceased ? '🕊️' : getDefaultSticker(node.gender, node.status, node.age, node.relationship_to_root));

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-base font-bold tracking-tight">Relative Profile & Dossier</h2>
            <p className="text-xs text-slate-400">Complete Gotra, lineage vitals, and connections.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Identity Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-start gap-3.5">
              {/* Large Portrait Sticker Frame */}
              <div className="relative shrink-0">
                {node.photo_url ? (
                  <div className="w-16 h-16 rounded-2xl overflow-hidden ring-3 ring-indigo-500/30 shadow-lg border-2 border-white bg-slate-100 flex items-center justify-center">
                    <img src={node.photo_url} alt={node.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-16 h-16 rounded-2xl ring-3 shadow-lg border-2 border-white flex items-center justify-center text-4xl ${
                    isMaternal 
                      ? 'bg-gradient-to-tr from-rose-100 via-pink-50 to-amber-50 ring-rose-400/40' 
                      : 'bg-gradient-to-tr from-indigo-100 via-sky-50 to-amber-50 ring-indigo-400/40'
                  }`}>
                    <span>{stickerEmoji}</span>
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 text-[10px] bg-slate-900 text-white rounded-full px-1 shadow border border-white">
                  🏷️
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <h3 className={`text-lg font-black text-slate-900 truncate ${isDeceased ? 'text-slate-600 line-through' : ''}`}>
                    {node.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isDeceased ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isDeceased ? '🕊️ Deceased' : '🌱 Living'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-white ${
                      isMaternal ? 'bg-rose-600' : 'bg-indigo-600'
                    }`}>
                      {isMaternal ? "Wife's Side" : "Main Line"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs font-bold text-indigo-700">
                    {node.relationship_to_root}
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(node);
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Change Picture / Sticker</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 text-slate-700">
              <div>
                <span className="font-bold text-slate-900">Gotra:</span>{' '}
                <span className="font-semibold text-indigo-900">{node.gotra || 'Not specified'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Bansa:</span>{' '}
                <span className="font-semibold text-indigo-900">{node.bansa || 'Not specified'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Marital Status:</span>{' '}
                <span>{isMarried ? '💍 Married' : 'Single (Unmarried)'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Age:</span>{' '}
                <span>
                  {node.age != null ? `${node.age} Years ${isDeceased ? '(At passing)' : ''}` : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Date of Birth:</span>{' '}
                <span>{node.dob || 'Unknown'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Date of Passing:</span>{' '}
                <span>{isDeceased ? (node.dod || 'Unknown') : 'N/A (Living)'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Profession:</span>{' '}
                <span>{node.profession || '-'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Phone:</span>{' '}
                <span>{node.phone || '-'}</span>
              </div>
            </div>

            {node.address && (
              <div className="pt-1 text-slate-700">
                <span className="font-bold text-slate-900">Address / Homeland:</span>{' '}
                <span>{node.address}</span>
              </div>
            )}

            {node.notes && (
              <div className="pt-2 border-t border-slate-200/70 text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/50 italic">
                "{node.notes}"
              </div>
            )}
          </div>

          {/* Connections Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Family Lineage Connections
            </h4>

            {/* Parents */}
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Parents (Prior Generation ⬆️)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {rels.parents.length > 0 ? (
                  rels.parents.map(p => (
                    <button
                      key={p.id}
                      onClick={() => onJumpToRelative(p.id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition border border-slate-200 flex items-center gap-1"
                    >
                      <span>👨</span> {p.name} ({p.relationship_to_root})
                    </button>
                  ))
                ) : (
                  <span className="text-slate-400 italic">None recorded</span>
                )}
              </div>
            </div>

            {/* Spouses */}
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Spouses (Horizontal 💍)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {rels.spouses.length > 0 ? (
                  rels.spouses.map(s => (
                    <button
                      key={s.id}
                      onClick={() => onJumpToRelative(s.id)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg font-semibold transition border border-rose-200 flex items-center gap-1"
                    >
                      <span>💍</span> {s.name} ({s.relationship_to_root})
                    </button>
                  ))
                ) : (
                  <span className="text-slate-400 italic">None recorded</span>
                )}
              </div>
            </div>

            {/* Siblings */}
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Brothers / Sisters / In-Laws (Horizontal 👥)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {rels.siblings.length > 0 ? (
                  rels.siblings.map(sb => (
                    <button
                      key={sb.id}
                      onClick={() => onJumpToRelative(sb.id)}
                      className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg font-semibold transition border border-sky-200 flex items-center gap-1"
                    >
                      <span>👥</span> {sb.name} ({sb.relationship_to_root})
                    </button>
                  ))
                ) : (
                  <span className="text-slate-400 italic">None recorded</span>
                )}
              </div>
            </div>

            {/* Children */}
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Children (Next Generation ⬇️)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {rels.children.length > 0 ? (
                  rels.children.map(c => (
                    <button
                      key={c.id}
                      onClick={() => onJumpToRelative(c.id)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg font-semibold transition border border-indigo-200 flex items-center gap-1"
                    >
                      <span>🧒</span> {c.name} ({c.relationship_to_root})
                    </button>
                  ))
                ) : (
                  <span className="text-slate-400 italic">None recorded</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => onSpotlight(node.id)}
              className="py-2 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
              title="Highlight this relative and immediate links"
            >
              <Target className="w-3.5 h-3.5 text-amber-600" />
              <span>Spotlight</span>
            </button>
            <button
              onClick={() => onShare(node)}
              className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
              title="Share record link"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Share</span>
            </button>
            <button
              onClick={() => onExportPDF(node)}
              className="py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
              title="Download official dossier certificate"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dossier</span>
            </button>
            {onPrintBranch && (
              <button
                onClick={() => onPrintBranch(node)}
                className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                title="Print personal branch architecture & connected links"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Branch</span>
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
            <button
              onClick={() => onEdit(node)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
