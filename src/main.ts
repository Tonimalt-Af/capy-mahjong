import '@fontsource/fredoka/latin-400.css'; import '@fontsource/fredoka/latin-600.css'; import '@fontsource/fredoka/latin-700.css';
import './style.css';
import { KINDS, KIND_BY_ID, tileFace, capySvg, backSvg, faceSvg, type Theme } from './tiles';
import { deal, isFree, matches, findHint, reshuffle, type Tile } from './engine';
import { LAYOUTS, LEVELS, WORLDS, stars as starCount, score as scoreOf, type Level } from './levels';
import { load, save, reset, unlocked, totalStars, type Run } from './storage';
import { Sound } from './audio';
import { Fx } from './fx';
import { dailyLevel, endlessLevel, zenLevel, recordDaily, recordLate, missedDays, canReplay, REPLAY_DAYS, liveStreak, dayKey, frDate, OUTFITS, THEMES, BACKS, owns, buy, carrotReward, DIFFS, LEVEL_LEGEND, ACHIEVEMENTS, checkAchievements, type PlayLevel, type Diff, type Item, type Shelf } from './meta';

const S = load();
const snd = new Sound(); snd.sfxOn = S.settings.sfx; snd.musicOn = S.settings.music;
const fx = new Fx();
const $ = (id: string) => document.getElementById(id)!;
const h = (html: string) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild as HTMLElement; };
const STAR = (on: boolean, cls = '') => `<svg class="star ${on ? 'on' : ''} ${cls}" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z"/></svg>`;
const ICON: Record<string, string> = {
  hint: '<path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3zM9.5 18.5h5M10.5 21h3"/>',
  undo: '<path d="M9 7L4 12l5 5M4 12h10a6 6 0 0 1 0 12h-2" transform="translate(0 -3)"/>',
  shuffle: '<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/>',
  pause: '<path d="M8 5v14M16 5v14"/>', home: '<path d="M3 11l9-7 9 7v9H15v-6H9v6H3z"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  share: '<path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  help: '<circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>', map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14 M15 6v14"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', inf: '<path d="M7 9a3 3 0 1 0 0 6c2.5 0 4-6 10-6a3 3 0 1 1 0 6c-6 0-7.5-6-10-6z"/>', leaf: '<path d="M5 19C5 10 11 5 20 4c0 9-5 15-14 15zM5 19l7-7"/>', bag: '<path d="M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0"/>', trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v3M8 20h8"/>', chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', check: '<path d="M5 12l5 5 9-10"/>', retry: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/>', next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};
/** Carrot currency icon (sticker style) */
const CARROT = (cls = '') => `<svg class="carrot ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 9.5 C17 12 9 21 5 21.5 C4 21.6 3.4 21 3.5 20 C4 16 12 7 14.5 9.5Z" fill="#FF8A3D" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 15.5l2 1M10.5 12.5l2 1.2M6.5 18.6l1.4.8" stroke="#D9611C" stroke-width="1.3" stroke-linecap="round"/><path d="M14.2 9.6C14 7 15.5 4.5 17.5 3.5c-.2 2 0 3.5-1 5 1.4-1.2 3.4-1.6 5-1-1 1.6-2.6 2.8-5 3" fill="#3FAE6A" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
const ic = (n: string) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const persist = () => save(S);
const buzz = (ms: number) => { if (S.settings.vibrate) navigator.vibrate?.(ms); };

// ---------- static shell
document.body.insertAdjacentHTML('afterbegin', '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs id="tiledefs"></defs></svg>');
/** (Re)build the <symbol> for every tile face with the current tile set. */
function buildDefs(theme: Theme = S.theme) { document.getElementById('tiledefs')!.innerHTML = KINDS.map((k) => `<symbol id="k-${k.id}" viewBox="0 0 100 130">${tileFace(k.id, theme)}</symbol>`).join(''); }
buildDefs();
const app = $('app');
app.innerHTML = `
<section class="view" id="v-home"></section>
<section class="view" id="v-map"></section>
<section class="view" id="v-modes"></section>
<section class="view" id="v-coll"></section>
<section class="view" id="v-game">
  <header class="hud"><button class="iconbtn" id="g-pause" aria-label="Pause">${ic('pause')}</button><div class="lvl" id="g-lvl"></div>
    <div class="chips"><span class="chip combo" id="g-combo"></span><span class="chip leg" id="g-leg" role="status"></span><span class="chip" id="g-pairs"></span><span class="chip" id="g-time">0:00</span><span class="chip" id="g-score">0</span></div></header>
  <main class="stage" id="stage"><div class="board" id="board"></div></main>
  <nav class="bar">
    <button class="btn" id="g-hint">${ic('hint')}<span>Indice</span><b class="badge" id="g-hint-n"></b></button>
    <button class="btn" id="g-undo">${ic('undo')}<span>Annuler</span><b class="badge" id="g-undo-n"></b></button>
    <button class="btn" id="g-shuf">${ic('shuffle')}<span>Mélanger</span><b class="badge" id="g-shuf-n"></b></button>
  </nav>
</section>
<div class="ov" id="ov"><div class="card" id="card"></div></div>
<div class="rotate" id="rotate"><div class="rot-art">${capySvg('agrume')}<div class="phone"></div></div><h2>Tourne ton téléphone</h2><p>Mahjong Capybaras se joue à l'horizontale.</p></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`;

function toast(msg: string, ms = 1500) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(+(t.dataset.h ?? 0)); t.dataset.h = String(setTimeout(() => t.classList.remove('show'), ms)); }
let view = 'home';
function show(v: string, world = -1) {
  view = v; document.querySelectorAll('.view').forEach((e) => e.classList.toggle('active', e.id === `v-${v}`));
  document.body.dataset.view = v; closeOv();
  if (world >= 0) setWorld(world);
}
function setWorld(w: number) { const W = WORLDS[w]; document.body.style.setProperty('--w1', W.bg[0]); document.body.style.setProperty('--w2', W.bg[1]); document.body.style.setProperty('--acc', W.accent); document.body.dataset.world = W.id; snd.music(w); }
// first user gesture: unlock audio, try fullscreen + landscape lock on touch devices
let unlockedAudio = false;
addEventListener('pointerdown', () => { if (!unlockedAudio) { unlockedAudio = true; snd.ensure(); const w = WORLDS.findIndex((x) => x.id === document.body.dataset.world); snd.music(Math.max(0, w)); } }, { capture: true });
async function goLandscape() {
  if (!matchMedia('(pointer:coarse)').matches) return;
  try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); } catch { /* not allowed */ }
  try { await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'); } catch { /* unsupported (iOS) – rotate screen covers it */ }
}

// ---------- decor per world (pure SVG, behind everything)
const decor = document.createElement('div'); decor.className = 'decor'; document.body.prepend(decor);
decor.innerHTML = `<svg viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice"><path class="d1" d="M0 260 C200 200 380 300 600 250 C820 200 1000 300 1200 240 C1380 190 1500 250 1600 230 V400 H0Z"/><path class="d2" d="M0 320 C240 280 420 350 700 310 C960 270 1160 350 1400 300 C1500 285 1560 300 1600 295 V400 H0Z"/></svg>
<div class="steam"><i></i><i></i><i></i></div><div class="snow">${Array.from({ length: 24 }, (_, i) => `<i style="left:${(i * 41) % 100}%;animation-delay:${-(i * 0.7) % 9}s;animation-duration:${7 + (i % 5)}s"></i>`).join('')}</div>`;

