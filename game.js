(function(){
'use strict';
const C=OkaeriCore,S=OkaeriStory,W=OkaeriWorld,D=OkaeriDirector,Sfx=globalThis.OkaeriSfx,$=id=>document.getElementById(id);
const normalSaveKey='okaeri-forest-v1',chapterSaveKey='okaeri-chapter-v1';let saveKey=normalSaveKey;const canvas=$('world'),renderer=new W.Renderer(canvas);
const fresh=()=>globalThis.OkaeriEpisodes?OkaeriEpisodes.create(1):({version:1,scene:'town',x:12,y:10,lead:'touma',flags:{},courage:0});
let state=fresh(),mode='title',queue=[],afterTalk=null,queueIndex=0,battle=null,commands={},order=['touma','nina'],battleOrigin=null,modalReturn='explore',route=[],routeTarget=null,lastMove=0,held={},sound=false,audio=null,bgm=new OkaeriMusic();
let openingFilm=null,typing=null,talkSerial=0;
const name=id=>id==='touma'?'トウマ':id==='nina'?'ニナ':id;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let saved=null;try{saved=C.restoreSave(localStorage.getItem(saveKey));}catch{}$('continueButton').hidden=!saved;
function save(){try{globalThis.OkaeriJourney?.capture(state);localStorage.setItem(saveKey,JSON.stringify(state));if(saveKey===normalSaveKey)saved=C.restoreSave(JSON.stringify(state));$('saveStatus').textContent=saveKey===normalSaveKey?'この端末に保存しました':'章選択の旅を保存しました（通常の旅は保持）';}catch{$('saveStatus').textContent='保存できません。終了すると進行が失われます';}}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,2600);}
function updateHud(){
 $('locationName').textContent=state.scene==='house'?'二人の家':state.scene==='town'?'雪の町 ユキネ':state.scene==='canal'?'雪解けの共同水路':state.scene==='hill'?'風待ちの丘':'粉ひきの森';$('weather').textContent=state.scene==='house'?'薪の灯り / 家の中':state.flags.festivalStarted?'帰り灯祭り / 夜':state.flags.hillStarted?'祭りの日 / 夕暮れ':state.flags.lit?'冬の終わり / 夕暮れ':'冬の終わり / 午前';
 $('chapter').textContent=state.flags.festivalStarted?'最終話 · 帰り灯祭り':state.flags.hillStarted?'第三話 · 風待ちの丘':state.flags.canalStarted?'第二話 · 水音の帰る道':'第一話 · 帰り灯の日';
 if(state.episode){const a=D.ambient(state),clock={morning:'朝',day:'日中',dusk:'夕暮れ',night:'夜'}[a.time];$('chapter').textContent=OkaeriEpisodes.title(state);$('weather').textContent=a.indoors?'薪の灯り / '+clock:state.episode.chapter===9?'帰り灯祭り / 夜':(a.weather==='blizzard'?'吹雪':state.episode.chapter===10?'祭りの翌日':'冬の終わり')+' / '+clock;}
 $('objectiveText').textContent=(state.episode&&OkaeriEpisodes.objective(state))||S.objective(state);$('leadText').textContent=name(state.lead)+'が先頭';$('leadDot').style.background=state.lead==='touma'?'#77b8b6':'#cb8267';
 if(globalThis.OkaeriJourney?.names[state.scene]){$('locationName').textContent=OkaeriJourney.names[state.scene];$('weather').textContent=state.scene==='lampworkshop'?'小屋の火 / 湖を望む窓':'氷湖の迎え灯 / 湖岸の風';}
 if(globalThis.OkaeriJourney?.active(state)){$('objectiveText').textContent=OkaeriJourney.objective(state);if(OkaeriJourney.split(state))$('leadText').textContent=name(state.lead)+'を操作中';}
 if(state.openingStage!==undefined)$('objectiveText').textContent=S.opening[state.openingStage].objective;
 const o=nearest();$('interactPrompt').hidden=!o||mode!=='explore';if(o)$('interactPrompt').textContent='E　'+o.label;
 refreshStage();
}
// 時間帯・天気・環境音・場面の曲を、いまの進行から決め直す。
function refreshStage(){const a=D.ambient(state);D.setBase(a);Sfx?.ambient(mode==='title'?null:mode==='battle'?null:a.bed);if(mode==='explore'&&state.openingStage===undefined)travelMusic();}
function openModal(html,buttons,returnMode=mode){Sfx?.play('page');modalReturn=returnMode;mode='modal';held={};route=[];$('modalContent').innerHTML=html+'<div class="actions" id="modalActions"></div>';
 for(const [label,fn,primary] of buttons){const b=document.createElement('button');b.textContent=label;if(primary)b.className='primary';b.onclick=()=>{Sfx?.play('confirm');fn();};$('modalActions').append(b);}$('modal').hidden=false;
}
function closeModal(){ $('modal').hidden=true;mode=modalReturn;canvas.focus();updateHud(); }
function talk(lines,done){held={};route=[];queue=lines.map(D.normalize);queueIndex=0;afterTalk=done;talkSerial++;mode='dialogue';$('dialogue').hidden=false;showLine();updateHud();}
const koharuFaces={happy:1,joy:1,shy:2,fluster:2,love:2,angry:3,sad:4},Stills=globalThis.OkaeriStills;
const faceIds={'コハル':'koharu',touma:'touma',nina:'nina','サエ':'sae','マロ':'maro','エルナ':'elna','オルフ':'orlf','リツ':'ritsu','ユラ':'yura'};
function showLine(){
 const q=queue[queueIndex],speaker=q.speaker,moodName=q.mood||S.faceCues[q.text]||'neutral',faceId=faceIds[speaker],cue=q.cue||{};
 // コハルは「ふくれ顔」「泣きそう」の絵を持つので、その二つは記号を重ねない。
 let m=D.mood(moodName);if(faceId==='koharu'&&['angry','sad'].includes(moodName))m={face:m.face};
 $('dialogue').className='dialogue'+(speaker?'':' narration')+(m.tone?' tone-'+m.tone:'');
 $('speaker').textContent=speaker?name(speaker):'';$('dialogueText').textContent=q.text;
 $('portrait').className='portrait '+(faceId?faceId+' '+m.face:'other');$('portrait').style.setProperty?.('--k',faceId==='koharu'?(koharuFaces[moodName]||0):0);$('portrait').setAttribute('aria-label',speaker?name(speaker)+'の表情：'+({neutral:'通常',happy:'笑顔',shy:'照れ'}[m.face]):'語り');$('portrait').textContent=faceId?'':speaker?speaker.slice(0,2):'';
 $('portraitMark').innerHTML=speaker&&m.mark?D.markSvg(m.mark):'';$('portraitMark').hidden=!(speaker&&m.mark);
 $('choices').replaceChildren();$('nextDialogue').hidden=!!q.choices;
 if(q.choices)for(const [label,action] of q.choices){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{finishTyping();Sfx?.play('confirm');if(action)action();nextDialogue();};$('choices').append(b);}
 // きっかけ: 画面は Director、音はここで鳴らす。
 D.apply(cue,speaker);if(m.mark&&speaker&&!cue.emote)D.emote(speaker,m.mark);
 if(cue.bgm!==undefined)musicCue(cue.bgm);
 if(cue.still!==undefined)Stills?.show(cue.still);
 if(cue.intro!==undefined)Stills?.intro(cue.intro);
 if(cue.jingle)bgm.jingle?.(cue.jingle);
 for(const se of [].concat(cue.se||[]))Sfx?.play(se);
 if(m.mark&&speaker)Sfx?.play('pop');
 typing={text:q.text,shown:0,acc:-(cue.wait||0),started:false,done:false,slow:cue.slow||1,voice:!speaker?null:speaker==='touma'?'blipTouma':speaker==='nina'?'blipNina':'blipOther'};
}
// 文字送り。描画ループから呼ばれる（描画が回らない環境では、最初から全文が出ている）。
function typeTick(t){
 const ty=typing;if(!ty||ty.done||mode!=='dialogue')return;
 if(!ty.started){ty.started=true;ty.last=t;if(D.reduced()||!ty.text){finishTyping();return;}ty.a=document.createElement('span');ty.b=document.createElement('span');ty.b.className='untyped';ty.b.textContent=ty.text;$('dialogueText').replaceChildren(ty.a,ty.b);$('dialogue').classList.add('typing');}
 ty.acc+=Math.min(120,t-ty.last);ty.last=t;let changed=false;
 while(ty.shown<ty.text.length){const cost=ty.shown?D.charCost(ty.text[ty.shown-1],ty.slow):0;if(ty.acc<cost)break;ty.acc-=cost;ty.shown++;changed=true;if(ty.voice&&ty.shown%3===1&&!' 　…、。！？\n'.includes(ty.text[ty.shown-1]))Sfx?.play(ty.voice);}
 if(changed){ty.a.textContent=ty.text.slice(0,ty.shown);ty.b.textContent=ty.text.slice(ty.shown);}
 if(ty.shown>=ty.text.length)finishTyping();
}
function finishTyping(){if(!typing||typing.done)return;typing.done=true;if(typing.started){$('dialogueText').textContent=typing.text;$('dialogue').classList.remove('typing');}}
function nextDialogue(){if(mode!=='dialogue')return;
 if(typing&&typing.started&&!typing.done){finishTyping();return;}
 queueIndex++;if(queueIndex<queue.length){showLine();return;}
 $('dialogue').hidden=true;mode='explore';typing=null;const serial=talkSerial;let done=afterTalk;afterTalk=null;if(done)done();
 // 続けて次の会話が始まっていなければ、会話中だけの演出（時間帯・曲の指定）を解く。
 if(serial===talkSerial){D.clearOverrides();Stills?.hide();Stills?.intro(null);updateHud();musicCue(null);}
}
function playOpening(step=0){
 const part=S.opening[step];state.openingStage=step;scene(part.scene,part.x,part.y);setMusic('opening');
 talk(part.lines,()=>{if(step+1<S.opening.length)playOpening(step+1);else{delete state.openingStage;save();travelMusic();updateHud();toast('まずは広場の出発札へ。マロの店ではお弁当も受け取れます。');}});
}
function playPrelude(){
 state.openingPrelude=true;state.openingStage=0;scene('house',12,7);mode='opening';held={};route=[];setMusic('opening');
 $('hud').hidden=true;$('controls').hidden=true;$('journalButton').disabled=true;$('menuButton').disabled=true;
 openingFilm=new OkaeriOpeningFilm();openingFilm.play(()=>{
  delete state.openingPrelude;$('controls').hidden=false;$('journalButton').disabled=false;$('menuButton').disabled=false;$('hud').hidden=false;
  playOpening(0);canvas.focus();
 });
}
function start(s,fromSave,key=normalSaveKey){saveKey=key;state=s;mode='explore';$('titleScreen').hidden=true;$('hud').hidden=false;$('modal').hidden=true;$('battleScreen').hidden=true;$('dialogue').hidden=true;$('openingFilm').hidden=true;renderer.reset(state);updateHud();canvas.focus();if(state.openingPrelude)playPrelude();else if(state.openingStage!==undefined)playOpening(state.openingStage);else if(!fromSave){if(globalThis.OkaeriOpeningFilm)playPrelude();else if(S.opening)playOpening();else{setMusic('opening');talk(S.intro,()=>{save();setMusic('village');});}}else{travelMusic();if(state.pendingEvening)evening(state.pendingEvening);else toast('二人の旅を再開しました');}}
function nearest(){return S.activeObjects(state).map(o=>({o,d:Math.hypot(o.x-state.x,o.y-state.y)})).filter(p=>p.d<1.65).sort((a,b)=>a.d-b.d)[0]?.o;}
function switchLead(){if(mode!=='explore')return;if(globalThis.OkaeriJourney?.switchActor(episodeApi()))return;if(state.episode&&OkaeriEpisodes.current(state)?.solo){toast('今は'+(state.lead==='nina'?'避難棚にいるニナ':'岸にいるトウマ')+'を操作しています。画面の目的を進めよう。');return;}state.lead=state.lead==='touma'?'nina':'touma';updateHud();save();Sfx?.play('swap');}
function scene(next,x,y){const door=(next==='house')!==(state.scene==='house')||(next==='lampworkshop')!==(state.scene==='lampworkshop');if(next!==state.scene){D.fade('black');if(door)Sfx?.play('door');}state.scene=next;travelMusic();state.x=x;state.y=y;renderer.reset(state);route=[];save();updateHud();}
function interact(){if(mode==='dialogue'){if(!queue[queueIndex].choices)nextDialogue();return;}if(mode!=='explore')return;const o=nearest();if(!o){toast('気になるものに近づいて、調べてみよう');return;}handle(o.id);}
function episodeApi(){return {state,talk,save,updateHud,toast,scene,openModal,closeModal,startBattle,jingle:n=>bgm.jingle?.(n),sfx:n=>Sfx?.play(n)};}
function handle(id){const f=state.flags;if(state.episode&&OkaeriEpisodes.handle(id,episodeApi()))return;if(handleHouse(id))return;if(OkaeriSideStories.handle(id,{state,talk,save,updateHud,toast,openModal,closeModal}))return;if(['elna','orlf'].includes(id)){talk(S.residentLines(state,id));return;}if(OkaeriHill.handle(id,{state,talk,save,toast,scene,openModal,closeModal,updateHud,startBattle,evening}))return;if(OkaeriCanal.handle(id,{state,talk,save,toast,scene,openModal,closeModal,updateHud,startBattle,evening}))return;
 if(id==='board'){
  if(f.returned){talk([['','二枚の出発札は、並んで「町」の欄に戻っている。'],['nina',f.waterReturned?'今日も、二枚とも戻せたね。':'明日は東の水路だって。帰ったらまた、ここに戻しに来ようね。']]);return;}
  if(f.lit){f.returned=true;save();talk([
   ['','トウマとニナは、二枚の出発札を「森」の欄から外した。'],
   ['サエ','おかえり。灯台の火、ここからも見えたよ。','happy'],
   ['touma','ただいま戻りました。倒木を一本どかして、橋の灯りの線をつなぎ直して、灯台に火を入れました。'],
   ['サエ','精霊は。'],
   ['nina','こごえモチと、氷の殻のヤドカリ。それから灯台の前に、枝角の番人が。みんな、温めたら帰っていきました。'],
   ['サエ','手は。冷やしすぎてないかい。'],
   ['nina','橋の上で一回、指が動かなくなって。トウマに待ってもらって、温めてから締め直しました。'],
   ['サエ','うん。待てたなら上出来だ。'],
   ['','サエは二枚の札を「町」の欄へ掛け、傾いていた方を指先でまっすぐに直した。\nそれから、しばらく森の方角を見ていた。'],
   ['サエ','……いい火だ。',{wait:600}],
   ['マロ','おかえりー！　荷車、さっき着いたよ。粉は無事、明日のパンも無事！　ほら、焼きたて。まずは食べてって！','happy',{se:'cheer'}],
   ['nina','……いい匂い。朝からこれを楽しみに歩いてたんだ。','happy'],
   ['touma','お前、灯台の前でも腹が減ったって言ってたな。'],
   ['nina','言ったよ。帰り道の分は別腹だもん。','joy'],
   ['','濡れた外套を店先に掛け、二人並んでパンをかじる。\n冷えていた指先が、ゆっくり温まっていった。']
  ],()=>evening('one'));return;}
  if(f.board){talk([['nina','札、ちゃんと二枚掛かってるね。夕方には戻しに来よう。'],['touma','ああ。北の道から森だ。']]);return;}
  talk([
   ['','掲示板の下半分は「出発札」の板になっている。\n行き先ごとに欄があり、出かける者は自分の名札をそこへ掛けていく。'],
   ['','「トウマ」「ニナ」。二枚の木札を、「森」の欄に並べて掛けた。',{se:'knock'}],
   ['nina','去年までは、サエさんの札の隣だったね。'],
   ['touma','今年は二枚だけだ。'],
   ['','ニナの札は、下の角が少し欠けている。'],
   ['nina','これ、子どもの頃に自分で掛けたくて、背伸びして落とした跡。'],
   ['touma','椅子を持ってくるから待てって言ったのに、板によじ登るからだ。'],
   ['nina','トウマだって「下で受け止める」って言ったよ。'],
   ['touma','……札じゃなくて、お前をな。'],
   ['nina','……。','shy'],
   ['nina','行こっか。夕方には、この札を戻しに来ようね。'],
   ['touma','ああ。二枚とも。']
  ],()=>{f.board=true;save();updateHud();toast('行き先を記録した。北の道から森へ。');});return;
 }
 if(id==='sae'){talk([
  ['サエ','灯守の仕事は、火をつけて終わりじゃない。自分が帰ってくるまでが仕事だよ。'],
  ['サエ','倒木や足場はトウマ、灯りの仕掛けはニナ。得意な方が先頭に立つこと。'],
  ['nina','風が強くなったら、森の休憩小屋で待ちます。'],
  ['サエ','それでいい。急ぐのと無茶をするのは別だからね。休んだことも、引き返したことも、帰ったら全部報告するんだよ。'],
  ['touma','はい。札を戻す時に。'],
  ['サエ','うん。……二人の話を聞くのを、楽しみにしてる。']
 ],()=>{f.sae=true;save();});return;}
 if(id==='bakery'){if(f.bread){talk([['マロ','夕方の焼き上がりを、一つ遅らせとくからね。二人とも、ちゃんと帰っておいで！','happy']]);return;}
 talk([
  ['マロ','はい、お弁当のおまけ！　森の灯台まで行くんでしょ。小屋で食べな。','happy'],
  ['','紙包みの中には、干しりんごの焼き菓子が二つ入っていた。',{se:'item'}],
  ['touma','干しりんごのやつだ。ニナ、毎年これを買ってるよな。今年はまだ食べてないだろ。'],
  ['nina','……覚えてたんだ。去年は、最後の一個をトウマにあげたんだよね。','shy'],
  ['touma','半分にしようって言う前に、手に置かれた。あげるのを迷ってた顔もしてた。'],
  ['nina','見てたの！？　迷ってない。……ちょっとしか。','fluster'],
  ['マロ','今年は二つあるから、けんかしないでね。包み紙は、小屋の火起こしに使うといいよ。油が染みてて、よく燃えるから。'],
  ['nina','マロさんの包み紙、昔は宝物をくるむのに使ってたなあ。'],
  ['マロ','知ってる。石ころを入れたまま返してきたこともあったね。'],
  ['touma','……まだ覚えてるんですか、それ。','sweat'],
  ['マロ','覚えてるよ。あんたたちのことは、だいたい全部。','happy']
 ],()=>{f.bread=true;state.courage=Math.min(3,state.courage+1);save();toast('お弁当に、焼き菓子が増えた');});return;}
 if(id==='lamp'){talk([
  ['','家の戸口に、小さな帰り灯がともっている。昼間なのに、消えていない。'],
  ['nina','ここのおじさん、丘向こうの集落へ配達に出てるんだって。'],
  ['touma','帰り灯は、最後に帰った人が消す決まりだからな。ともってるうちは、まだ誰か外にいる。'],
  ['nina','うん。「待ってるよ」って、灯りが代わりに言ってくれてるの。'],
  ['','二人の家の戸口にも、同じ形の灯りが一つある。\n今朝、ニナがともしてきた。']
 ],()=>{f.lamp=true;save();});return;}
 if(id==='gift'){talk([
  ['','灯守の共同所の前に、繕いものの籠が出してある。\n町の誰でも、破れた手袋や靴下を入れていい。手の空いた人が直して戻す決まりだ。'],
  ['nina','トウマの右の手袋、次はこっちの太い糸にしようかな。今のは柔らかいけど、道具を握る所がまた擦れそう。'],
  ['touma','……まだ今朝直したばかりだろ。これだけ繕ってもらうと、新しいのを買った方が早い気もする。'],
  ['nina','買ってもいいよ。でも、私が直したからって、我慢して使ってるんじゃないよね？'],
  ['touma','違う。手に合ってるから使ってる。'],
  ['nina','ならよし。破れたら、黙って使わないですぐ出すこと。'],
  ['touma','お前の鞄の口金もな。また引っかかったら、すぐ言え。']
 ],()=>{f.gift=true;save();});return;}
 if(id==='exit'){if(!f.board){talk([['nina','待って、先に出発札。掛けずに出たら、サエさんは私たちがまだ町にいると思っちゃう。']]);return;}scene('forest',5,13);if(!f.mochi)talk([
  ['','町の北、粉ひきの森。\n灯台は、この道を登りきった先にある。'],
  ['nina','町の中より、ずっと雪が深い……。昨日の足跡、ひとつも残ってないね。'],
  ['touma','俺が先に踏む。お前は道標を見ててくれ。向きがずれたら止めろ。'],
  ['nina','了解。……あれ。トウマ、あの道標の下。何か、跳ねてない？','question']
 ]);return;}
 if(id==='home'){scene('town',12,3);if(f.lit)talk([['','町の窓には、朝よりたくさんの灯りがともっていた。'],['nina','「ただいま」って言う前から、もう帰ってきた気がするね。'],['touma','まだだ。札を戻すまでが仕事だろ。'],['nina','はいはい。掲示板ね。','happy']]);return;}
 if(id==='mochi'){talk([
  ['nina','こごえモチだ！　……二匹いる。灯台が消えたから、寒くて私のランタンに寄ってきたんだね。'],
  ['touma','このままじゃ道を通れない。サエさんの言った通り、温めて落ち着かせよう。傷つけるなよ。'],
  ['nina','トウマこそ。力、入れすぎないでね。'],
  ['','「たたかう」を選び、トウマ、ニナの順に行動を決めます。\n矢印キーで選び、Enterで決定。Escでひとつ前へ。\nトウマの「とくぎ」とニナの「じゅもん」で、二人の連携も使えます。']
 ],()=>startBattle('mochi'));return;}
 if(id==='log'){if(state.lead!=='touma'){talk([['nina','倒木が道をふさいでる。……重くて、私じゃびくともしない。トウマ、お願い。','sweat'],['','Q または左下の交代ボタンで、トウマを先頭にしよう。']]);return;}
 talk([
  ['','ゆうべの雪の重みで折れた木が、道を横切って倒れている。荷車は、これでは通れない。'],
  ['touma','幹は俺が持ち上げる。ニナは下に噛んでる小枝を払ってくれ。手を入れる前に、必ず声をかけろよ。'],
  ['nina','分かった。……入れるよ！　……はい、こっちの枝は取れた。'],
  ['touma','よし。せーの――',{se:'thud',shake:1}],
  ['','二人で息を合わせて、倒木を道の端へ転がした。'],
  ['nina','……昔さ、これくらいの枝を二人で引きずって帰ったよね。薪にしたら、サエさんが喜ぶと思って。'],
  ['touma','重くて途中で置いて、結局サエさんを呼びに戻った。'],
  ['nina','今日は持って帰らないよ。帰りの分の力は、残しておくこと。','happy'],
  ['touma','……それ、今朝サエさんが言ってたやつだろ。']
 ],()=>{f.log=true;save();toast('森の奥へ進めるようになった');});return;}
 if(id==='rest'){if(f.rest){talk([['','炉には、まだ穏やかな火が残っている。二人は飲み物を温めて、ひと息ついた。',{se:'fire'}],['nina','あったかい……。もうちょっとだけ、ね。']]);return;}
 const lines=[
  ['','森の休憩小屋。雪を払って扉を閉めると、風の音が急に遠くなった。\n炉に火を入れ、濡れた手袋を二組、並べて掛ける。',{se:['door','fire']}],
  ['nina','お昼にしよ。包みパン、鞄の中でちょっとつぶれたけど……味は変わらないはず。'],
  ['touma','きのこの匂いがする。'],
  ['nina','きのことチーズ。好きでしょ。端っこに具が寄ってるから、そっちから食べて。','happy'],
  ['touma','……うまい。','happy'],
  ['nina','ほんと？　よかった。朝、閉じ目がなかなかくっつかなくて、三個だめにしたの。'],
  ['touma','知ってる。だめにした三個が、俺の朝飯だったから。'],
  ['nina','あれ食べたの！？','fluster'],
  ['touma','うまかった。'],
  ['','窓際の棚に、大小ふぞろいのカップが並んでいる。\n一つだけ、青い取っ手を継いだ跡があった。'],
  ['nina','あのカップ、まだある。昔、吹雪でサエさんと三人、ここに泊まった時のだ。'],
  ['touma','お前、「家に帰れない」って泣いてたな。'],
  ['nina','泣いてない。……ちょっとしか。'],
  ['nina','トウマはあの晩、ずっと扉の前に座ってたよね。寝ないで。'],
  ['touma','雪がやんだら、いちばんに教えてやろうと思って。'],
  ['nina','……。','shy',{wait:400}],
  ['','炉の薪がはぜた。ニナはカップを両手で包んだまま、しばらく黙っていた。',{se:'fire'}],
  ['nina','ねえ。今日、サエさんが後ろにいないの、ちょっと変な感じしない？'],
  ['touma','する。札を掛けた時、三枚目がなくて手が止まった。'],
  ['nina','なんだ、トウマも？　落ち着いてるから、私だけかと思ってた。','happy'],
  ['touma','落ち着いてるように見えるだけだ。鞄を三回も開けるやつが、落ち着いてるわけないだろ。'],
  ['nina','ふふ。それもそうだね。','joy'],
  ['','トウマは、カップを両手で包んで笑うニナを見た。',[['「こういう時間、好きだな」',()=>{state.courage=Math.min(3,state.courage+1);}],['「次は俺が作るよ」',()=>{state.courage=Math.min(3,state.courage+1);}],['「もう一個、食べてもいい？」',()=>{}]]],
  ['nina','……うん。また来よ、ここ。今度は仕事のない日に、お弁当だけ持って。','shy'],
  ['touma','その時は俺が作る。包み方、帰ったら教えてくれ。','happy'],
  ['','出がけに、トウマは次に来る人のために薪を炉の横へ寄せた。\nニナは洗ったカップを、取っ手が手前に来るように棚へ戻す。']
 ];
 if(f.bread)lines.push(['','食後に、マロの焼き菓子を一つずつ食べた。\nニナは包み紙に残ったかけらまで、指でていねいに拾った。']);
 talk(lines,()=>{f.rest=true;save();toast('小屋の思い出を、手帳に残した');});return;}
 if(id==='repair'){if(f.repair){talk([['nina','うん、しっかりつながってる。帰りもこの橋を渡るんだから、ちゃんと照らしててね。']]);return;}if(state.lead!=='nina'){talk([['touma','橋の灯りが消えてる。柱の中の線が切れてるな。……火の仕掛けは、ニナの出番だ。'],['','Q または交代ボタンで、ニナを先頭にしよう。']]);return;}
 talk([
  ['','谷にかかる「灯りの橋」。欄干の灯りが熱を伝えて、橋板の氷を溶かす仕掛けだ。\nその灯りが消えて、橋板は一面、薄氷に覆われていた。'],
  ['nina','火を足すだけじゃ、すぐまた消えちゃう。柱の中を通ってる芯の線が切れてるの。先に、そこをつなぎ直したい。'],
  ['touma','柱が傾かないように、俺が抱えておく。そこから留め具に手は届くか？'],
  ['nina','届く。……ほら見て、鞄。手袋のまま開いた！','happy'],
  ['touma','見せなくていい。早く出せ。'],
  ['','トウマが灯柱を抱え、ニナが芯をつなぐ。\n橙色の火が線を走り、橋の薄氷がするするとほどけていく。',{se:'flare'}],
  ['nina','……あと一つなんだけど。風で指がかじかんで、留め具がつかめない。','sweat'],
  ['nina','トウマ、ごめん。少し待ってて。急いで締めたら、芯を挟んじゃう。'],
  ['touma','待つ。柱は持ってるから、手を温めろ。締める時に声をかけてくれればいい。'],
  ['','ニナは手を引いて、指に息を吹きかけた。握って、開いて、もう一度。\nそれから、最後の留め具を締め直した。'],
  ['nina','できた！　火も、もう揺れてない。','happy',{se:'chime'}],
  ['nina','私が先に渡って、向こうの柱も見てくるね。'],
  ['touma','ああ。渡り終わるまで、こっちから足元を見てる。'],
  ['nina','……見ててくれるなら、落ち着いて歩けそう。渡ったら、今度は私が待ってるからね。']
 ],()=>{f.repair=true;save();toast('灯りの橋を修理した');});return;}
 if(id==='crab'){talk([
  ['nina','見て、ヤドカリ。殻の代わりに、誰かのカップを背負ってる……。'],
  ['touma','そのカップごと、氷に包まれてるな。寒くて、気が立ってる。'],
  ['nina','私の火花で氷を溶かすね。溶けるまでは、トウマの手も届かないと思う。'],
  ['','ニナの「じゅもん」から「火花」を選ぼう。\n氷の殻が溶けると、次のターンからトウマの攻撃も届きやすくなります。']
 ],()=>startBattle('crab'));return;}
 if(id==='guardian'){talk([
  ['touma','……でかい。灯台の前から動かないな、あれ。'],
  ['','枝のような角を持つ、森の精霊。灯守は「枝角の番人」と呼んでいる。'],
  ['nina','待って、角の間を見て。鳥の巣。……ゆうべの吹雪で、木から落ちたのを拾ってくれたんだ。'],
  ['touma','巣を守ってるのか。それで気が立ってる。'],
  ['nina','落ち着かせて、巣を木に戻してあげよう。二人でなら、できるよ。'],
  ['','番人の大きな踏み込みは、トウマの「かばう」で守れます。\n息ぴったりの灯りが三つともったら、二人技「灯火の一閃」が使えます。']
 ],()=>startBattle('guardian'));return;}
 if(id==='tower'){if(!f.guardian){toast('先に、番人を落ち着かせよう');return;}if(f.lit){talk([['nina','町からも見えてるかな、この灯り。'],['touma','見えてる。帰ろう。札を戻すまでが仕事だ。']]);return;}
 talk([
  ['','森の灯台。石積みの塔のてっぺんで、大きな芯が雪をかぶっている。'],
  ['touma','芯の軸が傾いてた。……よし、立った。ニナ、火を。'],
  ['nina','うん。ランタン、開けるね。'],
  ['','ニナがランタンの種火を、細い芯に移す。灯術の火は、息をひそめるように小さい。\nそれが灯台の大きな芯に触れて――',{bgm:'silence',wait:300}],
  ['','森の灯台に、あたたかな光が満ちた。',{still:'chapter-01',flash:'warm',se:'lit',jingle:'lit',time:'dusk',lit:true}],
  ['nina','……ともった！','happy'],
  ['touma','ああ。ともったな。','happy'],
  ['','光が雪の稜線をなぞる。分かれ道の道標が、遠くにひとつ浮かび上がった。\nその下を、荷車の小さな影が動いている。',{bgm:'tender'}],
  ['','影は一度止まり、それから、町の方へ曲がった。'],
  ['nina','見えたんだ。あの人たちにも。'],
  ['touma','……ああ。'],
  ['','十二年前の大雪の晩、この灯台は消えていた。\n峠から戻るはずだった荷車の列は、この分かれ道を見つけられなかった。',{wait:500}],
  ['','その列に、トウマの両親と、ニナの両親がいた。'],
  ['nina','小さい頃、窓からこの灯台を探したよね。ともってたら、もうすぐ誰か帰ってくるって。'],
  ['touma','お前が先に靴を履いて飛び出すから、俺は毎回追いかける羽目になった。'],
  ['nina','だって、迎えに行きたかったんだもん。'],
  ['','ニナは灯台の壁に、手袋のまま手のひらを当てた。'],
  ['nina','……今日は、ちゃんとともってるよ。',{wait:500}],
  ['touma','帰ろう。札を戻すまでが仕事だ。'],
  ['nina','うん。……安心したら、おなか空いちゃった。','happy'],
  ['touma',f.rest?'小屋であれだけ食っといて。':'昼を抜いたからだ。小屋に寄ればよかったな。'],
  ['nina','帰り道の分は、別腹なの。','joy']
 ],()=>{f.lit=true;save();updateHud();openModal('<span class="tag">第一の灯り</span><h2>森の灯台が、ともった</h2><p>日が傾いてきた。二人で町へ帰ろう。<br>そのまま森を歩いて戻ることもできます。</p>',[['二人で町へ帰る',()=>{closeModal();scene('town',12,3);talk([['','帰り道の小さな標識灯も、ぽつり、ぽつりと明るくなっていく。'],['nina','私たちの火が、順番に下りていってるんだ。'],['touma','ああ。……掲示板へ行こう。札を戻して、報告だ。']]);},true],['森をもう少し歩く',closeModal]],'explore');});}
}
let classicBattle=null;
function startBattle(kind){setMusic('battle');
 battleOrigin=kind;battle=C.newBattle(kind,D.companion(state)?{support:'koharu'}:{});order=['touma','nina'];commands={};mode='battle';held={};route=[];$('battleScreen').hidden=false;
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
function victory(){travelMusic();if(state.episode&&OkaeriEpisodes.current(state)?.battle){$('battleScreen').hidden=true;mode='explore';OkaeriEpisodes.won(episodeApi());return;}if(state.scene==='hill'){closeModal();$('battleScreen').hidden=true;mode='explore';state.flags.hillGuardian=true;save();updateHud();talk([['','枝角の番人は、ゆっくり雪の上に伏せた。荒れていた灯りが、穏やかに戻っている。'],['nina','待っててね。すぐに、灯台をともすから。'],['touma','今度は俺たちが、帰り道を守る。']]);return;}if(state.scene==='canal'){closeModal();$('battleScreen').hidden=true;mode='explore';state.flags.canalCrab=true;save();updateHud();talk([['','ヤドカリは、温まった水の中へそっと降りていった。'],['nina','帰る場所、見つかったね。'],['touma','俺たちも、水を家まで連れていこう。']]);return;}closeModal();$('battleScreen').hidden=true;mode='explore';state.flags[battle.kind]=true;save();updateHud();
 const lines=battle.kind==='mochi'?[['','こごえモチたちは、ほかほかと湯気を立てて道端へ跳ねていった。さっきより、ひとまわり小さい。'],['nina','あったまったら、縮むんだ……。よかった、怒ってないみたい。','happy'],['touma','道が空いた。この先に休憩小屋がある。昼にしよう。']]:battle.kind==='crab'?[['','氷の溶けたカップから、小さなはさみがのぞく。\nヤドカリは橋の下の沢へ、ことこと歩いていった。'],['nina','あのカップ、誰かの忘れ物かな。'],['touma','今はあいつの家だ。返せとは言えないな。']]:[['','枝角の番人が、ゆっくり頭を下げた。角の間の巣が、二人の目の高さまで下りてくる。'],['','トウマが巣を受け取り、ニナの指さす低い枝の股へそっと戻した。'],['nina','ここなら風も当たらないよ。'],['touma','……一晩じゅう、守ってたんだな。'],['','巣の中で、小鳥が一声鳴いた。番人は灯台の前から退き、森の奥へ歩いていく。',{se:'chime'}],['nina','さあ、私たちの番。灯りをともそう。']];talk(lines);}
function journal(){if(!['explore','title'].includes(mode))return;
 if(mode==='explore'&&globalThis.OkaeriJourney?.active(state)){
  const j=state.journey;const work=[['mirror','トウマ：反射板を直す'],['prism','ニナ：共鳴灯を合わせる'],['shutter','トウマ：風よけを開く'],['reply','ニナ：応答灯をともす']];
  const buttons=[['閉じる',closeModal,true]];if(OkaeriJourney.split(state))buttons.push(['相手の持ち場へ切り替える',()=>{closeModal();switchLead();}]);
  openModal('<span class="tag">第6話の小旅行</span><h2>氷湖の迎え灯</h2><p>ミナモの迎え灯の光が弱くなり、夕方の便が港を見つけにくくなっています。現地の灯守の依頼で、二人が反射板と小屋の仕掛けを確かめに来ました。</p><p>'+escape(OkaeriJourney.objective(state))+'</p><p>ユキネ → 氷湖の旧街道 → ミナモ → 古い灯守小屋 → 二人の家</p>'+work.map(([k,label])=>'<p>'+(j[k]?'✓ ':'○ ')+label+'</p>').join('')+'<h3>旅で知ったこと</h3>'+OkaeriJourney.notes(state).map(n=>'<p>'+escape(n)+'</p>').join('')+'<p>別行動中はQで交代。それぞれの場所と進み具合を保存します。</p>',buttons,'explore');return;
 }
 if(mode==='explore'&&state.episode){
  const ep=state.episode,e=OkaeriEpisodes.current(state),buttons=[['閉じる',closeModal,true]];
  if(e&&!ep.complete)buttons.push(['目的地のあるマップへ',()=>{closeModal();scene(e.scene,...OkaeriEpisodes.spawns[e.scene]);}]);
  const overview=OkaeriEpisodesData.contexts?.[ep.chapter];
  openModal('<h2>'+OkaeriEpisodes.title(state)+'</h2>'+(overview?'<h3>今日の用事</h3><p>'+escape(overview)+'</p>':'')+'<p>'+(OkaeriEpisodes.objective(state)||S.objective(state))+'</p>'+OkaeriEpisodesData.titles.map((t,i)=>'<p>'+(i+1<ep.chapter?'✓ ':i+1===ep.chapter?'→ ':'○ ')+(i+1)+'. '+t+'</p>').join('')+'<h3>二人の思い出</h3>'+((globalThis.OkaeriActivities?.notes(state)||[]).map(n=>'<p>◆ '+escape(n)+'</p>').join('')||'<p>二人で選んだことが、ここに残ります。</p>')+'<p>リツ：町に戻った水番。ユラ：二人を幼い頃から知る診療所の先生。</p>',buttons,'explore');return;
 }
if(mode==='title'){openModal('<span class="tag">はじめに</span><h2>二人で、灯りを届ける</h2><p>トウマとニナは、雪の町ユキネで一緒に暮らす幼馴染。雪で消える道の代わりに、人が帰る方角を知らせる「帰り灯」の番をする、灯守（ひもり）です。トウマは木や金具の修理、ニナは火を扱う「灯術」が得意です。</p><p>二人の仕事と暮らしを、全10話でたどります。第9話で二人の関係を選ぶと、最終話が三通りに変わります。</p><p>操作：矢印 / WASDで移動、E・Enterで調べる、Qで交代。Jの「旅の手帳」で、今日の用事と次の行き先を確かめられます。右上の「音」で、音楽と効果音が入ります。</p>',[['閉じる',closeModal,true]],'title');return;}
 const steps=[['board','出発札を掛ける'],['mochi','こごえモチを落ち着かせる'],['log','トウマで倒木を動かす'],['repair','ニナで灯りの橋を修理する'],['crab','氷殻を火花で溶かす'],['guardian','枝角の番人と向き合う'],['lit','二人で灯台をともす'],['returned','出発札を戻して、ただいま'],['canalStarted','共同水路の依頼を受ける'],['waterGate','トウマで水門を支える'],['canalCrab','水路のヤドカリを落ち着かせる'],['waterFlow','ニナで調整灯をつなぐ'],['waterLit','水路の帰り灯をともす'],['waterReturned','マロに水の便りを届ける'],['hillStarted','風待ちの丘へ出発'],['windbreak','トウマで風よけを直す'],['hillGuardian','尾根の番人を落ち着かせる'],['hillLens','ニナでレンズを合わせる'],['hillLit','丘の灯台をともす'],['festivalStarted','帰り灯祭りへ'],['festivalMeal','二人でスープを食べる'],['festivalRibbon','帰り結びを贈り合う']];
 const html='<span class="tag">旅の手帳</span><h2>二人の灯守日誌</h2><p>'+S.objective(state)+'</p>'+steps.map(([k,v])=>'<div class="journal-step"><span>'+(state.flags[k]?'✓':'○')+'</span>'+v+'</div>').join('')+'<h3>町の人との寄り道</h3>'+OkaeriSideStories.notes(state).map(n=>'<div class="journal-step"><span>'+(n.done?'✓':'◇')+'</span><div><strong>'+n.title+'</strong><br>'+n.text+'</div></div>').join('')+'<h3>道中の思い出</h3><p>'+(state.flags.bread?'焼き菓子をもらった。':'パン屋には、いい匂いがしている。')+'<br>'+(state.flags.rest?'小屋で、二人のお昼を食べた。':'森の小屋で、ひと休みできそう。')+'</p><p>'+(state.flags.canalRest?'水番の休憩所で、次の人の薪を残した。':'共同水路にも、小さな休憩所がある。')+'</p><h3>二人の得意なこと</h3><p>トウマ：倒木を動かす / 崩し斬り・かばう<br>ニナ：灯りの修理 / 火花・回復<br>戦闘では毎回HP・SPが満タンで始まる試作仕様です。</p>';
 const btns=[['冒険に戻る',closeModal,true]];if(state.flags.lit&&state.scene==='forest')btns.push(['町へ帰る',()=>{closeModal();scene('town',12,3);}]);openModal(html,btns,'explore');}
function menu(){if(mode==='title'){journal();return;}if(mode==='dialogue'||mode==='battle'){toast('会話や戦闘が終わってから開けます');return;}if(mode==='modal')return;
 openModal('<span class="tag">ひと休み</span><h2>旅のメニュー</h2><p>進行はこの端末に自動保存されます。ブラウザーや開き方を変えると、保存は引き継がれません。</p>',[['戻る',closeModal,true],['タイトルへ',()=>{closeModal();save();mode='title';setMusic('opening');$('titleScreen').hidden=false;$('hud').hidden=true;$('continueButton').hidden=!saved;}]],mode);
}
function evening(key){
 state.pendingEvening=key;scene('house',11,11);
 talk(S.nightScenes[key],()=>{delete state.pendingEvening;state.flags['night'+key[0].toUpperCase()+key.slice(1)]=true;save();
 if(state.episode&&key==='one'){state.episode.complete=true;save();OkaeriEpisodes.endDay(episodeApi());return;}
 const end=S.endings[key];openModal('<span class="tag">'+(end?'おかえりの灯 · END':'一日の終わり')+'</span><h2>'+(end?end.title:key==='three'?'祭りの支度ができた':'おやすみ。また明日')+'</h2><p>'+(end?'同じ家から、二人の明日が続いていきます。遊んでくれて、ありがとうございます。':key==='three'?'家で着替えた二人は、これから帰り灯祭りへ。':'炉のそばに二人分のカップ。今日のことを、家に置いて眠ろう。')+'</p>',[['家で過ごす',closeModal,true],[key==='three'?'二人で祭りへ':end?'町へ出る':'翌朝、町へ',()=>{closeModal();scene('town',3,13);}]],'explore');});
}
function handleHouse(id){
 if(id==='ourHome'){scene('house',12,12);return true;}
 if(state.scene!=='house')return false;
 if(id==='houseExit'){scene('town',3,13);return true;}
 if(id==='homeTable'){if(state.episode){if(state.episode.complete)OkaeriEpisodes.endDay(episodeApi());else talk([['nina','今日の用事が済んだら、ここでゆっくり話そうね。'],['touma','ああ。お茶を沸かす分の薪は、残しておく。']]);return true;}
 const options=[['one','returned','第一話 · 二つのカップ'],['two','waterReturned','第二話 · 味見の距離'],['three','festivalStarted','第三話 · いつもと違う支度'],['touma','endingTouma','最終話 · 恋人になった家'],['nina','endingNina','最終話 · 返事の続き'],['friends','endingFriends','最終話 · 明日の席']].filter(([,flag])=>state.flags[flag]);
 openModal('<h2>二人の食卓</h2><p>今日のことを、少し話そう。終えた章の夜を読み返せます。</p>',[...options.map(([key,,label])=>[label,()=>{closeModal();evening(key);}]),['今はお茶にする',()=>{closeModal();talk([['nina','お湯、沸いてるよ。'],['touma','じゃあ、二人分淹れる。',{se:'cup'}]]);},true]],'explore');return true;
 }
 const lines={
  toumaDesk:[['','トウマの修理机。よく磨かれた天板の隅に、「ニナの外套」と書いた小箱。中身は予備の留め金だ。\n工具の柄には、滑り止めの布が巻いてある。'],['nina','この布、私が巻いたやつだ。まだ使ってくれてるんだ。'],['touma','手になじんでるから。'],['nina','……そっか。すり切れたら言ってね。同じ色で巻き直すから。','happy']],
  toumaBooks:[['','本棚には、雪道の地図、家具の直し方、それから料理の本。\nスープの頁だけ、何度も開いた跡がある。'],['nina','これ、私の好きなきのこのスープの頁だ。'],['touma','次は焦がさない。'],['nina','この前のも、おいしかったよ。……鍋の底の方以外は。','joy']],
  ninaMirror:[['','ニナの鏡台。手作りの鏡枠に、青いリボンが掛けてある。\n引き出しの上には、書きかけのお礼のカード。'],['touma','鏡の高さ、直したままでいいか。'],['nina','うん。毎朝、ちゃんと見えるよ。'],['touma','何が。'],['nina','……直してくれた人が、丁寧だったってことが。','shy']],
  ninaWardrobe:[['','たたんだ冬服と、色の順に並んだ毛糸玉。\n二人分の手袋が、同じ籠に入っている。'],['touma','俺の手袋も、ここにあるのか。'],['nina','片方だけなくす人がいるので、まとめて管理してます。'],['touma','……助かります。','sweat']],
  homeStove:[['','町の人から譲り受けた、小さな薪ストーブ。がたついていた脚は、トウマが直した。',{se:'fire'}],['nina','今夜の火の番は、私ね。'],['touma','寝る前に、二人で確かめよう。']],
  toumaRoom:[['','トウマの部屋。きちんと整えた寝床の脇に、修理道具と読みかけの本がある。'],['nina','入る時は、ちゃんとノックするからね。'],['touma','俺もそうする。']],
  ninaRoom:[['','ニナの部屋。寝床には、何度も繕った毛布。小さな棚に、お気に入りの糸が並んでいる。'],['touma','窓から冷気は入らないか。'],['nina','大丈夫。トウマが直してくれたから。','happy']],
  homeShelf:[['','古い家の鍵と、一枚の写真。この家を大掃除した日に、町の人たちと撮ったものだ。\n血のつながりはなくても、二人を育ててくれた顔が並んでいる。'],['nina','この日、町じゅうの人が来てくれたんだよね。'],['touma','マロさんは掃除より、パンを配る方が忙しそうだった。'],['nina','それも大事なお仕事。','happy']],
  homeSewing:[['','窓辺の繕い机。ニナの針箱の隣に、トウマの予備の留め金の箱。\n互いの道具が、少しずつ相手の側へはみ出している。'],['nina','この机、半分使っていいよ。'],['touma','もう半分、借りてる。'],['nina','うん。知ってる。','happy']]
 };
 if(lines[id]){talk(lines[id]);return true;}return false;
}
function move(dx,dy){if(mode!=='explore')return false;const x=state.x+dx,y=state.y+dy;if(!S.walkable(state,x,y))return false;state.x=x;state.y=y;Sfx?.play(['house','lampworkshop'].includes(state.scene)?'stepWood':'step');updateHud();return true;}
function pathTo(tx,ty){
 if(mode!=='explore')return;const o=S.activeObjects(state).find(o=>Math.hypot(o.x-tx,o.y-ty)<1);const goal=(x,y)=>o?Math.hypot(o.x-x,o.y-y)<1.5:x===tx&&y===ty;
 const seen=new Set([state.x+','+state.y]),q=[[state.x,state.y,[]]];let found=null;
 while(q.length){const [x,y,p]=q.shift();if(goal(x,y)){found=p;break;}for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){let nx=x+dx,ny=y+dy,key=nx+','+ny;if(!seen.has(key)&&S.walkable(state,nx,ny)){seen.add(key);q.push([nx,ny,[...p,[dx,dy]]]);}}}
 if(found){route=found;routeTarget=o?.id||null;if(!route.length&&o){routeTarget=null;handle(o.id);}}else toast('まだ通れない道です。近くの仕掛けを調べよう');
}
function tone(){}
function musicFailure(){sound=false;bgm.stop();Sfx?.enable(false);$('soundButton').textContent='音 OFF';toast('音楽を再生できませんでした。もう一度「音 OFF」を押してください。');}
function travelMusic(){setMusic(D.ambient(state).bgm||(OkaeriMusic.sceneFor?OkaeriMusic.sceneFor(state.scene):['town','house','lakeside','lampworkshop'].includes(state.scene)?'village':'journey'));}
function setMusic(scene){bgm.select(scene).catch(musicFailure);$('soundButton').title=OkaeriMusic.title?OkaeriMusic.title(scene):'';}
function musicCue(name){if(!bgm.cue)return;bgm.cue(name==='scene'?null:name).catch(musicFailure);}
async function toggleSound(){
 const button=$('soundButton');if(button.disabled)return;
 if(sound){sound=false;bgm.stop();Sfx?.enable(false);button.textContent='音 OFF';return;}
 button.disabled=true;
 try{await bgm.play();sound=true;Sfx?.enable(true);refreshStage();button.textContent='音 ON';}
 catch{musicFailure();}finally{button.disabled=false;}
}
setMusic('opening');
function chapterSelect(){
 if(globalThis.OkaeriEpisodes){
  const enter=(n,r=null)=>{start(OkaeriEpisodes.create(n,r),n!==1,chapterSaveKey);save();};
  const buttons=OkaeriEpisodesData.titles.map((t,i)=>['第'+(i+1)+'話 · '+t,()=>{
   if(i===9)openModal('<h2>第10話の関係を選ぶ</h2><p>章選択用です。通常の旅の選択は変わりません。</p>',[['トウマから告白して恋人',()=>enter(10,'touma'),true],['ニナから告白して恋人',()=>enter(10,'nina')],['今の二人のまま',()=>enter(10,'friends')],['コハルと：三人で仲良く',()=>enter(10,'koharu')],['コハルと：コハルのことも選ぶ',()=>enter(10,'both')],['戻る',chapterSelect]],'title');
   else enter(i+1);
  }]);
  if(globalThis.OkaeriJourney)buttons.push(['第6話の小旅行から',()=>{enter(6);state.episode.step=2;OkaeriJourney.begin(episodeApi());}]);
  let replay=null;try{replay=C.restoreSave(localStorage.getItem(chapterSaveKey));}catch{}
  if(replay)buttons.push(['章選択の旅の続き',()=>start(replay,true,chapterSaveKey)]);
  buttons.push(['戻る',closeModal]);openModal('<h2>十話の帰り道</h2><p>通常の旅と章選択は別々に保存します。第9・10話には結末の内容が含まれます。</p>',buttons,'title');return;
 }

 const enter=id=>{const s=OkaeriChapters.create(id);start(s,id!==1,chapterSaveKey);if(id===2)handle('canalExit');if(id===3)handle('hillExit');if(id===4)handle('festivalStart');save();};
 const names=['第一話 · 森の灯台','第二話 · 水音の帰る道','第三話 · 風待ちの丘','最終話 · 帰り灯祭り'];
 const buttons=names.map((n,i)=>[n,()=>enter(i+1),i===2]);let replay=null;try{replay=C.restoreSave(localStorage.getItem(chapterSaveKey));}catch{}
 if(replay)buttons.push(['章選択の旅の続き',()=>start(replay,true,chapterSaveKey)]);
 buttons.push(['戻る',closeModal]);
 openModal('<span class="tag">CHAPTER SELECT</span><h2>好きな章から始める</h2><p>通常の「つづきから」のセーブは残ります。章選択の旅は別枠に保存します。</p><p>各章は必要な前章の出来事を完了した状態で始まります。章を選び直すと、前の章選択の旅は置き換わります。後の章には物語のネタバレがあります。</p>',buttons,'title');
}
$('chapterButton').onclick=chapterSelect;$('galleryButton').onclick=()=>Stills?.gallery(openModal,closeModal);
$('startButton').onclick=()=>{if(saved)openModal('<h2>新しい一日を始める</h2><p>保存済みの旅を、新しい旅で上書きします。</p>',[['新しく始める',()=>start(fresh(),false),true],['戻る',closeModal]],'title');else start(fresh(),false);};
$('continueButton').onclick=()=>{let s;try{s=C.restoreSave(localStorage.getItem(normalSaveKey));}catch{}if(s)start(s,true);else toast('保存データを読めません。はじめから遊べます');};
$('nextDialogue').onclick=nextDialogue;$('leadButton').onclick=switchLead;$('interactButton').onclick=interact;$('journalButton').onclick=journal;$('menuButton').onclick=menu;$('soundButton').onclick=toggleSound;

