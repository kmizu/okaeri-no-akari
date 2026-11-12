(function(root){
'use strict';
// 「薬草の谷」「峠の旧道」の背景と、そこに置く物・精霊の描画。
const T=48,P=n=>n*T+24,W=1152,H=768;
const TINT={hail:'sepia(.55) hue-rotate(165deg) saturate(2.2) brightness(1.02)',sleet:'hue-rotate(70deg) saturate(1.25)',echo:'hue-rotate(55deg) saturate(1.2) brightness(1.08)'};
function background(c,scene,h){
 if(!root.OkaeriField?.names[scene])return false;
 const {rect,poly,line,ellipse,block,house,tree,lantern,glow}=h;
 const text=(s,x,y,size=13,color='#4c6266')=>{c.font=size+'px "Yu Gothic UI",sans-serif';c.textAlign='center';c.fillStyle=color;c.fillText(s,x,y);};
 const road=(pts,w=78)=>{const p=pts.map(([x,y])=>[P(x),P(y)]);if(root.OkaeriTownArt?.trail(c,scene+w+p.length,p,w-8))return;line(c,p.map(([x,y])=>[x+5,y+13]),'#6c8d9a40',w+8);line(c,p,'#c9d9d4',w);line(c,p,'#f3f2e6',w-20);};
 if(scene==='herbvale'){
  const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#a9c9c4');sky.addColorStop(.5,'#d6e4d6');sky.addColorStop(1,'#c2d8c8');c.fillStyle=sky;c.fillRect(0,0,W,H);
  // 谷の両側の斜面
  {const q=[],poly0=poly;{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,0],[420,0],[330,150],[210,260],[90,330],[0,380]],'#8fb0a8');poly(c,[[W,0],[700,0],[800,120],[930,95],[1040,170],[W,230]],'#87aaa6');}if(!root.OkaeriTownArt?.lands(c,'vale1',q))for(const [p,col] of q)poly0(c,p,col);}
  {const q=[],poly0=poly;{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,0],[380,0],[300,130],[190,235],[80,300],[0,345]],'#dfe9df');poly(c,[[W,0],[740,0],[830,100],[940,78],[1050,150],[W,205]],'#e6eee3');}if(!root.OkaeriTownArt?.lands(c,'vale2',q))for(const [p,col] of q)poly0(c,p,col);}
  // 雪の下からのぞく草地（地面が温かい）
  for(const [x,y,rx,ry] of [[300,480,170,70],[240,540,120,45],[640,330,120,40],[880,300,150,50]]){ellipse(c,x,y,rx,ry,'#b9d1a6');ellipse(c,x,y-4,rx-14,ry-9,'#cfe0b4');}
  // 湯気の立つ小川
  const river=[[1152,520],[980,500],[820,520],[690,480],[620,470],[560,500],[470,620],[380,700],[300,768]];
  if(!root.OkaeriTownArt?.water(c,'herbvale',[river],46,true)){line(c,river,'#6fa3b455',64);line(c,river,'#8fc2cf',46);line(c,river,'#c2e2e4',20);}
  road([[2,13],[10,13],[10,7],[19,7],[19,4]]);road([[9,10],[5,10]],64);
  // 小川にかかる丸木
  if(!root.OkaeriTownArt?.bridge(c,P(12)-34,P(10)-16,70,42)){for(let i=0;i<4;i++)block(c,P(12)-34+i*18,P(10)-12,15,34,6,'#a58a63','#5f6a58','#d6c39b');}
  for(const [x,y,s] of [[70,120,1.3],[170,70,1.1],[300,60,1],[1010,330,1.2],[1090,440,1.3],[930,620,1.2],[760,660,1.1],[110,650,1.25],[1040,90,1]])tree(c,x,y,s);
  // 干し小屋（屋根だけ）
  const hx=P(19),hy=P(3);const vhut=root.OkaeriTownArt?.shed(c,hx,hy);if(!vhut)for(const dx of [-58,52])block(c,hx+dx,hy-70,7,84,6,'#8b7658','#4f625a','#c9b68e');
  if(!vhut){poly(c,[[hx-78,hy-72],[hx,hy-112],[hx+78,hy-72],[hx+70,hy-60],[hx-70,hy-60]],'#e9efe4');poly(c,[[hx-70,hy-60],[hx+70,hy-60],[hx+62,hy-50],[hx-62,hy-50]],'#8c8a74');}
  if(!vhut){for(let i=0;i<7;i++){const x=hx-52+i*17;line(c,[[x,hy-50],[x,hy-28]],'#7d8a5c',2);ellipse(c,x,hy-22,6,10,i%2?'#9db06a':'#b7c67f');}}
  lantern(c,P(17)-10,P(4));
  text('薬草の谷',P(6),P(14)+6);text('温め草の畑',P(6),P(8)-6,11,'#5f7a4c');
 }else{
  const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#8ea6c2');sky.addColorStop(.45,'#cdd9de');sky.addColorStop(1,'#b3c6cf');c.fillStyle=sky;c.fillRect(0,0,W,H);
  // 遠い稜線と、足元の谷
  {const q=[],poly0=poly;{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,170],[140,90],[260,150],[420,60],[590,160],[760,70],[940,150],[1090,60],[W,110],[W,H],[0,H]],'#7f98ae');}if(!root.OkaeriTownArt?.lands(c,'pass1',q))for(const [p,col] of q)poly0(c,p,col);}
  {const q=[],poly0=poly;{const poly=(c,p,col)=>q.push([p,col]);for(const [a,b,d] of [[140,90,60],[420,60,70],[760,70,70],[1090,60,60]])poly(c,[[a-d,b+d*.7],[a,b],[a+d,b+d*.75],[a+d*.3,b+d*.5],[a,b+d*.62],[a-d*.3,b+d*.48]],'#eef1e8');}if(!root.OkaeriTownArt?.lands(c,'pass2',q))for(const [p,col] of q)poly0(c,p,col);}
  {const q=[],poly0=poly;{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,300],[250,260],[520,290],[790,240],[W,270],[W,H],[0,H]],'#a9c0cb');poly(c,[[0,330],[250,292],[520,322],[790,272],[W,300],[W,H],[0,H]],'#e7ede5');}if(!root.OkaeriTownArt?.lands(c,'pass3',q))for(const [p,col] of q)poly0(c,p,col);}
  // 崖の縁（右下は谷へ落ちる）
  {const q=[],poly0=poly;{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[560,H],[700,560],[900,470],[W,440],[W,H]],'#8fa8b6');poly(c,[[600,H],[725,585],[915,495],[W,468],[W,H]],'#6f8c9f');}if(!root.OkaeriTownArt?.lands(c,'pass4',q))for(const [p,col] of q)poly0(c,p,col);}
  for(let i=0;i<9;i++)line(c,[[640+i*58,H],[720+i*52,610-i*14]],'#ffffff18',2);
  road([[2,13],[8,13],[8,8],[16,8],[16,4],[21,4]]);
  // 雪に埋もれた轍の跡
  for(let i=0;i<14;i++){const x=P(8)+18+i*26,y=P(8)-6;ellipse(c,x,y,7,2,'#b5c6c655');ellipse(c,x,y+16,7,2,'#b5c6c644');}
  // 古い石垣と、傾いた柵
  if(!root.OkaeriTownArt?.wall(c,P(9),P(9)+18,348)){for(let i=0;i<8;i++)block(c,P(9)+i*44,P(9)+18,36,14,8,'#aab7b5','#73898f','#e6ece6');}
  if(!root.OkaeriTownArt?.fence(c,P(3),P(10)-12,200)){for(let i=0;i<6;i++){const x=P(3)+i*40,y=P(10)-10-(i%2)*4;block(c,x,y,5,30,4,'#84775f','#4f6460','#c8c2a8');}line(c,[[P(3),P(10)-4],[P(7)+10,P(10)-12]],'#8c7f66',3);}
  for(const [x,y,s] of [[60,430,1.3],[150,520,1.1],[1090,330,1.1],[330,250,.9],[980,640,1.2]])tree(c,x,y,s);
  // 町の灯り（曲がり角から見下ろす）
  for(let i=0;i<9;i++){const x=470+i*23,y=250+Math.sin(i*1.3)*9;rect(c,x,y,9,7,'#5f7686');rect(c,x+2,y+2,4,3,'#ffe3a4');}
  text('峠の旧道',P(4),P(14)+6);text('ユキネ',575,236,10,'#51697b');
 }
 return true;
}
function object(c,o,x,y,s,t,h){
 const {rect,poly,line,ellipse,block,lantern,glow}=h,f=s.flags||{};
 if(o.type==='fieldSpirit'){
  c.save();if(TINT[o.tint])c.filter=TINT[o.tint];
  if(o.id==='valeHail')for(const dx of [-26,0,26])root.OkaeriCast.drawMap(c,'mochi',x+dx,y+(dx?0:-8),t+dx);
  else if(o.id==='passMix'){root.OkaeriCast.drawMap(c,'crab',x,y,t);root.OkaeriCast.drawMap(c,'mochi',x+4,y-30,t);}
  else{if(o.tint==='echo'){c.translate(x,y);c.scale(.72,.72);c.translate(-x,-y);}root.OkaeriCast.drawMap(c,o.art,x,y,t);}
  c.restore();return;
 }
 if(o.type!=='fieldProp')return;
 if(root.OkaeriTownArt?.fieldProp(c,o,x,y,f))return;
 if(o.kind==='exit'||o.kind==='gate'){c.fillStyle='#4f787e';c.textAlign='center';c.font='18px sans-serif';c.fillText(o.id==='valeGate'?'←':o.id==='passGate'?'→':'↓',x,y);return;}
 if(o.kind==='herb'){for(const [dx,dy] of [[-14,2],[0,-6],[13,3],[-4,8]]){ellipse(c,x+dx,y+dy,9,5,'#8fae68');ellipse(c,x+dx-3,y+dy-3,5,3,'#b9cf8a');}const k=(Math.sin(t*1.4)+1)/2;ellipse(c,x,y-20-k*8,7,10,'rgba(255,255,255,'+(.16*(1-k))+')');}
 if(o.kind==='stream'){for(let i=0;i<3;i++){const k=((t*.5+i*.33)%1);ellipse(c,x-14+i*14,y-12-k*26,8,12,'rgba(255,255,255,'+(.2*(1-k))+')');}}
 if(o.kind==='stone'){block(c,x-13,y-34,26,40,9,'#8f9c8c','#5d7068','#c5d0bf');for(let i=0;i<3;i++)ellipse(c,x,y-24+i*10,4,3,'#6f8a55');ellipse(c,x-8,y-36,9,4,'#7d9a62');}
 if(o.kind==='hut'){if(!f.valeHut)glow(c,x-30,y-6,26);block(c,x-44,y-12,30,12,8,'#a58a63','#5f6a58','#d6c39b');for(const dx of [-38,-26]){ellipse(c,x+dx,y-15,5,6,'#d9c9a2');}}
 if(o.kind==='sign'){block(c,x-3,y-40,6,48,4,'#84775f','#4f6460','#c8c2a8');poly(c,[[x-24,y-40],[x+18,y-40],[x+28,y-32],[x+18,y-24],[x-24,y-24]],'#9c8f72');line(c,[[x-24,y-42],[x+19,y-42]],'#edf1e6',4);}
 if(o.kind==='view'){for(let i=0;i<3;i++)block(c,x-26+i*20,y-6,14,12,6,'#aab7b5','#73898f','#e6ece6');}
 if(o.kind==='cairn'){
  ellipse(c,x,y+8,40,12,'#4f687755');
  for(const [dx,dy,w] of [[-30,-4,60],[-23,-18,46],[-16,-31,32],[-10,-43,20]])block(c,x+dx,y+dy,w,14,9,'#a7b2ae','#6f858b','#e3e9e2');
  block(c,x-8,y-66,16,22,6,'#59706c','#3a524f','#9fb1a4');rect(c,x-5,y-62,10,13,f.passLit?'#ffe0a0':'#7d9aa6');
  poly(c,[[x-13,y-66],[x,y-78],[x+13,y-66]],'#eef1e6');if(f.passLit)glow(c,x,y-56,120);
 }
}
// 夜や夕暮れの光に、塚の灯りを足す。
function lights(s){const f=s.flags||{};return s.scene==='oldpass'&&f.passLit?[[P(20),P(3)-56,260,1]]:[];}
root.OkaeriFieldArt={background,object,lights,TINT};
})(globalThis);