// ---------- HOME
/** Priciest shop item the player can buy right now (drives the "you can afford…" nudges). */
function affordable(): Item | null {
  const all: [Shelf, Item][] = [...OUTFITS.map((o): [Shelf, Item] => ['o', o]), ...THEMES.map((o): [Shelf, Item] => ['t', o]), ...BACKS.map((o): [Shelf, Item] => ['b', o])];
  const c = all.filter(([sh, it]) => !it.legend && it.price > 0 && it.price <= S.carrots && !owns(S, sh, it.id)).sort((a, b) => b[1].price - a[1].price);
  return c[0]?.[1] ?? null;
}
/** Saved in-progress board, if it still matches the current layouts (and a daily is still today's). */
function validRun(): Run | null {
  const r = S.run; if (!r || !LAYOUTS[r.level.layout] || r.kinds.length !== LAYOUTS[r.level.layout].make().length || r.removed.length >= r.kinds.length) return null;
  if (r.level.mode === 'daily' && !r.level.late && r.level.date !== dayKey()) return null; return r;
}
function snapshot() {
  if (!g || g.over) return;
  S.run = { level: g.level, kinds: g.tiles.map((t) => t.kind), removed: g.tiles.filter((t) => t.removed).map((t) => t.id), history: g.history, t: elapsed(), hints: g.hints, shuffles: g.shuffles, undos: g.undos, undoBonus: g.undoBonus, score: g.score, legends: g.legends, maxCombo: g.maxCombo }; persist();
}
const base = () => location.origin + location.pathname;
async function share(text: string, url: string) {
  snd.play('click');
  if (navigator.share) { try { await navigator.share({ title: 'Mahjong Capybaras', text, url }); } catch { /* cancelled */ } return; }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); toast('Copié ! Colle-le à tes amis', 2200); } catch { toast('Partage indisponible'); }
}
function renderHome() {
  const tot = totalStars(S); const aff = affordable(); const run = validRun(); const today = dayKey(); const streak = liveStreak(S.stats, today);
  $('v-home').innerHTML = `
  <div class="home"><button class="wallet" id="h-wallet" aria-label="${S.carrots} carottes${aff ? ', un achat est possible' : ''}">${CARROT()}<b>${S.carrots}</b>${aff ? '<i class="dot" aria-hidden="true"></i>' : ''}</button><div class="corner"><button class="iconbtn" id="h-help" aria-label="Comment jouer">${ic('help')}</button><button class="iconbtn" id="h-settings" aria-label="Réglages">${ic('gear')}</button></div>
    <div class="home-l">
      <h1 class="logo"><span>Mahjong</span><span class="big">Capybaras</span></h1>
      <p class="tag">Associe les capybaras, détends-toi au bord de l'onsen.</p>
      <div class="menu">
        <button class="btn primary xl ${run ? 'resume' : ''}" id="h-play">${ic('play')}<span>${run ? 'Reprendre' : tot ? 'Continuer' : 'Jouer'}${run ? `<small>${run.level.mode === 'level' ? `Niveau ${run.level.n + 1}` : run.level.mode === 'daily' ? (run.level.late ? 'Rattrapage' : 'Défi du jour') : run.level.mode === 'zen' ? 'Zen' : `Infini · manche ${run.level.round! + 1}`} · ${(run.kinds.length - run.removed.length) / 2} paires</small>` : ''}</span></button>
        <button class="btn" id="h-levels">${ic('map')}<span>Niveaux</span></button>
        <button class="btn" id="h-modes">${ic('cal')}<span>Modes</span>${S.stats.dailyDone.includes(today) ? '' : streak ? `<b class="dot streak" aria-label="Défi du jour à faire, série de ${streak} jours en jeu">🔥${streak}</b>` : '<b class="dot" aria-label="Défi du jour disponible"></b>'}</button>
        <button class="btn" id="h-coll">${ic('bag')}<span>Collection</span></button>
        <div class="total">${STAR(true)} ${tot} / ${LEVELS.length * 3}</div>
      </div>
    </div>
    <div class="home-r" aria-hidden="true">
      <div class="hero">
        <div class="pool"></div>
        <div class="hero-capy bob">${capySvg(S.outfit)}</div>
        <div class="hero-capy small bob2">${capySvg(S.outfit === 'agrume' ? 'serviette' : 'agrume')}</div>
        <div class="hero-friend f-cat bob2">${capySvg('chat')}</div><div class="hero-friend f-bear bob">${capySvg('ours')}</div>
        <div class="hero-tiles">${['fraise-3', 'canard', 'feuille-7'].map((k, i) => `<div class="mini t${i}"><svg viewBox="0 0 100 130"><use href="#k-${k}"/></svg></div>`).join('')}<div class="mini t3">${backSvg()}</div></div>
        <div class="steam hero-steam"><i></i><i></i><i></i></div>
      </div>
    </div>
  </div>`;
  $('h-play').onclick = () => { snd.play('click'); void goLandscape(); if (run) { startPlay(run.level, run); return; } const n = LEVELS.findIndex((l) => !(S.stars[l.n] > 0)); if (!S.seenHowTo) { howTo(() => startLevel(Math.max(0, n))); } else startLevel(n < 0 ? LEVELS.length - 1 : n); };
  $('h-levels').onclick = () => { snd.play('click'); void goLandscape(); renderMap(); show('map'); };
  $('h-settings').onclick = () => { snd.play('click'); settings(); };
  $('h-help').onclick = () => { snd.play('click'); howTo(); };
  $('h-modes').onclick = () => { snd.play('click'); void goLandscape(); renderModes(); show('modes'); };
  $('h-coll').onclick = () => { snd.play('click'); renderColl(); show('coll'); };
  $('h-wallet').onclick = () => { snd.play('click'); renderColl('outfits'); show('coll'); };
}

// ---------- MODES
function renderModes() {
  const today = dayKey(); const d = dailyLevel(today); const done = S.stats.dailyDone.includes(today); const streak = liveStreak(S.stats, today);
  $('v-modes').innerHTML = `<header class="maphead"><button class="iconbtn" id="mo-back" aria-label="Accueil">${ic('back')}</button><h2 class="vtitle">Modes de jeu</h2><div class="hgroup"><button class="btn calbtn" id="mo-cal">${ic('cal')}<span>Calendrier</span></button><div class="chip">🔥 ${streak}</div></div></header>
  <div class="modes">
    <button class="mode daily ${done ? 'done' : ''}" id="mo-daily"><div class="m-art">${capySvg('capydindon')}</div><h3>Défi du jour</h3><p>${d.title.replace('Défi du ', '')} · ${LAYOUTS[d.layout].name} · ${LAYOUTS[d.layout].make().length} tuiles</p><span class="week">${week()}</span><span class="m-tag">${done ? `${ic('check')} Réussi · série ${streak}` : 'Capydindon doré garanti'}</span><span class="m-go">${ic('play')}Jouer</span></button>
    <button class="mode endless" id="mo-endless"><div class="m-art">${capySvg('canard')}</div><h3>Infini</h3><p>Des plateaux de plus en plus grands, jusqu'où iras-tu&nbsp;?</p><span class="m-tag">Record : ${S.stats.endlessBest} manche${S.stats.endlessBest > 1 ? 's' : ''}</span><span class="m-go">${ic('play')}Jouer</span></button>
    <button class="mode zen" id="mo-zen"><div class="m-art">${capySvg('lotus')}</div><h3>Zen</h3><p>Sans chrono, aides illimitées, 4 difficultés et plateaux en forme.</p><span class="m-tag">${S.stats.zenWon} plateau${S.stats.zenWon > 1 ? 'x' : ''} vidé${S.stats.zenWon > 1 ? 's' : ''}</span><span class="m-go">${ic('play')}Jouer</span></button>
  </div>`;
  $('mo-back').onclick = () => { snd.play('click'); renderHome(); show('home'); };
  $('mo-cal').onclick = () => { snd.play('click'); calendar(); };
  $('mo-daily').onclick = () => { snd.play('click'); startPlay(dailyLevel(dayKey())); };
  $('mo-endless').onclick = () => { snd.play('click'); endlessSeed = (Math.random() * 2 ** 31) >>> 0; startPlay(endlessLevel(0, endlessSeed)); };
  $('mo-zen').onclick = () => { snd.play('click'); zenPicker(); };
}
/** Last 7 days of the daily challenge (Mon→Sun style strip, today last). */
function week() {
  const t = new Date(); const L = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - 6 + i); const k = dayKey(d); const ok = S.stats.dailyDone.includes(k);
    const late = S.stats.dailyLate.includes(k);
    return `<i class="${ok || late ? 'ok' : ''} ${late ? 'late' : ''} ${!ok && !late && i < 6 ? 'miss' : ''} ${i === 6 ? 'today' : ''}" title="${frDate(k)}">${ok || late ? ic('check') : L[d.getDay()]}</i>`; }).join('');
}
const newSeed = () => (Math.random() * 2 ** 31) >>> 0;
function zenPicker() {
  openOv(`<h2>Zen</h2><p class="ptitle">Choisis la difficulté</p><div class="diffs">${DIFFS.map((d, i) => `<button class="diff ${S.diff === d.id ? 'on' : ''}" data-d="${d.id}"><span class="lv">${'●'.repeat(i + 1)}${'○'.repeat(3 - i)}</span><b>${d.name}</b><small>${d.desc}</small></button>`).join('')}</div>
    <div class="row"><button class="btn" id="z-x">Retour</button></div>`, 'zenpick');
  document.querySelectorAll<HTMLButtonElement>('.diff').forEach((b) => (b.onclick = () => { snd.play('click'); S.diff = b.dataset.d as Diff; persist(); startPlay(zenLevel(newSeed(), S.diff)); }));
  $('z-x').onclick = () => { snd.play('click'); closeOv(); };
}
let endlessSeed = 1;

