(function(root){
'use strict';
function handle(id,a){
 const {state:s,talk,save,toast,scene,openModal,closeModal,updateHud,startBattle}=a,f=s.flags;
 const done=k=>{f[k]=true;save();updateHud();};
 if(id==='hillExit'){
  if(!f.waterReturned){talk([['サエ','丘の灯りは、共同水路の仕事が済んでからにしよう。足元が冷えるからね。']]);return true;}
  if(f.hillLit){scene('hill',4,13);talk([['nina','灯りは、ともってるね。小屋にも寄っていこうか。']]);return true;}
  const enter=()=>{done('hillStarted');scene('hill',4,13);};
  if(f.hillStarted){enter();return true;}
  talk([['','翌日。窓辺で乾いた手袋をはめると、昨日の水音が少し遠く聞こえた。'],['サエ','最後は風待ちの丘だよ。あそこの灯りがともれば、遠くの集落からも祭りに来られる。'],['touma','風よけの板と、予備の芯。持ちました。'],['nina','お弁当は？'],['touma','……作った。形は期待するなよ。'],['nina','中身を楽しみにしてる。',null,'happy'],['サエ','夕方には広場で待ってる。帰り道の分まで、体力を残しておいで。']],enter);return true;
 }
 if(id==='hillHome'){scene('town',2,9);if(f.hillLit&&!f.festivalStarted)talk([['','丘から下りると、広場には鍋の湯気と人の声が集まっていた。'],['nina','間に合ったね。'],['touma','サエさんに、ただいまって言おう。']]);return true;}
 if(id==='sae'&&f.hillLit){handle('festivalStart',a);return true;}
 if(id==='festivalStart'){
  if(!f.hillLit)return false;
  if(f.festivalStarted){talk([['サエ','もう仕事はおしまい。今夜は二人とも、祭りのお客さんだよ。']]);return true;}
  scene('town',12,10);
  talk([['サエ','おかえり。丘の灯り、ここからも見えたよ。'],['touma','ただいま。風よけも、直してきました。'],['nina','レンズも。遠くまで届いてるといいな。'],['サエ','もう着いた人がいるよ。「灯りがあって助かった」って。'],['','サエは二枚の出発札を、そっと町の欄に戻した。'],['サエ','よく帰ってきたね。さあ、温かいうちに食べておいで。'],['','最終話　帰り灯祭り\n広場でマロの料理を受け取り、繕いものの籠に寄ってみよう。']],()=>{done('festivalStarted');a.evening?.('three');});return true;
 }
 if(f.festivalStarted&&s.scene==='town'){
  if(id==='bakery'){
   if(f.festivalMeal){talk([['マロ','おかわりもあるよ。二人で、ゆっくりしていって。']]);return true;}
   talk([['マロ','はい、きのこのスープ。水路から届いたお水で作ったよ。'],['nina','あ、二人分。'],['マロ','席も二つ、並べてあるから。'],['','トウマが椅子の雪を払う。ニナは二つの器を、湯気がぶつかるくらい近くに置いた。'],['touma','うまい。昨日より、腹が減ってたのかも。'],['nina','私たちが帰ってくるの、待っててくれた味がする。'],['','行き交う人が「おかえり」と言うたび、ニナの肩が少しずつほどけていった。']],()=>done('festivalMeal'));return true;
  }
  if(id==='gift'){
   if(f.festivalRibbon){talk([['nina','結び目、ほどけてないね。'],['touma','しっかり結んでもらったからな。']]);return true;}
   talk([['','繕いものの籠に、小さな布の帯が積まれていた。使い終えた冬服から作る「帰り結び」だ。'],['nina','無事に帰ってほしい人の、鞄に結ぶんだって。'],['touma','知ってる。子どもの頃、母さんがつけてくれた。'],['nina','今年は……私が結んでもいい？',null,'shy'],['touma','うん。俺も、ニナのに。',null,'shy'],['','赤茶の帯がトウマの鞄に、青緑の帯がニナの鞄に揺れた。'],['nina','これで、迷子になれないね。'],['touma','なっても、探しに行くよ。']],()=>done('festivalRibbon'));return true;
  }
  if(id==='lamp'){
   if(!f.festivalMeal||!f.festivalRibbon){talk([['nina','帰り灯を見る前に、広場も一緒に回ろう。スープと、帰り結びの籠。']]);return true;}
   if(f.endingTouma||f.endingNina||f.endingFriends){talk([['','二つの影が、並んで雪の上に伸びている。'],['nina','また明日も、会おうね。']]);return true;}
   talk([['','祭りの音が少し遠くなる場所で、二人は足を止めた。森、水路、丘。届けた灯りが、町を囲んでいる。'],['nina','全部、帰るための灯りなんだね。'],['touma','うん。帰りたい場所があるから。'],['nina','……私ね。仕事がなくても、トウマと歩きたいな。',null,'shy'],['','トウマは、隣にいるニナを見た。いつもの距離に、まだ言っていない言葉があった。']],()=>{
    const finish=ending=>{closeModal();talk(OkaeriStory.endings[ending].lines,()=>{
     for(const k of ['endingTouma','endingNina','endingFriends'])f[k]=false;
     done({touma:'endingTouma',nina:'endingNina',friends:'endingFriends'}[ending]);
     if(a.evening){a.evening(ending);return;}openModal('<span class="tag">おかえりの灯 · END</span><h2>'+OkaeriStory.endings[ending].title+'</h2><div class="ending-art"></div><p>'+(ending==='friends'?'今の二人のまま、また明日の約束を。':'幼馴染の帰り道から、恋人としての明日へ。')+'</p><p>遊んでくれて、ありがとうございます。</p>',[['祭りの町へ',closeModal,true]],'explore');
    });};
    const wait=()=>{closeModal();talk([['nina','……もう少し、ここにいていい？'],['touma','うん。'],['nina','トウマが好き。幼馴染としてだけじゃなくて。',null,'shy'],['nina','明日からも、一番近くで笑っていたい。']],()=>openModal('<h2>ニナの言葉に、返事をする</h2><p>トウマは、ゆっくり息を吸った。</p>',[['「俺も好きだ」',()=>finish('nina'),true],['「まだ、今の関係を大切にしたい」',()=>{closeModal();talk([['touma','大事なんだ。でも、まだ恋人としての気持ちは決められない。'],['nina','……うん。ちゃんと答えてくれて、ありがとう。明日も会ってね。']],()=>finish('friends'));}]],'explore'));};
    openModal('<span class="tag">祭りの帰り道</span><h2>ニナに、伝えたいこと</h2><p>どの選択にも、二人の明日が続きます。</p>',[['自分から、好きだと伝える',()=>finish('touma'),true],['ニナの言葉を待つ',wait],['今の二人のままでいたい',()=>finish('friends')],['もう少し祭りを歩く',closeModal]],'explore');
   });return true;
  }
 }
 if(s.scene!=='hill')return false;
 if(id==='windbreak'){
  if(f.windbreak){talk([['touma','もう風に押されない。帰りも、ここを通ろう。']]);return true;}
  if(s.lead!=='touma'){talk([['nina','風よけの板、支えきれない。トウマ、先頭をお願い。']]);return true;}
  talk([['','外れた風よけが、雪煙の中で揺れている。'],['touma','板は俺が押さえる。風が弱まったら、縄を通して。'],['nina','うん。合図して。'],['','一度、二度。吹き上げる風の間に、短い静けさがあった。'],['touma','……今だ。'],['','ニナが縄をくぐらせ、トウマが板を引き寄せる。二人の息が、同じ白さでほどけた。'],['nina','昔、凧を直した時みたい。'],['touma','あの時は、直したそばから飛んでったけどな。']],()=>done('windbreak'));return true;
 }
 if(id==='hillRest'){
  if(f.hillRest){talk([['nina','お弁当箱、空っぽだね。'],['touma','次は、もう少し多く作る。']]);return true;}
  talk([['','見張り小屋の窓辺。トウマが開いた包みには、少し大きさの違うパンが二つ入っていた。'],['nina','本当に作ってくれたんだ。'],['touma','きのことチーズ。……具、寄ってるかもしれない。'],['nina','ううん。おいしい。',null,'happy'],['','ニナは小さな方を半分に割って、トウマの包みに置いた。'],['nina','作った人も、温かいうちに食べないと。'],['touma','ニナがそう言うと思って、先に一個食べた。'],['nina','準備がいい。……もう。',null,'happy'],['','同じ窓を見ながら、二人はしばらく黙って食べた。言葉がなくても、落ち着く時間だった。']],()=>done('hillRest'));return true;
 }
 if(id==='hillGuardian'){talk([['nina','番人が、灯台の前で風を受け止めてる。'],['touma','守ってたんだな。灯りが消えてからも。'],['nina','でも、体の灯りが乱れてる。落ち着かせて、私たちに任せてもらおう。']],()=>startBattle('guardian'));return true;}
 if(id==='hillLens'){
  if(f.hillLens){talk([['nina','町の窓を目印にすれば、レンズはずれないよ。']]);return true;}
  if(s.lead!=='nina'){talk([['touma','レンズの向きはニナに任せよう。俺は足場を押さえる。']]);return true;}
  talk([['','灯台のレンズに、薄い霜がついている。'],['nina','火を強くするより、霜を落として、目印に向けよう。'],['touma','目印って、どこだ？'],['nina','帰る場所。町の窓の灯り。']],()=>{
   const choose=correct=>{closeModal();talk(correct?[['','ニナが霜をぬぐい、レンズを町へ向ける。トウマが留め輪を締めた。'],['nina','よし。あとは二人で、火を。']]:[['','光が雪雲に散ってしまった。'],['nina','町の窓を探そう。あの橙色の灯りだよ。']],correct?()=>done('hillLens'):undefined);};
   openModal('<h2>帰り道を照らす向き</h2><p>レンズを、どこへ向けよう。</p>',[['雪雲の切れ間',()=>choose(false)],['町の窓の灯り',()=>choose(true),true],['遠くの山頂',()=>choose(false)],['いったん離れる',closeModal]],'explore');
  });return true;
 }
 if(id==='hillBeacon'){
  if(!f.hillLens){toast('先にニナでレンズを合わせよう');return true;}
  if(f.hillLit){talk([['touma','帰ろう。今度は、俺たちがこの灯りを見る番だ。']]);return true;}
  talk([['','風よけの内側で、二人の手がランタンに重なる。'],['nina','せーの。'],['','小さな火がレンズの中で広がり、雪原へ長い道を描いた。'],['touma','……届いた。'],['nina','うん。帰っておいで、って。'],['','遠く、町の方で一つの灯りが揺れた。返事のように。'],['nina','トウマ。今日はちゃんと、祭りも一緒に回ってね。',null,'shy'],['touma','そのつもりで、来た。',null,'happy']],()=>{done('hillLit');toast('丘の灯りがともった。町のサエのもとへ帰ろう');});return true;
 }
 return false;
}
root.OkaeriHill={handle};
})(globalThis);
