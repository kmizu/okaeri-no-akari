const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../core.js');
const turn=(b,t,n)=>C.resolveTurn(b,{touma:t,nina:n},['touma','nina']);
test('effects distinguish identical enemies and follow redirected attacks',()=>{
 const b=C.newBattle('mochi');b.enemies[0].hp=10;
 const r=turn(b,{skill:'attack',target:0},{skill:'fire',target:0});
 assert.deepEqual(r.events.filter(e=>e.effect?.enemy!==undefined).map(e=>[e.effect.type,e.effect.enemy]),[['slash',0],['fire',1]]);
 assert.equal(r.events[1].enemies[0].hp,0);assert.equal(b.enemies[0].hp,10);
});
test('healing numbers reflect capped recovery and cover hits the actual recipient',()=>{
 const b=C.newBattle('guardian');b.turn=2;b.heroes.nina.hp=85;
 const r=turn(b,{skill:'protect'},{skill:'heal',target:'nina'});
 assert.deepEqual(r.events.find(e=>e.effect?.type==='heal').effect,{type:'heal',hero:'nina',amount:5});
 assert.deepEqual(r.events.find(e=>e.effect?.type==='hurt').effect,{type:'hurt',hero:'touma',source:0,amount:16,covered:true});
});
test('ring and team attacks retain their own visual identities',()=>{
 const r=turn(C.newBattle('mochi'),{skill:'guard'},{skill:'ring'});
 assert.deepEqual(r.events.filter(e=>e.effect?.type==='ring').map(e=>e.effect.enemy),[0,1]);
 const b=C.newBattle('guardian');b.gauge=3;
 assert.equal(C.resolveTurn(b,{team:'flare'},['touma','nina']).events.find(e=>e.effect?.type==='team').effect.amount,75);
});
