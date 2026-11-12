(function (root) {
  'use strict';
  // 演出の指揮役。台詞に添えた「きっかけ（cue）」を受け取り、
  // 画面の時間帯・天気・揺れ・暗転・感情マークと、音のきっかけへ振り分ける。
  //
  // 台詞の書き方:
  //   ['nina','台詞','shy',{se:'cup',wait:400}]
  // 3番目以降は順不同で、配列=選択肢 / 文字列=表情 / オブジェクト=きっかけ。
  const now = () => (root.performance ? root.performance.now() : Date.now());

  // 表情。専用の顔グラは「通常・笑顔・照れ」の三種なので、
  // それ以外の感情は顔グラ+マンガ的な記号（顔の横とマップ上の吹き出し）で見せる。
  const MOODS = {
    neutral: { face: 'neutral' },
    happy: { face: 'happy' },
    shy: { face: 'shy' },
    surprise: { face: 'neutral', mark: 'surprise' },
    question: { face: 'neutral', mark: 'question' },
    sweat: { face: 'neutral', mark: 'sweat' },
    think: { face: 'neutral', mark: 'think' },
    angry: { face: 'neutral', mark: 'angry', tone: 'hot' },
    sad: { face: 'neutral', mark: 'sad', tone: 'cold' },
    joy: { face: 'happy', mark: 'note' },
    fluster: { face: 'shy', mark: 'sweat' },
    love: { face: 'shy', mark: 'heart' },
    sleepy: { face: 'neutral', mark: 'sleep' }
  };
  const MARKS = {
    surprise: { text: '！', color: '#d9623b' },
    question: { text: '？', color: '#3f7f9c' },
    think: { text: '…', color: '#5a6a6c' },
    note: { text: '♪', color: '#c9783a' },
    heart: { text: '♥', color: '#d2687c' },
    sleep: { text: 'zz', color: '#6b7fa8' },
    sweat: { path: 'M12 3C12 3 6 11 6 15a6 6 0 0 0 12 0C18 11 12 3 12 3z', fill: '#6fb7d9' },
    angry: { path: 'M5 9c3 0 4-1 4-4M15 5c0 3 1 4 4 4M19 15c-3 0-4 1-4 4M9 19c0-3-1-4-4-4', stroke: '#d9534f' },
    sad: { path: 'M7 5v11M12 5v14M17 5v9', stroke: '#5c7fa8' }
  };
  function markSvg(name) {
    const m = MARKS[name];
    if (!m) return '';
    const inner = m.text
      ? '<text x="12" y="18" text-anchor="middle" font-size="17" font-weight="700" fill="' + m.color + '">' + m.text + '</text>'
      : '<path d="' +
        m.path +
        '" fill="' +
        (m.fill || 'none') +
        '" stroke="' +
        (m.stroke || 'none') +
        '" stroke-width="2.6" stroke-linecap="round"/>';
    return '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">' + inner + '</svg>';
  }
  function normalize(line) {
    const out = { speaker: line[0] || '', text: line[1] || '', choices: null, mood: null, cue: null };
    for (const extra of line.slice(2)) {
      if (Array.isArray(extra)) out.choices = extra;
      else if (typeof extra === 'string') out.mood = extra;
      else if (extra && typeof extra === 'object') out.cue = extra;
    }
    return out;
  }
  function mood(name) {
    return MOODS[name] || MOODS.neutral;
  }

  // ---------------------------------------------------------------- 舞台の状態
  const stage = { time: 'day', weather: 'snow', over: {}, shake: null, flash: null, fade: null, emotes: [] };
  const reduced = () => {
    try {
      return !!root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  };
  function ambient(s) {
    const E = root.OkaeriEpisodes,
      ep = s.episode,
      f = s.flags || {};
    let time = 'day',
      weather = 'snow',
      bgm = null;
    if (ep && E) {
      const e = ep.complete ? null : E.current(s);
      if (ep.chapter === 1)
        time =
          s.pendingEvening || ep.complete || f.returned
            ? 'night'
            : f.lit
              ? 'dusk'
              : s.openingStage !== undefined || !f.board
                ? 'morning'
                : 'day';
      else if (ep.complete) {
        time = 'night';
        if (ep.chapter === 10) bgm = 'ending';
      } else if (e) {
        time = e.time || 'day';
        weather = e.weather || 'snow';
        bgm = e.bgm || null;
      }
      if (ep.chapter === 9) {
        time = 'night';
        if (s.scene === 'town' && !bgm) bgm = 'festival';
      }
    } else time = f.festivalStarted || s.pendingEvening ? 'night' : f.lit && !f.returned ? 'dusk' : 'day';
    if (root.OkaeriJourney?.active(s)) {
      time = s.journey.step >= 7 ? 'dusk' : 'day';
      weather = 'snow';
      bgm = null;
    }
    const indoors = ['house', 'lampworkshop'].includes(s.scene);
    const flood = ep?.chapter === 3 && s.scene === 'canal' && ep.step >= 1 && ep.step <= 3;
    const bed = indoors
      ? 'hearth'
      : weather === 'blizzard'
        ? 'blizzard'
        : s.scene === 'canal'
          ? flood
            ? 'flood'
            : 'water'
          : s.scene === 'town'
            ? ep?.chapter === 9
              ? 'crowd'
              : 'night'
            : 'wind';
    return { time, weather, bgm, bed, indoors };
  }
  // コハルが三人目として一緒に歩く場面。
  function companion(s) {
    const epi = root.OkaeriEpisodes?.playingEpilogue?.();
    if (epi) return !!root.OkaeriCore?.route(epi)?.koharu; // 後日譚：コハルのいる結末では、家の中でも一緒にいる
    if (s.openingStage !== undefined) return true; // 第1話の朝：同じ家で起きて、広場まで三人で歩く
    const ep = s.episode;
    // 最終話でコハルが食卓を囲む結末は、家の中にもコハルがいる（三脚目の椅子の主）。
    if (ep && !ep.complete && ep.chapter === 10 && s.scene === 'house') return !!root.OkaeriCore?.route(ep.route)?.koharu;
    if (!ep || ep.complete || ['house', 'lampworkshop'].includes(s.scene) || root.OkaeriJourney?.active(s)) return false;
    if (root.OkaeriField?.names[s.scene]) return ep.chapter >= 2 && !(ep.chapter === 2 && ep.step === 0) && ep.chapter !== 4;
    // 薬の番として加わった第2話からは、当番の日は町の中も三人で歩く。
    // 朝のうちは薬草屋の仕事があるので、その日の最初の用事にはいないことがある。
    if (ep.chapter === 2) return ep.step >= 1;
    if (ep.chapter === 3) return ep.step === 0 || ep.step === 4; // 事故の間（1〜3）は一人ずつ動く
    if (ep.chapter === 5) return ep.step >= 1;
    if (ep.chapter === 8) return true;
    if (ep.chapter === 9) return ep.step <= 1; // 祭りの途中で、姿が見えなくなる
    if (ep.chapter === 10) return !!root.OkaeriCore?.route(ep.route)?.koharu && ep.step >= 1;
    return false;
  }
  // 次の目的地。いまの地図にあればその場所を、別の地図ならそこへ向かう出口を指す。
  const WAY = {
    town: { forest: [12, 2], canal: [22, 9], hill: [1, 9], house: [3, 13], lake: [22, 12], lakeside: [22, 12], lampworkshop: [22, 12] },
    forest: { '*': [5, 14] },
    canal: { '*': [3, 13] },
    hill: { '*': [4, 14] },
    house: { '*': [12, 13] },
    herbvale: { '*': [2, 13] },
    oldpass: { '*': [2, 13] }
  };
  function goal(s) {
    const ep = s.episode,
      f = s.flags || {},
      at = (scene, x, y) => ({ scene, x, y });
    if (!ep || s.openingStage !== undefined) return null;
    if (root.OkaeriJourney?.active(s)) return root.OkaeriJourney.target?.(s) || null;
    if (ep.complete) return at('house', 11, 9);
    if (ep.chapter > 1) {
      const e = root.OkaeriEpisodes.current(s);
      return e ? at(e.scene, e.x, e.y) : null;
    }
    if (s.pendingEvening) return null;
    if (!f.board || f.lit) return at('town', 10, 8);
    return !f.mochi
      ? at('forest', 5, 11)
      : !f.log
        ? at('forest', 9, 9)
        : !f.repair
          ? at('forest', 12, 7)
          : !f.crab
            ? at('forest', 15, 4)
            : !f.guardian
              ? at('forest', 19, 4)
              : at('forest', 20, 2);
  }
  function guide(s) {
    const g = goal(s);
    if (!g) return null;
    if (g.scene === s.scene) return { x: g.x, y: g.y, via: null };
    const w = WAY[s.scene],
      p = w && (w[g.scene] || w['*'] || (s.scene === 'town' ? null : null));
    if (!p) return null;
    const exit = root.OkaeriStory.activeObjects(s).find(o => o.x === p[0] && o.y === p[1]);
    return { x: p[0], y: p[1], via: exit?.label || '出口' };
  }
  function setBase(a) {
    stage.time = a.time;
    stage.weather = a.weather;
  }
  function time() {
    return stage.over.time || stage.time;
  }
  function weather() {
    return stage.over.weather || stage.weather;
  }
  // 台詞のきっかけのうち、画面に関わるものを受け取る。音は game.js 側で鳴らす。
  function apply(cue, speaker) {
    if (!cue) return;
    const t = now(),
      calm = reduced();
    if (cue.time) stage.over.time = cue.time;
    if (cue.weather) stage.over.weather = cue.weather;
    if (cue.flood) stage.over.flood = true;
    if (cue.lit) stage.over.lit = true;
    if (cue.shake && !calm) stage.shake = { start: t, power: cue.shake === true ? 1 : cue.shake, ms: cue.shakeMs || 520 };
    if (cue.flash) stage.flash = { start: t, color: cue.flash === 'warm' ? '255,222,160' : '255,255,255', ms: calm ? 200 : 520 };
    if (cue.fade) fade(cue.fade, cue.fadeMs);
    if (cue.emote) {
      for (const [who, mark] of Object.entries(typeof cue.emote === 'string' ? { [speaker]: cue.emote } : cue.emote)) emote(who, mark);
    }
  }
  function fade(kind = 'black', ms) {
    const color = kind === 'white' ? '244,248,250' : kind === 'night' ? '12,20,40' : kind === 'warm' ? '60,34,20' : '6,14,20';
    stage.fade = {
      start: now(),
      color,
      hold: ms ? ms * 0.45 : kind === 'night' ? 700 : 260,
      out: ms ? ms * 0.55 : kind === 'night' ? 1100 : 520
    };
  }
  function emote(who, mark) {
    if (!MARKS[mark] || !who) return;
    stage.emotes = stage.emotes.filter(e => e.who !== who);
    stage.emotes.push({ who, mark, start: now() });
  }
  function clearOverrides() {
    stage.over = {};
  }

  // ---------------------------------------------------------------- 描画（world.js から呼ばれる）
  const W = 1152,
    H = 768;
  function pre(c, t) {
    const s = stage.shake;
    if (!s) return;
    const p = (t - s.start) / s.ms;
    if (p >= 1 || p < 0) {
      stage.shake = null;
      return;
    }
    const a = (1 - p) * 7 * s.power;
    c.translate(Math.sin(t * 0.09) * a, Math.cos(t * 0.13) * a * 0.7);
  }
  function lightsFor(s, fixed) {
    const out = [...fixed.map(([x, y, r]) => [x, y, r || 150, 1]), ...(root.OkaeriFieldArt?.lights(s) || [])],
      f = s.flags || {};
    for (const src of root.OkaeriStory.activeObjects(s)) {
      const o = src.base || src,
        x = o.x * 48 + 24,
        y = o.y * 48 + 24;
      if (o.type === 'homeStove') out.push([x - 8, y - 31, 330, 1.25]);
      else if (o.type === 'homeTable') out.push([x + 48, y - 47, 260, 1]);
      else if (o.type === 'lamp') out.push([x + 20, y - 16, 190, 1]);
      else if (o.type === 'tower' && (f.lit || stage.over.lit)) out.push([x, y - 47, 330, 1.2]);
      else if (o.type === 'hillBeacon' && ((f.hillLit && !(s.episode?.chapter === 8 && s.episode.step <= 3)) || stage.over.lit))
        out.push([x, y - 60, 340, 1.2]);
      else if (o.type === 'waterBeacon' && f.waterLit) out.push([x, y - 50, 240, 1]);
      else if (o.type === 'waitingLight' && f.waitingLit) out.push([x + 20, y - 16, 170, 1]);
      else if (o.type === 'repair' && f.repair) out.push([x + 53, y - 36, 170, 1]);
      else if (o.type === 'journeyProp' && o.kind === 'light') out.push([x, y - 40, 220, 1]);
    }
    return out;
  }
  function light(c, s, t, fixed = []) {
    const mode = time();
    if (mode === 'day') return;
    const festival = s.scene === 'town' && s.flags?.festivalStarted && (!s.episode || s.episode.chapter === 9);
    c.save();
    if (mode === 'morning') {
      const g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, 'rgba(255,226,170,.20)');
      g.addColorStop(0.6, 'rgba(255,236,200,.05)');
      g.addColorStop(1, 'rgba(150,190,220,.10)');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      c.restore();
      return;
    }
    const indoors = ['house', 'lampworkshop'].includes(s.scene);
    if (!festival) {
      c.globalCompositeOperation = 'multiply';
      if (mode === 'dusk') {
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#e9a37c');
        g.addColorStop(0.55, '#c79aa3');
        g.addColorStop(1, '#8a8fb8');
        c.fillStyle = g;
      } else c.fillStyle = indoors ? '#7a78a0' : '#5d6a9e';
      c.fillRect(0, 0, W, H);
    }
    c.globalCompositeOperation = 'screen';
    const strength = mode === 'dusk' ? 0.5 : 1,
      flick = 1 + Math.sin(t * 0.004) * 0.03 + Math.sin(t * 0.011) * 0.02;
    for (const [x, y, r, k] of lightsFor(s, fixed)) {
      const radius = r * (mode === 'dusk' ? 0.8 : 1.15) * flick,
        g = c.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, 'rgba(255,206,132,' + 0.62 * strength * Math.min(1, k) + ')');
      g.addColorStop(0.45, 'rgba(255,170,90,' + 0.26 * strength * k + ')');
      g.addColorStop(1, 'rgba(255,150,70,0)');
      c.fillStyle = g;
      c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    c.restore();
  }
  function weatherLayer(c, s, t) {
    if (weather() !== 'blizzard' || ['house', 'lampworkshop'].includes(s.scene)) return;
    const calm = reduced(),
      k = t * 0.001;
    c.save();
    c.fillStyle = 'rgba(226,236,242,' + (0.2 + Math.sin(k * 0.7) * 0.05) + ')';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,.62)';
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    c.beginPath();
    const n = calm ? 60 : 230;
    for (let i = 0; i < n; i++) {
      const speed = calm ? 60 : 520 + (i % 7) * 70,
        x = W - ((i * 97 + k * speed) % (W + 120)),
        y = ((i * 61 + k * speed * 0.42) % (H + 60)) - 30,
        len = 10 + (i % 5) * 5;
      c.moveTo(x, y);
      c.lineTo(x - len, y + len * 0.4);
    }
    c.stroke();
    const g = c.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(240,246,250,.34)');
    g.addColorStop(0.5, 'rgba(240,246,250,.06)');
    g.addColorStop(1, 'rgba(240,246,250,.28)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.restore();
  }
  function drawMark(c, name, x, y, size) {
    const m = MARKS[name];
    c.save();
    c.translate(x - size / 2, y - size / 2);
    c.scale(size / 24, size / 24);
    if (m.text) {
      c.fillStyle = m.color;
      c.font = '700 17px "Yu Gothic UI","Meiryo",sans-serif';
      c.textAlign = 'center';
      c.fillText(m.text, 12, 18);
    } else {
      const p = new Path2D(m.path);
      if (m.fill) {
        c.fillStyle = m.fill;
        c.fill(p);
      }
      if (m.stroke) {
        c.strokeStyle = m.stroke;
        c.lineWidth = 2.6;
        c.lineCap = 'round';
        c.stroke(p);
      }
    }
    c.restore();
  }
  // locate(who) は world.js が渡す。吹き出しを出す位置（頭上）を返す。
  function post(c, t, locate) {
    stage.emotes = stage.emotes.filter(e => t - e.start < 1900);
    for (const e of stage.emotes) {
      const at = locate(e.who);
      if (!at) continue;
      const p = (t - e.start) / 1900;
      const pop = p < 0.1 ? p / 0.1 : 1,
        alpha = p > 0.8 ? (1 - p) / 0.2 : 1,
        x = at.x + 16,
        y = at.y - 10 - Math.min(1, p * 6) * 6,
        r = 17 * (0.6 + 0.4 * pop);
      c.save();
      c.globalAlpha = Math.max(0, alpha);
      c.fillStyle = '#fffaf0';
      c.strokeStyle = '#8a7c66';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(x - 9, y + r - 4);
      c.lineTo(x - 13, y + r + 7);
      c.lineTo(x - 2, y + r - 2);
      c.closePath();
      c.fill();
      drawMark(c, e.mark, x, y, r * 1.35);
      c.restore();
    }
    const fl = stage.flash;
    if (fl) {
      const p = (t - fl.start) / fl.ms;
      if (p >= 1) stage.flash = null;
      else {
        c.fillStyle = 'rgba(' + fl.color + ',' + 0.75 * (1 - p) * (1 - p) + ')';
        c.fillRect(0, 0, W, H);
      }
    }
    const fd = stage.fade;
    if (fd) {
      const e = t - fd.start;
      if (e >= fd.hold + fd.out) stage.fade = null;
      else {
        const a = e < fd.hold ? 1 : 1 - (e - fd.hold) / fd.out;
        c.fillStyle = 'rgba(' + fd.color + ',' + a + ')';
        c.fillRect(0, 0, W, H);
      }
    }
  }

  // ---------------------------------------------------------------- 文字送り
  // 読点や句点で少し息をつく。台詞の「間」を、文字の出方で作る。
  function charCost(ch, slow = 1) {
    const base =
      ch === '\n' ? 190 : '。！？'.includes(ch) ? 240 : '、'.includes(ch) ? 130 : '…―—'.includes(ch) ? 150 : '　 '.includes(ch) ? 60 : 30;
    return base * slow;
  }
  const speakerIds = { コハル: 'koharu', サエ: 'sae', マロ: 'bakery', エルナ: 'elna', オルフ: 'orlf', リツ: 'ritsu', ユラ: 'yura' };
  root.OkaeriDirector = {
    goal,
    guide,
    companion,
    MOODS,
    MARKS,
    markSvg,
    normalize,
    mood,
    stage,
    ambient,
    setBase,
    time,
    weather,
    apply,
    fade,
    emote,
    clearOverrides,
    pre,
    light,
    weatherLayer,
    post,
    charCost,
    reduced,
    speakerIds,
    now
  };
  if (typeof module !== 'undefined') module.exports = root.OkaeriDirector;
})(typeof globalThis !== 'undefined' ? globalThis : this);
