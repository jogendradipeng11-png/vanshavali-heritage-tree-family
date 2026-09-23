import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MemberNode, RelationshipLink, Branch, ActiveUser, RelationshipType } from './types';
import { defaultTreeData, CARD_WIDTH, CARD_HEIGHT } from './initialData';
import { Plus } from 'lucide-react';
import { autoArrangeTree, getAllDescendantIds } from './utils/treeUtils';
import { 
  exportFullRegisterPDF, 
  exportSinglePersonPDF, 
  exportToExcel, 
  exportToWord 
} from './utils/exportUtils';
import { 
  subscribeToOnlineStatus, 
  subscribeToMasterTree, 
  pushMasterTreeToCloud,
  fetchServerMasterTree 
} from './services/firebase';

import { Header, ViewMode } from './components/Header';
import { TreeCanvas } from './components/TreeCanvas';
import { RegisterSheetView } from './components/RegisterSheetView';
import { TimelineView } from './components/TimelineView';
import { SpotlightBanner } from './components/SpotlightBanner';
import { MemberModal } from './components/MemberModal';
import { DetailsModal } from './components/DetailsModal';
import { ShareSheetModal } from './components/ShareSheetModal';
import { InsightsModal } from './components/InsightsModal';
import { AuthModal } from './components/AuthModal';
import { FirebaseSyncModal } from './components/FirebaseSyncModal';
import { PrintRegister } from './components/PrintRegister';
import { MobileBottomNav } from './components/MobileBottomNav';

const STORAGE_KEY = 'vanshavali_tree_data_react_v1';
const USER_KEY = 'vanshavali_active_user_v1';

