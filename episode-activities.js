(function(root){
'use strict';
const tasks={
 '4:2':{title:'お礼に、何を添えよう',hint:'いつものお茶に、小さなお礼を一つ。どちらにも二人の思い出が残ります。',key:'gift',intro:[['マロ','いつものお茶は包んでおくよ。お礼に添えるなら、酸っぱい茶葉と、木の栞もあるね。'],['nina','栞は、トウマの本に似合いそう。お茶なら、一緒に飲めるね。'],['touma','ニナの好きな味も、覚えておきたい。']],options:[
 {label:'酸味のあるお茶を選ぶ',value:'tea',lines:[['','二人は茶葉の香りを順番に確かめた。トウマが小さくうなずく。'],['touma','これ、初めて飲む香りだ。'],['nina','帰ってから、一緒に覚えよう。'],['マロ','じゃあ焼き菓子も。味見の時間は、ゆっくりね。']]},
 {label:'本に挟む青い栞を選ぶ',value:'bookmark',lines:[['','ニナは木の栞を光にかざした。青い糸の端が、トウマの手袋と同じ色をしている。'],['nina','読み終わったら、次に私に貸して。栞もそのままで。'],['touma','じゃあ、感想も書いて挟んでおく。'],['マロ','本が二人の間を往復するんだね。いい贈り物だ。']]}
 ]},
 '5:1':{title:'右へ寄るそりを直そう',hint:'左右の滑り木を見比べると、右だけ内側へ曲がっています。座席と縄はしっかり留まっています。',key:'sled',intro:[['','そりを裏返すと、右の滑り木が内側へ曲がっていた。'],['touma','縄を引かなくても、これじゃ右に寄るな。'],['nina','左の木と並べて見よう。どこを直せばいい？']],options:[
 {label:'左の縄を短くして引っぱる',lines:[['touma','縄で引き戻すと、ずっと片手に力が要る。'],['nina','子どもが一人で乗っても、真っすぐ滑るようにしたいね。'],['','二人はもう一度、裏側の木を見比べた。']]},
 {label:'左右の滑り木を平行にそろえる',value:'aligned',lines:[['','ニナが左の木に糸を沿わせ、トウマが右の留め具を緩める。二本が平行になるところで締め直した。'],['nina','糸の間、同じ広さになった。'],['touma','俺が押すから、何も乗せずに試そう。'],['','そりは短い雪道を、真っすぐ滑った。'] ]}
 ],afterOriginal:true},
 '7:3':{title:'窓辺の冷気を止めよう',hint:'窓枠の下に細い隙間。手元には乾いた木片、布、釘があります。窓は春にも開けて使います。',key:'window',intro:[['','窓辺に置いた紙が、小さく揺れている。トウマは窓枠の下を指でなぞった。'],['touma','ここだけ隙間がある。開け閉めできるまま、ふさぎたい。'],['nina','鉢もここに置くから、冷えないようにしてあげよう。']],options:[
 {label:'隙間に合わせた木片と布を詰める',value:'sealed',lines:[['','トウマが削った木片に、ニナが薄く布を巻く。少しずつ隙間へ押し込み、二人で窓を開け閉めした。'],['nina','動く。紙も、揺れなくなったね。'],['touma','春まで、ここで育てられる。']]},
 {label:'窓ごと釘で固定する',lines:[['nina','風は止まりそう。でも、春に窓を開けられなくなるね。'],['touma','枠は動くまま、隙間だけふさごう。']]}
 ],afterOriginal:true},
 '8:1':{title:'吹雪の中で、合図を選ぶ',hint:'板は支えられていますが、ニナからは結び目が見えません。出発前に決めた「二度の笛」は、待つ合図。',key:'signal',intro:[['','風よけに雪が打ちつける。トウマが板を支え、ニナが縄に手を伸ばす。'],['nina','……見えない。結び目、ちゃんと確かめたい。']],options:[
 {label:'二度笛を吹き、小屋の陰で待つ',value:'waited',lines:[['','ニナの笛に、トウマがすぐうなずく。二人は板を仮留めして、小屋の陰へ下がった。'],['touma','俺も手が冷えてきた。休もう。']]},
 {label:'手探りで、先に縄を通す',lines:[['','ニナは縄を通しかけて、手を止めた。留め具を指で確かめられない。'],['nina','ごめん。今はできない。'],['touma','謝らなくていい。さっき決めた合図、使おう。']]}
 ],afterOriginal:3}
};
const labels={gift:{tea:'二人で選んだ酸味のあるお茶',bookmark:'二人の本を行き来する青い栞'},sled:{aligned:'糸を目印にそろえた、そりの滑り木'},window:{sealed:'二人で冷気を止めた家の窓'},signal:{waited:'吹雪の中で守った、二度の笛の約束'},ritsuReturn:{read:'点検帳の、空いた欄：三人の名前'},yuraRounds:{read:'薬袋に入らないもの：隣に座る休憩'},unsentLetter:{read:'出さない手紙：春に取りつける玄関灯'},stormThanks:{read:'帰る人の、手荷物：町から届いた温かさ'}};
function task(s){return tasks[s.episode.chapter+':'+s.episode.step];}
function notes(s){return Object.entries(s.memories||{}).map(([k,v])=>labels[k]?.[v]).filter(Boolean);}
function closing(s,lines){if(!s.memories?.gift)return lines;const extra=s.memories.gift==='bookmark'?[['','食卓の本には青い栞が挟んである。トウマが残した感想の下に、ニナが一行書き足した。'],['nina','次は私の番。読み終わったら、感想も返すね。']]:[['','酸味のあるお茶が、二つのカップで湯気を立てている。トウマはもう砂糖の量を聞かずに、ニナの分を淹れられた。'],['nina','あの日、一緒に選んでよかったね。']];return [...lines.slice(0,-1),...extra,...lines.slice(-1)];}
function run(a,event,done){const t=task(a.state);if(!t)return false;
 const show=()=>a.openModal('<span class="tag">二人で考える</span><h2>'+t.title+'</h2><p>'+t.hint+'</p>',[...t.options.map(o=>[o.label,()=>{a.closeModal();const original=event.lines.slice(typeof t.afterOriginal==='number'?t.afterOriginal:0);const lines=o.value&&t.afterOriginal?[...o.lines,...original]:o.lines;a.talk(lines,()=>{if(!o.value){show();return;}a.state.memories={...a.state.memories,[t.key]:o.value};done();});}]),['あとで考える',a.closeModal]],'explore');
 a.talk(t.intro,show);return true;
}
root.OkaeriActivities={task,notes,closing,run};
})(globalThis);
