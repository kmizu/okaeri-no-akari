(function(root){
'use strict';
const W=1152,H=768,T=48;
function Renderer(canvas){this.c=canvas.getContext('2d');this.t=0;this.p={x:600,y:504,dir:'down'};this.f={x:600,y:552,dir:'down'};this.target={x:600,y:504};this.follow={x:600,y:552};this.cache={};}
Renderer.prototype.reset=function(s){const x=s.x*48+24,y=s.y*48+24;this.p={x,y,dir:'down'};this.f={x:x-24,y:y+28,dir:'down'};this.target={x,y};this.follow={x:x-24,y:y+28};};
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
function tree(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);
 poly(c,[[-15,0],[18,-5],[84,27],[38,38]],'#496d8026');ellipse(c,8,5,37,12,'#3e5e6e32');
 block(c,-5,-40,10,43,6,'#756754','#4b5551','#a4977b');
 for(let i=0;i<4;i++){const yy=-18-i*24,w=40-i*8,peak=yy-48;
  poly(c,[[-w,yy],[0,peak],[w,yy],[12,yy+9]],'#36575b');
  poly(c,[[0,peak],[w,yy],[12,yy+9],[4,yy-9]],'#23434c');
  poly(c,[[-w+2,yy-6],[0,peak-3],[w-3,yy-6],[18,yy-7],[7,yy+1],[-7,yy-6],[-21,yy-2]],'#a9c3ce');
  poly(c,[[-w+2,yy-10],[0,peak-3],[7,yy-12],[-6,yy-9],[-18,yy-6]],'#edf1e8');
  line(c,[[-w+3,yy-10],[-21,yy-2],[-7,yy-6]],'#f4f6ed',2);
 }c.restore();}
function shopSign(c,x,y,kind){
 c.save();c.translate(x,y);
 const names={bread:'マロのパン',lamp:'灯守の共同所',thread:'織りもの',rest:'休憩小屋'},ink=kind==='lamp'?'#bce1d8':'#f4dab0';
 line(c,[[-39,-25],[39,-25]],'#364f50',4);
 for(const sx of [-29,29]){line(c,[[sx,-25],[sx,-15]],'#435956',2);ellipse(c,sx,-16,3,4,'#c0b48a');ellipse(c,sx,-16,1.5,2.5,'#405251');}
 block(c,-42,-13,84,39,5,'#4d6158','#31484a','#b7b89a');
 rect(c,-38,-9,76,31,kind==='lamp'?'#284e54':'#725b43');
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
 }else{
  rect(c,-8,-4,14,10,'#e6d2ac');c.strokeStyle='#e6d2ac';c.lineWidth=2;c.beginPath();c.arc(8,0,4,-Math.PI/2,Math.PI/2);c.stroke();
  line(c,[[-11,8],[11,8]],'#e6d2ac',2);
 }
 c.fillStyle=ink;c.font='bold 9px "Yu Gothic UI",sans-serif';c.textAlign='center';c.fillText(names[kind],0,17);
 line(c,[[-43,-15],[-29,-17],[-8,-15],[13,-17],[40,-15]],'#eaf1e7',5);
 c.restore();
}
function house(c,x,y,w,h,roof='#617b88',signKind='rest'){
 const d=Math.min(36,w*.2),rise=d*.62,eave=y+48,base=y+h;
 poly(c,[[x+8,base],[x+w,base],[x+w+d+58,base+21],[x+53,base+39]],'#38576830');
 ellipse(c,x+w*.55,base+8,w*.65,16,'#42647728');
 // Stone footing, timber facade, darker receding side wall.
 block(c,x-5,base-20,w+10,24,d,'#82908d','#596b70','#b1c2bf');
 for(let row=0;row<2;row++)for(let xx=x-4;xx<x+w;xx+=23){
  const sx=xx+(row%2)*10,sw=Math.min(21,x+w+4-sx);if(sw<=0)continue;
  rect(c,sx,base-19+row*11,sw,9,row?'#758888':'#98a6a0');
  line(c,[[sx+2,base-18+row*11],[sx+sw-2,base-18+row*11]],'#c2ccc044',1);
 }
 block(c,x,eave,w,h-61,d,'#a08467','#6d7265','#b7aa8a');
 const wood=c.createLinearGradient(x,eave,x+w,base);wood.addColorStop(0,roof==='#657680'?'#a9a68a':roof==='#637b91'?'#a7a28d':'#b79976');wood.addColorStop(1,roof==='#657680'?'#777d6b':'#8b7057');c.fillStyle=wood;c.fillRect(x+7,eave+4,w-14,h-69);
 for(let yy=eave+17;yy<base-19;yy+=15){line(c,[[x+7,yy],[x+w-7,yy]],'#574d423e',2);line(c,[[x+w,yy],[x+w+d,yy-rise]],'#3f504852',2);}
 for(let row=0,yy=eave+7;yy<base-22;yy+=15,row++){
  for(let col=0,xx=x+13;xx<x+w-13;xx+=37,col++){
   const len=Math.min(26,x+w-10-xx),bend=(row+col)%3;
   line(c,[[xx,yy+4],[xx+len*.4,yy+3+bend],[xx+len,yy+4]],'#ead0a51c',1);
   line(c,[[xx+4,yy+7],[xx+len,yy+6]],'#3f3a3225',.7);
   if((row+col)%4===0)ellipse(c,xx+9,yy+5,3,1.1,'#53473550');
  }
  const joint=x+24+(row*53)%(w-40);line(c,[[joint,yy-4],[joint,yy+8]],'#4d483743',1);
 }
 for(const xx of [x+4,x+w*.5,x+w-8])block(c,xx,eave+2,6,h-64,3,'#626456','#414f4b','#a0a086');
 // Pitched roof: two roof planes, a visible thick snow lip and deep eave shadow.
 const a=[x-16,eave],ridge=[x+w*.43,y-24],b=[x+w+15,eave],back=[ridge[0]+d,ridge[1]-rise],far=[b[0]+d,b[1]-rise];
 poly(c,[[x-8,eave],[x+w+7,eave],[x+w+7,eave+13],[x-8,eave+13]],'#384e5366');
 poly(c,[a,ridge,b],roof);poly(c,[ridge,back,far,b],'#728f9f');
 // Recessed timber gable, framed by heavy rafters under the snowy roof.
 poly(c,[[x+4,eave-4],[ridge[0],y-12],[x+w-4,eave-4]],'#a38c72');
 for(let xx=x+16;xx<x+w-10;xx+=12){
  const t=xx<ridge[0]?(xx-x)/(ridge[0]-x):(x+w-xx)/(x+w-ridge[0]);
  line(c,[[xx,eave-5],[xx,eave-5-Math.max(0,t)*55]],'#665e5040',1);
 }
 line(c,[[x-7,eave],[ridge[0],y-19],[x+w+7,eave]],'#4d5c59',7);
 line(c,[[x+2,eave-3],[x+w-2,eave-3]],'#5c6052',6);
 line(c,[[ridge[0],y-12],[ridge[0],eave-6]],'#5c6052',5);
 if(w>145){
  const ax=ridge[0],ay=eave-25;
  ellipse(c,ax,ay,14,16,'#4b5855');ellipse(c,ax,ay,10,12,'#e9c88b');
  line(c,[[ax-10,ay],[ax+10,ay]],'#76694e',2);line(c,[[ax,ay-12],[ax,ay+12]],'#76694e',2);
 }
 poly(c,[[a[0]-4,a[1]-8],[ridge[0],ridge[1]-10],[b[0]+2,b[1]-8],[b[0],b[1]+1],[ridge[0],ridge[1]+1],[a[0],a[1]+2]],'#eff1e8');
 poly(c,[[ridge[0],ridge[1]-10],[back[0],back[1]-10],[far[0]+5,far[1]-8],[b[0]+2,b[1]-8]],'#c2d5df');
 line(c,[[ridge[0],ridge[1]-10],[back[0],back[1]-10],[far[0]+5,far[1]-8]],'#f7f7ed',3);
 // Subtle drifts follow the roof plane, with a cool underside and sunlit ridge.
 for(let i=1;i<7;i++){
  const t=i/8,px=ridge[0]+(b[0]-ridge[0])*t,py=ridge[1]+(b[1]-ridge[1])*t-9;
  line(c,[[px+3,py],[px+d*.48,py-rise*.5-2],[px+d-2,py-rise]],i%2?'#eff4ed75':'#8eafc52c',i%2?2:1);
 }
 line(c,[[ridge[0]+3,ridge[1]-8],[b[0],b[1]-7]],'#ffffff99',2);
 for(let i=0;i<8;i++){
  const t=(i+.5)/8,px=b[0]+d*t,py=b[1]-rise*t-6;
  ellipse(c,px,py,4.5,2.5,'#e5eee8');
 }
 poly(c,[[b[0]+2,b[1]-8],[far[0]+5,far[1]-8],[far[0]+5,far[1]+1],[b[0]+2,b[1]+2]],'#8daab9');
 for(let i=1;i<5;i++){const xx=x+i*w/5;poly(c,[[xx,eave-4],[xx+5,eave-4],[xx+2,eave+8+i%2*5]],'#d2e4e5');}
 block(c,x+w*.68,y-25,17,39,10,'#82766d','#5e6870','#e9eee5');
 block(c,x+w*.68-4,y-29,25,7,10,'#d0dbd6','#a7bec8','#f8f5e9');
 for(let cy=y-18,row=0;cy<y+13;cy+=8,row++){
  line(c,[[x+w*.68+1,cy],[x+w*.68+16,cy]],'#3f4a4d66',1);
  const cx=x+w*.68+5+(row%2)*6;line(c,[[cx,cy],[cx,cy+7]],'#43505766',1);
 }
 for(let i=0;i<3;i++)ellipse(c,x+w*.68+10+i*5,y-37-i*9,8+i*3,5+i*2,'#e4ece533');
 const wy=eave+21,windowH=Math.min(31,h*.24),windowW=Math.min(30,w*.19);
 for(const wx of [x+w*.12,x+w*.73]){
  for(const side of [-1,1]){
   const sx=side<0?wx-13:wx+windowW+4;
   block(c,sx,wy-2,9,windowH+5,2,'#65756c','#3d5351','#9aa58a');
   for(let sy=wy+3;sy<wy+windowH;sy+=6)line(c,[[sx+1,sy],[sx+7,sy]],'#b0b6a066',1);
  }
  glow(c,wx+windowW/2,wy+windowH/2,43);block(c,wx-3,wy-3,windowW+6,windowH+6,3,'#495d59','#324b4d','#c5ba99');
  const light=c.createLinearGradient(wx,wy,wx,wy+windowH);light.addColorStop(0,'#e5b86c');light.addColorStop(1,'#fff0b9');c.fillStyle=light;c.fillRect(wx,wy,windowW,windowH);
  poly(c,[[wx,wy],[wx+windowW*.32,wy],[wx+windowW*.2,wy+windowH*.7],[wx+2,wy+windowH]],'#f5e5c7c9');
  poly(c,[[wx+windowW,wy],[wx+windowW*.72,wy],[wx+windowW*.83,wy+windowH*.7],[wx+windowW-1,wy+windowH]],'#d2ba92b0');
  rect(c,wx+2,wy+windowH-6,windowW-4,3,'#9d74474d');
  line(c,[[wx+3,wy+3],[wx+windowW*.43,wy+3]],'#fff9df99',1);
  line(c,[[wx+windowW/2,wy],[wx+windowW/2,wy+windowH]],'#806b4e',3);line(c,[[wx,wy+windowH/2],[wx+windowW,wy+windowH/2]],'#806b4e',2);
  block(c,wx-6,wy+windowH+4,windowW+12,5,7,'#d6dfd7','#96abb2','#f3f2e5');
 }
 const doorH=Math.min(50,h*.40);block(c,x+w*.5-17,base-doorH-14,34,doorH,4,'#505a52','#394b46','#a89878');
 rect(c,x+w*.5-12,base-doorH-9,24,doorH-7,'#786c54');ellipse(c,x+w*.5+7,base-35,2,2,'#e9c588');
 const dx=x+w*.5,dy=base-doorH-14;
 for(const hy of [dy+12,base-24]){rect(c,dx-12,hy,11,3,'#343e39');ellipse(c,dx-4,hy+1,1,1,'#b7b69b');}
 ellipse(c,dx+8,base-34,3,4,'#4c4a39');ellipse(c,dx+8,base-35,1.8,2,'#e7c681');
 if(h>120){
  rect(c,dx-7,dy+7,14,9,'#e8c982');line(c,[[dx,dy+7],[dx,dy+16]],'#5f6250',2);
  c.strokeStyle='#718264';c.lineWidth=3;c.beginPath();c.arc(dx,dy+25,6,0,Math.PI*2);c.stroke();
  poly(c,[[dx,dy+30],[dx-4,dy+36],[dx+1,dy+34],[dx+4,dy+37],[dx+3,dy+29]],'#b77865');
 }
 for(const off of [-7,0,7])line(c,[[dx+off,dy+8],[dx+off,base-18]],'#514e414d',1);
 line(c,[[dx-11,base-23],[dx+10,base-23]],'#b09b76',2);
 // A deep porch canopy and brackets give the entrance its own silhouette.
 if(h>120){
  line(c,[[dx-22,dy-1],[dx-22,dy+17],[dx-10,dy+2]],'#575e50',4);
  line(c,[[dx+23,dy-1],[dx+23,dy+17],[dx+12,dy+2]],'#575e50',4);
  poly(c,[[dx-29,dy],[dx-21,dy-17],[dx+26,dy-17],[dx+36,dy]],'#566e71');
  poly(c,[[dx-31,dy-4],[dx-21,dy-21],[dx+26,dy-21],[dx+38,dy-4],[dx+36,dy+1],[dx-29,dy+1]],'#e7eee6');
  line(c,[[dx-29,dy+2],[dx+36,dy+2]],'#79939d',3);
  glow(c,dx+45,dy+20,30);block(c,dx+40,dy+10,10,17,3,'#4b5e56','#344b4d','#a9b6a0');rect(c,dx+42,dy+13,6,10,'#ffe1a0');
 }
 block(c,x+w*.5-26,base-10,52,8,12,'#a3b4b5','#6c8591','#e0e9df');
 block(c,x+w*.5-31,base,62,7,12,'#a0b4be','#718f9c','#e6ece3');
 // Snow banks settle against the foundation, leaving the doorway clear.
 for(const sx of [x+10,x+w-23]){ellipse(c,sx,base+4,23,7,'#a9c2cb');ellipse(c,sx-3,base+1,21,6,'#edf1e7');}
 if(w>160){
  if(h>120)shopSign(c,x+w*.22,base-43,signKind);
  for(let row=0;row<3;row++)for(let i=0;i<4-row%2;i++){
   const lx=x+w+8+i*7,ly=base-3-row*7;
   ellipse(c,lx,ly,4,3.5,'#665746');ellipse(c,lx-1,ly-1,2.5,2,'#b69a70');
  }
  line(c,[[x+w+3,base-24],[x+w+35,base-24]],'#edf1e7',5);
 }
}
function lantern(c,x,y,lit=true){
 ellipse(c,x+11,y+8,21,7,'#35526826');block(c,x-5,y-39,7,45,5,'#647267','#405956','#94a092');
 line(c,[[x,y-37],[x+20,y-37],[x+20,y-29]],'#4b605a',3);
 if(lit)glow(c,x+20,y-16,57);
 block(c,x+10,y-28,18,22,6,'#4a5f57','#354e4b','#9bac9b');
 rect(c,x+13,y-24,11,14,lit?'#ffe3a0':'#87a9b5');line(c,[[x+18,y-24],[x+18,y-10]],'#756b49',2);
 poly(c,[[x+6,y-29],[x+19,y-38],[x+34,y-29]],'#edf0e2');
 if(lit)ellipse(c,x+22,y+5,15,5,'#ffdc8026');
}

