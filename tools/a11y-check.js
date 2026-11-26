/* 접근성 자동 점검: 모든 화면을 라이트·다크로 열어 axe-core(WCAG 2.1 AA)로 검사한다.
 * 준비: 빈 폴더에서 npm install axe-core@4.10.2
 * 실행: node tools/a11y-check.js http://localhost:8765 <폴더>/node_modules/axe-core/axe.min.js */
const { chromium } = require('playwright');
const [base, axePath] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch();
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 }, colorScheme: scheme });
    const page = await ctx.newPage();
    const agg = {};
    const routes = ['home', 'guide'];
    const steps = { 1: 5, 2: 6, 3: 6, 4: 7, 5: 5, 6: 6 };
    for (const s in steps) for (let k = 1; k <= steps[s]; k++) routes.push('s' + s + '-' + k);
    await page.goto(base + '/index.html#home'); await page.waitForSelector('.route');
    for (const r of routes) {
      await page.evaluate(h => { location.hash = h; }, r); await page.waitForTimeout(80);
      // reveal dynamic bits: first chip, first hint rung, first pick card
      const chip = page.locator('.step .chips[role="group"] button').first();
      if (await chip.count()) { await chip.click(); await page.waitForTimeout(30); }
      const lb = page.locator('.step .lbtn').first();
      if (await lb.count()) { await lb.click(); await page.waitForTimeout(30); }
      const pick = page.locator('.step .pick').first();
      if (await pick.count()) { await pick.click(); await page.waitForTimeout(30); }
      await page.addScriptTag({ path: axePath });
      const res = await page.evaluate(async () => {
        const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
        return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 3).map(n => n.target.join(' ') + ' :: ' + (n.any[0] && n.any[0].message || '').slice(0, 120)) }));
      });
      for (const v of res) { const a = agg[v.id] || (agg[v.id] = { impact: v.impact, routes: [], samples: new Set() }); a.routes.push(r + '(' + v.n + ')'); v.sample.forEach(x => a.samples.add(x)); }
    }
    console.log('=== ' + scheme + ' ===');
    const ids = Object.keys(agg);
    if (!ids.length) console.log('no violations');
    for (const id of ids) { const a = agg[id]; console.log(`- ${id} [${a.impact}] on ${a.routes.length} views: ${a.routes.slice(0, 6).join(', ')}`); [...a.samples].slice(0, 5).forEach(x => console.log('    ' + x)); }
    await ctx.close();
  }
  await browser.close();
})();
