(function (root) {
  'use strict';
  const shots = [
    {
      view: 'snow',
      label: '雪に閉ざされた土地',
      text: 'ヒノワ王国の北のはずれ、険しい白嶺（しらね）の山懐に抱かれた小さな盆地の町ユキネ。\n一年の半分を深い雪の中で過ごし、道は一晩で消え、昨日の足跡も朝には残らない。',
      duration: 8000
    },
    {
      view: 'lights',
      label: '町へ続く灯り',
      text: '北は峠へ続く粉ひきの森、東は雪解け水を引く共同水路、西は集落へ抜ける風待ちの丘。\n町の人は吹雪の夜でも家の方角を見失わぬよう、道の曲がり角ごとに灯りを置いた。',
      duration: 7800
    },
    {
      view: 'lights',
      label: '灯りの輪',
      text: '灯りには、もう一つ命に関わる役目がある。火でつないだ「灯りの輪」は、北の山に棲む魔獣を町へ寄せつけない。\nただし、芯と油は三日ともたない。誰かが毎日、雪を踏んで火を継ぎ足して回る。',
      duration: 8000
    },
    {
      view: 'lights',
      label: '護りの灯火',
      text: '人はそれを「護りの灯火」と呼ぶ。\n外から帰る者に道を教え、町の中で眠る者を護る、雪国の命綱となる結界の火だ。',
      duration: 7200
    },
    {
      view: 'pair',
      label: 'トウマとニナ',
      text: 'その輪をつなぐ役目が「灯守（ひもり）」。一人が灯術の火を扱い、一人が護りの剣を持つ。\n幼馴染のトウマとニナは、去年ようやく一人前になったばかり。その後ろを、いつも小さな薬師見習いがついて歩く。',
      duration: 8000
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
      text: '同じ雪の夜に親を亡くし、町の人に育てられたトウマとニナ。そして二人を兄と姉のように慕う少し年下のコハル。\n町はずれの古い空き家を直して暮らす三人は、兄妹でもなければ、まだ誰と誰が恋人でもない。',
      duration: 8200
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
