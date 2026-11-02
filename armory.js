'use strict';
// Spiral Impact — склад оружия, прогресс игрока (уровни, монеты, достижения), груша для тренировки
// и крупные «готические» цифры урона. Подключается после основного скрипта index.html
// и расширяет его функции обёртками (damage, kill, control, tick, startGame, render, drawMorda, drawHead*).
(function(){

// ---------- Шрифты ----------
const GOTH='"UnifrakturCook","Old English Text MT","Times New Roman",serif';
const SLAV='"Ruslan Display",Georgia,serif';
{const l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&family=Ruslan+Display&display=swap';
  l.onload=()=>{document.fonts.load('700 40px "UnifrakturCook"');document.fonts.load('40px "Ruslan Display"')};document.head.appendChild(l)}

// ---------- Новое оружие ----------
const NEW_W={
  kosa:{name:'Коса жнеца',desc:'изогнутое лезвие режет широким махом',type:'melee',links:8,seg:17,mass:2.6,r:16,thr:380,k:0.0135,color:'#7ad8ff',rgb:'122,216,255',price:3200},
  kopye:{name:'Небесное копьё',desc:'длинный выпад, колет остриём',type:'melee',links:5,seg:17,mass:2.0,r:14,thr:400,k:0.0145,color:'#9fe0ff',rgb:'159,224,255',price:2400},
  chakram:{name:'Ангельский чакрам',desc:'вращающаяся звезда-лезвие',type:'melee',links:9,seg:17,mass:1.8,r:17,thr:420,k:0.0145,color:'#ffd88a',rgb:'255,216,138',price:2600},
  mech:{name:'Тяжёлый меч',desc:'режет лезвием, длинный и быстрый',type:'melee',links:6,seg:17,mass:2.2,r:15,thr:380,k:0.0135,color:'#d8dde6',rgb:'216,221,230',price:1800},
  krovmech:{name:'Огненный клинок',desc:'клинок из пламени: лечит на 35%',type:'melee',links:6,seg:17,mass:2.4,r:15,thr:380,k:0.013,color:'#ff4a4a',rgb:'255,74,74',price:2800,fx:'leech'},
  topor:{name:'Боевой топор',desc:'тяжёлая широкая секира',type:'melee',links:5,seg:17,mass:3.8,r:18,thr:320,k:0.0125,color:'#c8ccd6',rgb:'200,204,214',price:2200},
  bulava:{name:'Булава',desc:'надёжная, средний вес',type:'melee',links:6,seg:17,mass:2.8,r:16,thr:340,k:0.0128,color:'#b8c0cc',rgb:'184,192,204',price:900},
  zarya:{name:'Клинок зари',desc:'тесак с раскалённой кромкой, поджигает',type:'melee',links:6,seg:17,mass:2.6,r:16,thr:360,k:0.0125,color:'#ff9a3a',rgb:'255,154,58',price:3000,fx:'burn',sword:true},
  ametist:{name:'Аметистовый меч',desc:'клинок пустоты, лечит на 35% урона',type:'melee',links:7,seg:17,mass:2.0,r:15,thr:400,k:0.013,color:'#c070ff',rgb:'192,112,255',price:3500,fx:'leech',sword:true},
  yakor:{name:'Якорь бездны',desc:'очень тяжёлый, сносит с ног',type:'melee',links:5,seg:18,mass:4.6,r:21,thr:300,k:0.012,color:'#b07aff',rgb:'176,122,255',price:800},
  kristall:{name:'Ледяной клинок',desc:'замораживает врага',type:'melee',links:8,seg:17,mass:2.2,r:15,thr:380,k:0.013,color:'#8ff0ff',rgb:'143,240,255',price:1200,fx:'freeze'},
  cherep:{name:'Череп-кистень',desc:'лёгкий, очень длинная цепь',type:'melee',links:11,seg:17,mass:1.3,r:13,thr:480,k:0.017,color:'#d07aff',rgb:'208,122,255',price:1000},
  dushi:{name:'Сфера душ',desc:'лечит на 35% от урона',type:'melee',links:8,seg:17,mass:2.0,r:15,thr:400,k:0.012,color:'#7dffb0',rgb:'125,255,176',price:1500,fx:'leech'},
  kometa:{name:'Огненная комета',desc:'поджигает врага',type:'melee',links:7,seg:17,mass:2.4,r:16,thr:380,k:0.011,color:'#ff7a2a',rgb:'255,122,42',price:1100,fx:'burn'},
  molot:{name:'Молот титана',desc:'огромный урон, бьёт по площади',type:'melee',links:4,seg:17,mass:5.5,r:22,thr:280,k:0.0115,color:'#ffd36a',rgb:'255,211,106',price:2500,fx:'quake'}
};
Object.assign(WEAPONS,NEW_W);
const BASE=['gira','shar','posoh'];
const ALL=[...BASE,'sekira',...Object.keys(NEW_W)];

// ---------- Достижения ----------
const ACH=[
  {id:'first',name:'Первая кровь',desc:'Победить бойца',stat:'kills',goal:1,coins:50},
  {id:'kill25',name:'Палач',desc:'Победить 25 бойцов',stat:'kills',goal:25,coins:100,weapon:'cherep'},
  {id:'kill100',name:'Жнец',desc:'Победить 100 бойцов',stat:'kills',goal:100,coins:500},
  {id:'dmg1000',name:'Разогрев',desc:'Нанести 1 000 урона в боях',stat:'dmg',goal:1000,coins:50},
  {id:'dmg5000',name:'Лавина ударов',desc:'Нанести 5 000 урона в боях',stat:'dmg',goal:5000,coins:100,weapon:'kristall'},
  {id:'dmg25000',name:'Разрушитель',desc:'Нанести 25 000 урона в боях',stat:'dmg',goal:25000,coins:600},
  {id:'hit40',name:'Тяжёлая рука',desc:'Один удар на 40+',stat:'best',goal:40,coins:80},
  {id:'hit60',name:'Сокрушитель',desc:'Один удар на 60+',stat:'best',goal:60,coins:150},
  {id:'hit80',name:'Предел силы',desc:'Один удар на 80 (максимум)',stat:'best',goal:79.5,coins:300},
  {id:'win1',name:'Первая победа',desc:'Выиграть матч',stat:'wins',goal:1,coins:100},
  {id:'win10',name:'Чемпион арены',desc:'Выиграть 10 матчей',stat:'wins',goal:10,coins:200,weapon:'dushi'},
  {id:'death10',name:'Неваляшка',desc:'Погибнуть 10 раз',stat:'deaths',goal:10,coins:50},
  {id:'death30',name:'Феникс',desc:'Погибнуть 30 раз и не сдаться',stat:'deaths',goal:30,coins:100,weapon:'kometa'},
  {id:'bag300',name:'Боксёр',desc:'300 урона по груше за 10 секунд',stat:'bag10',goal:300,coins:100},
  {id:'lvl5',name:'Ветеран',desc:'Достичь 5 уровня',stat:'level',goal:5,coins:200,weapon:'yakor'},
  {id:'lvl10',name:'Легенда',desc:'Достичь 10 уровня',stat:'level',goal:10,coins:500,weapon:'molot'}
];

// ---------- Профиль игрока ----------
const KEY='spiral_profile_v1';
function defaults(){return{xp:0,coins:0,coinF:0,kills:0,deaths:0,wins:0,losses:0,dmg:0,best:0,bag10:0,owned:[...BASE],ach:{},loadout:[...BASE]}}
function load(){try{const p=JSON.parse(localStorage.getItem(KEY));if(p&&p.owned)return Object.assign(defaults(),p)}catch(e){}return defaults()}
const prof=load();
prof.owned=prof.owned.filter(id=>WEAPONS[id]);if(!prof.owned.includes('sekira'))prof.owned.push('sekira'); // цепь-секира доступна сразу
prof.loadout=prof.loadout.map(id=>prof.owned.includes(id)?id:'gira');
let saveT=0;function save(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(prof))}catch(e){}},300)}
const xpFor=l=>100*(l-1)*l/2;
const levelOf=xp=>{let l=1;while(xp>=xpFor(l+1))l++;return l};
const statOf=s=>s==='level'?levelOf(prof.xp):prof[s]||0;
window.getLoadout=()=>prof.loadout;
const progressMode=()=>mode==='duel'||mode==='team';
const mult=()=>[0.6,1,1.5][sel.diff]||1;

const toasts=[];
function reward(xp,coins){
  const l0=levelOf(prof.xp);prof.xp+=xp;prof.coinF+=coins;const whole=Math.floor(prof.coinF);prof.coins+=whole;prof.coinF-=whole;
  const l1=levelOf(prof.xp);
  for(let l=l0+1;l<=l1;l++){prof.coins+=100;toasts.push({title:'Новый уровень',name:'Уровень '+l,sub:'+100 монет',t:0})}
  checkAch();save();
}
function checkAch(){
  for(const a of ACH){if(prof.ach[a.id]||statOf(a.stat)<a.goal)continue;
    prof.ach[a.id]=Date.now();prof.coins+=a.coins;let sub='+'+a.coins+' монет';
    if(a.weapon&&!prof.owned.includes(a.weapon)){prof.owned.push(a.weapon);sub+=' · открыто: '+WEAPONS[a.weapon].name}
    toasts.push({title:'Достижение',name:a.name,sub,t:0})}
  save();
}

