(function () {
  'use strict';
  const C = OkaeriCore,
    S = OkaeriStory,
    W = OkaeriWorld,
    D = OkaeriDirector,
    Sfx = globalThis.OkaeriSfx,
    $ = id => document.getElementById(id);
  const normalSaveKey = 'okaeri-forest-v1',
    chapterSaveKey = 'okaeri-chapter-v1';
  let saveKey = normalSaveKey;
  const canvas = $('world'),
    renderer = new W.Renderer(canvas);
  const fresh = () =>
    globalThis.OkaeriEpisodes
      ? OkaeriEpisodes.create(1)
      : { version: 1, scene: 'town', x: 12, y: 10, lead: 'touma', flags: {}, courage: 0 };
  let state = fresh(),
    mode = 'title',
    queue = [],
    afterTalk = null,
    queueIndex = 0,
    battle = null,
    commands = {},
    order = ['touma', 'nina'],
    battleOrigin = null,
    modalReturn = 'explore',
    route = [],
    routeTarget = null,
    lastMove = 0,
    held = {},
    sound = false,
    audio = null,
    bgm = new OkaeriMusic();
  let openingFilm = null,
    typing = null,
    talkSerial = 0;
  const name = id => (id === 'touma' ? 'トウマ' : id === 'nina' ? 'ニナ' : id);
  const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  let saved = null;
  try {
    saved = C.restoreSave(localStorage.getItem(saveKey));
  } catch {}
  $('continueButton').hidden = !saved;
  function save() {
    try {
      globalThis.OkaeriJourney?.capture(state);
      localStorage.setItem(saveKey, JSON.stringify(state));
      if (saveKey === normalSaveKey) saved = C.restoreSave(JSON.stringify(state));
      $('saveStatus').textContent = saveKey === normalSaveKey ? 'この端末に保存しました' : '章選択の旅を保存しました（通常の旅は保持）';
    } catch {
      $('saveStatus').textContent = '保存できません。終了すると進行が失われます';
    }
  }
  function gainItem(kind) {
    if (kind === 'ointmentOpening') {
      if (state.flags.ointmentGiven) return;
      state.flags.ointmentGiven = true;
      state.ointments = Math.min(4, (state.ointments || 0) + 2);
      save();
      updateHud();
      toast('持ち物に「凍傷の軟膏 ×2」が入った');
    } else if (kind === 'ointmentTopUp') {
      state.flags.ointmentGiven = true;
      if ((state.ointments || 0) < 2) {
        state.ointments = 2;
        save();
        updateHud();
        toast('持ち物の「凍傷の軟膏」を2個に補充してもらった');
      }
    }
  }
  function toast(text) {
    $('toast').textContent = text;
    $('toast').hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => ($('toast').hidden = true), 2600);
  }
  function updateHud() {
    $('locationName').textContent =
      state.scene === 'koharuRoom'
        ? 'コハルの部屋'
        : state.scene === 'clinic'
          ? 'ユラの診療所'
          : state.scene === 'house'
            ? '三人の家'
            : state.scene === 'town'
              ? '雪の町 ユキネ'
              : state.scene === 'canal'
                ? '雪解けの共同水路'
                : state.scene === 'hill'
                  ? '風待ちの丘'
                  : '粉ひきの森';
    $('weather').textContent =
      ['house', 'koharuRoom', 'clinic'].includes(state.scene)
        ? '薪の灯り / 室内'
        : state.flags.festivalStarted
          ? '護りの灯火祭り / 夜'
          : state.flags.hillStarted
            ? '祭りの日 / 夕暮れ'
            : state.flags.lit
              ? '冬の終わり / 夕暮れ'
              : '冬の終わり / 午前';
    $('chapter').textContent = state.flags.festivalStarted
      ? '最終話 · 護りの灯火祭り'
      : state.flags.hillStarted
        ? '第三話 · 風待ちの丘'
        : state.flags.canalStarted
          ? '第二話 · 水音の帰る道'
          : '第一話 · 護りの灯火の日';
    if (state.episode) {
      const a = D.ambient(state),
        clock = { morning: '朝', day: '日中', dusk: '夕暮れ', night: '夜' }[a.time];
      $('chapter').textContent = OkaeriEpisodes.title(state);
      $('weather').textContent = a.indoors
        ? '薪の灯り / ' + clock
        : state.episode.chapter === 9
          ? '護りの灯火祭り / 夜'
          : (a.weather === 'blizzard' ? '吹雪' : state.episode.chapter === 10 ? '祭りの翌日' : '冬の終わり') + ' / ' + clock;
    }
    $('objectiveText').textContent = (state.episode && OkaeriEpisodes.objective(state)) || S.objective(state);
    $('leadText').textContent = name(state.lead) + 'が先頭';
    $('leadDot').style.background = state.lead === 'touma' ? '#77b8b6' : '#cb8267';
    const oint = state.ointments || 0,
      hasOint = oint > 0;
    $('bagText').textContent = state.flags.ointmentGiven || oint > 0 ? '持ち物 · 凍傷の軟膏 ×' + oint : '持ち物';
    if (hasOint) $('bagButton').classList.add('has-item');
    else $('bagButton').classList.remove('has-item');
    if (globalThis.OkaeriField?.names[state.scene]) {
      $('locationName').textContent = OkaeriField.names[state.scene];
    }
    if (globalThis.OkaeriJourney?.names[state.scene]) {
      $('locationName').textContent = OkaeriJourney.names[state.scene];
      $('weather').textContent = state.scene === 'lampworkshop' ? '小屋の火 / 湖を望む窓' : '氷湖の迎え灯 / 湖岸の風';
    }
    if (globalThis.OkaeriJourney?.active(state)) {
      $('objectiveText').textContent = OkaeriJourney.objective(state);
      if (OkaeriJourney.split(state)) $('leadText').textContent = name(state.lead) + 'を操作中';
    }
    if (state.openingStage !== undefined) $('objectiveText').textContent = S.opening[state.openingStage].objective;
    if (state.prologueStage !== undefined) {
      const p = getPrologueParts()?.[state.prologueStage];
      if (p?.objective) $('objectiveText').textContent = p.objective;
    }
    const way = D.guide?.(state);
    if (way?.via && mode === 'explore') $('objectiveText').textContent += '　▶ まず「' + way.via + '」';
    const o = nearest();
    $('interactPrompt').hidden = !o || mode !== 'explore';
    if (o) $('interactPrompt').textContent = 'E　' + o.label;
    refreshStage();
  }
  // 時間帯・天気・環境音・場面の曲を、いまの進行から決め直す。
  function refreshStage() {
    const a = D.ambient(state);
    D.setBase(a);
    Sfx?.ambient(mode === 'title' ? null : mode === 'battle' ? null : a.bed);
    if (mode === 'explore' && state.openingStage === undefined && state.prologueStage === undefined) travelMusic();
  }
  function rpgTabsHtml(active) {
    const oint = state.ointments || 0,
      hasOint = state.flags.ointmentGiven || oint > 0,
      tabs = [
        ['menu', 'メニュー'],
        ['bag', '持ち物' + (hasOint ? ' <small>×' + oint + '</small>' : '')],
        ['journal', '旅の手帳'],
        ['map', '地図']
      ];
    if (Stills?.gallery) tabs.push(['gallery', '思い出の絵']);
    return (
      '<div class="rpg-tabs" role="tablist" aria-label="旅のメニュー切り替え">' +
      tabs
        .map(
          ([id, label]) =>
            '<button type="button" role="tab" aria-selected="' +
            (id === active) +
            '" class="rpg-tab' +
            (id === active ? ' is-active' : '') +
            '" data-menu-tab="' +
            id +
            '">' +
            label +
            '</button>'
        )
        .join('') +
      '</div>'
    );
  }
  function openModal(html, buttons, returnMode = mode) {
    Sfx?.play('page');
    $('toast').hidden = true;
    clearTimeout(toast.timer);
    modalReturn = returnMode;
    mode = 'modal';
    held = {};
    route = [];
    $('modalContent').innerHTML = html + '<div class="actions" id="modalActions"></div>';
    for (const [label, fn, primary] of buttons) {
      const b = document.createElement('button');
      b.textContent = label;
      if (primary) b.className = 'primary';
      b.onclick = () => {
        Sfx?.play('confirm');
        fn();
      };
      $('modalActions').append(b);
    }
    for (const tabBtn of $('modalContent').querySelectorAll?.('[data-menu-tab]') || []) {
      tabBtn.onclick = () => {
        const target = tabBtn.dataset.menuTab;
        if (tabBtn.getAttribute('aria-selected') === 'true') return;
        Sfx?.play('cursor');
        closeModal();
        if (target === 'menu') menu();
        else if (target === 'bag') openBag();
        else if (target === 'journal') journal();
        else if (target === 'map') showMap();
        else if (target === 'gallery')
          Stills?.gallery((gHtml, gBtns) => openModal(rpgTabsHtml('gallery') + gHtml, gBtns, 'explore'), closeModal);
      };
    }
    $('modal').hidden = false;
  }
  function closeModal() {
    $('modalContent').parentElement?.classList.remove('map-card');
    $('modal').hidden = true;
    mode = modalReturn;
    canvas.focus();
    updateHud();
  }
  function talk(lines, done) {
    held = {};
    route = [];
    queue = lines.map(D.normalize);
    queueIndex = 0;
    afterTalk = done;
    talkSerial++;
    mode = 'dialogue';
    $('dialogue').hidden = false;
    showLine();
    updateHud();
  }
  const koharuFaces = { happy: 1, joy: 1, shy: 2, fluster: 2, love: 2, angry: 3, sad: 4 },
    Stills = globalThis.OkaeriStills;
  const faceIds = {
    コハル: 'koharu',
    touma: 'touma',
    nina: 'nina',
    サエ: 'sae',
    マロ: 'maro',
    エルナ: 'elna',
    オルフ: 'orlf',
    リツ: 'ritsu',
    ユラ: 'yura'
  };
  function showLine() {
    const q = queue[queueIndex],
      speaker = q.speaker,
      moodName = q.mood || S.faceCues[q.text] || 'neutral',
      faceId = faceIds[speaker],
      cue = q.cue || {};
    // コハルは「ふくれ顔」「泣きそう」の絵を持つので、その二つは記号を重ねない。
    let m = D.mood(moodName);
    if (faceId === 'koharu' && ['angry', 'sad'].includes(moodName)) m = { face: m.face };
    $('dialogue').className = 'dialogue' + (speaker ? '' : ' narration') + (m.tone ? ' tone-' + m.tone : '');
    $('speaker').textContent = speaker ? name(speaker) : '';
    $('dialogueText').textContent = q.text;
    $('portrait').className = 'portrait ' + (faceId ? faceId + ' ' + m.face : 'other');
    $('portrait').style.setProperty?.('--k', faceId === 'koharu' ? koharuFaces[moodName] || 0 : 0);
    $('portrait').setAttribute(
      'aria-label',
      speaker ? name(speaker) + 'の表情：' + { neutral: '通常', happy: '笑顔', shy: '照れ' }[m.face] : '語り'
    );
    $('portrait').textContent = faceId ? '' : speaker ? speaker.slice(0, 2) : '';
    $('portraitMark').innerHTML = speaker && m.mark ? D.markSvg(m.mark) : '';
    $('portraitMark').hidden = !(speaker && m.mark);
    $('choices').replaceChildren();
    $('nextDialogue').hidden = !!q.choices;
    if (q.choices)
      for (const [label, action] of q.choices) {
        const b = document.createElement('button');
        b.textContent = label;
        b.onclick = () => {
          finishTyping();
          Sfx?.play('confirm');
          if (action) action();
          nextDialogue();
        };
        $('choices').append(b);
      }
    // きっかけ: 画面は Director、音はここで鳴らす。
    D.apply(cue, speaker);
    if (m.mark && speaker && !cue.emote) D.emote(speaker, m.mark);
    if (cue.bgm !== undefined) musicCue(cue.bgm);
    if (cue.still !== undefined) Stills?.show(cue.still);
    if (cue.intro !== undefined) Stills?.intro(cue.intro);
    if (cue.diagram !== undefined) Stills?.diagram?.(cue.diagram);
    if (cue.item) gainItem(cue.item);
    if (cue.jingle) bgm.jingle?.(cue.jingle);
    for (const se of [].concat(cue.se || [])) Sfx?.play(se);
    if (m.mark && speaker) Sfx?.play('pop');
    typing = {
      text: q.text,
      shown: 0,
      acc: -(cue.wait || 0),
      started: false,
      done: false,
      slow: cue.slow || 1,
      voice: !speaker ? null : speaker === 'touma' ? 'blipTouma' : speaker === 'nina' ? 'blipNina' : 'blipOther'
    };
  }
  // 文字送り。描画ループから呼ばれる（描画が回らない環境では、最初から全文が出ている）。
  function typeTick(t) {
    const ty = typing;
    if (!ty || ty.done || mode !== 'dialogue') return;
    if (!ty.started) {
      ty.started = true;
      ty.last = t;
      if (D.reduced() || !ty.text) {
        finishTyping();
        return;
      }
      ty.a = document.createElement('span');
      ty.b = document.createElement('span');
      ty.b.className = 'untyped';
      ty.b.textContent = ty.text;
      $('dialogueText').replaceChildren(ty.a, ty.b);
      $('dialogue').classList.add('typing');
    }
    ty.acc += Math.min(120, t - ty.last);
    ty.last = t;
    let changed = false;
    while (ty.shown < ty.text.length) {
      const cost = ty.shown ? D.charCost(ty.text[ty.shown - 1], ty.slow) : 0;
      if (ty.acc < cost) break;
      ty.acc -= cost;
      ty.shown++;
      changed = true;
      if (ty.voice && ty.shown % 3 === 1 && !' 　…、。！？\n'.includes(ty.text[ty.shown - 1])) Sfx?.play(ty.voice);
    }
    if (changed) {
      ty.a.textContent = ty.text.slice(0, ty.shown);
      ty.b.textContent = ty.text.slice(ty.shown);
    }
    if (ty.shown >= ty.text.length) finishTyping();
  }
  function finishTyping() {
    if (!typing || typing.done) return;
    typing.done = true;
    if (typing.started) {
      $('dialogueText').textContent = typing.text;
      $('dialogue').classList.remove('typing');
    }
  }
  function nextDialogue() {
    if (mode !== 'dialogue') return;
    if (typing && typing.started && !typing.done) {
      finishTyping();
      return;
    }
    queueIndex++;
    if (queueIndex < queue.length) {
      showLine();
      return;
    }
    $('dialogue').hidden = true;
    mode = 'explore';
    typing = null;
    const serial = talkSerial;
    let done = afterTalk;
    afterTalk = null;
    if (done) done();
    // 続けて次の会話が始まっていなければ、会話中だけの演出（時間帯・曲の指定）を解く。
    if (serial === talkSerial) {
      D.clearOverrides();
      Stills?.hide();
      Stills?.intro(null);
      Stills?.diagram?.(null);
      updateHud();
      musicCue(null);
    }
  }
  let chapterCardTimer = null,
    chapterCardFadeTimer = null;
  function hideChapterCard() {
    clearTimeout(chapterCardTimer);
    clearTimeout(chapterCardFadeTimer);
    chapterCardTimer = null;
    chapterCardFadeTimer = null;
    const card = $('chapterCard');
    if (!card || card.hidden) return;
    card.classList.remove('is-fading');
    card.hidden = true;
  }
  function showChapterCard(chapter, routeId) {
    const card = $('chapterCard');
    if (!card || !globalThis.OkaeriEpisodesData) return;
    hideChapterCard();
    const title = OkaeriEpisodesData.titles?.[chapter - 1] || '',
      subs = OkaeriEpisodesData.subtitles || {},
      sub = (chapter === 10 && subs['10:' + routeId]) || subs[chapter] || '';
    $('chapterCardEyebrow').textContent = 'CHAPTER ' + String(chapter).padStart(2, '0');
    $('chapterCardTitle').textContent = '第' + chapter + '話 — ' + title;
    $('chapterCardSub').textContent = sub;
    card.classList.remove('is-fading');
    card.hidden = false;
    if ($('toast')) $('toast').hidden = true;
    Sfx?.play('chime');
    if (D.reduced()) {
      chapterCardTimer = setTimeout(hideChapterCard, 1500);
    } else {
      chapterCardTimer = setTimeout(() => {
        card.classList.add('is-fading');
        chapterCardFadeTimer = setTimeout(hideChapterCard, 560);
      }, 2200);
    }
  }
  function getPrologueParts(s = state) {
    const ep = s.episode,
      P = globalThis.OkaeriEpisodesData?.prologues;
    if (!ep || !P || ep.chapter < 2) return null;
    return (ep.chapter === 10 && P['10:' + ep.route]) || P[ep.chapter] || null;
  }
  function playEpisodePrologue(step = 0, withCard = false) {
    const parts = getPrologueParts();
    if (!parts || !parts[step]) {
      delete state.prologueStage;
      if (withCard && state.episode?.chapter >= 2) showChapterCard(state.episode.chapter, state.episode.route);
      const e = globalThis.OkaeriEpisodes?.current(state);
      if (e) scene(e.scene, ...OkaeriEpisodes.spawns[e.scene]);
      save();
      travelMusic();
      updateHud();
      return;
    }
    const part = parts[step];
    state.prologueStage = step;
    scene(part.scene, part.x, part.y);
    if (part.bgm) setMusic(part.bgm);
    else travelMusic();
    if (withCard && step === 0) showChapterCard(state.episode.chapter, state.episode.route);
    talk(part.lines, () => {
      if (step + 1 < parts.length) {
        playEpisodePrologue(step + 1, false);
        return;
      }
      delete state.prologueStage;
      const e = globalThis.OkaeriEpisodes?.current(state),
        dest = part.afterScene || (e ? [e.scene, ...OkaeriEpisodes.spawns[e.scene]] : null);
      if (dest && (dest[0] !== state.scene || dest[1] !== state.x || dest[2] !== state.y)) scene(...dest);
      else renderer.reset(state);
      save();
      travelMusic();
      updateHud();
      if (part.toast) toast(part.toast);
      else if (state.episode) toast(OkaeriEpisodes.title(state));
    });
  }
  function playOpening(step = 0) {
    const part = S.opening[step];
    state.openingStage = step;
    scene(part.scene, part.x, part.y);
    setMusic('opening');
    talk(part.lines, () => {
      if (step + 1 < S.opening.length) playOpening(step + 1);
      else {
        delete state.openingStage;
        save();
        travelMusic();
        updateHud();
        toast('まずは広場の出発札へ。マロの店ではお弁当も受け取れます。');
      }
    });
  }
  function playPrelude() {
    state.openingPrelude = true;
    state.openingStage = 0;
    scene('house', 12, 7);
    mode = 'opening';
    held = {};
    route = [];
    setMusic('opening');
    $('hud').hidden = true;
    $('controls').hidden = true;
    $('journalButton').disabled = true;
    $('menuButton').disabled = true;
    openingFilm = new OkaeriOpeningFilm();
    openingFilm.play(() => {
      delete state.openingPrelude;
      $('controls').hidden = false;
      $('journalButton').disabled = false;
      $('menuButton').disabled = false;
      $('hud').hidden = false;
      playOpening(0);
      canvas.focus();
    });
  }
  function start(s, fromSave, key = normalSaveKey) {
    saveKey = key;
    state = s;
    mode = 'explore';
    hideChapterCard();
    $('titleScreen').hidden = true;
    $('hud').hidden = false;
    $('modal').hidden = true;
    $('battleScreen').hidden = true;
    $('dialogue').hidden = true;
    $('openingFilm').hidden = true;
    renderer.reset(state);
    updateHud();
    canvas.focus();
    if (state.openingPrelude) playPrelude();
    else if (state.openingStage !== undefined) playOpening(state.openingStage);
    else if (state.prologueStage !== undefined) playEpisodePrologue(state.prologueStage, false);
    else if (!fromSave) {
      if (globalThis.OkaeriOpeningFilm) playPrelude();
      else if (S.opening) playOpening();
      else {
        setMusic('opening');
        talk(S.intro, () => {
          save();
          setMusic('village');
        });
      }
    } else {
      travelMusic();
      if (state.pendingEvening) evening(state.pendingEvening);
      else toast('旅を再開しました');
    }
  }
  function nearest() {
    return S.activeObjects(state)
      .map(o => ({ o, d: Math.hypot(o.x - state.x, o.y - state.y) }))
      .filter(p => p.d < 1.65)
      .sort((a, b) => a.d - b.d)[0]?.o;
  }
  function switchLead() {
    if (mode !== 'explore') return;
    if (globalThis.OkaeriJourney?.switchActor(episodeApi())) return;
    if (state.episode && OkaeriEpisodes.current(state)?.solo) {
      toast('今は' + (state.lead === 'nina' ? '避難棚にいるニナ' : '岸にいるトウマ') + 'を操作しています。画面の目的を進めよう。');
      return;
    }
    state.lead = state.lead === 'touma' ? 'nina' : 'touma';
    updateHud();
    save();
    Sfx?.play('swap');
  }
  function scene(next, x, y) {
    const indoor = s => ['house', 'koharuRoom', 'clinic', 'lampworkshop'].includes(s);
    const door = next !== state.scene && (indoor(next) || indoor(state.scene));
    if (next !== state.scene) {
      D.fade('black');
      if (door) Sfx?.play('door');
    }
    state.scene = next;
    travelMusic();
    state.x = x;
    state.y = y;
    renderer.reset(state);
    route = [];
    save();
    updateHud();
  }
  function interact() {
    if (mode === 'dialogue') {
      if (!queue[queueIndex].choices) nextDialogue();
      return;
    }
    if (mode !== 'explore') return;
    const o = nearest();
    if (!o) {
      toast('気になるものに近づいて、調べてみよう');
      return;
    }
    handle(o.id);
  }
  function episodeApi() {
    return {
      state,
      talk,
      save,
      updateHud,
      toast,
      scene,
      openModal,
      closeModal,
      startBattle,
      beginChapter: () => playEpisodePrologue(0, true),
      jingle: n => bgm.jingle?.(n),
      sfx: n => Sfx?.play(n)
    };
  }
  function handle(id) {
    const f = state.flags;
    if (globalThis.OkaeriField?.handle(id, episodeApi())) return;
    if (state.episode && OkaeriEpisodes.handle(id, episodeApi())) return;
    if (handleHouse(id)) return;
    if (OkaeriSideStories.handle(id, { state, talk, save, updateHud, toast, openModal, closeModal })) return;
    if (['elna', 'orlf'].includes(id)) {
      talk(S.residentLines(state, id));
      return;
    }
    if (OkaeriHill.handle(id, { state, talk, save, toast, scene, openModal, closeModal, updateHud, startBattle, evening })) return;
    if (OkaeriCanal.handle(id, { state, talk, save, toast, scene, openModal, closeModal, updateHud, startBattle, evening })) return;
    if (id === 'board') {
      if (f.returned) {
        talk([
          ['', '二枚の出発札は、並んで「町」の欄に戻っている。'],
          ['nina', f.waterReturned ? '今日も、二枚とも戻せたね。' : '明日の朝、もう一度この板の前へ来るんだよね。サエさんがユラ先生に相談するって言ってたし。']
        ]);
        return;
      }
      if (f.lit) {
        f.returned = true;
        save();
        talk(
          [
            ['', '広場へ戻ったトウマとニナは、二枚並んだ木札を「森」の欄から外した。'],
            ['サエ', 'おかえり。森の灯台の火、この広場からもはっきり見えたよ。', 'happy'],
            ['touma', 'ただいま戻りました。道をふさいでいた倒木をどかし、灯りの橋の導火線をつなぎ直して、灯台に火を継ぎました。'],
            ['サエ', '道中の精霊たちはどうだったい。'],
            ['nina', 'こごえモチと、氷をかぶったヤドカリがいました。それから灯台の前に、鳥の巣を守っていた枝角の番人も。みんな灯りで温めたら、静かに森へ帰っていきました。'],
            ['サエ', '手はどうだい。雪風で冷やしすぎていないかい。'],
            [
              'nina',
              f.ointmentBridge
                ? '谷の橋の上で一度、強い風で指がすっかりかじかんで動かなくなって……。コハルにもらった凍傷の軟膏を塗って、トウマに柱を支えて待ってもらいながら締め直しました。'
                : '谷の橋の上で一度、強い風で指がすっかりかじかんで動かなくなって……。トウマに柱を支えて待ってもらいながら、息で温めて締め直しました。'
            ],
            [
              'サエ',
              '焦らず待てた判断は上出来だ。……だが、雪道で凍傷になりかけたり、かじかんで指が動かなくなるのは見過ごせない問題だね。'
            ],
            [
              'サエ',
              '細かい留め金や火口を扱う灯守にとって、凍傷で指先が利かなくなるのは命取りになりかねない。剣の番と火の番のほかに、道中で凍傷や怪我の手当てができる「薬師」を一人つけた方がいい。'
            ],
            ['touma', '薬師を、俺たちの組にですか？'],
            [
              'サエ',
              'ああ。昔、私が現役で山を回っていた頃も、薬の番が一緒だったんだよ。今夜のうちに診療所のユラへ相談してくるから、明日の朝、もう一度ここへ顔を出しな。'
            ],
            ['', 'サエは二枚の名札を「町」の欄へ掛け直し、わずかに傾いていた方を指先でまっすぐに整えた。\nそれからしばらく、夕闇の降り始めた北の森の方角を見上げていた。'],
            ['サエ', '……いい火だ。', { wait: 600 }],
            [
              'マロ',
              'おかえりー！　粉ひき小屋の荷車、ついさっき無事に着いたよ！　灯台の火が見えたおかげで分かれ道も迷わなかったって。ほら、焼きたてのパン、まずは食べてって！',
              'happy',
              { se: 'cheer' }
            ],
            ['nina', '……いい匂い。朝からこれを楽しみに歩いてたんだ。', 'happy'],
            ['touma', 'お前、灯台の前でも腹が減ったって言ってたな。'],
            ['nina', '言ったよ。帰り道の焼きたては別腹だもん。', 'joy'],
            ['', '雪で濡れた外套をパン屋の軒先に掛け、二人並んであつあつのパンをかじる。\n谷風で冷えきっていた指先まで、じんわりと温かさが戻っていった。']
          ],
          () => evening('one')
        );
        return;
      }
      if (f.board) {
        talk([
          ['nina', '私たちの名札、ちゃんと「森」の欄に二枚並んでるね。夕方には自分の手で戻しに来よう。'],
          ['touma', 'ああ。広場の北の道から、粉ひきの森へ向かおう。']
        ]);
        return;
      }
      talk(
        [
          ['', '広場の中央に立つ木製の掲示板。その下半分は、ユキネ独自の「出発札」の板になっている。\n森・水路・丘・街道と行き先ごとに欄が区切られ、町の外へ出る者は必ず自分の名札を行き先へ掛けてから出発する決まりだ。'],
          ['', 'そうしておけば、急に吹雪が来た時でも、誰がどの道にまだ残っているか町じゅうの者がすぐに分かる。\nトウマとニナは、「トウマ」「ニナ」と彫られた二枚の木札を、「森」の欄に並べて掛けた。', { se: 'knock' }],
          ['nina', '去年まではいつも、サエさんの札の横に並べて掛けてたね。'],
          ['touma', 'ああ。今日からは、この二枚だけだ。'],
          ['', 'よく見ると、ニナの木札だけ右下の角が少し欠けて丸くなっている。'],
          ['nina', 'これ、まだ背が届かなかった子どもの頃、どうしても自分で掛けたくて背伸びして落とした跡だ。'],
          ['touma', '踏み台を持ってくるから待てって言ったのに、お前が板の柱によじ登るからだ。'],
          ['nina', 'だってトウマ、「落ちたら下で受け止める」って言ったじゃない。'],
          ['touma', '……木の札じゃなくて、お前をな。'],
          ['nina', '……。', 'shy'],
          ['nina', 'さ、行こっか。日が暮れる前に、ちゃんとこの手で札を戻しに来ようね。'],
          ['touma', 'ああ。二枚そろってな。']
        ],
        () => {
          f.board = true;
          save();
          updateHud();
          toast('行き先を出発札に記録した。北の道から粉ひきの森へ。');
        }
      );
      return;
    }
    if (id === 'sae') {
      talk(
        [
          ['サエ', '灯守の仕事は、火をつけて終わりじゃない。自分が帰ってくるまでが仕事だよ。'],
          ['サエ', '倒木や足場はトウマ、灯りの仕掛けはニナ。得意な方が先頭に立つこと。'],
          ['nina', '風が強くなったら、森の休憩小屋で待ちます。'],
          ['サエ', 'それでいい。急ぐのと無茶をするのは別だからね。休んだことも、引き返したことも、帰ったら全部報告するんだよ。'],
          ['touma', 'はい。札を戻す時に。'],
          ['サエ', 'うん。……二人の話を聞くのを、楽しみにしてる。']
        ],
        () => {
          f.sae = true;
          save();
        }
      );
      return;
    }
    if (id === 'bakery') {
      if (f.bread) {
        talk([['マロ', '夕方の焼き上がりを、一つ遅らせとくからね。二人とも、ちゃんと帰っておいで！', 'happy']]);
        return;
      }
      talk(
        [
          ['マロ', 'はい、お弁当のおまけ！　森の灯台まで行くんでしょ。小屋で食べな。', 'happy'],
          ['', '紙包みの中には、干しりんごの焼き菓子が二つ入っていた。', { se: 'item' }],
          ['touma', '干しりんごのやつだ。ニナ、毎年これを買ってるよな。今年はまだ食べてないだろ。'],
          ['nina', '……覚えてたんだ。去年は、最後の一個をトウマにあげたんだよね。', 'shy'],
          ['touma', '半分にしようって言う前に、手に置かれた。あげるのを迷ってた顔もしてた。'],
          ['nina', '見てたの！？　迷ってない。……ちょっとしか。', 'fluster'],
          ['マロ', '今年は二つあるから、けんかしないでね。包み紙は、小屋の火起こしに使うといいよ。油が染みてて、よく燃えるから。'],
          ['nina', 'マロさんの包み紙、昔は宝物をくるむのに使ってたなあ。'],
          ['マロ', '知ってる。石ころを入れたまま返してきたこともあったね。'],
          ['touma', '……まだ覚えてるんですか、それ。', 'sweat'],
          ['マロ', '覚えてるよ。あんたたちのことは、だいたい全部。', 'happy']
        ],
        () => {
          f.bread = true;
          state.courage = Math.min(3, state.courage + 1);
          save();
          toast('お弁当に、焼き菓子が増えた');
        }
      );
      return;
    }
    if (id === 'lamp') {
      talk(
        [
          ['', '家の戸口に、小さな護りの灯火がともっている。昼間なのに、消えていない。'],
          ['nina', 'ここのおじさん、丘向こうの集落へ配達に出てるんだって。'],
          ['touma', '戸口の護りの灯火は、最後に帰った人が消す決まりだからな。ともってるうちは、まだ誰か外にいる。'],
          ['nina', 'うん。「待ってるよ」って、灯りが代わりに言ってくれてるの。'],
          ['', '三人の家の戸口にも、同じ形の灯りが一つある。\n今朝、ニナがともしてきた。']
        ],
        () => {
          f.lamp = true;
          save();
        }
      );
      return;
    }
    if (id === 'gift') {
      talk(
        [
          [
            '',
            '灯守の共同所の前に、繕いものの籠が出してある。\n町の誰でも、破れた手袋や靴下を入れていい。手の空いた人が直して戻す決まりだ。'
          ],
          ['nina', 'トウマの右の手袋、次はこっちの太い糸にしようかな。今のは柔らかいけど、道具を握る所がまた擦れそう。'],
          ['touma', '……まだ今朝直したばかりだろ。これだけ繕ってもらうと、新しいのを買った方が早い気もする。'],
          ['nina', '買ってもいいよ。でも、私が直したからって、我慢して使ってるんじゃないよね？'],
          ['touma', '違う。手に合ってるから使ってる。'],
          ['nina', 'ならよし。破れたら、黙って使わないですぐ出すこと。'],
          ['touma', 'お前の鞄の口金もな。また引っかかったら、すぐ言え。']
        ],
        () => {
          f.gift = true;
          save();
        }
      );
      return;
    }
    if (id === 'exit') {
      if (!f.board) {
        talk([['nina', '待ってトウマ、先に広場の掲示板で出発札を掛けなきゃ。黙って出たら、サエさんたちが私たちがまだ町にいると思っちゃうよ。']]);
        return;
      }
      scene('forest', 5, 13);
      if (!f.mochi)
        talk([
          ['', 'ユキネの北門を抜けると、白嶺のふもとへ続く「粉ひきの森」に入る。\n奥の渓谷には水車の粉ひき小屋があり、北の峠を越えて運ばれてくる小麦をここで挽いて町へ届けている。森の灯台は、その分かれ道を見下ろす高台だ。'],
          ['nina', '広場の中より、ずっと雪が深いね……。昨日の足跡も、ひと晩ですっかり埋まってる。'],
          ['touma', '新雪は俺が先に踏み固める。ニナは後ろから道標の向きを見ててくれ。少しでも逸れたら声をかけろ。'],
          ['nina', '了解。……あれ。トウマ、あの最初の道標の下を見て。何か丸いのが跳ねてない？', 'question']
        ]);
      return;
    }
    if (id === 'home') {
      scene('town', 12, 3);
      if (f.lit)
        talk([
          ['', '町の窓には、朝よりたくさんの灯りがともっていた。'],
          ['nina', '「ただいま」って言う前から、もう帰ってきた気がするね。'],
          ['touma', 'まだだ。札を戻すまでが仕事だろ。'],
          ['nina', 'はいはい。掲示板ね。', 'happy']
        ]);
      return;
    }
    if (id === 'mochi') {
      talk(
        [
          ['nina', 'こごえモチだ！　……二匹いる。灯台が消えたから、寒くて私のランタンに寄ってきたんだね。'],
          ['touma', 'このままじゃ道を通れない。サエさんの言った通り、温めて落ち着かせよう。傷つけるなよ。'],
          ['nina', 'トウマこそ。力、入れすぎないでね。'],
          [
            '',
            '「たたかう」を選び、トウマ、ニナの順に行動を決めます。\n矢印キーで選び、Enterで決定。Escでひとつ前へ。\nトウマの「とくぎ」とニナの「じゅもん」で、二人の連携も使えます。'
          ]
        ],
        () => startBattle('mochi')
      );
      return;
    }
    if (id === 'log') {
      if (state.lead !== 'touma') {
        talk([
          ['nina', '倒木が道をふさいでる。……重くて、私じゃびくともしない。トウマ、お願い。', 'sweat'],
          ['', 'Q または左下の交代ボタンで、トウマを先頭にしよう。']
        ]);
        return;
      }
      talk(
        [
          ['', 'ゆうべの雪の重みで折れた木が、道を横切って倒れている。荷車は、これでは通れない。'],
          ['touma', '幹は俺が持ち上げる。ニナは下に噛んでる小枝を払ってくれ。手を入れる前に、必ず声をかけろよ。'],
          ['nina', '分かった。……入れるよ！　……はい、こっちの枝は取れた。'],
          ['touma', 'よし。せーの――', { se: 'thud', shake: 1 }],
          ['', '二人で息を合わせて、倒木を道の端へ転がした。'],
          ['nina', '……昔さ、これくらいの枝を二人で引きずって帰ったよね。薪にしたら、サエさんが喜ぶと思って。'],
          ['touma', '重くて途中で置いて、結局サエさんを呼びに戻った。'],
          ['nina', '今日は持って帰らないよ。帰りの分の力は、残しておくこと。', 'happy'],
          ['touma', '……それ、今朝サエさんが言ってたやつだろ。']
        ],
        () => {
          f.log = true;
          save();
          toast('森の奥へ進めるようになった');
        }
      );
      return;
    }
    if (id === 'rest') {
      if (f.rest) {
        talk([
          ['', '炉には、まだ穏やかな火が残っている。二人は飲み物を温めて、ひと息ついた。', { se: 'fire' }],
          ['nina', 'あったかい……。もうちょっとだけ、ね。']
        ]);
        return;
      }
      const lines = [
        [
          '',
          '森の休憩小屋。雪を払って扉を閉めると、風の音が急に遠くなった。\n炉に火を入れ、濡れた手袋を二組、並べて掛ける。',
          { se: ['door', 'fire'] }
        ],
        ['nina', 'お昼にしよ。包みパン、鞄の中でちょっとつぶれたけど……味は変わらないはず。'],
        ['touma', 'きのこの匂いがする。'],
        ['nina', 'きのことチーズ。好きでしょ。端っこに具が寄ってるから、そっちから食べて。', 'happy'],
        ['touma', '……うまい。', 'happy'],
        ['nina', 'ほんと？　よかった。朝、閉じ目がなかなかくっつかなくて、三個だめにしたの。'],
        ['touma', '知ってる。だめにした三個が、俺の朝飯だったから。'],
        ['nina', 'あれ食べたの！？', 'fluster'],
        ['touma', 'うまかった。'],
        ['', '窓際の棚に、大小ふぞろいのカップが並んでいる。\n一つだけ、青い取っ手を継いだ跡があった。'],
        ['nina', 'あのカップ、まだある。昔、吹雪でサエさんと三人、ここに泊まった時のだ。'],
        ['touma', 'お前、「家に帰れない」って泣いてたな。'],
        ['nina', '泣いてない。……ちょっとしか。'],
        ['nina', 'トウマはあの晩、ずっと扉の前に座ってたよね。寝ないで。'],
        ['touma', '雪がやんだら、いちばんに教えてやろうと思って。'],
        ['nina', '……。', 'shy', { wait: 400 }],
        ['', '炉の薪がはぜた。ニナはカップを両手で包んだまま、しばらく黙っていた。', { se: 'fire' }],
        ['nina', 'ねえ。今日、サエさんが後ろにいないの、ちょっと変な感じしない？'],
        ['touma', 'する。札を掛けた時、三枚目がなくて手が止まった。'],
        ['nina', 'なんだ、トウマも？　落ち着いてるから、私だけかと思ってた。', 'happy'],
        ['touma', '落ち着いてるように見えるだけだ。鞄を三回も開けるやつが、落ち着いてるわけないだろ。'],
        ['nina', 'ふふ。それもそうだね。', 'joy'],
        [
          '',
          'トウマは、カップを両手で包んで笑うニナを見た。',
          [
            [
              '「こういう時間、好きだな」',
              () => {
                state.courage = Math.min(3, state.courage + 1);
              }
            ],
            [
              '「次は俺が作るよ」',
              () => {
                state.courage = Math.min(3, state.courage + 1);
              }
            ],
            ['「もう一個、食べてもいい？」', () => {}]
          ]
        ],
        ['nina', '……うん。また来よ、ここ。今度は仕事のない日に、お弁当だけ持って。', 'shy'],
        ['touma', 'その時は俺が作る。包み方、帰ったら教えてくれ。', 'happy'],
        ['', '出がけに、トウマは次に来る人のために薪を炉の横へ寄せた。\nニナは洗ったカップを、取っ手が手前に来るように棚へ戻す。']
      ];
      if (f.bread) lines.push(['', '食後に、マロの焼き菓子を一つずつ食べた。\nニナは包み紙に残ったかけらまで、指でていねいに拾った。']);
      talk(lines, () => {
        f.rest = true;
        save();
        toast('小屋の思い出を、手帳に残した');
      });
      return;
    }
    if (id === 'repair') {
      if (f.repair) {
        talk([['nina', 'うん、しっかりつながってる。帰りもこの橋を渡るんだから、ちゃんと照らしててね。']]);
        return;
      }
      if (state.lead !== 'nina') {
        talk([
          ['touma', '橋の灯りが消えてる。柱の中の線が切れてるな。……火の仕掛けは、ニナの出番だ。'],
          ['', 'Q または交代ボタンで、ニナを先頭にしよう。']
        ]);
        return;
      }
      const finishBridge = usedOintment =>
        talk(
          [
            ...(usedOintment
              ? [
                  ['', '小瓶の蓋を開けて、かじかんだ指先に軟膏をすりこむ。乾いた薬草の甘い匂いが立った。', { se: 'item' }],
                  ['nina', '……いち、にい、さん……じゅう。……あ、ほんとだ。指先までじんわり動く！　コハル、すごい……。', 'happy'],
                  ['touma', '帰ったら、ちゃんと効いたって言ってやれ。……よし、締めるぞ。'],
                  ['', '温まった指先で、ニナは最後の留め具をまっすぐ締め直した。']
                ]
              : [
                  ['', 'ニナは手を引いて、指に息を吹きかけた。握って、開いて、もう一度。\nそれから、最後の留め具を締め直した。']
                ]),
            ['nina', 'できた！　火も、もう揺れてない。', 'happy', { se: 'chime' }],
            ['nina', '私が先に渡って、向こうの柱も見てくるね。'],
            ['touma', 'ああ。渡り終わるまで、こっちから足元を見てる。'],
            ['nina', '……見ててくれるなら、落ち着いて歩けそう。渡ったら、今度は私が待ってるからね。']
          ],
          () => {
            f.repair = true;
            save();
            toast('灯りの橋を修理した');
          }
        );
      const oint = state.ointments || 0;
      if (oint > 0) {
        let used = false;
        talk(
          [
            [
              '',
              '谷にかかる「灯りの橋」。欄干の灯りが熱を伝えて、橋板の氷を溶かす仕掛けだ。\nその灯りが消えて、橋板は一面、薄氷に覆われていた。'
            ],
            ['nina', '火を足すだけじゃ、すぐまた消えちゃう。柱の中を通ってる芯の線が切れてるの。先に、そこをつなぎ直したい。'],
            ['touma', '柱が傾かないように、俺が抱えておく。そこから留め具に手は届くか？'],
            ['nina', '届く。……ほら見て、鞄。手袋のまま開いた！', 'happy'],
            ['touma', '見せなくていい。早く出せ。'],
            ['', 'トウマが灯柱を抱え、ニナが芯をつなぐ。\n橙色の火が線を走り、橋の薄氷がするするとほどけていく。', { se: 'flare' }],
            ['nina', '……あと一つなんだけど。風で指がかじかんで、留め具がつかめない。', 'sweat'],
            ['nina', 'トウマ、ごめん。少し待ってて。急いで締めたら、芯を挟んじゃう。'],
            [
              'touma',
              '待つ。柱は持ってるから、急ぐな。……今朝コハルにもらった凍傷の軟膏、持ち物に入ってるだろ。',
              [
                [
                  '「凍傷の軟膏」を使う（残り' + oint + '）',
                  () => {
                    state.ointments = Math.max(0, (state.ointments || 0) - 1);
                    f.ointmentBridge = true;
                    used = true;
                    save();
                    updateHud();
                  }
                ],
                ['息を吹きかけて温める（軟膏を残す）', () => {}]
              ]
            ]
          ],
          () => finishBridge(used)
        );
      } else {
        talk(
          [
            [
              '',
              '谷にかかる「灯りの橋」。欄干の灯りが熱を伝えて、橋板の氷を溶かす仕掛けだ。\nその灯りが消えて、橋板は一面、薄氷に覆われていた。'
            ],
            ['nina', '火を足すだけじゃ、すぐまた消えちゃう。柱の中を通ってる芯の線が切れてるの。先に、そこをつなぎ直したい。'],
            ['touma', '柱が傾かないように、俺が抱えておく。そこから留め具に手は届くか？'],
            ['nina', '届く。……ほら見て、鞄。手袋のまま開いた！', 'happy'],
            ['touma', '見せなくていい。早く出せ。'],
            ['', 'トウマが灯柱を抱え、ニナが芯をつなぐ。\n橙色の火が線を走り、橋の薄氷がするするとほどけていく。', { se: 'flare' }],
            ['nina', '……あと一つなんだけど。風で指がかじかんで、留め具がつかめない。', 'sweat'],
            ['nina', 'トウマ、ごめん。少し待ってて。急いで締めたら、芯を挟んじゃう。'],
            ['touma', '待つ。柱は持ってるから、手を温めろ。締める時に声をかけてくれればいい。']
          ],
          () => finishBridge(false)
        );
      }
      return;
    }
    if (id === 'crab') {
      talk(
        [
          ['nina', '見て、ヤドカリ。殻の代わりに、誰かのカップを背負ってる……。'],
          ['touma', 'そのカップごと、氷に包まれてるな。寒くて、気が立ってる。'],
          ['nina', '私の火花で氷を溶かすね。溶けるまでは、トウマの手も届かないと思う。'],
          ['', 'ニナの「じゅもん」から「火花」を選ぼう。\n氷の殻が溶けると、次のターンからトウマの攻撃も届きやすくなります。']
        ],
        () => startBattle('crab')
      );
      return;
    }
    if (id === 'guardian') {
      talk(
        [
          ['touma', '……でかい。灯台の前から動かないな、あれ。'],
          ['', '枝のような角を持つ、森の精霊。灯守は「枝角の番人」と呼んでいる。'],
          ['nina', '待って、角の間を見て。鳥の巣。……ゆうべの吹雪で、木から落ちたのを拾ってくれたんだ。'],
          ['touma', '巣を守ってるのか。それで気が立ってる。'],
          ['nina', '落ち着かせて、巣を木に戻してあげよう。二人でなら、できるよ。'],
          ['', '番人の大きな踏み込みは、トウマの「かばう」で守れます。\n息ぴったりの灯りが三つともったら、二人技「灯火の一閃」が使えます。']
        ],
        () => startBattle('guardian')
      );
      return;
    }
    if (id === 'tower') {
      if (!f.guardian) {
        toast('先に、番人を落ち着かせよう');
        return;
      }
      if (f.lit) {
        talk([
          ['nina', '町からも見えてるかな、この灯り。'],
          ['touma', '見えてる。帰ろう。札を戻すまでが仕事だ。']
        ]);
        return;
      }
      talk(
        [
          ['', '森の最奥にそびえる石積みの「森の灯台」。\nユキネを取り巻く「灯りの輪」の北の要であり、峠と粉ひき小屋から町へ帰る道を見下ろす一番高い火室だ。今は太い芯が凍りつき、冷たい雪をかぶっている。'],
          ['touma', '吹雪の衝撃で芯の軸が傾いてたんだな。……よし、金具を締め直してまっすぐ立った。ニナ、火を。'],
          ['nina', 'うん。ランタンの風よけ、開けるね。'],
          [
            '',
            'ニナが腰のランタンに守ってきた種火を、細い導きの芯へとそっと移す。灯術の火は、最初は息をひそめるほど小さい。\nその種火が油を含んだ灯台の大芯に触れ、ひと呼吸おいて――',
            { bgm: 'silence', wait: 300 }
          ],
          [
            '',
            '森の灯台いっぱいに、あたたかな黄金色の光が満ちた。',
            { still: 'chapter-01', flash: 'warm', se: 'lit', jingle: 'lit', time: 'dusk', lit: true }
          ],
          ['nina', '……ともった！', 'happy'],
          ['touma', 'ああ。しっかりともったな。', 'happy'],
          [
            '',
            '高い火室から放たれた光が、夕暮れの蒼い雪の稜線をくっきりと照らし出す。北で途切れていたユキネの「灯りの輪」が、ふたたび一本の結界としてつながった。\n眼下の森の分かれ道にある道標が浮かび上がり、そのそばを、粉を積んだ荷車の小さな影が動いているのが見えた。',
            { bgm: 'tender' }
          ],
          ['', '荷車の影は分かれ道で一度立ち止まり、灯台の光を見上げるようにしてから、迷いなくユキネの町の方角へ曲がった。'],
          ['nina', '見えたんだね。あの荷車の人たちにも、この火が。'],
          ['touma', '……ああ。これでもう、道を間違えずに町まで帰れる。'],
          [
            '',
            '――今から十二年前の冬、まだトウマとニナが幼かった大雪の夕暮れのことだ。\nあの日、トウマの両親とニナの両親は、冬越しの小麦や塩を積んだ町の荷車の列に加わり、深い雪で道が閉ざされる前に北の峠からユキネへ帰る途中だった。',
            { wait: 500 }
          ],
          [
            '',
            'だが日暮れと重なって急な猛吹雪が山を包み、さらにその夜、北の白嶺から下りてきた大柄な魔獣がこの「森の灯台」を襲った。\n魔獣は灯台の火を叩き落として灯りの輪を北で断ち切り、そのまま手薄になった町の家々へなだれ込もうとした。'
          ],
          [
            '',
            'その夜の当番だったサエは、魔獣を町へ一歩も入れまいと吹雪の森でひとり立ちふさがった。\n夜通し斬り結んでようやく魔獣を討ち果たしたものの、サエ自身も深手を負って動けなくなり、この灯台まで登って火を入れ直すことができなかった。'
          ],
          [
            '',
            'そして――町まであと半刻という森の分かれ道まで戻ってきていた荷車の列には、目印になるはずの灯台の火が見えなかった。\n猛吹雪で道と谷底の境さえ消え果てた白闇の中、曲がり角を見失った荷車は深い吹きだまりの沢へと踏み迷い、両親たちは朝になっても帰らぬ人となった。'
          ],
          [
            '',
            'あの日、凍りついた窓辺に並んで北の山を見つめていた幼い二人は、サエとマロにそれぞれ引き取られて育った。\n「二度と誰ひとり、帰り道を見失わせない」——そう願って灯守を志した二人に、サエは自らの剣と灯術を授け、決して離れぬ二人一組として鍛え上げたのだ。'
          ],
          ['nina', '小さい頃、吹雪の晩になると窓に額をくっつけて、この灯台の火を探したよね。あそこがともってたら、きっと帰ってくるって。'],
          ['touma', 'お前が先に長靴を履いて外へ飛び出そうとするから、毎回俺が玄関で捕まえる羽目になった。'],
          ['nina', 'だって、灯りを持って迎えに行きたかったんだもん。'],
          ['', 'ニナは石積みの冷たい壁に、手袋のままそっと手のひらを当てた。トウマは黙って、サエから受け継いだ腰の剣の柄に一度だけ指を触れた。'],
          ['nina', '……今日は、ちゃんとともってるよ。分かれ道まで、ぜんぶ明るい。', { wait: 500 }],
          ['touma', 'ああ。帰ろう、ニナ。広場の出発札を戻すまでが、俺たちの仕事だ。'],
          ['nina', 'うん！　……なんだか安心したら、急におなか空いちゃった。', 'happy'],
          ['touma', f.rest ? '休憩小屋であれだけ食べておいて、まだ入るのか。' : '昼を抜いて歩いたからな。早く帰ってマロさんのパンをもらおう。'],
          ['nina', '帰り道の焼きたては、いつだって別腹なの。', 'joy']
        ],
        () => {
          f.lit = true;
          save();
          updateHud();
          openModal(
            '<span class="tag">第一の灯り</span><h2>森の灯台が、ともった</h2><p>日が傾いてきた。二人でユキネの町へ帰ろう。<br>そのまま森の雪道を歩いて戻ることもできます。</p>',
            [
              [
                '二人で町へ帰る',
                () => {
                  closeModal();
                  scene('town', 12, 3);
                  talk([
                    ['', '灯台からつないだ灯術の火が導火線を伝い、帰り道の小さな標識灯も、ぽつり、ぽつりと順番に明るくなっていく。'],
                    ['nina', '私たちがともした火が、町まで一列に下りていってるんだね。'],
                    ['touma', 'ああ。……広場の掲示板へ行こう。出発札を戻して、サエさんに報告だ。']
                  ]);
                },
                true
              ],
              ['森をもう少し歩く', closeModal]
            ],
            'explore'
          );
        }
      );
    }
  }
  let classicBattle = null;
  let fieldWin = null; // 寄り道の精霊を落ち着かせたあとに呼ぶ
  function startBattle(kind, onWin = null) {
    fieldWin = onWin;
    setMusic('battle');
    battleOrigin = kind;
    battle = C.newBattle(kind, {
      ...(D.companion(state) ? { support: 'koharu' } : {}),
      ...(state.flags.ointmentGiven || state.ointments !== undefined ? { ointments: state.ointments || 0 } : {})
    });
    order = battle.heroes.koharu ? ['touma', 'nina', 'koharu'] : ['touma', 'nina'];
    commands = {};
    mode = 'battle';
    held = {};
    route = [];
    $('battleScreen').hidden = false;
    if (!classicBattle)
      classicBattle = new OkaeriBattle.BattleUI($('battleScreen'), {
        onTurn: (selected, team) => {
          commands = selected;
          resolve(team);
        },
        onVictory: victory,
        onRetry: () => startBattle(battleOrigin, fieldWin),
        onEscape: () => {
          fieldWin = null;
          travelMusic();
          $('battleScreen').hidden = true;
          mode = 'explore';
          updateHud();
          canvas.focus();
          toast('二人は 道へもどった。');
        }
      });
    classicBattle.begin(battle);
    tone(294, 0.2);
  }
  function resolve(team = false) {
    if (mode !== 'battle') return;
    try {
      battle = C.resolveTurn(battle, team ? { team: 'flare' } : commands, order);
      tone(battle.status === 'victory' ? 659 : 392, 0.15);
      classicBattle.showResult(battle);
    } catch (err) {
      toast(err.message.replace('SP', 'MP'));
      classicBattle.begin(battle);
    }
  }
  function victory() {
    travelMusic();
    if (battle?.ointments !== undefined) state.ointments = battle.ointments;
    if (fieldWin) {
      const done = fieldWin;
      fieldWin = null;
      closeModal();
      $('battleScreen').hidden = true;
      mode = 'explore';
      updateHud();
      done();
      return;
    }
    if (state.episode && OkaeriEpisodes.current(state)?.battle) {
      $('battleScreen').hidden = true;
      mode = 'explore';
      OkaeriEpisodes.won(episodeApi());
      return;
    }
    if (state.scene === 'hill') {
      closeModal();
      $('battleScreen').hidden = true;
      mode = 'explore';
      state.flags.hillGuardian = true;
      save();
      updateHud();
      talk([
        ['', '枝角の番人は、ゆっくり雪の上に伏せた。荒れていた灯りが、穏やかに戻っている。'],
        ['nina', '待っててね。すぐに、灯台をともすから。'],
        ['touma', '今度は俺たちが、帰り道を守る。']
      ]);
      return;
    }
    if (state.scene === 'canal') {
      closeModal();
      $('battleScreen').hidden = true;
      mode = 'explore';
      state.flags.canalCrab = true;
      save();
      updateHud();
      talk([
        ['', 'ヤドカリは、温まった水の中へそっと降りていった。'],
        ['nina', '帰る場所、見つかったね。'],
        ['touma', '俺たちも、水を家まで連れていこう。']
      ]);
      return;
    }
    closeModal();
    $('battleScreen').hidden = true;
    mode = 'explore';
    state.flags[battle.kind] = true;
    save();
    updateHud();
    const lines =
      battle.kind === 'mochi'
        ? [
            ['', 'こごえモチたちは、ほかほかと湯気を立てて道端へ跳ねていった。さっきより、ひとまわり小さい。'],
            ['nina', 'あったまったら、縮むんだ……。よかった、怒ってないみたい。', 'happy'],
            ['touma', '道が空いた。この先に休憩小屋がある。昼にしよう。']
          ]
        : battle.kind === 'crab'
          ? [
              ['', '氷の溶けたカップから、小さなはさみがのぞく。\nヤドカリは橋の下の沢へ、ことこと歩いていった。'],
              ['nina', 'あのカップ、誰かの忘れ物かな。'],
              ['touma', '今はあいつの家だ。返せとは言えないな。']
            ]
          : [
              ['', '枝角の番人が、ゆっくり頭を下げた。角の間の巣が、二人の目の高さまで下りてくる。'],
              ['', 'トウマが巣を受け取り、ニナの指さす低い枝の股へそっと戻した。'],
              ['nina', 'ここなら風も当たらないよ。'],
              ['touma', '……一晩じゅう、守ってたんだな。'],
              ['', '巣の中で、小鳥が一声鳴いた。番人は灯台の前から退き、森の奥へ歩いていく。', { se: 'chime' }],
              ['nina', 'さあ、私たちの番。灯りをともそう。']
            ];
    talk(lines);
  }
  function bagSummaryHtml() {
    const oint = state.ointments || 0,
      items = [];
    if (state.flags.ointmentGiven || oint > 0)
      items.push([
        '✦',
        '凍傷の軟膏　× ' + oint,
        oint > 0
          ? 'コハルが調合した塗り薬。塗って十数えるとかじかんだ指が戻る。冷えきった作業場や、戦闘の「どうぐ」（味方一人のHP60・MP2回復＋冷え解除）で使えます。'
          : '使いきった。三人の家のコハルの薬草棚を調べると補充できます。',
        oint > 0 ? '使用可 · どうぐ' : '薬草棚で補充可',
        oint > 0 ? 'is-featured' : 'is-empty'
      ]);
    items.push([
      '❀',
      '薬草（戦闘ごとに3包）',
      '手当て袋の干し草。戦闘の「どうぐ」で味方一人のHPを45回復し、冷えも解除する。',
      '戦闘用',
      ''
    ]);
    if (state.flags.bread && !state.flags.rest)
      items.push([
        '◈',
        '干しりんごの焼き菓子　× 2',
        'パン屋のマロが包んでくれたおまけ。森の休憩小屋でのお昼に食べよう。',
        '道中のお昼',
        'is-featured'
      ]);
    if (state.flags.sewingFound && !state.flags.sewingReturned)
      items.push([
        '❖',
        'エルナの針仕事帳',
        '森の休憩小屋の道具箱で見つけた布張りの手帳。広場のエルナへ届けよう。',
        '届けもの',
        'is-featured'
      ]);
    if (state.memories?.gift === 'tea') items.push(['✧', '香りのいい薬草茶', '二人で選んだ贈り物。', '大切な品', '']);
    if (state.memories?.gift === 'bookmark') items.push(['✧', '木彫りの栞', '二人で選んだ贈り物。', '大切な品', '']);
    return (
      '<div class="rpg-item-list">' +
      items
        .map(
          ([icon, title, desc, badge, cls]) =>
            '<div class="rpg-item' +
            (cls ? ' ' + cls : '') +
            '"><span class="rpg-item-icon" aria-hidden="true">' +
            icon +
            '</span><div class="rpg-item-body"><div class="rpg-item-head"><strong>' +
            escape(title) +
            '</strong>' +
            (badge ? '<span class="rpg-badge">' + escape(badge) + '</span>' : '') +
            '</div><p>' +
            escape(desc) +
            '</p></div></div>'
        )
        .join('') +
      '</div>'
    );
  }
  function openBag() {
    if (mode === 'battle') {
      toast('戦闘中はコマンドの「どうぐ」から使えます');
      return;
    }
    if (mode === 'dialogue' || mode === 'opening' || mode === 'title') {
      if (mode === 'dialogue') toast('会話が終わってから開けます');
      return;
    }
    if (mode === 'modal') closeModal();
    const oint = state.ointments || 0,
      buttons = [];
    if (oint > 0)
      buttons.push([
        '凍傷の軟膏を指に塗る（残り' + oint + '）',
        () => {
          state.ointments = Math.max(0, (state.ointments || 0) - 1);
          save();
          closeModal();
          talk([
            ['', '小瓶の蓋を開けると、乾かした薬草の甘い匂いが立った。\n指先に少しずつ塗って、コハルに言われた通りに十数える。', { se: 'item' }],
            ['nina', '……いち、にい……じゅう。ほんとだ、指の先までぽかぽかする。', 'happy'],
            ['touma', '手袋の中でも効いてるな。……あいつ、ずいぶん腕が上がった。']
          ]);
        },
        true
      ]);
    buttons.push(['閉じる', closeModal, oint <= 0]);
    openModal(rpgTabsHtml('bag') + '<span class="tag">ITEMS · 所持品</span><h2>持ち物</h2>' + bagSummaryHtml(), buttons, 'explore');
  }
  function journal() {
    if (mode === 'modal' && modalReturn === 'explore') closeModal();
    if (!['explore', 'title'].includes(mode)) return;
    if (mode === 'explore' && globalThis.OkaeriJourney?.active(state)) {
      const j = state.journey;
      const work = [
        ['mirror', 'トウマ：反射板を直す'],
        ['prism', 'ニナ：共鳴灯を合わせる'],
        ['shutter', 'トウマ：風よけを開く'],
        ['reply', 'ニナ：応答灯をともす']
      ];
      const buttons = [['閉じる', closeModal, true]];
      if (OkaeriJourney.split(state))
        buttons.push([
          '相手の持ち場へ切り替える',
          () => {
            closeModal();
            switchLead();
          }
        ]);
      openModal(
        rpgTabsHtml('journal') +
          '<span class="tag">JOURNEY · 第6話の小旅行</span><h2>氷湖の迎え灯</h2><p>ミナモの迎え灯の光が弱くなり、夕方の便が港を見つけにくくなっています。現地の灯守の依頼で、二人が反射板と小屋の仕掛けを確かめに来ました。</p><div class="rpg-quest"><small>現在の目的</small><strong>' +
          escape(OkaeriJourney.objective(state)) +
          '</strong></div><p class="rpg-route">ユキネ → 氷湖の旧街道 → ミナモ → 古い灯守小屋 → 三人の家</p><div class="rpg-step-grid">' +
          work
            .map(([k, label]) => '<div class="rpg-step' + (j[k] ? ' is-done' : '') + '"><span>' + (j[k] ? '✓' : '○') + '</span>' + label + '</div>')
            .join('') +
          '</div><h3>旅で知ったこと</h3>' +
          OkaeriJourney.notes(state)
            .map(n => '<p>' + escape(n) + '</p>')
            .join('') +
          '<p class="rpg-note">別行動中はQで交代。それぞれの場所と進み具合を保存します。</p>',
        buttons,
        'explore'
      );
      return;
    }
    if (mode === 'explore' && state.episode) {
      const ep = state.episode,
        e = OkaeriEpisodes.current(state),
        buttons = [['閉じる', closeModal, true]];
      if (e && !ep.complete)
        buttons.push([
          '目的地のあるマップへ',
          () => {
            closeModal();
            scene(e.scene, ...OkaeriEpisodes.spawns[e.scene]);
          }
        ]);
      const overview = OkaeriEpisodesData.contexts?.[ep.chapter];
      openModal(
        rpgTabsHtml('journal') +
          '<span class="tag">JOURNAL · 旅の手帳</span><h2>' +
          OkaeriEpisodes.title(state) +
          '</h2><div class="rpg-quest"><small>いま、すること</small><strong>' +
          escape(OkaeriEpisodes.objective(state) || S.objective(state)) +
          '</strong></div>' +
          (overview ? '<h3>今日の用事</h3><p>' + escape(overview) + '</p>' : '') +
          '<h3>全10話の歩み</h3><div class="rpg-step-grid">' +
          OkaeriEpisodesData.titles
            .map(
              (t, i) =>
                '<div class="rpg-step' +
                (i + 1 < ep.chapter ? ' is-done' : i + 1 === ep.chapter ? ' is-current' : '') +
                '"><span>' +
                (i + 1 < ep.chapter ? '✓' : i + 1 === ep.chapter ? '▶' : '○') +
                '</span>' +
                (i + 1) +
                '. ' +
                t +
                '</div>'
            )
            .join('') +
          '</div><h3>持ち物</h3>' +
          bagSummaryHtml() +
          '<h3>二人の思い出</h3>' +
          ((globalThis.OkaeriActivities?.notes(state) || []).map(n => '<div class="journal-step"><span>◆</span><div>' + escape(n) + '</div></div>').join('') ||
            '<p>二人で選んだことが、ここに残ります。</p>') +
          '<p class="rpg-note">リツ：町に戻った水番。ユラ：二人を幼い頃から知る診療所の先生。</p>',
        buttons,
        'explore'
      );
      return;
    }
    if (mode === 'title') {
      openModal(
        '<span class="tag">GUIDE · はじめに</span><h2>二人で、灯りを届ける</h2><p>トウマとニナは、雪の町ユキネで一緒に暮らす幼馴染。雪で消える道の方角を知らせ、魔獣を退ける「護りの灯火」の番をする、灯守（ひもり）です。トウマは木や金具の修理、ニナは火を扱う「灯術」が得意です。</p><p>二人の仕事と暮らしを、全10話でたどります。第9話で二人の関係を選ぶと、最終話が三通りに変わります。</p><p class="rpg-note">操作：矢印 / WASDで移動、E・Enterで調べる、Qで交代、Iで持ち物。Jの「旅の手帳」で今日の用事と次の行き先を確かめられます。右上の「音」で音楽と効果音が入ります。</p>',
        [['閉じる', closeModal, true]],
        'title'
      );
      return;
    }
    const steps = [
      ['board', '出発札を掛ける'],
      ['mochi', 'こごえモチを落ち着かせる'],
      ['log', 'トウマで倒木を動かす'],
      ['repair', 'ニナで灯りの橋を修理する'],
      ['crab', '氷殻を火花で溶かす'],
      ['guardian', '枝角の番人と向き合う'],
      ['lit', '二人で灯台をともす'],
      ['returned', '出発札を戻して、ただいま'],
      ['canalStarted', '共同水路の依頼を受ける'],
      ['waterGate', 'トウマで水門を支える'],
      ['canalCrab', '水路のヤドカリを落ち着かせる'],
      ['waterFlow', 'ニナで調整灯をつなぐ'],
      ['waterLit', '水路の護りの灯火をともす'],
      ['waterReturned', 'マロに水の便りを届ける'],
      ['hillStarted', '風待ちの丘へ出発'],
      ['windbreak', 'トウマで風よけを直す'],
      ['hillGuardian', '尾根の番人を落ち着かせる'],
      ['hillLens', 'ニナでレンズを合わせる'],
      ['hillLit', '丘の灯台をともす'],
      ['festivalStarted', '護りの灯火祭りへ'],
      ['festivalMeal', '二人でスープを食べる'],
      ['festivalRibbon', '帰り結びを贈り合う']
    ];
    const html =
      rpgTabsHtml('journal') +
      '<span class="tag">JOURNAL · 旅の手帳</span><h2>二人の灯守日誌</h2><div class="rpg-quest"><small>いま、すること</small><strong>' +
      escape(S.objective(state)) +
      '</strong></div><div class="rpg-step-grid">' +
      steps
        .map(([k, v]) => '<div class="rpg-step' + (state.flags[k] ? ' is-done' : '') + '"><span>' + (state.flags[k] ? '✓' : '○') + '</span>' + v + '</div>')
        .join('') +
      '</div><h3>持ち物</h3>' +
      bagSummaryHtml() +
      '<h3>町の人との寄り道</h3>' +
      OkaeriSideStories.notes(state)
        .map(
          n =>
            '<div class="journal-step"><span>' +
            (n.done ? '✓' : '◇') +
            '</span><div><strong>' +
            n.title +
            '</strong><br>' +
            n.text +
            '</div></div>'
        )
        .join('') +
      '<h3>道中の思い出</h3><p>' +
      (state.flags.bread ? '焼き菓子をもらった。' : 'パン屋には、いい匂いがしている。') +
      '<br>' +
      (state.flags.rest ? '小屋で、二人のお昼を食べた。' : '森の小屋で、ひと休みできそう。') +
      '</p><p>' +
      (state.flags.canalRest ? '水番の休憩所で、次の人の薪を残した。' : '共同水路にも、小さな休憩所がある。') +
      '</p><h3>二人の得意なこと</h3><p class="rpg-note">トウマ：倒木を動かす / 崩し斬り・かばう<br>ニナ：灯りの修理 / 火花・回復<br>戦闘では毎回HP・SPが満タンで始まる試作仕様です。</p>';
    const btns = [['冒険に戻る', closeModal, true]];
    if (state.flags.lit && state.scene === 'forest')
      btns.push([
        '町へ帰る',
        () => {
          closeModal();
          scene('town', 12, 3);
        }
      ]);
    openModal(html, btns, 'explore');
  }
  function menu() {
    if (mode === 'title') {
      journal();
      return;
    }
    if (mode === 'dialogue' || mode === 'battle') {
      toast('会話や戦闘が終わってから開けます');
      return;
    }
    if (mode === 'modal' && modalReturn === 'explore') closeModal();
    if (mode === 'modal') return;
    const withKoharu = Boolean(D.companion?.(state)),
      oint = state.ointments || 0,
      hasOint = state.flags.ointmentGiven || oint > 0;
    openModal(
      rpgTabsHtml('menu') +
        '<span class="tag">CAMP MENU · ひと休み</span><h2>旅のメニュー</h2>' +
        '<div class="rpg-banner"><div class="rpg-banner-meta"><span>' +
        escape($('chapter').textContent || '') +
        '</span><span>' +
        escape($('weather').textContent || '') +
        '</span></div><strong class="rpg-banner-place">' +
        escape($('locationName').textContent || '') +
        '</strong><div class="rpg-banner-obj"><small>いま、すること</small><span>' +
        escape($('objectiveText').textContent || '') +
        '</span></div></div>' +
        '<h3>仲間と状態</h3><div class="rpg-party">' +
        '<div class="rpg-member' +
        (state.lead === 'touma' ? ' is-lead' : '') +
        '"><span class="rpg-face face-touma" aria-hidden="true"></span><div class="rpg-member-info"><strong>トウマ <span class="rpg-role-pill">' +
        (state.lead === 'touma' ? '先頭' : '同行') +
        '</span></strong><small>剣と工作 · 灯守</small><div class="rpg-stat-row"><span>HP <b>120</b></span><span>MP <b>6</b></span></div></div></div>' +
        '<div class="rpg-member' +
        (state.lead === 'nina' ? ' is-lead' : '') +
        '"><span class="rpg-face face-nina" aria-hidden="true"></span><div class="rpg-member-info"><strong>ニナ <span class="rpg-role-pill">' +
        (state.lead === 'nina' ? '先頭' : '同行') +
        '</span></strong><small>灯術と火 · 灯守</small><div class="rpg-stat-row"><span>HP <b>90</b></span><span>MP <b>8</b></span></div></div></div>' +
        '<div class="rpg-member' +
        (withKoharu ? ' is-lead' : '') +
        '"><span class="rpg-face face-koharu" aria-hidden="true"></span><div class="rpg-member-info"><strong>コハル <span class="rpg-role-pill">' +
        (withKoharu ? '同行中' : '薬師見習い') +
        '</span></strong><small>' +
        (withKoharu ? '薬と手当て · 後衛支援' : '三人の家 · 調合と手当て') +
        '</small><div class="rpg-stat-row">' +
        (withKoharu
          ? '<span>HP <b>70</b></span><span>MP <b>10</b></span>'
          : '<span>凍傷の軟膏 <b>' + (hasOint ? '×' + oint : '調合前') + '</b></span>') +
        '</div></div></div></div>' +
        '<p class="rpg-note">進行はこの端末に自動保存されます。ブラウザーや開き方を変えると、保存は引き継がれません。</p>',
      [
        ['戻る', closeModal, true],
        [
          'タイトルへ',
          () => {
            closeModal();
            save();
            mode = 'title';
            setMusic('opening');
            $('titleScreen').hidden = false;
            $('hud').hidden = true;
            $('continueButton').hidden = !saved;
          }
        ],
        [
          '先頭を交代（' + name(state.lead === 'touma' ? 'nina' : 'touma') + 'へ）',
          () => {
            closeModal();
            switchLead();
          }
        ],
        [
          sound ? '音：ON → OFF' : '音：OFF → ON',
          async () => {
            await toggleSound();
            if (mode === 'modal') {
              closeModal();
              menu();
            }
          }
        ]
      ],
      mode
    );
  }
  function evening(key) {
    state.pendingEvening = key;
    scene('house', 11, 11);
    talk(S.nightScenes[key], () => {
      delete state.pendingEvening;
      state.flags['night' + key[0].toUpperCase() + key.slice(1)] = true;
      save();
      if (state.episode && key === 'one') {
        state.episode.complete = true;
        save();
        OkaeriEpisodes.endDay(episodeApi());
        return;
      }
      const end = S.endings[key];
      openModal(
        '<span class="tag">' +
          (end ? 'おかえりの灯 · END' : '一日の終わり') +
          '</span><h2>' +
          (end ? end.title : key === 'three' ? '祭りの支度ができた' : 'おやすみ。また明日') +
          '</h2><p>' +
          (end
            ? '同じ家から、二人の明日が続いていきます。遊んでくれて、ありがとうございます。'
            : key === 'three'
              ? '家で着替えた二人は、これから護りの灯火祭りへ。'
              : '炉のそばに二人分のカップ。今日のことを、家に置いて眠ろう。') +
          '</p>',
        [
          ['家で過ごす', closeModal, true],
          [
            key === 'three' ? '二人で祭りへ' : end ? '町へ出る' : '翌朝、町へ',
            () => {
              closeModal();
              scene('town', 3, 13);
            }
          ]
        ],
        'explore'
      );
    });
  }
  function handleHouse(id) {
    if (id === 'ourHome') {
      scene('house', 12, 12);
      return true;
    }
    if (id === 'clinicDoor') {
      scene('clinic', 12, 12);
      return true;
    }
    if (state.scene === 'clinic') {
      if (id === 'clinicExit') {
        scene('town', 10, 13);
        return true;
      }
      const clinicLines = {
        clinicHerbs: [
          ['', '壁一面の薬棚。白嶺のふもとや薬草の谷で摘んだ干し草と、塗り薬の小瓶が効能ごとに整然と並んでいる。\n下の段には、見習いのコハルが間違えないよう葉の形を描いた丸い字の札が結んであった。'],
          ['nina', 'コハルがうちの棚に貼ってる絵札、ここのユラ先生の棚をまねしたんだね。', 'happy'],
          ['touma', '凍傷の軟膏の瓶が一番手前に並べてあるな。冬場は町じゅうの人がもらいに来るんだろう。']
        ],
        clinicDesk: [
          ['', 'よく使いこまれた診察机と、薬草をすり潰す乳鉢。\n引き出しの脇には、ユキネの住民全員の持病や怪我の控えが丁寧に綴じられている。'],
          ['touma', '俺とニナの頁、子どもの頃の擦り傷だけで何枚もありそうだな……。', 'sweat'],
          ['nina', 'ほとんどトウマが木から落ちた記録でしょ！', 'fluster']
        ],
        clinicBed: [
          ['', '清潔な白い麻布が敷かれた休養用の寝台。衝立の陰にあり、吹雪で冷えきった人や熱を出した子どもが一晩休めるようになっている。'],
          ['nina', '昔、コハルがまだこの診療所の奥に寝泊まりしてた頃、熱を出した私のお見舞いに何度もカーテンから顔をのぞかせてくれたっけ。']
        ],
        clinicStove: [
          ['', '診療所の薪ストーブ。いつ急患が運びこまれてもすぐ湯が使えるよう、やかんが絶えず白い湯気を立てている。', { se: 'fire' }],
          ['touma', '薬草を煎じた匂いがする。ここにいるだけで指先がほどけるな。']
        ],
        clinicWaiting: [
          ['', '待合の小さな机と、一脚だけ置かれた木の椅子。\nよく見ると床の敷物には、もう一脚ぶんの丸い脚跡がうっすら残っている。'],
          ['nina', '……あ、ここ。三年前に私たちが今の家へ越した時、ユラ先生が「うちは一脚で足りるから」って譲ってくれた椅子の場所だ。'],
          ['touma', 'おかげでうちの食卓は、オルフさんの椅子とここの椅子で二脚そろったんだよな。大事に使わないと。']
        ]
      };
      if (clinicLines[id]) {
        talk(clinicLines[id]);
        return true;
      }
      return false;
    }
    if (state.scene !== 'house') return false;
    if (id === 'houseExit') {
      scene('town', 3, 13);
      return true;
    }
    if (id === 'homeTable') {
      if (state.episode) {
        if (state.episode.complete) OkaeriEpisodes.endDay(episodeApi());
        else
          talk([
            ['nina', '今日の用事が済んだら、ここでゆっくり話そうね。'],
            ['touma', 'ああ。お茶を沸かす分の薪は、残しておく。']
          ]);
        return true;
      }
      const options = [
        ['one', 'returned', '第一話 · 二つのカップ'],
        ['two', 'waterReturned', '第二話 · 味見の距離'],
        ['three', 'festivalStarted', '第三話 · いつもと違う支度'],
        ['touma', 'endingTouma', '最終話 · 恋人になった家'],
        ['nina', 'endingNina', '最終話 · 返事の続き'],
        ['friends', 'endingFriends', '最終話 · 明日の席']
      ].filter(([, flag]) => state.flags[flag]);
      openModal(
        '<h2>食卓</h2><p>今日のことを、少し話そう。終えた章の夜を読み返せます。</p>',
        [
          ...options.map(([key, , label]) => [
            label,
            () => {
              closeModal();
              evening(key);
            }
          ]),
          [
            '今はお茶にする',
            () => {
              closeModal();
              talk([
                ['nina', 'お湯、沸いてるよ。'],
                ['touma', 'じゃあ、二人分淹れる。', { se: 'cup' }]
              ]);
            },
            true
          ]
        ],
        'explore'
      );
      return true;
    }
    if (id === 'koharuHerbs' && state.flags.ointmentGiven && (state.ointments || 0) < 2) {
      state.ointments = 2;
      save();
      updateHud();
      talk(
        [
          ['', '薬草と小瓶の棚。葉の形を描いた札が、一つずつ瓶に結んである。'],
          ['touma', '見分けやすいように、絵にしたのか。'],
          ['', '隅には二人分の手当て袋。減っていた「凍傷の軟膏」を、二人分（×2）補充しておいた。', { se: 'item' }]
        ],
        () => toast('持ち物の「凍傷の軟膏」が2個になった')
      );
      return true;
    }
    const lines = {
      toumaDesk: [
        [
          '',
          'トウマの修理机。よく磨かれた天板の隅に、「ニナの外套」と書いた小箱。中身は予備の留め金だ。\n工具の柄には、滑り止めの布が巻いてある。'
        ],
        ['nina', 'この布、私が巻いたやつだ。まだ使ってくれてるんだ。'],
        ['touma', '手になじんでるから。'],
        ['nina', '……そっか。すり切れたら言ってね。同じ色で巻き直すから。', 'happy']
      ],
      toumaBooks: [
        ['', '本棚には、雪道の地図、家具の直し方、それから料理の本。\nスープの頁だけ、何度も開いた跡がある。'],
        ['nina', 'これ、私の好きなきのこのスープの頁だ。'],
        ['touma', '次は焦がさない。'],
        ['nina', 'この前のも、おいしかったよ。……鍋の底の方以外は。', 'joy']
      ],
      ninaMirror: [
        ['', 'ニナの鏡台。手作りの鏡枠に、青いリボンが掛けてある。\n引き出しの上には、書きかけのお礼のカード。'],
        ['touma', '鏡の高さ、直したままでいいか。'],
        ['nina', 'うん。毎朝、ちゃんと見えるよ。'],
        ['touma', '何が。'],
        ['nina', '……直してくれた人が、丁寧だったってことが。', 'shy']
      ],
      ninaWardrobe: [
        ['', 'たたんだ冬服と、色の順に並んだ毛糸玉。\n二人分の手袋が、同じ籠に入っている。'],
        ['touma', '俺の手袋も、ここにあるのか。'],
        ['nina', '片方だけなくす人がいるので、まとめて管理してます。'],
        ['touma', '……助かります。', 'sweat']
      ],
      homeStove: [
        ['', '町の人から譲り受けた、小さな薪ストーブ。がたついていた脚は、トウマが直した。', { se: 'fire' }],
        ['nina', '今夜の火の番は、私ね。'],
        ['touma', '寝る前に、二人で確かめよう。']
      ],
      toumaRoom: [
        ['', 'トウマの部屋。きちんと整えた寝床の脇に、修理道具と読みかけの本がある。'],
        ['nina', '入る時は、ちゃんとノックするからね。'],
        ['touma', '俺もそうする。']
      ],
      ninaRoom: [
        ['', 'ニナの部屋。寝床には、何度も繕った毛布。小さな棚に、お気に入りの糸が並んでいる。'],
        ['touma', '窓から冷気は入らないか。'],
        ['nina', '大丈夫。トウマが直してくれたから。', 'happy']
      ],
      koharuBed: [
        ['', 'コハルの寝台。若草色の毛布の端に、小さな花がいくつも縫い付けられている。'],
        ['touma', 'この前まで布の切れ端だったのに、いつの間に。'],
        ['nina', '私が余り糸をあげたら、毎晩ちょっとずつ縫ってたよ。', 'happy'],
        ['', 'まくら元には三人で撮った写真。裏には「寝坊したら三回起こすこと」と、丸い字で書いてある。']
      ],
      koharuHerbs: [
        ['', '薬草と小瓶の棚。葉の形を描いた札が、一つずつ瓶に結んである。'],
        ['touma', '見分けやすいように、絵にしたのか。'],
        ['', '隅には二人分の手当て袋。コハルがいつでも持っていけるように詰めてある。']
      ],
      koharuDesk: [
        ['', 'コハルの薬草机。開いた手帳には、ユラに教わった薬の分量と、失敗した日のことが丁寧に並ぶ。'],
        ['', '最後のページには、三つのカップの絵。「帰ったらお茶」。'],
        ['touma', '……湯を沸かしておくか。']
      ],
      koharuKeepsakes: [
        ['', '小さな箱には、押し花と古い帰り結び。三人で雪だるまを作った日の絵も、折らずにしまってある。'],
        ['touma', '……あの時の、まだ持ってたのか。'],
        ['', '絵の隅には、後から増えた文字。「また三人で」。']
      ],
      homeShelf: [
        [
          '',
          '古い家の鍵と、一枚の写真。この家を大掃除した日に、町の人たちと撮ったものだ。\n三人を見守ってきた、町の人たちの顔が並んでいる。'
        ],
        ['nina', 'この日、町じゅうの人が来てくれたんだよね。'],
        ['touma', 'マロさんは掃除より、パンを配る方が忙しそうだった。'],
        ['nina', 'それも大事なお仕事。', 'happy']
      ],
      homeSewing: [
        ['', '窓辺の繕い机。ニナの針箱の隣に、トウマの予備の留め金の箱。\n互いの道具が、少しずつ相手の側へはみ出している。'],
        ['nina', 'この机、半分使っていいよ。'],
        ['touma', 'もう半分、借りてる。'],
        ['nina', 'うん。知ってる。', 'happy']
      ]
    };
    if (lines[id]) {
      talk(lines[id]);
      return true;
    }
    return false;
  }
  function move(dx, dy) {
    if (mode !== 'explore') return false;
    const x = state.x + dx,
      y = state.y + dy;
    if (!S.walkable(state, x, y)) return false;
    state.x = x;
    state.y = y;
    Sfx?.play(['house', 'koharuRoom', 'clinic', 'lampworkshop'].includes(state.scene) ? 'stepWood' : 'step');
    updateHud();
    return true;
  }
  function pathTo(tx, ty) {
    if (mode !== 'explore') return;
    const o = S.activeObjects(state).find(o => Math.hypot(o.x - tx, o.y - ty) < 1);
    const goal = (x, y) => (o ? Math.hypot(o.x - x, o.y - y) < 1.5 : x === tx && y === ty);
    const seen = new Set([state.x + ',' + state.y]),
      q = [[state.x, state.y, []]];
    let found = null;
    while (q.length) {
      const [x, y, p] = q.shift();
      if (goal(x, y)) {
        found = p;
        break;
      }
      for (const [dx, dy] of [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0]
      ]) {
        let nx = x + dx,
          ny = y + dy,
          key = nx + ',' + ny;
        if (!seen.has(key) && S.walkable(state, nx, ny)) {
          seen.add(key);
          q.push([nx, ny, [...p, [dx, dy]]]);
        }
      }
    }
    if (found) {
      route = found;
      routeTarget = o?.id || null;
      if (!route.length && o) {
        routeTarget = null;
        handle(o.id);
      }
    } else toast('まだ通れない道です。近くの仕掛けを調べよう');
  }
  function tone() {}
  function musicFailure() {
    sound = false;
    bgm.stop();
    Sfx?.enable(false);
    $('soundButton').textContent = '音 OFF';
    toast('音楽を再生できませんでした。もう一度「音 OFF」を押してください。');
  }
  function travelMusic() {
    setMusic(
      D.ambient(state).bgm ||
        (OkaeriMusic.sceneFor
          ? OkaeriMusic.sceneFor(state.scene)
          : ['town', 'house', 'koharuRoom', 'clinic', 'lakeside', 'lampworkshop'].includes(state.scene)
            ? 'village'
            : 'journey')
    );
  }
  function setMusic(scene) {
    bgm.select(scene).catch(musicFailure);
    $('soundButton').title = OkaeriMusic.title ? OkaeriMusic.title(scene) : '';
  }
  function musicCue(name) {
    if (!bgm.cue) return;
    bgm.cue(name === 'scene' ? null : name).catch(musicFailure);
  }
  async function toggleSound() {
    const button = $('soundButton');
    if (button.disabled) return;
    if (sound) {
      sound = false;
      bgm.stop();
      Sfx?.enable(false);
      button.textContent = '音 OFF';
      return;
    }
    button.disabled = true;
    try {
      await bgm.play();
      sound = true;
      Sfx?.enable(true);
      refreshStage();
      button.textContent = '音 ON';
    } catch {
      musicFailure();
    } finally {
      button.disabled = false;
    }
  }
  setMusic('opening');
  function chapterSelect() {
    if (globalThis.OkaeriEpisodes) {
      const enter = (n, r = null, skipPrologue = false) => {
        start(OkaeriEpisodes.create(n, r), n !== 1, chapterSaveKey);
        if (n >= 2 && !skipPrologue) playEpisodePrologue(0, true);
        save();
      };
      const buttons = OkaeriEpisodesData.titles.map((t, i) => [
        '第' + (i + 1) + '話 · ' + t,
        () => {
          if (i === 9)
            openModal(
              '<h2>第10話の関係を選ぶ</h2><p>章選択用です。通常の旅の選択は変わりません。</p>',
              [...C.routes.map((r, k) => [r.select, () => enter(10, r.id), k === 0]), ['戻る', chapterSelect]],
              'title'
            );
          else enter(i + 1);
        }
      ]);
      // 後日譚：最終話を終えた状態を作って、そのまま読み始める。
      const after = r => {
        const s = OkaeriEpisodes.create(10, r);
        s.episode.step = OkaeriEpisodes.events(s).length;
        s.episode.complete = true;
        Object.assign(s, { scene: 'house', x: 11, y: 11 });
        start(s, true, chapterSaveKey);
        save();
        OkaeriEpisodes.epilogue(episodeApi());
      };
      buttons.push([
        '後日譚 · 恋人になった、その先',
        () =>
          openModal(
            '<h2>どの結末の後日譚を読む</h2><p>最終話のあとの、甘い時間だけの読み物です。結末の内容が含まれます。</p>',
            [...C.routes.filter(r => r.epilogue).map((r, k) => [r.epilogue, () => after(r.id), k === 0]), ['戻る', chapterSelect]],
            'title'
          )
      ]);
      if (globalThis.OkaeriJourney)
        buttons.push([
          '第6話の小旅行から',
          () => {
            enter(6, null, true);
            state.episode.step = 2;
            OkaeriJourney.begin(episodeApi());
          }
        ]);
      let replay = null;
      try {
        replay = C.restoreSave(localStorage.getItem(chapterSaveKey));
      } catch {}
      if (replay) buttons.push(['章選択の旅の続き', () => start(replay, true, chapterSaveKey)]);
      buttons.push(['戻る', closeModal]);
      openModal('<h2>章を選ぶ</h2><p>通常の旅と章選択は別々に保存します。第9・10話には結末の内容が含まれます。</p>', buttons, 'title');
      return;
    }

    const enter = id => {
      const s = OkaeriChapters.create(id);
      start(s, id !== 1, chapterSaveKey);
      if (id === 2) handle('canalExit');
      if (id === 3) handle('hillExit');
      if (id === 4) handle('festivalStart');
      save();
    };
    const names = ['第一話 · 森の灯台', '第二話 · 水音の帰る道', '第三話 · 風待ちの丘', '最終話 · 護りの灯火祭り'];
    const buttons = names.map((n, i) => [n, () => enter(i + 1), i === 2]);
    let replay = null;
    try {
      replay = C.restoreSave(localStorage.getItem(chapterSaveKey));
    } catch {}
    if (replay) buttons.push(['章選択の旅の続き', () => start(replay, true, chapterSaveKey)]);
    buttons.push(['戻る', closeModal]);
    openModal(
      '<span class="tag">CHAPTER SELECT</span><h2>好きな章から始める</h2><p>通常の「つづきから」のセーブは残ります。章選択の旅は別枠に保存します。</p><p>各章は必要な前章の出来事を完了した状態で始まります。章を選び直すと、前の章選択の旅は置き換わります。後の章には物語のネタバレがあります。</p>',
      buttons,
      'title'
    );
  }
  $('chapterButton').onclick = chapterSelect;
  $('galleryButton').onclick = () => Stills?.gallery(openModal, closeModal);
  $('startButton').onclick = () => {
    if (saved)
      openModal(
        '<h2>新しい一日を始める</h2><p>保存済みの旅を、新しい旅で上書きします。</p>',
        [
          ['新しく始める', () => start(fresh(), false), true],
          ['戻る', closeModal]
        ],
        'title'
      );
    else start(fresh(), false);
  };
  $('continueButton').onclick = () => {
    let s;
    try {
      s = C.restoreSave(localStorage.getItem(normalSaveKey));
    } catch {}
    if (s) start(s, true);
    else toast('保存データを読めません。はじめから遊べます');
  };
  if ($('chapterCard')) $('chapterCard').onclick = hideChapterCard;
  $('nextDialogue').onclick = () => {
    hideChapterCard();
    nextDialogue();
  };
  $('leadButton').onclick = switchLead;
  $('bagButton').onclick = openBag;
  $('interactButton').onclick = interact;
  $('interactPrompt').onclick = interact; // スマホでは、この札をそのまま押して調べられる
  $('journalButton').onclick = journal;
  // 地図。町のまわりと、世界の中のユキネ。会話や戦闘の外で、いつでも開ける。
  function showMap(which = 'local') {
    if (mode === 'dialogue' || mode === 'battle') {
      toast('会話や戦闘が終わってから開けます');
      return;
    }
    if (mode === 'modal') closeModal();
    const M = globalThis.OkaeriMaps,
      back = mode;
    if (!M) return;
    const svg = which === 'world' ? M.world(state || {}) : M.local(state || {});
    openModal(
      (back === 'explore' ? rpgTabsHtml('map') : '') +
        '<div class="map-sheet" role="img" aria-label="' +
        (which === 'world' ? '世界の中のユキネの地図' : 'ユキネのまわりの地図') +
        '">' +
        svg +
        '</div>' +
        (which === 'world' ? M.lore() : ''),
      [
        [which === 'world' ? '町のまわりを見る' : '世界を見る', () => showMap(which === 'world' ? 'local' : 'world'), true],
        ['閉じる', closeModal]
      ],
      back
    );
    $('modalContent').parentElement?.classList.add('map-card');
  }
  $('mapButton').onclick = () => showMap();
  $('menuButton').onclick = menu;
  $('soundButton').onclick = toggleSound;

  const dirs = {
    ArrowLeft: [-1, 0],
    a: [-1, 0],
    ArrowRight: [1, 0],
    d: [1, 0],
    ArrowUp: [0, -1],
    w: [0, -1],
    ArrowDown: [0, 1],
    s: [0, 1]
  };
  document.addEventListener('keydown', e => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (mode === 'opening') {
      if (!e.repeat && key === 'Escape') {
        e.preventDefault();
        openingFilm.finish();
      }
      return;
    }
    if (mode === 'battle') {
      if (!e.repeat || key.startsWith('Arrow')) classicBattle.key(e);
      return;
    }
    if (dirs[key] && mode === 'explore') {
      e.preventDefault();
      held[key] = true;
      route = [];
      return;
    }
    if (e.repeat) return;
    if ($('chapterCard') && !$('chapterCard').hidden && ['Enter', ' ', 'e', 'Escape'].includes(key)) {
      e.preventDefault();
      hideChapterCard();
      return;
    }
    if ((key === 'Enter' || key === ' ' || key === 'e') && mode === 'dialogue') {
      e.preventDefault();
      if (!queue[queueIndex].choices) nextDialogue();
      return;
    }
    if (e.target.tagName === 'BUTTON' && key === 'Enter') return;
    if (key === 'e' || key === 'Enter') {
      if (mode === 'explore') {
        e.preventDefault();
        interact();
      }
    }
    if (key === 'q') switchLead();
    if (key === 'i') openBag();
    if (key === 'j') journal();
    if (key === 'm') showMap();
    if (key === 'Escape') {
      if (mode === 'modal') {
        if (modalReturn === 'battle') toast('下のボタンから戦闘を進めてください');
        else closeModal();
      } else menu();
    }
  });
  document.addEventListener('keyup', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    delete held[k];
    if (mode === 'explore') save();
  });
  window.addEventListener('blur', () => {
    held = {};
    route = [];
  });
  for (const btn of document.querySelectorAll('[data-move]')) {
    const key = { left: 'a', right: 'd', up: 'w', down: 's' }[btn.dataset.move];
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      held[key] = true;
      route = [];
      btn.setPointerCapture(e.pointerId);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
      btn.addEventListener(event, () => {
        delete held[key];
        if (mode === 'explore') save();
      });
  }
  canvas.addEventListener('pointerdown', e => {
    if (mode !== 'explore') return;
    const r = canvas.getBoundingClientRect();
    const tx = Math.floor(((e.clientX - r.left) / r.width) * 24),
      ty = Math.floor(((e.clientY - r.top) / r.height) * 16);
    pathTo(tx, ty);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      held = {};
      route = [];
      if (mode !== 'title') save();
    }
  });
  function frame(t) {
    typeTick(t);
    if (mode === 'explore' && t - lastMove > 155) {
      const key = Object.keys(held).find(k => dirs[k]);
      if (key) {
        move(...dirs[key]);
        lastMove = t;
      } else if (route.length) {
        const [dx, dy] = route.shift();
        move(dx, dy);
        lastMove = t;
        if (!route.length) {
          save();
          if (routeTarget) {
            const id = routeTarget;
            routeTarget = null;
            handle(id);
          }
        }
      }
    }
    renderer.draw(state, t, mode);
    requestAnimationFrame(frame);
  }
  updateHud();
  Promise.all([OkaeriSprites.load(), OkaeriCast.ready, OkaeriResidentsArt.ready])
    .then(() => requestAnimationFrame(frame))
    .catch(() => toast('キャラクター画像を読み込めませんでした。ページを再読み込みしてください。'));
})();
