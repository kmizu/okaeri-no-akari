(function(root){
'use strict';
// 広げたフィールド。森の奥の「薬草の谷」と、丘の先の「峠の旧道」。
// どちらも本筋には必須でない寄り道で、道にいる精霊は落ち着かせても、よけて通ってもいい。
const S=root.OkaeriStory;
const names={herbvale:'薬草の谷',oldpass:'峠の旧道'};
const spawns={herbvale:[3,13],oldpass:[3,13]};
const prop=(id,x,y,label,kind,extra={})=>({id,x,y,label,type:'fieldProp',kind,...extra});
// 精霊。kind は戦闘の種類、art は絵、tint は色ちがいの見分け。
const spirits={
 valeHail:{scene:'herbvale',x:10,y:9,label:'あられモチの群れ',kind:'hail',art:'mochi',tint:'hail',name:'あられモチ',note:'谷の日陰に集まる、青白いモチ。三匹でひとかたまり。温めると、しゅんと縮んで草の陰へ帰っていく。'},
 valeSleet:{scene:'herbvale',x:16,y:7,label:'みぞれヤドカリ',kind:'sleet',art:'crab',tint:'sleet',name:'みぞれヤドカリ',note:'谷の小川に住むヤドカリ。溶かした殻が、三つ数えるうちにまた凍る。火花は、間を空けずに。'},
 passMix:{scene:'oldpass',x:11,y:8,label:'道をふさぐモチとヤドカリ',kind:'mix',art:'mochi',tint:null,name:'峠の道連れ',note:'こごえモチが、こおりヤドカリの殻に乗って峠を越えようとしていた。行き先は、たぶん同じ灯り。'},
 passEcho:{scene:'oldpass',x:16,y:6,label:'こだま番人',kind:'echo',art:'guardian',tint:'echo',name:'こだま番人',note:'峠の塚を守る、若い番人。枝角はまだ短い。十二年、誰も来ない道で、灯りのない塚を見張っていた。'}
};
const maps={
 herbvale:[prop('valeExit',2,13,'森へ戻る','exit'),prop('valeHerb',5,9,'雪の下の温め草','herb'),prop('valeStream',12,10,'湯気の立つ小川','stream'),prop('valeStone',14,6,'苔むした道しるべ','stone'),prop('valeHut',19,3,'薬草の干し小屋','hut')],
 oldpass:[prop('passExit',2,13,'丘へ戻る','exit'),prop('passSign',8,10,'雪に埋もれた道標','sign'),prop('passView',12,7,'町を見下ろす曲がり角','view'),prop('passCairn',20,3,'峠の塚と、消えた灯籠','cairn')]
};
const gates={forest:prop('valeGate',1,13,'薬草の谷へ','gate'),hill:prop('passGate',21,6,'峠の旧道へ','gate')};
function tile(scene,x,y){
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<1||x>22||y<2||y>14)return false;
 if(scene==='herbvale')return (x>=2&&x<=10&&y>=12&&y<=13)||(x>=9&&x<=11&&y>=6&&y<=13)||(x>=4&&x<=9&&y>=9&&y<=11)||(x>=10&&x<=19&&y>=6&&y<=7)||(x>=17&&x<=20&&y>=3&&y<=7)||(x>=11&&x<=13&&y>=9&&y<=10);
 if(scene==='oldpass')return (x>=2&&x<=8&&y>=11&&y<=13)||(x>=7&&x<=9&&y>=7&&y<=12)||(x>=8&&x<=16&&y>=7&&y<=8)||(x>=15&&x<=17&&y>=4&&y<=8)||(x>=16&&x<=21&&y>=3&&y<=5);
 return false;
}
const calm=(s,id)=>!!s.flags['calm_'+id];
function objects(s){
 const list=[...maps[s.scene]];
 for(const [id,sp] of Object.entries(spirits))if(sp.scene===s.scene&&!calm(s,id))list.push({id,x:sp.x,y:sp.y,label:sp.label,type:'fieldSpirit',art:sp.art,tint:sp.tint});
 return list;
}
const say=(a,text)=>{a.talk([['',text]]);return true;};
function handle(id,a){
 const s=a.state,f=s.flags,ep=s.episode;
 if(id==='valeGate'){a.scene('herbvale',...spawns.herbvale);if(!f.valeSeen){f.valeSeen=true;a.save();a.talk([
  ['','白樺の待ち場の奥に、細い踏み分け道がある。下っていくと、風が急にやわらいだ。'],
  ['nina','わあ……。雪の下から、湯気が出てる。'],
  ['touma','地面が温かいんだ。この谷だけ、川の水が凍らない。'],
  ['','薬草の谷。町の薬草屋は、冬のあいだ、ここで温め草を摘む。コハルが毎朝、籠を提げて通っている場所だ。']]);}return true;}
 if(id==='passGate'){
  if(ep?.chapter===8&&!ep.complete)return say(a,'吹雪で、峠へ続く道は見えない。今は丘の灯台が先だ。');
  a.scene('oldpass',...spawns.oldpass);if(!f.passSeen){f.passSeen=true;a.save();a.talk([
   ['','丘の灯台の裏から、古い道が尾根を越えて続いている。今は、荷車も人も通らない。'],
   ['touma','峠の旧道だ。十二年前まで、荷車はこの道で町へ下りてきた。'],
   ['nina','……あの晩の列も、ここを通ったんだよね。'],
   ['','二人はしばらく、雪に埋もれた轍の跡を見ていた。それから、どちらからともなく歩き出した。']]);}return true;}
 if(!names[s.scene])return false;
 if(id==='valeExit'){a.scene('forest',2,12);return true;}
 if(id==='passExit'){a.scene('hill',20,6);return true;}
 const sp=spirits[id];
 if(sp){
  const intro={
   valeHail:[['nina','見て、あそこ。モチが三匹、固まってる。……色、青くない？'],['touma','あられモチだ。日陰の冷たい所に集まるやつ。一匹ずつは弱いが、数で来る。'],['nina','「灯の輪」でまとめて温めよう。三匹いっぺんに。']],
   valeSleet:[['touma','小川の中に、ヤドカリがいる。……殻の氷が、さっき溶けたのにもう張ってる。'],['nina','みぞれヤドカリだ。溶かしても、すぐ凍り直すの。火花を続けて当てないと。'],['touma','なら、溶けた隙に俺が一気に行く。合図をくれ。']],
   passMix:[['nina','……モチが、ヤドカリの殻に乗ってる。'],['touma','峠を越える気らしい。道の真ん中で止まられると、通れないな。'],['nina','どっちも寒いんだよ。まとめて温めてあげよう。']],
   passEcho:[['','塚へ続く道の真ん中に、番人が立っている。森で会ったものより小さい。枝角も、まだ短い。'],['touma','若い番人だ。……塚を守ってるのか。'],['nina','十二年、誰も来なかったんだもん。急に人が来たら、怖いよね。落ち着かせて、通してもらおう。']]
  }[id];
  a.talk(intro,()=>a.startBattle(sp.kind,()=>{f['calm_'+id]=true;a.save();a.updateHud();a.talk([['',sp.name+'は、落ち着きを取り戻した。'],['','旅の手帳の「出会った精霊」に、'+sp.name+'を書きとめた。',{se:'item'}]]);}));
  return true;
 }
 if(id==='valeHerb')return a.talk([['','雪をそっと払うと、丸い葉が重なって生えていた。指でもむと、じんわり温かい。'],['nina','これが温め草なんだ。摘む前から、あったかい。'],['touma','根は残して、葉だけ摘むらしい。コハルが言ってた。来年も生えるように。'],['nina','あの子、毎朝ここまで来てるんだね。……袋一つ作るのに、どれだけ摘むんだろ。']]),true;
 if(id==='valeStream')return a.talk([['','小川から、細い湯気が上がっている。手を入れると、ぬるい。'],['nina','ここで手を洗ったら、町まで冷えずに帰れそう。'],['touma','……帰りに、水筒に詰めていくか。']]),true;
 if(id==='valeStone')return a.talk([['','苔むした石に、薬草の絵が三つ彫ってある。葉の形で、どこに何が生えるかを示しているらしい。'],['touma','文字がない。字を知らなくても、読めるように彫ったんだな。'],['nina','ずっと昔の薬草屋さんかな。コハルにも、教えた人がいるんだ。']]),true;
 if(id==='valeHut'){
  if(f.valeHut)return say(a,'干し小屋の軒に、温め草の束が揺れている。棚には、次に来る人のための空の籠が一つ。');
  a.talk([
   ['','谷のいちばん奥に、屋根だけの小屋がある。軒いっぱいに、温め草の束が吊るして干してあった。'],
   ['nina','すごい数……。これ全部、コハルが？'],
   ['touma','束の結び方が、途中から変わってる。手前の新しいのがコハルで、奥の古いのは、前の誰かだ。'],
   ['','棚の隅に、小さな袋が二つ並んでいた。札が付いている。「トウマお兄ちゃん」「ニナお姉ちゃん」。'],
   ['nina','……予備まで作ってある。','shy'],
   ['touma','黙って持って帰るわけにいかないな。……礼を言わないと。'],
   ['nina','言ったら、あの子、三日は自慢するよ。','joy']
  ],()=>{f.valeHut=true;a.save();a.toast('手帳に「干し小屋の二つの袋」を残した');});return true;
 }
 if(id==='passSign')return a.talk([['','雪を払うと、古い道標が出てきた。「ユキネ　あと半刻」。柱の根元に、深い爪の跡が三本、斜めに走っている。'],['touma','……魔獣の爪だ。古い。十二年前のものかもしれない。'],['touma','……半刻。ここまで来れば、もう町の灯りが見える距離だ。'],['nina','灯台がともっていれば、ね。']]),true;
 if(id==='passView')return a.talk([['','曲がり角から、ユキネの町が見下ろせる。屋根の雪、パン屋の煙、広場の掲示板まで見えた。'],['nina','あ、うちの屋根。……小さいね。'],['touma','ここから見ると、町じゅうが一つの灯りみたいだ。']]),true;
 if(id==='passCairn'){
  if(f.passLit)return say(a,'塚の灯籠が、静かにともっている。ここからは、森の灯台と丘の灯台が、両方見える。');
  if(!calm(s,'passEcho'))return say(a,'塚へ続く道を、若い番人が見張っている。先に、落ち着かせよう。');
  a.talk([
   ['','峠の旧道の、いちばん高い所。石を積んだ塚の上に、小さな灯籠が雪をかぶっていた。',{bgm:'silence'}],
   ['','十二年前、荷車の列はここまで来ていた。灯台が見えていれば、町まであと半刻の場所だった。',{wait:500}],
   ['nina','……ここだったんだ。'],
   ['touma','サエさんは毎年、一人でここへ来てたらしい。俺たちには、言わなかったけど。'],
   ['','ニナがランタンを開ける。種火を移す手は、震えなかった。'],
   ['','塚の灯籠がともる。',{flash:'warm',se:'lit',jingle:'lit',bgm:'tender',time:'dusk'}],
   ['','ここからは、森の灯台も、丘の灯台も、両方見えた。'],
   ['nina','見えるね。二つとも。'],
   ['touma','ああ。……今なら、迷わない。'],
   ['nina','……「ただいま」って言うのは、変かな。'],
   ['touma','変じゃない。俺も言う。'],
   ['','二人は塚の前に、しばらく並んで立っていた。\n帰り道は、もう分かっている。']
  ],()=>{f.passLit=true;a.save();a.updateHud();a.toast('手帳に「峠の塚の灯り」を残した');});return true;
 }
 return false;
}
function notes(s){
 const f=s.flags||{},out=[];
 if(f.valeHut)out.push('干し小屋の二つの袋：コハルが作っておいた、二人の分の温め草');
 if(f.passLit)out.push('峠の塚の灯り：十二年前の列が、あと半刻まで来ていた場所');
 const met=Object.entries(spirits).filter(([id])=>calm(s,id));
 if(met.length)out.push('出会った精霊（'+met.length+' / '+Object.keys(spirits).length+'）');
 for(const [,sp] of met)out.push('　'+sp.name+'：'+sp.note);
 return out;
}
if(S){
 Object.assign(S.objects,maps);
 const previousWalkable=S.walkable;S.walkable=(s,x,y)=>names[s.scene]?tile(s.scene,x,y):previousWalkable(s,x,y);
 const previousObjects=S.activeObjects;
 S.activeObjects=function(s){
  if(names[s.scene])return objects(s);
  const list=previousObjects(s);
  return gates[s.scene]&&(s.scene!=='hill'||s.flags.hillLens||s.episode)?[...list,gates[s.scene]]:list;
 };
 const A=root.OkaeriActivities;if(A){const previousNotes=A.notes;A.notes=s=>[...previousNotes(s),...notes(s)];}
}
root.OkaeriField={names,spawns,spirits,maps,gates,tile,handle,notes,objects};
if(typeof module!=='undefined')module.exports=root.OkaeriField;
})(typeof globalThis!=='undefined'?globalThis:this);
