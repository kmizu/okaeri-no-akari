(function(root){
'use strict';
// 地図。町のまわり（灯りの輪がどこを囲んでいるか）と、世界の中でユキネがどこにあるか。
// 描画エンジン（draw-engine.js）で、古い羊皮紙の地図ふうに組み立てる。会話や戦闘の外で、いつでも開ける。
const D=root.OkaeriDraw;if(!D){root.OkaeriMaps={local:()=>'',world:()=>''};return;}
const {rect:R,ell:E,path:P,stroke:S,line:L,g:G,rng,n}=D;
const INK='#4a3a2a',RED='#a5503c',GOLD='#c9973f',BLUE='#6f9bb0',PAPER='#ecdcb6';
const FONT="'Yu Mincho','Hiragino Mincho ProN','Noto Serif JP',serif";
const label=(x,y,s,size=15,o={})=>`<text x="${x}" y="${y}" font-size="${size}" fill="${o.fill||INK}" text-anchor="${o.anchor||'middle'}" font-family="${FONT}" font-weight="${o.weight||600}" letter-spacing="${o.spacing??1}"${o.rot?` transform="rotate(${o.rot} ${x} ${y})"`:''} paint-order="stroke" stroke="${PAPER}" stroke-width="${o.halo??4}" stroke-linejoin="round">${s}</text>`;
const EXTRA=`<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .02" numOctaves="4" seed="5" result="t"/><feColorMatrix in="t" values="0 0 0 0 .45  0 0 0 0 .30  0 0 0 0 .12  -1.3 0 0 0 .72" result="c"/><feComposite in="c" in2="SourceAlpha" operator="in" result="m"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="m"/></feMerge></filter>
<filter id="rough" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="9" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter>
<radialGradient id="edge" cx=".5" cy=".5" r=".72"><stop offset=".55" stop-color="#5a3a1c" stop-opacity="0"/><stop offset="1" stop-color="#5a3a1c" stop-opacity=".42"/></radialGradient>`;
// ---- 小さな絵
const pine=(x,y,s=1)=>P(`M${x},${y-16*s}l${6*s},${10*s}h${-3*s}l${5*s},${8*s}h${-16*s}l${5*s},${-8*s}h${-3*s}z`,'#5f7f6a',{stroke:INK,'stroke-width':.9})+P(`M${x},${y-16*s}l${4*s},${7*s}q${-4*s},${-2*s} ${-8*s},0z`,'#f6f1e2')+L(x,y+2*s,x,y+5*s,INK,1.2);
function woods(cx,cy,rx,ry,count,seed){const r=rng(seed);let s='';const pts=[];for(let i=0;i<count;i++){const a=r()*Math.PI*2,k=Math.sqrt(r());pts.push([cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k,.7+r()*.5]);}pts.sort((a,b)=>a[1]-b[1]);for(const [x,y,k] of pts)s+=pine(n(x),n(y),k);return s;}
const peak=(x,y,w,h)=>P(`M${x-w},${y}L${x-w*.12},${y-h}L${x+w*.1},${y-h*.86}L${x+w},${y}Z`,'#cdbf9c',{stroke:INK,'stroke-width':1.3,'stroke-linejoin':'round'})+P(`M${x-w*.12},${y-h}L${x+w*.1},${y-h*.86}L${x+w*.34},${y-h*.5}L${x+w*.12},${y-h*.6}L${x-w*.04},${y-h*.44}L${x-w*.24},${y-h*.6}L${x-w*.42},${y-h*.52}Z`,'#fbf8ee')+S(`M${x-w*.12},${y-h}L${x-w*.02},${y-h*.3}M${x+w*.3},${y-h*.44}l${w*.14},${h*.3}`,INK,.8,{opacity:.5});
function range(x0,x1,y,seed,h=46){const r=rng(seed);let back='',front='';for(let x=x0;x<x1;x+=34+r()*14)back+=peak(n(x),n(y-10+r()*8),30+r()*16,h*.8+r()*20);for(let x=x0+16;x<x1;x+=40+r()*16)front+=peak(n(x),n(y+8+r()*8),26+r()*14,h*.6+r()*16);return G(back,{opacity:.8})+front;}
const house=(x,y,s=1,roof='#8a6a52')=>R(x-7*s,y-7*s,14*s,9*s,'#f1e6cb',0,{stroke:INK,'stroke-width':1})+P(`M${x-9*s},${y-7*s}L${x},${y-15*s}L${x+9*s},${y-7*s}Z`,roof,{stroke:INK,'stroke-width':1,'stroke-linejoin':'round'})+R(x-1.5*s,y-3*s,3*s,5*s,INK);
const tower=(x,y,lit,s=1)=>(lit?E(x,y-22*s,18*s,18*s,'#ffcf7a',{opacity:.55,filter:'url(#b4)'}):'')+P(`M${x-6*s},${y}L${x-4*s},${y-20*s}H${x+4*s}L${x+6*s},${y}Z`,'#e9e0c8',{stroke:INK,'stroke-width':1.1})+R(x-5*s,y-27*s,10*s,7*s,lit?'#ffd98a':'#b9c6c8',1,{stroke:INK,'stroke-width':1})+P(`M${x-7*s},${y-27*s}L${x},${y-35*s}L${x+7*s},${y-27*s}Z`,RED,{stroke:INK,'stroke-width':1,'stroke-linejoin':'round'});
const lamp=(x,y,lit=true)=>(lit?E(x,y-8,9,9,'#ffcf7a',{opacity:.6,filter:'url(#b2)'}):'')+L(x,y,x,y-8,INK,1.3)+R(x-3,y-13,6,6,lit?'#ffd98a':'#b9c6c8',1,{stroke:INK,'stroke-width':.9});
const here=(x,y,text='いまここ')=>E(x,y,15,15,'none',{stroke:RED,'stroke-width':2.4,'stroke-dasharray':'5 3'})+P(`M${x},${y-17}l-7,-13h14z`,RED)+label(x,y-34,text,13,{fill:RED,weight:700});
const road=(d,o={})=>S(d,INK,o.w||1.8,{'stroke-dasharray':o.dash||'6 5',opacity:o.o||.8});
const water=(d,w=9)=>S(d,INK,w+2.4,{opacity:.55})+S(d,'#a9c9d6',w)+S(d,'#e8f3f4',w*.3,{'stroke-dasharray':'10 12',opacity:.8});
function compass(x,y){return G(E(0,0,26,26,'none',{stroke:INK,'stroke-width':1})+E(0,0,20,20,'none',{stroke:INK,'stroke-width':.6,'stroke-dasharray':'2 3'})+P('M0,-32L6,0L0,6L-6,0Z',RED,{stroke:INK,'stroke-width':.8})+P('M0,32L6,0L0,-6L-6,0Z','#f1e6cb',{stroke:INK,'stroke-width':.8})+P('M-26,0L0,-5L0,5ZM26,0L0,-5L0,5Z',INK,{opacity:.7})+label(0,-38,'北',13,{halo:3}),{transform:`translate(${x},${y})`});}
function frame(w,h,title,sub,body){
 return D.doc(w,h,EXTRA+G(R(0,0,w,h,PAPER,10),{filter:'url(#paper)'})+body
  +R(0,0,w,h,'url(#edge)',10)+R(10,10,w-20,h-20,'none',6,{stroke:INK,'stroke-width':2})+R(15,15,w-30,h-30,'none',4,{stroke:INK,'stroke-width':.7})
  +G(R(-150,-24,300,40,PAPER,4,{stroke:INK,'stroke-width':1.4})+label(0,3,title,21,{weight:700,spacing:5,halo:0}),{transform:`translate(${w/2},48)`})+(sub?label(w/2,h-30,sub,12,{weight:500,spacing:2}):''));
}

// ---------------------------------------------------------------- 町のまわり
// 位置は、ゲームの出入口の向きに合わせてある（北＝森、東＝水路、西＝丘、南東＝湖の街道）。
const SPOTS={town:[450,330],house:[404,352],forest:[470,150],herbvale:[285,128],canal:[690,300],hill:[185,300],oldpass:[150,170],lake:[640,470],lakeside:[790,520],lampworkshop:[790,520]};
function local(s={}){
 const f=s.flags||{},W=900,H=620;let b='';
 // 北の山並みと、森
 b+=range(40,860,110,31,48)+label(770,128,'北の山々',14,{spacing:4})+label(770,144,'魔獣の棲む所',10,{weight:500,fill:RED});
 b+=woods(470,170,170,70,70,7)+woods(300,150,70,44,22,11)+woods(640,200,60,36,16,17);
 // 丘（西）と、峠の旧道
 b+=G(P('M70,360Q110,250 190,262Q270,250 300,356Q190,388 70,360Z','#d9cba6',{stroke:INK,'stroke-width':1.4})+S('M110,330q40,-36 80,-34M150,350q40,-26 90,-20M210,300q30,-10 50,10',INK,.8,{opacity:.5}),{filter:'url(#rough)'});
 b+=woods(120,420,60,40,14,23);
 // 水路（東）：北東の雪解け水を町へ引く
 b+=water('M860,170Q790,210 760,270T690,318Q600,330 520,334',8)+water('M300,128q30,26 70,30',5);
 // 氷湖（南東）
 b+=G(P('M600,520Q650,440 760,452Q870,450 880,540Q860,600 740,598Q620,600 600,520Z','#b9d5df',{stroke:INK,'stroke-width':1.5})+S('M660,500q40,-10 80,0M700,540q50,-12 100,0M680,570q40,-8 90,2',INK,.7,{opacity:.4}),{filter:'url(#rough)'})+label(760,512,'氷湖',17,{spacing:8,fill:'#3f6a80'});
 // 道
 b+=road('M450,330V200Q452,150 470,124')+road('M450,330Q560,318 690,300')+road('M450,330Q320,322 185,300')+road('M392,170Q330,150 285,128',{dash:'3 5'})+road('M185,290Q150,230 150,170',{dash:'3 5'})+road('M150,170Q90,150 40,160',{dash:'2 6',o:.5})
  +road('M450,330Q540,400 640,470T790,520')+road('M790,520Q820,570 800,612',{dash:'2 6',o:.5});
 // 灯りの輪：森の灯台（北の要）・丘の灯台（西の要）・水路の帰り灯（東）・町の門（南）をつなぐ
 const ring='M470,112C640,120 760,220 720,300C700,400 560,440 450,430C300,430 170,400 170,300C170,200 320,110 470,112Z';
 b+=S(ring,GOLD,7,{opacity:.22,filter:'url(#b4)'})+S(ring,GOLD,2.4,{'stroke-dasharray':'2 7','stroke-linecap':'round'})+label(600,168,'灯りの輪',13,{fill:'#8a6420',rot:24,spacing:4});
 for(const [x,y] of [[560,150],[660,214],[716,352],[620,410],[330,418],[230,376],[210,222],[330,150]])b+=lamp(x,y);
 // 町
 b+=E(450,336,62,40,'#f1e6cb',{stroke:INK,'stroke-width':1.2,'stroke-dasharray':'1 4'});
 b+=house(430,322,1.1)+house(470,318,1.1,'#6f8fa0')+house(482,350,1)+house(404,352,.9,RED)+house(446,356,.8);
 b+=label(450,392,'ユキネ',20,{weight:700,spacing:6})+label(404,372,'三人の家',10,{weight:500,fill:RED,halo:3});
 // 各所
 b+=tower(470,124,!!f.lit,1.1)+label(470,84,'森の灯台',13)+label(470,98,'北の要',10,{fill:RED,weight:500})+label(520,236,'粉ひきの森',16,{spacing:5})+house(410,176,.8)+label(380,196,'休憩小屋',10,{weight:500})+label(392,246,'白樺の待ち場',10,{weight:500});
 b+=house(285,128,.9,'#7f9a72')+label(285,104,'薬草の谷',14)+label(285,152,'温め草の畑',10,{weight:500,fill:'#5f7a4c'});
 b+=tower(185,290,!!f.hillLit,1.1)+label(185,246,'丘の灯台',13)+label(185,260,'西の要',10,{fill:RED,weight:500})+label(190,326,'風待ちの丘',16,{spacing:5})+house(240,318,.8);
 b+=label(150,150,'峠の旧道',13)+E(150,172,5,5,'#cdbf9c',{stroke:INK,'stroke-width':1})+label(64,146,'丘向こうの',10,{weight:500})+label(64,160,'集落へ',10,{weight:500});
 b+=lamp(690,298,!!f.waterLit)+R(676,300,10,12,'#cdbf9c',1,{stroke:INK,'stroke-width':1})+label(700,278,'共同水路',15,{spacing:4})+label(700,326,'水門と帰り灯',10,{weight:500})+label(830,150,'取水口',10,{weight:500});
 b+=label(600,452,'氷湖の旧街道',12,{rot:28})+house(790,516,1,'#6f8fa0')+house(812,524,.8)+label(800,492,'ミナモ',16,{spacing:4})+label(800,548,'渡し場',10,{weight:500})+label(810,602,'カルデ・南の港へ',10,{weight:500,anchor:'end'});
 // いまここ
 const at=SPOTS[s.scene];if(at)b+=here(at[0],at[1]-(s.scene==='town'?30:s.scene==='house'?22:40));
 b+=compass(830,400)+G(L(0,0,90,0,INK,2)+L(0,-4,0,4,INK,1.5)+L(45,-3,45,3,INK,1.2)+L(90,-4,90,4,INK,1.5)+label(45,18,'歩いて半日',11,{weight:500}),{transform:'translate(60,570)'});
 return frame(W,H,'ユキネのまわり','灯りの輪は、町と道を囲んで魔獣を寄せつけない',b);
}

// ---------------------------------------------------------------- 世界
function world(s={}){
 const W=900,H=620;let b='';
 // 海
 b+=G(R(16,16,W-32,H-32,'#c4d9dc',6),{filter:'url(#paper)'});
 for(let i=0;i<34;i++){const r=rng(i+3),x=40+r()*820,y=40+r()*540;b+=S(`M${n(x)},${n(y)}q6,-5 12,0t12,0`,INK,.7,{opacity:.28});}
 // 大陸
 const land='M120,96Q260,40 430,58Q620,36 770,92Q850,150 820,260Q860,350 800,430Q770,520 640,548Q520,596 400,560Q300,580 220,520Q120,470 110,360Q70,260 120,96Z';
 b+=G(P(land,'#5a3a1c',{opacity:.25,transform:'translate(5,7)'})+P(land,PAPER,{stroke:INK,'stroke-width':1.8}),{filter:'url(#rough)'})+G(P(land,PAPER),{filter:'url(#paper)',opacity:.9});
 // 雪の国（一年の半分が雪）
 b+=P('M150,120Q300,70 450,84Q620,66 760,120Q800,190 770,250Q600,300 430,286Q260,300 150,250Q110,190 150,120Z','#fbf8ee',{opacity:.75,filter:'url(#b8)'});
 b+=S('M150,262Q290,304 430,292Q600,306 772,258',BLUE,1.6,{'stroke-dasharray':'8 6'})+label(250,300,'雪線　ここから北は、一年の半分が雪',10,{weight:500,fill:'#3f6a80',rot:7});
 // 山脈
 b+=range(170,760,128,41,56)+label(460,58,'白嶺',22,{weight:700,spacing:14})+label(700,160,'魔獣の棲む山',11,{fill:RED,weight:500});
 // 森と丘
 b+=woods(470,196,70,26,26,5)+woods(330,330,90,40,24,8)+woods(620,380,70,36,18,12)+woods(260,440,60,30,12,15);
 // 氷湖と川
 b+=G(P('M520,286Q560,250 620,262Q680,258 690,310Q670,350 600,346Q530,350 520,286Z','#b9d5df',{stroke:INK,'stroke-width':1.4}),{filter:'url(#rough)'})+label(606,308,'氷湖',14,{fill:'#3f6a80',spacing:5});
 b+=water('M600,346Q590,400 540,440T470,560',6)+water('M690,150Q660,190 640,262',4);
 // 道：ユキネ → ミナモ → カルデ → 南の港
 b+=road('M470,226Q520,250 560,270')+road('M606,346Q560,390 520,430',{dash:'6 5'})+road('M520,430Q500,490 462,540')+road('M470,226Q380,230 300,214',{dash:'3 5'})+road('M520,430Q640,430 720,400',{dash:'3 5',o:.5})+road('M520,430Q400,440 300,470',{dash:'3 5',o:.5});
 // 町
 b+=E(470,222,34,22,'#ffcf7a',{opacity:.5,filter:'url(#b4)'})+E(470,222,24,16,'none',{stroke:GOLD,'stroke-width':2,'stroke-dasharray':'2 5','stroke-linecap':'round'})+house(470,228,1.1,RED)+label(470,256,'ユキネ',18,{weight:700,spacing:5,fill:RED})+label(470,272,'灯りの輪の町',10,{weight:500,fill:'#8a6420'});
 b+=house(300,216,.8)+label(300,196,'丘向こうの集落',11,{weight:500});
 b+=house(574,280,.9,'#6f8fa0')+label(548,266,'ミナモ',13,{anchor:'end'});
 b+=house(510,432,1.2)+house(534,438,1)+house(520,418,.9,'#6f8fa0')+label(520,468,'カルデ',18,{weight:700,spacing:5})+label(520,484,'灯工房と水番の修業場',10,{weight:500})+label(420,412,'カルデ盆地',12,{spacing:4,rot:-8,weight:500});
 b+=house(456,546,1.1,'#6f8fa0')+P('M474,548h16l-3,6h-10z',INK)+L(482,548,482,536,INK,1)+P('M482,537l8,6h-8z','#f1e6cb',{stroke:INK,'stroke-width':.7})+label(410,552,'南の港',15,{spacing:4})+label(730,560,'南の海',15,{fill:'#3f6a80',spacing:8});
 b+=label(730,392,'東の街道',10,{weight:500})+label(286,490,'西の村々',10,{weight:500});
 // 町のまわりの地図の範囲
 b+=R(396,170,236,170,'none',3,{stroke:RED,'stroke-width':1.3,'stroke-dasharray':'5 4'})+label(402,334,'「ユキネのまわり」の範囲',10,{weight:500,fill:RED,anchor:'start',halo:3});
 // いまここ
 const j=['lake','lakeside','lampworkshop'].includes(s.scene);b+=here(j?574:470,j?262:200,j?'いまここ（旅の途中）':'いまここ');
 b+=compass(800,500)+G(L(0,0,110,0,INK,2)+L(0,-4,0,4,INK,1.5)+L(55,-3,55,3,INK,1.2)+L(110,-4,110,4,INK,1.5)+label(55,18,'荷車で三日',11,{weight:500}),{transform:'translate(60,574)'});
 return frame(W,H,'世界の中のユキネ','雪の国の北の端。山のすぐふもと',b);
}
root.OkaeriMaps={local,world,SPOTS};
if(typeof module!=='undefined')module.exports=root.OkaeriMaps;
})(typeof globalThis!=='undefined'?globalThis:this);
