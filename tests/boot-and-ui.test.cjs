'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function createBrowserSandbox() {
  const els = {};
  function makeEl(id) {
    const children = [];
    const el = {
      id,
      hidden: [
        'still',
        'hud',
        'continueButton',
        'openingFilm',
        'filmTitle',
        'chapterCard',
        'dialogue',
        'portraitMark',
        'battleScreen',
        'modal',
        'toast',
        'interactPrompt'
      ].includes(id),
      disabled: false,
      textContent: id === 'soundButton' ? '音 OFF' : '',
      innerHTML: '',
      title: '',
      style: { setProperty() {} },
      classList: {
        _set: new Set(),
        add(...cs) {
          cs.forEach(c => this._set.add(c));
        },
        remove(...cs) {
          cs.forEach(c => this._set.delete(c));
        },
        toggle(c, force) {
          if (force === undefined) {
            if (this._set.has(c)) this._set.delete(c);
            else this._set.add(c);
          } else if (force) this._set.add(c);
          else this._set.delete(c);
        },
        contains(c) {
          return this._set.has(c);
        }
      },
      dataset: {},
      children,
      parentElement: null,
      appendChild(child) {
        if (child && typeof child === 'object') child.parentElement = el;
        children.push(child);
        return child;
      },
      append(...nodes) {
        nodes.forEach(n => el.appendChild(n));
      },
      remove() {},
      focus() {},
      replaceChildren(...nodes) {
        children.length = 0;
        nodes.forEach(n => el.appendChild(n));
      },
      addEventListener() {},
      setAttribute() {},
      getAttribute() {
        return null;
      },
      querySelector() {
        return makeEl('sub');
      },
      querySelectorAll() {
        return [];
      },
      getContext() {
        return new Proxy(
          { canvas: { width: 1152, height: 768 } },
          {
            get(t, k) {
              if (k in t) return t[k];
              if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
              if (k === 'measureText') return () => ({ width: 10 });
              return () => {};
            }
          }
        );
      },
      getBoundingClientRect() {
        return { left: 0, top: 0, width: 1152, height: 768 };
      }
    };
    return el;
  }
  const getEl = id => (els[id] ||= makeEl(id));
  getEl('modal').appendChild(getEl('modalCard'));
  getEl('modalCard').appendChild(getEl('modalContent'));

  const store = new Map();
  const ctx = vm.createContext({
    console,
    setTimeout: () => 1,
    clearTimeout() {},
    setInterval: () => 1,
    clearInterval() {},
    requestAnimationFrame() {},
    cancelAnimationFrame() {},
    performance: { now: () => 1000 },
    localStorage: {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k)
    },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    Audio: class {
      constructor(src) {
        this.src = src;
        this.volume = 0;
        this.paused = true;
        this.loop = false;
        this.currentTime = 0;
        this.duration = 60;
      }
      play() {
        this.paused = false;
        return Promise.resolve();
      }
      pause() {
        this.paused = true;
      }
    },
    AudioContext: class {
      constructor() {
        this.state = 'running';
        this.sampleRate = 44100;
        this.currentTime = 0;
        this.destination = {};
      }
      resume() {
        this.state = 'running';
        return Promise.resolve();
      }
      suspend() {
        this.state = 'suspended';
        return Promise.resolve();
      }
      createGain() {
        return {
          gain: {
            value: 1,
            setValueAtTime() {},
            exponentialRampToValueAtTime() {},
            linearRampToValueAtTime() {},
            cancelScheduledValues() {}
          },
          connect() {}
        };
      }
      createOscillator() {
        return {
          type: 'sine',
          frequency: { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect() {},
          start() {},
          stop() {}
        };
      }
      createBiquadFilter() {
        return {
          type: 'lowpass',
          frequency: { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          Q: { value: 1 },
          connect() {}
        };
      }
      createBuffer(_ch, len) {
        return { getChannelData: () => new Float32Array(len) };
      }
      createBufferSource() {
        return { buffer: null, loop: false, connect() {}, start() {}, stop() {} };
      }
    },
    Image: class {
      set src(_) {
        if (this.onload) this.onload();
      }
    },
    document: {
      getElementById: getEl,
      createElement: tag => makeEl(tag),
      querySelector: () => makeEl('q'),
      querySelectorAll: () => [],
      addEventListener() {},
      body: makeEl('body'),
      documentElement: makeEl('html')
    },
    navigator: {}
  });
  ctx.window = ctx;
  ctx.globalThis = ctx;
  ctx.addEventListener = () => {};
  return { ctx, els };
}

