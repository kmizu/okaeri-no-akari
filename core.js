(function (root) {
  'use strict';
  const skills = {
    touma: [
      { id: 'attack', name: '斬る', cost: 0, desc: '一体に20ダメージ。', target: 'enemy' },
      { id: 'break', name: '崩し斬り', cost: 2, desc: '14ダメージ。次の一撃が1.5倍に。', target: 'enemy' },
      { id: 'protect', name: 'かばう', cost: 0, desc: 'ニナへの単体攻撃を引き受け、半減。' },
      { id: 'counter', name: '灯返し', cost: 2, desc: '防御し、攻撃を受けると24で反撃。' },
      { id: 'cheer', name: '励ます', cost: 2, desc: 'ニナを27回復。冷えも解除。' }
    ],
    nina: [
      { id: 'attack', name: '灯杖で打つ', cost: 0, desc: '一体に14ダメージ。', target: 'enemy' },
      { id: 'fire', name: '火花', cost: 2, desc: '氷殻を溶かし、22ダメージ。', target: 'enemy' },
      { id: 'ring', name: '灯の輪', cost: 3, desc: '敵全体に14ダメージ。' },
      { id: 'heal', name: 'ぬくもり', cost: 2, desc: '味方一人のHPを45％回復。冷え解除。', target: 'ally' },
      { id: 'buff', name: '灯を託す', cost: 2, desc: 'トウマの次の一撃を1.5倍に。氷殻も溶かす。' }
    ], // コハルは剣も火も持たない。薬師見習いとして、後ろから薬で二人を支える。
    koharu: [
      { id: 'tend', name: '手当て', cost: 0, desc: '味方一人のHPを12回復。冷えも解除。', target: 'ally' },
      { id: 'warm', name: '凍傷の軟膏', cost: 2, desc: '味方一人のHPを40％回復。冷えも解除。', target: 'ally' },
      { id: 'tea', name: '薬湯', cost: 3, desc: '立っている全員のHPを18回復。冷えも解除。' },
      { id: 'salve', name: '守りの塗り薬', cost: 1, desc: '味方一人がこのターン受けるダメージを半減。', target: 'ally' },
      { id: 'mint', name: '滋養丸', cost: 2, desc: '味方一人のMPを3回復。', target: 'ally' },
      { id: 'rouse', name: '気付け薬', cost: 4, desc: '倒れた仲間をHP40％で起こす。', target: 'ally' }
    ]
  };
  const common = [
    { id: 'guard', name: '防御', cost: 0, desc: 'このターン受けるダメージを半減。' },
    { id: 'rescue', name: '手を貸す', cost: 0, desc: '倒れた相手をHP30％で起こす。' },
    { id: 'herb', name: '薬草', cost: 0, desc: '味方一人のHPを45回復。冷えも解除。', target: 'ally' },
    { id: 'ointment', name: '凍傷の軟膏', cost: 0, desc: '味方一人のHPを60・MPを2回復。冷えも解除。', target: 'ally' }
  ];
  // 第9話で選ぶ結末の一覧。結末を足す・変える時は、ここと台本（script/）だけを直す。
  //  select: 章選択での呼び名 / epilogue: 後日譚の呼び名（あれば後日譚つき） / flag: 旧来の結末フラグ
  //  koharu: コハルが最終話で同行し、食卓の椅子が三脚になる / night: 第9話の夜の台本の鍵 / ninaAway: 二人きりの場面と後日譚でニナを地図に出さない
  const routes = [
    { id: 'touma', select: 'トウマから告白して恋人', epilogue: 'トウマから告白した二人', flag: 'endingTouma' },
    { id: 'nina', select: 'ニナから告白して恋人', epilogue: 'ニナから告白した二人', flag: 'endingNina' },
    { id: 'friends', select: '今の二人のまま', flag: 'endingFriends' },
    { id: 'koharu', select: 'コハルと：三人で仲良く', koharu: true, night: 'koharu' },
    { id: 'both', select: 'コハルと：コハルのことも選ぶ', epilogue: 'コハルのことも選んだ三人', koharu: true, night: 'both' },
    {
      id: 'koharuLove',
      select: 'コハルと：コハルひとりを選ぶ',
      epilogue: 'コハルひとりを選んだ二人',
      koharu: true,
      night: 'koharuLove',
      ninaAway: true
    }
  ];
  const route = id => routes.find(r => r.id === id) || null;
  const clone = x => JSON.parse(JSON.stringify(x));
  const enemy = (name, hp, type, ice = false) => ({ name, hp, max: hp, type, ice, broken: 0 });
  const MATERIALS = {
    crystal: { id: 'crystal', name: '淡雪の結晶', icon: '❄', desc: '雪の精霊が落とす、手のひらでもすぐには溶けない小さな結晶。' },
    shell: { id: 'shell', name: '氷殻のかけら', icon: '◈', desc: '硬く凍った殻のかけら。剣の砥ぎ粉や金具の補強に使える。' },
    moss: { id: 'moss', name: '陽だまり苔', icon: '❀', desc: '雪の下で温もりを蓄えた柔らかな苔。傷薬や防寒の裏地に最適。' },
    ember: { id: 'ember', name: '星火の樹脂', icon: '✦', desc: '番人や魔獣の縄張りで見つかる、強い火気を宿した琥珀色の樹脂。' }
  };
  const UPGRADES = {
    sword: {
      id: 'sword',
      name: 'トウマの鋼の剣',
      icon: '⚔',
      max: 5,
      desc: '刃を研ぎ直し、柄革を締め直す。一段ごとにトウマの剣技威力＋12％。',
      cost: rank => ({ shell: rank + 1, crystal: 1, ...(rank >= 2 ? { ember: rank - 1 } : {}) })
    },
    staff: {
      id: 'staff',
      name: 'ニナの灯杖・火口',
      icon: '✧',
      max: 5,
      desc: '反射鏡と芯の火口を磨き上げる。一段ごとに灯術の威力と回復量＋12％。',
      cost: rank => ({ crystal: rank + 1, moss: 1, ...(rank >= 1 ? { ember: 1 + Math.floor(rank / 2) } : {}) })
    },
    coat: {
      id: 'coat',
      name: '灯守の防寒外套',
      icon: '❖',
      max: 5,
      desc: '陽だまり苔の綿を裏地に縫い込む。一段ごとに全員の被ダメージ−6％。',
      cost: rank => ({ moss: rank + 1, crystal: 1, ...(rank >= 2 ? { shell: 1 } : {}) })
    }
  };
  const RECIPES = {
    herbPack: {
      id: 'herbPack',
      name: '薬草の手当て包み（＋2）',
      icon: '❀',
      desc: '干し草を揉んで手当て袋の薬草を2包増やす（最大12包）。',
      cost: { moss: 1, crystal: 1 }
    },
    ointmentCraft: {
      id: 'ointmentCraft',
      name: '凍傷の軟膏（＋1）',
      icon: '✦',
      desc: 'コハルの配合メモ通りに軟膏を1瓶練り上げる（最大4瓶）。',
      cost: { moss: 2, crystal: 1 }
    },
    warmTea: {
      id: 'warmTea',
      name: '星火の温め茶（その場で全回復）',
      icon: '☕',
      desc: '樹脂の種火で熱い薬草茶を淹れ、全員のHPとMPを最大まで回復する。',
      cost: { crystal: 1, ember: 1 }
    }
  };
  const ENCOUNTER_REWARDS = {
    mochi: { exp: 18, drops: [['crystal', 2], ['moss', 1]] },
    stray: { exp: 12, drops: [['crystal', 1], ['moss', 1]] },
    moss: { exp: 22, drops: [['moss', 2], ['crystal', 1]] },
    crab: { exp: 26, drops: [['shell', 2], ['crystal', 1]] },
    bat: { exp: 28, drops: [['shell', 2], ['crystal', 1]] },
    hail: { exp: 30, drops: [['crystal', 3]] },
    hare: { exp: 34, drops: [['crystal', 2], ['moss', 1], ['ember', 1]] },
    mix: { exp: 36, drops: [['crystal', 1], ['shell', 2], ['moss', 1]] },
    sleet: { exp: 42, drops: [['shell', 3], ['ember', 1]] },
    echo: { exp: 50, drops: [['moss', 2], ['ember', 2]] },
    guardian: { exp: 65, drops: [['moss', 2], ['ember', 2], ['shell', 1]] },
    beast: { exp: 85, drops: [['ember', 3], ['shell', 2]] },
    pack: { exp: 95, drops: [['ember', 3], ['shell', 2], ['crystal', 1]] },
    alphaBeast: { exp: 180, drops: [['ember', 5], ['shell', 4], ['crystal', 3], ['moss', 2]] }
  };
  const ROAM_POOLS = {
    forest: [
      { kind: 'stray', art: 'mochi', label: 'さまようこごえモチ' },
      { kind: 'moss', art: 'mochi', tint: 'moss', label: 'こけダマ' },
      { kind: 'crab', art: 'crab', label: 'こおりヤドカリ' }
    ],
    canal: [
      { kind: 'crab', art: 'crab', label: '水路のこおりヤドカリ' },
      { kind: 'bat', art: 'crab', tint: 'bat', label: 'つららコウモリ' },
      { kind: 'moss', art: 'mochi', tint: 'moss', label: 'こけダマ' }
    ],
    hill: [
      { kind: 'bat', art: 'crab', tint: 'bat', label: 'つららコウモリ' },
      { kind: 'hare', art: 'mochi', tint: 'hare', label: '灯り雪うさぎ' },
      { kind: 'hail', art: 'mochi', tint: 'hail', label: 'あられモチ' }
    ],
    herbvale: [
      { kind: 'moss', art: 'mochi', tint: 'moss', label: 'こけダマ' },
      { kind: 'hare', art: 'mochi', tint: 'hare', label: '灯り雪うさぎ' },
      { kind: 'sleet', art: 'crab', tint: 'sleet', label: 'みぞれヤドカリ' }
    ],
    oldpass: [
      { kind: 'hare', art: 'mochi', tint: 'hare', label: '灯り雪うさぎ' },
      { kind: 'bat', art: 'crab', tint: 'bat', label: 'つららコウモリ' },
      { kind: 'pack', art: 'guardian', tint: 'beast', beast: true, label: 'はぐれ灯喰い' }
    ]
  };
  function rpgNextExp(lv) {
    return lv >= 10 ? 0 : 35 + (lv - 1) * 25;
  }
  function rpgStats(rpg) {
    const lv = Math.max(1, Math.min(10, Number(rpg?.lv) || 1)),
      gear = rpg?.gear || { sword: 0, staff: 0, coat: 0 },
      spBonus = Math.floor((lv - 1) / 2);
    return {
      lv,
      touma: { max: 120 + (lv - 1) * 10, maxSp: 6 + spBonus },
      nina: { max: 90 + (lv - 1) * 8, maxSp: 8 + spBonus },
      koharu: { max: 70 + (lv - 1) * 7, maxSp: 10 + spBonus },
      atkMult: +(1 + (lv - 1) * 0.06 + (gear.sword || 0) * 0.12).toFixed(3),
      magMult: +(1 + (lv - 1) * 0.06 + (gear.staff || 0) * 0.12).toFixed(3),
      defMult: +Math.max(0.45, 1 - (lv - 1) * 0.025 - (gear.coat || 0) * 0.06).toFixed(3)
    };
  }
  function createRpg(chapter = 1) {
    const lv = chapter <= 1 ? 1 : chapter <= 3 ? 2 : chapter <= 5 ? 3 : chapter <= 7 ? 4 : chapter === 8 ? 5 : 6,
      st = rpgStats({ lv, gear: { sword: 0, staff: 0, coat: 0 } }),
      starter = chapter > 1;
    return {
      lv,
      exp: 0,
      herbs: chapter >= 8 ? 5 : 3,
      hp: { touma: st.touma.max, nina: st.nina.max, koharu: st.koharu.max },
      sp: { touma: st.touma.maxSp, nina: st.nina.maxSp, koharu: st.koharu.maxSp },
      gear: { sword: 0, staff: 0, coat: 0 },
      mats: starter
        ? { crystal: 2, shell: 2, moss: 2, ember: chapter >= 8 ? 2 : 1 }
        : { crystal: 0, shell: 0, moss: 0, ember: 0 }
    };
  }
  function ensureRpg(state) {
    if (!state.rpg) state.rpg = createRpg(state.episode?.chapter || 1);
    return state.rpg;
  }
  function rpgFullHeal(state) {
    const rpg = ensureRpg(state),
      st = rpgStats(rpg);
    rpg.hp = { touma: st.touma.max, nina: st.nina.max, koharu: st.koharu.max };
    rpg.sp = { touma: st.touma.maxSp, nina: st.nina.maxSp, koharu: st.koharu.maxSp };
    if (rpg.herbs < 3) rpg.herbs = 3;
    return rpg;
  }
  function rpgSyncAfterBattle(state, battle, isVictory = true) {
    const rpg = ensureRpg(state);
    if (battle) {
      if (Number.isInteger(battle.items)) rpg.herbs = Math.max(0, Math.min(12, battle.items));
      for (const id of ['touma', 'nina', 'koharu']) {
        if (battle.heroes?.[id]) {
          rpg.hp[id] = Math.max(0, battle.heroes[id].hp);
          rpg.sp[id] = Math.max(0, battle.heroes[id].sp);
        }
      }
      if (rpg.hp.touma <= 0 && rpg.hp.nina <= 0) rpg.hp.touma = 1;
    }
    if (!isVictory) return { exp: 0, drops: [], leveledUp: false, lv: rpg.lv };
    const reward = ENCOUNTER_REWARDS[battle?.kind] || { exp: 15, drops: [['crystal', 1]] };
    rpg.exp += reward.exp;
    const drops = [];
    for (const [mat, qty] of reward.drops) {
      rpg.mats[mat] = Math.min(999, (rpg.mats[mat] || 0) + qty);
      drops.push({ id: mat, name: MATERIALS[mat].name, icon: MATERIALS[mat].icon, qty });
    }
    let leveledUp = false;
    while (rpg.lv < 10 && rpg.exp >= rpgNextExp(rpg.lv)) {
      rpg.exp -= rpgNextExp(rpg.lv);
      rpg.lv++;
      leveledUp = true;
    }
    if (leveledUp) {
      const st = rpgStats(rpg);
      rpg.hp = { touma: st.touma.max, nina: st.nina.max, koharu: st.koharu.max };
      rpg.sp = { touma: st.touma.maxSp, nina: st.nina.maxSp, koharu: st.koharu.maxSp };
    }
    return { exp: reward.exp, drops, leveledUp, lv: rpg.lv };
  }
  function rpgCanAfford(mats, cost) {
    return Object.entries(cost).every(([k, need]) => !need || (mats?.[k] || 0) >= need);
  }
  function rpgSpend(mats, cost) {
    for (const [k, need] of Object.entries(cost)) if (need) mats[k] = Math.max(0, (mats[k] || 0) - need);
  }
  function rpgUpgrade(state, key) {
    const spec = UPGRADES[key];
    if (!spec) return { ok: false, reason: '不明な装備です' };
    const rpg = ensureRpg(state),
      rank = rpg.gear[key] || 0;
    if (rank >= spec.max) return { ok: false, reason: 'これ以上は強化できません' };
    const cost = spec.cost(rank);
    if (!rpgCanAfford(rpg.mats, cost)) return { ok: false, reason: '素材が足りません' };
    rpgSpend(rpg.mats, cost);
    rpg.gear[key] = rank + 1;
    return { ok: true, rank: rpg.gear[key], name: spec.name };
  }
  function rpgCraft(state, recipeId) {
    const spec = RECIPES[recipeId];
    if (!spec) return { ok: false, reason: '不明な調合です' };
    const rpg = ensureRpg(state);
    if (recipeId === 'herbPack' && rpg.herbs >= 12) return { ok: false, reason: '薬草はこれ以上持てません（最大12包）' };
    if (recipeId === 'ointmentCraft' && (state.ointments || 0) >= 4)
      return { ok: false, reason: '凍傷の軟膏は最大4瓶までです' };
    const st = rpgStats(rpg);
    if (
      recipeId === 'warmTea' &&
      rpg.hp.touma >= st.touma.max &&
      rpg.hp.nina >= st.nina.max &&
      rpg.hp.koharu >= st.koharu.max &&
      rpg.sp.touma >= st.touma.maxSp &&
      rpg.sp.nina >= st.nina.maxSp &&
      rpg.sp.koharu >= st.koharu.maxSp
    )
      return { ok: false, reason: '全員すでに元気いっぱいです' };
    if (!rpgCanAfford(rpg.mats, spec.cost)) return { ok: false, reason: '素材が足りません' };
    rpgSpend(rpg.mats, spec.cost);
    if (recipeId === 'herbPack') rpg.herbs = Math.min(12, rpg.herbs + 2);
    else if (recipeId === 'ointmentCraft') {
      state.flags.ointmentGiven = true;
      state.ointments = Math.min(4, (state.ointments || 0) + 1);
    } else if (recipeId === 'warmTea') rpgFullHeal(state);
    return { ok: true, name: spec.name };
  }
  function rpgUseHerbField(state) {
    const rpg = ensureRpg(state),
      st = rpgStats(rpg);
    if (rpg.herbs <= 0) return { ok: false, reason: '薬草がありません' };
    if (rpg.hp.touma >= st.touma.max && rpg.hp.nina >= st.nina.max && rpg.hp.koharu >= st.koharu.max)
      return { ok: false, reason: '全員のHPは満タンです' };
    rpg.herbs--;
    for (const id of ['touma', 'nina', 'koharu']) {
      rpg.hp[id] = Math.min(st[id].max, (rpg.hp[id] || 0) + 45);
      rpg.sp[id] = Math.min(st[id].maxSp, (rpg.sp[id] || 0) + 1);
    }
    return { ok: true, herbs: rpg.herbs };
  }
  function newBattle(kind, options = {}) {
    const groups = {
      mochi: [enemy('こごえモチ', 38, 'mochi'), enemy('こごえモチ', 38, 'mochi')],
      crab: [enemy('こおりヤドカリ', 65, 'crab', true)],
      moss: [
        { ...enemy('こけダマ', 46, 'mochi'), tint: 'moss', moss: true },
        { ...enemy('こけダマ', 46, 'mochi'), tint: 'moss', moss: true }
      ],
      bat: [
        { ...enemy('つららコウモリ', 52, 'crab', true), tint: 'bat', bat: true },
        { ...enemy('つららコウモリ', 52, 'crab', true), tint: 'bat', bat: true }
      ],
      hare: [{ ...enemy('灯り雪うさぎ', 72, 'mochi'), tint: 'hare', hare: true }],
      hail: [0, 1, 2].map(() => ({ ...enemy('あられモチ', 30, 'mochi'), tint: 'hail', scale: 0.85 })),
      sleet: [{ ...enemy('みぞれヤドカリ', 85, 'crab', true), tint: 'sleet', refreeze: true }],
      stray: [enemy('こごえモチ', 38, 'mochi')],
      mix: [enemy('こごえモチ', 38, 'mochi'), enemy('こおりヤドカリ', 65, 'crab', true)],
      echo: [{ ...enemy('こだま番人', 125, 'guardian'), tint: 'echo', scale: 0.6 }],
      // 魔獣。精霊と違って、温めても落ち着かない。灯りを持つニナを狙う。
      beast: [{ ...enemy('灯喰い', 170, 'guardian'), tint: 'beast', beast: true }],
      pack: [
        { ...enemy('灯喰い', 130, 'guardian'), tint: 'beast', beast: true, scale: 0.85 },
        { ...enemy('灯喰い', 130, 'guardian'), tint: 'beast', beast: true, scale: 0.85 }
      ],
      alphaBeast: [
        {
          ...enemy('隻眼の大灯喰い', 400, 'guardian', true),
          tint: 'alphaBeast',
          beast: true,
          boss: true,
          enraged: false,
          charged: false
        }
      ],
      guardian: [enemy('枝角の番人', 230, 'guardian')]
    };
    if (!groups[kind]) throw Error('Unknown encounter');
    const rpg = options.rpg || null,
      st = rpg ? rpgStats(rpg) : null,
      healAll = !!options.fullHeal;
    const mkHero = (id, name, baseHp, baseSp) => {
      if (!st) return { name, hp: baseHp, max: baseHp, sp: baseSp, maxSp: baseSp, chill: 0, buff: 0 };
      const max = st[id].max,
        maxSp = st[id].maxSp,
        hp = healAll ? max : Math.max(0, Math.min(max, rpg.hp?.[id] ?? max)),
        sp = healAll ? maxSp : Math.max(0, Math.min(maxSp, rpg.sp?.[id] ?? maxSp));
      return { name, hp, max, sp, maxSp, chill: 0, buff: 0 };
    };
    const heroes = {
      touma: mkHero('touma', 'トウマ', 120, 6),
      nina: mkHero('nina', 'ニナ', 90, 8),
      ...(options.support === 'koharu' ? { koharu: mkHero('koharu', 'コハル', 70, 10) } : {})
    };
    if (st && heroes.touma.hp <= 0 && heroes.nina.hp <= 0) heroes.touma.hp = Math.max(1, Math.round(heroes.touma.max * 0.3));
    return {
      kind,
      turn: 1,
      gauge: 0,
      items: st ? (healAll ? Math.max(3, rpg.herbs ?? 3) : (rpg.herbs ?? 3)) : 3,
      ...(options.ointments !== undefined ? { ointments: options.ointments } : {}),
      ...(st ? { rpgMods: { atk: st.atkMult, mag: st.magMult, def: st.defMult } } : {}),
      status: 'active',
      logs: [],
      ...(options.support ? { support: options.support } : {}),
      enemies: groups[kind],
      heroes
    };
  }
  function intentions(b) {
    return b.enemies.map((e, i) => {
      if (e.hp <= 0) return null;
      const k = n => Math.round(n * (e.scale || 1));
      if (e.boss) {
        if (e.charged) {
          return {
            target: 'all',
            damage: 30,
            chill: true,
            chargeAttack: true,
            label: '黒霜の猛突進（火花・崩し斬り・連携で阻止！） → 全員に30・冷え'
          };
        }
        if (e.enraged) {
          return b.turn % 2 === 0
            ? {
                target: 'all',
                damage: 12,
                startCharge: true,
                label: '黒吹雪を纏い身構える（次ターン大技！） → 全員に12'
              }
            : { target: 'nina', damage: 32, label: '執念の凍牙 → ニナ 32' };
        }
        const phase = (b.turn - 1) % 3;
        return phase === 0
          ? { target: 'nina', damage: 26, label: '凍牙の飛びかかり → ニナ 26' }
          : phase === 1
            ? { target: 'all', damage: 16, chill: true, label: '吹雪の咆哮 → 全員に16・冷え' }
            : { target: 'touma', damage: 30, label: '灯台砕きの大爪 → トウマ 30' };
      }
      if (e.beast) {
        const phase = (b.turn - 1) % 3;
        return phase === 0
          ? { target: 'nina', damage: k(24), label: '灯りへ飛びかかる → ニナ ' + k(24) }
          : phase === 1
            ? { target: 'nina', damage: k(30), label: '牙 → ニナ ' + k(30) }
            : { target: 'all', damage: k(14), label: '咆哮 → 二人に' + k(14) };
      }
      if (e.bat) {
        const target = (b.turn + i) % 2 ? 'nina' : 'touma',
          chilling = b.turn % 2 === 0;
        return {
          target,
          damage: 15,
          chill: chilling,
          label: (chilling ? '氷柱の羽ばたき → ' : '急降下 → ') + (target === 'touma' ? 'トウマ' : 'ニナ') + ' 15' + (chilling ? '・冷え' : '')
        };
      }
      if (e.hare) {
        return b.turn % 2
          ? { target: 'touma', damage: 15, label: '雪跳ねステップ → トウマ 15' }
          : { target: 'nina', damage: 18, label: '灯りまといの体当たり → ニナ 18' };
      }
      if (e.type === 'guardian') {
        const phase = (b.turn - 1) % 3;
        return phase === 0
          ? { target: 'touma', damage: k(18), label: '枝の腕 → トウマ ' + k(18) }
          : phase === 1
            ? { target: 'nina', damage: k(32), label: '大きな踏み込み → ニナ ' + k(32) }
            : { target: 'all', damage: k(16), label: '木の葉の嵐 → 二人に' + k(16) };
      }
      if (e.type === 'crab')
        return {
          target: b.turn % 2 ? 'touma' : 'nina',
          damage: 16,
          chill: true,
          label: '冷たいしぶき → ' + (b.turn % 2 ? 'トウマ' : 'ニナ') + ' 16・冷え'
        };
      const target = (b.turn + i) % 2 ? 'touma' : 'nina';
      return {
        target,
        damage: k(e.moss ? 13 : 12),
        label: (e.moss ? 'ふかふか体当たり → ' : 'ぽよん体当たり → ') + (target === 'touma' ? 'トウマ' : 'ニナ') + ' ' + k(e.moss ? 13 : 12)
      };
    });
  }
  function actions(actor) {
    return actor === 'koharu' ? [...skills.koharu, ...common.filter(a => a.id !== 'rescue')] : [...skills[actor], ...common];
  }
  function resolveTurn(input, commands, order) {
    if (input.status !== 'active') throw Error('戦闘は終了しています');
    if (
      !Array.isArray(order) ||
      new Set(order).size !== order.length ||
      !['touma', 'nina'].every(x => order.includes(x)) ||
      !order.every(x => x === 'touma' || x === 'nina' || (x === 'koharu' && input.heroes.koharu))
    )
      throw Error('行動順が不正です');
    const pair = h => [h.touma, h.nina];
    if (commands.team) {
      if (commands.team !== 'flare' || input.gauge < 3 || pair(input.heroes).some(h => h.hp <= 0))
        throw Error('連携には二人と灯り三つが必要です');
    } else
      for (const id of order) {
        const h = input.heroes[id];
        if (h.hp <= 0) continue;
        const a = actions(id).find(a => a.id === commands[id]?.skill);
        if (!a) throw Error('技を選んでください');
        if (h.sp < a.cost) throw Error('SPが足りません');
        if (
          a.target === 'enemy' &&
          (!Number.isInteger(commands[id].target) || !input.enemies[commands[id].target] || input.enemies[commands[id].target].hp <= 0)
        )
          throw Error('相手を選んでください');
        if (a.target === 'ally' && !input.heroes[commands[id].target]) throw Error('味方を選んでください');
        if (a.id === 'rouse' && !(['touma', 'nina'].includes(commands[id].target) && input.heroes[commands[id].target].hp <= 0))
          throw Error('倒れている仲間はいません');
        if (a.id === 'rescue' && (id === 'koharu' || input.heroes[id === 'touma' ? 'nina' : 'touma'].hp > 0))
          throw Error('二人とも立っています');
      }
    if (!commands.team && order.filter(id => input.heroes[id].hp > 0 && commands[id]?.skill === 'herb').length > (input.items || 0))
      throw Error('薬草が足りません');
    if (!commands.team && order.filter(id => input.heroes[id].hp > 0 && commands[id]?.skill === 'ointment').length > (input.ointments || 0))
      throw Error('凍傷の軟膏が足りません');
    const b = clone(input),
      forecast = intentions(b),
      log = (b.logs = []);
    let cooperation = false,
      protect = false;
    const events = [];
    delete b.events;
    function emit(message, effect = null, actor = null) {
      log.push(message);
      events.push({
        message,
        effect,
        ...(actor ? { actor } : {}),
        heroes: clone(b.heroes),
        enemies: clone(b.enemies),
        gauge: b.gauge,
        items: b.items,
        ...(b.ointments !== undefined ? { ointments: b.ointments } : {})
      });
    }
    const defending = new Set(),
      counters = new Set(),
      fallen = new Set(order.filter(id => b.heroes[id].hp <= 0)),
      mods = b.rpgMods || null,
      atkMul = mods ? mods.atk : 1,
      magMul = mods ? mods.mag : 1,
      defMul = mods ? mods.def : 1;
    function checkBossPhase(e) {
      if (!e.boss || e.hp <= 0 || e.enraged || e.hp > Math.floor(e.max / 2)) return;
      e.enraged = true;
      e.ice = true;
      emit('隻眼の大灯喰いが傷ついた左目を赫く燃やし、猛吹雪を巻き上げて咆哮した！　氷の鎧が再び凍りつく！');
      const assist = Math.min(e.hp - 1, 35);
      if (assist > 0) e.hp -= assist;
      e.broken = 2;
      b.gauge = Math.min(3, b.gauge + 2);
      emit(
        '傷だらけの尾根の番人が横合いから枝角で体当たりした！　隻眼の大灯喰いに ' +
          assist +
          '、体勢が大きく崩れた！（灯り＋2）',
        { type: 'slash', enemy: b.enemies.indexOf(e), amount: assist }
      );
    }
    function interruptCharge(e, canBreak) {
      if (e.boss && e.charged && canBreak && e.hp > 0) {
        e.charged = false;
        e.broken = 2;
        emit('灯りの一撃が黒吹雪を貫き、隻眼の大灯喰いの猛突進を阻止した！');
      }
    }
    function hit(e, n, fire = false, who, style = 'slash', afterDamage = null, canBreakCharge = false) {
      if (e.hp <= 0) return;
      if (fire && e.ice) {
        e.ice = false;
        emit(e.name + 'の氷殻が溶けた！');
      }
      if (e.broken) {
        n *= 1.5;
        e.broken = 0;
        if (who === 'nina') cooperation = true;
      }
      if (e.ice) n *= 0.5;
      n = Math.round(n);
      e.hp = Math.max(0, e.hp - n);
      if (afterDamage) afterDamage();
      emit(
        e.name + 'に ' + n + '。' + (e.hp === 0 ? (e.beast ? '北の峰の吹雪へと退いていった。' : '落ち着きを取り戻した。') : ''),
        { type: who === 'team' ? 'team' : fire ? 'fire' : style, enemy: b.enemies.indexOf(e), amount: n },
        who
      );
      interruptCharge(e, fire || who === 'team' || canBreakCharge);
      checkBossPhase(e);
    }
    function heal(id, amount, actor) {
      const h = b.heroes[id];
      if (h.hp <= 0) {
        emit('倒れている相手には「手を貸す」を使おう。');
        return;
      }
      const before = h.hp;
      if (actor !== 'koharu') cooperation ||= h.hp < h.max || h.chill > 0;
      h.hp = Math.min(h.max, h.hp + amount);
      h.chill = 0;
      emit(h.name + 'のHPが ' + (h.hp - before) + ' 回復。', { type: 'heal', hero: id, amount: h.hp - before }, actor);
    }
    if (commands.team) {
      b.gauge = 0;
      emit('「合わせるぞ！」「うん！」── 灯火の一閃！', null, 'team');
      hit(
        b.enemies.find(e => e.hp > 0),
        mods ? Math.round(75 * ((atkMul + magMul) / 2)) : 75,
        true,
        'team',
        'slash',
        null,
        true
      );
    } else
      for (const id of order) {
        if (fallen.has(id)) continue;
        const h = b.heroes[id],
          c = commands[id],
          a = actions(id).find(a => a.id === c.skill),
          other = id === 'touma' ? 'nina' : 'touma';
        h.sp -= a.cost;
        emit(
          h.name + 'の「' + a.name + '」。',
          ['protect', 'guard', 'counter'].includes(c.skill) ? { type: 'shield', hero: id } : null,
          id
        );
        let e = b.enemies[c.target];
        if (a.target === 'enemy' && e?.hp <= 0) e = b.enemies.find(e => e.hp > 0);
        const roleMul = id === 'touma' ? atkMul : magMul;
        const power = n => n * roleMul * (h.chill ? 0.75 : 1) * (h.buff ? 1.5 : 1);
        if (['attack', 'break', 'fire'].includes(c.skill) && e) {
          const buff = h.buff > 0;
          hit(
            e,
            power(c.skill === 'fire' ? 22 : c.skill === 'break' ? 14 : id === 'touma' ? 20 : 14),
            c.skill === 'fire' || buff,
            id,
            'slash',
            () => {
              h.buff = 0;
              if (buff) cooperation = true;
              if (c.skill === 'break' && e.hp > 0) e.broken = 2;
            },
            c.skill === 'break'
          );
        }
        if (c.skill === 'ring') for (const foe of b.enemies) hit(foe, power(14), false, id, 'ring');
        if (c.skill === 'protect') protect = true;
        if (c.skill === 'guard' || c.skill === 'counter') defending.add(id);
        if (c.skill === 'counter') counters.add(id);
        if (c.skill === 'heal') heal(c.target, Math.round(b.heroes[c.target].max * 0.45 * (mods ? Math.min(1.35, 1 + (magMul - 1) * 0.4) : 1)), id);
        if (c.skill === 'herb') {
          b.items--;
          heal(c.target, 45, id);
        }
        if (c.skill === 'ointment') {
          b.ointments--;
          heal(c.target, 60, id);
          const t = b.heroes[c.target];
          if (t.hp > 0) {
            const sb = t.sp;
            t.sp = Math.min(t.maxSp, t.sp + 2);
            if (t.sp > sb) emit(t.name + 'のMPが ' + (t.sp - sb) + ' 戻った。', null, id);
          }
        }
        if (c.skill === 'cheer') heal('nina', Math.round(27 * atkMul), id);
        if (c.skill === 'buff') {
          b.heroes.touma.buff = 2;
          emit('トウマの剣に灯りが宿った。', { type: 'heal', hero: 'touma' }, id);
        }
        if (c.skill === 'tend') heal(c.target, Math.round(12 * magMul), id);
        if (c.skill === 'warm') heal(c.target, Math.round(b.heroes[c.target].max * 0.4 * (mods ? Math.min(1.35, 1 + (magMul - 1) * 0.4) : 1)), id);
        if (c.skill === 'tea') for (const t of Object.keys(b.heroes)) if (b.heroes[t].hp > 0) heal(t, Math.round(18 * magMul), id);
        if (c.skill === 'salve') {
          defending.add(c.target);
          emit(b.heroes[c.target].name + 'に守りの塗り薬を塗った。このターンの傷は半分で済む。', { type: 'shield', hero: c.target }, id);
        }
        if (c.skill === 'mint') {
          const t = b.heroes[c.target],
            before = t.sp;
          t.sp = Math.min(t.maxSp, t.sp + 3);
          emit(t.name + 'のMPが ' + (t.sp - before) + ' 戻った。', { type: 'heal', hero: c.target }, id);
        }
        if (c.skill === 'rouse') {
          const t = b.heroes[c.target];
          t.hp = Math.round(t.max * 0.4);
          emit('「起きて、お兄ちゃんたちの番だよ」── ' + t.name + 'が立ち上がった。', { type: 'heal', hero: c.target, amount: t.hp }, id);
        }
        if (c.skill === 'rescue') {
          b.heroes[other].hp = Math.round(b.heroes[other].max * 0.3);
          emit(
            '「大丈夫。手、貸して」── ' + b.heroes[other].name + 'が立ち上がった。',
            { type: 'heal', hero: other, amount: b.heroes[other].hp },
            id
          );
        }
      }
    if (b.enemies.every(e => e.hp <= 0)) b.status = 'victory';
    else
      for (let i = 0; i < b.enemies.length; i++) {
        const e = b.enemies[i],
          f = forecast[i];
        if (e.hp <= 0 || !f) continue;
        if (f.chargeAttack) {
          if (!e.charged) {
            emit(e.name + 'は体勢を崩し、動けない！', null, 'enemy:' + i);
            continue;
          }
          e.charged = false;
        }
        for (let target of f.target === 'all' ? ['touma', 'nina'] : [f.target]) {
          if (b.heroes[target].hp <= 0) {
            if (f.target === 'all') continue;
            target = target === 'touma' ? 'nina' : 'touma';
          }
          let covered = false;
          if (target === 'nina' && protect && b.heroes.touma.hp > 0 && f.target !== 'all') {
            target = 'touma';
            covered = true;
            cooperation = true;
          }
          const h = b.heroes[target];
          let n = Math.max(1, Math.round(f.damage * defMul * (covered || defending.has(target) ? 0.5 : 1)));
          h.hp = Math.max(0, h.hp - n);
          if (f.chill) h.chill = 3;
          emit(
            (covered ? 'トウマがニナをかばった！ ' : '') + h.name + 'に ' + n + ' ダメージ。',
            { type: 'hurt', hero: target, source: i, amount: n, covered },
            'enemy:' + i
          );
          if (counters.has(target) && h.hp > 0) {
            hit(e, Math.round(24 * atkMul), false, target);
            counters.delete(target);
          }
        }
        const k = b.heroes.koharu;
        if (f.target === 'all' && k && k.hp > 0) {
          const n = Math.max(1, Math.round(f.damage * defMul * 0.5 * (defending.has('koharu') ? 0.5 : 1)));
          k.hp = Math.max(0, k.hp - n);
          emit(
            '後ろのコハルにも ' + n + ' ダメージ。' + (k.hp === 0 ? 'コハルは下がって、息を整える。' : ''),
            { type: 'hurt', hero: 'koharu', source: i, amount: n },
            'enemy:' + i
          );
        }
        if (f.startCharge && e.hp > 0) {
          e.charged = true;
          emit(e.name + 'が黒い吹雪を身に纏い、低く身構えた！　次のターン、猛突進が来る！');
        }
      }
    if (cooperation) b.gauge = Math.min(3, b.gauge + 1);
    for (const h of Object.values(b.heroes)) {
      h.chill = Math.max(0, h.chill - 1);
      h.buff = Math.max(0, h.buff - 1);
    }
    for (const e of b.enemies) e.broken = Math.max(0, e.broken - 1);
    // みぞれヤドカリは、溶かした殻が三ターンごとに凍り直す。
    for (const e of b.enemies)
      if (e.refreeze && e.hp > 0 && !e.ice && b.turn % 3 === 0) {
        e.ice = true;
        emit(e.name + 'の殻が、また凍りついた。');
      }
    if (pair(b.heroes).every(h => h.hp <= 0)) b.status = 'defeat';
    else if (b.enemies.every(e => e.hp <= 0)) b.status = 'victory';
    if (cooperation) emit('二人の息が合った。灯りが一つ、ともった。');
    b.events = events;
    b.turn++;
    return b;
  }
  function journeyTile(scene, x, y) {
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || x > 22 || y < 2 || y > 14) return false;
    if (scene === 'lake')
      return (
        (x >= 2 && x <= 8 && y >= 10 && y <= 13) ||
        (x >= 6 && x <= 10 && y >= 7 && y <= 12) ||
        (x >= 8 && x <= 17 && y >= 6 && y <= 8) ||
        (x >= 16 && x <= 21 && y >= 4 && y <= 8)
      );
    if (scene === 'lakeside')
      return (
        x >= 2 &&
        x <= 21 &&
        y >= 4 &&
        y <= 14 &&
        !(
          (x >= 3 && x <= 7 && y <= 5) ||
          (x >= 9 && x <= 13 && y <= 5) ||
          (x >= 15 && x <= 20 && y <= 6) ||
          (y >= 11 && x >= 8 && !(x >= 15 && x <= 19))
        )
      );
    if (scene === 'lampworkshop')
      return (
        x >= 3 &&
        x <= 20 &&
        y >= 3 &&
        y <= 13 &&
        !(
          (x >= 4 && x <= 8 && y >= 4 && y <= 5) ||
          (x >= 16 && x <= 18 && y >= 4 && y <= 5) ||
          (x === 10 && y === 8) ||
          (x >= 18 && y >= 10 && y <= 11)
        )
      );
    return false;
  }
  function restoreSave(raw) {
    try {
      const s = JSON.parse(raw);
      if (
        !s ||
        s.version !== 1 ||
        !['town', 'forest', 'canal', 'hill', 'house', 'koharuRoom', 'clinic', 'lake', 'lakeside', 'lampworkshop', 'herbvale', 'oldpass'].includes(s.scene) ||
        !Number.isFinite(s.x) ||
        !Number.isFinite(s.y) ||
        s.x < 1 ||
        s.x > 22 ||
        s.y < 2 ||
        s.y > 14 ||
        !['touma', 'nina'].includes(s.lead) ||
        !s.flags ||
        typeof s.flags !== 'object' ||
        Array.isArray(s.flags)
      )
        return null;
      let openingStage;
      if (s.openingStage !== undefined) {
        if (
          !Number.isInteger(s.openingStage) ||
          s.openingStage < 0 ||
          s.openingStage > 1 ||
          s.flags.board === true ||
          s.journey ||
          s.pendingEvening ||
          (s.episode && (s.episode.chapter !== 1 || s.episode.step !== 0 || s.episode.complete)) ||
          s.scene !== (s.openingStage === 0 ? 'house' : 'town')
        )
          return null;
        openingStage = s.openingStage;
      }
      if (s.openingPrelude !== undefined && (s.openingPrelude !== true || openingStage !== 0)) return null;
      let memories;
      if (s.memories !== undefined) {
        if (!s.memories || typeof s.memories !== 'object' || Array.isArray(s.memories)) return null;
        const allowed = {
          gift: ['tea', 'bookmark'],
          sled: ['aligned'],
          window: ['sealed'],
          signal: ['waited'],
          ritsuReturn: ['read'],
          yuraRounds: ['read'],
          unsentLetter: ['read'],
          stormThanks: ['read']
        };
        memories = {};
        for (const [k, v] of Object.entries(s.memories)) {
          if (!allowed[k]?.includes(v)) return null;
          memories[k] = v;
        }
      }
      let episode;
      if (s.episode !== undefined) {
        const e = s.episode,
          counts = [0, 0, 4, 6, 4, 4, 4, 4, 6, 4, 4];
        if (
          !e ||
          !Number.isInteger(e.chapter) ||
          e.chapter < 1 ||
          e.chapter > 10 ||
          !Number.isInteger(e.step) ||
          e.step < 0 ||
          e.step > counts[e.chapter] ||
          typeof e.complete !== 'boolean' ||
          !(e.route === null || route(e.route)) ||
          (e.chapter < 9 && e.route !== null) ||
          (e.chapter === 10 && !e.route) ||
          (e.chapter === 9 && e.step >= 3 !== !!e.route) ||
          (e.chapter > 1 && e.complete !== (e.step === counts[e.chapter]))
        )
          return null;
        episode = { chapter: e.chapter, step: e.step, route: e.route, complete: e.complete };
      }
      let prologueStage;
      if (s.prologueStage !== undefined) {
        if (
          !Number.isInteger(s.prologueStage) ||
          s.prologueStage < 0 ||
          s.prologueStage > 2 ||
          !episode ||
          episode.chapter < 2 ||
          episode.step !== 0 ||
          episode.complete ||
          s.openingStage !== undefined ||
          s.journey ||
          s.pendingEvening
        )
          return null;
        prologueStage = s.prologueStage;
      }
      let journey;
      if (s.journey !== undefined) {
        const j = s.journey,
          keys = ['mirror', 'prism', 'shutter', 'reply'];
        if (
          !j ||
          !Number.isInteger(j.step) ||
          j.step < 0 ||
          j.step > 9 ||
          !episode ||
          episode.chapter < 6 ||
          keys.some(k => typeof j[k] !== 'boolean') ||
          !j.positions
        )
          return null;
        if (
          (j.prism && !j.mirror) ||
          (j.shutter && !j.prism) ||
          (j.reply && !j.shutter) ||
          (j.step < 4 && keys.some(k => j[k])) ||
          (j.step >= 5 && !keys.every(k => j[k]))
        )
          return null;
        if (
          (j.step < 9 && (episode.chapter !== 6 || episode.step !== 2 || episode.complete)) ||
          (j.step === 9 && episode.chapter === 6 && episode.step < 3)
        )
          return null;
        const positions = {};
        for (const actor of ['touma', 'nina']) {
          const p = j.positions[actor];
          if (!p || p.scene !== (actor === 'touma' ? 'lakeside' : 'lampworkshop') || !journeyTile(p.scene, p.x, p.y)) return null;
          positions[actor] = { scene: p.scene, x: p.x, y: p.y };
        }
        if ([4, 5].includes(j.step) && s.scene !== positions[s.lead].scene) return null;
        journey = { step: j.step, mirror: j.mirror, prism: j.prism, shutter: j.shutter, reply: j.reply, positions };
      }
      if (
        ['lake', 'lakeside', 'lampworkshop'].includes(s.scene) &&
        (!journeyTile(s.scene, s.x, s.y) || !episode || episode.chapter < 6 || (!journey && episode.chapter === 6 && episode.step < 3))
      )
        return null;
      const flags = {};
      for (const key of [
        'board',
        'bread',
        'mochi',
        'log',
        'rest',
        'repair',
        'crab',
        'guardian',
        'lit',
        'returned',
        'lamp',
        'sae',
        'gift',
        'canalStarted',
        'waterGate',
        'canalCrab',
        'waterFlow',
        'waterLit',
        'canalRest',
        'waterReturned',
        'hillStarted',
        'windbreak',
        'hillGuardian',
        'hillLens',
        'hillLit',
        'hillRest',
        'festivalStarted',
        'festivalMeal',
        'festivalRibbon',
        'endingTouma',
        'endingNina',
        'endingFriends',
        'sewingAsked',
        'sewingFound',
        'sewingReturned',
        'seamVisible',
        'signAsked',
        'signFixed',
        'signReported',
        'waitingPost',
        'waitingLit',
        'waitingRest',
        'waitingReported',
        'nightOne',
        'nightTwo',
        'nightThree',
        'nightTouma',
        'nightNina',
        'nightFriends',
        'ointmentGiven',
        'ointmentBridge',
        'valeSeen',
        'passSeen',
        'valeHut',
        'passLit',
        'calm_valeHail',
        'calm_valeSleet',
        'calm_passMix',
        'calm_passEcho'
      ])
        flags[key] = s.flags[key] === true;
      if (
        (flags.lit && !flags.guardian) ||
        (flags.guardian && !flags.repair) ||
        (flags.repair && !flags.log) ||
        (flags.log && !flags.mochi) ||
        (s.scene === 'forest' && !flags.board)
      )
        return null;
      if (
        (s.scene === 'canal' && (!flags.canalStarted || !flags.returned || !flags.lit)) ||
        (flags.waterGate && !flags.canalStarted) ||
        (flags.canalCrab && !flags.waterGate) ||
        (flags.waterFlow && !flags.canalCrab) ||
        (flags.waterLit && !flags.waterFlow) ||
        (flags.waterReturned && !flags.waterLit)
      )
        return null;
      if (
        (s.scene === 'hill' && !flags.hillStarted) ||
        (flags.hillStarted && !flags.waterReturned) ||
        (flags.windbreak && !flags.hillStarted) ||
        (flags.hillGuardian && !flags.windbreak) ||
        (flags.hillLens && !flags.hillGuardian) ||
        (flags.hillLit && !flags.hillLens) ||
        (flags.festivalStarted && !flags.hillLit) ||
        ((flags.festivalMeal || flags.festivalRibbon) && !flags.festivalStarted)
      )
        return null;
      if ((flags.waitingLit && !flags.waitingPost) || (flags.waitingReported && !flags.waitingLit)) return null;
      if (
        (flags.sewingReturned && !flags.sewingFound) ||
        (flags.seamVisible && !flags.sewingReturned) ||
        (flags.signReported && !flags.signFixed)
      )
        return null;
      const endings = ['endingTouma', 'endingNina', 'endingFriends'].filter(k => flags[k]);
      if (endings.length > 1 || (endings.length && (!flags.festivalMeal || !flags.festivalRibbon))) return null;
      const nightRequirements = {
        one: 'returned',
        two: 'waterReturned',
        three: 'festivalStarted',
        touma: 'endingTouma',
        nina: 'endingNina',
        friends: 'endingFriends'
      };
      if (['house', 'koharuRoom', 'clinic'].includes(s.scene) && (s.x < 3 || s.x > 20 || s.y < 3 || s.y > 13)) return null;
      for (const [key, requirement] of Object.entries(nightRequirements))
        if (flags['night' + key[0].toUpperCase() + key.slice(1)] && !flags[requirement]) return null;
      if (s.pendingEvening && (!nightRequirements[s.pendingEvening] || !flags[nightRequirements[s.pendingEvening]] || s.scene !== 'house'))
        return null;
      let ointments;
      if (s.ointments !== undefined) {
        if (!Number.isInteger(s.ointments) || s.ointments < 0 || s.ointments > 4) return null;
        ointments = s.ointments;
      }
      let rpg;
      if (s.rpg !== undefined) {
        const r = s.rpg,
          intIn = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
        if (
          !r ||
          typeof r !== 'object' ||
          Array.isArray(r) ||
          !intIn(r.lv, 1, 10) ||
          !intIn(r.exp, 0, 99999) ||
          !intIn(r.herbs, 0, 12) ||
          !r.hp ||
          typeof r.hp !== 'object' ||
          Array.isArray(r.hp) ||
          !r.sp ||
          typeof r.sp !== 'object' ||
          Array.isArray(r.sp) ||
          !r.gear ||
          typeof r.gear !== 'object' ||
          Array.isArray(r.gear) ||
          !r.mats ||
          typeof r.mats !== 'object' ||
          Array.isArray(r.mats) ||
          !['touma', 'nina', 'koharu'].every(k => intIn(r.hp[k], 0, 999) && intIn(r.sp[k], 0, 99)) ||
          !['sword', 'staff', 'coat'].every(k => intIn(r.gear[k], 0, 5)) ||
          !['crystal', 'shell', 'moss', 'ember'].every(k => intIn(r.mats[k], 0, 999))
        )
          return null;
        const st = rpgStats({ lv: r.lv, gear: r.gear });
        rpg = {
          lv: r.lv,
          exp: r.exp,
          herbs: r.herbs,
          hp: {
            touma: Math.min(st.touma.max, r.hp.touma),
            nina: Math.min(st.nina.max, r.hp.nina),
            koharu: Math.min(st.koharu.max, r.hp.koharu)
          },
          sp: {
            touma: Math.min(st.touma.maxSp, r.sp.touma),
            nina: Math.min(st.nina.maxSp, r.sp.nina),
            koharu: Math.min(st.koharu.maxSp, r.sp.koharu)
          },
          gear: { sword: r.gear.sword, staff: r.gear.staff, coat: r.gear.coat },
          mats: { crystal: r.mats.crystal, shell: r.mats.shell, moss: r.mats.moss, ember: r.mats.ember }
        };
      }
      const fromKoharuRoom = s.scene === 'koharuRoom';
      return {
        ...(s.openingPrelude ? { openingPrelude: true } : {}),
        ...(openingStage !== undefined ? { openingStage } : {}),
        ...(prologueStage !== undefined ? { prologueStage } : {}),
        ...(journey ? { journey } : {}),
        ...(memories ? { memories } : {}),
        ...(episode ? { episode } : {}),
        ...(ointments !== undefined ? { ointments } : {}),
        ...(rpg ? { rpg } : {}),
        ...(s.pendingEvening ? { pendingEvening: s.pendingEvening } : {}),
        version: 1,
        scene: fromKoharuRoom ? 'house' : s.scene,
        x: fromKoharuRoom ? 11 : s.x,
        y: fromKoharuRoom ? 5 : s.y,
        lead: s.lead,
        flags,
        courage: Math.max(0, Math.min(3, Number(s.courage) || 0))
      };
    } catch {
      return null;
    }
  }
  function chooseEnding(choice, courage, response) {
    if (choice === 'confess') return 'touma';
    if (choice === 'stay') return 'friends';
    if (choice === 'wait') {
      if (courage < 2) return 'ask';
      return response === 'yes' ? 'nina' : response === 'notYet' ? 'friends' : 'confession';
    }
    return 'friends';
  }
  const C = {
    routes,
    route,
    newBattle,
    actions,
    resolveTurn,
    intentions,
    restoreSave,
    chooseEnding,
    journeyTile,
    MATERIALS,
    UPGRADES,
    RECIPES,
    ENCOUNTER_REWARDS,
    ROAM_POOLS,
    rpgNextExp,
    rpgStats,
    createRpg,
    ensureRpg,
    rpgFullHeal,
    rpgSyncAfterBattle,
    rpgCanAfford,
    rpgUpgrade,
    rpgCraft,
    rpgUseHerbField
  };
  if (typeof module !== 'undefined') module.exports = C;
  root.OkaeriCore = C;
})(globalThis);
