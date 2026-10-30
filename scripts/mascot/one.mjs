import { chromium } from 'playwright';
import * as M from './mascots.mjs';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const pg = await b.newPage({ viewport: { width: 1200, height: 420 } });
await pg.setContent(`<body style="margin:0;background:#fff8ec;display:flex">${['capyA','capyB','capyC'].map(f=>`<svg viewBox="-6 18 112 104" width="400" height="400">${M[f](true)}</svg>`).join('')}</body>`);
await pg.screenshot({ path: '/tmp/one.png' }); await b.close();
