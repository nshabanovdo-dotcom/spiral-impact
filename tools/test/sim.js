// Ускоренная симуляция боя: node sim.js mode diff seconds [playerIdle]
const {chromium}=require('playwright');
(async()=>{const[,,mode='team',diff='1',secs='60',idle='1']=process.argv;const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../../index.html')+'');await p.waitForTimeout(800);
const r=await p.evaluate(([mode,diff,secs,idle])=>{sel.mode=mode;sel.diff=+diff;startGame();paused=true;
  let kills=0;const ok=kill;window.__k=0;
  const N=Math.round(+secs/DT);let firstPlayerDeath=null;
  for(let i=0;i<N;i++){if(+idle){player.ax=player.ay=0;aim.x=player.body.x;aim.y=player.body.y}step();
    if(firstPlayerDeath===null&&player.deaths>0)firstPlayerDeath=i*DT}
  const k=fighters.reduce((s,f)=>s+f.kills,0);
  return{kills:k,perMin:k/(+secs/60),score,firstPlayerDeath,playerDeaths:player.deaths}},[mode,diff,secs,idle]);
console.log(JSON.stringify(r));console.log(errs.join('\n')||'no errors');await b.close()})();
