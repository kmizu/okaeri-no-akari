const {test}=require('node:test'),assert=require('node:assert/strict');
require('../story.js');require('../chapters.js');const C=require('../core.js');require('../episodes-data.js');require('../episode-activities.js');require('../episodes.js');const E=global.OkaeriEpisodes;
test('ten chapters with independent chapter ten routes and safe saves',()=>{
 for(let n=1;n<=10;n++){const s=E.create(n,n===10?'touma':null);assert.equal(s.episode.chapter,n);assert.ok(C.restoreSave(JSON.stringify(s)),String(n));}
 assert.throws(()=>E.create(10));
 const routes=['touma','nina','friends'].map(r=>E.events(E.create(10,r)));assert.equal(new Set(routes.map(r=>r[0].label)).size,3);
 const s=E.create(3);s.episode.step=999;assert.equal(C.restoreSave(JSON.stringify(s)),null);
 assert.ok(C.restoreSave(JSON.stringify(global.OkaeriChapters.create(2))));
});
test('all event targets can be approached and all episodes conclude at home',()=>{
 for(let n=2;n<=10;n++)for(const route of n===10?['touma','nina','friends']:[null]){
 const s=E.create(n,route),events=E.events(s);assert.equal(events.at(-1).scene,'house');
 for(const ev of events){s.scene=ev.scene;const [sx,sy]=E.spawns[ev.scene],q=[[sx,sy]],seen=new Set();while(q.length){const [x,y]=q.shift(),k=x+','+y;if(seen.has(k))continue;seen.add(k);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(global.OkaeriStory.walkable(s,x+dx,y+dy))q.push([x+dx,y+dy]);}assert.ok([...seen].some(k=>{const [x,y]=k.split(',').map(Number);return Math.hypot(x-ev.x,y-ev.y)<1.5;}),n+':'+ev.label);}
 }
});
test('events persist only on completion; episode three reconciliation precedes next day',()=>{
 const s=E.create(3);let callback;const a={state:s,talk(l,cb){callback=cb;},save(){},updateHud(){},scene(n,x,y){Object.assign(s,{scene:n,x,y});},toast(){},openModal(){},closeModal(){},startBattle(){}};
 E.handle('episodeEvent',a);assert.equal(s.episode.step,0);callback();assert.equal(s.episode.step,1);assert.ok(C.restoreSave(JSON.stringify(s)));
 const lines=E.events(s).at(-1).lines.flat().join('');assert.match(lines,/温め直/);assert.match(lines,/怖/);
});
test('all three routes can be completed from episode two with valid saves after every event',()=>{
 for(const r of ['touma','nina','friends']){
 const s=E.create(2);let callback,buttons,battles=0;
 const a={state:s,talk(l,cb){callback=cb;},save(){assert.ok(C.restoreSave(JSON.stringify(s)),JSON.stringify(s.episode));},updateHud(){},scene(n,x,y){Object.assign(s,{scene:n,x,y});},toast(){},openModal(h,b){buttons=b;},closeModal(){},startBattle(){battles++;E.won(a);}};
 while(true){const ev=E.current(s),activity=global.OkaeriActivities.task(s),detour=E.detour(s);if(ev.lead)s.lead=ev.lead;s.scene=ev.scene;E.handle('episodeEvent',a);let cb=callback;callback=null;cb();
 if(activity){buttons[activity.options.findIndex(o=>o.value)][1]();cb=callback;callback=null;cb();}
 if(detour){buttons.find(([label])=>label==='少し寄り道する')[1]();cb=callback;callback=null;cb();}
 if(ev.choice){buttons[['touma','nina','friends'].indexOf(r)][1]();cb=callback;callback=null;cb();}
 if(ev.battle){cb=callback;callback=null;cb();}
 assert.ok(C.restoreSave(JSON.stringify(s)));
 if(s.episode.complete){if(s.episode.chapter===10)break;E.next(a);}
 }
 assert.equal(s.episode.route,r);assert.equal(battles,1);
 }
});
test('rescue refuses the wrong leader without advancing and transfers control to Nina',()=>{
 const s=E.create(3);s.episode.step=1;s.lead='nina';let callback,warning;
 const a={state:s,talk(l,cb){callback=cb;},save(){},updateHud(){},scene(n,x,y){Object.assign(s,{scene:n,x,y});},toast(t){warning=t;}};
 E.handle('episodeEvent',a);assert.ok(warning);assert.equal(callback,undefined);assert.equal(s.episode.step,1);
 s.lead='touma';E.handle('episodeEvent',a);callback();assert.equal(s.lead,'nina');assert.equal(s.episode.step,2);assert.equal(s.x,14);
});
