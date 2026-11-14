(function (root) {
  'use strict';
  // イベントスチル。台詞のきっかけ {still:'chapter-03'} で表示し、一度見た絵はタイトルの「思い出の絵」から見返せる。
  // 見た記録は保存データとは別に持つ（章選択や「はじめから」で消えないように）。
  const KEY = 'okaeri-stills-v1';
  const list = [
    ['chapter-01', '第1話　ふたりで灯りをともす'],
    ['chapter-02', '第2話　小箱の二つの石'],
    ['chapter-03', '第3話　岸へ帰ってきたニナ'],
    ['chapter-04', '第4話　三日ぶりの仲直り'],
    ['chapter-05', '第5話　三人乗りのそり'],
    ['chapter-06', '第6話　白い石を鞄に'],
    ['chapter-07', '第7話　この家の二脚の椅子'],
    ['chapter-08', '第8話　薬湯と護りの灯火'],
    ['chapter-09', '第9話　三人の帰り結び'],
    ['chapter-10', '第10話　選んだ翌朝'],
    ['ending-touma', '結末　トウマから告白'],
    ['ending-nina', '結末　ニナから告白'],
    ['ending-friends', '結末　名前はまだつけない'],
    ['ending-koharu', '結末　三人で仲良く'],
    ['ending-both', '結末　三人とも大事にする'],
    ['ending-touma-hearth', '結末　ストーブの前で'],
    ['ending-nina-kiss', '結末　白樺の待ち場で'],
    ['ending-koharu-love', '結末　コハルと二人で'],
    ['epilogue-pair-gate', '後日譚　門の護りの灯火'],
    ['epilogue-pair-lamp', '後日譚　二人の玄関灯'],
    ['epilogue-koharu-kitchen', '後日譚　朝の台所'],
    ['epilogue-koharu-coat', '後日譚　外套のなか'],
    ['epilogue-both-blanket', '後日譚　つないだ毛布']
  ].map(([id, title]) => ({ id, title, src: 'assets/stills/web/' + id + '.webp', thumb: 'assets/stills/web/' + id + '-thumb.webp' }));
  const byId = Object.fromEntries(list.map(s => [s.id, s]));
  function seen() {
    try {
      const v = JSON.parse(root.localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v.filter(id => byId[id]) : [];
    } catch {
      return [];
    }
  }
  function mark(id) {
    if (!byId[id]) return;
    const s = seen();
    if (s.includes(id)) return;
    s.push(id);
    try {
      root.localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
  }
  let current = null;
  function layer() {
    return root.document?.getElementById('still');
  }
  function show(id) {
    const el = layer();
    if (!el) return;
    if (!id || !byId[id]) {
      hide();
      return;
    }
    if (current === id) return;
    current = id;
    mark(id);
    el.style.backgroundImage = 'url("' + byId[id].src + '")';
    el.setAttribute('aria-label', byId[id].title);
    el.hidden = false;
    el.className = 'still';
    if (root.requestAnimationFrame)
      root.requestAnimationFrame(() => {
        if (current === id) el.className = 'still is-shown';
      });
    else el.className = 'still is-shown';
  }
  function hide() {
    const el = layer();
    current = null;
    if (!el || el.hidden) return;
    el.className = 'still';
    root.setTimeout(() => {
      if (!current) el.hidden = true;
    }, 700);
  }
  // 鑑賞。open は game.js のモーダルを借りる。
  function gallery(openModal, closeModal) {
    const have = seen(),
      esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const cards = list
      .map(s =>
        have.includes(s.id)
          ? '<button type="button" class="still-card" data-still="' +
            s.id +
            '"><img src="' +
            s.thumb +
            '" alt="" loading="lazy"><span>' +
            esc(s.title) +
            '</span></button>'
          : '<div class="still-card is-locked"><i>？</i><span>' + esc(s.title.split('　')[0]) + '</span></div>'
      )
      .join('');
    openModal(
      '<span class="tag">思い出の絵</span><h2>' +
        have.length +
        ' / ' +
        list.length +
        ' 枚</h2><p>物語の中で一度見た絵を、ここで見返せます。絵を選ぶと大きく表示します。</p><div class="still-grid">' +
        cards +
        '</div>',
      [['閉じる', closeModal, true]],
      'title'
    );
    const doc = root.document,
      grid = doc.querySelector?.('.still-grid');
    if (!grid) return;
    grid.addEventListener('click', e => {
      const b = e.target.closest('[data-still]');
      if (!b) return;
      view(b.dataset.still);
    });
  }
  function view(id) {
    const doc = root.document,
      s = byId[id];
    if (!s) return;
    const v = doc.createElement('div');
    v.className = 'still-viewer';
    v.setAttribute('role', 'dialog');
    v.setAttribute('aria-label', s.title);
    v.innerHTML = '<img src="' + s.src + '" alt="' + s.title + '"><p>' + s.title + '</p><button type="button">閉じる</button>';
    const close = () => {
      v.remove();
      doc.removeEventListener('keydown', key, true);
    };
    const key = e => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    v.addEventListener('click', close);
    doc.addEventListener('keydown', key, true);
    doc.getElementById('stage').append(v);
    v.querySelector('button').focus();
  }
  // 人物紹介。背景を切り替えて、立ち絵と名前を大きく見せる。台詞のきっかけ {intro:'koharu'} で出し、{intro:null} か会話の終わりで消える。
  const people = {
    touma: {
      name: 'トウマ',
      kana: 'TOUMA',
      role: '灯守 ・ 木と金具の修理',
      img: 'assets/touma-town-cut.png',
      bust: ['assets/faces.png', '300% 200%', '0% 0%'],
      notes: [
        'ニナの幼馴染。コハルと三人で、同じ家に暮らしている',
        '口数は少ないが、手は先に動く',
        '腰の剣は、輪をつなぐ者を守るためのもの。まだ一度も、本気で抜いたことはない'
      ]
    },
    nina: {
      name: 'ニナ',
      kana: 'NINA',
      role: '灯守 ・ 火を扱う「灯術」',
      img: 'assets/nina-town-cut.png',
      bust: ['assets/faces.png', '300% 200%', '0% 100%'],
      notes: [
        'トウマの幼馴染。コハルと三人で、同じ家に暮らしている',
        '灯術の火で、町を囲む灯りの輪をつなぐ',
        '平気なふりが上手。ばれているのは、たぶん一人だけ'
      ]
    },
    koharu: {
      name: 'コハル',
      kana: 'KOHARU',
      role: '薬師見習い',
      img: 'assets/koharu-town-cut.png',
      notes: [
        'トウマとニナの二つ年下。二人を兄と姉のように慕って、同じ家に暮らしている',
        '子どもの頃から、二人のあとをついて歩いてきた',
        'ユラ先生仕込みの薬箱を、いつも肩から提げている。得意は、かじかんだ指を戻す凍傷の軟膏'
      ]
    }
  };
  let card = null,
    diagramCard = null,
    beaconCache = '';
  function beaconSvg() {
    const D = root.OkaeriDraw;
    if (!D) return '';
    if (beaconCache) return beaconCache;
    const { rect: R, ell: E, path: P, stroke: S, line: L, g: G, wood, ball, light, n, rng } = D;
    const W = 820,
      H = 384;
    const SERIF = "'Yu Mincho','Hiragino Mincho ProN','Noto Serif JP',serif";
    const SANS = "'Yu Gothic UI','Hiragino Sans','Noto Sans JP',sans-serif";
    const txt = (x, y, s, size, fill, o = {}) =>
      `<text x="${n(x)}" y="${n(y)}" font-size="${size}" fill="${fill}" text-anchor="${o.anchor || 'start'}" font-family="${o.serif ? SERIF : SANS}" font-weight="${o.weight || 600}" letter-spacing="${o.spacing ?? 1}">${s}</text>`;

    let b = `<linearGradient id="op-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06121d"/><stop offset=".58" stop-color="#0e2638"/><stop offset="1" stop-color="#1c3f52"/></linearGradient>
<linearGradient id="op-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#edf3f5"/><stop offset="1" stop-color="#afc8d8"/></linearGradient>
<linearGradient id="op-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#224559"/><stop offset=".45" stop-color="#355d73"/><stop offset="1" stop-color="#1a3444"/></linearGradient>
<linearGradient id="op-warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e39a3b" stop-opacity=".78"/><stop offset=".55" stop-color="#ffd98a" stop-opacity=".86"/><stop offset="1" stop-color="#fff4cc" stop-opacity=".92"/></linearGradient>
<linearGradient id="op-oil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd269"/><stop offset="1" stop-color="#b86318"/></linearGradient>
<linearGradient id="op-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0bc"/><stop offset=".45" stop-color="#dfb05c"/><stop offset="1" stop-color="#7c5319"/></linearGradient>
<clipPath id="op-clip"><rect x="10" y="6" width="${W - 20}" height="${H - 12}" rx="14"/></clipPath>`;

    let scene = R(10, 6, W - 20, H - 12, 'url(#op-sky)', 14);
    scene +=
      P('M10,236L118,182L214,220L326,174L452,222L588,178L704,218L810,184V268H10Z', '#132d3f', { opacity: 0.85 }) +
      P('M10,248Q190,224 410,242T810,238V378H10Z', 'url(#op-ground)');
    const r = rng(41);
    for (let i = 0; i < 28; i++) {
      const sx = 28 + r() * 764,
        sy = 18 + r() * 168,
        sr = 0.7 + r() * 1.2;
      scene += E(sx, sy, sr, sr, '#f6fbff', { opacity: n(0.28 + r() * 0.5) });
    }
    const pine = (x, y, k) =>
      P(
        `M${n(x)},${n(y - 38 * k)}L${n(x + 13 * k)},${n(y - 16 * k)}H${n(x + 6 * k)}L${n(x + 17 * k)},${n(y + 4 * k)}H${n(x - 17 * k)}L${n(x - 6 * k)},${n(y - 16 * k)}H${n(x - 13 * k)}Z`,
        '#0c202d'
      ) +
      P(`M${n(x)},${n(y - 38 * k)}L${n(x + 9 * k)},${n(y - 22 * k)}Q${n(x)},${n(y - 25 * k)} ${n(x - 9 * k)},${n(y - 22 * k)}Z`, '#cfe2ec', {
        opacity: 0.45
      });
    for (const [px, py, pk] of [
      [68, 240, 1.05],
      [98, 246, 0.88],
      [194, 236, 0.76],
      [632, 238, 0.82],
      [718, 244, 0.96],
      [754, 248, 1.1]
    ])
      scene += pine(px, py, pk);

    scene +=
      P('M148,238Q240,268 338,318L478,326Q580,278 680,244L700,248Q606,292 522,368H296Q230,288 134,242Z', '#4d768c', { opacity: 0.42 }) +
      S('M146,240Q252,276 372,344', '#b8d4e3', 2, { 'stroke-dasharray': '4 8', opacity: 0.35 }) +
      S('M682,246Q578,284 448,346', '#b8d4e3', 2, { 'stroke-dasharray': '4 8', opacity: 0.35 }) +
      G(
        P('M76,248Q80,232 92,229L96,220L101,228L108,219L110,229Q122,233 125,248Z', '#07131c') +
          E(98, 233, 1.6, 1.1, '#df6b52') +
          E(105, 233, 1.6, 1.1, '#df6b52'),
        { opacity: 0.9 }
      );

    for (const [lx, ly, sc] of [
      [152, 236, 0.72],
      [678, 242, 0.76]
    ]) {
      scene +=
        light(lx + 7 * sc, ly - 18 * sc, 34 * sc, '#ffd078', 0.62) +
        R(lx - 2 * sc, ly - 28 * sc, 4 * sc, 30 * sc, '#3c4e4a', 1) +
        L(lx, ly - 25 * sc, lx + 9 * sc, ly - 25 * sc, '#3c4e4a', 2.2 * sc) +
        R(lx + 4 * sc, ly - 23 * sc, 7 * sc, 9 * sc, '#ffe29a', 1, { stroke: '#2c3c38', 'stroke-width': 1 }) +
        E(lx + 4 * sc, ly + 2 * sc, 11 * sc, 3.2 * sc, 'url(#op-snow)', { opacity: 0.75 });
    }

    scene += G(
      E(408, 332, 168, 30, 'none', { stroke: '#ffd27a', 'stroke-width': 6, opacity: 0.24, filter: 'url(#b4)' }) +
        E(408, 332, 168, 30, 'none', { stroke: '#ffe4a3', 'stroke-width': 1.8, 'stroke-dasharray': '8 6', opacity: 0.72 }) +
        E(408, 332, 132, 22, 'none', { stroke: '#ffd27a', 'stroke-width': 1.1, 'stroke-dasharray': '3 7', opacity: 0.55 }) +
        S('M157,219Q284,278 444,202Q572,278 683,224', '#ffd074', 6, { opacity: 0.25, filter: 'url(#b4)' }) +
        S('M157,219Q284,278 444,202Q572,278 683,224', '#ffe7ad', 1.9, { 'stroke-dasharray': '5 7', opacity: 0.85 }),
      { opacity: 0.92 }
    );

    scene +=
      light(444, 200, 180, '#ffcf74', 0.56) +
      light(444, 200, 76, '#fff2c2', 0.62) +
      E(418, 336, 126, 22, '#ffd884', { opacity: 0.22, filter: 'url(#b8)' });

    const snowDrift = (cx, cy, rx, ry) =>
      E(cx + 3, cy + ry * 0.45, rx, ry * 0.82, '#0c202e', { opacity: 0.35, filter: 'url(#b2)' }) +
      E(cx, cy, rx, ry, 'url(#op-snow)') +
      E(cx - rx * 0.22, cy - ry * 0.32, rx * 0.48, ry * 0.28, '#ffffff', { opacity: 0.75, filter: 'url(#b1)' });
    scene += snowDrift(398, 342, 138, 24) + snowDrift(310, 336, 56, 15) + snowDrift(476, 340, 66, 16);

    scene +=
      G(
        wood(R(-5, -24, 10, 44, '#6d563d', 2), 'v') +
          R(-5, -24, 10, 44, 'url(#cyl)', 2, { opacity: 0.45 }) +
          P('M-6,-24Q0,-30 6,-24Q0,-21 -6,-24Z', 'url(#op-snow)'),
        { transform: 'translate(292,316) rotate(-16)' }
      ) + snowDrift(292, 334, 24, 7);

    scene +=
      wood(R(322, 114, 21, 138, '#6b5741', 2), 'v') +
      R(322, 114, 21, 138, 'url(#fsh)', 2, { opacity: 0.5 }) +
      L(329, 115, 329, 251, '#26180c', 1.1, { opacity: 0.45 }) +
      L(336, 115, 336, 251, '#26180c', 1.1, { opacity: 0.45 }) +
      wood(R(320, 134, 26, 7, '#534231', 1.5), 'h') +
      wood(R(320, 222, 26, 7, '#534231', 1.5), 'h') +
      P('M319,115Q332,104 345,114Q332,119 319,115Z', 'url(#op-snow)');

    scene +=
      wood(R(344, 62, 24, 272, '#786149', 3), 'v') +
      R(344, 62, 24, 272, 'url(#cyl)', 3, { opacity: 0.48 }) +
      P('M368,148L422,98L430,104L368,160Z', '#5a4734') +
      wood(R(336, 84, 134, 16, '#6d5740', 2.5), 'h') +
      R(336, 84, 134, 16, 'url(#fsh)', 2.5, { opacity: 0.45 }) +
      L(338, 85.2, 468, 85.2, '#fff1d0', 1, { opacity: 0.28 }) +
      P('M341,63Q356,50 371,63Q356,68 341,63Z', 'url(#op-snow)') +
      P('M368,84Q418,74 470,84Q420,88 368,84Z', 'url(#op-snow)', { opacity: 0.85 }) +
      snowDrift(356, 332, 34, 10);

    const rope = (d, w = 4.2) => S(d, '#5c4222', w + 1.8) + S(d, '#dec48f', w) + S(d, '#a68248', w * 0.72, { 'stroke-dasharray': '3 4' });
    scene +=
      rope('M293,308L340,188', 3.8) +
      rope('M293,308L401,252', 3.4) +
      rope('M340,188L401,252', 3.2);
    for (const ry of [83, 88, 93, 98]) scene += rope(`M341,${ry}H371`, 3.6);
    for (const rx of [345, 352, 359, 365]) scene += rope(`M${rx},81V102`, 3.2);
    for (const ry of [183, 188, 193]) scene += rope(`M319,${ry}H369`, 3.5);
    for (const rx of [438, 444, 450]) scene += rope(`M${rx},82V102`, 3.2);
    scene +=
      ball(340, 188, 5.5, 5, '#d8bc84') +
      S('M338,192Q331,203 327,212M342,192Q345,204 342,214', '#d8bc84', 2.4) +
      ball(293, 308, 5, 4.5, '#d8bc84');

    const cx = 444;
    scene +=
      E(cx, 107, 7, 6, 'none', { stroke: '#364844', 'stroke-width': 3.2 }) +
      R(cx - 12, 112, 24, 11, '#334542', 2) +
      E(cx - 6, 117, 2, 2, '#172220') +
      E(cx, 117, 2, 2, '#172220') +
      E(cx + 6, 117, 2, 2, '#172220') +
      P(`M${cx - 56},149L${cx - 18},121H${cx + 18}L${cx + 56},149Z`, '#364946', { stroke: '#202e2c', 'stroke-width': 1.4 }) +
      P(`M${cx - 56},149H${cx + 56}L${cx + 50},155H${cx - 50}Z`, '#263634') +
      P(`M${cx - 58},148Q${cx - 26},122 ${cx},118Q${cx + 28},122 ${cx + 58},148Q${cx + 38},144 ${cx + 22},149Q${cx},142 ${cx - 22},149Q${cx - 38},144 ${cx - 58},148Z`, 'url(#op-snow)');
    for (const [ix, ih] of [
      [cx - 48, 9],
      [cx - 39, 6],
      [cx + 38, 7],
      [cx + 47, 11]
    ])
      scene += P(`M${ix - 2},150L${ix},${150 + ih}L${ix + 2},150Z`, '#cde4f0', { opacity: 0.85 });

    scene +=
      R(cx - 44, 154, 88, 110, '#293a37', 3, { stroke: '#182422', 'stroke-width': 1.5 }) +
      R(cx - 36, 162, 72, 94, 'url(#op-warm)', 2) +
      P(`M${cx - 24},236Q${cx - 26},253 ${cx},254Q${cx + 26},253 ${cx + 24},236L${cx + 16},228H${cx - 16}Z`, '#7c5329', {
        stroke: '#472d12',
        'stroke-width': 1.2
      }) +
      P(`M${cx - 21},239Q${cx - 22},250 ${cx},251Q${cx + 22},250 ${cx + 21},239Z`, 'url(#op-oil)') +
      E(cx, 239, 20, 3.2, '#ffe08c', { opacity: 0.7 }) +
      S(`M${cx},228Q${cx - 2},240 ${cx + 4},248`, '#e8dcc0', 4.2, { opacity: 0.78 }) +
      R(cx - 9, 219, 18, 10, 'url(#op-brass)', 2, { stroke: '#5c3d12', 'stroke-width': 1 }) +
      ball(cx + 11, 224, 3, 3, '#f0cb78') +
      R(cx - 3.6, 203, 7.2, 17, '#f5ecd4', 2, { stroke: '#8a6f48', 'stroke-width': 1 }) +
      S(`M${cx - 2.5},207L${cx + 2.5},211M${cx - 2.5},211L${cx + 2.5},215M${cx - 2.5},215L${cx + 2.5},219`, '#9c7e54', 1) +
      R(cx - 3.2, 201, 6.4, 4, '#4a2b18', 1.5) +
      E(cx, 201.5, 3, 1.5, '#ff8e2b') +
      P(`M${cx},166C${cx + 15},180 ${cx + 16},198 ${cx},203C${cx - 16},198 ${cx - 15},180 ${cx},166Z`, '#ff9c2e', {
        opacity: 0.88,
        filter: 'url(#b1)'
      }) +
      P(`M${cx},171C${cx + 10},182 ${cx + 11},196 ${cx},201C${cx - 11},196 ${cx - 10},182 ${cx},171Z`, '#ffd86b') +
      P(`M${cx},178C${cx + 5.5},186 ${cx + 6},195 ${cx},199C${cx - 6},195 ${cx - 5.5},186 ${cx},178Z`, '#fffdf0') +
      E(cx - 11, 176, 1.6, 1.6, '#fff0b8') +
      E(cx + 13, 172, 1.4, 1.4, '#ffe28a') +
      E(cx + 8, 165, 1.2, 1.2, '#fff6d6') +
      R(cx - 20, 162, 2.2, 94, '#2d3f3c', 0, { opacity: 0.72 }) +
      R(cx + 18, 162, 2.2, 94, '#2d3f3c', 0, { opacity: 0.72 }) +
      R(cx - 36, 162, 72, 94, 'url(#glass)', 2, { opacity: 0.42 }) +
      R(cx - 36, 162, 72, 94, 'none', 2, { stroke: '#627c78', 'stroke-width': 1.2 }) +
      R(cx - 46, 171, 7, 10, '#8d7248', 1.2) +
      R(cx - 46, 236, 7, 10, '#8d7248', 1.2) +
      R(cx - 50, 263, 100, 9, '#334643', 2, { stroke: '#1a2624', 'stroke-width': 1.2 }) +
      P(`M${cx - 49},263Q${cx - 28},258 ${cx - 14},263Z`, 'url(#op-snow)', { opacity: 0.75 }) +
      E(cx - 43, 253, 4.5, 4.5, 'none', { stroke: '#8c7248', 'stroke-width': 2.2 }) +
      R(cx + 39, 193, 9, 28, 'url(#op-brass)', 2, { stroke: '#593b10', 'stroke-width': 1.2 }) +
      R(cx + 46, 199, 13, 16, 'url(#op-brass)', 2.5, { stroke: '#593b10', 'stroke-width': 1.2 }) +
      S(`M${cx + 42},207H${cx + 55}Q${cx + 60},207 ${cx + 58},214`, '#fff0bc', 3.2) +
      S(`M${cx + 42},207H${cx + 55}Q${cx + 60},207 ${cx + 58},214`, '#6e4914', 1.1) +
      ball(cx + 53, 204, 2.8, 2.8, '#fff2c6') +
      L(cx + 53, 196, cx + 53, 219, '#e7be6a', 2.2);

    const callout = (pts, bx, by, bw, title, sub) => {
      const strokeC = '#f3ca7e';
      let c = '';
      for (const [px, py, ex, ey] of pts) {
        c +=
          E(px, py, 6.5, 6.5, 'none', { stroke: strokeC, 'stroke-width': 1.4, opacity: 0.75 }) +
          E(px, py, 2.8, 2.8, '#fff4cf') +
          S(`M${n(px)},${n(py)}L${n(ex)},${n(ey)}L${n(bx < px ? bx + bw : bx)},${n(ey)}`, strokeC, 1.5, { opacity: 0.9 });
      }
      c +=
        R(bx, by, bw, 54, '#081924eb', 7, { stroke: strokeC, 'stroke-width': 1.4 }) +
        txt(bx + 14, by + 23, title, 16, '#ffe2a2', { serif: true, weight: 700, spacing: 2 }) +
        txt(bx + 14, by + 43, sub, 11.5, '#d7e5e4', { weight: 500, spacing: 0.5 });
      return G(c);
    };

    scene +=
      callout(
        [
          [356, 91, 292, 96],
          [340, 188, 292, 108]
        ],
        34,
        74,
        232,
        '縄（風よけ・控え縄）',
        '支柱と風よけを結び、吹雪に耐える'
      ) +
      callout([[cx + 55, 207, 530, 132]], 554, 102, 232, '留め金', '硝子戸を固く閉ざし、風雪を防ぐ') +
      callout([[cx + 2, 213, 526, 256]], 554, 226, 232, '替えの芯と油', '灯術の火を宿す（三日で尽きる）') +
      callout([[306, 244, 284, 269]], 34, 242, 232, '護りの灯火（灯りの輪）', '火と火をつなぎ、山の魔獣を退ける') +
      R(W / 2 - 126, 16, 252, 26, '#081924d9', 13, { stroke: '#e9be7866', 'stroke-width': 1 }) +
      txt(W / 2, 34, '護りの灯火 — 灯守が手入れする実物', 12, '#f5d99e', { anchor: 'middle', serif: true, weight: 600, spacing: 2 });

    beaconCache = D.doc(
      W,
      H,
      b +
        G(scene, { 'clip-path': 'url(#op-clip)' }) +
        R(10, 6, W - 20, H - 12, 'none', 14, { stroke: '#e9be7858', 'stroke-width': 1.5 }) +
        R(15, 11, W - 30, H - 22, 'none', 11, { stroke: '#e9be7824', 'stroke-width': 1 })
    );
    return beaconCache;
  }
  function diagram(id) {
    const doc = root.document,
      stage = doc?.getElementById('stage');
    if (!stage || !stage.insertBefore) return;
    if (!id) {
      if (diagramCard) {
        const d = diagramCard;
        diagramCard = null;
        d.className = 'diagram-card';
        root.setTimeout(() => d.remove?.(), 500);
      }
      return;
    }
    const svg = id === 'beacon' ? beaconSvg() : '';
    if (!svg) return;
    if (card) {
      card.remove?.();
      card = null;
    }
    if (diagramCard) diagramCard.remove?.();
    diagramCard = doc.createElement('div');
    diagramCard.className = 'diagram-card';
    if (diagramCard.dataset) diagramCard.dataset.diagram = id;
    diagramCard.setAttribute?.('aria-label', '護りの灯火の図解');
    diagramCard.innerHTML = svg;
    stage.insertBefore(diagramCard, doc.getElementById('hud'));
    const mine = diagramCard;
    (root.requestAnimationFrame || (f => f()))(() => {
      if (diagramCard === mine) mine.className = 'diagram-card is-shown';
    });
  }
  function intro(id) {
    const doc = root.document,
      stage = doc?.getElementById('stage');
    if (!stage || !stage.append) return;
    if (!id || !people[id]) {
      if (card) {
        const c = card;
        card = null;
        c.className = 'intro-card';
        root.setTimeout(() => c.remove(), 600);
      }
      return;
    }
    if (diagramCard) {
      diagramCard.remove?.();
      diagramCard = null;
    }
    if (card) card.remove();
    const p = people[id];
    card = doc.createElement('div');
    card.className = 'intro-card';
    card.dataset.who = id;
    card.setAttribute('aria-label', p.name + 'の紹介');
    card.innerHTML =
      (p.bust
        ? '<div class="intro-bust" style="background-image:url(' +
          p.bust[0] +
          ');background-size:' +
          p.bust[1] +
          ';background-position:' +
          p.bust[2] +
          '"></div>'
        : '<img src="' + p.img + '" alt="">') +
      '<div class="intro-text"><small>' +
      p.kana +
      '</small><strong>' +
      p.name +
      '</strong><em>' +
      p.role +
      '</em><ul>' +
      p.notes.map(n => '<li>' + n + '</li>').join('') +
      '</ul></div>';
    stage.insertBefore(card, doc.getElementById('hud'));
    const mine = card;
    // 立ち絵（*-town-cut.png）が届いている人物は、顔の切り抜きの代わりに立ち絵で見せる。無ければ顔のまま。
    if (p.bust && p.img && typeof root.Image === 'function') {
      const im = new root.Image();
      im.onload = () => {
        const b = mine.querySelector?.('.intro-bust');
        if (b) {
          const el = doc.createElement('img');
          el.src = p.img;
          el.alt = '';
          b.replaceWith(el);
        }
      };
      im.src = p.img;
    }
    (root.requestAnimationFrame || (f => f()))(() => {
      if (card === mine) mine.className = 'intro-card is-shown';
    });
  }
  root.OkaeriStills = {
    intro,
    diagram,
    beaconSvg,
    people,
    list,
    seen,
    mark,
    show,
    hide,
    gallery,
    view,
    get current() {
      return current;
    }
  };
  if (typeof module !== 'undefined') module.exports = root.OkaeriStills;
})(typeof globalThis !== 'undefined' ? globalThis : this);
