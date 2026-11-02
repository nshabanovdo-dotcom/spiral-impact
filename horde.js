'use strict';
// Spiral Impact — режим «Нашествие»: игрок один против волн монстров.
// Монстры — свои существа: безглазые морды с пастью, костяные наросты, светящиеся трещины.
// Физика монстров упрощённая (круг без цепи), столкновения через сетку по клеткам.
// Подключается после index.html и armory.js; index.html вызывает hordeStep / hordeDraw / hordeLights / hordeHUD.
(function(){
const A=()=>window.__armory;

// ---------- Виды монстров ----------
// r — радиус, hp — здоровье, sp — скорость, acc — разгон, mass — масса (отбрасывание), crack — цвет трещин
const KIND={
  obych:{name:'Порождение',r:19,hp:20,sp:150,acc:3,mass:1,crack:'255,110,40',bone:'#d8ccb4',flesh:['#3a2228','#120a0c'],coins:2,xp:6,grab:4},
  begun:{name:'Бегун',r:14,hp:8,sp:330,acc:5,mass:0.6,crack:'90,220,255',bone:'#c8d0d8',flesh:['#22283a','#0a0c14'],coins:2,xp:5,grab:4},
  zdorov:{name:'Здоровяк',r:36,hp:110,sp:85,acc:1.6,mass:5,crack:'255,40,40',bone:'#e8dcc0',flesh:['#3a1a14','#100604'],coins:7,xp:20,shove:9},
  vzryv:{name:'Взрывун',r:21,hp:14,sp:190,acc:3,mass:0.8,crack:'150,255,60',bone:'#d0d8b0',flesh:['#26301a','#0a0e06'],coins:3,xp:8,boom:true},
  boss:{name:'Пожиратель',r:72,hp:400,sp:115,acc:1.2,mass:30,crack:'200,90,255',bone:'#f0e6d0',flesh:['#2a1438','#08040e'],coins:150,xp:400,shove:9,boss:true}
};

// ---------- Спрайты монстров (рисуются один раз) ----------
// Локально: пасть смотрит в +x. Отдельный слой свечения трещин рисуется поверх освещения сцены.
function mrand(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}}
function makeSprites(id){
  const K=KIND[id],S=128,R=40,rand=mrand(id.length*977+id.charCodeAt(0)*13);
  const frames=[0,1].map(open=>{
    const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');x.translate(S/2,S/2);
    const g=document.createElement('canvas');g.width=g.height=S;const gx=g.getContext('2d');gx.translate(S/2,S/2);
    // тело: неровная капля
    const pts=[];const rr=mrand(91+id.length);for(let i=0;i<20;i++){const a=i/20*6.283,k=0.86+rr()*0.22+(Math.cos(a)>0.6?0.08:0);pts.push([Math.cos(a)*R*k,Math.sin(a)*R*k*0.92])}
    const body=new Path2D();pts.forEach((p,i)=>{const q=pts[(i+1)%20],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2;i?body.quadraticCurveTo(p[0],p[1],mx,my):body.moveTo(mx,my)});body.closePath();
    // костяные наросты по спине
    x.save();for(let i=0;i<7;i++){const a=Math.PI*0.55+i/6*Math.PI*0.9,bx=Math.cos(a)*R*0.78,by=Math.sin(a)*R*0.72,l=R*(0.35+rand()*0.35)*(id==='boss'?1.3:1),aa=a+(rand()-0.5)*0.4;
      const bg=x.createLinearGradient(bx,by,bx+Math.cos(aa)*l,by+Math.sin(aa)*l);bg.addColorStop(0,'#5a4a3a');bg.addColorStop(0.5,K.bone);bg.addColorStop(1,'#fffaf0');x.fillStyle=bg;
      x.beginPath();x.moveTo(bx+Math.cos(aa+1.57)*R*0.12,by+Math.sin(aa+1.57)*R*0.12);x.quadraticCurveTo(bx+Math.cos(aa+0.3)*l*0.7,by+Math.sin(aa+0.3)*l*0.7,bx+Math.cos(aa)*l,by+Math.sin(aa)*l);
      x.lineTo(bx+Math.cos(aa-1.57)*R*0.12,by+Math.sin(aa-1.57)*R*0.12);x.closePath();x.fill();x.strokeStyle='rgba(0,0,0,0.5)';x.lineWidth=1;x.stroke()}x.restore();
    // плоть
    let fg=x.createRadialGradient(-R*0.25,-R*0.35,R*0.1,0,0,R*1.1);fg.addColorStop(0,K.flesh[0]);fg.addColorStop(0.7,K.flesh[1]);fg.addColorStop(1,'#000');x.fillStyle=fg;x.fill(body);
    x.save();x.clip(body);for(let i=0;i<500;i++){x.fillStyle=rand()<0.5?`rgba(0,0,0,${rand()*0.25})`:`rgba(255,220,220,${rand()*0.06})`;x.beginPath();x.arc((rand()-0.5)*R*2,(rand()-0.5)*R*2,rand()*1.6+0.4,0,7);x.fill()}
    for(let i=0;i<6;i++){x.strokeStyle='rgba(0,0,0,0.35)';x.lineWidth=1.5;x.beginPath();const a=rand()*6.28;x.arc(Math.cos(a)*R*0.3,Math.sin(a)*R*0.3,R*(0.4+rand()*0.4),a,a+1.2);x.stroke()}
    const sh=x.createRadialGradient(-R*0.4,-R*0.5,0,-R*0.4,-R*0.5,R*0.6);sh.addColorStop(0,'rgba(255,240,240,0.18)');sh.addColorStop(1,'rgba(255,240,240,0)');x.fillStyle=sh;x.fillRect(-R,-R,R*2,R*2);x.restore();
    x.strokeStyle='rgba(0,0,0,0.8)';x.lineWidth=2;x.stroke(body);
    // пасть спереди (без глаз)
    const mw=R*0.62,mh=R*(open?0.5:0.22),mx=R*0.42;
    const mouth=new Path2D();mouth.ellipse(mx,0,mw*0.75,mh,0,0,7);
    let mg=x.createRadialGradient(mx+mw*0.2,0,0,mx,0,mw);mg.addColorStop(0,'#000');mg.addColorStop(0.6,'#2a0406');mg.addColorStop(1,'#5a1010');x.fillStyle=mg;x.fill(mouth);
    x.save();x.clip(mouth);x.fillStyle='#efe6d2';const nt=7;
    for(let i=0;i<nt;i++){const ty=-mh+i*(2*mh/nt)+mh/nt;const l=R*0.16*(1-Math.abs(ty)/mh*0.5);
      x.beginPath();x.moveTo(mx-mw*0.75,ty-R*0.05);x.lineTo(mx-mw*0.75+l,ty);x.lineTo(mx-mw*0.75,ty+R*0.05);x.fill();
      x.beginPath();x.moveTo(mx+mw*0.75,ty-R*0.05);x.lineTo(mx+mw*0.75-l,ty);x.lineTo(mx+mw*0.75,ty+R*0.05);x.fill()}
    for(let i=0;i<5;i++){const tx=mx-mw*0.5+i*mw*0.25;x.beginPath();x.moveTo(tx-R*0.05,-mh);x.lineTo(tx,-mh+R*0.16);x.lineTo(tx+R*0.05,-mh);x.fill();x.beginPath();x.moveTo(tx-R*0.05,mh);x.lineTo(tx,mh-R*0.16);x.lineTo(tx+R*0.05,mh);x.fill()}
    x.restore();x.strokeStyle='rgba(0,0,0,0.85)';x.lineWidth=2;x.stroke(mouth);
    // светящиеся трещины: тёмная борозда в спрайте + свечение на отдельном слое
    const cracks=[];const cr=mrand(7+id.length*3);for(let i=0;i<(id==='boss'?9:5);i++){const p=[];let a=cr()*6.28,px=Math.cos(a)*R*0.2,py=Math.sin(a)*R*0.2;p.push([px,py]);
      for(let k=0;k<5;k++){a+=(cr()-0.5)*1.2;px+=Math.cos(a)*R*0.17;py+=Math.sin(a)*R*0.17;if(px*px+py*py>R*R*0.7)break;p.push([px,py])}cracks.push(p)}
    const line=(c,p)=>{c.beginPath();p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]))};
    x.save();x.clip(body);x.lineCap='round';for(const p of cracks){line(x,p);x.strokeStyle='rgba(0,0,0,0.8)';x.lineWidth=3.5;x.stroke();line(x,p);x.strokeStyle=`rgb(${K.crack})`;x.lineWidth=1.4;x.stroke()}x.restore();
    gx.lineCap='round';for(const[w,a]of[[9,0.12],[4.5,0.3],[1.8,0.9]])for(const p of cracks){line(gx,p);gx.strokeStyle=`rgba(${K.crack},${a})`;gx.lineWidth=w;gx.stroke()}
    const mgl=gx.createRadialGradient(mx,0,0,mx,0,mw);mgl.addColorStop(0,`rgba(${K.crack},${open?0.5:0.2})`);mgl.addColorStop(1,`rgba(${K.crack},0)`);gx.fillStyle=mgl;gx.fillRect(mx-mw,-mw,mw*2,mw*2);
    return{c,g}});
  return{frames,R,S};
}
const SPR={};for(const id in KIND)SPR[id]=makeSprites(id);

