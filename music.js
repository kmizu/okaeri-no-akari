(function(root){
'use strict';
class Music {
 constructor(make=src=>new Audio(src),fadeMs=1200){
  this.tracks={opening:make('assets/snowbound-promise.wav'),village:make('assets/winter-hearth.wav'),journey:make('assets/snowpath-duet.wav'),battle:make('assets/lantern-step.wav')};
  for(const a of Object.values(this.tracks)){a.loop=true;a.preload='metadata';a.volume=0;}
  this.scene='opening';this.enabled=false;this.revision=0;this.fadeMs=fadeMs;
 }
 stop(){this.enabled=false;this.revision++;clearInterval(this.timer);for(const a of Object.values(this.tracks)){a.pause();a.volume=0;}}
 async select(scene){const changed=this.scene!==scene;this.scene=scene;if(this.enabled&&changed)await this.play();}
 async play(){
  this.enabled=true;const revision=++this.revision;clearInterval(this.timer);
  const target=this.tracks[this.scene];
  try{await target.play();}catch(error){if(revision===this.revision)this.stop();throw error;}
  if(revision!==this.revision){if(!this.enabled||target!==this.tracks[this.scene])target.pause();return;}
  const starts=Object.values(this.tracks).map(a=>[a,a.volume]);const start=Date.now();
  const tick=()=>{const p=this.fadeMs?Math.min(1,(Date.now()-start)/this.fadeMs):1;
   for(const [a,v] of starts)a.volume=v+((a===target?.32:0)-v)*p;
   if(p===1){clearInterval(this.timer);for(const [a] of starts)if(a!==target)a.pause();}
  };this.timer=setInterval(tick,30);tick();
 }
}
root.OkaeriMusic=Music;if(typeof module!=='undefined')module.exports=Music;
})(typeof globalThis!=='undefined'?globalThis:this);
