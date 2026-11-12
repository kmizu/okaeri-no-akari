(function(root){
'use strict';
const S=root.OkaeriStory,E=root.OkaeriEpisodes;
const names={lake:'氷湖の旧街道',lakeside:'渡し場の集落 ミナモ',lampworkshop:'古い灯守小屋'};
const spawns={lake:[3,12],lakeside:[3,12],lampworkshop:[7,11]};
const prop=(id,x,y,label,kind)=>({id,x,y,label,type:'journeyProp',kind});
const maps={
 lake:[prop('lakeToTown',2,13,'ユキネへの道','exit'),prop('journeyTrail',6,12,'雪に傾いた道標','sign'),prop('journeyShoreLight',13,7,'湖岸の迎え灯','light'),prop('journeyReturn',7,10,'遠い岸を望む待ち場','bench'),prop('lakeToVillage',21,4,'渡し場の集落へ','exit')],
 lakeside:[prop('villageToLake',3,13,'氷湖沿いの街道へ','exit'),prop('journeyOrlf',6,8,'配達先のオルフ','orlf'),prop('villageToWorkshop',12,6,'古い灯守小屋へ','door'),prop('journeyCargo',9,9,'遠い町の荷札','cargo'),prop('journeyMirror',17,11,'湖岸の反射板','mirror'),prop('journeyShutter',19,9,'凍った風よけの留め輪','shutter'),prop('journeyMeal',6,10,'港の豆スープと黒パン','meal')],
 lampworkshop:[prop('workshopToVillage',7,13,'小屋の外へ・合流する','door'),prop('journeyDesk',7,5,'灯守の作業日誌','desk'),prop('journeyPrism',10,8,'三色の共鳴灯','prism'),prop('journeyReply',17,5,'遠い岸への応答灯','reply'),prop('journeyMap',17,10,'壁に残った灯路図','map')]
};
Object.assign(S.objects,maps);
function active(s){return !!s.journey&&s.journey.step<9;}
function split(s){return active(s)&&[4,5].includes(s.journey.step);}
function walkable(scene,x,y){return root.OkaeriCore.journeyTile(scene,x,y);}
const previousWalkable=S.walkable;
S.walkable=(s,x,y)=>names[s.scene]?walkable(s.scene,x,y):previousWalkable(s,x,y);
function capture(s){if(split(s))s.journey.positions[s.lead]={scene:s.scene,x:s.x,y:s.y};}
function switchActor(a){
 if(!split(a.state))return false;
 capture(a.state);a.state.lead=a.state.lead==='touma'?'nina':'touma';
 const p=a.state.journey.positions[a.state.lead];a.scene(p.scene,p.x,p.y);
 a.toast((a.state.lead==='touma'?'湖岸のトウマ':'小屋のニナ')+'へ。Qで相手に切り替えられます。');return true;
}
const goals=['湖岸の道標を、トウマで直そう','ニナで湖岸の迎え灯を調べよう','街道の先、ミナモでオルフに会おう','古い灯守小屋の日誌を二人で読もう','','小屋の出口で合流しよう','二人で港のスープを食べよう','湖岸の待ち場で、帰り道を確かめよう','ユキネへ戻り、二人の家の食卓へ'];
function objective(s){
 if(!active(s))return null;const j=s.journey;
 if(j.step===4){const next=!j.mirror?'トウマ：湖岸の反射板を直す':!j.prism?'ニナ：小屋の共鳴灯を合わせる':!j.shutter?'トウマ：風よけの留め輪を開く':'ニナ：遠い岸へ応答灯をともす';return '氷湖の迎え灯｜'+next+'（Qで二人を切り替え）';}
 return '氷湖の迎え灯｜'+goals[j.step]+(j.step===5?'（ニナを操作して小屋の出口へ）':'');
}
function notes(s){if(!s.journey)return [];const j=s.journey;return [j.step>=2?'ユキネの「帰り灯」は、ミナモでは「迎え灯」と呼ばれる。':null,j.reply?'二人でつないだ光に、地図の外から返事が来た。':null,j.step===9?'氷湖の小旅行：二人で合流し、豆スープの作り方を家へ持ち帰った。':null].filter(Boolean);}
function advance(a,step){a.state.journey.step=step;a.save();a.updateHud();}
const departure=[
 ['','工房への返事を預ける前に、二人はもう一つ依頼を受けた。配達先のミナモで、迎え灯がうまく光らなくなっているという。'],
 ['オルフ','夕方の便が戻る時、湖岸の目印が見えにくいんだって。あちらの灯守から、ユキネの二人にも見てもらえないかと頼まれてる。'],
 ['touma','ミナモって、湖の向こうの渡し場ですよね。今日中に行って帰れますか。'],
 ['オルフ','湖面を渡らず、岸の街道を歩けば大丈夫。俺も配達で先に行くから、港で合流しよう。日暮れ前には帰りの道に出られるよ。'],
 ['nina','そこの灯りも、ユキネと同じ仕組みなのかな。'],
 ['オルフ','昔、南の工房の人が道具を直した小屋があるよ。灯守の作業日誌と鍵を預かってるから、そこで確かめられる。'],
 ['nina','研修のことも、少し分かるかもしれないね。行ってみたい。'],
 ['touma','直せない所があったら、図に残してサエさんに相談しよう。水筒と替えの手袋も持っていこう。'],
 ['','家の火を確かめた二人は、町の東の街道へ出た。今日の用事を済ませて、夕飯にはまた同じ家へ帰るつもりで。']
];
function begin(a){
 if(active(a.state)){a.toast(objective(a.state));return;}
 a.state.journey={step:0,mirror:false,prism:false,shutter:false,reply:false,positions:{touma:{scene:'lakeside',x:17,y:9},nina:{scene:'lampworkshop',x:7,y:11}}};
 a.state.lead='touma';a.scene('lake',...spawns.lake);
 a.talk(departure,()=>a.toast('小旅行「氷湖の迎え灯」。湖面には降りず、岸の街道を進もう。'));
}
function hint(a,text){a.talk([['',text]]);return true;}
function work(a,id,key,needs,lines){
 const s=a.state,j=s.journey,actor=['mirror','shutter'].includes(key)?'touma':'nina';
 if(j.step!==4||j[key])return hint(a,j[key]?'手入れした仕掛けは、今も静かに働いている。':'二人で日誌を読み、役割を決めてから調べよう。');
 if(s.lead!==actor)return hint(a,(actor==='touma'?'湖岸のトウマ':'小屋のニナ')+'の仕事です。Qで切り替えよう。');
 if(needs&&!j[needs])return hint(a,{mirror:'まだ窓に光が来ていない。湖岸のトウマに、反射板を向けてもらおう。',prism:'留め輪の氷は動かない。ニナが共鳴灯を合わせると、内側から温まるはずだ。',shutter:'灯りの出口が閉じている。トウマに風よけを開けてもらおう。'}[needs]);
 a.talk(lines,()=>{j[key]=true;if(key==='reply')j.step=5;a.save();a.updateHud();});return true;
}
function handle(id,a){
 const s=a.state,j=s.journey;
 if(id==='journeyGate'){if(!s.episode||s.episode.chapter<6)return false;if(s.episode.chapter===6&&!j&&s.episode.step<3)return hint(a,'小旅行の前に、手紙と旅行鞄の用意を済ませよう。');if(active(s)&&j.step<8)return hint(a,'今は旅先の用事を進めよう。手帳で、二人の現在の目的を確かめられる。');a.scene('lake',...spawns.lake);return true;}
 if(id==='journeyHome'&&active(s)&&j.step===8&&s.scene==='house'){
  j.step=9;E.finishEvent(a);E.handle('episodeEvent',a);return true;
 }
 if(!names[s.scene])return false;
 const o=maps[s.scene].find(o=>o.id===id);if(!o)return false;
 if(id==='journeyCargo')return hint(a,'荷札には「リュカ港の塩」「カルデ盆地の乾燥豆」。道の先には、この町の台所とつながる知らない土地がある。');
 if(id==='journeyMap')return hint(a,'古い灯路図。ユキネは左下の小さな印だ。海沿いにも、山の向こうにも道が延び、右端は別の紙につながるように途切れている。');
 if(id==='lakeToTown'){
  if(active(s)&&j.step!==8)return hint(a,'帰りの待ち合わせは、ミナモの港。今日の用事を確かめてから帰ろう。');a.scene('town',22,12);return true;
 }
 if(id==='lakeToVillage'){
  if(active(s)&&j.step<2)return hint(a,'道標と、岸の迎え灯を確かめてから進もう。');a.scene('lakeside',...spawns.lakeside);return true;
 }
 if(id==='villageToLake'){
  if(split(s))return hint(a,'ニナとここで待ち合わせている。Qでニナへ切り替えて、二人の仕事を確かめよう。');
  if(active(s)&&j.step<7)return hint(a,'帰る前に、町での用事を済ませよう。'+goals[j.step]);a.scene('lake',20,5);return true;
 }
 if(id==='villageToWorkshop'){
  if(split(s))return hint(a,'小屋の中はニナに任せている。Qでニナを操作できる。');
  if(active(s)&&j.step<3)return hint(a,'まず配達先のオルフに声をかけよう。');a.scene('lampworkshop',...spawns.lampworkshop);return true;
 }
 if(id==='workshopToVillage'){
  if(split(s)){
   if(j.step!==5||s.lead!=='nina')return hint(a,'もう少し、二人の仕掛けを確かめたい。Qで相手の様子も見られる。');
   a.talk([['','扉を開けると、工具をしまったトウマが待っていた。'],['touma','応答の光、外でも見えたよ。最初は風の音で、ニナの声が聞こえなくてさ。でも窓の灯りが動いて、そっちは進んでるんだって分かった。'],['nina','私も、反射板の光が窓に入った時、ほっとした。日誌だけだと分からなかった線まで見えて……トウマが向けてくれてるうちに、合わせたいって思ったんだ。'],['touma','あの留め輪も、ちゃんと温まった。おかげで手袋を外さずに済んだよ。……ニナの方は、寒くなかった？　窓際にずっと立ってただろ。'],['nina','少し寒かった。小屋の中だから平気、って思ってたけど。今はあったかい物を食べながら、そっちで何が見えたか、ゆっくり聞きたいな。'],['','外套の袖が触れる距離に戻る。二人は並んで港の通りへ歩いた。']],()=>{j.step=6;a.scene('lakeside',12,7);});return true;
  }
  a.scene('lakeside',12,7);return true;
 }
 if(!active(s))return hint(a,{journeyTrail:'直した道標の先に、湖岸の街道が続く。',journeyShoreLight:'岸の灯りは、旅人に道の位置を知らせている。',journeyOrlf:'配達鞄が、港の荷車に掛かっている。次の便はユキネ行きらしい。',journeyDesk:'灯守たちの作業日誌。古い文字の隣に、後の時代の修理の跡がある。',journeyMeal:'豆と塩漬け野菜の匂い。黒パンを浸して食べる、港の昼ごはん。',journeyReturn:'向こう岸の灯りを見渡せる。知らない町にも、そろそろ夕飯の湯気が立つ頃だ。'}[id]||'手入れされた灯りの仕掛け。別々の持ち場の仕事が、ここで一つにつながっている。');
 const stage=(expected,actor,lines,next)=>{
  if(j.step!==expected)return hint(a,'ここは確かめた。'+(objective(s)||'今日は二人で帰ろう。'));
  if(actor&&s.lead!==actor)return hint(a,(actor==='touma'?'トウマ':'ニナ')+'の出番。Qで交代してみよう。');
  a.talk(lines,()=>advance(a,next));return true;
 };
 if(id==='journeyTrail')return stage(0,'touma',[
  ['','雪を払うと、「ミナモ」と、その先の港町の名が現れた。支柱が一つ、霜で浮いている。'],['touma','道の名前が続いてる。ここが終点じゃないんだな。'],
  ['nina','左の道、地図だと線一本だったのに。こんなに湖が見えるんだ。'],['','ニナが道標を支え、トウマが木のくさびを入れ直す。矢印が人の目の高さに戻った。'],
  ['touma','これで、次に来る人も読める。'],['nina','私たちも、帰りに頼ろう。']
 ],1);
 if(id==='journeyShoreLight')return stage(1,'nina',[
  ['','迎え灯の硝子には、細い筋が何重にも刻まれている。ニナが小さな火を近づけると、湖の側へ光が伸びた。'],
  ['nina','ユキネのと同じ芯。でも、この筋は初めて見た。'],['touma','向こう岸に、似た塔がある。'],['','少し遅れて、遠い光が一度揺れる。風なのか返事なのか、まだ分からない。'],
  ['nina','帰り灯って、来る人だけが見るものだと思ってた。'],['touma','待ってる方も、見てたのかもな。'],['','街道は湖に沿って曲がり、煙突の並ぶ集落へ続いていた。']
 ],2);
 if(id==='journeyOrlf')return stage(2,null,[
  ['オルフ','おつかれ。ようこそ、ミナモへ。ユキネから来ると、風の匂いが違うだろう。'],['nina','魚を燻す匂い。あと、知らないスープ。'],
  ['オルフ','干した豆と塩漬け野菜。昼に作って、帰る便の人に夕方まで出すんだ。'],['touma','あの灯りも、ユキネのと似てます。'],
  ['オルフ','こっちでは迎え灯と呼ぶよ。向こう岸の便が、港の位置を確かめるのに使う。最近光が弱いのは、外の反射板が動かなくなったせいかもしれない。'],
  ['nina','南の工房の人も、同じ仕掛けを使ってたんだよね。'],['オルフ','うん。小屋に記録を残してるよ。鍵を開けておいたから、日誌を読んで確かめておいで。分からなければ、状態をあちらの当番に伝えよう。'],
  ['','軒先の話し声には、二人の知らない地名が交じっていた。']
 ],3);
 if(id==='journeyDesk'){
  if(j.step!==3)return hint(a,'「外の反射板と、内の灯。どちらも人の手で確かめること」。日誌には、二人分の当番名が並んでいる。');
  a.talk([
   ['','日誌の表紙には「帰る便を迎えるための灯」とある。後ろの頁ほど字が新しく、修理の仕方も少しずつ違った。'],
   ['nina','一人が発明して、ずっと同じにしてたわけじゃないんだ。'],['touma','この留め具、家の玄関にも使えそう。風が抜けるようになってる。'],
   ['','図には湖岸の反射板と、小屋の共鳴灯。片方から届く光で、もう片方の調整を確かめる仕組みだった。'],
   ['nina','外からの光を見ながら、中の輪を合わせるんだね。二人でここにいるより、持ち場を分けた方が確かめやすそう。窓から合図も見えるかな。'],['touma','外の反射板と留め具は俺が見るよ。ニナは、日誌を見ながらこっちの灯りを頼めるか。動かしたら窓へ手を振るから、見えたら返してほしい。'],['nina','分かった。合図を返すね。途中で分からなくなったら、一度やめて、窓から声をかける。トウマも、返事がないまま待ってないで呼んでね。'],
   ['touma','ああ。無理に一人で終わらせようとはしないよ。終わった方は、この扉で待ってよう。合流してから、オルフさんに報告しに行こうな。'],['','湖岸と小屋の窓は、互いに見える距離にある。二人は持ち場へ分かれた。'],
   ['','Q、または右上の交代ボタンで、二人の場所を行き来できます。相手の仕事で仕掛けが変わったら、切り替えて確かめよう。']
  ],()=>{j.step=4;s.lead='touma';a.scene('lakeside',17,9);});return true;
 }
 if(id==='journeyMirror')return work(a,id,'mirror',null,[
  ['touma','留め具はまだ使える。軸の雪だけ取れば……。'],['','反射板を支える腕を、少しずつ上げる。小屋の窓に、細い光が届いた。'],
  ['touma','ニナ、こっちは向いたよ。そっちから、見える？'],['','窓の向こうで、ニナの手が上がった。'],['','ニナへ切り替えると、小屋の共鳴灯を調整できます。']
 ]);
 if(id==='journeyPrism')return work(a,id,'prism','mirror',[
  ['','トウマの向けた光が、三枚の硝子を順に通る。ニナは日誌の筋と重なるよう、灯の輪を回した。'],['nina','ここ。暖かくなる線が、外まで続いてる。'],
  ['','熱は太い光にならず、真鍮の管をゆっくり伝った。窓の下で、留め輪を包む氷がほどけていく。'],['nina','トウマの手、冷たくならずに済むかな。'],
  ['','湖岸のトウマへ切り替えて、風よけの留め輪を確かめよう。']
 ]);
 if(id==='journeyShutter')return work(a,id,'shutter','prism',[
  ['touma','動く。さっきは、こんなに固かったのに。'],['','留め輪を回すと、風よけが開く。光の出口へ向けて、薄い硝子の羽が重なった。'],
  ['touma','ありがとう。手袋を外さずにできた。'],['','窓へ手を振る。ニナがうなずいて、灯りの前へ戻るのが見えた。'],['','ニナへ切り替えて、応答灯をともそう。']
 ]);
 if(id==='journeyReply')return work(a,id,'reply','shutter',[
  ['','ニナは芯に小さな火を移した。トウマが整えた硝子を通って、光が湖を越えていく。'],['nina','二度、短く。それから一度、長く。……日誌の通り。'],
  ['','しばらく何も起こらない。火を小さくしようとした時、遠い岸で二度、光が返った。'],['nina','返事……？'],
  ['','地図の端に描かれた塔よりも、さらに遠くにもう一つ。誰がともしているのか、ここからは見えない。'],
  ['nina','知らない人も、見てるんだね。私たちの方を。'],['','日誌の余白に、ニナは今日の応答を書き足した。灯りがどこから始まったのか、その答えはまだ地図の外にある。'],
  ['nina','トウマに、見えたか聞きたい。'],['','小屋の出口で合流しよう。']
 ]);
 if(id==='journeyMeal')return stage(6,null,[
  ['','オルフに声をかけ、二人は港の長椅子へ座った。黒パンに豆のスープを吸わせると、初めての香草の匂いがした。'],
  ['touma','向こう岸の返事、ニナにも見えたんだな。最初に一つ光った時は、目のせいかと思った。少し間が空いて、もう一度返ってきたよな。'],['nina','うん。日誌に書いたけど、誰が返してくれたかまでは分からなかった。向こうでも誰かが仕事を止めて、こっちを見てくれたのかな。'],['touma','向こうの人も、今日は誰が灯りを直したんだろうって話してるかも。俺たちの名前は知らなくても、火が戻ったのは分かるんだな。'],
  ['nina','今度来たら、お礼の合図も教わりたいな。今日見えました、って伝えられたらいいのに。研修に来る人の中に、向こう岸の人もいるかな。'],['touma','会えたら、聞いてきてほしい。俺は留め具の作り方をもう少し調べたい。今日、力を入れても動かなかったのに、ニナが灯りを合わせたら、すっと回ったから。'],
  ['nina','私の方も、外から光が来るまでは、同じ所を何度も読んでたよ。一人だったら、間違えてるかもって手を止めてたと思う。別々の場所でも、ちゃんと一緒に直せたね。'],['','二人はカップの底に残った豆を、パンで丁寧にすくった。'],
  ['nina','……この豆、思ったより甘いね。黒パンも、浸すと食べやすい。家でも作れたら、今日の話をしながら食べられそう。何を入れてるんだろう。'],['オルフ','乾燥豆なら配達に頼めるよ。向こうの台所も、こっちの道につながってるんだ。'],
  ['','小さな紙袋を一つ鞄へ入れる。帰り道を急ぎたくなる理由が、一つ増えた。']
 ],7);
 if(id==='journeyReturn')return stage(7,null,[
  ['','湖岸の待ち場まで戻ると、直した道標が夕方の光を受けていた。遠い岸では、まだ灯りがまたたいている。'],
  ['nina','あの向こうにも、夕飯を作ってる家があるんだね。'],['touma','地図、帰ったら広げよう。'],['nina','うん。今日歩いた道も書き足そう。線一本に見えた所に、小屋も、ごはんを食べる店もあったね。また知らない場所へ、一緒に行きたいな。'],
  ['','ニナが少しだけ歩く速さを落とす。トウマも隣へ並び直した。'],['nina','……今日は、まず帰ろう。'],['touma','豆、戻すのに時間かかるって言ってたな。'],
  ['nina','明日のスープ。今夜はいつものにしよう。'],['','二人の足跡が、ユキネへの道を並んで続いていく。']
 ],8);
 return hint(a,objective(s));
}
const previousObjects=S.activeObjects;
S.activeObjects=function(s){
 if(names[s.scene])return maps[s.scene];let list=previousObjects(s);
 if(active(s))list=list.filter(o=>o.id!=='episodeEvent');
 if(s.scene==='town'&&s.episode?.chapter>=6)list=[...list,prop('journeyGate',22,12,'氷湖の旧街道へ','exit')];
 if(active(s)&&s.scene==='house'&&s.journey.step===8)list=list.map(o=>o.id==='homeTable'?{...o,id:'journeyHome',label:'二人の食卓で、旅の話をする'}:o);
 return list;
};
const previousNotes=root.OkaeriActivities?.notes;
if(previousNotes)root.OkaeriActivities.notes=s=>[...previousNotes(s),...notes(s)];
root.OkaeriJourney={names,spawns,maps,active,split,walkable,capture,switchActor,objective,notes,begin,handle,departure};
})(globalThis);
