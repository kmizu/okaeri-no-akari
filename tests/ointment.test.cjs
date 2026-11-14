const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Core = require('../core.js');

function boot(raw) {
  const data = new Map(raw ? [['okaeri-forest-v1', raw]] : []),
    els = {};
  function makeNode() {
    return {
      hidden: false,
      disabled: false,
      children: [],
      style: { setProperty() {} },
      dataset: {},
      classList: { add() {}, remove() {} },
      focus() {},
      setAttribute() {},
      addEventListener() {},
      querySelector: () => null,
      querySelectorAll: () => [],
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
  const ctx = vm.createContext({
    OkaeriWorld: { Renderer: class { reset() {} draw() {} } },
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
      addEventListener() {},
      querySelectorAll: () => []
    },
    window: { addEventListener() {} },
    localStorage: { getItem: k => data.get(k) || null, setItem: (k, v) => data.set(k, v) },
    setTimeout: () => 0,
    clearTimeout() {},
    requestAnimationFrame() {},
    console
  });
  for (const f of [
    'core.js',
    'story.js',
    'canal.js',
    'chapters.js',
    'hill.js',
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
  return { ctx, el, data, saved: () => ctx.OkaeriCore.restoreSave(data.get('okaeri-forest-v1')) };
}

test('Koharu’s frostbite ointment enters the item slot during the opening without duplicating on resume', () => {
  const b = boot();
  b.el('startButton').onclick();
  b.el('skipOpening').onclick();
  assert.equal(b.saved().ointments, undefined);
  for (let i = 0; i < b.ctx.OkaeriStory.opening[0].lines.length; i++) b.el('nextDialogue').onclick();
  const handoffIdx = b.ctx.OkaeriStory.opening[1].lines.findIndex(l => /凍傷の軟膏/.test(l[1]));
  assert.ok(handoffIdx > 0);
  for (let i = 0; i < handoffIdx; i++) b.el('nextDialogue').onclick();
  assert.equal(b.saved().ointments, 2);
  assert.equal(b.saved().flags.ointmentGiven, true);
  assert.equal(b.el('bagText').textContent, '持ち物 · 凍傷の軟膏 ×2');

  // Resuming mid-scene must not grant another 2 jars
  const resumed = boot(b.data.get('okaeri-forest-v1'));
  resumed.el('continueButton').onclick();
  for (let i = 0; i < resumed.ctx.OkaeriStory.opening[1].lines.length; i++) resumed.el('nextDialogue').onclick();
  assert.equal(resumed.saved().ointments, 2);
});

test('the item bag and travel journal show frostbite ointment, allow field use, and restock at Koharu’s herb shelf', () => {
  const start = {
    version: 1,
    scene: 'house',
    x: 10,
    y: 4,
    lead: 'touma',
    ointments: 2,
    flags: { ointmentGiven: true },
    courage: 0
  };
  const b = boot(JSON.stringify(start));
  b.el('continueButton').onclick();
  assert.equal(b.el('bagText').textContent, '持ち物 · 凍傷の軟膏 ×2');

  b.el('bagButton').onclick();
  assert.match(b.el('modalContent').html, /凍傷の軟膏　× 2/);
  const useBtn = b.el('modalActions').children.find(btn => /凍傷の軟膏を指に塗る/.test(btn.textContent));
  assert.ok(useBtn, 'field use button is available');
  useBtn.onclick();
  while (!b.el('dialogue').hidden) b.el('nextDialogue').onclick();
  assert.equal(b.saved().ointments, 1);
  assert.equal(b.el('bagText').textContent, '持ち物 · 凍傷の軟膏 ×1');

  b.el('journalButton').onclick();
  assert.match(b.el('modalContent').html, /凍傷の軟膏　× 1/);
  b.el('modalActions').children[0].onclick();

  // Examining Koharu's herb shelf at (9, 3) from (10, 4) restocks back to 2
  b.el('interactButton').onclick();
  while (!b.el('dialogue').hidden) b.el('nextDialogue').onclick();
  assert.equal(b.saved().ointments, 2);
  assert.equal(b.el('bagText').textContent, '持ち物 · 凍傷の軟膏 ×2');
});

test('Nina can use Koharu’s frostbite ointment on the frozen bridge, and town conversations remember it', () => {
  const bridgeSave = {
    version: 1,
    episode: { chapter: 1, step: 0, route: null, complete: false },
    scene: 'forest',
    x: 10,
    y: 8,
    lead: 'nina',
    ointments: 2,
    flags: { board: true, mochi: true, log: true, ointmentGiven: true },
    courage: 0
  };
  // Move right next to repair object in forest
  require('../story.js');
  const repairObj = global.OkaeriStory.objects.forest.find(o => o.id === 'repair');
  bridgeSave.x = repairObj.x;
  bridgeSave.y = repairObj.y + 1;

  const b = boot(JSON.stringify(bridgeSave));
  b.el('continueButton').onclick();
  b.el('interactButton').onclick();
  while (!b.el('choices').children.length) b.el('nextDialogue').onclick();
  assert.match(b.el('choices').children[0].textContent, /「凍傷の軟膏」を使う（残り2）/);
  b.el('choices').children[0].onclick();
  while (!b.el('dialogue').hidden) b.el('nextDialogue').onclick();

  assert.equal(b.saved().ointments, 1);
  assert.equal(b.saved().flags.ointmentBridge, true);
  assert.equal(b.saved().flags.repair, true);

  // Check Koharu's town reaction after lighting the lighthouse
  const afterLit = {
    ...b.saved(),
    scene: 'town',
    x: 13,
    y: 11,
    flags: { ...b.saved().flags, crab: true, guardian: true, lit: true }
  };
  const b2 = boot(JSON.stringify(afterLit));
  b2.el('continueButton').onclick();
  b2.el('interactButton').onclick();
  const spoken = [];
  while (!b2.el('dialogue').hidden) {
    spoken.push(b2.el('dialogueText').textContent);
    b2.el('nextDialogue').onclick();
  }
  assert.ok(spoken.some(t => /橋の上ですごく助かった/.test(t)));
});

test('frostbite ointment works as a shared battle item (HP+60, MP+2, cures chill) and validates saves', () => {
  const battle = Core.newBattle('crab', { ointments: 1 });
  battle.heroes.nina.hp = 20;
  battle.heroes.nina.sp = 3;
  battle.heroes.nina.chill = 2;

  assert.throws(
    () =>
      Core.resolveTurn(
        battle,
        { touma: { skill: 'ointment', target: 'nina' }, nina: { skill: 'ointment', target: 'touma' } },
        ['touma', 'nina']
      ),
    /凍傷の軟膏が足りません/
  );

  const after = Core.resolveTurn(
    battle,
    { touma: { skill: 'ointment', target: 'nina' }, nina: { skill: 'fire', target: 0 } },
    ['touma', 'nina']
  );
  assert.equal(after.ointments, 0);
  // Nina went 20 -> +60 = 80 HP (crab turn 1 hits Touma, so Nina stays at 80 HP)
  assert.equal(after.heroes.nina.hp, 80);
  // Nina had 3 SP, +2 from Touma's ointment = 5, -2 for 'fire' = 3 SP!
  assert.equal(after.heroes.nina.sp, 3);
  assert.equal(after.heroes.nina.chill, 0);
  assert.equal(after.gauge, 1, 'helping a chilled/injured partner charges cooperation');

  // Save validation rejects out-of-range ointment counts
  const base = { version: 1, scene: 'town', x: 12, y: 10, lead: 'touma', flags: {}, courage: 0 };
  assert.equal(Core.restoreSave(JSON.stringify({ ...base, ointments: 2 })).ointments, 2);
  for (const bad of [-1, 5, 1.5, '2', null])
    assert.equal(Core.restoreSave(JSON.stringify({ ...base, ointments: bad })), null);
});
