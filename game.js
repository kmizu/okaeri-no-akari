(function(){
'use strict';
const C=OkaeriCore,S=OkaeriStory,W=OkaeriWorld,$=id=>document.getElementById(id);
const normalSaveKey='okaeri-forest-v1',chapterSaveKey='okaeri-chapter-v1';let saveKey=normalSaveKey;const canvas=$('world'),renderer=new W.Renderer(canvas);
const fresh=()=>({version:1,scene:'town',x:12,y:10,lead:'touma',flags:{},courage:0});
let state=fresh(),mode='title',queue=[],afterTalk=null,queueIndex=0,battle=null,commands={},order=['touma','nina'],battleOrigin=null,modalReturn='explore',route=[],routeTarget=null,lastMove=0,held={},sound=false,audio=null,bgm=new OkaeriMusic();
const name=id=>id==='touma'?'トウマ':id==='nina'?'ニナ':id;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let saved=null;try{saved=C.restoreSave(localStorage.getItem(saveKey));}catch{}$('continueButton').hidden=!saved;
function save(){try{localStorage.setItem(saveKey,JSON.stringify(state));if(saveKey===normalSaveKey)saved=C.restoreSave(JSON.stringify(state));$('saveStatus').textContent=saveKey===normalSaveKey?'この端末に保存しました':'章選択の旅を保存しました（通常の旅は保持）';}catch{$('saveStatus').textContent='保存できません。終了すると進行が失われます';}}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,2600);}
function updateHud(){
 $('locationName').textContent=state.scene==='house'?'二人の家':state.scene==='town'?'雪の町 ユキネ':state.scene==='canal'?'雪解けの共同水路':state.scene==='hill'?'風待ちの丘':'粉ひきの森';$('weather').textContent=state.scene==='house'?'薪の灯り / 家の中':state.flags.festivalStarted?'帰り灯祭り / 夜':state.flags.hillStarted?'祭りの日 / 夕暮れ':state.flags.lit?'冬の終わり / 夕暮れ':'冬の終わり / 午前';
 $('chapter').textContent=state.flags.festivalStarted?'最終話 · 帰り灯祭り':state.flags.hillStarted?'第三話 · 風待ちの丘':state.flags.canalStarted?'第二話 · 水音の帰る道':'第一話 · 帰り灯の日';
 $('objectiveText').textContent=S.objective(state);$('leadText').textContent=name(state.lead)+'が先頭';$('leadDot').style.background=state.lead==='touma'?'#77b8b6':'#cb8267';
 const o=nearest();$('interactPrompt').hidden=!o||mode!=='explore';if(o)$('interactPrompt').textContent='E　'+o.label;
}
function openModal(html,buttons,returnMode=mode){modalReturn=returnMode;mode='modal';held={};route=[];$('modalContent').innerHTML=html+'<div class="actions" id="modalActions"></div>';
 for(const [label,fn,primary] of buttons){const b=document.createElement('button');b.textContent=label;if(primary)b.className='primary';b.onclick=fn;$('modalActions').append(b);}$('modal').hidden=false;
}
function closeModal(){ $('modal').hidden=true;mode=modalReturn;canvas.focus();updateHud(); }
function talk(lines,done){held={};route=[];queue=lines;queueIndex=0;afterTalk=done;mode='dialogue';$('dialogue').hidden=false;showLine();updateHud();}
function showLine(){
 const q=queue[queueIndex],speaker=q[0],mood=q[3]||S.faceCues[q[1]]||'neutral';$('speaker').textContent=speaker?name(speaker):'おかえりの灯';$('dialogueText').textContent=q[1];const faceId={touma:'touma',nina:'nina','サエ':'sae','マロ':'maro','エルナ':'elna','オルフ':'orlf'}[speaker];$('portrait').className='portrait '+(faceId?faceId+' '+mood:'other');$('portrait').setAttribute('aria-label',name(speaker)+'の表情：'+({neutral:'通常',happy:'笑顔',shy:'照れ'}[mood]));$('portrait').textContent=faceId?'':'❄';$('choices').replaceChildren();$('nextDialogue').hidden=!!q[2];
 if(q[2])for(const [label,action] of q[2]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{if(action)action();nextDialogue();};$('choices').append(b);}
}
function nextDialogue(){if(mode!=='dialogue')return;queueIndex++;if(queueIndex<queue.length){showLine();return;}$('dialogue').hidden=true;mode='explore';let done=afterTalk;afterTalk=null;if(done)done();updateHud();}
function start(s,fromSave,key=normalSaveKey){saveKey=key;state=s;mode='explore';$('titleScreen').hidden=true;$('hud').hidden=false;$('modal').hidden=true;$('battleScreen').hidden=true;$('dialogue').hidden=true;renderer.reset(state);updateHud();canvas.focus();if(!fromSave){setMusic('opening');talk(S.intro,()=>{save();setMusic('village');});}else{travelMusic();if(state.pendingEvening)evening(state.pendingEvening);else toast('二人の旅を再開しました');}}
function nearest(){return S.activeObjects(state).map(o=>({o,d:Math.hypot(o.x-state.x,o.y-state.y)})).filter(p=>p.d<1.65).sort((a,b)=>a.d-b.d)[0]?.o;}
function switchLead(){if(mode!=='explore')return;state.lead=state.lead==='touma'?'nina':'touma';updateHud();save();tone(state.lead==='nina'?523:392,.12);}
function scene(next,x,y){state.scene=next;travelMusic();state.x=x;state.y=y;renderer.reset(state);route=[];save();updateHud();}
function interact(){if(mode==='dialogue'){if(!queue[queueIndex][2])nextDialogue();return;}if(mode!=='explore')return;const o=nearest();if(!o){toast('気になるものに近づいて、調べてみよう');return;}handle(o.id);}
function handle(id){const f=state.flags;if(handleHouse(id))return;if(OkaeriSideStories.handle(id,{state,talk,save,updateHud,toast,openModal,closeModal}))return;if(['elna','orlf'].includes(id)){talk(S.residentLines(state,id));return;}if(OkaeriHill.handle(id,{state,talk,save,toast,scene,openModal,closeModal,updateHud,startBattle,evening}))return;if(OkaeriCanal.handle(id,{state,talk,save,toast,scene,openModal,closeModal,updateHud,startBattle,evening}))return;
 if(id==='board'){
  if(f.returned){talk([['','二枚の出発札は、並んで町の欄に戻っている。'],['nina',f.waterReturned?'今日も、二人で帰ってこられたね。':'今度は東の水路だね。帰ったらまた、ここに寄ろう。']]);return;}
  if(f.lit){f.returned=true;save();talk([['','トウマとニナは、二枚の出発札を並べて戻した。'],['サエ','おかえり。灯台の火、町からも見えたよ。'],['touma','ただいま。二人で、ともしてきました。'],['サエ','そうか。手は？　冷やしすぎてないかい。'],['nina','橋で少し。でも、待ってもらってから直しました。'],['サエ','うん。いい報告だ。'],['','サエは二枚の札を確かめて、傾いていた方を指先で直した。'],['touma','そこからでも、見えるんですね。札の傷。'],['サエ','毎日見てるからね。'],['マロ','お疲れさま！　焼き場も準備できたよ。まずは食べていって。'],['nina','……いい匂い。朝から楽しみにしてたんだ。'],['','濡れた外套を掛け、二人で食卓につく。\n冷たかった指先が、ゆっくり温まっていく。'],['nina','トウマ。明日も、一緒に行こうね。'],['touma','うん。お弁当、今度は俺が作る。'],['nina','じゃあ、飲み物は私。甘さ控えめ、だよね。']],()=>evening('one'));return;}
  if(f.board){talk([['nina','札、二人分あるね。これで、ちゃんと帰ってこなくちゃ。'],['touma','帰ろう。二人で。']]);return;}
  talk([['','「トウマ」「ニナ」――二枚の木札を、森の欄に掛ける。'],['nina','昔は、サエさんの札の隣に付いて歩いてたね。'],['touma','今年は俺たちだけだ。'],['','札の下端には、小さな丸いくぼみがある。ニナが手袋の親指で、そっとなぞった。'],['nina','これ、背伸びして掛けようとして、落とした跡。まだ残ってる。'],['touma','俺が椅子を持ってくる前に登るから。'],['nina','トウマだって、下で受け止めるって言ったよ。'],['touma','……札じゃなくて、お前をな。'],['nina','うん。……頼りにしてる。'],['touma','こっちも。']],()=>{f.board=true;save();updateHud();toast('行き先を記録した。北の道から森へ。');});return;
 }
 if(id==='sae'){talk([['サエ','灯守の仕事は、火をつけるだけじゃない。帰ってくるまでが仕事だよ。'],['サエ','倒木はトウマ、灯りの仕掛けはニナ。得意な方に先頭を代わるんだ。'],['nina','危ない風が出たら、休憩小屋で待ちます。'],['サエ','それでいい。灯りが消えていたら、戻る判断をする人もいる。道は見えなくても、あの火だけは見えるからね。'],['touma','間に合わせなきゃ、ですね。'],['サエ','急ぐのと、無茶をするのは別だよ。休んだことも、引き返したことも、ちゃんと報告するんだ。'],['サエ','帰ったら、二人の話を聞かせておくれ。']],()=>{f.sae=true;save();});return;}
 if(id==='bakery'){if(f.bread){talk([['マロ','帰りは焼きたてを用意しておくね。道中、気をつけて！']]);return;}
 talk([['マロ','おはよう！　灯台まで行くんだって？　これ、持っていって。'],['','紙包みの中には、干しりんごの焼き菓子が二つ。'],['touma','ニナ、好きだろ。これ。'],['nina','……覚えてたんだ。'],['touma','毎年、屋台で迷わず買うから。'],['マロ','包みは小屋の火起こしに使っていいよ。油が染みたところが、よく燃えるから。'],['nina','マロさんの包み、昔は宝物をくるんでたのに。'],['マロ','知ってる。石ころ入りのまま返してくれたこともあったね。'],['touma','……それ、まだ覚えてるんですか。'],['マロ','今日は二人とも、無事に帰っておいで。夕方の焼き上がりを一つ、遅らせておくよ。']],()=>{f.bread=true;state.courage=Math.min(3,state.courage+1);save();toast('包みに、焼き菓子が増えた');});return;}
 if(id==='lamp'){talk([['','玄関の風除室に、小さな帰り灯がともっている。'],['nina','この家、おじさんが隣の集落に配達中なんだって。'],['touma','最後に帰った人が消すんだよな。'],['nina','うん。「待ってるよ」って、灯りで言うの。']],()=>{f.lamp=true;save();});return;}
 if(id==='gift'){talk([['','共同所の籠には、繕いかけの手袋と色とりどりの糸。'],['nina','トウマの右の手袋、次はもう少し丈夫な糸にしようかな。'],['touma','まだ直してもらう前提なんだな。'],['nina','……嫌？'],['touma','いや。助かってる。ずっと。']],()=>{f.gift=true;save();});return;}
 if(id==='exit'){if(!f.board){talk([['nina','先に出発札を掛けよう。サエさんが心配しちゃう。']]);return;}scene('forest',5,13);if(!f.mochi)talk([['nina','雪、まだ深いね。'],['touma','俺が先に踏む。道標は頼んだ。'],['nina','任せて。あれ……道の上、何か跳ねてる。']]);return;}
 if(id==='home'){scene('town',12,3);if(f.lit)talk([['','町の窓に、朝よりたくさんの灯りがともっていた。'],['nina','ただいまって言う前から、帰ってきた感じがするね。'],['touma','札、戻してこよう。']]);return;}
 if(id==='mochi'){talk([['nina','こごえモチだ。寒くて、ランタンに集まってきたんだね。'],['touma','道を空けてもらおう。傷つけすぎないように。'],['','「たたかう」を選び、トウマ、ニナの順に行動を決めます。\n矢印キーで選び、Enterで決定。Escでひとつ前へ。\nトウマの「とくぎ」とニナの「じゅもん」で、二人の連携も使えます。']],()=>startBattle('mochi'));return;}
 if(id==='log'){if(state.lead!=='touma'){talk([['nina','これは重いな……。トウマ、お願い。'],['','Q または左下の交代ボタンで、トウマを先頭にしよう。']]);return;}
 talk([['touma','端を持ち上げる。ニナ、小枝だけ払ってくれるか。'],['nina','うん。せーの、でいくよ。'],['','二人で息を合わせ、倒木を道の端へ動かした。'],['nina','……昔はこれくらいの枝も、二人で引きずってたね。'],['touma','俺たちが、でかくなったんだろ。']],()=>{f.log=true;save();toast('森の奥へ進めるようになった');});return;}
 if(id==='rest'){if(f.rest){talk([['','炉にはまだ、穏やかな火が残っている。\n二人は飲み物を温め、ひと息ついた。'],['nina','無理しないで進もうね。']]);return;}
 const lines=[['','小屋の雪を払い、扉を閉める。炉のそばに手袋を掛けると、張っていた肩が少し緩んだ。'],['nina','お昼にしよう。包みパン、ちょっと形が変だけど。'],['touma','中身は？'],['nina','きのことチーズ。好きでしょ。'],['touma','うん。……うまい。'],['nina','よかった。トウマの飲み物も、あったかい。'],['','窓際の棚には、大小ふぞろいのカップが並んでいた。一つだけ、青い取っ手が継いである。'],['nina','あのカップ、まだある。吹雪でサエさんと泊まったときの。'],['touma','お前、帰れないって泣いてた。'],['nina','泣いてない。……ちょっとしか。トウマはずっと、扉の前にいたね。'],['touma','先に雪がやむのを見つけたくて。'],['nina','私、平気な顔してるつもりだったけど。今日も、少しだけ怖かった。サエさんが後ろにいないの。'],['touma','俺も。札を掛けたら、急に。'],['nina','……そっか。私だけじゃなかったんだ。'],['touma','次から、寒いとか怖いとか、先に言おう。黙ってると分からないこともあるし。'],['nina','じゃあ、今ひとつ。もう少し、ここにいたい。'],['touma','うん。飲み終わるまで。'],['','トウマは、カップを両手で包むニナを見た。',[['「こういう時間、好きだな」',()=>{state.courage=Math.min(3,state.courage+1);}],['「次は俺が作るよ」',()=>{state.courage=Math.min(3,state.courage+1);}],['「もう一個、食べてもいい？」',()=>{}]]],['nina','……また二人で来ようね。今度は、急がなくていい日に。'],['touma','うん。そうしよう。'],['','出発前に、トウマは炉の横へ細い薪を寄せた。ニナは空いたカップを洗い、次の人が取りやすい向きに戻した。'],['nina','取っ手、こっちでいいかな。'],['touma','うん。手袋のままでも取れる。']];
 if(f.bread)lines.push(['','食後に、マロの焼き菓子を分けた。\nニナは袋に残った小さなかけらまで、大事そうに食べた。']);
 talk(lines,()=>{f.rest=true;save();toast('小屋の思い出を、手帳に残した');});return;}
 if(id==='repair'){if(f.repair){talk([['nina','うん。しっかりつながってる。これなら帰りも安心。']]);return;}if(state.lead!=='nina'){talk([['touma','灯りの線が切れてる。これはニナの出番だな。'],['','Q または交代ボタンで、ニナを先頭にしよう。']]);return;}
 talk([['nina','橋の灯りが消えて、足元が凍ってる。線をつなぎ直せば……。'],['touma','俺が支える。手袋、落とすなよ。'],['nina','大丈夫。金具が開けやすくなったから。'],['','トウマが灯柱を支え、ニナが芯をつなぐ。\n橙色の火が走り、橋の薄氷がするりとほどけた。'],['nina','……あと一息。風で指が滑る。少し待って。'],['touma','分かった。こっちは持てる。急がなくていい。'],['','ニナは一度手を引き、息を吹きかけてから、最後の留め具を締め直した。'],['nina','できた。今度は私が先に行くね。'],['touma','足元、見てる。'],['nina','うん。後ろは任せた。']],()=>{f.repair=true;save();toast('灯りの橋を修理した');});return;}
 if(id==='crab'){talk([['nina','あのヤドカリ、カップが氷で覆われてる。'],['touma','火花で溶かしてから、俺が合わせる。'],['','ニナの「じゅもん」から「火花」を選ぼう。\n氷の殻が溶けると、次のターンからトウマの攻撃も届きやすくなります。']],()=>startBattle('crab'));return;}
 if(id==='guardian'){talk([['touma','枝角の番人……。灯台の前から動かないな。'],['nina','見て、角のところ。鳥の巣を守ってる。吹雪で落ちてきたんだ。'],['touma','怖がらせずに近づくのは、難しそうだな。'],['nina','荒れた灯りを落ち着かせよう。二人ならできるよ。'],['','番人の大きな踏み込みは、トウマの「かばう」で守れます。\n息ぴったりの灯りが三つともったら、二人技「灯火の一閃」が使えます。']],()=>startBattle('guardian'));return;}
 if(id==='tower'){if(!f.guardian){toast('先に、番人を落ち着かせよう');return;}if(f.lit){talk([['nina','町まで見えるかな。この灯り。'],['touma','きっと、見てる。帰ろう。']]);return;}
 talk([['touma','灯りの軸、ここでいいか？'],['nina','うん。そのまま……少しだけ支えてて。'],['','ニナがランタンの火を分ける。\nトウマの手の中で軸が震え、灯台に温かな光が満ちた。'],['nina','……ともった！'],['touma','うん。二人で、できたな。'],['','光が雪の稜線をなぞり、遠い道標がひとつ浮かび上がる。その下を、荷を背負った小さな影が町へ向かっていた。'],['nina','あの人にも、見えたかな。'],['touma','立ち止まった。……こっちを見てる。'],['','二人は手を振った。遠すぎて届いたかは分からない。それでも、影がまた歩きだすまで見送った。'],['nina','小さいころ、窓からここを探したよね。サエさん、もう帰ってくるかなって。'],['touma','今日は、向こうから誰かが探してるんだな。'],['nina','帰ろう。……安心したら、お腹が空いちゃった。'],['touma',f.rest?'小屋であんなに食べたのに。':'そういえば、ちゃんと休んでなかったな。'],['nina','町に着いたら、座ってゆっくり食べようね。']],()=>{f.lit=true;save();tone(659,.7);updateHud();openModal('<span class="tag">第一の灯り</span><h2>森の灯台が、ともった</h2><p>道はもう分かっている。二人で町へ帰ろう。<br>そのまま森を歩いて戻ることもできます。</p>',[['二人で町へ帰る',()=>{closeModal();scene('town',12,3);talk([['','帰り道の小さな標識灯も、ぽつり、ぽつりと明るくなっていた。'],['nina','私たちの火、帰り道を照らしてるね。'],['touma','うん。……ただいまを言いに行こう。']]);},true],['森をもう少し歩く',closeModal]],'explore');});}
}
let classicBattle=null;
function startBattle(kind){setMusic('battle');
 battleOrigin=kind;battle=C.newBattle(kind);order=['touma','nina'];commands={};mode='battle';held={};route=[];$('battleScreen').hidden=false;
 if(!classicBattle)classicBattle=new OkaeriBattle.BattleUI($('battleScreen'),{
  onTurn:(selected,team)=>{commands=selected;resolve(team);},
  onVictory:victory,onRetry:()=>startBattle(battleOrigin),
  onEscape:()=>{travelMusic();$('battleScreen').hidden=true;mode='explore';updateHud();canvas.focus();toast('二人は 道へもどった。');}
 });
 classicBattle.begin(battle);tone(294,.2);
}
function resolve(team=false){if(mode!=='battle')return;try{
 battle=C.resolveTurn(battle,team?{team:'flare'}:commands,order);tone(battle.status==='victory'?659:392,.15);classicBattle.showResult(battle);
 }catch(err){toast(err.message.replace('SP','MP'));classicBattle.begin(battle);}}
