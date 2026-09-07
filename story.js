(function(root){
const objects={
house:[{"id":"toumaDesk","x":9,"y":4,"label":"トウマの修理机","type":"homeDesk"},{"id":"toumaBooks","x":7,"y":3,"label":"書き込みのある本棚","type":"homeBooks"},{"id":"ninaMirror","x":15,"y":4,"label":"ニナの鏡台","type":"homeMirror"},{"id":"ninaWardrobe","x":20,"y":3,"label":"糸と冬服の棚","type":"homeWardrobe"},{id:'houseExit',x:12,y:13,label:'町へ出る',type:'exit'},{id:'homeTable',x:11,y:9,label:'二人の食卓・一日の思い出',type:'homeTable'},{id:'homeStove',x:5,y:9,label:'薪ストーブ',type:'homeStove'},{id:'toumaRoom',x:5,y:4,label:'トウマの部屋',type:'homeBed'},{id:'ninaRoom',x:18,y:4,label:'ニナの部屋',type:'homeBed'},{id:'homeShelf',x:8,y:11,label:'古い写真と家の鍵',type:'homeShelf'},{id:'homeSewing',x:18,y:10,label:'窓辺の繕い机',type:'homeSewing'}],
hill:[{id:'returnSign',x:7,y:9,label:'小屋の帰還札',type:'returnSign'},{id:'hillHome',x:4,y:14,label:'ユキネへ戻る',type:'exit'},{id:'windbreak',x:8,y:11,label:'外れた風よけ',type:'windbreak'},{id:'hillRest',x:6,y:8,label:'風待ちの小屋',type:'camp'},{id:'hillGuardian',x:12,y:9,label:'尾根の番人',type:'guardian',hide:'hillGuardian'},{id:'hillLens',x:17,y:5,label:'霜のついたレンズ',type:'hillLens'},{id:'hillBeacon',x:20,y:3,label:'丘の灯台',type:'hillBeacon'}],
canal:[{id:'canalHome',x:3,y:13,label:'ユキネへ戻る',type:'exit'},{id:'waterGate',x:8,y:10,label:'凍りついた水門',type:'waterGate'},{id:'canalRest',x:6,y:7,label:'水番の休憩所',type:'camp'},{id:'canalCrab',x:12,y:10,label:'水路のヤドカリ',type:'crab',hide:'canalCrab'},{id:'regulator',x:15,y:6,label:'三つの調整灯',type:'regulator'},{id:'waterBeacon',x:20,y:3,label:'水路の帰り灯',type:'waterBeacon'}],
town:[{id:'ourHome',x:3,y:13,label:'二人の家へ',type:'exit'},{id:'elna',x:7,y:11,label:'織り手のエルナ',type:'npc'},{id:'orlf',x:16,y:10,label:'配達人のオルフ',type:'npc'},{id:'hillExit',x:1,y:9,label:'風待ちの丘へ',type:'exit'},{id:'canalExit',x:22,y:9,label:'共同水路へ',type:'exit'},{id:'board',x:10,y:8,label:'出発札',type:'board'},{id:'sae',x:14,y:9,label:'師匠のサエ',type:'npc'},{id:'bakery',x:6,y:8,label:'パン屋のマロ',type:'npc'},{id:'lamp',x:18,y:9,label:'帰り灯',type:'lamp'},{id:'gift',x:4,y:11,label:'繕いものの籠',type:'basket'},{id:'exit',x:12,y:2,label:'森へ続く道',type:'exit'}],
forest:[{id:'waitingPost',x:2,y:12,label:'白樺の待ち場・古い道標',type:'waitingPost'},{id:'waitingLight',x:1,y:9,label:'消えた待ち灯',type:'waitingLight'},{id:'waitingBench',x:2,y:10,label:'白樺のベンチ',type:'waitingBench'},{id:'sewingBox',x:4,y:8,label:'小屋の道具箱',type:'sewingBox'},{id:'home',x:5,y:14,label:'ユキネへ戻る',type:'exit'},{id:'mochi',x:5,y:11,label:'こごえモチ',type:'mochi',hide:'mochi'},{id:'rest',x:5,y:7,label:'森の休憩小屋',type:'camp'},{id:'log',x:9,y:9,label:'道をふさぐ倒木',type:'log',hide:'log'},{id:'repair',x:12,y:7,label:'壊れた灯りの橋',type:'repair'},{id:'crab',x:15,y:4,label:'こおりヤドカリ',type:'crab',hide:'crab'},{id:'guardian',x:19,y:4,label:'枝角の番人',type:'guardian',hide:'guardian'},{id:'tower',x:20,y:2,label:'森の灯台',type:'tower'}]
};
function activeObjects(s){return objects[s.scene].filter(o=>!o.hide||!s.flags[o.hide]);}
function walkable(s,x,y){
 if(x<1||x>22||y<2||y>14)return false;
 if(s.scene==='house'){
 if(x<3||x>20||y<3||y>13)return false;
 if(y===6&&x!==6&&x!==17)return false;
 if(x===12&&y<=6)return false;
 return !((x===9&&y===4)||(x===7&&y===3)||(x===15&&y===4)||(x===20&&y===3)||(x===8&&y===11)||(x>=4&&x<=5&&y<=4)||(x>=18&&x<=19&&y<=4)||(x>=10&&x<=12&&y>=8&&y<=9)||(x>=4&&x<=5&&y>=8&&y<=9)||(x>=18&&x<=19&&y===10));
 }
 if(s.scene==='hill'){
  const path=(x>=3&&x<=6&&y>=11&&y<=14)||(x>=5&&x<=7&&y>=8&&y<=12)||(x>=6&&x<=13&&y>=10&&y<=12)||(x>=11&&x<=13&&y>=6&&y<=11)||(x>=12&&x<=19&&y>=5&&y<=7)||(x>=18&&x<=21&&y>=3&&y<=7);
  return path&&!(!s.flags.windbreak&&x===8)&&!(!s.flags.hillGuardian&&y===8&&x>=11)&&!(!s.flags.hillLens&&x===19);
 }
 if(s.scene==='canal'){
  const path=(x>=2&&x<=7&&y>=9&&y<=13)||(x>=5&&x<=7&&y>=7&&y<=10)||(x>=7&&x<=15&&y>=9&&y<=11)||(x>=14&&x<=16&&y>=4&&y<=11)||(x>=14&&x<=21&&y>=3&&y<=5);
  return path&&!(!s.flags.waterGate&&x===8)&&!(!s.flags.canalCrab&&x===13)&&!(!s.flags.waterFlow&&y===5);
 }
 if(s.scene==='town'){
  const houses=[[3,3,5,6],[16,3,5,4],[2,11,2,2],[18,11,4,3]];
  return !houses.some(([a,b,w,h])=>x>=a&&x<a+w&&y>=b&&y<b+h);
 }
 let path=(x>=1&&x<=3&&y>=11&&y<=13)||(x>=1&&x<=2&&y>=9&&y<=10)||(x>=4&&x<=6&&y>=7&&y<=14)||(x>=5&&x<=13&&y>=8&&y<=10)||(x>=11&&x<=13&&y>=3&&y<=9)||(x>=12&&x<=21&&y>=3&&y<=5)||(x>=19&&x<=21&&y>=2&&y<=5);
 if(!path)return false;
 if(!s.flags.mochi&&y===10&&x>=4&&x<=6)return false;
 if(!s.flags.log&&x===9&&y>=8)return false;
 if(!s.flags.repair&&y===6&&x>=11&&x<=13)return false;
 if(!s.flags.crab&&x===16&&y<=5)return false;
 if(!s.flags.guardian&&x===20&&y<=5)return false;
 return true;
}
function objective(s){const f=s.flags;if(s.scene==='house')return '二人の家。食卓で一日の思い出を振り返ろう';if(s.scene==='hill'){if(!f.windbreak)return 'トウマで風よけを直そう';if(!f.hillGuardian)return '尾根を守る番人を落ち着かせよう';if(!f.hillLens)return 'ニナで灯台のレンズを合わせよう';if(!f.hillLit)return '二人で丘の灯台をともそう';return '町へ戻って、サエにただいま';}if(s.scene==='canal'){if(!f.waterGate)return 'トウマで水門を支えよう';if(!f.canalCrab)return '水路に迷い込んだヤドカリを落ち着かせよう';if(!f.waterFlow)return 'ニナで三つの調整灯をつなごう';if(!f.waterLit)return '水路の帰り灯をともそう';return '水音と一緒に町へ帰ろう';}if(s.scene==='town'){if(f.endingTouma||f.endingNina||f.endingFriends)return 'また明日も、二人で。祭りを楽しもう';if(f.festivalStarted){if(!f.festivalMeal)return 'マロのスープを、二人で味わおう';if(!f.festivalRibbon)return '繕いものの籠で、帰り結びを';return '東の帰り灯で、ニナと話そう';}if(f.hillLit)return 'サエに報告して、帰り灯祭りへ';if(f.waterReturned)return '西の道から、風待ちの丘へ';if(f.returned)return f.waterLit?'パン屋のマロに、水が戻ったと伝えよう':'東の道から共同水路へ';if(f.lit)return '出発札を戻して、みんなにただいま';if(!f.board)return '広場の出発札を掛けよう';return '北の道から、森の灯台へ';}if(!f.mochi)return '道で跳ねる精霊を落ち着かせよう';if(!f.log)return 'トウマで倒木を動かそう';if(!f.repair)return 'ニナで灯りの橋を修理しよう';if(!f.crab)return '氷殻を火花で溶かそう';if(!f.guardian)return '灯台を守る番人のもとへ';if(!f.lit)return '二人で森の灯台をともそう';return '町へ帰ろう。南の道か、手帳から';}
const intro=[['','冬の終わり。雪の町ユキネでは、帰り灯祭りの支度が始まっていた。'],['','トウマとニナは、親を亡くして町の人々に育てられた幼馴染。成人した二人は、空き家を譲り受け、今は一緒に暮らしている。'],['nina','トウマ、手。出して。'],['touma','……出発前の点検？'],['nina','右の手袋。また穴、あいてたでしょ。昨日、直しておいた。'],['touma','よく気づいたな。……ありがと。'],['nina','毎年のことだからね。あ、鞄の金具、直してくれた？'],['touma','手袋のまま開けられるようにした。試してみて。'],['nina','……うん。開けやすい。ありがと。'],['サエ','支度はできたね。今日はまず、森の灯台まで。出発札を掛けてから行くんだよ。'],['touma','行こう、ニナ。祭りまでには帰ってこよう。'],['','移動：矢印キー / WASD / 地面をクリック\n調べる：近づいて E または Enter　交代：Q\n右上の案内と「旅の手帳」で目的を確認できます。']];
const endings={
touma:{title:'この先も、隣に',lines:[['touma','来年も、その次も、一緒に灯りをつけたい。'],['nina','うん。私たち、灯守だもんね。'],['touma','……そうじゃなくて。'],['touma','ニナが好きだ。幼馴染だからじゃなくて、恋人として、一緒にいたい。'],['nina','……そこまで言ってくれるの、待ってた。'],['touma','いつから？'],['nina','それ、今聞く？'],['','差し出した手に、少し冷えた指が重なった。\n明日も、この手を取りたいと思った。']]},
nina:{title:'待ちきれない明日',lines:[['touma','俺も好きだ。……先に言われた。'],['nina','待ってたら、来年のお祭りになりそうだったから。'],['touma','そんなに待たせないって。'],['nina','じゃあ、明日は？'],['touma','二人で出かけよう。仕事は持っていかない。'],['','ニナがそっと手を取った。\n幼馴染の帰り道に、初めての約束が増えた。']]},
friends:{title:'いつもの約束',lines:[['nina','明日も来る？'],['touma','今日、あんなに歩いたのに？'],['nina','灯台じゃなくて。広場。食べそびれたもの、あるでしょ。'],['touma','ある。いっぱい。'],['nina','じゃあ、また明日。'],['touma','うん。また明日。'],['','いつも通りの約束が、今日は少しうれしい。\n窓の外では、帰りを待つ灯りが揺れていた。']]}
};
function residentLines(s,id){
 const f=s.flags;
 if(id==='elna'){
  if(f.festivalRibbon)return [['エルナ','あら、二人ともいい結び目。色も、似合ってる。',null,'happy'],['nina','この布、元は何だったんですか？'],['エルナ','誰かの冬の上着。役目が変わっても、誰かを温めるのは同じね。'],['touma','大事にします。'],['エルナ','ほどけたら、またおいで。何度でも結び直せるから。',null,'happy']];
  if(f.festivalStarted)return [['エルナ','籠に帰り結びを入れておいたよ。鞄につけて、大事な人の帰りを願うの。'],['nina','自分の分を選ぶんじゃなくて？'],['エルナ','誰かに結んでもらうのが、この町のやり方。二人なら、ちょうどいいね。',null,'happy'],['touma','……じゃあ、あとで見てみよう。',null,'shy']];
  if(f.waterReturned)return [['エルナ','水路、直してくれたんだって？　ありがとう。布のすすぎができるよ。',null,'happy'],['touma','水がいるの、台所だけじゃなかったんですね。'],['エルナ','仕事って、見えないところでつながってるものね。丘へ行くなら、袖口をきゅっとね。']];
  if(f.returned)return [['エルナ','おかえり。ほら、窓際で干してた布、もう乾いた。',null,'happy'],['nina','灯りの飾りですか？'],['エルナ','そう。古い冬服を細く切ってね。捨てる前に、もう一度お祭りに連れていくの。']];
  return [['エルナ','出発前？　袖口、見せて。雪って、小さな隙間から入るから。'],['nina','トウマの手袋は、昨日直しました。'],['エルナ','ああ、この縫い目。ニナ、ずいぶん上手になったね。',null,'happy'],['touma','俺の手袋で、練習したからな。'],['nina','もう。穴をあけない練習もしてよ。',null,'happy'],['エルナ','帰ったら、二人の分の糸を出しておくね。']];
 }
 if(id==='orlf'){
  if(f.festivalStarted)return [['オルフ','丘の灯り、よく見えたぞ。遠くの家の人も、迷わず来られた。',null,'happy'],['touma','間に合って、よかったです。'],['オルフ','これは配達じゃなくて、伝言な。「灯守さんたち、ありがとう」だってさ。',null,'happy'],['nina','……ちゃんと届いたんだね。私たちの灯りも。',null,'happy']];
  if(f.hillLit)return [['オルフ','おかえり！　尾根から見てたよ。丘がぱっと明るくなったところ。',null,'happy'],['オルフ','サエさんが広場で待ってる。報告したら、今夜はゆっくりしな。']];
  if(f.waterReturned)return [['オルフ','次は丘か。見張り小屋の留め金は、内側から押すと開けやすいぞ。'],['nina','よく使うんですか？'],['オルフ','吹雪に追いつかれたらね。急がないのも、配達の腕のうちさ。'],['touma','無事に届けるまでが、仕事ですね。'],['オルフ','そういうこと。帰りも忘れるなよ。',null,'happy']];
  if(f.returned)return [['オルフ','森の灯り、助かったよ。最後の手紙を配って、戻れた。',null,'happy'],['nina','どんな手紙ですか？'],['オルフ','中は読まないさ。ただ、受け取ったおじいさんが、眼鏡を拭いてた。'],['touma','……うれしい手紙だったんですね。'],['オルフ','きっとな。帰り道まで、こっちもうれしくなった。',null,'happy']];
  return [['オルフ','おはよう。出発札、忘れずにな。俺も毎朝、鞄より先にあれを見る。'],['touma','どこまで配達するんですか？'],['オルフ','隣の集落まで。雪の日の手紙は、少しゆっくり届く。'],['nina','待ってる人、いますもんね。'],['オルフ','うん。だから、無理して届かなくなるのが一番だめなんだ。二人も気をつけてな。']];
}
}
const faceCues={
 'おかえり。灯台の火、町からも見えたよ。':'happy',
 'お疲れさま！　焼き場も準備できたよ。まずは食べていって。':'happy',
 'おはよう！　灯台まで行くんだって？　これ、持っていって。':'happy',
 '帰りは焼きたてを用意しておくね。道中、気をつけて！':'happy',
 '仕事の分じゃないよ。それは、おかえりの分。':'happy',
 '水、戻ったよ！　ほら、こんなに澄んでる。':'happy',
 'ありがとう。これで明日は、みんなの分を仕込める。':'happy',
 'それなら、返さなくていいね。':'happy',
 'お鍋もぴかぴか。祭りのスープ、楽しみにしててね。':'happy',
 'おかえり。丘の灯り、ここからも見えたよ。':'happy',
 'もう着いた人がいるよ。「灯りがあって助かった」って。':'happy',
 'よく帰ってきたね。さあ、温かいうちに食べておいで。':'happy',
 'もう仕事はおしまい。今夜は二人とも、祭りのお客さんだよ。':'happy',
 'はい、きのこのスープ。水路から届いたお水で作ったよ。':'happy',
 '席も二つ、並べてあるから。':'happy',
 'おかわりもあるよ。二人で、ゆっくりしていって。':'happy',
 '……うん。開けやすい。ありがと。':'happy','こっちも。':'happy','……覚えてたんだ。':'shy',
 'いや。助かってる。ずっと。':'shy','……嫌？':'shy','うん。……頼りにしてる。':'shy',
 'うん。……うまい。':'happy','よかった。トウマの飲み物も、あったかい。':'happy',
 '……また二人で来ようね。今度は、急がなくていい日に。':'shy','うん。そうしよう。':'happy',
 'あったかくなったんだね。よかった。':'happy','できた。今度は私が先に行くね。':'happy',
 '……ともった！':'happy','うん。二人で、できたな。':'happy','帰り道の分は、別。':'happy',
 '……いい匂い。朝から楽しみにしてたんだ。':'happy','トウマ。明日も、一緒に行こうね。':'happy',
 'うん。お弁当、今度は俺が作る。':'happy','じゃあ、飲み物は私。甘さ控えめ、だよね。':'happy',
 '……そうじゃなくて。':'shy','ニナが好きだ。幼馴染だからじゃなくて、恋人として、一緒にいたい。':'shy',
 '……そこまで言ってくれるの、待ってた。':'shy','それ、今聞く？':'shy',
 '私、トウマが好き。一緒にいるのが当たり前すぎて、ちゃんと言えなかったけど。':'shy',
 '俺も好きだ。……先に言われた。':'shy','待ってたら、来年のお祭りになりそうだったから。':'shy',
 '二人で出かけよう。仕事は持っていかない。':'happy','ある。いっぱい。':'happy','じゃあ、また明日。':'happy','うん。また明日。':'happy'
};

const nightScenes={
 "one": [
  [
   "",
   "第一話の夜 — 二つのカップ\n戸を閉めると、風の音が遠くなる。トウマが薪をくべ、ニナは棚からカップを二つ取った。"
  ],
  [
   "nina",
   "ただいま。……誰もいなくても、言いたくなるね。"
  ],
  [
   "touma",
   "おかえり。俺も今、帰ったけど。"
  ],
  [
   "",
   "親を亡くし、町の人たちに支えられて育った二人。成人した今は、譲り受けた空き家を手入れして暮らしている。"
  ],
  [
   "nina",
   "ここに来た日、すごく寒かった。窓の隙間、覚えてる？"
  ],
  [
   "touma",
   "布を詰めても落ちてきて。二人で朝まで直した。"
  ],
  [
   "nina",
   "今は、ちゃんとあったかいね。"
  ],
  [
   "",
   "ニナが差し出したカップを取ると、指先が触れた。二人とも、取っ手の方を見た。"
  ],
  [
   "touma",
   "今日、手袋はほどけなかった。"
  ],
  [
   "nina",
   "うん。また直すよ。隣の部屋にいるから。",
   null,
   "shy"
  ],
  [
   "",
   "寝室へ向かうニナを、トウマが呼び止める。"
  ],
  [
   "touma",
   "おやすみ。……明日の朝も、起こしてくれるか。"
  ],
  [
   "nina",
   "起きてても、寝たふりしないでね。"
  ],
  [
   "",
   "別々の扉を閉めてからも、廊下に残った炉の明かりは、二つの部屋の隙間を照らしていた。"
  ]
 ],
 "two": [
  [
   "",
   "第二話の夜 — 味見の距離\n二人の家の台所。ニナが器を洗う隣で、トウマは明日の包みパンを折っていた。"
  ],
  [
   "nina",
   "その端、少し水をつけると閉じるよ。"
  ],
  [
   "touma",
   "こう？"
  ],
  [
   "",
   "ニナが横から手を添えた。肩が触れたまま、パンの端を二人でつまむ。"
  ],
  [
   "nina",
   "……できた。手、離していいよ。"
  ],
  [
   "touma",
   "そっちもな。"
  ],
  [
   "",
   "同時に離して、同時に笑った。火のそばに並べたパンは、どれも少し形が違った。"
  ],
  [
   "nina",
   "ここ、一人で住んでたら、夕飯どうしてた？"
  ],
  [
   "touma",
   "鍋から食べてたかも。"
  ],
  [
   "nina",
   "私も。洗い物、減るし。"
  ],
  [
   "touma",
   "じゃあ、二人でよかったな。"
  ],
  [
   "nina",
   "……うん。お皿の数のことだけじゃなくて。",
   null,
   "shy"
  ],
  [
   "",
   "ニナは二枚の皿を棚に戻した。トウマは返事を探す代わりに、翌朝の分の薪を一本、炉の横へ置いた。"
  ]
 ],
 "three": [
  [
   "",
   "第三話の暮れ — いつもと違う支度\n仕事道具を置きに帰ると、家の中は夕日に染まっていた。今夜は帰り灯祭りだ。"
  ],
  [
   "nina",
   "少し待ってて。上着、替えてくる。"
  ],
  [
   "touma",
   "汚れてないだろ。"
  ],
  [
   "nina",
   "……仕事の続きで行くみたいなのは、嫌なの。"
  ],
  [
   "",
   "ニナは自分の部屋の扉を閉めた。トウマも寝室へ戻り、普段より丁寧に襟を整えた。"
  ],
  [
   "",
   "先に居間へ出たトウマは、炉の前で立ったり座ったりした。"
  ],
  [
   "nina",
   "お待たせ。……どう？"
  ],
  [
   "touma",
   "似合ってる。"
  ],
  [
   "nina",
   "ちゃんと見てから言って。"
  ],
  [
   "touma",
   "見たから、言った。"
  ],
  [
   "",
   "ニナはそれ以上聞かず、鞄の紐を握り直した。"
  ],
  [
   "nina",
   "今日は、最後まで一緒に回ってね。",
   null,
   "shy"
  ],
  [
   "touma",
   "うん。帰る家も同じだし。"
  ],
  [
   "nina",
   "そういう意味だけじゃ、ないんだけどな。"
  ],
  [
   "",
   "二人は戸口で顔を見合わせた。鍵を持つ手はいつもと同じなのに、出かける前の沈黙だけが違っていた。"
  ]
 ],
 "touma": [
  [
   "",
   "最終話の夜 — 恋人になった家\n「ただいま」が二つ重なった。いつもの居間で、二人はいつもより少し離れて座った。"
  ],
  [
   "nina",
   "……なんで、遠くに座るの。"
  ],
  [
   "touma",
   "どこに座ればいいか、急に分からなくなった。"
  ],
  [
   "",
   "ニナは隣の椅子を引いた。トウマが腰を下ろすと、膝の上の手に、そっと指が重なる。"
  ],
  [
   "nina",
   "家は、何も変わってないね。"
  ],
  [
   "touma",
   "俺は、変わった。今、すごく嬉しい。"
  ],
  [
   "nina",
   "私も。",
   null,
   "shy"
  ],
  [
   "",
   "眠る前、ニナは自分の部屋の扉で立ち止まった。"
  ],
  [
   "nina",
   "明日の朝、いつもどおり起こしていい？"
  ],
  [
   "touma",
   "うん。そのあと、もう一回好きって言う。"
  ],
  [
   "nina",
   "……寝ぼけてないときに、言ってね。"
  ],
  [
   "",
   "灯りを落とした居間には、寄せたままの椅子が二つ残った。"
  ]
 ],
 "nina": [
  [
   "",
   "最終話の夜 — 返事の続き\n家へ戻っても、ニナは外套のボタンを一つ留めたままだった。"
  ],
  [
   "touma",
   "そこ、まだ留まってる。"
  ],
  [
   "nina",
   "あ。……今日の私、変じゃなかった？"
  ],
  [
   "touma",
   "変じゃない。嬉しかった。"
  ],
  [
   "nina",
   "明日、同じ台所で会ったら、なんて言おうって考えてた。"
  ],
  [
   "touma",
   "おはよう、でいい。俺も言うから。"
  ],
  [
   "",
   "トウマはニナが外套を掛け終えるまで待った。"
  ],
  [
   "touma",
   "それと。俺も好きだよ、ニナ。"
  ],
  [
   "nina",
   "……うん。もう一回、聞きたかった。",
   null,
   "shy"
  ],
  [
   "",
   "ニナが小指で手に触れる。トウマはその手を取り、炉の前へ一緒に座った。"
  ],
  [
   "",
   "それぞれの部屋へ戻る前に、明日の朝食を決めた。二人とも何度か言い間違えて、結局、いつものスープになった。"
  ]
 ],
 "friends": [
  [
   "",
   "最終話の夜 — 明日の席\n帰宅した二人は、残しておいたお湯でカップを温めた。"
  ],
  [
   "nina",
   "最後の焼き菓子、半分にしよう。"
  ],
  [
   "touma",
   "小さい方、俺でいい。"
  ],
  [
   "nina",
   "そこは遠慮しなくていいの。毎日一緒に食べるんだから。"
  ],
  [
   "",
   "少し不ぞろいに割れたかけらを、二人は一つずつ取った。"
  ],
  [
   "touma",
   "明日、窓の掛け金を直す。手、貸してくれるか。"
  ],
  [
   "nina",
   "うん。終わったら、お茶にしよう。"
  ],
  [
   "",
   "ニナは自分のカップを、いつもの場所へ戻した。今夜、気持ちに新しい名前はつけなかった。それでも、明日の食卓には二人分の席がある。"
  ]
 ]
};
root.OkaeriStory={nightScenes,objects,activeObjects,walkable,objective,intro,endings,faceCues,residentLines};
})(globalThis);
