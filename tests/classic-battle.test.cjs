const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../core.js');
test('herb restores an ally and consumes one shared item',()=>{let b=C.newBattle('mochi');b.heroes.nina.hp=20;const r=C.resolveTurn(b,{touma:{skill:'herb',target:'nina'},nina:{skill:'guard'}},['touma','nina']);assert.equal(r.items,2);assert.equal(r.heroes.nina.hp,59);});
test('last herb cannot be committed by both party members',()=>{let b=C.newBattle('guardian');b.items=1;assert.throws(()=>C.resolveTurn(b,{touma:{skill:'herb',target:'touma'},nina:{skill:'herb',target:'nina'}},['touma','nina']),/薬草/);assert.equal(b.items,1);assert.equal(b.turn,1);});
test('battle messages carry HP snapshots so damage is not shown before the attack',()=>{const r=C.resolveTurn(C.newBattle('mochi'),{touma:{skill:'attack',target:0},nina:{skill:'fire',target:0}},['touma','nina']);assert.equal(r.events[0].enemies[0].hp,38);assert.equal(r.events[1].enemies[0].hp,18);assert.equal(r.events[0].heroes.nina.hp,90);assert.equal(r.events.at(-1).heroes.nina.hp,78);});

test('Koharu joins as a commanded healer: she heals, revives, shields, and never attacks',()=>{
 const C=require('../core.js'),assert=require('node:assert/strict');
 const plain=C.newBattle('guardian'),helped=C.newBattle('guardian',{support:'koharu'});assert.equal(plain.heroes.koharu,undefined);assert.equal(helped.heroes.koharu.hp,70);
 assert.ok(!C.actions('koharu').some(a=>['attack','rescue'].includes(a.id)));
 const pairCmd={touma:{skill:'attack',target:0},nina:{skill:'attack',target:0}},order=['touma','nina','koharu'];
 assert.throws(()=>C.resolveTurn(helped,pairCmd,order),/技を選んでください/);
 helped.heroes.touma.hp=60;
 let b=C.resolveTurn(helped,{...pairCmd,koharu:{skill:'warm',target:'touma'}},order);
 assert.ok(b.events.some(e=>e.actor==='koharu'&&e.effect?.type==='heal'&&e.effect.hero==='touma'&&e.effect.amount===48));assert.equal(b.heroes.koharu.sp,8);assert.equal(b.gauge,0,'her healing does not charge the pair gauge');
 // 守りの軟膏はそのターンの傷を半分にする（2ターン目はニナへ32）
 const salved=C.resolveTurn(b,{...pairCmd,koharu:{skill:'salve',target:'nina'}},order),bare=C.resolveTurn(b,{...pairCmd,koharu:{skill:'guard'}},order);
 assert.equal(b.heroes.nina.hp-salved.heroes.nina.hp,16);assert.equal(b.heroes.nina.hp-bare.heroes.nina.hp,32);
 // 3ターン目の全体攻撃は、後ろのコハルにも半分届く
 const third=C.resolveTurn(bare,{...pairCmd,koharu:{skill:'tea'}},order);assert.ok(third.events.some(e=>e.effect?.type==='hurt'&&e.effect.hero==='koharu'&&e.effect.amount===8));
 // 倒れた仲間を起こせる。二人とも倒れたら、コハルが立っていても負け。
 const down=C.newBattle('mochi',{support:'koharu'});down.heroes.nina.hp=0;
 assert.throws(()=>C.resolveTurn(down,{touma:{skill:'attack',target:0},koharu:{skill:'rouse',target:'touma'}},order),/倒れている仲間はいません/);
 const up=C.resolveTurn(down,{touma:{skill:'attack',target:0},koharu:{skill:'rouse',target:'nina'}},order);assert.ok(up.heroes.nina.hp>0);
 const lost=C.newBattle('guardian',{support:'koharu'});lost.heroes.nina.hp=0;lost.heroes.touma.hp=1;
 assert.equal(C.resolveTurn(lost,{touma:{skill:'attack',target:0},koharu:{skill:'guard'}},order).status,'defeat');
});