function victory(){travelMusic();if(state.scene==='hill'){closeModal();$('battleScreen').hidden=true;mode='explore';state.flags.hillGuardian=true;save();updateHud();talk([['','枝角の番人は、ゆっくり雪の上に伏せた。荒れていた灯りが、穏やかに戻っている。'],['nina','待っててね。すぐに、灯台をともすから。'],['touma','今度は俺たちが、帰り道を守る。']]);return;}if(state.scene==='canal'){closeModal();$('battleScreen').hidden=true;mode='explore';state.flags.canalCrab=true;save();updateHud();talk([['','ヤドカリは、温まった水の中へそっと降りていった。'],['nina','帰る場所、見つかったね。'],['touma','俺たちも、水を家まで連れていこう。']]);return;}closeModal();$('battleScreen').hidden=true;mode='explore';state.flags[battle.kind]=true;save();updateHud();
 const lines=battle.kind==='mochi'?[['','雪玉たちは、すっかり小さくなって道端へ跳ねていった。'],['nina','あったかくなったんだね。よかった。'],['touma','この先、小屋がある。お昼にしよう。']]:battle.kind==='crab'?[['','氷の溶けたカップから、小さなはさみがのぞく。\nヤドカリは水路へ、ことこと歩いていった。'],['nina','あのカップ、誰かの忘れ物かな。'],['touma','今はあいつの家だな。']]:[['','枝角の番人が、ゆっくり頭を下げる。\n二人は巣を受け取り、低い木の枝へ戻した。'],['nina','ここなら、風も当たらないよ。'],['touma','……守ってたんだな。ずっと。'],['','苔の上で、小鳥が一声鳴いた。'],['nina','さあ。私たちも、灯りをつけよう。']];talk(lines);}
