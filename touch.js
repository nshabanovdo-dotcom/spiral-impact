'use strict';
// Spiral Impact — управление на телефоне и планшете.
// Палец водит морду так же, как мышь: ведёте пальцем — морда летит следом, крутите пальцем круги — оружие раскручивается.
// Кнопки справа: рывок, способность (✦), огонь (для посоха). Слоты оружия внизу — нажимаются. Пауза — кнопка ❚❚.
// Включается само на сенсорных экранах; на компьютере можно проверить ссылкой с ?touch.
(function(){
const TOUCH=matchMedia('(pointer: coarse)').matches||/[?&]touch\b/.test(location.search);
window.TOUCH=TOUCH;
if(!TOUCH)return;

// интерфейс мельче на маленьком экране, а мир крупнее, чем на компьютере
window.uiScale=()=>clamp(Math.min(innerWidth/1000,innerHeight/500),0.6,1);
window.zoomMul=(prev=>()=>{const base=clamp(Math.min(VW/1600,VH/1000),0.4,1.4);return(prev?prev():1)*Math.max(1,(VH/620)/base)})(window.zoomMul);
resize();

lockPointer=function(){};
const _show=showMenu,_hide=hideMenu;
showMenu=function(){_show();locked=false;mouse.down=false};
hideMenu=function(){_hide();locked=true};

const css=document.createElement('style');css.textContent=`
#tui{position:fixed;inset:0;pointer-events:none;z-index:3;display:none}
#tui .tb{position:absolute;pointer-events:auto;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;
  background:rgba(20,14,28,.5);border:2px solid rgba(212,178,106,.65);color:#f2ead6;font:600 12px "Segoe UI",Arial,sans-serif;
  touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;text-shadow:0 1px 2px #000;box-shadow:0 0 14px rgba(0,0,0,.6)}
#tui .tb.on{background:rgba(212,178,106,.35)}
#tui .tb b{font-size:22px;line-height:1;color:inherit}
#tDash{right:max(18px,env(safe-area-inset-right));bottom:22px;width:92px;height:92px}
#tAbil{right:calc(max(18px,env(safe-area-inset-right)) + 104px);bottom:30px;width:72px;height:72px}
#tFire{right:calc(max(18px,env(safe-area-inset-right)) + 12px);bottom:128px;width:68px;height:68px;border-color:rgba(255,138,42,.8)}
#tMenu{right:max(8px,env(safe-area-inset-right));top:8px;width:42px;height:42px;font-size:15px}
#rot{position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;flex-direction:column;background:rgba(5,3,8,.94);color:#e9d8ae;font:18px Georgia,serif;text-align:center;padding:20px}
#rot b{font-size:46px;display:block;margin-bottom:12px}
`;document.head.appendChild(css);
const ui=document.createElement('div');ui.id='tui';
ui.innerHTML='<div class="tb" id="tDash"><b>➤</b>Рывок</div><div class="tb" id="tAbil"><b>✦</b><span id="tAbilT"></span></div><div class="tb" id="tFire"><b>✹</b>Огонь</div><div class="tb" id="tMenu">❚❚</div>';
document.body.appendChild(ui);
const rot=document.createElement('div');rot.id='rot';rot.innerHTML='<div><b>⟲</b>Поверните телефон горизонтально</div>';document.body.appendChild(rot);
const $=id=>document.getElementById(id);
function btn(id,down,up){const el=$(id);
  el.addEventListener('pointerdown',e=>{e.preventDefault();el.classList.add('on');try{el.setPointerCapture(e.pointerId)}catch(_){}down()});
  const end=e=>{el.classList.remove('on');if(up)up()};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end)}
btn('tDash',()=>{if(started&&!paused)keys.dash=true});
btn('tAbil',()=>{if(window.abilityButton)abilityButton()});
btn('tFire',()=>{if(started&&!paused)mouse.down=true},()=>{mouse.down=false});
btn('tMenu',()=>{if(started&&!paused)showMenu()});

// ---------- палец по экрану: полёт и раскрутка ----------
const TK=1.35; // палец проходит меньше, чем мышь: усиление
let steer=null,lx=0,ly=0;
function slotTap(x,y){const ids=LOADOUT(),total=ids.length*170;
  for(let i=0;i<ids.length;i++){const sx=VW/2-total/2+i*170;if(x>sx-6&&x<sx+166&&y>VH-56&&y<VH-6){if(player)player.setWeapon(ids[i]);return true}}return false}
cv.addEventListener('touchstart',e=>{e.preventDefault();if(!started||paused)return;
  for(const t of e.changedTouches){if(slotTap(t.clientX/UIS,t.clientY/UIS))continue;if(steer===null){steer=t.identifier;lx=t.clientX;ly=t.clientY}}},{passive:false});
cv.addEventListener('touchmove',e=>{e.preventDefault();if(!started||paused)return;
  for(const t of e.changedTouches)if(t.identifier===steer){const k=sens*TK/(zoom*UIS);aim.x+=(t.clientX-lx)*k;aim.y+=(t.clientY-ly)*k;lx=t.clientX;ly=t.clientY}},{passive:false});
const tend=e=>{for(const t of e.changedTouches)if(t.identifier===steer)steer=null};
cv.addEventListener('touchend',tend);cv.addEventListener('touchcancel',tend);

// во весь экран и горизонтально при старте боя
function goFull(){const de=document.documentElement;if(document.fullscreenElement||!de.requestFullscreen)return;
  de.requestFullscreen({navigationUI:'hide'}).then(()=>{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(()=>{})}).catch(()=>{})}
for(const id of['start','resume','aBag'])if($(id))$(id).addEventListener('click',goFull);

// подсказка в меню
const hs=document.querySelectorAll('#menu .help');if(hs.length)hs[hs.length-1].innerHTML=
  '<b>Палец — это морда</b>: ведите пальцем по экрану, и морда летит следом; <b>крутите пальцем круги</b>, и оружие раскрутится. Урон зависит от скорости удара.<br>'+
  'Кнопки справа: <b>Рывок</b>, <b>✦</b> — способность (пока вы мертвы — сменить способность), <b>Огонь</b> — для посоха. Слоты оружия внизу экрана нажимаются. <b>❚❚</b> — пауза и меню.';

// кнопки показываются только в бою; на кнопке способности — перезарядка
let lastAb='';
HOOKS.hud.push(()=>{
  const on=started&&!paused;ui.style.display=on?'block':'none';
  rot.style.display=on&&innerHeight>innerWidth?'flex':'none';
  if(!on||!player)return;
  $('tFire').style.display=player.W&&player.W.type==='ranged'?'flex':'none';
  const AB=window.__abil&&__abil.AB,S=AB&&(AB[player.abil]||__abil.DAR[player.passive]);
  if(S){const cd=player.alive?Math.max(0,player.abCd||0):0,fr=cd/S.cd,key=S.name+'|'+Math.ceil(cd*4);
    if(key!==lastAb){lastAb=key;$('tAbilT').textContent=cd>0?cd.toFixed(1):S.name;const el=$('tAbil');el.style.borderColor=S.col;
      el.style.background=fr>0?`conic-gradient(rgba(0,0,0,.65) ${fr*360}deg, rgba(20,14,28,.5) 0)`:'rgba(20,14,28,.5)'}}
  const d=$('tDash'),dc=Math.max(0,player.dashCd)/1.6;d.style.background=dc>0?`conic-gradient(rgba(0,0,0,.65) ${dc*360}deg, rgba(20,14,28,.5) 0)`:'rgba(20,14,28,.5)';
});
})();