// ---------- Крупные цифры урона ----------
const bigNums=[];let redFlash=0;
const WORDS60=['Разгром!','Казнь!','Уничтожение!','Сокрушение!'];
function pushNum(x,y,dmg,kind,vic){
  // близкие удары по одной цели складываются в одну цифру
  if(vic&&kind==='burn'){for(const n of bigNums)if(n.vic===vic&&n.tier==='burn'&&n.age<0.8){n.dmg+=dmg;return}}
  if(vic&&!kind){for(const n of bigNums)if(n.vic===vic&&typeof n.tier==='number'&&time-n.born<0.5){n.dmg+=dmg;n.tier=n.dmg>=60?4:n.dmg>=40?3:n.dmg>=20?2:1;n.age=0.05;n.x=x;n.y=y;
    n.life=n.tier===4?1.8:n.tier===3?1.5:n.tier===2?1.2:1;if(n.tier===4&&!n.word)n.word=pick(WORDS60);else if(n.tier===3&&!n.word)n.word='Сокрушительно!';return}}
  const tier=kind||(dmg>=60?4:dmg>=40?3:dmg>=20?2:1);
  bigNums.push({x,y,vy:tier==='burn'||tier==='coin'?-40:-55,age:0,life:tier===4?1.8:tier===3?1.5:tier===2?1.2:1,dmg,tier,rot:typeof tier==='number'&&tier>=2?rnd(-0.12,0.12):0,word:tier===4?pick(WORDS60):tier===3?'Сокрушительно!':'',vic,born:time});
}
function drawNums(dt){
  for(const n of bigNums){n.age+=dt;n.y+=n.vy*dt;n.vy*=Math.pow(0.2,dt)}
  for(let i=bigNums.length-1;i>=0;i--)if(bigNums[i].age>=bigNums[i].life)bigNums.splice(i,1);
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const n of bigNums){
    const sx=VW/2+(n.x-cam.x)*zoom,sy=VH/2+(n.y-cam.y)*zoom,al=clamp((n.life-n.age)/0.4,0,1),k=Math.sqrt(zoom);
    ctx.save();ctx.globalAlpha=al;ctx.translate(sx,sy);
    if(n.tier==='burn'||n.tier==='coin'){
      ctx.font=`700 ${15*k|0}px Georgia, serif`;ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,0.85)';const t=n.tier==='coin'?'+'+n.dmg+' ◈':Math.round(n.dmg);
      ctx.strokeText(t,0,0);ctx.fillStyle=n.tier==='coin'?'#ffd36a':'#ff9a3c';ctx.fillText(t,0,0);ctx.restore();continue}
    if(n.tier==='word'){const S=26*k,pop=n.age<0.12?1+(1-n.age/0.12)*0.6:1;ctx.scale(pop,pop);ctx.font=`${S|0}px ${SLAV}`;ctx.lineWidth=S*0.14;ctx.strokeStyle='#1a0505';ctx.strokeText(n.word,0,0);ctx.fillStyle=n.color||'#ff6a5a';ctx.fillText(n.word,0,0);ctx.restore();continue}
    if(n.tier===1){ctx.font=`700 ${18*k|0}px Georgia, serif`;ctx.lineWidth=3.5;ctx.strokeStyle='rgba(0,0,0,0.85)';ctx.strokeText(Math.round(n.dmg),0,0);ctx.fillStyle='#f2ece0';ctx.fillText(Math.round(n.dmg),0,0);ctx.restore();continue}
    const S=[0,0,36,54,78][n.tier]*k,pop=n.age<0.12?1+(1-n.age/0.12)*0.9:1;
    ctx.rotate(n.rot);ctx.scale(pop,pop);ctx.font=`700 ${S|0}px ${GOTH}`;
    const g=ctx.createLinearGradient(0,-S/2,0,S/2);
    if(n.tier===2){g.addColorStop(0,'#ffffff');g.addColorStop(1,'#e9c46a')}
    else if(n.tier===3){g.addColorStop(0,'#fff3c0');g.addColorStop(0.5,'#ffb030');g.addColorStop(1,'#c0501a')}
    else{g.addColorStop(0,'#fff0d0');g.addColorStop(0.45,'#ff6a3a');g.addColorStop(1,'#8a0a0a')}
    if(n.tier>=3){ctx.shadowColor=n.tier===4?'#ff2a00':'#ff8a00';ctx.shadowBlur=n.tier===4?28:16}
    ctx.lineWidth=S*0.12;ctx.strokeStyle='#1a0505';ctx.strokeText(Math.round(n.dmg),0,0);ctx.shadowBlur=0;ctx.fillStyle=g;ctx.fillText(Math.round(n.dmg),0,0);
    if(n.word){ctx.font=`${S*0.34|0}px ${SLAV}`;ctx.lineWidth=S*0.07;ctx.strokeStyle='#1a0505';ctx.strokeText(n.word,0,S*0.62);ctx.fillStyle=n.tier===4?'#ff8a5a':'#ffd36a';ctx.fillText(n.word,0,S*0.62)}
    ctx.restore();
  }
}

// ---------- Груша ----------
const PIVOT={x:1300,y:430,px:1300,py:430,im:0,r:0},BAG_L=330;
let BAG=null;const bagHits=[];let bagBest=0;
SKINS.push({name:'Груша',bag:true,body:'#5a3018',light:'#8a5a38',dark:'#1a0a04',eye:'#000000',eyes:2,mouth:'o',blood:'#c9a66b',rim:'200,160,110'});
const BAG_SKIN=SKINS.length-1;
const BAG_SPR=(()=>{const W=64,H=104,c=document.createElement('canvas');c.width=W*2;c.height=H*2+20;const x=c.getContext('2d');x.scale(2,2);x.translate(W/2,H/2+5);
  const body=new Path2D();body.roundRect?body.roundRect(-W/2,-H/2,W,H,W*0.42):body.rect(-W/2,-H/2,W,H);
  const g=x.createLinearGradient(-W/2,0,W/2,0);g.addColorStop(0,'#1c0d05');g.addColorStop(0.3,'#7a4626');g.addColorStop(0.55,'#5a3018');g.addColorStop(1,'#140803');x.fillStyle=g;x.fill(body);
  x.save();x.clip(body);
  for(let i=0;i<700;i++){x.fillStyle=Math.random()<0.6?`rgba(0,0,0,${rnd(0.05,0.15)})`:`rgba(255,220,180,${rnd(0.02,0.06)})`;x.fillRect(rnd(-W/2,W/2),rnd(-H/2,H/2),rnd(0.5,1.6),rnd(0.5,1.6))}
  for(const yy of[-H*0.3,H*0.3]){x.fillStyle='#1a0c06';x.fillRect(-W/2,yy-5,W,10);x.fillStyle='rgba(255,220,180,0.12)';x.fillRect(-W/2,yy-5,W,2);
    for(let k=-2;k<=2;k++){const sg=x.createRadialGradient(k*12-1,yy-1,0,k*12,yy,2.6);sg.addColorStop(0,'#e8e8f0');sg.addColorStop(1,'#4a4a55');x.fillStyle=sg;x.beginPath();x.arc(k*12,yy,2.4,0,7);x.fill()}}
  for(const[r,col]of[[17,'rgba(200,170,130,0.55)'],[12,'rgba(150,20,20,0.6)'],[7,'rgba(200,170,130,0.55)'],[3,'rgba(150,20,20,0.7)']]){x.fillStyle=col;x.beginPath();x.arc(0,0,r,0,7);x.fill()}
  x.strokeStyle='rgba(0,0,0,0.5)';x.setLineDash([3,3]);x.lineWidth=1;for(const xx of[-W*0.28,W*0.28]){x.beginPath();x.moveTo(xx,-H/2);x.lineTo(xx,H/2);x.stroke()}x.setLineDash([]);
  x.fillStyle='rgba(255,230,200,0.12)';x.fillRect(-W*0.32,-H/2,5,H);
  const bs=x.createLinearGradient(0,0,0,H/2);bs.addColorStop(0,'rgba(0,0,0,0)');bs.addColorStop(1,'rgba(0,0,0,0.45)');x.fillStyle=bs;x.fillRect(-W/2,0,W,H/2);
  x.restore();x.strokeStyle='rgba(0,0,0,0.75)';x.lineWidth=2;x.stroke(body);
  x.fillStyle='#2a2a32';x.fillRect(-10,-H/2-6,20,8);x.strokeStyle='#8a8a96';x.lineWidth=2.5;x.beginPath();x.arc(0,-H/2-8,5,0,7);x.stroke();
  return c})();
