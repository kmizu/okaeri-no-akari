const {test}=require('node:test'),assert=require('node:assert/strict');
require('../story.js');require('../chapters.js');const C=require('../core.js');
require('../episodes-data.js');require('../episode-activities.js');require('../episodes.js');
const E=global.OkaeriEpisodes;
const stops=[[2,2,'ritsuReturn'],[4,0,'yuraRounds'],[6,2,'unsentLetter'],[8,3,'stormThanks']];
function harness(chapter,step){
 const state=E.create(chapter);state.episode.step=step;const event=E.current(state);
 state.scene=event.scene;if(event.lead)state.lead=event.lead;
 let callback,buttons,lines;
 const api={state,talk(l,cb){lines=l;callback=cb;},openModal(h,b){buttons=b;},closeModal(){},
  save(){assert.ok(C.restoreSave(JSON.stringify(state)));},updateHud(){},toast(){},
  scene(scene,x,y){Object.assign(state,{scene,x,y});}};
 return {state,api,read(){const cb=callback;callback=null;if(cb)cb();},
  pick(label){assert.ok(buttons,'a detour choice must be offered');const b=buttons.find(([s])=>s===label);assert.ok(b,label);b[1]();},
  lines(){return lines;},buttons(){return buttons;}};
}
test('four optional stories save only after reading; interrupted dialogue resumes safely',()=>{
 for(const [chapter,step,key] of stops){
  const h=harness(chapter,step);E.handle('episodeEvent',h.api);h.read();
  assert.equal(h.state.episode.step,step,'the offer is still part of the current event');
  h.pick('少し寄り道する');assert.ok(h.lines().length>=12);
  assert.equal(h.state.memories?.[key],undefined);
  const restored=C.restoreSave(JSON.stringify(h.state));assert.ok(restored);
  assert.equal(restored.episode.step,step);
  const resumed=harness(chapter,step);Object.assign(resumed.state,restored);
  E.handle('episodeEvent',resumed.api);resumed.read();resumed.pick('少し寄り道する');resumed.read();
  assert.equal(resumed.state.memories[key],'read');assert.equal(resumed.state.episode.step,step+1);
  assert.ok(C.restoreSave(JSON.stringify(resumed.state)));
 }
});
test('skipping a detour continues without a memory or a relationship change',()=>{
 for(const [chapter,step,key] of stops){
  const h=harness(chapter,step);E.handle('episodeEvent',h.api);h.read();h.pick('今日は用事の続きへ');
  assert.equal(h.state.episode.step,step+1);assert.equal(h.state.memories?.[key],undefined);
  assert.equal(h.state.episode.route,null);assert.ok(C.restoreSave(JSON.stringify(h.state)));
 }
});
test('read stories echo at home and the festival without changing source dialogue',()=>{
 for(const [chapter,,key] of stops){
  const s=E.create(chapter),original=JSON.stringify(global.OkaeriEpisodesData.episodes[chapter]);
  const before=E.events(s).at(-1).lines;s.memories={[key]:'read'};
  assert.ok(E.events(s).at(-1).lines.length>before.length);
  assert.ok(global.OkaeriActivities.notes(s).length);
  assert.equal(JSON.stringify(global.OkaeriEpisodesData.episodes[chapter]),original);
 }
 const s=E.create(9),before=E.events(s)[0].lines.length;
 s.memories=Object.fromEntries(stops.map(([, ,k])=>[k,'read']));
 assert.ok(E.events(s)[0].lines.length>before);
 for(const route of ['touma','nina','friends']){
  const end=E.create(10,route),before=E.events(end).at(-1).lines.length;
  end.memories={unsentLetter:'read'};assert.ok(E.events(end).at(-1).lines.length>before);
 }
});
test('detour memories survive the next episode and reject unknown values',()=>{
 const h=harness(2,2);h.state.memories={ritsuReturn:'read'};
 E.next(h.api);assert.equal(h.state.memories.ritsuReturn,'read');assert.ok(C.restoreSave(JSON.stringify(h.state)));
 h.state.memories.ritsuReturn='unfinished';assert.equal(C.restoreSave(JSON.stringify(h.state)),null);
});