// ---------- Состояние режима ----------
let H=null; // текущая игра
function newState(){return{wave:0,phase:'pause',phaseT:2.5,mons:[],breaches:[],queue:[],kills:0,bestHit:0,bestCombo:0,series:[],seriesT:0,over:false,overT:0,banner:null,boss:null,numsW:[],grid:new Map(),spawnT:0,regen:0,dmgBy:{}}}
const MAX_ON=70;

function waveComp(n){ // состав волны n
  const boss=n%5===0,total=boss?6+n:6+n*5,list=[];
  for(let i=0;i<total;i++){const r=Math.random();let k='obych';
    if(n>=2&&r<0.22+0.01*n)k='begun';else if(n>=3&&r<0.32+0.012*n)k='zdorov';else if(n>=4&&r<0.44+0.012*n)k='vzryv';list.push(k)}
  if(boss)list.unshift('boss');
  return list}
function startWave(){
  H.wave++;H.queue=waveComp(H.wave);H.phase='fight';H.spawnT=0;H.banner={text:'Волна '+H.wave,sub:H.wave%5===0?'Босс: '+KIND.boss.name:'',t:2.4};
  sfx('boom',0.6)}
// пролом — светящийся разлом в стене арены; виден заранее, потом выпускает монстров
function openBreach(list){
  const p=player.body;let x,y;
  for(let t=0;t<20;t++){const a=Math.random()*6.283,d=rnd(520,900);x=p.x+Math.cos(a)*d;y=p.y+Math.sin(a)*d;if(x>120&&x<AW-120&&y>120&&y<AH-120&&!PILLARS.some(c=>Math.hypot(c.x-x,c.y-y)<c.r+80))break}
  x=clamp(x,120,AW-120);y=clamp(y,120,AH-120);
  const crack=[];for(let k=0;k<3;k++){const p2=[];let a=Math.random()*6.28,px=0,py=0;p2.push([0,0]);for(let i=0;i<6;i++){a+=rnd(-0.7,0.7);px+=Math.cos(a)*rnd(10,22);py+=Math.sin(a)*rnd(10,22);p2.push([px,py])}crack.push(p2)}
  H.breaches.push({x,y,t:0,warn:1.6,list,emitT:0,crack,boss:list.includes('boss')});
}
function spawnMon(k,x,y){
  const K=KIND[k],sc=1+0.06*(H.wave-1),a=Math.random()*6.283;
  const m={k,K,x,y,vx:Math.cos(a)*150,vy:Math.sin(a)*150,r:K.r,hp:K.hp*sc,maxHp:K.hp*sc,sp:K.sp*(1+0.04*(H.wave-1)),hitCd:0,grab:null,tick:0,fuse:-1,ang:a,open:0,alive:true,born:time,
    jit:Math.random()*6.28,atkT:rnd(3,5),sumT:6,dash:0,tele:0,dx:0,dy:0};
  if(K.boss){m.hp=m.maxHp=K.hp+H.wave*50;H.boss=m}
  H.mons.push(m);
  addP({type:'ring',x,y,life:0.35,max:0.35,size:K.r,grow:220,rgb:K.crack});
}

