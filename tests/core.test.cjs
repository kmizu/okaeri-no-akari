const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../core.js');
test('break then Nina fire deals 33 damage, and earns only one lantern',()=>{
 let b=C.newBattle('guardian');let hp=b.enemies[0].hp;
 let r=C.resolveTurn(b,{touma:{skill:'break',target:0},nina:{skill:'fire',target:0}},['touma','nina']);
 assert.equal(hp-r.enemies[0].hp,47);assert.equal(r.gauge,1);assert.equal(b.enemies[0].hp,hp);
});
test('fire removes ice before damage, letting Touma strike fully',()=>{
 let b=C.newBattle('crab');let hp=b.enemies[0].hp;
 let r=C.resolveTurn(b,{touma:{skill:'attack',target:0},nina:{skill:'fire',target:0}},['nina','touma']);
 assert.equal(hp-r.enemies[0].hp,42);assert.equal(r.enemies[0].ice,false);
});
test('protect intercepts forecast single hit aimed at Nina',()=>{
 let b=C.newBattle('guardian');b.turn=2;
 let r=C.resolveTurn(b,{touma:{skill:'protect'},nina:{skill:'attack',target:0}},['touma','nina']);
 assert.equal(r.heroes.nina.hp,90);assert.equal(r.heroes.touma.hp,104);assert.equal(r.gauge,1);
});
test('unaffordable action does not consume turn or mutate battle',()=>{
 let b=C.newBattle('mochi');b.heroes.nina.sp=0;
 assert.throws(()=>C.resolveTurn(b,{touma:{skill:'attack',target:0},nina:{skill:'fire',target:0}},['touma','nina']),/SP/);
 assert.equal(b.turn,1);assert.equal(b.heroes.touma.hp,120);
});
test('rescue makes fallen partner alive without granting a free action',()=>{
 let b=C.newBattle('guardian');b.heroes.nina.hp=0;
 let r=C.resolveTurn(b,{touma:{skill:'rescue'},nina:{skill:'skip'}},['touma','nina']);
 assert.equal(r.heroes.nina.hp,27);assert.equal(r.enemies[0].hp,230);
});
test('team move consumes gauge and both actions',()=>{
 let b=C.newBattle('guardian');b.gauge=3;
 let r=C.resolveTurn(b,{team:'flare'},['touma','nina']);
 assert.equal(r.enemies[0].hp,155);assert.equal(r.gauge,0);
});
test('both heroes down yields defeat',()=>{
 let b=C.newBattle('guardian');b.turn=3;b.heroes.touma.hp=1;b.heroes.nina.hp=1;
 let r=C.resolveTurn(b,{touma:{skill:'attack',target:0},nina:{skill:'attack',target:0}},['touma','nina']);
 assert.equal(r.status,'defeat');
});
test('bad and out-of-range saves are rejected without throwing',()=>{
 for(const s of ['oops','null','{}',JSON.stringify({version:1,scene:'bogus',x:3,y:4,flags:{}})]) assert.equal(C.restoreSave(s),null);
});
test('all romance routes keep explicit user consent',()=>{
 assert.equal(C.chooseEnding('confess',0),'touma');
 assert.equal(C.chooseEnding('wait',2,'yes'),'nina');
 assert.equal(C.chooseEnding('wait',2,'notYet'),'friends');
 assert.equal(C.chooseEnding('stay',3),'friends');
 assert.equal(C.chooseEnding('wait',0),'ask');
});

