import React from 'react';
import { X, BarChart3, Users, Heart, Award, Shield, BookOpen } from 'lucide-react';
import { MemberNode, RelationshipLink } from '../types';

interface InsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: MemberNode[];
  links: RelationshipLink[];
}

export const InsightsModal: React.FC<InsightsModalProps> = ({
  isOpen,
  onClose,
  nodes,
  links
}) => {
  if (!isOpen) return null;

  const totalMembers = nodes.length;
  const livingCount = nodes.filter(n => n.status === 'alive').length;
  const deceasedCount = nodes.filter(n => n.status === 'deceased').length;
  const maleCount = nodes.filter(n => n.gender === 'male').length;
  const femaleCount = nodes.filter(n => n.gender === 'female').length;
  const paternalCount = nodes.filter(n => n.branch === 'paternal').length;
  const maternalCount = nodes.filter(n => n.branch === 'maternal').length;

  // Gotra distribution
  const gotraCounts: Record<string, number> = {};
  nodes.forEach(n => {
    const g = n.gotra ? n.gotra.trim() : 'Unknown';
    gotraCounts[g] = (gotraCounts[g] || 0) + 1;
  });

  // Bansa distribution
  const bansaCounts: Record<string, number> = {};
  nodes.forEach(n => {
    const b = n.bansa ? n.bansa.trim() : 'Unknown';
    bansaCounts[b] = (bansaCounts[b] || 0) + 1;
  });

  // Max depth / generations
  let maxGen = 1;
  const visited = new Set<string>();
  const parentLinks = links.filter(l => l.type === 'parent');

  function getDepth(nodeId: string, currentDepth: number) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    if (currentDepth > maxGen) maxGen = currentDepth;
    const children = parentLinks.filter(l => l.source === nodeId);
    children.forEach(c => getDepth(c.target, currentDepth + 1));
  }

  // Find root ancestors (no incoming parent links)
  const incoming = new Set(parentLinks.map(l => l.target));
  const roots = nodes.filter(n => !incoming.has(n.id));
  roots.forEach(r => getDepth(r.id, 1));

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Lineage Heritage Insights</h2>
              <p className="text-[11px] text-slate-400">Genealogical stats, Gotras & generations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 text-center">
              <span className="block text-[10px] font-bold text-indigo-600 uppercase">Members</span>
              <span className="text-xl font-black text-indigo-950">{totalMembers}</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 text-center">
              <span className="block text-[10px] font-bold text-emerald-600 uppercase">Living</span>
              <span className="text-xl font-black text-emerald-950">{livingCount}</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 text-center">
              <span className="block text-[10px] font-bold text-amber-700 uppercase">Generations</span>
              <span className="text-xl font-black text-amber-950">{maxGen}</span>
            </div>
          </div>

          {/* Vitals Summary */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-semibold">🕊️ Departed Ancestors:</span>
              <span className="font-bold text-slate-900">{deceasedCount} relatives</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-semibold">👨 Male / 👩 Female ratio:</span>
              <span className="font-bold text-slate-900">{maleCount} / {femaleCount}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-semibold">🧔 Main Line / 👩 In-Law side:</span>
              <span className="font-bold text-slate-900">{paternalCount} / {maternalCount}</span>
            </div>
          </div>

          {/* Gotra Heritage */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              Gotras Represented in Archive
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(gotraCounts).map(([gotra, count]) => (
                <span
                  key={gotra}
                  className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold flex items-center gap-1.5"
                >
                  <span>{gotra}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-200/80 text-indigo-950">
                    {count}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Bansa Heritage */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              Bansavali Lineages
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(bansaCounts).map(([bansa, count]) => (
                <span
                  key={bansa}
                  className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold flex items-center gap-1.5"
                >
                  <span>{bansa}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-950">
                    {count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow"
          >
            Close Insights
          </button>
        </div>
      </div>
    </div>
  );
};
