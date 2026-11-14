(function (root) {
  'use strict';
  // 場面のBGM（base）と、物語が指定する曲（cue）を重ねて管理する。
  // cue が立っている間は cue が鳴り、解除すると場面の曲へ戻る。'silence' は無音の指定。
  const FILES = {
    opening: 'assets/music/title.ogg',
    village: 'assets/music/village.ogg',
    journey: 'assets/music/journey.ogg',
    battle: 'assets/music/battle.ogg',
    lake: 'assets/lake-letters.ogg',
    hearth: 'assets/beside-the-same-light.ogg',
    tension: 'assets/music/tension.ogg',
    tender: 'assets/music/tender.ogg',
    quiet: 'assets/music/quiet.ogg',
    festival: 'assets/music/festival.ogg',
    ending: 'assets/music/ending.ogg'
  };
  const JINGLES = { lit: 'assets/music/jingle-lit.ogg', night: 'assets/music/jingle-night.ogg' };
  const LEVELS = {
    opening: 0.42,
    village: 0.36,
    journey: 0.36,
    battle: 0.34,
    lake: 0.32,
    hearth: 0.32,
    tension: 0.38,
    tender: 0.46,
    quiet: 0.46,
    festival: 0.36,
    ending: 0.46
  };
  const TITLES = {
    opening: '「雪明かりの約束」',
    village: '「窓辺の護りの灯火」',
    journey: '「雪道の二重奏」',
    battle: '「灯りのステップ」',
    lake: '「湖面に届く手紙」',
    hearth: '「同じ灯りのそばで」',
    tension: '「薄氷」',
    tender: '「言葉にする帰り道」',
    quiet: '「冷めたスープ」',
    festival: '「護りの灯火祭り」',
    ending: '「おかえりの灯」',
    silence: '（無音）'
  };
  class Music {
    static sceneFor(scene) {
      return ['lake', 'lakeside'].includes(scene)
        ? 'lake'
        : ['house', 'koharuRoom', 'clinic', 'lampworkshop'].includes(scene)
          ? 'hearth'
          : scene === 'town'
            ? 'village'
            : 'journey';
    }
    static level(name) {
      return LEVELS[name] || 0;
    }
    static title(name) {
      return TITLES[name] || '';
    }
    constructor(make = src => new Audio(src), fadeMs = 1200) {
      this.make = make;
      this.tracks = {};
      for (const [name, src] of Object.entries(FILES)) {
        const a = make(src);
        a.loop = name !== 'ending';
        a.preload = ['opening', 'village', 'journey', 'hearth'].includes(name) ? 'metadata' : 'none';
        a.volume = 0;
        this.tracks[name] = a;
      }
      this.scene = 'opening';
      this.override = null;
      this.enabled = false;
      this.revision = 0;
      this.fadeMs = fadeMs;
      this.duck = 1;
    }
    get current() {
      return this.override || this.scene;
    }
    stop() {
      this.enabled = false;
      this.revision++;
      clearInterval(this.timer);
      for (const a of Object.values(this.tracks)) {
        a.pause();
        a.volume = 0;
      }
      if (this.one) {
        this.one.pause();
        this.one = null;
      }
    }
    async select(scene) {
      const previous = this.current;
      this.scene = scene;
      if (this.enabled && previous !== this.current) await this.play(previous);
    }
    // 物語からの指定。null で場面の曲へ戻る。
    async cue(name) {
      const previous = this.current;
      this.override = name || null;
      if (this.enabled && previous !== this.current) await this.play(previous, name === 'silence' ? Math.min(this.fadeMs, 700) : undefined);
    }
    async play(previousScene, fadeMs = this.fadeMs) {
      this.enabled = true;
      const revision = ++this.revision;
      clearInterval(this.timer);
      const name = this.current,
        target = this.tracks[name] || null;
      if (target) {
        if (name === 'ending' && previousScene !== 'ending')
          try {
            target.currentTime = 0;
          } catch {}
        try {
          await target.play();
        } catch (error) {
          if (revision === this.revision) this.stop();
          throw error;
        }
        if (revision !== this.revision) {
          if (!this.enabled || target !== this.tracks[this.current]) target.pause();
          return;
        }
        const previous = this.tracks[previousScene];
        if (
          previous &&
          !previous.paused &&
          ['lake', 'hearth'].includes(previousScene) &&
          ['lake', 'hearth'].includes(name) &&
          Number.isFinite(target.duration) &&
          target.duration > 0
        )
          target.currentTime = previous.currentTime % target.duration;
      }
      const starts = Object.values(this.tracks).map(a => [a, a.volume]);
      const start = Date.now(),
        goal = Music.level(name) * this.duck;
      const tick = () => {
        const p = fadeMs ? Math.min(1, (Date.now() - start) / fadeMs) : 1;
        for (const [a, v] of starts) a.volume = Math.max(0, Math.min(1, v + ((a === target ? goal : 0) - v) * p));
        if (p === 1) {
          clearInterval(this.timer);
          for (const [a] of starts) if (a !== target) a.pause();
        }
      };
      this.timer = setInterval(tick, 30);
      tick();
    }
    // 短いジングル。鳴っている間だけBGMを少し下げる。
    jingle(name) {
      if (!this.enabled || !JINGLES[name]) return;
      try {
        if (this.one) this.one.pause();
        const a = (this.one = this.make(JINGLES[name]));
        a.loop = false;
        a.volume = 0.55;
        const restore = () => {
          if (this.one !== a) return;
          this.one = null;
          this.duck = 1;
          const t = this.tracks[this.current];
          if (t && !t.paused) t.volume = Music.level(this.current);
        };
        this.duck = 0.45;
        const t = this.tracks[this.current];
        if (t && !t.paused) t.volume = Music.level(this.current) * this.duck;
        a.onended = restore;
        setTimeout(restore, 9000);
        const p = a.play();
        if (p && p.catch) p.catch(restore);
      } catch {}
    }
  }
  root.OkaeriMusic = Music;
  if (typeof module !== 'undefined') module.exports = Music;
})(typeof globalThis !== 'undefined' ? globalThis : this);
