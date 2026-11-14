(function (root) {
  'use strict';
  // 効果音と環境音。録音素材は使わず、すべて WebAudio で合成する。
  // 音がOFFの間、AudioContext を持たない環境（テスト）では何もしない。
  let ctx = null,
    master = null,
    enabled = false,
    noiseBuffer = null,
    ambience = null,
    ambienceName = null,
    stepFlip = false,
    wanted = null;
  function ready() {
    if (!enabled) return false;
    try {
      if (!ctx) {
        const A = root.AudioContext || root.webkitAudioContext;
        if (!A) return false;
        ctx = new A();
        master = ctx.createGain();
        master.gain.value = 0.9;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    } catch {
      return false;
    }
  }
  function noise() {
    if (noiseBuffer) return noiseBuffer;
    const n = ctx.sampleRate * 2,
      b = ctx.createBuffer(1, n, ctx.sampleRate),
      d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = w * 0.55 + last * 14;
    }
    return (noiseBuffer = b);
  }
  function env(g, t, attack, peak, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  function tone(freq, { type = 'sine', at = 0, attack = 0.01, decay = 0.2, peak = 0.08, slide = 0, out = master } = {}) {
    const t = ctx.currentTime + at,
      o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + attack + decay);
    env(g, t, attack, peak, decay);
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + attack + decay + 0.05);
  }
  function burst({ at = 0, attack = 0.005, decay = 0.12, peak = 0.1, type = 'bandpass', freq = 1200, q = 1, slide = 0 } = {}) {
    const t = ctx.currentTime + at,
      src = ctx.createBufferSource(),
      f = ctx.createBiquadFilter(),
      g = ctx.createGain();
    src.buffer = noise();
    src.loop = true;
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    f.Q.value = q;
    if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + attack + decay);
    env(g, t, attack, peak, decay);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t, Math.random() * 1.5);
    src.stop(t + attack + decay + 0.05);
  }
  const bell = (freq, peak = 0.07, at = 0, decay = 1.4) => {
    for (const [m, a] of [
      [1, 1],
      [2.01, 0.5],
      [2.99, 0.28],
      [4.2, 0.12]
    ])
      tone(freq * m, { at, attack: 0.004, decay: decay / m, peak: peak * a });
  };
  const sounds = {
    // 文字送り。話す人で高さを変える。
    blipTouma() {
      tone(196 + Math.random() * 10, { type: 'triangle', decay: 0.045, peak: 0.035 });
    },
    blipNina() {
      tone(330 + Math.random() * 16, { type: 'triangle', decay: 0.04, peak: 0.03 });
    },
    blipOther() {
      tone(262 + Math.random() * 12, { type: 'triangle', decay: 0.045, peak: 0.028 });
    },
    confirm() {
      tone(660, { decay: 0.09, peak: 0.05 });
      tone(990, { at: 0.06, decay: 0.14, peak: 0.045 });
    },
    cancel() {
      tone(440, { decay: 0.1, peak: 0.045, slide: 0.7 });
    },
    swap() {
      tone(392, { type: 'triangle', decay: 0.08, peak: 0.05 });
      tone(523, { type: 'triangle', at: 0.07, decay: 0.12, peak: 0.05 });
    },
    step() {
      stepFlip = !stepFlip;
      burst({ decay: 0.09, peak: 0.035, freq: stepFlip ? 900 : 700, q: 0.7, slide: 0.5 });
    },
    stepWood() {
      stepFlip = !stepFlip;
      tone(stepFlip ? 120 : 105, { type: 'triangle', decay: 0.06, peak: 0.05, slide: 0.6 });
      burst({ decay: 0.03, peak: 0.012, freq: 2400 });
    },
    door() {
      tone(92, { type: 'triangle', decay: 0.16, peak: 0.11, slide: 0.6 });
      burst({ decay: 0.07, peak: 0.04, freq: 500, q: 0.5 });
      tone(80, { type: 'triangle', at: 0.22, decay: 0.14, peak: 0.07, slide: 0.6 });
    },
    knock() {
      for (const at of [0, 0.16]) tone(170, { type: 'triangle', at, decay: 0.07, peak: 0.09, slide: 0.7 });
    },
    chime() {
      bell(880, 0.06);
      bell(1318.5, 0.045, 0.18);
      bell(1760, 0.035, 0.36, 1.8);
    },
    lit() {
      burst({ decay: 0.5, peak: 0.04, type: 'highpass', freq: 2500 });
      bell(659.3, 0.06, 0.05);
      bell(987.8, 0.05, 0.22);
      bell(1318.5, 0.045, 0.4, 2.2);
    },
    bell() {
      bell(523.3, 0.08, 0, 2.2);
    },
    sparkle() {
      for (let i = 0; i < 5; i++) tone(1400 + Math.random() * 1600, { at: i * 0.06, decay: 0.18, peak: 0.028 });
    },
    pop() {
      tone(520, { decay: 0.07, peak: 0.06, slide: 1.6 });
    },
    item() {
      for (const [f, at] of [
        [523.3, 0],
        [659.3, 0.09],
        [784, 0.18],
        [1046.5, 0.27]
      ])
        tone(f, { type: 'triangle', at, decay: 0.22, peak: 0.05 });
    },
    page() {
      burst({ decay: 0.16, peak: 0.05, type: 'highpass', freq: 3000, slide: 1.6 });
      burst({ at: 0.12, decay: 0.1, peak: 0.03, type: 'highpass', freq: 4200 });
    },
    cup() {
      tone(1960, { decay: 0.25, peak: 0.03 });
      tone(2940, { decay: 0.18, peak: 0.016 });
    },
    fire() {
      for (let i = 0; i < 4; i++)
        burst({ at: Math.random() * 0.5, decay: 0.025, peak: 0.07, type: 'highpass', freq: 1800 + Math.random() * 2500 });
    },
    heart() {
      tone(64, { decay: 0.12, peak: 0.16, slide: 0.7 });
      tone(58, { at: 0.2, decay: 0.14, peak: 0.11, slide: 0.7 });
    },
    thud() {
      tone(70, { type: 'triangle', decay: 0.22, peak: 0.2, slide: 0.5 });
      burst({ decay: 0.1, peak: 0.06, freq: 300, q: 0.4 });
    },
    crack() {
      burst({ decay: 0.05, peak: 0.16, type: 'highpass', freq: 3200 });
      burst({ at: 0.04, decay: 0.3, peak: 0.09, freq: 1400, q: 2, slide: 0.3 });
      tone(90, { type: 'triangle', at: 0.02, decay: 0.3, peak: 0.14, slide: 0.5 });
    },
    rush() {
      burst({ attack: 0.5, decay: 1.6, peak: 0.14, type: 'lowpass', freq: 500, slide: 3 });
      burst({ attack: 0.3, decay: 1.2, peak: 0.05, type: 'highpass', freq: 2600 });
    },
    splash() {
      burst({ decay: 0.5, peak: 0.11, type: 'bandpass', freq: 1800, q: 0.6, slide: 0.3 });
    },
    gust() {
      burst({ attack: 0.6, decay: 1.4, peak: 0.09, type: 'bandpass', freq: 500, q: 1.2, slide: 1.8 });
    },
    whistle() {
      for (const at of [0, 0.42]) {
        const t = ctx.currentTime + at,
          o = ctx.createOscillator(),
          g = ctx.createGain(),
          l = ctx.createOscillator(),
          lg = ctx.createGain();
        o.frequency.value = 2090;
        l.frequency.value = 28;
        lg.gain.value = 45;
        l.connect(lg);
        lg.connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.07, t + 0.03);
        g.gain.setValueAtTime(0.07, t + 0.24);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        o.connect(g);
        g.connect(master);
        o.start(t);
        l.start(t);
        o.stop(t + 0.36);
        l.stop(t + 0.36);
        burst({ at, decay: 0.3, peak: 0.012, type: 'highpass', freq: 5000 });
      }
    },
    flare() {
      burst({ attack: 0.05, decay: 0.5, peak: 0.08, type: 'bandpass', freq: 900, q: 0.8, slide: 2.4 });
      tone(440, { at: 0.05, decay: 0.5, peak: 0.03, slide: 1.5 });
    },
    sew() {
      burst({ decay: 0.05, peak: 0.025, type: 'highpass', freq: 5200 });
    },
    hit() {
      burst({ decay: 0.09, peak: 0.12, freq: 1100, q: 0.6, slide: 0.4 });
      tone(150, { type: 'triangle', decay: 0.1, peak: 0.09, slide: 0.5 });
    },
    cheer() {
      for (let i = 0; i < 7; i++)
        tone(700 + Math.random() * 900, { type: 'triangle', at: i * 0.05 + Math.random() * 0.04, decay: 0.16, peak: 0.022 });
    },
    // ---- 戦闘の効果音 ----
    cursor() {
      tone(840, { type: 'triangle', attack: 0.003, decay: 0.04, peak: 0.028 });
    },
    encounter() {
      burst({ attack: 0.02, decay: 0.34, peak: 0.09, type: 'bandpass', freq: 620, q: 1.1, slide: 2.6 });
      tone(293.7, { type: 'triangle', decay: 0.16, peak: 0.07 });
      tone(440, { type: 'triangle', at: 0.09, decay: 0.24, peak: 0.075 });
    },
    swing() {
      burst({ attack: 0.008, decay: 0.14, peak: 0.075, type: 'bandpass', freq: 2100, q: 0.9, slide: 0.32 });
      tone(320, { type: 'sine', decay: 0.1, peak: 0.035, slide: 0.45 });
    },
    slash() {
      burst({ attack: 0.003, decay: 0.085, peak: 0.14, type: 'highpass', freq: 2400, slide: 0.45 });
      tone(1280, { type: 'sawtooth', attack: 0.003, decay: 0.09, peak: 0.045, slide: 0.42 });
      tone(138, { type: 'triangle', at: 0.012, decay: 0.14, peak: 0.14, slide: 0.46 });
    },
    heavySlash() {
      burst({ attack: 0.003, decay: 0.12, peak: 0.16, type: 'bandpass', freq: 1900, q: 0.7, slide: 0.35 });
      tone(1560, { type: 'sawtooth', attack: 0.003, decay: 0.13, peak: 0.055, slide: 0.38 });
      tone(98, { type: 'triangle', at: 0.01, decay: 0.22, peak: 0.19, slide: 0.42 });
      bell(880, 0.035, 0.02, 0.6);
    },
    cast() {
      burst({ attack: 0.03, decay: 0.28, peak: 0.038, type: 'highpass', freq: 3200 });
      for (const [f, at] of [
        [523.3, 0],
        [659.3, 0.06],
        [784, 0.12]
      ])
        tone(f, { type: 'sine', at, attack: 0.012, decay: 0.2, peak: 0.042 });
    },
    fireHit() {
      burst({ attack: 0.008, decay: 0.28, peak: 0.13, type: 'bandpass', freq: 1150, q: 0.75, slide: 2.1 });
      for (let i = 0; i < 3; i++)
        burst({ at: 0.03 + i * 0.055, decay: 0.05, peak: 0.08, type: 'highpass', freq: 2600 + i * 500 });
      tone(240, { type: 'triangle', decay: 0.18, peak: 0.11, slide: 0.48 });
    },
    ringHit() {
      burst({ attack: 0.015, decay: 0.32, peak: 0.065, type: 'bandpass', freq: 1600, q: 1.1, slide: 1.8 });
      bell(587.3, 0.055, 0, 0.9);
      bell(880, 0.048, 0.07, 1.1);
    },
    teamCharge() {
      burst({ attack: 0.04, decay: 0.45, peak: 0.07, type: 'bandpass', freq: 850, q: 0.9, slide: 2.5 });
      for (const [f, at] of [
        [392, 0],
        [523.3, 0.08],
        [659.3, 0.16],
        [784, 0.24]
      ])
        tone(f, { type: 'triangle', at, attack: 0.01, decay: 0.26, peak: 0.055 });
    },
    teamSlash() {
      burst({ attack: 0.004, decay: 0.36, peak: 0.17, type: 'bandpass', freq: 1450, q: 0.65, slide: 1.9 });
      tone(1760, { type: 'sawtooth', attack: 0.003, decay: 0.16, peak: 0.06, slide: 0.4 });
      tone(88, { type: 'triangle', at: 0.01, decay: 0.28, peak: 0.2, slide: 0.45 });
      bell(659.3, 0.06, 0.03, 1.4);
      bell(987.8, 0.05, 0.1, 1.6);
      bell(1318.5, 0.045, 0.18, 1.8);
    },
    heal() {
      burst({ attack: 0.02, decay: 0.26, peak: 0.03, type: 'highpass', freq: 3600 });
      for (const [f, at] of [
        [523.3, 0],
        [659.3, 0.07],
        [784, 0.14],
        [1046.5, 0.22]
      ])
        bell(f, 0.045, at, 0.95);
    },
    guard() {
      tone(520, { type: 'triangle', attack: 0.003, decay: 0.09, peak: 0.065 });
      tone(780, { type: 'sine', at: 0.025, attack: 0.003, decay: 0.11, peak: 0.045 });
      tone(165, { type: 'triangle', decay: 0.11, peak: 0.08, slide: 0.75 });
    },
    enemyHit() {
      burst({ attack: 0.004, decay: 0.14, peak: 0.14, type: 'bandpass', freq: 880, q: 0.65, slide: 0.38 });
      tone(118, { type: 'triangle', attack: 0.004, decay: 0.19, peak: 0.17, slide: 0.44 });
    },
    coverHit() {
      tone(640, { type: 'triangle', attack: 0.003, decay: 0.1, peak: 0.075 });
      tone(960, { type: 'sine', at: 0.02, attack: 0.003, decay: 0.12, peak: 0.05 });
      burst({ attack: 0.004, decay: 0.1, peak: 0.09, type: 'bandpass', freq: 1200, q: 0.8, slide: 0.5 });
      tone(135, { type: 'triangle', decay: 0.14, peak: 0.11, slide: 0.55 });
    },
    iceBreak() {
      burst({ attack: 0.003, decay: 0.09, peak: 0.13, type: 'highpass', freq: 3400 });
      for (const [f, at] of [
        [2093, 0],
        [2637, 0.045],
        [3136, 0.09],
        [1760, 0.13]
      ])
        tone(f, { type: 'sine', at, attack: 0.002, decay: 0.14, peak: 0.045 });
    },
    bondLamp() {
      bell(659.3, 0.055, 0, 1.2);
      bell(987.8, 0.05, 0.1, 1.5);
    },
    victory() {
      for (const [f, at, d] of [
        [523.3, 0, 0.9],
        [659.3, 0.1, 1.0],
        [784, 0.2, 1.1],
        [1046.5, 0.32, 1.8]
      ])
        bell(f, 0.06, at, d);
    },
    defeat() {
      for (const [f, at] of [
        [392, 0],
        [349.2, 0.18],
        [293.7, 0.36]
      ])
        tone(f, { type: 'triangle', at, attack: 0.015, decay: 0.36, peak: 0.06, slide: 0.96 });
    }
  };
  // 環境音: [フィルタ種別, 周波数, Q, 音量, ゆらぎの速さ, ゆらぎの深さ]
  const beds = {
    hearth: [
      ['lowpass', 420, 0.4, 0.05, 0.31, 0.4],
      ['bandpass', 2600, 3, 0.006, 0.9, 0.9]
    ],
    wind: [
      ['bandpass', 420, 0.9, 0.045, 0.13, 0.7],
      ['bandpass', 900, 1.4, 0.012, 0.21, 0.9]
    ],
    blizzard: [
      ['bandpass', 520, 0.8, 0.13, 0.22, 0.6],
      ['bandpass', 1500, 1.2, 0.05, 0.37, 0.8],
      ['lowpass', 160, 0.5, 0.09, 0.09, 0.5]
    ],
    water: [
      ['bandpass', 1300, 0.7, 0.045, 0.5, 0.3],
      ['lowpass', 300, 0.4, 0.04, 0.2, 0.4]
    ],
    flood: [
      ['bandpass', 900, 0.5, 0.13, 0.7, 0.4],
      ['lowpass', 260, 0.5, 0.12, 0.3, 0.5]
    ],
    night: [['bandpass', 300, 0.8, 0.022, 0.08, 0.8]],
    crowd: [
      ['bandpass', 700, 0.9, 0.03, 0.6, 0.6],
      ['bandpass', 1500, 1.5, 0.014, 1.1, 0.8]
    ]
  };
  function stopAmbience(fade = 0.8) {
    if (!ambience) return;
    const a = ambience;
    ambience = null;
    ambienceName = null;
    try {
      a.gain.gain.cancelScheduledValues(ctx.currentTime);
      a.gain.gain.setValueAtTime(a.gain.gain.value, ctx.currentTime);
      a.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + fade);
    } catch {}
    clearInterval(a.timer);
    setTimeout(
      () => {
        for (const n of a.nodes)
          try {
            n.stop();
          } catch {}
      },
      fade * 1000 + 80
    );
  }
  function ambient(name) {
    wanted = name && beds[name] ? name : null;
    if (!enabled || !ready() || wanted === ambienceName) return;
    stopAmbience();
    if (!wanted) return;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
    gain.connect(master);
    const nodes = [];
    for (const [type, freq, q, level, rate, depth] of beds[wanted]) {
      const src = ctx.createBufferSource(),
        f = ctx.createBiquadFilter(),
        g = ctx.createGain(),
        l = ctx.createOscillator(),
        lg = ctx.createGain();
      src.buffer = noise();
      src.loop = true;
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      g.gain.value = level;
      l.frequency.value = rate;
      lg.gain.value = level * depth;
      l.connect(lg);
      lg.connect(g.gain);
      src.connect(f);
      f.connect(g);
      g.connect(gain);
      src.start(0, Math.random() * 1.5);
      l.start();
      nodes.push(src, l);
    }
    const timer =
      wanted === 'hearth'
        ? setInterval(() => {
            if (enabled && Math.random() < 0.6) sounds.fire();
          }, 1700)
        : null;
    ambience = { gain, nodes, timer };
    ambienceName = wanted;
  }
  const api = {
    get enabled() {
      return enabled;
    },
    enable(on) {
      enabled = !!on;
      if (!enabled) {
        if (ctx) {
          stopAmbience(0.2);
          try {
            ctx.suspend();
          } catch {}
        }
        return;
      }
      if (ready()) ambient(wanted);
    },
    play(name) {
      if (!sounds[name] || !ready()) return;
      try {
        sounds[name]();
      } catch {}
    },
    ambient,
    names: Object.keys(sounds),
    beds: Object.keys(beds)
  };
  root.OkaeriSfx = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
