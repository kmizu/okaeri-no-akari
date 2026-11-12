(function(root){
'use strict';
const T=48,P=n=>n*T+24;
function background(c,scene,h){
 if(!root.OkaeriJourney.names[scene])return false;
 const {rect,poly,line,ellipse,block,house,tree,lantern,glow}=h;
 const text=(s,x,y,size=14,color='#425c66')=>{c.font=size+'px "Yu Gothic UI",sans-serif';c.textAlign='center';c.fillStyle=color;c.fillText(s,x,y);};
 const sky=c.createLinearGradient(0,0,0,768);sky.addColorStop(0,'#7eabc3');sky.addColorStop(.38,'#cddfe0');sky.addColorStop(1,'#acced1');c.fillStyle=sky;c.fillRect(0,0,1152,768);
 if(scene==='lake'){
  {const q=[],poly0=poly;{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,210],[125,70],[230,150],[360,55],[525,195],[645,88],[830,205],[1005,64],[1152,166],[1152,768],[0,768]],'#7393a8');}if(!root.OkaeriTownArt?.lands(c,'lake1',q))for(const [p,col] of q)poly0(c,p,col);}
  {const q=[],poly0=poly;{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[65,145],[125,70],[177,122],[138,113],[119,123],[106,113]],'#e1ece7');poly(c,[[295,116],[360,55],[432,121],[374,102],[357,113],[335,100]],'#eff1e5');}if(!root.OkaeriTownArt?.lands(c,'lake2',q))for(const [p,col] of q)poly0(c,p,col);}
  {const q=[],poly0=poly;{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[925,130],[1005,64],[1084,133],[1025,109],[1005,123],[980,111]],'#e9eee5');}if(!root.OkaeriTownArt?.lands(c,'lake3',q))for(const [p,col] of q)poly0(c,p,col);}
  {const q=[],poly0=poly;{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,250],[183,222],[340,259],[550,228],[711,261],[910,215],[1152,253],[1152,768],[0,768]],'#a5c4cf');}if(!root.OkaeriTownArt?.lands(c,'lake4',q))for(const [p,col] of q)poly0(c,p,col);}
  const water=c.createLinearGradient(0,250,900,768);water.addColorStop(0,'#8db9cc');water.addColorStop(.6,'#548ca9');water.addColorStop(1,'#376d91');c.fillStyle=water;c.fillRect(330,270,822,498);
  for(let i=0;i<22;i++){const y=303+i*19;line(c,[[345+(i%4)*24,y],[600+i*12,y-3],[1140,y+8]],i%3?'#d7eef025':'#e1f0ed4a',1);}
  for(const p of [[[460,435],[490,470],[570,492],[604,534]],[[900,366],[853,409],[865,463]],[[768,629],[812,647],[842,700]]]){line(c,p,'#b8e3ed66',2);}
  root.OkaeriTownArt?.sheet(c,'lake',[[330,270],[1152,270],[1152,768],[330,768]],'#9cc6d6','#3d7496');
  {const q=[],poly0=poly;{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,238],[260,233],[290,307],[455,315],[480,379],[664,365],[721,302],[852,287],[934,156],[1152,133],[1152,297],[1016,319],[942,433],[811,451],[765,489],[504,498],[456,636],[319,768],[0,768]],'#8eafb8');}if(!root.OkaeriTownArt?.lands(c,'lake5',q))for(const [p,col] of q)poly0(c,p,col);}
  {const q=[],poly0=poly;{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,222],[249,217],[278,294],[443,299],[473,366],[648,351],[710,288],[839,274],[925,143],[1152,120],[1152,273],[1004,300],[929,414],[798,430],[754,467],[491,478],[438,620],[300,768],[0,768]],'#e6ede4');}if(!root.OkaeriTownArt?.lands(c,'lake6',q))for(const [p,col] of q)poly0(c,p,col);}
  const road=[[P(2),P(12)],[P(6),P(12)],[P(8),P(8)],[P(10),P(7)],[P(17),P(7)],[P(19),P(5)],[P(21),P(4)]];
  if(!root.OkaeriTownArt?.trail(c,'lake',road,70)){line(c,road.map(([x,y])=>[x+5,y+14]),'#6c8d9a44',92);line(c,road,'#c5d7d6',86);line(c,road,'#f4f3e7',65);}
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
  {const q=[],poly0=poly;{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,440],[338,422],[636,437],[749,409],[1152,401],[1152,510],[767,555],[398,553],[0,617]],'#93b1b6');}if(!root.OkaeriTownArt?.lands(c,'side1',q))for(const [p,col] of q)poly0(c,p,col);}
  {const q=[],poly0=poly;{const poly=(c,p,col)=>q.push([p,col]);poly(c,[[0,414],[337,400],[638,414],[748,385],[1152,376],[1152,490],[767,531],[398,530],[0,595]],'#f0f0e3');}if(!root.OkaeriTownArt?.lands(c,'side2',q))for(const [p,col] of q)poly0(c,p,col);}
  if(!root.OkaeriTownArt?.trail(c,'lakeside',[[P(3),P(13)],[P(3),P(9)],[P(19),P(9)]],84)){line(c,[[P(3),P(13)],[P(3),P(9)],[P(19),P(9)]],'#d0d8cc',105);line(c,[[P(3),P(13)],[P(3),P(9)],[P(19),P(9)]],'#e9eadd',76);}
  // The landing is wide enough to work with gloves on; side faces remain visible.
  const vdock=root.OkaeriTownArt?.dock(c);if(!vdock){block(c,744,439,218,242,17,'#b69a75','#6a7972','#dfcfaa');}
  if(!vdock){for(let y=446;y<678;y+=17){line(c,[[748,y],[955,y]],'#7c7d6355',1);for(const x of [758,925])ellipse(c,x,y+4,1.3,1.3,'#58665d');}}
  if(!vdock){for(const x of [742,960])for(const y of [447,538,639]){block(c,x,y,9,62,7,'#8c8265','#516c70','#eef1e3');}}
  house(c,145,160,230,134,'#708590',{kind:'rest',name:'豆と黒パン'});house(c,457,120,243,155,'#587786',{kind:'lamp',name:'迎え灯の小屋'});house(c,784,146,249,145,'#747b88',{kind:'thread',name:'渡しの支度'});
  for(const [x,y] of [[315,347],[571,324],[946,344],[201,492],[730,409]])lantern(c,x,y);
  if(!vdock){for(const [x,y] of [[388,389],[415,377],[1047,368]]){block(c,x,y,35,35,13,'#a4825b','#586c65','#d2ba8d');line(c,[[x+5,y+7],[x+30,y+30]],'#6c7257',2);}}
  if(!vdock){poly(c,[[985,606],[1088,597],[1122,616],[1084,648],[999,654]],'#465f66');poly(c,[[991,598],[1086,590],[1112,609],[1080,636],[1003,642]],'#a88b67');}
  if(!vdock){for(let i=0;i<5;i++)line(c,[[1002+i*17,598],[1006+i*17,637]],'#6c7160',3);line(c,[[1006,631],[966,604],[948,565]],'#d6c8a5',3);poly(c,[[992,588],[1088,585],[1105,607],[1001,626]],'#e1ded0');}
  for(const [x,y,s] of [[55,165,1.2],[1121,168,1.25],[1033,92,1]])tree(c,x,y,s);
  line(c,[[215,189],[476,192],[826,180]],'#7c8171',2);for(let i=0;i<9;i++){const x=248+i*64;poly(c,[[x,192],[x+12,192],[x+6,213]],i%2?'#bc8f72':'#6d9996');}
  text('渡し場 ミナモ',574,296,15,'#f6e4ba');text('湖の便・山の便',907,312,12,'#f6e4ba');text('燻し魚と豆の店',263,316,12,'#eaddbf');
 }else if(root.OkaeriHomeArt?.workshop(c)){
  // 描画エンジンの絵（home-art.js）
 }else{
  rect(c,0,0,1152,768,'#2f4851');poly(c,[[128,115],[1008,115],[1070,700],[90,700]],'#586260');
  rect(c,142,139,872,520,'#bf9a6e');for(let y=145;y<670;y+=32){rect(c,145,y,865,2,'#715f4a55');for(let x=155+(y%64)*2;x<1000;x+=165)rect(c,x,y,1,30,'#816b5155');}
  block(c,130,95,885,77,22,'#8d7661','#41575a','#c9ac83');
  for(const x of [148,363,765,999]){block(c,x,90,15,588,12,'#816a53','#3f5759','#b8a480');}
  // Lake-facing windows and brass pipes explain the outdoor/indoor link.
  for(const x of [447,638]){block(c,x,49,117,123,11,'#ac9778','#3d5961','#d4c5a0');rect(c,x+9,58,98,102,'#9fc4ce');poly(c,[[x+10,134],[x+48,99],[x+78,120],[x+107,97],[x+107,160],[x+10,160]],'#d8e3dd');line(c,[[x+57,60],[x+57,160]],'#857c65',5);}
  block(c,415,104,383,15,10,'#8c7b60','#40595c','#d8c9a0');
  line(c,[[P(17),P(5)-48],[P(14),P(5)-48],[P(14),P(8)-30],[P(10),P(8)-30]],'#5b6253',14);line(c,[[P(17),P(5)-50],[P(14),P(5)-50],[P(14),P(8)-32],[P(10),P(8)-32]],'#c8b37d',7);
  block(c,195,240,259,50,19,'#9b7651','#5b5d4b','#d6b684');for(let i=0;i<4;i++){rect(c,216+i*48,245,36,24,'#e6d5af');line(c,[[222+i*48,252],[244+i*48,252]],'#938465',1);}
  block(c,897,494,62,90,15,'#b5986d','#626750','#d9c8a0');for(let row=0;row<3;row++)for(let i=0;i<4;i++)rect(c,903+i*12,499+row*25,9,20,['#879a8a','#b17d69','#c9b885'][i%3]);
  block(c,206,517,54,70,16,'#495d5c','#293f47','#8b9c8a');rect(c,214,534,34,31,'#263c3e');glow(c,231,552,154);poly(c,[[216,561],[226,539],[233,551],[240,537],[246,561]],'#f7cb80');line(c,[[230,514],[230,194]],'#596d69',15);
  rect(c,329,662,65,13,'#4a5551');rect(c,335,645,53,20,'#829084');text('ミナモ 灯守小屋',603,641,13,'#5b6559');
  glow(c,550,355,280);
 }
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
 if(o.kind==='bench'&&root.OkaeriTownArt?.jprop(c,'bench',0,x,y)){}else if(o.kind==='bench'){for(const dx of [-28,21])block(c,x+dx,y-9,7,24,6,'#80775b','#516e6b','#d0c6a7');block(c,x-35,y-18,70,12,15,'#a59673','#5e7973','#e9e9d9');}
 if(o.kind==='cargo'&&root.OkaeriTownArt?.jprop(c,'cargo',0,x,y)){label('南の港から',y-48);}else if(o.kind==='cargo'){for(let i=0;i<2;i++){block(c,x-23+i*24,y-17-i*10,31,30,11,'#aa8a62','#5c7167','#d8c296');rect(c,x-16+i*24,y-12-i*10,17,12,'#e9dfbb');}label('南の港から',y-48);}
 if(o.kind==='mirror'){
  block(c,x-7,y-46,14,59,9,'#9a8c70','#4d6b70','#ded5b6');poly(c,[[x-31,y-72],[x+27,y-82],[x+35,y-40],[x-25,y-30]],'#819caa');poly(c,[[x-26,y-67],[x+22,y-76],[x+29,y-44],[x-20,y-36]],j.mirror?'#f2e4a6':'#c8e4e9');
  if(j.mirror){poly(c,[[x-22,y-56],[x-255,y-320],[x-220,y-320],[x+22,y-58]],'#ffe7aa26');glow(c,x,y-54,65);}label('反射板',y-93);
 }
 if(o.kind==='shutter'){for(let i=0;i<4;i++)block(c,x-21+i*12,y-50-(j.shutter?i*9:0),10,64,6,'#9a8d70','#557375','#d5d6bb');ellipse(c,x,y-25,15,15,j.prism?'#d7b57d':'#9fcbd5');ellipse(c,x,y-25,9,9,'#657e7e');label('風よけ',y-97);}
 if(o.kind==='desk'&&root.OkaeriTownArt?.jprop(c,'jdesk',0,x,y)){label('灯守の日誌',y-43);}else if(o.kind==='desk'){rect(c,x-29,y-25,53,28,'#eadbb9');for(let row=0;row<4;row++)line(c,[[x-21,y-20+row*5],[x+17-row*4,y-20+row*5]],'#8b876c',1);rect(c,x-2,y-26,2,30,'#b9a47a');label('灯守の日誌',y-43);}
 if(o.kind==='prism'&&root.OkaeriTownArt?.jprop(c,'jprism',j.prism,x,y)){if(j.mirror){glow(c,x,y-42,95);poly(c,[[500,155],[545,155],[x+35,y-45],[x-28,y-45]],'#f7e6a028');}label('共鳴灯',y-84);}else if(o.kind==='prism'){
  block(c,x-43,y-24,87,29,15,'#b29b6b','#5b7063','#e5d0a1');for(let i=0;i<3;i++){const px=x-26+i*26;ellipse(c,px,y-35,10,20,j.prism?['#e8d099','#a5d2bb','#abc9dd'][i]:'#8cacae');line(c,[[px-4,y-47],[px+3,y-34]],'#edf2dcaa',2);}
  if(j.mirror){glow(c,x,y-42,95);poly(c,[[500,155],[545,155],[x+35,y-45],[x-28,y-45]],'#f7e6a028');}label('共鳴灯',y-66);
 }
 if(o.kind==='reply'&&root.OkaeriTownArt?.jprop(c,'jreply',j.reply,x,y)){if(j.reply)poly(c,[[x-17,y-73],[x-400,y-200],[x-335,y-200],[x+16,y-73]],'#ffdf8828');label('応答灯',y-104);}else if(o.kind==='reply'){
  block(c,x-32,y-22,64,32,16,'#a69b79','#5d756e','#e2dab5');ellipse(c,x,y-55,27,35,'#718c91');ellipse(c,x,y-55,21,28,j.reply?'#ffdf98':'#aac9cd');rect(c,x-6,y-29,12,18,'#667e73');
  if(j.reply){glow(c,x,y-60,155);poly(c,[[x-17,y-73],[x-400,y-200],[x-335,y-200],[x+16,y-73]],'#ffdf8828');}label('応答灯',y-104);
 }
 if(o.kind==='meal'){block(c,x-45,y-21,90,29,12,'#ad946d','#617568','#dfcba4');for(const dx of [-20,15]){ellipse(c,x+dx,y-29,15,9,'#e6d3aa');ellipse(c,x+dx,y-30,10,5,'#9a744b');line(c,[[x+dx-3,y-43],[x+dx+2,y-49],[x+dx,y-58]],'#f4efe0aa',2);}label('豆のスープ',y-68);}
 if(o.kind==='map'&&root.OkaeriTownArt?.jprop(c,'jmap',0,x,y)){label('灯路図',y-89);}else if(o.kind==='map'){poly(c,[[x-31,y-71],[x+32,y-67],[x+28,y-10],[x-35,y-14]],'#e4d2a2');line(c,[[x-24,y-22],[x-4,y-45],[x+8,y-36],[x+25,y-60]],'#829a86',3);for(const [dx,dy] of [[-24,-22],[-4,-45],[8,-36],[25,-60]])ellipse(c,x+dx,y+dy,3,3,'#bc8a52');label('灯路図',y-89);}
 // Only the next useful interaction gets the gold objective marker.
 const target=j.step===0?'journeyTrail':j.step===1?'journeyShoreLight':j.step===2?'journeyOrlf':j.step===3?'journeyDesk':j.step===4?(!j.mirror?'journeyMirror':!j.prism?'journeyPrism':!j.shutter?'journeyShutter':'journeyReply'):j.step===6?'journeyMeal':j.step===7?'journeyReturn':null;
 if(o.id===target){c.font='bold 16px sans-serif';c.textAlign='center';c.fillStyle='#ffdea2';c.fillText('◆',x,y-116+Math.sin(t*3)*3);}
}
root.OkaeriJourneyArt={background,object};
})(globalThis);
