(function(root){
'use strict';
// 三人の家の中。描画エンジン（draw-engine.js）で組み立てたベクター絵。
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
function windowAt(wx,col,id,w=92){ // 奥の壁の窓。外は雪の朝。
 const y=58,h=66,cw=w<80?24:32,k=w/92,r=rng(wx);let flakes='';for(let i=0;i<18;i++)flakes+=E(wx+r()*w,y+r()*h,.8+r()*.9,.8+r()*.9,'#fff',{opacity:n(.5+r()*.5)});
 let pines='';for(const [px,s] of [[10,1],[27,.7],[58,.85],[80,1.1]]){const bx=wx+px*k,by=y+50;pines+=P(`M${bx},${by-34*s}L${bx+9*s},${by-12*s}H${bx+5*s}L${bx+12*s},${by}H${bx-12*s}L${bx-5*s},${by-12*s}H${bx-9*s}Z`,'#3d5f5c')+P(`M${bx},${by-34*s}L${bx+6*s},${by-18*s}Q${bx},${by-22*s} ${bx-6*s},${by-18*s}Z`,'#eef3ee');}
 return `<clipPath id="${id}"><rect x="${wx}" y="${y}" width="${w}" height="${h}" rx="2"/></clipPath>`
  +`<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86abc9"/><stop offset=".7" stop-color="#d8e3e6"/><stop offset="1" stop-color="#f6e6cf"/></linearGradient>`
  +wood(R(wx-8,y-9,w+16,h+20,'#4d3725',3),'v')+R(wx-4,y-4,w+8,h+8,'#261a11',2)
  +G(R(wx,y,w,h,`url(#${id}s)`)+P(`M${wx-4},${y+44}Q${wx+24*k},${y+30} ${wx+50*k},${y+42}T${wx+w+6},${y+36}V${y+h}H${wx-4}Z`,'#c9d8de')+G(pines,{filter:'url(#b1)',opacity:.9})
    +P(`M${wx-4},${y+54}Q${wx+30*k},${y+44} ${wx+60*k},${y+52}T${wx+w+6},${y+50}V${y+h+2}H${wx-4}Z`,'#f7f9f6')+flakes
    +E(wx+2,y+h,18,11,'#fff',{opacity:.75,filter:'url(#b4)'})+E(wx+w,y+h,18,10,'#fff',{opacity:.75,filter:'url(#b4)'})+E(wx,y,14,9,'#fff',{opacity:.45,filter:'url(#b4)'})
    +R(wx,y,w,h,'url(#glass)',0,{opacity:.45})+R(wx,y,w,7,'url(#drop)',0,{opacity:.7}),{'clip-path':`url(#${id})`})
  +wood(R(wx+w/2-2.5,y,5,h,'#5e4530')+R(wx,y+h/2-2.5,w,5,'#5e4530'),'v')+R(wx+w/2-2.5,y,1.2,h,'#fff3d6',0,{opacity:.3})+R(wx,y+h/2-2.5,w,1.2,'#fff3d6',0,{opacity:.3})
  +shadow(wx-10,y+h+10,w+20,8,.4,'b2')+wood(R(wx-11,y+h+4,w+22,9,'#86633f',2))+R(wx-11,y+h+4,w+22,2,'#fff3d6',1,{opacity:.4})
  +R(wx-15,y-15,w+30,4.5,'#2c1f15',2)+ball(wx-16,y-13,3.6,3.6,'#c9a25c')+ball(wx+w+16,y-13,3.6,3.6,'#c9a25c')
  +curtain(wx-14,y-13,cw,h+22,col,false)+curtain(wx+w+14-cw,y-13,cw,h+22,col,true);
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
 // よく歩く道筋のつや（戸口→食卓→三つの寝室の戸口）
 s+=S('M600,660C600,560 470,540 400,470C340,410 312,380 312,330','#fff0d0',32,{opacity:.10,filter:'url(#b16)'})+S('M600,650C590,540 564,450 552,330','#fff0d0',28,{opacity:.08,filter:'url(#b16)'})+S('M600,640C640,540 800,470 840,340','#fff0d0',32,{opacity:.09,filter:'url(#b16)'});
 // ---- 敷物（三つの個室＋食卓・ストーブ・繕い机）
 s+=rug(248,224,96,52,'#2f5f66','#d9cfb2','#c98f5a','diamond')+rug(486,214,86,54,'#70815e','#e9dcb9','#b76a5b','star')+rug(744,226,106,54,'#8a4a52','#f0e2c8','#6f8f8a','star');
 s+=rug(432,366,246,150,'#7a4a44','#e2cfa6','#5f8f8c','diamond')+braided(250,532,70,27)+rug(836,544,132,54,'#6f7f5a','#ead9b4','#b5645a','star');
 s+=backWall(r);
 // 壁の飾り：トウマ側（見回りの地図）
 s+=shadow(166,60,58,36,.35,'b2')+wood(R(162,54,62,40,'#6b4d33',2))+R(166,58,54,32,'#e9dcba')+S('M170,82q8,-14 16,-8t12,-6t14,-8','#6f8f8a',1.4)+S('M172,66q14,6 22,2t22,10','#b98a6a',1,{'stroke-dasharray':'3 2'})+E(204,72,2.4,2.4,'#c85a4c')+S('M212,62l3,5l-6,0z','#3f5f66',1)+R(166,58,54,32,'url(#glass)',0,{opacity:.25});
 // 壁の飾り：コハルの部屋（干した薬草の束と、押し花の額）
 s+=S('M428,60Q458,72 488,58','#6c4d32',1.8);
 for(const hx of [444,472])s+=L(hx,64,hx,80,'#725338',1.2)+S(`M${hx},80q-6,10 -7,18M${hx},80v19M${hx},80q6,10 7,18`,'#617e4e',1.8)+E(hx-6,93,3.2,6.5,'#82965c')+E(hx,97,3.2,7,'#9aaa6b')+E(hx+6,93,3.2,6.5,'#82965c')+R(hx-3.5,79,7,2.6,'#bb8065',1);
 s+=shadow(596,58,42,38,.3,'b2')+wood(R(592,54,46,40,'#77543b',2))+R(596,58,38,32,'#eee1bd',1)+S('M615,84q-4,-10 1,-18M615,77q-8,-4 -10,-9M615,75q7,-4 9,-8','#6e8f5d',1.4)+ball(605,67,2.6,2.6,'#cf8b78')+ball(625,66,2.6,2.6,'#d4aa60')+ball(616,64,2.6,2.6,'#d3b071');
 // 壁の飾り：ニナ側（刺繍の枠、旗飾り）
 s+=shadow(876,62,46,36,.35,'b2')+E(896,76,22,19,'#8a5f4a')+E(896,76,18,15,'#f1e6cd')+[0,1,2,3,4,5].map(i=>ball(896+Math.cos(i*1.05)*8.5,76+Math.sin(i*1.05)*6.8,2.6,2.6,['#c9695c','#e0b25a','#7fa08a','#c9695c','#8aa3c0','#e0b25a'][i])).join('')+ball(896,76,3,3,'#f6e9c0');
 s+=S('M924,60Q962,80 1000,58','#7a5a3c',1.2);for(let i=0;i<6;i++){const t=(i+.5)/6,bx=924+76*t,by=60+(1-Math.pow(2*t-1,2))*11-1;s+=cloth(P(`M${n(bx-5.5)},${n(by)}h11l-5.5,12z`,[ROSE,CREAM,'#6f8f8a',MUSTARD][i%4]));}
 // 三つの寝室の窓
 s+=windowAt(312,'#4f8a88','w1',64)+windowAt(504,'#778e62','w2',64)+windowAt(792,'#c0766c','w3',64);
 s+=pot(326,128,10,8,'#a86b4c')+S('M326,120q-4,-7 -7,-4M326,120q0,-9 2,-10M326,120q5,-6 7,-3','#6f9a5a',1.8)
  +pot(518,128,10,8,'#7f9a72')+S('M518,120q-4,-7 -6,-5M518,120q1,-9 3,-10M518,120q5,-6 7,-4','#617e4e',1.8)
  +P('M836,128h9v-8h-9z','#f3ead6')+E(840.5,118,1.8,3,'#ffd98a')+ball(824,126,3.6,2.8,'#b8706a');
 s+=R(144,144,864,26,'url(#drop)',0,{opacity:.75});
 // 窓から床へ落ちる朝の光
 for(const wx of [312,504,792])s+=G(P(`M${wx},146h64l34,96h-80z`,'#d6ebf7')+S(`M${wx+32},146l23,96M${wx+9},194h76`,'#5a4130',4.5,{opacity:.5}),{filter:'url(#b4)',opacity:.32,style:'mix-blend-mode:screen'});
 // ---- 三つの寝室を分ける縦壁（天面）
 for(const vx of [394,682])s+=R(vx+28,144,18,146,'url(#dropR)',0,{opacity:.78})+plaster(R(vx,140,28,150,'#e6d6b4'))+wood(R(vx,140,4.5,150,TIMBER)+R(vx+23.5,140,4.5,150,TIMBER),'v')+R(vx+4.5,140,1.8,150,'#fff',0,{opacity:.3});
 // ---- 仕切り壁：天面＋手前の面（漆喰と腰板）。戸口は三つ（トウマ・コハル・ニナ）。
 for(const [x,w] of [[144,144],[336,192],[576,240],[864,144]]){
  s+=plaster(R(x,280,w,17,'#e6d6b4'))+R(x,280,w,2,'#fff',0,{opacity:.35})+wood(R(x,294,w,5,'#4d3725'))
   +plaster(R(x,299,w,22,'#e2d3b1'))+R(x,299,w,8,'url(#drop)',0,{opacity:.5});
  let b='';for(let i=0;i<w/24;i++)b+=R(x+i*24,321,24,15,['#9a744c','#8f6a44','#a47d54'][i%3]);s+=wood(b,'v')+R(x,320,w,2,'#b08a5c')+R(x,333,w,3,'#3f2e21');}
 for(const dx of [288,528,816]){ // 戸口の枠と敷居（コハルの扉だけは開閉するので別スプライト）
  s+=wood(R(dx-7,276,7,60,TIMBER,1)+R(dx+48,276,7,60,TIMBER,1),'v')+R(dx-7,276,2,60,'#fff3d6',0,{opacity:.25})+R(dx+48,276,2,60,'#fff3d6',0,{opacity:.25})+wood(R(dx,333,48,4,'#7a5a3c'));
  if(dx!==528)s+=P(`M${dx+55},300l20,26v40l-20,-30z`,'#1c0e05',{opacity:.3,filter:'url(#b4)'})+wood(P(`M${dx+55},284l18,24v52l-18,-26z`,'#96714a'),'v')+P(`M${dx+58},294l12,16v36l-12,-17z`,'#1c0e05',{opacity:.16})+ball(dx+70,334,2.4,2.4,'#e3c489');}
 for(const [x,name,col] of [[224,'トウマ',TEAL],[464,'コハル','#6e8b5e'],[876,'ニナ',ROSE]])s+=shadow(x+1,304,54,16,.4,'b1')+wood(R(x,301,54,17,'#c9a56e',3))+R(x,301,54,17,'none',3,{stroke:col,'stroke-width':1.6})+T(x+27,314,name,11,'#3a2414');
 // 灯り番の道具（左の壁）：予備のランタン、油差し、芯の束
 s+=wood(R(154,316,62,4,'#7a5a3c',1))+L(166,298,166,304,'#2c1f15',1.6)+cyl(160,304,12,12,'#e9c26a',2)+R(160,304,12,12,'none',2,{stroke:'#3a2c20','stroke-width':1.6})+P('M158,304l8,-6l8,6z','#3a2c20')+pot(188,316,13,11,'#8b9498')+S('M194,309l9,-5','#8b9498',2.5)+S('M204,316v-9m3,9v-10m3,10v-8','#efe6d0',1.6);
 // 外套掛け（右の壁：三人分の冬外套）
 s+=wood(R(934,303,72,5,'#5e4530',2))+G(coat(0,0,TEAL,'#e6dcc2','#b5543f'),{transform:'translate(936,307) scale(.86,.92)'})+G(coat(0,0,'#a5543f','#efe5cc',null),{transform:'translate(960,307) scale(.86,.92)'})+G(coat(0,0,'#8c6248','#efe5cc','#778e62'),{transform:'translate(984,309) scale(.78,.82)'});
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
 for(const [bx,c,h] of [[660,'#5c4433',18],[673,'#5c4433',18],[691,'#7a4a38',18],[704,'#7a4a38',18],[722,'#6b7a58',15],[734,'#6b7a58',15]])s+=contact(bx+6,668,8,3,.4,'b2')+cyl(bx,664-h,11,h,c,3)+E(bx+6.5,665,7.5,4,dark(c,.2))+R(bx,664-h,11,4,'#efe6d0',2);
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

// 家の奥にあるコハルの小さな部屋。家具は人物の前後に描けるよう別スプライトにする。
function koharuBedroom(){
 const r=rng(7319);let s='';
 s+=`<radialGradient id="kout" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#304749"/><stop offset="1" stop-color="#101d24"/></radialGradient>`+R(0,0,1152,768,'url(#kout)');
 s+=shadow(110,30,950,690,.6,'b16')+wood(R(120,20,912,676,'#3f2e21',4))+floorPlanks(r)+backWall(r);
 s+=rug(330,330,330,210,'#70815e','#e9dcb9','#b76a5b','star')+braided(300,516,68,25)+rug(775,515,130,62,'#916e58','#e9dcb9','#6f8f5a','diamond');
 s+=windowAt(526,'#778e62','kw');
 // 葉を干す紐と、布に包んだ種。冬の間にも手入れする薬草の部屋。
 s+=S('M260,62Q360,78 460,60','#6c4d32',2);
 for(const x of [286,330,374,418]){
  s+=L(x,67,x,86,'#725338',1.3)+S(`M${x},86q-8,12 -9,22M${x},86q1,14 0,24M${x},86q8,12 9,22`,'#617e4e',2)
   +E(x-8,101,4,8,'#82965c')+E(x,106,4,9,'#9aaa6b')+E(x+8,101,4,8,'#82965c')+R(x-4,85,8,3,'#bb8065',1);
 }
 s+=wood(R(728,67,152,6,'#795b3e',1))+jar(740,67,'#b0705a')+jar(758,67,'#7f9a72')+jar(776,67,MUSTARD)
  +G(R(807,47,45,24,'#e9d9b6',1)+S('M813,54h29M813,59h22M813,64h26','#8b795d',1),{transform:'rotate(3 830 59)'});
 // 押し花の額と、よく使う外套。小さな私室らしい手触りを壁に置く。
 s+=shadow(650,58,46,42,.3,'b2')+wood(R(646,54,50,44,'#77543b',2))+R(650,58,42,36,'#eee1bd',1)
  +S('M671,86q-4,-12 1,-21M671,79q-9,-5 -12,-10M671,76q8,-4 11,-9','#6e8f5d',1.5)
  +ball(659,68,3,3,'#cf8b78')+ball(683,66,3,3,'#d4aa60')+ball(672,64,3,3,'#d3b071')
  +wood(R(934,150,54,5,'#5e4530',2))+coat(950,155,'#a5543f','#efe5cc','#778e62');
 s+=light(578,176,210,'#ffe0ac',.25,'soft-light',160)+light(760,405,220,'#ffc37d',.24,'soft-light',170);
 // 食卓へ戻る入口の敷居。部屋全体を家の家具と同じ素材で囲む。
 s+=shadow(552,661,96,9,.35,'b2')+cloth(R(552,630,96,34,'#6f7f5a',3))+R(556,634,88,26,'#d8c696',2)
  +L(560,644,640,644,'#6f7f5a',2,{'stroke-dasharray':'6 4'})+L(560,655,640,655,'#6f7f5a',2,{'stroke-dasharray':'6 4'});
 s+=wood(R(120,20,24,676,'#3f2e21')+R(1008,20,24,676,'#35261b')+R(120,20,912,22,'#3f2e21')+R(120,672,452,24,'#3f2e21')+R(628,672,404,24,'#3f2e21'),'v')
  +wood(R(572,672,56,24,'#8a6846'))+R(572,672,56,3,'#fff3d6',0,{opacity:.3})+R(120,20,912,676,'none',4,{stroke:'#0c151a','stroke-width':2,'stroke-opacity':.7});
 return s;
}
// ユラの診療所。薬草の束が吊るされた清潔で温かな診察室と、椅子が一脚抜けた待合。
function clinicRoom(){
 const r=rng(6143);let s='';
 s+=`<radialGradient id="cout" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#2c4648"/><stop offset="1" stop-color="#0f1c22"/></radialGradient>`+R(0,0,1152,768,'url(#cout)');
 s+=shadow(110,30,950,690,.6,'b16')+wood(R(120,20,912,676,'#3f2e21',4))+floorPlanks(r)+backWall(r);
 s+=S('M596,652C592,540 568,450 552,360','#fff0d0',32,{opacity:.09,filter:'url(#b16)'});
 s+=rug(432,272,248,148,'#567973','#ebe0c3','#b5645a','diamond')+braided(252,516,68,26)+rug(712,436,196,118,'#6c8262','#eae0c3','#c9974c','star');
 s+=windowAt(404,'#5a827b','cw1',78)+windowAt(682,'#5a827b','cw2',78);
 for(const wx of [404,682])s+=G(P(`M${wx},146h78l36,98h-90z`,'#d6ebf7')+S(`M${wx+39},146l24,98M${wx+11},194h88`,'#5a4130',4.5,{opacity:.5}),{filter:'url(#b4)',opacity:.32,style:'mix-blend-mode:screen'});
 // 壁：干した薬草の束、薬効図の額、白衣と往診鞄
 s+=S('M206,58Q294,76 382,56','#6c4d32',2);
 for(const hx of [232,274,316,358]){
  s+=L(hx,64,hx,84,'#725338',1.3)+S(`M${hx},84q-7,12 -8,22M${hx},84v23M${hx},84q7,12 8,22`,'#5b7b4e',2)
   +E(hx-7,99,3.8,7.5,'#7f965c')+E(hx,104,3.8,8.5,'#97aa6b')+E(hx+7,99,3.8,7.5,'#7f965c')+R(hx-4,83,8,3,'#b5795e',1);
 }
 s+=shadow(524,56,116,44,.32,'b2')+wood(R(520,52,124,48,'#6b4d33',2))+R(525,57,114,38,'#f1e6ca',1)
  +S('M544,86q-3,-14 2,-22M544,78q-8,-4 -11,-9M544,75q7,-4 10,-8','#5f8254',1.5)+ball(534,67,2.6,2.6,'#cf8b78')+ball(554,66,2.6,2.6,'#d9aa56')
  +S('M574,66h48M574,73h40M574,80h44M574,87h32','#7c6b52',1.1);
 s+=wood(R(826,64,148,5,'#6b4d33',1.5))+jar(840,64,'#7f9a72')+jar(858,64,'#b0705a')+jar(876,64,MUSTARD)+pot(912,64,16,13,'#6f8fa0')
  +wood(R(936,154,54,5,'#5e4530',2))+coat(950,159,'#e9e3d2','#5a827b','#b5645a');
 // 手洗い鉢と清潔な布（右壁寄り）
 s+=box(896,314,88,28,28,'#c6a77c','#866544')+E(940,324,22,9,'#f5efe2')+E(940,324,17,6.5,'#a9ccd6')+E(936,322,6,2,'#eef9fc',{opacity:.7})+cloth(R(902,344,24,28,'#f3ede0',2))+L(905,366,923,366,'#5a827b',1.6);
 // 薪棚と玄関マット、往診用の長靴
 s+=shadow(150,470,46,10,.45)+logs(156,468,3,5)+wood(R(148,412,4,60,'#4d3725',1)+R(190,412,4,60,'#4d3725',1)+R(148,470,46,5,'#4d3725',1),'v');
 s+=shadow(552,661,96,9,.35,'b2')+cloth(R(552,630,96,34,'#4f6f6a',3)+R(556,634,88,26,'#dfd2b2',2))
  +L(560,644,640,644,'#4f6f6a',2,{'stroke-dasharray':'6 4'})+L(560,655,640,655,'#4f6f6a',2,{'stroke-dasharray':'6 4'});
 for(const [bx,c] of [[662,'#534031'],[675,'#534031'],[694,'#6b7a58'],[706,'#6b7a58']])s+=contact(bx+6,668,8,3,.4,'b2')+cyl(bx,647,11,17,c,3)+E(bx+6.5,665,7.5,4,dark(c,.2))+R(bx,647,11,4,'#efe6d0',2);
 s+=light(240,470,280,'#ffab5c',.36,'soft-light',220)+light(552,300,260,'#ffe3ad',.34,'soft-light',210)+light(820,300,210,'#ffe8bc',.22,'soft-light',170);
 s+=`<radialGradient id="cvig" cx=".5" cy=".52" r=".72"><stop offset=".48" stop-color="#1c0e05" stop-opacity="0"/><stop offset="1" stop-color="#1c0e05" stop-opacity=".46"/></radialGradient>`+R(144,40,864,632,'url(#cvig)',0,{style:'mix-blend-mode:multiply'});
 s+=R(144,144,864,24,'url(#drop)',0,{opacity:.7})+R(144,144,20,528,'url(#dropR)',0,{opacity:.58});
 s+=wood(R(120,20,24,676,'#3f2e21')+R(1008,20,24,676,'#35261b')+R(120,20,912,22,'#3f2e21')+R(120,672,452,24,'#3f2e21')+R(628,672,404,24,'#3f2e21'),'v')
  +wood(R(572,672,56,24,'#8a6846'))+R(572,672,56,3,'#fff3d6',0,{opacity:.3})+R(576,688,48,8,'#d9ecf5',0,{opacity:.5,filter:'url(#b2)'})+R(120,20,912,676,'none',4,{stroke:'#0c151a','stroke-width':2,'stroke-opacity':.7});
 return s;
}
// ---------------------------------------------------------------- 家具（基準点＝タイルの中心）
function bedQuilt(bx,quilt,accent,id){
 let q='';const cols=[quilt,accent,lite(quilt,.5),dark(quilt,.15),CREAM];
 for(let j=0;j<3;j++)for(let i=0;i<5;i++)q+=R(bx+1+i*17.2,-30+j*17.4,17.3,17.5,cols[(i*2+j*3)%5]);
 let st='';const da={'stroke-dasharray':'2.4 2.4',opacity:.6};for(let j=1;j<3;j++)st+=L(bx+1,-30+j*17.4,bx+87,-30+j*17.4,'#fff8e6',1,da);for(let i=1;i<5;i++)st+=L(bx+1+i*17.2,-30,bx+1+i*17.2,22,'#fff8e6',1,da);
 const qp=`M${bx-1},-28Q${bx+44},-34 ${bx+89},-28V20Q${bx+44},25 ${bx-1},20Z`;
 return `<clipPath id="${id}"><path d="${qp}"/></clipPath>`+G(cloth(q)+st,{'clip-path':`url(#${id})`})+P(qp,'url(#fold)')
  +S(`M${bx+10},-8q20,8 34,-2t36,6`,'#1c0e05',5,{opacity:.10,filter:'url(#b2)'})+S(`M${bx+6},10q30,-8 50,0t28,-4`,'#fff',4,{opacity:.10,filter:'url(#b2)'})
  +P(`M${bx-1},-28Q${bx+44},-34 ${bx+89},-28V-19Q${bx+44},-25 ${bx-1},-19Z`,'#fbf5e6')+P(`M${bx-1},-19Q${bx+44},-25 ${bx+89},-19V-15Q${bx+44},-21 ${bx-1},-15Z`,'#1c0e05',{opacity:.16})
  +wood(R(bx-5,20,98,18,'#7a5a3c',3))+R(bx-5,20,98,18,'url(#fsh)',3)+R(bx-4,20.5,96,1.5,'#fff3d6',0,{opacity:.45})+R(bx+6,25,76,8,'#1c0e05',2,{opacity:.14});
}
function bed(bx,quilt,accent,extra,id){
 const pil=`M${bx+12},-58q32,-6 64,0q4,10 0,19q-32,5 -64,0q-4,-9 0,-19z`;
 return shadow(bx+4,14,96,26,.5,'b4')
  +wood(P(`M${bx-5},-60V-98Q${bx+44},-118 ${bx+93},-98V-60Z`,'#7a5a3c'),'v')+P(`M${bx+3},-64V-93Q${bx+44},-108 ${bx+85},-93V-64Z`,'#fff3d6',{opacity:.10})+S(`M${bx-5},-98Q${bx+44},-118 ${bx+93},-98`,'#fff3d6',1.6,{opacity:.4})+extra
  +wood(R(bx-4,-66,96,92,'#8a6846',4))+R(bx+1,-64,86,86,'#f3ead8',5)+R(bx+1,-64,86,86,'url(#fold)',5,{opacity:.35})
  +contact(bx+44,-41,32,7,.3,'b2')+P(pil,'#fffaf0')+P(pil,'url(#ball)',{opacity:.3})+S(`M${bx+30},-50q14,4 28,0`,'#cbbfa6',1,{opacity:.6})
  +bedQuilt(bx,quilt,accent,id);
}
function books(x0,y,w,seed,h0=14){const r=rng(seed),cols=['#6f8f8a','#b5645a','#c9a95e','#4f7385','#8a6b8a','#d9c9a6','#6f8f5a','#a5543f'];let s='',x=x0;
 while(x<x0+w-4){const bw=4+Math.floor(r()*5),bh=h0+Math.floor(r()*7),c=cols[Math.floor(r()*cols.length)];if(x+bw>x0+w)break;
  if(r()<.12&&x+bw+8<x0+w){s+=P(`M${x},${y}l5,${-bh}l${bw},1.5l-5,${bh-1.5}z`,c);x+=bw+7;continue;}
  s+=cyl(x,y-bh,bw,bh,c,.8)+R(x+.6,y-bh+3,bw-1.2,1.3,'#ffe9b0',0,{opacity:.7})+R(x+.6,y-5,bw-1.2,1,'#ffe9b0',0,{opacity:.5});x+=bw+.8;}
 return s;}
function yarn(x,y,c){return ball(x,y,5,5,c)+S(`M${x-4},${y-2}q4,4 8,1M${x-4},${y+1.5}q4,-5 7,-5`,'#fff',.9,{opacity:.4});}
function chairBack(x,w1,cushion){return wood(R(x-13,-96,4,36,dark(w1,.2),2)+R(x+9,-96,4,36,dark(w1,.2),2)+P(`M${x-15},-98q15,-9 30,0v9q-15,-7 -30,0z`,w1)+R(x-6,-91,3,28,w1,1)+R(x-1.5,-92,3,29,w1,1)+R(x+3,-91,3,28,w1,1),'v')+S(`M${x-15},-98q15,-9 30,0`,'#fff3d6',1.2,{opacity:.4})+E(x,-64,14,5,cushion);}

function build(){
 // --- 寝台（トウマ：頭板の上に読みかけの本と燭台／コハル：若草色の毛布と小さな花の飾り／ニナ：うさぎのぬいぐるみとハートの座布団）
 const shelfT=P('M-52,-104h16v-4h-16z','#4f7385')+P('M-50,-108h13v-3h-13z','#c9a95e')+cyl(-14,-112,6,9,'#f3ead6',1)+E(-11,-114,1.6,3,'#ffd98a');
 D.define('home/bedT',[-84,-136,128,184],bed(-66,'#4f8a88','#2f5f66',shelfT,'qa')+cloth(R(-58,6,34,13,'#2f5f66',3))+S('M-58,10h34M-58,14h34','#fff',1,{opacity:.25}));
 const bunny=ball(46,-48,7,7,'#f1d9c9')+ball(41,-56,2.6,5,'#f1d9c9')+ball(51,-56,2.6,5,'#f1d9c9')+E(44,-49,1,1.2,'#3a2414')+E(49,-49,1,1.2,'#3a2414');
 D.define('home/bedN',[-46,-136,128,184],bed(-28,'#c0766c','#8a4a52','','qb')+bunny+cloth(P('M0,6q8,-9 14,0q6,-9 14,0q0,9 -14,15q-14,-6 -14,-15z','#f0d7b0')));
 const kFlowers=cloth(R(-13,5,36,12,'#d9c582',3))+[[-7,10],[3,11],[13,10]].map(([x,y])=>ball(x,y,2.2,2.2,'#f5e7bb')).join('');
 D.define('home/bedK',[-40,-136,128,184],bed(-22,'#899866','#667a4d','','qk')+kFlowers);
 D.define('home/bedKQuilt',[-40,-40,128,88],bedQuilt(-22,'#899866','#667a4d','qk2')+kFlowers);
 // --- トウマの修理机
 let curls='';const r=rng(5);for(let i=0;i<8;i++){const cx=-16+r()*26,cy=-38+r()*10;curls+=S(`M${n(cx)},${n(cy)}q3,-4 5,0t-3,3`,'#f0d9a8',1.3);}
 D.define('home/desk',[-52,-92,102,138],
  box(-38,-52,68,28,34,'#b78d5c','#7a5a3c')+drawer(-33,-17,29,12)+drawer(0,-17,26,12)+drawer(-33,-3,59,11)
  +G(R(-33,-48,26,18,'#7fa3b5',1)+S('M-29,-43h17M-29,-39h12M-21,-36l7,4l5,-7','#eef4f6',1),{transform:'rotate(-6 -20 -39)'})
  +wood(R(-2,-44,22,9,'#9a744c',2))+R(2,-49,8,6,'#5e4530',2)+R(12,-47,7,3,'#c9d0d2',1)+curls
  +cyl(16,-64,10,16,'#4c5558',2)+R(13,-66,16,4,'#7f8b8a',1.5)+L(21,-50,29,-50,'#2b3032',3)+ball(30,-50,2.2,2.2,'#7f8b8a')
  +S('M-34,-62l-2,-12M-31,-62v-14M-29,-62l3,-11','#c9a95e',1.6)+cyl(-36,-62,9,12,'#a86b4c',2)
  +stool(-4,18,'#4f8a88'));
 // --- 本棚
 D.define('home/books',[-36,-124,84,150],
  box(-22,-98,52,13,92,'#8f6a44','#6b4d33',{grain:'v'})+R(-17,-80,42,84,'#2c1f15',1)
  +books(-16,-56,40,71)+books(-16,-29,26,72)+R(12,-33,12,4,'#b5645a',.8)+R(13,-37,11,4,'#c9a95e',.8)+books(-16,-2,40,73,13)
  +R(-17,-80,42,10,'url(#drop)',0,{opacity:.6})+[-56,-29,-2].map(y=>wood(R(-17,y,42,4,'#a47d54'))+R(-17,y+4,42,5,'url(#drop)',0,{opacity:.5})).join('')
  +pot(15,-88,12,9,'#7f6a50')+S('M15,-97q-6,-9 -9,-5M15,-97q-1,-12 2,-13M15,-97q6,-8 9,-3','#6f9a5a',2)
  +G(R(-16,-95,22,5,'#e8dcbd',2)+E(-16,-92.5,2.2,2.5,'#cbbd98')+E(6,-92.5,2.2,2.5,'#f3e9cf'),{transform:'rotate(-4 -5 -92)'}));
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
 D.define('home/tableChairs',[-60,-112,120,64],chairBack(-36,'#8a6846','#c0766c')+chairBack(32,'#b9976a','#4f8a88'));
 D.define('home/table',[-96,-112,192,160],
  contact(4,22,82,9,.45,'b4')
  +cyl(-64,-6,8,26,'#6b4d33',1)+cyl(56,-6,8,26,'#6b4d33',1)
  +box(-72,-62,144,50,13,'#c9a878','#8a6846',{shadow:false,rx:4})
  +cloth(R(-36,-62,72,51,'#f1e6cc')+P('M-36,-12h72v12q-4.5,6 -9,0t-9,0t-9,0t-9,0t-9,0t-9,0t-9,0t-9,0z','#e2d5b6'))+R(-36,-12,72,3,'url(#drop)',0,{opacity:.4})
  +L(-33,-57,33,-57,ROSE,2.4,hem)+L(-33,-53.5,33,-53.5,'#5f8f8c',1.2)+L(-33,-17,33,-17,'#5f8f8c',2.4,hem)+L(-33,-20.5,33,-20.5,ROSE,1.2)
  +wood(R(-67,-42,30,18,'#dcc08f',2))+loaf(-52,-33)
  +bowl(-14,-40,true)+L(-1,-37,8,-32,'#c9d0d2',2)+bowl(18,-27,true)+L(-2,-24,6,-20,'#c9d0d2',2)
  +mug(4,-46,'#4f8a88')+mug(34,-42,'#c0766c')
  +contact(52,-36,9,3,.5,'b2')+cyl(45,-42,14,5,'#5a4a36',2)+R(47,-58,10,16,'#fff0b8',2,{opacity:.9})+R(47,-58,10,16,'url(#glass)',2)+R(47,-58,10,16,'none',2,{stroke:'#5a4a36','stroke-width':1.4})+P('M44,-58l8,-8l8,8z','#5a4a36')+S('M52,-66v-5','#5a4a36',1.4)+E(52,-49,2.2,4,'#fff8dc'));
 D.define('home/chair3',[-22,-112,44,90],chairBack(0,'#6d7a5a',MUSTARD)+cyl(-12,-62,4,20,'#55603f',1)+cyl(8,-62,4,20,'#55603f',1)); // 三人目の椅子
 // 食卓の三つ目の席は、コハルが診療所から持ってきた踏み台。
 D.define('home/koharuStool',[-24,-80,48,68],
  contact(1,-29,18,4.5,.38,'b2')+wood(R(-14,-50,5,21,'#765638',1.5)+R(9,-50,5,21,'#765638',1.5),'v')
  +wood(R(-12,-39,24,4,'#9c774d',1))+box(-17,-61,34,12,6,'#d2b17b','#94734c',{shadow:false})
  +cloth(E(0,-56,13,4.5,'#bdad69'))+E(0,-57,10.5,2.6,'#e1ca8b',{opacity:.65}));
 // コハルの部屋の扉（寝ている間は閉まり、起きてくると開く）
 D.define('home/koharuDoorClosed',[-32,-38,64,70],
  shadow(-24,18,48,8,.35,'b2')+wood(R(-24,-30,48,54,'#96714a',1.5),'v')
  +R(-20,-25,40,20,'none',1,{stroke:'#684b33','stroke-width':2})+R(-20,-1,40,19,'none',1,{stroke:'#684b33','stroke-width':2})
  +R(-24,-30,48,2,'#fff3d6',0,{opacity:.28})+ball(16,-2,2.6,2.6,'#e3c489'));
 D.define('home/koharuDoorOpen',[24,-38,40,94],
  P('M31,-12l20,26v40l-20,-30z','#1c0e05',{opacity:.3,filter:'url(#b4)'})
  +wood(P('M31,-28l18,24v52l-18,-26z','#96714a'),'v')+P('M34,-18l12,16v36l-12,-17z','#1c0e05',{opacity:.16})+ball(46,22,2.4,2.4,'#e3c489'));
 // コハルの薬草棚・薬草机・思い出の箱（三人の家の真ん中の個室に収まる寸法）
 D.define('home/koharuHerbs',[-38,-126,84,152],
  box(-28,-98,54,13,92,'#ab8b5c','#765a3b',{grain:'v'})+R(-23,-80,44,84,'#3c2b1c',1)
  +jar(-15,-56,'#849d70')+jar(-1,-56,'#c49d60')+jar(13,-56,'#a66f5c')
  +jar(-15,-29,'#b38c68')+jar(-1,-29,'#93a66f')+jar(13,-29,'#7f9a72')
  +cloth(R(-19,-10,16,8,'#778e62',2)+R(1,-10,16,8,'#b5645a',2))+L(-11,-10,-11,-2,'#efe3c8',1.2)+L(9,-10,9,-2,'#efe3c8',1.2)
  +R(-23,-80,44,10,'url(#drop)',0,{opacity:.6})+[-56,-29,-2].map(y=>wood(R(-23,y,44,4,'#aa875a'))+R(-23,y+4,44,5,'url(#drop)',0,{opacity:.5})).join('')
  +pot(10,-88,12,9,'#8d9d6d')+S('M10,-97q-5,-8 -8,-5M10,-97q1,-10 3,-11M10,-97q5,-7 8,-3','#617e4e',2)
  +P('M-20,-96h18v9h-18z','#efe2bb')+S('M-17,-93h12M-17,-90h9','#8a7559',1));
 D.define('home/koharuDesk',[-60,-64,96,108],
  box(-50,-38,68,26,28,'#c3a279','#826242')+drawer(-45,-8,28,11)+drawer(-13,-8,26,11)
  +G(R(-43,-34,36,18,'#efe3c8',1)+L(-25,-33,-25,-17,'#a18a6a',1)+S('M-39,-29h11M-39,-25h9M-22,-29h11M-22,-25h8','#9a8b70',1),{transform:'rotate(-3 -25 -25)'})
  +jar(2,-20,'#90a575')+cyl(11,-34,8,14,'#d7b58c',2)+S('M14,-35q-4,-9 -7,-11M15,-35q4,-9 8,-10','#75945b',1.8)
  +stool(-16,22,'#8d9d6d'));
 D.define('home/koharuBox',[-36,-58,72,72],
  box(-26,-36,52,22,22,'#b18c62','#765a40')+wood(R(-26,-40,52,7,'#c5a579',2))
  +R(-4,-16,8,6,'#d9b867',1.5)+ball(0,-13,1.2,1.2,'#573d2b')
  +G(R(-18,-50,20,13,'#eadbc0',1)+S('M-15,-40q4,-7 8,0t8,0','#8ca477',1.2)+ball(-8,-45,2.2,2.2,'#d19b75'),{transform:'rotate(-6 -8 -43)'})
  +cloth(P('M5,-41q6,-6 12,0q-5,3 -12,0z','#b46a58')));
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
 // --- 診療所の薬棚・診察机・休養ベッド・待合の椅子（一脚は三人の家へ譲った跡）
 D.define('home/clinicHerbs',[-68,-128,136,154],
  box(-56,-102,112,15,96,'#8d6d49','#654b31',{grain:'v'})+R(-50,-84,100,88,'#2e2015',1)
  +[-40,-22,-4,14,32].map((jx,i)=>jar(jx,-60,['#7f9a72','#c49d60','#a66f5c','#6f8fa0','#93a66f'][i])).join('')
  +[-38,-18,2,22].map((jx,i)=>jar(jx,-32,['#b38c68','#849d70','#b0705a',MUSTARD][i])).join('')+cloth(R(32,-42,14,10,'#f2ecde',2))
  +[-42,-14,14].map((bx,i)=>cloth(R(bx,-12,22,10,['#5a827b','#778e62','#b5645a'][i],2))+R(bx+5,-9,12,4,'#fff8e6',1,{opacity:.8})).join('')
  +R(-50,-84,100,10,'url(#drop)',0,{opacity:.6})+[-60,-32,-2].map(y=>wood(R(-50,y,100,4,'#a47f56'))+R(-50,y+4,100,5,'url(#drop)',0,{opacity:.5})).join('')
  +pot(-30,-92,16,11,'#5f8278')+pot(24,-92,14,10,'#a86b4c')+S('M24,-102q-5,-8 -8,-4M24,-102v-10M24,-102q5,-7 8,-3','#617e4e',1.8));
 D.define('home/clinicDesk',[-84,-96,168,136],
  contact(2,18,74,8,.42,'b4')+box(-68,-54,136,42,26,'#c5a476','#856442')+drawer(-60,-22,38,13)+drawer(-18,-22,38,13)+drawer(24,-22,36,13)
  +cloth(R(-62,-50,52,30,'#f5efe1',2))+L(-58,-46,-14,-46,'#5a827b',1.4,{'stroke-dasharray':'3 3'})
  +G(R(-54,-45,32,20,'#fbf5e6',1)+S('M-49,-40h22M-49,-35h18M-49,-30h20','#7d6c55',1.1),{transform:'rotate(-3 -38 -35)'})
  +contact(12,-34,11,4,.38,'b1')+E(12,-38,11,6,'#e8e0cf')+E(12,-40,8,4,'#6d875c')+L(14,-41,23,-51,'#cbbba0',3)
  +jar(34,-34,'#7f9a72')+jar(48,-34,'#b0705a')+cyl(-4,-52,10,14,'#fff0b8',2)+P('M-7,-52l8,-7l8,7z','#5a4a36')
  +chairBack(0,'#7a5a3c','#5a827b'));
 D.define('home/clinicBed',[-62,-136,144,184],
  bed(-38,'#dce6e2','#5a827b','','qcb')+cloth(R(-30,-4,68,18,'#f7f4ec',3))+L(-26,4,34,4,'#5a827b',1.6,{'stroke-dasharray':'4 3'})
  +wood(R(-56,-116,6,132,'#6b4d33',2))+cloth(R(-50,-110,12,112,'#efe8d5',2))+L(-48,-102,-40,-102,'#5a827b',1.5));
 D.define('home/clinicWaiting',[-68,-88,136,120],
  contact(-30,10,22,6,.38,'b2')+chairBack(-32,'#8a6846','#6c8262')+wood(R(-46,-60,28,12,'#9c7850',2)+R(-44,-48,5,24,'#6b4d33',1)+R(-23,-48,5,24,'#6b4d33',1))
  +E(22,-46,18,6,'#1c0e05',{opacity:.09,filter:'url(#b2)'})
  +box(4,-34,46,24,20,'#bc9b6e','#7f5f3e')+cloth(R(10,-32,34,16,'#f1e6cc',1))+mug(20,-24,'#5a827b')+pot(34,-22,12,10,'#b5795e'));
 D.define('home/room',[0,0,1152,768],room());
 D.define('home/koharu-room',[0,0,1152,768],koharuBedroom());
 D.define('home/clinic-room',[0,0,1152,768],clinicRoom());
}
build();

// ---------------------------------------------------------------- キャンバス側（毎フレームの揺らぎ）
const NAMES={homeDesk:'desk',homeBooks:'books',homeMirror:'mirror',homeWardrobe:'wardrobe',homeStove:'stove',homeTable:'table',homeShelf:'shelf',homeSewing:'sewing',homeKoharuDoor:'koharuDoor',homeKoharuBed:'bedK',homeKoharuHerbs:'koharuHerbs',homeKoharuDesk:'koharuDesk',homeKoharuBox:'koharuBox',homeClinicHerbs:'clinicHerbs',homeClinicDesk:'clinicDesk',homeClinicBed:'clinicBed',homeClinicWaiting:'clinicWaiting'};
function glow(c,x,y,r,rgb,a){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function steam(c,x,y,t,k=3){for(let i=0;i<k;i++){const p=(t*.32+i/k)%1,a=.3*(1-p)*Math.min(1,p*5);c.fillStyle=`rgba(255,255,255,${a})`;c.beginPath();c.ellipse(x+Math.sin(t*1.5+i*2.1)*5*p,y-p*30,3+p*7,2.4+p*6,0,0,Math.PI*2);c.fill();}}
function hasChair3(s){const ep=s?.episode;return ep?.chapter===10&&(ep.route==='koharuLove'||(ep.route==='koharu'&&ep.step>=1)||(ep.route==='both'&&ep.step>=3));}
function tableSeats(c,x,y,s){if(!D.ready())return false;D.draw(c,hasChair3(s)?'home/chair3':'home/koharuStool',x-90,y+18);return D.draw(c,'home/tableChairs',x,y);}
function object(c,o,x,y,s,t,layered){
 const name=o.type==='homeBed'?(o.id==='toumaRoom'?'bedT':'bedN'):NAMES[o.type];if(!name||!D.ready())return false;
 const third=!!root.OkaeriCore?.route(s.episode?.route)?.koharu; // 三人で食卓を囲む結末
 if(name==='table'&&!layered)tableSeats(c,x,y,s);
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
function koharuDoor(c,open=true){return D.ready()&&D.draw(c,open?'home/koharuDoorOpen':'home/koharuDoorClosed',552,312);}
function bedKQuilt(c,x,y){return D.ready()&&D.draw(c,'home/bedKQuilt',x,y);}
function background(c){return D.ready()&&D.draw(c,'home/room',0,0);}
function koharuRoom(c){return D.ready()&&D.draw(c,'home/koharu-room',0,0);}
function clinic(c){return D.ready()&&D.draw(c,'home/clinic-room',0,0);}
root.OkaeriHomeArt={workshop:workshopBg,background,koharuRoom,clinic,koharuDoor,bedKQuilt,tableSeats,object,ready:()=>D.ready(),failed:()=>D.failed()};
})(globalThis);
