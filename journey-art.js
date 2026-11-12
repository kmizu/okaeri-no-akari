(function(root){
'use strict';
const T=48,P=n=>n*T+24;
function background(c,scene,h){
 if(!root.OkaeriJourney.names[scene])return false;
 const {rect,poly,line,ellipse,block,house,tree,lantern,glow}=h;
 const text=(s,x,y,size=14,color='#425c66')=>{c.font=size+'px "Yu Gothic UI",sans-serif';c.textAlign='center';c.fillStyle=color;c.fillText(s,x,y);};
 const sky=c.createLinearGradient(0,0,0,768);sky.addColorStop(0,'#7eabc3');sky.addColorStop(.38,'#cddfe0');sky.addColorStop(1,'#acced1');c.fillStyle=sky;c.fillRect(0,0,1152,768);
 if(scene==='lake'){
  {const q=[];{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,210],[125,70],[230,150],[360,55],[525,195],[645,88],[830,205],[1005,64],[1152,166],[1152,768],[0,768]],'#7393a8');}root.OkaeriTownArt?.lands(c,'lake1',q);}
  {const q=[];{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[65,145],[125,70],[177,122],[138,113],[119,123],[106,113]],'#e1ece7');poly(c,[[295,116],[360,55],[432,121],[374,102],[357,113],[335,100]],'#eff1e5');}root.OkaeriTownArt?.lands(c,'lake2',q);}
  {const q=[];{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[925,130],[1005,64],[1084,133],[1025,109],[1005,123],[980,111]],'#e9eee5');}root.OkaeriTownArt?.lands(c,'lake3',q);}
  {const q=[];{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,250],[183,222],[340,259],[550,228],[711,261],[910,215],[1152,253],[1152,768],[0,768]],'#a5c4cf');}root.OkaeriTownArt?.lands(c,'lake4',q);}
  const water=c.createLinearGradient(0,250,900,768);water.addColorStop(0,'#8db9cc');water.addColorStop(.6,'#548ca9');water.addColorStop(1,'#376d91');c.fillStyle=water;c.fillRect(330,270,822,498);
  for(let i=0;i<22;i++){const y=303+i*19;line(c,[[345+(i%4)*24,y],[600+i*12,y-3],[1140,y+8]],i%3?'#d7eef025':'#e1f0ed4a',1);}
  for(const p of [[[460,435],[490,470],[570,492],[604,534]],[[900,366],[853,409],[865,463]],[[768,629],[812,647],[842,700]]]){line(c,p,'#b8e3ed66',2);}
  root.OkaeriTownArt?.sheet(c,'lake',[[330,270],[1152,270],[1152,768],[330,768]],'#9cc6d6','#3d7496');
  {const q=[];{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,238],[260,233],[290,307],[455,315],[480,379],[664,365],[721,302],[852,287],[934,156],[1152,133],[1152,297],[1016,319],[942,433],[811,451],[765,489],[504,498],[456,636],[319,768],[0,768]],'#8eafb8');}root.OkaeriTownArt?.lands(c,'lake5',q);}
  {const q=[];{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,222],[249,217],[278,294],[443,299],[473,366],[648,351],[710,288],[839,274],[925,143],[1152,120],[1152,273],[1004,300],[929,414],[798,430],[754,467],[491,478],[438,620],[300,768],[0,768]],'#e6ede4');}root.OkaeriTownArt?.lands(c,'lake6',q);}
  const road=[[P(2),P(12)],[P(6),P(12)],[P(8),P(8)],[P(10),P(7)],[P(17),P(7)],[P(19),P(5)],[P(21),P(4)]];
  root.OkaeriTownArt?.trail(c,'lake',road,70);
  for(let i=0;i<19;i++){const x=390+i*30,y=380+Math.sin(i*.65)*13;ellipse(c,x,y,3,1.7,'#9cb1b188');ellipse(c,x+7,y+10,3,1.7,'#9cb1b166');}
  for(const [x,y,s] of [[75,210,1.4],[175,330,1.3],[80,440,1.2],[270,120,1.1],[400,180,1],[765,157,1.1],[1080,95,1.2]])tree(c,x,y,s);
  for(let i=0;i<12;i++){const x=440+i*51,y=537+(i%3)*37;line(c,[[x,y],[x+3,y-27-i%4*6]],'#7a9996',2);line(c,[[x+3,y-23],[x+10,y-31]],'#a3ad99',2);}
  for(const [x,y] of [[310,685],[510,449],[790,412],[1020,265]]){block(c,x,y-12,21,14,9,'#c4d3cf','#829ba1','#f6f4e8');}
  block(c,1030,235,22,33,8,'#b4c6c9','#6c8999','#e1e8df');rect(c,1037,244,8,10,'#efd7a1');
  for(let i=0;i<5;i++){const x=660+i*51,y=246-Math.sin(i)*8;block(c,x,y,4,10,2,'#7b9aa5','#6b8a99','#dbe6dd');ellipse(c,x+2,y+2,1.5,2,'#ffe7af');}
  text('湖岸の旧街道',230,690,13);text('対岸の灯り',890,225,11,'#516f83');
 }else if(scene==='lakeside'){
  rect(c,0,0,1152,768,'#d9e6df');poly(c,[[0,592],[400,537],[755,538],[1152,493],[1152,768],[0,768]],'#709eaf');
  for(let i=0;i<14;i++)line(c,[[50+i*87,620+i%3*27],[140+i*87,615+i%3*27]],'#bce0df55',2);
  root.OkaeriTownArt?.sheet(c,'lakeside',[[0,592],[400,537],[755,538],[1152,493],[1152,768],[0,768]],'#9cc6d6','#4f86a2');
  {const q=[];{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,440],[338,422],[636,437],[749,409],[1152,401],[1152,510],[767,555],[398,553],[0,617]],'#93b1b6');}root.OkaeriTownArt?.lands(c,'side1',q);}
  {const q=[];{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,414],[337,400],[638,414],[748,385],[1152,376],[1152,490],[767,531],[398,530],[0,595]],'#f0f0e3');}root.OkaeriTownArt?.lands(c,'side2',q);}
  root.OkaeriTownArt?.trail(c,'lakeside',[[P(3),P(13)],[P(3),P(9)],[P(19),P(9)]],84);
  // The landing is wide enough to work with gloves on; side faces remain visible.
  root.OkaeriTownArt?.dock(c);
  house(c,145,160,230,134,'#708590',{kind:'rest',name:'豆と黒パン'});house(c,457,120,243,155,'#587786',{kind:'lamp',name:'迎え灯の小屋'});house(c,784,146,249,145,'#747b88',{kind:'thread',name:'渡しの支度'});
  for(const [x,y] of [[315,347],[571,324],[946,344],[201,492],[730,409]])lantern(c,x,y);
  for(const [x,y,s] of [[55,165,1.2],[1121,168,1.25],[1033,92,1]])tree(c,x,y,s);
  line(c,[[215,189],[476,192],[826,180]],'#7c8171',2);for(let i=0;i<9;i++){const x=248+i*64;poly(c,[[x,192],[x+12,192],[x+6,213]],i%2?'#bc8f72':'#6d9996');}
  text('渡し場 ミナモ',574,296,15,'#f6e4ba');text('湖の便・山の便',907,312,12,'#f6e4ba');text('燻し魚と豆の店',263,316,12,'#eaddbf');
 }else root.OkaeriHomeArt?.workshop(c); // 灯守小屋の中は home-art.js の一枚絵
 return true;
}
function object(c,o,x,y,s,t,h){
 if(o.type!=='journeyProp')return;
 const {rect,poly,line,ellipse,block,lantern,glow}=h,j=s.journey||{};
 const label=(str,yy=y-50)=>{c.font='bold 12px "Yu Gothic UI",sans-serif';c.textAlign='center';c.fillStyle=s.scene==='lampworkshop'?'#f1dfb5':'#46626d';c.fillText(str,x,yy);};
 if(o.kind==='orlf'){root.OkaeriResidentsArt.drawMap(c,'orlf',x,y);return;}
 if(['exit','door','home'].includes(o.kind)){ellipse(c,x,y,18,7,'#d5c18a99');label(o.kind==='home'?'食卓':o.kind==='door'?'扉':'道の先',y-21);return;}
 if(o.kind==='sign'){block(c,x-5,y-50,10,62,5,'#8c795c','#4f6c68','#d4c69f');block(c,x-49,y-55,99,24,8,'#a58f68','#627566','#f1edda');label('ミナモ →',y-38);}
 if(o.kind==='light'){block(c,x-22,y-12,44,18,13,'#9fb5b3','#648492','#d8e4db');lantern(c,x-8,y-18);ellipse(c,x+5,y-42,8,21,'#dfefdf88');}
 if(o.kind==='bench'){root.OkaeriTownArt?.jprop(c,'bench',0,x,y);}
 if(o.kind==='cargo'){root.OkaeriTownArt?.jprop(c,'cargo',0,x,y);label('南の港から',y-48);}
 if(o.kind==='mirror'){
  block(c,x-7,y-46,14,59,9,'#9a8c70','#4d6b70','#ded5b6');poly(c,[[x-31,y-72],[x+27,y-82],[x+35,y-40],[x-25,y-30]],'#819caa');poly(c,[[x-26,y-67],[x+22,y-76],[x+29,y-44],[x-20,y-36]],j.mirror?'#f2e4a6':'#c8e4e9');
  if(j.mirror){poly(c,[[x-22,y-56],[x-255,y-320],[x-220,y-320],[x+22,y-58]],'#ffe7aa26');glow(c,x,y-54,65);}label('反射板',y-93);
 }
 if(o.kind==='shutter'){for(let i=0;i<4;i++)block(c,x-21+i*12,y-50-(j.shutter?i*9:0),10,64,6,'#9a8d70','#557375','#d5d6bb');ellipse(c,x,y-25,15,15,j.prism?'#d7b57d':'#9fcbd5');ellipse(c,x,y-25,9,9,'#657e7e');label('風よけ',y-97);}
 if(o.kind==='desk'){root.OkaeriTownArt?.jprop(c,'jdesk',0,x,y);label('灯守の日誌',y-43);}
 if(o.kind==='prism'){root.OkaeriTownArt?.jprop(c,'jprism',j.prism,x,y);if(j.mirror){glow(c,x,y-42,95);poly(c,[[500,155],[545,155],[x+35,y-45],[x-28,y-45]],'#f7e6a028');}label('共鳴灯',y-84);}
 if(o.kind==='reply'){root.OkaeriTownArt?.jprop(c,'jreply',j.reply,x,y);if(j.reply)poly(c,[[x-17,y-73],[x-400,y-200],[x-335,y-200],[x+16,y-73]],'#ffdf8828');label('応答灯',y-104);}
 if(o.kind==='meal'){block(c,x-45,y-21,90,29,12,'#ad946d','#617568','#dfcba4');for(const dx of [-20,15]){ellipse(c,x+dx,y-29,15,9,'#e6d3aa');ellipse(c,x+dx,y-30,10,5,'#9a744b');line(c,[[x+dx-3,y-43],[x+dx+2,y-49],[x+dx,y-58]],'#f4efe0aa',2);}label('豆のスープ',y-68);}
 if(o.kind==='map'){root.OkaeriTownArt?.jprop(c,'jmap',0,x,y);label('灯路図',y-89);}
 // Only the next useful interaction gets the gold objective marker.
 const target=j.step===0?'journeyTrail':j.step===1?'journeyShoreLight':j.step===2?'journeyOrlf':j.step===3?'journeyDesk':j.step===4?(!j.mirror?'journeyMirror':!j.prism?'journeyPrism':!j.shutter?'journeyShutter':'journeyReply'):j.step===6?'journeyMeal':j.step===7?'journeyReturn':null;
 if(o.id===target){c.font='bold 16px sans-serif';c.textAlign='center';c.fillStyle='#ffdea2';c.fillText('◆',x,y-116+Math.sin(t*3)*3);}
}
root.OkaeriJourneyArt={background,object};
})(globalThis);