// ---------- COLLECTION (shop: outfits / tile sets & backgrounds · achievements · stats)
let collTab = 'outfits';
const equipped = (shelf: Shelf, id: string) => (shelf === 'o' ? S.outfit : shelf === 't' ? S.theme : S.bg) === id;
function itemCard(shelf: Shelf, it: Item) {
  const own = owns(S, shelf, it.id, S.stats.legends); const on = equipped(shelf, it.id);
  const art = shelf === 'o' ? `<div class="o-art">${capySvg(it.id)}</div>`
    : shelf === 't' ? `<div class="t-art">${['agrume-3', 'fraise-5', 'feuille-7', 'bonnet'].map((k) => faceSvg(k, 34, 44, it.id as Theme)).join('')}</div>`
    : `<div class="b-art bg-${it.id}"><i></i><i></i><i></i></div>`;
  const tag = on ? `<span class="own on">${ic('check')} ${shelf === 'o' ? 'Portée' : 'Choisi'}</span>` : own ? '<span class="own">Choisir</span>' : it.legend ? '<span class="price leg">À trouver en jeu</span>' : `<span class="price ${S.carrots >= it.price ? 'ok' : ''}">${CARROT()} ${it.price}</span>`;
  return `<button class="item ${own ? '' : 'locked'} ${!own && !it.legend && S.carrots >= it.price ? 'can' : ''} ${on ? 'on' : ''} ${it.legend ? 'legend' : ''}" data-s="${shelf}" data-i="${it.id}" aria-label="${it.name}${own ? '' : it.legend ? ' (légendaire)' : ` (${it.price} carottes)`}">${art}<b>${it.name}</b>${tag}</button>`;
}
const MO = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
/** Month calendar of dailies. Missed days of the last REPLAY_DAYS are buttons: replay them (no streak effect). */
function calHtml(off = 0) {
  const t = new Date(); const today = dayKey(t); const base = new Date(t.getFullYear(), t.getMonth() + off, 1); const y = base.getFullYear(), m = base.getMonth();
  const first = (base.getDay() + 6) % 7; const n = new Date(y, m + 1, 0).getDate();
  let cells = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => `<i class="hd">${d}</i>`).join('') + '<i></i>'.repeat(first);
  for (let d = 1; d <= n; d++) {
    const k = dayKey(new Date(y, m, d)); const lbl = frDate(k);
    if (S.stats.dailyDone.includes(k)) cells += `<i class="ok ${k === today ? 'today' : ''}" title="${lbl} : réussi">${ic('check')}</i>`;
    else if (S.stats.dailyLate.includes(k)) cells += `<i class="ok late" title="${lbl} : rattrapé">${ic('check')}</i>`;
    else if (k === today) cells += `<button class="day today" data-day="${k}" aria-label="Jouer le défi du jour">${d}</button>`;
    else if (canReplay(S.stats, k, today)) cells += `<button class="day miss" data-day="${k}" aria-label="Rattraper le défi du ${lbl}">${d}</button>`;
    else cells += `<i class="${k > today ? 'fut' : 'old'}">${d}</i>`;
  }
  const pre = `${y}-${String(m + 1).padStart(2, '0')}`; const cnt = S.stats.dailyDone.filter((k) => k.startsWith(pre)).length + S.stats.dailyLate.filter((k) => k.startsWith(pre)).length;
  const canPrev = off > -2 && dayKey(new Date(y, m, 0)) >= missedDaysEdge();
  return `<div class="cal"><h3><button class="calnav" data-off="${off - 1}" ${canPrev ? '' : 'disabled'} aria-label="Mois précédent">‹</button><span>${MO[m]} <small>${cnt} / ${n}</small></span><button class="calnav" data-off="${off + 1}" ${off < 0 ? '' : 'disabled'} aria-label="Mois suivant">›</button></h3><div class="calgrid">${cells}</div></div>`;
}
const missedDaysEdge = () => { const t = new Date(); return dayKey(new Date(t.getFullYear(), t.getMonth(), t.getDate() - REPLAY_DAYS)); };
function playDay(k: string) { snd.play('click'); void goLandscape(); closeOv(); startPlay(k === dayKey() ? dailyLevel(k) : dailyLevel(k, true)); }
function bindCal(root: HTMLElement, rerender: (off: number) => void) {
  root.querySelectorAll<HTMLButtonElement>('.cal .day').forEach((b) => (b.onclick = () => playDay(b.dataset.day!)));
  root.querySelectorAll<HTMLButtonElement>('.cal .calnav').forEach((b) => (b.onclick = () => { snd.play('click'); rerender(+b.dataset.off!); }));
}
let calOff = 0;
function calendar(off = 0) {
  const miss = missedDays(S.stats).length;
  openOv(`<h2>Calendrier des défis</h2>${calHtml(off)}<p class="calkey"><span><i class="k ok"></i>réussi le jour même</span><span><i class="k late"></i>rattrapé</span><span><i class="k miss"></i>à rattraper</span></p>
    <p class="calnote">${miss ? `Touche un jour manqué pour le rattraper : +20 carottes, sans effet sur la série 🔥.` : 'Aucun défi à rattraper sur les 30 derniers jours. Bravo !'}</p><div class="row"><button class="btn" id="cal-x">${ic('back')}<span>Retour</span></button></div>`, 'calov');
  bindCal($('card'), calendar); $('cal-x').onclick = () => { snd.play('click'); closeOv(); };
}
function renderColl(tab = collTab) {
  collTab = tab; const tot = totalStars(S); const st = S.stats;
  const tabs = [['outfits', 'Tenues', 'bag'], ['decor', 'Décors', 'leaf'], ['ach', 'Succès', 'trophy'], ['stats', 'Stats', 'chart']];
  let body = '';
  if (tab === 'outfits') body = `<div class="items">${OUTFITS.map((o) => itemCard('o', o)).join('')}</div>`;
  else if (tab === 'decor') body = `<h3 class="shelf">Jeux de tuiles</h3><div class="items wide">${THEMES.map((o) => itemCard('t', o)).join('')}</div><h3 class="shelf">Fonds de plateau</h3><div class="items wide">${BACKS.map((o) => itemCard('b', o)).join('')}</div>`;
  else if (tab === 'ach') {
    body = `<div class="achs">${ACHIEVEMENTS.map((a) => { const ok = S.ach.includes(a.id); return `<div class="ach ${ok ? 'ok' : ''}"><div class="a-art">${capySvg(a.icon)}</div><div><b>${a.name}</b><p>${a.desc}</p></div>${ok ? `<span class="a-check">${ic('check')}</span>` : ''}</div>`; }).join('')}</div>`;
  } else {
    const cells: [string, string][] = [['Parties gagnées', `${st.won} / ${st.played}`], ['Taux de réussite', st.played ? `${Math.round((st.won / st.played) * 100)} %` : '—'], ['Paires associées', String(st.pairs)], ['Temps de jeu', st.seconds >= 3600 ? `${Math.floor(st.seconds / 3600)} h ${Math.floor((st.seconds % 3600) / 60)} min` : `${Math.floor(st.seconds / 60)} min`],
      ['Meilleur combo', st.bestCombo ? `×${st.bestCombo}` : '—'], ['Niveaux 3 étoiles', String(Object.values(S.stars).filter((x) => x === 3).length)], ['Étoiles', `${tot} / 90`], ['Plus rapide (36+)', st.fastest ? fmt(st.fastest) : '—'],
      ['Défis réussis', String(st.dailyDone.length)], ['Meilleure série', `${st.bestStreak} j`], ['Record Infini', `${st.endlessBest} manches`], ['Plateaux zen', String(st.zenWon)],
      ['Capydindons', String(st.legends)], ['Carottes gagnées', String(st.carrotsEarned)]];
    body = `<div class="statwrap"><div class="statgrid">${cells.map(([k, v]) => `<div class="sc"><span>${k}</span><b>${v}</b></div>`).join('')}</div>${calHtml(calOff)}</div>`;
  }
  const chip = tab === 'ach' ? `${ic('trophy')} ${S.ach.length}/${ACHIEVEMENTS.length}` : tab === 'stats' ? `${STAR(true)} ${tot}` : `${CARROT()} <b id="c-car">${S.carrots}</b>`;
  $('v-coll').innerHTML = `<header class="maphead"><button class="iconbtn" id="c-back" aria-label="Accueil">${ic('back')}</button>
    <div class="tabs" role="tablist">${tabs.map(([id, n, i]) => `<button class="tab ${id === tab ? 'on' : ''}" role="tab" aria-selected="${id === tab}" data-t="${id}">${ic(i)}${n}</button>`).join('')}</div>
    <div class="chip ${tab === 'outfits' || tab === 'decor' ? 'carrots' : ''}">${chip}</div></header><div class="collbody">${tab === 'outfits' || tab === 'decor' ? '<p class="shopnote">Gagne des carottes en jouant (niveaux, défis, zen…). Tout est gratuit, pour toujours.</p>' : ''}${body}</div>`;
  $('c-back').onclick = () => { snd.play('click'); renderHome(); show('home'); };
  document.querySelectorAll<HTMLButtonElement>('#v-coll .tab').forEach((b) => (b.onclick = () => { snd.play('click'); renderColl(b.dataset.t); }));
  document.querySelectorAll<HTMLButtonElement>('#v-coll .item').forEach((b) => (b.onclick = () => shopTap(b.dataset.s as Shelf, b.dataset.i!)));
  if (tab === 'stats') bindCal($('v-coll'), (o) => { calOff = o; renderColl('stats'); });
}
function equip(shelf: Shelf, id: string) {
  if (shelf === 'o') S.outfit = id; else if (shelf === 't') { S.theme = id as Theme; buildDefs(); } else { S.bg = id; document.body.dataset.bg = id; }
  persist();
}
function shopTap(shelf: Shelf, id: string) {
  const list = shelf === 'o' ? OUTFITS : shelf === 't' ? THEMES : BACKS; const it = list.find((x) => x.id === id)!;
  if (owns(S, shelf, id, S.stats.legends)) { equip(shelf, id); snd.play('select'); renderColl(); return; }
  if (it.legend) { snd.play('invalid'); toast('Associe le capydindon doré en jeu pour l\'obtenir'); return; }
  if (S.carrots < it.price) { snd.play('invalid'); toast(`Il te manque ${it.price - S.carrots} carottes`); return; }
  snd.play('click');
  const art = shelf === 'o' ? capySvg(id) : shelf === 't' ? `<div class="t-art big">${['agrume-3', 'fraise-5', 'feuille-7'].map((k) => faceSvg(k, 54, 70, id as Theme)).join('')}</div>` : `<div class="b-art big bg-${id}"><i></i><i></i><i></i></div>`;
  openOv(`<h2>${it.name}</h2><div class="capy-s buyart">${art}</div><p>Échanger <b>${it.price}</b> carottes ? Il t'en restera ${S.carrots - it.price}.</p>
    <div class="row"><button class="btn" id="b-no">Plus tard</button><button class="btn primary" id="b-yes">${CARROT()}<span>Acheter</span></button></div>`, 'buy');
  $('b-no').onclick = () => { snd.play('click'); closeOv(); };
  $('b-yes').onclick = () => { if (buy(S, shelf, it)) { equip(shelf, id); snd.play('buy'); buzz(20); const r = $('b-yes').getBoundingClientRect(); fx.burst(r.left + r.width / 2, r.top, 24, ['#FF8A3D', '#3FAE6A', '#FFD93B', '#fff']); closeOv(); renderColl(); toast(`${it.name} : à toi !`); } };
}

