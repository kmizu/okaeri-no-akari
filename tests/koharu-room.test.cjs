const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

require('../story.js');
require('../chapters.js');
const Core = require('../core.js');
const Music = require('../music.js');
const Director = require('../direction.js');
require('../scenery.js');
const Story = global.OkaeriStory;

function reachable(state, start) {
  const queue = [start], seen = new Set();
  while (queue.length) {
    const [x, y] = queue.shift(), key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
      if (Story.walkable(state, x + dx, y + dy)) queue.push([x + dx, y + dy]);
  }
  return [...seen].map(k => k.split(',').map(Number));
}

test('the shared house gives Touma, Koharu and Nina each a walled bedroom with reachable furniture', () => {
  const house = { scene: 'house', flags: {} };
  const points = reachable(house, [12, 12]);
  for (const id of ['koharuBed', 'koharuHerbs', 'koharuDesk', 'koharuKeepsakes', 'toumaRoom', 'toumaDesk', 'ninaRoom', 'houseExit']) {
    const object = Story.objects.house.find(o => o.id === id);
    assert.ok(object, id);
    assert.ok(points.some(([x, y]) => Math.hypot(x - object.x, y - object.y) < 1.5), `${id} is reachable`);
  }
  assert.equal(Story.objects.house.some(o => o.id === 'koharuDoor'), false, 'floating corner door is gone');
  for (let y = 3; y <= 6; y++) {
    assert.equal(Story.walkable(house, 8, y), false, `left bedroom partition at y=${y}`);
    assert.equal(Story.walkable(house, 14, y), false, `right bedroom partition at y=${y}`);
  }
  assert.equal(Story.walkable(house, 6, 6), true, 'Touma doorway');
  assert.equal(Story.walkable(house, 11, 6), true, 'Koharu doorway');
  assert.equal(Story.walkable(house, 17, 6), true, 'Nina doorway');
  assert.equal(Music.sceneFor('house'), 'hearth');
  assert.equal(Director.ambient({ ...house, episode: { chapter: 8, step: 1 } }).indoors, true);
  assert.doesNotThrow(() => global.OkaeriScenery.animate({}, 'house', 10), 'snow is not drawn indoors');
  const legacySave = { ...global.OkaeriChapters.create(2), scene: 'koharuRoom', x: 12, y: 12 };
  const migrated = Core.restoreSave(JSON.stringify(legacySave));
  assert.equal(migrated.scene, 'house');
  assert.equal(migrated.x, 11);
  assert.equal(migrated.y, 5);
  assert.equal(Core.restoreSave(JSON.stringify({ ...legacySave, x: 2 })), null);
});

function boot(saved) {
  const store = new Map([['okaeri-forest-v1', JSON.stringify(saved)]]), els = {};
  function el(id) {
    if (els[id]) return els[id];
    const e = { hidden: false, style: {}, children: [], classList: { add() {}, remove() {} }, focus() {}, setAttribute() {}, addEventListener() {}, append(b) { this.children.push(b); }, replaceChildren() { this.children = []; } };
    Object.defineProperty(e, 'innerHTML', { set(v) { this.html = v; if (id === 'modalContent' && els.modalActions) els.modalActions.children = []; }, get() { return this.html; } });
    return els[id] = e;
  }
  const ctx = vm.createContext({
    OkaeriWorld: { Renderer: class { reset() {} draw() {} } },
    OkaeriMusic: class { static sceneFor(scene) { return Music.sceneFor(scene); } select() { return Promise.resolve(); } stop() {} },
    OkaeriSprites: { load: () => Promise.resolve() }, OkaeriCast: { ready: Promise.resolve() }, OkaeriResidentsArt: { ready: Promise.resolve() },
    document: { getElementById: el, createElement: () => ({}), addEventListener() {}, querySelectorAll: () => [] },
    window: { addEventListener() {} }, localStorage: { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v) },
    setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame() {}, console
  });
  for (const f of ['core.js', 'story.js', 'chapters.js', 'episodes-data.js', 'episode-activities.js', 'episodes.js', 'opening-film.js', 'direction.js', 'game.js'])
    vm.runInContext(fs.readFileSync(require.resolve('../' + f), 'utf8'), ctx, { filename: f });
  return { ctx, el, store, saved: () => ctx.OkaeriCore.restoreSave(store.get('okaeri-forest-v1')) };
}

