(function (root) {
  'use strict';
  const D = root.OkaeriEpisodesData,
    S = root.OkaeriStory,
    C = root.OkaeriCore;
  const spawns = { town: [12, 10], forest: [5, 13], canal: [3, 12], hill: [4, 13], house: [12, 12], clinic: [12, 12] };
  // ['@名前'] の一行を、条件に合う台詞へ差し替える（合わなければ消す）。
  function expand(lines, slots) {
    return lines.flatMap(l => (l.length === 1 && typeof l[0] === 'string' && l[0][0] === '@' ? slots[l[0].slice(1)] || [] : [l]));
  }
  function slots(s) {
    const chapter = s.episode.chapter,
      m = s.memories || {},
      out = {};
    const echo = D.nightEchoes?.[chapter];
    if (echo && m[echo.key] === 'read') out.echo = echo.lines;
    if ([4, 10].includes(chapter)) out.gift = root.OkaeriActivities?.keepsake(s) || null;
    if (chapter === 6 && s.journey?.step === 9) out.journey = D.journeyEcho;
    if (chapter === 9) {
      out.festival = Object.entries(D.festivalEchoes || {}).flatMap(([key, extra]) =>
        key === 'journey' ? (s.journey?.step === 9 ? extra : []) : m[key] === 'read' ? extra : []
      );
    }
    if (chapter === 10 && m.unsentLetter === 'read') out.letter = D.finalEchoes[s.episode.route];
    if (chapter === 9) out.night = D.night9[C.route(s.episode.route)?.night || 'pair'];
    return out;
  }
  function events(s) {
    const chapter = s.episode.chapter,
      list = chapter === 10 ? D.routes[s.episode.route] || [] : D.episodes[chapter] || [],
      fill = slots(s);
    return list.map(e => ({ ...e, lines: expand(e.lines, fill) }));
  }
  function current(s) {
    return s.episode ? events(s)[s.episode.step] : null;
  }
  function create(chapter, route = null) {
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > 10 || (chapter === 10 && !D.routes[route]))
      throw Error('Unknown episode or route');
    const s = root.OkaeriChapters.create(chapter === 1 ? 1 : 4);
    s.episode = { chapter, step: 0, route: chapter === 10 ? route : null, complete: false };
    if (C.createRpg) s.rpg = C.createRpg(chapter);
    if (chapter >= 9) s.flags.festivalStarted = true;
    if (chapter === 10) setRoute(s, route);
    const e = current(s);
    if (e) {
      s.scene = e.scene;
      [s.x, s.y] = spawns[e.scene];
    }
    return s;
  }
  function setRoute(s, route) {
    s.episode.route = route;
    s.flags.festivalStarted = true;
    s.flags.festivalMeal = true;
    s.flags.festivalRibbon = true;
    for (const r of C.routes) if (r.flag) s.flags[r.flag] = r.id === route;
  }
  function title(s) {
    return '第' + s.episode.chapter + '話 · ' + D.titles[s.episode.chapter - 1];
  }
  function objective(s) {
    if (s.episode.complete)
      return s.episode.chapter === 10
        ? (['koharu', 'both'].includes(s.episode.route) ? '三人の明日へ。' : '二人の明日へ。') + '食卓で最後の一日を振り返れます。'
        : '今日の話はおしまい。食卓から翌日へ進めます。';
    const e = current(s);
    return e
      ? { town: '町', forest: '森', canal: '水路', hill: '丘', house: '三人の家', clinic: '診療所' }[e.scene] +
          '：' +
          e.label +
          (e.lead ? (e.solo ? '（操作：' : '（Qで') + (e.lead === 'nina' ? 'ニナ' : 'トウマ') + (e.solo ? '）' : 'に交代）') : '')
      : null;
  }
  function go(a, e) {
    if (e.solo) a.state.lead = e.lead;
    if (e.arrival) {
      a.scene(...e.arrival);
    } else if (a.state.scene !== e.scene) a.scene(e.scene, ...spawns[e.scene]);
    else a.refreshRoamers?.();
    a.save();
    a.updateHud();
  }
  function finishEvent(a) {
    const ep = a.state.episode;
    if (ep.chapter === 6 && ep.step === 2 && root.OkaeriJourney && a.state.journey?.step !== 9) {
      root.OkaeriJourney.begin(a);
      return;
    }
    ep.step++;
    if (ep.step === events(a.state).length) {
      ep.complete = true;
    }
    a.save();
    a.updateHud();
    if (ep.complete) endDay(a);
    else go(a, current(a.state));
  }
  function next(a) {
    const s = a.state,
      nextState = create(s.episode.chapter + 1, s.episode.route);
    nextState.courage = s.courage;
    nextState.flags = { ...s.flags, ...nextState.flags, ointmentGiven: true };
    nextState.ointments = Math.max(s.ointments || 0, 2);
    nextState.memories = { ...s.memories };
    if (s.rpg && C.rpgFullHeal) {
      nextState.rpg = JSON.parse(JSON.stringify(s.rpg));
      if (nextState.rpg.lv < (C.createRpg(nextState.episode.chapter)?.lv || 1))
        nextState.rpg.lv = C.createRpg(nextState.episode.chapter).lv;
      C.rpgFullHeal(nextState);
    }
    Object.assign(s, nextState);
    if (a.beginChapter) {
      a.beginChapter();
      return;
    }
    a.scene(s.scene, s.x, s.y);
    a.toast(title(s));
  }
  function endDay(a, afterEpilogue = false) {
    const s = a.state,
      ep = s.episode;
    const buttons = [['家で過ごす', a.closeModal, true]];
    const night = events(s).at(-1);
    if (night)
      buttons.push([
        '今夜の会話を振り返る',
        () => {
          a.closeModal();
          a.talk(night.lines);
        }
      ]);
    if (ep.chapter < 10)
      buttons.push([
        '翌日の話へ',
        () => {
          a.closeModal();
          next(a);
        }
      ]);
    else {
      const epi = D.epilogues?.[ep.route];
      if (epi)
        buttons.push([
          '後日譚「' + epi.title + '」を読む',
          () => {
            a.closeModal();
            epilogue(a);
          }
        ]);
      buttons.push([
        'この一日をもう一度',
        () => {
          a.closeModal();
          ep.step = 0;
          ep.complete = false;
          delete ep.heard9_2;
          s.lead = 'touma';
          a.save();
          if (a.beginChapter) a.beginChapter();
          else go(a, current(s));
        }
      ]);
    }
    a.openModal(
      (ep.chapter === 10 ? '<div class="ending-art"></div>' : '') +
        '<span class="tag">' +
        (ep.chapter === 10 ? 'おかえりの灯 · END' : '第' + ep.chapter + '話 · おしまい') +
        '</span><h2>' +
        D.titles[ep.chapter - 1] +
        '</h2><p>' +
        (ep.chapter === 10
          ? afterEpilogue
            ? '季節が巡っても、ユキネの道とこの家の戸口には、あたたかな護りの灯火がともり続けています。<br>遊んでくれて、ありがとうございました。'
            : '春になれば、ニナは南へ発ちます。そして三週間後、この家の戸口には護りの灯火がともっているはずです。<br>遊んでくれて、ありがとうございました。'
          : D.closings?.[ep.chapter] || '今日の出来事を家に置いて、明日へ。') +
        '</p>',
      buttons,
      'explore'
    );
  }
  // 後日譚。場面を順に流すだけ。進み具合は保存しない（何度でも最初から読める）。
  let playing = null;
  function epilogue(a) {
    const s = a.state,
      epi = D.epilogues?.[s.episode?.route];
    if (!epi || s.episode.chapter !== 10 || !s.episode.complete) return false;
    playing = s.episode.route;
    s.lead = 'touma';
    let i = 0;
    const step = () => {
      const p = epi.parts[i++];
      a.resetStage?.();
      if (!p) {
        playing = null;
        a.scene('house', 11, 11);
        endDay(a, true);
        return;
      }
      a.scene(p.scene, p.x, p.y);
      const firstCue = (root.OkaeriDirector?.normalize(p.lines[0])?.cue) || {},
        headCue = { fade: 'black' };
      for (const k of ['time', 'weather', 'bgm']) if (firstCue[k] !== undefined) headCue[k] = firstCue[k];
      a.talk(i === 1 ? [['', '後日譚　' + epi.title + '\n' + epi.lead, headCue], ...p.lines] : p.lines, step);
    };
    step();
    return true;
  }
  function choose(a) {
    const pick = r => {
      a.closeModal();
      a.talk(D.confessions[r], () => {
        setRoute(a.state, r);
        finishEvent(a);
      });
    };
    // コハルの話を聞いたあと、もう一度選ぶ。
    const answer = () =>
      a.openModal(
        '<h2>コハルに、どう答える</h2><p>どれを選んでも、三人の仲は壊れません。</p>',
        [
          [
            '三人でいる今を選ぶ',
            () => {
              a.closeModal();
              a.talk(D.koharuAnswers.koharu, () => {
                setRoute(a.state, 'koharu');
                finishEvent(a);
              });
            },
            true
          ],
          [
            '聞いたままにはしない。ニナにも全部話す',
            () => {
              a.closeModal();
              a.talk(D.koharuAnswers.both, () => {
                setRoute(a.state, 'both');
                finishEvent(a);
              });
            }
          ],
          [
            'コハルの気持ちに、応える',
            () => {
              a.closeModal();
              a.talk(D.koharuAnswers.love, () => {
                setRoute(a.state, 'koharuLove');
                finishEvent(a);
              });
            }
          ]
        ],
        'explore'
      );
    const seek = () => {
      a.closeModal();
      a.talk(D.confessions.koharu, answer);
    };
    a.openModal(
      '<h2>ニナに、伝えたいこと</h2><p>第10話は、この選択で過ごし方が変わります。</p>',
      [
        ['自分から好きだと伝える', () => pick('touma'), true],
        ['ニナの告白を受け止める', () => pick('nina')],
        ['今の二人の関係を選ぶ', () => pick('friends')],
        ['先に、姿の見えないコハルを探しに行く', seek],
        [
          'もう少し考える',
          () => {
            if (a.state.episode) a.state.episode.heard9_2 = true;
            a.closeModal();
          }
        ]
      ],
      'explore'
    );
  }
  function detour(s) {
    return D.detours?.[s.episode.chapter + ':' + s.episode.step];
  }
  function offerDetour(a, done) {
    const d = detour(a.state);
    if (!d || a.state.memories?.[d.key] === 'read') return false;
    a.openModal(
      '<span class="tag">帰り道の寄り道</span><h2>' + d.title + '</h2><p>' + d.hint + '</p>',
      [
        [
          '少し寄り道する',
          () => {
            a.closeModal();
            a.talk(d.lines, () => {
              a.state.memories = { ...a.state.memories, [d.key]: 'read' };
              done();
            });
          },
          true
        ],
        [
          '今日は用事の続きへ',
          () => {
            a.closeModal();
            done();
          }
        ]
      ],
      'explore'
    );
    return true;
  }
  function handle(id, a) {
    const s = a.state;
    if (!s.episode) return false;
    if (root.OkaeriJourney?.handle(id, a)) return true;
    if (s.episode.chapter === 1 && id === 'koharu') {
      a.talk(
        s.flags.lit
          ? (s.flags.ointmentBridge && D.chatter[1].koharuAfterOintment) || D.chatter[1].koharuAfter
          : D.chatter[1].koharu
      );
      return true;
    }
    if (s.episode.complete && id === 'homeTable') {
      endDay(a);
      return true;
    }
    if (s.episode.chapter === 1) {
      if (s.episode.complete && ['canalExit', 'hillExit', 'exit'].includes(id)) {
        a.talk([['touma', '今日の見回りはもう終わった。家の食卓で休んで、明日に備えよう。']]);
        return true;
      }
      if (id === 'ritsu' || id === 'yura') {
        const afterForest = !!(s.flags.lit || s.flags.returned);
        a.talk(
          id === 'ritsu'
            ? afterForest
              ? [
                  ['', '夕闇の広場東口で、青年が図面を畳みながら森の高台にともった灯台の火を見上げていた。'],
                  ['青年', '……北の灯台、いい光で入ったな。これで山の雪解け水を見回る時も心強い。', 'happy'],
                  ['touma', '水路の職人さんですか？　俺たちはこれから広場の掲示板へ戻るところです。また明日、改めて挨拶させてください。']
                ]
              : [
                  ['', '広場の東、共同水路へ続く道口で、旅慣れた外套の青年が石組みをのぞきこんでいる。\n図面を片手に、雪解け水の流量を測っているようだ。'],
                  ['nina', '……あれ、見慣れない外套だね。よその町から来た職人さんかな。'],
                  ['touma', '水路の点検中みたいだな。森の灯台から戻ったら、改めて声をかけよう。今は北の森が先だ。']
                ]
            : afterForest
              ? [
                  ['ユラ', 'おかえり、二人とも。顔色を見るかぎり、大きな怪我はなさそうだね。', 'happy'],
                  ['nina', 'はい！　コハルの凍傷の軟膏のおかげで、谷風の橋の上でも指先がちゃんと動きました。'],
                  ['ユラ', 'ふふ、あの子が聞いたら飛び上がって喜ぶよ。掲示板へ札を戻したら、今夜は温かいものを食べて早く休むんだよ。', 'happy']
                ]
              : [
                  ['', '薬草の甘い匂いが満ちる診療所。ユキネでただ一人の医師であり、コハルの師匠でもあるユラが、乳鉢の手を止めて顔を上げた。'],
                  ['ユラ', 'おや、二人とも。今日から森の灯台は、サエ抜きで二人きりだってね。三人の家を持ってから、ちゃんと朝ごはんは食べてるかい。'],
                  ['touma', '食べてきました。昼の包みパンも、ニナが作ってあります。'],
                  ['ユラ', 'よろしい。コハルが持たせた軟膏、遠慮せず使うんだよ。怪我をしてもしなくても、帰ったら顔を見せにおいで。', 'happy']
                ]
        );
        return true;
      }
      return false;
    }
    if (id === 'episodeEvent') {
      const e = current(s);
      if (!e || e.scene !== s.scene) return true;
      if (e.lead && s.lead !== e.lead) {
        a.toast((e.lead === 'nina' ? 'ニナ' : 'トウマ') + 'の出番です。Qで交代しよう。');
        return true;
      }
      if (root.OkaeriActivities?.run(a, e, () => finishEvent(a))) return true;
      // 戦闘つきの出来事。battleIntro があれば「導入 → 戦闘 → 本編」、なければ「本編 → 戦闘」の順。
      const fight = () => (a.startBattle ? a.startBattle(e.battle) : won(a));
      if (e.battleIntro) {
        a.talk(e.battleIntro, fight);
        return true;
      }
      if (e.choice && s.episode.heard9_2) {
        a.talk([['nina', '……ねえ、トウマ。この灯りの下で、少しだけ話していかない？', { bgm: 'tender' }]], () => choose(a));
        return true;
      }
      a.talk(e.lines, () => {
        if (e.choice) {
          choose(a);
          return;
        }
        if (e.battle) {
          fight();
          return;
        }
        if (offerDetour(a, () => finishEvent(a))) return;
        finishEvent(a);
      });
      return true;
    }
    // Ordinary household and clinic prop interactions remain available; old main-quest handlers cannot jump ahead.
    if (
      ['house', 'koharuRoom'].includes(s.scene) ||
      ['ourHome', 'clinicHerbs', 'clinicDesk', 'clinicBed', 'clinicWaiting', 'clinicStove'].includes(id)
    )
      return false;
    if (id === 'canalHome' && s.episode.chapter === 3 && s.episode.step >= 1 && s.episode.step <= 3) {
      a.toast('今は水路の救助が先だ！');
      return true;
    }
    if (s.episode.chapter === 9 && !s.episode.complete && ['exit', 'canalExit', 'hillExit'].includes(id)) {
      a.talk([['nina', '今夜は護りの灯火祭りだよ。広場のお店をゆっくり回ろう！', 'happy']]);
      return true;
    }
    if (!s.episode.complete && ['exit', 'canalExit', 'hillExit'].includes(id)) {
      if (s.episode.chapter === 3 && s.episode.step >= 4) {
        a.talk([['touma', '……今は外へ出る時じゃない。まっすぐ家へ帰って休もう。']]);
        return true;
      }
      if (s.episode.chapter === 4) {
        a.talk([['touma', '……ユラ先生から、外の雪道はまだ止められている。町の中の用事を済ませよう。']]);
        return true;
      }
    }
    const exits = {
      exit: ['forest', 5, 13],
      home: ['town', 12, 3],
      canalExit: ['canal', 3, 12],
      canalHome: ['town', 21, 9],
      hillExit: ['hill', 4, 13],
      hillHome: ['town', 2, 9],
      clinicDoor: ['clinic', 12, 12],
      clinicExit: ['town', 11, 13]
    };
    if (exits[id]) {
      a.scene(...exits[id]);
      return true;
    }
    const ninaGone =
      current(s)?.solo || (s.episode.chapter === 10 && C.route(s.episode.route)?.ninaAway && (s.episode.step === 2 || s.episode.complete));
    const strained = !s.episode.complete && (s.episode.chapter === 4 || (s.episode.chapter === 3 && s.episode.step >= 4));
    // 町の人や掲示板は、出来事の合間にいつでも話しかけられる。
    // 寄り道（針仕事帳・帰還札・白樺の待ち場）は、吹雪や不和や祭りの最中や一人行動時を除いて進められる。
    if (!ninaGone && !strained && ![8, 9].includes(s.episode.chapter) && root.OkaeriSideStories?.handle(id, a)) return true;
    const stepChat = D.chatterStep?.(s, id);
    const chat = stepChat || D.chatter?.[s.episode.chapter]?.[id] || (!ninaGone && !strained ? D.idle?.[id] : null);
    if (chat) {
      a.talk(chat);
      return true;
    }
    if (ninaGone) {
      a.talk([
        [
          current(s)?.solo ? s.lead : 'touma',
          s.episode.complete ? '今日の話は、家でゆっくり振り返ろう。' : '今は「' + current(s).label + '」が先だ。'
        ]
      ]);
      return true;
    }
    if (strained) {
      a.talk([['touma', '……今は「' + current(s).label + '」を片づけよう。']]);
      return true;
    }
    a.talk([
      ['nina', s.episode.complete ? '今日の話は、家でゆっくりしよう。' : '今は「' + current(s).label + '」だったね。'],
      ['touma', 'ああ。行こう。']
    ]);
    return true;
  }
  function won(a) {
    const e = current(a.state);
    if (!e?.battle) return false;
    if (e.battleIntro) {
      a.talk(e.lines, () => finishEvent(a));
      return true;
    }
    if (e.after) {
      a.talk(e.after, () => finishEvent(a));
      return true;
    }
    a.talk(
      [
        ['', '荒れていた角の光が、ゆっくり静まった。\n番人は灯台へ続く道をあけ、雪の上に伏せる。'],
        ['nina', 'ありがとう。あとは、私たちが届けるね。']
      ],
      () => finishEvent(a)
    );
    return true;
  }
  const originalObjects = S.activeObjects;
  S.activeObjects = function (s) {
    let list = originalObjects(s);
    const over = root.OkaeriDirector?.stage?.over || {};
    if (s.openingStage === 1 && s.scene === 'town') {
      return list.map(o => (o.id === 'sae' ? { ...o, x: 11, y: 8 } : o.id === 'bakery' ? { ...o, x: 9, y: 8 } : o));
    }
    if (!s.episode) return list;
    const ch = s.episode.chapter,
      st = s.episode.step,
      done = !!s.episode.complete;
    if (s.scene === 'town' && ((s.prologueStage !== undefined && ch === 2) || (!done && ch === 8 && (st === 0 || st === 5)))) {
      list = list.map(o => (o.id === 'sae' ? { ...o, x: 11, y: 8 } : o));
    }
    // 第8話のオルフは丘の小屋にいる（広場へ帰還するまで広場には立っていない）。水路出動中や森へ同行中のリツも広場から外す。
    if (s.scene === 'town' && ch === 8 && !done && st <= 4) list = list.filter(o => o.id !== 'orlf');
    if (s.scene === 'town' && ch === 8 && !done && st === 5)
      list = list.map(o => (o.id === 'orlf' ? { ...o, x: 10, y: 10 } : o));
    if (s.scene === 'town') {
      const ritsuAway =
        !done &&
        ((ch === 2 && st >= 1 && st <= 2) ||
          (ch === 3 && st <= 4) ||
          (ch === 8 && st >= 1 && st <= 4) ||
          (ch === 10 && s.episode.route === 'koharuLove' && st === 2));
      if (!ritsuAway) {
        const rx = !done && ch === 8 && (st === 0 || st === 5) ? 12 : 20,
          ry = !done && ch === 8 && (st === 0 || st === 5) ? 8 : 9;
        list = [...list, { id: 'ritsu', type: 'episodeNpc', x: rx, y: ry, label: '水番のリツ' }];
      }
      if (over.yura === 'town') list = [...list, { id: 'yura', type: 'episodeNpc', x: 12, y: 13, label: '医師のユラ' }];
      else if (!done && ((ch === 8 && (st === 0 || st === 5)) || ch === 9))
        list = [...list, { id: 'yura', type: 'episodeNpc', x: 9, y: ch === 8 ? 8 : 9, label: '医師のユラ' }];
    }
    if (s.scene === 'clinic') {
      const yuraInTown = over.yura === 'town' || (!done && (ch === 9 || (ch === 8 && (st === 0 || st === 5))));
      if (!yuraInTown) list = [...list, { id: 'yura', type: 'episodeNpc', x: 11, y: 7, label: '医師のユラ' }];
      if (!done && ch === 3 && st === 4) list = [...list, { id: 'ritsu', type: 'episodeNpc', x: 9, y: 8, label: '水番のリツ' }];
      if (!done && [4, 7].includes(ch) && !root.OkaeriDirector?.companion(s))
        list = [...list, { id: 'koharu', type: 'episodeNpc', x: 8, y: 6, label: ch >= 2 ? '薬の番のコハル' : '薬師見習いのコハル' }];
    }
    if (s.scene === 'house' && !done && ch === 10 && st === 0 && s.prologueStage === undefined && s.episode.route !== 'both') {
      const atSewing = s.episode.route === 'nina';
      list = [...list, { id: 'nina', type: 'episodeNpc', x: atSewing ? 17 : 10, y: atSewing ? 10 : 9, dir: 'down', label: 'ニナ' }];
    }
    if (s.scene === 'canal' && !done) {
      if ((ch === 2 && st >= 1 && st <= 2) || (ch === 3 && st <= 3))
        list = [...list, { id: 'ritsu', type: 'episodeNpc', x: 7, y: 8, label: '水番のリツ' }];
      if (ch === 3 && st >= 1 && st <= 3)
        list = [...list, { id: 'koharu', type: 'episodeNpc', x: 6, y: 9, label: '薬の番のコハル' }];
      if (ch === 3 && (st === 1 || st === 3)) list = [...list, { id: 'nina', type: 'episodeNpc', x: 14, y: 7, dir: 'left', label: '避難棚のニナ' }];
      if (ch === 3 && st === 2) list = [...list, { id: 'touma', type: 'episodeNpc', x: 7, y: 10, dir: 'right', label: '岸のトウマ' }];
    }
    if (s.scene === 'hill' && !done && ch === 8) {
      if ((st >= 2 && st <= 4) || over.ritsu === 'hill') list = [...list, { id: 'ritsu', type: 'episodeNpc', x: 7, y: 10, label: '水番のリツ' }];
      if (over.ritsu === 'summit') list = [...list, { id: 'ritsu', type: 'episodeNpc', x: 16, y: 6, label: '水番のリツ' }];
      if (over.yura === 'orlfSummit') list = [...list, { id: 'orlf', type: 'episodeNpc', x: 15, y: 6, label: '配達人のオルフ' }];
    }
    // コハルは診療所当番の日（第1・4・7話）は診療所内に、それ以外の非同行日は広場（祭り中盤はエルナの屋台脇）に立つ。
    if (
      s.scene === 'town' &&
      !playing &&
      !done &&
      !root.OkaeriDirector?.companion(s) &&
      ![4, 7].includes(ch) &&
      !(ch === 2 && st >= 1) &&
      !(ch === 3 && st < 4) &&
      !(ch === 8 && st >= 1) &&
      !(ch === 9 && st >= 2) &&
      !(ch === 10 && (!C.route(s.episode.route)?.koharu ? st >= 3 : st === 0))
    )
      list = [
        ...list,
        {
          id: 'koharu',
          type: 'episodeNpc',
          x: ch === 9 && st === 1 ? 8 : 13,
          y: ch === 9 && st === 1 ? 11 : 12,
          label: ch >= 2 ? '薬の番のコハル' : '薬師見習いのコハル'
        }
      ];
    const e = current(s);
    if (!done && !playing && e?.scene === s.scene) {
      const base = list.find(o => o.x === e.x && o.y === e.y);
      list = list.filter(o => o !== base);
      list.push({
        id: 'episodeEvent',
        type: 'episodeEvent',
        x: e.x,
        y: e.y,
        label: e.label,
        base,
        battle: e.battle || null,
        person: e.scene === 'town' && e.x === 20 && e.y === 9 ? 'リツ' : e.scene === 'clinic' && e.x === 11 && e.y === 7 ? 'ユラ' : e.lines[0][0]
      });
    }
    return list;
  };
  root.OkaeriEpisodes = {
    epilogue,
    playingEpilogue: () => playing,
    create,
    events,
    current,
    title,
    objective,
    handle,
    won,
    spawns,
    endDay,
    next,
    finishEvent,
    detour,
    expand
  };
})(globalThis);
