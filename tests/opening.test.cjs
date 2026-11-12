const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function boot(raw){
 const data=new Map(raw?[['okaeri-forest-v1',raw]]:[]),els={},music=[],timers=new Map();let timerId=0;
 function el(id){
  if(els[id])return els[id];const e={hidden:false,children:[],style:{},classList:{add(){},remove(){}},focus(){},setAttribute(){},addEventListener(){},append(b){this.children.push(b);},replaceChildren(){this.children=[];}};
  Object.defineProperty(e,'innerHTML',{set(v){this.html=v;if(id==='modalContent'&&els.modalActions)els.modalActions.children=[];},get(){return this.html;}});return els[id]=e;
 }
 const ctx=vm.createContext({OkaeriWorld:{Renderer:class{reset(){}draw(){}}},OkaeriMusic:class{select(s){music.push(s);return Promise.resolve();}stop(){}},OkaeriSprites:{load:()=>Promise.resolve()},OkaeriCast:{ready:Promise.resolve()},OkaeriResidentsArt:{ready:Promise.resolve()},
  document:{getElementById:el,createElement:()=>({}),addEventListener(){},querySelectorAll:()=>[]},window:{addEventListener(){}},localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},setTimeout:(fn)=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),requestAnimationFrame(){},console});
 for(const f of ['core.js','story.js','chapters.js','episodes-data.js','episode-activities.js','episodes.js','opening-film.js','game.js'])vm.runInContext(fs.readFileSync(require.resolve('../'+f),'utf8'),ctx);
 return {ctx,el,data,music,timers,saved:()=>ctx.OkaeriCore.restoreSave(data.get('okaeri-forest-v1'))};
}
test('a new journey starts at home, then receives the town briefing before exploration',()=>{
 const b=boot();b.el('startButton').onclick();b.el('skipOpening').onclick();
 assert.ok(b.saved(),'the opening should already be saved');assert.equal(b.saved().scene,'house');assert.equal(b.saved().openingStage,0);
 for(let i=0;i<b.ctx.OkaeriStory.opening[0].lines.length;i++)b.el('nextDialogue').onclick();
 assert.equal(b.saved().scene,'town');assert.equal(b.saved().openingStage,1);assert.equal(b.saved().flags.board,false);
 for(let i=0;i<b.ctx.OkaeriStory.opening[1].lines.length;i++)b.el('nextDialogue').onclick();
 assert.equal(b.saved().openingStage,undefined);assert.equal(b.el('dialogue').hidden,true);
 assert.equal(b.el('objectiveText').textContent,'広場の出発札を掛けよう');assert.equal(b.music.at(-1),'village');
});
test('closing either opening scene resumes that scene without skipping the briefing',()=>{
 const first=boot();first.el('startButton').onclick();first.el('skipOpening').onclick();
 for(const stage of [0,1]){
  if(stage===1)for(let i=0;i<first.ctx.OkaeriStory.opening[0].lines.length;i++)first.el('nextDialogue').onclick();
  const b=boot(first.data.get('okaeri-forest-v1'));b.el('continueButton').onclick();
  assert.equal(b.saved().openingStage,stage);assert.equal(b.el('dialogueText').textContent,b.ctx.OkaeriStory.opening[stage].lines[0][1]);
 }
});

test('the opening film and title call precede the first morning, and finish only once',()=>{
 const b=boot();b.el('startButton').onclick();
 assert.equal(b.saved().openingPrelude,true);assert.equal(b.el('openingFilm').hidden,false);assert.equal(b.el('dialogue').hidden,true);
 assert.equal(b.el('hud').hidden,true);assert.equal(b.music.at(-1),'opening');
 const shots=b.ctx.OkaeriOpeningFilm.shots;
 for(let i=1;i<shots.length;i++)b.el('nextOpening').onclick();
 assert.equal(b.el('filmTitle').hidden,false);assert.equal(b.el('filmTitle').textContent,'おかえりの灯');
 assert.equal(b.saved().openingPrelude,true,'title call must finish before the first scene');
 b.el('nextOpening').onclick();
 assert.equal(b.saved().openingPrelude,undefined);assert.equal(b.el('openingFilm').hidden,true);assert.equal(b.el('dialogue').hidden,false);
 assert.equal(b.el('dialogueText').textContent,b.ctx.OkaeriStory.opening[0].lines[0][1]);
 b.el('skipOpening').onclick();assert.equal(b.el('dialogueText').textContent,b.ctx.OkaeriStory.opening[0].lines[0][1]);
});

test('an interrupted film replays before home; old opening saves do not acquire a film',()=>{
 const first=boot();first.el('startButton').onclick();first.el('nextOpening').onclick();
 const resumed=boot(first.data.get('okaeri-forest-v1'));resumed.el('continueButton').onclick();
 assert.equal(resumed.el('openingFilm').hidden,false);assert.equal(resumed.el('dialogue').hidden,true);
 resumed.el('skipOpening').onclick();
 const legacy=boot(resumed.data.get('okaeri-forest-v1'));legacy.el('continueButton').onclick();
 assert.equal(legacy.el('openingFilm').hidden,true);assert.equal(legacy.el('dialogue').hidden,false);
 const save=JSON.parse(first.data.get('okaeri-forest-v1'));
 assert.equal(first.ctx.OkaeriCore.restoreSave(JSON.stringify({...save,openingStage:1,scene:'town'})),null);
 assert.equal(first.ctx.OkaeriCore.restoreSave(JSON.stringify({...save,openingPrelude:'yes'})),null);
});

test('automatic film timing reaches the title and home without leaving a pending advance',()=>{
 const b=boot();b.el('startButton').onclick();
 for(let i=0;i<b.ctx.OkaeriOpeningFilm.shots.length;i++){
  assert.equal(b.timers.size,1);const [id,tick]=b.timers.entries().next().value;b.timers.delete(id);tick();
 }
 assert.equal(b.el('openingFilm').hidden,true);assert.equal(b.saved().openingPrelude,undefined);assert.equal(b.timers.size,0);
});

test('pause and skip cancel automatic advance without skipping the home dialogue',()=>{
 const b=boot();b.el('startButton').onclick();b.el('pauseOpening').onclick();assert.equal(b.timers.size,0);
 b.el('nextOpening').onclick();assert.equal(b.timers.size,0,'manual advance keeps the film paused');
 b.el('pauseOpening').onclick();assert.equal(b.timers.size,1);
 b.el('skipOpening').onclick();assert.equal(b.timers.size,0);assert.equal(b.el('dialogue').hidden,false);
 assert.equal(b.saved().openingStage,0);assert.equal(b.el('controls').hidden,false);assert.equal(b.el('menuButton').disabled,false);
});
test('invalid opening saves are rejected and older saves continue without a new prologue',()=>{
 const b=boot(),legacy=b.ctx.OkaeriEpisodes.create(1);
 for(const stage of [-1,2,'0'])assert.equal(b.ctx.OkaeriCore.restoreSave(JSON.stringify({...legacy,openingStage:stage})),null);
 assert.equal(b.ctx.OkaeriCore.restoreSave(JSON.stringify({...legacy,openingStage:0})),null,'home scene must match opening stage zero');
 const loaded=boot(JSON.stringify(legacy));loaded.el('continueButton').onclick();
 assert.equal(loaded.el('dialogue').hidden,true);assert.equal(loaded.saved().openingStage,undefined);
});
