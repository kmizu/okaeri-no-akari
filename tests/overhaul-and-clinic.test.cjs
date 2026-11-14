const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function boot(raw, saveSlot = 'okaeri-forest-v1') {
  const data = new Map(raw ? [[saveSlot, raw]] : []),
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
    if (id === 'chapterCard') e.hidden = true;
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
      jingle() {}
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
  return {
    ctx,
    el,
    data,
    saved: (slot = 'okaeri-forest-v1') => ctx.OkaeriCore.restoreSave(data.get(slot))
  };
}

test('Yura’s clinic has its own town entrance and interior, and Yura is inside the clinic rather than standing outdoors in snow', () => {
  const b = boot();
  const S = b.ctx.OkaeriStory,
    E = b.ctx.OkaeriEpisodes,
    D = b.ctx.OkaeriDirector;

  // Town has clinicDoor at (10, 13) and collision footprint [9..11, 11..12]
  const s1 = E.create(1);
  s1.scene = 'town';
  const townObjs = S.activeObjects(s1);
  assert.ok(townObjs.some(o => o.id === 'clinicDoor' && o.x === 10 && o.y === 13));
  assert.equal(townObjs.some(o => o.id === 'yura'), false, 'Yura does not stand outdoors in town during daytime');
  assert.equal(S.walkable(s1, 10, 12), false, 'clinic building footprint blocks walking through walls');
  assert.equal(S.walkable(s1, 10, 13), true, 'clinic doorway tile is walkable');

  // Inside clinic, Yura is at (11, 7) and furniture + exit are present
  s1.scene = 'clinic';
  const clinicObjs = S.activeObjects(s1);
  assert.ok(clinicObjs.some(o => o.id === 'yura' && o.x === 11 && o.y === 7));
  assert.ok(clinicObjs.some(o => o.id === 'clinicExit' && o.x === 12 && o.y === 13));
  assert.ok(clinicObjs.some(o => o.id === 'clinicWaiting'));

  // Only during Episode 9 night festival does Yura step out to the festival stalls
  const s9 = E.create(9);
  s9.scene = 'town';
  assert.ok(S.activeObjects(s9).some(o => o.id === 'yura' && o.x === 9 && o.y === 9));

  // Clinic story events (Ep 3 step 4, Ep 4 step 0, Ep 10 koharu step 1) all take place inside clinic and guide via clinicDoor
  assert.equal(E.events(E.create(3))[4].scene, 'clinic');
  assert.equal(E.events(E.create(4))[0].scene, 'clinic');
  assert.equal(E.events(E.create(10, 'koharu'))[1].scene, 'clinic');

  const s4 = E.create(4);
  s4.scene = 'town';
  const way = D.guide(s4);
  assert.deepEqual({ ...way }, { x: 10, y: 13, via: 'ユラの診療所へ' });

  // Entering clinicDoor and exiting clinicExit via game interaction
  const enterSave = { ...E.create(2), scene: 'town', x: 10, y: 13 };
  const b2 = boot(JSON.stringify(enterSave));
  b2.el('continueButton').onclick();
  b2.el('interactButton').onclick();
  assert.equal(b2.saved().scene, 'clinic');
  assert.equal(b2.el('locationName').textContent, 'ユラの診療所');

  // Inspect clinicWaiting prop inside clinic
  const waitSave = { ...b2.saved(), x: 15, y: 10 };
  const b3 = boot(JSON.stringify(waitSave));
  b3.el('continueButton').onclick();
  b3.el('interactButton').onclick();
  const waitLines = [];
  while (!b3.el('dialogue').hidden) {
    waitLines.push(b3.el('dialogueText').textContent);
    b3.el('nextDialogue').onclick();
  }
  assert.ok(waitLines.some(t => /一脚だけ置かれた木の椅子/.test(t)));
});

test('Episode 1 climax explains both parents’ tragedy thoroughly, and return to board states practical frostbite pharmacist reason', () => {
  const towerSave = {
    version: 1,
    scene: 'forest',
    x: 20,
    y: 3,
    lead: 'touma',
    flags: { board: true, mochi: true, log: true, repair: true, crab: true, guardian: true },
    courage: 1,
    episode: { chapter: 1, step: 0, route: null, complete: false }
  };
  const b = boot(JSON.stringify(towerSave));
  b.el('continueButton').onclick();
  b.el('interactButton').onclick();
  const towerLines = [];
  while (!b.el('dialogue').hidden) {
    towerLines.push(b.el('dialogueText').textContent);
    b.el('nextDialogue').onclick();
  }
  const fullTower = towerLines.join('\n');
  assert.match(fullTower, /北の峠/, 'explains where the parents were returning from');
  assert.match(fullTower, /小麦/, 'explains why both parents were on the convoy');
  assert.match(fullTower, /魔獣/, 'explains how the mountain magic beast knocked out the lighthouse');
  assert.match(fullTower, /サエ/, 'explains why Sae was wounded and could not relight the beacon in time');
  assert.match(fullTower, /森の分かれ道/, 'explains how the convoy lost the buried fork in the blizzard');

  // Now return to town bulletin board and verify Sae's practical frostbite / pharmacist reasoning
  const boardSave = { ...b.saved(), scene: 'town', x: 10, y: 9 };
  const bBoard = boot(JSON.stringify(boardSave));
  bBoard.el('continueButton').onclick();
  bBoard.el('interactButton').onclick();
  const boardLines = [];
  while (!bBoard.el('dialogue').hidden) {
    boardLines.push(bBoard.el('dialogueText').textContent);
    bBoard.el('nextDialogue').onclick();
  }
  const fullBoard = boardLines.join('\n');
  assert.match(fullBoard, /凍傷/);
  assert.match(fullBoard, /薬師/);
  assert.match(fullBoard, /診療所のユラ/);
  assert.doesNotMatch(fullBoard, /手を温める者を、一人/);
});