Renderer.prototype.background=function(scene){
 if(this.cache[scene])return this.cache[scene];const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
 if(scene==='house'){
  rect(c,0,0,W,H,'#243c46');shadow(c,585,682,480,55);
  block(c,133,112,884,560,20,'#755b46','#35484a','#d5c6a5');
  rect(c,144,144,864,528,'#aa8962');
  for(let row=0;row<22;row++){const yy=144+row*24;rect(c,144,yy,864,23,row%3===0?'#a18460':row%3===1?'#b3956f':'#ad8d65');
   for(let xx=144+(row%2)*60;xx<1008;xx+=120){line(c,[[xx,yy],[xx,yy+22]],'#69574466',1);line(c,[[xx+8,yy+8],[Math.min(xx+104,1006),yy+10]],'#dfbf8825',1);}
  }
  // Cutaway walls, with two separate bedroom doors opening into the shared room.
  block(c,133,116,884,28,14,'#d0b48a','#7c7865','#f1dfba');
  for(const [xx,ww] of [[144,144],[336,480],[864,144]])block(c,xx,288,ww,38,8,'#ac987b','#6e7568','#e0cfaa');
  block(c,576,144,48,182,8,'#b6a082','#6e7568','#e0cfaa');
  for(const xx of [300,828]){rect(c,xx-10,303,36,15,'#72593e');line(c,[[xx-10,318],[xx+26,318]],'#d9c79e',2);}
  for(const wx of [375,782]){
   block(c,wx,154,78,63,5,'#596b6c','#3a5358','#d7c9a5');rect(c,wx+6,159,65,50,'#5d819a');
   ellipse(c,wx+54,174,8,8,'#e1e6ce');line(c,[[wx+39,159],[wx+39,209]],'#d0c6a6',3);line(c,[[wx+6,184],[wx+71,184]],'#d0c6a6',3);
   poly(c,[[wx-6,152],[wx+18,152],[wx+10,220],[wx-8,220]],'#aa7768');poly(c,[[wx+64,152],[wx+85,152],[wx+86,220],[wx+73,220]],'#aa7768');
  }
  rect(c,413,497,318,103,'#876458');rect(c,422,504,300,89,'#b79776');
  line(c,[[431,513],[714,513],[714,582],[431,582],[431,513]],'#dfc8a0',3);
  block(c,690,350,263,34,13,'#9a815d','#56645a','#d6c3a0');
  for(let i=0;i<5;i++){ellipse(c,718+i*39,349,11,5,'#eee2c4');rect(c,710+i*39,340,16,9,'#c4b99a');}
  c.font='bold 15px "Yu Gothic UI"';c.textAlign='center';c.fillStyle='#f2dfb9';c.fillText('トウマの部屋',389,279);c.fillText('ニナの部屋',812,279);c.fillText('二人の家',590,709);
  glow(c,275,445,170);glow(c,560,472,180);this.cache[scene]=cv;return cv;
 }
 let g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'#bdd6df');g.addColorStop(.5,'#dce6df');g.addColorStop(1,'#9bbdc9');c.fillStyle=g;c.fillRect(0,0,W,H);
 const paths=[];const path=(p,w)=>paths.push([p,w]);
 const flushPaths=()=>{const lift=scene==='hill'?23:scene==='canal'?13:8;c.save();c.lineJoin='round';
  for(const [dx,dy,extra,color] of [[9,lift,16,'#42657d35'],[3,lift*.6,8,scene==='hill'?'#7894a6':'#9db8c5'],[0,0,7,'#cbdde1'],[0,0,0,'#edf1e7'],[0,0,-26,'#e1e7dc']])for(const [p,w] of paths)line(c,p.map(([x,y])=>[x+dx,y+dy]),color,w+extra);
  c.restore();};
 if(scene==='town'){
  path([[600,35],[600,730]],108);path([[135,455],[1000,455]],125);flushPaths();ellipse(c,600,475,165,112,'#e6ebdf');
  for(let i=0;i<25;i++){const x=(i*173+12)%W,y=(i*131)%H;if((x<145||x>1030||y<80)&&Math.abs(x-600)>90)tree(c,x,y,1.1+(i%3)*.1);}
  house(c,150,172,222,187,'#617b88','bread');house(c,779,150,225,170,'#657680','lamp');house(c,884,533,185,150,'#617b88','thread');house(c,68,551,108,95);
  for(let i=0;i<7;i++){rect(c,415+i*30,604,18,25,'#8c8270');rect(c,413+i*30,600,22,7,'#edf0e2');}line(c,[[420,615],[610,615]],'#7e8270',4);
  for(const [x,y] of [[439,354],[753,378],[867,475],[365,506],[626,182]])lantern(c,x,y);
  for(let i=0;i<11;i++){ellipse(c,220+i*14,367,7,5,'#e2d1a7');}
  line(c,[[360,208],[480,248],[610,262],[738,233],[817,198]],'#7c887b',2);for(let i=0;i<8;i++){let x=400+i*51,y=230+Math.sin(i/7*Math.PI)*28;poly(c,[[x,y],[x+14,y+2],[x+7,y+22]],i%2?'#c8896a':'#648c89');}
  c.font='14px "Yu Gothic UI"';c.textAlign='center';c.fillStyle='#f4deb3';c.fillText('マロのパン屋',260,346);c.fillStyle='#5e766f';c.fillText('灯守の共同所',887,338);
 }else if(scene==='hill'){
  const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#768fac');sky.addColorStop(.4,'#b8c7d4');sky.addColorStop(1,'#b7ccce');c.fillStyle=sky;c.fillRect(0,0,W,H);
  poly(c,[[0,250],[180,90],[330,240],[490,115],[680,265],[840,130],[1152,230],[1152,768],[0,768]],'#91a9bc');
  poly(c,[[0,420],[260,280],[430,375],[710,210],[930,260],[1152,155],[1152,768],[0,768]],'#c2d4d7');
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
  line(c,[[60,630],[450,630],[450,540],[825,540],[825,220],[1100,220]],'#729aaa',90);
  line(c,[[60,624],[450,624],[450,534],[825,534],[825,214],[1100,214]],'#d5edf0',48);
  path([[168,660],[168,504],[744,504],[744,216],[1032,216]],130);
  path([[312,504],[312,360]],110);flushPaths();
  for(let x=253;x<433;x+=36)block(c,x,658,33,10,8,'#8fa4a9','#617e8f','#d6e3df');
  for(let y=310;y<520;y+=35)block(c,866,y,12,30,9,'#9bb0b7','#607f90','#d7e5e1');
  house(c,218,244,164,86,'#748ca0');
  for(let i=0;i<9;i++){rect(c,388+i*6,448,5,110,'#a59173');}line(c,[[391,445],[391,560]],'#566a68',5);line(c,[[442,445],[442,560]],'#566a68',5);
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
  line(c,[[480,304],[721,320]],'#527d9166',49);line(c,[[480,294],[721,310]],'#b0d8df99',21);
  for(let i=0;i<6;i++){rect(c,558,278+i*10,82,8,'#a3977f');}line(c,[[558,275],[558,338]],'#63766c',5);line(c,[[640,275],[640,338]],'#63766c',5);
  for(const [x,y] of [[321,600],[750,257],[906,269]])lantern(c,x,y,false);
 }
 let seed=491;for(let i=0;i<1600;i++){seed=(seed*16807)%2147483647;let x=seed%W;seed=(seed*16807)%2147483647;let y=seed%H;ellipse(c,x,y,1+(i%3),.65,i%2?'#ffffff20':'#345a7012');}
 this.cache[scene]=cv;return cv;
};
Renderer.prototype.draw=function(s,time,mode){
 const c=this.c,t=time*.001;this.t=t;c.clearRect(0,0,W,H);c.drawImage(this.background(s.scene),0,0);
 if(s.scene==='town'&&s.flags.festivalStarted){
  rect(c,0,0,W,H,'#1a244957');
  for(const [x,y] of [[300,440],[510,360],[760,420],[875,470],[600,560]])glow(c,x,y,120);
  for(let row=0;row<2;row++){
   const yy=95+row*43;line(c,[[180,yy],[430,yy+35],[720,yy+40],[980,yy]],'#a5aaa1',2);
   for(let i=0;i<12;i++){const x=210+i*65,y=yy+Math.sin(i/11*Math.PI)*39;glow(c,x,y+12,30);rect(c,x-7,y,14,22,i%2?'#e7b779':'#d99272');rect(c,x-8,y-2,16,3,'#647876');}
  }
  for(const [x,y] of [[330,430],[730,520]]){rect(c,x-30,y,60,15,'#a38362');rect(c,x-25,y+15,6,17,'#7c715e');rect(c,x+19,y+15,6,17,'#7c715e');ellipse(c,x,y-3,20,9,'#e7cb98');}
 }
 const drawables=[];
 for(const source of OkaeriStory.activeObjects(s)){
  const o=source.base||source;
  const x=o.x*T+24,y=o.y*T+24;drawables.push({y,draw:()=>{
  if(source.base){ellipse(c,x,y+4,23,9,'#e1c58288');c.textAlign='center';c.font='bold 17px sans-serif';c.fillStyle='#ffe0a1';c.fillText('◆',x,y-88+Math.sin(t*3)*3);}
  if(!['exit','npc','mochi','crab','guardian','camp'].includes(o.type))ellipse(c,x+10,y+8,25,8,'#3a56652b');
  if(o.type==='homeTable'){
   for(const dx of [-43,43]){block(c,x+dx-12,y+7,25,9,5,'#aa8a61','#5e6755','#d9bc8e');for(const leg of [-9,8])rect(c,x+dx+leg,y+16,4,12,'#685943');}
   for(const dx of [-54,45])block(c,x+dx,y-27,8,48,5,'#665442','#3b4c46','#b4a07c');
   block(c,x-72,y-67,144,50,16,'#987a54','#5b6050','#d4b889');rect(c,x-32,y-65,62,47,'#e5d3ad');
   for(const dx of [-15,16]){ellipse(c,x+dx,y-47,9,6,'#f4e5c7');ellipse(c,x+dx,y-48,6,3,'#aa7046');}
   rect(c,x-52,y-49,13,4,'#d0a261');glow(c,x+48,y-47,70);block(c,x+43,y-65,10,21,4,'#65715a','#405448','#b7b991');rect(c,x+45,y-62,6,12,'#ffe0a1');
  }
  if(o.type==='homeStove'){block(c,x-41,y-71,68,69,17,'#4f5852','#303f3e','#919483');block(c,x-20,y-128,15,57,7,'#5e665a','#344849','#a6a68a');rect(c,x-29,y-51,43,31,'#2d3534');glow(c,x-8,y-31,135);poly(c,[[x-24,y-23],[x-16,y-43],[x-9,y-31],[x,y-48],[x+9,y-23]],'#ffc575');ellipse(c,x-7,y-75,19,8,'#a6a285');}

  if(o.type==='homeDesk'){for(const dx of [-32,25])rect(c,x+dx,y-7,7,26,'#6b5140');block(c,x-40,y-31,80,30,7,'#a67c53','#615447','#d7b585');rect(c,x-28,y-32,29,16,'#829d92');line(c,[[x-22,y-29],[x-8,y-18]],'#d3d6c4',3);rect(c,x-23,y-28,8,5,'#6b5b46');block(c,x+10,y-39,21,10,3,'#967153','#595c4c','#d3af77');ellipse(c,x+22,y-38,3,2,'#e5cf87');}
  if(o.type==='homeBooks'){block(c,x-23,y-52,46,63,7,'#9e7956','#615740','#d3b58a');rect(c,x-18,y-46,35,49,'#594e42');for(let j=0;j<2;j++){for(let i=0;i<5;i++){rect(c,x-16+i*6,y-43+j*25,5,19-i%3*3,['#869b8b','#ba8874','#d2bc8c'][i%3]);line(c,[[x-15+i*6,y-39+j*25],[x-12+i*6,y-39+j*25]],'#e5d6b4',1);}rect(c,x-20,y-21+j*25,41,4,'#bf976e');}}
  if(o.type==='homeMirror'){for(const dx of [-28,22])rect(c,x+dx,y-4,6,23,'#795d4d');block(c,x-34,y-20,68,19,6,'#b88d70','#705e50','#dfc2a0');ellipse(c,x,y-47,25,32,'#b58d64');ellipse(c,x,y-47,20,27,'#b5d0ca');line(c,[[x-11,y-63],[x+8,y-43]],'#eaf0dc',3);line(c,[[x-7,y-52],[x+10,y-35]],'#dce8d8',2);rect(c,x-27,y-21,15,9,'#eae0c7');ellipse(c,x+23,y-22,7,4,'#809fa6');line(c,[[x+24,y-20],[x+29,y-8]],'#819ead',3);}
  if(o.type==='homeWardrobe'){block(c,x-22,y-61,44,76,8,'#a68064','#675d4c','#d2b591');rect(c,x-17,y-55,33,58,'#67564b');for(let i=0;i<3;i++){rect(c,x-13,y-49+i*10,25,7,['#b98786','#9da98c','#d2bd9a'][i]);}rect(c,x-18,y-17,35,4,'#c39d74');for(let i=0;i<3;i++)ellipse(c,x-10+i*10,y-6,5,7,['#bd8e8c','#8eabb0','#e0c999'][i]);}
  if(o.type==='homeBed'){block(c,x-31,y-70,63,88,10,'#997e5c','#576252','#c6b991');rect(c,x-27,y-67,55,80,'#e8dcc0');rect(c,x-25,y-45,52,57,o.id==='ninaRoom'?'#b48077':'#6c9694');rect(c,x-20,y-62,43,16,'#f4e8cd');line(c,[[x-24,y-36],[x+25,y-36]],'#d8c8a2',3);}
  if(o.type==='homeShelf'){block(c,x-38,y-47,76,52,9,'#a08660','#586752','#d5c29c');rect(c,x-29,y-40,30,25,'#d9bc8b');rect(c,x-26,y-37,24,19,'#647d73');for(let i=0;i<3;i++)ellipse(c,x-21+i*7,y-29,3,4,'#d2b79b');ellipse(c,x+20,y-24,5,5,'#dfc789');line(c,[[x+20,y-20],[x+20,y-9],[x+26,y-9]],'#dfc789',2);}
  if(o.type==='homeSewing'){block(c,x-36,y-30,72,28,10,'#a88c65','#586956','#dbbf92');ellipse(c,x-17,y-35,12,8,'#ae7772');line(c,[[x-22,y-41],[x-7,y-28]],'#dfc5a1',2);block(c,x+10,y-42,20,14,4,'#7d8f76','#516558','#b9c6a5');}
  if(o.type==='waitingPost'){block(c,x-4,y-45,8,54,5,'#8b7c60','#52675e','#c1baa1');poly(c,[[x-28,y-44],[x+19,y-44],[x+30,y-35],[x+19,y-27],[x-28,y-27]],s.flags.waitingPost?'#b3a17a':'#7c8678');line(c,[[x-28,y-46],[x+20,y-46]],'#edf1e6',4);c.font='bold 9px "Yu Gothic UI"';c.textAlign='center';c.fillStyle='#fff0ca';c.fillText('町へ',x,y-32);}
  if(o.type==='waitingLight'){lantern(c,x,y,!!s.flags.waitingLit);}
  if(o.type==='waitingBench'){for(const bx of [-25,19])block(c,x+bx,y-9,6,21,5,'#756c52','#4e655e','#adad8f');block(c,x-30,y-15,60,9,13,'#988362','#566c61','#d6d6bd');block(c,x-30,y-37,60,16,5,'#8b7d60','#576c63','#e3e9dc');}
  if(o.type==='sewingBox'){block(c,x-18,y-13,36,22,10,'#947a55','#5c6455','#d0c19d');block(c,x-20,y-19,40,8,10,'#b4a58b','#7b8d87','#e5e9dc');rect(c,x-4,y-9,8,8,'#d6bd82');if(!s.flags.sewingFound)glow(c,x,y-8,25);}
  if(o.type==='returnSign'){rect(c,x-3,y-35,6,43,'#6e7467');line(c,[[x,y-33],[x+20,y-33],[x+20,y-21]],'#b8a278',2);rect(c,x+9,y-22,24,22,s.flags.signFixed?'#ece5d2':'#b77865');line(c,[[x+12,y-15],[x+28,y-15]],'#7d8477',2);}
  if(o.type==='windbreak'){
   for(let j=0;j<5;j++){rect(c,x-9,y-67+j*26,18,23,s.flags.windbreak?'#a18e73':'#83969e');line(c,[[x-12,y-64+j*26],[x+12,y-60+j*26]],'#e5eeeb',5);}if(s.flags.windbreak)line(c,[[x-13,y-60],[x+13,y+58]],'#d7bd8c',3);
  }
  if(o.type==='hillLens'){block(c,x-18,y-19,36,30,13,'#8fa0a3','#5b7989','#d0ddde');ellipse(c,x,y-31,24,24,'#536e83');ellipse(c,x,y-31,18,18,s.flags.hillLens?'#ffe3a2':'#c0dae5');if(s.flags.hillLens)glow(c,x,y-31,60);}
  if(o.type==='hillBeacon'){
   ellipse(c,x,y+7,39,14,'#52687855');block(c,x-24,y-95,48,100,20,'#9daeb0','#617f8f','#d8e4e1');rect(c,x-29,y-99,58,9,'#d7e3e2');poly(c,[[x-36,y-99],[x,y-131],[x+36,y-99]],'#eaf0ed');rect(c,x-13,y-82,26,34,s.flags.hillLit?'#ffdba1':'#536f85');
   if(s.flags.hillLit){glow(c,x,y-60,160);poly(c,[[x-12,y-68],[x-660,y-28],[x-660,y+48],[x-12,y-49]],'#ffe8ae18');}
  }
  if(o.type==='waterGate'){
   rect(c,x-35,y-50,8,65,'#5b716e');rect(c,x+27,y-50,8,65,'#5b716e');
   rect(c,x-30,y-(s.flags.waterGate?55:25),60,27,s.flags.waterGate?'#a48b68':'#91b8c8');
   ellipse(c,x,y-48,17,17,'#728d90');ellipse(c,x,y-48,10,10,'#b6d0d5');line(c,[[x-15,y-48],[x+15,y-48]],'#5b716e',4);
  }
  if(o.type==='regulator'){
   block(c,x-38,y-22,76,29,14,'#849890','#4f6c75','#c6d8d7');for(let j=0;j<3;j++){lantern(c,x-35+j*26,y-13,s.flags.waterFlow);}
  }
  if(o.type==='waterBeacon'){block(c,x-27,y-20,54,27,15,'#849a98','#57737f','#c8dcdb');lantern(c,x-10,y-18,s.flags.waterLit);if(s.flags.waterLit)glow(c,x,y-50,100);}
  if(o.type==='board'){
   shadow(c,x+5,y+12,35,8);
   for(const sx of [-24,21])block(c,x+sx,y-40,5,54,4,'#796e56','#465b53','#b8b79a');
   block(c,x-32,y-49,64,45,6,'#756347','#405953','#b6ad88');rect(c,x-27,y-43,54,32,'#a18b62');
   poly(c,[[x-39,y-49],[x,y-62],[x+40,y-49],[x+38,y-44],[x-37,y-44]],'#e6eee4');
   line(c,[[x-37,y-44],[x+38,y-44]],'#8eabb5',3);
   for(let i=0;i<3;i++){const px=x-22+i*16,py=y-35+(i%2)*3;
    rect(c,px+1,py+2,13,19,'#534e3c55');rect(c,px,py,13,19,i===1?'#e3caa3':'#f1e3bd');
    ellipse(c,px+6,py+2,1.4,1.4,'#9a6650');for(let row=0;row<3;row++)line(c,[[px+3,py+7+row*3],[px+10-row,py+7+row*3]],'#807761',.8);
    if(s.flags.board&&i===1){c.strokeStyle='#628c87';c.lineWidth=1.5;c.beginPath();c.arc(px+7,py+13,3,0,Math.PI*2);c.stroke();}
   }
   c.fillStyle='#fff0c9';c.font='bold 8px "Yu Gothic UI"';c.textAlign='center';c.fillText('町のおしらせ',x,y-36);
  }
  if(o.type==='npc'){if(['elna','orlf'].includes(o.id))OkaeriResidentsArt.drawMap(c,o.id,x,y);else OkaeriCast.drawMap(c,o.id==='sae'?'sae':'maro',x,y,t);}
  if(o.type==='lamp')lantern(c,x,y);
  if(o.type==='episodeEvent'){if(o.base?.type==='npc'){if(['elna','orlf'].includes(o.base.id))OkaeriResidentsArt.drawMap(c,o.base.id,x,y);else OkaeriCast.drawMap(c,o.base.id==='sae'?'sae':'maro',x,y,t);}ellipse(c,x,y+4,23,9,'#e1c58288');line(c,[[x-16,y-5],[x,y-18],[x+16,y-5]],'#ffe2a4',3);c.textAlign='center';c.font='bold 12px sans-serif';c.fillStyle='#fff1cc';c.fillText('◆',x,y-27);}
  if(o.type==='episodeNpc'||(o.type==='episodeEvent'&&['リツ','ユラ'].includes(o.person))){OkaeriResidentsArt.drawMap(c,o.id==='yura'||o.person==='ユラ'?'yura':'ritsu',x,y);}
  if(o.type==='basket'){ellipse(c,x,y,16,10,'#978468');rect(c,x-12,y-12,24,11,'#cab699');line(c,[[x-13,y-10],[x-8,y-24],[x+8,y-24],[x+13,y-10]],'#837258',3);}
  if(o.type==='log'){line(c,[[x-10,y-43],[x+12,y+44]],'#766855',23);line(c,[[x-11,y-41],[x+10,y+40]],'#e3e8db',7);}
  if(o.type==='repair'){lantern(c,x+33,y-20,s.flags.repair);if(!s.flags.repair){line(c,[[x-15,y-5],[x+11,y+5]],'#ae8a59',4);ellipse(c,x,y-5,6,6,'#dfbb77');}}
  if(o.type==='mochi')OkaeriCast.drawMap(c,o.type,x,y,t);
  if(o.type==='crab')OkaeriCast.drawMap(c,o.type,x,y,t);
  if(o.type==='guardian')OkaeriCast.drawMap(c,o.type,x,y,t);
  if(o.type==='tower'){ellipse(c,x,y+7,43,17,'#425e6555');block(c,x-25,y-83,50,89,22,'#a4b0a1','#677e7b','#d4dfcf');rect(c,x-33,y-86,66,12,'#b3bfb0');poly(c,[[x-39,y-84],[x,y-119],[x+39,y-84]],'#e5ece1');rect(c,x-14,y-66,28,38,s.flags.lit?'#ffd18a':'#405f67');if(s.flags.lit)glow(c,x,y-47,150);rect(c,x-10,y-20,20,27,'#5a6a61');}
  if(o.type==='exit'){c.fillStyle='#4f787e';c.textAlign='center';c.font='18px sans-serif';c.fillText(o.id==='exit'?'↑':o.id==='ourHome'?'⌂':o.id==='houseExit'?'↓':o.id==='canalExit'?'→':o.id==='hillExit'?'←':['home','canalHome','hillHome'].includes(o.id)?'↓':'',x,y);}
  const ready=(['log','waterGate','windbreak'].includes(o.id)?s.lead==='touma':['repair','regulator','hillLens'].includes(o.id)?s.lead==='nina':true);const distance=Math.hypot(s.x-o.x,s.y-o.y);
  if(distance<2&&mode==='explore'){ellipse(c,x,y-(o.type==='guardian'?115:o.type==='npc'?82:56)+Math.sin(t*3)*2,12,12,ready?'#f0d49be8':'#c6dce5df');c.textAlign='center';c.fillStyle='#37515b';c.font='bold 12px sans-serif';c.fillText('E',x,y-(o.type==='guardian'?111:o.type==='npc'?78:52)+Math.sin(t*3)*2);}
 }});}
 const tx=s.x*T+24,ty=s.y*T+24;
 if(tx!==this.target.x||ty!==this.target.y){this.follow={...this.target};this.p.dir=OkaeriSprites.facing(tx-this.target.x,ty-this.target.y,this.p.dir);this.target={x:tx,y:ty};}
 this.p.x+=(tx-this.p.x)*.22;this.p.y+=(ty-this.p.y)*.22;
 const moving=Math.hypot(tx-this.p.x,ty-this.p.y)>1;
 const fx=this.follow.x-this.f.x,fy=this.follow.y-this.f.y;
 this.f.dir=OkaeriSprites.facing(fx,fy,this.f.dir);this.f.x+=fx*.22;this.f.y+=fy*.22;
 const followersMoving=Math.hypot(fx,fy)>1;
 const party=[{...this.p,id:s.lead,moving},{...this.f,id:s.lead==='touma'?'nina':'touma',moving:followersMoving}].sort((a,b)=>a.y-b.y);
 for(const actor of party.filter(actor=>!(s.episode?.chapter===3&&s.episode.step>=1&&s.episode.step<=3)||actor.id===s.lead))drawables.push({y:actor.y,draw:()=>OkaeriSprites.draw(c,actor.x,actor.y,actor.id,actor.dir||'down',actor.moving&&mode==='explore',t)});
 drawables.sort((a,b)=>a.y-b.y);for(const item of drawables)item.draw();
 if(s.episode?.chapter===3&&s.scene==='canal'&&s.episode.step>=1&&s.episode.step<=3){for(let i=0;i<12;i++){const ry=400+i*17;line(c,[[400+Math.sin(t*3+i)*15,ry],[630+Math.sin(t*3+i+.5)*15,ry+10]],'#b6e5ed66',2);}c.fillStyle='#a3d9e514';c.fillRect(0,0,W,H);}
 if(s.flags.lit){const g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'#dfae4820');g.addColorStop(1,'#2c31581c');c.fillStyle=g;c.fillRect(0,0,W,H);}
 if(s.scene!=='house')for(let i=0;i<55;i++){const x=(i*137+t*(9+i%5))%W,y=(i*89+t*(12+i%8))%H;ellipse(c,x,y,1.2+i%2,1.2+i%2,'#ffffff75');}
 const vign=c.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,W*.65);vign.addColorStop(0,'#071d3000');vign.addColorStop(1,'#071d3077');c.fillStyle=vign;c.fillRect(0,0,W,H);
};
function enemySvg(type){return OkaeriCast.battleArt(type);}
root.OkaeriWorld={Renderer,enemySvg};
})(globalThis);
