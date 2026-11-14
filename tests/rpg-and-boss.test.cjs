const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Core = require('../core.js');
const { conditionList } = require('../battle-ui.js');

function bootGame(raw) {
  const data = new Map(raw ? [['okaeri-forest-v1', raw]] : []),
    els = {},
    keyHandlers = [];
  function makeNode() {
    return {
      hidden: false,
      disabled: false,
      children: [],
      style: { setProperty() {} },
      dataset: {},
      classList: { add() {}, remove() {} },
      focus() {},
      setAttribute(k, v) {
        this[k] = v;
      },
      getAttribute(k) {
        return this[k];
      },
      addEventListener() {},
      querySelector() {
        return (this._q ||= makeNode());
      },
      querySelectorAll: () => [],
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 320 }),
      append(b) {
        this.children.push(b);
      },
      replaceChildren(...nodes) {
        this.children = [...nodes];
      }
    };
  }
  function el(id) {
    if (els[id]) return els[id];
    const e = makeNode();
    Object.defineProperty(e, 'innerHTML', {
      set(v) {
        this.html = v;
        if (id === 'modalContent' && els.modalActions) els.modalActions.children = [];
      },
      get() {
        return this.html || '';
      }
    });
    return (els[id] = e);
  }
  const worldStub = {
    roamers: [],
    enemySvg: (_t, e) => '<span>' + (e?.name || '') + '</span>',
    Renderer: class {
      reset() {}
      draw() {}
    }
  };
  const ctx = vm.createContext({
    OkaeriWorld: worldStub,
    OkaeriMusic: class {
      static sceneFor() {
        return 'village';
      }
      select() {
        return Promise.resolve();
      }
      stop() {}
    },
    OkaeriSprites: { load: () => Promise.resolve() },
    OkaeriCast: { ready: Promise.resolve() },
    OkaeriResidentsArt: { ready: Promise.resolve() },
    document: {
      getElementById: el,
      createElement: () => makeNode(),
      addEventListener(type, fn) {
        if (type === 'keydown') keyHandlers.push(fn);
      },
      querySelectorAll: () => []
    },
    window: { addEventListener() {} },
    localStorage: { getItem: k => data.get(k) || null, setItem: (k, v) => data.set(k, v) },
    performance: { now: () => ctx.__now },
    __now: 5000,
    setTimeout: () => 0,
    clearTimeout() {},
    requestAnimationFrame(fn) {
      ctx.__raf = fn;
    },
    console
  });
  for (const f of [
    'core.js',
    'story.js',
    'canal.js',
    'chapters.js',
    'hill.js',
    'field.js',
    'side-stories.js',
    'episodes-data.js',
    'episode-activities.js',
    'episodes.js',
    'opening-film.js',
    'direction.js',
    'battle-ui.js',
    'game.js'
  ])
    vm.runInContext(fs.readFileSync(require.resolve('../' + f), 'utf8'), ctx, { filename: f });
  return {
    ctx,
    el,
    data,
    worldStub,
    press(key) {
      for (const fn of keyHandlers) fn({ key, repeat: false, target: { tagName: 'DIV' }, preventDefault() {} });
    },
    saved: () => ctx.OkaeriCore.restoreSave(data.get('okaeri-forest-v1'))
  };
}

