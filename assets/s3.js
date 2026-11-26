/* 정거장 3 · 직업과 관련된 과학적 요소 알아보기 (실험관찰 56~57쪽)
   사고의 점프: 직업이 하는 일 → 쓰이는 과학 지식(전이) → 일 속의 문제 상황 → 과학적 탐구 과정(문제를 탐구로 바꾸기) */
(function () {
  function placeObj(ctx) { var n = ctx.val('place'); return (ctx.data.places || []).filter(function (p) { return p.name === n; })[0] || null; }
  function jobName(ctx) { return ctx.val('job_other') || ctx.val('job'); }
  function jobHtml(ctx, pair) { var j = jobName(ctx) || '이 직업'; return '<strong>' + ctx.esc(pair ? ctx.josa(j, pair) : j) + '</strong>'; }

  (window.APP_STATIONS = window.APP_STATIONS || []).push({
    id: 's3', num: 3, badge: '3', color: 'orange',
    title: '직업 속 과학 찾기',
    wb: '실험관찰 56~57쪽', book: '교과서 88~91쪽',
    jump: '하는 일 → 쓰이는 과학 지식 → 일 속의 문제 상황 → 과학적 탐구 과정',
    goal: '직업을 잘 해내는 데 필요한 과학 지식과, 일하다 생긴 문제를 풀어 가는 과학적 탐구 과정을 찾아요.',
    steps: [
      {
        id: 'cook', name: '요리사의 과학', title: '요리사와 관련된 과학 지식', fills: '56쪽 활동해요',
        blocks: [
          { t: 'look', html: '실험관찰 56쪽의 사진 세 장(물에 녹는 설탕, 김치, 냄비에 꽂힌 온도계)을 보세요.' },
          { t: 'say', html: '교과서 88~89쪽에서 소방관은 <strong>연소의 조건, 이산화 탄소의 성질</strong>을, 스마트 팜 운영자는 <strong>식물의 한살이, 식물이 잘 자라는 조건</strong>을 알아야 한다고 했어요. 요리사는 어떤 과학을 알아야 할까요? 빈칸의 낱말을 떠올려 적고 "내 낱말 살펴보기"를 눌러요.' },
          { t: 'blank', key: 'cook1', n: '①', before: '설탕, 소금 등의 용질이 물에 얼마나 잘', after: '되는지 이해해야 합니다.', accept: ['용해'],
            near: [{ m: ['녹'], r: '뜻은 맞아요! "녹는다"를 과학 시간에 쓰는 두 글자 낱말로 바꿔 볼까요?' }, { m: ['섞'], r: '섞이는 것과 녹는 것은 조금 달라요. 설탕이 물속에서 보이지 않게 고르게 퍼지는 현상을 무엇이라고 했나요?' }],
            ok: '맞아요. 그런데 요리사는 왜 이것을 알아야 할까요? 차가운 물과 따뜻한 물에서 설탕이 녹는 양을 떠올려 보세요.',
            hints: ['설탕을 물에 넣고 저으면 어떻게 되나요? 설탕 알갱이가 보이나요?', '설탕처럼 녹는 물질을 용질, 물처럼 녹이는 물질을 용매라고 해요. 용질이 용매에 녹는 현상을 부르는 이름은?', '"용"으로 시작하는 두 글자 낱말이에요. (용□)'] },
          { t: 'blank', key: 'cook2', n: '②', before: '다양한', after: '을/를 이용해 김치, 요구르트와 같은 음식이 만들어지는 것을 이해해야 합니다.', accept: ['미생물'],
            near: [{ m: ['세균', '균', '곰팡이', '효모', '발효'], r: '좋은 방향이에요! 세균, 곰팡이, 효모처럼 아주 작은 생물을 한꺼번에 부르는 이름은 무엇일까요?' }],
            ok: '맞아요. 작은 생물은 음식을 맛있게도, 상하게도 만들어요. 요리사는 이 둘을 어떻게 구별하고 관리해야 할까요?',
            hints: ['김치는 시간이 지나면 맛이 시큼하게 변해요. 누가 이런 변화를 일으킬까요? 눈에 보이나요?', '눈에 보이지 않을 만큼 아주 작은 생물을 무엇이라고 부르나요?', '"미"로 시작하는 세 글자 낱말이에요. (미□□)'] },
          { t: 'blank', key: 'cook3', n: '③', before: '음식을 조리하기에 알맞은', after: '을/를 알고, 음식이 타지 않고 잘 익도록 합니다.', accept: ['온도'],
            near: [{ m: ['불', '열'], r: '가까워요! 불이나 열 때문에 생기는 뜨겁고 차가운 정도를 숫자로 나타낸 것을 무엇이라고 하나요?' }, { m: ['시간'], r: '시간도 중요해요! 그런데 사진 속 냄비에 꽂힌 도구가 재는 것은 시간일까요?' }],
            ok: '맞아요. 같은 음식도 몇 도에서 익히느냐에 따라 맛과 안전이 달라져요.',
            hints: ['사진 속 냄비에 꽂힌 도구는 무엇을 재는 도구일까요?', '음식이 타거나 덜 익는 것은 무엇이 너무 높거나 낮아서일까요?', '"온"으로 시작하는 두 글자 낱말이에요. (온□)'] }
        ]
      },
      {
        id: 'cookq', name: '요리사의 탐구', title: '요리사의 과학적 탐구 과정', fills: '56쪽 탐구 과정',
        blocks: [
          { t: 'say', html: '실험관찰 56쪽 아래 칸을 읽어 보세요. "음식을 맛있게 하려면 재료를 얼마만큼 익혀야 하는지 알아야 합니다. 따라서 ( ) 음식을 만들고 맛을 비교합니다." 괄호에는 <strong>어떻게 실험할지</strong>가 들어가요.' },
          { t: 'chips', key: 'cook_var', req: true, n: '①', ask: '"얼마만큼 익혀야 맛있을까?"를 알아보려면, 무엇을 <strong>다르게</strong> 해야 할까요?', options: [
            { v: '익히는 시간', react: '좋아요. 시간만 다르게 하면, 맛의 차이가 시간 때문인지 알 수 있어요. 그럼 무엇을 같게 해야 할까요?' },
            { v: '불의 세기', react: '좋아요. 불의 세기만 다르게 해도 익는 정도가 달라져요. 이때 무엇을 같게 해야 할까요?' },
            { v: '재료의 종류', tone: 'warn', react: '재료를 바꾸면, 맛이 달라진 까닭이 "익힌 정도" 때문인지 "재료" 때문인지 알 수 있을까요?' },
            { v: '양념의 양', tone: 'warn', react: '양념을 바꾸면 "얼마나 익혀야 하는지"를 알아낼 수 있을까요? 우리가 궁금한 것을 다시 읽어 봐요.' }] },
          { t: 'chips', key: 'cook_same', multi: true, n: '②', ask: '그렇다면 <strong>같게</strong> 해야 할 것은 무엇일까요? 모두 골라요.', options: ['재료의 종류', '재료의 양', '양념의 양', '냄비의 크기', '불의 세기', '익히는 시간'] },
          { t: 'say', when: function (ctx) { var s = ctx.get('cook_same', []); return Array.isArray(s) && s.indexOf(ctx.val('cook_var')) >= 0; },
            html: function (ctx) { return '<span class="react warn" style="display:block">"' + ctx.ev('cook_var') + '"을/를 다르게 하기로 했는데 같게 할 것에도 골랐어요. 한 가지 조건을 다르게도, 같게도 할 수는 없어요. 어느 쪽에서 뺄까요?</span>'; } },
          { t: 'q', key: 'cook_inq', n: '!', ask: '괄호에 들어갈 내용을 써 보세요.', fills: '56쪽 · 요리사와 관련된 과학적 탐구 과정', frame: '따라서 <b>(무엇)</b>을/를 다르게 하여 음식을 만들고 맛을 비교합니다.', rows: 2,
            hints: ['①에서 고른 "다르게 할 것"을 문장에 넣어 보세요.', '"재료를 익히는 ○○을/를 다르게 하여"처럼 말해 보세요.'] },
          { t: 'tip', title: '과학적 탐구 과정의 비밀', html: '과학적 탐구 과정은 실험실에만 있지 않아요. <strong>문제를 알아차리고 → 궁금한 점을 정하고 → 한 가지만 다르게 해서 비교하거나, 알고 있는 원리를 이용해 → 해결 방법을 찾는 것.</strong> 일하는 사람들도 날마다 이 과정을 거쳐요.' }
        ]
      },
      {
        id: 'job', name: '직업 고르기', title: '장소와 직업을 골라 하는 일 조사하기', fills: '57쪽 조사해요 1',
        blocks: [
          { t: 'look', html: '교과서 90~91쪽 "다양한 직업" 그림을 펴 보세요. 그림을 펼치면 장소마다 직업 이름이 적혀 있어요.' },
          { t: 'chips', key: 'place', req: true, n: '①', ask: '어느 장소를 둘러볼까요?', options: function (ctx) { return ctx.data.places.map(function (p) { return p.name; }); }, onPick: function (ctx) { ctx.set('job', ''); } },
          { t: 'tip', icon: 'search', when: function (ctx) { return !!placeObj(ctx); }, title: function (ctx) { return placeObj(ctx).name + '의 생각 열쇠'; },
            html: function (ctx) { return '<ul>' + placeObj(ctx).keys.map(function (k) { return '<li>' + k + '</li>'; }).join('') + '</ul>'; } },
          { t: 'chips', key: 'job', n: '②', when: function (ctx) { var p = placeObj(ctx); return !!(p && p.jobs.length); }, ask: '어떤 직업을 조사할까요?', options: function (ctx) { return placeObj(ctx).jobs; } },
          { t: 'q', key: 'job_other', opt: true, input: true, n: '+', ask: '목록에 없는 직업을 조사하고 싶다면 이름을 적어요.', sub: '도우미: 그림에 있는 직업 말고 다른 장소에서 볼 수 있는 직업을 조사해도 돼요.', ph: '예: 수의사, 기상 예보관' },
          { t: 'q', key: 'work', n: '③', ask: function (ctx) { return jobHtml(ctx, '은/는') + ' 어떤 일을 할까요?'; }, fills: '57쪽 · 조사해요 1 (하는 일)', rows: 3,
            sub: '하루를 상상하며 떠올려 보세요. <b>누구</b>를 위해, <b>어디에서</b>, <b>무엇</b>을, <b>어떤 도구</b>로, <b>무엇을 조심</b>하며 일할까요?',
            hints: ['그 직업을 가진 사람이 출근해서 가장 먼저 하는 일은 무엇일까요?', '그 사람이 없다면 누가, 어떤 점에서 곤란해질까요?', '<b>(누구)</b>를 위해 <b>(어떤 도구)</b>로 <b>(무엇)</b>을/를 한다.'] },
          { t: 'tip', icon: 'book', title: '조사 도구', html: '커리어넷(<a href="https://www.career.go.kr" target="_blank" rel="noopener">career.go.kr</a>)에서 직업 이름을 검색하면 하는 일을 찾아볼 수 있어요. 실험관찰 57쪽의 누리망 연결 QR 코드도 이용해 보세요.' }
        ]
      },
      {
        id: 'lens', name: '과학 지식', title: '과학 렌즈로 직업 들여다보기', fills: '57쪽 과학 지식',
        blocks: [
          { t: 'say', html: function (ctx) { return jobHtml(ctx, '이/가') + ' 일을 잘하려면 어떤 과학 지식이 필요할까요? 처음엔 관련 없어 보여도 "이 직업에서 ○○을/를 다루는 순간이 있나?" 하고 물으면 숨은 과학이 보여요.'; } },
          { t: 'pick', key: 'lens', from: 'science', max: 3, ask: '관련 있어 보이는 과학 렌즈를 1~3개 골라요.', why: { ask: '이 직업의 어떤 일에 이 과학이 쓰일까요?', ph: '○○할 때 ~을/를 알아야 한다.' } },
          { t: 'q', key: 'knowledge', n: '!', ask: '렌즈로 찾은 것을 모아 과학 지식을 정리해요.', fills: '57쪽 · 과학 지식', frame: '<b>(직업)</b>은/는 <b>(어떤 일)</b>을 할 때 <b>(과학 지식)</b>과 같은 과학 지식을 알아야 한다.', rows: 3,
            hints: ['교과서 88쪽의 문장을 본떠 보세요. "소방관은 화재를 진압할 때 연소의 조건, 이산화 탄소의 성질과 같은 과학 지식을 알아야 합니다."', '렌즈마다 적은 문장 가운데 가장 중요한 두 가지를 골라 이어 써요.'] }
        ]
      },
      {
        id: 'inq', name: '탐구 과정', title: '일 속의 문제 상황을 탐구 과정으로', fills: '57쪽 과학적 탐구 과정',
        blocks: [
          { t: 'example', title: '교과서 속 탐구 과정 세 가지 다시 보기', html: '<ul><li><b>소방관</b> · 발화점 아래로 빠르게 온도를 낮추려면 소방 헬기와 호스를 동시에 이용해 물을 뿌려야겠어.</li><li><b>스마트 팜 운영자</b> · 식물에 물을 주는 방식을 다르게 해서 어느 쪽이 잘 자라는지 확인해 보자.</li><li><b>개인 미디어 콘텐츠 제작자</b> · 제품을 설명할 때 그림자가 생기지 않도록 조명을 뒤에 설치해야겠어.</li></ul><p>세 예시는 모두 <b>곤란한 상황</b>에서 시작해요. 스마트 팜 운영자는 <b>비교해 보기</b>로, 소방관과 콘텐츠 제작자는 <b>알고 있는 과학 원리를 이용</b>해서 해결 방법을 찾았어요.</p>' },
          { t: 'q', key: 'trouble', n: '①', ask: function (ctx) { return jobHtml(ctx, '이/가') + ' 일하다가 "어, 곤란한데?" 하는 순간은 언제일까요?'; }, ph: '문제 상황', rows: 2,
            hints: ['일이 잘 안 될 때를 떠올려 보세요. 무엇이 상하거나, 고장 나거나, 다치거나, 실패하는 순간이 있나요?', '디딤돌 4에서 고른 과학 렌즈와 이어 보세요. 예를 들어 "빛" 렌즈라면 너무 어둡거나 그림자가 생기는 순간이 있을 거예요.'] },
          { t: 'q', key: 'wonder', n: '②', ask: '그 문제를 풀려면 무엇을 알아내야 할까요? 궁금한 점을 질문으로 바꿔요.', frame: '<b>~을/를 다르게 하면 ~이/가 어떻게 달라질까?</b> 또는 <b>어떻게 하면 ~할 수 있을까?</b>', rows: 2,
            hints: ['"왜?" 또는 "어떻게 하면?"으로 시작하는 질문을 만들어 보세요.'] },
          { t: 'chips', key: 'how', req: true, n: '③', ask: '어떤 방법으로 알아볼까요?', options: [
            { v: '비교해 보기', small: '한 가지만 다르게 하고 결과를 비교해요', react: '좋아요. 다르게 할 것, 같게 할 것, 관찰하거나 잴 것을 적어요.' },
            { v: '원리 이용하기', small: '알고 있는 과학 지식으로 해결 방법을 정해요', react: '좋아요. 이용할 과학 원리와, 그래서 어떻게 할지를 적어요.' }] },
          { t: 'cols', when: function (ctx) { return ctx.val('how') === '비교해 보기'; }, cols: [
            { key: 'var_diff', color: 'orange', title: '다르게 할 것', rows: 2, ph: '딱 한 가지' },
            { key: 'var_same', color: 'blue', title: '같게 할 것', rows: 2, ph: '나머지 조건들' },
            { key: 'var_see', color: 'green', title: '관찰하거나 잴 것', rows: 2, ph: '무엇을 비교해서 결과를 알까?' }] },
          { t: 'cols', when: function (ctx) { return ctx.val('how') === '원리 이용하기'; }, cols: [
            { key: 'use_rule', color: 'blue', title: '이용할 과학 원리', rows: 2, ph: '예: 불이 타려면 ~이/가 필요하다' },
            { key: 'use_act', color: 'green', title: '그래서 이렇게 하겠다', rows: 2, ph: '원리를 이용한 해결 방법' }] },
          { t: 'q', key: 'inquiry', n: '!', ask: '모두 이어서 탐구 과정을 정리해요.', fills: '57쪽 · 과학적 탐구 과정', frame: '<b>(문제 상황)</b>을/를 해결하려면 <b>(궁금한 점)</b>을/를 알아야 한다. 그래서 <b>(방법)</b>.', rows: 3,
            hints: ['요리사의 문장을 본떠 보세요. "~하려면 ~을/를 알아야 합니다. 따라서 ~을/를 다르게 하여 ~을/를 비교합니다."', '①, ②, ③에 쓴 것을 차례로 이어 붙이고, 겹치는 말은 빼 보세요.'] },
          { t: 'challenge', key: 'hidden', tag: '숨은 과학 찾기', ask: '"과학과 상관없어 보이는 직업"에도 과학이 숨어 있을까요? 아나운서, 판매원, 운동선수, 또는 영화에서 본 직업 하나를 골라 숨은 과학을 찾아보세요.', rows: 2,
            hints: ['아나운서의 목소리가 멀리까지 또렷하게 들리려면? 소리의 성질을 떠올려 보세요.', '운동선수가 더 빨리 달리고 덜 다치려면 우리 몸의 어떤 구조를 알아야 할까요?'] }
        ]
      }
    ],
    summary: {
      pages: [
        { page: '56쪽', title: '요리사와 관련된 과학적 요소', boxes: [
          { label: '과학 지식 ① 물에 얼마나 잘 ( ) 되는지', key: 'cook1', step: 0, color: 'blue' },
          { label: '과학 지식 ② 다양한 ( )을/를 이용해 김치, 요구르트', key: 'cook2', step: 0, color: 'blue' },
          { label: '과학 지식 ③ 조리하기에 알맞은 ( )', key: 'cook3', step: 0, color: 'blue' },
          { label: '과학적 탐구 과정 · 따라서 ( ) 음식을 만들고 맛을 비교', key: 'cook_inq', step: 1, color: 'green' }
        ] },
        { page: '57쪽', title: '조사해요', boxes: [
          { label: '장소', key: 'place', step: 2, color: 'orange' },
          { label: '직업 (= ( )과/와 관련된 과학적 요소의 빈칸)', step: 2, color: 'orange', get: jobName },
          { label: '하는 일', key: 'work', step: 2, color: 'orange' },
          { label: '과학 지식', key: 'knowledge', step: 3, color: 'blue' },
          { label: '과학적 탐구 과정', key: 'inquiry', step: 4, color: 'green' }
        ] }
      ],
      checks: [
        { k: '지식·이해', t: '직업과 관련된 과학적 요소에는 과학 지식과 과학적 탐구 과정이 함께 있다는 것을 설명할 수 있어요.' },
        { k: '과정·기능', t: '직업을 조사하고, 일 속의 문제 상황에서 탐구 과정을 끌어냈어요.' },
        { k: '가치·태도', t: '친구들과 협력해 직업과 관련된 과학적 요소를 찾았어요.' }
      ]
    }
  });
})();
