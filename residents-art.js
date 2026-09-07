(function(root){
'use strict';const frames={};
const ready=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{try{
 for(const [row,id] of ['elna','orlf'].entries()){
  const w=Math.floor(img.width/3),h=Math.floor(img.height/2),cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');c.drawImage(img,4,row*h+4,w-8,h-8,4,4,w-8,h-8);
  const pixels=c.getImageData(0,0,w,h),d=pixels.data;let l=w,r=0,top=h,bottom=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(d[i]>70&&d[i+2]>70&&d[i]>d[i+1]+35&&d[i+2]>d[i+1]+35)d[i+3]=0;if(d[i+3]){l=Math.min(l,x);r=Math.max(r,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
  c.putImageData(pixels,0,0);const f=document.createElement('canvas');f.width=r-l+1;f.height=bottom-top+1;f.getContext('2d').drawImage(cv,l,top,f.width,f.height,0,0,f.width,f.height);frames[id]=f;
 }resolve();}catch(e){reject(e);}};img.onerror=()=>reject(Error('住人の画像を読み込めませんでした'));img.src=root.OkaeriResidentsImage;});
function drawMap(c,id,x,y){const f=frames[id];if(!f)return;const h=76,w=f.width/f.height*h;c.save();c.fillStyle='#29475940';c.beginPath();c.ellipse(x,y+8,20,5,0,0,Math.PI*2);c.fill();c.drawImage(f,x-w/2,y+11-h,w,h);c.restore();}
root.OkaeriResidentsArt={ready,drawMap};
})(globalThis);