// ---------- MAP
let mapWorld = 0;
function renderMap(w = mapWorld) {
  mapWorld = w; setWorld(w);
  const W = WORLDS[w]; const lv = LEVELS.filter((l) => l.world === w);
  const worldOpen = (i: number) => unlocked(S, i * 6);
  const ws = LEVELS.filter((l) => l.world === w).reduce((a, l) => a + (S.stars[l.n] ?? 0), 0);
  $('v-map').innerHTML = `
  <header class="maphead"><button class="iconbtn" id="m-back" aria-label="Accueil">${ic('back')}</button>
    <div class="tabs">${WORLDS.map((x, i) => `<button class="tab ${i === w ? 'on' : ''}" data-w="${i}" ${worldOpen(i) ? '' : 'disabled'}>${worldOpen(i) ? '' : ic('lock')}${x.name}</button>`).join('')}</div>
    <div class="chip">${STAR(true)} ${totalStars(S)}</div></header>
  <div class="mapbody">
    <div class="worldcard"><div class="wc-art">${capySvg(W.mascot)}</div><h2>${W.name}</h2><p>Monde ${w + 1} · ${ws} / 18 ${STAR(true, 'tiny')}</p></div>
    <div class="path">
      <svg class="trail" viewBox="0 0 600 200" preserveAspectRatio="none"><path d="M40 150 C120 40 180 40 240 110 S360 180 420 90 S540 30 570 60" /></svg>
      ${lv.map((l, i) => { const open = unlocked(S, l.n); const st = S.stars[l.n] ?? 0; const cur = open && !st; return `<button class="node n${i} ${open ? '' : 'locked'} ${cur ? 'cur' : ''}" data-n="${l.n}" ${open ? '' : 'disabled'} aria-label="Niveau ${l.n + 1}">
        <span class="num">${open ? l.n + 1 : ic('lock')}</span><span class="stars">${[0, 1, 2].map((k) => STAR(k < st)).join('')}</span><span class="lname">${LAYOUTS[l.layout].name} · ${LAYOUTS[l.layout].make().length}</span></button>`; }).join('')}
    </div>
  </div>`;
  $('m-back').onclick = () => { snd.play('click'); renderHome(); show('home'); };
  document.querySelectorAll<HTMLButtonElement>('.tab').forEach((b) => (b.onclick = () => { snd.play('click'); renderMap(+b.dataset.w!); }));
  document.querySelectorAll<HTMLButtonElement>('.node').forEach((b) => (b.onclick = () => { snd.play('click'); startLevel(+b.dataset.n!); }));
}

// ---------- GAME
const board = $('board'), stage = $('stage');
interface G { level: PlayLevel; legends: number; hasLegend: boolean; idle: number; undos: number; undoBonus: number; maxCombo: number; tiles: Tile[]; els: HTMLDivElement[]; sel: Tile | null; history: [number, number][]; solution: [number, number][]; start: number; paused: number; pausedAt: number; hints: number; shuffles: number; combo: number; lastMatch: number; score: number; over: boolean; coach: boolean; bounds: { x0: number; y0: number; cols: number; rows: number } }
let g: G | null = null; let timer = 0;
const elapsed = () => (g ? Math.floor(((g.pausedAt || Date.now()) - g.start - g.paused) / 1000) : 0);

