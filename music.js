(function(root){
'use strict';
class Music {
 static sceneFor(scene){return ['lake','lakeside'].includes(scene)?'lake':['house','lampworkshop'].includes(scene)?'hearth':scene==='town'?'village':'journey';}
 constructor(make=src=>new Audio(src),fadeMs=1200){
  this.tracks={opening:make('assets/snowbound-promise.wav'),village:make('assets/winter-hearth.wav'),journey:make('assets/snowpath-duet.wav'),battle:make('assets/lantern-step.wav'),lake:make('assets/lake-letters.ogg'),hearth:make('assets/beside-the-same-light.ogg')};
  for(const a of Object.values(this.tracks)){a.loop=true;a.preload='metadata';a.volume=0;}
  this.scene='opening';this.enabled=false;this.revision=0;this.fadeMs=fadeMs;
 }
 stop(){this.enabled=false;this.revision++;clearInterval(this.timer);for(const a of Object.values(this.tracks)){a.pause();a.volume=0;}}
 async select(scene){const previous=this.scene,changed=previous!==scene;this.scene=scene;if(this.enabled&&changed)await this.play(previous);}
 async play(previousScene){
  this.enabled=true;const revision=++this.revision;clearInterval(this.timer);
  const target=this.tracks[this.scene];
  try{await target.play();}catch(error){if(revision===this.revision)this.stop();throw error;}
  if(revision!==this.revision){if(!this.enabled||target!==this.tracks[this.scene])target.pause();return;}
  const previous=this.tracks[previousScene];
  if(previous&&!previous.paused&&['lake','hearth'].includes(previousScene)&&['lake','hearth'].includes(this.scene)&&Number.isFinite(target.duration)&&target.duration>0)target.currentTime=previous.currentTime%target.duration;
  const starts=Object.values(this.tracks).map(a=>[a,a.volume]);const start=Date.now();
  const tick=()=>{const p=this.fadeMs?Math.min(1,(Date.now()-start)/this.fadeMs):1;
   for(const [a,v] of starts)a.volume=v+((a===target?.32:0)-v)*p;
   if(p===1){clearInterval(this.timer);for(const [a] of starts)if(a!==target)a.pause();}
  };this.timer=setInterval(tick,30);tick();
 }
}
root.OkaeriMusic=Music;if(typeof module!=='undefined')module.exports=Music;
})(typeof globalThis!=='undefined'?globalThis:this);
