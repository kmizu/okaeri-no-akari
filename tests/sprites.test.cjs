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