function startLevel(n: number) { startPlay({ ...LEVELS[n], mode: 'level', title: `Niveau ${n + 1}`, legend: LEVEL_LEGEND }); }
function startPlay(level: PlayLevel, resume?: Run) {
  const pos = LAYOUTS[level.layout].make();
  const { tiles, solution } = deal(pos, level.seed, level.legend);
  if (resume) { tiles.forEach((t, i) => { t.kind = resume.kinds[i]; }); for (const id of resume.removed) tiles[id].removed = true; }
  const xs = pos.map((p) => p.x), ys = pos.map((p) => p.y);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  g = { level, legends: 0, hasLegend: tiles.some((t) => t.kind === 'capydindon'), idle: Date.now(), undos: 0, undoBonus: 0, maxCombo: 0, tiles, els: [], sel: null, history: [], solution, start: Date.now(), paused: 0, pausedAt: 0, hints: 0, shuffles: 0, combo: 0, lastMatch: 0, score: 0, over: false, coach: !resume && level.mode === 'level' && level.n === 0 && S.stats.won === 0, bounds: { x0, y0, cols: Math.max(...xs) - x0 + 2, rows: Math.max(...ys) - y0 + 2 } };
  if (resume) Object.assign(g, { history: resume.history, hints: resume.hints, shuffles: resume.shuffles, undos: resume.undos, undoBonus: resume.undoBonus ?? 0, score: resume.score, legends: resume.legends, maxCombo: resume.maxCombo, start: Date.now() - resume.t * 1000 });
  board.innerHTML = '';
  const order = tiles.slice().sort((a, b) => a.z - b.z || a.x - b.x || b.y - a.y);
  order.forEach((t, i) => {
    const d = document.createElement('div'); d.className = 'tile enter'; d.style.zIndex = String(i + 1); d.style.animationDelay = `${Math.min(900, i * 7)}ms`;
    d.innerHTML = `<svg viewBox="0 0 100 130"><use href="#k-${t.kind}"/></svg>`; d.dataset.id = String(t.id); d.dataset.kind = t.kind;
    d.setAttribute('aria-label', KIND_BY_ID.get(t.kind)!.name); g!.els[t.id] = d; board.appendChild(d);
  });
  const short = level.mode === 'level' ? WORLDS[level.world].name : level.mode === 'daily' ? (level.late ? 'Rattrapage' : 'Défi du jour') : level.mode === 'zen' ? 'Zen' : `Manche ${level.round! + 1}`;
  $('g-lvl').innerHTML = (level.mode === 'level' ? `<b>${level.n + 1}</b><span class="ln"> ${WORLDS[level.world].name} · ${LAYOUTS[level.layout].name}</span>` : `<b>${ic(level.mode === 'daily' ? 'cal' : level.mode === 'zen' ? 'leaf' : 'inf')}</b><span class="ln"> ${level.title}</span>`) + `<span class="ls">${short}</span>`;
  document.body.dataset.mode = level.mode; if (!resume) S.stats.played++;
  if (!resume && (level.undos ?? -1) >= 0 && !S.seenUndo) { S.seenUndo = true; setTimeout(() => toast(`Annulations limitées : ${level.undos} sur ce plateau. Un combo ×4 en redonne une !`), 700); }
  persist(); $('g-combo').classList.remove('show');
  show('game', level.world); layout(); refresh();
  clearInterval(timer); timer = window.setInterval(tick, 500); tick();
  legendChip(); if (resume) toast('Partie reprise');
}
function tick() {
  if (!g || g.over || g.pausedAt) return; $('g-time').textContent = fmt(elapsed());
  // optional auto-hint: after 20 s without a move, gently nudge one playable pair (free, never counted)
  if (S.settings.autohint && view === 'game' && !$('ov').classList.contains('show') && Date.now() - g.idle > 20000 && !board.querySelector('.nudge')) { const x = findHint(g.tiles); if (x) x.forEach((t) => g!.els[t.id].classList.add('nudge')); }
}

function layout() {
  if (!g) return; const W = stage.clientWidth, H = stage.clientHeight; if (!W || !H) return;
  const { cols, rows, x0, y0 } = g.bounds; const ar = 1.3;
  const pad = H < 420 ? 10 : 28; const u = Math.max(6, Math.min((W - 16) / (cols + 1), (H - pad) / (rows * ar + 1.2)));
  const depth = Math.max(2, u * 0.2);
  board.style.setProperty('--u', `${u * 2}px`); board.style.width = `${cols * u}px`; board.style.height = `${rows * u * ar}px`;
  board.style.transform = `translate(-50%,-50%) translate(${depth * 2}px,${depth}px)`;
  for (const t of g.tiles) {
    const d = g.els[t.id];
    d.style.left = `${(t.x - x0) * u - t.z * depth}px`; d.style.top = `${(t.y - y0) * u * ar - t.z * depth}px`;
    d.style.width = `${u * 2 - 1}px`; d.style.height = `${u * 2 * ar - 1}px`;
    d.style.setProperty('--d', `${depth}px`);
  }
}
addEventListener('resize', () => requestAnimationFrame(layout));

/** First-ever game: make the first pair glow and point at it, until it's matched. */
function coach() {
  if (!g) return; board.querySelectorAll('.coach').forEach((e) => e.classList.remove('coach')); board.querySelector('.hand')?.remove();
  if (g.history.length) { g.coach = false; toast('Bravo ! Continue jusqu\'à vider le plateau', 2200); return; }
  const x = findHint(g.tiles); if (!x) return; x.forEach((t) => g!.els[t.id].classList.add('coach'));
  const target = g.sel && x.includes(g.sel) ? x.find((t) => t !== g!.sel)! : x[0];
  const hnd = document.createElement('i'); hnd.className = 'hand'; hnd.setAttribute('aria-hidden', 'true'); hnd.innerHTML = '<svg viewBox="0 0 40 48"><path d="M14 4c2.2 0 4 1.8 4 4v14l2-.3V17c0-2 1.6-3.5 3.5-3.5S27 15 27 17v5l1.6.2c2-.2 3.6 1.3 3.8 3.3l.6 6.5c.4 5-2 9.6-6.5 11.6L22 46H12l-6.5-10.3c-1-1.6-.6-3.7 1-4.7 1.4-1 3.4-.7 4.4.6L10 30V8c0-2.2 1.8-4 4-4z" fill="#fff" stroke="#3B2A20" stroke-width="2.6" stroke-linejoin="round"/></svg>';
  g.els[target.id].appendChild(hnd);
}
function refresh() {
  if (!g) return; const live = g.tiles.filter((t) => !t.removed);
  document.body.classList.toggle('dim', S.settings.dim);
  for (const t of g.tiles) {
    const d = g.els[t.id]; const free = !t.removed && isFree(t, live); d.classList.toggle('gone', t.removed); d.classList.toggle('blocked', !t.removed && !free); d.classList.toggle('sel', g.sel === t); d.classList.remove('hint', 'nudge');
    d.classList.toggle('mate', !!(S.settings.hl && g.sel && g.sel !== t && free && matches(g.sel.kind, t.kind)));
    if (d.dataset.kind !== t.kind) { d.dataset.kind = t.kind; d.querySelector('use')!.setAttribute('href', `#k-${t.kind}`); }
  }
  $('g-pairs').textContent = `${live.length / 2} paires`; $('g-score').textContent = String(g.score);
  const hl = g.level.hints - g.hints, sl = g.level.shuffles - g.shuffles;
  const zen = g.level.mode === 'zen'; $('g-hint-n').textContent = zen ? '∞' : String(hl); $('g-shuf-n').textContent = zen ? '∞' : String(sl);
  ($('g-hint') as HTMLButtonElement).disabled = hl <= 0; ($('g-shuf') as HTMLButtonElement).disabled = sl <= 0; const ul = undoLeft(); $('g-undo-n').textContent = ul === Infinity ? '∞' : String(ul); ($('g-undo') as HTMLButtonElement).disabled = !g.history.length || ul <= 0;
  if (g.over) return;
  if (g.coach) coach(); if (live.length) snapshot();
  if (!live.length) win();
  else if (!findHint(g.tiles)) setTimeout(() => g && !g.over && noMoves(), 450);
}
let comboT = 0;
function pop(x: number, y: number, txt: string) { const e = document.createElement('div'); e.className = 'pop'; e.textContent = txt; e.style.left = `${x}px`; e.style.top = `${y}px`; document.body.appendChild(e); setTimeout(() => e.remove(), 900); }
function center(t: Tile) { const r = g!.els[t.id].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
function tap(t: Tile) {
  if (!g || g.over || g.pausedAt || t.removed) return;
  g.idle = Date.now();
  const live = g.tiles.filter((x) => !x.removed);
  if (!isFree(t, live)) { const d = g.els[t.id]; d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); snd.play('invalid'); buzz(25); toast(S.stats.won < 3 ? 'Tuile bloquée : il lui faut un côté libre (gauche ou droite) et rien dessus' : 'Tuile bloquée', S.stats.won < 3 ? 2600 : 1500); return; }
  if (g.sel === t) { g.sel = null; snd.play('click'); }
  else if (g.sel && matches(g.sel.kind, t.kind)) {
    const a = g.sel; const now = Date.now(); g.combo = now - g.lastMatch < 4000 ? g.combo + 1 : 0; g.lastMatch = now;
    a.removed = t.removed = true; g.history.push([a.id, t.id]); g.sel = null;
    g.score += 100 + Math.min(g.combo, 5) * 25;
    const gain = 100 + Math.min(g.combo, 5) * 25; g.maxCombo = Math.max(g.maxCombo, g.combo + 1);
    const [ax, ay] = center(a), [bx, by] = center(t); fx.burst(ax, ay, 12 + g.combo * 2); fx.burst(bx, by, 12 + g.combo * 2);
    pop((ax + bx) / 2, Math.min(ay, by) - 10, `+${gain}`);
    if (a.kind === 'capydindon') { legendFound(ax, ay, bx, by); earnUndo((ax + bx) / 2, Math.min(ay, by)); } else { snd.play('match', g.combo); buzz(12); }
    if (g.combo === 3) earnUndo((ax + bx) / 2, Math.min(ay, by));
    const cb = $('g-combo'); if (g.combo >= 1) { cb.textContent = `Combo ×${g.combo + 1}`; cb.classList.remove('show', 'bump'); void cb.offsetWidth; cb.classList.add('show', 'bump'); clearTimeout(comboT); comboT = window.setTimeout(() => cb.classList.remove('show'), 4000); }
  } else { if (g.sel) snd.play('select'); else snd.play('select'); g.sel = t; }
  refresh();
}
board.addEventListener('pointerdown', (e) => { const d = (e.target as HTMLElement).closest('.tile') as HTMLElement | null; if (d && g) { e.preventDefault(); tap(g.tiles[+d.dataset.id!]); } });

