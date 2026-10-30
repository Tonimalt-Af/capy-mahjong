import { test, expect, type Page } from '@playwright/test';
type St = { level: number; mode: string; layout: string; seed: number; left: number; over: boolean };
type W = { __game: { state: () => St | null; solveAll: () => void; playPairs: (n: number) => void; stuck: () => void } };
const G = (p: Page) => ({ state: () => p.evaluate(() => (window as unknown as W).__game.state()), solve: () => p.evaluate(() => (window as unknown as W).__game.solveAll()), pairs: (n: number) => p.evaluate((n) => (window as unknown as W).__game.playPairs(n), n) });
const saveOf = (p: Page) => p.evaluate(() => JSON.parse(localStorage.getItem('capy-mahjong-v1')!));
const tap = async (p: Page, sel: string) => { const l = p.locator(sel); if (test.info().project.name.startsWith('mobile')) await l.tap(); else await l.click(); };
const seed = (p: Page, extra: object = {}) => p.addInitScript((e) => { if (!sessionStorage.k) { localStorage.setItem('capy-mahjong-v1', JSON.stringify({ stars: {}, best: {}, settings: { sfx: false, music: false, dim: true, vibrate: false }, seenHowTo: true, ...e })); sessionStorage.k = '1'; } }, extra);

test.beforeEach(async ({ page }) => { const errs: string[] = []; page.on('pageerror', (e) => errs.push(e.message)); (page as unknown as { errs: string[] }).errs = errs; });
test.afterEach(async ({ page }) => { expect((page as unknown as { errs: string[] }).errs).toEqual([]); });