// ---------- Сетка для столкновений ----------
const CELL=96;
function gridBuild(){const g=H.grid;g.clear();for(const m of H.mons){const key=((m.x/CELL)|0)+((m.y/CELL)|0)*1000;let a=g.get(key);if(!a)g.set(key,a=[]);a.push(m)}}
function near(x,y,rad,fn){const x0=((x-rad)/CELL)|0,x1=((x+rad)/CELL)|0,y0=((y-rad)/CELL)|0,y1=((y+rad)/CELL)|0;
  for(let gy=y0;gy<=y1;gy++)for(let gx=x0;gx<=x1;gx++){const a=H.grid.get(gx+gy*1000);if(a)for(const m of a)fn(m)}}

// ---------- Урон ----------
function hurtMon(m,dmg,nx,ny,src){
  if(!m.alive)return;m.hp-=dmg;const kb=dmg*14/Math.sqrt(m.K.mass);m.vx+=nx*kb;m.vy+=ny*kb;
  if(m.grab){m.grab=null}
  if(dmg>H.bestHit&&src==='weapon')H.bestHit=dmg;
  drops(m.x,m.y,'#2a0a12',3+Math.min(6,dmg/8)|0,200+dmg*4);
  if(dmg>=30&&H.numsW.length<14)H.numsW.push({x:m.x,y:m.y-m.r-6,v:Math.round(dmg),t:0.8});
  if(m.hp<=0)killMon(m,src);
}
function killMon(m,src){
  m.alive=false;H.kills++;const K=m.K;
  const P=A()&&A().prof;
  if(P){P.hordeKills=(P.hordeKills||0)+1}
  A()&&A().reward(K.xp,K.coins);
  if(parts.length<900){sparks(m.x,m.y,K.boss?40:8,K.boss?900:400);drops(m.x,m.y,'#1a0608',K.boss?40:10,K.boss?600:320)}
  addP({type:'flash',x:m.x,y:m.y,life:0.18,max:0.18,size:m.r*3,rgb:K.crack});
  if(K.boom)explode(m);
  if(K.boss){H.boss=null;if(P){P.hordeBoss=(P.hordeBoss||0)+1}shake=Math.min(30,shake+18);slowT=0.6;sfx('boom',1);
    A()&&A().bigNums.push({x:m.x,y:m.y-80,vy:-30,age:0,life:2,tier:'word',word:'Пожиратель повержен!',color:'#d8a0ff',rot:0})}
  else sfx('thud',0.25);
  if(src==='weapon'){H.series.push(time);H.seriesT=0.7}
}
function explode(m){ // взрывун: урон по площади и монстрам, и игроку
  const R=140;addP({type:'ring',x:m.x,y:m.y,life:0.4,max:0.4,size:20,grow:500,rgb:'150,255,60'});addP({type:'flash',x:m.x,y:m.y,life:0.25,max:0.25,size:200,rgb:'170,255,90'});
  if(parts.length<900)sparks(m.x,m.y,24,700);sfx('boom',0.6);shake=Math.min(30,shake+5);
  near(m.x,m.y,R,o=>{if(o===m||!o.alive)return;const dx=o.x-m.x,dy=o.y-m.y,d=Math.hypot(dx,dy)||1;if(d<R+o.r){hurtMon(o,40,dx/d,dy/d,'boom')}});
  const b=player.body,dx=b.x-m.x,dy=b.y-m.y,d=Math.hypot(dx,dy)||1;
  if(player.alive&&d<R+b.r){hurtPlayer(16,m.x,m.y,'boom');const[vx,vy]=vel(b);setVel(b,vx+dx/d*700,vy+dy/d*700)}
}
function hurtPlayer(dmg,x,y,src){
  if(!player.alive||player.inv>0)return;H.dmgBy[src||'?']=(H.dmgBy[src||'?']||0)+dmg;
  player.hp-=dmg;player.hurt=0.25;player.squash=0.08;shake=Math.min(16,shake+dmg*0.3);
  drops(player.body.x,player.body.y,SKINS[player.skin].blood||'#a02020',3,200);sfx('hit',Math.min(1,dmg/30));
  if(player.hp<=0)kill(player,null);
}

