// 台本（script/*.js）をつないで episodes-data.js を作る。
//   node tools/build-script.cjs          … 作り直す
//   node tools/build-script.cjs --check  … 作り直した結果と今のファイルが同じか確かめる（違えば終了コード1）
// script/ の各ファイルは、一つの関数の中で順につながる「続きもの」。並び順は script/ORDER.txt。
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),dir=path.join(root,'script'),target=path.join(root,'episodes-data.js');
function build(){
 const order=fs.readFileSync(path.join(dir,'ORDER.txt'),'utf8').split('\n').map(s=>s.trim()).filter(Boolean);
 const extra=fs.readdirSync(dir).filter(f=>f.endsWith('.js')&&!order.includes(f));
 if(extra.length)throw Error('script/ORDER.txt に載っていない台本があります: '+extra.join(', '));
 return "// このファイルは生成物です。台本は script/ のファイルを直して、node tools/build-script.cjs で作り直してください。\n(function(root){\n'use strict';\n"
  +order.map(f=>'// ---- script/'+f+'\n'+fs.readFileSync(path.join(dir,f),'utf8')).join('')+'})(globalThis);\n';
}
if(require.main===module){
 const out=build();
 if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==out){console.error('episodes-data.js が script/ と合っていません。node tools/build-script.cjs を実行してください。');process.exit(1);}console.log('ok');}
 else{fs.writeFileSync(target,out);console.log('episodes-data.js',out.length,'文字');}
}
module.exports={build,target};
