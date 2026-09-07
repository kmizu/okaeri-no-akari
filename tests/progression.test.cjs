const {test}=require('node:test');const assert=require('node:assert/strict');
require('../story.js');const S=global.OkaeriStory;
const C=require('../core.js');
function reach(s,tx,ty){const q=[[s.x,s.y]],seen=new Set();while(q.length){const [x,y]=q.shift(),k=x+','+y;if(seen.has(k))continue;seen.add(k);if(Math.hypot(tx-x,ty-y)<1.5)return [x,y];for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]])if(S.walkable(s,x+a,y+b))q.push([x+a,y+b]);}return null;}
test('each forest objective is reachable in order and premature shortcuts are blocked',()=>{
 const s={scene:'forest',x:5,y:13,flags:{board:true}};
 assert.equal(S.walkable(s,5,10),false);
 for(const id of ['mochi','rest','log','repair','crab','guardian','tower']){const o=S.objects.forest.find(o=>o.id===id);const p=reach(s,o.x,o.y);assert.ok(p,'unreachable '+id);[s.x,s.y]=p;s.flags[id==='tower'?'lit':id]=true;}
 assert.ok(reach(s,5,14),'cannot return home');
});
test('all town interactions can be reached from arrival',()=>{for(const o of S.objects.town)assert.ok(reach({scene:'town',x:12,y:3,flags:{}},o.x,o.y),o.id);});
test('each encounter can be won with displayed commands and no items',()=>{
 for(const kind of ['mochi','crab','guardian']){
  let b=C.newBattle(kind),rounds=0;
  while(b.status==='active'&&rounds++<20){
   const t=b.enemies.findIndex(e=>e.hp>0),th=b.heroes.touma,nh=b.heroes.nina,forecast=C.intentions(b)[t];
   if(b.gauge===3&&th.hp>0&&nh.hp>0){b=C.resolveTurn(b,{team:'flare'},['touma','nina']);continue;}
   let ts=nh.hp===0?'rescue':forecast?.target==='nina'&&forecast.damage>=30?'protect':th.sp>=2?'break':'attack';
   let ns=th.hp===0?'rescue':nh.sp>=2&&Math.min(th.hp/th.max,nh.hp/nh.max)<.45?'heal':nh.sp>=2?'fire':'attack';
   const target=th.hp/th.max<nh.hp/nh.max?'touma':'nina';
   b=C.resolveTurn(b,{touma:{skill:ts,target:t},nina:{skill:ns,target:ns==='heal'?target:t}},kind==='crab'?['nina','touma']:['touma','nina']);
  }
  assert.equal(b.status,'victory',kind);assert.ok(rounds<=9,kind+' too long: '+rounds);
 }
});
test('a legitimate complete save survives round trip',()=>{
 const s={version:1,scene:'town',x:11,y:8,lead:'nina',flags:{board:true,mochi:true,log:true,repair:true,crab:true,guardian:true,lit:true,returned:true},courage:2};
 const restored=C.restoreSave(JSON.stringify(s));assert.equal(restored.flags.returned,true);assert.equal(restored.courage,2);assert.equal(restored.lead,'nina');
});

