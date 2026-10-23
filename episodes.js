(function(root){
'use strict';
const D=root.OkaeriEpisodesData,S=root.OkaeriStory;
const spawns={town:[12,10],forest:[5,13],canal:[3,12],hill:[4,13],house:[12,12]};
function events(s){
 const chapter=s.episode.chapter,list=chapter===10?D.routes[s.episode.route]||[]:D.episodes[chapter]||[];
 return list.map((e,i)=>{
  let lines=e.lines;
  if(i===list.length-1){
   if(root.OkaeriActivities&&[4,10].includes(chapter))lines=root.OkaeriActivities.closing(s,lines);
   const echo=D.nightEchoes?.[chapter];
   if(echo&&s.memories?.[echo.key]==='read'){const at=echo.at==='end'?lines.length:echo.at;lines=[...lines.slice(0,at),...echo.lines,...lines.slice(at)];}
   if(chapter===10&&s.memories?.unsentLetter==='read'){const at={touma:3,nina:5,friends:3}[s.episode.route];lines=[...lines.slice(0,at),...D.finalEchoes[s.episode.route],...lines.slice(at)];}
  }
  if(chapter===9&&i===0){const echoes=Object.entries(D.festivalEchoes||{}).flatMap(([key,extra])=>s.memories?.[key]==='read'?extra:[]);lines=[...lines.slice(0,3),...echoes,...lines.slice(3)];}
  return lines===e.lines?e:{...e,lines};
 });
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
function finishEvent(a){const ep=a.state.episode;ep.step++;if(ep.step===events(a.state).length){ep.complete=true;}a.save();a.updateHud();if(ep.complete)endDay(a);else go(a,current(a.state));}
function next(a){const s=a.state,nextState=create(s.episode.chapter+1,s.episode.route);nextState.courage=s.courage;nextState.flags={...s.flags,...nextState.flags};nextState.memories={...s.memories};Object.assign(s,nextState);a.scene(s.scene,s.x,s.y);a.toast(title(s));}
function endDay(a){const s=a.state,ep=s.episode;const buttons=[['家で過ごす',a.closeModal,true]];const night=events(s).at(-1);if(night)buttons.push(['今夜の会話を振り返る',()=>{a.closeModal();a.talk(night.lines);}]);if(ep.chapter<10)buttons.push(['翌日の話へ',()=>{a.closeModal();next(a);}]);else buttons.push(['この一日をもう一度',()=>{a.closeModal();ep.step=0;ep.complete=false;a.save();go(a,current(s));}]);a.openModal('<span class="tag">'+(ep.chapter===10?'END':'一日の終わり')+'</span><h2>'+D.titles[ep.chapter-1]+'</h2><p>'+(ep.chapter===10?'選んだ関係で過ごした一日。二人の暮らしは、これからも続きます。':'今日の出来事を家に置いて、明日へ。')+'</p>',buttons,'explore');}
function choose(a){
 const pick=r=>{a.closeModal();a.talk(r==='touma'?[['touma','ニナが好きだ。幼馴染としてだけじゃなく、恋人になりたい。'],['nina','うん。私も好き。明日からも、隣にいて。']]:r==='nina'?[['nina','トウマが好き。幼馴染としてだけじゃなくて。……返事、聞かせて。'],['touma','俺も好きだ。恋人として、一緒にいたい。'],['','ニナはうなずきながら、トウマの手を握った。']]:[['touma','今の二人を、大切にしたい。急いで違う名前をつけずに。'],['nina','うん。私も、今の暮らしが好き。これからも話して決めていこう。']],()=>{setRoute(a.state,r);finishEvent(a);});};
 a.openModal('<h2>ニナに、伝えたいこと</h2><p>第10話は、この選択で過ごし方が変わります。</p>',[['自分から好きだと伝える',()=>pick('touma'),true],['ニナの告白を受け止める',()=>pick('nina')],['今の二人の関係を選ぶ',()=>pick('friends')],['もう少し考える',a.closeModal]],'explore');
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
 if(s.episode.chapter===1){if(id==='ritsu'||id==='yura'){a.talk(id==='ritsu'?[['リツ','水番のリツです。町に戻ってきたばかり。森から帰ったら、水路も一緒に見てもらえる？'],['nina','もちろん。あの頃の宝物、まだ隠してないよね？']]:[['ユラ','二人とも、大きくなったねえ。自分の家で暮らしても、食事は抜かないこと。'],['touma','今日は弁当もあります。'],['ユラ','よろしい。何もなくても、顔を見せにおいで。']]);return true;}return false;}
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
 if(id==='ritsu'||id==='yura'){a.talk(id==='ritsu'?[['リツ','点検の記録は、みんなに見てもらうことにしたよ。'],['touma','一緒に確かめましょう。']]:[['ユラ','今日はちゃんと休む時間も作ること。お茶だけ飲みに来てもいいんだよ。'],['nina','今度は二人で、お菓子を持ってきます。']]);return true;}
 a.talk([['nina',s.episode.complete?'今日の話、家でゆっくりしよう。':'今は、'+current(s).label+'だったね。'],['touma','うん。一緒に行こう。']]);return true;
}
function won(a){const e=current(a.state);if(!e?.battle)return false;a.talk([['','荒れていた灯りが静まり、番人は小屋へ続く道をあけた。'],['nina','ありがとう。あとは、私たちで届けるね。']],()=>finishEvent(a));return true;}
const originalObjects=S.activeObjects;
S.activeObjects=function(s){let list=originalObjects(s);if(!s.episode)return list;if(s.scene==='town')list=[...list,{id:'ritsu',type:'episodeNpc',x:20,y:9,label:'水番のリツ'},{id:'yura',type:'episodeNpc',x:11,y:11,label:'診療所のユラ'}];const e=current(s);if(!s.episode.complete&&e?.scene===s.scene){const base=list.find(o=>o.x===e.x&&o.y===e.y);list=list.filter(o=>o!==base);list.push({id:'episodeEvent',type:'episodeEvent',x:e.x,y:e.y,label:e.label,base,person:e.scene==='town'&&e.x===20?'リツ':e.scene==='town'&&e.x===11?'ユラ':e.lines[0][0]});}return list;};
root.OkaeriEpisodes={create,events,current,title,objective,handle,won,spawns,endDay,next,finishEvent,detour};
})(globalThis);
