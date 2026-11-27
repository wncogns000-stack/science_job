/* 접근성 자동 점검: 대화 화면(기본 모드, 가짜 AI 응답 후)과 옮겨 쓰기 화면을 라이트·다크로 axe-core(WCAG 2.1 AA) 검사.
 * 준비: 빈 폴더에서 npm install axe-core@4.10.2
 * 실행: node tools/a11y-check.js http://localhost:8765 <폴더>/node_modules/axe-core/axe.min.js */
const { chromium } = require('playwright');
const [base, axePath] = process.argv.slice(2);
const MOCK = `window.claude = { use: async (n) => n === 'sample' ? (async (input, o) => { const t = '좋아요. 그 일을 하는 하루를 떠올려 볼까요?'; o.onText && o.onText({ text: t, delta: t }); return { text: t, truncated: false }; }) : null };`;
(async () => {
  const browser = await chromium.launch();
  let total = 0;
  for (const scheme of ['light', 'dark']) {
    for (const mode of ['basic', 'ai']) {
      const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, colorScheme: scheme });
      const page = await ctx.newPage();
      if (mode === 'ai') await page.addInitScript(MOCK);
      await page.goto(base + '/index.html'); await page.waitForSelector('.log .msg');
      await page.fill('#say', '수의사'); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
      await page.selectOption('.msg.student .put', 'dream');
      await page.getByRole('button', { name: '힌트 주세요' }).click(); await page.waitForTimeout(150);
      for (const view of ['chat', 'sum']) {
        if (view === 'sum') { await page.getByRole('button', { name: /^✎\s?옮겨 쓰기$/ }).click(); await page.waitForTimeout(100); }
        await page.addScriptTag({ path: axePath });
        const v = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations
          .map(x => x.id + ' [' + x.impact + '] ' + x.nodes.slice(0, 2).map(n => n.target.join(' ') + ' :: ' + ((n.any[0] && n.any[0].message) || '').slice(0, 110)).join(' | ')));
        total += v.length;
        console.log(`${scheme}/${mode}/${view}: ${v.length ? '\n  ' + v.join('\n  ') : 'no violations'}`);
      }
      await ctx.close();
    }
  }
  await browser.close();
  process.exit(total ? 1 : 0);
})();