test('climax boss alphaBeast has dedicated sprites, 2-phase enrage + guardian assist, charge interrupt, and is winnable', () => {
  // Verify boss sprites exist on disk
  for (const img of ['oo-higui.png', 'oo-higui-blaze.png']) {
    const p = path.join(__dirname, '..', 'assets', 'monsters', 'web', img);
    assert.ok(fs.existsSync(p), img + ' exists');
    assert.ok(fs.statSync(p).size > 20000, img + ' is non-empty artwork');
  }

  const rpg8 = Core.createRpg(8);
  let b = Core.newBattle('alphaBeast', { support: 'koharu', rpg: rpg8, ointments: 2 });
  assert.equal(b.enemies[0].name, '隻眼の大灯喰い');
  assert.equal(b.enemies[0].hp, 400);
  assert.equal(b.enemies[0].ice, true);
  assert.equal(b.enemies[0].boss, true);
  assert.equal(b.enemies[0].tint, 'alphaBeast');
  assert.match(Core.intentions(b)[0].label, /凍牙の飛びかかり/);

  // Melt frost armor and push below 50% HP (<= 200 HP) to trigger Phase 2 + Ridge Guardian assist!
  b.enemies[0].hp = 220;
  b = Core.resolveTurn(
    b,
    {
      touma: { skill: 'break', target: 0 },
      nina: { skill: 'fire', target: 0 },
      koharu: { skill: 'tend', target: 'nina' }
    },
    ['nina', 'touma', 'koharu']
  );
  assert.equal(b.enemies[0].enraged, true, 'Phase 2 enraged triggered at <= 50% HP');
  assert.ok(b.logs.some(l => /尾根の番人が横合いから/.test(l)), 'Ridge Guardian assists mid-battle');
  assert.equal(b.enemies[0].broken, 1, 'Ridge Guardian staggers the boss for next turn');
  assert.ok(b.gauge >= 2, 'Ridge Guardian charges party cooperation gauge');

  // Verify Phase 2 charge -> interrupt mechanic
  b.enemies[0].broken = 0;
  b.enemies[0].ice = false;
  b.enemies[0].hp = 180;
  b.turn = 2; // even turn in enraged phase -> prepares charge (`黒吹雪を纏い身構える`)
  assert.match(Core.intentions(b)[0].label, /黒吹雪を纏い身構える/);
  b = Core.resolveTurn(
    b,
    {
      touma: { skill: 'guard' },
      nina: { skill: 'guard' },
      koharu: { skill: 'salve', target: 'nina' }
    },
    ['touma', 'nina', 'koharu']
  );
  assert.equal(b.enemies[0].charged, true, 'boss enters charged state');
  assert.ok(conditionList(b.enemies[0], 'enemy').some(c => c.key === 'charged'), 'charged badge shown in UI');
  assert.match(Core.intentions(b)[0].label, /黒霜の猛突進/);

  // Interrupt charged rush with Nina's fire!
  const hpBeforeInterrupt = b.heroes.touma.hp + b.heroes.nina.hp;
  b = Core.resolveTurn(
    b,
    {
      touma: { skill: 'attack', target: 0 },
      nina: { skill: 'fire', target: 0 },
      koharu: { skill: 'tend', target: 'nina' }
    },
    ['nina', 'touma', 'koharu']
  );
  assert.equal(b.enemies[0].charged, false, 'charged state cancelled');
  assert.ok(b.logs.some(l => /猛突進を阻止した/.test(l)), 'interrupt message logged');
  assert.ok(b.heroes.touma.hp + b.heroes.nina.hp >= hpBeforeInterrupt, 'boss skipped its AOE rush');

  // Full winnable simulation from 400 HP with Chapter 8 party
  let sim = Core.newBattle('alphaBeast', { support: 'koharu', rpg: Core.createRpg(8), ointments: 2 });
  const ord = ['nina', 'touma', 'koharu'];
  for (let safety = 0; safety < 25 && sim.status === 'active'; safety++) {
    if (sim.gauge >= 3 && sim.heroes.touma.hp > 0 && sim.heroes.nina.hp > 0) {
      sim = Core.resolveTurn(sim, { team: 'flare' }, ord);
      continue;
    }
    const e = sim.enemies[0];
    const ninaLow = sim.heroes.nina.hp < 55 || sim.heroes.touma.hp < 55;
    const toumaCmd =
      sim.heroes.nina.hp < 55
        ? { skill: 'protect' }
        : sim.heroes.touma.sp >= 2 && (e.charged || !e.broken)
          ? { skill: 'break', target: 0 }
          : { skill: 'attack', target: 0 };
    const ninaCmd =
      ninaLow && sim.heroes.nina.sp >= 2
        ? { skill: 'heal', target: sim.heroes.nina.hp <= sim.heroes.touma.hp ? 'nina' : 'touma' }
        : (e.ice || e.charged) && sim.heroes.nina.sp >= 2
          ? { skill: 'fire', target: 0 }
          : sim.heroes.nina.sp >= 2 && !sim.heroes.touma.buff
            ? { skill: 'buff' }
            : { skill: 'attack', target: 0 };
    const koharuCmd =
      sim.heroes.nina.sp < 2 && sim.heroes.koharu.sp >= 2
        ? { skill: 'mint', target: 'nina' }
        : (sim.heroes.nina.chill || sim.heroes.touma.chill) && sim.heroes.koharu.sp >= 3
          ? { skill: 'tea' }
          : ninaLow && sim.heroes.koharu.sp >= 2
            ? { skill: 'warm', target: sim.heroes.nina.hp <= sim.heroes.touma.hp ? 'nina' : 'touma' }
            : { skill: 'tend', target: 'nina' };
    sim = Core.resolveTurn(sim, { touma: toumaCmd, nina: ninaCmd, koharu: koharuCmd }, ord);
  }
  assert.equal(sim.status, 'victory', 'Chapter 8 party defeats alphaBeast cleanly');
});

