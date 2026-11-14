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

test('Koharu has an accessible separate room with a bed, herbs and a way home', () => {
  const house = { scene: 'house', flags: {} };
  const door = Story.objects.house.find(o => o.id === 'koharuDoor');
  assert.ok(door, 'house has a door to Koharu’s room');
  assert.ok(reachable(house, [12, 12]).some(([x, y]) => Math.hypot(x - door.x, y - door.y) < 1.5));
  const room = { scene: 'koharuRoom', flags: {} };
  const points = reachable(room, [12, 12]);
  for (const id of ['koharuBed', 'koharuHerbs', 'koharuDesk', 'koharuKeepsakes', 'koharuRoomExit']) {
    const object = Story.objects.koharuRoom.find(o => o.id === id);
    assert.ok(object, id);
    assert.ok(points.some(([x, y]) => Math.hypot(x - object.x, y - object.y) < 1.5), `${id} is reachable`);
  }
  assert.equal(Story.walkable(room, 2, 12), false);
  assert.equal(Music.sceneFor('koharuRoom'), 'hearth');
  assert.equal(Director.ambient({ ...room, episode: { chapter: 8, step: 1 } }).indoors, true);
  assert.doesNotThrow(() => global.OkaeriScenery.animate({}, 'koharuRoom', 10), 'snow is not drawn indoors');
  const save = { ...global.OkaeriChapters.create(2), scene: 'koharuRoom', x: 12, y: 12 };
  assert.equal(Core.restoreSave(JSON.stringify(save)).scene, 'koharuRoom');
  assert.equal(Core.restoreSave(JSON.stringify({ ...save, x: 2 })), null);
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

test('the actual game enters, saves, resumes and leaves Koharu’s room', () => {
  const initial = { ...global.OkaeriChapters.create(4), episode: { chapter: 2, step: 0, route: null, complete: false }, scene: 'house', x: 19, y: 12 };
  const b = boot(initial);
  b.el('continueButton').onclick();
  b.el('interactButton').onclick();
  assert.equal(b.saved().scene, 'koharuRoom');
  assert.equal(b.el('locationName').textContent, 'コハルの部屋');
  const resumed = boot(JSON.parse(b.store.get('okaeri-forest-v1')));
  resumed.el('continueButton').onclick();
  assert.equal(resumed.el('locationName').textContent, 'コハルの部屋');
  resumed.el('interactButton').onclick();
  assert.equal(resumed.saved().scene, 'house');
  assert.equal(resumed.saved().x, 19);
  assert.equal(resumed.saved().y, 12);
  assert.equal(resumed.saved().episode.chapter, 2);
});

test('household interactions remain available with a chapter in progress', () => {
  const b = boot({ ...global.OkaeriChapters.create(4), episode: { chapter: 2, step: 0, route: null, complete: false }, scene: 'koharuRoom', x: 7, y: 5 });
  b.el('continueButton').onclick();
  b.el('interactButton').onclick();
  assert.match(b.el('dialogueText').textContent, /コハル/);
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
