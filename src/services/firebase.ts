import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  onValue, 
  set, 
  Database,
  Unsubscribe
} from 'firebase/database';
import { MemberNode, RelationshipLink, TreeData } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBbi1Bh5bOScSNX5Hf9UcYTo_6C_7EtCiQ",
  authDomain: "vanshavali-heritage-tree.firebaseapp.com",
  databaseURL: "https://vanshavali-heritage-tree-default-rtdb.firebaseio.com",
  projectId: "vanshavali-heritage-tree",
  storageBucket: "vanshavali-heritage-tree.firebasestorage.app",
  messagingSenderId: "188938879243",
  appId: "1:188938879243:web:0a57d909f4267fa369220e"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const database: Database = getDatabase(app);

export const MASTER_TREE_ROOM = 'master_heritage_tree';

export type SyncStatus = 'connected' | 'syncing' | 'offline' | 'connecting';

/**
 * Subscribes to real-time online status via .info/connected
 */
export function subscribeToOnlineStatus(onStatusChange: (isOnline: boolean) => void): Unsubscribe {
  const connectedRef = ref(database, '.info/connected');
  return onValue(connectedRef, (snap) => {
    const isOnline = snap.val() === true;
    onStatusChange(isOnline);
  }, (err) => {
    console.warn('Firebase connection check error:', err);
    onStatusChange(false);
  });
}

/**
 * Subscribes to real-time master tree changes
 */
export function subscribeToMasterTree(
  onData: (data: TreeData, lastUpdated?: number) => void,
  room: string = MASTER_TREE_ROOM
): Unsubscribe {
  const treeRef = ref(database, `trees/${room}`);
  return onValue(treeRef, (snapshot) => {
    const val = snapshot.val();
    if (val && Array.isArray(val.nodes) && val.nodes.length > 0) {
      onData({
        nodes: val.nodes,
        links: Array.isArray(val.links) ? val.links : []
      }, val.lastUpdated);
    }
  }, (err) => {
    console.warn('Firebase real-time sync read error:', err);
  });
}

/**
 * Sanitizes object by removing undefined values and ensuring valid JSON types
 */
function sanitizeForFirebase(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirebase);
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        clean[key] = sanitizeForFirebase(val);
      }
    }
    return clean;
  }
  return obj;
}

/**
 * Directly updates tree data to Firebase so all devices worldwide get it immediately
 */
export async function pushMasterTreeToCloud(
  nodes: MemberNode[],
  links: RelationshipLink[],
  room: string = MASTER_TREE_ROOM
): Promise<void> {
  try {
    const treeRef = ref(database, `trees/${room}`);
    const cleanNodes = sanitizeForFirebase(nodes);
    const cleanLinks = sanitizeForFirebase(links);
    const payload = {
      nodes: cleanNodes,
      links: cleanLinks,
      lastUpdated: Date.now()
    };
    await set(treeRef, payload);
  } catch (err: any) {
    console.warn('Firebase cloud push notice (local changes preserved):', err?.message || err);
  }
}

