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
