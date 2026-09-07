const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
require('../story.js');require('../side-stories.js');require('../canal.js');require('../hill.js');const C=require('../core.js'),Ch=require('../chapters.js'),S=global.OkaeriStory;
test('both bedrooms and all shared furniture can be approached from the home entrance',()=>{
 const s={scene:'house',x:12,y:12,flags:{}},q=[[12,12]],seen=new Set();
 while(q.length){const [x,y]=q.shift(),k=x+','+y;if(seen.has(k))continue;seen.add(k);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(S.walkable(s,x+dx,y+dy))q.push([x+dx,y+dy]);}
 for(const o of S.objects.house)assert.ok([...seen].some(k=>{const [x,y]=k.split(',').map(Number);return Math.hypot(x-o.x,y-o.y)<1.5;}),o.id);
 assert.equal(S.walkable(s,12,4),false);assert.equal(S.walkable(s,10,6),false);
 const entrance=S.objects.town.find(o=>o.id==='ourHome');assert.ok(S.walkable({scene:'town'},entrance.x,entrance.y));
});
test('old saves remain compatible; home pending scenes require the correct chapter or ending',()=>{
 const s=Ch.create(2);assert.ok(C.restoreSave(JSON.stringify(s)));Object.assign(s,{scene:'house',x:11,y:11,pendingEvening:'one'});
 assert.equal(C.restoreSave(JSON.stringify(s)).pendingEvening,'one');s.pendingEvening='touma';assert.equal(C.restoreSave(JSON.stringify(s)),null);
});
test('actual game resumes an interrupted home scene and clears pending only when it finishes',()=>{
 const s={...Ch.create(2),scene:'house',x:11,y:11,pendingEvening:'one'},data=new Map([['okaeri-forest-v1',JSON.stringify(s)]]),els={};
 function el(id){if(els[id])return els[id];const e={style:{},children:[],classList:{add(){},remove(){}},focus(){},setAttribute(){},addEventListener(){},append(b){this.children.push(b);},replaceChildren(){this.children=[];}};Object.defineProperty(e,'innerHTML',{set(v){this.html=v;if(id==='modalContent'&&els.modalActions)els.modalActions.children=[];},get(){return this.html;}});return els[id]=e;}
 const ctx={OkaeriCore:C,OkaeriStory:S,OkaeriChapters:Ch,OkaeriCanal:global.OkaeriCanal,OkaeriHill:global.OkaeriHill,OkaeriSideStories:global.OkaeriSideStories,OkaeriWorld:{Renderer:class{reset(){}draw(){}}},OkaeriMusic:class{select(){return Promise.resolve();}stop(){}},OkaeriSprites:{load:()=>Promise.resolve()},OkaeriCast:{ready:Promise.resolve()},OkaeriResidentsArt:{ready:Promise.resolve()},document:{getElementById:el,createElement:()=>({}),addEventListener(){},querySelectorAll:()=>[]},window:{addEventListener(){}},localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){},console};
 vm.runInNewContext(fs.readFileSync(require.resolve('../game.js'),'utf8'),ctx);el('continueButton').onclick();
 assert.equal(el('dialogueText').textContent,S.nightScenes.one[0][1]);assert.equal(JSON.parse(data.get('okaeri-forest-v1')).pendingEvening,'one');
 for(let i=0;i<S.nightScenes.one.length;i++)el('nextDialogue').onclick();
 const saved=C.restoreSave(data.get('okaeri-forest-v1'));assert.equal(saved.scene,'house');assert.equal(saved.pendingEvening,undefined);assert.ok(saved.flags.nightOne);
 el('modalActions').children[1].onclick();assert.equal(JSON.parse(data.get('okaeri-forest-v1')).scene,'town');
});
test('chapter two and three completion request their home scene',()=>{
 const s=Ch.create(4),h={state:s,talk(lines,done){h.done=done;},save(){},updateHud(){},scene(){},evening(key){h.key=key;}};
 s.flags.waterReturned=false;global.OkaeriCanal.handle('bakery',h);h.done();assert.equal(h.key,'two');
 global.OkaeriHill.handle('festivalStart',h);h.done();assert.equal(h.key,'three');
});
