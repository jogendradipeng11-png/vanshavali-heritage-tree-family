import React, { useState } from 'react';
import { X, Sparkles, User, Mail, KeyRound, CheckCircle2 } from 'lucide-react';
import { ActiveUser, MemberNode } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ActiveUser | null;
  onLogin: (user: ActiveUser) => void;
  onStartNewTree: (name: string, email: string) => void;
  nodes: MemberNode[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onStartNewTree,
  nodes
}) => {
  const [fullName, setFullName] = useState(currentUser?.verifiedName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [selectedNodeId, setSelectedNodeId] = useState(currentUser?.nodeId || nodes[0]?.id || '');
  const [mode, setMode] = useState<'signin' | 'new'>('signin');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    if (mode === 'new') {
      onStartNewTree(fullName.trim(), email.trim());
      onClose();
    } else {
      const selectedNode = nodes.find(n => n.id === selectedNodeId);
      onLogin({
        verifiedName: selectedNode?.name || fullName.trim(),
        email: email.trim(),
        nodeId: selectedNodeId
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in duration-150">
        {/* Banner */}
        <div className="px-6 py-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/40 mb-2.5">
            🌿
          </div>
          <h2 className="text-lg font-black tracking-tight">Vanshavali Heritage Tree</h2>
          <p className="text-xs text-slate-300 mt-0.5">Lineage Custodian & Profile Access</p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 text-xs font-bold text-center">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-3 transition ${
              mode === 'signin'
                ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/40'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Access Existing Lineage
          </button>
          <button
            onClick={() => setMode('new')}
            className={`flex-1 py-3 transition ${
              mode === 'new'
                ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/40'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🌱 Start Fresh Tree
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Your Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. custodian@heritage.org"
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {mode === 'signin' && nodes.length > 0 && (
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Link to Your Self / Node in Tree
              </label>
              <select
                value={selectedNodeId}
                onChange={(e) => setSelectedNodeId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium"
              >
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.relationship_to_root})
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === 'new' && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              💡 Starting a fresh tree initializes 3 ancestor generations (Great-Grandfather, Grandfather, Father, and Self) ready for your family's Gotra details!
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition"
            >
              {mode === 'new' ? '🌱 Create 3-Gen Family Lineage' : 'Save Custodian Profile'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-slate-500 hover:text-slate-700 font-semibold transition text-[11px]"
            >
              Continue without Changing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