function drawBag(c,x,y,r,squash,alpha){
  const th=Math.atan2(PIVOT.y-y,PIVOT.x-x)+Math.PI/2,H=104,top=[x+Math.sin(th)*(H/2+12),y-Math.cos(th)*(H/2+12)];
  c.save();c.globalAlpha=alpha;
  c.fillStyle='#1a1a20';c.fillRect(PIVOT.x-22,PIVOT.y-10,44,10);c.fillStyle='#4a4a55';c.fillRect(PIVOT.x-22,PIVOT.y-10,44,2);
  c.strokeStyle='#2a2018';c.lineWidth=4;c.beginPath();c.moveTo(PIVOT.x,PIVOT.y);c.lineTo(top[0],top[1]);c.stroke();
  c.strokeStyle='rgba(200,180,150,0.25)';c.lineWidth=1;c.beginPath();c.moveTo(PIVOT.x-1,PIVOT.y);c.lineTo(top[0]-1,top[1]);c.stroke();
  c.translate(x,y);c.rotate(th);c.scale(1+squash,1-squash);c.drawImage(BAG_SPR,-32,-H/2-5,64,H+10);
  c.restore();
}
function setupBag(){
  fighters=fighters.filter(f=>f===player);
  BAG=new Fighter({name:'Груша',team:'red',skin:BAG_SKIN,kind:'bag',anchor:{x:PIVOT.x,y:PIVOT.y+BAG_L}});
  fighters.push(BAG);BAG.spawnAt(PIVOT.x,PIVOT.y+BAG_L);BAG.body.r=38;BAG.body.im=1/14;BAG.maxHp=BAG.hp=1e9;BAG.inv=0;
  player.spawnAt(PIVOT.x-300,PIVOT.y+BAG_L);player.inv=0;aim.x=player.body.x;aim.y=player.body.y;cam.x=player.body.x+150;cam.y=player.body.y;
  bagHits.length=0;bagBest=0;
}
function bagHit(dmg){
  bagHits.push([time,dmg]);while(bagHits.length&&time-bagHits[0][0]>10)bagHits.shift();
  const s=bagHits.reduce((a,h)=>a+h[1],0);bagBest=Math.max(bagBest,dmg);
  if(s>prof.bag10){prof.bag10=s;checkAch()}
}

// ---------- Мечи: спрайты ----------
// Локальные координаты в радиусах головы r: ось +y — от цепи наружу (к острию). Точка удара — 0,0.
const SW_S=48,SW_X=1.3,SW_Y0=-2.0,SW_Y1=3.1; // масштаб спрайта и его границы
function swordSprite(draw){const c=document.createElement('canvas');c.width=SW_X*2*SW_S;c.height=(SW_Y1-SW_Y0)*SW_S;const x=c.getContext('2d');
  x.translate(SW_X*SW_S,-SW_Y0*SW_S);x.scale(SW_S,SW_S);draw(x);return c}
function drawZarya(c,glow){
  if(!glow){ // рукоять, навершие
    let g=c.createLinearGradient(-0.12,0,0.12,0);g.addColorStop(0,'#0c0d10');g.addColorStop(0.5,'#3a3d46');g.addColorStop(1,'#0c0d10');c.fillStyle=g;c.fillRect(-0.12,-1.85,0.24,1.2);
    c.strokeStyle='rgba(255,255,255,0.12)';c.lineWidth=0.02;for(let y=-1.8;y<-0.7;y+=0.09){c.beginPath();c.moveTo(-0.12,y);c.lineTo(0.12,y+0.04);c.stroke()}
    g=c.createLinearGradient(-0.18,0,0.18,0);g.addColorStop(0,'#5a606c');g.addColorStop(0.5,'#e6eaf0');g.addColorStop(1,'#4a4f5a');c.fillStyle=g;c.fillRect(-0.18,-1.98,0.36,0.14);c.fillRect(-0.16,-0.7,0.32,0.1);
    // корпус у основания клинка
    g=c.createLinearGradient(-0.45,-0.6,0.45,-0.1);g.addColorStop(0,'#2a3a6a');g.addColorStop(0.5,'#6a86c8');g.addColorStop(1,'#1a2448');c.fillStyle=g;
    c.beginPath();c.moveTo(-0.42,-0.6);c.lineTo(0.3,-0.6);c.lineTo(0.48,-0.35);c.lineTo(0.48,0);c.lineTo(-0.42,0);c.closePath();c.fill();c.strokeStyle='#05070c';c.lineWidth=0.04;c.stroke()}
  // клинок
  const p=new Path2D();p.moveTo(-0.42,0);p.lineTo(0.5,0);p.lineTo(0.5,2.45);p.lineTo(0.12,2.95);p.lineTo(-0.42,2.75);p.closePath();
  if(!glow){const g=c.createLinearGradient(-0.5,0,0.5,0.4);g.addColorStop(0,'#1a2648');g.addColorStop(0.45,'#33508e');g.addColorStop(1,'#16203c');c.fillStyle=g;c.fill(p);
    c.save();c.clip(p);c.strokeStyle='rgba(255,255,255,0.05)';c.lineWidth=0.012;for(let k=-3;k<6;k+=0.06){c.beginPath();c.moveTo(-0.6,k);c.lineTo(0.6,k+0.6);c.stroke()}
    c.fillStyle='rgba(0,0,0,0.35)';c.fillRect(-0.3,0.5,0.26,0.05);c.fillRect(-0.3,0.62,0.18,0.05);c.fillRect(-0.3,1.9,0.3,0.05);c.restore();
    c.strokeStyle='#05070c';c.lineWidth=0.045;c.stroke(p);
    // серебряный крюк у острия
    const h=new Path2D();h.moveTo(-0.42,2.2);h.quadraticCurveTo(-0.95,2.55,-0.9,3.15);h.quadraticCurveTo(-0.62,2.7,-0.2,2.85);h.closePath();
    const hg=c.createLinearGradient(-0.9,2.2,-0.2,3.1);hg.addColorStop(0,'#3a3f48');hg.addColorStop(0.5,'#eef2f6');hg.addColorStop(1,'#6a707c');c.fillStyle=hg;c.fill(h);c.stroke(h);
    c.strokeStyle='rgba(255,255,255,0.35)';c.lineWidth=0.03;c.beginPath();c.moveTo(-0.38,0.05);c.lineTo(-0.38,2.7);c.stroke()}
  // раскалённая кромка со ступеньками
  c.lineJoin='round';c.lineCap='round';const edge=()=>{c.beginPath();c.moveTo(0.3,0.08);c.lineTo(0.3,0.9);c.lineTo(0.4,1.05);c.lineTo(0.4,2.4);c.lineTo(0.1,2.8)};
  if(glow){edge();c.strokeStyle='rgba(255,110,20,0.35)';c.lineWidth=0.5;c.stroke();edge();c.strokeStyle='rgba(255,150,40,0.6)';c.lineWidth=0.22;c.stroke()}
  edge();c.strokeStyle='#ff8a1a';c.lineWidth=0.11;c.stroke();edge();c.strokeStyle='#fff2b0';c.lineWidth=0.04;c.stroke();
  if(!glow){c.fillStyle='#ffb040';c.beginPath();c.arc(0.25,-0.35,0.06,0,7);c.fill()}}
function drawAmetist(c,glow){
  const blade=new Path2D();blade.moveTo(-0.3,0);blade.quadraticCurveTo(-0.42,1.1,-0.18,2.2);blade.lineTo(0,3.0);blade.lineTo(0.18,2.2);blade.quadraticCurveTo(0.42,1.1,0.3,0);blade.closePath();
  if(glow){c.save();c.shadowColor='rgba(190,110,255,1)';c.shadowBlur=0.6*SW_S;c.fillStyle='rgba(170,90,255,0.45)';c.fill(blade);c.restore();
    for(const[x,y]of[[-0.14,-0.28],[0.14,-0.28],[0,-0.12]]){const g=c.createRadialGradient(x,y,0,x,y,0.3);g.addColorStop(0,'rgba(255,120,230,0.9)');g.addColorStop(1,'rgba(255,80,220,0)');c.fillStyle=g;c.fillRect(x-0.3,y-0.3,0.6,0.6)}
    const tg=c.createRadialGradient(0,2.7,0,0,2.7,0.5);tg.addColorStop(0,'rgba(255,220,255,0.9)');tg.addColorStop(1,'rgba(255,160,255,0)');c.fillStyle=tg;c.fillRect(-0.5,2.2,1,1);return}
  // рукоять с рогами
  let g=c.createLinearGradient(-0.12,0,0.12,0);g.addColorStop(0,'#0a0614');g.addColorStop(0.5,'#3a2a5a');g.addColorStop(1,'#0a0614');c.fillStyle=g;c.fillRect(-0.11,-1.7,0.22,1.3);
  c.fillStyle='#22163a';for(let y=-1.6;y<-0.5;y+=0.22){c.beginPath();c.moveTo(-0.16,y);c.lineTo(0,y+0.12);c.lineTo(0.16,y);c.lineTo(0,y+0.05);c.closePath();c.fill()}
  const horn=(sd,y,s)=>{c.beginPath();c.moveTo(sd*0.08,y);c.quadraticCurveTo(sd*0.45*s,y-0.05,sd*0.42*s,y-0.38*s);c.quadraticCurveTo(sd*0.3*s,y-0.12,sd*0.05,y+0.12);c.closePath();
    const hg=c.createLinearGradient(0,y-0.4,0,y+0.1);hg.addColorStop(0,'#d8a8ff');hg.addColorStop(0.5,'#6a3ab8');hg.addColorStop(1,'#1a0c30');c.fillStyle=hg;c.fill();c.strokeStyle='#08040f';c.lineWidth=0.03;c.stroke()};
  horn(-1,-1.75,1);horn(1,-1.75,1);
  // гарда-рога, загнутые к острию
  for(const sd of[-1,1]){c.beginPath();c.moveTo(0,-0.45);c.quadraticCurveTo(sd*0.6,-0.5,sd*0.62,0.05);c.quadraticCurveTo(sd*0.45,-0.25,sd*0.12,-0.12);c.closePath();
    const hg=c.createLinearGradient(sd*0.6,-0.5,0,0);hg.addColorStop(0,'#e0b8ff');hg.addColorStop(0.4,'#7040c0');hg.addColorStop(1,'#1a0c30');c.fillStyle=hg;c.fill();c.strokeStyle='#08040f';c.lineWidth=0.03;c.stroke()}
  c.fillStyle='#12081f';c.beginPath();c.ellipse(0,-0.25,0.2,0.24,0,0,7);c.fill();
  for(const[x,y]of[[-0.1,-0.3],[0.1,-0.3],[0,-0.14]]){const gg=c.createRadialGradient(x-0.02,y-0.02,0,x,y,0.07);gg.addColorStop(0,'#ffe0fa');gg.addColorStop(0.5,'#ff5ad8');gg.addColorStop(1,'#7a1070');c.fillStyle=gg;c.beginPath();c.arc(x,y,0.07,0,7);c.fill()}
  // клинок
  g=c.createLinearGradient(0,0,0,3);g.addColorStop(0,'#3a18a0');g.addColorStop(0.5,'#7a3ae8');g.addColorStop(0.85,'#c890ff');g.addColorStop(1,'#fff0ff');c.fillStyle=g;c.fill(blade);
  c.save();c.clip(blade);const sh=c.createLinearGradient(-0.4,0,0.4,0);sh.addColorStop(0,'rgba(0,0,0,0.35)');sh.addColorStop(0.45,'rgba(255,255,255,0.05)');sh.addColorStop(0.55,'rgba(255,255,255,0.35)');sh.addColorStop(1,'rgba(0,0,0,0.2)');c.fillStyle=sh;c.fillRect(-0.5,0,1,3.1);
  c.fillStyle='rgba(255,140,240,0.6)';for(const[x,y,r]of[[-0.08,1.5,0.04],[0.06,1.62,0.035],[-0.02,1.78,0.05],[0.1,1.9,0.03],[-0.1,2.0,0.035],[0.02,2.12,0.04],[0.12,1.4,0.03]]){c.beginPath();c.ellipse(x,y,r,r*1.4,0,0,7);c.fill()}c.restore();
  c.strokeStyle='#1a0838';c.lineWidth=0.035;c.stroke(blade)}
