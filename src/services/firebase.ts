import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  onValue, 
  set, 
  get,
  Database,
  Unsubscribe
} from 'firebase/database';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { MemberNode, RelationshipLink, TreeData } from '../types';

// Exact Firebase project configuration provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyBbi1Bh5bOScSNX5Hf9UcYTo_6C_7EtCiQ",
  authDomain: "vanshavali-heritage-tree.firebaseapp.com",
  databaseURL: "https://vanshavali-heritage-tree-default-rtdb.firebaseio.com",
  projectId: "vanshavali-heritage-tree",
  storageBucket: "vanshavali-heritage-tree.firebasestorage.app",
  messagingSenderId: "188938879243",
  appId: "1:188938879243:web:0a57d909f4267fa369220e",
  measurementId: "G-2SM068VLC8"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const database: Database = getDatabase(app);
export const auth = getAuth(app);

export const MASTER_TREE_ROOM = 'master_heritage_tree';

// Background authentication helper so auth != null rules can also work
let currentUser: User | null = null;
onAuthStateChanged(auth, (u) => {
  currentUser = u;
});

// Auto-authenticate with sync user
export async function ensureFirebaseAuth(): Promise<User | null> {
  if (currentUser) return currentUser;
  try {
    const cred = await signInWithEmailAndPassword(auth, "sync_user@vanshavali.org", "HeritageTree2026!#");
    currentUser = cred.user;
    return cred.user;
  } catch {
    return null;
  }
}

// Initial silent sign-in attempt
ensureFirebaseAuth().catch(() => {});

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
  onPermissionError?: (errMsg: string) => void,
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
    if (err.message?.includes('permission_denied') || err.message?.includes('Permission denied')) {
      if (onPermissionError) {
        onPermissionError(err.message);
      }
    }
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
 * Directly updates tree data to Firebase Realtime Database via both direct REST API and SDK
 * This ensures immediate direct write to https://vanshavali-heritage-tree-default-rtdb.firebaseio.com
 */
export async function pushMasterTreeToCloud(
  nodes: MemberNode[],
  links: RelationshipLink[],
  room: string = MASTER_TREE_ROOM
): Promise<{ success: boolean; error?: string }> {
  const cleanNodes = sanitizeForFirebase(nodes);
  const cleanLinks = sanitizeForFirebase(links);
  const payload = {
    nodes: cleanNodes,
    links: cleanLinks,
    lastUpdated: Date.now()
  };

  let writeSuccess = false;
  let errorDetail = '';

  // 1. Direct REST PUT to Firebase Realtime Database
  // Immediately writes directly to https://vanshavali-heritage-tree-default-rtdb.firebaseio.com/trees/{room}.json
  try {
    const rtdbUrl = `${firebaseConfig.databaseURL.replace(/\/$/, '')}/trees/${room}.json`;
    const res = await fetch(rtdbUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      writeSuccess = true;
    } else {
      const errText = await res.text();
      errorDetail = `Firebase REST HTTP ${res.status}: ${errText}`;
      console.warn('Direct Firebase REST write status:', res.status, errText);
    }
  } catch (err: any) {
    errorDetail = err?.message || String(err);
    console.warn('Direct Firebase REST write warning:', err);
  }

  // 2. Firebase JS SDK set() for live WebSocket propagation to all open client sessions
  try {
    const treeRef = ref(database, `trees/${room}`);
    await set(treeRef, payload);
    writeSuccess = true;
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn('Firebase SDK set notice:', msg);
    if (!errorDetail) errorDetail = msg;
  }

  // 3. Keep local server persistence in sync as secondary backup
  try {
    fetch('/api/sync-tree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch {}

  if (writeSuccess) {
    return { success: true };
  }
  return { success: false, error: errorDetail };
}

/**
 * Fetches current tree directly from Firebase Realtime Database
 */
export async function fetchFirebaseMasterTree(room: string = MASTER_TREE_ROOM): Promise<{ nodes: MemberNode[]; links: RelationshipLink[]; lastUpdated?: number } | null> {
  try {
    const rtdbUrl = `${firebaseConfig.databaseURL.replace(/\/$/, '')}/trees/${room}.json`;
    const res = await fetch(rtdbUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.nodes) && data.nodes.length > 0) {
        return {
          nodes: data.nodes,
          links: Array.isArray(data.links) ? data.links : [],
          lastUpdated: data.lastUpdated
        };
      }
    }
  } catch (err) {
    console.warn('Direct Firebase RTDB fetch error:', err);
  }
  return null;
}

/**
 * Fetches current tree from local server sync endpoint
 */
export async function fetchServerMasterTree(): Promise<{ nodes: MemberNode[]; links: RelationshipLink[]; lastUpdated: number } | null> {
  try {
    const res = await fetch('/api/sync-tree');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.nodes) && data.nodes.length > 0) {
        return data;
      }
    }
  } catch {}
  return null;
}


/**
 * Tests live connection to Firebase Realtime Database
 */
export async function testFirebaseConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    await ensureFirebaseAuth().catch(() => {});
    const probeRef = ref(database, 'trees/probe');
    await set(probeRef, { ping: Date.now() });
    return { ok: true, message: 'Firebase Realtime Database is connected and write permissions are active!' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Permission denied or network failure' };
  }
}
