(()=>{
'use strict';
const VERSION='1.2.0';
console.log('Fishing Adventures V'+VERSION);
const boatScene=document.getElementById('boatScene');
const fishingScene=document.getElementById('fishingScene');
const boat=document.getElementById('boat');
const speedValue=document.getElementById('speedValue');
const needle=document.getElementById('needle');
const goalOverlay=document.getElementById('goalOverlay');
const fishBtn=document.getElementById('fishBtn');
const buttons={left:document.getElementById('leftBtn'),right:document.getElementById('rightBtn'),gas:document.getElementById('gasBtn'),brake:document.getElementById('brakeBtn')};
const held={left:false,right:false,gas:false,brake:false};
const state={x:.39,y:.67,angle:20,speed:0};
let last=performance.now();
function bindHold(el,key){
  const on=e=>{e.preventDefault();held[key]=true;el.classList.add('pressed');try{el.setPointerCapture(e.pointerId)}catch(_){}};
  const off=e=>{e.preventDefault();held[key]=false;el.classList.remove('pressed')};
  el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('lostpointercapture',off);
}
Object.entries(buttons).forEach(([k,b])=>bindHold(b,k));
function updateBoat(dt){
 if(!boatScene.classList.contains('active'))return;
 if(held.gas)state.speed+=.31*dt;else state.speed-=.08*dt;
 if(held.brake)state.speed-=.62*dt;
 state.speed=Math.max(0,Math.min(.32,state.speed));
 const turn=(.35+state.speed*2.6)*dt;
 if(held.left)state.angle-=90*turn;
 if(held.right)state.angle+=90*turn;
 const r=state.angle*Math.PI/180;
 state.x+=Math.sin(r)*state.speed*dt*.39;
 state.y-=Math.cos(r)*state.speed*dt*.39;
 state.x=Math.max(.12,Math.min(.89,state.x));state.y=Math.max(.18,Math.min(.86,state.y));
 boat.style.left=(state.x*100)+'%';boat.style.top=(state.y*100)+'%';boat.style.transform=`translate(-50%,-50%) rotate(${state.angle}deg)`;
 boat.classList.toggle('moving',state.speed>.02);
 const kmh=Math.round(state.speed/.32*35);speedValue.textContent=kmh;needle.style.transform=`rotate(${-115+(kmh/35)*225}deg)`;
 // Zielzone entspricht der gelben Markierung rechts oben im Hintergrund
 const dx=state.x-.675,dy=state.y-.47,d=Math.hypot(dx,dy);const inZone=d<.095,stopped=state.speed<.025;
 if(inZone&&stopped){goalOverlay.textContent='Angelplatz erreicht!';fishBtn.classList.remove('hidden')}
 else if(inZone){goalOverlay.textContent='Angelplatz erreicht – jetzt bremsen.';fishBtn.classList.add('hidden')}
 else{goalOverlay.textContent='Fahr zum markierten Angelplatz.';fishBtn.classList.add('hidden')}
}
function switchScene(fishing){boatScene.classList.toggle('active',!fishing);fishingScene.classList.toggle('active',fishing);Object.keys(held).forEach(k=>held[k]=false);Object.values(buttons).forEach(b=>b.classList.remove('pressed'))}
fishBtn.addEventListener('click',()=>switchScene(true));document.getElementById('backBtn').addEventListener('click',()=>switchScene(false));
const joystick=document.getElementById('joystick'),stick=document.getElementById('stick'),player=document.getElementById('player');
const joy={active:false,x:0,y:0,id:null};const ps={x:.49,y:.58};
function setJoy(x,y){const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=x-cx,dy=y-cy;const max=r.width*.31,l=Math.hypot(dx,dy)||1;if(l>max){dx=dx/l*max;dy=dy/l*max}joy.x=dx/max;joy.y=dy/max;stick.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`}
function resetJoy(){joy.active=false;joy.id=null;joy.x=joy.y=0;stick.style.transform='translate(-50%,-50%)'}
joystick.addEventListener('pointerdown',e=>{e.preventDefault();joy.active=true;joy.id=e.pointerId;try{joystick.setPointerCapture(e.pointerId)}catch(_){}setJoy(e.clientX,e.clientY)});joystick.addEventListener('pointermove',e=>{if(joy.active&&e.pointerId===joy.id)setJoy(e.clientX,e.clientY)});joystick.addEventListener('pointerup',resetJoy);joystick.addEventListener('pointercancel',resetJoy);
function insideDeck(x,y){
 // grobe begehbare Deckfläche passend zur isometrischen Bootsgrafik
 if(y<.20||y>.88||x<.27||x>.73)return false;
 const t=(y-.20)/.68;const left=.37-.11*t,right=.61+.12*t;return x>=left&&x<=right;
}
function updatePlayer(dt){if(!fishingScene.classList.contains('active'))return;const m=Math.hypot(joy.x,joy.y);if(m>.08){const s=.21;let nx=ps.x+joy.x*s*dt,ny=ps.y+joy.y*s*dt;if(insideDeck(nx,ps.y))ps.x=nx;if(insideDeck(ps.x,ny))ps.y=ny;const tilt=Math.max(-8,Math.min(8,joy.x*8));player.style.transform=`translate(-50%,-50%) rotate(${tilt}deg)`}player.style.left=(ps.x*100)+'%';player.style.top=(ps.y*100)+'%'}
function loop(now){const dt=Math.min(.035,(now-last)/1000);last=now;updateBoat(dt);updatePlayer(dt);requestAnimationFrame(loop)}
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});document.addEventListener('contextmenu',e=>e.preventDefault());requestAnimationFrame(loop);
})();
