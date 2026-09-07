(function(root){
'use strict';
const frames={},rows=['down','left','right','up'];
function frameIndex(moving,time){return moving?[0,1,2,1][Math.floor(time/.16)%4]:1;}
function facing(dx,dy,previous='down'){if(Math.abs(dx)<.6&&Math.abs(dy)<.6)return previous;return Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');}
function isKey(r,g,b){return g>90&&g>r+40&&g>b+40;}
function load(){return new Promise((resolve,reject)=>{
 const img=new Image();img.onload=()=>{try{
  const source=document.createElement('canvas');source.width=img.width;source.height=img.height;const sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(img,0,0);
  const pixels=sc.getImageData(0,0,img.width,img.height),d=pixels.data;
  for(let i=0;i<d.length;i+=4)if(isKey(d[i],d[i+1],d[i+2]))d[i+3]=0;
  sc.putImageData(pixels,0,0);
  // The generated atlas has deliberately measured cell separators, not guessed uniform tiles.
  const xs=[100,326,546,771,998,1217,1437],ys=[0,269,511,749,1011];
  for(let row=0;row<4;row++)for(let col=0;col<6;col++){
   let minX=xs[col+1],maxX=xs[col],minY=ys[row+1],maxY=ys[row];
   for(let y=ys[row];y<ys[row+1];y++)for(let x=xs[col];x<xs[col+1];x++)if(d[(y*img.width+x)*4+3]>0){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
   if(maxX<minX)throw Error('歩行画像の読み込みに失敗しました');
   const tile=document.createElement('canvas');tile.width=maxX-minX+1;tile.height=maxY-minY+1;tile.getContext('2d').drawImage(source,minX,minY,tile.width,tile.height,0,0,tile.width,tile.height);
   frames[(col<3?'touma':'nina')+'-'+rows[row]+'-'+col%3]=tile;
  }
  resolve();
 }catch(e){reject(e);}};img.onerror=()=>reject(Error('歩行画像を読み込めませんでした'));img.src=root.OkaeriWalkImage;
});}
function draw(c,x,y,id,dir,moving,time){
 const tile=frames[id+'-'+dir+'-'+frameIndex(moving,time)];if(!tile)return false;
 c.save();c.fillStyle='#29475944';c.beginPath();c.ellipse(x,y+9,16,6,0,0,Math.PI*2);c.fill();
 const scale=.32,w=tile.width*scale,h=tile.height*scale;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(tile,x-w/2,y+11-h,w,h);c.restore();return true;
}
const api={frameIndex,facing,isKey,load,draw};if(typeof module!=='undefined')module.exports=api;root.OkaeriSprites=api;
})(globalThis);