test('modes screen lists daily, endless and zen; daily dot on home', async ({ page }) => {
  await seed(page); await page.goto('/');
  await expect(page.locator('#h-modes .dot')).toBeVisible();
  await tap(page, '#h-modes'); for (const t of ['Défi du jour', 'Infini', 'Zen']) await expect(page.locator('#v-modes')).toContainText(t);
});
test('daily challenge: same board on reload, win records streak and hides home dot', async ({ page }) => {
  await seed(page); await page.goto('/'); await tap(page, '#h-modes'); await tap(page, '#mo-daily');
  const a = await G(page).state(); expect(a?.mode).toBe('daily');
  await page.goto('/?mode=daily'); const b = await G(page).state(); expect([b?.layout, b?.seed]).toEqual([a?.layout, a?.seed]);
  await G(page).solve(); await expect(page.locator('.card.win')).toContainText('Défi du jour réussi');
  await expect(page.locator('.card.win')).toContainText('Série en cours : 1 jour');
  const s = await saveOf(page); expect(s.stats.dailyDone.length).toBe(1); expect(s.stats.dailyStreak).toBe(1); expect(s.ach).toContain('daily1');
  await page.goto('/'); await expect(page.locator('#h-modes .dot')).toHaveCount(0);
  await tap(page, '#h-modes'); await expect(page.locator('#mo-daily')).toContainText('Réussi');
});
test('endless: rounds chain with growing boards, best round saved, game over offers new run', async ({ page }) => {
  await seed(page); await page.goto('/'); await tap(page, '#h-modes'); await tap(page, '#mo-endless');
  const sizes: number[] = [];
  for (let r = 0; r < 3; r++) { sizes.push((await G(page).state())!.left); await G(page).solve(); await expect(page.locator('.card.win')).toContainText(`Manche ${r + 1} réussie`); await tap(page, '#w-next'); }
  expect(sizes[2]).toBeGreaterThan(sizes[0]); expect((await saveOf(page)).stats.endlessBest).toBe(3);
  await page.evaluate(() => (window as unknown as W).__game.stuck()); await expect(page.locator('.card.lose')).toContainText('Fin de la course');
  await tap(page, '#n-retry'); expect((await G(page).state())!.left).toBe(36);
});
test('zen: no timer/score, unlimited hints & shuffles', async ({ page }) => {
  await seed(page); await page.goto('/?mode=zen&seed=3');
  await expect(page.locator('#g-time')).toBeHidden(); await expect(page.locator('#g-score')).toBeHidden(); await expect(page.locator('#g-hint-n')).toHaveText('∞');
  for (let i = 0; i < 5; i++) { await tap(page, '#g-hint'); await expect(page.locator('.tile.hint')).toHaveCount(2); }
  await expect(page.locator('#g-hint')).toBeEnabled();
  await G(page).solve(); await expect(page.locator('.card.win')).toContainText('Plateau vidé'); await expect(page.locator('.card.win .bigstars')).toHaveCount(0);
  expect((await saveOf(page)).stats.zenWon).toBe(1);
});
test('combo indicator lives in the HUD, never over the board', async ({ page }) => {
  await seed(page); await page.goto('/?level=6'); await G(page).pairs(4);
  const c = page.locator('#g-combo'); await expect(c).toBeVisible(); await expect(c).toContainText('Combo ×');
  await c.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished))); // measure at rest, not mid-bump
  const [cb, sb] = [await c.boundingBox(), await page.locator('#stage').boundingBox()];
  const overlap = cb!.x < sb!.x + sb!.width && cb!.x + cb!.width > sb!.x && cb!.y < sb!.y + sb!.height && cb!.y + cb!.height > sb!.y; expect(overlap).toBe(false);
  await expect(page.locator('.toast.show')).toHaveCount(0);
});
test('first win unlocks achievement shown on the win card and in Collection', async ({ page }) => {
  await seed(page); await page.goto('/?level=0'); await G(page).solve();
  await expect(page.locator('.card.win .unl.ach', { hasText: 'Premier plongeon' })).toBeVisible();
  await page.goto('/'); await tap(page, '#h-coll'); await tap(page, '.tab[data-t="ach"]');
  await expect(page.locator('.ach.ok', { hasText: 'Premier plongeon' })).toBeVisible();
  await tap(page, '.tab[data-t="stats"]'); await expect(page.locator('.statgrid')).toContainText('Parties gagnées'); await expect(page.locator('.sc').first()).toContainText('1 / 1');
});
test('carrots: a level win pays carrots, shown on the card and on the home wallet', async ({ page }) => {
  await seed(page); await page.goto('/?level=0'); await G(page).solve();
  await expect(page.locator('.card.win .earn')).toContainText('carottes');
  const c = (await saveOf(page)).carrots; expect(c).toBeGreaterThanOrEqual(15);
  await page.goto('/'); await expect(page.locator('#h-wallet')).toContainText(String(c));
});
test('shop: buying an outfit spends carrots, equips it and persists; too expensive is refused', async ({ page }) => {
  await seed(page, { carrots: 100 }); await page.goto('/'); await tap(page, '#h-coll');
  await tap(page, '.item[data-s="o"][data-i="couronne"]'); await expect(page.locator('.toast')).toContainText('Il te manque 150 carottes');
  await tap(page, '.item[data-s="o"][data-i="lunettes"]'); await expect(page.locator('.card.buy')).toContainText('40');
  await tap(page, '#b-yes'); await expect(page.locator('.item.on')).toHaveAttribute('data-i', 'lunettes');
  const s = await saveOf(page); expect(s.carrots).toBe(60); expect(s.outfit).toBe('lunettes'); expect(s.owned).toContain('o:lunettes');
  await page.reload(); await tap(page, '#h-coll'); await expect(page.locator('.item.on')).toHaveAttribute('data-i', 'lunettes');
  await tap(page, '.item[data-s="o"][data-i="agrume"]'); await tap(page, '.item[data-s="o"][data-i="lunettes"]'); // owned: re-equip for free
  expect((await saveOf(page)).carrots).toBe(60);
  await tap(page, '.item[data-s="o"][data-i="capydindon"]'); await expect(page.locator('.toast')).toContainText('capydindon');
});
test('tile sets: switching to the black-cat set redraws every tile face', async ({ page }) => {
  await seed(page, { carrots: 300 }); await page.goto('/'); await tap(page, '#h-coll'); await tap(page, '.tab[data-t="decor"]');
  await tap(page, '.item[data-s="t"][data-i="chat"]'); await tap(page, '#b-yes');
  expect((await saveOf(page)).theme).toBe('chat');
  expect(await page.locator('#k-agrume-1').innerHTML()).toContain('#2E2A3A');
  await page.reload(); expect(await page.locator('#k-fraise-5').innerHTML()).toContain('#2E2A3A');
});
test('legendary capydindon: the daily hides one golden pair; matching it pays out and unlocks its costume', async ({ page }) => {
  await seed(page); await page.goto('/?mode=daily');
  type L = { __game: { legend: () => number[] } };
  expect(await page.evaluate(() => (window as unknown as L).__game.legend())).toHaveLength(2);
  await expect(page.locator('#g-leg')).toContainText('Caché');
  await G(page).solve(); await expect(page.locator('.card.win .unl.leg')).toContainText('Capydindon');
  await expect(page.locator('.card.win .legtag')).toBeVisible();
  const s = await saveOf(page); expect(s.stats.legends).toBe(1); expect(s.owned).toContain('o:capydindon'); expect(s.ach).toContain('legend1');
  await page.goto('/'); await tap(page, '#h-coll'); await tap(page, '.item[data-i="capydindon"]'); expect((await saveOf(page)).outfit).toBe('capydindon');
});
test('zen difficulty picker: Expert gives a big board, choice is remembered', async ({ page }) => {
  await seed(page); await page.goto('/'); await tap(page, '#h-modes'); await tap(page, '#mo-zen');
  await expect(page.locator('.diff')).toHaveCount(4); await tap(page, '.diff[data-d="expert"]');
  const st = await G(page).state(); expect(['tortue', 'capy', 'montagne', 'etoile']).toContain(st!.layout);
  await expect(page.locator('#g-lvl')).toContainText('Expert'); expect((await saveOf(page)).diff).toBe('expert');
});
test('match highlighting shows playable partners, and can be turned off', async ({ page }) => {
  await seed(page); await page.goto('/?level=3'); await page.waitForTimeout(900);
  type S2 = { __game: { select: (n: number) => void } };
  await page.evaluate(() => (window as unknown as S2).__game.select(1)); await expect(page.locator('.tile.mate').first()).toBeVisible();
  await tap(page, '#g-pause'); await tap(page, '#p-settings'); await tap(page, '#s-hl'); await tap(page, '#s-ok'); await tap(page, '#p-resume').catch(() => {});
  expect((await saveOf(page)).settings.hl).toBe(false); await expect(page.locator('.tile.mate')).toHaveCount(0);
});
test('auto-hint (opt-in) nudges a pair after 20 s idle, without spending a hint', async ({ page }) => {
  await page.clock.install(); await seed(page, { settings: { sfx: false, music: false, dim: true, vibrate: false, hl: true, autohint: true } }); await page.goto('/?level=2');
  await page.clock.fastForward(22000); await expect(page.locator('.tile.nudge')).toHaveCount(2);
  await expect(page.locator('#g-hint-n')).toHaveText('4');
});
for (const lay of ['coeur', 'capy', 'chat', 'ours', 'etoile', 'champignon', 'tortue']) test(`shaped board "${lay}" fits the screen with readable tiles`, async ({ page }) => {
  await seed(page); await page.goto(`/?mode=zen&seed=2&layout=${lay}`); await page.waitForTimeout(1300);
  const vp = page.viewportSize()!; const boxes = await page.locator('.tile').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, r.width]; }));
  for (const [l, t, r, b] of boxes) { expect(l).toBeGreaterThanOrEqual(0); expect(t).toBeGreaterThanOrEqual(0); expect(r).toBeLessThanOrEqual(vp.width); expect(b).toBeLessThanOrEqual(vp.height); }
  expect(Math.min(...boxes.map((b) => b[4]))).toBeGreaterThanOrEqual(['tortue', 'chat'].includes(lay) ? 30 : 34) // 8-row boards (classic turtle size) vs 7-row;
  const bar = await page.locator('.bar').boundingBox(); const hud = await page.locator('.hud').boundingBox(); const st = await page.locator('#stage').boundingBox();
  expect(bar && hud && st).toBeTruthy();
});
test('real taps clear a whole level (no test hooks for input)', async ({ page }) => {
  await seed(page); await page.goto('/?level=0'); await page.waitForTimeout(1200);
  type N = { __game: { next: () => [number, number] | null } };
  for (let i = 0; i < 18; i++) {
    const p = await page.evaluate(() => (window as unknown as N).__game.next()); if (!p) break;
    for (const id of p) { const r = (await page.locator(`.tile[data-id="${id}"]`).boundingBox())!; const x = r.x + r.width * 0.6, y = r.y + r.height * 0.6; if (test.info().project.name.startsWith('mobile')) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); }
  }
  await expect(page.locator('.card.win')).toBeVisible();
});

