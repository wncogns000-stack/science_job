/* 접근성 자동 점검: 박람회 주요 화면을 라이트·다크로 axe-core(WCAG 2.1 AA) 검사.
 * 준비: 빈 폴더에서 npm install axe-core@4.10.2
 * 실행: node tools/a11y-check.js http://localhost:8765 <폴더>/node_modules/axe-core/axe.min.js */
const { chromium } = require('playwright');
const [base, axePath] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch();
  let total = 0;
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, colorScheme: scheme });
    const page = await ctx.newPage();
    const views = [
      ['home', null], ['zone-pop', null],
      ['job-climate', async () => { await page.locator('.opt', { hasText: '한꺼번에' }).click(); }],
      ['job-robot', async () => { await page.locator('.opt', { hasText: '만 다르게' }).click(); await page.waitForTimeout(500); }],
      ['find', null], ['passport', null],
      ['maker', async () => { await page.fill('#mk-name', '하늘길 신호 관리사'); }], ['guide', null]
    ];
    for (const [hash, act] of views) {
      await page.goto(base + '/index.html#' + hash); await page.waitForTimeout(200);
      if (act) await act();
      await page.addScriptTag({ path: axePath });
      const v = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations
        .map(x => x.id + ' [' + x.impact + '] ' + x.nodes.slice(0, 3).map(n => n.target.join(' ') + ' :: ' + ((n.any[0] && n.any[0].message) || '').slice(0, 120)).join(' | ')));
      total += v.length;
      if (v.length) console.log(`${scheme}/${hash}:\n  ` + v.join('\n  '));
    }
    await ctx.close();
  }
  await browser.close();
  console.log(total ? 'violations: ' + total : 'no violations');
  process.exit(total ? 1 : 0);
})();