// ---------- Шаг симуляции ----------
window.hordeStep=function(){
  if(!H)return;
  const dt=DT,b=player.body;
  // конец игры
  if(!player.alive&&!H.over){H.over=true;H.overT=0;player.respawnT=1e9;
    const P=A()&&A().prof;if(P){if(H.wave>(P.hordeBest||0))P.hordeBest=H.wave;A().checkAch()}}
  if(H.over){player.respawnT=1e9;H.overT+=dt}
  // фазы волн
  if(!H.over){
    if(H.phase==='pause'){H.phaseT-=dt;if(H.phaseT<=0)startWave()}
    else if(H.phase==='fight'){
      H.spawnT-=dt;
      if(H.queue.length&&H.spawnT<=0&&H.mons.length<MAX_ON){const n=Math.min(H.queue.length,H.queue[0]==='boss'?4:rnd(4+H.wave,8+2*H.wave)|0,20);openBreach(H.queue.splice(0,n));H.spawnT=Math.max(1.2,3.2-H.wave*0.12)}
      if(!H.queue.length&&!H.breaches.length&&!H.mons.length){H.phase='pause';H.phaseT=5;const c=10*H.wave;
        A()&&A().reward(30*H.wave,c);player.hp=Math.min(player.maxHp,player.hp+40);
        const P=A()&&A().prof;if(P&&H.wave>(P.hordeBest||0)){P.hordeBest=H.wave;A().checkAch()}
        H.banner={text:'Волна '+H.wave+' пройдена',sub:'+'+c+' монет · +40 здоровья · передышка 5 с',t:3}}}
  }
  if(H.banner){H.banner.t-=dt;if(H.banner.t<=0)H.banner=null}
  // проломы
  for(const br of H.breaches){br.t+=dt;if(br.t>br.warn){br.emitT-=dt;if(br.emitT<=0&&br.list.length&&H.mons.length<MAX_ON){br.emitT=0.12;spawnMon(br.list.shift(),br.x+rnd(-12,12),br.y+rnd(-12,12))}}}
  H.breaches=H.breaches.filter(br=>br.list.length||br.t<br.warn+0.6);
  // монстры: движение к игроку
  const grabbers=H.mons.filter(m=>m.grab).length;
  for(const m of H.mons){const K=m.K;
    m.hitCd-=dt;m.open=Math.max(0,m.open-dt*3);
    let tx=b.x,ty=b.y;
    if(m.grab){ // держит игрока: сидит на нём, кусает
      m.x=b.x+m.grab.ox;m.y=b.y+m.grab.oy;m.vx=m.vy=0;m.tick-=dt;m.open=1;
      if(m.tick<=0){m.tick=0.5;hurtPlayer(K.grab,m.x,m.y,'grab');m.bites=(m.bites||0)+1;
        if(m.bites>=3){m.bites=0;m.grab=null;m.hitCd=1;const a=Math.atan2(m.y-b.y,m.x-b.x);m.vx=Math.cos(a)*350;m.vy=Math.sin(a)*350}}
      continue}
    let dx=tx-m.x,dy=ty-m.y,d=Math.hypot(dx,dy)||1;
    if(m.k==='begun'){const s=Math.sin(time*6+m.jit)*0.45;const ux=dx/d,uy=dy/d;dx=ux-uy*s;dy=uy+ux*s;d=Math.hypot(dx,dy)||1}
    let sp=m.sp;
    // взрывун: подлетел — зажигает фитиль и останавливается
    if(K.boom){if(m.fuse<0&&d<95)m.fuse=0.8;if(m.fuse>=0){m.fuse-=dt;sp=0;m.open=1;if(m.fuse<=0){m.alive=false;H.kills++;explode(m);continue}}}
    // босс: рывок через арену и призыв бегунов
    if(K.boss){m.atkT-=dt;m.sumT-=dt;
      if(m.tele>0){m.tele-=dt;sp=0;if(m.tele<=0){m.dash=0.85;const L=Math.hypot(m.dx,m.dy)||1;m.vx=m.dx/L*1250;m.vy=m.dy/L*1250;sfx('dash',1)}}
      else if(m.dash>0){m.dash-=dt;sp=-1}
      else if(m.atkT<=0){m.atkT=rnd(4.5,6.5);m.tele=1;m.dx=dx;m.dy=dy}
      if(m.sumT<=0){m.sumT=rnd(9,11);for(let i=0;i<4;i++){const a=i/4*6.283;spawnMon('begun',m.x+Math.cos(a)*m.r*1.3,m.y+Math.sin(a)*m.r*1.3)}addP({type:'ring',x:m.x,y:m.y,life:0.5,max:0.5,size:m.r,grow:300,rgb:K.crack})}}
    if(sp>=0){const k=Math.min(1,K.acc*dt);m.vx+=(dx/d*sp-m.vx)*k;m.vy+=(dy/d*sp-m.vy)*k}
    m.x+=m.vx*dt;m.y+=m.vy*dt;
    const ta=Math.atan2(m.vy||dy,m.vx||dx);m.ang+=Math.atan2(Math.sin(ta-m.ang),Math.cos(ta-m.ang))*Math.min(1,dt*8);
    if(m.x<m.r){m.x=m.r;m.vx=Math.abs(m.vx)}if(m.x>AW-m.r){m.x=AW-m.r;m.vx=-Math.abs(m.vx)}if(m.y<m.r){m.y=m.r;m.vy=Math.abs(m.vy)}if(m.y>AH-m.r){m.y=AH-m.r;m.vy=-Math.abs(m.vy)}
    for(const c of PILLARS){const px=m.x-c.x,py=m.y-c.y,rr=c.r+m.r,d2=px*px+py*py;if(d2<rr*rr){const dd=Math.sqrt(d2)||1;m.x=c.x+px/dd*rr;m.y=c.y+py/dd*rr}}
  }
  H.mons=H.mons.filter(m=>m.alive);
  gridBuild();
  // монстр ↔ монстр (мягкое расталкивание по сетке)
  for(const m of H.mons){if(m.grab)continue;near(m.x,m.y,m.r+40,o=>{if(o===m||o.grab)return;const dx=o.x-m.x,dy=o.y-m.y,rr=m.r+o.r,d2=dx*dx+dy*dy;
    if(d2<rr*rr&&d2>0.01){const d=Math.sqrt(d2),push=(rr-d)*0.5,w=o.K.mass/(m.K.mass+o.K.mass);m.x-=dx/d*push*w;m.y-=dy/d*push*w}})}
  if(player.alive){
    // монстр ↔ тело игрока: хватает, толкает
    near(b.x,b.y,b.r+80,m=>{if(m.grab||!m.alive)return;const dx=m.x-b.x,dy=m.y-b.y,rr=b.r+m.r,d=Math.hypot(dx,dy)||1;if(d>=rr)return;
      if(m.K.grab&&m.hitCd<=0&&grabbers<2&&player.inv<=0&&time>(H.noGrab||0)){const a=Math.atan2(dy,dx);m.grab={ox:Math.cos(a)*(rr-4),oy:Math.sin(a)*(rr-4)};m.tick=0.25;return}
      if(m.K.shove&&m.hitCd<=0){m.hitCd=0.8;hurtPlayer(m.K.shove,m.x,m.y,'shove');const[vx,vy]=vel(b);const f=m.K.boss&&m.dash>0?900:520;setVel(b,vx-dx/d*f,vy-dy/d*f);m.open=1}
      const push=rr-d;m.x+=dx/d*push;m.y+=dy/d*push});
    // схваченный игрок замедляется; рывок стряхивает всех
    if(!grabbers&&player.hp<player.maxHp)player.hp=Math.min(player.maxHp,player.hp+1.5*dt); // медленная регенерация, пока никто не держит
    if(grabbers){const[vx,vy]=vel(b),k=1-0.0025*grabbers;setVel(b,vx*k,vy*k)}
    if(player.dashCd>1.5&&!H.dashSeen){H.dashSeen=true;H.noGrab=time+0.6;for(const m of H.mons)if(m.grab){const dx=m.x-b.x,dy=m.y-b.y,d=Math.hypot(dx,dy)||1;m.grab=null;m.vx=dx/d*500;m.vy=dy/d*500;m.hitCd=0.6}}
    if(player.dashCd<1.4)H.dashSeen=false;
    // оружие игрока ↔ монстры: голова оружия режет толпу и задевает многих за оборот
    const h=player.head,w=player.W;
    if(h&&w){const[hvx,hvy]=vel(h),hs=Math.hypot(hvx,hvy),thr=w.thr*0.55;
      if(hs>thr)for(const[px,py,pr]of weaponPoints(player))near(px,py,pr+80,m=>{if(!m.alive||m.hitCd>0)return;const dx=m.x-px,dy=m.y-py,rr=pr+m.r,d2=dx*dx+dy*dy;if(d2>=rr*rr)return;const d=Math.sqrt(d2)||1;
        const own=Math.max(hs*0.5,(hvx*dx+hvy*dy)/d);if(own<thr)return;
        const dmg=Math.min(120,(own-w.thr*0.4)*w.mass*w.k*1.4);m.hitCd=0.25;
        hurtMon(m,dmg,dx/d,dy/d,'weapon');if(dmg>20&&parts.length<900){sparks((m.x+h.x)/2,(m.y+h.y)/2,4,300)}
        // тяжёлые цели тормозят оружие, мелочь — почти нет
        const slow=m.K.mass>=5?0.75:0.96;setVel(h,hvx*slow,hvy*slow);
        if(m.K.mass>=5&&px===h.x){h.x-=dx/d*(rr-d);h.y-=dy/d*(rr-d)}
        if(w.fx==='leech')player.hp=Math.min(player.maxHp,player.hp+dmg*0.15);
      })}
    // звенья быстро вращающейся цепи сбивают мелочь и стряхивают схвативших
    if(w&&player.links.length)for(let i=1;i<player.links.length;i+=2){const l=player.links[i],[lvx,lvy]=vel(l),ls=Math.hypot(lvx,lvy);if(ls<320)continue;
      near(l.x,l.y,60,m=>{if(!m.alive||m.hitCd>0||m.K.mass>=5)return;const dx=m.x-l.x,dy=m.y-l.y,rr=m.r+7;if(dx*dx+dy*dy>=rr*rr)return;const d=Math.hypot(dx,dy)||1;
        m.hitCd=0.3;hurtMon(m,Math.min(14,ls*0.008),dx/d,dy/d,'weapon')})}
    // снаряды посоха
    for(const p of projs){if(p.life<=0||p.team!==player.team)continue;near(p.x,p.y,p.r+80,m=>{if(p.life<=0||!m.alive)return;const dx=m.x-p.x,dy=m.y-p.y;if(dx*dx+dy*dy<(p.r+m.r)**2){p.life=0;const d=Math.hypot(dx,dy)||1;hurtMon(m,p.dmg*1.6,dx/d,dy/d,'weapon');addP({type:'flash',x:p.x,y:p.y,life:0.15,max:0.15,size:60,rgb:'255,150,50'})}})}
  }
  // серии: несколько убийств за один оборот оружия
  if(H.seriesT>0){H.seriesT-=dt;if(H.seriesT<=0){const n=H.series.length;H.series=[];
    if(n>=2){const word=n>=4?'Мясорубка!':n===3?'Тройное':'Двойное',bonus=n>=4?n*5:n===3?10:5;
      if(n>H.bestCombo)H.bestCombo=n;const P=A()&&A().prof;if(P&&n>(P.hordeCombo||0)){P.hordeCombo=n}
      A()&&A().reward(n*4,bonus);
      A()&&A().bigNums.push({x:b.x,y:b.y-90,vy:-50,age:0,life:1.4,tier:'word',word:n>=4?word+' ×'+n:word,color:n>=4?'#ff5a3a':'#ffd36a',rot:0})}}}
  for(const n of H.numsW){n.t-=dt;n.y-=40*dt}H.numsW=H.numsW.filter(n=>n.t>0);
};