test('resume: an interrupted game is saved after every move and resumed from the home screen', async ({ page }) => {
  await seed(page); await page.goto('/?level=3'); await G(page).pairs(3);
  const before = (await G(page).state())!.left;
  await page.goto('/'); await expect(page.locator('#h-play')).toContainText('Reprendre'); await expect(page.locator('#h-play')).toContainText('Niveau 4');
  await tap(page, '#h-play'); await expect(page.locator('.toast')).toContainText('Partie reprise');
  const st = (await G(page).state())!; expect(st.left).toBe(before); expect(st.level).toBe(3);
  await expect(page.locator('#g-undo')).toBeEnabled();
  expect((await saveOf(page)).stats.played).toBe(1); // resuming isn't a new game
  await G(page).solve(); await expect(page.locator('.card.win')).toBeVisible(); expect((await saveOf(page)).run).toBeNull();
  await page.goto('/'); await expect(page.locator('#h-play')).not.toContainText('Reprendre');
});
test('first-ever game: the first pair glows with a pointing hand until it is matched', async ({ page }) => {
  await seed(page); await page.goto('/?level=0'); await page.waitForTimeout(1200);
  await expect(page.locator('.tile.coach')).toHaveCount(2); await expect(page.locator('.tile .hand')).toHaveCount(1);
  const ids = await page.locator('.tile.coach').evaluateAll((e) => e.map((x) => (x as HTMLElement).dataset.id));
  await tap(page, `.tile[data-id="${ids[0]}"]`); await expect(page.locator('.tile.coach .hand')).toHaveCount(1);
  await tap(page, `.tile[data-id="${ids[1]}"]`);
  await expect(page.locator('.tile.coach')).toHaveCount(0); await expect(page.locator('.hand')).toHaveCount(0); await expect(page.locator('.toast')).toContainText('Bravo');
});
test('share: the daily result card has stars, time, streak and a direct link', async ({ page }) => {
  await page.addInitScript(() => { (navigator as unknown as { share: unknown }).share = async (d: unknown) => { (window as unknown as { __sh: unknown }).__sh = d; }; });
  await seed(page); await page.goto('/?mode=daily'); await G(page).solve(); await tap(page, '#w-share');
  const d = await page.evaluate(() => (window as unknown as { __sh: { text: string; url: string } }).__sh);
  expect(d.text).toContain('Défi du'); expect(d.text).toMatch(/⭐/); expect(d.text).toContain('Série de 1 jour'); expect(d.url).toMatch(/\?mode=daily$/);
});
test('share falls back to the clipboard; zen share links the exact board', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium'); await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => { (navigator as unknown as { share: unknown }).share = undefined; });
  await seed(page); await page.goto('/?mode=zen&seed=5&diff=difficile'); await G(page).solve(); await tap(page, '#w-share');
  await expect(page.locator('.toast')).toContainText('Copié');
  const clip = await page.evaluate(() => navigator.clipboard.readText()); expect(clip).toContain('Difficile'); expect(clip).toMatch(/mode=zen&seed=5&diff=difficile&layout=/);
});
test('nudges: affordable item shows a wallet dot and a shop link on the win card; streak at stake shows on Modes', async ({ page }) => {
  const d = new Date(); d.setDate(d.getDate() - 1); const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  await seed(page, { carrots: 45, stats: { dailyDone: [y], dailyStreak: 3, bestStreak: 3 } }); await page.goto('/');
  await expect(page.locator('#h-wallet .dot')).toBeVisible(); await expect(page.locator('#h-modes .dot.streak')).toHaveText('🔥3');
  await page.goto('/?level=0'); await G(page).solve(); await expect(page.locator('#w-shop')).toContainText('De quoi t\'offrir');
  await tap(page, '#w-shop'); await expect(page.locator('#v-coll .item').first()).toBeVisible();
});
const ago = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
test('calendar: a missed daily is replayed from Modes, marked "rattrapé", pays 20+ carrots and leaves the streak alone', async ({ page }) => {
  await seed(page, { carrots: 0, stats: { dailyDone: [ago(1)], dailyStreak: 1, bestStreak: 1 } }); await page.goto('/');
  await tap(page, '#h-modes'); await tap(page, '#mo-cal');
  await expect(page.locator('.card.calov')).toContainText('Calendrier des défis');
  const miss = page.locator(`.cal .day.miss[data-day="${ago(2)}"]`); await expect(miss).toBeVisible();
  await expect(page.locator(`.cal [data-day="${ago(1)}"]`)).toHaveCount(0); // won on the day: not a button
  await tap(page, `.cal .day.miss[data-day="${ago(2)}"]`);
  const st = await G(page).state(); expect(st?.mode).toBe('daily'); await expect(page.locator('#g-lvl')).toContainText('Rattrapage');
  await G(page).solve(); await expect(page.locator('.card.win')).toContainText('rattrapé');
  const s = await saveOf(page); expect(s.stats.dailyLate).toEqual([ago(2)]); expect(s.stats.dailyDone).toEqual([ago(1)]); expect(s.stats.dailyStreak).toBe(1);
  expect(s.carrots).toBeGreaterThanOrEqual(20); expect(s.ach).toContain('late1');
  await expect(page.locator('#w-next')).toContainText('Autre défi'); // more missed days remain
  await page.goto('/'); await tap(page, '#h-modes'); await tap(page, '#mo-cal');
  await expect(page.locator(`.cal [data-day="${ago(2)}"]`)).toHaveCount(0); await expect(page.locator('.cal i.ok.late')).toHaveCount(1);
});
test('calendar: shown in Stats too, with month navigation; old days out of the window are not playable', async ({ page }) => {
  await seed(page);
  await page.goto('/'); await tap(page, '#h-coll'); await tap(page, '.tab[data-t="stats"]');
  await expect(page.locator('#v-coll .cal .day.today')).toHaveCount(1);
  if (await page.locator('#v-coll .calnav >> nth=0').isDisabled()) return; // e.g. on the 31st the 30-day window stays in this month
  await tap(page, '#v-coll .calnav >> nth=0'); await expect(page.locator('#v-coll .cal .day.today')).toHaveCount(0);
  expect(await page.locator('#v-coll .cal .day.miss').count()).toBeLessThanOrEqual(30);
  await expect(page.locator('#v-coll .calnav >> nth=0')).toBeDisabled(); // window ends before two months back
});
test('undo budget: HUD shows ∞ in the first world and zen, a counter elsewhere that blocks at 0', async ({ page }) => {
  test.setTimeout(60_000);
  await seed(page); await page.goto('/?level=0'); await expect(page.locator('#g-undo-n')).toHaveText('∞');
  await page.goto('/?mode=zen&seed=3'); await expect(page.locator('#g-undo-n')).toHaveText('∞');
  await page.goto('/?level=20'); await expect(page.locator('#g-undo-n')).toHaveText('3'); await expect(page.locator('#g-undo')).toBeDisabled();
  for (let i = 0; i < 3; i++) { await page.waitForTimeout(4100); await G(page).pairs(1); await tap(page, '#g-undo'); }
  await expect(page.locator('#g-undo-n')).toHaveText('0'); await page.waitForTimeout(4100); await G(page).pairs(1); await expect(page.locator('#g-undo')).toBeDisabled();
  const before = (await G(page).state())!.left; await page.keyboard.press('z'); expect((await G(page).state())!.left).toBe(before);
  await page.goto('/'); await tap(page, '#h-play'); await expect(page.locator('#g-undo-n')).toHaveText('0'); // budget survives resume
});
test('undo budget: a ×4 combo earns one extra undo', async ({ page }) => {
  await seed(page); await page.goto('/?level=20'); await expect(page.locator('#g-undo-n')).toHaveText('3');
  await G(page).pairs(4); await expect(page.locator('#g-undo-n')).toHaveText('4'); await expect(page.locator('.pop', { hasText: '+1 annulation' })).toHaveCount(1);
});