test('Episode 8 features vanguard beast followed by summit alphaBeast boss and keeps Koharu through step 4', () => {
  const b = bootGame();
  const ep8 = b.ctx.OkaeriEpisodesData.episodes[8];
  assert.equal(ep8.length, 6);
  assert.equal(ep8[2].battle, 'beast');
  assert.equal(ep8[3].battle, 'alphaBeast');
  assert.equal(ep8[3].x, 15);
  assert.equal(ep8[3].y, 6);
  assert.ok(
    ep8[5].lines.some(l => /左目を斬り裂いて/.test(l[1])) && ep8[5].lines.some(l => /十二年前/.test(l[1])),
    'Sae recognizes the 12-year-old scar'
  );

  const s = b.ctx.OkaeriEpisodes.create(8);
  s.episode.step = 3;
  assert.equal(b.ctx.OkaeriDirector.companion(s), true);
  s.episode.step = 4;
  assert.equal(b.ctx.OkaeriDirector.companion(s), true);
  s.episode.step = 5;
  assert.equal(b.ctx.OkaeriDirector.companion(s), false);

  assert.ok(Core.restoreSave(JSON.stringify(s)), 'step 5 save is valid');
  s.episode.step = 6;
  assert.equal(Core.restoreSave(JSON.stringify(s)), null, 'step 6 out-of-range save is rejected');
});

