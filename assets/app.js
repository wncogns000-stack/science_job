/* 진로 디딤돌 AI · 화면과 AI 연결
   - claude.ai에서 열면 window.claude.use("sample")로 "이 화면을 연 사람"의 Claude 계정에 묻는다(교사 화면용).
   - 그 밖에서 열면 AI 없이 기본 모드(정해 둔 3단 힌트, 점검 질문)로 동작한다.
   - 대화와 실험관찰 칸 내용은 이 기기 브라우저(localStorage)에만 저장한다. */
(function () {
  'use strict';
  var T = window.DIDIMDOL_TUTOR;
  var STAGES = T.stages;
  var KEY = 'jinro-didimdol-ai-v1';
  var ALLBOX = [];
  STAGES.forEach(function (s) { s.boxes.forEach(function (b) { ALLBOX.push({ stage: s.n, k: b.k, label: b.label, ph: b.ph }); }); });
  var GONE = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'invalid_request', 'transform_error', 'queue_overflow'];

  /* ---------- 상태 ---------- */
  function fresh() { return { v: 1, stage: 1, view: 'chat', items: [], boxes: {}, hint: {}, seen: {}, ack: {}, tier: 'default', size: '', draft: '' }; }
  var st = (function () {
    try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.v === 1 && Array.isArray(s.items)) return s; } catch (e) { /* 저장소가 막혀도 동작 */ }
    return fresh();
  })();
  var saveT = null;
  function saveNow() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* 무시 */ } }
  function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 200); }
  window.addEventListener('pagehide', saveNow);
  var seq = st.items.reduce(function (m, it) { return Math.max(m, it.id || 0); }, 0);
  function push(it) { it.id = ++seq; it.stage = it.stage || st.stage; st.items.push(it); return it; }
  function drop(it) { var i = st.items.indexOf(it); if (i >= 0) st.items.splice(i, 1); }

  /* ---------- 작은 도구 ---------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  }
  function josa(w, pair) {
    var p = pair.split('/'), word = String(w || '');
    var s = word.replace(/\s*\([^)]*\)\s*$/, '').trim(), c = s.charCodeAt(s.length - 1);
    if (!(c >= 0xAC00 && c <= 0xD7A3)) return word + p[0] + '(' + p[1] + ')';
    return word + ((c - 0xAC00) % 28 ? p[0] : p[1]);
  }
  function tidy(t) { return String(t || '').replace(/\*\*|__/g, '').replace(/^#{1,6}\s*/gm, '').trim(); }
  function dream() { return (st.boxes.dream || '').trim() || '내가 하고 싶은 일'; }
  var toastT = null;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---------- AI 연결 ---------- */
  var ai = { mode: 'checking', fn: null, why: '' };
  var busy = null;
  function detectAI() {
    var c = window.claude;
    if (!c || typeof c.use !== 'function') { setMode('basic', 'outside'); return; }
    Promise.resolve().then(function () { return c.use('sample'); }).then(function (fn) {
      if (typeof fn === 'function') { ai.fn = fn; setMode('ai'); } else setMode('basic', 'unavailable');
    }, function () { setMode('basic', 'unavailable'); });
  }
  function setMode(m, why) { ai.mode = m; ai.why = why || ''; renderBanner(); renderComposer(); renderPanel(); }

  function header(extra) {
    var s = STAGES[st.stage - 1];
    var out = ['[현재 단계] ' + s.n + '. ' + s.name + ' (실험관찰 ' + s.wb + ')'];
    if (extra.hint) out.push('[힌트 단계] ' + extra.hint);
    if (extra.review) out.push('[칸 검토 요청] ' + extra.review);
    var got = ALLBOX.filter(function (b) { return (st.boxes[b.k] || '').trim(); })
      .map(function (b) { return b.label + ': ' + st.boxes[b.k].trim().slice(0, 300); });
    out.push('[학생이 실험관찰 칸에 적은 것] ' + (got.length ? got.join(' / ') : '아직 없음'));
    return out.join('\n');
  }
  function buildInput(text, extra) {
    var turns = [{ role: 'user', content: T.rules }];
    st.items.slice(-24).forEach(function (it) {
      var t = String(it.sent || it.text || '').trim().slice(0, 1500);
      if (!t) return;
      if (it.who === 'ai') turns.push({ role: 'assistant', content: t });
      else if (it.who === 'student') turns.push({ role: 'user', content: '학생: ' + t });
      else turns.push({ role: 'user', content: '[화면 안내] ' + t });
    });
    turns.push({ role: 'user', content: header(extra) + '\n\n학생: ' + text });
    return turns;
  }
  function send(text, extra) {
    extra = extra || {};
    text = String(text || '').trim();
    if (!text || busy) return false;
    if (ai.mode !== 'ai') { basicReply(text, extra); return true; }
    var input = buildInput(text, extra);
    push({ who: 'student', text: extra.display || text, sent: text });
    var item = push({ who: 'ai', text: '', pending: true });
    var ctl = new AbortController();
    busy = ctl;
    var opts = { cache: false, signal: ctl.signal, onText: function (u) { item.text = tidy(u.text); paint(item); } };
    if (st.tier === 'quick') opts.modelTier = 'quick'; else { opts.modelTier = 'default'; opts.effort = 'low'; }
    renderLog(); renderComposer(); save();
    ai.fn(input, opts).then(function (r) {
      item.text = tidy(r.text);
      if (r.truncated) item.note = '답이 길어 중간에 끊겼어요. 짧게 다시 물어봐도 돼요.';
    }, function (e) {
      var code = (e && e.code) || 'upstream_error';
      item.text = code === 'refused' ? '' : tidy(e && e.text);
      if (code === 'cancelled') item.note = item.text ? '여기서 멈췄어요.' : '';
      else if (code === 'refused') item.note = '이 말에는 AI가 답하지 않았어요. 오늘 활동과 관련된 말로 다시 적어 볼까요?';
      else if (code === 'rate_limited') item.note = 'AI를 잠시 너무 많이 불렀어요. 조금 뒤에 다시 보내 주세요.';
      else if (code === 'session_expired') item.note = 'claude.ai에 다시 로그인해야 AI가 답할 수 있어요.';
      else if (GONE.indexOf(code) >= 0) { item.note = 'AI를 쓸 수 없어 기본 모드로 바꿨어요. 힌트 버튼은 그대로 쓸 수 있어요.'; setMode('basic', code); }
      else { item.note = 'AI 연결이 잠깐 끊겼어요.'; item.retry = { text: text, extra: extra }; }
      if (!item.text && !item.note) drop(item);
    }).then(function () {
      item.pending = false; busy = null; save(); renderLog(); renderComposer();
    });
    return true;
  }
  function basicReply(text, extra) {
    push({ who: 'student', text: extra.display || text, sent: text });
    var s = STAGES[st.stage - 1];
    if (extra.hint) push({ who: 'note', text: '힌트 ' + extra.hint + '단계 · ' + s.hints[extra.hint - 1] });
    else if (extra.reviewKey) push({ who: 'note', text: '스스로 점검 · ' + (T.criteria[extra.reviewKey] || '내 문장을 소리 내어 읽어 보세요.') });
    else if (!st.ack[st.stage]) { st.ack[st.stage] = 1; push({ who: 'note', text: '좋아요. 그 생각을 "내 실험관찰 칸"에 담아 보세요. 막히면 "힌트 주세요"를 눌러요.' }); }
    save(); renderLog();
  }
  function askHint() {
    var lv = Math.min(3, (st.hint[st.stage] || 0) + 1);
    if (send('힌트 주세요.', { hint: lv, display: '힌트 주세요 (' + lv + '단계)' })) st.hint[st.stage] = lv;
  }
  function review(b) {
    var v = (st.boxes[b.k] || '').trim();
    if (!v) { toast('먼저 칸에 내 문장을 적어 주세요.'); return; }
    send('제 "' + b.label + '" 칸을 봐 주세요: ' + v, { review: b.label, reviewKey: b.k, display: '"' + b.label + '" 칸을 봐 주세요.' });
  }
  function goStage(n) {
    if (busy) busy.abort();
    st.stage = n; st.view = 'chat';
    if (!st.seen[n]) { st.seen[n] = 1; push({ who: 'note', text: STAGES[n - 1].lead(dream(), josa), stage: n }); }
    save(); renderAll();
    var say = document.getElementById('say'); if (say) say.focus({ preventScroll: true });
  }

  /* ---------- 화면 ---------- */
  var els = {};
  function renderAll() {
    var root = document.getElementById('app');
    root.textContent = '';
    document.documentElement.setAttribute('data-size', st.size === 'lg' ? 'lg' : 'md');
    root.appendChild(h('header', { class: 'topbar' }, h('div', { class: 'wrap bar' },
      h('div', { class: 'title' }, '진로 디딤돌 AI'),
      h('span', { class: 'pg' }, '실험관찰 58~59쪽'),
      h('button', { type: 'button', class: 'tb-btn', 'aria-pressed': st.size === 'lg' ? 'true' : 'false', onclick: function () { st.size = st.size === 'lg' ? '' : 'lg'; save(); renderAll(); } }, st.size === 'lg' ? '보통 글자' : '크게 보기'))));
    var main = h('main', { class: 'wrap', id: 'main' });
    main.appendChild(h('div', { class: 'hero' },
      h('p', { class: 'eyebrow' }, '6학년 2학기 과학 · 4. 과학과 나의 진로 · 교과서 92~93쪽'),
      h('h1', null, '나의 진로는 과학과 어떤 관련이 있을까?')));
    els.banner = h('p', { class: 'banner', role: 'status' });
    main.appendChild(els.banner);
    var nav = h('nav', { class: 'stages', 'aria-label': '단계' });
    STAGES.forEach(function (s) {
      var done = s.boxes.every(function (b) { return (st.boxes[b.k] || '').trim(); });
      nav.appendChild(h('button', { type: 'button', class: 'stage' + (done ? ' done' : ''), 'aria-current': st.view === 'chat' && st.stage === s.n ? 'step' : null, onclick: function () { goStage(s.n); } },
        h('span', { class: 'n' }, String(s.n)), s.name));
    });
    nav.appendChild(h('button', { type: 'button', class: 'stage', 'aria-current': st.view === 'sum' ? 'step' : null, onclick: function () { if (busy) busy.abort(); st.view = 'sum'; save(); renderAll(); } }, h('span', { class: 'n' }, '✎'), '옮겨 쓰기'));
    main.appendChild(nav);
    if (st.view === 'sum') main.appendChild(renderSummary());
    else main.appendChild(renderWork());
    main.appendChild(renderGuide());
    root.appendChild(main);
    root.appendChild(h('div', { id: 'toast', class: 'toast', role: 'status', hidden: true }));
    renderBanner(); renderLog(); renderComposer(); renderPanel();
  }
  function renderBanner() {
    if (!els.banner) return;
    var msg = {
      checking: 'AI 연결을 확인하고 있어요…',
      ai: 'AI 연결됨 · 이 화면을 연 사람의 Claude 계정으로 답해요. 처음 보낼 때 허용 창이 뜰 수 있어요.',
      basic: 'AI 없이 기본 모드로 동작해요. 단계 안내와 3단 힌트, 칸 점검은 그대로 쓸 수 있어요.'
    }[ai.mode];
    if (ai.mode === 'basic' && ai.why === 'outside') msg += ' (AI는 claude.ai에서 열었을 때 연결돼요.)';
    els.banner.textContent = msg;
    els.banner.className = 'banner ' + ai.mode;
  }
  function renderWork() {
    var s = STAGES[st.stage - 1];
    els.log = h('div', { class: 'log', role: 'log', 'aria-live': 'polite', 'aria-label': '대화', tabindex: '0' });
    var say = h('textarea', { id: 'say', class: 'note', rows: 2, placeholder: '내 생각을 적어 보내요. Enter는 보내기, Shift+Enter는 줄 바꿈', 'aria-label': 'AI에게 보낼 말' });
    say.value = st.draft || '';
    say.addEventListener('input', function () { st.draft = say.value; save(); });
    say.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); doSend(); }
    });
    els.say = say;
    els.sendBtn = h('button', { type: 'button', class: 'btn primary', onclick: doSend }, '보내기');
    els.stopBtn = h('button', { type: 'button', class: 'btn', hidden: true, onclick: function () { if (busy) busy.abort(); } }, '멈추기');
    els.hintBtn = h('button', { type: 'button', class: 'btn', onclick: askHint }, '힌트 주세요');
    var next = s.n < STAGES.length
      ? h('button', { type: 'button', class: 'btn ghost', onclick: function () { goStage(s.n + 1); } }, '다음 단계 →')
      : h('button', { type: 'button', class: 'btn ghost', onclick: function () { if (busy) busy.abort(); st.view = 'sum'; save(); renderAll(); } }, '옮겨 쓰기 →');
    els.status = h('p', { class: 'status', 'aria-live': 'polite' });
    var chat = h('section', { class: 'chat', 'aria-label': 'AI와 대화' }, els.log,
      h('div', { class: 'composer' }, say, h('div', { class: 'row' }, els.sendBtn, els.stopBtn, els.hintBtn, next), els.status));
    els.panel = h('aside', { class: 'panel', 'aria-label': '내 실험관찰 칸' });
    return h('div', { class: 'work' }, chat, els.panel);
  }
  function doSend() {
    var v = els.say.value;
    if (!v.trim() || busy) return;
    if (send(v, {})) { els.say.value = ''; st.draft = ''; save(); }
  }
  function bubble(it) {
    var who = { ai: 'AI', student: '나', note: '안내' }[it.who] || '';
    var d = h('div', { class: 'msg ' + it.who + (it.pending ? ' pending' : ''), 'data-id': it.id }, h('span', { class: 'who' }, who));
    if (it.text || it.pending) d.appendChild(h('p', { class: 'txt' }, it.text || '생각하고 있어요…'));
    if (it.note) d.appendChild(h('p', { class: 'mnote' }, it.note));
    if (it.retry) d.appendChild(h('button', { type: 'button', class: 'btn small', onclick: function () {
      var i = st.items.indexOf(it), prev = st.items[i - 1], r = it.retry;
      drop(it); if (prev && prev.who === 'student') drop(prev);
      send(r.text, r.extra);
    } }, '다시 보내기'));
    if (it.who === 'student' && it.stage === st.stage && !/^힌트 주세요|칸을 봐 주세요\.$/.test(it.text)) {
      var sel = h('select', { class: 'put', 'aria-label': '이 말을 실험관찰 칸에 담기' }, h('option', { value: '' }, '칸에 담기…'));
      STAGES[st.stage - 1].boxes.forEach(function (b) { sel.appendChild(h('option', { value: b.k }, b.label)); });
      sel.addEventListener('change', function () {
        var k = sel.value; if (!k) return;
        var cur = (st.boxes[k] || '').trim();
        st.boxes[k] = cur ? cur + '\n' + it.text : it.text;
        var ta = document.getElementById('box-' + k); if (ta) ta.value = st.boxes[k];
        sel.value = ''; save(); toast('칸에 담았어요. 칸에서 고쳐 쓸 수 있어요.');
      });
      d.appendChild(sel);
    }
    return d;
  }
  function renderLog() {
    if (!els.log || !document.body.contains(els.log)) return;
    var near = els.log.scrollHeight - els.log.scrollTop - els.log.clientHeight < 120;
    els.log.textContent = '';
    st.items.forEach(function (it) { els.log.appendChild(bubble(it)); });
    if (near || busy) els.log.scrollTop = els.log.scrollHeight;
  }
  function paint(it) {
    if (!els.log) return;
    var d = els.log.querySelector('[data-id="' + it.id + '"] .txt');
    if (!d) { renderLog(); return; }
    var near = els.log.scrollHeight - els.log.scrollTop - els.log.clientHeight < 120;
    d.textContent = it.text;
    if (near) els.log.scrollTop = els.log.scrollHeight;
  }
  function renderComposer() {
    if (!els.sendBtn || !document.body.contains(els.sendBtn)) return;
    els.sendBtn.hidden = !!busy; els.stopBtn.hidden = !busy;
    els.hintBtn.disabled = !!busy;
    els.status.textContent = busy ? 'AI가 생각하고 있어요. 길면 30초쯤 걸릴 수 있어요.' : '';
  }
  function renderPanel() {
    if (!els.panel || !document.body.contains(els.panel)) return;
    var s = STAGES[st.stage - 1];
    els.panel.textContent = '';
    els.panel.appendChild(h('h2', null, '내 실험관찰 칸'));
    els.panel.appendChild(h('p', { class: 'sub' }, '실험관찰 ' + s.wb + ' · 대화하며 떠오른 내 문장을 여기에 적어요.'));
    s.boxes.forEach(function (b) {
      var id = 'box-' + b.k;
      var ta = h('textarea', { id: id, class: 'note', rows: 3, placeholder: b.ph || '' });
      ta.value = st.boxes[b.k] || '';
      ta.addEventListener('input', function () { st.boxes[b.k] = ta.value; save(); });
      els.panel.appendChild(h('div', { class: 'wbox' }, h('label', { class: 'lab', for: id }, b.label), ta,
        h('button', { type: 'button', class: 'btn small', onclick: function () { review(b); } }, ai.mode === 'ai' ? 'AI에게 봐 달라고 하기' : '스스로 점검하기')));
    });
  }
  function summaryText() {
    var lines = ['[나의 진로는 과학과 어떤 관련이 있을까?]'];
    STAGES.forEach(function (s) {
      lines.push('', '■ ' + s.n + '. ' + s.name + ' (실험관찰 ' + s.wb + ')');
      s.boxes.forEach(function (b) { lines.push('- ' + b.label + ': ' + ((st.boxes[b.k] || '').trim() || '(비어 있음)')); });
    });
    return lines.join('\n');
  }
  function renderSummary() {
    var sec = h('section', { class: 'sum', 'aria-labelledby': 'sum-title' },
      h('h2', { id: 'sum-title' }, '실험관찰에 옮겨 쓰기'),
      h('p', { class: 'look' }, '내 칸에 적은 문장을 실험관찰 순서대로 모았어요. 그대로 베끼기보다 소리 내어 읽어 보고, 더 좋은 표현이 떠오르면 고쳐서 옮겨 써요.'));
    STAGES.forEach(function (s) {
      sec.appendChild(h('h3', { class: 'wb-page' }, s.n + '. ' + s.name + ' · 실험관찰 ' + s.wb));
      var grid = h('div', { class: 'wb-grid' });
      s.boxes.forEach(function (b) {
        var v = (st.boxes[b.k] || '').trim();
        grid.appendChild(h('div', { class: 'wbox' }, h('span', { class: 'lab' }, b.label),
          v ? h('p', { class: 'hand' }, v) : h('p', { class: 'empty' }, '아직 비어 있어요. ', h('button', { type: 'button', class: 'linkish', onclick: function () { goStage(s.n); } }, s.n + '단계에서 생각하기'))));
      });
      sec.appendChild(grid);
    });
    var area = h('div', { class: 'row' });
    area.appendChild(h('button', { type: 'button', class: 'btn', onclick: function () {
      var text = summaryText();
      function fail() { var ta = h('textarea', { class: 'note', rows: 8, readonly: true, 'aria-label': '복사할 내용' }); ta.value = text; area.appendChild(ta); ta.select(); toast('선택된 글을 복사해 주세요.'); }
      try { navigator.clipboard.writeText(text).then(function () { toast('복사했어요.'); }, fail); } catch (e) { fail(); }
    } }, '정리한 내용 복사하기'));
    var conf = h('div', { class: 'confirm', hidden: true }, h('span', null, '대화와 칸 내용을 모두 지우고 처음부터 할까요? 되돌릴 수 없어요.'),
      h('button', { type: 'button', class: 'btn small', onclick: function () { var keep = { tier: st.tier, size: st.size }; st = fresh(); st.tier = keep.tier; st.size = keep.size; seq = 0; start(); toast('처음부터 다시 시작해요.'); } }, '모두 지우기'),
      h('button', { type: 'button', class: 'btn small ghost', onclick: function () { conf.hidden = true; } }, '그만두기'));
    area.appendChild(h('button', { type: 'button', class: 'btn ghost', onclick: function () { conf.hidden = false; } }, '처음부터 다시 하기'));
    sec.appendChild(area); sec.appendChild(conf);
    return sec;
  }
  function renderGuide() {
    var radios = h('fieldset', { class: 'tier' }, h('legend', null, 'AI 답 방식'));
    [['default', '꼼꼼하게', '조금 더 생각하고 답해요(첫 글자까지 수십 초 걸릴 수 있어요).'], ['quick', '빠르게', '바로 답하지만 덜 꼼꼼할 수 있어요.']].forEach(function (o) {
      var id = 'tier-' + o[0];
      var r = h('input', { type: 'radio', name: 'tier', id: id, value: o[0] });
      r.checked = st.tier === o[0];
      r.addEventListener('change', function () { if (r.checked) { st.tier = o[0]; save(); } });
      radios.appendChild(h('label', { for: id }, r, h('b', null, o[1]), ' ' + o[2]));
    });
    var ul = h('ul', null,
      h('li', null, 'claude.ai에서 이 화면을 열면, 화면을 연 사람(선생님)의 Claude 계정 사용량으로 AI가 답합니다. 처음 보낼 때 허용 창이 뜹니다.'),
      h('li', null, 'Claude 소비자 서비스는 만 18세 이상만 쓸 수 있어서, 학생이 각자 이 링크로 AI를 쓰는 방식은 맞지 않습니다. 교사 화면에 띄워 학생의 말을 받아 적는 방식으로 쓰세요.'),
      h('li', null, 'claude.ai 밖(파일, 웹 주소)에서 열면 AI 없이 기본 모드로 동작합니다.'),
      h('li', null, '대화와 칸 내용은 이 기기 브라우저에만 저장됩니다. 학생이 바뀔 때는 "옮겨 쓰기"의 "처음부터 다시 하기"를 누르세요.'),
      h('li', null, 'AI는 정답을 대신 쓰지 않도록 지시받지만, 틀리거나 지시를 벗어날 수 있습니다. 답을 함께 읽고 판단해 주세요.'));
    return h('details', { class: 'guide' }, h('summary', null, '선생님용 안내와 설정'), h('div', { class: 'body' }, radios, ul, h('p', { class: 'intro' }, '학생에게 보이는 첫 안내: ' + T.intro)));
  }

  function start() {
    if (!st.items.length) {
      push({ who: 'note', text: T.intro, stage: 1 });
      st.seen = {}; st.seen[st.stage] = 1;
      push({ who: 'note', text: STAGES[st.stage - 1].lead(dream(), josa) });
      save();
    }
    st.items.forEach(function (it) { if (it.pending) { it.pending = false; if (!it.text) it.note = '이전 답이 끝나지 않았어요.'; } });
    renderAll();
  }
  function boot() { start(); detectAI(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
