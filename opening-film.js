(function(root){
'use strict';
const shots=[
 {view:'snow',label:'雪に閉ざされた土地',text:'山あいの町ユキネは、一年の半分を雪の中で過ごす。\n道は一晩で消える。昨日の足跡も、朝には残らない。',duration:7500},
 {view:'lights',label:'町へ続く灯り',text:'だからこの町の人は、道の曲がり角ごとに灯りを置いた。\n雪の夜でも、家の方角だけは分かるように。',duration:7000},
 {view:'lights',label:'帰り灯',text:'人はそれを「帰り灯」と呼ぶ。\nともすのは、出ていく人のため。消すのは、最後に帰った人の役目。',duration:7500},
 {view:'pair',label:'トウマとニナ',text:'その灯りの番をするのが、灯守（ひもり）。\nトウマとニナは、去年ようやく一人前になった。',duration:7500},
 {view:'promise',label:'いつもの朝',text:'トウマ「帰ったら、何食う」\nニナ「まだ出かけてもないよ」',duration:6000},
 {view:'promise',label:'帰る理由',text:'ニナ「ゆうべのスープ、半分残してあるの。\n帰る理由は、多い方がいいでしょ」',duration:7000},
 {view:'home',label:'二人の帰る場所',text:'幼馴染のふたりは、町はずれの古い家を直して暮らしている。\n恋人ではない。たぶん、まだ。',duration:7500},
 {view:'title',label:'おかえりの灯',text:'きみと灯して、ふたりで帰ろう。',title:'おかえりの灯',duration:8500}
];
class OpeningFilm {
 static shots=shots;
 constructor(){this.active=false;this.paused=false;this.timer=null;}
 play(done){
  this.stopTimer();this.active=true;this.paused=false;this.index=0;this.done=done;
  document.getElementById('openingFilm').hidden=false;
  document.getElementById('nextOpening').onclick=()=>this.next();
  document.getElementById('skipOpening').onclick=()=>this.finish();
  document.getElementById('pauseOpening').onclick=()=>this.togglePause();
  this.show();document.getElementById('nextOpening').focus({preventScroll:true});
 }
 stopTimer(){clearTimeout(this.timer);this.timer=null;}
 show(){
  this.stopTimer();const shot=shots[this.index],$=id=>document.getElementById(id);
  $('openingFilm').setAttribute('data-view',shot.view);$('openingFilm').setAttribute('data-beat',this.index%2);
  $('filmScene').textContent=shot.label;$('filmText').textContent=shot.text;
  $('filmTitle').textContent=shot.title||'';$('filmTitle').hidden=!shot.title;
  $('filmCount').textContent=String(this.index+1).padStart(2,'0')+' / '+String(shots.length).padStart(2,'0');
  $('nextOpening').textContent=shot.title?'物語をはじめる →':'次へ →';
  $('pauseOpening').textContent=this.paused?'自動送りを再開':'一時停止';
  $('pauseOpening').setAttribute('aria-pressed',String(this.paused));
  if(!this.paused)this.timer=setTimeout(()=>this.next(),shot.duration);
 }
 next(){if(!this.active)return;if(this.index+1<shots.length){this.index++;this.show();}else this.finish();}
 togglePause(){if(!this.active)return;this.paused=!this.paused;this.show();}
 finish(){
  if(!this.active)return;this.active=false;this.stopTimer();document.getElementById('openingFilm').hidden=true;
  const done=this.done;this.done=null;if(done)done();
 }
}
root.OkaeriOpeningFilm=OpeningFilm;
})(globalThis);