// ---------- Отрисовка ----------
window.hordeDraw=function(layer){
  if(!H)return;
  if(layer===0){
    // тени и тела монстров (освещаются сценой)
    for(const br of H.breaches){const k=Math.min(1,br.t/br.warn);ctx.save();ctx.translate(br.x,br.y);ctx.strokeStyle=`rgba(10,0,8,${0.4+k*0.5})`;ctx.lineWidth=5+k*6;ctx.lineCap='round';
      for(const p of br.crack){ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0]*(0.5+k*0.8),q[1]*(0.5+k*0.8)):ctx.moveTo(0,0));ctx.stroke()}ctx.restore()}
    for(const m of H.mons){const s=SPR[m.k],sc=m.r/s.R*1.05;
      ctx.globalAlpha=0.45;ctx.drawImage(shadowSpr,m.x+12-m.r*1.3,m.y+18-m.r*1.3,m.r*2.6,m.r*2.6);ctx.globalAlpha=1;
      ctx.save();ctx.translate(m.x,m.y);ctx.rotate(m.ang);if(Math.cos(m.ang)<0)ctx.scale(1,-1);
      const pulse=1+Math.sin(time*9+m.jit)*0.04;ctx.scale(sc*pulse,sc/pulse);
      if(m.fuse>=0){ctx.scale(1+(0.8-m.fuse)*0.4,1+(0.8-m.fuse)*0.4)}
      ctx.drawImage(s.frames[m.open>0.5||(Math.sin(time*5+m.jit)>0.6)?1:0].c,-s.S/2,-s.S/2);ctx.restore();
      if(m.K.boss&&m.tele>0){ctx.save();ctx.strokeStyle=`rgba(200,90,255,${0.3+0.5*(1-m.tele)})`;ctx.lineWidth=8;ctx.setLineDash([18,14]);ctx.beginPath();ctx.moveTo(m.x,m.y);const L=Math.hypot(m.dx,m.dy)||1;ctx.lineTo(m.x+m.dx/L*1100,m.y+m.dy/L*1100);ctx.stroke();ctx.restore()}}
  }else{
    // свечение: трещины монстров, проломы, фитили (поверх освещения)
    for(const br of H.breaches){const k=Math.min(1,br.t/br.warn),open=br.t>br.warn,fl=0.7+0.3*Math.sin(time*20+br.x);
      const R=(br.boss?160:90)*(0.4+k*0.8);const g=ctx.createRadialGradient(br.x,br.y,0,br.x,br.y,R);g.addColorStop(0,`rgba(255,${open?200:120},${open?255:60},${(0.25+k*0.6)*fl})`);g.addColorStop(0.4,`rgba(200,40,${open?200:30},${0.3*k})`);g.addColorStop(1,'rgba(120,0,60,0)');ctx.fillStyle=g;ctx.fillRect(br.x-R,br.y-R,R*2,R*2);
      ctx.save();ctx.translate(br.x,br.y);ctx.lineCap='round';for(const[wd,a]of[[10,0.25],[4,0.6],[1.6,1]]){ctx.strokeStyle=`rgba(255,${open?230:150},${open?255:90},${a*k*fl})`;ctx.lineWidth=wd;for(const p of br.crack){ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0]*(0.5+k*0.8),q[1]*(0.5+k*0.8)):ctx.moveTo(0,0));ctx.stroke()}}ctx.restore()}
    for(const m of H.mons){const s=SPR[m.k],sc=m.r/s.R*1.05;ctx.save();ctx.translate(m.x,m.y);ctx.rotate(m.ang);if(Math.cos(m.ang)<0)ctx.scale(1,-1);ctx.scale(sc,sc);
      ctx.globalAlpha=0.7+0.3*Math.sin(time*4+m.jit);ctx.drawImage(s.frames[m.open>0.5?1:0].g,-s.S/2,-s.S/2);ctx.restore();ctx.globalAlpha=1;
      if(m.fuse>=0){const g=ctx.createRadialGradient(m.x,m.y,0,m.x,m.y,m.r*3);g.addColorStop(0,`rgba(170,255,90,${0.5+0.5*Math.sin(time*40)})`);g.addColorStop(1,'rgba(120,255,60,0)');ctx.fillStyle=g;ctx.fillRect(m.x-m.r*3,m.y-m.r*3,m.r*6,m.r*6)}}
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 15px Georgia, serif';
    for(const n of H.numsW){ctx.globalAlpha=Math.min(1,n.t*2);ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,0.8)';ctx.strokeText(n.v,n.x,n.y);ctx.fillStyle='#f2e6d0';ctx.fillText(n.v,n.x,n.y)}ctx.globalAlpha=1;
  }
};
window.hordeLights=function(){
  if(!H)return;
  for(const br of H.breaches)addLight(br.x,br.y,260,'255,80,140',0.6*Math.min(1,br.t/br.warn));
  let n=0;for(const m of H.mons){if(m.K.boss||m.fuse>=0||(n++%4===0))addLight(m.x,m.y,m.K.boss?320:110,m.K.crack,m.K.boss?0.6:0.25)}
};
window.hordeHUD=function(){
  if(!H)return;
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.textAlign='center';ctx.textBaseline='middle';
  // счётчик волны и монстров
  panel(VW/2-130,12,260,44);ctx.font='700 20px Georgia, serif';ctx.fillStyle='#e9d8ae';ctx.fillText(H.wave?'Волна '+H.wave:'Нашествие',VW/2,28);
  ctx.font='11.5px Segoe UI, Arial';ctx.fillStyle='#a8946a';ctx.fillText('монстров: '+(H.mons.length+H.queue.length+H.breaches.reduce((s,b)=>s+b.list.length,0))+' · уничтожено: '+H.kills,VW/2,46);
  // здоровье босса
  if(H.boss&&H.boss.alive){const bw=Math.min(520,VW-80),x=VW/2-bw/2,y=66;panel(x-6,y-4,bw+12,26);ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(x,y+10,bw,8);
    const g=ctx.createLinearGradient(x,0,x+bw,0);g.addColorStop(0,'#6a2aa8');g.addColorStop(1,'#d07aff');ctx.fillStyle=g;ctx.fillRect(x,y+10,bw*Math.max(0,H.boss.hp/H.boss.maxHp),8);
    ctx.font='600 11px Segoe UI, Arial';ctx.fillStyle='#e0c8ff';ctx.fillText(KIND.boss.name,VW/2,y+4)}
  // надпись волны (не в самом центре — выше, чтобы не закрывать бой)
  if(H.banner){const a=Math.min(1,H.banner.t*2,(H.banner.t>2?3-H.banner.t:1)*2);ctx.globalAlpha=Math.max(0,a);ctx.font=`44px ${'"Ruslan Display",Georgia,serif'}`;ctx.lineWidth=6;ctx.strokeStyle='#1a0505';
    ctx.strokeText(H.banner.text,VW/2,VH*0.2);ctx.fillStyle='#ffd36a';ctx.fillText(H.banner.text,VW/2,VH*0.2);
    if(H.banner.sub){ctx.font='600 16px Segoe UI, Arial';ctx.fillStyle='#e9d8ae';ctx.fillText(H.banner.sub,VW/2,VH*0.2+38)}ctx.globalAlpha=1}
  // экран итогов
  if(H.over){const a=Math.min(1,H.overT);ctx.globalAlpha=a*0.75;ctx.fillStyle='#050308';ctx.fillRect(0,0,VW,VH);ctx.globalAlpha=a;
    const P=A()&&A().prof;const w=Math.min(460,VW-40),x=VW/2-w/2,y=VH/2-150;panel(x,y,w,300);
    ctx.font='40px "Ruslan Display",Georgia,serif';ctx.fillStyle='#ff6a5a';ctx.fillText('Нашествие окончено',VW/2,y+46);
    ctx.font='600 17px Segoe UI, Arial';ctx.fillStyle='#e9d8ae';
    const rows=[['Волна',H.wave],['Монстров уничтожено',H.kills],['Лучший удар',Math.round(H.bestHit)],['Лучшая серия',H.bestCombo||'—'],['Рекорд',(P&&P.hordeBest)||H.wave]];
    rows.forEach(([k,v],i)=>{ctx.textAlign='left';ctx.fillStyle='#a8946a';ctx.fillText(k,x+40,y+100+i*30);ctx.textAlign='right';ctx.fillStyle='#f2ead6';ctx.fillText(v,x+w-40,y+100+i*30)});
    ctx.textAlign='center';ctx.font='13px Segoe UI, Arial';ctx.fillStyle='#8f8573';ctx.fillText('Enter — ещё раз · Esc — меню',VW/2,y+280);ctx.globalAlpha=1}
};

// ---------- Запуск и клавиши ----------
const _start=startGame;
startGame=function(){_start();if(mode==='horde'){H=newState();player.respawnT=0}else H=null};
addEventListener('keydown',e=>{if(H&&H.over&&H.overT>0.6&&e.code==='Enter'&&!paused){startGame()}});

// ---------- Достижения ----------
const ACH=A()&&A().ACH;
if(ACH){ACH.push({id:'horde10',name:'Несокрушимый',desc:'Пережить 10 волн Нашествия',stat:'hordeBest',goal:10,coins:300},
  {id:'hordeBoss',name:'Убийца Пожирателя',desc:'Убить босса Нашествия',stat:'hordeBoss',goal:1,coins:200},
  {id:'horde1000',name:'Истребитель',desc:'Уничтожить 1000 монстров',stat:'hordeKills',goal:1000,coins:500},
  {id:'hordeCombo10',name:'Мясорубка',desc:'10 монстров за один оборот',stat:'hordeCombo',goal:10,coins:300})}
window.__horde={state:()=>H,KIND,spawnMon:(k,x,y)=>H&&spawnMon(k,x,y)};
})();
