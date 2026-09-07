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
class BattleUI{
 constructor(el,callbacks){this.el=el;this.callbacks=callbacks;this.timer=null;this.phase='root';}
 begin(b){clearTimeout(this.timer);this.b=b;this.phase='root';this.flow=new CommandFlow(b.heroes);this.message=b.turn===1?b.enemies.map(e=>e.name).join(' と ')+'が あらわれた！':'どうする？';this.render();}
 button(label,fn,disabled=false,desc=''){const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled;b.className='classic-command';b.onclick=fn;b.onfocus=()=>{if(desc){const d=this.el.querySelector('.classic-description');if(d)d.textContent=desc;}};return b;}
 render(){
  const b=this.b,actor=this.flow.actor,forecast=OkaeriCore.intentions(b);
  this.el.className='battle-screen classic-battle';
  this.el.innerHTML='<div class="classic-status">'+Object.entries(b.heroes).map(([id,h])=>'<div data-hero="'+id+'" class="classic-window status-box '+(this.phase!=='root'&&this.phase!=='result'&&this.phase!=='outcome'&&actor===id?'active-hero':'')+'"><strong>'+nm(id)+'</strong><div>HP <b>'+h.hp+'</b> <small>/ '+h.max+'</small></div><div>MP <b>'+h.sp+'</b> <small>/ '+h.maxSp+'</small></div><span>'+(h.hp===0?'たおれている':h.chill?'冷え':h.buff?'灯りの剣':'灯守見習い')+'</span></div>').join('')+'<div class="classic-battle-info">第 '+(this.phase==='result'?b.turn-1:b.turn)+' ターン<br><span>息ぴったり '+('●'.repeat(b.gauge)+'○'.repeat(3-b.gauge))+'</span></div></div><div class="classic-arena">'+b.enemies.map((e,i)=>'<div data-enemy="'+i+'" class="classic-enemy '+(e.hp<=0?'fallen-enemy':'')+'">'+OkaeriWorld.enemySvg(e.type)+'<strong>'+e.name+(b.enemies.length>1?' '+String.fromCharCode(65+i):'')+'</strong><small>'+(e.ice?'氷の殻に おおわれている':e.broken?'体勢を くずしている':'')+'</small></div>').join('')+'</div><div class="classic-lower"><div class="classic-window classic-menu"><div class="classic-menu-title"></div><div class="classic-options"></div></div><div class="classic-window classic-text"><p class="classic-message" aria-live="polite"></p><div class="classic-forecast"></div><p class="classic-description"></p><div class="classic-text-actions"></div></div></div><div class="classic-help">↑ ↓ 選ぶ　Enter / Z 決定　Esc / X もどる</div>';
  const title=this.el.querySelector('.classic-menu-title'),options=this.el.querySelector('.classic-options'),message=this.el.querySelector('.classic-message'),tips=this.el.querySelector('.classic-forecast');
  message.textContent=this.message||'';
  if(!['result','outcome'].includes(this.phase))tips.innerHTML=forecast.filter(Boolean).map(f=>'<div>'+esc(f.label)+'</div>').join('');
  const add=(label,fn,disabled,desc)=>options.append(this.button(label,fn,disabled,desc));
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
   if(this.selected.target==='enemy')b.enemies.forEach((e,i)=>{if(e.hp>0)add(e.name+(b.enemies.length>1?' '+String.fromCharCode(65+i):''),()=>this.commit({skill:this.selected.id,target:i}));});
   else for(const [id,h] of Object.entries(b.heroes))add(nm(id)+'　HP '+h.hp,()=>this.commit({skill:this.selected.id,target:id}),h.hp<=0);
   add('もどる',()=>this.back());
  }else if(this.phase==='result'){
   title.textContent='戦闘中';add('つづける ▸',()=>this.nextMessage());tips.textContent='';
  }else if(this.phase==='outcome'){
   title.textContent=b.status==='victory'?'戦闘終了':'もう一度';tips.textContent='';
   if(b.status==='victory')add('冒険へもどる',()=>this.callbacks.onVictory());
   else{add('もう一度 挑む',()=>this.callbacks.onRetry());add('道へもどる',()=>this.callbacks.onEscape());}
  }
  const enabled=[...options.querySelectorAll('button:not(:disabled)')];if(enabled[0])enabled[0].focus({preventScroll:true});
 }
 selectSkill(id){this.selected=OkaeriCore.actions(this.flow.actor).find(a=>a.id===id);this.previous=this.phase;if(this.selected.target){this.phase='target';this.render();}else this.commit({skill:id});}
 commit(command){if(this.flow.choose(command)){this.phase='busy';this.callbacks.onTurn(this.flow.commands,false);}else{this.phase='actor';this.message='トウマの行動を決めた。\n'+nm(this.flow.actor)+'は どうする？';this.render();}}
 back(){if(this.phase==='target'){this.phase=this.previous;}else if(['skills','items'].includes(this.phase)){this.phase='actor';}else if(this.phase==='actor'){if(!this.flow.back()){this.flow=new CommandFlow(this.b.heroes);this.phase='root';}}else return;this.message=this.phase==='root'?'どうする？':nm(this.flow.actor)+'は どうする？';this.render();}
 showResult(b){clearTimeout(this.timer);this.outcome=b;this.b=b;this.messages=[...b.logs];this.messageIndex=0;this.phase='result';this.showMessage();}
 showMessage(){this.message=this.messages[this.messageIndex];const event=this.outcome.events?.[this.messageIndex];this.b=event?{...this.outcome,...event}:this.outcome;this.render();this.animate(event?.effect);this.timer=setTimeout(()=>this.nextMessage(),1250);}
 animate(effect){
  if(!effect)return;
  const target=this.el.querySelector(effect.hero?'[data-hero="'+effect.hero+'"]':'[data-enemy="'+effect.enemy+'"]');
  if(!target)return;
  target.classList.add('effect-target','effect-'+effect.type);
  if(effect.source!==undefined)this.el.querySelector('[data-enemy="'+effect.source+'"]')?.classList.add('enemy-lunge');
  const art=document.createElement('span');art.className='battle-effect';art.setAttribute('aria-hidden','true');
  for(let i=0;i<6;i++){const spark=document.createElement('i');spark.style.setProperty('--angle',(i*60)+'deg');art.append(spark);}
  target.append(art);
  if(effect.amount!==undefined){const number=document.createElement('span');number.className='battle-number';number.textContent=(effect.type==='heal'?'+':'')+effect.amount;number.setAttribute('aria-hidden','true');target.append(number);}
 }
 nextMessage(){if(this.phase!=='result')return;clearTimeout(this.timer);this.messageIndex++;if(this.messageIndex<this.messages.length){this.showMessage();return;}
  this.b=this.outcome;if(this.b.status==='active'){this.begin(this.b);return;}this.phase='outcome';this.message=this.b.status==='victory'?'敵は 落ち着きを取り戻した！\n二人は 無事に 道を進めそうだ。':'二人は 力尽きてしまった……。\n失うものはありません。もう一度 挑めます。';this.render();
 }
 key(e){if(this.phase==='busy')return;const k=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright','enter',' ','z','x','escape'].includes(k)){e.preventDefault();e.stopImmediatePropagation();}
  if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k)){const buttons=[...this.el.querySelectorAll('.classic-options button:not(:disabled)')],i=buttons.indexOf(document.activeElement),delta=['arrowup','arrowleft'].includes(k)?-1:1;buttons[(i+delta+buttons.length)%buttons.length]?.focus();}
  else if(['enter',' ','z'].includes(k)){if(this.el.contains(document.activeElement)&&document.activeElement.tagName==='BUTTON')document.activeElement.click();}
  else if(k==='x'||k==='escape')this.back();
 }
}
const api={CommandFlow,BattleUI};if(typeof module!=='undefined')module.exports=api;root.OkaeriBattle=api;
})(globalThis);
