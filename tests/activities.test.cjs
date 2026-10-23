const {test}=require('node:test'),assert=require('node:assert/strict');
require('../story.js');require('../chapters.js');const C=require('../core.js');require('../episodes-data.js');require('../episode-activities.js');require('../episodes.js');const E=global.OkaeriEpisodes;
function harness(chapter,step){const s=E.create(chapter);s.episode.step=step;s.scene=E.current(s).scene;s.lead=E.current(s).lead||'touma';let next,buttons;const a={state:s,talk(lines,cb){next=cb;},openModal(html,b){buttons=b;},closeModal(){},save(){},updateHud(){},toast(){},scene(n,x,y){Object.assign(s,{scene:n,x,y});}};return {s,a,advance(){const cb=next;next=null;cb?.();},pick(i){buttons[i][1]();}};}
test('gift selection is saved only after dialogue and survives chapter transition',()=>{
 const h=harness(4,2);E.handle('episodeEvent',h.a);h.advance();h.pick(1);assert.equal(h.s.memories?.gift,undefined);h.advance();assert.equal(h.s.memories.gift,'bookmark');assert.equal(h.s.episode.step,3);
 const restored=C.restoreSave(JSON.stringify(h.s));assert.equal(restored.memories.gift,'bookmark');E.next(h.a);assert.equal(h.s.memories.gift,'bookmark');
 const final=E.create(10,'nina');final.memories=restored.memories;assert.match(E.events(final).at(-1).lines.flat().join(''),/栞/);
});
test('a wrong repair choice gives feedback without completing the event',()=>{
 const h=harness(5,1);E.handle('episodeEvent',h.a);h.advance();h.pick(0);h.advance();assert.equal(h.s.episode.step,1);assert.equal(h.s.memories?.sled,undefined);h.pick(1);h.advance();assert.equal(h.s.episode.step,2);assert.equal(h.s.memories.sled,'aligned');
});
test('unknown keepsakes cannot enter saves; old saves without keepsakes still load',()=>{
 const s=E.create(4);assert.ok(C.restoreSave(JSON.stringify(s)));s.memories={gift:'<script>'};assert.equal(C.restoreSave(JSON.stringify(s)),null);
});