function journal(){if(!['explore','title'].includes(mode))return;if(mode==='title'){openModal('<span class="tag">はじめに</span><h2>二人で、灯りを届ける</h2><p>森・水路・丘・帰り灯祭りと三つの結末を遊べる試作版です。町の人と話し、二人の得意なことを使って道を開きましょう。本編二時間分はまだ入っていません。</p><p>操作：矢印 / WASDで移動、E・Enterで調べる、Qで先頭交代。地面や人物をクリックしても移動できます。</p>',[['閉じる',closeModal,true]],'title');return;}
 const steps=[['board','出発札を掛ける'],['mochi','こごえモチを落ち着かせる'],['log','トウマで倒木を動かす'],['repair','ニナで灯りの橋を修理する'],['crab','氷殻を火花で溶かす'],['guardian','枝角の番人と向き合う'],['lit','二人で灯台をともす'],['returned','出発札を戻して、ただいま'],['canalStarted','共同水路の依頼を受ける'],['waterGate','トウマで水門を支える'],['canalCrab','水路のヤドカリを落ち着かせる'],['waterFlow','ニナで調整灯をつなぐ'],['waterLit','水路の帰り灯をともす'],['waterReturned','マロに水の便りを届ける'],['hillStarted','風待ちの丘へ出発'],['windbreak','トウマで風よけを直す'],['hillGuardian','尾根の番人を落ち着かせる'],['hillLens','ニナでレンズを合わせる'],['hillLit','丘の灯台をともす'],['festivalStarted','帰り灯祭りへ'],['festivalMeal','二人でスープを食べる'],['festivalRibbon','帰り結びを贈り合う']];
 const html='<span class="tag">旅の手帳</span><h2>二人の灯守日誌</h2><p>'+S.objective(state)+'</p>'+steps.map(([k,v])=>'<div class="journal-step"><span>'+(state.flags[k]?'✓':'○')+'</span>'+v+'</div>').join('')+'<h3>町の人との寄り道</h3>'+OkaeriSideStories.notes(state).map(n=>'<div class="journal-step"><span>'+(n.done?'✓':'◇')+'</span><div><strong>'+n.title+'</strong><br>'+n.text+'</div></div>').join('')+'<h3>道中の思い出</h3><p>'+(state.flags.bread?'焼き菓子をもらった。':'パン屋には、いい匂いがしている。')+'<br>'+(state.flags.rest?'小屋で、二人のお昼を食べた。':'森の小屋で、ひと休みできそう。')+'</p><p>'+(state.flags.canalRest?'水番の休憩所で、次の人の薪を残した。':'共同水路にも、小さな休憩所がある。')+'</p><h3>二人の得意なこと</h3><p>トウマ：倒木を動かす / 崩し斬り・かばう<br>ニナ：灯りの修理 / 火花・回復<br>戦闘では毎回HP・SPが満タンで始まる試作仕様です。</p>';
 const btns=[['冒険に戻る',closeModal,true]];if(state.flags.lit&&state.scene==='forest')btns.push(['町へ帰る',()=>{closeModal();scene('town',12,3);}]);openModal(html,btns,'explore');}