test('index.html boot sequence loads all 33 scripts cleanly and wires title & sound buttons', async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  assert.ok(srcs.length >= 30, 'expected all game scripts in index.html');

  const { ctx, els } = createBrowserSandbox();
  for (const rel of srcs) {
    const full = path.join(ROOT, rel);
    assert.ok(fs.existsSync(full), `missing script file: ${rel}`);
    vm.runInContext(fs.readFileSync(full, 'utf8'), ctx, { filename: rel });
  }

  // Verify every interactive button has its click handler attached
  for (const id of ['soundButton', 'startButton', 'chapterButton', 'galleryButton', 'mapButton', 'menuButton', 'journalButton']) {
    assert.equal(typeof els[id]?.onclick, 'function', `${id}.onclick should be attached`);
  }

  // Sound toggle ON -> OFF
  assert.equal(els.soundButton.textContent, '音 OFF');
  await els.soundButton.onclick();
  assert.equal(els.soundButton.textContent, '音 ON');
  assert.equal(els.soundButton.disabled, false);
  await els.soundButton.onclick();
  assert.equal(els.soundButton.textContent, '音 OFF');

  // Chapter select opens modal cleanly
  els.chapterButton.onclick();
  assert.equal(els.modal.hidden, false);
  assert.match(els.modalContent.innerHTML, /章を選ぶ/);

  // Gallery opens modal cleanly
  els.galleryButton.onclick();
  assert.equal(els.modal.hidden, false);

  // Start button transitions out of title screen cleanly
  els.modal.hidden = true;
  els.startButton.onclick();
  assert.equal(els.titleScreen.hidden, true);
});

test('character placements, combat motion effects, and scenario invariants hold across episodes', () => {
  const { ctx } = createBrowserSandbox();
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const rel of [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1])) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
  }
  const C = ctx.OkaeriCore,
    S = ctx.OkaeriStory,
    E = ctx.OkaeriEpisodes,
    ED = ctx.OkaeriEpisodesData,
    D = ctx.OkaeriDirector,
    B = ctx.OkaeriBattle;

  // 1. Basic skill physics: Touma uses 峰打ち (blunt edge), Nina casts 種火を放つ (fire style, ranged spell)
  assert.equal(C.actions('touma')[0].name, '峰打ち');
  assert.equal(C.actions('nina')[0].name, '種火を放つ');
  const mochiOut = C.resolveTurn(C.newBattle('mochi'), { touma: { skill: 'attack', target: 0 }, nina: { skill: 'attack', target: 1 } }, ['touma', 'nina']);
  const ninaBeat = B.buildBeats(mochiOut).find(b => b.actor === 'nina');
  assert.equal(ninaBeat.kind, 'spell', 'Nina casts ranged ember instead of melee bludgeoning');

  const plain = v => JSON.parse(JSON.stringify(v));
  // 2. Opening Stage 1 places Sae and Maro right beside board (10,8)
  const op1Objs = S.activeObjects({ version: 1, scene: 'town', x: 10, y: 9, lead: 'touma', openingStage: 1, flags: {} });
  assert.deepEqual(
    plain(op1Objs.filter(o => ['sae', 'bakery'].includes(o.id)).map(o => [o.id, o.x, o.y])),
    [
      ['sae', 11, 8],
      ['bakery', 9, 8]
    ]
  );

  // 3. Prologues 8 & 9 seat the trio at the dining table (breakfast: true)
  assert.equal(ED.prologues[8][0].lines[0][2].breakfast, true);
  assert.equal(ED.prologues[9][0].lines[0][2].breakfast, true);

  // 4. Ep.3 flood places Koharu on the bank and faces Nina left / Touma right
  const s3 = E.create(3);
  s3.scene = 'canal';
  s3.episode.step = 1;
  const c3 = S.activeObjects(s3);
  assert.ok(c3.some(o => o.id === 'koharu' && o.x === 6 && o.y === 9));
  assert.ok(c3.some(o => o.id === 'nina' && o.dir === 'left'));
  s3.episode.step = 2;
  assert.ok(S.activeObjects(s3).some(o => o.id === 'touma' && o.dir === 'right'));

  // 5. Ep.9 Step 1 places Koharu as an interactable NPC beside Elna's stall (8,11)
  const s9 = E.create(9);
  s9.scene = 'town';
  s9.episode.step = 1;
  assert.equal(D.companion(s9), false);
  assert.ok(S.activeObjects(s9).some(o => o.id === 'koharu' && o.x === 8 && o.y === 11));

  // 6. Ep.10 Step 0 spawns waiting Nina at her station in the house
  const s10n = E.create(10, 'nina');
  assert.ok(S.activeObjects(s10n).some(o => o.id === 'nina' && o.x === 17 && o.y === 10));

  // 7. Battle SFX & motion beats: buffLamp, revive, boss AoE roar + frostHit
  const buffOut = C.resolveTurn(C.newBattle('guardian'), { touma: { skill: 'guard' }, nina: { skill: 'buff' } }, ['touma', 'nina']);
  const buffBeat = B.buildBeats(buffOut).find(b => b.actor === 'nina');
  assert.deepEqual(plain(B.beatSounds(buffBeat, C.newBattle('guardian'), {})), { start: ['cast'], impact: ['buffLamp'] });

  const boss = C.newBattle('alphaBeast');
  boss.turn = 2; // phase 1: 吹雪の咆哮 (target: 'all', chill: true)
  const bossOut = C.resolveTurn(boss, { touma: { skill: 'guard' }, nina: { skill: 'guard' } }, ['touma', 'nina']);
  const roarBeat = B.buildBeats(bossOut).find(b => b.actor === 'enemy:0');
  assert.deepEqual(plain(B.beatSounds(roarBeat, boss, { touma: 'guard', nina: 'guard' })), {
    start: ['roar'],
    impact: ['coverHit', 'frostHit']
  });

  const down = C.newBattle('mochi', { support: 'koharu' });
  down.heroes.nina.hp = 0;
  const revOut = C.resolveTurn(down, { touma: { skill: 'guard' }, koharu: { skill: 'rouse', target: 'nina' } }, ['touma', 'nina', 'koharu']);
  const revBeat = B.buildBeats(revOut).find(b => b.actor === 'koharu');
  assert.deepEqual(plain(B.beatSounds(revBeat, down, {})), { start: ['cast'], impact: ['revive'] });
});

