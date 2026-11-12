(function(root){
'use strict';
// おかえりの灯・描画エンジン。
// 絵を「図形の積み重ね」ではなくベクター（SVG）で組み立てる：曲線の輪郭、グラデーション、ぼかした影、
// 乱流ノイズによる木目・布目・漆喰のむら、乗算／スクリーン合成の光。
// 組み立てた絵は一度だけラスタライズしてスプライトにし、ゲーム側は drawImage するだけ。
const n=v=>Math.round(v*100)/100;
const rng=seed=>{let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
const mix=(a,b,t)=>{const x=hex(a),y=hex(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('');};
const dark=(c,t=.2)=>mix(c,'#1c0e05',t),lite=(c,t=.2)=>mix(c,'#fff6e0',t);
const at=o=>{if(!o)return '';if(typeof o==='string')return ' '+o;return Object.entries(o).map(([k,v])=>v==null?'':` ${k}="${v}"`).join('');};

// ---- 基本図形
const rect=(x,y,w,h,fill,rx=0,a)=>`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rx?` rx="${rx}"`:''} fill="${fill}"${at(a)}/>`;
const ell=(cx,cy,rx,ry,fill,a)=>`<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}"${at(a)}/>`;
const path=(d,fill,a)=>`<path d="${d}" fill="${fill}"${at(a)}/>`;
const stroke=(d,color,w=1,a)=>`<path d="${d}"${at({fill:'none',stroke:color,'stroke-width':w,'stroke-linecap':'round','stroke-linejoin':'round',...(a||{})})}/>`;
const line=(x1,y1,x2,y2,color,w=1,a)=>stroke(`M${n(x1)},${n(y1)}L${n(x2)},${n(y2)}`,color,w,a);
const g=(body,a)=>`<g${at(a)}>${body}</g>`;
const text=(x,y,s,size,fill,a)=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="middle" font-family="'Yu Gothic UI','Hiragino Sans','Noto Sans JP',sans-serif" font-weight="700"${at(a)}>${s}</text>`;

// ---- 素材。乱流ノイズを色つきの筋にして、形の内側だけに重ねる。
function grain(id,freq,oct,seed,rgb,k,b){return `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}" result="t"/><feColorMatrix in="t" values="0 0 0 0 ${rgb[0]}  0 0 0 0 ${rgb[1]}  0 0 0 0 ${rgb[2]}  ${k} 0 0 0 ${b}" result="c"/><feComposite in="c" in2="SourceAlpha" operator="in" result="m"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="m"/></feMerge></filter>`;}
const blur=(id,s)=>`<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${s}"/></filter>`;
const DEFS=`<defs>
${grain('woodH','.006 .22',4,7,[.27,.15,.06],-1.5,.84)}${grain('woodH2','.008 .25',4,23,[.27,.15,.06],-1.5,.82)}${grain('woodV','.22 .006',4,11,[.27,.15,.06],-1.5,.84)}
${grain('cloth','.8 .8',2,5,[.10,.06,.04],-.8,.44)}${grain('plaster','.03 .045',3,9,[.42,.30,.16],-.8,.47)}${grain('stone','.09 .12',3,13,[.08,.08,.09],-1.1,.66)}${grain('iron','.5 .5',2,17,[1,1,1],-.9,.5)}
${blur('b1',1)}${blur('b2',2)}${blur('b4',4)}${blur('b8',8)}${blur('b16',16)}${blur('b30',30)}
<linearGradient id="fsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2d8" stop-opacity=".10"/><stop offset=".5" stop-color="#1c0e05" stop-opacity=".08"/><stop offset="1" stop-color="#1c0e05" stop-opacity=".42"/></linearGradient>
<linearGradient id="tsh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6e0" stop-opacity=".22"/><stop offset="1" stop-color="#1c0e05" stop-opacity=".10"/></linearGradient>
<linearGradient id="cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".28" stop-color="#fff" stop-opacity=".30"/><stop offset=".55" stop-color="#000" stop-opacity=".02"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
<radialGradient id="ball" cx=".34" cy=".28" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#1c0e05" stop-opacity=".42"/></radialGradient>
<linearGradient id="pleat" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="9" y2="0" spreadMethod="repeat"><stop offset="0" stop-color="#1c0e05" stop-opacity=".30"/><stop offset=".45" stop-color="#fff" stop-opacity=".20"/><stop offset="1" stop-color="#1c0e05" stop-opacity=".30"/></linearGradient>
<linearGradient id="fold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c0e05" stop-opacity=".30"/><stop offset=".18" stop-color="#fff" stop-opacity=".12"/><stop offset=".8" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#1c0e05" stop-opacity=".34"/></linearGradient>
<linearGradient id="drop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c0e05" stop-opacity=".5"/><stop offset="1" stop-color="#1c0e05" stop-opacity="0"/></linearGradient>
<linearGradient id="dropR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c0e05" stop-opacity=".42"/><stop offset="1" stop-color="#1c0e05" stop-opacity="0"/></linearGradient>
<radialGradient id="fire" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#fff3b8"/><stop offset=".4" stop-color="#ffab45"/><stop offset="1" stop-color="#a5311a"/></radialGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".35" stop-color="#fff" stop-opacity=".05"/><stop offset=".7" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>`;
const WOOD={h:'woodH',h2:'woodH2',v:'woodV'};
const wood=(body,dir='h')=>g(body,{filter:`url(#${WOOD[dir]||dir})`});
const cloth=body=>g(body,{filter:'url(#cloth)'});
const plaster=body=>g(body,{filter:'url(#plaster)'});
const stone=body=>g(body,{filter:'url(#stone)'});

// ---- 影と光
const shadow=(x,y,w,h,o=.45,b='b4')=>rect(x,y,w,h,'#1c0e05',Math.min(w,h)/2,{opacity:o,filter:`url(#${b})`});
const contact=(cx,cy,rx,ry,o=.45,b='b4')=>ell(cx,cy,rx,ry,'#1c0e05',{opacity:o,filter:`url(#${b})`});
let uid=0;
function light(cx,cy,r,color,o=.5,mode='screen',ry=r){const id='lg'+(uid++);return `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${o}"/><stop offset=".55" stop-color="${color}" stop-opacity="${n(o*.35)}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`+ell(cx,cy,r,ry,`url(#${id})`,{style:`mix-blend-mode:${mode}`});}
const sheen=(x,y,w,h,rx=0)=>rect(x,y,w,h,'url(#fsh)',rx);

// ---- 立体。斜め上から見下ろす：上の面（奥行き d）と手前の面（高さ h）。
function box(x,y,w,d,h,top,front,o={}){
 const rx=o.rx??2,dir=o.grain||'h';
 const faces=rect(x,y+d,w,h,front,rx)+rect(x,y,w,d+1,top,rx);
 return (o.shadow===false?'':shadow(x+5,y+d+h-9,w+9,17,.5))
  +(o.grain===false?faces:wood(faces,dir))
  +rect(x,y+d,w,h,'url(#fsh)',rx)+rect(x,y,w,d,'url(#tsh)',rx)
  +rect(x+1,y+d-.7,w-2,1.5,'#fff3d6',0,{opacity:.45})+rect(x+1,y+.3,w-2,1,'#fff3d6',0,{opacity:.25})
  +rect(x+1,y+d+h-1.6,w-2,1.6,'#1c0e05',0,{opacity:.5});
}
// 円柱（縦）。色＋左右の陰影。
const cyl=(x,y,w,h,color,rx=2)=>rect(x,y,w,h,color,rx)+rect(x,y,w,h,'url(#cyl)',rx);
// 球・丸いもの。
const ball=(cx,cy,rx,ry,color)=>ell(cx,cy,rx,ry,color)+ell(cx,cy,rx,ry,'url(#ball)');
// 引き出し（手前の面に彫り込み＋つまみ）
const drawer=(x,y,w,h,knob='#e3c489')=>rect(x,y,w,h,'#1c0e05',2,{opacity:.22})+rect(x+1,y+1.2,w-2,h-2,'#fff3d6',1.5,{opacity:.10})+ball(x+w/2,y+h/2,2.3,2.3,knob);

// ---- 文書とスプライト
const doc=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${DEFS}${body}</svg>`;
const sprites={};let pending=0,failed=false,missed=0;
// name: 呼び名。 box:[minX,minY,w,h]（基準点からの相対座標）。 body: 基準点を原点にした SVG。
function define(name,box,body,res=1){
 const [mx,my,w,h]=box,s=sprites[name]={x:mx,y:my,w,h,res,svg:doc(w*res,h*res,g(body,{transform:`scale(${res}) translate(${-mx},${-my})`})),canvas:null};
 if(typeof Image==='undefined'||typeof document==='undefined'||!document.createElement){failed=true;return s;}
 pending++;const img=new Image();
 img.onload=()=>{try{const cv=document.createElement('canvas');cv.width=w*res;cv.height=h*res;cv.getContext('2d').drawImage(img,0,0,w*res,h*res);s.canvas=cv;}catch(e){failed=true;}pending--;};
 img.onerror=()=>{failed=true;pending--;};
 img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s.svg);
 return s;
}
const has=name=>!!sprites[name]?.canvas;
function draw(c,name,x,y,scale=1){const s=sprites[name];if(!s?.canvas)return false;
 if(scale===1&&s.res===1)c.drawImage(s.canvas,Math.round(x+s.x),Math.round(y+s.y));else c.drawImage(s.canvas,x+s.x*scale,y+s.y*scale,s.w*scale,s.h*scale);return true;}
// 必要になったときに登録する絵。まだ描けなければ false を返し、missed を進める（呼び出し側は従来の絵で埋めて、あとで描き直す）。
function want(name,box,make,res=1){if(failed)return false;if(!sprites[name])define(name,box,make(),res);if(sprites[name].canvas)return true;missed++;return false;}
root.OkaeriDraw={rect,ell,path,stroke,line,g,text,wood,cloth,plaster,stone,shadow,contact,light,sheen,box,cyl,ball,drawer,doc,define,draw,has,sprites,want,missed:()=>missed,
 rng,mix,dark,lite,n,ready:()=>!failed&&pending===0,failed:()=>failed};
})(globalThis);
