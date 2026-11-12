const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../sprites.js');
test('standing uses middle frame; walking cycles both feet in every direction',()=>{
 assert.equal(S.frameIndex(false,999),1);
 assert.deepEqual([0,.16,.32,.48].map(t=>S.frameIndex(true,t)),[0,1,2,1]);
});
test('movement directions distinguish back, front, and both profiles',()=>{
 assert.equal(S.facing(0,-48,'down'),'up');assert.equal(S.facing(0,48,'up'),'down');
 assert.equal(S.facing(-48,0,'up'),'left');assert.equal(S.facing(48,0,'up'),'right');assert.equal(S.facing(0,0,'left'),'left');
});
test('green key removes backdrop but preserves teal coat and skin',()=>{
 assert.equal(S.isKey(0,255,0),true);assert.equal(S.isKey(15,230,18),true);
 assert.equal(S.isKey(44,98,105),false);assert.equal(S.isKey(222,181,144),false);assert.equal(S.isKey(153,78,52),false);
});

// 夜の光に使う灯りの記録は、背景を描き終えたら必ず止まる（止め忘れると、毎フレーム灯りが増え続ける）。
test('every exit of the background builder stops recording lights',()=>{
 const src=require('node:fs').readFileSync(require.resolve('../world.js'),'utf8'),assert=require('node:assert/strict');
 const body=src.slice(src.indexOf('Renderer.prototype.background='),src.indexOf('Renderer.prototype.draw='));
 // 出口はすべて finish() を通る。finish が記録を止め、仕上げを重ねてからキャッシュする。
 assert.match(body,/const finish=\(\)=>\{lightLog=null;smokeLog=null;/);
 assert.equal((body.match(/this\.cache\[scene\]=cv;return cv;/g)||[]).length,1,'only finish() may cache and return');
 assert.ok((body.match(/return finish\(\);/g)||[]).length>=3);
});
