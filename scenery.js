(function(root){
'use strict';
// 風景の仕上げ。各地図の背景を描き終えたあとに一度だけ重ねる細部（雪の起伏・踏み跡・茂みや岩・紙の質感）と、
// 毎フレーム描く動き（煙突の煙、手前を横切る大きな雪）。
const W=1152,H=768,T=48;
const INDOOR=['house','lampworkshop'];
// 水面など、物を置いてはいけない帯（折れ線と幅）
const WATER={
 canal:[[[60,630],[450,630],[450,540],[825,540],[825,220],[1100,220]],64],
 herbvale:[[[1152,520],[980,500],[820,520],[690,480],[620,470],[560,500],[470,620],[380,700],[300,768]],44],
 forest:[[[480,300],[721,316]],40]
};
function rng(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const hash=str=>[...str].reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,7);
function segDist(px,py,[ax,ay],[bx,by]){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l));return Math.hypot(px-ax-t*dx,py-ay-t*dy);}
function nearWater(scene,x,y){const w=WATER[scene];if(!w)return false;const [pts,width]=w;for(let i=0;i<pts.length-1;i++)if(segDist(x,y,pts[i],pts[i+1])<width)return true;return false;}

// ---------------------------------------------------------------- 小物
function ell(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function bush(c,x,y,r,k){
 ell(c,x+r*.5,y+r*.28,r*1.25,r*.36,'rgba(52,84,104,.20)');
 const tones=['#3f6058','#35544f','#48695e'];
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2+k*6,px=x+Math.cos(a)*r*.48,py=y-r*.36+Math.sin(a)*r*.2;ell(c,px,py,r*.52,r*.42,tones[i%3]);}
 ell(c,x,y-r*.42,r*.66,r*.46,'#44665b');
 // 雪の帽子と、のぞく赤い実
 ell(c,x-r*.08,y-r*.72,r*.74,r*.34,'#dfe9e6');ell(c,x-r*.16,y-r*.8,r*.56,r*.25,'#f6f7f0');
 ell(c,x+r*.34,y-r*.5,r*.3,r*.16,'#eef2ec');
 if(k>.55)for(const [dx,dy] of [[-.42,-.22],[.1,-.12],[.44,-.24]])ell(c,x+dx*r,y+dy*r,1.8,1.8,'#c0584b');
}
function rock(c,x,y,r,k){
 ell(c,x+r*.4,y+r*.2,r*1.2,r*.3,'rgba(52,84,104,.22)');
 c.fillStyle='#8496a0';c.beginPath();c.moveTo(x-r,y);c.lineTo(x-r*.7,y-r*.55);c.lineTo(x-r*.1,y-r*.85);c.lineTo(x+r*.62,y-r*.6);c.lineTo(x+r,y);c.closePath();c.fill();
 c.fillStyle='#62778a';c.beginPath();c.moveTo(x+r*.1,y-r*.8);c.lineTo(x+r*.62,y-r*.6);c.lineTo(x+r,y);c.lineTo(x+r*.25,y);c.closePath();c.fill();
 c.fillStyle='#f3f5ee';c.beginPath();c.moveTo(x-r*.78,y-r*.5);c.quadraticCurveTo(x-r*.1,y-r*1.12,x+r*.66,y-r*.58);c.quadraticCurveTo(x+r*.2,y-r*.5,x-r*.1,y-r*.62);c.quadraticCurveTo(x-r*.5,y-r*.4,x-r*.78,y-r*.5);c.fill();
 if(k>.5){c.strokeStyle='rgba(60,80,92,.35)';c.lineWidth=1;c.beginPath();c.moveTo(x-r*.3,y-r*.3);c.lineTo(x-r*.1,y-r*.05);c.stroke();}
}
function tuft(c,x,y,r,k){
 c.strokeStyle=k>.5?'#8a8f6a':'#74845f';c.lineWidth=1.3;c.lineCap='round';
 for(let i=0;i<6;i++){const a=-Math.PI/2+(i-2.5)*.28+(k-.5)*.3,l=r*(.7+((i*37)%10)/22);c.beginPath();c.moveTo(x+(i-2.5)*1.6,y);c.quadraticCurveTo(x+(i-2.5)*2.4,y-l*.6,x+Math.cos(a)*l,y+Math.sin(a)*l);c.stroke();}
 ell(c,x,y+1,r*.75,r*.2,'rgba(246,247,240,.9)');
}
function mound(c,x,y,r){
 ell(c,x+r*.25,y+r*.14,r*1.1,r*.34,'rgba(70,104,126,.16)');
 const g=c.createLinearGradient(x-r,y-r*.5,x+r,y+r*.2);g.addColorStop(0,'#fbfbf4');g.addColorStop(1,'#cfdde0');c.fillStyle=g;
 c.beginPath();c.moveTo(x-r,y);c.quadraticCurveTo(x-r*.5,y-r*.62,x,y-r*.5);c.quadraticCurveTo(x+r*.6,y-r*.42,x+r,y);c.closePath();c.fill();
 c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1.5;c.beginPath();c.moveTo(x-r*.7,y-r*.3);c.quadraticCurveTo(x-r*.3,y-r*.56,x+r*.1,y-r*.46);c.stroke();
}
function sapling(c,x,y,r,k){
 ell(c,x+r*.4,y+2,r*.9,r*.22,'rgba(52,84,104,.2)');
 c.fillStyle='#6b5d4a';c.fillRect(x-1.5,y-r*.5,3,r*.5);
 for(let i=0;i<3;i++){const yy=y-r*.35-i*r*.42,w=r*(.62-i*.16);
  c.fillStyle=i%2?'#2f4f52':'#3a5d5c';c.beginPath();c.moveTo(x-w,yy);c.lineTo(x,yy-r*.62);c.lineTo(x+w,yy);c.closePath();c.fill();
  c.fillStyle='#eef2ea';c.beginPath();c.moveTo(x-w*.9,yy-2);c.lineTo(x,yy-r*.64);c.lineTo(x+w*.5,yy-r*.2);c.quadraticCurveTo(x,yy-r*.3,x-w*.5,yy-r*.08);c.closePath();c.fill();}
}
function stump(c,x,y,r){
 ell(c,x+r*.4,y+r*.2,r*1.2,r*.34,'rgba(52,84,104,.2)');
 c.fillStyle='#7a6850';c.fillRect(x-r*.7,y-r*.7,r*1.4,r*.7);ell(c,x,y,r*.7,r*.24,'#6a5a45');
 ell(c,x,y-r*.7,r*.7,r*.26,'#f4f5ee');ell(c,x-r*.1,y-r*.74,r*.42,r*.14,'#ffffff');
}
function twigs(c,x,y,r,k){
 c.strokeStyle='#6f6452';c.lineWidth=1.6;c.lineCap='round';
 c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y-r*.3*(k-.5)*4);c.moveTo(x-r*.2,y-r*.05);c.lineTo(x+r*.1,y-r*.6);c.moveTo(x+r*.3,y-r*.1);c.lineTo(x+r*.7,y+r*.3);c.stroke();
 ell(c,x,y+1,r*.6,r*.14,'rgba(255,255,255,.7)');
}
const PROPS=[[bush,13,22],[bush,11,18],[rock,9,17],[mound,16,30],[mound,14,26],[tuft,8,13],[tuft,8,13],[sapling,20,30],[stump,8,12],[twigs,9,14]];
const LOW=[[mound,12,22],[tuft,7,11],[tuft,7,11],[rock,6,9],[twigs,8,11]];