const SWORD={zarya:[swordSprite(c=>drawZarya(c,false)),swordSprite(c=>drawZarya(c,true))],ametist:[swordSprite(c=>drawAmetist(c,false)),swordSprite(c=>drawAmetist(c,true))]};
function swordDraw(c,id,r,dir,glow,alpha){const sp=SWORD[id][glow?1:0];c.save();c.rotate(dir-Math.PI/2);if(alpha!=null)c.globalAlpha*=alpha;c.drawImage(sp,-SW_X*r,SW_Y0*r,SW_X*2*r,(SW_Y1-SW_Y0)*r);c.restore()}

// ---------- Отрисовка оружия (новые виды) ----------
const HD={
  zarya:{base(c,r,s,dir){swordDraw(c,'zarya',r*1.5,dir,false)},glow(c,r,s,dir,dg){swordDraw(c,'zarya',r*1.5,dir,true,0.6+dg*0.4)}},
  ametist:{base(c,r,s,dir){swordDraw(c,'ametist',r*1.5,dir,false)},glow(c,r,s,dir,dg){swordDraw(c,'ametist',r*1.5,dir,true,0.6+dg*0.4)}},
  yakor:{base(c,r,s,dir){c.rotate(dir-Math.PI/2);const g=c.createLinearGradient(-r,0,r,0);g.addColorStop(0,'#15121c');g.addColorStop(0.5,'#5a5468');g.addColorStop(1,'#110e16');
      c.lineWidth=r*0.14;c.strokeStyle='#3a3546';c.beginPath();c.arc(0,-r*1.0,r*0.28,0,7);c.stroke();
      c.fillStyle=g;c.fillRect(-r*0.14,-r*0.8,r*0.28,r*1.6);c.fillRect(-r*0.6,-r*0.6,r*1.2,r*0.2);
      c.strokeStyle='rgba(0,0,0,0.7)';c.lineWidth=1.2;
      c.beginPath();c.moveTo(-r*1.05,r*0.05);c.quadraticCurveTo(-r*0.9,r*1.0,0,r*0.95);c.quadraticCurveTo(r*0.9,r*1.0,r*1.05,r*0.05);c.lineTo(r*0.8,r*0.2);c.quadraticCurveTo(r*0.7,r*0.72,0,r*0.68);c.quadraticCurveTo(-r*0.7,r*0.72,-r*0.8,r*0.2);c.closePath();c.fill();c.stroke();
      for(const sd of[-1,1]){c.beginPath();c.moveTo(sd*r*1.05,r*0.05);c.lineTo(sd*r*1.3,-r*0.25);c.lineTo(sd*r*0.82,r*0.15);c.closePath();c.fill();c.stroke()}
      c.fillStyle='rgba(255,255,255,0.18)';c.fillRect(-r*0.1,-r*0.75,r*0.06,r*1.4)},
    glow(c,r,s,dir,dg){c.rotate(dir-Math.PI/2);c.strokeStyle=`rgba(176,122,255,${0.35+dg*0.6})`;c.lineWidth=1.5;c.beginPath();c.moveTo(0,-r*0.5);c.lineTo(0,r*0.6);c.moveTo(-r*0.5,r*0.8);c.quadraticCurveTo(0,r*1.05,r*0.5,r*0.8);c.stroke()}},
  kristall:{base(c,r,s){c.rotate(s);const p=new Path2D();[[0,-1.5],[0.75,-0.55],[0.75,0.55],[0,1.5],[-0.75,0.55],[-0.75,-0.55]].forEach(([a,b],i)=>i?p.lineTo(a*r,b*r):p.moveTo(a*r,b*r));p.closePath();
      const g=c.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#e8fbff');g.addColorStop(0.45,'#6fc6e0');g.addColorStop(1,'#1a4a66');c.fillStyle=g;c.fill(p);
      c.strokeStyle='rgba(230,250,255,0.7)';c.lineWidth=1;c.beginPath();c.moveTo(0,-1.5*r);c.lineTo(0,1.5*r);c.moveTo(-0.75*r,-0.55*r);c.lineTo(0.75*r,0.55*r);c.stroke();c.strokeStyle='rgba(0,20,40,0.6)';c.stroke(p)},
    glow(c,r,s,d,dg){const g=c.createRadialGradient(0,0,0,0,0,r*1.7);g.addColorStop(0,`rgba(180,245,255,${0.45+dg*0.4})`);g.addColorStop(1,'rgba(120,220,255,0)');c.fillStyle=g;c.fillRect(-r*1.7,-r*1.7,r*3.4,r*3.4)}},
  cherep:{base(c,r,s){c.rotate(Math.sin(s)*0.4);const g=c.createRadialGradient(-r*0.3,-r*0.4,1,0,0,r*1.1);g.addColorStop(0,'#fff8e6');g.addColorStop(0.6,'#cdbf9c');g.addColorStop(1,'#5a4e38');c.fillStyle=g;
      c.beginPath();c.ellipse(0,-r*0.1,r,r*0.9,0,0,7);c.fill();c.fillRect(-r*0.55,r*0.4,r*1.1,r*0.5);
      c.fillStyle='#120a14';for(const sd of[-1,1]){c.beginPath();c.ellipse(sd*r*0.38,-r*0.05,r*0.26,r*0.3,0,0,7);c.fill()}
      c.beginPath();c.moveTo(0,r*0.2);c.lineTo(-r*0.1,r*0.4);c.lineTo(r*0.1,r*0.4);c.closePath();c.fill();
      c.strokeStyle='#120a14';c.lineWidth=1;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*r*0.2,r*0.5);c.lineTo(i*r*0.2,r*0.88);c.stroke()}
      c.strokeStyle='rgba(0,0,0,0.55)';c.lineWidth=1.2;c.beginPath();c.ellipse(0,-r*0.1,r,r*0.9,0,0,7);c.stroke()},
    glow(c,r,s,d,dg){c.rotate(Math.sin(s)*0.4);for(const sd of[-1,1]){const g=c.createRadialGradient(sd*r*0.38,-r*0.05,0,sd*r*0.38,-r*0.05,r*0.5);g.addColorStop(0,`rgba(220,140,255,${0.7+dg*0.3})`);g.addColorStop(1,'rgba(160,60,255,0)');c.fillStyle=g;c.fillRect(sd*r*0.38-r*0.5,-r*0.55,r,r)}}},
  dushi:{base(c,r){const g=c.createRadialGradient(-r*0.3,-r*0.3,1,0,0,r);g.addColorStop(0,'#2a4a3a');g.addColorStop(0.7,'#0c1a14');g.addColorStop(1,'#020604');c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,7);c.fill();c.strokeStyle='rgba(0,0,0,0.7)';c.lineWidth=1.2;c.stroke()},
    glow(c,r,s,d,dg){for(let i=0;i<3;i++){const a=s*2+rt*3+i*2.094,x=Math.cos(a)*r*0.55,y=Math.sin(a)*r*0.55,g=c.createRadialGradient(x,y,0,x,y,r*0.7);g.addColorStop(0,`rgba(150,255,190,${0.6+dg*0.3})`);g.addColorStop(1,'rgba(60,255,140,0)');c.fillStyle=g;c.fillRect(x-r*0.7,y-r*0.7,r*1.4,r*1.4)}
      c.strokeStyle=`rgba(150,255,190,${0.4+dg*0.4})`;c.lineWidth=1.2;c.beginPath();for(let i=0;i<3;i++){const a=rt*3+i*2.094;c.moveTo(Math.cos(a)*r*0.2,Math.sin(a)*r*0.2);c.quadraticCurveTo(Math.cos(a+1)*r*1.1,Math.sin(a+1)*r*1.1,Math.cos(a+1.8)*r*1.4,Math.sin(a+1.8)*r*1.4)}c.stroke()}},
  kometa:{base(c,r,s){c.rotate(s);const p=new Path2D();for(let i=0;i<9;i++){const a=i/9*6.283,rr=r*(i%2?0.92:1.05);i?p.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):p.moveTo(Math.cos(a)*rr,Math.sin(a)*rr)}p.closePath();
      const g=c.createRadialGradient(-r*0.3,-r*0.3,1,0,0,r);g.addColorStop(0,'#5a3020');g.addColorStop(1,'#140604');c.fillStyle=g;c.fill(p);c.strokeStyle='rgba(0,0,0,0.7)';c.lineWidth=1.2;c.stroke(p)},
    glow(c,r,s,d,dg){c.save();c.rotate(s);c.strokeStyle=`rgba(255,160,60,${0.7+dg*0.3})`;c.lineWidth=1.6;c.beginPath();c.moveTo(-r*0.6,-r*0.2);c.lineTo(-r*0.1,r*0.1);c.lineTo(r*0.3,-r*0.3);c.moveTo(-r*0.1,r*0.1);c.lineTo(r*0.1,r*0.6);c.stroke();c.restore();
      const R=r*(1.7+dg),g=c.createRadialGradient(0,0,r*0.3,0,0,R);g.addColorStop(0,`rgba(255,140,40,${0.35+dg*0.3})`);g.addColorStop(1,'rgba(255,60,0,0)');c.fillStyle=g;c.fillRect(-R,-R,R*2,R*2)}},
  molot:{base(c,r,s,dir){c.rotate(dir-Math.PI/2);c.fillStyle='#3a2a1a';c.fillRect(-r*0.12,-r*1.2,r*0.24,r*0.9);
      const W=r*1.15,H=r*0.62,g=c.createLinearGradient(0,-H,0,H);g.addColorStop(0,'#c8ccd6');g.addColorStop(0.5,'#5a606e');g.addColorStop(1,'#16181e');c.fillStyle=g;c.fillRect(-W,-H,W*2,H*2);
      c.fillStyle='#8a6a2e';c.fillRect(-W,-H,r*0.18,H*2);c.fillRect(W-r*0.18,-H,r*0.18,H*2);c.strokeStyle='rgba(0,0,0,0.7)';c.lineWidth=1.2;c.strokeRect(-W,-H,W*2,H*2)},
    glow(c,r,s,dir,dg){c.rotate(dir-Math.PI/2);c.strokeStyle=`rgba(255,211,106,${0.35+dg*0.6})`;c.lineWidth=1.5;c.beginPath();c.moveTo(-r*0.5,-r*0.25);c.lineTo(-r*0.2,r*0.25);c.lineTo(r*0.1,-r*0.25);c.lineTo(r*0.4,r*0.25);c.stroke()}}
};
// упрощённые иконки базового оружия для карточек склада
const ICON={
  gira(c,r){c.fillStyle='#4a4f5c';for(let i=0;i<8;i++){c.save();c.rotate(i*Math.PI/4);c.beginPath();c.moveTo(r*0.72,-r*0.3);c.lineTo(r*1.55,0);c.lineTo(r*0.72,r*0.3);c.fill();c.restore()}
    const g=c.createRadialGradient(-r*0.35,-r*0.4,1,0,0,r);g.addColorStop(0,'#c4cad6');g.addColorStop(0.35,'#666c7a');g.addColorStop(1,'#0b0c10');c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,7);c.fill();
    c.strokeStyle='rgba(111,216,255,0.8)';c.lineWidth=1.5;c.beginPath();c.arc(0,0,r*0.62,0,7);c.stroke()},
  shar(c,r){const g=c.createRadialGradient(0,0,0,0,0,r*1.2);g.addColorStop(0,'#fff');g.addColorStop(0.4,'#9cc0ff');g.addColorStop(1,'rgba(60,90,255,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,r*1.2,0,7);c.fill();
    c.strokeStyle='#2c303a';c.lineWidth=2.5;for(let k=0;k<3;k++){c.save();c.rotate(k*Math.PI/3);c.scale(0.45,1);c.beginPath();c.arc(0,0,r*1.05,0,7);c.restore();c.stroke()}},
  posoh(c,r){const g=c.createRadialGradient(0,0,0,0,0,r*1.6);g.addColorStop(0,'#fff6c0');g.addColorStop(0.4,'#ff9a30');g.addColorStop(1,'rgba(255,60,0,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,r*1.6,0,7);c.fill();
    c.fillStyle='#e0b05a';for(let i=0;i<3;i++){c.save();c.rotate(i*2.094);c.beginPath();c.moveTo(r*0.5,-r*0.25);c.quadraticCurveTo(r*1.4,-r*0.4,r*1.2,r*0.35);c.quadraticCurveTo(r*1.05,0,r*0.6,r*0.2);c.fill();c.restore()}}
};
function headDir(f){const h=f.head,l=f.links[f.links.length-1]||f.body;return Math.atan2(h.y-l.y,h.x-l.x)}
const _hb=drawHeadBase,_hg=drawHeadGlow;
drawHeadBase=function(f){const d=HD[f.weaponId];if(!d||(window.ICONW&&ICONW[f.weaponId]&&ICONW[f.weaponId].ok))return _hb(f);const h=f.head;ctx.save();ctx.translate(h.x,h.y);d.base(ctx,h.r,f.spin,headDir(f));ctx.restore()};
drawHeadGlow=function(f){const d=HD[f.weaponId];if(!d||(window.ICONW&&ICONW[f.weaponId]&&ICONW[f.weaponId].ok))return _hg(f);const h=f.head,w=f.W,dg=headDanger(f);ctx.save();ctx.translate(h.x,h.y);
  if(dg>0){const g=ctx.createRadialGradient(0,0,0,0,0,h.r*2.6);g.addColorStop(0,`rgba(${w.rgb},${dg*0.45})`);g.addColorStop(1,`rgba(${w.rgb},0)`);ctx.fillStyle=g;ctx.fillRect(-h.r*2.6,-h.r*2.6,h.r*5.2,h.r*5.2)}
  ctx.save();d.glow(ctx,h.r,f.spin,headDir(f),dg);ctx.restore();ctx.restore()};
function drawIcon(cnv,id){
  const c=cnv.getContext('2d'),W=cnv.width,H=cnv.height,w=WEAPONS[id],r=Math.min(w.r,20)*1.05,cx=W/2,cy=H*0.62;
  const bg=c.createRadialGradient(cx,cy,4,cx,cy,W*0.6);bg.addColorStop(0,'#241c2e');bg.addColorStop(1,'#0c0a10');c.fillStyle=bg;c.fillRect(0,0,W,H);
  if(window.ICONW&&ICONW[id]&&ICONW[id].ok){c.save();c.translate(cx,H*0.42);iconWeapon(c,id,15,Math.PI*0.5);c.restore();return}
  if(w.sword){c.save();c.translate(cx,H*0.5);swordDraw(c,id,15,-Math.PI/4,false);c.globalCompositeOperation='lighter';swordDraw(c,id,15,-Math.PI/4,true,0.8);c.restore();return}
  const brass=id==='posoh';c.strokeStyle=brass?'#c99a4a':'#8d93a3';c.lineWidth=1.6;
  for(let y=4,k=0;y<cy-r-4;y+=7,k++){c.beginPath();if(k%2)c.moveTo(cx,y-3),c.lineTo(cx,y+3);else c.ellipse(cx,y,2.4,4,0,0,7);c.stroke()}
  c.save();c.translate(cx,cy);
  if(HD[id]){c.save();HD[id].base(c,r,0.4,Math.PI/2);c.restore();c.globalCompositeOperation='lighter';c.save();HD[id].glow(c,r,0.4,Math.PI/2,0.3);c.restore()}
  else if(id==='sekira'){c.save();c.rotate(0);axeBlade(c,r*0.9);c.restore()}
  else ICON[id](c,r);
  c.restore();
}

// ---------- Обёртки игровых функций ----------
let dot=false;
const _damage=damage;
damage=function(vic,dmg,att,x,y){
  if(!vic.alive)return;
  const n0=nums.length,isBag=vic.kind==='bag';
  const keep=dot?[hitStop,shake,zoomPunch]:null;
  _damage(vic,dmg,att,x,y);
  nums.length=n0;
  if(keep){hitStop=keep[0];shake=keep[1];zoomPunch=keep[2]}
  if(isBag){vic.hp=vic.maxHp;bagHit(dmg)}
  pushNum(x,y-24,dmg,dot?'burn':0,vic);
  if(!dot&&dmg>=40){sparks(x,y,20,900);addP({type:'ring',x,y,life:0.4,max:0.4,size:20,grow:700,rgb:'255,200,120'})}
  if(!dot&&dmg>=60&&(att===player||vic===player)){redFlash=0.4;hitStop=Math.max(hitStop,0.12);slowT=Math.max(slowT,0.25);shake=Math.min(30,shake+10);zoomPunch=Math.min(0.1,zoomPunch+0.04)}
  if(!dot&&att&&att!==vic&&att.W&&att.W.fx)weaponFx(att,vic,dmg,x,y);
  if(att===player&&vic!==player){
    if(dmg>prof.best){prof.best=dmg;checkAch()}
    if(progressMode()&&!dot){prof.dmg+=dmg;const m=mult();reward(dmg*0.5*m,dmg*0.04*m)}
  }
};
function weaponFx(att,vic,dmg,x,y){
  const fx=att.W.fx;
  if(fx==='freeze'){vic.frozen=1.3;for(let i=0;i<14;i++){const a=Math.random()*6.283,s=rnd(80,300);addP({type:'spark',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0.5,max:0.5,size:2,g:200,drag:0.96,rgb:'190,245,255'})}}
  else if(fx==='leech'){const heal=dmg*0.35;att.hp=Math.min(att.maxHp,att.hp+heal);
    for(let i=0;i<10;i++)addP({type:'ember',x:x+rnd(-10,10),y:y+rnd(-10,10),vx:(att.body.x-x)*rnd(1.5,2.5),vy:(att.body.y-y)*rnd(1.5,2.5),life:0.45,max:0.45,size:rnd(2,3.5),drag:0.99,rgb:'125,255,176'})}
  else if(fx==='burn'){vic.burn={t:3,acc:0,att}}
  else if(fx==='quake'&&dmg>25){addP({type:'ring',x,y,life:0.5,max:0.5,size:30,grow:500,rgb:'255,211,106'});shake=Math.min(30,shake+6);
    for(const o of fighters)if(o.alive&&o!==vic&&o.team!==att.team&&o.kind!=='bag'){const dx=o.body.x-x,dy=o.body.y-y,d=Math.hypot(dx,dy);
      if(d<170){const[vx,vy]=vel(o.body);setVel(o.body,vx+dx/(d||1)*500,vy+dy/(d||1)*500);dot=true;damage(o,dmg*0.25,att,o.body.x,o.body.y);dot=false}}}
}
const _kill=kill;
kill=function(vic,att){
  const prevW=winner;vic.frozen=0;vic.burn=null;
  _kill(vic,att);
  if(!progressMode())return;
  const m=mult();
  if(att===player&&vic!==player&&vic.team!==player.team){prof.kills++;const c=Math.round(10*m);pushNum(player.body.x,player.body.y-50,c,'coin');reward(50*m,c)}
  if(vic===player){prof.deaths++;checkAch()}
  if(!prevW&&winner){if(winner===player.team){prof.wins++;const c=Math.round(60*m);reward(200*m,c);toasts.push({title:'Победа',name:'Матч выигран',sub:'+'+c+' монет',t:0})}else{prof.losses++;save()}}
};
const _control=control;
control=function(f){
  if(f.kind==='bag'){f.ax=0;f.ay=GRAV;f.wantFire=false;rope(PIVOT,f.body,BAG_L);const[vx,vy]=vel(f.body);setVel(f.body,vx*0.997,vy*0.997);return}
  _control(f);
  if(f.frozen>0){f.ax*=0.3;f.ay*=0.3}
};
const _tick=tick;
tick=function(f){
  _tick(f);
  if(f.kind==='bag')rope(PIVOT,f.body,BAG_L);
  if(f.frozen>0){f.frozen-=DT;if(Math.random()<DT*25)addP({type:'ember',x:f.body.x+rnd(-22,22),y:f.body.y+rnd(-22,22),vy:rnd(-20,20),life:0.5,max:0.5,size:2,rgb:'190,240,255'})}
  if(f.burn){const b=f.burn;b.t-=DT;b.acc+=DT;
    if(Math.random()<DT*30)addP({type:'ember',x:f.body.x+rnd(-18,18),y:f.body.y+rnd(-10,18),vx:rnd(-20,20),vy:rnd(-120,-40),life:0.5,max:0.5,size:rnd(1.5,3),g:-60,rgb:'255,140,40'});
    if(b.acc>=0.5){b.acc-=0.5;if(f.alive&&b.att){dot=true;damage(f,2.5,b.att,f.body.x,f.body.y-10);dot=false}}
    if(b.t<=0)f.burn=null}
};
const _startGame=startGame;
startGame=function(){
  if(!prof.owned.includes(sel.weapon))sel.weapon=prof.loadout[0];
  const bagMode=sel.mode==='bag';if(bagMode)sel.mode='train';
  _startGame();
  for(const f of fighters)if(SKINS[f.skin]&&SKINS[f.skin].bag)f.skin=Math.random()*(SKINS.length-1)|0;
  if(bagMode){sel.mode='bag';mode='bag';setupBag()}
  bigNums.length=0;
};
const _drawMorda=drawMorda;
drawMorda=function(c,x,y,r,si,lx,ly,hurt,tilt,squash,alpha){const S=SKINS[si];if(S&&S.bag)return drawBag(c,x,y,r,squash,alpha);return _drawMorda.apply(this,arguments)};

// ---------- Поверх кадра: цифры, прогресс, груша, сообщения ----------
const _render=render;
render=function(dt){
  _render(dt);
  if(!started)return;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(redFlash>0){redFlash-=dt;const g=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.25,VW/2,VH/2,Math.max(VW,VH)*0.7);g.addColorStop(0,'rgba(120,0,0,0)');g.addColorStop(1,`rgba(170,10,0,${clamp(redFlash,0,0.4)})`);ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH)}
  // заморозка на бойцах
  for(const f of fighters)if(f.alive&&f.frozen>0){const sx=VW/2+(f.body.x-cam.x)*zoom,sy=VH/2+(f.body.y-cam.y)*zoom,R=(f.body.r+6)*zoom;
    ctx.strokeStyle=`rgba(190,245,255,${Math.min(0.8,f.frozen)})`;ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.moveTo(sx+Math.cos(a)*R*0.6,sy+Math.sin(a)*R*0.6);ctx.lineTo(sx+Math.cos(a)*R,sy+Math.sin(a)*R)}ctx.stroke();
    ctx.fillStyle=`rgba(160,230,255,${Math.min(0.25,f.frozen*0.2)})`;ctx.beginPath();ctx.arc(sx,sy,R,0,7);ctx.fill()}
  drawNums(dt);
  ctx.textBaseline='top';
  // уровень и монеты
  const ph=player.W&&player.W.type==='ranged'?104:84,y0=14+ph+8,L=levelOf(prof.xp),a=xpFor(L),b=xpFor(L+1);
  panel(14,y0,262,34);ctx.textAlign='left';ctx.font=`700 15px ${SLAV}`;ctx.fillStyle='#e9d8ae';ctx.fillText('Ур. '+L,24,y0+9);
  bar(78,y0+14,110,6,(prof.xp-a)/(b-a),'#c9a55a');
  ctx.font='600 13px Segoe UI, Arial';ctx.fillStyle='#ffd36a';ctx.textAlign='right';ctx.fillText(prof.coins+' ◈',266,y0+10);
  // груша
  if(mode==='bag'){const s=bagHits.filter(h=>time-h[0]<=10).reduce((q,h)=>q+h[1],0);
    panel(VW/2-170,12,340,62);ctx.textAlign='center';ctx.font=`20px ${SLAV}`;ctx.fillStyle='#e9d8ae';ctx.fillText('Груша',VW/2,18);
    ctx.font='13px Segoe UI, Arial';ctx.fillStyle='#cfc6b6';ctx.fillText('Урон за 10 с: '+Math.round(s)+'   ·   рекорд: '+Math.round(prof.bag10)+'   ·   лучший удар: '+Math.round(bagBest),VW/2,48)}
  // сообщения о наградах
  if(toasts.length){const t=toasts[0];t.t+=dt;const al=clamp(Math.min(t.t*4,(3.2-t.t)*2),0,1);
    // справа под лентой убийств — не закрывает центр экрана
    ctx.globalAlpha=al;const w=290,x=VW-w-16,y=138,cx=x+w/2;panel(x,y,w,62);ctx.strokeStyle='#d4b26a';ctx.lineWidth=1.2;rr(x,y,w,62,4);ctx.stroke();
    ctx.textAlign='center';ctx.font='10px Segoe UI, Arial';ctx.fillStyle='#a8946a';ctx.fillText(t.title.toUpperCase(),cx,y+7);
    ctx.font=`19px ${SLAV}`;ctx.fillStyle='#ffd36a';ctx.fillText(t.name,cx,y+20);
    ctx.font='12px Segoe UI, Arial';ctx.fillStyle='#e9d8ae';ctx.fillText(t.sub,cx,y+44);ctx.globalAlpha=1;
    if(t.t>3.2)toasts.shift()}
};

