const { chromium } = require('playwright');
const base = process.argv[2];
const out = process.argv[3] || require("os").tmpdir();
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 800 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(base + '/index.html#home');
  await page.waitForSelector('.route');
  console.log('stops:', await page.locator('.stop').count());
  await page.screenshot({ path: out + '/home.png', fullPage: true });
  for (let s = 1; s <= 6; s++) {
    await page.goto(base + '/index.html#s' + s + '-1');
    await page.waitForSelector('.rail');
    const nSteps = await page.locator('.rail button').count();
    for (let k = 1; k <= nSteps; k++) {
      await page.evaluate(h => { location.hash = h; }, 's' + s + '-' + k);
      await page.waitForTimeout(80);
      // click every first chip in each chips group (skip tabs)
      const groups = await page.locator('.step .chips[role="group"]').count();
      for (let g = 0; g < groups; g++) {
        const chip = page.locator('.step .chips[role="group"]').nth(g).locator('button').first();
        if (await chip.count()) { await chip.click(); await page.waitForTimeout(30); }
      }
      // click first pick card
      const pick = page.locator('.step .pick').first();
      if (await pick.count()) { await pick.click(); await page.waitForTimeout(30); }
      // fill textareas/inputs
      const fields = page.locator('.step textarea.note, .step input.note');
      const nf = await fields.count();
      for (let i = 0; i < nf; i++) { const f = fields.nth(i); if (await f.isVisible()) await f.fill('테스트 ' + s + '-' + k + '-' + i); }
      // climb ladders
      for (let t = 0; t < 4; t++) { const lb = page.locator('.step .lbtn').first(); if (await lb.count()) { await lb.click(); await page.waitForTimeout(20); } }
      // mixer spin
      const spin = page.locator('[data-fid="mx-spin"]');
      if (await spin.count()) { await spin.click(); await page.waitForTimeout(50); }
      console.log(`s${s}-${k}: fields=${nf} chips=${groups}`);
    }
    await page.screenshot({ path: out + `/s${s}-sum.png`, fullPage: true });
  }
  // home again, progress
  await page.goto(base + '/index.html#home');
  await page.waitForTimeout(100);
  const prog = await page.locator('.stop-card .sub').allTextContents();
  console.log('progress:', prog.join(' | '));
  // body horizontal overflow check at phone width
  await page.setViewportSize({ width: 390, height: 844 });
  for (const h of ['home', 's1-1', 's2-2', 's3-5', 's4-5', 's5-1', 's6-1', 's1-5']) {
    await page.evaluate(x => { location.hash = x; }, h);
    await page.waitForTimeout(120);
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (ov > 0) console.log('OVERFLOW', h, ov);
  }
  await page.evaluate(x => { location.hash = x; }, 's1-1');
  await page.waitForTimeout(100);
  await page.screenshot({ path: out + '/phone-s1-1.png', fullPage: false });
  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