function menu(){if(mode==='title'){journal();return;}if(mode==='dialogue'||mode==='battle'){toast('会話や戦闘が終わってから開けます');return;}if(mode==='modal')return;
 openModal('<span class="tag">ひと休み</span><h2>旅のメニュー</h2><p>進行はこの端末に自動保存されます。ブラウザーや開き方を変えると、保存は引き継がれません。</p>',[['戻る',closeModal,true],['タイトルへ',()=>{closeModal();save();mode='title';setMusic('opening');$('titleScreen').hidden=false;$('hud').hidden=true;$('continueButton').hidden=!saved;}]],mode);
}
function evening(key){
 state.pendingEvening=key;scene('house',11,11);
 talk(S.nightScenes[key],()=>{delete state.pendingEvening;state.flags['night'+key[0].toUpperCase()+key.slice(1)]=true;save();
 const end=S.endings[key];openModal('<span class="tag">'+(end?'おかえりの灯 · END':'一日の終わり')+'</span><h2>'+(end?end.title:key==='three'?'祭りの支度ができた':'おやすみ。また明日')+'</h2><p>'+(end?'同じ家から、二人の明日が続いていきます。遊んでくれて、ありがとうございます。':key==='three'?'家で着替えた二人は、これから帰り灯祭りへ。':'炉のそばに二人分のカップ。今日のことを、家に置いて眠ろう。')+'</p>',[['家で過ごす',closeModal,true],[key==='three'?'二人で祭りへ':end?'町へ出る':'翌朝、町へ',()=>{closeModal();scene('town',3,13);}]],'explore');});
}
function handleHouse(id){
 if(id==='ourHome'){scene('house',12,12);return true;}
 if(state.scene!=='house')return false;
 if(id==='houseExit'){scene('town',3,13);return true;}
 if(id==='homeTable'){
 const options=[['one','returned','第一話 · 二つのカップ'],['two','waterReturned','第二話 · 味見の距離'],['three','festivalStarted','第三話 · いつもと違う支度'],['touma','endingTouma','最終話 · 恋人になった家'],['nina','endingNina','最終話 · 返事の続き'],['friends','endingFriends','最終話 · 明日の席']].filter(([,flag])=>state.flags[flag]);
 openModal('<h2>二人の食卓</h2><p>今日のことを、少し話そう。終えた章の夜を読み返せます。</p>',[...options.map(([key,,label])=>[label,()=>{closeModal();evening(key);}]),['今はお茶にする',()=>{closeModal();talk([['nina','お湯、沸いてるよ。'],['touma','じゃあ、二人分。']]);},true]],'explore');return true;
 }
 const lines={"toumaDesk":[["","磨いた修理机。小箱には「ニナの外套」と書かれた予備の留め金。工具の柄には、滑り止めの布が巻いてある。"],["nina","この布、まだ使ってくれてるんだ。"],["touma","手に馴染んでるから。"],["nina","……そっか。新しいのも、同じ色にするね。"]],"toumaBooks":[["","雪道の地図、家具の直し方、料理の本。スープのページだけ、何度も開いた跡がある。"],["nina","これ、私の好きなやつ。"],["touma","次は、焦がさない。"],["nina","この前のも、おいしかったよ。最後のところ以外。"]],"ninaMirror":[["","小さな鏡台。手作りの鏡枠に、青いリボンが掛かっている。引き出しの上には、書きかけのお礼のカード。"],["touma","鏡の高さ、これでいい？"],["nina","うん。毎朝、ちゃんと見える。"],["touma","何が？"],["nina","……直してくれた人が、丁寧だったってこと。"]],"ninaWardrobe":[["","畳んだ冬服と、色順に並んだ毛糸。二人分の手袋が、同じ籠に収まっている。"],["touma","俺のも、ここに？"],["nina","片方なくす人がいるので。"],["touma","助かります。"],["nina","出かけるときは、私に声かけてね。手袋、渡すから。"]],homeStove:[['','町から分けてもらった小さな薪ストーブ。脚のがたつきは、トウマが直した。'],['nina','火の番、今日は私ね。'],['touma','寝る前に、一緒に見よう。']],toumaRoom:[['','トウマの部屋。整えた寝床の脇に、修理道具と読みかけの本がある。'],['nina','入るときは、ノックするね。'],['touma','俺も、そうする。']],ninaRoom:[['','ニナの部屋。寝床には繕った毛布。小さな棚に、お気に入りの糸が並んでいる。'],['touma','窓、冷気は入らない？'],['nina','大丈夫。トウマが直してくれたから。']],homeShelf:[['','古い家の鍵と、町の人たちと写った一枚の写真。血のつながりはなくても、二人を育ててくれた顔が並ぶ。'],['nina','この家の掃除、みんな来てくれたね。'],['touma','マロさんは、掃除よりパンを配ってた。'],['nina','それも、大事なお仕事。']],homeSewing:[['','繕い机には、ニナの針箱と、トウマの予備の留め金。互いの道具が少しずつ隣り合っている。'],['nina','ここ、半分使っていいよ。'],['touma','もう半分、借りてる。'],['nina','うん。知ってる。']]};
 if(lines[id]){talk(lines[id]);return true;}return false;
}
function move(dx,dy){if(mode!=='explore')return false;const x=state.x+dx,y=state.y+dy;if(!S.walkable(state,x,y))return false;state.x=x;state.y=y;updateHud();return true;}
function pathTo(tx,ty){
 if(mode!=='explore')return;const o=S.activeObjects(state).find(o=>Math.hypot(o.x-tx,o.y-ty)<1);const goal=(x,y)=>o?Math.hypot(o.x-x,o.y-y)<1.5:x===tx&&y===ty;
 const seen=new Set([state.x+','+state.y]),q=[[state.x,state.y,[]]];let found=null;
 while(q.length){const [x,y,p]=q.shift();if(goal(x,y)){found=p;break;}for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){let nx=x+dx,ny=y+dy,key=nx+','+ny;if(!seen.has(key)&&S.walkable(state,nx,ny)){seen.add(key);q.push([nx,ny,[...p,[dx,dy]]]);}}}
 if(found){route=found;routeTarget=o?.id||null;if(!route.length&&o){routeTarget=null;handle(o.id);}}else toast('まだ通れない道です。近くの仕掛けを調べよう');
}
function tone(freq,duration){if(!sound)return;try{audio ||=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,audio.currentTime);g.gain.exponentialRampToValueAtTime(.055,audio.currentTime+.03);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
function musicFailure(){sound=false;bgm.stop();$('soundButton').textContent='音 OFF';toast('音楽を再生できませんでした。もう一度「音 OFF」を押してください。');}
function travelMusic(){setMusic(['town','house'].includes(state.scene)?'village':'journey');}
function setMusic(scene){bgm.select(scene).catch(musicFailure);$('soundButton').title={opening:'OP「雪明かりの約束」',village:'村「窓辺の帰り灯」',journey:'探索「雪道の二重奏」',battle:'戦闘「灯りのステップ」'}[scene];}
async function toggleSound(){
 const button=$('soundButton');if(button.disabled)return;
 if(sound){sound=false;bgm.stop();audio?.suspend();button.textContent='音 OFF';return;}
 button.disabled=true;
 try{await bgm.play();if(audio)await audio.resume();sound=true;button.textContent='音 ON';}
 catch{musicFailure();}finally{button.disabled=false;}
}
setMusic('opening');
function chapterSelect(){
 const enter=id=>{const s=OkaeriChapters.create(id);start(s,id!==1,chapterSaveKey);if(id===2)handle('canalExit');if(id===3)handle('hillExit');if(id===4)handle('festivalStart');save();};
 const names=['第一話 · 森の灯台','第二話 · 水音の帰る道','第三話 · 風待ちの丘','最終話 · 帰り灯祭り'];
 const buttons=names.map((n,i)=>[n,()=>enter(i+1),i===2]);let replay=null;try{replay=C.restoreSave(localStorage.getItem(chapterSaveKey));}catch{}
 if(replay)buttons.push(['章選択の旅の続き',()=>start(replay,true,chapterSaveKey)]);
 buttons.push(['戻る',closeModal]);
 openModal('<span class="tag">CHAPTER SELECT</span><h2>好きな章から始める</h2><p>通常の「つづきから」のセーブは残ります。章選択の旅は別枠に保存します。</p><p>各章は必要な前章の出来事を完了した状態で始まります。章を選び直すと、前の章選択の旅は置き換わります。後の章には物語のネタバレがあります。</p>',buttons,'title');
}
$('chapterButton').onclick=chapterSelect;
$('startButton').onclick=()=>{if(saved)openModal('<h2>新しい一日を始める</h2><p>保存済みの旅を、新しい旅で上書きします。</p>',[['新しく始める',()=>start(fresh(),false),true],['戻る',closeModal]],'title');else start(fresh(),false);};
$('continueButton').onclick=()=>{let s;try{s=C.restoreSave(localStorage.getItem(normalSaveKey));}catch{}if(s)start(s,true);else toast('保存データを読めません。はじめから遊べます');};
$('nextDialogue').onclick=nextDialogue;$('leadButton').onclick=switchLead;$('interactButton').onclick=interact;$('journalButton').onclick=journal;$('menuButton').onclick=menu;$('soundButton').onclick=toggleSound;

const dirs={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]};
document.addEventListener('keydown',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;
 if(mode==='battle'){if(!e.repeat||key.startsWith('Arrow'))classicBattle.key(e);return;}
 if(dirs[key]&&mode==='explore'){e.preventDefault();held[key]=true;route=[];return;}
 if(e.repeat)return;
 if((key==='Enter'||key===' '||key==='e')&&mode==='dialogue'){e.preventDefault();if(!queue[queueIndex][2])nextDialogue();return;}
 if(e.target.tagName==='BUTTON'&&key==='Enter')return;
 if(key==='e'||key==='Enter'){if(mode==='explore'){e.preventDefault();interact();}}
 if(key==='q')switchLead();if(key==='j')journal();if(key==='Escape'){if(mode==='modal'){if(modalReturn==='battle')toast('下のボタンから戦闘を進めてください');else closeModal();}else menu();}
});
document.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;delete held[k];if(mode==='explore')save();});window.addEventListener('blur',()=>{held={};route=[];});
for(const btn of document.querySelectorAll('[data-move]')){const key={left:'a',right:'d',up:'w',down:'s'}[btn.dataset.move];btn.addEventListener('pointerdown',e=>{e.preventDefault();held[key]=true;route=[];btn.setPointerCapture(e.pointerId);});for(const event of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(event,()=>{delete held[key];if(mode==='explore')save();});}
canvas.addEventListener('pointerdown',e=>{if(mode!=='explore')return;const r=canvas.getBoundingClientRect();const tx=Math.floor((e.clientX-r.left)/r.width*24),ty=Math.floor((e.clientY-r.top)/r.height*16);pathTo(tx,ty);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){held={};route=[];if(mode!=='title')save();}});
function frame(t){if(mode==='explore'&&t-lastMove>155){const key=Object.keys(held).find(k=>dirs[k]);if(key){move(...dirs[key]);lastMove=t;}else if(route.length){const [dx,dy]=route.shift();move(dx,dy);lastMove=t;if(!route.length){save();if(routeTarget){const id=routeTarget;routeTarget=null;handle(id);}}}}renderer.draw(state,t,mode);requestAnimationFrame(frame);}
updateHud();Promise.all([OkaeriSprites.load(),OkaeriCast.ready,OkaeriResidentsArt.ready]).then(()=>requestAnimationFrame(frame)).catch(()=>toast("キャラクター画像を読み込めませんでした。ページを再読み込みしてください。"));
})();
