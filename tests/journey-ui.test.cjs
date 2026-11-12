const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function boot(saved){
 const data=new Map(saved?[['okaeri-forest-v1',saved]]:[]),els={},handlers={};
 const el=id=>{
  if(els[id])return els[id];const e={hidden:false,children:[],style:{},classList:{add(){},remove(){}},focus(){},setAttribute(){},addEventListener(){},append(b){this.children.push(b);},replaceChildren(){this.children=[];}};
  Object.defineProperty(e,'innerHTML',{set(v){this.html=v;if(id==='modalContent'&&els.modalActions)els.modalActions.children=[];},get(){return this.html;}});return els[id]=e;
 };
 const ctx=vm.createContext({OkaeriWorld:{Renderer:class{reset(){}draw(){}}},OkaeriMusic:class{select(){return Promise.resolve();}stop(){}},OkaeriSprites:{load:()=>Promise.resolve()},OkaeriCast:{ready:Promise.resolve()},OkaeriResidentsArt:{ready:Promise.resolve()},
  document:{getElementById:el,createElement:()=>({}),addEventListener(n,fn){handlers[n]=fn;},querySelectorAll:()=>[]},window:{addEventListener(){}},localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){},console});
 for(const f of ['core.js','story.js','chapters.js','canal.js','hill.js','side-stories.js','episodes-data.js','episode-activities.js','episodes.js','journey.js','game.js'])vm.runInContext(fs.readFileSync(require.resolve('../'+f),'utf8'),ctx);
 return {data,el,ctx,handlers};
}
test('the trip preview is playable and uses only the chapter-select save slot',()=>{
 const b=boot();b.el('chapterButton').onclick();const button=b.el('modalActions').children.find(b=>b.textContent==='第6話の小旅行から');
 assert.ok(button,'a direct chapter-select entry should expose the new playable trip');button.onclick();
 assert.equal(b.data.get('okaeri-forest-v1'),undefined);const save=b.ctx.OkaeriCore.restoreSave(b.data.get('okaeri-chapter-v1'));
 assert.equal(save.scene,'lake');assert.equal(save.episode.step,2);assert.equal(save.journey.step,0);
 for(let i=0;i<b.ctx.OkaeriJourney.departure.length;i++)b.el('nextDialogue').onclick();
 assert.match(b.el('locationName').textContent,/氷湖/);assert.match(b.el('objectiveText').textContent,/道標/);
});
test('actual game Q switching and journal preserve split positions on reload',()=>{
 const source=boot();const s=source.ctx.OkaeriEpisodes.create(6);s.episode.step=2;
 Object.assign(s,{scene:'lakeside',x:17,y:10,lead:'touma',journey:{step:4,mirror:false,prism:false,shutter:false,reply:false,positions:{touma:{scene:'lakeside',x:17,y:9},nina:{scene:'lampworkshop',x:7,y:11}}}});
 const b=boot(JSON.stringify(s));b.el('continueButton').onclick();
 b.handlers.keydown({key:'q',repeat:false,target:{tagName:'CANVAS'}});
 let save=b.ctx.OkaeriCore.restoreSave(b.data.get('okaeri-forest-v1'));assert.equal(save.scene,'lampworkshop');assert.equal(save.lead,'nina');assert.equal(save.journey.positions.touma.y,10);
 b.el('journalButton').onclick();assert.match(b.el('modalContent').html,/反射板/);
 assert.equal(b.el('modalActions').children.some(x=>x.textContent==='目的地のあるマップへ'),false);
 b.el('modalActions').children.find(x=>x.textContent==='相手の持ち場へ切り替える').onclick();
 save=b.ctx.OkaeriCore.restoreSave(b.data.get('okaeri-forest-v1'));assert.equal(save.scene,'lakeside');assert.equal(save.y,10);
});