test('the actual game explores Koharu’s bedroom inside the house, saves, and resumes cleanly', () => {
  const initial = { ...global.OkaeriChapters.create(4), episode: { chapter: 2, step: 0, route: null, complete: false }, scene: 'house', x: 11, y: 4 };
  const b = boot(initial);
  b.el('continueButton').onclick();
  assert.equal(b.el('locationName').textContent, '三人の家');
  b.el('interactButton').onclick();
  assert.match(b.el('dialogueText').textContent, /コハル/);
  const resumed = boot(JSON.parse(b.store.get('okaeri-forest-v1')));
  resumed.el('continueButton').onclick();
  assert.equal(resumed.saved().scene, 'house');
  assert.equal(resumed.saved().x, 11);
  assert.equal(resumed.saved().y, 4);
  assert.equal(resumed.saved().episode.chapter, 2);
});

test('household interactions in Koharu’s room remain available with a chapter in progress', () => {
  for (const [x, y] of [[11, 5], [10, 4], [10, 5]]) {
    const b = boot({ ...global.OkaeriChapters.create(4), episode: { chapter: 2, step: 0, route: null, complete: false }, scene: 'house', x, y });
    b.el('continueButton').onclick();
    b.el('interactButton').onclick();
    assert.match(b.el('dialogueText').textContent, /コハル|小さな箱|机|薬草/);
  }
});

test('the third seat is present from the opening and changes only after the route brings a chair home', () => {
  const draws = [];
  const draw = new Proxy({
    ready: () => true, failed: () => false, define() {},
    draw(c, name) { draws.push(name); return true; },
    rng: () => () => 0.5, n: n => n, lite: c => c, dark: c => c, mix: c => c
  }, { get: (target, key) => key in target ? target[key] : () => '' });
  const root = vm.createContext({ OkaeriDraw: draw, OkaeriCore: Core });
  vm.runInContext(fs.readFileSync(require.resolve('../home-art.js'), 'utf8'), root);
  const canvas = new Proxy({ createRadialGradient: () => ({ addColorStop() {} }) }, { get: (target, key) => target[key] || (() => {}) });
  for (const [episode, expected] of [
    [null, 'home/koharuStool'],
    [{ chapter: 7, step: 0, route: null }, 'home/koharuStool'],
    [{ chapter: 10, step: 0, route: 'koharu' }, 'home/koharuStool'],
    [{ chapter: 10, step: 1, route: 'koharu' }, 'home/chair3'],
    [{ chapter: 10, step: 2, route: 'both' }, 'home/koharuStool'],
    [{ chapter: 10, step: 3, route: 'both' }, 'home/chair3'],
    [{ chapter: 10, step: 0, route: 'koharuLove' }, 'home/chair3']
  ]) {
    draws.length = 0;
    root.OkaeriHomeArt.object(canvas, { type: 'homeTable' }, 0, 0, { episode }, 0);
    assert.equal(draws[0], expected, JSON.stringify(episode));
  }
});

