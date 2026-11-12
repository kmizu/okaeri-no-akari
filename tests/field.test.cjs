const {test}=require('node:test'),assert=require('node:assert/strict');
require('../story.js');require('../chapters.js');const C=require('../core.js');require('../episodes-data.js');require('../episode-activities.js');require('../episodes.js');require('../journey.js');
const F=require('../field.js'),D=require('../direction.js'),E=global.OkaeriEpisodes,S=global.OkaeriStory;
const reach=(s,sx,sy)=>{const q=[[sx,sy]],seen=new Set();while(q.length){const [x,y]=q.shift(),k=x+','+y;if(seen.has(k))continue;seen.add(k);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(S.walkable(s,x+dx,y+dy))q.push([x+dx,y+dy]);}return [...seen].map(k=>k.split(',').map(Number));};
test('everything in the two new areas can be approached, and saves made there load',()=>{
 for(const scene of Object.keys(F.names)){
  const s=E.create(5);Object.assign(s,{scene,x:F.spawns[scene][0],y:F.spawns[scene][1]});
  assert.ok(S.walkable(s,s.x,s.y),scene);assert.ok(C.restoreSave(JSON.stringify(s)),scene);
  const tiles=reach(s,s.x,s.y);
  for(const o of S.activeObjects(s))assert.ok(tiles.some(([x,y])=>Math.hypot(x-o.x,y-o.y)<1.65),scene+':'+o.id);
 }
 for(const [scene,gate] of Object.entries(F.gates)){const s=E.create(5);s.scene=scene;assert.ok(S.activeObjects(s).some(o=>o.id===gate.id));assert.ok(reach(s,...E.spawns[scene]).some(([x,y])=>Math.hypot(x-gate.x,y-gate.y)<1.65),gate.id);}
});
test('roaming spirits are optional, vanish once calmed, and enter the notebook',()=>{
 const s=E.create(5);s.scene='herbvale';let talked,won,battle;
 const a={state:s,talk(l,cb){talked=l;if(cb)cb();},startBattle(kind,onWin){battle=kind;won=onWin;},save(){},updateHud(){},toast(){},scene(){}};
 assert.equal(F.handle('valeHail',a),true);assert.equal(battle,'hail');assert.equal(s.flags.calm_valeHail,undefined);
 won();assert.equal(s.flags.calm_valeHail,true);assert.ok(!S.activeObjects(s).some(o=>o.id==='valeHail'));
 assert.ok(global.OkaeriActivities.notes(s).some(n=>n.includes('あられモチ')));assert.ok(C.restoreSave(JSON.stringify(s)));
 s.scene='oldpass';F.handle('passCairn',a);assert.equal(s.flags.passLit,undefined,'the cairn waits behind its guardian');
 s.flags.calm_passEcho=true;F.handle('passCairn',a);assert.equal(s.flags.passLit,true);
 const storm=E.create(8);storm.scene='hill';let moved=false;F.handle('passGate',{state:storm,talk(){},scene(){moved=true;},save(){}});assert.equal(moved,false,'no detour in the blizzard');
});
test('each new encounter can be won, and sleet shells freeze over again',()=>{
 for(const kind of ['hail','sleet','mix','echo']){
  let b=C.newBattle(kind);
  for(let t=0;t<40&&b.status==='active';t++){
   const target=b.enemies.findIndex(e=>e.hp>0),low=Object.entries(b.heroes).find(([,h])=>h.hp>0&&h.hp<h.max*.45);
   const cmd=b.gauge>=3&&Object.values(b.heroes).every(h=>h.hp>0)?{team:'flare'}:{touma:{skill:b.heroes.nina.hp<=0?'rescue':'attack',target},nina:b.heroes.touma.hp<=0?{skill:'rescue'}:low&&b.heroes.nina.sp>=2?{skill:'heal',target:low[0]}:b.enemies[target].ice&&b.heroes.nina.sp>=2?{skill:'fire',target}:{skill:'attack',target}};
   b=C.resolveTurn(b,cmd,['touma','nina']);
  }
  assert.equal(b.status,'victory',kind);
 }
 let b=C.newBattle('sleet');b=C.resolveTurn(b,{touma:{skill:'guard'},nina:{skill:'fire',target:0}},['touma','nina']);assert.equal(b.enemies[0].ice,false);
 b=C.resolveTurn(b,{touma:{skill:'guard'},nina:{skill:'guard'}},['touma','nina']);b=C.resolveTurn(b,{touma:{skill:'guard'},nina:{skill:'guard'}},['touma','nina']);
 assert.equal(b.enemies[0].ice,true);
});
test('the guide points at the goal on this map, or at the exit that leads to it',()=>{
 const s=E.create(2);assert.deepEqual(D.guide(s),{x:20,y:9,via:null});
 s.episode.step=1;assert.equal(D.guide(s).via,'共同水路へ');assert.deepEqual([D.guide(s).x,D.guide(s).y],[22,9]);
 s.scene='canal';assert.deepEqual(D.guide(s),{x:6,y:7,via:null});
 s.scene='herbvale';assert.equal(D.guide(s).via,'森へ戻る');
 const one=E.create(1);one.flags.board=true;assert.equal(D.guide(one).via,'森へ続く道');one.scene='forest';assert.deepEqual(D.guide(one),{x:5,y:11,via:null});
 one.openingStage=0;assert.equal(D.guide(one),null);
});
test('a beast goes for the lamp-bearer, cannot be calmed, and can be driven off by guarding her',()=>{
 let b=C.newBattle('beast',{support:'koharu'});assert.equal(b.enemies[0].beast,true);
 assert.deepEqual(C.intentions(b).map(i=>i.target),['nina']);
 for(let t=0;t<40&&b.status==='active';t++){
  const aim=C.intentions(b)[0].target,ready=b.gauge>=3&&Object.values(b.heroes).every(h=>h.hp>0);
  const cmd=ready?{team:'flare'}:{touma:{skill:aim==='nina'?'protect':'attack',target:0},nina:b.heroes.nina.hp<40&&b.heroes.nina.sp>=2?{skill:'heal',target:'nina'}:b.heroes.nina.sp>=2?{skill:'fire',target:0}:{skill:'attack',target:0}};
  b=C.resolveTurn(b,cmd,['touma','nina']);
 }
 assert.equal(b.status,'victory');assert.ok(b.logs.some(l=>l.includes('退いていった')));assert.ok(!b.logs.some(l=>l.includes('落ち着きを取り戻した')));
 const ev=E.events(E.create(8))[2];assert.equal(ev.battle,'beast');assert.ok(ev.after.some(l=>l[1].includes('追わない')));
});
