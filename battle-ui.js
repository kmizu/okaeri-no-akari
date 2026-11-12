(function(root){
'use strict';
class CommandFlow{
 constructor(heroes){this.ids=['touma','nina'].filter(id=>heroes[id].hp>0);this.index=0;this.commands={};for(const id of ['touma','nina'])if(heroes[id].hp<=0)this.commands[id]={skill:'skip'};}
 get actor(){return this.ids[this.index];}
 choose(command){this.commands[this.actor]={...command};if(this.index===this.ids.length-1)return true;this.index++;return false;}
 back(){if(this.index===0)return false;delete this.commands[this.actor];this.index--;delete this.commands[this.actor];return true;}
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nm=id=>id==='touma'?'トウマ':'ニナ';
function buildBeats(outcome,commands={}){
 const legacy=!outcome.events?.length,events=legacy?(outcome.logs||[]).map(message=>({message})):outcome.events,groups=[];
 for(const event of events){
  const actor=event.actor||null,announcement=actor&&/の「[^」]+」/.test(event.message);
  let beat=groups.at(-1);
  if(!beat||legacy||announcement||(actor&&actor!==beat.actor)){beat={actor,events:[]};groups.push(beat);}
  beat.events.push(event);
 }
 return groups.map(beat=>{
  const effects=beat.events.map(e=>e.effect).filter(Boolean),action=beat.events.map(e=>e.message.match(/の「([^」]+)」/)).find(Boolean)?.[1];
  let label=action?nm(beat.actor)+' · '+action:beat.actor==='team'?'二人技 · 灯火の一閃':beat.actor?.startsWith('enemy:')?(outcome.enemies[Number(beat.actor.slice(6))]?.name||'精霊')+'の攻撃':beat.actor?nm(beat.actor)+' · '+(commands[beat.actor]?.skill==='counter'?'灯返し':'攻撃'):beat.events[0]?.message||'';
  const magic=effects.some(e=>['fire','ring','heal'].includes(e.type))&&beat.actor!=='touma';
  const kind=beat.actor==='team'?'team':effects.length&&effects.every(e=>e.type==='shield')?'guard':magic?'spell':effects.some(e=>e.type==='heal')?'support':effects.length?'strike':'notice';
  const timing={team:[1050,2180],spell:[850,1810],support:[650,1580],guard:[180,720],strike:[570,1510],notice:[0,600]}[kind];
  return {...beat,effects,label,kind,impact:timing[0],duration:timing[1],snapshot:beat.events.at(-1)};
 });
}
class ResultPlayback{
 constructor(callbacks,clock={set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id)}){this.callbacks=callbacks;this.clock=clock;this.jobs=new Set();this.revision=0;this.active=false;}
 cancelJobs(){this.revision++;for(const id of this.jobs)this.clock.clear(id);this.jobs.clear();}
 later(fn,ms){const revision=this.revision;let id;id=this.clock.set(()=>{this.jobs.delete(id);if(this.revision===revision)fn();},ms);this.jobs.add(id);}
 play(outcome,commands){this.stop();this.outcome=outcome;this.beats=buildBeats(outcome,commands);this.index=0;this.active=true;this.run();}
 run(){
  if(this.index>=this.beats.length){this.active=false;this.current=null;this.callbacks.complete(this.outcome);return;}
  this.current=this.beats[this.index];this.impacted=false;this.callbacks.start(this.current);
  this.later(()=>{this.impacted=true;this.callbacks.impact(this.current,false);},this.current.impact);
  this.later(()=>this.advance(),this.current.duration);
 }
 advance(){if(!this.active)return;if(!this.impacted){this.impacted=true;this.callbacks.impact(this.current,true);}this.cancelJobs();this.callbacks.clear();this.index++;this.run();}
 stop(){this.cancelJobs();this.active=false;this.current=null;this.callbacks.clear();}
}
function conditionList(subject,kind,guard){
 if(subject.hp<=0)return kind==='hero'?[{key:'down',glyph:'×',label:'戦闘不能',help:'手を貸すと起き上がれます'}]:[];
 const list=[];
 if(kind==='enemy'){
  if(subject.ice)list.push({key:'ice',glyph:'❄',label:'氷の殻',help:'物理攻撃を軽減。火花で溶かせます'});
  if(subject.broken)list.push({key:'broken',glyph:'✦',label:'体勢崩れ',help:'次に受ける一撃が1.5倍'});
 }else{
  if(subject.chill)list.push({key:'chill',glyph:'❄',label:'冷え',help:'攻撃力が低下。回復や薬草で解除できます'});
  if(subject.buff)list.push({key:'buff',glyph:'✧',label:'灯りの剣',help:'次の一撃が1.5倍になり、氷も溶かします'});
  if(guard)list.push({key:'guard',glyph:'◇',label:guard==='protect'?'かばう':guard==='counter'?'反撃の構え':'防御',help:guard==='protect'?'ニナへの単体攻撃を引き受けます':'このターン受けるダメージを半減'});
 }
 return list;
}
function headAnchor(figure,arena){return {x:Math.max(24,Math.min(arena.width-24,figure.left+figure.width/2-arena.left)),y:Math.max(36,Math.min(arena.height-30,figure.top-arena.top-8))};}
class BattleUI{
 constructor(el,callbacks){this.el=el;this.callbacks=callbacks;this.phase='root';this.fxTimers=new Set();this.fxAnimations=new Set();this.guards={};this.playback=new ResultPlayback({start:beat=>this.presentBeat(beat),impact:(beat,fast)=>this.impactBeat(beat,fast),clear:()=>this.clearFx(),complete:b=>this.finishResult(b)});}
 begin(b){this.playback.stop();this.guards={};this.b=b;this.phase='root';this.flow=new CommandFlow(b.heroes);this.message=b.turn===1?b.enemies.map(e=>e.name).join(' と ')+'が あらわれた！':'二人の行動を選ぼう';this.render();}
 button(label,fn,disabled=false,desc='',target=null){const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled;b.className='classic-command';b.onclick=fn;b.onfocus=()=>{if(desc){const d=this.el.querySelector('.classic-description');if(d)d.textContent=desc;}if(target)this.highlight(...target);};b.onmouseenter=()=>{if(!b.disabled)b.focus({preventScroll:true});};return b;}
 heroStatus(id,h,active){
  return '<div data-status-hero="'+id+'" class="status-box '+(active?'active-hero':'')+'"><span class="status-face face-'+id+'" aria-hidden="true"></span><div class="status-details"><strong>'+nm(id)+'<small>'+(h.hp===0?'戦闘不能':h.chill?'冷え':h.buff?'灯りの剣':active?'コマンド入力':'')+'</small></strong><div class="status-line"><span>HP</span><b>'+h.hp+'</b><small>/ '+h.max+'</small></div><div class="status-meter"><i style="width:'+h.hp/h.max*100+'%"></i></div><div class="status-line mp-line"><span>MP</span><b>'+h.sp+'</b><small>/ '+h.maxSp+'</small></div></div></div>';
 }
 conditionMarkup(list){return list.map(c=>'<span class="condition-badge condition-'+c.key+'" role="img" aria-label="'+esc(c.label+'：'+c.help)+'" title="'+esc(c.help)+'"><b aria-hidden="true">'+c.glyph+'</b><span>'+c.label+'</span></span>').join('');}
 battlefield(){
  const b=this.b,actor=this.flow.actor,input=['actor','skills','items','target'].includes(this.phase),choosing=this.phase==='target';
  const slot=(x,y,z,body)=>'<div class="combatant-slot" data-depth="'+z+'" style="left:'+x+'%;top:'+y+'%;z-index:'+z+'">'+body+'</div>';
  const enemies=b.enemies.map((e,i)=>{
   const x=b.enemies.length===1?29:25+i*14,y=b.enemies.length===1?66:66-i*25;
   const canPick=choosing&&this.selected.target==='enemy'&&e.hp>0,label=e.name+(b.enemies.length>1?' '+String.fromCharCode(65+i):'');
   return slot(x,y,Math.round(y),'<button type="button" data-enemy="'+i+'" data-field-enemy="'+i+'" class="battle-combatant foe foe-'+e.type+(e.hp<=0?' fallen-enemy':'')+(e.ice?' has-ice':'')+(e.broken?' has-broken':'')+'" aria-label="'+esc(label)+'、HP '+e.hp+' / '+e.max+'" '+(canPick?'':'disabled')+'><span class="combatant-shadow"></span><span class="combatant-body">'+OkaeriWorld.enemySvg(e.type)+'<span class="condition-visual" aria-hidden="true"><i></i><i></i><i></i></span></span><span class="combatant-label">'+esc(label)+'</span><span class="foe-health"><i style="width:'+e.hp/e.max*100+'%"></i></span><span class="field-conditions">'+this.conditionMarkup(conditionList(e,'enemy'))+'</span><span class="target-cursor" aria-hidden="true">▽</span></button>');
  }).join('');
  const heroes=Object.entries(b.heroes).map(([id,h],i)=>{
   const canPick=choosing&&this.selected.target==='ally'&&h.hp>0,active=input&&actor===id;
   const command=input?this.flow.commands[id]:null,guard=this.guards[id]||(command&&['guard','protect','counter'].includes(command.skill));
   return slot(69+i*14,64+i*21,64+i*21,'<button type="button" data-hero="'+id+'" data-field-hero="'+id+'" class="battle-combatant party-actor actor-'+id+(active?' is-active':'')+(h.hp===0?' is-down':'')+(h.chill?' has-chill':'')+(h.buff?' has-buff':'')+(this.guards[id]?' has-guard':'')+(guard?' is-guarding':'')+'" aria-label="'+nm(id)+'、HP '+h.hp+' / '+h.max+'" '+(canPick?'':'disabled')+'><span class="combatant-shadow"></span><span class="combatant-body"><span class="hero-battle-sprite" aria-hidden="true"></span><span class="condition-visual" aria-hidden="true"><i></i><i></i><i></i></span></span><span class="field-conditions">'+this.conditionMarkup(conditionList(h,'hero',this.guards[id]))+'</span><span class="combatant-label">'+nm(id)+'</span><span class="actor-command">'+(active?'入力中':command&&h.hp>0?esc(OkaeriCore.actions(id).find(a=>a.id===command.skill)?.name||''):'')+'</span><span class="target-cursor" aria-hidden="true">▽</span></button>');
  }).join('');
  return '<div class="classic-arena" aria-label="雪道の戦場。右手前にトウマとニナ、左奥に精霊たち"><div class="battle-terrain" aria-hidden="true"></div><div class="battle-scene-heading"><span class="battle-place">雪の帰り道</span><div class="classic-battle-info">TURN '+(['result','outcome'].includes(this.phase)?this.outcome.turn-1:b.turn)+'<span>息ぴったり <b>'+('●'.repeat(b.gauge)+'○'.repeat(3-b.gauge))+'</b></span></div></div>'+enemies+heroes+(b.support?slot(57,90,90,'<button type="button" data-hero="koharu" class="battle-combatant party-actor actor-koharu is-support" aria-label="コハル（支え役）" disabled><span class="combatant-shadow"></span><span class="combatant-body"><span class="hero-battle-sprite" aria-hidden="true"></span></span><span class="combatant-label">コハル</span></button>'):'')+'<div class="battle-fx-layer" aria-hidden="true"></div></div>';
 }
 highlight(type,id){for(const n of this.el.querySelectorAll('.battle-combatant'))n.classList.remove('is-targeted');this.el.querySelector(type==='hero'?'[data-hero="'+id+'"]':'[data-enemy="'+id+'"]')?.classList.add('is-targeted');}
 render(){
  const b=this.b,actor=this.flow.actor,forecast=OkaeriCore.intentions(b);
  this.el.className='battle-screen classic-battle quarter-battle';
  const input=['actor','skills','items','target'].includes(this.phase);
  this.el.innerHTML=this.battlefield()+'<div class="classic-lower"><div class="classic-window classic-menu"><div class="classic-menu-title"></div><div class="classic-options"></div></div><div class="classic-window classic-text"><p class="classic-message" aria-live="polite"></p><p class="battle-live" aria-live="polite"></p><div class="classic-forecast"></div><p class="classic-description"></p><div class="classic-text-actions"></div></div><div class="classic-window classic-status">'+Object.entries(b.heroes).map(([id,h])=>this.heroStatus(id,h,input&&actor===id)).join('')+'</div></div><div class="classic-help">↑ ↓ 選択　Enter / Z 決定　Esc / X 戻る<span>二人のコマンドを決めると、ターンが進みます</span></div>';
  const title=this.el.querySelector('.classic-menu-title'),options=this.el.querySelector('.classic-options'),message=this.el.querySelector('.classic-message'),tips=this.el.querySelector('.classic-forecast');
  message.textContent=this.message||'';
  if(!['result','outcome'].includes(this.phase))tips.innerHTML=forecast.filter(Boolean).map(f=>'<div>'+esc(f.label)+'</div>').join('');
  const add=(label,fn,disabled,desc,target)=>options.append(this.button(label,fn,disabled,desc,target));
  if(this.phase==='root'){
   title.textContent='コマンド';add('たたかう',()=>{this.phase='actor';this.message=nm(actor)+'は どうする？';this.render();});
   add('れんけい',()=>this.callbacks.onTurn({},true),b.gauge<3||Object.values(b.heroes).some(h=>h.hp===0),'二人の行動で「灯火の一閃」。灯り三つを使う。');
   add('にげる',()=>{if(b.kind==='guardian'){this.message='番人を落ち着かせなければ 灯台へ進めない！';this.render();}else this.callbacks.onEscape();},false,'通常の戦闘からは確実に離脱できます。');
  }else if(this.phase==='actor'){
   title.textContent=nm(actor);add('こうげき',()=>this.selectSkill('attack'));
   add(actor==='nina'?'じゅもん':'とくぎ',()=>{this.phase='skills';this.render();});
   add('どうぐ',()=>{this.phase='items';this.render();});add('ぼうぎょ',()=>this.commit({skill:'guard'}));
   add('もどる',()=>this.back());
  }else if(this.phase==='skills'){
   title.textContent=nm(actor)+' · '+(actor==='nina'?'じゅもん':'とくぎ');
   for(const a of OkaeriCore.actions(actor).filter(a=>!['attack','guard','herb'].includes(a.id))){
    const unavailable=this.b.heroes[actor].sp<a.cost||(a.id==='rescue'&&this.b.heroes[actor==='touma'?'nina':'touma'].hp>0);
    add(a.name+'　'+a.cost+' MP',()=>this.selectSkill(a.id),unavailable,a.desc);
   }add('もどる',()=>this.back());
  }else if(this.phase==='items'){
   title.textContent='どうぐ';const reserved=Object.values(this.flow.commands).filter(c=>c.skill==='herb').length,remaining=b.items-reserved;
   add('薬草　× '+remaining,()=>this.selectSkill('herb'),remaining<=0,'味方一人のHPを45回復。二人で共有。');add('もどる',()=>this.back());
  }else if(this.phase==='target'){
   title.textContent=this.selected.name;message.textContent=this.selected.target==='enemy'?'だれを ねらう？':'だれに つかう？';
   if(this.selected.target==='enemy')b.enemies.forEach((e,i)=>{if(e.hp>0)add(e.name+(b.enemies.length>1?' '+String.fromCharCode(65+i):''),()=>this.commit({skill:this.selected.id,target:i}),false,'',['enemy',i]);});
   else for(const [id,h] of Object.entries(b.heroes))add(nm(id)+'　HP '+h.hp,()=>this.commit({skill:this.selected.id,target:id}),h.hp<=0,'',['hero',id]);
   add('もどる',()=>this.back());
  }else if(this.phase==='result'){
   title.textContent='行動中';add('早送り ▸',()=>this.nextMessage());tips.textContent='';
  }else if(this.phase==='outcome'){
   title.textContent=b.status==='victory'?'戦闘終了':'もう一度';tips.textContent='';
   if(b.status==='victory')add('冒険へもどる',()=>this.callbacks.onVictory());
   else{add('もう一度 挑む',()=>this.callbacks.onRetry());add('道へもどる',()=>this.callbacks.onEscape());}
  }
  if(this.phase==='target'){
   for(const node of this.el.querySelectorAll('[data-field-enemy]:not(:disabled)')){const id=Number(node.dataset.fieldEnemy);node.onclick=()=>this.commit({skill:this.selected.id,target:id});node.onfocus=()=>this.highlight('enemy',id);node.onmouseenter=()=>node.focus({preventScroll:true});}
   for(const node of this.el.querySelectorAll('[data-field-hero]:not(:disabled)')){const id=node.dataset.fieldHero;node.onclick=()=>this.commit({skill:this.selected.id,target:id});node.onfocus=()=>this.highlight('hero',id);node.onmouseenter=()=>node.focus({preventScroll:true});}
  }
  const enabled=[...options.querySelectorAll('button:not(:disabled)')];if(enabled[0])enabled[0].focus({preventScroll:true});
 }
 selectSkill(id){this.selected=OkaeriCore.actions(this.flow.actor).find(a=>a.id===id);this.previous=this.phase;if(this.selected.target){this.phase='target';this.render();}else this.commit({skill:id});}
 commit(command){if(this.flow.choose(command)){this.phase='busy';this.callbacks.onTurn(this.flow.commands,false);}else{this.phase='actor';this.message='トウマの行動を決めた。\n'+nm(this.flow.actor)+'は どうする？';this.render();}}
 back(){if(this.phase==='target'){this.phase=this.previous;}else if(['skills','items'].includes(this.phase)){this.phase='actor';}else if(this.phase==='actor'){if(!this.flow.back()){this.flow=new CommandFlow(this.b.heroes);this.phase='root';}}else return;this.message=this.phase==='root'?'どうする？':nm(this.flow.actor)+'は どうする？';this.render();}
 showResult(b){
  this.playback.stop();this.outcome=b;this.guards={};this.phase='result';this.message='';this.render();this.playback.play(b,this.flow.commands);
 }
 laterFx(fn,ms){const revision=this.fxRevision;let id;id=setTimeout(()=>{this.fxTimers.delete(id);if(revision===this.fxRevision)fn();},ms);this.fxTimers.add(id);}
 fieldNode(id){return this.el.querySelector(id.startsWith('enemy:')?'[data-enemy="'+id.slice(6)+'"]':'[data-hero="'+id+'"]');}
 clearFx(){
  this.fxRevision=(this.fxRevision||0)+1;for(const id of this.fxTimers)clearTimeout(id);this.fxTimers.clear();
  for(const animation of this.fxAnimations)animation.cancel();this.fxAnimations.clear();
  for(const n of this.el.querySelectorAll('.combatant-body')){n.classList.remove('is-striking','is-casting','is-guarding','effect-target','effect-slash','effect-fire','effect-ring','effect-team','effect-hurt','effect-heal','effect-shield');}
  for(const n of this.el.querySelectorAll('.combatant-slot'))n.style.zIndex=n.dataset.depth;
  for(const n of this.el.querySelectorAll('.battle-effect,.battle-charge'))n.remove();
  this.el.querySelector('.battle-fx-layer')?.replaceChildren();
  const message=this.el.querySelector('.classic-message');if(message&&this.phase==='result'){message.textContent='';message.classList.remove('is-transient');}
 }
 presentBeat(beat){
  const caption=this.el.querySelector('.classic-message');caption.textContent=beat.label;caption.classList.add('is-transient');
  if(caption.animate&&!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches)this.fxAnimations.add(caption.animate([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)',offset:.15},{opacity:1,offset:.7},{opacity:0,transform:'translateY(-2px)'}],{duration:beat.kind==='guard'?500:980,fill:'both'}));
  this.laterFx(()=>{caption.textContent='';caption.classList.remove('is-transient');},beat.kind==='guard'?500:980);
  const sources=beat.actor==='team'?['touma','nina']:beat.actor?[beat.actor]:[];
  const effect=beat.effects.find(e=>e.enemy!==undefined||e.type==='hurt'||e.type==='heal');
  const target=effect?this.fieldNode(effect.hero||'enemy:'+effect.enemy):null;
  for(const id of sources){
   const source=this.fieldNode(id);if(!source)continue;const body=source.querySelector('.combatant-body');
   body.style.setProperty('--beat-time',beat.duration+'ms');body.style.setProperty('--impact-time',beat.impact+'ms');
   if(beat.kind==='guard'){body.classList.add('is-guarding');continue;}
   const melee=target&&['strike','team'].includes(beat.kind)&&(id.startsWith('enemy:')||id==='touma'||effect?.type==='slash');
   if(melee){
    const a=source.getBoundingClientRect(),z=target.getBoundingClientRect();body.style.setProperty('--dash-x',((z.left+z.width/2-a.left-a.width/2)*.79)+'px');body.style.setProperty('--dash-y',((z.bottom-a.bottom)*.79)+'px');body.classList.add('is-striking');source.parentElement.style.zIndex='265';
   }else if(beat.kind!=='notice')body.classList.add('is-casting');
   if(['spell','support','team'].includes(beat.kind)){
    const charge=document.createElement('span');charge.className='battle-charge charge-'+beat.kind;charge.setAttribute('aria-hidden','true');body.append(charge);
    for(const fx of beat.effects){const to=this.fieldNode(fx.hero||'enemy:'+fx.enemy);if(to&&to!==source)this.projectile(source,to,fx.type,Math.max(200,beat.impact-420),420);}
   }
  }
 }
 updateField(){
  const b=this.b;
  for(const [id,h] of Object.entries(b.heroes)){
   const n=this.fieldNode(id);if(!n)continue;n.setAttribute('aria-label',nm(id)+'、HP '+h.hp+' / '+h.max);
   n.classList.toggle('is-down',h.hp<=0);n.classList.toggle('has-chill',h.hp>0&&h.chill>0);n.classList.toggle('has-buff',h.hp>0&&h.buff>0);n.classList.toggle('has-guard',h.hp>0&&!!this.guards[id]);n.classList.toggle('is-guarding',h.hp>0&&!!this.guards[id]);
   n.querySelector('.field-conditions').innerHTML=this.conditionMarkup(conditionList(h,'hero',this.guards[id]));
  }
  b.enemies.forEach((e,i)=>{
   const n=this.fieldNode('enemy:'+i);if(!n)return;const label=e.name+(b.enemies.length>1?' '+String.fromCharCode(65+i):'');
   n.setAttribute('aria-label',label+'、HP '+e.hp+' / '+e.max);n.classList.toggle('fallen-enemy',e.hp<=0);n.classList.toggle('has-ice',e.hp>0&&!!e.ice);n.classList.toggle('has-broken',e.hp>0&&e.broken>0);
   n.querySelector('.foe-health i').style.width=e.hp/e.max*100+'%';n.querySelector('.field-conditions').innerHTML=this.conditionMarkup(conditionList(e,'enemy'));
  });
  this.el.querySelector('.classic-status').innerHTML=Object.entries(b.heroes).map(([id,h])=>this.heroStatus(id,h,false)).join('');
  this.el.querySelector('.classic-battle-info b').textContent='●'.repeat(b.gauge)+'○'.repeat(3-b.gauge);
 }
 impactBeat(beat,fast){
  const before=this.b,beforeGuards={...this.guards};this.b={...this.outcome,...beat.snapshot};
  for(const fx of beat.effects)if(fx.type==='shield')this.guards[fx.hero]=this.flow.commands[fx.hero]?.skill||'guard';
  this.updateField();this.el.querySelector('.battle-live').textContent=beat.events.map(e=>e.message).join(' ');
  if(fast)return;
  const stack=new Map(),show=(id,text,type)=>{const row=stack.get(id)||0;stack.set(id,row+1);this.popup(this.fieldNode(id),text,type,row);};
  for(const effect of beat.effects){
   const id=effect.hero||'enemy:'+effect.enemy,target=this.fieldNode(id);if(!target)continue;
   const body=target.querySelector('.combatant-body');body.classList.add('effect-target','effect-'+effect.type);
   const art=document.createElement('span');art.className='battle-effect';art.setAttribute('aria-hidden','true');
   for(let i=0;i<8;i++){const spark=document.createElement('i');spark.style.setProperty('--angle',i*45+'deg');art.append(spark);}body.append(art);
   if(effect.amount!==undefined)show(id,(effect.type==='heal'?'+':'')+effect.amount,effect.type==='heal'?'heal':'damage');
  }
  for(const [kind,entries] of [['hero',Object.entries(this.b.heroes)],['enemy',this.b.enemies.map((e,i)=>['enemy:'+i,e])]]){
   for(const [id,now] of entries){
    const old=kind==='hero'?before.heroes[id]:before.enemies[Number(id.slice(6))];if(!old||now.hp<=0)continue;
    const prev=conditionList(old,kind,beforeGuards[id]),next=conditionList(now,kind,this.guards[id]);
    for(const c of next)if(c.key!=='guard'&&!prev.some(p=>p.key===c.key))show(id,c.label,'condition');
    for(const c of prev)if(!next.some(n=>n.key===c.key)){
     if(c.key==='ice'){show(id,'氷が砕けた','clear');this.shatter(this.fieldNode(id));}
     else if(c.key==='chill')show(id,'冷え解除','clear');
    }
   }
  }
 }
 popup(target,text,type,row=0){
  if(!target)return;const arena=this.el.querySelector('.classic-arena'),point=headAnchor(target.getBoundingClientRect(),arena.getBoundingClientRect()),n=document.createElement('span');
  n.className=type==='damage'||type==='heal'?'battle-number number-'+type:'battle-condition-pop pop-'+type;
  n.style.left=point.x+'px';n.style.top=(point.y+row*22)+'px';
  if(type==='damage'||type==='heal'){for(const [i,char] of [...String(text)].entries()){const digit=document.createElement('span');digit.textContent=char;digit.style.setProperty('--digit',i);n.append(digit);}}
  else n.textContent=text;
  this.el.querySelector('.battle-fx-layer').append(n);this.laterFx(()=>n.remove(),940);
 }
 shatter(target){
  const arena=this.el.querySelector('.classic-arena'),r=arena.getBoundingClientRect(),a=target.getBoundingClientRect();
  for(let i=0;i<12;i++){const shard=document.createElement('i');shard.className='ice-shard';shard.style.left=(a.left+a.width/2-r.left)+'px';shard.style.top=(a.top+a.height*.5-r.top)+'px';shard.style.setProperty('--spray-x',Math.cos(i*Math.PI/6)*(35+i%3*14)+'px');shard.style.setProperty('--spray-y',Math.sin(i*Math.PI/6)*48-18+'px');shard.style.setProperty('--shard-rotation',i*47+'deg');this.el.querySelector('.battle-fx-layer').append(shard);}
 }
 projectile(source,target,type,delay,duration){
  const arena=this.el.querySelector('.classic-arena'),r=arena.getBoundingClientRect(),a=source.getBoundingClientRect(),z=target.getBoundingClientRect(),trail=document.createElement('span');
  trail.className='battle-projectile projectile-'+type;trail.setAttribute('aria-hidden','true');trail.style.left=(a.left+a.width*.4-r.left)+'px';trail.style.top=(a.top+a.height*.4-r.top)+'px';
  const dx=z.left+z.width/2-a.left-a.width*.4,dy=z.top+z.height*.4-a.top-a.height*.4;
  trail.style.setProperty('--flight-x',dx+'px');trail.style.setProperty('--flight-y',dy+'px');trail.style.setProperty('--arc-x',dx*.5+'px');trail.style.setProperty('--arc-y',dy*.5-30+'px');trail.style.setProperty('--flight-delay',delay+'ms');trail.style.setProperty('--flight-time',duration+'ms');
  for(let i=0;i<4;i++){const mote=document.createElement('i');mote.style.setProperty('--mote',i);trail.append(mote);}this.el.querySelector('.battle-fx-layer').append(trail);
 }
 nextMessage(){if(this.phase==='result')this.playback.advance();}
 finishResult(b){
  this.b=b;this.guards={};if(b.status==='active'){this.begin(b);return;}
  this.phase='outcome';this.message=b.status==='victory'?'精霊たちは落ち着いた。道を進もう。':'二人とも動けない……。もう一度、挑めます。';this.render();
 }
 key(e){if(this.phase==='busy')return;const k=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright','enter',' ','z','x','escape'].includes(k)){e.preventDefault();e.stopImmediatePropagation();}
  if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k)){const buttons=[...this.el.querySelectorAll('.classic-options button:not(:disabled)')],i=buttons.indexOf(document.activeElement),delta=['arrowup','arrowleft'].includes(k)?-1:1;buttons[(i+delta+buttons.length)%buttons.length]?.focus();}
  else if(['enter',' ','z'].includes(k)){if(this.el.contains(document.activeElement)&&document.activeElement.tagName==='BUTTON')document.activeElement.click();}
  else if(k==='x'||k==='escape')this.back();
 }
}
const api={CommandFlow,BattleUI,buildBeats,ResultPlayback,conditionList,headAnchor};if(typeof module!=='undefined')module.exports=api;root.OkaeriBattle=api;
})(globalThis);
