const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../core.js'),Ch=require('../chapters.js');require('../story.js');require('../canal.js');require('../hill.js');require('../side-stories.js');
test('actual chapter menu and saves never replace the normal journey, continue loads normal',()=>{
 const normal=JSON.stringify(Ch.create(1)),data=new Map([['okaeri-forest-v1',normal]]),els={};
 function el(id){if(els[id])return els[id];const e={hidden:false,children:[],style:{},classList:{add(){},remove(){}},focus(){},setAttribute(){},addEventListener(){},append(x){this.children.push(x);},replaceChildren(){this.children=[];}};Object.defineProperty(e,'innerHTML',{set(v){this.html=v;if(id==='modalContent'&&els.modalActions)els.modalActions.children=[];},get(){return this.html;}});return els[id]=e;}
 const context={OkaeriCore:C,OkaeriChapters:Ch,OkaeriStory:global.OkaeriStory,OkaeriCanal:global.OkaeriCanal,OkaeriHill:global.OkaeriHill,OkaeriSideStories:global.OkaeriSideStories,OkaeriWorld:{Renderer:class{reset(){}draw(){}}},OkaeriMusic:class{select(){return Promise.resolve();}stop(){}},OkaeriSprites:{load:()=>Promise.resolve()},OkaeriCast:{ready:Promise.resolve()},OkaeriResidentsArt:{ready:Promise.resolve()},document:{getElementById:el,createElement:()=>({}),addEventListener(){},querySelectorAll:()=>[]},window:{addEventListener(){}},localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){},console};
 vm.runInNewContext(fs.readFileSync(require.resolve('../game.js'),'utf8'),context);
 el('chapterButton').onclick();el('modalActions').children[2].onclick();for(let i=0;i<7;i++)el('nextDialogue').onclick();
 assert.equal(data.get('okaeri-forest-v1'),normal);assert.equal(JSON.parse(data.get('okaeri-chapter-v1')).scene,'hill');
 el('menuButton').onclick();el('modalActions').children[1].onclick();el('continueButton').onclick();
 assert.equal(el('objectiveText').textContent,'広場の出発札を掛けよう');assert.equal(data.get('okaeri-forest-v1'),normal);
});
