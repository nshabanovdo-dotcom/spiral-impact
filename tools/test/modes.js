// Проверка всех режимов: ошибки консоли + скриншоты. node modes.js [extraQuery]
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];const q=process.argv[2]||'';
const modes=process.argv[3]?process.argv[3].split(','):['train','bag','duel','team','horde'];
for(const m of modes){const p=await b.newPage({viewport:{width:1280,height:800}});
  p.on('pageerror',e=>errs.push(m+': '+e.message));p.on('console',x=>{if(x.type()==='error')errs.push(m+': '+x.text())});
  await p.goto('file://'+require('path').resolve(__dirname,'../../index.html')+''+q);await p.waitForTimeout(900);
  if(m==='bag'){await p.click('#armoryBtn');await p.waitForTimeout(200);await p.click('#aBag')}
  else{await p.evaluate(m=>{sel.mode=m},m);await p.evaluate(()=>document.getElementById('start').click())}
  for(let i=0;i<120;i++){await p.mouse.move(640+Math.cos(i*0.45)*160,400+Math.sin(i*0.45)*160);await p.waitForTimeout(25)}
  await p.screenshot({path:'mode_'+m+'.png'});
  const info=await p.evaluate(()=>({score,fighters:fighters.length,alive:fighters.filter(f=>f.alive).length}));console.log(m,JSON.stringify(info));
  await p.close()}
console.log(errs.length?'ERRORS:\n'+errs.join('\n'):'no errors');await b.close()})();