const box = async (p: Page, sel: string) => (await p.locator(sel).boundingBox())!;
const overlaps = (a: { x: number; y: number; width: number; height: number }, b: typeof a) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
test('game HUD music button: big enough, never over the board or other HUD items (844x390, 667x375, desktop)', async ({ page }) => {
  await seed(page, { settings: { sfx: false, music: true, musicVol: 0.3, dim: true, vibrate: false } });
  const sizes = test.info().project.name.startsWith('mobile') ? [{ width: 844, height: 390 }, { width: 667, height: 375 }] : [{ width: 1440, height: 900 }, { width: 1024, height: 640 }];
  for (const vp of sizes) {
    await page.setViewportSize(vp); await page.goto('/?level=6'); await G(page).pairs(4); await expect(page.locator('#g-combo')).toBeVisible();
    await page.locator('#g-combo').evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const m = await box(page, '#g-music'); expect(m.width).toBeGreaterThanOrEqual(44); expect(m.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator('#g-music')).toBeInViewport({ ratio: 1 });
    expect(overlaps(m, await box(page, '#stage'))).toBe(false);
    for (const sel of ['#g-pause', '#g-lvl', '#g-combo', '#g-pairs', '#g-time', '#g-score', '.bar']) expect(overlaps(m, await box(page, sel)), sel).toBe(false);
    await expect(page.locator('#g-score')).toBeInViewport({ ratio: 1 });
  }
});
test('music button: one tap mutes / unmutes music, keeps the chosen volume, persists and stays in sync with settings', async ({ page }) => {
  await seed(page, { settings: { sfx: false, music: true, musicVol: 0.3, dim: true, vibrate: false } }); await page.goto('/?level=0');
  const b = page.locator('#g-music'); await expect(b).toHaveAttribute('aria-label', 'Couper la musique');
  await tap(page, '#g-music'); await expect(page.locator('#g-music')).toHaveAttribute('aria-label', 'Remettre la musique'); await expect(page.locator('#g-music')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#toast')).toHaveText('Musique coupée');
  let st = (await saveOf(page)).settings; expect(st.music).toBe(false); expect(st.musicVol).toBeCloseTo(0.3); expect(st.sfx).toBe(false);
  await page.reload(); await expect(page.locator('#g-music')).toHaveAttribute('aria-label', 'Remettre la musique');
  // settings toggle reflects it, and turning music on there updates the HUD button
  await tap(page, '#g-pause'); await tap(page, '#p-settings'); await expect(page.locator('#s-music')).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('#v-music')).toHaveValue('30');
  await tap(page, '#s-music'); await expect(page.locator('#g-music')).toHaveAttribute('aria-label', 'Couper la musique');
  await tap(page, '#s-ok'); await tap(page, '#p-resume').catch(() => {});
  await tap(page, '#g-music'); await tap(page, '#g-music'); await expect(page.locator('#toast')).toHaveText('Musique activée');
  st = (await saveOf(page)).settings; expect(st.music).toBe(true); expect(st.musicVol).toBeCloseTo(0.3);
});
test('home has the music button in the top corner; slider at 0 shows muted and a tap brings music back audibly', async ({ page }) => {
  await seed(page, { settings: { sfx: false, music: true, musicVol: 0, dim: true, vibrate: false } }); await page.goto('/');
  const h = page.locator('#h-music'); await expect(h).toBeVisible(); await expect(h).toHaveAttribute('aria-label', 'Remettre la musique');
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || (a.effect?.getTiming().iterations ?? 1) === Infinity)); const hb = await box(page, '#h-music'); expect(await page.locator('#h-music').evaluate((e) => (e as HTMLElement).offsetWidth)).toBeGreaterThanOrEqual(44); for (const sel of ['#h-help', '#h-settings', '#h-wallet']) expect(overlaps(hb, await box(page, sel)), sel).toBe(false);
  await tap(page, '#h-music'); await expect(page.locator('#h-music')).toHaveAttribute('aria-label', 'Couper la musique');
  const st = (await saveOf(page)).settings; expect(st.music).toBe(true); expect(st.musicVol).toBeGreaterThan(0.3);
});
test('home: carrot pill and corner buttons never overlap the title or menu (iPhone Safari sizes, notch insets)', async ({ page }) => {
  test.skip(!test.info().project.name.startsWith('mobile'), 'phone sizes');
  await seed(page, { carrots: 85 });
  const cdp = await page.context().newCDPSession(page);
  for (const inset of [null, { top: 0, left: 59, right: 59, bottom: 21 }]) {
    if (inset) await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: inset });
    for (const vp of [{ width: 1024, height: 472 }, { width: 932, height: 430 }, { width: 844, height: 390 }, { width: 667, height: 375 }]) {
      await page.setViewportSize(vp); await page.goto('/'); await expect(page.locator('.logo')).toBeVisible();
      const [w, c, logo, menu] = await Promise.all(['#h-wallet', '.corner', '.logo', '.menu'].map((s) => box(page, s)));
      for (const [a, b, n] of [[w, logo, 'pill/logo'], [w, menu, 'pill/menu'], [c, logo, 'corner/logo'], [c, menu, 'corner/menu']] as const) expect(overlaps(a, b), `${n} ${vp.width}x${vp.height} ${JSON.stringify(inset)}`).toBe(false);
      expect(w.x).toBeGreaterThanOrEqual(inset ? inset.left : 0); expect(c.x + c.width).toBeLessThanOrEqual(vp.width - (inset ? inset.right : 0));
      await expect(page.locator('#h-play')).toBeInViewport({ ratio: 1 }); await expect(page.locator('#h-coll')).toBeInViewport({ ratio: 1 });
    }
  }
  await expect(page.locator('.home .tag')).toHaveCount(0);
});
test('PWA + SEO: standalone manifest with wide screenshots, French meta, JSON-LD, robots and sitemap', async ({ page }) => {
  const m = await (await page.request.get('/manifest.webmanifest')).json();
  expect(m.display).toBe('standalone'); expect(m.display_override).toContain('fullscreen'); expect(m.lang).toBe('fr'); expect(m.id).toBeTruthy(); expect(m.categories).toContain('games');
  expect(m.description).not.toMatch(/doux du web|gratuit|sans pub/i);
  expect(m.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true); expect(m.icons.some((i: { purpose: string }) => i.purpose === 'any')).toBe(true);
  expect(m.screenshots.length).toBeGreaterThanOrEqual(3);
  for (const s of [...m.screenshots, ...m.icons]) expect((await page.request.get('/' + s.src)).status(), s.src).toBe(200);
  for (const s of m.screenshots) { expect(s.form_factor).toBe('wide'); expect(s.label.length).toBeGreaterThan(5); }
  await page.goto('/');
  const meta = (sel: string) => page.locator(sel).getAttribute('content');
  expect(await meta('meta[name="description"]')).not.toMatch(/doux du web|gratuit|sans pub/i); expect(await meta('meta[property="og:description"]')).not.toMatch(/doux du web|gratuit|sans pub/i);
  expect(await meta('meta[property="og:locale"]')).toBe('fr_FR'); expect(await meta('meta[property="og:site_name"]')).toBe('Mahjong Capybaras'); expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
  expect(await meta('meta[name="apple-mobile-web-app-status-bar-style"]')).toBe('black-translucent'); expect(await meta('meta[name="viewport"]')).toContain('viewport-fit=cover');
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://tonimalt-af.github.io/capy-mahjong/');
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!); expect(ld['@type']).toBe('VideoGame'); expect(ld.isAccessibleForFree).toBe(true); expect(ld.inLanguage).toBe('fr');
  expect(await page.title()).toContain('Mahjong Capybaras');
  expect((await page.request.get('/robots.txt')).status()).toBe(200); expect(await (await page.request.get('/sitemap.xml')).text()).toContain('<loc>https://tonimalt-af.github.io/capy-mahjong/</loc>');
});
