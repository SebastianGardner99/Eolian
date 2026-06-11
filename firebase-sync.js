/**
 * firebase-sync.js — Firestore glue for the Aeolian Atlas.
 *
 * Loaded as <script type="module">. Exposes window.AtlasSync once ready,
 * then dispatches CustomEvent('atlassync:ready') on window.
 *
 * If the config is missing or the network is unreachable, the module
 * logs one warning and exits — the rest of the app continues unaffected.
 */

import { initializeApp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  initializeFirestore, persistentLocalCache,
  collection, addDoc, onSnapshot, serverTimestamp, query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

(async function _atlasSync() {
  try {
    if (!firebaseConfig?.apiKey) {
      console.warn('[atlas-sync] firebase-config.js has no apiKey — shared sites disabled.');
      return;
    }

    const app = initializeApp(firebaseConfig);

    // persistentLocalCache replaces enableIndexedDbPersistence in SDK 10.
    // It handles multi-tab automatically — no failed-precondition possible.
    const db  = initializeFirestore(app, { localCache: persistentLocalCache() });
    const col = collection(db, 'atlas_user_sites');

    // Write a new community site. Returns { id, pending } where pending=true
    // means the write is queued locally and will sync when connectivity returns.
    async function addSite(data) {
      const ref = await addDoc(col, {
        name:      String(data.name      ?? '').slice(0, 100),
        lat:       Number(data.lat),
        lng:       Number(data.lng),
        island:    String(data.island    ?? ''),
        type:      String(data.type      ?? 'snorkel'),
        otherType: data.otherType ? String(data.otherType).slice(0, 60) : null,
        depth:     data.depth != null ? Number(data.depth) : null,
        access:    String(data.access    ?? 'shore'),
        notes:     String(data.notes     ?? '').slice(0, 500),
        author:    String(data.author    ?? 'Anonymous').slice(0, 60),
        createdAt: serverTimestamp()
      });
      return { id: ref.id, pending: !navigator.onLine };
    }

    // Register a snapshot listener. cb(docs, meta) is called on every change,
    // including metadata changes (hasPendingWrites, fromCache).
    function onSitesChanged(cb) {
      const q = query(col, orderBy('createdAt', 'asc'));
      onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snap) => {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          cb(docs, {
            hasPendingWrites: snap.docs.some((d) => d.metadata.hasPendingWrites),
            fromCache:        snap.metadata.fromCache
          });
        },
        (err) => console.warn('[atlas-sync] Snapshot error:', err.message)
      );
    }

    window.AtlasSync = { addSite, onSitesChanged };
    window.dispatchEvent(new CustomEvent('atlassync:ready'));

  } catch (err) {
    console.warn('[atlas-sync] Init failed:', err.message);
  }
})();