test('RPG leveling, equipment upgrades, medicine crafting, persistent HP/MP, and strict save validation work', () => {
  const state = {
    version: 1,
    scene: 'forest',
    x: 5,
    y: 13,
    lead: 'touma',
    flags: { board: true, mochi: true },
    courage: 0,
    ointments: 2
  };
  const rpg = Core.ensureRpg(state);
  assert.equal(rpg.lv, 1);

  // Fight mochi and take some damage; verify HP/MP persist and EXP + drops accrue
  let battle = Core.newBattle('mochi', { rpg });
  battle.heroes.touma.hp = 82;
  battle.heroes.nina.sp = 4;
  battle.items = 2;
  const r1 = Core.rpgSyncAfterBattle(state, battle, true);
  assert.equal(r1.exp, 18);
  assert.ok(r1.drops.length >= 2);
  assert.equal(state.rpg.hp.touma, 82, 'damaged HP persists after battle');
  assert.equal(state.rpg.sp.nina, 4, 'spent MP persists after battle');
  assert.equal(state.rpg.herbs, 2, 'used herbs persist after battle');

  // Next battle starts with persisted 82 HP and 4 SP!
  const nextB = Core.newBattle('crab', { rpg: state.rpg });
  assert.equal(nextB.heroes.touma.hp, 82);
  assert.equal(nextB.heroes.nina.sp, 4);

  // Field herb heals +45 HP and +1 MP
  const herbRes = Core.rpgUseHerbField(state);
  assert.equal(herbRes.ok, true);
  assert.equal(state.rpg.hp.touma, 120);
  assert.equal(state.rpg.sp.nina, 5);
  assert.equal(state.rpg.herbs, 1);

  // Grant enough EXP via crab victory to level up to Lv.2 -> full heal + higher max HP
  const nextB2 = Core.newBattle('crab', { rpg: state.rpg });
  const r2 = Core.rpgSyncAfterBattle(state, nextB2, true);
  assert.equal(r2.leveledUp, true);
  assert.equal(state.rpg.lv, 2);
  assert.equal(state.rpg.hp.touma, 130, 'Lv.2 raises Touma max HP to 130 and full-heals');

  // Upgrade sword, staff, coat and verify actual combat damage/defense scaling!
  const unbuffed = Core.newBattle('stray');
  const baseSlash =
    38 -
    Core.resolveTurn(
      unbuffed,
      { touma: { skill: 'attack', target: 0 }, nina: { skill: 'guard', target: 'nina' } },
      ['touma', 'nina']
    ).enemies[0].hp;

  state.rpg.mats = { crystal: 20, shell: 20, moss: 20, ember: 20 };
  assert.equal(Core.rpgUpgrade(state, 'sword').ok, true);
  assert.equal(Core.rpgUpgrade(state, 'sword').rank, 2);
  assert.equal(Core.rpgUpgrade(state, 'staff').ok, true);
  assert.equal(Core.rpgUpgrade(state, 'coat').ok, true);

  const upgraded = Core.newBattle('stray', { rpg: state.rpg });
  const boostedSlash =
    38 -
    Core.resolveTurn(
      upgraded,
      { touma: { skill: 'attack', target: 0 }, nina: { skill: 'guard', target: 'nina' } },
      ['touma', 'nina']
    ).enemies[0].hp;
  assert.ok(boostedSlash > baseSlash, `Upgraded sword + Lv.2 deals ${boostedSlash} > base ${baseSlash}`);

  // Craft herbPack, ointmentCraft (caps at 4), and warmTea
  assert.equal(Core.rpgCraft(state, 'herbPack').ok, true);
  assert.equal(state.rpg.herbs, 3);
  assert.equal(Core.rpgCraft(state, 'ointmentCraft').ok, true);
  assert.equal(Core.rpgCraft(state, 'ointmentCraft').ok, true);
  assert.equal(state.ointments, 4);
  assert.equal(Core.rpgCraft(state, 'ointmentCraft').ok, false, 'ointment crafting respects max cap 4');

  state.rpg.hp.touma = 50;
  assert.equal(Core.rpgCraft(state, 'warmTea').ok, true);
  assert.equal(state.rpg.hp.touma, 130);

  // Strict save validation round-trips valid rpg and rejects tampered rpg
  const restored = Core.restoreSave(JSON.stringify(state));
  assert.ok(restored?.rpg);
  assert.equal(restored.rpg.lv, 2);
  assert.equal(restored.rpg.gear.sword, 2);

  for (const badRpg of [
    { ...state.rpg, lv: 0 },
    { ...state.rpg, lv: 99 },
    { ...state.rpg, gear: { sword: 6, staff: 0, coat: 0 } },
    { ...state.rpg, mats: { crystal: -1, shell: 0, moss: 0, ember: 0 } },
    'invalid'
  ]) {
    assert.equal(Core.restoreSave(JSON.stringify({ ...state, rpg: badRpg })), null);
  }
});

