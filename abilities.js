'use strict';
// Spiral Impact — способности бойцов.
// Активная способность (E / ПКМ / кнопка на телефоне): три простых даны сразу (Ускорение, Скачок, Вихрь),
// остальные покупаются за монеты (Невидимость, Клон, Щит, Исцеление).
// Дар — срабатывает сам при смерти или при рождении (Феникс, Посмертный взрыв, Грозное явление), покупается.
// У ботов способность зависит от морды, поэтому разные персонажи ведут себя по-разному.
(function(){
const A=window.__armory,prof=A.prof,save=A.save;

const AB={
  uskor:{name:'Ускорение',desc:'3 с летите в 1,7 раза быстрее',cd:8,col:'#ffd36a',rgb:'255,211,106',price:0},
  skachok:{name:'Скачок',desc:'мгновенный перенос на 300 вперёд вместе с оружием',cd:6,col:'#8fd0ff',rgb:'143,208,255',price:0},
  vihr:{name:'Вихрь',desc:'оружие мгновенно раскручивается до боевой скорости',cd:7,col:'#9fffd0',rgb:'159,255,208',price:0},
  nevid:{name:'Невидимость',desc:'5 с враги вас не видят; ваш удар снимает невидимость',cd:16,col:'#b9a6ff',rgb:'185,166,255',price:1500},
  klon:{name:'Клон',desc:'двойник с вашим оружием 12 с сражается на вашей стороне',cd:25,col:'#ff9ad0',rgb:'255,154,208',price:2500},
  shchit:{name:'Щит',desc:'3 с поглощает любой урон',cd:15,col:'#ffe08a',rgb:'255,224,138',price:1500},
  lechenie:{name:'Исцеление',desc:'+45 здоровья за 2,5 с',cd:18,col:'#6dff8a',rgb:'109,255,138',price:1200}
};
const DAR={
  feniks:{name:'Феникс',when:'при смерти',desc:'вместо гибели возрождаетесь на месте с 60% здоровья и огненной волной (раз в 45 с)',col:'#ff9a3a',rgb:'255,154,58',price:3000},
  vzryv:{name:'Посмертный взрыв',when:'при смерти',desc:'погибая, взрываетесь: до 35 урона всем врагам рядом',col:'#ff5a3a',rgb:'255,90,58',price:2000},
  yavlenie:{name:'Грозное явление',when:'при рождении',desc:'при появлении отбрасывает врагов, 5 с ярости и 2,5 с неуязвимости',col:'#ffd36a',rgb:'255,211,106',price:1800}
};
const FREE=['uskor','skachok','vihr'];
const SKIN_AB=['shchit','vihr','lechenie','nevid','klon','skachok','uskor','shchit','vihr','klon','lechenie','nevid'];
if(!prof.abOwned)prof.abOwned=[...FREE];
if(!prof.darOwned)prof.darOwned=[];
if(!AB[prof.ability]||!prof.abOwned.includes(prof.ability))prof.ability='uskor';
if(prof.passive&&!prof.darOwned.includes(prof.passive))prof.passive=null;

// ---------- Применение ----------
function ring(x,y,rgb,size,grow,life){addP({type:'ring',x,y,life:life||0.45,max:life||0.45,size:size||16,grow:grow||420,rgb})}
function burst(x,y,rgb,n,sp){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=rnd(0.3,1)*sp;addP({type:'ember',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rnd(0.4,0.8),max:0.8,size:rnd(2,4),drag:0.95,rgb})}}
function enemiesNear(f,x,y,R){return fighters.filter(o=>o.alive&&o!==f&&o.team!==f.team&&o.kind!=='bag'&&Math.hypot(o.body.x-x,o.body.y-y)<R)}
function push(o,x,y,v){const b=o.body,dx=b.x-x,dy=b.y-y,d=Math.hypot(dx,dy)||1,[vx,vy]=vel(b);setVel(b,vx+dx/d*v,vy+dy/d*v)}
function floatText(f,text,col){texts.push({x:f.body.x,y:f.body.y-60,text,col,t:1.4})}
const texts=[];

function activate(f){
  const k=f.abil,S=AB[k];if(!S||!f.alive||(f.abCd||0)>0)return false;
  const b=f.body;
  if(k==='uskor')f.boostT=3;
  else if(k==='skachok'){let dx=f.ax,dy=f.ay,L=Math.hypot(dx,dy);if(L<1){const[vx,vy]=vel(b);dx=vx;dy=vy;L=Math.hypot(dx,dy)}if(L<1){dx=f.look[0]||1;dy=f.look[1]||0;L=Math.hypot(dx,dy)||1}
    let tx=clamp(b.x+dx/L*300,b.r,AW-b.r),ty=clamp(b.y+dy/L*300,b.r,AH-b.r);
    for(const c of PILLARS){const ex=tx-c.x,ey=ty-c.y,d=Math.hypot(ex,ey),rr=c.r+b.r+4;if(d<rr){tx=c.x+ex/(d||1)*rr;ty=c.y+ey/(d||1)*rr}}
    const ox=tx-b.x,oy=ty-b.y;for(let i=0;i<8;i++)addP({type:'smoke',x:b.x+rnd(-12,12),y:b.y+rnd(-12,12),vx:rnd(-40,40),vy:rnd(-40,40),life:0.6,max:0.6,size:rnd(10,16),grow:40,drag:0.95,color:'90,120,170'});
    for(const p of f.chain)movePos(p,ox,oy);f.inv=Math.max(f.inv,0.2);if(f===player){aim.x+=ox;aim.y+=oy}}
  else if(k==='vihr'){if(!f.head)return false;const h=f.head,[bvx,bvy]=vel(b),[hvx,hvy]=vel(h),rx=h.x-b.x,ry=h.y-b.y,r=Math.hypot(rx,ry)||1;
    const sg=Math.sign(rx*(hvy-bvy)-ry*(hvx-bvx))||1,tx=-ry/r*sg,ty=rx/r*sg,n=f.links.length+1,V=Math.max(1800,f.W.thr*2.6);
    f.links.forEach((l,i)=>setVel(l,bvx+tx*V*(i+1)/n,bvy+ty*V*(i+1)/n));setVel(h,bvx+tx*V,bvy+ty*V);burst(h.x,h.y,S.rgb,12,300)}
  else if(k==='nevid')f.invisT=5;
  else if(k==='klon')spawnClone(f);
  else if(k==='shchit')f.shieldT=3;
  else if(k==='lechenie')f.healT=2.5;
  f.abCd=S.cd;ring(b.x,b.y,S.rgb,20,380);sfx('dash',0.45);
  return true;
}
function spawnClone(f){
  const c=new Fighter({name:f.name+' · клон',team:f.team,skin:f.skin,weapon:f.weaponId||LOADOUT()[0],kind:'bot',diff:2});
  c.isClone=true;c.owner=f;c.maxHp=50;c.lifeT=12;c.abil=null;c.passive=null;
  const a=Math.random()*6.283;c.spawnAt(clamp(f.body.x+Math.cos(a)*110,60,AW-60),clamp(f.body.y+Math.sin(a)*110,60,AH-60));c.hp=50;c.inv=0.4;
  fighters.push(c);burst(c.body.x,c.body.y,AB.klon.rgb,20,350);ring(c.body.x,c.body.y,AB.klon.rgb,10,300);
}
function vanish(c){c.alive=false;for(let i=0;i<10;i++)addP({type:'smoke',x:c.body.x+rnd(-15,15),y:c.body.y+rnd(-15,15),vx:rnd(-80,80),vy:rnd(-100,20),life:0.8,max:0.8,size:rnd(12,20),grow:40,drag:0.94,color:'120,80,110'});
  burst(c.body.x,c.body.y,AB.klon.rgb,14,260);const i=fighters.indexOf(c);if(i>=0)fighters.splice(i,1)}

// ---------- Обёртки ----------
const _damage=damage;
damage=function(vic,dmg,att,x,y){
  if(!vic.alive)return _damage(vic,dmg,att,x,y);
  if(vic.shieldT>0){sparks(x,y,10,400);ring(x,y,AB.shchit.rgb,10,200,0.25);sfx('clash',0.4);return}
  if(att&&att!==vic&&att.invisT>0)att.invisT=0;
  const eff=dmg*(att&&att!==vic&&att.buff&&att.buff.rage>0?1.5:1);
  if(vic.passive==='feniks'&&vic.hp-eff<=0&&time>=(vic.fenixT||0)&&vic.kind!=='bag'&&vic.kind!=='dummy'){
    vic.hp=vic.maxHp*0.6;vic.fenixT=time+45;vic.inv=1;const b=vic.body;
    ring(b.x,b.y,DAR.feniks.rgb,20,700,0.6);burst(b.x,b.y,'255,150,50',40,600);addP({type:'flash',x:b.x,y:b.y,life:0.3,max:0.3,size:220,rgb:'255,170,80'});sfx('boom',0.8);
    floatText(vic,'Феникс!',DAR.feniks.col);if(vic===player){shake=Math.min(30,shake+14);slowT=Math.max(slowT,0.35)}
    for(const o of enemiesNear(vic,b.x,b.y,260)){push(o,b.x,b.y,800);damage(o,20,vic,o.body.x,o.body.y)}
    return}
  _damage(vic,dmg,att,x,y);
};
const _kill=kill;
kill=function(vic,att){
  vic.invisT=0;vic.shieldT=0;vic.healT=0;vic.boostT=0;
  if(vic.isClone){vanish(vic);return}
  _kill(vic,att);
  if(vic.passive==='vzryv'){const b=vic.body;
    ring(b.x,b.y,DAR.vzryv.rgb,30,900,0.55);burst(b.x,b.y,'255,120,50',50,800);addP({type:'flash',x:b.x,y:b.y,life:0.35,max:0.35,size:300,rgb:'255,140,60'});sfx('boom',1);
    if(Math.hypot(b.x-cam.x,b.y-cam.y)<900)shake=Math.min(30,shake+16);
    for(const o of enemiesNear(vic,b.x,b.y,280)){const d=Math.hypot(o.body.x-b.x,o.body.y-b.y);push(o,b.x,b.y,900);damage(o,35*(1-0.5*d/280),vic,o.body.x,o.body.y)}}
};
const _respawn=respawn;
respawn=function(f){
  if(f===player){f.abil=prof.ability;f.passive=prof.passive}
  _respawn(f);
  if(f.passive==='yavlenie'&&time>0.5){const b=f.body;f.inv=Math.max(f.inv,2.5);f.buff=f.buff||{};f.buff.rage=Math.max(f.buff.rage||0,5);
    ring(b.x,b.y,DAR.yavlenie.rgb,20,800,0.6);burst(b.x,b.y,DAR.yavlenie.rgb,30,500);floatText(f,'Грозное явление!',DAR.yavlenie.col);
    for(const o of enemiesNear(f,b.x,b.y,380)){push(o,b.x,b.y,1000);damage(o,10,f,o.body.x,o.body.y)}}
};
const _startGame=startGame;
startGame=function(){
  prof.ability=sel.abil||prof.ability;save();
  _startGame();
  for(const f of fighters){f.abCd=0;f.invisT=f.shieldT=f.healT=f.boostT=0;
    if(f===player){f.abil=prof.ability;f.passive=prof.passive}
    else if(f.kind==='bot'){f.abil=SKIN_AB[f.skin%SKIN_AB.length];const r=Math.random();f.passive=r<0.5?null:pick(Object.keys(DAR))}
    else{f.abil=null;f.passive=null}}
};
const _resetMatch=resetMatch;
resetMatch=function(){fighters=fighters.filter(f=>!f.isClone);for(const f of fighters){f.abCd=0;f.invisT=f.shieldT=f.healT=f.boostT=0}_resetMatch()};
const _nearest=nearestEnemy;
nearestEnemy=function(f){const b=f.body;let best=null,bd=1e18;
  for(const o of fighters)if(o.alive&&o.team!==f.team&&o.kind!=='bag'){const d=(o.body.x-b.x)**2+(o.body.y-b.y)**2;if(o.invisT>0&&d>200*200)continue;if(d<bd){bd=d;best=o}}return best};
const _control=control;
control=function(f){
  _control(f);
  if(f.boostT>0){f.ax*=1.7;f.ay*=1.7}
  if(f.wantAbil){f.wantAbil=false;activate(f)}
  if(f.kind==='bot'&&f.abil&&(f.abCd||0)<=0&&((f.abThink=(f.abThink||0)-DT)<=0)){f.abThink=0.4;botAbility(f)}
};
function botAbility(f){
  const t=f.ai.target,b=f.body,d=t?Math.hypot(t.body.x-b.x,t.body.y-b.y):1e9,hp=f.hp/f.maxHp;
  if(Math.random()>[0.35,0.65,1][f.diff])return;
  let use=false;
  switch(f.abil){
    case 'uskor':use=t&&d>650&&d<1700;break;
    case 'skachok':use=(t&&d>600&&d<1500)||(hp<0.3&&d<300);break;
    case 'vihr':use=t&&d<550&&f.head&&Math.hypot(...vel(f.head))<f.W.thr;break;
    case 'nevid':use=(hp<0.4&&d<500)||(t&&d>900&&Math.random()<0.15);break;
    case 'klon':use=t&&d<650;break;
    case 'shchit':use=f.ai.evT>0||(hp<0.5&&d<350);break;
    case 'lechenie':use=hp<0.3||(hp<0.6&&d>400);break;
  }
  if(use)activate(f);
}
HOOKS.step.push(()=>{
  for(const f of[...fighters]){
    if(f.abCd>0)f.abCd-=DT;
    if(!f.alive)continue;
    if(f.boostT>0){f.boostT-=DT;if(Math.random()<DT*30){const[vx,vy]=vel(f.body);addP({type:'ember',x:f.body.x,y:f.body.y,vx:-vx*0.25,vy:-vy*0.25,life:0.4,max:0.4,size:2.4,rgb:AB.uskor.rgb})}}
    if(f.invisT>0)f.invisT-=DT;
    if(f.shieldT>0)f.shieldT-=DT;
    if(f.healT>0){f.healT-=DT;f.hp=Math.min(f.maxHp,f.hp+18*DT);if(Math.random()<DT*20)addP({type:'ember',x:f.body.x+rnd(-20,20),y:f.body.y+rnd(-5,20),vy:rnd(-90,-40),life:0.6,max:0.6,size:rnd(2,3),g:-40,rgb:AB.lechenie.rgb})}
    if(f.isClone&&(f.lifeT-=DT)<=0)vanish(f);
  }
  for(const t of texts){t.t-=DT;t.y-=40*DT}
  for(let i=texts.length-1;i>=0;i--)if(texts[i].t<=0)texts.splice(i,1);
});

// ---------- Рисование ----------
let hidden=[];
const _render=render;
render=function(dt){
  // невидимых врагов нет на экране и мини-карте: на время кадра считаем их «не в игре»
  hidden=started?fighters.filter(f=>f.alive&&f.invisT>0&&f!==player):[];
  for(const f of hidden)f.alive=false;
  try{_render(dt)}finally{for(const f of hidden)f.alive=true}
};
HOOKS.draw.push(layer=>{
  if(layer!==1)return;
  for(const f of hidden){const b=f.body,a=0.06+0.04*Math.sin(rt*9+f.id);ctx.strokeStyle=`rgba(200,190,255,${a})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.1,0,7);ctx.stroke()}
  for(const f of fighters){if(!f.alive)continue;const b=f.body;
    if(f.shieldT>0){const R=b.r*1.9,al=Math.min(1,f.shieldT*2);const g=ctx.createRadialGradient(b.x,b.y,R*0.6,b.x,b.y,R);g.addColorStop(0,'rgba(255,224,138,0)');g.addColorStop(0.85,`rgba(255,224,138,${0.35*al})`);g.addColorStop(1,`rgba(255,240,200,${0.7*al})`);
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,R,0,7);ctx.fill();ctx.strokeStyle=`rgba(255,240,190,${0.5*al})`;ctx.lineWidth=1.5;for(let i=0;i<6;i++){const a=rt*1.5+i*1.047;ctx.beginPath();ctx.arc(b.x,b.y,R*0.98,a,a+0.5);ctx.stroke()}}
    if(f===player&&f.invisT>0){ctx.setLineDash([6,8]);ctx.strokeStyle='rgba(185,166,255,0.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.75,rt*2,rt*2+6.283);ctx.stroke();ctx.setLineDash([])}
    if(f.isClone){ctx.strokeStyle=`rgba(${AB.klon.rgb},0.6)`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.5,-Math.PI/2,-Math.PI/2+6.283*clamp(f.lifeT/12,0,1));ctx.stroke()}}
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const t of texts){ctx.globalAlpha=clamp(t.t,0,1);ctx.font='700 24px Georgia, serif';ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,0.8)';ctx.strokeText(t.text,t.x,t.y);ctx.fillStyle=t.col;ctx.fillText(t.text,t.x,t.y)}
  ctx.globalAlpha=1;
});
HOOKS.lights.push(()=>{for(const f of fighters){if(!f.alive||f.invisT>0)continue;if(f.shieldT>0)addLight(f.body.x,f.body.y,220,AB.shchit.rgb,0.6);if(f.healT>0)addLight(f.body.x,f.body.y,160,AB.lechenie.rgb,0.5)}});
function abIcon(c,x,y,r,k,cdFrac){const S=AB[k];c.save();c.translate(x,y);
  const g=c.createRadialGradient(-r*0.3,-r*0.35,r*0.1,0,0,r);g.addColorStop(0,'#fff');g.addColorStop(0.3,S.col);g.addColorStop(1,'rgba(0,0,0,0.9)');c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,7);c.fill();
  c.fillStyle='rgba(20,12,30,0.9)';c.font=`700 ${r*0.95|0}px Georgia, serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(S.name[0],0,1);
  if(cdFrac>0){c.fillStyle='rgba(0,0,0,0.65)';c.beginPath();c.moveTo(0,0);c.arc(0,0,r,-Math.PI/2,-Math.PI/2+6.283*cdFrac);c.closePath();c.fill()}
  c.strokeStyle=cdFrac>0?'rgba(255,255,255,0.25)':S.col;c.lineWidth=2;c.beginPath();c.arc(0,0,r,0,7);c.stroke();c.restore()}
window.abIcon=abIcon;
HOOKS.hud.push(()=>{
  if(!started||!player)return;const p=player,k=p.abil;
  if(mode!=='bag'){const ph=p.W&&p.W.type==='ranged'?104:84,y=14+ph+8+34+8;
    panel(14,y,262,p.passive?60:46);
    if(k&&AB[k]){const S=AB[k],cd=Math.max(0,p.abCd||0);abIcon(ctx,40,y+23,17,k,cd/S.cd);
      ctx.textAlign='left';ctx.textBaseline='top';ctx.font='600 14px Segoe UI, Arial';ctx.fillStyle=S.col;ctx.fillText(S.name,66,y+8);
      ctx.font='11px Segoe UI, Arial';ctx.fillStyle='#a8946a';ctx.fillText(cd>0?'перезарядка '+cd.toFixed(1)+' с':(window.TOUCH?'готово · кнопка ✦':'готово · E или ПКМ'),66,y+26)}
    if(p.passive){const D=DAR[p.passive],cd=p.passive==='feniks'?Math.max(0,(p.fenixT||0)-time):0;ctx.textAlign='left';ctx.font='11px Segoe UI, Arial';ctx.fillStyle=D.col;
      ctx.fillText('Дар: '+D.name+' ('+D.when+')'+(cd>0?' · '+Math.ceil(cd)+' с':''),26,y+44)}}
  if(!p.alive&&!winner&&mode!=='horde'){ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='15px Segoe UI, Arial';ctx.fillStyle='#cfc6b6';
    const S=AB[prof.ability];ctx.fillText('Способность в новой жизни: '+S.name+(prof.abOwned.length>1?(window.TOUCH?' · нажмите ✦, чтобы сменить':' · Q — сменить'):''),VW/2,VH/2+16)}
});

// ---------- Ввод ----------
function nextAbility(){const o=prof.abOwned,i=o.indexOf(prof.ability);prof.ability=o[(i+1)%o.length];sel.abil=prof.ability;save()}
window.abilityButton=()=>{if(!started||paused||!player)return;if(player.alive)player.wantAbil=true;else nextAbility()};
addEventListener('keydown',e=>{if(paused||!started||!player)return;
  if(e.code==='KeyE')player.wantAbil=true;
  if(e.code==='KeyQ'&&!player.alive)nextAbility()});
cv.addEventListener('mousedown',e=>{if(e.button===2&&started&&!paused&&player)player.wantAbil=true});

// ---------- Меню: выбор способности ----------
sel.abil=prof.ability;
const row=document.createElement('div');row.className='row';row.innerHTML='<div class="label">Способность (в бою E или ПКМ) · новые — на складе</div><div class="choices" id="abils"></div>';
document.getElementById('modes').parentElement.before(row);
function menuAbils(){sel.abil=prof.abOwned.includes(sel.abil)?sel.abil:prof.ability;
  makeChoices('abils',prof.abOwned.map(id=>({label:AB[id].name,value:id,desc:'перезарядка '+AB[id].cd+' с'})),'abil')}
menuAbils();

// ---------- Склад: вкладка «Способности» ----------
const arm=document.getElementById('armory'),tabs=arm.querySelector('.tabs');
const tab=document.createElement('div');tab.className='choice';tab.dataset.tab='s';tab.textContent='Способности';tabs.appendChild(tab);
const box=document.createElement('div');box.id='aS';box.style.cssText='display:none;max-height:58vh;overflow:auto';document.getElementById('aA').after(box);
tab.onclick=()=>{tabs.querySelectorAll('.choice').forEach(e=>e.classList.toggle('sel',e===tab));document.getElementById('aW').style.display='none';document.getElementById('aA').style.display='none';box.style.display='';renderAbil()};
tabs.querySelectorAll('.choice').forEach(el=>{if(el!==tab)el.addEventListener('click',()=>box.style.display='none')});
document.getElementById('armoryBtn').addEventListener('click',renderAbil);
document.getElementById('aBack').addEventListener('click',menuAbils);
function card(title,sub,desc,col,state,btnText,btnGold,disabled,onClick,iconKey){
  const c=document.createElement('div');c.className='card'+(state==='eq'?' eq':state==='locked'?' locked':'');
  const cnv=document.createElement('canvas');cnv.width=190;cnv.height=70;const x=cnv.getContext('2d');const bg=x.createRadialGradient(95,35,4,95,35,110);bg.addColorStop(0,'#241c2e');bg.addColorStop(1,'#0c0a10');x.fillStyle=bg;x.fillRect(0,0,190,70);
  if(iconKey&&AB[iconKey])abIcon(x,95,35,24,iconKey,0);else{const g=x.createRadialGradient(88,28,3,95,35,26);g.addColorStop(0,'#fff');g.addColorStop(0.3,col);g.addColorStop(1,'rgba(0,0,0,0.9)');x.fillStyle=g;x.beginPath();x.arc(95,35,24,0,7);x.fill();
    x.fillStyle='rgba(20,12,30,0.9)';x.font='700 22px Georgia, serif';x.textAlign='center';x.textBaseline='middle';x.fillText(title[0],95,36)}
  if(state==='locked')cnv.style.filter='grayscale(.7) brightness(.7)';
  c.appendChild(cnv);const info=document.createElement('div');info.innerHTML=`<h3 style="color:${col}">${title}</h3><div class="d">${sub}</div><div class="d" style="color:#cfc6b6">${desc}</div>`;c.appendChild(info);
  const b=document.createElement('button');b.className='sbtn'+(btnGold?' gold':'');b.textContent=btnText;b.disabled=disabled;b.onclick=onClick;c.appendChild(b);return c}
function renderAbil(){
  box.innerHTML='<div class="sub" style="text-align:left;margin:4px 0 8px">Активная способность включается клавишей <b>E</b> или правой кнопкой мыши (на телефоне — кнопкой ✦). Три простые даны сразу, остальные покупаются. Пока вы мертвы, способность на новую жизнь можно сменить клавишей <b>Q</b>.</div><div class="grid" id="aSa"></div>'+
    '<div class="label" style="margin-top:14px">Дар — срабатывает сам при смерти или при рождении</div><div class="grid" id="aSd"></div>';
  const ga=document.getElementById('aSa'),gd=document.getElementById('aSd');
  for(const[id,S]of Object.entries(AB)){const own=prof.abOwned.includes(id),eq=prof.ability===id;
    ga.appendChild(card(S.name,'Активная · перезарядка '+S.cd+' с'+(S.price?'':' · бесплатно'),S.desc,S.col,eq?'eq':own?'':'locked',
      own?(eq?'Выбрана':'Выбрать'):'Купить за '+S.price+' ◈',!own,own?eq:prof.coins<S.price,
      ()=>{if(!own){if(prof.coins<S.price)return;prof.coins-=S.price;prof.abOwned.push(id)}prof.ability=id;sel.abil=id;save();A.renderArmory();renderAbil()},id))}
  gd.appendChild(card('Без дара','—','Ничего не срабатывает само.','#8f8573',prof.passive?'':'eq',prof.passive?'Выбрать':'Выбран',false,!prof.passive,()=>{prof.passive=null;save();renderAbil()}));
  for(const[id,D]of Object.entries(DAR)){const own=prof.darOwned.includes(id),eq=prof.passive===id;
    gd.appendChild(card(D.name,'Дар · '+D.when,D.desc,D.col,eq?'eq':own?'':'locked',own?(eq?'Выбран':'Выбрать'):'Купить за '+D.price+' ◈',!own,own?eq:prof.coins<D.price,
      ()=>{if(!own){if(prof.coins<D.price)return;prof.coins-=D.price;prof.darOwned.push(id)}prof.passive=id;save();A.renderArmory();renderAbil()}))}
  document.getElementById('aCoins').textContent=prof.coins+' ◈';
}
// в тестовом режиме (?dev) «Открыть всё» открывает и способности
const dAll=document.getElementById('dAll');if(dAll)dAll.addEventListener('click',()=>{prof.abOwned=Object.keys(AB);prof.darOwned=Object.keys(DAR);save();renderAbil();menuAbils()});
const dReset=document.getElementById('dReset');if(dReset)dReset.addEventListener('click',()=>{if(prof.xp===0&&prof.coins===0){prof.abOwned=[...FREE];prof.darOwned=[];prof.ability='uskor';prof.passive=null;save()}renderAbil();menuAbils()});

window.__abil={AB,DAR,activate,spawnClone};
})();
