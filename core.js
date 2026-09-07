(function(root){
'use strict';
const skills={
 touma:[{id:'attack',name:'斬る',cost:0,desc:'一体に20ダメージ。',target:'enemy'},{id:'break',name:'崩し斬り',cost:2,desc:'14ダメージ。次の一撃が1.5倍に。',target:'enemy'},{id:'protect',name:'かばう',cost:0,desc:'ニナへの単体攻撃を引き受け、半減。'},{id:'counter',name:'灯返し',cost:2,desc:'防御し、攻撃を受けると24で反撃。'},{id:'cheer',name:'励ます',cost:2,desc:'ニナを27回復。冷えも解除。'}],
 nina:[{id:'attack',name:'灯杖で打つ',cost:0,desc:'一体に14ダメージ。',target:'enemy'},{id:'fire',name:'火花',cost:2,desc:'氷殻を溶かし、22ダメージ。',target:'enemy'},{id:'ring',name:'灯の輪',cost:3,desc:'敵全体に14ダメージ。'},{id:'heal',name:'ぬくもり',cost:2,desc:'味方一人のHPを45％回復。冷え解除。',target:'ally'},{id:'buff',name:'灯を託す',cost:2,desc:'トウマの次の一撃を1.5倍に。氷殻も溶かす。'}]
};
const common=[{id:'guard',name:'防御',cost:0,desc:'このターン受けるダメージを半減。'},{id:'rescue',name:'手を貸す',cost:0,desc:'倒れた相手をHP30％で起こす。'},{id:'herb',name:'薬草',cost:0,desc:'味方一人のHPを45回復。冷えも解除。',target:'ally'}];
const clone=x=>JSON.parse(JSON.stringify(x));
const enemy=(name,hp,type,ice=false)=>({name,hp,max:hp,type,ice,broken:0});
function newBattle(kind){
 const groups={mochi:[enemy('こごえモチ',38,'mochi'),enemy('こごえモチ',38,'mochi')],crab:[enemy('こおりヤドカリ',65,'crab',true)],guardian:[enemy('枝角の番人',230,'guardian')]};
 if(!groups[kind])throw Error('Unknown encounter');
 return {kind,turn:1,gauge:0,items:3,status:'active',logs:[],enemies:groups[kind],heroes:{touma:{name:'トウマ',hp:120,max:120,sp:6,maxSp:6,chill:0,buff:0},nina:{name:'ニナ',hp:90,max:90,sp:8,maxSp:8,chill:0,buff:0}}};
}
function intentions(b){return b.enemies.map((e,i)=>{
 if(e.hp<=0)return null;
 if(e.type==='guardian'){
  const phase=(b.turn-1)%3;
  return phase===0?{target:'touma',damage:18,label:'枝の腕 → トウマ 18'}:phase===1?{target:'nina',damage:32,label:'大きな踏み込み → ニナ 32'}:{target:'all',damage:16,label:'木の葉の嵐 → 二人に16'};
 }
 if(e.type==='crab')return {target:b.turn%2?'touma':'nina',damage:16,chill:true,label:'冷たいしぶき → '+(b.turn%2?'トウマ':'ニナ')+' 16・冷え'};
 const target=(b.turn+i)%2?'touma':'nina';return {target,damage:12,label:'ぽよん体当たり → '+(target==='touma'?'トウマ':'ニナ')+' 12'};
});}
function actions(actor){return [...skills[actor],...common];}
function resolveTurn(input,commands,order){
 if(input.status!=='active')throw Error('戦闘は終了しています');
 if(!Array.isArray(order)||order.length!==2||new Set(order).size!==2||!order.every(x=>x==='touma'||x==='nina'))throw Error('行動順が不正です');
 if(commands.team){if(commands.team!=='flare'||input.gauge<3||Object.values(input.heroes).some(h=>h.hp<=0))throw Error('連携には二人と灯り三つが必要です');}
 else for(const id of order){
  const h=input.heroes[id];if(h.hp<=0)continue;
  const a=actions(id).find(a=>a.id===commands[id]?.skill);if(!a)throw Error('技を選んでください');
  if(h.sp<a.cost)throw Error('SPが足りません');
  if(a.target==='enemy'&&(!Number.isInteger(commands[id].target)||!input.enemies[commands[id].target]||input.enemies[commands[id].target].hp<=0))throw Error('相手を選んでください');
  if(a.target==='ally'&&!['touma','nina'].includes(commands[id].target))throw Error('味方を選んでください');
  if(a.id==='rescue'&&input.heroes[id==='touma'?'nina':'touma'].hp>0)throw Error('二人とも立っています');
 }
 if(!commands.team&&order.filter(id=>input.heroes[id].hp>0&&commands[id]?.skill==='herb').length>(input.items||0))throw Error('薬草が足りません');
 const b=clone(input),forecast=intentions(b),log=b.logs=[];let cooperation=false,protect=false;
 const events=[]; delete b.events; function emit(message,effect=null){log.push(message);events.push({message,effect,heroes:clone(b.heroes),enemies:clone(b.enemies),gauge:b.gauge,items:b.items});}
 const defending=new Set(),counters=new Set(),fallen=new Set(order.filter(id=>b.heroes[id].hp<=0));
 function hit(e,n,fire=false,who,style='slash'){
  if(e.hp<=0)return;
  if(fire&&e.ice){e.ice=false;emit(e.name+'の氷殻が溶けた！');}
  if(e.broken){n*=1.5;e.broken=0;if(who==='nina')cooperation=true;}
  if(e.ice)n*=.5;
  n=Math.round(n);e.hp=Math.max(0,e.hp-n);emit(e.name+'に '+n+'。'+(e.hp===0?'落ち着きを取り戻した。':''),{type:who==='team'?'team':fire?'fire':style,enemy:b.enemies.indexOf(e),amount:n});
 }
 function heal(id,amount){const h=b.heroes[id];if(h.hp<=0){emit('倒れている相手には「手を貸す」を使おう。');return;}const before=h.hp;cooperation ||=h.hp<h.max||h.chill>0;h.hp=Math.min(h.max,h.hp+amount);h.chill=0;emit(h.name+'のHPが '+(h.hp-before)+' 回復。',{type:'heal',hero:id,amount:h.hp-before});}
 if(commands.team){b.gauge=0;emit('「合わせるぞ！」「うん！」── 灯火の一閃！');hit(b.enemies.find(e=>e.hp>0),75,true,'team');}
 else for(const id of order){
  if(fallen.has(id))continue;
  const h=b.heroes[id],c=commands[id],a=actions(id).find(a=>a.id===c.skill),other=id==='touma'?'nina':'touma';h.sp-=a.cost;
  emit(h.name+'の「'+a.name+'」。',['protect','guard','counter'].includes(c.skill)?{type:'shield',hero:id}:null);
  let e=b.enemies[c.target];if(a.target==='enemy'&&e?.hp<=0)e=b.enemies.find(e=>e.hp>0);
  const power=n=>n*(h.chill?0.75:1)*(h.buff?1.5:1);
  if(['attack','break','fire'].includes(c.skill)&&e){const buff=h.buff>0;hit(e,power(c.skill==='fire'?22:c.skill==='break'?14:id==='touma'?20:14),c.skill==='fire'||buff,id);h.buff=0;if(buff)cooperation=true;if(c.skill==='break'&&e.hp>0)e.broken=2;}
  if(c.skill==='ring')for(const foe of b.enemies)hit(foe,power(14),false,id,'ring');
  if(c.skill==='protect')protect=true;
  if(c.skill==='guard'||c.skill==='counter')defending.add(id);
  if(c.skill==='counter')counters.add(id);
  if(c.skill==='heal')heal(c.target,Math.round(b.heroes[c.target].max*.45));
  if(c.skill==='herb'){b.items--;heal(c.target,45);}
  if(c.skill==='cheer')heal('nina',27);
  if(c.skill==='buff'){b.heroes.touma.buff=2;emit('トウマの剣に灯りが宿った。',{type:'heal',hero:'touma'});}
  if(c.skill==='rescue'){b.heroes[other].hp=Math.round(b.heroes[other].max*.3);emit('「大丈夫。手、貸して」── '+b.heroes[other].name+'が立ち上がった。',{type:'heal',hero:other,amount:b.heroes[other].hp});}
 }
 if(b.enemies.every(e=>e.hp<=0))b.status='victory';
 else for(let i=0;i<b.enemies.length;i++){
  const e=b.enemies[i],f=forecast[i];if(e.hp<=0||!f)continue;
  for(let target of f.target==='all'?['touma','nina']:[f.target]){
   if(b.heroes[target].hp<=0){if(f.target==='all')continue;target=target==='touma'?'nina':'touma';}
   let covered=false;if(target==='nina'&&protect&&b.heroes.touma.hp>0&&f.target!=='all'){target='touma';covered=true;cooperation=true;}
   const h=b.heroes[target];let n=Math.round(f.damage*((covered||defending.has(target))?.5:1));h.hp=Math.max(0,h.hp-n);if(f.chill)h.chill=3;
   emit((covered?'トウマがニナをかばった！ ':'')+h.name+'に '+n+' ダメージ。',{type:'hurt',hero:target,source:i,amount:n,covered});
   if(counters.has(target)&&h.hp>0){hit(e,24,false,target);counters.delete(target);}
  }
 }
 if(cooperation)b.gauge=Math.min(3,b.gauge+1);
 for(const h of Object.values(b.heroes)){h.chill=Math.max(0,h.chill-1);h.buff=Math.max(0,h.buff-1);}
 for(const e of b.enemies)e.broken=Math.max(0,e.broken-1);
 if(Object.values(b.heroes).every(h=>h.hp<=0))b.status='defeat';else if(b.enemies.every(e=>e.hp<=0))b.status='victory';
 if(cooperation)emit('二人の息が合った。灯りが一つ、ともった。');
 b.events=events;b.turn++;return b;
}
function restoreSave(raw){try{
 const s=JSON.parse(raw);if(!s||s.version!==1||!['town','forest','canal','hill','house'].includes(s.scene)||!Number.isFinite(s.x)||!Number.isFinite(s.y)||s.x<1||s.x>22||s.y<2||s.y>14||!['touma','nina'].includes(s.lead)||!s.flags||typeof s.flags!=='object'||Array.isArray(s.flags))return null;
 const flags={};for(const key of ['board','bread','mochi','log','rest','repair','crab','guardian','lit','returned','lamp','sae','gift','canalStarted','waterGate','canalCrab','waterFlow','waterLit','canalRest','waterReturned','hillStarted','windbreak','hillGuardian','hillLens','hillLit','hillRest','festivalStarted','festivalMeal','festivalRibbon','endingTouma','endingNina','endingFriends','sewingAsked','sewingFound','sewingReturned','seamVisible','signAsked','signFixed','signReported','waitingPost','waitingLit','waitingRest','waitingReported','nightOne','nightTwo','nightThree','nightTouma','nightNina','nightFriends'])flags[key]=s.flags[key]===true;
 if((flags.lit&&!flags.guardian)||(flags.guardian&&!flags.repair)||(flags.repair&&!flags.log)||(flags.log&&!flags.mochi)||(s.scene==='forest'&&!flags.board))return null;
 if((s.scene==='canal'&&(!flags.canalStarted||!flags.returned||!flags.lit))||(flags.waterGate&&!flags.canalStarted)||(flags.canalCrab&&!flags.waterGate)||(flags.waterFlow&&!flags.canalCrab)||(flags.waterLit&&!flags.waterFlow)||(flags.waterReturned&&!flags.waterLit))return null;
 if((s.scene==='hill'&&!flags.hillStarted)||(flags.hillStarted&&!flags.waterReturned)||(flags.windbreak&&!flags.hillStarted)||(flags.hillGuardian&&!flags.windbreak)||(flags.hillLens&&!flags.hillGuardian)||(flags.hillLit&&!flags.hillLens)||(flags.festivalStarted&&!flags.hillLit)||((flags.festivalMeal||flags.festivalRibbon)&&!flags.festivalStarted))return null;
 if((flags.waitingLit&&!flags.waitingPost)||(flags.waitingReported&&!flags.waitingLit))return null;
 if((flags.sewingReturned&&!flags.sewingFound)||(flags.seamVisible&&!flags.sewingReturned)||(flags.signReported&&!flags.signFixed))return null;
 const endings=['endingTouma','endingNina','endingFriends'].filter(k=>flags[k]);if(endings.length>1||(endings.length&&(!flags.festivalMeal||!flags.festivalRibbon)))return null;
 const nightRequirements={one:'returned',two:'waterReturned',three:'festivalStarted',touma:'endingTouma',nina:'endingNina',friends:'endingFriends'};
 if(s.scene==='house'&&(s.x<3||s.x>20||s.y<3||s.y>13))return null;
 for(const [key,requirement] of Object.entries(nightRequirements))if(flags['night'+key[0].toUpperCase()+key.slice(1)]&&!flags[requirement])return null;
 if(s.pendingEvening&&(!nightRequirements[s.pendingEvening]||!flags[nightRequirements[s.pendingEvening]]||s.scene!=='house'))return null;
 return {...(s.pendingEvening?{pendingEvening:s.pendingEvening}:{}),version:1,scene:s.scene,x:s.x,y:s.y,lead:s.lead,flags,courage:Math.max(0,Math.min(3,Number(s.courage)||0))};
 }catch{return null;}}
function chooseEnding(choice,courage,response){if(choice==='confess')return 'touma';if(choice==='stay')return 'friends';if(choice==='wait'){if(courage<2)return 'ask';return response==='yes'?'nina':response==='notYet'?'friends':'confession';}return 'friends';}
const C={newBattle,actions,resolveTurn,intentions,restoreSave,chooseEnding};if(typeof module!=='undefined')module.exports=C;root.OkaeriCore=C;
})(globalThis);