test('Episode 2 starts with chapter transition card and 3-person morning house scene before bulletin board and exploration', () => {
  const b = boot();
  b.el('chapterButton').onclick();
  const ep2Btn = b.el('modalActions').children.find(btn => /第2話/.test(btn.textContent));
  assert.ok(ep2Btn);
  ep2Btn.onclick();

  // Chapter transition card is displayed immediately
  assert.equal(b.el('chapterCard').hidden, false);
  assert.equal(b.el('chapterCardTitle').textContent, '第2話 — 雪の下の宝物');
  assert.match(b.el('chapterCardSub').textContent, /三人目の出発札/);

  // Starts inside Three-Person House at morning breakfast with prologueStage = 0 (not cold-dropped in town!)
  const s0 = b.saved('okaeri-chapter-v1');
  assert.equal(s0.scene, 'house');
  assert.equal(s0.prologueStage, 0);
  assert.equal(b.ctx.OkaeriDirector.companion(s0), true, 'Koharu is visible at the breakfast table');

  // Clicking nextDialogue dismisses chapterCard and steps through Stage 0 (house) -> Stage 1 (town board) -> explore
  const stage0Len = b.ctx.OkaeriEpisodesData.prologues[2][0].lines.length;
  const stage1Len = b.ctx.OkaeriEpisodesData.prologues[2][1].lines.length;
  for (let i = 0; i < stage0Len; i++) b.el('nextDialogue').onclick();
  assert.equal(b.el('chapterCard').hidden, true);

  const s1 = b.saved('okaeri-chapter-v1');
  assert.equal(s1.scene, 'town');
  assert.equal(s1.prologueStage, 1);

  // Mid-prologue save survives restoreSave and resumes cleanly
  const resumed = boot(b.data.get('okaeri-chapter-v1'), 'okaeri-forest-v1');
  resumed.el('continueButton').onclick();
  for (let i = 0; i < stage1Len; i++) resumed.el('nextDialogue').onclick();

  const afterPrologue = resumed.saved('okaeri-forest-v1');
  assert.equal(afterPrologue.prologueStage, undefined);
  assert.equal(afterPrologue.scene, 'town');
  assert.equal(resumed.ctx.OkaeriDirector.companion(afterPrologue), true, 'Koharu walks with the party in Episode 2');

  // Episode 2 ending house conversation: Koharu is present at home and seated during dinner/talk, then goes to sleep in her room
  const ep2HomeSave = { ...b.ctx.OkaeriEpisodes.create(2), scene: 'house', x: 11, y: 10 };
  ep2HomeSave.episode.step = 3;
  const bEnd2 = boot(JSON.stringify(ep2HomeSave));
  bEnd2.el('continueButton').onclick();
  assert.equal(bEnd2.ctx.OkaeriDirector.companion(bEnd2.saved()), true, 'Koharu comes home with Touma and Nina at end of Episode 2');
  bEnd2.el('interactButton').onclick();
  assert.equal(bEnd2.ctx.OkaeriDirector.companion(bEnd2.saved()), true, 'Koharu is visible during Episode 2 dinner conversation');
  // Advance past Koharu saying goodnight (7 lines) to line 8 where her room door closes
  for (let i = 0; i < 7; i++) bEnd2.el('nextDialogue').onclick();
  assert.equal(bEnd2.ctx.OkaeriDirector.companion(bEnd2.saved()), false, 'Koharu goes into her room to sleep when her door closes');

  // Every chapter 2..9 and every chapter 10 route has a house prologue and subtitle
  const D = b.ctx.OkaeriEpisodesData;
  for (let ch = 2; ch <= 9; ch++) {
    assert.ok(D.subtitles[ch], 'subtitle ' + ch);
    assert.ok(Array.isArray(D.prologues[ch]) && D.prologues[ch][0].scene === 'house', 'prologue ' + ch);
  }
  for (const r of b.ctx.OkaeriCore.routes) {
    assert.ok(D.subtitles['10:' + r.id], 'subtitle 10:' + r.id);
    assert.ok(Array.isArray(D.prologues['10:' + r.id]) && D.prologues['10:' + r.id][0].scene === 'house', 'prologue 10:' + r.id);
  }
});

test('no numeric character ages or forbidden terms exist anywhere in narrative scripts', () => {
  const rootDir = path.join(__dirname, '..');
  const files = fs
    .readdirSync(rootDir)
    .filter(f => f.endsWith('.js'))
    .map(f => path.join(rootDir, f))
    .concat(
      fs
        .readdirSync(path.join(rootDir, 'script'))
        .filter(f => f.endsWith('.js'))
        .map(f => path.join(rootDir, 'script', f))
    );
  const bad = /[0-9一二三四五六七八九十]+(歳|才|つ年下|つ年上)|二つしか違わない|六つの冬|帰り灯/;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(content, bad, path.basename(file));
  }
});
