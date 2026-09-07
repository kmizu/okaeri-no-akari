(function(root){
'use strict';
const frames={},urls={};
const specs={sae:{rect:[0,0,500,490],height:76},maro:{rect:[500,0,500,490],height:76},mochi:{rect:[1000,0,536,490],height:43},crab:{rect:[0,490,500,534],height:48},guardian:{rect:[500,490,500,534],height:108}};
function isKey(r,g,b){return r>140&&b>140&&r>g+80&&b>g+80;}
const ready=new Promise((resolve,reject)=>{
 const img=new Image();img.onload=()=>{try{
  const source=document.createElement('canvas');source.width=img.width;source.height=img.height;const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,img.width,img.height),d=pixels.data;
  for(let i=0;i<d.length;i+=4)if(isKey(d[i],d[i+1],d[i+2]))d[i+3]=0;
  ctx.putImageData(pixels,0,0);
  for(const [id,spec] of Object.entries(specs)){
   const [x0,y0,w,h]=spec.rect;let left=x0+w,right=x0,top=y0+h,bottom=y0;
   for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)if(d[(y*img.width+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(right<left)throw Error('人物・敵画像の読み込みに失敗しました');
   const frame=document.createElement('canvas');frame.width=right-left+1;frame.height=bottom-top+1;frame.getContext('2d').drawImage(source,left,top,frame.width,frame.height,0,0,frame.width,frame.height);frames[id]=frame;urls[id]=frame.toDataURL('image/png');
  }resolve();
 }catch(err){reject(err);}};img.onerror=()=>reject(Error('人物・敵画像を読み込めませんでした'));img.src=root.OkaeriCastImage;
});
function drawMap(c,id,x,y,t=0){const frame=frames[id];if(!frame)return;const h=specs[id].height,w=frame.width/frame.height*h;const bounce=id==='mochi'?Math.sin(t*2.8)*2:0;
 c.save();c.fillStyle='#29475940';c.beginPath();c.ellipse(x,y+8,id==='guardian'?30:Math.min(22,w*.35),id==='guardian'?8:5,0,0,Math.PI*2);c.fill();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(frame,x-w/2,y+11-h+bounce,w,h);c.restore();
}
function battleArt(id){return urls[id]?'<img class="enemy-art enemy-art-'+id+'" src="'+urls[id]+'" alt="" draggable="false">':'';}
root.OkaeriCast={ready,drawMap,battleArt};
})(globalThis);