// ---------- Склад оружия (экран) ----------
const css=document.createElement('style');css.textContent=`
#armory{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,rgba(20,14,28,.9),rgba(3,2,6,.97));z-index:5}
#armory.hidden{display:none}
#armory .panel{width:min(1040px,96vw)}
.armhead{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap}
.prof{text-align:right;font-size:13px;color:#cfc6b6}
.prof .lv{font-family:"Ruslan Display",Georgia,serif;font-size:20px;color:#e9d8ae}
.xpbar{display:inline-block;width:200px;height:7px;background:#000;border:1px solid #3a3020;vertical-align:middle;margin:0 8px}
.xpbar i{display:block;height:100%;background:linear-gradient(90deg,#8a6a2e,#e9c46a)}
.coins{color:#ffd36a;font-weight:700;font-size:16px}
.tabs{display:flex;gap:6px;margin:12px 0 10px}
.slots{display:flex;gap:8px;margin-bottom:10px}
.slot{flex:1;background:#140f1b;border:1px solid #33293f;border-radius:4px;padding:8px 10px;cursor:pointer;font-size:13px;color:#cfc6b6}
.slot.act{border-color:#d4b26a;box-shadow:0 0 10px rgba(212,178,106,.25)}
.slot small{display:block;color:#8f8573;font-size:11px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:10px;max-height:52vh;overflow:auto;padding-right:4px}
.card{background:#140f1b;border:1px solid #33293f;border-radius:4px;padding:10px}
.card.eq{border-color:#7a6440}
.card.locked canvas{filter:grayscale(.85) brightness(.6)}
.card canvas{display:block;margin:0 auto 4px;border-radius:3px}
.card h3{margin:2px 0;font:600 15px Georgia,serif;color:#e9d8ae}
.card .d{font-size:11.5px;color:#8f8573;margin-bottom:6px}
.stat{display:flex;align-items:center;gap:6px;font-size:11px;color:#8f8573;margin:2px 0}
.stat span{width:58px}.stat b{flex:1;height:5px;background:#000;position:relative}.stat b i{position:absolute;left:0;top:0;bottom:0;background:#c9a55a}
.req{font-size:11.5px;color:#a8946a;margin-top:6px;min-height:16px}
.sbtn{margin-top:6px;width:100%;background:#231a2c;border:1px solid #4a3d5a;color:#e9d8ae;padding:6px;border-radius:3px;cursor:pointer;font-size:13px}
.sbtn.gold{background:linear-gradient(#8a6a2e,#5e4518);border-color:#c9a55a;color:#fff6e0}
.sbtn:disabled{opacity:.45;cursor:default}
.ach{display:flex;gap:12px;align-items:center;padding:8px 6px;border-bottom:1px solid #221a2a}
.ach .ic{width:30px;height:30px;border-radius:50%;background:#1a1420;border:1px solid #3a3046;display:flex;align-items:center;justify-content:center;color:#5a4e66;font-size:15px}
.ach.done .ic{background:radial-gradient(circle at 35% 35%,#fff3b0,#c9a55a 60%,#5e4518);color:#2a1a08;border-color:#d4b26a}
.ach .t{flex:1}.ach .n{font:600 14px Georgia,serif;color:#e9d8ae}.ach.done .n{color:#ffd36a}.ach .s{font-size:11.5px;color:#8f8573}
.ach .pb{width:160px;height:5px;background:#000;margin-top:4px}.ach .pb i{display:block;height:100%;background:#c9a55a}
.ach .rw{font-size:12px;color:#a8946a;text-align:right;width:190px}
`;document.head.appendChild(css);
const arm=document.createElement('div');arm.id='armory';arm.className='hidden';
arm.innerHTML=`<div class="panel"><div class="armhead"><div><h1>Склад оружия</h1><div class="sub">Выберите слот 1–3 и нажмите на оружие, чтобы положить его в слот. Новое оружие открывается достижениями или покупается за монеты.</div></div>
<div class="prof"><span class="lv" id="aLv"></span><span class="xpbar"><i id="aXp"></i></span><span class="coins" id="aCoins"></span><div id="aStats" style="margin-top:4px;color:#8f8573;font-size:11.5px"></div></div></div>
<div class="tabs"><div class="choice sel" data-tab="w">Оружие</div><div class="choice" data-tab="a">Достижения</div></div>
<div id="aW"><div class="slots" id="aSlots"></div><div class="grid" id="aGrid"></div></div>
<div id="aA" style="display:none;max-height:58vh;overflow:auto"></div>
<button class="btn" id="aBag">Тренировка на груше</button><button class="btn alt" id="aBack">Назад в меню</button></div>`;
document.body.appendChild(arm);
let activeSlot=0;
const $=id=>document.getElementById(id);
function reqText(id){const a=ACH.find(q=>q.weapon===id);return a?'Достижение «'+a.name+'»: '+a.desc.toLowerCase():''}
function statRow(lbl,v){return `<div class="stat"><span>${lbl}</span><b><i style="width:${clamp(v,0.04,1)*100}%"></i></b></div>`}
function renderArmory(){
  const L=levelOf(prof.xp),a=xpFor(L),b=xpFor(L+1);
  $('aLv').textContent='Уровень '+L;$('aXp').style.width=((prof.xp-a)/(b-a)*100)+'%';$('aCoins').textContent=prof.coins+' ◈';
  $('aStats').textContent=`Нашествие: рекорд — волна ${prof.hordeBest||0} · Побед: ${prof.wins} · поражений: ${prof.losses} · бойцов побеждено: ${prof.kills} · гибелей: ${prof.deaths} · урон: ${Math.round(prof.dmg)} · лучший удар: ${Math.round(prof.best)}`;
  $('aSlots').innerHTML=prof.loadout.map((id,i)=>`<div class="slot${i===activeSlot?' act':''}" data-slot="${i}">Слот ${i+1} (клавиша ${i+1})<small>${WEAPONS[id].name}</small></div>`).join('');
  $('aSlots').querySelectorAll('.slot').forEach(el=>el.onclick=()=>{activeSlot=+el.dataset.slot;renderArmory()});
  const grid=$('aGrid');grid.innerHTML='';
  for(const id of ALL){const w=WEAPONS[id],own=prof.owned.includes(id),slot=prof.loadout.indexOf(id);
    const card=document.createElement('div');card.className='card'+(own?'':' locked')+(slot>=0?' eq':'');
    const cnv=document.createElement('canvas');cnv.width=190;cnv.height=96;drawIcon(cnv,id);card.appendChild(cnv);
    const info=document.createElement('div');
    info.innerHTML=`<h3>${w.name}</h3><div class="d">${w.desc}</div>`+statRow('Вес',w.mass/5.5)+statRow('Цепь',(w.links+1)*w.seg/204)+statRow('Сила',w.mass*w.k/0.065)+statRow('Разгон',1-(w.thr-250)/300)+
      `<div class="req">${own?(slot>=0?'В слоте '+(slot+1):'Есть на складе'):reqText(id)}</div>`;
    card.appendChild(info);
    const btn=document.createElement('button');btn.className='sbtn';
    if(own){btn.textContent=slot===activeSlot?'Уже в слоте '+(activeSlot+1):'Положить в слот '+(activeSlot+1);btn.disabled=slot===activeSlot;
      btn.onclick=()=>{const cur=prof.loadout[activeSlot];if(slot>=0)prof.loadout[slot]=cur;prof.loadout[activeSlot]=id;save();renderArmory()}}
    else{btn.className='sbtn gold';btn.textContent='Купить за '+w.price+' ◈';btn.disabled=prof.coins<w.price;
      btn.onclick=()=>{if(prof.coins<w.price)return;prof.coins-=w.price;prof.owned.push(id);save();renderArmory()}}
    card.appendChild(btn);grid.appendChild(card)}
  $('aA').innerHTML=ACH.map(q=>{const done=!!prof.ach[q.id],v=Math.min(statOf(q.stat),q.goal);
    return `<div class="ach${done?' done':''}"><div class="ic">${done?'✦':'✧'}</div><div class="t"><div class="n">${q.name}</div><div class="s">${q.desc}</div>${done?'':`<div class="pb"><i style="width:${v/q.goal*100}%"></i></div>`}</div>
      <div class="rw">+${q.coins} ◈${q.weapon?'<br>открывает: '+WEAPONS[q.weapon].name:''}</div></div>`}).join('');
}
arm.querySelectorAll('.tabs .choice').forEach(el=>el.onclick=()=>{arm.querySelectorAll('.tabs .choice').forEach(e=>e.classList.toggle('sel',e===el));$('aW').style.display=el.dataset.tab==='w'?'':'none';$('aA').style.display=el.dataset.tab==='a'?'':'none'});
function refreshMenuWeapons(){
  if(!prof.owned.includes(sel.weapon))sel.weapon=prof.loadout[0];
  makeChoices('weapons',prof.owned.map(id=>({label:WEAPONS[id].name,value:id,desc:WEAPONS[id].desc})),'weapon');
}
function openArmory(){menu.classList.add('hidden');arm.classList.remove('hidden');renderArmory()}
function closeArmory(){arm.classList.add('hidden');refreshMenuWeapons();showMenu()}
$('armoryBtn').onclick=openArmory;
$('aBack').onclick=closeArmory;
$('aBag').onclick=()=>{arm.classList.add('hidden');refreshMenuWeapons();initAudio();if(AC&&AC.state==='suspended')AC.resume();const pm=sel.mode;sel.mode='bag';startGame();sel.mode=pm;hideMenu()};
addEventListener('keydown',e=>{if(e.code==='Escape'&&!arm.classList.contains('hidden'))closeArmory()});
refreshMenuWeapons();

