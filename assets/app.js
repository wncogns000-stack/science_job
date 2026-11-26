/* 생각 디딤돌 엔진
   콘텐츠 파일(assets/s1.js ~ s6.js)이 window.APP_STATIONS 에 정거장을 넣어 두면,
   이 파일이 지도(홈)·디딤돌·실험관찰 옮겨 쓰기 화면을 그린다. 서버 없이 동작하고,
   학생이 쓴 내용은 이 기기의 브라우저(localStorage)에만 저장된다. */
(function () {
  'use strict';
  var STATIONS = (window.APP_STATIONS || []).slice().sort(function (a, b) { return a.num - b.num; });
  var DATA = window.APP_DATA || {};
  var KEY = 'saenggak-didimdol-v1';
  var BASE_TITLE = '생각 디딤돌';
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { state = {}; }

  /* ---------- 저장 ---------- */
  var saveTimer = null;
  function saveNow() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 저장이 막힌 환경에서도 화면은 동작 */ } }
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250); }
  window.addEventListener('pagehide', saveNow);
  function bucket(sid) { if (!state[sid] || typeof state[sid] !== 'object') state[sid] = {}; return state[sid]; }
  function get(sid, k, d) { var b = state[sid]; return b && b[k] !== undefined ? b[k] : d; }
  function set(sid, k, v) { bucket(sid)[k] = v; save(); }
  function filled(v) { return Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim().length > 0 : v != null && v !== false && v !== ''; }
  function ui(k, d) { return get('_ui', k, d); }

  /* ---------- 작은 도구 ---------- */
  function R(x, ctx) { return typeof x === 'function' ? x(ctx) : x; }
  function escHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function strip(s) { var d = document.createElement('div'); d.innerHTML = s || ''; return (d.textContent || '').trim(); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function attrEsc(s) { return String(s).replace(/["\\]/g, '\\$&'); }
  function josa(w, pair) {
    var p = pair.split('/'), word = String(w || '');
    var s = word.replace(/\s*\([^)]*\)\s*$/, '').trim();
    var c = s.charCodeAt(s.length - 1);
    if (!(c >= 0xAC00 && c <= 0xD7A3)) return word + p[0] + '(' + p[1] + ')';
    var jong = (c - 0xAC00) % 28;
    if (p[0] === '으로' && jong === 8) return word + '로';
    return word + (jong ? p[0] : p[1]);
  }
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
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
  var ICONS = {
    pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14"/><path d="M15 6v14"/>',
    left: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    right: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.9-1"/>',
    shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4h6v2"/>'
  };
  function injectSprite() {
    if (document.getElementById('didimdol-icons')) return;
    var s = '<svg xmlns="http://www.w3.org/2000/svg" id="didimdol-icons" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">';
    Object.keys(ICONS).forEach(function (k) { s += '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ICONS[k] + '</symbol>'; });
    var d = document.createElement('div'); d.innerHTML = s + '</svg>';
    document.body.insertBefore(d.firstChild, document.body.firstChild);
  }
  function icon(name) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'icon'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(NS, 'use'); use.setAttribute('href', '#i-' + name);
    svg.appendChild(use); return svg;
  }
  var toastTimer = null;
  function toast(msg) {
    var t = document.querySelector('.toast');
    if (!t) { t = h('div', { class: 'toast', role: 'status' }); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function copyText(text, fallbackParent) {
    function fail() {
      var old = fallbackParent.querySelector('textarea.copybox'); if (old) old.remove();
      var ta = h('textarea', { class: 'note copybox', rows: 8, readonly: true, 'aria-label': '복사할 내용' });
      ta.value = text; fallbackParent.appendChild(ta); ta.focus(); ta.select();
      toast('자동 복사가 막혀 있어요. 선택된 글을 복사해 주세요.');
    }
    try { navigator.clipboard.writeText(text).then(function () { toast('복사했어요. 공유 플랫폼이나 메모장에 붙여 넣을 수 있어요.'); }, fail); } catch (e) { fail(); }
  }

  /* ---------- 정거장·디딤돌 정보 ---------- */
  function byId(id) { for (var i = 0; i < STATIONS.length; i++) if (STATIONS[i].id === id) return STATIONS[i]; return null; }
  function allSteps(st) {
    if (!st._all) st._all = st.steps.concat([{ id: 'sum', name: '옮겨 쓰기', title: '실험관찰에 옮겨 쓰기', summary: true }]);
    return st._all;
  }
  function boxValue(bx, ctx) { var v = bx.get ? bx.get(ctx) : ctx.val(bx.key); return (v || '').trim(); }
  function progress(st) {
    var ctx = makeCtx(st), total = 0, done = 0;
    st.summary.pages.forEach(function (pg) { pg.boxes.forEach(function (bx) { total++; if (boxValue(bx, ctx)) done++; }); });
    return { total: total, done: done };
  }
  function stepKeys(step, ctx) {
    if (step.keys) return step.keys;
    var ks = [];
    (function walk(bs) {
      (bs || []).forEach(function (b) {
        if (b.opt || b.t === 'challenge' || (b.when && !b.when(ctx))) return;
        if ((b.t === 'q' || b.t === 'blank') && b.key) ks.push(b.key);
        else if (b.t === 'cols') b.cols.forEach(function (c) { if (!c.opt) ks.push(c.key); });
        else if (b.t === 'chain') b.links.forEach(function (l) { ks.push(l.key); });
        else if (b.t === 'chips' && b.req) ks.push(b.key);
        else if (b.t === 'group') walk(b.blocks);
        else if (b.t === 'tabs') b.tabs.forEach(function (t) { walk(t.blocks); });
      });
    })(step.blocks);
    return ks;
  }
  function stepFilled(st, step, ctx) {
    if (step.summary) { var p = progress(st); return p.total > 0 && p.done === p.total; }
    var ks = stepKeys(step, ctx);
    return ks.length > 0 && ks.every(function (k) { return filled(get(st.id, k, '')); });
  }
  function makeCtx(st) {
    var ctx = {
      sid: st.id, st: st, data: DATA, josa: josa, esc: escHtml,
      get: function (k, d) { return get(st.id, k, d); },
      set: function (k, v) { set(st.id, k, v); },
      val: function (k) { var v = get(st.id, k, ''); return Array.isArray(v) ? v.join(', ') : typeof v === 'string' ? v.trim() : v == null ? '' : String(v); },
      ev: function (k) { return escHtml(ctx.val(k)); },
      from: function (sid, k) { var v = get(sid, k, ''); return typeof v === 'string' ? v.trim() : Array.isArray(v) ? v.join(', ') : ''; },
      rerender: rerender, refreshRail: refreshRail
    };
    return ctx;
  }

  /* ---------- 블록 ---------- */
  var WRAP = { q: 1, chips: 1, chain: 1, pick: 1, blank: 1, mixer: 1, lock: 1, plan: 1, group: 1 };
  function renderBlocks(blocks, ctx, parent, nested) {
    (blocks || []).forEach(function (b) {
      if (b.when && !b.when(ctx)) return;
      var fn = BLOCKS[b.t]; if (!fn) return;
      var node = fn(b, ctx);
      if (!node) return;
      if (!nested && WRAP[b.t]) node = h('div', { class: 'card' + (b.color ? ' c-' + b.color : '') }, node);
      parent.appendChild(node);
    });
  }
  function askLine(b, ctx) {
    if (!b.ask) return null;
    return h('p', { class: 'ask' }, b.n ? h('span', { class: 'qn' }, b.n) : null, h('span', { html: R(b.ask, ctx) }));
  }
  function field(b, ctx) {
    var id = 'f-' + ctx.sid + '-' + b.key;
    var label = b.aria || strip(R(b.ask, ctx)) || '내 생각';
    var el = b.input
      ? h('input', { class: 'note', id: id, type: 'text', autocomplete: 'off', 'aria-label': label, placeholder: R(b.ph, ctx) || '' })
      : h('textarea', { class: 'note', id: id, rows: b.rows || 2, 'aria-label': label, placeholder: R(b.ph, ctx) || '내 생각을 짧게 적어 보세요.' });
    el.value = ctx.get(b.key, '') || '';
    el.addEventListener('input', function () { ctx.set(b.key, el.value); });
    el.addEventListener('change', refreshRail);
    return el;
  }
  var RUNGS = ['1단', '2단', '3단', '4단'];
  function ladder(hid, hints, ctx) {
    var hk = '_h_' + hid, n = clamp(ctx.get(hk, 0), 0, hints.length);
    var box = h('div', { class: 'ladder', 'aria-live': 'polite' });
    for (var i = 0; i < n; i++) {
      box.appendChild(h('div', { class: 'rung' + (i === hints.length - 1 ? ' last' : '') }, h('span', { class: 'lv' }, RUNGS[i] || (i + 1) + '단'), h('span', { html: hints[i] })));
    }
    var fid = 'h-' + hid;
    if (n < hints.length) {
      box.appendChild(h('button', { type: 'button', class: 'lbtn', 'data-fid': fid, onclick: function () { ctx.set(hk, n + 1); rerender(fid); } },
        icon('bulb'), n === 0 ? '막혔나요? 힌트 사다리 한 칸 오르기' : '한 칸 더 오르기 (' + (n + 1) + '/' + hints.length + ')'));
    } else {
      box.appendChild(h('p', { class: 'end' }, '사다리 끝이에요. 이제 내 말로 써 볼 차례예요.'));
    }
    return box;
  }
  function renderQ(b, ctx) {
    var wrap = h('div', { class: 'q' });
    add(wrap, askLine(b, ctx));
    if (b.sub) wrap.appendChild(h('p', { class: 'sub', html: R(b.sub, ctx) }));
    if (b.frame) wrap.appendChild(h('div', { class: 'frame', html: '문장 틀 · ' + R(b.frame, ctx) }));
    if (b.fills) wrap.appendChild(h('span', { class: 'fills' }, icon('pencil'), '실험관찰 ' + R(b.fills, ctx)));
    if (b.key) wrap.appendChild(field(b, ctx));
    var hints = R(b.hints, ctx);
    if (hints && hints.length) wrap.appendChild(ladder(b.hid || b.key, hints, ctx));
    return wrap;
  }
  function renderChips(b, ctx) {
    var wrap = h('div', { class: 'q' });
    add(wrap, askLine(b, ctx));
    if (b.sub) wrap.appendChild(h('p', { class: 'sub', html: R(b.sub, ctx) }));
    var opts = (R(b.options, ctx) || []).map(function (o) { return typeof o === 'string' ? { v: o } : o; });
    var cur = ctx.get(b.key, b.multi ? [] : '');
    if (b.multi && !Array.isArray(cur)) cur = [];
    var row = h('div', { class: 'chips', role: 'group', 'aria-label': strip(R(b.ask, ctx)) || '고르기' });
    opts.forEach(function (o) {
      var on = b.multi ? cur.indexOf(o.v) >= 0 : cur === o.v;
      var fid = 'c-' + b.key + '-' + o.v;
      row.appendChild(h('button', {
        type: 'button', class: 'chip', 'aria-pressed': on ? 'true' : 'false', 'data-fid': fid,
        onclick: function () {
          var nv;
          if (b.multi) { nv = cur.slice(); var i = nv.indexOf(o.v); if (i >= 0) nv.splice(i, 1); else { if (b.max && nv.length >= b.max) nv.shift(); nv.push(o.v); } }
          else nv = cur === o.v ? '' : o.v;
          ctx.set(b.key, nv);
          if (b.onPick) b.onPick(ctx, nv);
          rerender(fid);
        }
      }, o.label || o.v, o.small ? h('small', null, o.small) : null));
    });
    wrap.appendChild(row);
    opts.forEach(function (o) {
      var on = b.multi ? cur.indexOf(o.v) >= 0 : cur === o.v;
      if (on && o.react) wrap.appendChild(h('div', { class: 'react' + (o.tone ? ' ' + o.tone : ''), html: R(o.react, ctx) }));
    });
    var hints = R(b.hints, ctx);
    if (hints && hints.length) wrap.appendChild(ladder(b.hid || b.key, hints, ctx));
    return wrap;
  }
  function renderChain(b, ctx) {
    var wrap = h('div', { class: 'q' });
    add(wrap, askLine(b, ctx));
    if (b.sub) wrap.appendChild(h('p', { class: 'sub', html: R(b.sub, ctx) }));
    var chain = h('div', { class: 'chain' }, h('div', { class: 'start', html: R(b.start, ctx) }));
    b.links.forEach(function (lk) {
      chain.appendChild(h('div', { class: 'then' }, R(lk.then, ctx) || '그러면?'));
      var q = { key: lk.key, ph: lk.ph, rows: lk.rows || 2, aria: lk.aria || strip(R(lk.then, ctx)), fills: lk.fills };
      chain.appendChild(renderQ(q, ctx));
    });
    wrap.appendChild(chain);
    var hints = R(b.hints, ctx);
    if (hints && hints.length) wrap.appendChild(ladder(b.hid, hints, ctx));
    return wrap;
  }
  function renderPick(b, ctx) {
    var items = typeof b.from === 'string' ? DATA[b.from] || [] : R(b.from, ctx) || [];
    var sel = ctx.get(b.key, []); if (!Array.isArray(sel)) sel = [];
    var wrap = h('div', { class: 'q' });
    add(wrap, askLine(b, ctx));
    if (b.sub) wrap.appendChild(h('p', { class: 'sub', html: R(b.sub, ctx) }));
    var grid = h('div', { class: 'pick-grid', role: 'group', 'aria-label': strip(R(b.ask, ctx)) || '고르기' });
    items.forEach(function (it) {
      var on = sel.indexOf(it.id) >= 0, fid = 'p-' + b.key + '-' + it.id;
      grid.appendChild(h('button', {
        type: 'button', class: 'pick', 'aria-pressed': on ? 'true' : 'false', 'data-fid': fid,
        onclick: function () {
          var nv = sel.slice(), i = nv.indexOf(it.id);
          if (i >= 0) nv.splice(i, 1); else { if (b.max && nv.length >= b.max) nv.shift(); nv.push(it.id); }
          ctx.set(b.key, nv); rerender(fid);
        }
      }, h('b', null, it.name), h('span', null, it.desc)));
    });
    wrap.appendChild(grid);
    if (b.max) wrap.appendChild(h('p', { class: 'sub' }, b.max + '개까지 고를 수 있어요. 지금 ' + sel.length + '개를 골랐어요.'));
    if (b.why && sel.length) {
      var list = h('div', { class: 'why-list' });
      sel.forEach(function (id) {
        var it = items.filter(function (x) { return x.id === id; })[0]; if (!it) return;
        list.appendChild(h('div', { class: 'col' }, renderQ({
          key: b.key + '_' + id, n: it.name, ask: R(b.why.ask, ctx), ph: R(b.why.ph, ctx), rows: 2,
          hints: (it.think ? [it.think] : []).concat(R(b.why.hints, ctx) || []), hid: b.key + '_' + id
        }, ctx)));
      });
      wrap.appendChild(list);
    }
    return wrap;
  }
  function renderCols(b, ctx) {
    var wrap = h('div', { class: 'cols' });
    b.cols.forEach(function (c) {
      if (c.when && !c.when(ctx)) return;
      var col = h('div', { class: 'col' + (c.color ? ' c-' + c.color : '') }, h('h3', { html: R(c.title, ctx) }), c.sub ? h('p', { class: 'sub', html: R(c.sub, ctx) }) : null);
      col.appendChild(renderQ({ key: c.key, ph: c.ph, hints: c.hints, fills: c.fills, rows: c.rows || 3, aria: strip(R(c.title, ctx)) }, ctx));
      wrap.appendChild(col);
    });
    return wrap;
  }
  function renderSearch(b, ctx) {
    return h('aside', { class: 'tip' }, h('h3', null, icon('search'), '검색 길잡이'),
      h('p', { class: 'say' }, '이런 낱말로 찾아보세요. 낱말을 바꾸거나 더해 가며 찾으면 더 좋아요.'),
      h('div', { class: 'kw' }, (R(b.words, ctx) || []).map(function (w) { return h('code', null, w); })),
      h('p', { class: 'say', html: '<strong>믿을 만한 자료일까?</strong> 옮겨 쓰기 전에 세 가지를 확인해요.' }),
      h('ol', null, h('li', null, '누가 만들었나요? 만든 곳이나 사람의 이름이 밝혀져 있나요?'),
        h('li', null, '언제 만든 자료인가요? 너무 오래된 자료는 아닌가요?'),
        h('li', null, '다른 자료에서도 같은 내용을 말하나요?')));
  }
  function renderBlank(b, ctx) {
    var id = 'f-' + ctx.sid + '-' + b.key;
    var input = h('input', { class: 'note', id: id, type: 'text', autocomplete: 'off', 'aria-label': '빈칸에 들어갈 낱말', style: 'width: 8.5em; display: inline-block; min-height: 2.3rem; margin: .15rem 0' });
    input.value = ctx.get(b.key, '') || '';
    var fb = h('div', { 'aria-live': 'polite' });
    function check() {
      var v = input.value.replace(/\s/g, '');
      fb.innerHTML = '';
      if (!v) return;
      if (b.accept.some(function (a) { return v.indexOf(a) >= 0; })) { fb.appendChild(h('div', { class: 'react ok', html: b.ok || '좋아요! 이 낱말이 왜 들어가는지 짝에게 설명해 볼까요?' })); return; }
      var near = (b.near || []).filter(function (n) { return n.m.some(function (m) { return v.indexOf(m) >= 0; }); })[0];
      fb.appendChild(h('div', { class: 'react' + (near ? '' : ' warn'), html: near ? near.r : (b.miss || '다른 낱말이 들어갈 것 같아요. 힌트 사다리를 한 칸 올라가 볼까요?') }));
    }
    input.addEventListener('input', function () { ctx.set(b.key, input.value); fb.innerHTML = ''; });
    input.addEventListener('change', function () { check(); refreshRail(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    var wrap = h('div', { class: 'q' });
    add(wrap, askLine(b, ctx));
    wrap.appendChild(h('p', { class: 'say', style: 'line-height: 2.4' }, b.before + ' ', input, ' ' + b.after));
    wrap.appendChild(h('div', null, h('button', { type: 'button', class: 'btn small', onclick: check }, icon('check'), '내 낱말 살펴보기')));
    wrap.appendChild(fb);
    if (b.hints) wrap.appendChild(ladder(b.key, R(b.hints, ctx), ctx));
    if (filled(input.value)) check();
    return wrap;
  }
  function renderTabs(b, ctx) {
    var cur = clamp(ctx.get(b.key, 0), 0, b.tabs.length - 1);
    var wrap = h('div', { class: 'card' });
    var bar = h('div', { class: 'chips', role: 'tablist', 'aria-label': b.label || '그림 고르기' });
    b.tabs.forEach(function (t, i) {
      var fid = 'tab-' + b.key + '-' + i;
      var done = stepKeys({ blocks: t.blocks }, ctx).every(function (k) { return filled(get(ctx.sid, k, '')); });
      bar.appendChild(h('button', { type: 'button', role: 'tab', class: 'chip', 'aria-selected': i === cur ? 'true' : 'false', 'data-fid': fid, onclick: function () { ctx.set(b.key, i); rerender(fid); } }, R(t.label, ctx), done ? ' ✓' : ''));
    });
    wrap.appendChild(bar);
    var panel = h('div', { role: 'tabpanel', class: 'step', style: 'padding: 0' });
    renderBlocks(b.tabs[cur].blocks, ctx, panel, true);
    wrap.appendChild(panel);
    return wrap;
  }
  function renderMixer(b, ctx) {
    var rk = ctx.get(b.key + '_r', 'A'), r = b.recipes[rk] || b.recipes.A;
    var L = ctx.get(b.key + '_l', ''), Rv = ctx.get(b.key + '_v', '');
    var wrap = h('div', { class: 'q' });
    add(wrap, askLine(b, ctx));
    var rec = h('div', { class: 'chips', role: 'group', 'aria-label': '만드는 방법' });
    Object.keys(b.recipes).forEach(function (k) {
      var fid = 'mx-r-' + k;
      rec.appendChild(h('button', { type: 'button', class: 'chip', 'aria-pressed': rk === k ? 'true' : 'false', 'data-fid': fid, onclick: function () { ctx.set(b.key + '_r', k); ctx.set(b.key + '_l', ''); ctx.set(b.key + '_v', ''); rerender(fid); } }, b.recipes[k].name, h('small', null, b.recipes[k].small)));
    });
    wrap.appendChild(rec);
    function reel(side, val, sk) {
      var sel = h('select', { 'aria-label': side.label + ' 고르기' });
      sel.appendChild(h('option', { value: '' }, '직접 고르기'));
      side.items.forEach(function (it) { var o = h('option', { value: it }, it); if (it === val) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', function () { ctx.set(sk, sel.value); rerender(); });
      return h('div', { class: 'reel' }, h('span', { class: 'k' }, side.label), h('div', { class: 'v' }, val || '?'), sel);
    }
    var spun = mixerSpun; mixerSpun = false;
    wrap.appendChild(h('div', { class: 'mixer' + (spun ? ' spin' : '') }, reel(r.left, L, b.key + '_l'), h('div', { class: 'plus', 'aria-hidden': 'true' }, '+'), reel(r.right, Rv, b.key + '_v')));
    wrap.appendChild(h('div', null, h('button', { type: 'button', class: 'btn small', 'data-fid': 'mx-spin', onclick: function () {
      ctx.set(b.key + '_l', r.left.items[Math.floor(Math.random() * r.left.items.length)]);
      ctx.set(b.key + '_v', r.right.items[Math.floor(Math.random() * r.right.items.length)]);
      mixerSpun = true; rerender('mx-spin');
    } }, icon('shuffle'), '무작위로 섞기')));
    if (L && Rv) {
      wrap.appendChild(renderQ({ key: b.key + '_idea', n: '?', ask: r.ask(L, Rv, josa), ph: '떠오르는 일을 자유롭게 적어 보세요. 엉뚱해도 괜찮아요.', rows: 3, hints: r.hints ? r.hints(L, Rv, josa) : null, hid: b.key + '_idea' }, ctx));
    } else {
      wrap.appendChild(h('p', { class: 'sub' }, '두 칸을 직접 고르거나 "무작위로 섞기"를 눌러 보세요. 마음에 들 때까지 여러 번 섞어도 돼요.'));
    }
    return wrap;
  }
  var mixerSpun = false;
  function renderLock(b, ctx) {
    var digits = [], allOk = true;
    var list = h('ol', { class: 'oxlist' });
    b.items.forEach(function (it, i) {
      var k = b.key + '_' + i, cur = ctx.get(k, '');
      var li = h('li', null, h('p', null, it.q));
      var btns = h('div', { class: 'oxbtns' });
      ['O', 'X'].forEach(function (ox) {
        var fid = 'ox-' + k + ox;
        btns.appendChild(h('button', { type: 'button', class: 'chip', 'aria-pressed': cur === ox ? 'true' : 'false', 'aria-label': (i + 1) + '번 ' + (ox === 'O' ? '맞아요 O' : '아니에요 X'), 'data-fid': fid, onclick: function () { ctx.set(k, ox); rerender(fid); } }, ox));
      });
      btns.appendChild(h('span', { class: 'sub', style: 'align-self:center' }, 'O는 ' + it.d.O + ', X는 ' + it.d.X));
      li.appendChild(btns);
      if (cur && cur === it.ans) { digits.push(it.d[cur]); li.appendChild(h('div', { class: 'react ok', html: it.ok })); }
      else { allOk = false; digits.push('_'); if (cur) li.appendChild(h('div', { class: 'react warn', html: it.why })); }
      list.appendChild(li);
    });
    var pad = h('div', { class: 'pad' + (allOk ? ' open' : ''), role: 'status', 'aria-live': 'polite' },
      icon(allOk ? 'unlock' : 'lock'), h('div', { class: 'screen', 'aria-label': '비밀번호' }, digits.join('')),
      h('div', { class: 'sub', style: 'text-align:center; font-size:.85rem' }, allOk ? '잠금이 풀렸어요!' : '다섯 문제를 풀면 열려요'));
    return h('div', { class: 'lockbox' }, list, pad);
  }
  function renderPlan(b, ctx) {
    var age = parseInt(ctx.get('age', '12'), 10) || 12;
    var y1 = parseInt(ctx.get('plan_y1', '6'), 10), y2 = parseInt(ctx.get('plan_y2', '12'), 10);
    if (y2 <= y1) { y2 = y1 + 4; }
    var wrap = h('div', { class: 'q' });
    add(wrap, askLine(b, ctx));
    function opts(label, k, list, curv) {
      var row = h('div', { class: 'chips', role: 'group', 'aria-label': label });
      list.forEach(function (n) {
        var fid = 'pl-' + k + n;
        row.appendChild(h('button', { type: 'button', class: 'chip', 'aria-pressed': curv === n ? 'true' : 'false', 'data-fid': fid, onclick: function () { ctx.set(k, String(n)); rerender(fid); } }, n + (k === 'age' ? '살' : '년 뒤')));
      });
      return h('div', { class: 'q' }, h('p', { class: 'sub' }, label), row);
    }
    wrap.appendChild(h('div', { class: 'cols' }, opts('지금 나이(만 나이)', 'age', [11, 12, 13], age), opts('2번 칸은 몇 년 뒤?', 'plan_y1', [3, 4, 6, 8], y1), opts('3번 칸은 몇 년 뒤?', 'plan_y2', [10, 12, 15, 20], y2)));
    var plan = h('div', { class: 'plan' });
    function pt(when, sub, q) { return h('div', { class: 'pt' }, h('div', { class: 'when' }, when, h('small', null, sub)), renderQ(q, ctx)); }
    var goal = ctx.val('goal_job');
    plan.appendChild(pt(y2 + '년 뒤', '약 ' + (age + y2) + '살', { key: 'plan_far', fills: '59쪽 · 나의 진로 계획 ③', rows: 3, ask: '이때 나는 어디에서 무엇을 하고 있을까요?', ph: goal ? goal + '에 가까워진 나의 모습을 그려 보세요.' : '꿈에 가까워진 나의 모습을 그려 보세요.', hints: b.hints.far }));
    plan.appendChild(h('p', { class: 'arrow' }, '↑ 그렇게 되려면, 그 전에 무엇이 준비되어 있어야 할까요?'));
    plan.appendChild(pt(y1 + '년 뒤', '약 ' + (age + y1) + '살', { key: 'plan_mid', fills: '59쪽 · 나의 진로 계획 ②', rows: 3, ask: '이때 나는 무엇을 배우거나 경험하고 있을까요?', hints: b.hints.mid }));
    plan.appendChild(h('p', { class: 'arrow' }, '↑ 그러려면 지금부터 무엇을 시작할 수 있을까요?'));
    plan.appendChild(pt('현재', '약 ' + age + '살', { key: 'plan_now', fills: '59쪽 · 나의 진로 계획 ①', rows: 3, ask: '이번 주에라도 시작할 수 있는 일은 무엇인가요?', hints: b.hints.now }));
    wrap.appendChild(plan);
    return wrap;
  }
  var BLOCKS = {
    say: function (b, ctx) { return h('p', { class: 'say', html: R(b.html, ctx) }); },
    look: function (b, ctx) { return h('div', { class: 'look' }, icon(b.icon || 'book'), h('div', { html: R(b.html, ctx) })); },
    tip: function (b, ctx) { return h('aside', { class: 'tip' }, h('h3', null, icon(b.icon || 'bulb'), R(b.title, ctx)), h('div', { html: R(b.html, ctx) })); },
    example: function (b, ctx) { return h('details', { class: 'ex' }, h('summary', null, R(b.title, ctx)), h('div', { class: 'body', html: R(b.html, ctx) })); },
    challenge: function (b, ctx) { return h('div', { class: 'challenge' }, h('span', { class: 'tag' }, b.tag || '도전'), renderQ(Object.assign({}, b, { n: null }), ctx)); },
    group: function (b, ctx) { var d = h('div', { class: 'q' }); renderBlocks(b.blocks, ctx, d, true); return d; },
    q: renderQ, chips: renderChips, chain: renderChain, pick: renderPick, cols: renderCols, search: renderSearch,
    blank: renderBlank, tabs: renderTabs, mixer: renderMixer, lock: renderLock, plan: renderPlan
  };

  /* ---------- 화면 ---------- */
  function mount() { var root = document.getElementById('app'); root.innerHTML = ''; return root; }
  function topbar(st) {
    var big = ui('size', '') === 'lg';
    return h('header', { class: 'topbar' }, h('div', { class: 'wrap' },
      st ? h('a', { class: 'tb-btn', href: '#home' }, icon('map'), '지도') : null,
      h('div', { class: 'title' }, st ? st.title : BASE_TITLE),
      h('button', { type: 'button', class: 'tb-btn', 'aria-pressed': big ? 'true' : 'false', onclick: function () {
        set('_ui', 'size', big ? '' : 'lg'); applyPrefs(); rerender(); if (!st) renderHome();
      } }, '가', h('span', null, big ? ' 보통 글자' : ' 크게 보기'))));
  }
  function pg(text, cls) { return text ? h('span', { class: 'pg' + (cls ? ' ' + cls : '') }, icon(cls === 'book' ? 'book' : 'pencil'), text) : null; }
  function renderHome() {
    document.title = BASE_TITLE;
    var root = mount();
    root.appendChild(topbar(null));
    var main = h('main', { class: 'wrap', id: 'main', tabindex: '-1' });
    main.appendChild(h('section', { class: 'hero' },
      h('p', { class: 'eyebrow' }, '6학년 2학기 과학 · 4. 과학과 나의 진로'),
      h('h1', null, '나의 진로는 과학과 어떤 관련이 있을까?'),
      h('p', { class: 'lead', html: '이 앱은 <strong>정답을 알려 주지 않아요.</strong> 실험관찰의 빈칸 앞에서 생각이 멈출 때, 다음 걸음을 디딜 수 있도록 <strong>디딤돌 질문</strong>을 놓아 줄 뿐이에요.' }),
      h('ol', { class: 'promise' },
        h('li', null, h('span', null, '실험관찰을 펴고 오늘 할 정거장을 골라요.')),
        h('li', null, h('span', null, '디딤돌 질문에 답하며 내 생각을 짧게 적어요.')),
        h('li', null, h('span', null, '막히면 힌트 사다리를 한 칸씩만 올라가요. 끝까지 올라가도 정답은 나오지 않아요.')),
        h('li', null, h('span', null, '"옮겨 쓰기"에 모인 내 문장을 다듬어 실험관찰에 써요.')))));
    var ol = h('ol', { class: 'route', 'aria-label': '정거장' });
    STATIONS.forEach(function (st) {
      var p = progress(st);
      ol.appendChild(h('li', { class: 'stop c-' + st.color + (p.total && p.done === p.total ? ' done' : '') },
        h('span', { class: 'badge', 'aria-hidden': 'true', style: st.badge.length > 1 ? 'font-size: .95rem' : null }, st.badge),
        h('a', { class: 'stop-card', href: '#' + st.id },
          h('div', { class: 'meta' }, pg(st.wb), pg(st.book, 'book')),
          h('h2', null, st.title),
          h('p', { class: 'jump', style: 'margin:0' }, st.jump),
          h('div', { class: 'bar', role: 'img', 'aria-label': '실험관찰 칸 ' + p.total + '개 중 ' + p.done + '개 생각함' }, h('i', { style: 'width:' + (p.total ? Math.round(p.done / p.total * 100) : 0) + '%' })),
          h('span', { class: 'sub', style: 'font-size:.82rem; color: var(--ink-2)' }, '생각을 적은 칸 ' + p.done + ' / ' + p.total))));
    });
    main.appendChild(ol);
    var foot = h('footer', { class: 'foot' });
    foot.appendChild(h('p', { style: 'margin:0' }, '내가 쓴 생각은 이 기기의 브라우저에만 저장돼요. 이름은 쓰지 않아도 돼요. 여럿이 함께 쓰는 기기라면 수업이 끝난 뒤 지워 주세요.'));
    var row = h('div', { class: 'row' });
    var confirmBox = h('div', { class: 'confirm', hidden: true },
      h('span', null, '이 기기에 저장된 생각을 모두 지울까요? 되돌릴 수 없어요.'),
      h('button', { type: 'button', class: 'btn small', onclick: function () { state = {}; try { localStorage.removeItem(KEY); } catch (e) { } applyPrefs(); renderHome(); toast('저장된 생각을 모두 지웠어요.'); } }, icon('trash'), '모두 지우기'),
      h('button', { type: 'button', class: 'btn small ghost', onclick: function () { confirmBox.hidden = true; } }, '그만두기'));
    row.appendChild(h('button', { type: 'button', class: 'btn small', onclick: function () { confirmBox.hidden = false; } }, icon('trash'), '내 생각 지우기'));
    row.appendChild(h('a', { class: 'btn small ghost', href: 'teacher.html' }, '선생님용 안내'));
    foot.appendChild(row); foot.appendChild(confirmBox);
    main.appendChild(foot);
    root.appendChild(main);
  }
  var railButtons = [], current = null;
  function renderStation(st, idx) {
    var steps = allSteps(st), step = steps[idx], ctx = makeCtx(st);
    set(st.id, '_step', idx);
    current = { st: st, idx: idx };
    document.title = st.title + ' · ' + BASE_TITLE;
    var root = mount();
    root.appendChild(topbar(st));
    var main = h('main', { class: 'wrap c-' + st.color, id: 'main' });
    main.appendChild(h('header', { class: 'st-head' },
      h('div', { class: 'meta' }, pg(st.wb), pg(st.book, 'book')),
      h('h1', null, h('span', { class: 'num', style: st.badge.length > 1 ? 'font-size:.85rem' : null }, st.badge), st.title),
      h('p', { class: 'goal' }, st.goal)));
    var rail = h('ol', { class: 'rail', 'aria-label': '디딤돌 목록' });
    railButtons = [];
    steps.forEach(function (s, i) {
      var b = h('button', { type: 'button', 'aria-current': i === idx ? 'step' : null, onclick: function () { location.hash = st.id + '-' + (i + 1); } },
        h('span', { class: 'n' }, s.summary ? '✎' : String(i + 1)), s.name);
      railButtons.push({ el: b, step: s });
      rail.appendChild(h('li', null, b));
    });
    main.appendChild(rail);
    var sec = h('section', { class: 'step', 'aria-labelledby': 'step-title' });
    sec.appendChild(h('h2', { id: 'step-title', tabindex: '-1' }, step.summary ? R(step.title, ctx) : '디딤돌 ' + (idx + 1) + '. ' + R(step.title, ctx), step.fills ? h('small', null, '실험관찰 ' + step.fills) : null));
    if (step.onShow) step.onShow(ctx);
    if (step.summary) sec.appendChild(renderSummary(st, ctx)); else renderBlocks(step.blocks, ctx, sec, false);
    main.appendChild(sec);
    var next = STATIONS[STATIONS.indexOf(st) + 1];
    main.appendChild(h('nav', { class: 'navrow', 'aria-label': '디딤돌 이동' },
      idx > 0 ? h('a', { class: 'btn', href: '#' + st.id + '-' + idx }, icon('left'), '이전') : h('a', { class: 'btn', href: '#home' }, icon('map'), '지도로'),
      idx < steps.length - 1 ? h('a', { class: 'btn primary', href: '#' + st.id + '-' + (idx + 2) }, steps[idx + 1].summary ? '정리해서 옮겨 쓰기' : '다음 디딤돌', icon('right'))
        : next ? h('a', { class: 'btn primary', href: '#' + next.id }, '다음 정거장: ' + next.title, icon('right')) : h('a', { class: 'btn primary', href: '#home' }, icon('map'), '지도로 돌아가기')));
    root.appendChild(main);
    refreshRail();
  }
  function refreshRail() {
    if (!current) return;
    var ctx = makeCtx(current.st);
    railButtons.forEach(function (r) { r.el.classList.toggle('filled', stepFilled(current.st, r.step, ctx)); });
  }
  function summaryText(st, ctx) {
    var lines = ['[' + st.title + ']'];
    st.summary.pages.forEach(function (p) {
      lines.push('', '■ 실험관찰 ' + p.page + (p.title ? ' · ' + p.title : ''));
      p.boxes.forEach(function (bx) { lines.push('- ' + bx.label + ': ' + (boxValue(bx, ctx) || '(아직 비어 있음)')); });
    });
    return lines.join('\n');
  }
  function renderSummary(st, ctx) {
    var wrap = h('div', { class: 'wb' });
    wrap.appendChild(h('div', { class: 'look' }, icon('pencil'), h('div', { html: '디딤돌에서 쓴 내 문장을 실험관찰 칸 모양대로 모았어요. <strong>그대로 베끼기보다 한 번 소리 내어 읽어 보고, 더 좋은 표현이 떠오르면 고쳐서</strong> 옮겨 써요.' })));
    st.summary.pages.forEach(function (p) {
      wrap.appendChild(h('h3', { class: 'wb-page' }, '실험관찰 ' + p.page + (p.title ? ' · ' + p.title : '')));
      var grid = h('div', { class: p.grid ? 'wb-grid' : 'wb' });
      p.boxes.forEach(function (bx) {
        var v = boxValue(bx, ctx);
        var box = h('div', { class: 'wbox' + (bx.color ? ' c-' + bx.color : '') }, h('span', { class: 'lab', title: bx.label }, bx.label));
        if (v) box.appendChild(h('div', { class: 'hand' }, v));
        else box.appendChild(h('div', { class: 'empty' }, '아직 비어 있어요.', bx.step != null ? h('a', { href: '#' + st.id + '-' + (bx.step + 1) }, '디딤돌 ' + (bx.step + 1) + '에서 생각하기') : null));
        grid.appendChild(box);
      });
      wrap.appendChild(grid);
    });
    var copyArea = h('div', { class: 'q' });
    copyArea.appendChild(h('div', null, h('button', { type: 'button', class: 'btn small', onclick: function () { copyText(summaryText(st, ctx), copyArea); } }, icon('copy'), '정리한 내용 복사하기')));
    wrap.appendChild(copyArea);
    if (st.summary.checks) {
      wrap.appendChild(h('h3', { class: 'wb-page' }, '스스로 점검하기'));
      var ul = h('ul', { class: 'selfcheck' });
      st.summary.checks.forEach(function (c, i) {
        var k = '_chk_' + i, cb = h('input', { type: 'checkbox', id: 'chk-' + st.id + '-' + i });
        cb.checked = !!ctx.get(k, false);
        cb.addEventListener('change', function () { ctx.set(k, cb.checked); });
        ul.appendChild(h('li', null, h('label', { for: 'chk-' + st.id + '-' + i }, cb, h('span', null, h('span', { class: 'k' }, c.k), c.t))));
      });
      wrap.appendChild(ul);
    }
    return wrap;
  }
  function rerender(fid) {
    if (!current) return;
    var y = window.scrollY;
    renderStation(current.st, current.idx);
    window.scrollTo(0, y);
    if (fid) {
      var el = document.querySelector('[data-fid="' + attrEsc(fid) + '"]');
      if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
    }
  }

  /* ---------- 길 찾기 ---------- */
  function parseHash() {
    var m = /^#(s\d)(?:-(\d+))?$/.exec(location.hash || '');
    var st = m && byId(m[1]);
    if (!st) return { view: 'home' };
    var n = m[2] ? parseInt(m[2], 10) - 1 : get(st.id, '_step', 0);
    return { view: 'station', st: st, step: clamp(n || 0, 0, allSteps(st).length - 1) };
  }
  var lastView = null;
  function route() {
    var r = parseHash(), key = r.view === 'home' ? 'home' : r.st.id + '-' + r.step;
    if (r.view === 'home') { current = null; renderHome(); } else renderStation(r.st, r.step);
    if (key !== lastView) {
      window.scrollTo(0, 0);
      if (lastView !== null) {
        var t = document.getElementById(r.view === 'home' ? 'main' : 'step-title');
        if (t) { try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } }
      }
    }
    lastView = key;
  }
  function applyPrefs() { document.documentElement.setAttribute('data-size', ui('size', '') === 'lg' ? 'lg' : 'md'); }

  function boot() { injectSprite(); applyPrefs(); window.addEventListener('hashchange', route); route(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