export default function App() {
  const [nodes, setNodes] = useState<MemberNode[]>([]);
  const [links, setLinks] = useState<RelationshipLink[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [activeBranch, setActiveBranch] = useState<Branch | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [spotlightNodeId, setSpotlightNodeId] = useState<string | null>(null);
  const [activeSharedNodeId, setActiveSharedNodeId] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Real-time Cloud Synchronization States
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [hasPermissionError, setHasPermissionError] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // Modals & Drawers
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<MemberNode | null>(null);
  const [targetLinkNodeId, setTargetLinkNodeId] = useState<string | null>(null);
  
  const [selectedDetailsNode, setSelectedDetailsNode] = useState<MemberNode | null>(null);
  const [shareSheetNode, setShareSheetNode] = useState<MemberNode | null>(null);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [activeUser, setActiveUser] = useState<ActiveUser>({
    email: 'custodian@heritage.org',
    verifiedName: 'Husband / Self',
    nodeId: 'node_4'
  });

  const [toast, setToast] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  const showToast = useCallback((text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(prev => (prev?.text === text ? null : prev));
    }, 4000);
  }, []);

  // Initialize data from localStorage/defaults, then subscribe to Firebase real-time DB
  useEffect(() => {
    let loadedNodes = defaultTreeData.nodes;
    let loadedLinks = defaultTreeData.links;

    // Check cached local storage for instant initial render
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          loadedNodes = parsed.nodes;
          loadedLinks = parsed.links || [];
        }
      } catch {
        // fallback
      }
    }

    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.verifiedName) setActiveUser(u);
      } catch {
        // ignore
      }
    }

    setNodes(loadedNodes);
    setLinks(loadedLinks);

    // Check URL query parameters for shared node owner (?node=XYZ or ?focusNode=XYZ)
    const urlParams = new URLSearchParams(window.location.search);
    const sharedParam = urlParams.get('node') || urlParams.get('focusNode') || urlParams.get('ownerNode');
    if (sharedParam) {
      setActiveSharedNodeId(sharedParam);
      setSpotlightNodeId(sharedParam);
      // Unfold ancestors if needed
      setCollapsedNodes(prev => {
        const next = new Set(prev);
        prev.forEach(cId => {
          if (getAllDescendantIds(cId, loadedLinks).has(sharedParam)) {
            next.delete(cId);
          }
        });
        return next;
      });
    }

    // 1. Subscribe to Firebase real-time online status
    const unsubOnline = subscribeToOnlineStatus((online) => {
      setIsOnline(online);
    });

    // 2. Fetch from server sync API endpoint immediately for fastest multi-device load
    fetchServerMasterTree().then((serverData) => {
      if (serverData && Array.isArray(serverData.nodes) && serverData.nodes.length > 0) {
        setNodes(serverData.nodes);
        setLinks(serverData.links || []);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
        } catch {}
        if (serverData.lastUpdated) {
          setLastSyncTime(new Date(serverData.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
    }).catch(() => {});

    // 3. Periodic server sync polling fallback (every 3 seconds) for live multi-user sync across all devices
    const syncPollInterval = setInterval(() => {
      fetchServerMasterTree().then((serverData) => {
        if (serverData && Array.isArray(serverData.nodes) && serverData.nodes.length > 0) {
          setNodes(prev => {
            if (serverData.nodes.length !== prev.length || JSON.stringify(serverData.nodes) !== JSON.stringify(prev)) {
              setLinks(serverData.links || []);
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
              } catch {}
              if (serverData.lastUpdated) {
                setLastSyncTime(new Date(serverData.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
              }
              return serverData.nodes;
            }
            return prev;
          });
        }
      }).catch(() => {});
    }, 3000);

    // 4. Subscribe to Firebase real-time master tree updates
    const unsubTree = subscribeToMasterTree(
      (cloudData, lastUpdated) => {
        setHasPermissionError(false);
        if (cloudData && Array.isArray(cloudData.nodes) && cloudData.nodes.length > 0) {
          setNodes(cloudData.nodes);
          setLinks(cloudData.links || []);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
          } catch {}

          if (lastUpdated) {
            const timeStr = new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setLastSyncTime(timeStr);
          } else {
            setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        } else {
          // If cloud database is empty, seed it with initial master lineage
          pushMasterTreeToCloud(loadedNodes, loadedLinks).catch(() => {});
        }
      },
      (errMsg) => {
        console.warn('Firebase Realtime Database permission notice:', errMsg);
        setHasPermissionError(true);
      }
    );

    return () => {
      unsubOnline();
      unsubTree();
      clearInterval(syncPollInterval);
    };
  }, []);

  // Sync to localStorage and directly to Firebase Cloud Realtime Database
  const saveState = useCallback((newNodes: MemberNode[], newLinks: RelationshipLink[]) => {
    setNodes(newNodes);
    setLinks(newLinks);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes: newNodes, links: newLinks }));
    } catch (e) {
      console.warn('Storage save notice:', e);
    }

    // Push directly to Firebase Realtime Database
    setIsSyncing(true);
    pushMasterTreeToCloud(newNodes, newLinks)
      .then((res) => {
        setIsSyncing(false);
        if (res.success) {
          setHasPermissionError(false);
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } else if (res.error?.includes('permission_denied') || res.error?.includes('Permission denied')) {
          setHasPermissionError(true);
        }
      })
      .catch((err) => {
        setIsSyncing(false);
        console.warn('Firebase sync warning:', err);
      });
  }, []);

  // Real-time node position updates from dragging
  const handleUpdateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x, y } : n));
  }, []);

  // Save dragged positions to storage and cloud only when dragging finishes on the canvas
  const handleDragFinish = useCallback(() => {
    setNodes(currentNodes => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes: currentNodes, links }));
      } catch {
        // ignore
      }
      pushMasterTreeToCloud(currentNodes, links).catch(() => {});
      return currentNodes;
    });
  }, [links]);

  // Subtree collapsing
  const handleToggleCollapse = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Spotlight node
  const handleSpotlight = useCallback((nodeId: string) => {
    setSpotlightNodeId(nodeId);
    showToast('Focused on relative. Distant relations dimmed.', 'info');
  }, [showToast]);

  const handleClearSpotlight = useCallback(() => {
    setSpotlightNodeId(null);
    setActiveSharedNodeId(null);
    showToast('Viewing complete master family tree.', 'info');
  }, [showToast]);

  // Quick Add Modal opening
  const handleOpenAddModal = useCallback(() => {
    setEditingNode(null);
    // If viewing a shared node, default link to that node
    setTargetLinkNodeId(activeSharedNodeId || nodes[0]?.id || null);
    setIsMemberModalOpen(true);
  }, [nodes, activeSharedNodeId]);

  const handleOpenAddModalForNode = useCallback((node: MemberNode, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingNode(null);
    setTargetLinkNodeId(node.id);
    setIsMemberModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((node: MemberNode) => {
    setEditingNode(node);
    setIsMemberModalOpen(true);
  }, []);

  // Save Node from form
  const handleSaveMember = useCallback((
    nodeData: Partial<MemberNode>, 
    linkConfig?: { targetId: string; type: RelationshipType }
  ) => {
    if (editingNode) {
      // Edit existing relative
      const updatedNodes = nodes.map(n => {
        if (n.id === editingNode.id) {
          return {
            ...n,
            ...nodeData,
            id: n.id,
            x: n.x,
            y: n.y
          } as MemberNode;
        }
        return n;
      });

      saveState(updatedNodes, links);
      showToast(`Updated profile for ${nodeData.name || editingNode.name}.`, 'success');
      // Update selected details dossier if open
      setSelectedDetailsNode(prev => (prev?.id === editingNode.id ? { ...prev, ...nodeData } as MemberNode : prev));
      setIsMemberModalOpen(false);
      setEditingNode(null);
    } else {
      // Add new relative with intelligent non-overlapping layout
      const newNodeId = `node_${Date.now()}`;
      const HORIZONTAL_GAP = CARD_WIDTH + 45;
      const VERTICAL_GAP = 240;
      let posX = 320;
      let posY = 200;

      if (linkConfig?.targetId) {
        const target = nodes.find(n => n.id === linkConfig.targetId);
        if (target) {
          if (linkConfig.type === 'parent') {
            const existingParents = links.filter(l => l.target === target.id && l.type === 'parent');
            posX = target.x + (existingParents.length * HORIZONTAL_GAP);
            posY = Math.max(40, target.y - VERTICAL_GAP);
          } else if (linkConfig.type === 'child') {
            const existingChildren = links.filter(l => l.source === target.id && l.type === 'parent');
            posX = target.x + (existingChildren.length * HORIZONTAL_GAP);
            posY = target.y + VERTICAL_GAP;
          } else if (linkConfig.type === 'spouse') {
            const spouseLinks = links.filter(l => (l.source === target.id || l.target === target.id) && l.type === 'spouse');
            posX = target.x + ((spouseLinks.length + 1) * HORIZONTAL_GAP);
            posY = target.y;
          } else if (linkConfig.type === 'sibling') {
            const siblingLinks = links.filter(l => (l.source === target.id || l.target === target.id) && l.type === 'sibling');
            posX = target.x + ((siblingLinks.length + 1) * HORIZONTAL_GAP);
            posY = target.y;
          }
        }
      } else {
        if (nodes.length > 0) {
          const maxX = Math.max(...nodes.map(n => n.x));
          posX = maxX + HORIZONTAL_GAP;
          posY = 200;
        }
      }

      // Check collision against all existing nodes and nudge horizontally
      let collision = true;
      let attempts = 0;
      while (collision && attempts < 25) {
        collision = nodes.some(n => Math.abs(n.x - posX) < CARD_WIDTH - 20 && Math.abs(n.y - posY) < CARD_HEIGHT - 20);
        if (collision) {
          posX += HORIZONTAL_GAP;
          attempts++;
        }
      }

      const newNode: MemberNode = {
        id: newNodeId,
        name: nodeData.name || '',
        relationship_to_root: nodeData.relationship_to_root || 'Family Member',
        gender: nodeData.gender || 'male',
        branch: nodeData.branch || 'paternal',
        status: nodeData.status || 'alive',
        marital_status: nodeData.marital_status || 'married',
        gotra: nodeData.gotra || '',
        bansa: nodeData.bansa || '',
        dob: nodeData.dob || '',
        dod: nodeData.dod || '',
        age: nodeData.age,
        profession: nodeData.profession || '',
        phone: nodeData.phone || '',
        address: nodeData.address || '',
        notes: nodeData.notes || '',
        x: posX,
        y: posY
      };

      const newLinksList = [...links];
      if (linkConfig?.targetId) {
        if (linkConfig.type === 'parent') {
          newLinksList.push({ id: `l_${Date.now()}`, source: newNodeId, target: linkConfig.targetId, type: 'parent' });
        } else if (linkConfig.type === 'child') {
          newLinksList.push({ id: `l_${Date.now()}`, source: linkConfig.targetId, target: newNodeId, type: 'parent' });
        } else if (linkConfig.type === 'spouse') {
          newLinksList.push({ id: `l_${Date.now()}`, source: linkConfig.targetId, target: newNodeId, type: 'spouse' });
        } else if (linkConfig.type === 'sibling') {
          newLinksList.push({ id: `l_${Date.now()}`, source: linkConfig.targetId, target: newNodeId, type: 'sibling' });
        }

        // Unfold target and all ancestors so the newly added relative is visible
        setCollapsedNodes(prev => {
          const next = new Set(prev);
          next.delete(linkConfig.targetId);
          prev.forEach(cId => {
            if (getAllDescendantIds(cId, links).has(linkConfig.targetId)) {
              next.delete(cId);
            }
          });
          return next;
        });
      }

      // Ensure active branch doesn't hide the newly added member
      if (activeBranch !== 'all' && activeBranch !== newNode.branch) {
        setActiveBranch('all');
      }

      // If user is in shared owner mode, focus spotlight on the active shared node cluster
      if (!activeSharedNodeId) {
        setSpotlightNodeId(newNodeId);
      }

      saveState([...nodes, newNode], newLinksList);
      showToast(`Added ${newNode.name} to the heritage register and sheet.`, 'success');
      setIsMemberModalOpen(false);
    }
  }, [editingNode, nodes, links, saveState, showToast, activeBranch, activeSharedNodeId]);

  // Delete Node
  const handleDeleteMember = useCallback((nodeId: string) => {
    const target = nodes.find(n => n.id === nodeId);
    if (!target) return;

    if (window.confirm(`Permanently remove ${target.name} and all related relationship connections?`)) {
      const remainingNodes = nodes.filter(n => n.id !== nodeId);
      const remainingLinks = links.filter(l => l.source !== nodeId && l.target !== nodeId);
      saveState(remainingNodes, remainingLinks);
      showToast(`Removed ${target.name} from register.`, 'info');
      setIsMemberModalOpen(false);
      setEditingNode(null);
      setSelectedDetailsNode(null);
      if (spotlightNodeId === nodeId) setSpotlightNodeId(null);
    }
  }, [nodes, links, saveState, showToast, spotlightNodeId]);

  // Auto Arrange
  const handleAutoArrange = useCallback(() => {
    const arranged = autoArrangeTree(nodes, links);
    saveState(arranged, links);
    showToast('Generations aligned automatically.', 'success');
  }, [nodes, links, saveState, showToast]);

  // Locate on tree from timeline
  const handleLocateOnTree = useCallback((node: MemberNode) => {
    if (viewMode === 'timeline') {
      setViewMode('tree');
    }
    setSpotlightNodeId(node.id);
    // Unfold any ancestor if collapsed
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      prev.forEach(cId => {
        if (getAllDescendantIds(cId, links).has(node.id)) {
          next.delete(cId);
        }
      });
      return next;
    });
    showToast(`Located ${node.name} on the heritage tree.`, 'info');
  }, [viewMode, links, showToast]);

  // Jump to relative from details modal
  const handleJumpToRelative = useCallback((nodeId: string) => {
    const target = nodes.find(n => n.id === nodeId);
    if (target) {
      setSelectedDetailsNode(target);
      setSpotlightNodeId(nodeId);
    }
  }, [nodes]);

  // Share handlers
  const handleShareNode = useCallback((node: MemberNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShareSheetNode(node);
    setIsShareSheetOpen(true);
  }, []);

  const handleShareTree = useCallback(() => {
    setShareSheetNode(null);
    setIsShareSheetOpen(true);
  }, []);

  // Compute clean, short Share URL
  const shareUrl = useMemo(() => {
    try {
      const base = `${window.location.origin}${window.location.pathname}`;
      if (shareSheetNode) {
        return `${base}?node=${encodeURIComponent(shareSheetNode.id)}`;
      }
      return base;
    } catch {
      return window.location.href;
    }
  }, [shareSheetNode]);

  // Start fresh 3-generation tree
  const handleStartNewTree = useCallback((fullName: string, email: string) => {
    const tNow = Date.now();
    const n1Id = `node_ggf_${tNow}`;
    const n2Id = `node_gf_${tNow + 1}`;
    const n3Id = `node_f_${tNow + 2}`;
    const n4Id = `node_self_${tNow + 3}`;

    const setupNodes: MemberNode[] = [
      { id: n1Id, branch: 'paternal', name: 'Great-Grandfather', relationship_to_root: 'Great-Grandfather', gender: 'male', marital_status: 'married', status: 'deceased', gotra: '', bansa: '', x: 320, y: 40 },
      { id: n2Id, branch: 'paternal', name: 'Grandfather', relationship_to_root: 'Grandfather', gender: 'male', marital_status: 'married', status: 'deceased', gotra: '', bansa: '', x: 320, y: 280 },
      { id: n3Id, branch: 'paternal', name: 'Father', relationship_to_root: 'Father', gender: 'male', marital_status: 'married', status: 'alive', gotra: '', bansa: '', x: 320, y: 520 },
      { id: n4Id, branch: 'paternal', name: fullName, relationship_to_root: 'Root (Self)', gender: 'male', marital_status: 'married', status: 'alive', gotra: '', bansa: '', x: 320, y: 760 }
    ];

    const setupLinks: RelationshipLink[] = [
      { id: 'l_setup_1', source: n1Id, target: n2Id, type: 'parent' },
      { id: 'l_setup_2', source: n2Id, target: n3Id, type: 'parent' },
      { id: 'l_setup_3', source: n3Id, target: n4Id, type: 'parent' }
    ];

    const newUser: ActiveUser = { verifiedName: fullName, email, nodeId: n4Id };
    setActiveUser(newUser);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));

    saveState(setupNodes, setupLinks);
    showToast(`Fresh tree initialized for ${fullName} with 3 generations!`, 'success');
  }, [saveState, showToast]);

  const spotlightNode = useMemo(() => {
    return spotlightNodeId ? nodes.find(n => n.id === spotlightNodeId) || null : null;
  }, [spotlightNodeId, nodes]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 text-slate-800 font-sans antialiased">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-none animate-in slide-in-from-top-2 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 pointer-events-auto ${
            toast.type === 'error' 
              ? 'bg-rose-600 text-white' 
              : toast.type === 'success' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-slate-900 text-white border border-slate-700'
          }`}>
            <span>{toast.type === 'error' ? '❌' : (toast.type === 'success' ? '✅' : 'ℹ️')}</span>
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeBranch={activeBranch}
        onBranchChange={setActiveBranch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAutoArrange={handleAutoArrange}
        onOpenAddModal={handleOpenAddModal}
        onShareTree={handleShareTree}
        onExportPDF={() => { exportFullRegisterPDF(nodes, links); showToast('Full PDF Register downloaded.', 'success'); }}
        onExportExcel={() => { exportToExcel(nodes, links); showToast('Excel spreadsheet downloaded.', 'success'); }}
        onExportWord={() => { exportToWord(nodes, links); showToast('Word report downloaded.', 'success'); }}
        onPrint={() => window.print()}
        onOpenInsights={() => setIsInsightsOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        userName={activeUser.verifiedName}
        isOnline={isOnline}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        hasPermissionError={hasPermissionError}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Spotlight / Shared Owner Mode Banner */}
      <SpotlightBanner
        spotlightNode={spotlightNode}
        onClear={handleClearSpotlight}
        isSharedOwnerMode={Boolean(activeSharedNodeId && spotlightNodeId === activeSharedNodeId)}
      />

      {/* Main View Area: Tree Canvas, Sheet Register, and/or Chronological Timeline View */}
      <main className="flex-1 relative overflow-hidden flex flex-row w-full h-full">
        {viewMode === 'sheet' && (
          <div className="flex-1 relative h-full w-full overflow-hidden bg-slate-950">
            <RegisterSheetView
              nodes={nodes}
              links={links}
              activeBranch={activeBranch}
              searchQuery={searchQuery}
              spotlightNodeId={spotlightNodeId}
              onSelectNode={setSelectedDetailsNode}
              onEditNode={handleOpenEditModal}
              onAddRelative={handleOpenAddModalForNode}
              onShareNode={handleShareNode}
              onDeleteNode={handleDeleteMember}
              onExportExcel={() => { exportToExcel(nodes, links); showToast('Excel spreadsheet downloaded.', 'success'); }}
              onExportPDF={() => { exportFullRegisterPDF(nodes, links); showToast('PDF register downloaded.', 'success'); }}
            />
          </div>
        )}

        {(viewMode === 'tree' || viewMode === 'split') && (
          <div className="flex-1 relative h-full w-full overflow-hidden">
            <TreeCanvas
              nodes={nodes}
              links={links}
              activeBranch={activeBranch}
              searchQuery={searchQuery}
              spotlightNodeId={spotlightNodeId}
              activeSharedNodeId={activeSharedNodeId}
              collapsedNodes={collapsedNodes}
              onSelectNode={setSelectedDetailsNode}
              onEditNode={handleOpenEditModal}
              onShareNode={handleShareNode}
              onAddRelative={handleOpenAddModalForNode}
              onToggleCollapse={handleToggleCollapse}
              onUpdateNodePosition={handleUpdateNodePosition}
              onDragFinish={handleDragFinish}
            />

            {/* Quick Contributor Floating Action for Shared Node Collaborator */}
            {activeSharedNodeId && (
              <div className="hidden sm:flex absolute bottom-6 left-6 z-30 bg-slate-900/95 backdrop-blur-md border border-amber-500/50 rounded-2xl p-4 shadow-2xl max-w-xs flex-col gap-2 pointer-events-auto">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
                  <span className="text-base">👑</span>
                  <span>Branch Contributor Mode</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Your branch is spotlighted and relatives you add automatically sync to everyone&apos;s master register sheet.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const sharedNode = nodes.find(n => n.id === activeSharedNodeId);
                    if (sharedNode) {
                      handleOpenAddModalForNode(sharedNode);
                    } else if (nodes.length > 0) {
                      handleOpenAddModalForNode(nodes[0]);
                    }
                  }}
                  className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>+ Add Relative to My Branch</span>
                </button>
              </div>
            )}
          </div>
        )}

        {(viewMode === 'timeline' || viewMode === 'split') && (
          <div className={`${
            viewMode === 'split' 
              ? 'w-full md:w-[480px] lg:w-[540px] xl:w-[600px] border-l border-slate-800 shrink-0 z-20 shadow-2xl' 
              : 'flex-1'
          } h-full overflow-hidden`}>
            <TimelineView
              nodes={nodes}
              links={links}
              onSelectNode={setSelectedDetailsNode}
              onLocateOnTree={handleLocateOnTree}
              onEditNode={handleOpenEditModal}
              onClose={viewMode === 'split' ? () => setViewMode('tree') : undefined}
              isSideDrawer={viewMode === 'split'}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAddModal={handleOpenAddModal}
        onAutoArrange={handleAutoArrange}
        onShareTree={handleShareTree}
        onExportPDF={() => { exportFullRegisterPDF(nodes, links); showToast('Full PDF Register downloaded.', 'success'); }}
        onOpenInsights={() => setIsInsightsOpen(true)}
      />

      {/* Relative Details Dossier Modal */}
      <DetailsModal
        node={selectedDetailsNode}
        nodes={nodes}
        links={links}
        isOpen={Boolean(selectedDetailsNode)}
        onClose={() => setSelectedDetailsNode(null)}
        onEdit={handleOpenEditModal}
        onSpotlight={handleSpotlight}
        onShare={handleShareNode}
        onExportPDF={(n) => { exportSinglePersonPDF(n, nodes, links); showToast(`Dossier PDF for ${n.name} exported.`, 'success'); }}
        onJumpToRelative={handleJumpToRelative}
      />

      {/* Add / Edit Member Modal */}
      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => { setIsMemberModalOpen(false); setEditingNode(null); }}
        onSave={handleSaveMember}
        onDelete={handleDeleteMember}
        onExportSinglePDF={(n) => { exportSinglePersonPDF(n, nodes, links); showToast(`Dossier PDF exported.`, 'success'); }}
        onShareNode={handleShareNode}
        editingNode={editingNode}
        targetLinkNodeId={targetLinkNodeId}
        nodes={nodes}
        activeBranch={activeBranch}
      />

      {/* Multi-Channel Share Sheet */}
      <ShareSheetModal
        isOpen={isShareSheetOpen}
        node={shareSheetNode}
        onClose={() => { setIsShareSheetOpen(false); setShareSheetNode(null); }}
        shareUrl={shareUrl}
      />

      {/* Lineage Insights Modal */}
      <InsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        nodes={nodes}
        links={links}
      />

      {/* Custodian Profile / Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={activeUser}
        onLogin={(u) => { setActiveUser(u); localStorage.setItem(USER_KEY, JSON.stringify(u)); showToast(`Switched profile to ${u.verifiedName}.`, 'success'); }}
        onStartNewTree={handleStartNewTree}
        nodes={nodes}
      />

      {/* Firebase Real-time Cloud Sync & Rules Diagnosis Modal */}
      <FirebaseSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        isOnline={isOnline}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        hasPermissionError={hasPermissionError}
        nodes={nodes}
        links={links}
        onSyncSuccess={() => {
          setHasPermissionError(false);
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          showToast('Firebase master tree synchronized successfully!', 'success');
        }}
      />

      {/* Print View Table for @media print */}
      <PrintRegister nodes={nodes} links={links} />
    </div>
  );
}
