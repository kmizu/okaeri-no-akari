const {test}=require('node:test'),assert=require('node:assert/strict');
require('../story.js');require('../side-stories.js');const C=require('../core.js'),Ch=require('../chapters.js'),S=global.OkaeriStory,Side=global.OkaeriSideStories;
function setup(){const h={state:Ch.create(1),talk(lines,done){h.lines=lines;h.done=done;},save(){},updateHud(){},toast(){}};return h;}
const run=(id,h)=>{h.done=null;return Side.handle(id,h);};
test('waiting place requires correct partners and saves only after dialogue',()=>{
 const h=setup();h.state.lead='nina';run('waitingPost',h);assert.equal(h.done,undefined);
 h.state.lead='touma';run('waitingPost',h);assert.ok(!h.state.flags.waitingPost);h.done();
 assert.ok(C.restoreSave(JSON.stringify(h.state)).flags.waitingPost);
 run('waitingLight',h);assert.equal(h.done,undefined);h.state.lead='nina';run('waitingLight',h);h.done();
 run('sae',h);h.done();assert.ok(C.restoreSave(JSON.stringify(h.state)).flags.waitingReported);
 assert.equal(Side.notes(h.state).at(-1).done,true);assert.equal(run('sae',h),false);
 h.state.flags.festivalStarted=true;run('sae',h);assert.match(JSON.stringify(h.lines),/手袋を結び直せた/);
});
test('unrepaired lamp is blocked and inconsistent saves rejected',()=>{
 const h=setup();run('waitingLight',h);assert.equal(h.done,undefined);
 h.state.flags.waitingLit=true;assert.equal(C.restoreSave(JSON.stringify(h.state)),null);
});
test('forest extension is reachable after first battle without bypassing remaining gates',()=>{
 const s={scene:'forest',x:5,y:13,flags:{board:true,mochi:true}},q=[[5,13]],seen=new Set();
 while(q.length){const [x,y]=q.shift(),key=x+','+y;if(seen.has(key))continue;seen.add(key);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(S.walkable(s,x+dx,y+dy))q.push([x+dx,y+dy]);}
 for(const id of ['waitingPost','waitingLight','waitingBench']){const o=S.objects.forest.find(o=>o.id===id);assert.ok(seen.has(o.x+','+o.y),id);}
 assert.ok(!seen.has('10,9'));assert.ok(!seen.has('12,5'));assert.ok(!seen.has('20,2'));
});
