/**
 * firebase-sync.js — Firestore + Auth glue for the Aeolian Atlas.
 *
 * Loaded as <script type="module">. Signs in anonymously, then exposes
 * window.AtlasSync and dispatches CustomEvent('atlassync:ready').
 *
 * If config is missing, auth fails, or network is unreachable on first load,
 * the module logs one warning and exits — the rest of the app is unaffected.
 */

import { initializeApp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  initializeFirestore, persistentLocalCache,
  collection, addDoc, deleteDoc, doc,
  onSnapshot, serverTimestamp, query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

(async function _atlasSync() {
  try {
    if (!firebaseConfig?.apiKey) {
      console.warn('[atlas-sync] firebase-config.js has no apiKey — shared sites disabled.');
      return;
    }

    const app  = initializeApp(firebaseConfig);
    // persistentLocalCache handles multi-tab and offline writes automatically.
    const db   = initializeFirestore(app, { localCache: persistentLocalCache() });
    const col  = collection(db, 'atlas_user_sites');
    const auth = getAuth(app);

    // Sign in anonymously; uid used to gate per-owner deletes.
    // On first load without network this will fail → atlassync:ready never fires
    // → add-site button stays disabled (same UX as Firebase-unavailable).
    signInAnonymously(auth).catch((err) => {
      console.warn('[atlas-sync] Anonymous sign-in failed:', err.message);
    });

    let authResolved = false;
    onAuthStateChanged(auth, (user) => {
      if (authResolved || !user) return;
      authResolved = true;

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
          ownerUid:  user.uid,
          createdAt: serverTimestamp()
        });
        return { id: ref.id, pending: !navigator.onLine };
      }

      function deleteSite(docId) {
        return deleteDoc(doc(db, 'atlas_user_sites', docId));
      }

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

      window.AtlasSync = { uid: user.uid, addSite, deleteSite, onSitesChanged };
      window.dispatchEvent(new CustomEvent('atlassync:ready'));
    });

  } catch (err) {
    console.warn('[atlas-sync] Init failed:', err.message);
  }
})();
