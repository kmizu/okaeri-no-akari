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

root.OkaeriTownArt={house,tree,lantern};
})(globalThis);
