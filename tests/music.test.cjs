const {test}=require('node:test');const assert=require('node:assert/strict');
const Music=require('../music.js');
const fake=src=>({src,volume:0,paused:true,async play(){this.paused=false;},pause(){this.paused=true;}});
test('battle transitions restore exploration without overlapping old music',async()=>{
 const m=new Music(fake,0);await m.select('journey');await m.play();m.tracks.journey.currentTime=18;
 await m.select('battle');assert.equal(m.tracks.journey.paused,true);assert.equal(m.tracks.battle.volume,.32);
 await m.select('journey');assert.equal(m.tracks.battle.paused,true);assert.equal(m.tracks.journey.currentTime,18);m.stop();
 await m.select('battle');assert.equal(m.tracks.battle.paused,true);await m.select('village');await m.play();assert.equal(m.tracks.village.volume,.32);m.stop();
});
test('opening and village use separate looping tracks, transitions stop the old track',async()=>{
 const m=new Music(fake,0);await m.play();assert.match(m.tracks.opening.src,/snowbound/);assert.equal(m.tracks.opening.volume,.32);
 await m.select('village');assert.equal(m.tracks.opening.paused,true);assert.equal(m.tracks.village.volume,.32);
 await m.select('opening');assert.equal(m.tracks.village.paused,true);m.stop();
});
test('muted scene changes stay silent and resume the selected track',async()=>{
 const m=new Music(fake,0);await m.select('village');assert.equal(m.tracks.village.paused,true);
 await m.play();m.stop();assert.equal(m.tracks.village.volume,0);await m.select('opening');
 assert.equal(m.enabled,false);await m.play();assert.equal(m.tracks.opening.paused,false);m.stop();
});
test('failed playback leaves all tracks stopped',async()=>{
 const m=new Music(fake,0);m.tracks.opening.play=async()=>{throw Error('blocked');};
 await assert.rejects(m.play());assert.equal(m.enabled,false);assert.equal(m.tracks.village.paused,true);
});
