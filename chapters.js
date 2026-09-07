(function(root){
const forest=['board','mochi','log','repair','crab','guardian','lit','returned'];
const canal=['canalStarted','waterGate','canalCrab','waterFlow','waterLit','waterReturned'];
const hill=['hillStarted','windbreak','hillGuardian','hillLens','hillLit'];
function create(id){
 if(![1,2,3,4].includes(id))throw Error('Unknown chapter');
 const flags={};for(const k of [...(id>1?forest:[]),...(id>2?canal:[]),...(id>3?hill:[])])flags[k]=true;
 return {version:1,scene:'town',x:12,y:10,lead:'touma',flags,courage:0};
}
root.OkaeriChapters={create};if(typeof module!=='undefined')module.exports=root.OkaeriChapters;
})(globalThis);