test('OP Koharu continuity, late-game Nina/Koharu past episodes, and modern UI operability features work', () => {
  const listeners = {};
  const { ctx, els } = createBrowserSandbox();
  ctx.document.getElementById('dialogue').addEventListener = (ev, fn) => ((listeners['dialogue:' + ev] ||= []).push(fn));
  ctx.document.getElementById('modal').addEventListener = (ev, fn) => ((listeners['modal:' + ev] ||= []).push(fn));
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const rel of [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1])) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
  }
  const S = ctx.OkaeriStory,
    ED = ctx.OkaeriEpisodesData;

  // 1. Opening continuity: Koharu reacts to '二人きり' inside the house (opening[0]) and does NOT repeat '二人きりで！？' outside in opening[1]
  const op0Koharu = S.opening[0].lines.filter(l => l[0] === 'コハル').map(l => l[1]).join('\n');
  const op1Koharu = S.opening[1].lines.filter(l => l[0] === 'コハル').map(l => l[1]).join('\n');
  assert.match(op0Koharu, /二人きり/);
  assert.doesNotMatch(op1Koharu, /二人きりで！？|二人で！？/);

  // 2. Late-game heartwarming past episodes for Nina & Koharu exist in built episodes-data.js
  const ep8Text = ED.episodes[8].flatMap(ev => ev.lines.map(l => l[1])).join('\n');
  assert.match(ep8Text, /よもぎと生姜/, 'Ep.8 includes Koharu childhood poultice memory');
  assert.match(ep8Text, /別々に引き取られたばかりだった夜/, 'Ep.8 includes Nina childhood midnight square memory');
  const koharuConfText = ED.confessions.koharu.map(l => l[1]).join('\n');
  assert.match(koharuConfText, /軟膏の壺を落として/, 'Ep.9 Koharu confession includes childhood bulletin-board memory');
  assert.match(ED.routes.touma.flatMap(ev => ev.lines.map(l => l[1])).join('\n'), /袖口をぎゅって/);
  assert.match(ED.routes.nina.flatMap(ev => ev.lines.map(l => l[1])).join('\n'), /毛糸のミトン/);
  assert.match(ED.routes.koharuLove.flatMap(ev => ev.lines.map(l => l[1])).join('\n'), /頑張りだこ/);

  // 3. Modern UI buttons & operability: start game, skip OP, advance via dialogue body click, toggle auto, inspect backlog & close via X/backdrop
  for (const id of ['craftButton', 'objectiveBox', 'backlogButton', 'autoReadButton']) {
    assert.equal(typeof els[id]?.onclick, 'function', `${id}.onclick should be wired`);
  }
  els.startButton.onclick();
  els.skipOpening.onclick();
  assert.equal(els.dialogue.hidden, false);
  const firstText = els.dialogueText.textContent;

  // Click-anywhere on #dialogue body advances to line 2
  listeners['dialogue:click'][0]({ target: { closest: () => null } });
  const secondText = els.dialogueText.textContent;
  assert.notEqual(secondText, firstText, 'clicking dialogue panel body advances line');

  // Auto-read toggle updates state & visual class
  els.autoReadButton.onclick({});
  assert.equal(els.autoReadButton.classList.contains('is-on'), true);
  els.autoReadButton.onclick({});
  assert.equal(els.autoReadButton.classList.contains('is-on'), false);

  // Backlog opens mid-dialogue with spoken lines and returns cleanly to dialogue when backdrop is clicked
  els.backlogButton.onclick({});
  assert.equal(els.modal.hidden, false);
  assert.match(els.modalContent.innerHTML, /会話ログ/);
  assert.ok(els.modalContent.innerHTML.includes(firstText.slice(0, 12)));
  listeners['modal:click'][0]({ target: els.modal });
  assert.equal(els.modal.hidden, true);
  assert.equal(els.dialogue.hidden, false);
  assert.equal(els.dialogueText.textContent, secondText, 'closing backlog preserves current dialogue line');
});

