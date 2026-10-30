// Post-build: writes dist/sw.js precaching every built file (offline play), versioned by content hash.
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path'; import { createHash } from 'node:crypto';
const dist = 'dist'; const files = [];
const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); });
walk(dist);
const list = files.map((f) => relative(dist, f)).filter((f) => f !== 'sw.js' && f !== 'art.html' && !/^og-image\./.test(f) && !/^screenshots\//.test(f) && !['robots.txt', 'sitemap.xml'].includes(f) && !/assets\/art-/.test(f));
const h = createHash('sha256'); list.forEach((f) => h.update(f + readFileSync(join(dist, f)).length)); const v = h.digest('hex').slice(0, 10);
// Caches are namespaced 'capy-mahjong-<hash>' and only OUR old caches are deleted: the github.io origin is shared with other sites.
// Legacy caches from earlier builds were named 'capy-<10 hex>'. Requests outside this app's scope are left to the network.
writeFileSync(join(dist, 'sw.js'), `const P='capy-mahjong-',C=P+'${v}';const F=${JSON.stringify(['./', ...list])};
const ours=k=>k!==C&&(k.startsWith(P)||/^capy-[0-9a-f]{10}$/.test(k));
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(ours).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET'||!q.url.startsWith(self.registration.scope))return;e.respondWith(caches.open(C).then(c=>c.match(q,{ignoreSearch:true,ignoreVary:true})).then(r=>r||fetch(q).then(res=>{if(res.ok){const cl=res.clone();caches.open(C).then(c=>c.put(q,cl))}return res}).catch(()=>caches.open(C).then(c=>c.match('./')))))});`);
console.log(`sw.js: ${list.length + 1} files, version ${v}`);
