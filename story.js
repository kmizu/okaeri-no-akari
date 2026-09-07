(function(root){
const objects={
hill:[{id:'returnSign',x:7,y:9,label:'小屋の帰還札',type:'returnSign'},{id:'hillHome',x:4,y:14,label:'ユキネへ戻る',type:'exit'},{id:'windbreak',x:8,y:11,label:'外れた風よけ',type:'windbreak'},{id:'hillRest',x:6,y:8,label:'風待ちの小屋',type:'camp'},{id:'hillGuardian',x:12,y:9,label:'尾根の番人',type:'guardian',hide:'hillGuardian'},{id:'hillLens',x:17,y:5,label:'霜のついたレンズ',type:'hillLens'},{id:'hillBeacon',x:20,y:3,label:'丘の灯台',type:'hillBeacon'}],
canal:[{id:'canalHome',x:3,y:13,label:'ユキネへ戻る',type:'exit'},{id:'waterGate',x:8,y:10,label:'凍りついた水門',type:'waterGate'},{id:'canalRest',x:6,y:7,label:'水番の休憩所',type:'camp'},{id:'canalCrab',x:12,y:10,label:'水路のヤドカリ',type:'crab',hide:'canalCrab'},{id:'regulator',x:15,y:6,label:'三つの調整灯',type:'regulator'},{id:'waterBeacon',x:20,y:3,label:'水路の帰り灯',type:'waterBeacon'}],
town:[{id:'elna',x:7,y:11,label:'織り手のエルナ',type:'npc'},{id:'orlf',x:16,y:10,label:'配達人のオルフ',type:'npc'},{id:'hillExit',x:1,y:9,label:'風待ちの丘へ',type:'exit'},{id:'canalExit',x:22,y:9,label:'共同水路へ',type:'exit'},{id:'board',x:10,y:8,label:'出発札',type:'board'},{id:'sae',x:14,y:9,label:'師匠のサエ',type:'npc'},{id:'bakery',x:6,y:8,label:'パン屋のマロ',type:'npc'},{id:'lamp',x:18,y:9,label:'帰り灯',type:'lamp'},{id:'gift',x:4,y:11,label:'繕いものの籠',type:'basket'},{id:'exit',x:12,y:2,label:'森へ続く道',type:'exit'}],
forest:[{id:'sewingBox',x:4,y:8,label:'小屋の道具箱',type:'sewingBox'},{id:'home',x:5,y:14,label:'ユキネへ戻る',type:'exit'},{id:'mochi',x:5,y:11,label:'こごえモチ',type:'mochi',hide:'mochi'},{id:'rest',x:5,y:7,label:'森の休憩小屋',type:'camp'},{id:'log',x:9,y:9,label:'道をふさぐ倒木',type:'log',hide:'log'},{id:'repair',x:12,y:7,label:'壊れた灯りの橋',type:'repair'},{id:'crab',x:15,y:4,label:'こおりヤドカリ',type:'crab',hide:'crab'},{id:'guardian',x:19,y:4,label:'枝角の番人',type:'guardian',hide:'guardian'},{id:'tower',x:20,y:2,label:'森の灯台',type:'tower'}]
};
function activeObjects(s){return objects[s.scene].filter(o=>!o.hide||!s.flags[o.hide]);}
function walkable(s,x,y){
 if(x<1||x>22||y<2||y>14)return false;
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
 let path=(x>=4&&x<=6&&y>=7&&y<=14)||(x>=5&&x<=13&&y>=8&&y<=10)||(x>=11&&x<=13&&y>=3&&y<=9)||(x>=12&&x<=21&&y>=3&&y<=5)||(x>=19&&x<=21&&y>=2&&y<=5);
 if(!path)return false;
 if(!s.flags.mochi&&y===10&&x<=6)return false;
 if(!s.flags.log&&x===9&&y>=8)return false;
 if(!s.flags.repair&&y===6&&x>=11&&x<=13)return false;
 if(!s.flags.crab&&x===16&&y<=5)return false;
 if(!s.flags.guardian&&x===20&&y<=5)return false;
 return true;
}
function objective(s){const f=s.flags;if(s.scene==='hill'){if(!f.windbreak)return 'トウマで風よけを直そう';if(!f.hillGuardian)return '尾根を守る番人を落ち着かせよう';if(!f.hillLens)return 'ニナで灯台のレンズを合わせよう';if(!f.hillLit)return '二人で丘の灯台をともそう';return '町へ戻って、サエにただいま';}if(s.scene==='canal'){if(!f.waterGate)return 'トウマで水門を支えよう';if(!f.canalCrab)return '水路に迷い込んだヤドカリを落ち着かせよう';if(!f.waterFlow)return 'ニナで三つの調整灯をつなごう';if(!f.waterLit)return '水路の帰り灯をともそう';return '水音と一緒に町へ帰ろう';}if(s.scene==='town'){if(f.endingTouma||f.endingNina||f.endingFriends)return 'また明日も、二人で。祭りを楽しもう';if(f.festivalStarted){if(!f.festivalMeal)return 'マロのスープを、二人で味わおう';if(!f.festivalRibbon)return '繕いものの籠で、帰り結びを';return '東の帰り灯で、ニナと話そう';}if(f.hillLit)return 'サエに報告して、帰り灯祭りへ';if(f.waterReturned)return '西の道から、風待ちの丘へ';if(f.returned)return f.waterLit?'パン屋のマロに、水が戻ったと伝えよう':'東の道から共同水路へ';if(f.lit)return '出発札を戻して、みんなにただいま';if(!f.board)return '広場の出発札を掛けよう';return '北の道から、森の灯台へ';}if(!f.mochi)return '道で跳ねる精霊を落ち着かせよう';if(!f.log)return 'トウマで倒木を動かそう';if(!f.repair)return 'ニナで灯りの橋を修理しよう';if(!f.crab)return '氷殻を火花で溶かそう';if(!f.guardian)return '灯台を守る番人のもとへ';if(!f.lit)return '二人で森の灯台をともそう';return '町へ帰ろう。南の道か、手帳から';}
const intro=[['','冬の終わり。雪の町ユキネでは、帰り灯祭りの支度が始まっていた。'],['nina','トウマ、手。出して。'],['touma','……出発前の点検？'],['nina','右の手袋。また穴、あいてたでしょ。昨日、直しておいた。'],['touma','よく気づいたな。……ありがと。'],['nina','毎年のことだからね。あ、鞄の金具、直してくれた？'],['touma','手袋のまま開けられるようにした。試してみて。'],['nina','……うん。開けやすい。ありがと。'],['サエ','支度はできたね。今日はまず、森の灯台まで。出発札を掛けてから行くんだよ。'],['touma','行こう、ニナ。祭りまでには帰ってこよう。'],['','移動：矢印キー / WASD / 地面をクリック\n調べる：近づいて E または Enter　交代：Q\n右上の案内と「旅の手帳」で目的を確認できます。']];
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
root.OkaeriStory={objects,activeObjects,walkable,objective,intro,endings,faceCues,residentLines};
})(globalThis);
