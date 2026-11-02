'use strict';
// Spiral Impact — режим «Все против всех»: 10 бойцов, карта в 3 раза больше обычной,
// плюшки на карте (хилка, ярость, скорость, длинная цепь, большое оружие) и подсказки к ним.
// Подключается после index.html, armory.js и horde.js; расширяет их функции обёртками и HOOKS.
(function(){

// ---------- Мир: обычный 4800×3000 и большой 8400×5200 (площадь ×3) ----------
const SMALL={w:4800,h:3000},BIG={w:8400,h:5200};
const P0=PILLARS.map(p=>({x:p.x,y:p.y,r:p.r}));
const L0=JSON.parse(JSON.stringify(LAYOUTS));
function bigPillars(){const R=bgRand(7741),out=[];
  for(let gy=0;gy<5;gy++)for(let gx=0;gx<7;gx++){if(R()<0.22)continue;
    const x=600+gx*1200+(R()-0.5)*600,y=550+gy*980+(R()-0.5)*420,r=46+R()*28;
    if(Math.hypot(x-BIG.w/2,y-BIG.h/2)<620||y>BIG.h-520)continue;out.push({x:Math.round(x),y:Math.round(y),r:Math.round(r)})}
  return out}
function bigLayouts(){const sx=BIG.w/SMALL.w,sy=BIG.h/SMALL.h,out={};
  for(const[id,L]of Object.entries(L0)){
    out[id]={spikes:L.spikes.map(s=>({side:s.side,a:Math.round(s.a*(s.side==='L'||s.side==='R'?sy:sx)),b:Math.round(s.b*(s.side==='L'||s.side==='R'?sy:sx))})),
      pend:L.pend.map(p=>({x:Math.round(p.x*sx),len:Math.round(p.len*sy),amp:p.amp,ph:p.ph})),
      zones:L.zones.map(z=>({kind:z.kind,x:Math.round(z.x*sx),y:BIG.h-(SMALL.h-z.y),w:Math.round(z.w*sx),h:z.h})),
      bounce:L.bounce.map(q=>({x:Math.round(q.x*sx),y:Math.round(q.y*sy),w:q.w,h:q.h}))}}
  return out}
const BIGP=bigPillars(),BIGL=bigLayouts();
let worldBig=false;
function setWorld(big){
  if(big===worldBig)return;worldBig=big;const W=big?BIG:SMALL;AW=W.w;AH=W.h;
  PILLARS.length=0;for(const p of big?BIGP:P0)PILLARS.push({x:p.x,y:p.y,r:p.r});
  TORCHES.length=0;for(let x=330;x<AW;x+=1030)TORCHES.push({x,y:230},{x,y:AH-270});
  for(const y of[AH*0.37,AH*0.63])TORCHES.push({x:120,y:Math.round(y)},{x:AW-120,y:Math.round(y)});
  const src=big?BIGL:L0;for(const id in src)LAYOUTS[id]=JSON.parse(JSON.stringify(src[id]));
}
window.setWorld=setWorld;

// ---------- Цвета бойцов: у каждого свой ----------
const FFA_C=['#5aa8ff','#ff5262','#ffb03a','#7ce05a','#d070ff','#3ae0d0','#ff7ab8','#e8e070','#a0a8ff','#ff8a4a'];
FFA_C.forEach((c,i)=>TEAMC['p'+i]=c);
const FFA_N=10,FFA_LIM=15;

// ---------- Плюшки ----------
// Яркие светящиеся шары, у каждой свой цвет. Подпись под шаром — мини-инструкция.
const PU={
  heal:{name:'Хилка',desc:'+40 здоровья',col:'#5dff7a',rgb:'93,255,122',w:3},
  rage:{name:'Ярость',desc:'урон ×1,5 на 12 с',col:'#ff3d2e',rgb:'255,61,46',w:2,t:12},
  speed:{name:'Скорость',desc:'полёт быстрее на 12 с',col:'#ffd83a',rgb:'255,216,58',w:2,t:12},
  chain:{name:'Длинная цепь',desc:'+4 звена на 15 с',col:'#2ad4ff',rgb:'42,212,255',w:2,t:15},
  big:{name:'Большое оружие',desc:'оружие ×1,6 на 15 с',col:'#c46aff',rgb:'196,106,255',w:2,t:15}
};
const PU_IDS=Object.keys(PU);
function randType(){let s=0;for(const id of PU_IDS)s+=PU[id].w;let r=Math.random()*s;for(const id of PU_IDS){r-=PU[id].w;if(r<=0)return id}return 'heal'}
let spots=[];
function freeSpot(x,y){return !PILLARS.some(c=>Math.hypot(c.x-x,c.y-y)<c.r+90)&&!zoneAt(x,y)&&!zoneAt(x,y+120)}
function placePickups(){spots=[];const R=bgRand(3313),n=worldBig?30:12;
  for(let i=0;i<n*4&&spots.length<n;i++){const x=300+R()*(AW-600),y=300+R()*(AH-650);
    if(!freeSpot(x,y)||spots.some(s=>Math.hypot(s.x-x,s.y-y)<700))continue;spots.push({x,y,type:randType(),t:0,ph:R()*6})}}
const pickupsOn=()=>mode==='ffa';
function grant(f,id){const P=PU[id];
  if(id==='heal')f.hp=Math.min(f.maxHp,f.hp+40);
  else{f.buff=f.buff||{};const had=f.buff[id]>0;f.buff[id]=P.t;if(!had)applyBuff(f,id,true)}
  if(f===player){toastPU={id,t:2.6};sfx('dash',0.4)}
}
let toastPU=null;
// длинная цепь и большое оружие меняют саму цепь бойца
const WCACHE={};
const wDesc=Object.getOwnPropertyDescriptor(Fighter.prototype,'W');
Object.defineProperty(Fighter.prototype,'W',{configurable:true,get(){const w=wDesc.get.call(this);if(!w||!(this.buff&&this.buff.chain>0))return w;
  const k=this.weaponId;return WCACHE[k]||(WCACHE[k]=Object.assign({},w,{links:w.links+4}))}});
function fitChain(f){const w=f.W;if(!w||!f.head)return;const h=f.head;
  while(f.links.length<w.links){const l=f.links[f.links.length-1]||f.body;f.links.push(P((l.x+h.x)/2,(l.y+h.y)/2,LINK_M,4))}
  while(f.links.length>w.links)f.links.pop();
  f.chain=[f.body,...f.links,h]}
function sizeHead(f){if(!f.head)return;const w=wDesc.get.call(f);if(!w)return;const big=f.buff&&f.buff.big>0;
  f.head.r=w.r*(big?1.6:1);if(!(f.hookT>0))f.head.im=1/(w.mass*(big?1.3:1))}
function applyBuff(f,id){if(id==='chain')fitChain(f);if(id==='big')sizeHead(f)}
const _bw=Fighter.prototype.buildWeapon;
Fighter.prototype.buildWeapon=function(){_bw.call(this);if(this.buff&&this.buff.big>0)sizeHead(this)};

// ---------- Обёртки ----------
const _startGame=startGame;
startGame=function(){
  setWorld(sel.mode==='ffa');
  if(sel.mode!=='ffa'){_startGame();spots=[];return}
  // свой состав: игрок + 9 ботов, у каждого своя «команда» и цвет
  _startGame(); // создаст игрока (и никого больше: для 'ffa' в index.html нет ветки, кроме команды по умолчанию)
  fighters=[player];player.team='p0';
  const ws=['gira','shar','posoh','sekira','zarya','ametist','yakor','kristall','cherep','kometa','molot','dushi'].filter(id=>WEAPONS[id]);
  const names=[...BOT_NAMES].sort(()=>Math.random()-.5);
  for(let i=1;i<FFA_N;i++)fighters.push(new Fighter({name:names.pop()||'Бот '+i,team:'p'+i,skin:Math.random()*(SKINS.filter(s=>!s.bag).length)|0,weapon:pick(ws),kind:'bot',diff:sel.diff}));
  score={};for(const f of fighters)score[f.team]=0;
  for(const f of fighters){f.alive=false;respawn(f)}
  cam.x=player.body.x;cam.y=player.body.y;
  placePickups();hintT=10;
};
const _resetMatch=resetMatch;
resetMatch=function(){for(const f of fighters)f.buff={};_resetMatch();if(mode==='ffa'){score={};for(const f of fighters)score[f.team]=0;placePickups()}};
const _spawnPoint=spawnPoint;
spawnPoint=function(f){
  if(mode!=='ffa'||f.anchor)return _spawnPoint(f);
  let best=null,bd=-1;
  for(let t=0;t<40;t++){const x=rnd(300,AW-300),y=rnd(300,AH-600);if(!freeSpot(x,y))continue;
    let m=1e9;for(const o of fighters)if(o.alive&&o!==f)m=Math.min(m,Math.hypot(o.body.x-x,o.body.y-y));if(m>bd){bd=m;best={x,y}}}
  return best||{x:AW/2,y:AH/2}};
const _kill=kill;
kill=function(vic,att){if(vic.buff){const ch=vic.buff.chain>0,bg=vic.buff.big>0;vic.buff={};if(ch)fitChain(vic);if(bg)sizeHead(vic)}_kill(vic,att)};
const _control=control;
control=function(f){
  _control(f);
  const B=f.buff;if(B&&B.speed>0){f.ax*=1.45;f.ay*=1.45}
  // бот подбирает плюшку, если она рядом, а враг далеко (хилку — когда ранен)
  if(f.kind==='bot'&&pickupsOn()&&!f.isClone){const b=f.body,t=f.ai.target;let best=null,bd=520;
    for(const s of spots){if(s.t>0||(s.type==='heal'&&f.hp>f.maxHp*0.7))continue;const d=Math.hypot(s.x-b.x,s.y-b.y);if(d<bd){bd=d;best=s}}
    if(best&&(!t||Math.hypot(t.body.x-b.x,t.body.y-b.y)>bd+150)){const[vx,vy]=vel(b);let ox=best.x-b.x,oy=best.y-b.y;const L=Math.hypot(ox,oy);if(L>LEASH){ox*=LEASH/L;oy*=LEASH/L}
      f.ax=f.ax*0.4+(ox*KP-vx*KD)*0.6;f.ay=f.ay*0.4+(oy*KP-vy*KD)*0.6}}
};
const _damage=damage;
damage=function(vic,dmg,att,x,y){if(att&&att!==vic&&att.buff&&att.buff.rage>0)dmg*=1.5;_damage(vic,dmg,att,x,y)};
// окно подсказок
let hintT=0;
addEventListener('keydown',e=>{if(e.code==='KeyH'&&started&&!paused)hintT=hintT>0?0:999});

HOOKS.step.push(()=>{
  for(const f of fighters){const B=f.buff;if(!B)continue;
    for(const id in B)if(B[id]>0){B[id]-=DT;if(B[id]<=0){B[id]=0;applyBuff(f,id)}}
    if(f.alive&&B.rage>0&&Math.random()<DT*20)addP({type:'ember',x:f.body.x+rnd(-20,20),y:f.body.y+rnd(-14,20),vy:rnd(-90,-30),life:0.5,max:0.5,size:rnd(1.5,3),g:-60,rgb:PU.rage.rgb});
    if(f.alive&&B.speed>0&&Math.random()<DT*25){const[vx,vy]=vel(f.body);addP({type:'ember',x:f.body.x,y:f.body.y,vx:-vx*0.2,vy:-vy*0.2,life:0.35,max:0.35,size:2,rgb:PU.speed.rgb})}}
  if(!pickupsOn())return;
  for(const s of spots){
    if(s.t>0){s.t-=DT;if(s.t<=0){s.type=randType();addP({type:'ring',x:s.x,y:s.y,life:0.5,max:0.5,size:10,grow:160,rgb:PU[s.type].rgb})}continue}
    for(const f of fighters){if(!f.alive||f.kind==='dummy')continue;const b=f.body;if((b.x-s.x)**2+(b.y-s.y)**2>(b.r+24)**2)continue;
      grant(f,s.type);s.t=rnd(14,20);
      addP({type:'ring',x:s.x,y:s.y,life:0.45,max:0.45,size:16,grow:420,rgb:PU[s.type].rgb});addP({type:'flash',x:s.x,y:s.y,life:0.2,max:0.2,size:120,rgb:PU[s.type].rgb});
      for(let i=0;i<14;i++){const a=Math.random()*6.283,v=rnd(80,260);addP({type:'ember',x:s.x,y:s.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:0.6,max:0.6,size:rnd(2,3.5),rgb:PU[s.type].rgb})}
      break}}
  if(hintT>0&&hintT<999)hintT-=DT;
});

// ---------- Рисование плюшек ----------
function icon(c,id,r){c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle='rgba(255,255,255,0.95)';c.fillStyle='rgba(255,255,255,0.95)';c.lineWidth=r*0.16;
  if(id==='heal'){c.fillRect(-r*0.12,-r*0.42,r*0.24,r*0.84);c.fillRect(-r*0.42,-r*0.12,r*0.84,r*0.24)}
  else if(id==='rage'){c.beginPath();c.moveTo(0,-r*0.5);c.quadraticCurveTo(r*0.45,-r*0.05,r*0.25,r*0.32);c.quadraticCurveTo(0,r*0.52,-r*0.25,r*0.32);c.quadraticCurveTo(-r*0.4,0,-r*0.05,-r*0.2);c.quadraticCurveTo(0,-r*0.3,0,-r*0.5);c.fill()}
  else if(id==='speed'){c.beginPath();c.moveTo(r*0.1,-r*0.5);c.lineTo(-r*0.25,r*0.05);c.lineTo(r*0.05,r*0.05);c.lineTo(-r*0.1,r*0.5);c.lineTo(r*0.28,-r*0.08);c.lineTo(-r*0.02,-r*0.08);c.closePath();c.fill()}
  else if(id==='chain'){c.lineWidth=r*0.12;for(const k of[-1,0,1]){c.beginPath();c.ellipse(k*r*0.28,k*r*0.28,r*0.2,r*0.12,Math.PI/4,0,7);c.stroke()}}
  else{c.lineWidth=r*0.11;c.beginPath();c.arc(0,0,r*0.2,0,7);c.fill();c.beginPath();c.arc(0,0,r*0.42,0,7);c.stroke();
    for(const a of[0.785,2.356,3.927,5.498]){c.beginPath();c.moveTo(Math.cos(a)*r*0.5,Math.sin(a)*r*0.5);c.lineTo(Math.cos(a)*r*0.66,Math.sin(a)*r*0.66);c.stroke()}}
  c.restore()}
const ORB={};
function orbSpr(id){if(ORB[id])return ORB[id];const P_=PU[id],S=96,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');x.translate(S/2,S/2);const r=22;
  const g=x.createRadialGradient(-r*0.35,-r*0.4,r*0.1,0,0,r);g.addColorStop(0,'#ffffff');g.addColorStop(0.25,P_.col);g.addColorStop(1,'rgba(0,0,0,0.85)');
  x.fillStyle=g;x.beginPath();x.arc(0,0,r,0,7);x.fill();x.strokeStyle='rgba(255,255,255,0.55)';x.lineWidth=1.5;x.stroke();icon(x,id,r);return ORB[id]=c}
HOOKS.draw.push(layer=>{
  if(!pickupsOn())return;const vw=VW/zoom/2+80,vh=VH/zoom/2+80;
  for(const s of spots){if(s.t>0||Math.abs(s.x-cam.x)>vw||Math.abs(s.y-cam.y)>vh)continue;const P_=PU[s.type],bob=Math.sin(rt*2.4+s.ph)*6,y=s.y+bob;
    if(layer===0){ctx.globalAlpha=0.45;ctx.drawImage(shadowSpr,s.x+10-24,s.y+30-14,48,28);ctx.globalAlpha=1;
      ctx.drawImage(orbSpr(s.type),s.x-48,y-48);
      ctx.textAlign='center';ctx.textBaseline='top';ctx.font='600 13px Segoe UI, Arial';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,0.85)';ctx.strokeText(P_.name,s.x,y+30);ctx.fillStyle=P_.col;ctx.fillText(P_.name,s.x,y+30);
      ctx.font='11px Segoe UI, Arial';ctx.strokeText(P_.desc,s.x,y+46);ctx.fillStyle='rgba(240,232,214,0.85)';ctx.fillText(P_.desc,s.x,y+46)}
    else{const pu=1+0.15*Math.sin(rt*5+s.ph),R=46*pu;const g=ctx.createRadialGradient(s.x,y,0,s.x,y,R);g.addColorStop(0,`rgba(${P_.rgb},0.75)`);g.addColorStop(0.4,`rgba(${P_.rgb},0.25)`);g.addColorStop(1,`rgba(${P_.rgb},0)`);
      ctx.fillStyle=g;ctx.fillRect(s.x-R,y-R,R*2,R*2);ctx.strokeStyle=`rgba(${P_.rgb},0.6)`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,y,28+6*Math.sin(rt*3+s.ph),rt*2,rt*2+4);ctx.stroke()}}
  // ауры баффов на бойцах
  if(layer===1)for(const f of fighters){if(!f.alive||!f.buff)continue;let k=0;
    for(const id of['rage','speed','chain','big'])if(f.buff[id]>0){const P_=PU[id],b=f.body,a=rt*3+k*1.57;ctx.strokeStyle=`rgba(${P_.rgb},0.7)`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.85+k*5,a,a+1.6);ctx.stroke();k++}}
});
HOOKS.lights.push(()=>{if(!pickupsOn())return;for(const s of spots)if(s.t<=0)addLight(s.x,s.y,230,PU[s.type].rgb,0.85)});

