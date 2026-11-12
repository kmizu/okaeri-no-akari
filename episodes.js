(function(root){
'use strict';
const D=root.OkaeriEpisodesData,S=root.OkaeriStory;
const spawns={town:[12,10],forest:[5,13],canal:[3,12],hill:[4,13],house:[12,12]};
// ['@名前'] の一行を、条件に合う台詞へ差し替える（合わなければ消す）。
function expand(lines,slots){return lines.flatMap(l=>l.length===1&&typeof l[0]==='string'&&l[0][0]==='@'?(slots[l[0].slice(1)]||[]):[l]);}
function slots(s){
 const chapter=s.episode.chapter,m=s.memories||{},out={};
 const echo=D.nightEchoes?.[chapter];if(echo&&m[echo.key]==='read')out.echo=echo.lines;
 if([4,10].includes(chapter))out.gift=root.OkaeriActivities?.keepsake(s)||null;
 if(chapter===6&&s.journey?.step===9)out.journey=D.journeyEcho;
 if(chapter===9){out.festival=Object.entries(D.festivalEchoes||{}).flatMap(([key,extra])=>key==='journey'?(s.journey?.step===9?extra:[]):m[key]==='read'?extra:[]);}
 if(chapter===10&&m.unsentLetter==='read')out.letter=D.finalEchoes[s.episode.route];
 if(chapter===9)out.night=D.night9[['koharu','both'].includes(s.episode.route)?s.episode.route:'pair'];
 return out;
}
function events(s){
 const chapter=s.episode.chapter,list=chapter===10?D.routes[s.episode.route]||[]:D.episodes[chapter]||[],fill=slots(s);
 return list.map(e=>({...e,lines:expand(e.lines,fill)}));
}
function current(s){return s.episode?events(s)[s.episode.step]:null;}
function create(chapter,route=null){
 if(!Number.isInteger(chapter)||chapter<1||chapter>10||(chapter===10&&!D.routes[route]))throw Error('Unknown episode or route');
 const s=root.OkaeriChapters.create(chapter===1?1:4);
 s.episode={chapter,step:0,route:chapter===10?route:null,complete:false};
 if(chapter>=9)s.flags.festivalStarted=true;
 if(chapter===10)setRoute(s,route);
 const e=current(s);if(e){s.scene=e.scene;[s.x,s.y]=spawns[e.scene];}return s;
}
function setRoute(s,route){s.episode.route=route;s.flags.festivalStarted=true;s.flags.festivalMeal=true;s.flags.festivalRibbon=true;for(const r of ['touma','nina','friends'])s.flags['ending'+r[0].toUpperCase()+r.slice(1)]=r===route;}
function title(s){return '第'+s.episode.chapter+'話 · '+D.titles[s.episode.chapter-1];}
function objective(s){if(s.episode.complete)return s.episode.chapter===10?'二人の明日へ。食卓で最後の一日を振り返れます。':'今日の話はおしまい。食卓から翌日へ進めます。';const e=current(s);return e?({town:'町',forest:'森',canal:'水路',hill:'丘',house:'二人の家'}[e.scene]+'：'+e.label+(e.lead?(e.solo?'（操作：':'（Qで')+(e.lead==='nina'?'ニナ':'トウマ')+(e.solo?'）':'に交代）'):'')):null;}
function go(a,e){if(e.solo)a.state.lead=e.lead;if(e.arrival){a.scene(...e.arrival);}else if(a.state.scene!==e.scene)a.scene(e.scene,...spawns[e.scene]);a.save();a.updateHud();}
function finishEvent(a){const ep=a.state.episode;if(ep.chapter===6&&ep.step===2&&root.OkaeriJourney&&a.state.journey?.step!==9){root.OkaeriJourney.begin(a);return;}ep.step++;if(ep.step===events(a.state).length){ep.complete=true;}a.save();a.updateHud();if(ep.complete)endDay(a);else go(a,current(a.state));}
function next(a){const s=a.state,nextState=create(s.episode.chapter+1,s.episode.route);nextState.courage=s.courage;nextState.flags={...s.flags,...nextState.flags};nextState.memories={...s.memories};Object.assign(s,nextState);a.scene(s.scene,s.x,s.y);a.toast(title(s));}
function endDay(a){const s=a.state,ep=s.episode;const buttons=[['家で過ごす',a.closeModal,true]];const night=events(s).at(-1);if(night)buttons.push(['今夜の会話を振り返る',()=>{a.closeModal();a.talk(night.lines);}]);if(ep.chapter<10)buttons.push(['翌日の話へ',()=>{a.closeModal();next(a);}]);else buttons.push(['この一日をもう一度',()=>{a.closeModal();ep.step=0;ep.complete=false;a.save();go(a,current(s));}]);a.openModal((ep.chapter===10?'<div class="ending-art"></div>':'')+'<span class="tag">'+(ep.chapter===10?'おかえりの灯 · END':'第'+ep.chapter+'話 · おしまい')+'</span><h2>'+D.titles[ep.chapter-1]+'</h2><p>'+(ep.chapter===10?'春になれば、ニナは南へ発ちます。そして三週間後、この家の戸口には帰り灯がともっているはずです。<br>遊んでくれて、ありがとうございました。':D.closings?.[ep.chapter]||'今日の出来事を家に置いて、明日へ。')+'</p>',buttons,'explore');}
function choose(a){
 const pick=r=>{a.closeModal();a.talk(D.confessions[r],()=>{setRoute(a.state,r);finishEvent(a);});};
 // コハルの話を聞いたあと、もう一度選ぶ。
 const answer=()=>a.openModal('<h2>コハルに、どう答える</h2><p>どちらを選んでも、三人の仲は壊れません。</p>',[
  ['三人でいる今を選ぶ',()=>{a.closeModal();a.talk(D.koharuAnswers.koharu,()=>{setRoute(a.state,'koharu');finishEvent(a);});},true],
  ['聞いたままにはしない。ニナにも全部話す',()=>{a.closeModal();a.talk(D.koharuAnswers.both,()=>{setRoute(a.state,'both');finishEvent(a);});}]
 ],'explore');
 const seek=()=>{a.closeModal();a.talk(D.confessions.koharu,answer);};
 a.openModal('<h2>ニナに、伝えたいこと</h2><p>第10話は、この選択で過ごし方が変わります。</p>',[['自分から好きだと伝える',()=>pick('touma'),true],['ニナの告白を受け止める',()=>pick('nina')],['今の二人の関係を選ぶ',()=>pick('friends')],['先に、姿の見えないコハルを探しに行く',seek],['もう少し考える',a.closeModal]],'explore');
}
function detour(s){return D.detours?.[s.episode.chapter+':'+s.episode.step];}
function offerDetour(a,done){
 const d=detour(a.state);if(!d||a.state.memories?.[d.key]==='read')return false;
 a.openModal('<span class="tag">帰り道の寄り道</span><h2>'+d.title+'</h2><p>'+d.hint+'</p>',[
  ['少し寄り道する',()=>{a.closeModal();a.talk(d.lines,()=>{a.state.memories={...a.state.memories,[d.key]:'read'};done();});},true],
  ['今日は用事の続きへ',()=>{a.closeModal();done();}]
 ],'explore');return true;
}
function handle(id,a){const s=a.state;if(!s.episode)return false;
 if(root.OkaeriJourney?.handle(id,a))return true;
 if(s.episode.chapter===1&&id==='koharu'){a.talk(s.flags.lit?D.chatter[1].koharuAfter:D.chatter[1].koharu);return true;}
 if(s.episode.chapter===1){if(id==='ritsu'||id==='yura'){a.talk(id==='ritsu'?[['','広場の東で、見慣れない外套の男が水路の石組みをのぞきこんでいる。図面を片手に、何か数えているようだ。'],['nina','……誰だろ。旅の人かな。'],['touma','仕事中みたいだ。帰ってきたら声をかけよう。今は森が先だ。']]:[['ユラ','おや、二人とも。今日から森は二人だけだってね。自分の家を持っても、食事は抜かないこと。'],['touma','今日は弁当があります。ニナが作りました。'],['ユラ','よろしい。怪我をしてもしなくても、帰ったら顔を見せにおいで。','happy']]);return true;}return false;}
 if(s.episode.complete&&id==='homeTable'){endDay(a);return true;}
 if(id==='episodeEvent'){
 const e=current(s);if(!e||e.scene!==s.scene)return true;
 if(e.lead&&s.lead!==e.lead){a.toast((e.lead==='nina'?'ニナ':'トウマ')+'の出番です。Qで交代しよう。');return true;}
 if(root.OkaeriActivities?.run(a,e,()=>finishEvent(a)))return true;
 a.talk(e.lines,()=>{if(e.choice){choose(a);return;}if(e.battle){a.startBattle(e.battle);return;}if(offerDetour(a,()=>finishEvent(a)))return;finishEvent(a);});return true;
 }
 // Ordinary household interactions remain available; old main-quest handlers cannot jump ahead.
 if(s.scene==='house'||id==='ourHome')return false;
 const exits={exit:['forest',5,13],home:['town',12,3],canalExit:['canal',3,12],canalHome:['town',21,9],hillExit:['hill',4,13],hillHome:['town',2,9]};
 if(exits[id]){a.scene(...exits[id]);return true;}
 // 町の人や掲示板は、出来事の合間にいつでも話しかけられる。
 // 寄り道（針仕事帳・帰還札・白樺の待ち場）は、吹雪の日を除いていつでも進められる。
 if(s.episode.chapter!==8&&root.OkaeriSideStories?.handle(id,a))return true;
 const chat=D.chatter?.[s.episode.chapter]?.[id]||D.idle?.[id];
 if(chat){a.talk(chat);return true;}
 a.talk([['nina',s.episode.complete?'今日の話は、家でゆっくりしよう。':'今は「'+current(s).label+'」だったね。'],['touma','ああ。行こう。']]);return true;
}
function won(a){const e=current(a.state);if(!e?.battle)return false;a.talk([['','荒れていた角の光が、ゆっくり静まった。\n番人は灯台へ続く道をあけ、雪の上に伏せる。'],['nina','ありがとう。あとは、私たちが届けるね。']],()=>finishEvent(a));return true;}
const originalObjects=S.activeObjects;
S.activeObjects=function(s){let list=originalObjects(s);if(!s.episode)return list;
 // 第8話のオルフは丘の小屋にいる。全員が帰るまで、広場には立っていない。
 if(s.scene==='town'&&s.episode.chapter===8&&!s.episode.complete)list=list.filter(o=>o.id!=='orlf');
 if(s.scene==='town')list=[...list,{id:'ritsu',type:'episodeNpc',x:20,y:9,label:'水番のリツ'},{id:'yura',type:'episodeNpc',x:11,y:11,label:'診療所のユラ'}];
 // コハルは第1話から、薬草の籠を提げて広場に立つ。二人と一緒に歩いている間と、丘へ登っている間はいない。
 if(s.scene==='town'&&!root.OkaeriDirector?.companion(s)&&!(s.episode.chapter===8&&s.episode.step>=1&&!s.episode.complete)&&!(s.episode.chapter===2&&s.episode.step>=1&&!s.episode.complete)&&!(s.episode.chapter===3&&s.episode.step<4))list=[...list,{id:'koharu',type:'episodeNpc',x:13,y:12,label:'薬草屋のコハル'}];
 const e=current(s);if(!s.episode.complete&&e?.scene===s.scene){const base=list.find(o=>o.x===e.x&&o.y===e.y);list=list.filter(o=>o!==base);list.push({id:'episodeEvent',type:'episodeEvent',x:e.x,y:e.y,label:e.label,base,person:e.scene==='town'&&e.x===20?'リツ':e.scene==='town'&&e.x===11?'ユラ':e.lines[0][0]});}return list;};
root.OkaeriEpisodes={create,events,current,title,objective,handle,won,spawns,endDay,next,finishEvent,detour,expand};
})(globalThis);