function legendChip() {
  const c = $('g-leg'); if (!g || !g.hasLegend) { c.classList.remove('show'); return; }
  c.classList.add('show'); c.classList.toggle('found', g.legends > 0);
  c.innerHTML = `<svg viewBox="0 0 100 130"><use href="#k-capydindon"/></svg><span>${g.legends ? 'Trouvé !' : 'Caché'}</span>`;
  c.title = g.legends ? 'Capydindon légendaire trouvé' : 'Un capydindon légendaire se cache dans ce plateau';
}
function legendFound(ax: number, ay: number, bx: number, by: number) {
  if (!g) return; g.score += 1000; const gold = ['#FFD45C', '#FFF4C2', '#F2A81D', '#FFFFFF', '#E8344E'];
  if (!g.legends) { g.legends++; S.stats.legends++; persist(); }
  fx.burst(ax, ay, 40, gold); fx.burst(bx, by, 40, gold); pop((ax + bx) / 2, Math.min(ay, by) - 34, '+1000');
  snd.play('legend'); buzz(60); legendChip(); const c = $('g-leg'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
}
/** Undos left: Infinity when the level has no budget (zen, first world). */
const undoLeft = () => { if (!g) return 0; const lim = g.level.undos ?? -1; return lim < 0 ? Infinity : Math.max(0, lim + g.undoBonus - g.undos); };
const undoLimited = () => !!g && (g.level.undos ?? -1) >= 0;
function earnUndo(x: number, y: number) { if (!g || !undoLimited()) return; g.undoBonus++; pop(x, y + 34, '+1 annulation'); const b = $('g-undo-n'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
function doUndo() { if (!g || g.over || !g.history.length) return; if (undoLeft() <= 0) { toast('Plus d\'annulation : un combo ×4 ou le capydindon en redonne une'); snd.play('invalid'); return; } const x = g.history.pop(); if (!x) return; g.undos++; g.idle = Date.now(); g.tiles[x[0]].removed = g.tiles[x[1]].removed = false; g.sel = null; g.score = Math.max(0, g.score - 100); g.combo = 0; snd.play('click'); closeOv(); refresh(); }
function doHint() { if (!g || g.over || (g.hints >= g.level.hints && g.level.mode !== 'zen')) return; const x = findHint(g.tiles); if (!x) return; g.hints++; g.idle = Date.now(); g.sel = null; refresh(); x.forEach((t) => g!.els[t.id].classList.add('hint')); snd.play('hint'); }
function doShuffle() { if (!g || (g.shuffles >= g.level.shuffles && g.level.mode !== 'zen')) return; g.shuffles++; reshuffle(g.tiles, g.level.seed + g.shuffles * 7919 + g.history.length); g.history = []; g.sel = null; snd.play('shuffle'); g.els.forEach((d) => { d.classList.remove('flip'); void d.offsetWidth; d.classList.add('flip'); }); closeOv(); refresh(); toast('Tuiles mélangées'); }
$('g-hint').onclick = doHint; $('g-undo').onclick = doUndo; $('g-shuf').onclick = doShuffle; $('g-pause').onclick = () => pause();
addEventListener('keydown', (e) => { if (view !== 'game') return; if (e.key === 'h') doHint(); if (e.key === 'z' || (e.key === 'z' && e.ctrlKey)) doUndo(); if (e.key === 'Escape') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && view === 'game' && g && !g.over && !g.pausedAt) pause(); });

// ---------- overlays
function openOv(html: string, cls = '') { const c = $('card'); c.className = `card ${cls}`; c.innerHTML = html; $('ov').classList.add('show'); }
function closeOv() { $('ov').classList.remove('show'); }
function pause() {
  if (!g || g.over) return; if (!g.pausedAt) g.pausedAt = Date.now();
  openOv(`<h2>Pause</h2><p class="ptitle">${g.level.mode === 'level' ? `Niveau ${g.level.n + 1} · ${WORLDS[g.level.world].name} · ${LAYOUTS[g.level.layout].name}` : g.level.title}</p><div class="capy-s">${capySvg('lunettes')}</div><div class="col">
    <button class="btn primary" id="p-resume">${ic('play')}<span>Reprendre</span></button>
    <button class="btn" id="p-retry">${ic('retry')}<span>Recommencer</span></button>
    <button class="btn" id="p-settings">${ic('gear')}<span>Réglages</span></button>
    <button class="btn" id="p-map">${ic(g.level.mode === 'level' ? 'map' : 'home')}<span>${g.level.mode === 'level' ? 'Niveaux' : 'Quitter'}</span></button></div>`, 'pause');
  $('p-resume').onclick = resume; $('p-retry').onclick = () => startPlay(g!.level);
  $('p-settings').onclick = () => settings(pause); $('p-map').onclick = () => leave();
}
function resume() { if (!g) return; if (g.pausedAt) { g.paused += Date.now() - g.pausedAt; g.pausedAt = 0; } snd.play('click'); closeOv(); }
function leave() { const m = g?.level.mode ?? 'level'; if (m === 'level') { renderMap(g?.level.world ?? 0); show('map'); } else { renderModes(); show('modes'); } }
/** Update stats/achievements after a finished board; returns newly earned achievement ids. */
function record(won: boolean, t: number) {
  if (!g) return [] as string[]; S.run = null; const st = S.stats; const pairs = g.history.length;
  st.pairs += pairs; st.seconds += t; st.hintsUsed += g.hints; st.bestCombo = Math.max(st.bestCombo, g.maxCombo);
  if (won) { st.won++; if (LAYOUTS[g.level.layout].shape) st.shapes++; if (g.level.mode === 'zen' && g.level.diff === 'expert') st.expertWon++; if (g.tiles.length >= 36 && g.level.mode !== 'zen' && (!st.fastest || t < st.fastest)) st.fastest = t; }
  const last = { mode: g.level.mode, seconds: t, hints: g.hints, shuffles: g.shuffles, undos: g.undos, combo: g.maxCombo, tiles: g.tiles.length, perfect: false };
  const got = checkAchievements({ stats: st, stars: S.stars, totalStars: totalStars(S), last: won ? last : undefined }, S.ach); S.ach.push(...got); persist(); return got;
}
function win() {
  if (!g) return; g.over = true; const t = elapsed(); const lv = g.level; const mode = lv.mode;
  let st = 0; let sc = scoreOf(g.tiles.length / 2, t, lv.par, g.hints, g.shuffles) + (g.score - g.history.length * 100);
  let ribbon = ''; let tip = ''; let again = false; let best = 0; let rec = false; let prev = 0; let extra = '';
  if (mode === 'level') {
    st = starCount(t, lv.par, g.hints); prev = S.stars[lv.n] ?? 0; best = Math.max(S.best[lv.n] ?? 0, sc); rec = sc > (S.best[lv.n] ?? 0);
    S.stars[lv.n] = Math.max(prev, st); S.best[lv.n] = best; if (st === 3) S.stats.perfect++;
    ribbon = `Niveau ${lv.n + 1} réussi !`; tip = st < 3 ? `3 étoiles : finir en moins de ${fmt(lv.par)} sans indice.` : 'Parfait, trois étoiles !';
  } else if (mode === 'daily') {
    again = S.stats.dailyDone.includes(lv.date!) || S.stats.dailyLate.includes(lv.date!);
    st = starCount(t, lv.par, g.hints); const k = `d${lv.date}`; const bestD = (S.best as Record<string, number>)[k] ?? 0; best = Math.max(bestD, sc); rec = sc > bestD; prev = bestD; (S.best as Record<string, number>)[k] = best;
    if (lv.late) { recordLate(S.stats, lv.date!); ribbon = `Défi du ${frDate(lv.date!)} rattrapé !`; const left = missedDays(S.stats).length; tip = `Les défis rattrapés comptent au calendrier, pas dans la série.${left ? ` Encore ${left} à rattraper.` : ''}`; }
    else { const streak = recordDaily(S.stats, lv.date!); ribbon = 'Défi du jour réussi !'; tip = `Série en cours : ${streak} jour${streak > 1 ? 's' : ''} 🔥 · Reviens demain pour un nouveau plateau.`; }
  } else if (mode === 'endless') {
    st = starCount(t, lv.par, g.hints); S.stats.endlessBest = Math.max(S.stats.endlessBest, lv.round! + 1); best = S.stats.endlessBest;
    ribbon = `Manche ${lv.round! + 1} réussie !`; tip = `Manche suivante : ${LAYOUTS[endlessLevel(lv.round! + 1, endlessSeed).layout].name}, ${LAYOUTS[endlessLevel(lv.round! + 1, endlessSeed).layout].make().length} tuiles.`;
  } else { S.stats.zenWon++; ribbon = 'Plateau vidé'; tip = 'Respire… un autre plateau t\'attend.'; }
  let gain = carrotReward({ mode, late: lv.late, again, stars: st, first: mode === 'level' && prev === 0, round: lv.round, diff: lv.diff, streak: S.stats.dailyStreak, legend: g.legends > 0 });
  S.stats.carrotsEarned += gain; const got = record(true, t); gain += got.length * 20; S.stats.carrotsEarned += got.length * 20; S.carrots += gain; persist();
  const legendWin = g.legends > 0; const firstLegend = g.legends > 0 && S.stats.legends === 1 && !S.owned.includes('o:capydindon'); if (firstLegend) { S.owned.push('o:capydindon'); persist(); }
  const outs = firstLegend ? [OUTFITS.find((o) => o.id === 'capydindon')!] : [];
  if (got.length || outs.length) extra = `<div class="unlocks">${outs.map((o) => `<div class="unl leg">${capySvg(o.id)}<span>Tenue légendaire<br><b>${o.name}</b></span></div>`).join('')}${got.slice(0, 3 - outs.length).map((id) => { const a = ACHIEVEMENTS.find((x) => x.id === id)!; return `<div class="unl ach">${capySvg(a.icon)}<span>Succès<br><b>${a.name}</b></span></div>`; }).join('')}${got.length + outs.length > 3 ? `<div class="unl more">+${got.length + outs.length - 3} succès</div>` : ''}</div>`;
  snd.play('win'); fx.confetti(); buzz(40);
  const stTxt = '⭐'.repeat(st) + '☆'.repeat(3 - st); const L = LAYOUTS[lv.layout].name;
  const [shTxt, shUrl] = mode === 'daily' ? [`Mahjong Capybaras 🦫 · Défi du ${frDate(lv.date!)}${lv.late ? ' (rattrapé)' : ''}\n${stTxt} en ${fmt(t)} · 💡 ${g.hints} indice${g.hints > 1 ? 's' : ''}\n${lv.late ? '📅 Rattrapé depuis le calendrier' : `🔥 Série de ${S.stats.dailyStreak} jour${S.stats.dailyStreak > 1 ? 's' : ''}`}${legendWin ? ' · 🦃 capydindon doré trouvé !' : ''}`, lv.late ? `${base()}?mode=daily&day=${lv.date}` : `${base()}?mode=daily`]
    : mode === 'level' ? [`J'ai fini le niveau ${lv.n + 1} (${L}) de Mahjong Capybaras en ${fmt(t)} ${stTxt}. À toi de battre mon temps !`, `${base()}?level=${lv.n}`]
    : mode === 'zen' ? [`J'ai vidé le plateau « ${L} » (${DIFFS.find((d) => d.id === (lv.diff ?? 'moyen'))!.name}) de Mahjong Capybaras 🧘 en ${fmt(t)}. Le même plateau pour toi :`, `${base()}?mode=zen&seed=${lv.seed}&diff=${lv.diff ?? 'moyen'}&layout=${lv.layout}`]
    : [`Manche ${lv.round! + 1} réussie en mode Infini dans Mahjong Capybaras 🦫. Jusqu'où iras-tu ?`, base()];
  const aff = affordable();
  const nextN = mode === 'level' && lv.n + 1 < LEVELS.length ? lv.n + 1 : -1;
  const nextLate = lv.late ? missedDays(S.stats)[0] : undefined;
  const next = mode === 'endless' ? 'Manche suivante' : mode === 'zen' ? 'Nouveau plateau' : nextLate ? 'Autre défi' : nextN >= 0 ? 'Suivant' : '';
  const statsRow = mode === 'zen' ? `<div class="stats"><div><span>Paires</span><b>${g.tiles.length / 2}</b></div><div><span>Temps</span><b>${fmt(t)}</b></div></div>`
    : `<div class="stats"><div><span>Temps</span><b>${fmt(t)}</b></div><div><span>Score</span><b>${sc}</b></div><div><span>${mode === 'endless' ? 'Record' : 'Meilleur'}</span><b>${mode === 'endless' ? `${best} m.` : best}</b></div></div>`;
  setTimeout(() => {
    openOv(`<div class="ribbon">${ribbon}</div><div class="capy-s win">${capySvg(mode === 'zen' ? 'lotus' : S.outfit === 'agrume' ? 'couronne' : S.outfit)}</div>
      ${mode === 'zen' ? '' : `<div class="bigstars">${[0, 1, 2].map((k) => STAR(k < st, `s${k}`)).join('')}</div>`}
      ${statsRow}<div class="earn">${CARROT()}<b>+${gain}</b> carottes${legendWin ? ' <span class="legtag">capydindon +25</span>' : ''}${aff ? `<button class="afford" id="w-shop">De quoi t'offrir : ${aff.name}</button>` : ''}</div>${rec && prev ? '<p class="rec">Nouveau record !</p>' : ''}${extra}
      <p class="tipline">${tip}</p>
      <div class="row">${mode === 'daily' ? '' : `<button class="iconbtn share" id="w-share" aria-label="Partager mon résultat">${ic('share')}</button>`}<button class="btn" id="w-map">${ic(mode === 'level' ? 'map' : 'home')}<span>${mode === 'level' ? 'Niveaux' : 'Modes'}</span></button>${mode === 'endless' ? '' : `<button class="btn" id="w-retry">${ic('retry')}<span>Rejouer</span></button>`}
      ${mode === 'daily' ? `<button class="btn ${next ? '' : 'primary'}" id="w-share">${ic('share')}<span>Partager</span></button>` : ''}${next ? `<button class="btn primary" id="w-next">${ic('next')}<span>${next}</span></button>` : ''}</div>`, `win ${extra ? 'has-unl' : ''}`);
    if (extra) setTimeout(() => snd.play('unlock'), 1300);
    if (mode !== 'zen') [0, 1, 2].forEach((k) => { if (k < st) setTimeout(() => snd.play('star', k), 350 + k * 280); });
    $('w-share').onclick = () => void share(shTxt, shUrl); if ($('w-shop')) $('w-shop').onclick = () => { snd.play('click'); closeOv(); renderColl(THEMES.includes(aff!) || BACKS.includes(aff!) ? 'decor' : 'outfits'); show('coll'); };
    $('w-map').onclick = () => leave(); if ($('w-retry')) $('w-retry').onclick = () => startPlay(lv);
    if (next) $('w-next').onclick = () => (mode === 'endless' ? startPlay(endlessLevel(lv.round! + 1, endlessSeed)) : mode === 'zen' ? startPlay(zenLevel(newSeed(), lv.diff)) : nextLate ? startPlay(dailyLevel(nextLate, true)) : startLevel(nextN));
  }, 700);
}
function noMoves() {
  if (!g) return; const canShuf = g.shuffles < g.level.shuffles || g.level.mode === 'zen';
  if (canShuf) openOv(`<h2>Plus de paires</h2><div class="capy-s">${capySvg('bonnet')}</div><p>Aucune paire libre. Mélange les tuiles restantes, ou annule un coup.</p>
    <div class="row"><button class="btn" id="n-undo" ${g.history.length && undoLeft() > 0 ? '' : 'disabled'}>${ic('undo')}<span>Annuler${undoLimited() ? ` (${undoLeft()})` : ''}</span></button><button class="btn primary" id="n-shuf">${ic('shuffle')}<span>Mélanger${g.level.mode === 'zen' ? '' : ` (${g.level.shuffles - g.shuffles})`}</span></button></div>`, 'lose');
  else { g.over = true; snd.play('lose'); record(false, elapsed()); const endl = g.level.mode === 'endless'; openOv(`<h2>${endl ? 'Fin de la course' : 'Perdu…'}</h2><div class="capy-s sad">${capySvg('bonnet')}</div><p>${endl ? `Plus de paires possibles. Manches réussies : <b>${g.level.round}</b> · Record : <b>${S.stats.endlessBest}</b>` : 'Plus de paires et plus de mélanges. Le capybara t\'attend pour réessayer !'}</p>
    <div class="row"><button class="btn" id="n-map">${ic(g.level.mode === 'level' ? 'map' : 'home')}<span>${g.level.mode === 'level' ? 'Niveaux' : 'Modes'}</span></button><button class="btn primary" id="n-retry">${ic('retry')}<span>${endl ? 'Nouvelle course' : 'Réessayer'}</span></button></div>`, 'lose'); }
  if (canShuf) { $('n-shuf').onclick = doShuffle; $('n-undo').onclick = doUndo; } else { $('n-retry').onclick = () => (g!.level.mode === 'endless' ? startPlay(endlessLevel(0, (endlessSeed = (Math.random() * 2 ** 31) >>> 0))) : startPlay(g!.level)); $('n-map').onclick = () => leave(); }
}
function settings(back?: () => void) {
  const row = (id: string, label: string, on: boolean) => `<label class="set"><span>${label}</span><button class="sw ${on ? 'on' : ''}" id="${id}" role="switch" aria-checked="${on}"><i></i></button></label>`;
  openOv(`<h2>Réglages</h2><div class="sets">${row('s-sfx', 'Effets sonores', S.settings.sfx)}${row('s-music', 'Musique lo-fi', S.settings.music)}${row('s-dim', 'Assombrir les tuiles bloquées', S.settings.dim)}${row('s-hl', 'Montrer les paires possibles', S.settings.hl)}${row('s-auto', 'Indice automatique (20 s)', S.settings.autohint)}${row('s-vib', 'Vibrations', S.settings.vibrate)}</div>
    <div class="row"><button class="btn" id="s-share">${ic('share')}<span>Partager le jeu</span></button><button class="btn danger" id="s-reset">Effacer la progression</button><button class="btn primary" id="s-ok">OK</button></div><p class="credits">Musique et sons créés dans le jeu · Police Fredoka (OFL)</p>`, 'settings');
  const bind = (id: string, key: keyof typeof S.settings, after?: (v: boolean) => void) => { $(id).onclick = () => { S.settings[key] = !S.settings[key]; persist(); $(id).classList.toggle('on', S.settings[key]); $(id).setAttribute('aria-checked', String(S.settings[key])); after?.(S.settings[key]); snd.play('click'); }; };
  bind('s-sfx', 'sfx', (v) => (snd.sfxOn = v)); bind('s-music', 'music', (v) => snd.setMusic(v)); bind('s-dim', 'dim', () => refresh()); bind('s-vib', 'vibrate'); bind('s-hl', 'hl', () => refresh()); bind('s-auto', 'autohint', () => g && (g.idle = Date.now()));
  $('s-reset').onclick = () => { if ($('s-reset').dataset.c) { const st = reset(); Object.assign(S, st); persist(); toast('Progression effacée'); renderHome(); show('home'); } else { $('s-reset').dataset.c = '1'; $('s-reset').textContent = 'Confirmer ?'; } };
  $('s-share').onclick = () => void share('Mahjong Capybaras 🦫 : le mahjong le plus doux du web. Gratuit, sans pub.', base());
  $('s-ok').onclick = () => { snd.play('click'); if (back) back(); else closeOv(); };
}
function howTo(then?: () => void) {
  const tile = (k: string, cls = '') => `<div class="ht-tile ${cls}"><svg viewBox="0 0 100 130"><use href="#k-${k}"/></svg></div>`;
  openOv(`<h2>Comment jouer</h2><div class="how">
   <div class="hstep"><div class="hart">${tile('fraise-3')}${tile('fraise-3')}</div><p>Touche deux tuiles identiques pour les retirer.</p></div>
   <div class="hstep"><div class="hart">${tile('agrume-1', 'blk')}${tile('canard')}${tile('agrume-2', 'blk')}</div><p>Une tuile est libre si rien n'est dessus et si son côté gauche ou droit est dégagé.</p></div>
   <div class="hstep"><div class="hart">${tile('printemps')}${tile('hiver')}</div><p>Les saisons vont ensemble, les fleurs aussi. Vide le plateau pour gagner !</p></div></div>
   <div class="row"><button class="btn primary" id="ht-ok">${then ? 'C\'est parti !' : 'Compris'}</button></div>`, 'howto');
  $('ht-ok').onclick = () => { S.seenHowTo = true; persist(); closeOv(); then?.(); };
}

// ---------- test/debug hooks (used by Playwright e2e)
(window as unknown as { __game: unknown }).__game = {
  state: () => g && { level: g.level.n, mode: g.level.mode, layout: g.level.layout, seed: g.level.seed, left: g.tiles.filter((t) => !t.removed).length, over: g.over },
  next: () => { if (!g) return null; const p = g.solution.find(([a]) => !g!.tiles[a].removed); return p ?? null; },
  stuck: () => { if (!g) return; g.shuffles = g.level.shuffles; noMoves(); },
  solveAll: () => { if (!g) return; for (const [a, b] of g.solution) { if (g.tiles[a].removed) continue; tap(g.tiles[a]); tap(g.tiles[b]); } },
  playPairs: (n: number) => { if (!g) return; let k = 0; for (const [a, b] of g.solution) { if (k >= n) break; if (g.tiles[a].removed) continue; tap(g.tiles[a]); tap(g.tiles[b]); k++; } },
  legend: () => g && g.tiles.filter((t) => t.kind === 'capydindon' && !t.removed).map((t) => t.id),
  select: (n: number) => { if (!g) return; const x = findHint(g.tiles); if (x && n) tap(x[0]); },
};

// ---------- boot
document.body.dataset.bg = S.bg; renderHome(); setWorld(0); show('home');
const deep = new URLSearchParams(location.search);
if (deep.has('level')) startLevel(Math.min(LEVELS.length - 1, +deep.get('level')!));
else if (deep.get('mode') === 'daily') { const k = deep.get('day'); startPlay(k && /^\d{4}-\d\d-\d\d$/.test(k) && k < dayKey() ? dailyLevel(k, true) : dailyLevel()); }
else if (deep.get('mode') === 'zen') { const z = zenLevel(+(deep.get('seed') ?? 1), (DIFFS.some((d) => d.id === deep.get('diff')) ? deep.get('diff') as Diff : 'moyen')); const lay = deep.get('layout'); startPlay(lay && LAYOUTS[lay] ? { ...z, layout: lay, title: `Zen · ${LAYOUTS[lay].name}`, legend: deep.has('legend') ? 1 : z.legend } : z); }
else if (deep.get('mode') === 'endless') startPlay(endlessLevel(+(deep.get('round') ?? 0), endlessSeed));
// Home illustration: lazy-loaded after first paint (decoded off the critical path), then faded in.
const HOME_BG = new URL(`${import.meta.env.BASE_URL}home-bg.webp`, document.baseURI).href;
const loadHomeBg = () => { const im = new Image(); im.decoding = 'async'; im.src = HOME_BG; im.decode().then(() => { document.documentElement.style.setProperty('--home-bg', `url("${HOME_BG}")`); document.body.classList.add('home-art'); }).catch(() => {}); };
if (document.readyState === 'complete') setTimeout(loadHomeBg, 50); else addEventListener('load', () => setTimeout(loadHomeBg, 50));
if (import.meta.env.PROD && 'serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
