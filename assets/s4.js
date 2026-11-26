/* 정거장 4 · 우리의 진로에 영향을 미치는 과학적 요소 탐구하기 (실험관찰 58~59쪽)
   사고의 점프: 관심·가치 → 하고 싶은 일 → 미래 기술의 영향(대신/도움/새로 생김) → 나의 과학적 요소
   → 진로 목표 문장 → 거꾸로 계획(20년 뒤 → 지금) → 20년 뒤 기사 */
(function () {
  var LIKE = ['만들기', '그리기·꾸미기', '몸 움직이기', '동물 돌보기', '식물·자연 관찰', '요리', '컴퓨터·코딩', '게임 만들기', '노래·춤·연기', '글쓰기·이야기', '친구 돕기·상담', '정리·계획하기', '실험·탐구', '기계 다루기', '말하기·발표'];
  var HELP = ['아픈 사람', '동물', '지구와 자연', '어린이', '어르신', '우리 동네', '친구와 가족', '어려움을 겪는 사람'];
  var WAY = ['손으로 만들며', '사람을 만나며', '생각하고 분석하며', '몸을 움직이며', '새로운 것을 표현하며', '기계와 컴퓨터를 다루며'];
  function dream(ctx) { return ctx.val('dream'); }
  function techName(ctx, k) { var id = ctx.get(k, []); id = Array.isArray(id) ? id[0] : id; var t = (ctx.data.tech || []).filter(function (x) { return x.id === id; })[0]; return t ? t.name : ''; }
  function techBlocks(slot, label) {
    var key = 'tech' + slot;
    return [
      { t: 'pick', key: key, from: 'tech', max: 1, ask: label + ' 하고 싶은 일과 관련 있어 보이는 미래 기술을 하나 골라요.' },
      { t: 'cols', when: function (ctx) { return !!techName(ctx, key); }, cols: [
        { key: key + '_rep', color: 'pink', title: '대신해 줄 일', sub: '이 기술이 대신하게 될 일은?', rows: 2, ph: '지금 사람이 하지만 기술이 맡게 될 일', hints: ['내가 하고 싶은 일 가운데 반복되거나, 위험하거나, 계산이 많은 부분은 무엇인가요?'] },
        { key: key + '_aid', color: 'blue', title: '도와줄 일', sub: '이 기술 덕분에 더 잘하게 될 일은?', rows: 2, ph: '기술과 함께라서 더 잘하게 될 일', hints: ['이 기술을 도구처럼 쓰면 더 빠르게, 더 정확하게, 더 멀리 할 수 있는 일은 무엇일까요?'] },
        { key: key + '_new', color: 'green', title: '새로 생길 일', sub: '이 기술 때문에 새로 필요해질 일은?', rows: 2, ph: '기술이 생겨서 새로 필요해지는 일', hints: ['기술을 만들고, 고치고, 바르게 쓰도록 돕는 일도 새로 생겨요.'] }] },
      { t: 'q', key: 'impact' + slot, n: '!', when: function (ctx) { return !!techName(ctx, key); }, ask: function (ctx) { return '<strong>' + ctx.esc(techName(ctx, key)) + '</strong>' + ctx.josa(techName(ctx, key), '은/는').slice(techName(ctx, key).length) + ' 나의 진로에 어떤 영향을 미칠까요?'; },
        fills: '58쪽 · 나의 진로에 미치는 영향 ' + label, frame: '<b>(기술)</b>이 발달하면 나는 <b>(어떤 일)</b>을 더 ~하게 / 새롭게 ~하게 될 것이다.', rows: 3,
        hints: ['세 칸 가운데 내 진로에 가장 크게 영향을 줄 것 같은 칸을 하나 골라요.', '"그래서 나는 무엇을 더 잘 준비해야 할까?"까지 생각하면 더 깊은 문장이 돼요.'] }
    ];
  }

  (window.APP_STATIONS = window.APP_STATIONS || []).push({
    id: 's4', num: 4, badge: '4', color: 'pink',
    title: '나의 진로와 과학',
    wb: '실험관찰 58~59쪽', book: '교과서 92~93쪽',
    jump: '하고 싶은 일 → 미래 기술의 영향 → 나의 과학적 요소 → 거꾸로 세우는 진로 계획',
    goal: '내가 하고 싶은 일이 미래의 과학 기술과 어떻게 이어지는지 탐구하고, 과학을 바탕으로 진로를 계획해요.',
    steps: [
      {
        id: 'dream', name: '하고 싶은 일', title: '미래에 내가 하고 싶은 일', fills: '58쪽 조사해요 1',
        blocks: [
          { t: 'say', html: '교과서 88쪽은 <strong>진로</strong>를 "직업을 선택하는 과정을 포함한, 한 사람이 원하는 삶의 방향"이라고 했어요. 그래서 꼭 직업 이름이 아니어도 괜찮아요. <strong>"아픈 동물을 돕는 일"</strong>처럼 하고 싶은 일로 써도 돼요.' },
          { t: 'chips', key: 'path', req: true, ask: '지금 나는 어느 쪽인가요?', options: [
            { v: '하고 싶은 일이 있어요', react: '좋아요. 아래 칸에 바로 적어요. 왜 그 일을 하고 싶은지도 함께 떠올려 보세요.' },
            { v: '아직 잘 모르겠어요', react: '괜찮아요. 6학년에 꿈이 정해지지 않은 것은 자연스러운 일이에요. 아래 세 질문으로 실마리를 찾아봐요.' }] },
          { t: 'group', when: function (ctx) { return ctx.val('path') === '아직 잘 모르겠어요'; }, blocks: [
            { t: 'chips', key: 'like', multi: true, max: 3, n: '①', ask: '시간 가는 줄 모르고 하는 일은? (3개까지)', options: LIKE },
            { t: 'chips', key: 'help', multi: true, max: 2, n: '②', ask: '누구를, 또는 무엇을 돕고 싶나요? (2개까지)', options: HELP },
            { t: 'chips', key: 'way', multi: true, max: 2, n: '③', ask: '어떤 방식으로 일할 때 즐거울까요? (2개까지)', options: WAY },
            { t: 'say', when: function (ctx) { return ctx.get('like', []).length && ctx.get('help', []).length; }, html: function (ctx) {
              return '<span class="react" style="display:block">조합해 보면 · <b>' + ctx.esc(ctx.get('help', []).join(', ')) + '</b>을/를 위해 <b>' + ctx.esc(ctx.get('like', []).join(', ')) + '</b>을/를 살려 <b>' + ctx.esc((ctx.get('way', [])[0] || '나만의 방식으로')) + '</b> 일하는 사람. 이런 일을 하는 사람에는 누가 있을까요? 커리어넷이나 교과서 82~83쪽 직업 말판에서 찾아보세요.</span>';
            } }
          ] },
          { t: 'q', key: 'dream', n: '!', ask: '미래에 내가 하고 싶은 일을 써요.', fills: '58쪽 · 조사해요 1', ph: '예: 스마트 의류 개발자 / 아픈 동물을 치료하는 일', rows: 2,
            hints: ['직업 이름이 떠오르지 않으면 "누구를 위해, 무엇을 하는 일"로 적어도 돼요.', '두세 가지가 떠오르면 지금 가장 마음이 가는 것 하나만 골라요. 언제든 바꿀 수 있어요.'] }
        ]
      },
      {
        id: 'tech', name: '미래 기술', title: '미래의 과학 기술이 내 진로에 미칠 영향', fills: '58쪽 조사해요 2',
        blocks: [
          { t: 'look', html: function (ctx) { return '나의 하고 싶은 일 · <strong>' + (ctx.ev('dream') || '디딤돌 1에서 먼저 적어 주세요') + '</strong>'; } },
          { t: 'example', title: '교과서 92~93쪽 예시 보기 · 스마트 의류 개발자', html: '스마트 의류 개발자가 되고 싶은 친구는 <b>확장 현실 기술</b>로 스마트 의류를 가상으로 만들거나 입어 볼 수 있게 될 거라고 했어요. 그림에는 <b>인공지능 기술, 홀로그램 기술, 개인 맞춤형 비서 로봇</b>도 나와요. 기술마다 그 직업의 일을 <b>대신</b>하거나, <b>도와주거나</b>, <b>새로운 일</b>을 만들어요.' },
          { t: 'say', html: '기술이 진로에 주는 영향은 세 가지 렌즈로 보면 잘 보여요. <strong>대신해 줄 일 · 도와줄 일 · 새로 생길 일.</strong> 두 가지 기술을 골라 생각해 봐요.' },
          { t: 'search', words: function (ctx) { var d = dream(ctx) || '꿈꾸는 직업'; return [d + ' 미래 기술', d + ' 인공지능', '미래 직업 변화 어린이', '미래의 과학 기술']; } }
        ].concat(techBlocks(1, '①')).concat(techBlocks(2, '②')).concat([
          { t: 'tip', title: '교과서 99쪽 "생각을 넓혀요"에도 써 보기', html: '"인공지능의 발전은 나의 진로에 어떤 영향을 줄까?"도 같은 세 렌즈(대신해 줄 일 · 도와줄 일 · 새로 생길 일)로 생각할 수 있어요. 기술 카드에서 <b>인공지능</b>을 골라 보세요.' },
          { t: 'challenge', key: 'job_change', tag: '생각+', ask: '교과서 93쪽 생각+: 과학 기술의 발달이 직업을 바꾼 사례를 찾아보세요.', ph: '옛날에는 ~했지만, ~ 때문에 지금은 ~', rows: 3,
            hints: ['부모님이나 할머니, 할아버지께 어릴 때는 있었지만 지금은 사라졌거나 크게 달라진 직업을 여쭈어 보세요.', '가게에서 계산하는 방법, 표를 사는 방법, 사진을 찍고 뽑는 방법이 옛날과 지금 어떻게 다른지 떠올려 보세요. 그 일을 하던 사람의 일은 어떻게 달라졌을까요?', '옛날에는 <b>(누가)</b> <b>(무엇을)</b> 했지만, <b>(어떤 기술)</b> 덕분에(때문에) 지금은 <b>(어떻게)</b> 달라졌다.'] }
        ])
      },
      {
        id: 'my', name: '나의 과학', title: '나의 진로와 관련된 과학적 요소', fills: '58쪽 활동해요 1',
        blocks: [
          { t: 'say', html: '정거장 3에서 직업 속 과학을 찾던 방법을 이번에는 <strong>나의 진로</strong>에 써 봐요. 진로를 실현하는 데 필요한 과학 지식과, 그 일에서 거칠 과학적 탐구 과정을 떠올려요.' },
          { t: 'pick', key: 'mylens', from: 'science', max: 3, ask: '나의 진로와 관련 있는 과학 렌즈를 1~3개 골라요.', why: { ask: '내가 하고 싶은 일의 어떤 부분에 이 과학이 쓰일까요?', ph: '○○할 때 ~을/를 알아야 한다.' } },
          { t: 'cols', cols: [
            { key: 'my_know', color: 'blue', title: '과학 지식', fills: '58쪽 · 과학 지식', rows: 3, ph: '나의 진로에 필요한 과학 지식', hints: ['위에서 고른 렌즈마다 적은 문장을 모아 보세요.', '교과서 92쪽의 친구는 "스마트 의류를 개발하려면 우리 몸의 구조와 기능을 이해하는 것이 중요해."라고 말했어요.'] },
            { key: 'my_inq', color: 'green', title: '과학적 탐구 과정', fills: '58쪽 · 과학적 탐구 과정', rows: 3, ph: '그 일에서 생길 문제와, 그것을 풀어 가는 탐구', hints: ['그 일을 하다가 생길 수 있는 곤란한 상황을 하나 떠올려 보세요.', '그 상황에서 "무엇을 다르게 해서 비교할까?" 또는 "어떤 원리를 이용할까?"를 생각해 보세요.', '<b>(문제 상황)</b>을/를 해결하려면 <b>(궁금한 점)</b>을/를 알아야 한다. 그래서 <b>(방법)</b>.'] }] }
        ]
      },
      {
        id: 'goal', name: '진로 목표', title: '나의 진로 목표 문장', fills: '59쪽 활동해요 2',
        blocks: [
          { t: 'say', html: '실험관찰 59쪽의 목표 문장은 두 부분이에요. <strong>나는 ( 무엇 )이/가 되어 ( 어떤 일을 하고 ) 싶습니다.</strong> 앞 칸은 "무엇이 될지", 뒤 칸은 "왜, 무엇을 위해"예요. 뒤 칸이 진로의 방향을 보여 줘요.' },
          { t: 'q', key: 'goal_job', input: true, n: '①', ask: '나는 ( ? )이/가 되어', fills: '59쪽 · 진로 목표 앞 칸', ph: function (ctx) { return ctx.val('dream') || '되고 싶은 사람'; } },
          { t: 'q', key: 'goal_why', n: '②', ask: '( ? ) 싶습니다.', fills: '59쪽 · 진로 목표 뒤 칸', rows: 2, ph: '누구를 위해, 무엇을 하고',
            hints: ['내가 그 일을 하면 누가 기뻐할까요? 그 사람에게 무엇을 해 주고 싶나요?', '디딤돌 2에서 고른 미래 기술을 넣어 보면 미래의 나다운 목표가 돼요.', '<b>(누구)</b>이/가 <b>(어떻게 되도록)</b> <b>(무엇을 하고)</b> 싶습니다.'] },
          { t: 'say', when: function (ctx) { return ctx.val('goal_job') && ctx.val('goal_why'); }, html: function (ctx) { return '<span class="react ok" style="display:block">나는 <b>' + ctx.esc(ctx.josa(ctx.val('goal_job'), '이/가')) + '</b> 되어 <b>' + ctx.ev('goal_why') + '</b> 싶습니다.</span>'; } }
        ]
      },
      {
        id: 'plan', name: '거꾸로 계획', title: '거꾸로 세우는 나의 진로 계획', fills: '59쪽 나의 진로 계획',
        blocks: [
          { t: 'say', html: '실험관찰에는 <strong>현재 → ( )년 뒤 → ( )년 뒤</strong> 순서로 쓰지만, 계획은 <strong>도착점에서 거꾸로</strong> 세우면 더 쉬워요. 먼 미래의 나를 먼저 그리고, "그러려면 그 전에?"를 두 번 물어요.' },
          { t: 'plan', hints: {
            far: ['진로 목표 문장을 떠올려 보세요. 그 목표에 가까워진 나는 어디에서, 누구와, 무엇을 하고 있을까요?', '그때 내가 쓰고 있을 미래 기술도 넣어 보세요.'],
            mid: ['그 일을 하려면 무엇을 배워야 할까요? 어떤 학교나 과정, 자격, 경험이 필요할지 조사해 보세요.', '이때 나는 몇 살인가요? 그 나이에 할 수 있는 공부와 경험을 떠올려 보세요.'],
            now: ['과학 시간에 배우는 것 중 내 진로와 이어지는 단원이나 탐구는 무엇인가요?', '책, 영상, 직업 체험(교과서 94~95쪽 한국잡월드처럼), 동아리, 생활 습관 중 하나를 골라요.', '"이번 주에 ○○을/를 한다"처럼 바로 시작할 수 있을 만큼 작게 적어요.']
          } }
        ]
      },
      {
        id: 'news', name: '20년 뒤 기사', title: '20년 뒤 나의 모습을 다룬 기사', fills: '59쪽 활동해요 3',
        blocks: [
          { t: 'say', html: '진로 목표와 계획을 바탕으로 <strong>20년 뒤의 나</strong>를 다룬 "올해의 인물" 기사를 써 봐요. 실험관찰 81쪽 기사문 양식에 옮겨 쓰기 전에 재료를 모아요. 양식의 칸 이름은 여기와 다를 수 있으니 양식에 맞게 옮겨요.' },
          { t: 'q', key: 'news_head', input: true, n: '①', ask: '제목: 사람들의 눈길을 끄는 한 줄', ph: '예: ○○ 기술로 ○○을/를 바꾼 사람, ○○○' },
          { t: 'q', key: 'news_lead', n: '②', ask: '첫 문단: 누가, 언제, 무엇을 해서 올해의 인물이 되었나요?', rows: 3, hints: ['육하원칙(누가, 언제, 어디서, 무엇을, 어떻게, 왜)을 떠올려 보세요.'] },
          { t: 'q', key: 'news_sci', n: '③', ask: '어떤 과학 지식과 기술을 이용했나요? 어떤 문제를 어떻게 탐구해서 해결했나요?', rows: 3, hints: ['디딤돌 3의 과학 지식과 탐구 과정, 디딤돌 2의 미래 기술을 다시 읽어 보세요.', '정거장 1~2에서 다룬 미래 사회의 문제를 해결한 사람으로 그려도 좋아요.'] },
          { t: 'q', key: 'news_quote', n: '④', ask: '인터뷰 한마디: "어린 시절의 무엇이 도움이 되었나요?"', rows: 2, ph: '"6학년 때 ~을/를 한 것이 큰 도움이 되었어요."', hints: ['디딤돌 5에서 "현재" 칸에 적은 일을 떠올려 보세요.'] }
        ]
      }
    ],
    summary: {
      pages: [
        { page: '58쪽', title: '조사해요', boxes: [
          { label: '미래에 내가 하고 싶은 일', key: 'dream', step: 0, color: 'pink' },
          { label: '미래의 과학 기술 ①', step: 1, color: 'pink', get: function (ctx) { return techName(ctx, 'tech1'); } },
          { label: '나의 진로에 미치는 영향 ①', key: 'impact1', step: 1, color: 'orange' },
          { label: '미래의 과학 기술 ②', step: 1, color: 'pink', get: function (ctx) { return techName(ctx, 'tech2'); } },
          { label: '나의 진로에 미치는 영향 ②', key: 'impact2', step: 1, color: 'orange' }
        ] },
        { page: '58쪽', title: '활동해요 1 · 나의 진로와 관련된 과학적 요소', grid: true, boxes: [
          { label: '과학 지식', key: 'my_know', step: 2, color: 'blue' },
          { label: '과학적 탐구 과정', key: 'my_inq', step: 2, color: 'green' }
        ] },
        { page: '59쪽', title: '활동해요 2 · 진로 목표와 계획', boxes: [
          { label: '진로 목표', step: 3, color: 'lav', get: function (ctx) { var a = ctx.val('goal_job'), b = ctx.val('goal_why'); return a && b ? '나는 ' + ctx.josa(a, '이/가') + ' 되어 ' + b + ' 싶습니다.' : ''; } },
          { label: '① 현재', key: 'plan_now', step: 4, color: 'green' },
          { label: '② ( )년 뒤', step: 4, color: 'green', get: function (ctx) { var v = ctx.val('plan_mid'); return v ? '[' + (ctx.val('plan_y1') || '6') + '년 뒤] ' + v : ''; } },
          { label: '③ ( )년 뒤', step: 4, color: 'green', get: function (ctx) { var v = ctx.val('plan_far'); return v ? '[' + (ctx.val('plan_y2') || '12') + '년 뒤] ' + v : ''; } }
        ] },
        { page: '81쪽', title: '활동해요 3 · 기사문 재료', boxes: [
          { label: '제목', key: 'news_head', step: 5, color: 'orange' },
          { label: '첫 문단', key: 'news_lead', step: 5, color: 'orange' },
          { label: '과학 지식·기술과 탐구', key: 'news_sci', step: 5, color: 'orange' },
          { label: '인터뷰 한마디', key: 'news_quote', step: 5, color: 'orange' }
        ] }
      ],
      checks: [
        { k: '지식·이해', t: '나의 진로를 과학과 관련지어 설명할 수 있어요.' },
        { k: '과정·기능', t: '진로와 관련 있는 과학적 요소를 조사하고 탐구했어요.' },
        { k: '가치·태도', t: '미래의 과학 기술에 맞춰 진로를 탐색하는 것이 필요하다고 느꼈어요.' }
      ]
    }
  });
})();
