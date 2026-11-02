const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(__dirname,'../../index.html')+'');await p.waitForTimeout(900);
const w=process.argv[2]||'gira',secs=+(process.argv[3]||240);
const r=await p.evaluate(([w,secs,kite])=>{const process_kite=kite;sel.mode='horde';sel.weapon=w;startGame();player.setWeapon(w);paused=true;const H=window.__horde.state();let th=0,maxOn=0,steps=0,waves=[],gTot=0;const t0=performance.now();
  for(let i=0;i<Math.round(secs/DT);i++){if(!player.alive)break;th+=9*DT;const b=player.body;
    // «человек»: крутит курсор вокруг себя и понемногу отходит от толпы к центру карты
    let mx=0,my=0,mn=0;for(const m of H.mons){const d=Math.hypot(m.x-b.x,m.y-b.y);if(d<500){mx+=m.x;my+=m.y;mn++}}
    let kx=(AW/2-b.x)*0.03,ky=(AH/2-b.y)*0.03;if(mn&&process_kite){mx/=mn;my/=mn;const dx=b.x-mx,dy=b.y-my,d=Math.hypot(dx,dy)||1;const kk=player.hp<55?40:12;kx+=dx/d*kk;ky+=dy/d*kk}if(H.boss&&player.hp>=55){const bx=H.boss.x-b.x,by=H.boss.y-b.y,bd=Math.hypot(bx,by)||1;if(bd>140){kx+=bx/bd*35;ky+=by/bd*35}}
    aim.x=b.x+Math.cos(th)*110+kx;aim.y=b.y+Math.sin(th)*110+ky;locked=true;
    const gr=H.mons.filter(m=>m.grab).length;if(gr>=2&&player.dashCd<=0)keys.dash=true;
    const w0=H.wave;if(H.mons.some(m=>m.grab))gTot++;step();steps++;maxOn=Math.max(maxOn,H.mons.length);if(H.wave!==w0)waves.push([H.wave,Math.round(i*DT),Math.round(player.hp)])}
  return{wave:H.wave,kills:H.kills,bestCombo:H.bestCombo,bestHit:Math.round(H.bestHit),alive:player.alive,hp:Math.round(player.hp),maxOn,msPerStep:+((performance.now()-t0)/steps).toFixed(3),simSec:Math.round(steps*DT),waves,dmgBy:H.dmgBy,grabbedFrac:Math.round(100*gTot/steps),boss:H.boss?[Math.round(H.boss.hp),Math.round(H.boss.maxHp)]:null,left:H.mons.length+H.queue.length}},[w,secs,process.argv[4]!=='0']);
console.log(JSON.stringify(r));console.log(errs.join('\n')||'no errors');await b.close()})();
