import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertTriangle, RefreshCw, Copy, Check, ExternalLink, ShieldAlert } from 'lucide-react';
import { firebaseConfig, testFirebaseConnection, pushMasterTreeToCloud } from '../services/firebase';
import { MemberNode, RelationshipLink } from '../types';

interface FirebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  hasPermissionError: boolean;
  nodes: MemberNode[];
  links: RelationshipLink[];
  onSyncSuccess: () => void;
}

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  isSyncing,
  lastSyncTime,
  hasPermissionError,
  nodes,
  links,
  onSyncSuccess
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSync = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testFirebaseConnection();
      if (res.ok) {
        // Push full tree
        const pushRes = await pushMasterTreeToCloud(nodes, links);
        if (pushRes.success) {
          setTestResult({ ok: true, message: 'Successfully connected and pushed master tree to Firebase Realtime Database!' });
          onSyncSuccess();
        } else {
          setTestResult({ ok: false, message: `Connected to Firebase, but tree push failed: ${pushRes.error}` });
        }
      } else {
        setTestResult({ ok: false, message: res.message });
      }
    } catch (e: any) {
      setTestResult({ ok: false, message: e?.message || 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const sampleRules = `{\n  "rules": {\n    ".read": true,\n    ".write": true\n  }\n}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(sampleRules);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Firebase Real-time Synchronization</h3>
              <p className="text-xs text-slate-400">Live cloud database status and setup</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Box */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <span className="text-[11px] text-slate-400 block mb-1">Database Status</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  hasPermissionError 
                    ? 'bg-rose-500 animate-pulse' 
                    : isOnline 
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80' 
                    : 'bg-amber-400'
                }`} />
                <span className="font-bold text-sm text-white">
                  {hasPermissionError ? 'Permission Denied' : isOnline ? 'Connected' : 'Offline / Reconnecting'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <span className="text-[11px] text-slate-400 block mb-1">Last Cloud Sync</span>
              <span className="font-bold text-sm text-white">
                {lastSyncTime || 'Pending initial push'}
              </span>
            </div>
          </div>

          {/* Configuration details */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Project ID:</span>
              <span className="text-slate-200 font-semibold">{firebaseConfig.projectId}</span>
            </div>
            <div className="flex justify-between truncate">
              <span className="text-slate-400">Database:</span>
              <span className="text-indigo-300 truncate max-w-[240px]">{firebaseConfig.databaseURL}</span>
            </div>
          </div>

          {/* If Permission Error: Step-by-step instructions */}
          {(hasPermissionError || testResult?.ok === false) && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-200 text-sm">Action Required: Enable Database Rules</h4>
                  <p className="text-xs text-rose-300/90 mt-0.5">
                    Your Firebase Realtime Database is connected, but its security rules are currently in locked mode (<code className="bg-rose-900/60 px-1 py-0.5 rounded text-rose-100">.read: false, .write: false</code>), which blocks data synchronization.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-rose-900/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-300 text-[11px]">Copy Realtime Database Rules:</span>
                  <button
                    onClick={handleCopyRules}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                  >
                    {copiedRules ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRules ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="text-emerald-400 font-mono text-[11px] p-2 bg-slate-900/90 rounded border border-slate-800 overflow-x-auto">
{sampleRules}
                </pre>
              </div>

              <div className="text-[11px] space-y-1 text-rose-200/90">
                <p className="font-semibold">How to update in 15 seconds:</p>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>Open your <strong>Firebase Console</strong>.</li>
                  <li>Click <strong>Build &gt; Realtime Database</strong> &gt; <strong>Rules</strong> tab.</li>
                  <li>Paste the rules above and click <strong>Publish</strong>.</li>
                  <li>Click the <strong>Test &amp; Sync Master Tree</strong> button below.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Test result message */}
          {testResult && (
            <div className={`p-3 rounded-xl border flex items-start gap-2 ${
              testResult.ok 
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' 
                : 'bg-rose-950/40 border-rose-800 text-rose-200'
            }`}>
              {testResult.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              <span className="text-xs leading-relaxed">{testResult.message}</span>
            </div>
          )}

          <p className="text-slate-400 text-[11px] leading-relaxed">
            All updates made by family members on mobile, tablet, laptop, or desktop synchronize live through this Firebase Realtime Database.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
          <a
            href="https://console.firebase.google.com/project/vanshavali-heritage-tree/database/vanshavali-heritage-tree-default-rtdb/rules"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
          >
            <span>Open Firebase Rules Console</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Close
            </button>
            <button
              onClick={handleTestAndSync}
              disabled={testing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-indigo-600/30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Testing & Syncing...' : 'Test & Sync Master Tree'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