test('the opening home scene starts with Koharu asleep behind a closed door, then opens her door and seats her at the table', () => {
  const order = [];
  const ctx2d = new Proxy({ createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }) }, { get: (t, k) => t[k] || (() => {}) });
  const root = vm.createContext({
    OkaeriStory: Story,
    OkaeriDirector: Director,
    OkaeriSprites: {
      facing: (_dx, _dy, prev) => prev,
      has: () => true,
      draw(_c, x, y, id, dir, moving, _t, seated) { order.push({ kind: 'actor', id, x, y, dir, moving, seated }); }
    },
    OkaeriHomeArt: {
      background: () => true,
      koharuDoor(_c, open) { order.push({ kind: 'door', open }); },
      bedKQuilt() { order.push({ kind: 'quilt' }); },
      tableSeats() { order.push({ kind: 'seats' }); },
      object(_c, o, _x, _y, _s, _t, layered) { if (o.type === 'homeTable') order.push({ kind: 'table', layered }); return true; }
    },
    document: { createElement: () => ({ getContext: () => ctx2d }) }
  });
  vm.runInContext(fs.readFileSync(require.resolve('../world.js'), 'utf8'), root);
  const renderer = new root.OkaeriWorld.Renderer({ getContext: () => ctx2d });
  const state = { scene: 'house', x: 12, y: 7, lead: 'touma', openingStage: 0, flags: {} };

  // 1. Before Koharu wakes up: door closed, Koharu under quilt in bed, only Touma & Nina at the table
  Director.clearOverrides();
  renderer.reset(state);
  renderer.draw(state, 0, 'dialogue');
  assert.equal(order.find(e => e.kind === 'door').open, false);
  const bedKoharu = order.find(e => e.kind === 'actor' && e.id === 'koharu');
  const quiltIdx = order.findIndex(e => e.kind === 'quilt');
  const seatsIdx1 = order.findIndex(e => e.kind === 'seats');
  const tableIdx1 = order.findIndex(e => e.kind === 'table');
  assert.ok(bedKoharu && quiltIdx > order.indexOf(bedKoharu), 'Koharu is drawn under her bed quilt');
  const tableActors1 = order.filter(e => e.kind === 'actor' && order.indexOf(e) > seatsIdx1 && order.indexOf(e) < tableIdx1);
  assert.deepEqual(tableActors1.map(a => a.id).sort(), ['nina', 'touma']);

  // 2. Koharu opens her door: door open, Koharu standing at her doorway, Touma & Nina look up
  order.length = 0;
  Director.apply({ koharu: 'door' }, 100);
  renderer.draw(state, 100, 'dialogue');
  assert.equal(order.find(e => e.kind === 'door').open, true);
  assert.equal(order.some(e => e.kind === 'quilt'), false);
  const doorKoharu = order.find(e => e.kind === 'actor' && e.id === 'koharu');
  assert.equal(doorKoharu.seated, false);
  assert.equal(doorKoharu.x, 552);
  assert.equal(doorKoharu.y, 330);
  assert.equal(order.find(e => e.kind === 'actor' && e.id === 'touma').dir, 'up');
  assert.equal(order.find(e => e.kind === 'actor' && e.id === 'nina').dir, 'up');

  // 3. Koharu walks to her step-stool and sits between seats and tabletop
  order.length = 0;
  Director.apply({ koharu: 'seat' }, 200);
  renderer.draw(state, 1200, 'dialogue');
  const seatsIdx3 = order.findIndex(e => e.kind === 'seats');
  const tableIdx3 = order.findIndex(e => e.kind === 'table');
  const actors3 = order.filter(e => e.kind === 'actor');
  assert.equal(actors3.length, 3);
  assert.equal(order[tableIdx3].layered, true);
  for (const a of actors3) {
    const idx = order.indexOf(a);
    assert.ok(idx > seatsIdx3 && idx < tableIdx3, `${a.id} should render in front of chair backs and behind tabletop`);
    assert.equal(a.seated, true);
    assert.equal(a.moving, false);
  }
  assert.equal(actors3.find(a => a.id === 'koharu').dir, 'right');
  assert.equal(actors3.find(a => a.id === 'nina').dir, 'down');
  assert.equal(actors3.find(a => a.id === 'touma').dir, 'down');
  Director.clearOverrides();
});
