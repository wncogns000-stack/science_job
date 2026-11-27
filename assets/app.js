/* 미래 직업 박람회 2045 · 화면
   해시로 화면을 바꾼다: #home, #zone-pop, #job-robot, #find, #maker, #passport, #guide
   도장·추천·내가 만든 부스는 이 기기 브라우저(localStorage)에만 저장한다. */
(function () {
  'use strict';
  var E = window.EXPO, KEY = 'expo2045-v1';
  var ZONE = {}; E.zones.forEach(function (z) { ZONE[z.id] = z; });
  var JOB = {}; E.jobs.forEach(function (j) { JOB[j.id] = j; });

  /* ---------- 저장 ---------- */
  function fresh() { return { v: 1, stamps: {}, find: [], maker: { problem: '', tech: '', emoji: '🤖', name: '', work: '', why: '', know: '', team: '' } }; }
  var st = (function () { try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.v === 1) return s; } catch (e) { /* 저장이 막혀도 동작 */ } return fresh(); })();
  var saveT = null;
  function saveNow() { clearTimeout(saveT); try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* 무시 */ } }
  function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 150); }
  window.addEventListener('pagehide', saveNow);

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
    var p = pair.split('/'), s = String(w || '').replace(/\s*\([^)]*\)\s*$/, '').trim(), c = s.charCodeAt(s.length - 1);
    if (!(c >= 0xAC00 && c <= 0xD7A3)) return w + p[0] + '(' + p[1] + ')';
    var jong = (c - 0xAC00) % 28;
    if (p[0] === '으로' && jong === 8) return w + '로';
    return w + (jong ? p[0] : p[1]);
  }
  function count(obj) { return Object.keys(obj).filter(function (k) { return obj[k]; }).length; }
  function zoneJobs(zid) { return E.jobs.filter(function (j) { return j.zone === zid; }); }
  var toastT = null;
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2600); }
  function go(hash) { if (location.hash === '#' + hash) route(); else location.hash = hash; }

  /* ---------- 공통 조각 ---------- */
  function statusPill(j) { return h('span', { class: 'pill st-' + j.status }, E.status[j.status]); }
  function stampMark(small) { return h('span', { class: 'stamp' + (small ? ' small' : ''), 'aria-label': '도장 받음' }, '도장'); }
  function boothCard(j) {
    var z = ZONE[j.zone], done = !!st.stamps[j.id];
    return h('a', { class: 'booth z-' + j.zone, href: '#job-' + j.id },
      h('span', { class: 'awning', 'aria-hidden': 'true' }),
      h('span', { class: 'emoji', 'aria-hidden': 'true' }, j.emoji),
      h('span', { class: 'bname' }, j.name),
      h('span', { class: 'hook' }, j.hook),
      h('span', { class: 'bmeta' }, statusPill(j), h('span', { class: 'zname' }, z.name)),
      done ? stampMark(true) : null);
  }
  function header() {
    var n = count(st.stamps);
    var links = [['home', '박람회 지도'], ['find', '나에게 맞는 부스'], ['maker', '나만의 부스 만들기'], ['passport', '내 여권 ' + n + '/' + E.jobs.length]];
    var cur = (location.hash || '#home').slice(1).split('-')[0];
    return h('header', { class: 'top' }, h('div', { class: 'wrap topin' },
      h('a', { class: 'logo', href: '#home' }, h('span', { class: 'l1' }, '미래 직업 박람회'), h('span', { class: 'l2' }, '2045')),
      h('nav', { class: 'mainnav', 'aria-label': '주요 메뉴' }, links.map(function (l) {
        return h('a', { href: '#' + l[0], 'aria-current': cur === l[0] || (l[0] === 'home' && (cur === 'zone' || cur === 'job' || cur === 'map')) ? 'page' : null }, l[1]);
      }))));
  }
  function footer() {
    return h('footer', { class: 'foot wrap' },
      h('p', null, '6학년 2학기 과학 「4. 과학과 나의 진로」 수업 자료 · 직업 정보는 배움을 위해 쉽게 풀어 쓴 것이에요. 더 정확한 정보는 커리어넷(career.go.kr)에서 찾아보세요.'),
      h('p', null, h('a', { href: '#guide' }, '선생님용 안내'), ' · 도장과 만든 부스는 이 기기에만 저장돼요.'));
  }

  /* ---------- 화면: 지도(홈) ---------- */
  var filt = { q: '', zone: '', sci: '', tech: '' };
  function viewHome() {
    var main = h('main', { id: 'main', class: 'wrap', tabindex: '-1' });
    main.appendChild(h('section', { class: 'hero' },
      h('p', { class: 'kicker' }, '6학년 2학기 과학 · 과학과 나의 진로'),
      h('h1', null, '20년 뒤, 우리는 어떤 일을 하고 있을까?'),
      h('p', { class: 'lead' }, '미래 사회의 문제를 과학으로 해결하는 직업들이 부스를 열었어요. 존을 돌며 직업 속 과학을 찾고, 탐구 미션을 풀어 여권에 도장을 모아 보세요. 마지막에는 나만의 미래 직업 부스를 만들어요.'),
      h('div', { class: 'heroacts' },
        h('a', { class: 'ticket', href: '#map' }, h('span', { class: 't1' }, '입장권'), h('span', { class: 't2' }, '박람회 지도 보기')),
        h('a', { class: 'btn', href: '#find' }, '나에게 맞는 부스 찾기'),
        h('a', { class: 'btn', href: '#maker' }, '나만의 부스 만들기'))));
    var map = h('section', { class: 'map', id: 'map', 'aria-labelledby': 'map-t' }, h('h2', { id: 'map-t' }, '박람회 지도'),
      h('p', { class: 'sub' }, '각 존의 입구에는 미래 사회의 문제와 과학이 돕는 방법이 적혀 있어요.'));
    var grid = h('div', { class: 'zones' });
    E.zones.forEach(function (z) {
      var js = zoneJobs(z.id), got = js.filter(function (j) { return st.stamps[j.id]; }).length;
      grid.appendChild(h('a', { class: 'zone z-' + z.id, href: '#zone-' + z.id },
        h('span', { class: 'zicon', 'aria-hidden': 'true' }, z.icon),
        h('span', { class: 'zt' }, z.name),
        h('span', { class: 'zp' }, z.now),
        h('span', { class: 'zbar', role: 'img', 'aria-label': '도장 ' + got + '개 / ' + js.length + '개' }, h('i', { style: 'width:' + Math.round(got / js.length * 100) + '%' })),
        h('span', { class: 'zc' }, '도장 ' + got + ' / ' + js.length + ' · 입장하기 →')));
    });
    map.appendChild(grid);
    main.appendChild(map);
    main.appendChild(allBooths());
    return main;
  }
  function allBooths() {
    var sec = h('section', { class: 'all', 'aria-labelledby': 'all-t' }, h('h2', { id: 'all-t' }, '모든 부스 둘러보기'));
    var sci = [], tech = [];
    E.jobs.forEach(function (j) { j.know.forEach(function (k) { if (sci.indexOf(k[0]) < 0) sci.push(k[0]); }); j.tech.forEach(function (t) { if (tech.indexOf(t) < 0) tech.push(t); }); });
    var q = h('input', { type: 'search', id: 'q', class: 'search', placeholder: '직업, 과학 지식, 기술로 찾기 (예: 빛, 로봇, 날씨)', 'aria-label': '부스 찾기' });
    q.value = filt.q;
    function sel(id, label, list, key) {
      var s = h('select', { id: id, 'aria-label': label }, h('option', { value: '' }, label + ' 전체'));
      list.forEach(function (x) { var o = h('option', { value: x }, x); if (filt[key] === x) o.selected = true; s.appendChild(o); });
      s.addEventListener('change', function () { filt[key] = s.value; draw(); });
      return s;
    }
    var zs = h('select', { id: 'fz', 'aria-label': '존' }, h('option', { value: '' }, '존 전체'));
    E.zones.forEach(function (z) { var o = h('option', { value: z.id }, z.name); if (filt.zone === z.id) o.selected = true; zs.appendChild(o); });
    zs.addEventListener('change', function () { filt.zone = zs.value; draw(); });
    var bar = h('div', { class: 'filters' }, q, zs, sel('fs', '과학 지식', sci, 'sci'), sel('ft', '미래 기술', tech, 'tech'));
    var info = h('p', { class: 'sub', 'aria-live': 'polite' });
    var grid = h('div', { class: 'booths' });
    function draw() {
      var words = filt.q.trim().toLowerCase();
      var list = E.jobs.filter(function (j) {
        if (filt.zone && j.zone !== filt.zone) return false;
        if (filt.sci && !j.know.some(function (k) { return k[0] === filt.sci; })) return false;
        if (filt.tech && j.tech.indexOf(filt.tech) < 0) return false;
        if (words) { var hay = [j.name, j.hook, j.work, j.know.map(function (k) { return k.join(' '); }).join(' '), j.tech.join(' ')].join(' ').toLowerCase(); if (hay.indexOf(words) < 0) return false; }
        return true;
      });
      grid.textContent = '';
      list.forEach(function (j) { grid.appendChild(boothCard(j)); });
      info.textContent = list.length ? '부스 ' + list.length + '곳' : '조건에 맞는 부스가 없어요. 다른 낱말로 찾아보세요.';
    }
    q.addEventListener('input', function () { filt.q = q.value; draw(); });
    draw();
    sec.appendChild(bar); sec.appendChild(info); sec.appendChild(grid);
    return sec;
  }

  /* ---------- 화면: 존 ---------- */
  function viewZone(z) {
    var main = h('main', { id: 'main', class: 'wrap', tabindex: '-1' });
    main.appendChild(h('nav', { class: 'crumb', 'aria-label': '위치' }, h('a', { href: '#home' }, '박람회 지도'), ' › ', z.name));
    main.appendChild(h('section', { class: 'gate z-' + z.id, 'aria-labelledby': 'gate-t' },
      h('span', { class: 'gicon', 'aria-hidden': 'true' }, z.icon),
      h('h1', { id: 'gate-t' }, z.name),
      h('ol', { class: 'flow' },
        h('li', null, h('b', null, '지금의 모습'), h('span', null, z.now)),
        h('li', null, h('b', null, '일어날 수 있는 문제'), h('span', null, z.problem)),
        h('li', null, h('b', null, '과학이 돕는 방법'), h('span', null, z.science))),
      h('p', { class: 'book' }, z.book)));
    var grid = h('div', { class: 'booths' });
    zoneJobs(z.id).forEach(function (j) { grid.appendChild(boothCard(j)); });
    main.appendChild(h('section', { 'aria-labelledby': 'zb-t' }, h('h2', { id: 'zb-t' }, '이 존의 부스'), grid));
    var i = E.zones.indexOf(z), nz = E.zones[(i + 1) % E.zones.length];
    main.appendChild(h('p', { class: 'next' }, h('a', { class: 'btn', href: '#zone-' + nz.id }, '다음 존: ' + nz.name + ' →')));
    return main;
  }

  /* ---------- 화면: 부스(직업) ---------- */
  function shuffleFor(id, arr) { var s = 0; for (var i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) % 9973; return arr.slice().sort(function (a, b) { return ((a.k.charCodeAt(0) * 7 + s) % 3) - ((b.k.charCodeAt(0) * 7 + s) % 3); }); }
  function mission(j) {
    var q = j.inq;
    var opts = shuffleFor(j.id, [
      { k: 'a', ok: true, t: q.change + '만 다르게 하고 나머지 조건은 모두 같게 해서 ' + josa(q.measure, '을/를') + ' 비교한다.', why: '맞아요! 한 가지 조건만 다르게 해야 결과가 달라진 까닭이 그 조건 때문인지 알 수 있어요. 이것이 이 직업의 과학적 탐구 과정이에요.' },
      { k: 'b', t: josa(q.change, '과/와') + ' ' + josa(q.other, '을/를') + ' 한꺼번에 바꿔서 ' + josa(q.measure, '을/를') + ' 비교한다.', why: '두 조건을 한꺼번에 바꾸면, 결과가 달라진 까닭이 어느 조건 때문인지 알 수 없어요. 다시 골라 볼까요?' },
      { k: 'c', t: josa(q.change, '을/를') + ' 한 번만 바꿔 보고, 마음에 드는 쪽으로 바로 정한다.', why: '한 번만 해 보고 느낌으로 정하면 우연일 수 있어요. 조건을 비교하고 여러 번 확인해야 해요. 다시 골라 볼까요?' }
    ]);
    var done = !!st.stamps[j.id];
    var box = h('section', { class: 'mission z-' + j.zone + (done ? ' done' : ''), 'aria-labelledby': 'ms-t' },
      h('h2', { id: 'ms-t' }, '도장 미션 · 과학적 탐구 과정'),
      h('p', { class: 'sit' }, h('b', null, '곤란한 상황 '), q.sit),
      h('p', null, '원인을 찾으려면 어떻게 알아봐야 할까요?'));
    var fb = h('p', { class: 'fb', 'aria-live': 'polite' });
    var list = h('div', { class: 'opts', role: 'group', 'aria-label': '탐구 방법 고르기' });
    opts.forEach(function (o) {
      list.appendChild(h('button', { type: 'button', class: 'opt', onclick: function (e) {
        Array.prototype.forEach.call(list.children, function (b) { b.classList.remove('wrong', 'right'); });
        e.currentTarget.classList.add(o.ok ? 'right' : 'wrong');
        fb.textContent = o.why; fb.className = 'fb ' + (o.ok ? 'ok' : 'no');
        if (o.ok && !st.stamps[j.id]) {
          st.stamps[j.id] = true; saveNow();
          box.classList.add('done', 'pop'); box.appendChild(stampMark());
          var nav = document.querySelector('.mainnav a[href="#passport"]'); if (nav) nav.textContent = '내 여권 ' + count(st.stamps) + '/' + E.jobs.length;
          toast(j.name + ' 부스 도장을 받았어요!');
        }
      } }, o.t));
    });
    box.appendChild(list); box.appendChild(fb);
    if (done) { box.appendChild(stampMark()); fb.textContent = '이미 도장을 받은 부스예요. 다시 풀어 봐도 좋아요.'; }
    return box;
  }
  function viewJob(j) {
    var z = ZONE[j.zone], list = zoneJobs(j.zone), i = list.indexOf(j), nj = list[(i + 1) % list.length];
    var main = h('main', { id: 'main', class: 'wrap', tabindex: '-1' });
    main.appendChild(h('nav', { class: 'crumb', 'aria-label': '위치' }, h('a', { href: '#home' }, '박람회 지도'), ' › ', h('a', { href: '#zone-' + z.id }, z.name), ' › ', j.name));
    main.appendChild(h('section', { class: 'jobhead z-' + j.zone },
      h('span', { class: 'awning', 'aria-hidden': 'true' }),
      h('span', { class: 'bigemoji', 'aria-hidden': 'true' }, j.emoji),
      h('div', { class: 'jt' }, h('p', { class: 'kicker' }, statusPill(j), j.book ? h('span', { class: 'bookref' }, j.book) : null),
        h('h1', null, j.name), h('p', { class: 'hookq' }, j.hook))));
    var know = h('ul', { class: 'know' });
    j.know.forEach(function (k) { know.appendChild(h('li', null, h('b', null, k[0]), h('span', null, k[1]))); });
    main.appendChild(h('div', { class: 'jobgrid' },
      h('section', { class: 'panel' }, h('h2', null, '하는 일'), h('p', null, j.work)),
      h('section', { class: 'panel' }, h('h2', null, '미래 전망'), h('p', null, j.why)),
      h('section', { class: 'panel wide' }, h('h2', null, '필요한 과학 지식'), know),
      h('section', { class: 'panel' }, h('h2', null, '함께 쓰는 미래 기술'), h('p', { class: 'tags' }, j.tech.map(function (t) { return h('span', { class: 'tag' }, t); }))),
      h('section', { class: 'panel' }, h('h2', null, '이 직업을 꿈꾼다면 지금'), h('p', null, j.start))));
    main.appendChild(mission(j));
    main.appendChild(h('p', { class: 'next' }, h('a', { class: 'btn ghost', href: '#zone-' + z.id }, '← ' + z.name), h('a', { class: 'btn', href: '#job-' + nj.id }, '다음 부스: ' + nj.name + ' →')));
    return main;
  }

  /* ---------- 화면: 나에게 맞는 부스 ---------- */
  function viewFind() {
    var main = h('main', { id: 'main', class: 'wrap narrow', tabindex: '-1' });
    main.appendChild(h('h1', null, '나에게 맞는 부스 찾기'));
    main.appendChild(h('p', { class: 'sub' }, '다섯 가지 질문에 답하면 어울리는 부스를 알려 줘요. 재미로 보는 추천이고, 진짜 진로는 여러 경험을 하며 찾아가요.'));
    var n = st.find.length;
    if (n < E.find.length) {
      var item = E.find[n];
      main.appendChild(h('p', { class: 'dots', role: 'img', 'aria-label': (n + 1) + '번째 질문 / ' + E.find.length }, E.find.map(function (_, i) { return h('span', { class: i < n ? 'on' : i === n ? 'cur' : '' }); })));
      main.appendChild(h('h2', { class: 'fq' }, (n + 1) + '. ' + item.q));
      main.appendChild(h('div', { class: 'answers' }, item.a.map(function (a, k) {
        return h('button', { type: 'button', class: 'ans', onclick: function () { st.find.push(k); saveNow(); route(); } }, a[0]);
      })));
      if (n > 0) main.appendChild(h('p', null, h('button', { type: 'button', class: 'btn ghost', onclick: function () { st.find.pop(); save(); route(); } }, '← 이전 질문')));
      return main;
    }
    var score = {};
    st.find.forEach(function (k, i) { var a = E.find[i] && E.find[i].a[k]; if (a) a[1].forEach(function (t) { score[t] = (score[t] || 0) + 1; }); });
    var ranked = E.jobs.map(function (j) {
      var s = 0, why = [];
      j.tags.forEach(function (t) { if (score[t]) { s += score[t]; why.push(E.tagNames[t]); } });
      return { j: j, s: s, why: why };
    }).sort(function (a, b) { return b.s - a.s || E.jobs.indexOf(a.j) - E.jobs.indexOf(b.j); }).slice(0, 3);
    var top = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; }).slice(0, 2).map(function (t) { return E.tagNames[t]; });
    main.appendChild(h('div', { class: 'result' }, h('p', { class: 'kicker' }, '나의 관심 · ' + (top.join(', ') || '여러 분야')), h('h2', null, '이런 부스가 어울려요')));
    var grid = h('div', { class: 'booths' });
    ranked.forEach(function (r) { var c = boothCard(r.j); c.appendChild(h('span', { class: 'why' }, '어울리는 까닭: ' + r.why.join(', '))); grid.appendChild(c); });
    main.appendChild(grid);
    main.appendChild(h('p', { class: 'next' }, h('button', { type: 'button', class: 'btn ghost', onclick: function () { st.find = []; save(); route(); } }, '처음부터 다시 하기'), h('a', { class: 'btn', href: '#maker' }, '나만의 부스 만들기 →')));
    return main;
  }

  /* ---------- 화면: 여권 ---------- */
  function viewPassport() {
    var main = h('main', { id: 'main', class: 'wrap', tabindex: '-1' });
    var n = count(st.stamps);
    main.appendChild(h('section', { class: 'passhead' }, h('p', { class: 'kicker' }, 'FUTURE JOB EXPO 2045'), h('h1', null, '내 박람회 여권'), h('p', { class: 'sub' }, '도장 ' + n + '개 / ' + E.jobs.length + '개 · 부스의 도장 미션을 풀면 도장이 찍혀요.')));
    var zonesDone = E.zones.filter(function (z) { return zoneJobs(z.id).some(function (j) { return st.stamps[j.id]; }); }).length;
    var badges = [
      ['첫 도장', n >= 1, '도장 1개'], ['박람회 한 바퀴', zonesDone === E.zones.length, '네 존에서 도장 1개씩'],
      ['탐구 박사', n >= 12, '도장 12개'], ['박람회 완주', n === E.jobs.length, '모든 부스 도장']
    ].concat(E.zones.map(function (z) { return [z.name + ' 마스터', zoneJobs(z.id).every(function (j) { return st.stamps[j.id]; }), z.name + ' 도장 6개']; }));
    main.appendChild(h('section', { 'aria-labelledby': 'bd-t' }, h('h2', { id: 'bd-t' }, '배지'), h('ul', { class: 'badges' }, badges.map(function (b) {
      return h('li', { class: b[1] ? 'got' : '' }, h('span', { class: 'bi', 'aria-hidden': 'true' }, b[1] ? '★' : '☆'), h('b', null, b[0]), h('span', null, b[1] ? '받았어요' : b[2]));
    }))));
    E.zones.forEach(function (z) {
      main.appendChild(h('section', { class: 'pzone z-' + z.id, 'aria-label': z.name }, h('h2', null, z.icon + ' ' + z.name), h('div', { class: 'slots' }, zoneJobs(z.id).map(function (j) {
        var got = !!st.stamps[j.id];
        return h('a', { class: 'slot' + (got ? ' got' : ''), href: '#job-' + j.id, 'aria-label': j.name + (got ? ' 도장 받음' : ' 도장 아직') }, h('span', { class: 'se', 'aria-hidden': 'true' }, got ? j.emoji : '?'), h('span', { class: 'sn' }, j.name));
      }))));
    });
    var conf = h('div', { class: 'confirm', hidden: true }, h('span', null, '도장과 추천 결과, 만든 부스를 모두 지울까요?'),
      h('button', { type: 'button', class: 'btn small', onclick: function () { st = fresh(); save(); route(); toast('모두 지웠어요.'); } }, '모두 지우기'),
      h('button', { type: 'button', class: 'btn small ghost', onclick: function () { conf.hidden = true; } }, '그만두기'));
    main.appendChild(h('p', { class: 'next' }, h('button', { type: 'button', class: 'btn ghost', onclick: function () { conf.hidden = false; } }, '여권 초기화')));
    main.appendChild(conf);
    return main;
  }

  /* ---------- 화면: 나만의 부스 만들기 ---------- */
  function viewMaker() {
    var m = st.maker;
    var main = h('main', { id: 'main', class: 'wrap', tabindex: '-1' });
    main.appendChild(h('h1', null, '나만의 미래 직업 부스 만들기'));
    main.appendChild(h('p', { class: 'sub' }, '교과서 96~97쪽 · 실험관찰 60~61쪽. 미래 사회의 문제와 미래 기술을 섞어 새로운 직업을 상상하고, 직업명·하는 일·미래 전망이 담긴 소개 카드를 만들어요.'));
    var mix = h('section', { class: 'panel mixer', 'aria-labelledby': 'mx-t' }, h('h2', { id: 'mx-t' }, '1. 아이디어 섞기'));
    function pick(id, label, list, key) {
      var s = h('select', { id: id }, h('option', { value: '' }, '고르기'));
      list.forEach(function (x) { var o = h('option', { value: x }, x); if (m[key] === x) o.selected = true; s.appendChild(o); });
      s.addEventListener('change', function () { m[key] = s.value; save(); prompt(); paint(); });
      return h('label', { class: 'fld', for: id }, h('span', null, label), s);
    }
    var promptEl = h('p', { class: 'mixq', 'aria-live': 'polite' });
    function prompt() {
      promptEl.textContent = m.problem && m.tech
        ? '"' + m.tech + '" 기술로 "' + m.problem + '" 문제를 해결하는 사람이 있다면, 그 사람은 어떤 일을 할까요? 이름도 지어 주세요.'
        : '두 가지를 고르거나 주사위를 굴려 보세요. 교과서 예: 드론·에어 택시 + 도시 교통 → 도심 항공 교통관제사';
    }
    mix.appendChild(h('div', { class: 'mixrow' }, pick('mp', '미래 사회의 문제', E.problems, 'problem'), h('span', { class: 'plus', 'aria-hidden': 'true' }, '+'), pick('mt', '미래 기술', E.techs, 'tech'),
      h('button', { type: 'button', class: 'btn', onclick: function () {
        m.problem = E.problems[Math.floor(Math.random() * E.problems.length)]; m.tech = E.techs[Math.floor(Math.random() * E.techs.length)];
        document.getElementById('mp').value = m.problem; document.getElementById('mt').value = m.tech; save(); prompt(); paint();
      } }, '🎲 주사위')));
    prompt(); mix.appendChild(promptEl);
    main.appendChild(mix);
    var form = h('section', { class: 'panel', 'aria-labelledby': 'fm-t' }, h('h2', { id: 'fm-t' }, '2. 부스 소개 쓰기'));
    function field(key, label, ph, multi) {
      var id = 'mk-' + key, el = multi ? h('textarea', { id: id, rows: 3, placeholder: ph }) : h('input', { id: id, type: 'text', placeholder: ph, maxlength: 40 });
      el.value = m[key] || '';
      el.addEventListener('input', function () { m[key] = el.value; save(); paint(); });
      return h('label', { class: 'fld', for: id }, h('span', null, label), el);
    }
    var emo = h('div', { class: 'emos', role: 'group', 'aria-label': '부스 그림 고르기' });
    E.emojis.forEach(function (e) {
      emo.appendChild(h('button', { type: 'button', class: 'emo', 'aria-pressed': m.emoji === e ? 'true' : 'false', 'aria-label': '그림 ' + e, onclick: function (ev) {
        m.emoji = e; save(); Array.prototype.forEach.call(emo.children, function (b) { b.setAttribute('aria-pressed', 'false'); }); ev.currentTarget.setAttribute('aria-pressed', 'true'); paint();
      } }, e));
    });
    form.appendChild(field('name', '직업명', '예: 도심 항공 교통관제사'));
    form.appendChild(h('div', { class: 'fld' }, h('span', null, '부스 그림'), emo));
    form.appendChild(field('work', '하는 일', '누구를 위해, 어떤 기술로, 무엇을 하나요?', true));
    form.appendChild(field('why', '미래 전망', '어떤 변화 때문에 이 직업이 필요해질까요?', true));
    form.appendChild(field('know', '필요한 과학 지식', '예: 날씨, 소리의 성질'));
    form.appendChild(field('team', '만든 모둠', '모둠 이름이나 별명 (실명은 쓰지 않아요)'));
    main.appendChild(form);
    var card = h('div', { class: 'mycard', id: 'mycard' });
    var acts = h('div', { class: 'row' },
      h('button', { type: 'button', class: 'btn', onclick: saveCard }, '카드 이미지로 저장'),
      h('button', { type: 'button', class: 'btn ghost', onclick: copyCard }, '글로 복사하기'));
    main.appendChild(h('section', { class: 'panel', 'aria-labelledby': 'pv-t' }, h('h2', { id: 'pv-t' }, '3. 미리 보기와 저장'), card, acts, h('div', { id: 'savebox' })));
    main.appendChild(h('section', { class: 'panel', 'aria-labelledby': 'sh-t' }, h('h2', { id: 'sh-t' }, '4. 공유하고 댓글 달기'),
      h('p', null, '저장한 카드를 반 공유 플랫폼에 올리고, 다른 모둠의 부스에 댓글을 달아요. 좋은 댓글은 칭찬 + 질문 + 제안으로 이루어져요.'),
      h('ul', { class: 'starters' }, h('li', null, h('b', null, '칭찬 '), '~한 점이 새로웠어요.'), h('li', null, h('b', null, '질문 '), '~할 때는 어떻게 하나요?'), h('li', null, h('b', null, '제안 '), '~도 하면 더 좋겠어요.')),
      h('p', { class: 'guard' }, '학습 지킴이 · 나와 다른 사람의 개인 정보를 보호해요. 댓글은 바르고 고운 말로 써요.')));
    function paint() {
      card.textContent = '';
      card.appendChild(h('span', { class: 'awning', 'aria-hidden': 'true' }));
      card.appendChild(h('span', { class: 'bigemoji', 'aria-hidden': 'true' }, m.emoji || '🤖'));
      card.appendChild(h('p', { class: 'cn' }, m.name || '직업명'));
      if (m.problem || m.tech) card.appendChild(h('p', { class: 'cmix' }, [m.problem, m.tech].filter(Boolean).join(' × ')));
      [['하는 일', m.work], ['미래 전망', m.why], ['필요한 과학 지식', m.know]].forEach(function (r) { card.appendChild(h('div', { class: 'cs' }, h('b', null, r[0]), h('p', null, r[1] || '아직 쓰지 않았어요.'))); });
      card.appendChild(h('p', { class: 'cf' }, '미래 직업 박람회 2045' + (m.team ? ' · ' + m.team : '')));
    }
    paint();
    return main;
  }
  function cardText() {
    var m = st.maker;
    return ['[미래 직업 소개] ' + (m.name || '(직업명)'), m.problem || m.tech ? '아이디어: ' + [m.problem, m.tech].filter(Boolean).join(' × ') : '', '하는 일: ' + (m.work || ''), '미래 전망: ' + (m.why || ''), '필요한 과학 지식: ' + (m.know || ''), m.team ? '만든 모둠: ' + m.team : ''].filter(Boolean).join('\n');
  }
  function copyCard() {
    var text = cardText(), box = document.getElementById('savebox');
    function fail() { box.textContent = ''; var ta = h('textarea', { rows: 6, readonly: true, 'aria-label': '복사할 글' }); ta.value = text; box.appendChild(ta); ta.select(); toast('선택된 글을 복사해 주세요.'); }
    try { navigator.clipboard.writeText(text).then(function () { toast('복사했어요.'); }, fail); } catch (e) { fail(); }
  }

  /* ---------- 카드 이미지 ---------- */
  function wrapLines(ctx, text, width, maxLines) {
    var lines = [], line = '';
    String(text || '').split(/\s+/).forEach(function (word) {
      var test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width <= width) { line = test; return; }
      if (line) lines.push(line);
      if (ctx.measureText(word).width <= width) { line = word; return; }
      line = '';
      Array.from(word).forEach(function (ch) { if (ctx.measureText(line + ch).width > width) { lines.push(line); line = ch; } else line += ch; });
    });
    if (line) lines.push(line);
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, '') + '…'; }
    return lines;
  }
  function drawCard() {
    var m = st.maker, W = 1080, H = 1350, c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d');
    var disp = '"Black Han Sans", "Jua", "Malgun Gothic", sans-serif', body = '"IBM Plex Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    x.fillStyle = '#13285A'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#FFFFFF'; roundRect(x, 50, 50, W - 100, H - 100, 44); x.fill();
    x.save(); roundRect(x, 50, 50, W - 100, H - 100, 44); x.clip();
    for (var i = 0; i < 12; i++) {
      x.fillStyle = i % 2 ? '#FDE6E0' : '#D9472F';
      x.fillRect(50 + i * 82, 50, 82, 110);
      x.beginPath(); x.arc(91 + i * 82, 160, 41, 0, Math.PI); x.fill();
    }
    x.restore();
    x.beginPath(); x.fillStyle = '#F1F5FB'; x.arc(W / 2, 360, 120, 0, Math.PI * 2); x.fill();
    x.font = '130px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(m.emoji || '🤖', W / 2, 368);
    x.fillStyle = '#13285A'; x.textBaseline = 'alphabetic'; x.font = '76px ' + disp;
    var title = wrapLines(x, m.name || '나의 미래 직업', W - 220, 2), y = 580;
    title.forEach(function (l) { x.fillText(l, W / 2, y); y += 88; });
    if (m.problem || m.tech) { x.font = '34px ' + body; x.fillStyle = '#4A5A78'; x.fillText([m.problem, m.tech].filter(Boolean).join(' × '), W / 2, y - 18); y += 40; }
    x.textAlign = 'left';
    [['하는 일', m.work], ['미래 전망', m.why], ['필요한 과학 지식', m.know]].forEach(function (r) {
      if (y > H - 220) return;
      x.fillStyle = '#D9472F'; x.font = '38px ' + disp; x.fillText(r[0], 110, y + 30); y += 70;
      x.fillStyle = '#0F1E3D'; x.font = '36px ' + body;
      wrapLines(x, r[1] || '-', W - 220, r[0] === '필요한 과학 지식' ? 2 : 3).forEach(function (l) { x.fillText(l, 110, y); y += 52; });
      y += 18;
    });
    x.textAlign = 'center'; x.fillStyle = '#4A5A78'; x.font = '30px ' + body;
    x.fillText('미래 직업 박람회 2045' + (m.team ? ' · ' + m.team : ''), W / 2, H - 95);
    return c;
  }
  function roundRect(x, l, t, w, hh, r) { x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + hh, r); x.arcTo(l + w, t + hh, l, t + hh, r); x.arcTo(l, t + hh, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath(); }
  function saveCard() {
    var box = document.getElementById('savebox');
    var m = st.maker, txt = [m.name, m.work, m.why, m.know, m.team, m.problem, m.tech, '하는 일 미래 전망 필요한 과학 지식 나의 미래 직업 박람회 2045 ×'].join(' ');
    var ready = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('76px "Black Han Sans"', txt), document.fonts.load('36px "IBM Plex Sans KR"', txt)]).catch(function () {}) : Promise.resolve();
    ready.then(function () {
      var canvas = drawCard(), name = 'future-job-card.png';
      canvas.toBlob(function (blob) {
        if (!blob) { toast('이미지를 만들지 못했어요.'); return; }
        var cl = window.claude;
        var viaHost = cl && typeof cl.use === 'function' ? cl.use('downloads').catch(function () { return null; }) : Promise.resolve(null);
        viaHost.then(function (dl) {
          if (dl) return dl.save({ filename: name, data: blob }).then(function () { toast('카드를 저장했어요.'); }, function (e) { if (!e || e.code !== 'declined') showImage(canvas, box); });
          try {
            var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
            toast('카드를 저장했어요. 저장이 안 되면 아래 그림을 길게 눌러 저장하세요.');
          } catch (e) { /* 아래 그림으로 대신 */ }
          showImage(canvas, box);
        });
      }, 'image/png');
    });
  }
  function showImage(canvas, box) {
    box.textContent = '';
    box.appendChild(h('p', { class: 'sub' }, '저장되지 않으면 이 그림을 길게 누르거나 오른쪽 클릭해 저장하세요.'));
    box.appendChild(h('img', { src: canvas.toDataURL('image/png'), alt: '내가 만든 미래 직업 소개 카드', class: 'cardimg' }));
  }

  /* ---------- 화면: 선생님용 안내 ---------- */
  function viewGuide() {
    var main = h('main', { id: 'main', class: 'wrap narrow guide', tabindex: '-1' });
    main.appendChild(h('h1', null, '선생님용 안내'));
    var rows = [
      ['1~2차시 · 교과서 84~87쪽', '존 입구', '지금의 모습 → 일어날 수 있는 문제 → 과학이 돕는 방법(원인 줄이기·변화에 대처하기)을 읽고 존에 들어가요.'],
      ['3차시 · 교과서 88~91쪽', '부스와 도장 미션', '직업마다 과학 지식과, 곤란한 상황을 푸는 과학적 탐구 과정이 있어요. 도장 미션은 "한 가지 조건만 다르게 하기"를 고르는 문제예요.'],
      ['4차시 · 교과서 92~93쪽', '나에게 맞는 부스, 지금 해 볼 일', '관심에서 출발해 직업을 고르고, 미래 기술과 "지금 해 볼 일"을 나의 진로와 이어요.'],
      ['창의가 팡팡 · 교과서 96~97쪽, 실험관찰 60~61쪽', '나만의 부스 만들기', '문제 × 기술로 직업을 상상하고 직업명·하는 일·미래 전망 카드를 저장해 공유 플랫폼에 올리고 댓글을 달아요.']
    ];
    main.appendChild(h('div', { class: 'tablewrap' }, h('table', null, h('thead', null, h('tr', null, h('th', null, '교과서 흐름'), h('th', null, '사이트'), h('th', null, '하는 일'))),
      h('tbody', null, rows.map(function (r) { return h('tr', null, r.map(function (c) { return h('td', null, c); })); })))));
    main.appendChild(h('h2', null, '수업 아이디어'));
    main.appendChild(h('ul', null,
      h('li', null, '모둠마다 존 하나를 맡아 부스 6곳의 도장을 모으고, 존 입구의 "문제 → 과학" 흐름을 발표해요.'),
      h('li', null, '개인별로 "도장 6개 모으기" 미션을 주고, 가장 마음에 든 부스의 과학 지식과 탐구 과정을 실험관찰에 정리해요.'),
      h('li', null, '창의가 팡팡 시간에 카드를 저장해 패들렛 같은 공유 플랫폼에 올리고, 칭찬·질문·제안 댓글을 달아요.')));
    main.appendChild(h('h2', null, '알아 둘 점'));
    main.appendChild(h('ul', null,
      h('li', null, '부스 24곳의 내용은 초등학생 눈높이로 쉽게 쓴 것이고, 통계나 전망 수치는 넣지 않았어요. "지금 있어요 / 자라나는 중 / 상상 직업"은 2026년 기준 제작자의 분류예요.'),
      h('li', null, '"나에게 맞는 부스"는 고른 답의 관심 분야로 고르는 재미용 추천이에요. 검사 도구가 아니에요.'),
      h('li', null, '도장, 추천 결과, 만든 부스는 학생 기기의 브라우저에만 저장되고 선생님께 모이지 않아요. 여럿이 쓰는 기기는 여권 화면에서 초기화하세요.'),
      h('li', null, '카드에는 실명 대신 모둠 이름이나 별명을 쓰도록 안내해 주세요.')));
    return main;
  }

  /* ---------- 길 찾기 ---------- */
  var lastKey = null;
  function route() {
    var hash = (location.hash || '#home').slice(1), view, key = hash;
    if (hash === 'map' || hash === 'home' || !hash) { view = viewHome(); key = 'home'; }
    else if (hash.indexOf('zone-') === 0 && ZONE[hash.slice(5)]) view = viewZone(ZONE[hash.slice(5)]);
    else if (hash.indexOf('job-') === 0 && JOB[hash.slice(4)]) view = viewJob(JOB[hash.slice(4)]);
    else if (hash === 'find') view = viewFind();
    else if (hash === 'maker') view = viewMaker();
    else if (hash === 'passport') view = viewPassport();
    else if (hash === 'guide') view = viewGuide();
    else { view = viewHome(); key = 'home'; }
    var root = document.getElementById('app');
    root.textContent = '';
    root.appendChild(header()); root.appendChild(view); root.appendChild(footer());
    root.appendChild(h('div', { id: 'toast', class: 'toast', role: 'status', hidden: true }));
    document.title = '미래 직업 박람회 2045';
    if (hash === 'map') { var mp = document.getElementById('map'); if (mp) mp.scrollIntoView(); }
    else if (key !== lastKey) window.scrollTo(0, 0);
    if (key !== lastKey) {
      if (lastKey !== null) { var t = document.getElementById('main'); if (t) { try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } } }
    }
    lastKey = key;
  }
  function boot() { document.documentElement.lang = 'ko'; window.addEventListener('hashchange', route); route(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
