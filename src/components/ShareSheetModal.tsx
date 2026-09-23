import React, { useState } from 'react';
import { X, MessageSquare, Mail, Share2, Copy, Check } from 'lucide-react';
import { MemberNode } from '../types';

interface ShareSheetModalProps {
  isOpen: boolean;
  node: MemberNode | null;
  onClose: () => void;
  shareUrl: string;
}

export const ShareSheetModal: React.FC<ShareSheetModalProps> = ({
  isOpen,
  node,
  onClose,
  shareUrl
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const nodeName = node ? node.name : 'our family';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Namaskar! View and contribute family lineage records for ${nodeName} on our Vanshavali Heritage Tree:\n\n${shareUrl}\n\n(Live synchronized worldwide)`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Invitation to Vanshavali Heritage Tree - ${nodeName}`);
    const body = encodeURIComponent(
      `Hello,\n\nYou are invited to view and contribute family lineage details for ${nodeName} on our Vanshavali Heritage Tree register.\n\nOpen Link:\n${shareUrl}\n\nThis web link connects directly to the live updated master tree.\n\nWarm regards,\nVanshavali Heritage Archive`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Vanshavali Heritage Tree - ${nodeName}`,
        text: `View ancestral lineage and connections for ${nodeName}:`,
        url: shareUrl
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold">Share Lineage Record</h2>
            <p className="text-[11px] text-slate-400">
              {node ? `Invite family to view/add records for ${node.name}` : 'Share complete heritage tree'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channels */}
        <div className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleWhatsApp}
              className="py-3 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold flex items-center justify-center gap-2 transition active:scale-95"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleEmail}
              className="py-3 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-xl font-bold flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>Email</span>
            </button>
          </div>

          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Share2 className="w-4 h-4 text-indigo-400" />
            <span>Share via Apps / AirDrop</span>
          </button>

          {/* Direct Link Input */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700 text-[11px]">
                Short Web Page Link
              </label>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                ⚡ Live Cloud Synced
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-slate-700 font-mono text-[10px] bg-slate-50 truncate select-all"
              />
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition shrink-0 shadow-sm active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Anyone with this link on mobile, laptop, tab, iPhone or Android can open to view the latest master tree with this node active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
