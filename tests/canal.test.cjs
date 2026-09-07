const {test}=require('node:test'),assert=require('node:assert/strict');
require('../story.js');const S=global.OkaeriStory,C=require('../core.js');
function reach(s,tx,ty){const q=[[s.x,s.y]],seen=new Set();while(q.length){const [x,y]=q.shift(),k=x+','+y;if(seen.has(k))continue;seen.add(k);if(Math.hypot(tx-x,ty-y)<1.5)return [x,y];for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]])if(S.walkable(s,x+a,y+b))q.push([x+a,y+b]);}return null;}
const previous={board:true,mochi:true,log:true,repair:true,crab:true,guardian:true,lit:true,returned:true};
test('canal objectives are reachable in order, gates prevent skipping',()=>{
 const s={scene:'canal',x:3,y:12,flags:{...previous,canalStarted:true}};
 assert.equal(S.walkable(s,8,10),false);
 for(const [id,flag] of [['waterGate','waterGate'],['canalCrab','canalCrab'],['regulator','waterFlow'],['waterBeacon','waterLit']]){
  const o=S.objects.canal.find(o=>o.id===id);const p=reach(s,o.x,o.y);assert.ok(p,id);[s.x,s.y]=p;s.flags[flag]=true;
 }
 assert.ok(reach(s,3,13));assert.ok(reach(s,6,7));
});
test('new chapter saves round trip and older first chapter saves still load',()=>{
 const s={version:1,scene:'canal',x:3,y:12,lead:'nina',flags:{...previous,canalStarted:true,waterGate:true,canalCrab:true,waterFlow:true,waterLit:true,canalRest:true},courage:2};
 const restored=C.restoreSave(JSON.stringify(s));assert.ok(restored);assert.equal(restored.flags.waterLit,true);assert.equal(restored.flags.canalRest,true);
 assert.ok(C.restoreSave(JSON.stringify({...s,scene:'town',flags:previous})));
 assert.equal(C.restoreSave(JSON.stringify({...s,flags:{canalStarted:true}})),null);
});
