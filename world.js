(function(root){
'use strict';
const W=1152,H=768,T=48;
let smokeLog=null; // 同じく、煙突の位置（煙に使う）
let lightLog=null; // 背景を描く間、ともっている灯りの位置を控える（夜の光に使う）
function homeBreakfast(s){return s.scene==='house'&&(s.openingStage===0||s.openingPrelude||!!root.OkaeriDirector?.stage?.over?.breakfast);}
function koharuMorning(s,time=0){
 if(!homeBreakfast(s))return null;
 const D=root.OkaeriDirector,over=D?.stage?.over?.koharu;
 if(over==='gone')return {state:'gone',doorOpen:true,pose:{x:462,y:422,dir:'right',seated:true}};
 if(!over||over==='asleep')return {state:'asleep',doorOpen:false,pose:{x:552,y:330,dir:'down',seated:false}};
 if(over==='door')return {state:'door',doorOpen:true,pose:{x:552,y:330,dir:'down',seated:false}};
 if(over==='seated'||D?.reduced?.()||!(over?.mode==='seat')||time-over.start>=900)return {state:'seated',doorOpen:true,pose:{x:462,y:422,dir:'right',seated:true}};
 const p=Math.max(0,(time-over.start)/900);
 if(p<.55){const u=p/.55;return {state:'walk',doorOpen:true,pose:{x:552+(462-552)*u,y:330+(360-330)*u,dir:'left',seated:false,scriptWalk:true}};}
 const u=(p-.55)/.45;return {state:'walk',doorOpen:true,pose:{x:462,y:360+(422-360)*u,dir:'down',seated:false,scriptWalk:true}};
}
function breakfastPose(s,time=0){const km=koharuMorning(s,time),look=km?.state==='door'?'up':'down',touma={x:584,y:413,dir:look,seated:true},nina={x:516,y:413,dir:look,seated:true},koharu=km?km.pose:{x:462,y:422,dir:'right',seated:true};return s.lead==='nina'?{p:nina,f:touma,g:koharu}:{p:touma,f:nina,g:koharu};}
function Renderer(canvas){this.c=canvas.getContext('2d');this.t=0;this.p={x:600,y:504,dir:'down'};this.f={x:600,y:552,dir:'down'};this.target={x:600,y:504};this.follow={x:600,y:552};this.g={x:600,y:590,dir:'down'};this.follow2={x:600,y:590};this.cache={};}
Renderer.prototype.reset=function(s){
 if(homeBreakfast(s)){const b=breakfastPose(s);this.p={...b.p};this.f={...b.f};this.g={...b.g};this.target={x:b.p.x,y:b.p.y};this.follow={x:b.f.x,y:b.f.y};this.follow2={x:b.g.x,y:b.g.y};return;}
 const x=s.x*48+24,y=s.y*48+24;this.p={x,y,dir:'down'};this.f={x:x-24,y:y+28,dir:'down'};this.target={x,y};this.follow={x:x-24,y:y+28};this.g={x:x+22,y:y+44,dir:'down'};this.follow2={x:x+22,y:y+44};
};
const ellipse=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
const line=(c,pts,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
function poly(c,p,color){c.fillStyle=color;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function glow(c,x,y,r=60){let g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#ffd48655');g.addColorStop(.4,'#ffbd5e22');g.addColorStop(1,'#ffc46d00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function block(c,x,y,w,h,d=10,front='#8c8474',side='#5d6968',top='#c8d4d0'){
 poly(c,[[x,y],[x+d,y-d*.55],[x+w+d,y-d*.55],[x+w,y]],top);
 poly(c,[[x+w,y],[x+w+d,y-d*.55],[x+w+d,y+h-d*.55],[x+w,y+h]],side);
 rect(c,x,y,w,h,front);line(c,[[x,y],[x+w,y],[x+w+d,y-d*.55]],'#ffffff35',1);
}
function shadow(c,x,y,w,h){const g=c.createRadialGradient(x,y,2,x,y,w);g.addColorStop(0,'#233d4e45');g.addColorStop(1,'#233d4e00');c.save();c.translate(x,y);c.scale(1,h/w);c.fillStyle=g;c.translate(-x,-y);c.fillRect(x-w,y-w,w*2,w*2);c.restore();}
function tree(c,x,y,s=1){root.OkaeriTownArt?.tree(c,x,y,s);}
function shopSign(c,x,y,kind){
 c.save();c.translate(x,y);
 const custom=typeof kind==='object'?kind.name:null;kind=typeof kind==='object'?kind.kind:kind;
 const names={bread:'マロのパン',lamp:'灯守の共同所',thread:'織りもの',clinic:'ユラの診療所',rest:'休憩小屋'},ink=kind==='lamp'?'#bce1d8':kind==='clinic'?'#d8f0e4':'#f4dab0';
 line(c,[[-39,-25],[39,-25]],'#364f50',4);
 for(const sx of [-29,29]){line(c,[[sx,-25],[sx,-15]],'#435956',2);ellipse(c,sx,-16,3,4,'#c0b48a');ellipse(c,sx,-16,1.5,2.5,'#405251');}
 block(c,-42,-13,84,39,5,'#4d6158','#31484a','#b7b89a');
 rect(c,-38,-9,76,31,kind==='lamp'?'#284e54':kind==='clinic'?'#2d5650':'#725b43');
 for(let i=0;i<4;i++)line(c,[[-36,-6+i*7],[36,-5+i*7]],'#d4b88818',1);
 line(c,[[-36,19],[-36,-7],[36,-7],[36,19],[-36,19]],'#c9b083',1);
 for(const sx of [-39,39])for(const sy of [-10,23]){ellipse(c,sx,sy,1.5,1.5,'#e0c999');}
 if(kind==='bread'){
  ellipse(c,0,1,17,8,'#392e2580');ellipse(c,0,-1,16,7,'#d7a35f');ellipse(c,-2,-3,13,4,'#f1c982');
  for(const sx of [-8,0,8])line(c,[[sx-2,-5],[sx+1,1]],'#fff0bb',2);
 }else if(kind==='lamp'){
  line(c,[[-3,-7],[-3,-10],[3,-10],[3,-7]],ink,1.5);
  poly(c,[[-8,-4],[0,-9],[8,-4]],'#c4d8bb');rect(c,-6,-4,12,12,'#eac57f');rect(c,-3,-2,6,8,'#fff0b6');
  line(c,[[-7,8],[7,8]],ink,2);line(c,[[0,-4],[0,7]],'#8a8763',1);
 }else if(kind==='thread'){
  ellipse(c,-2,0,10,8,'#ceaaa7');for(let i=-5;i<7;i+=4)line(c,[[i-3,-6],[i+4,6]],'#f2d5c2',1);
  line(c,[[-12,7],[12,-8]],'#eee2c4',2);
 }else if(kind==='clinic'){
  ellipse(c,0,2,11,6,'#e8e2cf');rect(c,-9,-2,18,5,'#e8e2cf');line(c,[[3,-2],[9,-9]],'#dfcaa0',2.5);
  ellipse(c,-4,-4,4.5,2.5,'#8cc49a');ellipse(c,2,-5,4,2.2,'#a7d8a8');
 }else{
  rect(c,-8,-4,14,10,'#e6d2ac');c.strokeStyle='#e6d2ac';c.lineWidth=2;c.beginPath();c.arc(8,0,4,-Math.PI/2,Math.PI/2);c.stroke();
  line(c,[[-11,8],[11,8]],'#e6d2ac',2);
 }
 c.fillStyle=ink;c.font='bold 9px "Yu Gothic UI",sans-serif';c.textAlign='center';c.fillText(custom||names[kind],0,17);
 line(c,[[-43,-15],[-29,-17],[-8,-15],[13,-17],[40,-15]],'#eaf1e7',5);
 c.restore();
}
// 家。絵は町の描画（town-art.js）。看板・煙・夜の窓あかり・足元の暮らしはここで足す。
function house(c,x,y,w,h,roof='#617b88',signKind='rest'){
 if(!root.OkaeriTownArt?.house(c,x,y,w,h,roof))return;
 if(smokeLog)smokeLog.push([x+w*.68+10,y-34]);
 if(lightLog){const wy=y+69,ww=Math.min(30,w*.19),wh=Math.min(31,h*.24);for(const wx of [x+w*.12,x+w*.73])lightLog.push([wx+ww/2,wy+wh/2,43]);if(h>120)lightLog.push([x+w*.5+45,y+h-Math.min(50,h*.4)+6,30]);}
 if(w>160&&h>120)shopSign(c,x+w*.22,y+h-43,signKind);
 root.OkaeriScenery?.houseDetails(c,x,y,w,h);
}
function lantern(c,x,y,lit=true){if(lit&&lightLog)lightLog.push([x+20,y-16,150]);root.OkaeriTownArt?.lantern(c,x,y,lit);}

Renderer.prototype.background=function(scene){
 const VD=root.OkaeriDraw;this.stale=this.stale||{};
 if(this.cache[scene]&&!(this.stale[scene]&&VD.ready()))return this.cache[scene];this.stale[scene]=false;const missed0=VD?.missed();const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
 this.lights=this.lights||{};lightLog=this.lights[scene]=[];this.smoke=this.smoke||{};smokeLog=this.smoke[scene]=[];
 let vector=false;const finish=()=>{lightLog=null;smokeLog=null;if(VD&&VD.missed()!==missed0&&!VD.failed())this.stale[scene]=true;if(!vector)root.OkaeriScenery?.polish(c,scene);this.cache[scene]=cv;return cv;}; // vector: 描画エンジンの絵は仕上げ込みなので重ねない
 if(root.OkaeriJourneyArt?.background(c,scene,{rect,poly,line,ellipse,block,house,tree,lantern,glow})||root.OkaeriFieldArt?.background(c,scene,{rect,poly,line,ellipse,block,house,tree,lantern,glow})){return finish();}
 if(scene==='house'||scene==='koharuRoom'||scene==='clinic'){ // 屋内は home-art.js の背景。読み込み後に描き直す。
  const ok=scene==='house'?root.OkaeriHomeArt?.background(c):scene==='clinic'?root.OkaeriHomeArt?.clinic(c):root.OkaeriHomeArt?.koharuRoom(c);vector=true;const out=finish();if(!ok&&VD&&!VD.failed())this.stale[scene]=true;return out;
 }
 let g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'#bdd6df');g.addColorStop(.5,'#dce6df');g.addColorStop(1,'#9bbdc9');c.fillStyle=g;c.fillRect(0,0,W,H);
 const paths=[];const path=(p,w)=>paths.push([p,w]);
 const flushPaths=()=>{root.OkaeriTownArt?.ground(c,scene,paths,scene==='hill'?23:scene==='canal'?13:8);};
 if(scene==='town'){
  path([[600,35],[600,730]],108);path([[135,455],[1000,455]],125);flushPaths();
  for(let i=0;i<25;i++){const x=(i*173+12)%W,y=(i*131)%H;if((x<145||x>1030||y<80)&&Math.abs(x-600)>90)tree(c,x,y,1.1+(i%3)*.1);}
  house(c,150,172,222,187,'#617b88','bread');house(c,779,150,225,170,'#657680','lamp');house(c,420,516,168,130,'#597a74','clinic');house(c,884,533,185,150,'#617b88','thread');house(c,68,551,108,95);
  for(const [x,y] of [[439,354],[753,378],[867,475],[365,506],[626,182]])lantern(c,x,y);
  root.OkaeriTownArt?.props(c);
  for(let i=0;i<11;i++){ellipse(c,220+i*14,367,7,5,'#e2d1a7');}
  c.font='14px "Yu Gothic UI"';c.textAlign='center';c.fillStyle='#f4deb3';c.fillText('マロのパン屋',260,346);c.fillStyle='#5e766f';c.fillText('灯守の共同所',887,338);
 }else if(scene==='hill'){
  const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#768fac');sky.addColorStop(.4,'#b8c7d4');sky.addColorStop(1,'#b7ccce');c.fillStyle=sky;c.fillRect(0,0,W,H);
  {const q=[];{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,250],[180,90],[330,240],[490,115],[680,265],[840,130],[1152,230],[1152,768],[0,768]],'#91a9bc');}root.OkaeriTownArt?.lands(c,'hill1',q);}
  {const q=[];{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,420],[260,280],[430,375],[710,210],[930,260],[1152,155],[1152,768],[0,768]],'#c2d4d7');}root.OkaeriTownArt?.lands(c,'hill2',q);}
  path([[216,730],[216,552],[600,552],[600,312],[984,312],[984,168]],135);
  path([[312,552],[312,408]],120);flushPaths();
  house(c,220,291,176,100,'#637b91');
  c.font='14px "Yu Gothic UI"';c.textAlign='center';c.fillStyle='#f0dab0';c.fillText('風待ちの小屋',307,382);
  for(const [x,y] of [[90,490],[90,670],[440,290],[710,475],[1050,570],[500,690]])tree(c,x,y,1.0);
  for(const [x,y] of [[430,655],[726,360],[865,412],[900,96]]){ellipse(c,x,y,35,17,'#8196a3');ellipse(c,x-3,y-8,31,12,'#e5ece9');}
  for(const [x,y] of [[262,624],[552,441],[748,345]])lantern(c,x,y,false);
  for(let i=0;i<6;i++){rect(c,48+i*53,210+i%2*7,29,21,'#788f9e');rect(c,56+i*53,216+i%2*7,7,6,'#efd092');}
 }else if(scene==='canal'){
  rect(c,0,0,W,H,'#b7cdd3');
  root.OkaeriTownArt?.water(c,'canal',[[[60,628],[450,628],[450,538],[825,538],[825,218],[1100,218]]],74);
  path([[168,660],[168,504],[744,504],[744,216],[1032,216]],130);
  path([[312,504],[312,360]],110);flushPaths();
  for(let x=253;x<433;x+=36)block(c,x,658,33,10,8,'#8fa4a9','#617e8f','#d6e3df');
  for(let y=310;y<520;y+=35)block(c,866,y,12,30,9,'#9bb0b7','#607f90','#d7e5e1');
  house(c,218,244,164,86,'#748ca0');
  root.OkaeriTownArt?.bridge(c,386,446,58,114);
  for(const [x,y] of [[100,180],[450,170],[580,240],[920,450],[1030,590],[670,680],[40,470],[1060,100]])tree(c,x,y,1.25);
  for(const [x,y] of [[195,582],[530,452],[693,327],[990,272]])lantern(c,x,y);
  c.textAlign='center';c.font='13px "Yu Gothic UI"';c.fillStyle='#f4deb3';c.fillText('次の人のために、薪を二本',300,322);
  for(let i=0;i<5;i++){rect(c,230+i*19,355,15,10,'#90755d');ellipse(c,237+i*19,355,6,4,'#d2b18a');}
 }else{
  rect(c,0,0,W,H,'#769daa');
  path([[264,738],[264,454],[599,454],[599,214],[1008,214],[1008,113]],137);
  path([[264,454],[264,352]],110);path([[264,624],[120,624],[120,456]],100);flushPaths();
  c.fillStyle='#e4eee6';c.font='bold 12px "Yu Gothic UI"';c.textAlign='center';c.fillText('白樺の待ち場',116,684);
  for(const bx of [49,166]){block(c,bx,503,8,117,4,'#dce2d8','#8fa9ad','#f6f2e6');for(let j=0;j<8;j++)line(c,[[bx,512+j*13],[bx+5,514+j*13]],'#728889',2);line(c,[[bx+4,527],[bx-13,511]],'#afc2bd',4);}

  for(let i=0;i<75;i++){let x=(i*163+40)%W,y=(i*97+40)%H;let tx=Math.round((x-24)/T),ty=Math.round((y-24)/T);const raw={scene:'forest',flags:{mochi:true,log:true,repair:true,crab:true,guardian:true}};if(!OkaeriStory.walkable(raw,tx,ty))tree(c,x,y,1+(i%4)*.1);}
  house(c,164,244,155,89);c.fillStyle='#e2d5b7';c.font='12px "Yu Gothic UI"';c.textAlign='center';c.fillText('森の休憩小屋',241,326);
  root.OkaeriTownArt?.water(c,'forest',[[[470,300],[600,306],[735,318]]],36);
  root.OkaeriTownArt?.bridge(c,556,276,86,64);
  for(const [x,y] of [[321,600],[750,257],[906,269]])lantern(c,x,y,false);
 }
 let seed=491;for(let i=0;i<1600;i++){seed=(seed*16807)%2147483647;let x=seed%W;seed=(seed*16807)%2147483647;let y=seed%H;ellipse(c,x,y,1+(i%3),.65,i%2?'#ffffff20':'#345a7012');}
 return finish();
};
Renderer.prototype.draw=function(s,time,mode){
 const c=this.c,t=time*.001,D=root.OkaeriDirector;this.t=t;c.clearRect(0,0,W,H);c.fillStyle='#0b1c26';c.fillRect(0,0,W,H);c.save();D?.pre(c,time);
 const wantLift=mode==='dialogue'&&!root.matchMedia?.('(orientation:portrait) and (max-width:600px)').matches?Math.max(0,Math.min(170,this.p.y-400)):0;this.lift=(this.lift||0)+(wantLift-(this.lift||0))*.1;if(this.lift<.5&&!wantLift)this.lift=0;const lift=this.lift;c.translate(0,-lift);
 const litNow=!!D?.stage.over.lit,beaconLit=(s.flags.hillLit&&!(s.episode?.chapter===8&&s.episode.step<=3))||(litNow&&s.scene==='hill'),towerLit=s.flags.lit||(litNow&&s.scene==='forest');
 c.drawImage(this.background(s.scene),0,0);
 if(s.scene==='town'&&s.flags.festivalStarted&&(!s.episode||s.episode.chapter===9)){
  rect(c,0,0,W,H,'#1a244957');
  for(const [x,y] of [[300,440],[510,360],[760,420],[875,470],[600,560]])glow(c,x,y,120);
  for(let row=0;row<2;row++){
   const yy=95+row*43;line(c,[[180,yy],[430,yy+35],[720,yy+40],[980,yy]],'#a5aaa1',2);
   for(let i=0;i<12;i++){const x=210+i*65,y=yy+Math.sin(i/11*Math.PI)*39;glow(c,x,y+12,30);rect(c,x-7,y,14,22,i%2?'#e7b779':'#d99272');rect(c,x-8,y-2,16,3,'#647876');}
  }
  for(const [x,y] of [[330,430],[730,520]]){rect(c,x-30,y,60,15,'#a38362');rect(c,x-25,y+15,6,17,'#7c715e');rect(c,x+19,y+15,6,17,'#7c715e');ellipse(c,x,y-3,20,9,'#e7cb98');}
 }
 const drawables=[],km=koharuMorning(s,time);
 if(s.scene==='house'&&root.OkaeriHomeArt?.koharuDoor)drawables.push({y:312,draw:()=>root.OkaeriHomeArt.koharuDoor(c,!km||km.doorOpen)});
 for(const source of OkaeriStory.activeObjects(s)){
  const o=source.base||source;
  const x=o.x*T+24,y=o.y*T+24;
  if(o.type==='homeTable'&&root.OkaeriHomeArt?.tableSeats)drawables.push({y:y-64,draw:()=>root.OkaeriHomeArt.tableSeats(c,x,y,s)});
  if(o.id==='koharuBed'&&km?.state==='asleep'&&OkaeriSprites.has?.('koharu')){
   drawables.push({y:y+.4,draw:()=>{c.save();c.beginPath();c.rect(x-24,y-90,92,66);c.clip();OkaeriSprites.draw(c,x+22,y+12,'koharu','down',false,t,true);c.restore();}});
   drawables.push({y:y+.8,draw:()=>root.OkaeriHomeArt?.bedKQuilt?.(c,x,y)});
  }
  drawables.push({y,draw:()=>{
  if(source.base){ellipse(c,x,y+4,23,9,'#e1c58288');c.textAlign='center';c.font='bold 17px sans-serif';c.fillStyle='#ffe0a1';c.fillText('◆',x,y-88+Math.sin(t*3)*3);}
  if(o.type?.startsWith('home')){root.OkaeriHomeArt?.object(c,o,x,y,s,t,o.type==='homeTable'&&!!root.OkaeriHomeArt?.tableSeats);return;}
  if(root.OkaeriTownArt?.object(c,o,x,y,s,t,{towerLit,beaconLit}))return;
  if(!['exit','npc','mochi','crab','guardian','camp','fieldSpirit','fieldProp'].includes(o.type))ellipse(c,x+10,y+8,25,8,'#3a56652b');
  root.OkaeriJourneyArt?.object(c,o,x,y,s,t,{rect,poly,line,ellipse,block,lantern,glow});
  root.OkaeriFieldArt?.object(c,o,x,y,s,t,{rect,poly,line,ellipse,block,lantern,glow});

  if(o.type==='waitingLight'){lantern(c,x,y,!!s.flags.waitingLit);}
  if(o.type==='npc'){if(['elna','orlf'].includes(o.id))OkaeriResidentsArt.drawMap(c,o.id,x,y);else OkaeriCast.drawMap(c,o.id==='sae'?'sae':'maro',x,y,t);}
  if(o.type==='lamp')lantern(c,x,y);
  if(o.type==='episodeEvent'){if(o.base?.type==='npc'){if(['elna','orlf'].includes(o.base.id))OkaeriResidentsArt.drawMap(c,o.base.id,x,y);else OkaeriCast.drawMap(c,o.base.id==='sae'?'sae':'maro',x,y,t);}ellipse(c,x,y+4,23,9,'#e1c58288');line(c,[[x-16,y-5],[x,y-18],[x+16,y-5]],'#ffe2a4',3);c.textAlign='center';c.font='bold 12px sans-serif';c.fillStyle='#fff1cc';c.fillText('◆',x,y-27);}
  if(o.type==='episodeNpc'||(o.type==='episodeEvent'&&['リツ','ユラ'].includes(o.person))){OkaeriResidentsArt.drawMap(c,o.id==='koharu'?'koharu':o.id==='yura'||o.person==='ユラ'?'yura':'ritsu',x,y);}
  if(o.type==='repair'){lantern(c,x+33,y-20,s.flags.repair);if(!s.flags.repair){line(c,[[x-15,y-5],[x+11,y+5]],'#ae8a59',4);ellipse(c,x,y-5,6,6,'#dfbb77');}}
  if(o.type==='mochi')OkaeriCast.drawMap(c,o.type,x,y,t);
  if(o.type==='crab')OkaeriCast.drawMap(c,o.type,x,y,t);
  if(o.type==='guardian')OkaeriCast.drawMap(c,o.type,x,y,t);
  if(o.type==='exit'){c.fillStyle='#4f787e';c.textAlign='center';c.font='18px sans-serif';c.fillText(o.id==='exit'?'↑':['ourHome','clinicDoor'].includes(o.id)?'⌂':['houseExit','clinicExit'].includes(o.id)?'↓':o.id==='canalExit'?'→':o.id==='hillExit'?'←':['home','canalHome','hillHome'].includes(o.id)?'↓':'',x,y);}
  const ready=(['log','waterGate','windbreak'].includes(o.id)?s.lead==='touma':['repair','regulator','hillLens'].includes(o.id)?s.lead==='nina':true);const distance=Math.hypot(s.x-o.x,s.y-o.y);
  if(distance<2&&mode==='explore'){ellipse(c,x,y-(o.type==='guardian'?115:o.type==='npc'?82:56)+Math.sin(t*3)*2,12,12,ready?'#f0d49be8':'#c6dce5df');c.textAlign='center';c.fillStyle='#37515b';c.font='bold 12px sans-serif';c.fillText('E',x,y-(o.type==='guardian'?111:o.type==='npc'?78:52)+Math.sin(t*3)*2);}
 }});}
 let moving=false,followersMoving=false,thirdMoving=false;
 if(homeBreakfast(s)){
  const b=breakfastPose(s,time);this.p={...b.p};this.f={...b.f};this.g={...b.g};this.target={x:b.p.x,y:b.p.y};this.follow={x:b.f.x,y:b.f.y};this.follow2={x:b.g.x,y:b.g.y};thirdMoving=!!b.g.scriptWalk;
 }else{
  const tx=s.x*T+24,ty=s.y*T+24;
  if(tx!==this.target.x||ty!==this.target.y){this.follow2={...this.follow};this.follow={...this.target};this.p.dir=OkaeriSprites.facing(tx-this.target.x,ty-this.target.y,this.p.dir);this.target={x:tx,y:ty};}
  this.p.x+=(tx-this.p.x)*.22;this.p.y+=(ty-this.p.y)*.22;
  moving=Math.hypot(tx-this.p.x,ty-this.p.y)>1;
  const fx=this.follow.x-this.f.x,fy=this.follow.y-this.f.y;
  this.f.dir=OkaeriSprites.facing(fx,fy,this.f.dir);this.f.x+=fx*.22;this.f.y+=fy*.22;
  followersMoving=Math.hypot(fx,fy)>1;
  const gx=this.follow2.x-this.g.x,gy=this.follow2.y-this.g.y;this.g.dir=OkaeriSprites.facing(gx,gy,this.g.dir);this.g.x+=gx*.2;this.g.y+=gy*.2;
  thirdMoving=Math.hypot(gx,gy)>1;
 }
 const third=D?.companion(s)&&OkaeriSprites.has?.('koharu');
 const party=[{...this.p,id:s.lead,moving},{...this.f,id:s.lead==='touma'?'nina':'touma',moving:followersMoving}].sort((a,b)=>a.y-b.y);
 const shown=party.filter(actor=>!((s.episode?.chapter===3&&s.episode.step>=1&&s.episode.step<=3)||(s.episode?.chapter===10&&root.OkaeriCore?.route(s.episode.route)?.ninaAway&&s.episode.step===2)||root.OkaeriCore?.route(root.OkaeriEpisodes?.playingEpilogue?.())?.ninaAway||root.OkaeriJourney?.split(s))||actor.id===s.lead),drawnParty=shown.map(a=>a.id);
 if(third)shown.push({...this.g,id:'koharu',moving:thirdMoving});
 for(const actor of shown)drawables.push({y:actor.y,draw:()=>OkaeriSprites.draw(c,actor.x,actor.y,actor.id,actor.dir||'down',(actor.moving&&mode==='explore')||!!actor.scriptWalk,t,actor.seated)});
 drawables.sort((a,b)=>a.y-b.y);for(const item of drawables)item.draw();
 // 次の目的地の目印。歩ける時だけ、足元の輪と、上下に揺れる矢印で示す。
 const guide=mode==='explore'?D?.guide(s):null;
 if(guide){
  const gx=guide.x*T+24,gy=guide.y*T+24,pulse=(t*1.2)%1,bob=Math.sin(t*4)*5,top=gy-(guide.via?58:104)+bob;
  c.save();c.strokeStyle='rgba(255,214,130,'+(.85*(1-pulse))+')';c.lineWidth=3;c.beginPath();c.ellipse(gx,gy+6,16+pulse*22,6+pulse*8,0,0,Math.PI*2);c.stroke();
  c.fillStyle='#ffd27a';c.strokeStyle='#7a5a22';c.lineWidth=2;c.beginPath();c.moveTo(gx-13,top-16);c.lineTo(gx+13,top-16);c.lineTo(gx,top+4);c.closePath();c.fill();c.stroke();
  c.restore();
 }
 if(s.scene==='canal'&&((s.episode?.chapter===3&&s.episode.step>=1&&s.episode.step<=3)||D?.stage.over.flood)){for(let i=0;i<12;i++){const ry=400+i*17;line(c,[[400+Math.sin(t*3+i)*15,ry],[630+Math.sin(t*3+i+.5)*15,ry+10]],'#b6e5ed66',2);}c.fillStyle='#a3d9e514';c.fillRect(0,0,W,H);}
 if(s.flags.lit){const g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'#dfae4820');g.addColorStop(1,'#2c31581c');c.fillStyle=g;c.fillRect(0,0,W,H);}
 root.OkaeriScenery?.animate(c,s.scene,t,this.smoke?.[s.scene]||[]);
 if(!['house','koharuRoom','clinic','lampworkshop'].includes(s.scene))for(let i=0;i<55;i++){const x=(i*137+t*(9+i%5))%W,y=(i*89+t*(12+i%8))%H;ellipse(c,x,y,1.2+i%2,1.2+i%2,'#ffffff75');}
 D?.light(c,s,time,this.lights?.[s.scene]||[]);D?.weatherLayer(c,s,time);
 const vign=c.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,W*.65);vign.addColorStop(0,'#071d3000');vign.addColorStop(1,'#071d3077');c.fillStyle=vign;c.fillRect(0,0,W,H);
 c.restore();
 // 感情の吹き出しは、話している人の頭上へ。同行者が画面にいない時は先頭の人に出す。
 const follower=s.lead==='touma'?'nina':'touma',objects=OkaeriStory.activeObjects(s);
 D?.post(c,time,who=>{
  if(who===s.lead)return {x:this.p.x,y:this.p.y-82-lift};
  if(who===follower)return drawnParty.includes(who)?{x:this.f.x,y:this.f.y-82-lift}:null;
  if(who==='コハル'&&third)return {x:this.g.x,y:this.g.y-78-lift};
  const id=D.speakerIds[who];if(!id)return null;
  const o=objects.find(o=>o.id===id||o.base?.id===id||(o.person===who)||(o.type==='journeyProp'&&o.kind===id));
  return o?{x:o.x*T+24,y:o.y*T+24-96-lift}:null;
 });
};
// 専用の絵がある精霊・魔獣（色ちがいの代わりに使う）。ice は氷殻が溶けたあとの差分。
const OWN_ART={hail:['arare-mochi'],sleet:['mizore-yadokari-frozen','mizore-yadokari-thawed'],echo:['kodama-guardian'],beast:['higui']};
const ownArt=(e,name)=>'assets/monsters/web/'+name+'.png';
function enemySvg(type,e){
 const own=e&&OWN_ART[e.tint];if(!own)return OkaeriCast.battleArt(type);
 const src=n=>ownArt(e,n),now=own[1]&&!e.ice?own[1]:own[0];
 return '<img class="enemy-art own-art-img" alt="" draggable="false" src="'+src(now)+'"'+(own[1]?' data-frozen="'+src(own[0])+'" data-thawed="'+src(own[1])+'"':'')+'>';
}
root.OkaeriWorld={Renderer,enemySvg,OWN_ART};
})(globalThis);