// ---------- Экран: таблица лидеров, баффы игрока, подсказки, плюшки на мини-карте ----------
HOOKS.hud.push(()=>{
  if(!started||!player)return;
  if(pickupsOn()){const w=200,h=Math.round(w*AH/AW),x0=14,y0=VH-62-h,k=w/AW;
    for(const s of spots)if(s.t<=0){ctx.fillStyle=PU[s.type].col;ctx.fillRect(x0+s.x*k-1.5,y0+s.y*k-1.5,3,3)}}
  // баффы игрока — значки с таймером над слотами оружия
  const B=player.buff;if(B){let i=0;const act=['rage','speed','chain','big'].filter(id=>B[id]>0);
    for(const id of act){const x=VW/2-act.length*27+i*54+27,y=VH-84;ctx.save();ctx.translate(x,y);ctx.drawImage(orbSpr(id),-24,-24,48,48);ctx.restore();
      ctx.textAlign='center';ctx.textBaseline='top';ctx.font='700 12px Segoe UI, Arial';ctx.fillStyle=PU[id].col;ctx.fillText(Math.ceil(B[id])+' с',x,y+14);i++}}
  if(toastPU&&(toastPU.t-=1/60)>0){const P_=PU[toastPU.id];ctx.globalAlpha=clamp(toastPU.t,0,1);ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='700 26px Georgia, serif';ctx.lineWidth=5;ctx.strokeStyle='rgba(0,0,0,0.8)';ctx.strokeText(P_.name+'!',VW/2,VH*0.3);ctx.fillStyle=P_.col;ctx.fillText(P_.name+'!',VW/2,VH*0.3);
    ctx.font='15px Segoe UI, Arial';ctx.strokeText(P_.desc,VW/2,VH*0.3+28);ctx.fillStyle='#f2ead6';ctx.fillText(P_.desc,VW/2,VH*0.3+28);ctx.globalAlpha=1}
  if(mode!=='ffa')return;
  // таблица лидеров
  const rows=fighters.filter(f=>!f.isClone).map(f=>({f,s:score[f.team]||0})).sort((a,b)=>b.s-a.s);
  const me=rows.findIndex(r=>r.f===player),show=rows.slice(0,4);if(me>=4)show.push(rows[me]);
  const W=230,H=26+show.length*19,x=VW/2-W/2;panel(x,10,W,H);
  ctx.textBaseline='top';ctx.textAlign='center';ctx.font='10px Segoe UI, Arial';ctx.fillStyle='#a8946a';ctx.fillText('ВСЕ ПРОТИВ ВСЕХ · ДО '+FFA_LIM,VW/2,15);
  show.forEach((r,i)=>{const y=30+i*19,n=rows.indexOf(r)+1;ctx.font=(r.f===player?'700 ':'')+'13px Segoe UI, Arial';
    ctx.textAlign='left';ctx.fillStyle='#8f8573';ctx.fillText(n+'.',x+10,y);ctx.fillStyle=TEAMC[r.f.team];ctx.fillText(r.f===player?r.f.name+' (вы)':r.f.name,x+30,y);
    ctx.textAlign='right';ctx.fillStyle='#e9d8ae';ctx.fillText(r.s,x+W-12,y)});
  if(winner){const wf=fighters.find(f=>f.team===winner);if(wf){ctx.textAlign='center';ctx.font='18px Segoe UI, Arial';ctx.fillStyle=TEAMC[winner];ctx.fillText('Победитель: '+wf.name,VW/2,VH/2-58)}}
  // окно-подсказка: что дают плюшки
  if(hintT>0){const W2=300,ids=PU_IDS,H2=46+ids.length*30+22,x2=window.TOUCH?VW/2-W2/2:VW-W2-16,y2=window.TOUCH?Math.max(10,VH/2-H2/2-30):Math.min(220,VH-H2-150);ctx.globalAlpha=clamp(hintT,0,1);panel(x2,y2,W2,H2);
    ctx.textAlign='left';ctx.textBaseline='top';ctx.font='600 14px Georgia, serif';ctx.fillStyle='#e9d8ae';ctx.fillText('Плюшки на карте',x2+14,y2+12);
    ids.forEach((id,i)=>{const yy=y2+42+i*30;ctx.save();ctx.translate(x2+28,yy+10);ctx.drawImage(orbSpr(id),-18,-18,36,36);ctx.restore();
      ctx.font='600 13px Segoe UI, Arial';ctx.fillStyle=PU[id].col;ctx.fillText(PU[id].name,x2+52,yy);ctx.font='11.5px Segoe UI, Arial';ctx.fillStyle='#cfc6b6';ctx.fillText(PU[id].desc,x2+52+ctx.measureText(PU[id].name).width*1.1+8,yy+1)});
    ctx.font='11px Segoe UI, Arial';ctx.fillStyle='#8f8573';ctx.fillText('Подлетите к шару, чтобы взять. H — показать/скрыть',x2+14,y2+H2-20);ctx.globalAlpha=1}
});

window.zoomMul=(prev=>()=>(prev?prev():1)*(mode==='ffa'?0.9:1))(window.zoomMul);
window.__ffa={spots:()=>spots,PU,grant,setWorld,score:()=>score};
})();
