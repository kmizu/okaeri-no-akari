(function (root) {
  'use strict';
  const shots = [
    {
      view: 'snow',
      label: '雪に閉ざされた土地',
      text: '山あいの町ユキネは、一年の半分を雪の中で過ごす。\n道は一晩で消える。昨日の足跡も、朝には残らない。',
      duration: 7500
    },
    {
      view: 'lights',
      label: '町へ続く灯り',
      text: 'だからこの町の人は、道の曲がり角ごとに灯りを置いた。\n雪の夜でも、家の方角だけは分かるように。',
      duration: 7000
    },
    {
      view: 'lights',
      label: '灯りの輪',
      text: '灯りには、もう一つ役目がある。火でつないだ灯りの輪は、山の魔獣を町へ寄せつけない。\nただし、芯と油は三日ともたない。誰かが毎日、継ぎ足して回る。',
      duration: 7500
    },
    {
      view: 'lights',
      label: '護りの灯火',
      text: '人はそれを「護りの灯火」と呼ぶ。\n外にいる者を導き、中にいる者を護る結界の火。',
      duration: 7000
    },
    {
      view: 'pair',
      label: 'トウマとニナ',
      text: 'その輪をつなぐのが、灯守（ひもり）。一人が火を見て、一人が刃を持つ。\nトウマとニナは、去年ようやく一人前になった。その後ろを、いつも一人、ついて歩く子がいる。',
      duration: 7500
    },
    { view: 'promise', label: 'いつもの朝', text: 'トウマ「帰ったら、何食う」\nニナ「まだ出かけてもないよ」', duration: 6000 },
    {
      view: 'promise',
      label: '帰る理由',
      text: 'ニナ「ゆうべのスープ、半分残してあるの。\n帰る理由は、多い方がいいでしょ」',
      duration: 7000
    },
    {
      view: 'home',
      label: '三人の帰る場所',
      text: '幼馴染のふたりと、二つ年下の妹分コハル。三人は、町はずれの古い家を直して暮らしている。\n誰と誰が恋人でもない。たぶん、まだ。',
      duration: 7500
    },
    { view: 'title', label: 'おかえりの灯', text: 'きみと灯して、いっしょに帰ろう。', title: 'おかえりの灯', duration: 8500 }
  ];
  // 映像は自動で最後まで流れる。操作は「スキップ」だけ。
  class OpeningFilm {
    static shots = shots;
    constructor() {
      this.active = false;
      this.timer = null;
    }
    play(done) {
      this.stopTimer();
      this.active = true;
      this.index = 0;
      this.done = done;
      document.getElementById('openingFilm').hidden = false;
      document.getElementById('skipOpening').onclick = () => this.finish();
      this.show();
    }
    stopTimer() {
      clearTimeout(this.timer);
      this.timer = null;
    }
    show() {
      this.stopTimer();
      const shot = shots[this.index],
        $ = id => document.getElementById(id);
      $('openingFilm').setAttribute('data-view', shot.view);
      $('openingFilm').setAttribute('data-beat', this.index % 2);
      $('filmText').textContent = shot.text;
      $('filmTitle').textContent = shot.title || '';
      $('filmTitle').hidden = !shot.title;
      this.timer = setTimeout(() => this.next(), shot.duration);
    }
    next() {
      if (!this.active) return;
      if (this.index + 1 < shots.length) {
        this.index++;
        this.show();
      } else this.finish();
    }
    finish() {
      if (!this.active) return;
      this.active = false;
      this.stopTimer();
      document.getElementById('openingFilm').hidden = true;
      const done = this.done;
      this.done = null;
      if (done) done();
    }
  }
  root.OkaeriOpeningFilm = OpeningFilm;
})(globalThis);