// ---------- Тестовый режим (ссылка с ?dev) ----------
// Кнопки для проверки оружия: монеты, открыть всё, сбросить прогресс. Без ?dev в адресе их нет.
if(/[?&]dev\b/.test(location.search)){
  const box=document.createElement('div');box.style.cssText='margin-top:10px;padding:8px;border:1px dashed #6a3a3a;border-radius:4px;font-size:12px;color:#c08080';
  box.innerHTML='Тестовый режим: <button class="sbtn" style="width:auto;margin:0 4px" id="dCoins">+5000 ◈</button><button class="sbtn" style="width:auto;margin:0 4px" id="dAll">Открыть всё оружие</button><button class="sbtn" style="width:auto;margin:0 4px" id="dReset">Сбросить прогресс</button>';
  $('aBack').after(box);
  $('dCoins').onclick=()=>{prof.coins+=5000;save();renderArmory()};
  $('dAll').onclick=()=>{for(const id of ALL)if(!prof.owned.includes(id))prof.owned.push(id);save();renderArmory()};
  $('dReset').onclick=()=>{if(!confirm('Сбросить уровень, монеты, достижения и купленное оружие?'))return;Object.assign(prof,defaults());save();renderArmory()};
}

// ---------- Выбивание оружия ----------
// Сильное столкновение оружия с оружием: у кого импульс (масса × скорость) заметно меньше,
// у того оружие отрывается и улетает; через 3 секунды оно само возвращается.
const DISARM_SPEED=850,DISARM_RATIO=0.7,DISARM_TIME=3;
let loose=[];
ACH.push({id:'disarm10',name:'Разоружитель',desc:'Выбить оружие 10 раз',stat:'disarms',goal:10,coins:150});
const canDisarm=f=>f.kind!=='bag'&&f.kind!=='dummy'&&!(f.disarmT>0)&&!(f.rearmT>time);
function disarm(loser,winner){
  const h=loser.head,id=loser.weaponId,w=WEAPONS[id];
  if(loser.hookT>0){loser.hookT=0;h.im=1/w.mass}
  const[hvx,hvy]=vel(h),dx=h.x-winner.head.x,dy=h.y-winner.head.y,dl=Math.hypot(dx,dy)||1;
  setVel(h,hvx+dx/dl*500,hvy+dy/dl*500-200);
  loose.push({weaponId:id,W:w,links:loser.links,head:h,chain:[...loser.links,h],body:loser.links[0]||h,spin:loser.spin,energy:loser.energy,trail:[],life:DISARM_TIME});
  loser.savedWeapon=id;loser.weaponId=null;loser.links=[];loser.head=null;loser.chain=[loser.body];loser.trail=[];loser.disarmT=DISARM_TIME;
  sparks(h.x,h.y,30,900);addP({type:'flash',x:h.x,y:h.y,life:0.18,max:0.18,size:90,rgb:'255,240,200'});addP({type:'ring',x:h.x,y:h.y,life:0.4,max:0.4,size:15,grow:600,rgb:w.rgb});
  sfx('clash',1);
  bigNums.push({x:loser.body.x,y:loser.body.y-60,vy:-40,age:0,life:1.6,tier:'word',word:'Обезоружен!',color:loser===player?'#ff6a5a':'#ffd36a',rot:0});
  if(loser===player||winner===player){hitStop=Math.max(hitStop,0.08);shake=Math.min(30,shake+12)}
  if(winner===player&&progressMode()){prof.disarms=(prof.disarms||0)+1;const m=mult();reward(30*m,5*m)}
}
function rearm(f){
  f.disarmT=0;f.weaponId=f.savedWeapon;f.rearmT=time+1;
  if(f.alive){f.buildWeapon();const h=f.head;addP({type:'ring',x:h.x,y:h.y,life:0.35,max:0.35,size:8,grow:260,rgb:f.W.rgb});addP({type:'flash',x:h.x,y:h.y,life:0.15,max:0.15,size:50,rgb:f.W.rgb});sfx('dash',0.4)}
}
const _interact=interact;
interact=function(A,B){
  let pre=null;
  if(A.alive&&B.alive&&A.head&&B.head&&A.team!==B.team){const a=A.head,b=B.head,dx=b.x-a.x,dy=b.y-a.y,rr=a.r+b.r;
    if(dx*dx+dy*dy<rr*rr){const d=Math.hypot(dx,dy)||1,[avx,avy]=vel(a),[bvx,bvy]=vel(b),s=-((bvx-avx)*dx/d+(bvy-avy)*dy/d);
      if(s>DISARM_SPEED)pre={pa:A.W.mass*Math.hypot(avx,avy),pb:B.W.mass*Math.hypot(bvx,bvy)}}}
  _interact(A,B);
  if(pre&&A.alive&&B.alive&&A.head&&B.head){
    if(pre.pa<pre.pb*DISARM_RATIO&&canDisarm(A))disarm(A,B);
    else if(pre.pb<pre.pa*DISARM_RATIO&&canDisarm(B))disarm(B,A)}
};
const _sw=Fighter.prototype.setWeapon;
Fighter.prototype.setWeapon=function(id){if(this.disarmT>0){this.savedWeapon=id;return}_sw.call(this,id)};
const _tick2=tick;
tick=function(f){_tick2(f);if(f.disarmT>0){f.disarmT-=DT;if(f.disarmT<=0)rearm(f)}};
const _kill2=kill;
kill=function(vic,att){if(vic.disarmT>0){vic.weaponId=vic.savedWeapon;vic.disarmT=0}_kill2(vic,att)};
const _resetMatch=resetMatch;
resetMatch=function(){for(const f of fighters)if(f.disarmT>0){f.weaponId=f.savedWeapon;f.disarmT=0}loose=[];_resetMatch()};
const _startGame2=startGame;
startGame=function(){loose=[];_startGame2()};
const _botThink=botThink;
botThink=function(f){
  if(!(f.disarmT>0))return _botThink(f);
  const b=f.body;let best=null,bd=1e9;
  for(const o of fighters)if(o.alive&&o.team!==f.team){const d=Math.hypot(o.body.x-b.x,o.body.y-b.y);if(d<bd){bd=d;best=o}}
  if(!best){f.ax=f.ay=0;return}
  let dx=b.x-best.body.x,dy=b.y-best.body.y;const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
  const gx=clamp(b.x+dx*300,150,AW-150),gy=clamp(b.y+dy*300,150,AH-150);let ax=gx-b.x,ay=gy-b.y;const L=Math.hypot(ax,ay)||1;
  f.ax=ax/L*MAXOFF*ACC;f.ay=ay/L*MAXOFF*ACC;f.look=[-dx,-dy];
  if(bd<250&&Math.random()<DT*2)f.wantDash=true;
};
const _step=step;
step=function(){
  _step();
  for(const L of loose){
    L.life-=DT;for(const p of L.links)integrate(p,0.992,0,GRAV);integrate(L.head,0.997,0,GRAV);
    for(let it=0;it<6;it++)for(let i=0;i<L.chain.length-1;i++)rope(L.chain[i],L.chain[i+1],L.W.seg);
    for(const p of L.chain)bounds(p,0.4);pillars(L.head);
    const[vx,vy]=vel(L.head);L.spin+=Math.hypot(vx,vy)*0.004*DT;
    if(Math.random()<DT*15)addP({type:'ember',x:L.head.x+rnd(-8,8),y:L.head.y+rnd(-8,8),vy:rnd(-40,0),life:0.5,max:0.5,size:2,rgb:L.W.rgb});
    if(L.life<=0)for(let i=0;i<8;i++)addP({type:'smoke',x:L.head.x,y:L.head.y,vx:rnd(-60,60),vy:rnd(-80,20),life:0.6,max:0.6,size:8,grow:30,drag:0.94,color:'60,54,70'});
  }
  loose=loose.filter(L=>L.life>0);
};
const _render2=render;
// летящее выбитое оружие рисуется поверх кадра в мировых координатах
render=function(dt){
  _render2(dt);
  if(!started)return;
  if(loose.length){ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.translate(VW/2,VH/2);ctx.scale(zoom,zoom);ctx.translate(-cam.x,-cam.y);
    for(const L of loose){ctx.globalAlpha=clamp(L.life/0.5,0,1);ctx.save();drawChain(L);ctx.restore();drawHeadBase(L);ctx.globalCompositeOperation='lighter';drawHeadGlow(L);ctx.globalCompositeOperation='source-over'}
    ctx.restore()}
  if(player&&player.alive&&player.disarmT>0){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`22px ${SLAV}`;ctx.lineWidth=4;ctx.strokeStyle='#1a0505';
    const t='Оружие выбито · вернётся через '+player.disarmT.toFixed(1);ctx.strokeText(t,VW/2,VH-90);ctx.fillStyle='#ff8a6a';ctx.fillText(t,VW/2,VH-90)}
};

window.__armory={prof,ACH,levelOf,renderArmory,openArmory,bag:()=>BAG,reward,checkAch,save,bigNums,toasts,mult};
})();
