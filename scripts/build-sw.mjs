// Post-build: writes dist/sw.js precaching every built file (offline play), versioned by content hash.
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path'; import { createHash } from 'node:crypto';
const dist = 'dist'; const files = [];
const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); });
walk(dist);
const list = files.map((f) => relative(dist, f)).filter((f) => f !== 'sw.js' && f !== 'art.html' && !/^og-image\./.test(f) && !/^screenshots\//.test(f) && !['robots.txt', 'sitemap.xml'].includes(f) && !/assets\/art-/.test(f));
const h = createHash('sha256'); list.forEach((f) => h.update(f + readFileSync(join(dist, f)).length)); const v = h.digest('hex').slice(0, 10);
writeFileSync(join(dist, 'sw.js'), `const C='capy-${v}';const F=${JSON.stringify(['./', ...list])};
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request,{ignoreSearch:true,ignoreVary:true}).then(r=>r||fetch(e.request).then(res=>{if(res.ok&&new URL(e.request.url).origin===location.origin){const cl=res.clone();caches.open(C).then(c=>c.put(e.request,cl))}return res}).catch(()=>caches.match('./'))))});`);
console.log(`sw.js: ${list.length + 1} files, version ${v}`);
