(function(root){
'use strict';
// 効果音と環境音。録音素材は使わず、すべて WebAudio で合成する。
// 音がOFFの間、AudioContext を持たない環境（テスト）では何もしない。
let ctx=null,master=null,enabled=false,noiseBuffer=null,ambience=null,ambienceName=null,stepFlip=false,wanted=null;
function ready(){
 if(!enabled)return false;
 try{
  if(!ctx){const A=root.AudioContext||root.webkitAudioContext;if(!A)return false;ctx=new A();master=ctx.createGain();master.gain.value=.9;master.connect(ctx.destination);}
  if(ctx.state==='suspended')ctx.resume();return true;
 }catch{return false;}
}
function noise(){
 if(noiseBuffer)return noiseBuffer;const n=ctx.sampleRate*2,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);
 let last=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=w*.55+last*14;}
 return noiseBuffer=b;
}
function env(g,t,attack,peak,decay){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+attack+decay);}
function tone(freq,{type='sine',at=0,attack=.01,decay=.2,peak=.08,slide=0,out=master}={}){
 const t=ctx.currentTime+at,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);
 if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,freq*slide),t+attack+decay);
 env(g,t,attack,peak,decay);o.connect(g);g.connect(out);o.start(t);o.stop(t+attack+decay+.05);
}
function burst({at=0,attack=.005,decay=.12,peak=.1,type='bandpass',freq=1200,q=1,slide=0}={}){
 const t=ctx.currentTime+at,src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
 src.buffer=noise();src.loop=true;f.type=type;f.frequency.setValueAtTime(freq,t);f.Q.value=q;
 if(slide)f.frequency.exponentialRampToValueAtTime(Math.max(40,freq*slide),t+attack+decay);
 env(g,t,attack,peak,decay);src.connect(f);f.connect(g);g.connect(master);src.start(t,Math.random()*1.5);src.stop(t+attack+decay+.05);
}
const bell=(freq,peak=.07,at=0,decay=1.4)=>{for(const [m,a] of [[1,1],[2.01,.5],[2.99,.28],[4.2,.12]])tone(freq*m,{at,attack:.004,decay:decay/m,peak:peak*a});};
const sounds={
 // 文字送り。話す人で高さを変える。
 blipTouma(){tone(196+Math.random()*10,{type:'triangle',decay:.045,peak:.035});},
 blipNina(){tone(330+Math.random()*16,{type:'triangle',decay:.04,peak:.03});},
 blipOther(){tone(262+Math.random()*12,{type:'triangle',decay:.045,peak:.028});},
 confirm(){tone(660,{decay:.09,peak:.05});tone(990,{at:.06,decay:.14,peak:.045});},
 cancel(){tone(440,{decay:.1,peak:.045,slide:.7});},
 swap(){tone(392,{type:'triangle',decay:.08,peak:.05});tone(523,{type:'triangle',at:.07,decay:.12,peak:.05});},
 step(){stepFlip=!stepFlip;burst({decay:.09,peak:.035,freq:stepFlip?900:700,q:.7,slide:.5});},
 stepWood(){stepFlip=!stepFlip;tone(stepFlip?120:105,{type:'triangle',decay:.06,peak:.05,slide:.6});burst({decay:.03,peak:.012,freq:2400});},
 door(){tone(92,{type:'triangle',decay:.16,peak:.11,slide:.6});burst({decay:.07,peak:.04,freq:500,q:.5});tone(80,{type:'triangle',at:.22,decay:.14,peak:.07,slide:.6});},
 knock(){for(const at of [0,.16])tone(170,{type:'triangle',at,decay:.07,peak:.09,slide:.7});},
 chime(){bell(880,.06);bell(1318.5,.045,.18);bell(1760,.035,.36,1.8);},
 lit(){burst({decay:.5,peak:.04,type:'highpass',freq:2500});bell(659.3,.06,.05);bell(987.8,.05,.22);bell(1318.5,.045,.4,2.2);},
 bell(){bell(523.3,.08,0,2.2);},
 sparkle(){for(let i=0;i<5;i++)tone(1400+Math.random()*1600,{at:i*.06,decay:.18,peak:.028});},
 pop(){tone(520,{decay:.07,peak:.06,slide:1.6});},
 item(){for(const [f,at] of [[523.3,0],[659.3,.09],[784,.18],[1046.5,.27]])tone(f,{type:'triangle',at,decay:.22,peak:.05});},
 page(){burst({decay:.16,peak:.05,type:'highpass',freq:3000,slide:1.6});burst({at:.12,decay:.1,peak:.03,type:'highpass',freq:4200});},
 cup(){tone(1960,{decay:.25,peak:.03});tone(2940,{decay:.18,peak:.016});},
 fire(){for(let i=0;i<4;i++)burst({at:Math.random()*.5,decay:.025,peak:.07,type:'highpass',freq:1800+Math.random()*2500});},
 heart(){tone(64,{decay:.12,peak:.16,slide:.7});tone(58,{at:.2,decay:.14,peak:.11,slide:.7});},
 thud(){tone(70,{type:'triangle',decay:.22,peak:.2,slide:.5});burst({decay:.1,peak:.06,freq:300,q:.4});},
 crack(){burst({decay:.05,peak:.16,type:'highpass',freq:3200});burst({at:.04,decay:.3,peak:.09,freq:1400,q:2,slide:.3});tone(90,{type:'triangle',at:.02,decay:.3,peak:.14,slide:.5});},
 rush(){burst({attack:.5,decay:1.6,peak:.14,type:'lowpass',freq:500,slide:3});burst({attack:.3,decay:1.2,peak:.05,type:'highpass',freq:2600});},
 splash(){burst({decay:.5,peak:.11,type:'bandpass',freq:1800,q:.6,slide:.3});},
 gust(){burst({attack:.6,decay:1.4,peak:.09,type:'bandpass',freq:500,q:1.2,slide:1.8});},
 whistle(){for(const at of [0,.42]){const t=ctx.currentTime+at,o=ctx.createOscillator(),g=ctx.createGain(),l=ctx.createOscillator(),lg=ctx.createGain();o.frequency.value=2090;l.frequency.value=28;lg.gain.value=45;l.connect(lg);lg.connect(o.frequency);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+.03);g.gain.setValueAtTime(.07,t+.24);g.gain.exponentialRampToValueAtTime(.0001,t+.32);o.connect(g);g.connect(master);o.start(t);l.start(t);o.stop(t+.36);l.stop(t+.36);burst({at,decay:.3,peak:.012,type:'highpass',freq:5000});}},
 flare(){burst({attack:.05,decay:.5,peak:.08,type:'bandpass',freq:900,q:.8,slide:2.4});tone(440,{at:.05,decay:.5,peak:.03,slide:1.5});},
 sew(){burst({decay:.05,peak:.025,type:'highpass',freq:5200});},
 hit(){burst({decay:.09,peak:.12,freq:1100,q:.6,slide:.4});tone(150,{type:'triangle',decay:.1,peak:.09,slide:.5});},
 cheer(){for(let i=0;i<7;i++)tone(700+Math.random()*900,{type:'triangle',at:i*.05+Math.random()*.04,decay:.16,peak:.022});}
};
// 環境音: [フィルタ種別, 周波数, Q, 音量, ゆらぎの速さ, ゆらぎの深さ]
const beds={
 hearth:[['lowpass',420,.4,.05,.31,.4],['bandpass',2600,3,.006,.9,.9]],
 wind:[['bandpass',420,.9,.045,.13,.7],['bandpass',900,1.4,.012,.21,.9]],
 blizzard:[['bandpass',520,.8,.13,.22,.6],['bandpass',1500,1.2,.05,.37,.8],['lowpass',160,.5,.09,.09,.5]],
 water:[['bandpass',1300,.7,.045,.5,.3],['lowpass',300,.4,.04,.2,.4]],
 flood:[['bandpass',900,.5,.13,.7,.4],['lowpass',260,.5,.12,.3,.5]],
 night:[['bandpass',300,.8,.022,.08,.8]],
 crowd:[['bandpass',700,.9,.03,.6,.6],['bandpass',1500,1.5,.014,1.1,.8]]
};
function stopAmbience(fade=.8){
 if(!ambience)return;const a=ambience;ambience=null;ambienceName=null;
 try{a.gain.gain.cancelScheduledValues(ctx.currentTime);a.gain.gain.setValueAtTime(a.gain.gain.value,ctx.currentTime);a.gain.gain.linearRampToValueAtTime(0,ctx.currentTime+fade);}catch{}
 clearInterval(a.timer);setTimeout(()=>{for(const n of a.nodes)try{n.stop();}catch{}},fade*1000+80);
}
function ambient(name){
 wanted=name&&beds[name]?name:null;
 if(!enabled||!ready()||wanted===ambienceName)return;
 stopAmbience();if(!wanted)return;
 const gain=ctx.createGain();gain.gain.setValueAtTime(0,ctx.currentTime);gain.gain.linearRampToValueAtTime(1,ctx.currentTime+1.2);gain.connect(master);
 const nodes=[];
 for(const [type,freq,q,level,rate,depth] of beds[wanted]){
  const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain(),l=ctx.createOscillator(),lg=ctx.createGain();
  src.buffer=noise();src.loop=true;f.type=type;f.frequency.value=freq;f.Q.value=q;g.gain.value=level;
  l.frequency.value=rate;lg.gain.value=level*depth;l.connect(lg);lg.connect(g.gain);
  src.connect(f);f.connect(g);g.connect(gain);src.start(0,Math.random()*1.5);l.start();nodes.push(src,l);
 }
 const timer=wanted==='hearth'?setInterval(()=>{if(enabled&&Math.random()<.6)sounds.fire();},1700):null;
 ambience={gain,nodes,timer};ambienceName=wanted;
}
const api={
 get enabled(){return enabled;},
 enable(on){enabled=!!on;if(!enabled){if(ctx){stopAmbience(.2);try{ctx.suspend();}catch{}}return;}if(ready())ambient(wanted);},
 play(name){if(!sounds[name]||!ready())return;try{sounds[name]();}catch{}},
 ambient,
 names:Object.keys(sounds),beds:Object.keys(beds)
};
root.OkaeriSfx=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
