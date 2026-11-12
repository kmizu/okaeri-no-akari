const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../core.js');
const turn=(b,t,n)=>C.resolveTurn(b,{touma:t,nina:n},['touma','nina']);

test('field animations identify each actual attacker even when damage is redirected to the next enemy',()=>{
 const b=C.newBattle('mochi');b.enemies[0].hp=10;
 const r=turn(b,{skill:'attack',target:0},{skill:'fire',target:0});
 const hits=r.events.filter(e=>e.effect?.enemy!==undefined);
 assert.deepEqual(hits.map(e=>[e.actor,e.effect.enemy]),[['touma',0],['nina',1]]);
 assert.equal(r.events.find(e=>e.effect?.type==='hurt').actor,'enemy:1');
});

test('a healing caster and a covered damage recipient remain different field participants',()=>{
 const b=C.newBattle('guardian');b.turn=2;b.heroes.nina.hp=85;
 const r=turn(b,{skill:'protect'},{skill:'heal',target:'nina'});
 const shield=r.events.find(e=>e.effect?.type==='shield'),heal=r.events.find(e=>e.effect?.type==='heal'),hurt=r.events.find(e=>e.effect?.type==='hurt');
 assert.equal(shield.actor,'touma');assert.equal(heal.actor,'nina');assert.equal(hurt.actor,'enemy:0');assert.equal(hurt.effect.hero,'touma');
});

test('counter and cooperation animate their own actors rather than the enemy that triggered them',()=>{
 const b=C.newBattle('guardian');const r=turn(b,{skill:'counter'},{skill:'guard'});
 const counter=r.events.find(e=>e.effect?.type==='slash');assert.equal(counter.actor,'touma');
 b.gauge=3;const team=C.resolveTurn(b,{team:'flare'},['touma','nina']);assert.equal(team.events.find(e=>e.effect?.type==='team').actor,'team');
});

test('ally support and rescue identify the helper and keep HP updates on the recipient snapshot',()=>{
 const b=C.newBattle('mochi');b.heroes.nina.hp=20;
 const r=turn(b,{skill:'cheer'},{skill:'guard'}),heal=r.events.find(e=>e.effect?.type==='heal');
 assert.equal(heal.actor,'touma');assert.equal(heal.effect.hero,'nina');assert.equal(heal.heroes.nina.hp,47);
 const down=C.newBattle('guardian');down.heroes.nina.hp=0;
 const rescue=turn(down,{skill:'rescue'},{skill:'skip'}).events.find(e=>e.effect?.type==='heal');
 assert.equal(rescue.actor,'touma');assert.equal(rescue.effect.hero,'nina');
});
