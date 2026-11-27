/* 미래 직업 박람회 동작 시험
 * 실행: python3 -m http.server 8765 를 켠 뒤  node tools/smoke-test.js http://localhost:8765 [저장 폴더] */
const { chromium } = require('playwright');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8765';
const out = process.argv[3] || require('os').tmpdir();
const fail = [];
const ok = (c, m) => { if (!c) fail.push(m); };

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push('console: ' + m.text()); });

  await p.goto(base + '/index.html'); await p.waitForSelector('.zones');
  ok(await p.locator('.zone').count() === 4, '존 4개');
  ok(await p.locator('.all .booth').count() === 24, '부스 24개');
  await p.fill('#q', '빛'); await p.waitForTimeout(80);
  const n = await p.locator('.all .booth').count();
  ok(n > 0 && n < 24, '"빛" 검색 결과가 일부만 나와야 함: ' + n);
  await p.fill('#q', ''); await p.selectOption('#fz', 'env'); await p.waitForTimeout(50);
  ok(await p.locator('.all .booth').count() === 6, '존 필터');

  await p.goto(base + '/index.html#zone-safe'); await p.waitForSelector('.gate');
  ok(await p.locator('.gate .flow li').count() === 3, '존 입구의 3단 흐름');
  ok(await p.locator('.booths .booth').count() === 6, '존 부스 6개');

  await p.goto(base + '/index.html#job-robot'); await p.waitForSelector('.mission');
  await p.locator('.opt', { hasText: '한꺼번에' }).click();
  ok((await p.textContent('.fb')).includes('어느 조건 때문인지'), '두 조건 동시 변경 오답 설명');
  await p.locator('.opt', { hasText: '만 다르게' }).click(); await p.waitForTimeout(100);
  ok(await p.locator('.mission .stamp').count() === 1, '정답이면 도장');
  ok((await p.textContent('.mainnav a[href="#passport"]')).includes('1/24'), '여권 개수 갱신');
  await p.reload(); await p.waitForSelector('.mission');
  ok(await p.locator('.mission.done').count() === 1, '새로 고쳐도 도장 유지');

  await p.goto(base + '/index.html#find'); await p.waitForSelector('.ans');
  for (let i = 0; i < 5; i++) { await p.locator('.ans').first().click(); await p.waitForTimeout(60); }
  ok(await p.locator('.result').count() === 1 && await p.locator('.booths .booth').count() === 3, '추천 부스 3곳');

  await p.goto(base + '/index.html#passport'); await p.waitForSelector('.slots');
  ok(await p.locator('.slot.got').count() === 1, '여권에 도장 1개');
  ok(await p.locator('.badges li.got').count() >= 1, '첫 도장 배지');

  await p.goto(base + '/index.html#maker'); await p.waitForSelector('#mk-name');
  await p.selectOption('#mp', '기후 위기'); await p.selectOption('#mt', '재생 에너지');
  await p.fill('#mk-name', '햇빛 지붕 설계사'); await p.fill('#mk-work', '집집마다 지붕에 맞는 태양 전지판을 설계해요.');
  await p.fill('#mk-why', '이산화 탄소를 줄이려면 집에서도 전기를 만들어야 할 수 있어요.'); await p.fill('#mk-know', '빛, 에너지');
  ok((await p.textContent('#mycard')).includes('햇빛 지붕 설계사'), '카드 미리 보기');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }), p.getByRole('button', { name: '카드 이미지로 저장' }).click()]);
  const file = out + '/expo-card.png';
  await dl.saveAs(file);
  const buf = fs.readFileSync(file);
  ok(buf.slice(1, 4).toString() === 'PNG' && buf.length > 20000, 'PNG 카드 파일');
  await p.waitForSelector('.cardimg');

  await p.goto(base + '/index.html#guide'); await p.waitForSelector('table');
  ok(await p.locator('tbody tr').count() === 4, '안내 표 4줄');

  const ph = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const q = await ph.newPage(); q.on('pageerror', e => errors.push('pageerror: ' + e.message));
  for (const hsh of ['home', 'zone-pop', 'job-uam', 'find', 'maker', 'passport', 'guide']) {
    await q.goto(base + '/index.html#' + hsh); await q.waitForTimeout(150);
    const ov = await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(ov <= 0, '휴대폰 가로 넘침 ' + hsh + ': ' + ov);
  }
  await browser.close();
  console.log(fail.length ? 'FAIL:\n- ' + fail.join('\n- ') : 'all checks passed');
  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  process.exit(fail.length || errors.length ? 1 : 0);
})();
