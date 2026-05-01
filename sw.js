// Toolverse custom service worker
// Wraps Angular's ngsw-worker.js and adds Web Share Target POST handling.
importScripts('./ngsw-worker.js');

const SHARE_DB = 'tv-shared';
const SHARE_STORE = 'files';
const SHARE_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SHARE_DB, SHARE_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SHARE_STORE)) {
        db.createObjectStore(SHARE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function storeShared(payload) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SHARE_STORE, 'readwrite');
    const store = tx.objectStore(SHARE_STORE);
    store.clear();
    store.put(payload, 'payload');
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname.endsWith('/share')) {
    event.respondWith(handleShare(event.request, url));
  }
});

async function handleShare(request, url) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files').filter(f => f instanceof File);
    const text = formData.get('text') || '';
    const title = formData.get('title') || '';
    const sharedUrl = formData.get('url') || '';
    await storeShared({
      files: await Promise.all(files.map(async f => ({
        name: f.name, type: f.type, size: f.size, buffer: await f.arrayBuffer(),
      }))),
      text, title, url: sharedUrl, ts: Date.now(),
    });
  } catch (e) {
    // ignore — still redirect to /share so the UI can show an error
  }
  // Redirect (303) so the browser does a GET to the share landing page
  return Response.redirect('share?from=share-target', 303);
}