test('roaming symbol encounters spawn on outdoor maps after tutorial, trigger battle on touch, and rest cabins heal HP/MP', async () => {
  // Before mochi tutorial in forest: 0 roamers
  const preMochi = {
    version: 1,
    scene: 'forest',
    x: 5,
    y: 13,
    lead: 'touma',
    flags: { board: true },
    courage: 0
  };
  const b0 = bootGame(JSON.stringify(preMochi));
  b0.el('continueButton').onclick();
  assert.equal(b0.worldStub.roamers.length, 0, 'no roamers before tutorial mochi');

  // After mochi in forest: roamers spawn!
  const postMochi = {
    version: 1,
    scene: 'forest',
    x: 5,
    y: 13,
    lead: 'touma',
    flags: { board: true, mochi: true, log: true },
    courage: 0,
    rpg: {
      lv: 2,
      exp: 10,
      herbs: 3,
      hp: { touma: 70, nina: 60, koharu: 77 },
      sp: { touma: 4, nina: 5, koharu: 10 },
      gear: { sword: 0, staff: 0, coat: 0 },
      mats: { crystal: 3, shell: 3, moss: 3, ember: 1 }
    }
  };
  const b = bootGame(JSON.stringify(postMochi));
  await new Promise(r => setImmediate(r));
  b.el('continueButton').onclick();
  assert.ok(b.worldStub.roamers.length >= 1, 'roamers spawn in forest after mochi');

  // Open menu and verify live HP/MP & Lv.2 are rendered
  b.el('menuButton').onclick();
  assert.match(b.el('modalContent').html, /灯守 Lv\.2/);
  assert.match(b.el('modalContent').html, /70\/130/);
  b.el('modalActions').children[0].onclick(); // close menu

  // Open craft screen via 'c' key
  b.press('c');
  assert.match(b.el('modalContent').html, /装備強化・薬調合/);
  b.el('modalActions').children[0].onclick(); // close craft

  // Move roamer 1 walkable tile away from player and walk onto it -> battle starts!
  const countBefore = b.worldStub.roamers.length;
  b.el('battleScreen').hidden = true;
  if (b.ctx.__raf) b.ctx.__raf(9000);
  const stepChoices = [
    ['w', 0, -1],
    ['d', 1, 0],
    ['a', -1, 0],
    ['s', 0, 1]
  ];
  const [dirKey, dx, dy] = stepChoices.find(([, sx, sy]) => b.ctx.OkaeriStory.walkable(postMochi, 5 + sx, 13 + sy));
  b.worldStub.roamers[0].x = 5 + dx;
  b.worldStub.roamers[0].y = 13 + dy;
  b.ctx.__now = 9200;
  b.press(dirKey);
  if (b.ctx.__raf) b.ctx.__raf(9200);
  assert.equal(b.el('battleScreen').hidden, false, 'stepping onto a roaming monster triggers battle');
  assert.ok(countBefore >= 1);

  // Rest cabin restores full HP/MP
  const restSave = {
    ...postMochi,
    x: 10,
    y: 9,
    flags: { board: true, mochi: true, log: true, rest: true }
  };
  const restObj = b.ctx.OkaeriStory.objects.forest.find(o => o.id === 'rest');
  restSave.x = restObj.x;
  restSave.y = restObj.y;
  const bRest = bootGame(JSON.stringify(restSave));
  bRest.el('continueButton').onclick();
  assert.equal(bRest.saved().rpg.hp.touma, 70);
  bRest.el('interactButton').onclick();
  while (!bRest.el('dialogue').hidden) bRest.el('nextDialogue').onclick();
  assert.equal(bRest.saved().rpg.hp.touma, 130, 'forest rest cabin restores full HP');
  assert.equal(bRest.saved().rpg.sp.nina, 8, 'forest rest cabin restores full MP');
  assert.ok(countBefore >= 1);
});
