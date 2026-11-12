const {test}=require('node:test'),assert=require('node:assert/strict');
require('../story.js');require('../chapters.js');const C=require('../core.js');
require('../episodes-data.js');require('../episode-activities.js');require('../episodes.js');
require('../journey.js');
const E=global.OkaeriEpisodes,S=global.OkaeriStory;
function setup(){
 const state=E.create(6);state.episode.step=2;let callback,warning,buttons;
 const api={state,talk(lines,cb){callback=cb;},save(){global.OkaeriJourney?.capture(state);assert.ok(C.restoreSave(JSON.stringify(state)),JSON.stringify(state));},
  scene(scene,x,y){Object.assign(state,{scene,x,y});this.save();},updateHud(){},toast(t){warning=t;},openModal(html,b){buttons=b;},closeModal(){},startBattle(kind,onWin){onWin?.();}};
 const read=()=>{const cb=callback;callback=null;cb?.();};
 const act=id=>{assert.equal(global.OkaeriJourney.handle(id,api),true,id);read();};
 return {state,api,read,act,warning:()=>warning,buttons:()=>buttons};
}
function toSplit(h){
 E.finishEvent(h.api);h.read();h.act('journeyTrail');h.state.lead='nina';h.act('journeyShoreLight');h.read();
 h.act('lakeToVillage');h.act('journeyOrlf');h.act('villageToWorkshop');h.act('journeyDesk');
}
function cooperate(h){
 const J=global.OkaeriJourney;h.act('journeyMirror');J.switchActor(h.api);h.act('journeyPrism');
 J.switchActor(h.api);h.act('journeyShutter');J.switchActor(h.api);h.act('journeyReply');
}
test('episode six enters the new trip without renumbering its checkpoint',()=>{
 const h=setup();E.finishEvent(h.api);
 assert.equal(h.state.episode.step,2);assert.ok(h.state.journey,'a trip must start before the evening checkpoint');
 assert.equal(C.restoreSave(JSON.stringify(h.state)).scene,'lake','closing during departure must resume on the playable route');
 h.read();assert.equal(h.state.scene,'lake');assert.equal(h.state.journey.step,0);
});
test('split switching preserves each actor position and restores it after reload',()=>{
 const h=setup();toSplit(h);const J=global.OkaeriJourney;
 assert.equal(J.split(h.state),true);assert.equal(h.state.lead,'touma');
 Object.assign(h.state,{x:17,y:10});J.switchActor(h.api);
 assert.equal(h.state.lead,'nina');assert.equal(h.state.scene,'lampworkshop');
 Object.assign(h.state,{x:8,y:10});h.api.save();const restored=C.restoreSave(JSON.stringify(h.state));
 assert.ok(restored);Object.assign(h.state,restored);J.switchActor(h.api);
 assert.equal(h.state.scene,'lakeside');assert.equal(h.state.x,17);assert.equal(h.state.y,10);
 J.switchActor(h.api);assert.equal(h.state.x,8);assert.equal(h.state.y,10);
});
test('reciprocal work is gated and progress is saved only after dialogue',()=>{
 const h=setup();toSplit(h);const J=global.OkaeriJourney;
 J.switchActor(h.api);h.act('journeyPrism');assert.equal(h.state.journey.prism,false);
 J.switchActor(h.api);J.handle('journeyMirror',h.api);assert.equal(h.state.journey.mirror,false);
 assert.ok(C.restoreSave(JSON.stringify(h.state)));h.read();assert.equal(h.state.journey.mirror,true);
 J.switchActor(h.api);h.act('journeyReply');assert.equal(h.state.journey.reply,false);
 h.act('journeyPrism');assert.equal(h.state.journey.prism,true);
 J.switchActor(h.api);h.act('journeyShutter');J.switchActor(h.api);h.act('journeyReply');
 assert.equal(h.state.journey.step,5);assert.equal(J.split(h.state),true);
});
test('the trip reunites the two before returning home and completes episode six',()=>{
 const h=setup();toSplit(h);cooperate(h);h.act('workshopToVillage');
 assert.equal(global.OkaeriJourney.split(h.state),false);assert.equal(h.state.journey.step,6);
 h.act('journeyMeal');h.act('villageToLake');h.act('journeyReturn');h.act('lakeToTown');
 Object.assign(h.state,{scene:'house',x:12,y:10});assert.equal(S.activeObjects(h.state).find(o=>o.id==='journeyHome').type,'homeTable');h.act('journeyHome');
 assert.equal(h.state.journey.step,9);assert.equal(h.state.episode.complete,true);
 E.next(h.api);assert.equal(h.state.journey.step,9);assert.ok(C.restoreSave(JSON.stringify(h.state)));
});
test('invalid journey dependencies, parked actors and split map changes are rejected',()=>{
 const h=setup();toSplit(h);const original=JSON.stringify(h.state);
 for(const change of [s=>s.journey.step=50,s=>s.journey.reply=true,s=>s.journey.positions.nina.scene='town',s=>s.scene='lampworkshop',s=>s.journey.positions.touma.x=100,s=>{s.journey.positions.nina.x=18;s.journey.positions.nina.y=10;},s=>{s.x=12;s.y=12;}]){
  const s=JSON.parse(original);change(s);assert.equal(C.restoreSave(JSON.stringify(s)),null);
 }
 const legacy=E.create(6);assert.ok(C.restoreSave(JSON.stringify(legacy)));
 legacy.scene='lake';assert.equal(C.restoreSave(JSON.stringify(legacy)),null);
});
test('a completed trip survives all three relationship routes and keeps its festival callback',()=>{
 for(const route of ['touma','nina','friends']){
  const h=setup();toSplit(h);cooperate(h);h.act('workshopToVillage');h.act('journeyMeal');h.act('villageToLake');h.act('journeyReturn');h.act('lakeToTown');
  Object.assign(h.state,{scene:'house',x:12,y:10});h.act('journeyHome');
  assert.equal(h.state.episode.complete,true);E.next(h.api);
  let iterations=0;while(h.state.episode.chapter<=10){
   assert.ok(iterations++<40,'stalled at '+JSON.stringify(h.state.episode));
   const ev=E.current(h.state),activity=global.OkaeriActivities.task(h.state),detour=E.detour(h.state);
   if(ev.lead)h.state.lead=ev.lead;h.state.scene=ev.scene;
   E.handle('episodeEvent',h.api);h.read();
   if(activity){h.buttons()[activity.options.findIndex(o=>o.value)][1]();h.read();}
   if(detour){h.buttons().find(([label])=>label==='少し寄り道する')[1]();h.read();}
   if(ev.choice){h.buttons()[['touma','nina','friends'].indexOf(route)][1]();h.read();}
   if(ev.battle){E.won(h.api);h.read();}
   assert.ok(C.restoreSave(JSON.stringify(h.state)));
   if(h.state.episode.complete){if(h.state.episode.chapter===10)break;E.next(h.api);}
  }
  assert.equal(h.state.episode.route,route);assert.equal(h.state.journey.step,9);
  const festival=E.create(9);festival.journey=h.state.journey;assert.match(E.events(festival)[0].lines.flat().join(''),/ミナモ/);
 }
});
test('all new map objects have a reachable adjacent tile',()=>{
 const h=setup();toSplit(h);const J=global.OkaeriJourney;
 for(const scene of ['lake','lakeside','lampworkshop']){
  const [x,y]=J.spawns[scene],q=[[x,y]],seen=new Set();h.state.scene=scene;
  while(q.length){const [x,y]=q.shift(),key=x+','+y;if(seen.has(key))continue;seen.add(key);
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(S.walkable(h.state,x+dx,y+dy))q.push([x+dx,y+dy]);}
  for(const o of S.activeObjects(h.state))assert.ok([...seen].some(p=>{const [x,y]=p.split(',').map(Number);return Math.hypot(x-o.x,y-o.y)<1.5;}),scene+':'+o.id);
 }
});
