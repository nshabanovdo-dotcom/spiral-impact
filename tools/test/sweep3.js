const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+require('path').resolve(__dirname,'../../index.html')+'');await p.waitForTimeout(800);
const combos=JSON.parse(process.argv[2]);const diff=+(process.argv[3]||1);
const r=await p.evaluate(([combos,diff])=>{const out=[];const W=['gira','shar','sekira','zarya','ametist'];
 for(const c of combos){for(const k in c)window[k]=c[k];let tot=0,kills=0,n=0;
  for(const w of W)for(let rep=0;rep<3;rep++){sel.mode='duel';sel.diff=diff;startGame();paused=true;const bot=fighters.find(f=>f.kind==='bot');bot.setWeapon(w);bot.ai.style=rep%2?'aggr':'care';
   let t=20;for(let i=0;i<Math.round(20/DT);i++){player.ax=player.ay=0;aim.x=player.body.x;aim.y=player.body.y;step();if(player.deaths>0){t=i*DT;kills++;break}}
   tot+=t;n++}
  out.push([JSON.stringify(c),+(tot/n).toFixed(1),kills+'/'+n])}return out},[combos,diff]);
for(const x of r)console.log(JSON.stringify(x));console.log(errs.join('\n')||'no errors');await b.close()})();