// ---------------------------------------------------------------- 背景の仕上げ（一度だけ）
function polish(c,scene){
 const r=rng(hash(scene)),indoor=INDOOR.includes(scene);
 let data;try{data=c.getImageData(0,0,W,H).data;}catch{data=null;}
 const snowAt=(x,y)=>{if(!data||x<0||y<0||x>=W||y>=H)return false;const i=((y|0)*W+(x|0))*4,R=data[i],G=data[i+1],B=data[i+2],lum=(R+G+B)/3;return lum>188&&Math.max(R,G,B)-Math.min(R,G,B)<52&&B-R<38;};
 const darkAt=(x,y)=>{if(!data||x<0||y<0||x>=W||y>=H)return false;const i=((y|0)*W+(x|0))*4;return Math.abs(data[i]-118)<16&&Math.abs(data[i+1]-157)<16&&Math.abs(data[i+2]-170)<16;};
 const S=root.OkaeriStory,flags=new Proxy({},{get:()=>true});
 const walk=(tx,ty)=>{try{return !!S?.walkable({scene,flags,episode:null},tx,ty);}catch{return false;}};
 const objects=(S?.objects?.[scene]||[]).map(o=>[o.x*T+24,o.y*T+24]);
 const clearOfObjects=(x,y,d)=>objects.every(([ox,oy])=>Math.hypot(ox-x,oy-y)>d);
 if(!indoor){
  // 1. 雪の起伏。大きくやわらかい明暗を、雪の上にだけ置く。
  for(let i=0;i<150;i++){
   const x=r()*W,y=r()*H,rad=26+r()*58;if(!snowAt(x,y)||!snowAt(x+rad*.6,y)||!snowAt(x-rad*.6,y))continue;
   const g=c.createRadialGradient(x,y,0,x,y,rad),shade=r()<.5;
   g.addColorStop(0,shade?'rgba(92,128,152,.10)':'rgba(255,255,255,.34)');g.addColorStop(1,'rgba(255,255,255,0)');
   c.save();c.translate(x,y);c.scale(1,.42);c.translate(-x,-y);c.fillStyle=g;c.fillRect(x-rad,y-rad,rad*2,rad*2);c.restore();
  }
  // 1b. 風が雪の面に残す、ゆるい筋。
  for(let i=0;i<260;i++){
   const x=r()*W,y=r()*H,l=22+r()*52,bend=(r()-.5)*7;if(!snowAt(x,y)||!snowAt(x+l,y))continue;
   c.lineCap='round';c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1.4;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+l*.5,y+bend,x+l,y);c.stroke();
   c.strokeStyle='rgba(96,134,158,.16)';c.lineWidth=1.2;c.beginPath();c.moveTo(x+2,y+2.4);c.quadraticCurveTo(x+l*.5,y+bend+2.6,x+l-2,y+2.4);c.stroke();
  }
  // 1c. 森の暗い地面には、木々の間の雪だまりと下草。
  if(scene==='forest'){
   for(let i=0;i<420;i++){const x=r()*W,y=r()*H;if(!darkAt(x,y)||!darkAt(x+14,y)||!darkAt(x-14,y))continue;
    const k=r();if(k<.5){const rad=10+r()*18;ell(c,x,y,rad,rad*.34,'rgba(226,236,236,.42)');ell(c,x-rad*.15,y-rad*.08,rad*.7,rad*.2,'rgba(250,251,246,.6)');}
    else if(k<.8)tuft(c,x,y,7+r()*5,r());else rock(c,x,y,6+r()*5,r());}
  }
  // 2. 踏み固めた道の跡。歩ける場所に、足あとと荷車の轍。
  for(let ty=2;ty<=14;ty++)for(let tx=1;tx<=22;tx++){
   if(!walk(tx,ty))continue;const cx=tx*T+24,cy=ty*T+24;
   const horizontal=walk(tx-1,ty)||walk(tx+1,ty),vertical=walk(tx,ty-1)||walk(tx,ty+1);
   for(let k=0;k<3;k++){
    const along=horizontal&&(!vertical||r()<.5),u=(r()-.5)*T,v=(r()-.5)*20,x=cx+(along?u:v),y=cy+(along?v:u)+6;
    if(!snowAt(x,y))continue;
    c.save();c.translate(x,y);c.rotate(along?0:Math.PI/2);
    for(const s of [-1,1]){ell(c,s*-6,s*3.2,4.2,2,'rgba(104,140,160,.20)');ell(c,s*-6-1,s*3.2-.8,3,1.2,'rgba(255,255,255,.35)');}
    c.restore();
   }
   if(r()<.55&&snowAt(cx,cy)){c.strokeStyle='rgba(110,146,166,.13)';c.lineWidth=2;c.beginPath();
    if(horizontal){c.moveTo(cx-24,cy+13);c.lineTo(cx+24,cy+12+r()*2);c.moveTo(cx-24,cy-3);c.lineTo(cx+24,cy-4+r()*2);}
    else{c.moveTo(cx-9,cy-24);c.lineTo(cx-8+r()*2,cy+24);c.moveTo(cx+9,cy-24);c.lineTo(cx+10-r()*2,cy+24);}c.stroke();}
  }
  // 3. 道の外に、茂み・岩・雪だまり・若木。奥から手前の順に描く。
  const placed=[],town=scene==='town',tries=town?260:520,want=town?46:84;
  for(let i=0;i<tries&&placed.length<want;i++){
   const x=20+r()*(W-40),y=70+r()*(H-90),tx=Math.round((x-24)/T),ty=Math.round((y-24)/T);
   if(!snowAt(x,y)||!snowAt(x-12,y-6)||!snowAt(x+12,y+4)||nearWater(scene,x,y))continue;
   let onRoad=false;for(let dy=-1;dy<=1&&!onRoad;dy++)for(let dx=-1;dx<=1;dx++)if(walk(tx+dx,ty+dy)){onRoad=true;break;}
   if(town){if(Math.abs(x-600)<82||Math.abs(y-455)<86||Math.hypot((x-600)/175,(y-475)/122)<1)continue;}else if(onRoad)continue;
   if(!clearOfObjects(x,y,62)||placed.some(([px,py])=>Math.hypot(px-x,py-y)<34))continue;
   placed.push([x,y,r(),r()]);
  }
  placed.sort((a,b)=>a[1]-b[1]);
  for(const [x,y,pick,k] of placed){const set=town?LOW:PROPS,[fn,lo,hi]=set[Math.floor(pick*set.length)];fn(c,x,y,lo+(hi-lo)*k,k);}
  // 4. 雪のきらめき
  for(let i=0;i<2600;i++){const x=r()*W,y=r()*H;if(!snowAt(x,y))continue;c.fillStyle=i%7?'rgba(255,255,255,.55)':'rgba(120,156,178,.28)';c.fillRect(x,y,i%11?1:2,1);}
  for(let i=0;i<60;i++){const x=r()*W,y=r()*H;if(!snowAt(x,y))continue;c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1;c.beginPath();c.moveTo(x-3,y);c.lineTo(x+3,y);c.moveTo(x,y-3);c.lineTo(x,y+3);c.stroke();}
  // 5. 遠くほど淡く。上端にうすい靄、左上から差す光と、右下の冷たい陰。
  let g=c.createLinearGradient(0,0,0,H*.42);g.addColorStop(0,'rgba(222,234,240,.34)');g.addColorStop(1,'rgba(222,234,240,0)');c.fillStyle=g;c.fillRect(0,0,W,H*.42);
  g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'rgba(255,238,205,.16)');g.addColorStop(.5,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(58,92,128,.16)');c.fillStyle=g;c.fillRect(0,0,W,H);
 }else if(scene==='house')interior(c,r);
 // 6. 紙の質感。細かな粒子を全体に薄く重ねる。
 const grain=root.document.createElement('canvas');grain.width=grain.height=256;const gc=grain.getContext('2d'),gd=gc.createImageData(256,256);
 for(let i=0;i<gd.data.length;i+=4){const v=r()<.5?255:20;gd.data[i]=gd.data[i+1]=gd.data[i+2]=v;gd.data[i+3]=r()*(indoor?9:6);}
 gc.putImageData(gd,0,0);c.save();c.fillStyle=c.createPattern(grain,'repeat');c.fillRect(0,0,W,H);c.restore();
}
// 二人の家の中。窓からの光、床板の木目、暮らしの小物。
function interior(c,r){
 // 床板の木目と節
 for(let i=0;i<240;i++){const x=150+r()*850,y=335+r()*320,l=18+r()*46;c.strokeStyle='rgba(88,62,40,'+(.05+r()*.07)+')';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+l*.5,y+(r()-.5)*3,x+l,y);c.stroke();}
 for(let i=0;i<26;i++){const x=160+r()*830,y=340+r()*310;ell(c,x,y,3,1.5,'rgba(86,58,36,.20)');ell(c,x,y,1.4,.7,'rgba(60,40,26,.25)');}
 // 窓から差す光（二つの寝室）
 for(const wx of [375,782]){const g=c.createLinearGradient(wx,210,wx+60,330);g.addColorStop(0,'rgba(214,232,244,.30)');g.addColorStop(1,'rgba(214,232,244,0)');c.fillStyle=g;c.beginPath();c.moveTo(wx+6,212);c.lineTo(wx+72,212);c.lineTo(wx+118,286);c.lineTo(wx+30,286);c.closePath();c.fill();}
 // 家具の下の、やわらかい影
 for(const [x,y,w,h] of [[258,470,58,14],[577,470,96,18],[820,392,150,14],[450,236,36,10],[838,236,36,10]])ell(c,x,y,w,h,'rgba(58,40,28,.16)');
 // 戸口の外套掛け：青緑と赤茶、二人分
 const hx=650,hy=640;c.fillStyle='#6a543e';c.fillRect(hx-4,hy-52,52,5);
 for(const [dx,body,trim] of [[6,'#3f6f72','#e6dcc2'],[30,'#a5543f','#efe5cc']]){
  c.fillStyle='#4a3b2c';c.fillRect(hx+dx+5,hy-50,2,6);
  c.fillStyle=body;c.beginPath();c.moveTo(hx+dx,hy-44);c.lineTo(hx+dx+13,hy-44);c.lineTo(hx+dx+16,hy-6);c.lineTo(hx+dx-3,hy-6);c.closePath();c.fill();
  c.fillStyle=trim;c.fillRect(hx+dx,hy-46,13,5);c.fillStyle='rgba(0,0,0,.12)';c.fillRect(hx+dx+6,hy-40,1.5,32);
 }
 // ストーブの横の薪と、手桶
 for(let row=0;row<3;row++)for(let i=0;i<4-row;i++){const x=196+i*12+row*6,y=520-row*9;ell(c,x,y,6,4.5,'#6f5a42');ell(c,x-1,y-1,3.6,2.6,'#c9a878');}
 c.fillStyle='#7b6a52';c.fillRect(340,470,20,18);ell(c,350,470,10,4,'#a8997c');ell(c,350,470,7,2.6,'#5f7f8c');
 // 台所の上に吊るした鍋と、干した薬草
 c.strokeStyle='#5d5346';c.lineWidth=2;c.beginPath();c.moveTo(700,316);c.lineTo(960,316);c.stroke();
 for(const [x,kind] of [[730,0],[772,1],[812,0],[858,2],[900,2],[936,2]]){
  c.strokeStyle='#5d5346';c.lineWidth=1.5;c.beginPath();c.moveTo(x,316);c.lineTo(x,326);c.stroke();
  if(kind===0){ell(c,x,334,10,7,'#4c5556');ell(c,x,332,7,3.5,'#7f8b8a');}
  else if(kind===1){ell(c,x,333,7,6,'#8a6b4a');c.fillStyle='#6d5238';c.fillRect(x-1,338,2,10);}
  else{for(let i=-2;i<=2;i++){c.strokeStyle=i%2?'#8fa46a':'#73905c';c.lineWidth=2;c.beginPath();c.moveTo(x,326);c.lineTo(x+i*3,346+Math.abs(i));c.stroke();}}
 }
 // 窓辺の小さな鉢、戸口の敷物
 c.fillStyle='#9a6b4c';c.fillRect(905,548,16,12);ell(c,913,548,9,3.5,'#5c4a36');
 c.fillStyle='#8b6a55';c.fillRect(560,660,84,20);c.strokeStyle='#d8c19a';c.lineWidth=2;c.strokeRect(565,664,74,12);
}

