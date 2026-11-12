(function(root){
'use strict';
const shots=[
 {view:'snow',label:'雪に閉ざされた土地',text:'山あいの町ユキネには、長い冬がある。\n人の通う道も、一晩の雪で姿を変える。',duration:7500},
 {view:'lights',label:'町へ続く灯り',text:'だから人々は、道の曲がり角や家の窓に、\n小さな灯りをともしてきた。',duration:6500},
 {view:'lights',label:'帰り灯',text:'仕事へ出た人が、帰り道を見失わないように。\n待つ人のいる場所が、遠くからでも分かるように。',duration:7500},
 {view:'pair',label:'トウマとニナ',text:'その灯りを守る、トウマとニナ。\n幼馴染の二人は、町の空き家を直して、一緒に暮らしている。',duration:8000},
 {view:'promise',label:'いつもの帰り道',text:'トウマ「帰ったら、何食べようか。\n灯台まで歩いたら、きっと腹が減るな」',duration:7000},
 {view:'promise',label:'帰ってからの楽しみ',text:'ニナ「昨日のスープ、残してあるよ。\n帰り道にも、楽しみなことがあるといいでしょ」',duration:7500},
 {view:'home',label:'二人の帰る場所',text:'遠くへ行く日も、いつもの道を歩く日も。\n一日の終わりには、二人であの家へ。',duration:7000},
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
