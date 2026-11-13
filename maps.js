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
 b+=house(285,128,.9,'#7f9a72')+label(285,104,'薬草の谷',14)+label(285,152,'薬草の畑',10,{weight:500,fill:'#5f7a4c'});
 b+=tower(185,290,!!f.hillLit,1.1)+label(185,246,'丘の灯台',13)+label(185,260,'西の要',10,{fill:RED,weight:500})+label(190,326,'風待ちの丘',16,{spacing:5})+house(240,318,.8);
 b+=label(150,150,'峠の旧道',13)+E(150,172,5,5,'#cdbf9c',{stroke:INK,'stroke-width':1})+label(64,146,'丘向こうの',10,{weight:500})+label(64,160,'集落へ',10,{weight:500});
 b+=lamp(690,298,!!f.waterLit)+R(676,300,10,12,'#cdbf9c',1,{stroke:INK,'stroke-width':1})+label(700,278,'共同水路',15,{spacing:4})+label(700,326,'水門と帰り灯',10,{weight:500})+label(830,150,'取水口',10,{weight:500});
 b+=label(600,452,'氷湖の旧街道',12,{rot:28})+house(790,516,1,'#6f8fa0')+house(812,524,.8)+label(800,492,'ミナモ',16,{spacing:4})+label(800,548,'渡し場',10,{weight:500})+label(810,602,'カルデ・南の港へ',10,{weight:500,anchor:'end'});
 // いまここ
 const at=SPOTS[s.scene];if(at)b+=here(at[0],at[1]-(s.scene==='town'?30:s.scene==='house'?22:40));
 b+=compass(830,400)+G(L(0,0,90,0,INK,2)+L(0,-4,0,4,INK,1.5)+L(45,-3,45,3,INK,1.2)+L(90,-4,90,4,INK,1.5)+label(45,18,'歩いて半日',11,{weight:500}),{transform:'translate(60,570)'});
 return frame(W,H,'ユキネのまわり','灯りの輪は、町と道を囲んで魔獣を寄せつけない',b);
}

// ---------------------------------------------------------------- 世界（大陸と諸国）
const castle=(x,y,s=1)=>E(x,y-12*s,26*s,22*s,'#ffcf7a',{opacity:.45,filter:'url(#b4)'})
 +R(x-13*s,y-10*s,26*s,12*s,'#f1e6cb',0,{stroke:INK,'stroke-width':1.1})+R(x-17*s,y-16*s,7*s,18*s,'#f1e6cb',0,{stroke:INK,'stroke-width':1.1})+R(x+10*s,y-16*s,7*s,18*s,'#f1e6cb',0,{stroke:INK,'stroke-width':1.1})
 +P(`M${x-18*s},${y-16*s}l${4.5*s},${-8*s}l${4.5*s},${8*s}zM${x+9*s},${y-16*s}l${4.5*s},${-8*s}l${4.5*s},${8*s}z`,RED,{stroke:INK,'stroke-width':.9})
 +R(x-3*s,y-30*s,6*s,22*s,'#f6efdb',0,{stroke:INK,'stroke-width':1.1})+R(x-4.5*s,y-36*s,9*s,6*s,'#ffd98a',1,{stroke:INK,'stroke-width':1})+P(`M${x-6*s},${y-36*s}L${x},${y-44*s}L${x+6*s},${y-36*s}Z`,RED,{stroke:INK,'stroke-width':.9})+R(x-2.5*s,y-4*s,5*s,6*s,INK);