// ---------------------------------------------------------------- 毎フレームの動き
function animate(c,scene,t,smoke=[]){
 if(INDOOR.includes(scene))return;
 // 煙突の煙。四つの塊が、のぼりながら広がって消える。
 for(const [x,y] of smoke)for(let i=0;i<4;i++){
  const p=((t*.16+i*.25+x*.001)%1),sway=Math.sin(t*.7+i*1.9+x)*8*p,r=7+p*20;
  ell(c,x+sway+p*26,y-p*92,r,r*.72,'rgba(238,242,238,'+(.34*(1-p)*Math.min(1,p*6))+')');
 }
 // 手前を横切る、大きくぼやけた雪
 for(let i=0;i<16;i++){
  const x=(i*211+t*(38+i%4*9))%(W+80)-40,y=(i*157+t*(54+i%5*11))%(H+80)-40,r=2.6+(i%3)*1.2;
  ell(c,x+Math.sin(t*.8+i)*10,y,r,r,'rgba(255,255,255,'+(.26+(i%3)*.08)+')');
 }
}

// ---------------------------------------------------------------- 木（world.js の tree を置き換える）
function tree(c,x,y,s=1){
 const k=((Math.sin(x*12.9898+y*78.233)*43758.5453)%1+1)%1,lean=(k-.5)*.08,tiers=k>.6?6:5;
 c.save();c.translate(x,y);c.scale(s,s);
 // 落ちる影
 c.fillStyle='rgba(60,96,118,.17)';c.beginPath();c.moveTo(-14,2);c.lineTo(20,-6);c.lineTo(96,26);c.lineTo(44,40);c.closePath();c.fill();
 ell(c,8,5,38,12,'rgba(52,88,108,.22)');
 // 幹
 c.fillStyle='#6f6150';c.fillRect(-5,-40,10,44);c.fillStyle='#4a534e';c.fillRect(2,-40,3,44);
 c.strokeStyle='rgba(40,34,28,.35)';c.lineWidth=1;for(let i=0;i<4;i++){c.beginPath();c.moveTo(-4,-34+i*9);c.lineTo(1,-31+i*9);c.stroke();}
 ell(c,0,4,12,4,'#f2f4ed');
 c.rotate(lean);
 for(let i=0;i<tiers;i++){
  const yy=-16-i*(22-tiers),w=(44-i*(36/tiers))*(1+(k-.5)*.12),peak=yy-46+i*2;
  // 枝のかたまり。裾をぎざぎざに。
  c.fillStyle='#2f4f54';c.beginPath();c.moveTo(-w,yy);
  for(let j=0;j<=6;j++){const px=-w+(2*w)*j/6,py=yy+(j%2?7:0)+Math.sin(j*1.7+i)*2;c.lineTo(px,py);}
  c.lineTo(0,peak);c.closePath();c.fill();
  // 陰の側
  c.fillStyle='#1f3f48';c.beginPath();c.moveTo(0,peak);c.lineTo(w,yy);c.lineTo(w*.66,yy+7);c.lineTo(w*.33,yy);c.lineTo(8,yy+7);c.lineTo(4,yy-12);c.closePath();c.fill();
  // 日の当たる枝先
  c.strokeStyle='rgba(98,138,122,.55)';c.lineWidth=1.4;for(let j=0;j<3;j++){c.beginPath();c.moveTo(-w*.2-j*w*.22,yy-6-j*2);c.lineTo(-w*.34-j*w*.22,yy+3);c.stroke();}
  // 雪。上面に厚く積もり、枝先から少し垂れる。
  c.fillStyle='#b4cdd8';c.beginPath();c.moveTo(-w+1,yy-5);c.lineTo(0,peak-2);c.lineTo(w-3,yy-6);c.quadraticCurveTo(w*.5,yy-14,16,yy-7);c.quadraticCurveTo(4,yy+3,-8,yy-6);c.quadraticCurveTo(-w*.5,yy+2,-w+1,yy-5);c.fill();
  c.fillStyle='#f3f5ee';c.beginPath();c.moveTo(-w+2,yy-9);c.lineTo(0,peak-3);c.lineTo(8,yy-13);c.quadraticCurveTo(-2,yy-6,-10,yy-11);c.quadraticCurveTo(-w*.5,yy-2,-w+2,yy-9);c.fill();
  c.fillStyle='#ffffff';c.beginPath();c.ellipse(-w*.52,yy-9,w*.2,3.2,-.25,0,Math.PI*2);c.fill();
  for(const dx of [-w*.82,-w*.3,w*.5]){c.fillStyle='#e8efea';c.beginPath();c.moveTo(dx-2,yy-3);c.lineTo(dx+2,yy-3);c.lineTo(dx,yy+5+((i+dx)|0)%3);c.closePath();c.fill();}
 }
 // 梢の雪
 ell(c,0,-16-(tiers-1)*(22-tiers)-44,5,4,'#f6f7f0');
 c.restore();
}
// 家の足元の暮らし（world.js の house が最後に呼ぶ）：窓あかりの照り返し、樽と木箱、花箱、雪かき。
function houseDetails(c,x,y,w,h){
 const base=y+h,eave=y+48,r=rng((x*7+y*13)|0);
 // 窓と戸口のあかりが、雪に落ちる
 for(const px of [x+w*.2,x+w*.5,x+w*.8]){const g=c.createRadialGradient(px,base+16,0,px,base+16,46);g.addColorStop(0,'rgba(255,214,140,.30)');g.addColorStop(1,'rgba(255,214,140,0)');c.save();c.translate(px,base+16);c.scale(1,.45);c.translate(-px,-(base+16));c.fillStyle=g;c.fillRect(px-46,base-30,92,92);c.restore();}
 // 戸口から道まで、雪をかいた細い通り道
 c.fillStyle='rgba(196,214,220,.55)';c.beginPath();c.moveTo(x+w*.5-22,base+8);c.lineTo(x+w*.5+26,base+8);c.lineTo(x+w*.5+38,base+44);c.lineTo(x+w*.5-18,base+44);c.closePath();c.fill();
 if(w<140)return;
 // 窓下の花箱（もみの小枝と赤い実）
 const wy=eave+21,windowH=Math.min(31,h*.24),windowW=Math.min(30,w*.19);
 for(const wx of [x+w*.12,x+w*.73]){const by=wy+windowH+9;c.fillStyle='#6b5a44';c.fillRect(wx-5,by,windowW+10,7);
  for(let i=0;i<6;i++){const px=wx-2+i*(windowW+4)/5;c.fillStyle=i%2?'#3d6157':'#4c7262';c.beginPath();c.moveTo(px-4,by+1);c.lineTo(px,by-8-(i%3)*2);c.lineTo(px+4,by+1);c.closePath();c.fill();}
  for(let i=0;i<4;i++)ell(c,wx+2+i*(windowW-2)/3,by-1,1.7,1.7,'#c85a4c');ell(c,wx+windowW/2,by-7,windowW*.5,2.6,'rgba(246,247,240,.9)');}
 // 樽と木箱、立てかけた雪かき
 const bx=x-26,by=base-2;ell(c,bx+4,by+5,17,5,'rgba(52,84,104,.22)');
 c.fillStyle='#7d6347';c.fillRect(bx-10,by-26,22,28);c.fillStyle='#5f4a35';c.fillRect(bx-10,by-20,22,3);c.fillRect(bx-10,by-8,22,3);ell(c,bx+1,by-26,11,4,'#f2f4ed');
 c.fillStyle='#93795a';c.fillRect(bx+14,by-15,19,17);c.strokeStyle='#5f4a35';c.lineWidth=1.5;c.strokeRect(bx+14,by-15,19,17);c.beginPath();c.moveTo(bx+14,by-15);c.lineTo(bx+33,by+2);c.stroke();ell(c,bx+23,by-15,10,3,'#f2f4ed');
 const sx=x+w+2+r()*4;c.strokeStyle='#6d5a43';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(sx,base-44);c.lineTo(sx+9,base+2);c.stroke();c.fillStyle='#9fb0b4';c.beginPath();c.moveTo(sx+3,base-4);c.lineTo(sx+18,base-2);c.lineTo(sx+19,base+9);c.lineTo(sx+5,base+8);c.closePath();c.fill();
}
// 町の据え物。井戸（9,5）、粉の荷車（14-15,5）、薪の山とそり（16,13）。
function townProps(c,h){
 const {rect,poly,line,ellipse,block}=h,P=n=>n*T+24;
 // 井戸
 let x=P(9),y=P(5);ell(c,x+8,y+12,40,12,'rgba(52,84,104,.22)');
 for(let i=0;i<7;i++){const a=i/7*Math.PI,px=x-26+i*8.6;block(c,px,y-10-Math.sin(a)*3,9,20,3,i%2?'#8d9aa0':'#a3afb0','#64798a','#dfe6e2');}
 ell(c,x,y-12,27,9,'#3d5565');ell(c,x,y-12,22,6.5,'#27404f');ell(c,x-5,y-13,8,2,'rgba(190,220,230,.5)');
 for(const dx of [-27,24]){block(c,x+dx,y-62,5,54,4,'#6f5c45','#4a5550','#a5946f');}
 poly(c,[[x-38,y-58],[x,y-84],[x+38,y-58],[x+34,y-52],[x-34,y-52]],'#5d7480');poly(c,[[x-40,y-62],[x,y-90],[x+40,y-62],[x+36,y-56],[x,y-82],[x-36,y-56]],'#f1f3ea');
 line(c,[[x-24,y-50],[x+26,y-50]],'#5b4c3a',4);line(c,[[x+2,y-50],[x+2,y-26]],'#b9a88a',1.5);
 block(c,x-5,y-28,14,12,4,'#8a6f50','#5c4a36','#c8ad84');ell(c,x+3,y-28,8,3,'#6f8f9c');
 // 小麦粉の荷車
 x=P(14)+18;y=P(5)+8;ell(c,x+12,y+12,62,13,'rgba(52,84,104,.22)');
 line(c,[[x-58,y-6],[x-88,y+6]],'#6f5c45',4);line(c,[[x-58,y-16],[x-88,y-2]],'#6f5c45',4);
 block(c,x-56,y-22,104,20,12,'#8f7453','#5d4d3a','#c5a97f');for(let i=0;i<6;i++)line(c,[[x-50+i*18,y-21],[x-50+i*18,y-3]],'#5d4d3a66',1.5);
 for(const [sx,sy,col] of [[-40,-40,'#e9dfc8'],[-14,-42,'#f1e8d2'],[14,-40,'#e4d9bf'],[-26,-56,'#eee4cd'],[2,-58,'#e8dec6']]){ell(c,x+sx,y+sy,17,11,col);ell(c,x+sx-3,y+sy-3,10,5,'#fbf6e8');line(c,[[x+sx-8,y+sy-8],[x+sx+7,y+sy-9]],'#b8a583',1.5);}
 ell(c,x-12,y-62,30,7,'#f6f7f0');
 for(const wx of [-34,30]){c.strokeStyle='#4f4335';c.lineWidth=5;c.beginPath();c.arc(x+wx,y+2,15,0,Math.PI*2);c.stroke();c.strokeStyle='#7a6850';c.lineWidth=1.5;for(let i=0;i<4;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(x+wx-Math.cos(a)*13,y+2-Math.sin(a)*13);c.lineTo(x+wx+Math.cos(a)*13,y+2+Math.sin(a)*13);c.stroke();}ell(c,x+wx,y+2,3.5,3.5,'#3f352a');ell(c,x+wx,y-12,10,3,'#f2f4ed');}
 // 薪の山と、立てかけたそり
 x=P(16);y=P(13);ell(c,x+8,y+12,42,11,'rgba(52,84,104,.22)');
 for(let row=0;row<4;row++)for(let i=0;i<6-row;i++){const px=x-27+i*11+row*5.5,py=y+6-row*9;ell(c,px,py,6,5,'#6a563f');ell(c,px-1,py-1,3.8,3,'#cdae7f');c.strokeStyle='#8c7355';c.lineWidth=1;c.beginPath();c.arc(px-1,py-1,1.6,0,Math.PI*2);c.stroke();}
 ell(c,x+3,y-27,22,5,'#f4f5ee');
 line(c,[[x+38,y+10],[x+52,y-34]],'#7b6247',4);line(c,[[x+48,y+12],[x+62,y-32]],'#7b6247',4);for(let i=0;i<4;i++)line(c,[[x+40+i*3.4,y+2-i*11],[x+50+i*3.4,y+4-i*11]],'#a88c66',3);
}
root.OkaeriScenery={townProps,polish,animate,tree,houseDetails,bush,rock,mound};
})(globalThis);
