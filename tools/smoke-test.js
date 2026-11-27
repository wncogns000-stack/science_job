/* 진로 디딤돌 AI 동작 시험 (실제 AI 대신 가짜 sample 함수를 넣어 흐름을 확인한다)
 * 실행: python3 -m http.server 8765 를 켠 뒤  node tools/smoke-test.js http://localhost:8765 [스크린샷 폴더]
 * 실제 Claude의 답 품질은 이 시험으로 알 수 없다. claude.ai에서 직접 써 봐야 한다. */
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:8765';
const out = process.argv[3] || require('os').tmpdir();
const fail = [];
const ok = (cond, msg) => { if (!cond) fail.push(msg); };

function mockScript(behavior) {
  // 페이지가 뜨기 전에 window.claude 를 흉내 낸다. 받은 입력은 window.__calls 에 쌓는다.
  return `(() => {
    window.__calls = [];
    const behavior = ${JSON.stringify(behavior)};
    async function sample(input, opts) {
      window.__calls.push({ input, opts: { modelTier: opts.modelTier, effort: opts.effort, cache: opts.cache } });
      const last = input[input.length - 1].content;
      if (behavior === 'deny') throw { code: 'not_granted', message: 'no' };
      if (/에러시험/.test(last)) throw { code: 'upstream_error', message: 'x', text: '부분 답' };
      const reply = /힌트 단계/.test(last) ? '그 일을 하는 하루를 떠올려 볼까요?' : /칸 검토 요청/.test(last) ? '잘된 점이 있어요. 어떤 장면에서 쓰일까요?' : '좋아요. 어떤 기술이 떠오르나요?';
      const parts = [reply.slice(0, 5), reply.slice(5, 12), reply.slice(12)];
      let text = '';
      for (const p of parts) { if (!p) continue; await new Promise(r => setTimeout(r, 30)); text += p; opts.onText && opts.onText({ text, delta: p }); }
      return { text, truncated: false, modelTierApplied: opts.modelTier || 'default' };
    }
    window.claude = { use: async (name) => (name === 'sample' ? sample : null) };
  })();`;
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const watch = (p) => { p.on('pageerror', e => errors.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push('console: ' + m.text()); }); };

  // 1) AI 없이(기본 모드)
  let ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  let p = await ctx.newPage(); watch(p);
  await p.goto(base + '/index.html'); await p.waitForSelector('.log .msg');
  ok((await p.locator('.banner.basic').count()) === 1, '기본 모드 배너가 보여야 함');
  await p.fill('#say', '수의사'); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
  ok((await p.locator('.msg.student').count()) === 1, '학생 말이 대화에 올라가야 함');
  await p.selectOption('.msg.student .put', 'dream'); await p.waitForTimeout(50);
  ok((await p.inputValue('#box-dream')) === '수의사', '칸에 담기로 하고 싶은 일 칸이 채워져야 함');
  await p.getByRole('button', { name: '힌트 주세요' }).click(); await p.waitForTimeout(50);
  ok((await p.locator('.msg.note', { hasText: '힌트 1단계' }).count()) === 1, '기본 모드 힌트 1단계');
  await p.getByRole('button', { name: '다음 단계 →' }).click(); await p.waitForTimeout(80);
  ok((await p.locator('.msg.note', { hasText: '수의사와 관련된' }).count()) === 1, '2단계 안내에 조사(와)가 맞게 들어가야 함');
  await p.screenshot({ path: out + '/ai-basic-desktop.png', fullPage: true });
  await ctx.close();

  // 2) 가짜 AI 연결
  ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  p = await ctx.newPage(); watch(p);
  await p.addInitScript(mockScript('ok'));
  await p.goto(base + '/index.html'); await p.waitForSelector('.banner.ai');
  await p.fill('#say', '아픈 동물을 돕는 일'); await p.getByRole('button', { name: '보내기', exact: true }).click();
  await p.waitForFunction(() => !document.querySelector('.msg.pending')); await p.waitForTimeout(50);
  let calls = await p.evaluate(() => window.__calls);
  ok(calls.length === 1, 'AI 호출 1번');
  const inp = calls[0].input;
  ok(inp[0].role === 'user' && /진로 디딤돌 AI/.test(inp[0].content), '첫 턴은 지시문');
  ok(inp[inp.length - 1].role === 'user' && /\[현재 단계\] 1\./.test(inp[inp.length - 1].content), '마지막 턴은 현재 단계가 붙은 학생 말');
  ok(calls[0].opts.cache === false && calls[0].opts.modelTier === 'default' && calls[0].opts.effort === 'low', '대화는 캐시 끄고 default/low');
  ok((await p.locator('.msg.ai .txt').last().textContent()).includes('기술이 떠오르나요'), 'AI 답이 화면에 나와야 함');
  await p.fill('#box-dream', '수의사'); await p.getByRole('button', { name: 'AI에게 봐 달라고 하기' }).click();
  await p.waitForFunction(() => window.__calls.length === 2 && !document.querySelector('.msg.pending'));
  calls = await p.evaluate(() => window.__calls);
  ok(/\[칸 검토 요청\] 미래에 내가 하고 싶은 일/.test(calls[1].input[calls[1].input.length - 1].content), '칸 검토 요청이 전달되어야 함');
  await p.getByRole('button', { name: '힌트 주세요' }).click();
  await p.waitForFunction(() => window.__calls.length === 3 && !document.querySelector('.msg.pending'));
  calls = await p.evaluate(() => window.__calls);
  ok(/\[힌트 단계\] 1/.test(calls[2].input[calls[2].input.length - 1].content), '힌트 단계 1 전달');
  await p.fill('#say', '에러시험'); await p.getByRole('button', { name: '보내기', exact: true }).click();
  await p.waitForSelector('text=다시 보내기');
  ok((await p.locator('.msg.ai .mnote', { hasText: '연결이 잠깐 끊겼어요' }).count()) === 1, '연결 오류 안내');
  await p.getByRole('button', { name: /미래 과학 기술/ }).click(); await p.waitForTimeout(80);
  ok((await p.locator('#box-tech1').count()) === 1, '2단계 칸이 보여야 함');
  await p.getByRole('button', { name: /^✎\s?옮겨 쓰기$/ }).click(); await p.waitForTimeout(80);
  ok((await p.locator('.wbox .hand', { hasText: '수의사' }).count()) >= 1, '옮겨 쓰기에 칸 내용이 보여야 함');
  await p.screenshot({ path: out + '/ai-summary.png', fullPage: true });
  await p.getByRole('button', { name: '처음부터 다시 하기' }).click(); await p.getByRole('button', { name: '모두 지우기' }).click(); await p.waitForTimeout(80);
  ok((await p.locator('.msg.student').count()) === 0, '처음부터 다시 하면 대화가 비어야 함');
  await ctx.close();

  // 3) 허용 거부 → 기본 모드로 전환
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  p = await ctx.newPage(); watch(p);
  await p.addInitScript(mockScript('deny'));
  await p.goto(base + '/index.html'); await p.waitForSelector('.banner.ai');
  await p.fill('#say', '요리사'); await p.getByRole('button', { name: '보내기', exact: true }).click(); await p.waitForSelector('.banner.basic');
  ok(true, '');
  const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(over <= 0, '휴대폰 폭에서 가로 넘침 없어야 함: ' + over);
  await p.screenshot({ path: out + '/ai-phone.png', fullPage: false });
  await ctx.close();
  await browser.close();

  console.log(fail.length ? 'FAIL:\n- ' + fail.join('\n- ') : 'all checks passed');
  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  process.exit(fail.length || errors.length ? 1 : 0);
})();
