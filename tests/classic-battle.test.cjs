const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../core.js');
test('herb restores an ally and consumes one shared item',()=>{let b=C.newBattle('mochi');b.heroes.nina.hp=20;const r=C.resolveTurn(b,{touma:{skill:'herb',target:'nina'},nina:{skill:'guard'}},['touma','nina']);assert.equal(r.items,2);assert.equal(r.heroes.nina.hp,59);});
test('last herb cannot be committed by both party members',()=>{let b=C.newBattle('guardian');b.items=1;assert.throws(()=>C.resolveTurn(b,{touma:{skill:'herb',target:'touma'},nina:{skill:'herb',target:'nina'}},['touma','nina']),/薬草/);assert.equal(b.items,1);assert.equal(b.turn,1);});
test('battle messages carry HP snapshots so damage is not shown before the attack',()=>{const r=C.resolveTurn(C.newBattle('mochi'),{touma:{skill:'attack',target:0},nina:{skill:'fire',target:0}},['touma','nina']);assert.equal(r.events[0].enemies[0].hp,38);assert.equal(r.events[1].enemies[0].hp,18);assert.equal(r.events[0].heroes.nina.hp,90);assert.equal(r.events.at(-1).heroes.nina.hp,78);});

test('a supporter warms the colder hero each turn without taking commands',()=>{
 const C=require('../core.js'),assert=require('node:assert/strict');
 const plain=C.newBattle('guardian'),helped=C.newBattle('guardian',{support:'koharu'});assert.equal(plain.support,undefined);
 const cmd={touma:{skill:'attack',target:0},nina:{skill:'attack',target:0}};
 const a=C.resolveTurn(plain,cmd,['touma','nina']),b=C.resolveTurn(helped,cmd,['touma','nina']);
 assert.equal(b.heroes.touma.hp,a.heroes.touma.hp+12);assert.equal(b.support,'koharu');
 assert.ok(b.events.some(e=>e.actor==='koharu'&&e.effect.type==='heal'&&e.effect.amount===12));
 assert.ok(!a.events.some(e=>e.actor==='koharu'));
});
