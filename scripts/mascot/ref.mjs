import { chromium } from 'playwright';
import * as M from './mascots.mjs';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const pg = await b.newPage({ viewport: { width: 1024, height: 512 } });
await pg.setContent(`<body style="margin:0;background:#fff;display:flex">${['capyA','capyB'].map(f=>`<svg viewBox="-6 18 112 104" width="512" height="512">${M[f](true)}</svg>`).join('')}</body>`);
await pg.screenshot({ path: '/workspace/mascot-ref.png' }); await b.close();