const city=(x,y,roof='#8a6a52')=>house(x-7,y,.8,roof)+house(x+6,y+2,.9)+house(x,y-7,.7,roof);
const tent=(x,y)=>P(`M${x-8},${y}L${x},${y-13}L${x+8},${y}Z`,'#efe2c0',{stroke:INK,'stroke-width':1})+L(x,y-13,x,y-17,INK,1)+P(`M${x},${y-17}l6,2l-6,2z`,RED)+P(`M${x-2},${y}L${x},${y-6}L${x+2},${y}Z`,INK);
const mill=(x,y)=>R(x-4,y-12,8,12,'#f1e6cb',0,{stroke:INK,'stroke-width':1})+P(`M${x-5},${y-12}L${x},${y-18}L${x+5},${y-12}Z`,'#8a6a52',{stroke:INK,'stroke-width':.9})+S(`M${x-9},${y-21}L${x+9},${y-9}M${x+9},${y-21}L${x-9},${y-9}`,INK,1.3);
const ship=(x,y)=>P(`M${x-9},${y}h18l-4,6h-10z`,'#8a6a52',{stroke:INK,'stroke-width':.9})+L(x,y,x,y-13,INK,1)+P(`M${x},${y-13}l8,7h-8z`,'#f6efdb',{stroke:INK,'stroke-width':.7});
const grass=(cx,cy,rx,ry,count,seed)=>{const r=rng(seed);let s='';for(let i=0;i<count;i++){const x=cx+(r()*2-1)*rx,y=cy+(r()*2-1)*ry;s+=S(`M${n(x-3)},${n(y)}l2,-5M${n(x)},${n(y)}l0,-6M${n(x+3)},${n(y)}l-2,-5`,'#7f8f5a',.9,{opacity:.7});}return s;};
const nation=(x,y,name,sub,color,size=22,rot=0)=>label(x,y,name,size,{weight:700,spacing:10,fill:color,rot,halo:5})+(sub?label(x,y+16,sub,10,{weight:500,spacing:2,fill:color,rot,halo:3}):'');
// 国の成り立ち。地図の下に添える。
const NATIONS=[
 ['ヒノワ王国','#8a5a20','ユキネの属する国。王都セイカの大灯台を芯に、国じゅうの町が「灯りの輪」でつながっている。灯守は王の名で任じられ、道具と技はカルデの灯工房が支える。'],
 ['ミズハ連邦','#3f6a80','西の水の都市連合。運河と水門の技はここから来た。リツが修業した水番の流儀も、もとはミズハのもの。'],
 ['カザネ氏族領','#6f7f3a','東の草原。風を読む遊牧の氏族がゆるくまとまる。丘の「風待ち」の名は、カザネの商人が残していった。'],
 ['コガネ公国','#9a7a2a','南西の麦の国。粉ひき小屋へ届く小麦は、ここから荷車で来る。'],
 ['サザナ諸島','#3f7a7a','南の海の島々。南の港と船で行き来する。めずらしい薬草も、島から渡ってくる。'],
 ['白嶺と果ての氷原','#a5503c','北の山脈と、その向こう。精霊と魔獣の棲む所で、どの国の地図もここで終わっている。']
];
function world(s={}){
 const W=900,H=620;let b='';
 // 海
 b+=G(R(16,16,W-32,H-32,'#c4d9dc',6),{filter:'url(#paper)'});
 for(let i=0;i<46;i++){const r=rng(i+3),x=40+r()*820,y=40+r()*540;b+=S(`M${n(x)},${n(y)}q6,-5 12,0t12,0`,INK,.7,{opacity:.25});}
 // 大陸（西に半島、南に湾）と島々
 const land='M90,150Q150,70 300,62Q460,40 620,58Q790,60 850,150Q880,250 840,340Q830,430 740,470Q680,520 590,492Q540,470 500,492Q470,520 420,500Q360,470 320,520Q270,572 190,548Q110,520 96,430Q50,360 70,270Q60,200 90,150Z';
 b+=G(P(land,'#5a3a1c',{opacity:.25,transform:'translate(5,7)'})+P(land,PAPER,{stroke:INK,'stroke-width':1.8}),{filter:'url(#rough)'});
 // 国ごとの色
 const tint=(d,c)=>G(P(d,c,{opacity:.34}),{filter:'url(#rough)'});
 b+=tint('M330,150Q470,130 610,150Q640,260 600,360Q590,440 520,486Q470,516 420,498Q380,470 350,430Q300,330 330,150Z','#f1c56a')   // ヒノワ
  +tint('M96,170Q200,130 328,152Q300,330 348,430Q300,440 250,420Q150,430 100,400Q52,340 72,268Q62,210 96,170Z','#8fc0d6')        // ミズハ
  +tint('M612,150Q760,120 846,170Q878,250 840,338Q828,420 742,468Q660,470 602,362Q642,260 612,150Z','#b9cf7a')                   // カザネ
  +tint('M100,402Q150,432 250,422Q300,442 348,432Q372,470 322,520Q272,570 192,548Q112,520 100,402Z','#e6cf6a');                  // コガネ
 // 北の山脈と、雪
 b+=P('M110,150Q300,96 470,104Q650,90 830,150Q850,200 800,226Q620,250 470,236Q300,252 150,226Q96,200 110,150Z','#fbf8ee',{opacity:.7,filter:'url(#b8)'});
 b+=range(120,820,124,41,54)+nation(170,60,'果ての氷原','',RED,13)+label(300,152,'白　嶺',20,{weight:700,spacing:16})+label(640,172,'魔獣の棲む山',10,{fill:RED,weight:500});
 // 川と湖、草原、森、麦畑
 b+=water('M560,150Q540,190 536,214',4)+G(P('M506,214Q530,196 566,206Q590,214 580,238Q556,250 524,244Q500,236 506,214Z','#b9d5df',{stroke:INK,'stroke-width':1.2}),{filter:'url(#rough)'})+water('M540,246Q520,300 470,340T450,490',5)
  +water('M250,170Q230,240 200,300T130,420',5)+water('M200,300Q260,310 300,290',3)+water('M720,170Q700,260 730,330T700,460',4);
 b+=grass(730,290,90,90,60,4)+woods(420,220,60,40,20,5)+woods(560,330,40,50,12,8)+woods(160,230,40,30,10,12)+woods(640,410,34,26,8,15);
 for(let i=0;i<26;i++){const r=rng(i*7+2),x=140+r()*170,y=450+r()*80;b+=S(`M${n(x)},${n(y)}v-6m-2,2l2,-2l2,2`,'#b08a2a',1,{opacity:.8});}
 // 国境
 for(const d of ['M329,152Q300,330 349,431Q372,470 420,498','M611,150Q642,260 602,362Q590,440 520,486','M100,402Q150,432 250,422Q300,442 349,431'])b+=S(d,INK,1.4,{'stroke-dasharray':'9 4 2 4',opacity:.6});
 // 街道
 b+=road('M470,176Q500,196 530,214')+road('M540,246Q520,270 492,290')+road('M492,290Q470,340 450,378')+road('M450,378Q460,430 468,480')+road('M450,378Q340,360 214,336',{dash:'3 5'})+road('M450,378Q590,340 712,296',{dash:'3 5'})+road('M450,378Q360,430 250,486',{dash:'3 5'});
 // 島々と船の道
 const isle=(d)=>G(P(d,PAPER,{stroke:INK,'stroke-width':1.4})+P(d,'#8fd0c0',{opacity:.34}),{filter:'url(#rough)'});
 b+=isle('M600,548Q630,528 664,540Q680,560 650,572Q614,576 600,548Z')+isle('M700,556Q722,544 742,556Q744,574 720,578Q700,574 700,556Z')+isle('M560,580Q580,570 596,582Q590,596 570,594Z')
  +S('M474,492Q540,540 610,552',BLUE,1.4,{'stroke-dasharray':'2 6'})+ship(540,530)+house(634,556,.8,'#6f8fa0');
 // 国の名
 b+=nation(470,446,'ヒノワ王国','灯りの輪の国','#8a5a20',20)+nation(196,250,'ミズハ連邦','水と運河の都市連合','#3f6a80',18)+nation(730,222,'カザネ氏族領','風を読む草原の民','#6f7f3a',17)+nation(214,518,'コガネ公国','麦の国','#9a7a2a',16)+nation(700,522,'サザナ諸島','海の商人','#3f7a7a',14);
 // 都と町
 b+=castle(450,384,1)+label(450,404,'王都セイカ',15,{weight:700,spacing:3})+label(450,418,'大灯台',9,{weight:500,fill:'#8a5a20',halo:3});
 b+=city(492,292,'#6f8fa0')+label(520,286,'カルデ',12,{anchor:'start'})+label(520,299,'灯工房',9,{weight:500,anchor:'start',halo:3})+house(548,226,.7,'#6f8fa0')+label(596,232,'ミナモ',10,{weight:500,anchor:'start',halo:3})+label(540,206,'氷湖',9,{weight:500,fill:'#3f6a80',halo:3});
 b+=city(468,484,'#6f8fa0')+label(430,490,'南の港',12,{anchor:'end'});
 b+=city(210,340,'#6f8fa0')+S('M196,348h30M200,354h22',BLUE,1.6)+label(210,372,'水都ミズハ',13,{weight:700,spacing:2})+house(140,300,.7)+label(140,286,'堰の町',9,{weight:500,halo:3});
 b+=tent(712,300)+tent(728,306)+tent(700,310)+label(716,330,'風の市カザネ',13,{weight:700,spacing:2})+tent(790,380)+label(790,398,'夏の野営地',9,{weight:500,halo:3});
 b+=mill(250,490)+house(266,492,.8)+label(256,470,'麦の都コガネ',12,{weight:700,spacing:2});
 // ユキネ
 b+=E(470,172,26,18,'#ffcf7a',{opacity:.6,filter:'url(#b4)'})+E(470,172,15,10,'none',{stroke:GOLD,'stroke-width':1.8,'stroke-dasharray':'2 4','stroke-linecap':'round'})+house(470,177,.9,RED)+label(426,180,'ユキネ',14,{weight:700,fill:RED,anchor:'end',spacing:3});
 const j=['lake','lakeside','lampworkshop'].includes(s.scene);b+=here(j?548:470,j?212:152,j?'いまここ（旅の途中）':'いまここ');
 b+=compass(810,520)+G(L(0,0,110,0,INK,2)+L(0,-4,0,4,INK,1.5)+L(55,-3,55,3,INK,1.2)+L(110,-4,110,4,INK,1.5)+label(55,18,'荷車で十日',11,{weight:500}),{transform:'translate(56,582)'});
 return frame(W,H,'世界の中のユキネ','',b);
}
const lore=()=>'<div class="map-lore">'+NATIONS.map(([name,color,text])=>'<p><b style="color:'+color+'">'+name+'</b>　'+text+'</p>').join('')+'</div>';
root.OkaeriMaps={local,world,lore,NATIONS,SPOTS};
if(typeof module!=='undefined')module.exports=root.OkaeriMaps;
})(typeof globalThis!=='undefined'?globalThis:this);
