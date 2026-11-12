const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../core.js');
const {buildBeats,ResultPlayback,conditionList,headAnchor}=require('../battle-ui.js');
const turn=(b,t,n)=>C.resolveTurn(b,{touma:t,nina:n},['touma','nina']);
function clock(){let now=0,id=0;const jobs=new Map();return {set(fn,ms){jobs.set(++id,{fn,at:now+ms});return id;},clear(i){jobs.delete(i);},tick(ms){const end=now+ms;while(true){const next=[...jobs].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;jobs.delete(next[0]);next[1].fn();}now=end;},get pending(){return jobs.size;}};}

test('a spell announcement, melting ice and damage are one action rather than three pauses',()=>{
 const r=turn(C.newBattle('crab'),{skill:'guard'},{skill:'fire',target:0}),beats=buildBeats(r);
 const spell=beats.find(b=>b.actor==='nina');assert.equal(spell.effects.length,1);assert.equal(spell.effects[0].type,'fire');
 assert.equal(spell.snapshot.enemies[0].ice,false);assert.equal(beats.filter(b=>b.actor==='nina').length,1);
 assert.equal(spell.label,'ニナ · 火花');assert.ok(spell.events.some(e=>e.message.includes('氷殻が溶けた')));
});

test('area magic keeps both exact targets in a single cast and preserves redirected hits',()=>{
 const b=C.newBattle('mochi'),r=turn(b,{skill:'guard'},{skill:'ring'}),ring=buildBeats(r).find(b=>b.actor==='nina');
 assert.deepEqual(ring.effects.map(e=>e.enemy),[0,1]);assert.deepEqual(ring.snapshot.enemies.map(e=>e.hp),[24,24]);
 b.enemies[0].hp=10;const redirect=buildBeats(turn(b,{skill:'attack',target:0},{skill:'fire',target:0}));
 assert.equal(redirect.find(b=>b.actor==='nina').effects[0].enemy,1);
});

test('HP/status is committed at impact, fast-forward commits once, and a new battle cancels old work',()=>{
 const c=clock(),seen=[],r=turn(C.newBattle('mochi'),{skill:'attack',target:0},{skill:'guard'});
 const p=new ResultPlayback({start:b=>seen.push(['start',b.actor]),impact:(b,fast)=>seen.push(['hit',b.actor,fast]),clear(){},complete:b=>seen.push(['end',b.status])},c);
 p.play(r);assert.deepEqual(seen,[['start','touma']]);c.tick(p.current.impact-1);assert.equal(seen.length,1);
 c.tick(1);assert.deepEqual(seen.at(-1),['hit','touma',false]);p.advance();assert.equal(seen.filter(x=>x[0]==='hit'&&x[1]==='touma').length,1);
 p.advance();assert.equal(seen.filter(x=>x[0]==='hit'&&x[1]==='nina').length,1);
 p.stop();const count=seen.length;c.tick(10000);assert.equal(seen.length,count);assert.equal(c.pending,0);
});

test('running or skipping every beat ends on the authoritative final state including duration decay',()=>{
 for(const skip of [false,true]){
  const c=clock(),r=turn(C.newBattle('crab'),{skill:'guard'},{skill:'guard'});let finished=null;
  const p=new ResultPlayback({start(){},impact(){},clear(){},complete:b=>finished=b},c);p.play(r);
  if(skip)while(p.active)p.advance();else c.tick(30000);
  assert.equal(finished,r);assert.equal(finished.heroes.touma.chill,2);assert.equal(c.pending,0);
 }
});

test('condition icons follow current status and do not retain expired or cured effects',()=>{
 const b=C.newBattle('crab');assert.deepEqual(conditionList(b.enemies[0],'enemy').map(x=>x.key),['ice']);
 b.heroes.touma.chill=2;b.heroes.touma.buff=1;assert.deepEqual(conditionList(b.heroes.touma,'hero').map(x=>x.key),['chill','buff']);
 b.heroes.touma.chill=0;b.heroes.touma.buff=0;assert.deepEqual(conditionList(b.heroes.touma,'hero'),[]);
 assert.equal(conditionList({...b.enemies[0],ice:false,broken:1},'enemy')[0].key,'broken');
});

test('number anchors sit above the outer field figure, stay inside the arena, and do not depend on sprite shake',()=>{
 const arena={left:20,top:40,width:800,height:350};
 assert.deepEqual(headAnchor({left:500,top:170,width:100,height:150},arena),{x:530,y:122});
 const edge=headAnchor({left:0,top:30,width:50,height:80},arena);assert.ok(edge.x>=24);assert.ok(edge.y>=36);
});

test('stagger and consumed sword light are visible in the exact hit snapshot, not a later action',()=>{
 const first=turn(C.newBattle('guardian'),{skill:'break',target:0},{skill:'buff'});
 const breakHit=buildBeats(first).find(b=>b.actor==='touma');assert.equal(breakHit.snapshot.enemies[0].broken,2);
 const next=turn(first,{skill:'attack',target:0},{skill:'guard'}),hit=buildBeats(next).find(b=>b.actor==='touma');
 assert.equal(hit.effects[0].amount,45);assert.equal(hit.snapshot.heroes.touma.buff,0);assert.equal(hit.snapshot.enemies[0].broken,0);
});
