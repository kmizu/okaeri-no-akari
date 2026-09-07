(function(root){
'use strict';
function handle(id,a){
 const {state:s,talk,save,toast,scene,openModal,closeModal,updateHud,startBattle}=a,f=s.flags;
 const done=flag=>{f[flag]=true;save();updateHud();};
 if(id==='canalExit'){
  if(!f.returned){talk([['touma','水路の方は、森から戻ってからだな。'],['nina','まずは森の灯りを届けよう。']]);return true;}
  const enter=()=>{done('canalStarted');scene('canal',3,12);};
  if(f.canalStarted){enter();return true;}
  talk([['マロ','おはよう、二人とも。朝からごめんね。共同水路が凍っちゃったみたい。'],['マロ','飲み水は汲み置きがあるけど、祭りの大鍋を洗う水が足りないんだ。'],['サエ','水番の道具は休憩所にある。水門は重いから、必ず二人で。'],['nina','トウマ、支度はいい？'],['touma','うん。昨日の焼き菓子の分、働かないと。'],['マロ','仕事の分じゃないよ。それは、おかえりの分。'],['','ニナが小さく笑い、空の水筒を鞄に戻した。'],['nina','じゃあ今度は、お水を連れて帰ろう。']],enter);return true;
 }
 if(id==='canalHome'){scene('town',21,9);if(f.waterLit&&!f.waterReturned)talk([['','町の台所から、水の流れる音が聞こえてきた。'],['nina','私たちより、先に帰ってきたね。'],['touma','マロさんにも、知らせよう。']]);return true;}
 if(id==='bakery'&&f.waterLit){
  if(f.waterReturned){talk([['マロ','お鍋もぴかぴか。祭りのスープ、楽しみにしててね。'],['nina','二人分、とっておいてください。']]);return true;}
  talk([['マロ','水、戻ったよ！　ほら、こんなに澄んでる。'],['touma','水門の氷と、調整灯でした。もう大丈夫です。'],['マロ','ありがとう。これで明日は、みんなの分を仕込める。'],['','マロは二つのカップに、温かいりんご湯を注いだ。'],['nina','……同じカップだ。水路のヤドカリと。'],['マロ','あら。前に水番さんに分けたのが、一つなくなってたの。'],['touma','今は、大事に使ってるやつがいます。'],['マロ','それなら、返さなくていいね。'],['','湯気の向こうでニナと目が合って、二人とも笑った。']],()=>{done('waterReturned');if(a.evening){a.evening('two');return;}openModal('<span class="tag">第二話 · 完</span><h2>水音の帰る道</h2><p>二人が戻した水は、明日の食卓へ。<br>祭りの支度が、また一つ整いました。</p><p>次は第三話「風待ちの丘」。町の西口から、最後の灯台へ進めます。</p>',[['町へ戻る',closeModal,true]],'explore');});return true;
 }
 if(s.scene!=='canal')return false;
 if(id==='waterGate'){
  if(f.waterGate){talk([['touma','留め具はしっかりしてる。もう手を離しても大丈夫だ。']]);return true;}
  if(s.lead!=='touma'){talk([['nina','氷は溶かせそう。でも水門を持ち上げるのは……トウマ、お願い。'],['','Qでトウマを先頭にしよう。']]);return true;}
  talk([['touma','俺が持つ。留め具を通してくれ。'],['nina','待って。袖が濡れちゃう。……少しまくるね。'],['touma','自分でできるって。'],['nina','両手、ふさがってるでしょ。'],['','ニナは外套の袖を折り、留め具に小さな火をともした。'],['touma','……頼む。せーの。'],['','水門が持ち上がり、足元に細い水音が戻った。'],['nina','もういいよ。ありがと。痛いところ、ない？'],['touma','ない。袖も、乾いてる。',null,'happy']],()=>done('waterGate'));return true;
 }
 if(id==='canalCrab'){talk([['nina','この子も、カップを家にしてるんだ。'],['touma','水が止まって、帰れなくなったんだな。'],['nina','氷をほどこう。水路が流れたら、きっと戻れる。']],()=>startBattle('crab'));return true;}
 if(id==='canalRest'){
  if(f.canalRest){talk([['','並んだカップの跡が、木のベンチにうっすら残っている。'],['nina','帰りにも、ここで休もうね。']]);return true;}
  talk([['','水番の休憩所。壁には「次の人のために、薪を二本」と書かれていた。'],['touma','二本、足しておこう。'],['nina','こういうの、誰が最初に始めたんだろうね。'],['touma','寒かった人じゃないか。次の人も寒いだろうって。'],['','ニナはうなずいて、二人のカップを火のそばに置いた。'],['nina','昔さ、雪の日にここで迎えを待ったの、覚えてる？'],['touma','ニナが泣いて、俺が平気なふりをした日？'],['nina','泣いてない。……ちょっとだけ。'],['touma','俺も、ちょっと怖かった。'],['nina','今は？'],['touma','帰り道、分かるから。'],['nina','私は、二人だから。',null,'shy'],['','トウマは薪を一本動かした。返事を考えている間にも、耳が少し熱くなった。']],()=>{done('canalRest');s.courage=Math.min(3,s.courage+1);save();toast('手帳に「次の人の薪」を残した');});return true;
 }
 if(id==='regulator'){
  if(f.waterFlow){talk([['nina','上流から水門、それから町へ。いい流れ。']]);return true;}
  if(s.lead!=='nina'){talk([['touma','灯りの順番か。ニナの目で、確かめてもらおう。'],['','Qでニナを先頭にしよう。']]);return true;}
  talk([['','調整盤に、三つの灯りがある。「上流」「水門」「町」。'],['nina','いきなり町に流すと、冷たい水が水門で詰まっちゃう。'],['touma','水の来る方から、順番に温めるんだな。']],()=>{
   const choose=correct=>{closeModal();if(!correct){talk([['','灯りがゆっくり消えた。水はまだ、静かなままだ。'],['nina','大丈夫、壊れてないよ。上流から順に、もう一度。']]);return;}
    talk([['','上流の灯りから、橙色が水門へ、そして町へ渡っていく。'],['touma','聞こえる。流れ始めた。'],['nina','うん。今度は、最後まで帰れるね。']],()=>done('waterFlow'));
   };
   openModal('<span class="tag">ニナ · 灯りの調整</span><h2>水の帰る順番</h2><p>水が来る場所から、一つずつ温めよう。</p>',[['上流 → 水門 → 町',()=>choose(true),true],['町 → 水門 → 上流',()=>choose(false)],['水門 → 上流 → 町',()=>choose(false)],['いったん離れる',closeModal]],'explore');
  });return true;
 }
 if(id==='waterBeacon'){
  if(!f.waterFlow){toast('先に調整灯をつなごう');return true;}
  if(f.waterLit){talk([['nina','この灯りを見たら、水番さんも安心するね。']]);return true;}
  talk([['','流れの先に、小さな帰り灯が立っていた。'],['nina','「最後に点検した人が、ともすこと」だって。'],['touma','じゃあ、俺たちの番だ。'],['','トウマが風をよけ、ニナが芯に火を移す。雪の下を、澄んだ水音が走った。'],['nina','明日のスープ、この水で作るんだね。'],['touma','そう聞くと、楽しみになるな。'],['nina','一緒に食べよう。……いい席、とっておくから。',null,'shy'],['touma','隣、空けておいて。',null,'happy']],()=>{done('waterLit');toast('水路の帰り灯がともった。町のマロに知らせよう');});return true;
 }
 return false;
}
root.OkaeriCanal={handle};
})(globalThis);
