(function(root){
'use strict';
// 雪の町の建物・木・街灯。描画エンジン（draw-engine.js）で組み立てたベクター絵。
// 寸法ごとに必要になったときに登録し、読み込めるまでは world.js の従来の絵が代わりに出る。
const D=root.OkaeriDraw;if(!D){root.OkaeriTownArt={house:()=>false,tree:()=>false,lantern:()=>false};return;}
const {rect:R,ell:E,path:P,stroke:S,line:L,g:G,wood,stone,cloth,shadow,contact,light,cyl,ball,rng,mix,dark,lite,n}=D;
const SNOW='#f4f7f3',SNOWSH='#b9d0dd',SHADE='#1f3a4a';
const pts=a=>'M'+a.map(([x,y])=>n(x)+','+n(y)).join('L')+'Z';
const EXTRA=`<linearGradient id="logsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3d6" stop-opacity=".30"/><stop offset=".45" stop-color="#fff3d6" stop-opacity="0"/><stop offset="1" stop-color="#1c0e05" stop-opacity=".42"/></linearGradient>
<linearGradient id="warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0b860"/><stop offset=".6" stop-color="#ffe2a0"/><stop offset="1" stop-color="#fff3c8"/></linearGradient>
<linearGradient id="snowsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f1f5f3"/><stop offset="1" stop-color="#c3d8e4"/></linearGradient>
<linearGradient id="roofsnow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef3f2"/><stop offset="1" stop-color="#a9c5d6"/></linearGradient>
<linearGradient id="ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf4f8"/><stop offset="1" stop-color="#9cc3d8" stop-opacity=".55"/></linearGradient>`;

// ふわっとした雪のかたまり（上が明るく、下に青い陰）
function drift(cx,cy,rx,ry){return E(cx+3,cy+ry*.5,rx,ry*.8,SHADE,{opacity:.16,filter:'url(#b2)'})+E(cx,cy,rx,ry,'url(#snowsh)')+E(cx-rx*.25,cy-ry*.35,rx*.5,ry*.3,'#fff',{opacity:.7,filter:'url(#b1)'});}
function icicles(x0,x1,y,seed,max=12){const r=rng(seed);let s='';for(let x=x0+2;x<x1-2;x+=3+r()*5){const h=3+r()*max,w=1.4+r()*1.6;s+=P(`M${n(x-w)},${y}L${n(x)},${n(y+h)}L${n(x+w)},${y}Z`,'url(#ice)');}return s;}

// ---------------------------------------------------------------- 家
const WALLS={'#657680':['#a8a48a','#7f8573'],'#637b91':['#a7a08a','#807a68'],'#748ca0':['#b0a68e','#877f6a']};
function houseBody(w,h,roof){
 const r=rng(w*7+h*13),d=Math.min(36,w*.2),rise=d*.62,eave=48,base=h,[wall,wallD]=WALLS[roof]||['#b89a74','#8b7057'];
 const ridge=[w*.43,-24],a=[-16,eave],b=[w+15,eave],back=[ridge[0]+d,ridge[1]-rise],far=[b[0]+d,b[1]-rise];
 const timber='#5a4a3a',trim='#4a5a56';
 let s=EXTRA;
 // 地面に落ちる影
 s+=P(pts([[8,base],[w,base],[w+d+62,base+22],[56,base+40]]),SHADE,{opacity:.26,filter:'url(#b4)'})+E(w*.5,base+6,w*.6,12,SHADE,{opacity:.2,filter:'url(#b4)'});
 // 奥へ引く側面の壁と土台
 let side='';for(let yy=eave;yy<base-20;yy+=15)side+=P(pts([[w,yy],[w+d,yy-rise],[w+d,yy-rise+15],[w,yy+15]]),mix(wallD,'#3a3028',.25+(yy/15%2)*.08));
 s+=wood(side)+P(pts([[w,eave],[w+d,eave-rise],[w+d,base-rise],[w,base]]),'#1c0e05',{opacity:.22})
  +stone(P(pts([[w+5,base-20],[w+5+d,base-20-rise],[w+5+d,base+4-rise],[w+5,base+4]]),'#56676c'));
 // 石積みの土台
 let st='';for(let row=0;row<2;row++){let x=-5-(row?9:0);while(x<w+5){const sw=16+r()*14,x0=Math.max(-5,x),x1=Math.min(w+5,x+sw);if(x1-x0>3)st+=R(x0+.6,base-20+row*12+.6,x1-x0-1.2,10.8,['#8d9a97','#7c8a88','#9aa6a1','#84918f'][Math.floor(r()*4)],3);x+=sw;}}
 s+=R(-5,base-20,w+10,24,'#4f5f63',2)+stone(st)+R(-5,base-20,w+10,24,'url(#fsh)',2,{opacity:.6})+R(-5,base-20,w+10,1.4,'#fff',0,{opacity:.3});
 // 丸太の壁：一段ずつ色が違い、上が明るく下が陰になる
 let logs='',lsh='';for(let yy=eave,i=0;yy<base-20;yy+=15,i++){const hh=Math.min(15,base-20-yy);logs+=R(0,yy,w,hh,mix(wall,wallD,r()*.55));lsh+=R(0,yy,w,hh,'url(#logsh)')+R(0,yy+hh-1.2,w,1.2,'#1c0e05',0,{opacity:.4});
  if(r()<.6){const kx=12+r()*(w-24);lsh+=E(kx,yy+7,3.4,1.8,'#3a2a1c',{opacity:.4});}}
 s+=wood(logs)+lsh;
 for(const px of [2,w*.5-3,w-9])s+=wood(R(px,eave,7,h-68,timber,1),'v')+R(px,eave,7,h-68,'url(#cyl)',1,{opacity:.45});
 s+=R(0,eave,w,20,'url(#drop)',0,{opacity:.75});
 // 妻壁（縦板）と屋根裏の丸窓
 const gab=pts([[4,eave-3],[ridge[0],-12],[w-4,eave-3]]);
 s+=`<clipPath id="gab"><path d="${gab}"/></clipPath>`+wood(P(gab,mix(wall,wallD,.35)),'v');
 let gl='';for(let x=10;x<w-6;x+=11)gl+=R(x,-14,1.3,eave+12,'#1c0e05',0,{opacity:.28})+R(x+1.3,-14,.9,eave+12,'#fff3d6',0,{opacity:.12});
 s+=G(gl+P(pts([[4,eave-3],[ridge[0],-12],[w-4,eave-3],[w-4,eave-22],[ridge[0],-30],[4,eave-22]]),'#1c0e05',{opacity:.22,filter:'url(#b4)'}),{'clip-path':'url(#gab)'});
 s+=wood(R(0,eave-6,w,7,timber,1))+R(0,eave-6,w,1.4,'#fff3d6',0,{opacity:.3})+wood(R(ridge[0]-3,-12,6,eave+6,timber),'v');
 if(w>145){const ax=ridge[0],ay=eave-26;s+=light(ax,ay,30,'#ffd48a',.5)+E(ax,ay,15,17,trim)+E(ax,ay,11,13,'url(#warm)')+R(ax-11,ay-1,22,2,'#6a5a40')+R(ax-1,ay-13,2,26,'#6a5a40')+E(ax,ay,15,17,'none',{stroke:'#fff3d6','stroke-opacity':.25,'stroke-width':1});}
 // 屋根の右の面：板葺きに雪が積もっている
 const plane=pts([ridge,back,far,b]);
 s+=`<clipPath id="pl"><path d="${plane}"/></clipPath>`+P(plane,mix(roof,'#2a3a44',.25));
 let sh='';for(let i=1;i<9;i++){const t=i/9;sh+=L(ridge[0]+(b[0]-ridge[0])*t,ridge[1]+(b[1]-ridge[1])*t,back[0]+(far[0]-back[0])*t,back[1]+(far[1]-back[1])*t,'#16242c',1.2,{opacity:.5});}
 s+=G(sh+P(pts([[ridge[0]+2,ridge[1]-6],[back[0],back[1]-6],[far[0]+4,far[1]-12],[b[0]-10,b[1]-22]]),'url(#roofsnow)',{filter:'url(#b1)'})
   +[.22,.48,.74].map(t=>E(ridge[0]+(b[0]-ridge[0])*t+d*.5,ridge[1]+(b[1]-ridge[1])*t-rise*.5-4,d*.42,5,'#fff',{opacity:.55,filter:'url(#b2)'})).join(''),{'clip-path':'url(#pl)'});
 s+=P(pts([b,far,[far[0],far[1]+7],[b[0],b[1]+7]]),dark(roof,.45))+icicles(b[0]+2,far[0],b[1]-rise*.5+3,w+3,8);
 // 破風板と、その上に厚く乗った雪
 s+=P(pts([[-9,eave+1],[w+8,eave+1],[w+8,eave+15],[-9,eave+15]]),SHADE,{opacity:.3,filter:'url(#b2)'});
 s+=S(`M${a[0]+8},${a[1]}L${ridge[0]},${ridge[1]+6}L${b[0]-8},${b[1]}`,trim,8)+S(`M${a[0]+8},${a[1]-2}L${ridge[0]},${ridge[1]+4}L${b[0]-8},${b[1]-2}`,'#fff3d6',1,{opacity:.25});
 const lump=(p,q,k)=>{let o='';for(let i=1;i<k;i++){const t=i/k,x=p[0]+(q[0]-p[0])*t,y=p[1]+(q[1]-p[1])*t;o+=`L${n(x-3)},${n(y+2.5+r()*3)}Q${n(x)},${n(y+5+r()*4)} ${n(x+3)},${n(y+2.5+r()*3)}`;}return o;};
 const under=`M${a[0]-3},${a[1]+3}`+lump([a[0],a[1]+2],[ridge[0],ridge[1]+2],7)+`L${ridge[0]},${ridge[1]+3}`+lump([ridge[0],ridge[1]+2],[b[0],b[1]+2],9)+`L${b[0]+3},${b[1]+3}`;
 const cap=under+`L${b[0]+4},${b[1]-9}Q${(ridge[0]+b[0])/2+6},${(ridge[1]+b[1])/2-17} ${ridge[0]+2},${ridge[1]-13}Q${(ridge[0]+a[0])/2-6},${(ridge[1]+a[1])/2-17} ${a[0]-5},${a[1]-9}Z`;
 s+=P(cap,SHADE,{opacity:.25,transform:'translate(0,4)',filter:'url(#b2)'})+P(cap,'url(#snowsh)',{stroke:SNOW,'stroke-width':2,'stroke-linejoin':'round'})
  +S(`M${a[0]},${a[1]-8}Q${(ridge[0]+a[0])/2-5},${(ridge[1]+a[1])/2-15} ${ridge[0]+1},${ridge[1]-11}Q${(ridge[0]+b[0])/2+5},${(ridge[1]+b[1])/2-15} ${b[0]},${b[1]-8}`,'#fff',2.4,{opacity:.9})
  +P(pts([[ridge[0]+2,ridge[1]-12],[back[0]+2,back[1]-11],[back[0]+4,back[1]-4],[ridge[0]+4,ridge[1]-4]]),'#dbe8ee')
  +icicles(a[0]+2,a[0]+34,a[1]+3,w+1)+icicles(b[0]-36,b[0]-2,b[1]+3,w+2);
 // 煙突（煉瓦、雪の帽子）
 const cx=w*.68;let br='';for(let row=0;row<5;row++)for(let i=-1;i<3;i++){const bx=cx+i*9+(row%2?4.5:0),x0=Math.max(cx,bx),x1=Math.min(cx+17,bx+8.4);if(x1>x0)br+=R(x0,-25+row*8,x1-x0,7.2,['#8a5f4e','#7a5446','#96695a'][Math.floor(r()*3)],1);}
 s+=P(pts([[cx+17,-25],[cx+27,-31],[cx+27,6],[cx+17,14]]),'#4a3a36')+R(cx,-25,17,39,'#5a463e')+stone(br)+R(cx,-25,17,39,'url(#cyl)',0,{opacity:.4})
  +P(`M${cx-4},-23Q${cx+8},-36 ${cx+22},-25L${cx+31},-31Q${cx+20},-41 ${cx+6},-33Z`,'#dbe8ee')+P(`M${cx-4},-22Q${cx+9},-35 ${cx+22},-24Q${cx+9},-19 ${cx-4},-22Z`,SNOW);
 // 窓：暖かい明かり、よろい戸、雪の乗った窓台と花箱
 const wy=eave+21,wh=Math.min(31,h*.24),ww=Math.min(30,w*.19);
 for(const wx of [w*.12,w*.73]){
  s+=light(wx+ww/2,wy+wh/2,46,'#ffcf7a',.42);
  for(const sx of [wx-13,wx+ww+4]){s+=R(sx,wy-3,9,wh+6,'#5d7268',1.5)+R(sx,wy-3,9,wh+6,'url(#cyl)',1.5,{opacity:.35});for(let yy=wy+1;yy<wy+wh;yy+=4.5)s+=R(sx+1.2,yy,6.6,1.4,'#1c0e05',0,{opacity:.3})+R(sx+1.2,yy+1.4,6.6,.8,'#fff',0,{opacity:.18});}
  s+=wood(R(wx-4,wy-4,ww+8,wh+8,'#4a5a56',2),'v')+R(wx,wy,ww,wh,'url(#warm)',1)
   +P(`M${wx},${wy}h${ww*.34}q-2,${wh*.6} ${-ww*.3},${wh*.8}z`,'#e8c9a8',{opacity:.9})+P(`M${wx+ww},${wy}h${-ww*.34}q2,${wh*.6} ${ww*.3},${wh*.8}z`,'#d9b594',{opacity:.9})
   +R(wx+ww/2-1.5,wy,3,wh,'#6a5a40')+R(wx,wy+wh/2-1.2,ww,2.4,'#6a5a40')+R(wx,wy,ww,5,'url(#drop)',0,{opacity:.5})+R(wx,wy,ww,wh,'url(#glass)',1,{opacity:.25})
   +wood(R(wx-7,wy+wh+4,ww+14,9,'#6a5440',2))+[0,1,2,3].map(i=>ball(wx-2+i*(ww+4)/3,wy+wh+3,3.4,3,['#b5645a','#6f8f5a','#d9a94e','#6f8f5a'][i])).join('')
   +P(`M${wx-9},${wy+wh+5}q${ww/2+9},-8 ${ww+18},0q-${ww/2+9},4 -${ww+18},0z`,SNOW)+icicles(wx-6,wx+ww+6,wy+wh+13,wx*3+w,5);
 }
 // 戸口：板戸、小窓、リース、庇、段、戸口の灯り
 const dx=w*.5,doorH=Math.min(50,h*.4),dy=base-doorH-14;
 s+=R(dx-18,dy-2,36,doorH+2,trim,2)+wood(R(dx-13,dy+3,26,doorH-3,'#7d6a50',1),'v')+[-6.5,0,6.5].map(o=>R(dx+o-.6,dy+3,1.2,doorH-3,'#1c0e05',0,{opacity:.3})).join('')
  +R(dx-13,dy+3,26,doorH-3,'url(#fsh)',1)+R(dx-13,dy+9,11,2.6,'#2a2f2c',1)+R(dx-13,base-28,11,2.6,'#2a2f2c',1)+ball(dx+8,base-33,2.4,2.6,'#e3c489');
 if(h>120){
  s+=R(dx-7,dy+8,14,9,'url(#warm)',1)+R(dx-.8,dy+8,1.6,9,'#5f6250')+E(dx,dy+27,7,7,'none',{stroke:'#5f7f5a','stroke-width':4,'stroke-dasharray':'2.4 1.2'})+P(`M${dx-3},${dy+32}l-2,7l5,-3l4,4l-1,-8z`,'#b5544a')
   +S(`M${dx-23},${dy}v17l12,-15M${dx+24},${dy}v17l-12,-15`,'#4f5a4c',4)
   +P(pts([[dx-30,dy+1],[dx-21,dy-16],[dx+27,dy-16],[dx+37,dy+1]]),dark(roof,.3))+P(`M${dx-33},${dy-1}L${dx-22},${dy-21}Q${dx+3},${dy-27} ${dx+27},${dy-21}L${dx+40},${dy-1}Q${dx+3},${dy+5} ${dx-33},${dy-1}Z`,'url(#snowsh)')+icicles(dx-28,dx+34,dy+1,w+9,6)
   +light(dx+45,dy+18,34,'#ffcf7a',.5)+S(`M${dx+38},${dy+6}h7v5`,'#3a4a46',2)+P(`M${dx+39},${dy+12}l6,-4l6,4z`,'#3a4a46')+R(dx+40.5,dy+12,9,12,'url(#warm)',1)+R(dx+40.5,dy+12,9,12,'none',1,{stroke:'#3a4a46','stroke-width':1.5});
 }
 s+=stone(R(dx-27,base-10,54,8,'#a9b9ba',2)+R(dx-32,base-2,64,8,'#9cb0b8',2))+R(dx-27,base-10,54,2,SNOW,1)+R(dx-32,base-2,64,2,SNOW,1)+R(dx-32,base+4,64,3,SHADE,0,{opacity:.25});
 // 土台に寄りかかる雪だまり
 s+=drift(12,base+3,26,8)+drift(w-20,base+3,24,8)+drift(w*.3,base+5,18,5)+drift(w+d*.5+8,base-rise*.5+2,16,6);
 return s;
}
function house(c,x,y,w,h,roof){
 const name=`town/house-${w}x${h}-${roof}`,ok=D.want(name,[-50,-80,w+170,h+140],()=>houseBody(w,h,roof));
 return ok&&D.draw(c,name,x,y);
}

// ---------------------------------------------------------------- 木（雪をかぶった針葉樹）
function treeBody(v){
 const r=rng(40+v*17),tiers=4+(v%2),greens=['#2c5a52','#33665a','#27504c'];let s=EXTRA;
 s+=P('M-12,2L22,-4L96,30L44,42Z',SHADE,{opacity:.2,filter:'url(#b4)'})+E(6,6,38,11,SHADE,{opacity:.22,filter:'url(#b4)'});
 s+=wood(R(-5.5,-42,11,46,'#6e5a46',2),'v')+R(-5.5,-42,11,46,'url(#cyl)',2,{opacity:.6});
 for(let i=0;i<tiers;i++){
  const t=i/(tiers-1),yy=-14-i*(96/tiers),w=44-i*(30/(tiers-1)),peak=yy-52+t*10,lean=(r()-.5)*4,g1=greens[(i+v)%3];
  // 枝の層：裾がいくつもの房に分かれて垂れる
  const k=5;let d=`M${lean},${n(peak)}C${n(w*.35)},${n(peak+18)} ${n(w*.8)},${n(yy-16)} ${n(w)},${n(yy)}`;
  for(let j=0;j<k;j++){const x0=w-(2*w)*(j/k),x1=w-(2*w)*((j+1)/k),dip=7+r()*5;d+=`Q${n((x0+x1)/2)},${n(yy+dip)} ${n(x1)},${n(yy-(j===k-1?0:2+r()*3))}`;}
  d+=`C${n(-w*.8)},${n(yy-16)} ${n(-w*.35)},${n(peak+18)} ${lean},${n(peak)}Z`;
  s+=P(d,SHADE,{opacity:.25,transform:'translate(2,5)',filter:'url(#b2)'})+P(d,g1)
   +P(`M${lean},${n(peak)}C${n(w*.35)},${n(peak+18)} ${n(w*.8)},${n(yy-16)} ${n(w)},${n(yy)}Q${n(w*.5)},${n(yy+10)} ${n(w*.12)},${n(yy+6)}Q${n(w*.2)},${n(yy-22)} ${lean},${n(peak)}Z`,'#0e2028',{opacity:.38});
  for(let j=0;j<6;j++){const bx=-w*.8+r()*w*1.5,by=yy-4-r()*18;s+=S(`M${n(bx)},${n(by)}q3,5 1,10`,'#16303a',1.2,{opacity:.35});}
  // 雪：光の当たる左肩に厚く、下に青い陰
  const H=yy-peak,sn=`M${lean},${n(peak-2)}C${n(w*.2)},${n(peak+10)} ${n(w*.4)},${n(peak+H*.34)} ${n(w*.5)},${n(peak+H*.5)}Q${n(w*.32)},${n(peak+H*.42)} ${n(w*.17)},${n(peak+H*.6)}Q${n(w*.02)},${n(peak+H*.44)} ${n(-w*.15)},${n(peak+H*.64)}Q${n(-w*.3)},${n(peak+H*.5)} ${n(-w*.46)},${n(peak+H*.7)}Q${n(-w*.56)},${n(peak+H*.56)} ${n(-w*.66)},${n(peak+H*.72)}C${n(-w*.46)},${n(peak+H*.4)} ${n(-w*.2)},${n(peak+10)} ${lean},${n(peak-2)}Z`;
  s+=P(sn,SNOWSH,{transform:'translate(1.5,3)'})+P(sn,'url(#snowsh)')+S(`M${lean},${n(peak-1)}C${n(-w*.2)},${n(peak+11)} ${n(-w*.46)},${n(peak+H*.42)} ${n(-w*.64)},${n(peak+H*.7)}`,'#fff',1.6,{opacity:.85});
  for(const [fx,fy,fr] of [[-.78,.9,.2],[-.3,.93,.16],[.22,.95,.15],[.68,.9,.13]])s+=E(n(w*fx),n(peak+H*fy),n(w*fr),3.2,'url(#snowsh)')+E(n(w*fx),n(peak+H*fy+2.6),n(w*fr*.9),1.6,'#0e2028',{opacity:.25});
 }
 return s;
}
function tree(c,x,y,s){
 const v=Math.abs(Math.round(x*7+y*13))%3,name='town/tree'+v;
 return D.want(name,[-58,-176,166,226],()=>treeBody(v),2)&&D.draw(c,name,x,y,s);
}

// ---------------------------------------------------------------- 街灯（帰り灯）
function lanternBody(lit){
 let s=EXTRA+P('M-2,6L10,3L46,18L26,24Z',SHADE,{opacity:.2,filter:'url(#b2)'})+E(8,8,20,6,SHADE,{opacity:.22,filter:'url(#b2)'});
 if(lit)s+=light(20,-16,62,'#ffcf7a',.5)+E(22,6,17,5,'#ffdc80',{opacity:.25,filter:'url(#b2)'});
 s+=cyl(-5,-40,8,46,'#5a6a60',2)+drift(-1,5,9,3.4)+S('M-1,-37h21v8','#3f524c',3)+S('M-1,-30l9,-7','#3f524c',2)
  +P('M8,-28L20,-38L33,-28Z','#3a4a46')+P('M6,-28Q20,-44 35,-28Q20,-33 6,-28Z','url(#snowsh)')
  +R(11,-28,18,22,'#2f3f3b',2)+R(13.5,-25.5,13,16,lit?'url(#warm)':'#7f9fad',1)+R(19.2,-25.5,1.6,16,'#3a4a46')+R(13.5,-25.5,13,16,'url(#glass)',1,{opacity:.4})
  +(lit?E(20,-16,2.6,5,'#fff8dc',{filter:'url(#b1)'}):'')+R(10,-7,20,3,'#3a4a46',1);
 return s;
}
function lantern(c,x,y,lit){const name='town/lantern'+(lit?1:0);return D.want(name,[-70,-84,180,116],()=>lanternBody(lit))&&D.draw(c,name,x,y);}

// ---------------------------------------------------------------- 地面と道
// 雪面の吹きだまりの陰、踏み固めた道（縁はゆらぎ、土手の影つき）、足あと。
const GROUND=`<filter id="drift" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".005 .013" numOctaves="3" seed="21"/><feColorMatrix values="0 0 0 0 .30  0 0 0 0 .47  0 0 0 0 .60  -1.5 0 0 0 .86"/></filter>
<filter id="glint" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="1" seed="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  9 0 0 0 -6.1"/></filter>
<filter id="wob" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="2" seed="4" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="16" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="pack" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".05 .09" numOctaves="3" seed="8" result="t"/><feColorMatrix in="t" values="0 0 0 0 .55  0 0 0 0 .66  0 0 0 0 .72  -1.4 0 0 0 .78" result="c"/><feComposite in="c" in2="SourceAlpha" operator="in" result="m"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="m"/></feMerge></filter>`;
function groundBody(scene,paths,lift){
 const bank=scene==='hill'?'#7894a6':'#93b2c2',st=(col,w,a)=>paths.map(([p,pw])=>S('M'+p.map(q=>q.join(',')).join('L'),col,Math.max(2,pw+w),a)).join('');
 const plaza=scene==='town'?E(600,475,165,112,'#eef2ea'):'',plazaIn=scene==='town'?E(600,475,150,99,'#e7ebe1'):'';
 let s=GROUND;
 if(scene!=='hill')s+=R(0,0,1152,768,'#fff',0,{filter:'url(#drift)'});
 s+=G(G(st('#2f536c',16)+(plaza&&E(600,475,173,120,'#2f536c')),{transform:`translate(9,${lift})`,opacity:.26,filter:'url(#b4)'})
   +G(st(bank,8)+(plaza&&E(600,475,169,116,bank)),{transform:`translate(3,${n(lift*.6)})`})
   +st('#cfe0e6',7)+(plaza&&E(600,475,168,115,'#cfe0e6'))+st('#f1f4ee',0)+plaza,{filter:'url(#wob)'});
 s+=G(G(st('#e7ebe1',-26)+plazaIn,{filter:'url(#wob)'}),{filter:'url(#pack)'})+G(st('#ffffff',-70),{filter:'url(#b8)',opacity:.35});
 // 足あと（道の中心線の左右に、点々と）
 for(const [dx,dy,off] of [[-9,-6,0],[10,7,9]])s+=G(G(st('#9fb9c6',-1e3,{'stroke-dasharray':'4 21','stroke-dashoffset':off,'stroke-width':3,opacity:.32}),{transform:`translate(${dx},${dy})`}),{filter:'url(#wob)'});
 s+=R(0,0,1152,768,'#fff',0,{filter:'url(#glint)',opacity:.8});
 return s;
}
function ground(c,scene,paths,lift){const name='ground/'+scene;return D.want(name,[0,0,1152,768],()=>groundBody(scene,paths,lift))&&D.draw(c,name,0,0);}

// ---------------------------------------------------------------- 町の小物（井戸・粉の荷車・薪の山とそり・柵・旗）
function logPile(x,y,cols,rows,seed){let s='';const r=rng(seed);for(let j=0;j<rows;j++)for(let i=0;i<cols-j;i++){const cx=x+i*11.4+j*5.7,cy=y-j*9.6,rr=5.2+r();
  s+=E(cx+1,cy+1.6,rr,rr,'#1c0e05',{opacity:.35})+E(cx,cy,rr,rr,'#6a513a')+E(cx,cy,rr-1.5,rr-1.5,mix('#d9b784','#c29a66',r()))+E(cx,cy,rr-3.1,rr-3.1,'none',{stroke:'#a37a4c','stroke-width':.8})+E(cx,cy,.9,.9,'#8a6238');}return s;}
function wheel(x,y,r0){let s=E(x+2,y+r0,r0,3.5,SHADE,{opacity:.3,filter:'url(#b2)'})+E(x,y,r0,r0,'none',{stroke:'#4a3c2e','stroke-width':5.5})+E(x,y,r0+1.6,r0+1.6,'none',{stroke:'#2a2420','stroke-width':1.4})+E(x,y,r0-2.6,r0-2.6,'none',{stroke:'#7a6850','stroke-width':1});
 for(let i=0;i<8;i++){const a=i*Math.PI/4;s+=L(x,y,x+Math.cos(a)*(r0-3),y+Math.sin(a)*(r0-3),'#6a5842',2.2);}return s+ball(x,y,3.6,3.6,'#8a765c');}
function sack(x,y,c){return E(x+2,y+7,16,5,'#1c0e05',{opacity:.25,filter:'url(#b2)'})+cloth(P(`M${x-16},${y+6}Q${x-19},${y-9} ${x-7},${y-11}Q${x},${y-15} ${x+7},${y-11}Q${x+19},${y-9} ${x+16},${y+6}Q${x},${y+11} ${x-16},${y+6}Z`,c))+E(x,y-2,16,10,'url(#ball)',{opacity:.5})+S(`M${x-7},${y-11}q7,4 14,0`,'#b8a583',1.4)+P(`M${x-4},${y-12}q4,-6 8,0q-4,2 -8,0z`,dark(c,.15));}
function propsBody(){
 let s=EXTRA,x=456,y=264;
 // 井戸
 s+=P(`M${x-20},${y+8}L${x+30},${y+2}L${x+84},${y+26}L${x+40},${y+34}Z`,SHADE,{opacity:.2,filter:'url(#b4)'})+E(x+4,y+12,40,11,SHADE,{opacity:.24,filter:'url(#b4)'});
 let ring='';const r=rng(77);for(let row=0;row<2;row++)for(let i=0;i<8;i++){const t0=(i+(row?.5:0))/8,px=x-29+58*t0;ring+=R(px,y-9+row*10+Math.sin(t0*Math.PI)*5,7.6,9,['#8d9aa0','#a3afb0','#7f8d93','#98a5a6'][Math.floor(r()*4)],2);}
 s+=`<clipPath id="wl"><path d="M${x-29},${y-10}Q${x},${y+2} ${x+29},${y-10}V${y+8}Q${x},${y+22} ${x-29},${y+8}Z"/></clipPath>`+P(`M${x-29},${y-10}Q${x},${y+2} ${x+29},${y-10}V${y+8}Q${x},${y+22} ${x-29},${y+8}Z`,'#5d6e75')+G(stone(ring),{'clip-path':'url(#wl)'})+P(`M${x-29},${y-10}Q${x},${y+2} ${x+29},${y-10}V${y+8}Q${x},${y+22} ${x-29},${y+8}Z`,'url(#cyl)',{opacity:.5})
  +E(x,y-11,29,10,'#aab6b6')+E(x,y-11,23,7,'#1f3644')+E(x-5,y-12,9,2.2,'#bfe0ea',{opacity:.5})+P(`M${x-30},${y-13}Q${x-16},${y-24} ${x-4},${y-20}Q${x-14},${y-12} ${x-30},${y-13}Z`,'url(#snowsh)');
 for(const dx of [-29,24])s+=cyl(x+dx,y-64,6,56,'#6f5c45',1);
 s+=L(x-26,y-50,x+27,y-50,'#4a3c2e',4.5)+L(x+2,y-50,x+2,y-30,'#cdbd9c',1.4)+cyl(x-5,y-31,14,12,'#8a6f50',2)+E(x+2,y-31,7,2.6,'#6f8f9c')+S(`M${x-5},${y-30}q7,-9 14,0`,'#4a3c2e',1.4)
  +P(pts([[x-40,y-58],[x,y-86],[x+40,y-58],[x+34,y-52],[x-34,y-52]]),'#4f6570')+P(`M${x-43},${y-60}Q${x-20},${y-82} ${x},${y-93}Q${x+20},${y-82} ${x+43},${y-60}Q${x+30},${y-58} ${x+22},${y-64}Q${x+10},${y-60} ${x},${y-70}Q${x-12},${y-60} ${x-22},${y-64}Q${x-32},${y-58} ${x-43},${y-60}Z`,'url(#snowsh)')+icicles(x-36,x+36,y-53,5,7)+drift(x-34,y+10,13,5)+drift(x+36,y+8,11,4);
 // 小麦粉の荷車
 x=714;y=272;
 s+=P(`M${x-50},${y+12}L${x+40},${y+8}L${x+100},${y+30}L${x+10},${y+36}Z`,SHADE,{opacity:.2,filter:'url(#b4)'})
  +S(`M${x-56},${y-6}L${x-90},${y+8}M${x-56},${y-16}L${x-90},${y-1}`,'#6f5c45',4.4)+L(x-90,y-2,x-90,y+9,'#6f5c45',4)
  +wheel(x-34,y+2,15)+sack(x-40,y-34,'#e9dfc8')+sack(x-12,y-36,'#f1e8d2')+sack(x+16,y-34,'#e4d9bf')+sack(x-26,y-51,'#eee4cd')+sack(x+2,y-53,'#e8dec6')
  +P(`M${x-44},${y-58}Q${x-10},${y-72} ${x+22},${y-58}Q${x-10},${y-53} ${x-44},${y-58}Z`,'url(#snowsh)')
  +wood(P(pts([[x-58,y-24],[x+48,y-24],[x+60,y-34],[x+60,y-14],[x+48,y-3],[x-58,y-3]]),'#8f7453'))+R(x-58,y-24,106,21,'url(#fsh)')+P(pts([[x+48,y-24],[x+60,y-34],[x+60,y-14],[x+48,y-3]]),'#1c0e05',{opacity:.3})
  +[0,1,2,3,4,5].map(i=>R(x-52+i*18,y-24,1.4,21,'#1c0e05',0,{opacity:.35})).join('')+R(x-58,y-25,106,2.4,'#5d4d3a')+R(x-58,y-5,106,2.4,'#5d4d3a')+wheel(x+30,y+3,15);
 // 薪の山と、立てかけたそり
 x=792;y=648;
 s+=E(x+8,y+12,44,11,SHADE,{opacity:.24,filter:'url(#b4)'})+logPile(x-28,y+6,6,4,9)+P(`M${x-22},${y-25}Q${x+2},${y-38} ${x+26},${y-25}Q${x+2},${y-19} ${x-22},${y-25}Z`,'url(#snowsh)')
  +S(`M${x+38},${y+10}L${x+52},${y-34}q2,-6 7,-4M${x+48},${y+12}L${x+62},${y-32}q2,-6 7,-4`,'#7b6247',3.6)+[0,1,2,3].map(i=>L(x+40+i*3.4,y+2-i*11,x+51+i*3.4,y+4-i*11,'#a88c66',3)).join('');
 // 柵
 s+=E(520,632,110,7,SHADE,{opacity:.2,filter:'url(#b4)'})+wood(R(412,609,200,5,'#7a6a52',2)+R(412,619,200,5,'#7a6a52',2));
 for(let i=0;i<7;i++){const px=415+i*30;s+=cyl(px,602,18,27,'#8c7a62',2)+P(`M${px-3},604Q${px+9},594 ${px+21},604Q${px+9},608 ${px-3},604Z`,'url(#snowsh)');}
 // 祭りの旗
 s+=S('M360,208Q600,300 817,198','#6d7a70',1.6);for(let i=0;i<9;i++){const t=(i+.5)/9,px=360+457*t,py=208+(1-Math.pow(2*t-1,2))*46-(t-.5)*10;s+=cloth(P(`M${n(px-7)},${n(py)}h14l-7,20z`,['#c8896a','#648c89','#d9b56a'][i%3]));}
 return s;
}
function props(c){return D.want('town/props',[0,0,1152,768],propsBody)&&D.draw(c,'town/props',0,0);}

// ---------------------------------------------------------------- 灯台（森の石造り／丘の白塗り）
function towerBody(kind,lit){
 const hill=kind==='hill',H=hill?112:100,wB=30,wT=22,stoneC=hill?['#d9dfdc','#c9d2d0','#e6eae6','#bfc9c8']:['#a9b3a6','#98a497','#b6bfb0','#8c998d'],r=rng(hill?5:9);
 let s=EXTRA+P(`M-20,6L26,0L${96},${34}L40,44Z`,SHADE,{opacity:.24,filter:'url(#b4)'})+E(4,8,46,14,SHADE,{opacity:.28,filter:'url(#b4)'});
 const body=`M${-wB},4Q0,14 ${wB},4L${wT},${-H}Q0,${-H+7} ${-wT},${-H}Z`;
 let st='';for(let row=0;row<Math.ceil(H/11)+1;row++){const yy=6-row*11;for(let i=-4;i<4;i++){const bx=i*13+(row%2?6.5:0);st+=R(bx,yy-10+Math.abs(bx+6)*.12,12,10,stoneC[Math.floor(r()*4)],2);}}
 s+=`<clipPath id="tw"><path d="${body}"/></clipPath>`+P(body,hill?'#aeb9b9':'#6f7d74')+G(stone(st),{'clip-path':'url(#tw)'})+P(body,'url(#cyl)',{opacity:.62});
 if(hill)s+=G(R(-40,-74,80,16,'#b5544a')+R(-40,-34,80,14,'#b5544a'),{'clip-path':'url(#tw)',opacity:.85})+P(body,'url(#cyl)',{opacity:.3});
 // 扉と小窓
 s+=P('M-10,8V-16Q0,-27 10,-16V8Z','#3a4a46')+wood(P('M-7.5,8V-15Q0,-23 7.5,-15V8Z','#7d6a50'),'v')+ball(4,-4,1.8,1.8,'#e3c489')+P('M-5,-52V-64Q0,-70 5,-64V-52Z','#2a3a3c')+P('M-3.4,-53V-63Q0,-67 3.4,-63V-53Z',lit?'url(#warm)':'#56707c');
 // 回廊と手すり
 s+=E(0,-H+4,wT+12,6,SHADE,{opacity:.35,filter:'url(#b2)'})+P(`M${-wT-11},${-H-2}Q0,${-H+9} ${wT+11},${-H-2}V${-H+4}Q0,${-H+15} ${-wT-11},${-H+4}Z`,hill?'#8c9a9c':'#5d6b62')+E(0,-H-2,wT+11,5.5,hill?'#dfe6e4':'#b9c4b6');
 for(let i=-3;i<=3;i++)s+=L(i*9.6,-H-1+(9-i*i)*.25,i*9.6,-H-13+(9-i*i)*.25,'#3a4a46',1.6);
 s+=S(`M${-wT-9},${-H-14}Q0,${-H-6} ${wT+9},${-H-14}`,'#3a4a46',2.2);
 // 灯室：ガラスの箱と炎
 if(lit)s+=light(0,-H-22,150,'#ffd27a',.5)+light(0,-H-22,60,'#fff0c0',.55);
 s+=R(-15,-H-36,30,34,'#2f3f3b',2)+R(-12,-H-33,24,28,lit?'url(#warm)':'#4f6a78',1)+[-4,4].map(o=>R(o-.9,-H-33,1.8,28,'#2f3f3b')).join('')+R(-12,-H-20,24,1.8,'#2f3f3b')+R(-12,-H-33,24,28,'url(#glass)',1,{opacity:.45})
  +(lit?E(0,-H-18,4,8,'#fff8dc',{filter:'url(#b1)'})+E(0,-H-17,9,11,'#ffe9a0',{opacity:.5,filter:'url(#b2)'}):'');
 // 屋根（雪をかぶった円錐）と風見
 s+=P(`M-22,${-H-34}Q0,${-H-28} 22,${-H-34}L0,${-H-66}Z`,hill?'#8a4a44':'#4f6570')+P(`M-22,${-H-34}Q0,${-H-28} 22,${-H-34}L0,${-H-66}Z`,'url(#cyl)',{opacity:.5})
  +P(`M-25,${-H-35}Q-12,${-H-50} 0,${-H-69}Q12,${-H-50} 25,${-H-35}Q16,${-H-33} 11,${-H-39}Q4,${-H-34} -2,${-H-42}Q-10,${-H-34} -15,${-H-40}Q-20,${-H-33} -25,${-H-35}Z`,'url(#snowsh)')+L(0,-H-68,0,-H-80,'#3a4a46',1.6)+ball(0,-H-81,2.4,2.4,'#e3c489')+icicles(-20,20,-H-33,hill?3:4,6);
 s+=drift(-24,6,20,7)+drift(26,4,17,6)+drift(2,10,14,4);
 return s;
}
// ---------------------------------------------------------------- そのほかの仕掛け
const MISC={
 board:f=>{let s=EXTRA+P('M-22,12L28,8L62,24L16,30Z',SHADE,{opacity:.2,filter:'url(#b2)'})+cyl(-25,-42,6,56,'#796e56',1)+cyl(20,-42,6,56,'#796e56',1)+wood(R(-33,-50,66,46,'#6d5a40',3))+R(-28,-45,56,36,'#a8926a',1)+R(-28,-45,56,6,'url(#drop)',0,{opacity:.5});
  for(let i=0;i<3;i++){const px=-23+i*16.5,py=-36+(i%2)*3;s+=R(px+1.4,py+2,13,19,'#1c0e05',1,{opacity:.3})+R(px,py,13,19,i===1?'#e6cda4':'#f3e6c2',1)+ball(px+6.5,py+2,1.5,1.5,'#b5544a')+[0,1,2].map(k=>L(px+3,py+8+k*3.2,px+10-k,py+8+k*3.2,'#807761',.9)).join('')+(f&&i===1?E(px+7,py+14,3.2,3.2,'none',{stroke:'#4f8a82','stroke-width':1.5}):'');}
  return s+P('M-40,-50Q-20,-60 0,-66Q20,-60 41,-50Q30,-46 22,-51Q12,-46 2,-53Q-10,-46 -20,-51Q-30,-45 -40,-50Z','url(#snowsh)')+icicles(-34,34,-46,6,5)+drift(-22,13,9,3.4)+drift(23,13,9,3.4);},
 basket:()=>EXTRA+E(2,6,18,6,SHADE,{opacity:.25,filter:'url(#b2)'})+S('M-13,-8Q0,-34 13,-8','#7b5a38',3)+P('M-16,-9Q0,-3 16,-9L12,7Q0,12 -12,7Z','#b08a5a')+S('M-14,-5Q0,1 14,-5M-13,0Q0,6 13,0','#7b5a38',1)+S('M-8,-7l2,15M0,-5v16M8,-7l-2,15','#7b5a38',1)+E(0,-9,16,5,'#c9a56e')+cloth(E(0,-10,13,4,'#f0e6cc'))+ball(-5,-12,5,3.4,'#c98a4a')+ball(4,-12,5,3.4,'#d9a45a'),
 log:()=>EXTRA+P('M-22,-36L4,-48L34,48L8,56Z',SHADE,{opacity:.25,filter:'url(#b4)',transform:'translate(10,6)'})+wood(G(R(-12,-48,24,96,'#74624e',11),{transform:'rotate(-14)'}),'v')+G(R(-12,-48,24,96,'url(#cyl)',11,{opacity:.6})+E(0,46,11,5,'#d2b488')+E(0,46,6,2.6,'none',{stroke:'#a37a4c','stroke-width':1})+P('M-11,-46Q-4,-10 -9,40Q-1,38 0,10Q-2,-20 3,-48Q-4,-52 -11,-46Z','url(#snowsh)')+S('M10,-20l12,-9M-10,8l-13,6','#5e4e3c',3.4),{transform:'rotate(-14)'}),
 lens:f=>EXTRA+E(4,10,26,8,SHADE,{opacity:.28,filter:'url(#b2)'})+stone(R(-19,-18,38,28,'#8fa0a3',4))+R(-19,-18,38,28,'url(#cyl)',4,{opacity:.5})+E(0,-18,19,6,'#c5d2d2')+cyl(-2.5,-24,5,8,'#6a5a40',1)
  +(f?light(0,-42,62,'#ffd27a',.5):'')+E(0,-42,25,25,'#3a4a46')+E(0,-42,22,22,'#c9a25c')+E(0,-42,18.5,18.5,f?'url(#warm)':'#bcd8e4')+E(0,-42,18.5,18.5,'url(#glass)',{opacity:.8})+E(0,-42,11,11,'none',{stroke:'#fff','stroke-opacity':.4,'stroke-width':1})+E(0,-42,5,5,'none',{stroke:'#fff','stroke-opacity':.4,'stroke-width':1})+drift(-16,10,10,3.6),
 wind:f=>{let s=EXTRA+P('M-8,60L12,56L44,70L20,76Z',SHADE,{opacity:.22,filter:'url(#b4)'});const r=rng(f?3:8);
  for(let j=0;j<5;j++){const yy=-67+j*26,rot=f?0:(r()-.5)*16,dx=f?0:(r()-.5)*7;s+=G(wood(R(-10,yy,20,23,f?'#a38a66':'#8a8a80',2),'v')+R(-10,yy,20,23,'url(#cyl)',2,{opacity:.45})+R(-3.6,yy,1.2,23,'#1c0e05',0,{opacity:.3})+R(3,yy,1.2,23,'#1c0e05',0,{opacity:.3})+(f?'':P(`M-12,${yy+2}Q0,${yy-7} 12,${yy+2}Q0,${yy+7} -12,${yy+2}Z`,'url(#snowsh)')),{transform:`translate(${n(dx)},0) rotate(${n(rot)} 0 ${yy+11})`});}
  if(f)s+=cyl(-14,-70,5,134,'#6a5842',1)+cyl(9,-70,5,134,'#6a5842',1)+S('M-12,-58L12,56','#d7bd8c',2.6)+S('M-12,-10q12,5 24,0M-12,30q12,5 24,0','#e6d6b0',2)+P('M-15,-70Q0,-80 15,-70Q0,-66 -15,-70Z','url(#snowsh)');
  return s+drift(0,62,16,5);},
 gate:f=>{const up=f?-30:0;return EXTRA+E(4,16,40,9,SHADE,{opacity:.25,filter:'url(#b4)'})+cyl(-36,-52,9,68,'#5b716e',2)+cyl(27,-52,9,68,'#5b716e',2)+wood(R(-36,-58,72,8,'#4a5c58',2))
  +wood(R(-29,-26+up,58,30,f?'#a48b68':'#8a7a62',2),'v')+R(-29,-26+up,58,30,'url(#fsh)',2)+[-14,0,14].map(o=>R(o-.7,-26+up,1.4,30,'#1c0e05',0,{opacity:.3})).join('')+R(-29,-20+up,58,3,'#3a4a46')+R(-29,-4+up,58,3,'#3a4a46')
  +(f?'':P('M-29,4Q0,-4 29,4V8H-29Z','#bfe0ea',{opacity:.7}))+L(0,-50,0,-26+up,'#2f3f3b',2.4)
  +E(0,-52,17,17,'none',{stroke:'#3f524c','stroke-width':4})+[0,1,2,3].map(i=>L(-Math.cos(i*.785)*15,-52-Math.sin(i*.785)*15,Math.cos(i*.785)*15,-52+Math.sin(i*.785)*15,'#5a706a',2)).join('')+ball(0,-52,4,4,'#b6d0d5')+P('M-40,-58Q-20,-68 0,-62Q20,-68 40,-58Q0,-54 -40,-58Z','url(#snowsh)');},
 regulator:f=>{let s=EXTRA+E(6,10,50,9,SHADE,{opacity:.25,filter:'url(#b4)'})+stone(R(-40,-22,80,30,'#849890',4))+R(-40,-22,80,30,'url(#fsh)',4)+R(-40,-36,80,16,'#b9c9c6',4)+R(-40,-36,80,16,'url(#tsh)',4);
  for(let j=0;j<3;j++){const lx=-26+j*26;s+=(f?light(lx,-44,26,'#ffd27a',.55):'')+R(lx-7,-54,14,18,'#2f3f3b',2)+R(lx-5,-52,10,13,f?'url(#warm)':'#7f9fad',1)+P(`M${lx-9},-54L${lx},-61L${lx+9},-54Z`,'#3a4a46')+P(`M${lx-10},-54Q${lx},-66 ${lx+10},-54Q${lx},-57 ${lx-10},-54Z`,'url(#snowsh)');}
  return s+S('M-30,-8h60M-30,0h60','#1c0e05',1,{opacity:.25})+drift(-34,9,12,4)+drift(36,8,11,4);},
 wbeacon:f=>EXTRA+E(6,10,38,9,SHADE,{opacity:.25,filter:'url(#b4)'})+stone(R(-28,-20,56,28,'#849a98',4))+R(-28,-20,56,28,'url(#fsh)',4)+R(-28,-34,56,16,'#c0d2d0',4)+R(-28,-34,56,16,'url(#tsh)',4)
  +(f?light(0,-56,110,'#ffd27a',.5)+light(0,-56,40,'#fff0c0',.5):'')+cyl(-3,-44,6,12,'#3f524c',1)+R(-13,-74,26,32,'#2f3f3b',3)+R(-10,-71,20,25,f?'url(#warm)':'#7f9fad',1)+R(-.9,-71,1.8,25,'#2f3f3b')+R(-10,-71,20,25,'url(#glass)',1,{opacity:.45})+(f?E(0,-57,3.4,7,'#fff8dc',{filter:'url(#b1)'}):'')
  +P('M-17,-74L0,-88L17,-74Z','#3a4a46')+P('M-19,-74Q0,-96 19,-74Q0,-79 -19,-74Z','url(#snowsh)')+drift(-24,9,11,4)+drift(25,8,10,4),
};
const BOX={board:[-52,-80,128,120],basket:[-30,-46,64,66],log:[-60,-70,130,144],lens:[-70,-112,140,136],wind:[-40,-96,100,186],gate:[-60,-90,124,124],regulator:[-66,-80,136,104],wbeacon:[-116,-172,232,196]};
function misc(c,key,flag,x,y){const name=`out/${key}${flag?1:0}`;return D.want(name,BOX[key],()=>MISC[key](flag))&&D.draw(c,name,x,y);}
function object(c,o,x,y,s,t,st){
 const f=s.flags;
 switch(o.type){
  case 'tower':{const name='out/tower-forest'+(st.towerLit?1:0);return D.want(name,[-170,-270,340,330],()=>towerBody('forest',st.towerLit),2)&&D.draw(c,name,x,y);}
  case 'hillBeacon':{const name='out/tower-hill'+(st.beaconLit?1:0);if(!D.want(name,[-170,-290,340,350],()=>towerBody('hill',st.beaconLit),2))return false;
   if(st.beaconLit){const g=c.createLinearGradient(x,0,x-660,0);g.addColorStop(0,'rgba(255,232,174,.34)');g.addColorStop(1,'rgba(255,232,174,0)');c.fillStyle=g;c.beginPath();c.moveTo(x-10,y-142);c.lineTo(x-660,y-96-Math.sin(t*.6)*10);c.lineTo(x-660,y-6+Math.sin(t*.6)*10);c.lineTo(x-10,y-126);c.fill();}
   return D.draw(c,name,x,y);}
  case 'board':return misc(c,'board',!!f.board,x,y);
  case 'basket':return misc(c,'basket',0,x,y);
  case 'log':return misc(c,'log',0,x,y);
  case 'hillLens':return misc(c,'lens',!!f.hillLens,x,y);
  case 'windbreak':return misc(c,'wind',!!f.windbreak,x,y);
  case 'waterGate':return misc(c,'gate',!!f.waterGate,x,y);
  case 'regulator':return misc(c,'regulator',!!f.waterFlow,x,y);
  case 'waterBeacon':return misc(c,'wbeacon',!!f.waterLit,x,y);
 }
 return false;
}
root.OkaeriTownArt={house,tree,lantern,ground,props,object};
})(globalThis);
