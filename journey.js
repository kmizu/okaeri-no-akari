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
 ['','灯工房への返事を出す前に、もう一つ用事ができた。\nオルフが、湖の向こうの町からの頼まれごとを持ってきたのだ。'],
 ['オルフ','ミナモって町を知ってるか。氷湖の東岸の渡し場だ。あそこの「迎え灯」の光が、この冬から弱くなってる。夕方の便が、港の位置を見つけにくいんだと。'],
 ['オルフ','あっちの灯守は、年寄りが一人きりでね。ユキネの二人に仕掛けを見てもらえないか、って頼まれた。'],
 ['touma','氷湖の向こうですよね。今日のうちに、行って帰れますか。'],
 ['オルフ','湖の上は歩くなよ。岸の旧街道を行けば、昼前に着く。俺は配達で先に行くから、港で落ち合おう。日暮れ前には、帰りの道に出られる。'],
 ['nina','迎え灯って、ユキネの帰り灯と同じ仕組みなのかな。'],
 ['オルフ','元は同じだそうだ。昔、南の灯工房の職人が直していった小屋があってな。作業日誌が残ってる。鍵は預かってきた。'],
 ['nina','灯工房の人の日誌……！　読んでみたい。研修の前に、ちょうどいい予習だね。','happy'],
 ['touma','直せない所があったら、図に写してサエさんに相談しよう。水筒と、替えの手袋を持っていく。'],
 ['','家の火を確かめて、二人は町の東の旧街道へ出た。\n今日の用事を済ませて、夕飯にはまた、同じ家へ帰るつもりで。']
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
   a.talk([
    ['','扉を開けると、工具をしまい終えたトウマが待っていた。',{se:'door'}],
    ['touma','向こう岸の返事、外からも見えた。二回。'],
    ['nina','見えた！？　よかった……。私の見間違いかと思って、日誌に書く手が震えちゃった。','happy'],
    ['touma','最初は風の音で、お前の声がまるで聞こえなかった。でも窓の灯りが動くから、中が進んでるのは分かった。'],
    ['nina','私も。反射板の光が窓に入ってきた時、ああトウマが向けてくれたんだって、すぐ分かったよ。'],
    ['touma','留め輪、中から温めただろ。手袋を外さずに済んだ。'],
    ['nina','伝わってた！　……小屋の中、けっこう寒かったんだよ。窓際に立ちっぱなしで。','joy'],
    ['touma','……なら、先に飯だ。港のスープ。話はそれから聞く。'],
    ['','外套の袖が触れる距離に戻って、二人は港の通りへ歩いた。']
   ],()=>{j.step=6;a.scene('lakeside',12,7);});return true;
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
  ['','湖岸の分かれ道に、道標が傾いて立っている。\n雪を払うと、「ミナモ」の字と、その先の知らない町の名前が出てきた。'],
  ['touma','支柱の根元が、霜で浮いてる。くさびを打ち直せば立つ。'],
  ['nina','……見て、トウマ。左の道。地図だと線一本だったのに、こんなに湖が見えるんだ。'],
  ['','ニナが道標を支え、トウマが木のくさびを打ちこむ。\n矢印が、人の目の高さに戻った。',{se:'knock'}],
  ['touma','「ミナモ」の先にも、町の名前が続いてる。ここは終点じゃないんだな。'],
  ['nina','帰りは、この矢印を頼りにしよう。']
 ],1);
 if(id==='journeyShoreLight')return stage(1,'nina',[
  ['','湖岸に立つ迎え灯。硝子の覆いには、細い筋が何重にも刻まれている。\nユキネの帰り灯には、ない細工だ。'],
  ['nina','芯はうちのと同じ。でも、この筋は初めて見た。……火、近づけてみるね。'],
  ['','ニナがランタンを寄せると、筋に沿って光が集まり、湖の方へまっすぐ伸びた。',{se:'flare'}],
  ['touma','向こう岸にも、似た塔が立ってる。あそこへ向けて飛ばす仕掛けか。'],
  ['','少し遅れて、遠い岸で光が一度、揺れた。\n風のせいか、返事なのか、ここからでは分からない。',{wait:500}],
  ['nina','……帰り灯って、帰ってくる人のための灯りだと思ってた。'],
  ['touma','待ってる方も、見てるのかもな。向こうから。'],
  ['','街道は湖に沿って曲がり、煙突の並ぶ集落へ続いている。']
 ],2);
 if(id==='journeyOrlf')return stage(2,null,[
  ['オルフ','おう、着いたか。ようこそミナモへ。ユキネとは、風の匂いが違うだろ。','happy'],
  ['nina','魚を燻す匂い。……それと、知らないスープの匂い。'],
  ['オルフ','干し豆と塩漬け野菜のスープだ。昼に煮て、夕方の便で帰る連中に出す。あとで食ってみな。'],
  ['touma','岸の灯りを見てきました。仕組みは、ユキネの帰り灯とほとんど同じです。'],
  ['オルフ','こっちじゃ「迎え灯」と呼ぶんだ。向こう岸から来る舟が、港の位置を確かめる。光が弱いのは、外の反射板が凍って動かないせいじゃないか……ってのが、ここの爺さんの見立てだ。'],
  ['オルフ','爺さんは腰をやっててな。古い灯守小屋の鍵は開けてある。日誌を読んで、見てやってくれ。'],
  ['','軒先の話し声には、二人の知らない地名がいくつも交じっていた。']
 ],3);
 if(id==='journeyDesk'){
  if(j.step!==3)return hint(a,'「外の反射板と、内の灯。どちらも人の手で確かめること」。日誌には、二人分の当番名が並んでいる。');
  a.talk([
   ['','古い灯守小屋。机の上に、厚い作業日誌が置いてある。\n表紙には「帰る便を迎えるための灯」。',{se:'page'}],
   ['','後ろの頁ほど、字が新しい。書き手が何人も代わり、修理のやり方も少しずつ違っていた。'],
   ['nina','一人が作って、ずっと同じにしてたんじゃないんだ。みんなが少しずつ直して、ここまで来たんだね。'],
   ['touma','この留め具、うちの玄関灯にも使えそうだ。風が抜ける形になってる。'],
   ['','日誌の図には、湖岸の反射板と、小屋の中の共鳴灯。\n片方から届く光を見ながら、もう片方を合わせる仕組みだ。'],
   ['nina','外から来る光を見ながら、中の灯の輪を合わせるんだって。……つまりこれ、一人じゃ直せないんだ。外と中に、一人ずつ要る。'],
   ['touma','外の反射板と留め輪は、俺が見る。お前は日誌を見ながら、中の灯りを頼む。動かしたら窓へ手を振るから、見えたら振り返してくれ。'],
   ['nina','分かった。途中で分からなくなったら、窓から呼ぶね。トウマも、返事がなかったら黙って待たないで。'],
   ['touma','ああ。……水路の時みたいなのは、もうなしだ。先に終わった方が、この扉の前で待つ。'],
   ['','湖岸と小屋の窓は、互いに見える距離にある。二人は、持ち場へ分かれた。'],
   ['','Q、または左下の交代ボタンで、二人の場所を行き来できます。\n相手の仕事で仕掛けが変わったら、切り替えて確かめよう。']
  ],()=>{j.step=4;s.lead='touma';a.scene('lakeside',17,9);});return true;
 }
 if(id==='journeyMirror')return work(a,id,'mirror',null,[
  ['','湖岸の反射板。支えの腕が、軸の所で雪に埋もれていた。'],
  ['touma','留め具は生きてる。軸の雪さえ掻き出せば……。'],
  ['','腕を少しずつ起こす。反射板が向きを変え、小屋の窓に細い光が届いた。',{se:'chime'}],
  ['touma','ニナ！　向いたぞ。そっちから見えるか！'],
  ['','窓の向こうで、ニナの手が大きく上がった。'],
  ['','ニナへ切り替えると、小屋の共鳴灯を調整できます。']
 ]);
 if(id==='journeyPrism')return work(a,id,'prism','mirror',[
  ['','トウマの向けた光が、小屋の三枚の硝子を順に通り抜ける。\nニナは日誌の図と見比べながら、灯の輪を少しずつ回した。'],
  ['nina','……ここ。図の線と重なった。'],
  ['','光は太くならなかった。かわりに熱が、真鍮の管をゆっくり伝っていく。\n窓の外、トウマの足元で、留め輪を包んでいた氷がほどけ始めた。',{se:'flare'}],
  ['nina','これで、トウマが手袋を外さなくて済むはず。……伝わったかな。'],
  ['','湖岸のトウマへ切り替えて、風よけの留め輪を確かめよう。']
 ]);
 if(id==='journeyShutter')return work(a,id,'shutter','prism',[
  ['touma','……回る。さっきは、びくともしなかったのに。'],
  ['','留め輪を回すと、風よけが開いた。\n光の出口へ向けて、薄い硝子の羽が重なっていく。'],
  ['touma','手袋のままでできた。……あいつ、中から温めたな。','happy'],
  ['','窓へ手を振る。ニナがうなずいて、灯りの前へ戻るのが見えた。'],
  ['','ニナへ切り替えて、応答灯をともそう。']
 ]);
 if(id==='journeyReply')return work(a,id,'reply','shutter',[
  ['','小屋のいちばん奥、応答灯。ニナは芯に種火を移した。\nトウマが整えた硝子を通って、光が湖を越えていく。'],
  ['nina','二度、短く。それから一度、長く。……日誌の通りに。'],
  ['','しばらく、何も起こらなかった。\nあきらめて火を絞ろうとした時――遠い岸で二度、光が返った。',{wait:900,se:'chime'}],
  ['nina','返事……！','surprise'],
  ['','地図の端に描かれた塔より、さらに遠くにもう一つ。\n誰がともしているのか、ここからは見えない。'],
  ['nina','知らない誰かが、手を止めて、こっちを見てくれたんだ。'],
  ['','ニナは日誌の余白に、今日の日付と応答の回数を書き足した。前の書き手の字の、すぐ下に。'],
  ['nina','トウマにも見えたかな。……早く聞きたい。'],
  ['','小屋の出口で合流しよう。']
 ]);
 if(id==='journeyMeal')return stage(6,null,[
  ['','港の長椅子。オルフに報告を済ませて、二人は豆のスープと黒パンを受け取った。\n黒パンを浸すと、知らない香草の匂いが立つ。',{se:'cup'}],
  ['touma','迎え灯は直りました。夕方の便から、港が見えるはずです。'],
  ['オルフ','爺さんが礼を言ってたぞ。「二人組の灯守は、やっぱりいい」とさ。昔はここの灯りも、夫婦で守ってたそうだ。','happy'],
  ['nina','ふ、夫婦じゃないです。','fluster'],
  ['オルフ','誰もそうは言ってないよ。'],
  ['','トウマは聞こえなかったふりで、スープに黒パンを沈めている。'],
  ['nina','……この豆、思ったより甘いね。家でも作れないかな。今日の話をしながら食べたい。'],
  ['オルフ','乾燥豆なら、俺の配達で届けられる。向こうの台所も、こっちの道につながってるんだ。'],
  ['touma','……一袋、ください。'],
  ['','小さな紙袋を一つ、鞄に入れる。\n帰り道を急ぎたくなる理由が、一つ増えた。',{se:'item'}]
 ],7);
 if(id==='journeyReturn')return stage(7,null,[
  ['','湖岸の待ち場まで戻ると、朝に直した道標が夕日を受けていた。\n遠い岸では、迎え灯がまたたいている。'],
  ['nina','あの灯りの向こうにも、今ごろ夕飯を作ってる家があるんだね。'],
  ['touma','帰ったら、地図を広げよう。今日歩いた道を書き足す。'],
  ['nina','うん。線一本だと思ってた所に、小屋も、スープの店もあったもんね。'],
  ['','ニナが少しだけ、歩く速さを落とした。トウマも隣へ並び直す。'],
  ['nina','……南の工房も、きっとこんなふうなんだろうな。線一本に見えて、行ってみたら人がいて。'],
  ['touma','ああ。'],
  ['nina','行くの、ちょっとだけ楽しみになってきた。……ちょっとだけ、怖くなくなった。','happy'],
  ['touma','……そうか。'],
  ['nina','でも今日は、まず帰ろ。豆、戻すのに一晩かかるって言ってたし。'],
  ['touma','明日のスープだな。今夜は、いつものにしよう。'],
  ['','二人の足跡が、ユキネへの道を並んで続いていく。']
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
