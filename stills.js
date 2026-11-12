(function(root){
'use strict';
// イベントスチル。台詞のきっかけ {still:'chapter-03'} で表示し、一度見た絵はタイトルの「思い出の絵」から見返せる。
// 見た記録は保存データとは別に持つ（章選択や「はじめから」で消えないように）。
const KEY='okaeri-stills-v1';
const list=[
 ['chapter-01','第1話　ふたりで灯りをともす'],['chapter-02','第2話　小箱の二つの石'],['chapter-03','第3話　岸へ帰ってきたニナ'],
 ['chapter-04','第4話　三日ぶりの仲直り'],['chapter-05','第5話　三人乗りのそり'],['chapter-06','第6話　白い石を鞄に'],
 ['chapter-07','第7話　この家の二脚の椅子'],['chapter-08','第8話　温め草と帰り灯'],['chapter-09','第9話　三人の帰り結び'],
 ['chapter-10','第10話　選んだ翌朝'],
 ['ending-touma','結末　トウマから告白'],['ending-nina','結末　ニナから告白'],['ending-friends','結末　名前はまだつけない'],
 ['ending-koharu','結末　三人で仲良く'],['ending-both','結末　三人とも大事にする']
].map(([id,title])=>({id,title,src:'assets/stills/web/'+id+'.webp',thumb:'assets/stills/web/'+id+'-thumb.webp'}));
const byId=Object.fromEntries(list.map(s=>[s.id,s]));
function seen(){try{const v=JSON.parse(root.localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(id=>byId[id]):[];}catch{return [];}}
function mark(id){if(!byId[id])return;const s=seen();if(s.includes(id))return;s.push(id);try{root.localStorage.setItem(KEY,JSON.stringify(s));}catch{}}
let current=null;
function layer(){return root.document?.getElementById('still');}
function show(id){
 const el=layer();if(!el)return;
 if(!id||!byId[id]){hide();return;}
 if(current===id)return;current=id;mark(id);
 el.style.backgroundImage='url("'+byId[id].src+'")';el.setAttribute('aria-label',byId[id].title);el.hidden=false;
 el.className='still';if(root.requestAnimationFrame)root.requestAnimationFrame(()=>{if(current===id)el.className='still is-shown';});else el.className='still is-shown';
}
function hide(){const el=layer();current=null;if(!el||el.hidden)return;el.className='still';root.setTimeout(()=>{if(!current)el.hidden=true;},700);}
// 鑑賞。open は game.js のモーダルを借りる。
function gallery(openModal,closeModal){
 const have=seen(),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const cards=list.map(s=>have.includes(s.id)
  ?'<button type="button" class="still-card" data-still="'+s.id+'"><img src="'+s.thumb+'" alt="" loading="lazy"><span>'+esc(s.title)+'</span></button>'
  :'<div class="still-card is-locked"><i>？</i><span>'+esc(s.title.split('　')[0])+'</span></div>').join('');
 openModal('<span class="tag">思い出の絵</span><h2>'+have.length+' / '+list.length+' 枚</h2><p>物語の中で一度見た絵を、ここで見返せます。絵を選ぶと大きく表示します。</p><div class="still-grid">'+cards+'</div>',[['閉じる',closeModal,true]],'title');
 const doc=root.document,grid=doc.querySelector?.('.still-grid');if(!grid)return;
 grid.addEventListener('click',e=>{const b=e.target.closest('[data-still]');if(!b)return;view(b.dataset.still);});
}
function view(id){
 const doc=root.document,s=byId[id];if(!s)return;
 const v=doc.createElement('div');v.className='still-viewer';v.setAttribute('role','dialog');v.setAttribute('aria-label',s.title);
 v.innerHTML='<img src="'+s.src+'" alt="'+s.title+'"><p>'+s.title+'</p><button type="button">閉じる</button>';
 const close=()=>{v.remove();doc.removeEventListener('keydown',key,true);};const key=e=>{if(e.key==='Escape'){e.stopPropagation();close();}};
 v.addEventListener('click',close);doc.addEventListener('keydown',key,true);doc.getElementById('stage').append(v);v.querySelector('button').focus();
}
// 人物紹介。背景を切り替えて、立ち絵と名前を大きく見せる。台詞のきっかけ {intro:'koharu'} で出し、{intro:null} か会話の終わりで消える。
const people={
 touma:{name:'トウマ',kana:'TOUMA',role:'灯守 ・ 木と金具の修理',bust:['assets/faces.png','300% 200%','0% 0%'],notes:['二十歳。ニナの幼馴染で、同じ家に暮らしている','口数は少ないが、手は先に動く','腰の剣は、火の番を守るためのもの。まだ一度も、本気で抜いたことはない']},
 nina:{name:'ニナ',kana:'NINA',role:'灯守 ・ 火を扱う「灯術」',bust:['assets/faces.png','300% 200%','0% 100%'],notes:['二十歳。トウマの幼馴染で、同じ家に暮らしている','よく喋り、よく食べ、よくからかう','平気なふりが上手。ばれているのは、たぶん一人だけ']},
 koharu:{name:'コハル',kana:'KOHARU',role:'薬草屋の見習い',img:'assets/koharu-town-cut.png',notes:['十八歳。トウマとニナの二つ年下の妹分','子どもの頃から、二人のあとをついて歩いてきた','かじかんだ指を戻す「温め草」を、いつも籠に入れている']}};
let card=null;
function intro(id){
 const doc=root.document,stage=doc?.getElementById('stage');if(!stage||!stage.append)return;
 if(!id||!people[id]){if(card){const c=card;card=null;c.className='intro-card';root.setTimeout(()=>c.remove(),600);}return;}
 if(card)card.remove();const p=people[id];
 card=doc.createElement('div');card.className='intro-card';card.dataset.who=id;card.setAttribute('aria-label',p.name+'の紹介');
 card.innerHTML=(p.bust?'<div class="intro-bust" style="background-image:url('+p.bust[0]+');background-size:'+p.bust[1]+';background-position:'+p.bust[2]+'"></div>':'<img src="'+p.img+'" alt="">')+'<div class="intro-text"><small>'+p.kana+'</small><strong>'+p.name+'</strong><em>'+p.role+'</em><ul>'+p.notes.map(n=>'<li>'+n+'</li>').join('')+'</ul></div>';
 stage.insertBefore(card,doc.getElementById('hud'));const mine=card;
 (root.requestAnimationFrame||(f=>f()))(()=>{if(card===mine)mine.className='intro-card is-shown';});
}
root.OkaeriStills={intro,people,list,seen,mark,show,hide,gallery,view,get current(){return current;}};
if(typeof module!=='undefined')module.exports=root.OkaeriStills;
})(typeof globalThis!=='undefined'?globalThis:this);
