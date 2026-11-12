(function(root){
'use strict';
// 二人の家の中。描画エンジン（draw-engine.js）で組み立てたベクター絵。
// 部屋そのもの（床・壁・窓・敷物・台所）は一枚の背景、家具は人物と前後が入れ替わるので一つずつのスプライト。
// 火・湯気・灯りの揺れだけは毎フレーム、キャンバスで重ねる。
const D=root.OkaeriDraw;if(!D){root.OkaeriHomeArt={ready:()=>false,failed:()=>true,background:()=>false,object:()=>false};return;}
const {rect:R,ell:E,path:P,stroke:S,line:L,g:G,text:T,wood,cloth,plaster,stone,shadow,contact,light,box,cyl,ball,drawer,rng,mix,dark,lite,n}=D;
const TEAL='#3f7475',ROSE='#b5645a',CREAM='#efe3c8',MUSTARD='#d9a94e',TIMBER='#5b412c',IRON='#33393b';

// ---------------------------------------------------------------- 部品
function curtain(x,y,w,h,col,flip){ // 片側に寄せて結んだカーテン
 const d=`M0,0H${w}C${w},${h*.34} ${w*.5},${h*.5} ${w*.42},${h*.62}C${w*.62},${h*.76} ${w*.86},${h*.9} ${w*.9},${h}H0Z`;
 return G(cloth(P(d,col))+P(d,'url(#pleat)')+P(d,'url(#fold)',{opacity:.6})
  +R(-1,h*.585,w*.5,5,CREAM,2)+R(-1,h*.585,w*.5,1.5,'#fff',1,{opacity:.5})+R(0,h-4,w*.9,4,dark(col,.3),0,{opacity:.6}),
  {transform:flip?`translate(${x+w},${y}) scale(-1,1)`:`translate(${x},${y})`});
}
function windowAt(wx,col,id){ // 奥の壁の窓。外は雪の朝。
 const y=58,w=92,h=66,r=rng(wx);let flakes='';for(let i=0;i<22;i++)flakes+=E(wx+r()*w,y+r()*h,.8+r()*.9,.8+r()*.9,'#fff',{opacity:n(.5+r()*.5)});
 let pines='';for(const [px,s] of [[10,1],[27,.7],[58,.85],[80,1.1]]){const bx=wx+px,by=y+50;pines+=P(`M${bx},${by-34*s}L${bx+9*s},${by-12*s}H${bx+5*s}L${bx+12*s},${by}H${bx-12*s}L${bx-5*s},${by-12*s}H${bx-9*s}Z`,'#3d5f5c')+P(`M${bx},${by-34*s}L${bx+6*s},${by-18*s}Q${bx},${by-22*s} ${bx-6*s},${by-18*s}Z`,'#eef3ee');}
 return `<clipPath id="${id}"><rect x="${wx}" y="${y}" width="${w}" height="${h}" rx="2"/></clipPath>`
  +`<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86abc9"/><stop offset=".7" stop-color="#d8e3e6"/><stop offset="1" stop-color="#f6e6cf"/></linearGradient>`
  +wood(R(wx-10,y-9,w+20,h+20,'#4d3725',3),'v')+R(wx-4,y-4,w+8,h+8,'#261a11',2)
  +G(R(wx,y,w,h,`url(#${id}s)`)+P(`M${wx-4},${y+44}Q${wx+24},${y+30} ${wx+50},${y+42}T${wx+w+6},${y+36}V${y+h}H${wx-4}Z`,'#c9d8de')+G(pines,{filter:'url(#b1)',opacity:.9})
    +P(`M${wx-4},${y+54}Q${wx+30},${y+44} ${wx+60},${y+52}T${wx+w+6},${y+50}V${y+h+2}H${wx-4}Z`,'#f7f9f6')+flakes
    +E(wx+2,y+h,20,11,'#fff',{opacity:.75,filter:'url(#b4)'})+E(wx+w,y+h,22,10,'#fff',{opacity:.75,filter:'url(#b4)'})+E(wx,y,16,9,'#fff',{opacity:.45,filter:'url(#b4)'})
    +R(wx,y,w,h,'url(#glass)',0,{opacity:.45})+R(wx,y,w,7,'url(#drop)',0,{opacity:.7}),{'clip-path':`url(#${id})`})
  +wood(R(wx+w/2-2.5,y,5,h,'#5e4530')+R(wx,y+h/2-2.5,w,5,'#5e4530'),'v')+R(wx+w/2-2.5,y,1.2,h,'#fff3d6',0,{opacity:.3})+R(wx,y+h/2-2.5,w,1.2,'#fff3d6',0,{opacity:.3})
  +shadow(wx-12,y+h+10,w+24,8,.4,'b2')+wood(R(wx-14,y+h+4,w+28,9,'#86633f',2))+R(wx-14,y+h+4,w+28,2,'#fff3d6',1,{opacity:.4})
  +R(wx-20,y-15,w+40,4.5,'#2c1f15',2)+ball(wx-21,y-13,4,4,'#c9a25c')+ball(wx+w+21,y-13,4,4,'#c9a25c')
  +curtain(wx-18,y-13,32,h+22,col,false)+curtain(wx+w-14,y-13,32,h+22,col,true);
}
function rug(x,y,w,h,c1,c2,c3,motif){ // 織りの敷物：縁、柄、房
 let m='';const k=Math.floor((w-36)/30),step=(w-36)/k,cy=y+h/2,s=Math.min(h*.28,20);
 for(let i=0;i<k;i++){const cx=x+18+step*(i+.5);
  if(motif==='star')m+=P(`M${cx},${cy-s}L${cx+s*.3},${cy-s*.3}L${cx+s},${cy}L${cx+s*.3},${cy+s*.3}L${cx},${cy+s}L${cx-s*.3},${cy+s*.3}L${cx-s},${cy}L${cx-s*.3},${cy-s*.3}Z`,i%2?c2:c3)+E(cx,cy,2.4,2.4,i%2?c3:c2);
  else m+=P(`M${cx},${cy-s}L${cx+s*.62},${cy}L${cx},${cy+s}L${cx-s*.62},${cy}Z`,i%2?c2:c3)+P(`M${cx},${cy-s*.5}L${cx+s*.31},${cy}L${cx},${cy+s*.5}L${cx-s*.31},${cy}Z`,i%2?c3:c1);}
 const dash={'stroke-dasharray':'1.6 2.6','stroke-linecap':'butt'},hem={'stroke-dasharray':'4 4','stroke-linecap':'butt'};
 return shadow(x+3,y+h-6,w,12,.3)
  +L(x+3,y-3,x+w-3,y-3,lite(c2,.3),6,dash)+L(x+3,y+h+3,x+w-3,y+h+3,lite(c2,.3),6,dash)
  +cloth(R(x,y,w,h,dark(c1,.25),3)+R(x+4,y+4,w-8,h-8,c1,2)+R(x+9,y+9,w-18,h-18,c2,1)+R(x+13,y+13,w-26,h-26,mix(c1,c2,.25),1)+m
   +L(x+15,y+15,x+w-15,y+15,c3,2.5,hem)+L(x+15,y+h-15,x+w-15,y+h-15,c3,2.5,hem))
  +R(x,y,w,h,'url(#tsh)',3,{opacity:.7});
}
function braided(cx,cy,rx,ry){let s='';const cols=['#8a4f47','#d8c39a','#5f8f8c','#c98f5a','#e6d6b0','#8a4f47','#5f8f8c','#d8c39a'];
 for(let i=0;i<8;i++){const k=1-i/8.5;s+=E(cx,cy,rx*k,ry*k,cols[i])+E(cx,cy,rx*k,ry*k,'none',{stroke:'#1c0e05','stroke-opacity':.28,'stroke-width':1.2,'stroke-dasharray':'3 2.2'});}
 return contact(cx+3,cy+4,rx,ry,.3)+cloth(s)+E(cx,cy,rx,ry,'url(#ball)',{opacity:.35});}
function pot(x,y,w,h,col){return cyl(x-w/2,y-h,w,h,col,3)+E(x,y-h,w/2,w*.18,lite(col,.3))+E(x,y-h,w/2-2,w*.12,dark(col,.5));}
function jar(x,y,col){return cyl(x-6,y-15,12,15,col,3)+E(x,y-15,6,2.3,lite(col,.35))+R(x-4,y-10,8,4.5,'#fff8e6',1,{opacity:.75});}
function bowl(x,y,soup){return contact(x+1.5,y+3,13,5,.4,'b2')+E(x,y,13,7.5,'#f6eedc')+E(x,y,13,7.5,'url(#ball)',{opacity:.5})+(soup?E(x,y-1,10,5.2,'#c8853f')+E(x-3,y-2.4,4,1.6,'#ffe9b8',{opacity:.7})+E(x+3,y,1.7,1.2,'#f4ecd6')+E(x-1,y+1.6,1.6,1.1,'#7f9a5a')+E(x+4.5,y-2.2,1.5,1,'#e0a04e'):E(x,y-1,10,5.2,'#e2d6bd'));}
function loaf(x,y){return contact(x+2,y+4,16,5,.4,'b2')+P(`M${x-15},${y+2}C${x-16},${y-9} ${x+16},${y-9} ${x+15},${y+2}C${x+14},${y+7} ${x-14},${y+7} ${x-15},${y+2}Z`,'#b5743a')+P(`M${x-12},${y-1}C${x-10},${y-7} ${x+10},${y-7} ${x+12},${y-1}C${x+6},${y-4} ${x-6},${y-4} ${x-12},${y-1}Z`,'#e3b56c')+S(`M${x-6},${y-5}l3,6M${x},${y-6}l3,7M${x+6},${y-5}l3,6`,'#f8e2ad',1.5);}
function mug(x,y,col){return contact(x+1,y+2,6,2.5,.4,'b1')+S(`M${x+5},${y-8}q5,3 0,6`,col,2)+cyl(x-5,y-10,10,11,col,2)+E(x,y-10,5,2,lite(col,.4))+E(x,y-10,3.6,1.3,'#5a3a22');}
function logs(x,y,cols,rows){let s='';const r=rng(x+y);for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const cx=x+i*12+(j%2)*6,cy=y-j*10.4,rr=5.4+r()*.9;
  s+=E(cx+1,cy+1.5,rr,rr,'#1c0e05',{opacity:.4})+E(cx,cy,rr,rr,'#6a4d32')+E(cx,cy,rr-1.5,rr-1.5,mix('#d9b784','#c29a66',r()))+E(cx,cy,rr-3.2,rr-3.2,'none',{stroke:'#a37a4c','stroke-width':.8})+E(cx,cy,.9,.9,'#8a6238');}return s;}
function stool(x,y,cushion){return contact(x+2,y+15,13,4,.4)+R(x-9,y+2,3.5,13,dark('#7a5d43',.2),1)+R(x+5.5,y+2,3.5,13,dark('#7a5d43',.2),1)+wood(E(x,y+3,12,5.5,'#7a5d43'))+E(x,y,12,5.5,cushion)+E(x,y,12,5.5,'url(#ball)',{opacity:.55});}
function coat(x,y,body,trim,scarf){const d=`M${x+2},${y}Q${x+11},${y-4} ${x+20},${y}L${x+26},${y+46}Q${x+11},${y+51} ${x-4},${y+46}Z`;
 return ball(x+11,y-2,2.6,2.6,'#2c1f15')
  +cloth(P(d,body)+P(`M${x-3.5},${y+41}Q${x+11},${y+46} ${x+25.5},${y+41}L${x+26},${y+46}Q${x+11},${y+51} ${x-4},${y+46}Z`,trim)+P(`M${x+3},${y}Q${x+11},${y+7} ${x+19},${y}Q${x+11},${y-4} ${x+3},${y}Z`,trim))
  +P(d,'url(#fold)')+L(x+11,y+6,x+11,y+42,'#1c0e05',1,{opacity:.3})
  +[14,24,34].map(k=>ball(x+11,y+k,1.5,1.5,'#e3c489')).join('')+(scarf?cloth(P(`M${x+3},${y+2}q4,3 7,1l-1,22q-4,2 -7,0Z`,scarf)):'');}

// ---------------------------------------------------------------- 部屋（背景）
function floorPlanks(r){let s='';
 // ---- 床：一枚ずつ色の違う板。行ごとに木目を切り替えて、継ぎ目で流れが切れるように。
 const tones=['#b98f61','#b0875a','#c1996b','#a98054','#b68c5f','#c59e71','#ad8559','#bb9364'];const rows=['',''];let seams='';
 for(let row=0;row<22;row++){const y=144+row*24;let x=144-Math.floor(r()*90);
  while(x<1008){const w=96+Math.floor(r()*130),x0=Math.max(144,x),x1=Math.min(1008,x+w);
   if(x1>x0){rows[row%2]+=R(x0,y,x1-x0,24,tones[Math.floor(r()*tones.length)]);
    if(x1<1008){seams+=R(x1-.8,y,1.6,24,'#2e1c0e',0,{opacity:.55});for(const [dx,dy] of [[-5,6],[-5,18],[5,6],[5,18]])seams+=E(x1+dx,y+dy,1,1,'#2e1c0e',{opacity:.55});}
    if(r()<.22&&x1-x0>40){const kx=x0+14+r()*(x1-x0-28),ky=y+7+r()*10;seams+=E(kx,ky,4.2,2.4,'#5e3d22',{opacity:.55})+E(kx,ky,6.5,3.6,'none',{stroke:'#5e3d22','stroke-opacity':.3,'stroke-width':.8})+E(kx,ky,1.5,.9,'#3a2414',{opacity:.7});}}
   x+=w;}
  seams+=R(144,y+22.8,864,1.4,'#2e1c0e',0,{opacity:.5})+R(144,y,864,1,'#fff3d6',0,{opacity:.13});}
 s+=wood(rows[0],'h')+wood(rows[1],'h2')+seams;
 return s;
}
function backWall(r){let s='';
 // ---- 奥の壁：梁、漆喰、腰板、巾木
 s+=plaster(R(144,44,864,64,'#eadcbd'))+`<linearGradient id="wallsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c0e05" stop-opacity=".34"/><stop offset=".35" stop-color="#1c0e05" stop-opacity="0"/><stop offset="1" stop-color="#1c0e05" stop-opacity=".12"/></linearGradient>`+R(144,44,864,64,'url(#wallsh)');
 let boards='';for(let i=0;i<36;i++)boards+=R(144+i*24,104,24,36,['#9a744c','#8f6a44','#a47d54','#946f48'][Math.floor(r()*4)]);
 s+=wood(boards,'v');for(let i=1;i<36;i++)s+=R(144+i*24-.7,106,1.4,34,'#2e1c0e',0,{opacity:.45})+R(144+i*24+.8,106,.9,34,'#fff3d6',0,{opacity:.12});
 s+=wood(R(144,100,864,7,'#b08a5c',1)+R(144,136,864,8,'#5e4530')+R(144,40,864,11,'#4d3725'))+R(144,100,864,1.6,'#fff3d6',0,{opacity:.4})+R(144,107,864,4,'url(#drop)',0,{opacity:.6})+R(144,51,864,7,'url(#drop)',0,{opacity:.55});
 for(const px of [144,996])s+=wood(R(px,40,12,104,TIMBER),'v')+R(px,40,12,104,'url(#cyl)',0,{opacity:.5});
 return s;
}
function room(){
 const r=rng(8128);let s='';
 // 家の外（屋根を外して見下ろす暗がり）
 s+=`<radialGradient id="out" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#2b434b"/><stop offset="1" stop-color="#101d24"/></radialGradient>`+R(0,0,1152,768,'url(#out)');
 s+=shadow(110,30,950,690,.6,'b16');
 s+=wood(R(120,20,912,676,'#3f2e21',4));
 s+=floorPlanks(r);
 // よく歩く道筋のつや（戸口→食卓→寝室の戸口）
 s+=S('M600,660C600,560 470,540 400,470C340,410 312,380 312,330','#fff0d0',34,{opacity:.10,filter:'url(#b16)'})+S('M600,640C640,540 800,470 840,340','#fff0d0',34,{opacity:.09,filter:'url(#b16)'});
 // ---- 敷物
 s+=rug(304,222,112,58,'#2f5f66','#d9cfb2','#c98f5a','diamond')+rug(656,226,112,56,'#8a4a52','#f0e2c8','#6f8f8a','star');
 s+=rug(432,366,246,150,'#7a4a44','#e2cfa6','#5f8f8c','diamond')+braided(250,532,70,27)+rug(840,540,128,54,'#6f7f5a','#ead9b4','#b5645a','star');
 s+=backWall(r);
 // 壁の飾り：トウマ側（見回りの地図、灯りの部品の棚）
 s+=shadow(176,60,58,36,.35,'b2')+wood(R(172,54,62,40,'#6b4d33',2))+R(176,58,54,32,'#e9dcba')+S('M180,82q8,-14 16,-8t12,-6t14,-8','#6f8f8a',1.4)+S('M182,66q14,6 22,2t22,10','#b98a6a',1,{'stroke-dasharray':'3 2'})+E(214,72,2.4,2.4,'#c85a4c')+S('M222,62l3,5l-6,0z','#3f5f66',1)+R(176,58,54,32,'url(#glass)',0,{opacity:.25});
 s+=shadow(516,74,54,8,.35,'b2')+wood(R(512,70,56,5,'#7a5a3c',1))+pot(524,70,10,12,'#8b9498')+P('M536,70h14l-2,-14h-10z','#c9a25c')+R(540,52,6,5,'#5a4130')+R(538,60,10,7,'#ffe9a8',1,{opacity:.85})+ball(560,65,4.5,5,'#5f7f8c');
 // 壁の飾り：ニナ側（刺繍の枠、旗飾り）
 s+=shadow(786,62,50,38,.35,'b2')+E(808,76,25,21,'#8a5f4a')+E(808,76,21,17,'#f1e6cd')+[0,1,2,3,4,5].map(i=>ball(808+Math.cos(i*1.05)*10,76+Math.sin(i*1.05)*8,3,3,['#c9695c','#e0b25a','#7fa08a','#c9695c','#8aa3c0','#e0b25a'][i])).join('')+ball(808,76,3.4,3.4,'#f6e9c0')+S('M796,88q12,6 24,0','#7fa08a',1.4);
 s+=S('M852,60Q912,84 972,58','#7a5a3c',1.2);for(let i=0;i<7;i++){const t=(i+.5)/7,bx=852+120*t,by=60+(1-Math.pow(2*t-1,2))*13-1;s+=cloth(P(`M${n(bx-7)},${n(by)}h14l-7,14z`,[ROSE,CREAM,'#6f8f8a',MUSTARD][i%4]));}
 // 窓
 s+=windowAt(412,'#4f8a88','w1')+windowAt(636,'#c0766c','w2');
 s+=pot(430,128,11,9,'#a86b4c')+S('M430,119q-5,-8 -8,-5M430,119q0,-10 2,-11M430,119q6,-7 8,-4','#6f9a5a',2)+P('M700,128h10v-9h-10z','#f3ead6')+E(705,117,2,3.4,'#ffd98a')+ball(688,126,4,3,'#b8706a');
 s+=R(144,144,864,26,'url(#drop)',0,{opacity:.75});
 // 窓から床へ落ちる朝の光
 for(const wx of [412,636])s+=G(P(`M${wx},146h92l44,104h-108z`,'#d6ebf7')+S(`M${wx+46},146l30,104M${wx+14},198h106`,'#5a4130',5,{opacity:.5}),{filter:'url(#b4)',opacity:.34,style:'mix-blend-mode:screen'});
 // ---- 二つの寝室を分ける壁（天面）
 s+=R(624,144,22,150,'url(#dropR)',0,{opacity:.8})+plaster(R(576,140,48,150,'#e6d6b4'))+wood(R(576,140,5,150,TIMBER)+R(619,140,5,150,TIMBER),'v')+R(581,140,2,150,'#fff',0,{opacity:.3});
 // ---- 仕切り壁：天面＋手前の面（漆喰と腰板）。戸口は二つ。
 for(const [x,w] of [[144,144],[336,480],[864,144]]){
  s+=plaster(R(x,280,w,17,'#e6d6b4'))+R(x,280,w,2,'#fff',0,{opacity:.35})+wood(R(x,294,w,5,'#4d3725'))
   +plaster(R(x,299,w,22,'#e2d3b1'))+R(x,299,w,8,'url(#drop)',0,{opacity:.5});
  let b='';for(let i=0;i<w/24;i++)b+=R(x+i*24,321,24,15,['#9a744c','#8f6a44','#a47d54'][i%3]);s+=wood(b,'v')+R(x,320,w,2,'#b08a5c')+R(x,333,w,3,'#3f2e21');}
 for(const dx of [288,816]){ // 戸口の枠と、開け放した扉
  s+=wood(R(dx-7,276,7,60,TIMBER,1)+R(dx+48,276,7,60,TIMBER,1),'v')+R(dx-7,276,2,60,'#fff3d6',0,{opacity:.25})+R(dx+48,276,2,60,'#fff3d6',0,{opacity:.25})
   +wood(R(dx,333,48,4,'#7a5a3c'))+P(`M${dx+55},300l20,26v40l-20,-30z`,'#1c0e05',{opacity:.3,filter:'url(#b4)'})
   +wood(P(`M${dx+55},284l18,24v52l-18,-26z`,'#96714a'),'v')+P(`M${dx+58},294l12,16v36l-12,-17z`,'#1c0e05',{opacity:.16})+ball(dx+70,334,2.4,2.4,'#e3c489');}
 for(const [x,name,col] of [[226,'トウマ',TEAL],[876,'ニナ',ROSE]])s+=shadow(x+1,304,54,16,.4,'b1')+wood(R(x,301,54,17,'#c9a56e',3))+R(x,301,54,17,'none',3,{stroke:col,'stroke-width':1.6})+T(x+27,314,name,11,'#3a2414');
 // 灯り番の道具（左の壁）：予備のランタン、油差し、芯の束
 s+=wood(R(154,316,62,4,'#7a5a3c',1))+L(166,298,166,304,'#2c1f15',1.6)+cyl(160,304,12,12,'#e9c26a',2)+R(160,304,12,12,'none',2,{stroke:'#3a2c20','stroke-width':1.6})+P('M158,304l8,-6l8,6z','#3a2c20')+pot(188,316,13,11,'#8b9498')+S('M194,309l9,-5','#8b9498',2.5)+S('M204,316v-9m3,9v-10m3,10v-8','#efe6d0',1.6);
 // 外套掛け（右の壁）
 s+=wood(R(928,303,76,5,'#5e4530',2))+coat(934,307,TEAL,'#e6dcc2','#b5543f')+coat(970,307,'#a5543f','#efe5cc',null);
 s+=R(144,337,864,22,'url(#drop)',0,{opacity:.7});
 // ---- 台所：仕切り壁を背にした作業台
 const kx=648,ky=326;
 s+=box(kx,ky,160,22,22,'#c9a878','#8a6846')+drawer(kx+6,ky+26,46,14)+drawer(kx+57,ky+26,46,14)+drawer(kx+108,ky+26,46,14);
 s+=wood(R(kx+6,ky+2,44,16,'#dcc08f',2))+loaf(kx+26,ky+9)+L(kx+44,ky+4,kx+56,ky+15,'#c9d0d2',2)+L(kx+56,ky+15,kx+60,ky+19,'#5a4130',3);
 s+=contact(kx+76,ky+13,13,5,.4,'b2')+S(`M${kx+84},${ky-12}q8,6 2,14`,'#6f8fa0',2.5)+ball(kx+74,ky+2,12,13,'#6f8fa0')+cyl(kx+69,ky-16,10,8,'#6f8fa0',2)+E(kx+74,ky-16,5,2,'#3f5d6c');
 s+=contact(kx+102,ky+15,11,3,.35,'b1')+E(kx+100,ky+12,10,4.6,'#f6eedc')+E(kx+100,ky+9,10,4.6,'#efe6d0')+E(kx+100,ky+6,10,4.6,'#f6eedc')+E(kx+100,ky+5,7.4,3,'#e2d6bd');
 s+=jar(kx+122,ky+18,'#b0705a')+jar(kx+136,ky+18,'#7f9a72')+jar(kx+150,ky+18,MUSTARD);
 s+=L(kx+90,ky-22,kx+158,ky-22,'#2c1f15',2.5)+[[98,'#8b6a48'],[112,'#b8c0c2'],[126,'#8b6a48']].map(([dx,c])=>L(kx+dx,ky-22,kx+dx,ky-8,c,2.4)+ball(kx+dx,ky-5,4.4,3.6,c)).join('')
  +[0,1,2].map(i=>S(`M${kx+142+i*5},${ky-22}q-3,9 ${-2+i*2},15`,i%2?'#8fa46a':'#6f8f5a',2.2)).join('');
 // ---- ストーブまわり：薪棚、焚きつけのかご
 s+=shadow(150,470,46,10,.45)+logs(156,468,3,6)+wood(R(148,402,4,70,'#4d3725',1)+R(190,402,4,70,'#4d3725',1)+R(148,470,46,5,'#4d3725',1),'v');
 s+=contact(172,506,20,6,.4)+S('M164,487l-4,-12M172,487l1,-14M180,487l5,-11','#8a6b48',3)+P('M152,486q20,8 40,0l-4,20q-16,6 -32,0z','#b08a5a')+S('M156,490q16,6 32,0M155,496q17,6 34,0M157,502q15,5 30,0','#7b5a38',1)+S('M162,487l-2,18M172,489v18M182,487l2,18','#7b5a38',1);
 // ---- 戸口：敷居、玄関の敷物、長靴
 s+=shadow(556,662,92,8,.3,'b2')+cloth(R(552,630,96,34,'#5c5040',3)+R(556,634,88,26,'#8a7a62',2))+[[640,'#5c5040'],[647,'#c9b48a'],[654,'#5c5040']].map(([y,c])=>L(560,y,640,y,c,2,{'stroke-dasharray':'6 4'})).join('');
 for(const [bx,c] of [[664,'#5c4433'],[678,'#5c4433'],[698,'#7a4a38'],[711,'#7a4a38']])s+=contact(bx+6,668,8,3,.4,'b2')+cyl(bx,646,11,18,c,3)+E(bx+6.5,665,7.5,4,dark(c,.2))+R(bx,646,11,4,'#efe6d0',2);
 // ---- 光：ストーブと卓上の灯りの暖かさ、四隅の陰
 s+=light(240,470,300,'#ffab5c',.42,'soft-light',240)+light(240,470,190,'#ffb060',.20,'screen',150)+light(600,410,230,'#ffd9a0',.34,'soft-light',190)+light(600,404,120,'#ffe0a8',.14,'screen',90);
 s+=`<radialGradient id="vig" cx=".5" cy=".52" r=".72"><stop offset=".45" stop-color="#1c0e05" stop-opacity="0"/><stop offset="1" stop-color="#1c0e05" stop-opacity=".5"/></radialGradient>`+R(144,40,864,632,'url(#vig)',0,{style:'mix-blend-mode:multiply'});
 // 左右と手前の壁（天面）と、その内側の陰
 s+=R(144,144,20,528,'url(#dropR)',0,{opacity:.6});
 s+=wood(R(120,20,24,676,'#3f2e21')+R(1008,20,24,676,'#35261b')+R(120,20,912,22,'#3f2e21')+R(120,672,452,24,'#3f2e21')+R(628,672,404,24,'#3f2e21'),'v')
  +wood(R(572,672,56,24,'#8a6846'))+R(572,672,56,3,'#fff3d6',0,{opacity:.3})+R(576,688,48,8,'#d9ecf5',0,{opacity:.5,filter:'url(#b2)'})
  +R(141,42,3,630,'#fff3d6',0,{opacity:.16})+R(144,672,428,2,'#fff3d6',0,{opacity:.18})+R(628,672,380,2,'#fff3d6',0,{opacity:.18})+R(120,20,912,676,'none',4,{stroke:'#0c151a','stroke-width':2,'stroke-opacity':.7});
 return s;
}


// ---------------------------------------------------------------- 渡し場の灯守小屋（背景）
function workshop(){
 const r=rng(4242);let s='';
 s+=`<radialGradient id="out" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#2b434b"/><stop offset="1" stop-color="#101d24"/></radialGradient>`+R(0,0,1152,768,'url(#out)')+shadow(110,30,950,690,.6,'b16')+wood(R(120,20,912,676,'#3f2e21',4));
 s+=floorPlanks(r)+S('M360,660C360,560 420,470 500,440C640,400 760,380 830,300','#fff0d0',34,{opacity:.10,filter:'url(#b16)'});
 s+=rug(410,356,190,104,'#2f5f66','#d9cfb2','#c98f5a','diamond');
 s+=backWall(r)+windowAt(452,'#5f7f9c','w1')+windowAt(630,'#5f7f9c','w2');
 // 壁：部品の棚（レンズ、芯、油差し）と、巻いた綱、柱時計
 s+=shadow(180,74,150,8,.35,'b2')+wood(R(176,70,156,5,'#7a5a3c',1))+[0,1,2,3].map(i=>ball(196+i*22,60,8,8,['#bcd8e4','#e9c26a','#a5d2bb','#abc9dd'][i])+E(196+i*22,60,8,8,'url(#glass)')).join('')+pot(292,70,13,12,'#8b9498')+S('M298,62l9,-5','#8b9498',2.5)+S('M312,70v-10m3,10v-11m3,11v-9','#efe6d0',1.6);
 s+=E(770,82,17,17,'none',{stroke:'#c9a56e','stroke-width':5})+E(770,82,11,11,'none',{stroke:'#b08a5a','stroke-width':4})+ball(770,62,2.6,2.6,'#2c1f15');
 s+=shadow(906,60,34,58,.35,'b2')+wood(R(902,52,34,62,'#6b4d33',4),'v')+E(919,70,11,11,'#f1e6cd')+S('M919,70v-7M919,70l5,3','#3a2414',1.4)+L(919,84,919,104,'#c9a25c',1.6)+ball(919,106,3.4,3.4,'#c9a25c');
 s+=R(144,144,864,26,'url(#drop)',0,{opacity:.75});
 for(const wx of [452,630])s+=G(P(`M${wx},146h92l44,104h-108z`,'#d6ebf7')+S(`M${wx+46},146l30,104M${wx+14},198h106`,'#5a4130',5,{opacity:.5}),{filter:'url(#b4)',opacity:.34,style:'mix-blend-mode:screen'});
 // 真鍮の導光管（共鳴灯から応答灯へ）
 const pipe='M504,392H696V230H800';s+=S(pipe,'#1c0e05',16,{opacity:.3,filter:'url(#b4)',transform:'translate(4,7)'})+S(pipe,'#6a5a30',13)+S(pipe,'#c9b06a',9)+S(pipe,'#fff0b8',2.4,{opacity:.7,transform:'translate(-1,-2.6)'});
 for(const [x,y] of [[560,392],[640,392],[696,392],[696,310],[696,230],[760,230]])s+=cyl(x-9,y-9,18,18,'#8a7a44',4)+E(x,y,3,3,'#3a2c18');
 // 作業台（左奥）：引き出し、万力、レンズ、設計図、卓上の灯り
 s+=box(196,206,232,52,30,'#b78d5c','#7a5a3c')+[0,1,2,3].map(i=>drawer(202+i*56,264,52,18)).join('');
 s+=G(R(206,212,58,36,'#7fa3b5',1)+S('M212,220h40M212,227h30M216,240q10,-12 20,-4t18,-8','#eef4f6',1.2),{transform:'rotate(-4 235 230)'})+ball(292,232,13,9,'#bcd8e4')+E(292,232,13,9,'url(#glass)')+ball(322,238,9,6,'#e9c26a')+E(322,238,9,6,'url(#glass)')
  +cyl(388,206,13,20,'#4c5558',2)+R(384,203,21,5,'#7f8b8a',1.5)+L(394,228,408,228,'#2b3032',3)+S('M346,216l16,22M352,214l-4,26','#c9d0d2',2)
  +contact(412,236,9,3,.5,'b2')+cyl(405,230,14,5,'#5a4a36',2)+R(407,214,10,16,'#fff0b8',2,{opacity:.9})+R(407,214,10,16,'none',2,{stroke:'#5a4a36','stroke-width':1.4})+P('M404,214l8,-8l8,8z','#5a4a36')+stool(310,306,'#4f8a88');
 // 応答灯の台座（右奥）
 s+=shadow(776,270,136,18,.45)+stone(R(772,200,136,84,'#7b766e',8))+R(772,200,136,84,'url(#tsh)',8)+R(772,272,136,14,'#55514b',6)+R(772,272,136,14,'url(#fsh)',6);
 // 本と瓶の長い棚（右手前）
 s+=box(868,458,138,56,56,'#a47d54','#7a5a3c')+R(874,520,126,44,'#2c1f15',2)+books(878,560,118,91,26)+R(874,520,126,9,'url(#drop)',0,{opacity:.6})
  +jar(884,500,'#b0705a')+jar(900,502,'#7f9a72')+jar(916,500,MUSTARD)+pot(952,504,22,16,'#6f8fa0')+G(R(966,474,28,20,'#e8dcbd',1)+S('M970,480h20M970,485h14','#807761',1),{transform:'rotate(6 980 484)'});
 // 戸口（下）：敷居と敷物、濡れた長靴
 s+=shadow(316,662,92,8,.3,'b2')+cloth(R(312,630,96,34,'#5c5040',3)+R(316,634,88,26,'#8a7a62',2))+[[640,'#5c5040'],[647,'#c9b48a'],[654,'#5c5040']].map(([y,c])=>L(320,y,400,y,c,2,{'stroke-dasharray':'6 4'})).join('');
 for(const [bx,c] of [[424,'#5c4433'],[438,'#5c4433']])s+=contact(bx+6,668,8,3,.4,'b2')+cyl(bx,646,11,18,c,3)+E(bx+6.5,665,7.5,4,dark(c,.2))+R(bx,646,11,4,'#efe6d0',2);
 s+=shadow(150,470,46,10,.45)+logs(156,468,3,5)+wood(R(148,412,4,60,'#4d3725',1)+R(190,412,4,60,'#4d3725',1)+R(148,470,46,5,'#4d3725',1),'v');
 // 光
 s+=light(412,236,230,'#ffd9a0',.36,'soft-light',190)+light(412,230,110,'#ffe0a8',.16,'screen',80)+light(840,250,240,'#ffe6b0',.26,'soft-light',200)+light(550,400,260,'#ffd9a0',.18,'soft-light',200);
 s+=`<radialGradient id="vig" cx=".5" cy=".52" r=".72"><stop offset=".45" stop-color="#1c0e05" stop-opacity="0"/><stop offset="1" stop-color="#1c0e05" stop-opacity=".5"/></radialGradient>`+R(144,40,864,632,'url(#vig)',0,{style:'mix-blend-mode:multiply'});
 s+=R(144,144,20,528,'url(#dropR)',0,{opacity:.6})+wood(R(120,20,24,676,'#3f2e21')+R(1008,20,24,676,'#35261b')+R(120,20,912,22,'#3f2e21')+R(120,672,212,24,'#3f2e21')+R(388,672,644,24,'#3f2e21'),'v')
  +wood(R(332,672,56,24,'#8a6846'))+R(332,672,56,3,'#fff3d6',0,{opacity:.3})+R(336,688,48,8,'#d9ecf5',0,{opacity:.5,filter:'url(#b2)'})+R(141,42,3,630,'#fff3d6',0,{opacity:.16})+R(120,20,912,676,'none',4,{stroke:'#0c151a','stroke-width':2,'stroke-opacity':.7});
 return s;
}
function workshopBg(c){if(!D.want('home/workshop',[0,0,1152,768],workshop))return false;D.draw(c,'home/workshop',0,0);D.release('home/workshop');return true;}
// ---------------------------------------------------------------- 家具（基準点＝タイルの中心）
function bed(bx,quilt,accent,extra,id){
 let q='';const cols=[quilt,accent,lite(quilt,.5),dark(quilt,.15),CREAM];
 for(let j=0;j<3;j++)for(let i=0;i<5;i++)q+=R(bx+1+i*17.2,-30+j*17.4,17.3,17.5,cols[(i*2+j*3)%5]);
 let st='';const da={'stroke-dasharray':'2.4 2.4',opacity:.6};for(let j=1;j<3;j++)st+=L(bx+1,-30+j*17.4,bx+87,-30+j*17.4,'#fff8e6',1,da);for(let i=1;i<5;i++)st+=L(bx+1+i*17.2,-30,bx+1+i*17.2,22,'#fff8e6',1,da);
 const qp=`M${bx-1},-28Q${bx+44},-34 ${bx+89},-28V20Q${bx+44},25 ${bx-1},20Z`,pil=`M${bx+12},-58q32,-6 64,0q4,10 0,19q-32,5 -64,0q-4,-9 0,-19z`;
 return shadow(bx+4,14,96,26,.5,'b4')
  +wood(P(`M${bx-5},-60V-98Q${bx+44},-118 ${bx+93},-98V-60Z`,'#7a5a3c'),'v')+P(`M${bx+3},-64V-93Q${bx+44},-108 ${bx+85},-93V-64Z`,'#fff3d6',{opacity:.10})+S(`M${bx-5},-98Q${bx+44},-118 ${bx+93},-98`,'#fff3d6',1.6,{opacity:.4})+extra
  +wood(R(bx-4,-66,96,92,'#8a6846',4))+R(bx+1,-64,86,86,'#f3ead8',5)+R(bx+1,-64,86,86,'url(#fold)',5,{opacity:.35})
  +contact(bx+44,-41,32,7,.3,'b2')+P(pil,'#fffaf0')+P(pil,'url(#ball)',{opacity:.3})+S(`M${bx+30},-50q14,4 28,0`,'#cbbfa6',1,{opacity:.6})
  +`<clipPath id="${id}"><path d="${qp}"/></clipPath>`+G(cloth(q)+st,{'clip-path':`url(#${id})`})+P(qp,'url(#fold)')
  +S(`M${bx+10},-8q20,8 34,-2t36,6`,'#1c0e05',5,{opacity:.10,filter:'url(#b2)'})+S(`M${bx+6},10q30,-8 50,0t28,-4`,'#fff',4,{opacity:.10,filter:'url(#b2)'})
  +P(`M${bx-1},-28Q${bx+44},-34 ${bx+89},-28V-19Q${bx+44},-25 ${bx-1},-19Z`,'#fbf5e6')+P(`M${bx-1},-19Q${bx+44},-25 ${bx+89},-19V-15Q${bx+44},-21 ${bx-1},-15Z`,'#1c0e05',{opacity:.16})
  +wood(R(bx-5,20,98,18,'#7a5a3c',3))+R(bx-5,20,98,18,'url(#fsh)',3)+R(bx-4,20.5,96,1.5,'#fff3d6',0,{opacity:.45})+R(bx+6,25,76,8,'#1c0e05',2,{opacity:.14});
}
function books(x0,y,w,seed,h0=14){const r=rng(seed),cols=['#6f8f8a','#b5645a','#c9a95e','#4f7385','#8a6b8a','#d9c9a6','#6f8f5a','#a5543f'];let s='',x=x0;
 while(x<x0+w-4){const bw=4+Math.floor(r()*5),bh=h0+Math.floor(r()*7),c=cols[Math.floor(r()*cols.length)];if(x+bw>x0+w)break;
  if(r()<.12&&x+bw+8<x0+w){s+=P(`M${x},${y}l5,${-bh}l${bw},1.5l-5,${bh-1.5}z`,c);x+=bw+7;continue;}
  s+=cyl(x,y-bh,bw,bh,c,.8)+R(x+.6,y-bh+3,bw-1.2,1.3,'#ffe9b0',0,{opacity:.7})+R(x+.6,y-5,bw-1.2,1,'#ffe9b0',0,{opacity:.5});x+=bw+.8;}
 return s;}
function yarn(x,y,c){return ball(x,y,5,5,c)+S(`M${x-4},${y-2}q4,4 8,1M${x-4},${y+1.5}q4,-5 7,-5`,'#fff',.9,{opacity:.4});}
function chairBack(x,w1,cushion){return wood(R(x-13,-96,4,36,dark(w1,.2),2)+R(x+9,-96,4,36,dark(w1,.2),2)+P(`M${x-15},-98q15,-9 30,0v9q-15,-7 -30,0z`,w1)+R(x-6,-91,3,28,w1,1)+R(x-1.5,-92,3,29,w1,1)+R(x+3,-91,3,28,w1,1),'v')+S(`M${x-15},-98q15,-9 30,0`,'#fff3d6',1.2,{opacity:.4})+E(x,-64,14,5,cushion);}

function build(){
 // --- 寝台（トウマ：頭板の上に読みかけの本と燭台／ニナ：うさぎのぬいぐるみとハートの座布団）
 const shelfT=P('M-56,-104h16v-4h-16z','#4f7385')+P('M-54,-108h13v-3h-13z','#c9a95e')+cyl(-18,-112,6,9,'#f3ead6',1)+E(-15,-114,1.6,3,'#ffd98a');
 D.define('home/bedT',[-88,-136,128,184],bed(-70,'#4f8a88','#2f5f66',shelfT,'qa')+cloth(R(-62,6,34,13,'#2f5f66',3))+S('M-62,10h34M-62,14h34','#fff',1,{opacity:.25}));
 const bunny=ball(52,-48,7,7,'#f1d9c9')+ball(47,-56,2.6,5,'#f1d9c9')+ball(57,-56,2.6,5,'#f1d9c9')+E(50,-49,1,1.2,'#3a2414')+E(55,-49,1,1.2,'#3a2414');
 D.define('home/bedN',[-40,-136,128,184],bed(-22,'#c0766c','#8a4a52','','qb')+bunny+cloth(P('M6,6q8,-9 14,0q6,-9 14,0q0,9 -14,15q-14,-6 -14,-15z','#f0d7b0')));
 // --- トウマの修理机
 let curls='';const r=rng(5);for(let i=0;i<9;i++){const cx=-16+r()*34,cy=-38+r()*10;curls+=S(`M${n(cx)},${n(cy)}q3,-4 5,0t-3,3`,'#f0d9a8',1.3);}
 D.define('home/desk',[-56,-92,116,138],
  box(-42,-52,84,30,34,'#b78d5c','#7a5a3c')+drawer(-37,-17,36,12)+drawer(3,-17,36,12)+drawer(-37,-3,76,11)
  +G(R(-36,-48,30,20,'#7fa3b5',1)+S('M-32,-43h20M-32,-39h14M-22,-36l8,4l6,-8','#eef4f6',1),{transform:'rotate(-6 -21 -38)'})
  +wood(R(2,-44,26,9,'#9a744c',2))+R(6,-49,9,6,'#5e4530',2)+R(18,-47,8,3,'#c9d0d2',1)+curls
  +cyl(28,-64,11,16,'#4c5558',2)+R(25,-66,17,4,'#7f8b8a',1.5)+L(33,-50,43,-50,'#2b3032',3)+ball(44,-50,2.4,2.4,'#7f8b8a')
  +S('M-38,-62l-2,-12M-35,-62v-14M-33,-62l3,-11','#c9a95e',1.6)+cyl(-40,-62,9,12,'#a86b4c',2)
  +box(6,-62,20,9,7,'#d6b47c','#a37a4c',{shadow:false})+R(9,-60,14,4,'#f6eedc',1)
  +stool(0,18,'#4f8a88'));
 // --- 本棚
 D.define('home/books',[-42,-124,92,150],
  box(-28,-98,56,13,92,'#8f6a44','#6b4d33',{grain:'v'})+R(-23,-80,46,84,'#2c1f15',1)
  +books(-22,-56,44,71)+books(-22,-29,30,72)+R(10,-33,13,4,'#b5645a',.8)+R(11,-37,12,4,'#c9a95e',.8)+R(10,-41,11,4,'#4f7385',.8)+books(-22,-2,44,73,13)
  +R(-23,-80,46,10,'url(#drop)',0,{opacity:.6})+[-56,-29,-2].map(y=>wood(R(-23,y,46,4,'#a47d54'))+R(-23,y+4,46,5,'url(#drop)',0,{opacity:.5})).join('')
  +pot(13,-88,13,9,'#7f6a50')+S('M13,-97q-7,-9 -10,-5M13,-97q-1,-12 2,-13M13,-97q7,-8 10,-3','#6f9a5a',2.2)
  +G(R(-22,-95,24,5,'#e8dcbd',2)+E(-22,-92.5,2.4,2.5,'#cbbd98')+E(2,-92.5,2.4,2.5,'#f3e9cf'),{transform:'rotate(-4 -10 -92)'}));
 // --- ニナの鏡台
 D.define('home/mirror',[-48,-126,100,170],
  box(-34,-44,68,26,28,'#cfa987','#93705a')+drawer(-29,-13,27,14,'#f0d9a8')+drawer(2,-13,27,14,'#f0d9a8')
  +cyl(-3,-58,6,22,'#93705a',1)+contact(2,-76,26,30,.35,'b2')+wood(E(0,-80,25,31,'#8f6a52'),'v')+E(0,-80,25,31,'url(#ball)',{opacity:.5})
  +`<linearGradient id="mir" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4fbf8"/><stop offset=".5" stop-color="#b9d6d2"/><stop offset="1" stop-color="#e8d9c2"/></linearGradient>`+E(0,-80,20,26,'url(#mir)')+E(0,-80,20,26,'url(#glass)')+E(0,-80,20,26,'none',{stroke:'#1c0e05','stroke-opacity':.35,'stroke-width':1.5})
  +cloth(P('M-24,-100q8,-10 16,-2q-6,8 -16,2zM-8,-102q10,-8 14,2q-8,6 -14,-2z','#5f8fb0')+P('M-9,-101q-4,10 -8,20l4,1q3,-10 6,-20z','#4f7fa2'))+ball(-8,-101,2.8,2.8,'#7fa8c4')
  +G(R(-29,-42,17,12,'#fbf4e2',1)+S('M-26,-38h10M-26,-35h7','#b9a583',.9)+P('M-18,-32q2,-3 4,0q-2,3 -4,0z','#c9695c'),{transform:'rotate(-8 -20 -36)'})
  +cyl(12,-40,7,13,'#c98a94',2)+R(13.5,-44,4,4,'#e3c489',1)+cyl(22,-36,6,9,'#8fb0a8',2)+ball(25,-38,3,3,'#f0d9a8')+S('M-4,-26l9,4','#8a6b4a',2.4)+S('M-4,-26l-1,5M-2,-25l-1,5M0,-24l-1,5','#8a6b4a',1)
  +stool(0,18,'#c0766c'));
 // --- 糸と冬服の棚
 let w='';const yc=['#b5544a','#c97f5a','#e0b25a','#8fa46a','#5f8f8c','#5f7f9c','#8a6b8a'];
 for(let j=0;j<2;j++)for(let i=0;i<3;i++){const c=['#c0766c','#e6dcc2','#4f8a88','#c9a56e','#6f8f8a','#a5543f'][j*3+i],x=-21+i*14.4,y=-76+j*24;w+=cloth(R(x,y,13.4,7,c,2)+R(x,y-7,13.4,7,lite(c,.2),2))+R(x,y-.5,13.4,1,'#1c0e05',0,{opacity:.25})+R(x,y-7,2.5,14,'#fff',1,{opacity:.2});}
 for(let i=0;i<7;i++)w+=yarn(-18+i*6.1,-26-(i%2)*7,yc[i]);
 D.define('home/wardrobe',[-42,-128,92,154],
  box(-28,-104,56,13,98,'#a47d54','#7a5a3c',{grain:'v'})+R(-23,-86,46,88,'#2c1f15',1)+w
  +R(-23,-86,46,10,'url(#drop)',0,{opacity:.6})+[-69,-45,-20].map(y=>wood(R(-23,y,46,4,'#b08a5c'))+R(-23,y+4,46,5,'url(#drop)',0,{opacity:.5})).join('')
  +S('M-2,-12l14,-12M4,-12l-12,-12','#c9d0d2',1.2)+yarn(-8,-9,'#2f5f66')+yarn(1,-11,'#8a4a52')+yarn(10,-9,'#efe6d0')+P('M-19,-8q19,7 38,0l-3,10q-16,5 -32,0z','#b08a5a')+S('M-17,-4q17,6 34,0M-17,0q17,5 33,0','#7b5a38',.9)
  +cloth(P('M-26,-92h22l-2,-9q-9,-4 -18,0z','#e6dcc2'))+S('M-24,-96h18','#b5645a',1.2));
 // --- 薪ストーブ（火と湯気はキャンバスで重ねる）
 const cx=-24;let tiles='';for(let j=0;j<4;j++)for(let i=0;i<5;i++)tiles+=R(cx-66+i*28+(j%2?-9:5),-54+j*21,27,20,['#7b766e','#716c66','#858078','#6c6862'][(i+j*2)%4],3);
 D.define('home/stove',[-108,-204,170,244],
  `<clipPath id="hs"><rect x="${cx-58}" y="-54" width="116" height="82" rx="7"/></clipPath>`+shadow(cx-54,18,120,16,.45)+G(stone(R(cx-58,-54,116,82,'#55514b',7)+tiles),{'clip-path':'url(#hs)'})+R(cx-58,-54,116,82,'url(#tsh)',7)
  +contact(cx+8,16,46,9,.6)
  +cyl(cx-10,-138,20,66,'#3a4042',2)+[-122,-96].map(y=>cyl(cx-12,y,24,5,'#2b3032',2)).join('')+E(cx,-138,10,4,'#15191a')+E(cx,-138,10,4,'none',{stroke:'#565e60','stroke-width':1.2})
  +P(`M${cx-34},4q-4,10 -8,12h9q4,-4 5,-12zM${cx+34},4q4,10 8,12h-9q-4,-4 -5,-12z`,'#1d2122')
  +G(R(cx-38,-52,76,60,IRON,8),{filter:'url(#iron)'})+R(cx-38,-52,76,60,'url(#cyl)',8,{opacity:.75})+R(cx-38,-52,76,60,'url(#fsh)',8)
  +G(R(cx-44,-76,88,26,'#474e50',7),{filter:'url(#iron)'})+R(cx-44,-76,88,26,'url(#tsh)',7)+R(cx-44,-54,88,4,'#1d2122',2)+R(cx-42,-75,84,1.5,'#fff',1,{opacity:.3})
  +E(cx-20,-65,12,6,'#2b3032')+E(cx-20,-65.6,9,4,'#3d4446')+E(cx-20,-65.6,2,1,'#1d2122')
  +R(cx-27,-42,54,38,'#1d2122',6)+R(cx-22,-37,44,28,'url(#fire)',4)+R(cx-22,-37,44,28,'#1c0e05',4,{opacity:.25})
  +[-11,0,11].map(dx=>R(cx+dx-1.2,-37,2.4,28,'#1d2122')).join('')+R(cx-22,-24,44,2.4,'#1d2122')+R(cx-27,-42,54,38,'none',6,{stroke:'#565e60','stroke-width':1.2,'stroke-opacity':.7})
  +cyl(cx+29,-28,6,10,'#9aa3a5',2)+R(cx-18,1,36,5,'#1d2122',2)+ball(cx,3.5,2,2,'#9aa3a5')
  +contact(cx+20,-62,15,5,.5,'b2')+S(`M${cx+7},-80q11,-16 22,0`,'#3a2c20',2.6)+P(`M${cx+31},-74q10,-4 12,-12l-4,-1q-2,6 -9,8z`,'#93a09f')+ball(cx+18,-72,15,11,'#93a09f')+E(cx+18,-80,10,3.4,'#b9c4c2')+ball(cx+18,-83,3,2.4,'#5e4530'));
 // --- 食卓
 const hem={'stroke-dasharray':'3 4','stroke-linecap':'butt'};
 D.define('home/table',[-96,-112,192,160],
  contact(4,22,82,9,.45,'b4')+chairBack(-36,'#8a6846','#c0766c')+chairBack(32,'#b9976a','#4f8a88')
  +cyl(-64,-6,8,26,'#6b4d33',1)+cyl(56,-6,8,26,'#6b4d33',1)
  +box(-72,-62,144,50,13,'#c9a878','#8a6846',{shadow:false,rx:4})
  +cloth(R(-36,-62,72,51,'#f1e6cc')+P('M-36,-12h72v12q-4.5,6 -9,0t-9,0t-9,0t-9,0t-9,0t-9,0t-9,0t-9,0z','#e2d5b6'))+R(-36,-12,72,3,'url(#drop)',0,{opacity:.4})
  +L(-33,-57,33,-57,ROSE,2.4,hem)+L(-33,-53.5,33,-53.5,'#5f8f8c',1.2)+L(-33,-17,33,-17,'#5f8f8c',2.4,hem)+L(-33,-20.5,33,-20.5,ROSE,1.2)
  +wood(R(-67,-42,30,18,'#dcc08f',2))+loaf(-52,-33)
  +bowl(-14,-40,true)+L(-1,-37,8,-32,'#c9d0d2',2)+bowl(18,-27,true)+L(-2,-24,6,-20,'#c9d0d2',2)
  +mug(4,-46,'#4f8a88')+mug(34,-42,'#c0766c')
  +contact(52,-36,9,3,.5,'b2')+cyl(45,-42,14,5,'#5a4a36',2)+R(47,-58,10,16,'#fff0b8',2,{opacity:.9})+R(47,-58,10,16,'url(#glass)',2)+R(47,-58,10,16,'none',2,{stroke:'#5a4a36','stroke-width':1.4})+P('M44,-58l8,-8l8,8z','#5a4a36')+S('M52,-66v-5','#5a4a36',1.4)+E(52,-49,2.2,4,'#fff8dc')
  +contact(2,34,56,5,.4)+cyl(-46,16,6,16,'#5e4530',1)+cyl(40,16,6,16,'#5e4530',1)+box(-52,6,104,10,6,'#b08a5c','#7a5a3c',{shadow:false,rx:3})+cloth(R(-40,5,80,9,'#6f7f5a',4))+L(-34,9.5,34,9.5,'#ead9b4',1.4,{'stroke-dasharray':'5 4'}));
 D.define('home/chair3',[-22,-112,44,90],chairBack(0,'#6d7a5a',MUSTARD)+cyl(-12,-62,4,20,'#55603f',1)+cyl(8,-62,4,20,'#55603f',1)); // 三人目の椅子
 // --- 写真と鍵の飾り棚
 D.define('home/shelf',[-52,-104,112,132],
  box(-38,-46,76,22,34,'#b8976a','#86643f')+drawer(-33,-18,33,12)+drawer(1,-18,33,12)+drawer(-33,-4,67,11)
  +cloth(P('M-30,-46h60v8q-30,7 -60,0z','#e9dcc0'))+L(-28,-40,28,-40,ROSE,1.4,{'stroke-dasharray':'2 3'})
  +contact(-10,-40,22,4,.4,'b2')+G(wood(R(-32,-84,40,34,'#6b4d33',2))+R(-28,-80,32,26,'#dccfb0')+[0,1,2,3,4].map(i=>P(`M${-26+i*5.6},-56q0,-10 3,-10t3,10z`,['#6f8f8a','#b5645a','#4f7385',MUSTARD,'#8a6b8a'][i])+ball(-23+i*5.6,-69-(i%2)*2,2.6,2.8,['#ecd3b4','#d9b99a','#ecd3b4','#c9a98a','#ecd3b4'][i])).join('')+R(-28,-80,32,26,'url(#glass)',0,{opacity:.45}),{transform:'rotate(-3 -12 -64)'})
  +contact(24,-40,9,3,.4,'b2')+S('M23,-63q-6,-12 -9,-16M23,-63q0,-14 1,-19M23,-63q6,-11 10,-14','#8a7a4a',1.4)+ball(23,-50,7,9,'#9fb3b8')+cyl(20,-64,6,7,'#9fb3b8',1)+ball(14,-80,2.6,2.6,'#c85a4c')+ball(24,-83,2.8,2.8,MUSTARD)+ball(33,-78,2.6,2.6,'#c9695c')
  +E(2,-36,3.2,3.2,'none',{stroke:'#e0c47f','stroke-width':1.8})+S('M5,-36h9m-3,0v3m3,-3v3','#e0c47f',1.8));
 // --- 窓辺の繕い机
 D.define('home/sewing',[-44,-92,130,138],
  box(-30,-50,102,30,30,'#c4a67c','#8a6846')+drawer(-25,-15,44,12)+drawer(23,-15,44,12)
  +cloth(P('M-24,-46q16,-5 34,-1q4,10 2,22q-18,5 -36,-1q-3,-10 0,-20z','#c0766c'))+S('M-20,-38q14,4 28,0M-20,-31q14,5 28,1','#1c0e05',1,{opacity:.2})+S('M-22,-42q16,-4 30,0','#fff',1,{opacity:.3})
  +cloth(P('M14,-44q6,-3 12,0l1,16q-7,3 -14,0zM14,-46v-7q1.5,-2 3,0v7zM18,-47v-8q1.5,-2 3,0v8zM22,-47v-7q1.5,-2 3,0v7z','#2f5f66'))+L(15,-34,26,-34,'#e6dcc2',1.4)
  +box(34,-50,28,16,9,'#b5543f','#7a3a2c',{shadow:false,rx:3})+[[40,'#e0b25a'],[48,'#5f8f8c'],[56,'#efe6d0']].map(([x,c])=>cyl(x-3,-54,6,8,c,1)+R(x-4,-55,8,1.6,'#5e4530',.5)+R(x-4,-47,8,1.6,'#5e4530',.5)).join('')
  +S('M28,-28l-2,-7M31,-28l1,-8M33,-27l4,-6','#dfe5e6',1)+ball(30,-26,5.5,4.5,'#c85a4c')
  +S('M-8,-26l12,6M-8,-20l12,-6','#c9d0d2',1.8)+E(-10,-27,2.6,2.6,'none',{stroke:'#5a4130','stroke-width':1.6})+E(-10,-19,2.6,2.6,'none',{stroke:'#5a4130','stroke-width':1.6})
  +stool(18,20,'#c0766c'));
 // 春まき草の鉢（第7話でマロにもらう。最終話には芽が出る）
 const sprout=x=>S(`M${x},-8v-7`,'#7fae5a',1.6)+E(x-2.4,-16,2.6,1.6,'#8fc46a')+E(x+2.4,-17,2.6,1.6,'#8fc46a');
 for(const [k,body] of [['pot0',''],['pot1',sprout(0)],['pot3',sprout(-4)+sprout(0)+sprout(4)]])D.define('home/'+k,[-12,-24,24,30],contact(1,1,9,3,.4,'b2')+pot(0,2,15,11,'#a86b4c')+E(0,-9,5.6,1.8,'#3a2a1c')+body);
 D.define('home/room',[0,0,1152,768],room());
}
build();

// ---------------------------------------------------------------- キャンバス側（毎フレームの揺らぎ）
const NAMES={homeDesk:'desk',homeBooks:'books',homeMirror:'mirror',homeWardrobe:'wardrobe',homeStove:'stove',homeTable:'table',homeShelf:'shelf',homeSewing:'sewing'};
function glow(c,x,y,r,rgb,a){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function steam(c,x,y,t,k=3){for(let i=0;i<k;i++){const p=(t*.32+i/k)%1,a=.3*(1-p)*Math.min(1,p*5);c.fillStyle=`rgba(255,255,255,${a})`;c.beginPath();c.ellipse(x+Math.sin(t*1.5+i*2.1)*5*p,y-p*30,3+p*7,2.4+p*6,0,0,Math.PI*2);c.fill();}}
function object(c,o,x,y,s,t){
 const name=o.type==='homeBed'?(o.id==='toumaRoom'?'bedT':'bedN'):NAMES[o.type];if(!name||!D.ready())return false;
 const third=!!root.OkaeriCore?.route(s.episode?.route)?.koharu; // 三人で食卓を囲む結末
 if(name==='table'&&s.episode?.chapter===10&&third&&s.episode.step>=1)D.draw(c,'home/chair3',x-98,y+18);
 if(!D.draw(c,'home/'+name,x,y))return false;
 if(name==='stove'){const cx=x-24,f=.78+Math.sin(t*9)*.1+Math.sin(t*23)*.07;
  c.save();c.beginPath();c.rect(cx-22,y-37,44,28);c.clip();
  for(let i=0;i<6;i++){const fx=cx-19+i*7.6,h=13+Math.sin(t*(7+i*1.7)+i)*5+((i*5)%7);c.fillStyle=i%2?'rgba(255,226,140,.9)':'rgba(255,166,74,.85)';c.beginPath();c.moveTo(fx-6,y-9);c.quadraticCurveTo(fx-3,y-9-h*.5,fx+Math.sin(t*5+i)*2.5,y-9-h);c.quadraticCurveTo(fx+4,y-9-h*.4,fx+6,y-9);c.fill();}
  c.fillStyle='#1d2122';for(const dx of [-11,0,11])c.fillRect(cx+dx-1.2,y-37,2.4,28);c.fillRect(cx-22,y-24,44,2.4);c.restore();
  c.save();c.globalCompositeOperation='lighter';glow(c,cx,y-22,120,'255,150,70',.16*f);glow(c,cx,y+26,74,'255,150,70',.22*f);c.restore();
  steam(c,cx+42,y-88,t,3);}
 if(name==='table'){steam(c,x-14,y-46,t,2);steam(c,x+18,y-33,t+1.7,2);c.save();c.globalCompositeOperation='lighter';glow(c,x+52,y-50,58,'255,214,140',.30+Math.sin(t*6)*.03+Math.sin(t*17)*.02);c.restore();}
 if(name==='sewing'){const ch=s.episode?.chapter||0;if(ch>=7)D.draw(c,'home/'+(ch>=10?(third?'pot3':'pot1'):'pot0'),x+60,y-22);}
 return true;
}
function background(c){return D.ready()&&D.draw(c,'home/room',0,0);}
root.OkaeriHomeArt={workshop:workshopBg,background,object,ready:()=>D.ready(),failed:()=>D.failed()};
})(globalThis);
