const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const Core = require('../core.js');
const { buildBeats, beatSounds } = require('../battle-ui.js');

const turn = (b, t, n) => Core.resolveTurn(b, { touma: t, nina: n }, ['touma', 'nina']);

test('WebAudio battle sound synthesizer runs every battle cue cleanly without throwing', () => {
  const created = { osc: 0, buf: 0 };
  class MockParam {
    constructor() {
      this.value = 0;
    }
    setValueAtTime() {}
    exponentialRampToValueAtTime() {}
    linearRampToValueAtTime() {}
    cancelScheduledValues() {}
  }
  class MockNode {
    connect() {}
    start() {}
    stop() {}
  }
  class MockAudioContext {
    constructor() {
      this.currentTime = 1.0;
      this.sampleRate = 8000;
      this.state = 'running';
      this.destination = {};
    }
    resume() {}
    suspend() {}
    createGain() {
      return Object.assign(new MockNode(), { gain: new MockParam() });
    }
    createOscillator() {
      created.osc++;
      return Object.assign(new MockNode(), { type: 'sine', frequency: new MockParam() });
    }
    createBiquadFilter() {
      return Object.assign(new MockNode(), { type: 'bandpass', frequency: new MockParam(), Q: new MockParam() });
    }
    createBuffer(_ch, len) {
      const arr = new Float32Array(len);
      return { getChannelData: () => arr };
    }
    createBufferSource() {
      created.buf++;
      return Object.assign(new MockNode(), { buffer: null, loop: false });
    }
  }
  const ctx = vm.createContext({ AudioContext: MockAudioContext, Math, Object, Float32Array, setTimeout: () => 0, setInterval: () => 0, clearInterval() {} });
  vm.runInContext(fs.readFileSync(require.resolve('../sfx.js'), 'utf8'), ctx);
  const Sfx = ctx.OkaeriSfx;
  Sfx.enable(true);

  const battleCues = [
    'cursor',
    'encounter',
    'swing',
    'slash',
    'heavySlash',
    'cast',
    'fireHit',
    'ringHit',
    'teamCharge',
    'teamSlash',
    'heal',
    'guard',
    'enemyHit',
    'coverHit',
    'iceBreak',
    'bondLamp',
    'victory',
    'defeat'
  ];
  for (const cue of battleCues) {
    assert.ok(Sfx.names.includes(cue), 'missing sound cue: ' + cue);
    const before = created.osc + created.buf;
    Sfx.play(cue);
    assert.ok(created.osc + created.buf > before, cue + ' should schedule WebAudio nodes');
  }
});

test('beatSounds maps normal slash, heavy break/buff slash, fire + ice shatter, ring, heal, guard/cover, and team flare to distinct SFX', () => {
  // 1. Protect cover (turn 2 targets Nina) + Fire melting ice shell + bond lamp
  const crab = Core.newBattle('crab');
  crab.turn = 2;
  const r1 = turn(crab, { skill: 'protect' }, { skill: 'fire', target: 0 });
  const beats1 = buildBeats(r1);
  const guardBeat = beats1.find(b => b.actor === 'touma');
  const fireBeat = beats1.find(b => b.actor === 'nina');
  const enemyBeat = beats1.find(b => b.actor === 'enemy:0');

  assert.deepEqual(beatSounds(guardBeat, crab, {}), { start: ['guard'], impact: [] });
  assert.deepEqual(beatSounds(fireBeat, crab, { touma: 'protect' }), {
    start: ['cast'],
    impact: ['fireHit', 'iceBreak']
  });
  assert.deepEqual(beatSounds(enemyBeat, crab, { touma: 'protect' }), {
    start: ['swing'],
    impact: ['coverHit', 'bondLamp']
  });

  // 2. Normal slash vs heavy break slash
  const mochi = Core.newBattle('mochi');
  const normalSlash = buildBeats(turn(mochi, { skill: 'attack', target: 0 }, { skill: 'ring' }));
  assert.deepEqual(beatSounds(normalSlash.find(b => b.actor === 'touma'), mochi, {}), {
    start: ['swing'],
    impact: ['slash']
  });
  assert.deepEqual(beatSounds(normalSlash.find(b => b.actor === 'nina'), mochi, {}), {
    start: ['cast'],
    impact: ['ringHit']
  });

  const breakSlash = buildBeats(turn(mochi, { skill: 'break', target: 0 }, { skill: 'guard' }));
  assert.deepEqual(beatSounds(breakSlash.find(b => b.actor === 'touma'), mochi, {}), {
    start: ['swing'],
    impact: ['heavySlash']
  });

  // 3. Ointment / heal & Team flare
  const hurt = Core.newBattle('mochi', { ointments: 1 });
  hurt.heroes.nina.hp = 30;
  const healBeats = buildBeats(turn(hurt, { skill: 'ointment', target: 'nina' }, { skill: 'guard' }));
  assert.deepEqual(beatSounds(healBeats.find(b => b.actor === 'touma'), hurt, {}), {
    start: ['support' === healBeats.find(b => b.actor === 'touma').kind ? 'cast' : 'swing'],
    impact: ['heal']
  });

  const flareBattle = Core.newBattle('guardian');
  flareBattle.gauge = 3;
  const flareBeat = buildBeats(Core.resolveTurn(flareBattle, { team: 'flare' }, ['touma', 'nina']))[0];
  assert.deepEqual(beatSounds(flareBeat, flareBattle, {}), {
    start: ['teamCharge'],
    impact: ['teamSlash']
  });
});