const dirs={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]};
document.addEventListener('keydown',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;
 if(mode==='opening'){if(!e.repeat){if(['Enter',' ','e'].includes(key)&&e.target.tagName!=='BUTTON'){e.preventDefault();openingFilm.next();}else if(key==='Escape'){e.preventDefault();openingFilm.finish();}}return;}
 if(mode==='battle'){if(!e.repeat||key.startsWith('Arrow'))classicBattle.key(e);return;}
 if(dirs[key]&&mode==='explore'){e.preventDefault();held[key]=true;route=[];return;}
 if(e.repeat)return;
 if((key==='Enter'||key===' '||key==='e')&&mode==='dialogue'){e.preventDefault();if(!queue[queueIndex].choices)nextDialogue();return;}
 if(e.target.tagName==='BUTTON'&&key==='Enter')return;
 if(key==='e'||key==='Enter'){if(mode==='explore'){e.preventDefault();interact();}}
 if(key==='q')switchLead();if(key==='j')journal();if(key==='Escape'){if(mode==='modal'){if(modalReturn==='battle')toast('下のボタンから戦闘を進めてください');else closeModal();}else menu();}
});
document.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;delete held[k];if(mode==='explore')save();});window.addEventListener('blur',()=>{held={};route=[];});
for(const btn of document.querySelectorAll('[data-move]')){const key={left:'a',right:'d',up:'w',down:'s'}[btn.dataset.move];btn.addEventListener('pointerdown',e=>{e.preventDefault();held[key]=true;route=[];btn.setPointerCapture(e.pointerId);});for(const event of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(event,()=>{delete held[key];if(mode==='explore')save();});}
canvas.addEventListener('pointerdown',e=>{if(mode!=='explore')return;const r=canvas.getBoundingClientRect();const tx=Math.floor((e.clientX-r.left)/r.width*24),ty=Math.floor((e.clientY-r.top)/r.height*16);pathTo(tx,ty);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){held={};route=[];if(mode!=='title')save();}});
function frame(t){typeTick(t);if(mode==='explore'&&t-lastMove>155){const key=Object.keys(held).find(k=>dirs[k]);if(key){move(...dirs[key]);lastMove=t;}else if(route.length){const [dx,dy]=route.shift();move(dx,dy);lastMove=t;if(!route.length){save();if(routeTarget){const id=routeTarget;routeTarget=null;handle(id);}}}}renderer.draw(state,t,mode);requestAnimationFrame(frame);}
updateHud();Promise.all([OkaeriSprites.load(),OkaeriCast.ready,OkaeriResidentsArt.ready]).then(()=>requestAnimationFrame(frame)).catch(()=>toast("キャラクター画像を読み込めませんでした。ページを再読み込みしてください。"));
})();
