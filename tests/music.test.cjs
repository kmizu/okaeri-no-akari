const {test}=require('node:test');const assert=require('node:assert/strict');
const Music=require('../music.js');
const fake=src=>({src,volume:0,paused:true,async play(){this.paused=false;},pause(){this.paused=true;}});
test('battle transitions restore exploration without overlapping old music',async()=>{
 const m=new Music(fake,0);await m.select('journey');await m.play();m.tracks.journey.currentTime=18;
 await m.select('battle');assert.equal(m.tracks.journey.paused,true);assert.equal(m.tracks.battle.volume,Music.level('battle'));
 await m.select('journey');assert.equal(m.tracks.battle.paused,true);assert.equal(m.tracks.journey.currentTime,18);m.stop();
 await m.select('battle');assert.equal(m.tracks.battle.paused,true);await m.select('village');await m.play();assert.equal(m.tracks.village.volume,Music.level('village'));m.stop();
});
test('opening and village use separate looping tracks, transitions stop the old track',async()=>{
 const m=new Music(fake,0);await m.play();assert.match(m.tracks.opening.src,/music\/title\.ogg/);assert.equal(m.tracks.opening.volume,Music.level('opening'));
 await m.select('village');assert.equal(m.tracks.opening.paused,true);assert.equal(m.tracks.village.volume,Music.level('village'));
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

test('lake and warm interiors have their own atmosphere cues',()=>{
 assert.equal(Music.sceneFor('lake'),'lake');assert.equal(Music.sceneFor('lakeside'),'lake');
 assert.equal(Music.sceneFor('lampworkshop'),'hearth');assert.equal(Music.sceneFor('house'),'hearth');
 assert.equal(Music.sceneFor('town'),'village');assert.equal(Music.sceneFor('forest'),'journey');
});
test('switching between the two cooperating characters keeps the musical phrase aligned',async()=>{
 const m=new Music(src=>({...fake(src),duration:80,currentTime:0}),0);
 await m.select('lake');await m.play();m.tracks.lake.currentTime=27.5;
 await m.select('hearth');assert.equal(m.tracks.hearth.currentTime,27.5);assert.equal(m.tracks.lake.paused,true);
 m.tracks.hearth.currentTime=41.2;await m.select('lake');assert.equal(m.tracks.lake.currentTime,41.2);
 assert.equal(m.tracks.hearth.paused,true);m.stop();
});

test('a story cue overrides the scene music and releasing it returns to the scene',async()=>{
 const m=new Music(fake,0);await m.select('journey');await m.play();
 await m.cue('tension');assert.equal(m.tracks.journey.paused,true);assert.equal(m.tracks.tension.volume,Music.level('tension'));
 await m.select('hearth');assert.equal(m.tracks.tension.paused,false,'scene changes wait behind the cue');assert.equal(m.tracks.hearth.paused,true);
 await m.cue(null);assert.equal(m.tracks.tension.paused,true);assert.equal(m.tracks.hearth.volume,Music.level('hearth'));
 await m.cue('silence');for(const a of Object.values(m.tracks))assert.equal(a.volume,0);
 await m.cue(null);assert.equal(m.tracks.hearth.paused,false);m.stop();
});
test('every track and jingle file exists, and muted cues stay silent',async()=>{
 const fs=require('node:fs'),path=require('node:path');
 const m=new Music(fake,0);for(const a of Object.values(m.tracks))assert.ok(fs.existsSync(path.join(__dirname,'..',a.src)),a.src);
 for(const j of ['jingle-lit','jingle-night'])assert.ok(fs.existsSync(path.join(__dirname,'..','assets','music',j+'.ogg')));
 await m.cue('tender');assert.equal(m.enabled,false);assert.equal(m.tracks.tender.paused,true);m.jingle('lit');assert.equal(m.one,undefined);
});
