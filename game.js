(() => {
  'use strict';

  const VERSION = '1.0.0';
  console.log('Angelspiel V' + VERSION);

  const boatScene = document.getElementById('boatScene');
  const fishingScene = document.getElementById('fishingScene');
  const boat = document.getElementById('boat');
  const speedValue = document.getElementById('speedValue');
  const goalText = document.getElementById('goalText');
  const fishBtn = document.getElementById('fishBtn');
  const fishingZone = document.getElementById('fishingZone');

  const buttons = {
    left: document.getElementById('leftBtn'),
    right: document.getElementById('rightBtn'),
    gas: document.getElementById('gasBtn'),
    brake: document.getElementById('brakeBtn')
  };

  const held = {left:false,right:false,gas:false,brake:false};
  const boatState = { x: 0.38, y: 0.70, angle: 0, speed: 0 };
  let last = performance.now();

  function bindHold(el, key){
    const on = e => { e.preventDefault(); held[key] = true; el.classList.add('pressed'); try{el.setPointerCapture(e.pointerId)}catch{} };
    const off = e => { e.preventDefault(); held[key] = false; el.classList.remove('pressed'); };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('lostpointercapture', off);
  }
  Object.entries(buttons).forEach(([k,el]) => bindHold(el,k));

  function zoneCenter(){
    const r = fishingZone.getBoundingClientRect();
    return {x:(r.left+r.width/2)/innerWidth,y:(r.top+r.height/2)/innerHeight};
  }

  function updateBoat(dt){
    if (!boatScene.classList.contains('active')) return;

    if (held.gas) boatState.speed += 0.30 * dt;
    else boatState.speed -= 0.10 * dt;
    if (held.brake) boatState.speed -= 0.55 * dt;
    boatState.speed = Math.max(0, Math.min(0.32, boatState.speed));

    const steeringStrength = (0.65 + boatState.speed * 2.2) * dt;
    if (held.left) boatState.angle -= 95 * steeringStrength;
    if (held.right) boatState.angle += 95 * steeringStrength;

    const rad = boatState.angle * Math.PI/180;
    boatState.x += Math.sin(rad) * boatState.speed * dt * 0.42;
    boatState.y -= Math.cos(rad) * boatState.speed * dt * 0.42;

    boatState.x = Math.max(0.08, Math.min(0.92, boatState.x));
    boatState.y = Math.max(0.20, Math.min(0.88, boatState.y));

    boat.style.left = (boatState.x*100) + '%';
    boat.style.top = (boatState.y*100) + '%';
    boat.style.transform = `translate(-50%,-50%) rotate(${boatState.angle}deg)`;
    boat.classList.toggle('moving', boatState.speed > 0.025);
    speedValue.textContent = Math.round(boatState.speed/0.32*35) + ' km/h';

    const z = zoneCenter();
    const d = Math.hypot(boatState.x-z.x, boatState.y-z.y);
    const inZone = d < 0.085;
    const stopped = boatState.speed < 0.025;
    if(inZone && stopped){
      goalText.textContent = 'Angelplatz erreicht!';
      fishBtn.classList.remove('hidden');
    } else if(inZone){
      goalText.textContent = 'Jetzt bremsen';
      fishBtn.classList.add('hidden');
    } else {
      goalText.textContent = 'Zum Angelplatz fahren';
      fishBtn.classList.add('hidden');
    }
  }

  function loop(now){
    const dt = Math.min(0.035,(now-last)/1000);
    last = now;
    updateBoat(dt);
    updatePlayer(dt);
    requestAnimationFrame(loop);
  }

  function switchScene(toFishing){
    boatScene.classList.toggle('active', !toFishing);
    fishingScene.classList.toggle('active', toFishing);
    Object.keys(held).forEach(k => held[k] = false);
    Object.values(buttons).forEach(b => b.classList.remove('pressed'));
  }
  fishBtn.addEventListener('click', () => switchScene(true));
  document.getElementById('backBtn').addEventListener('click', () => switchScene(false));

  // --- Joystick / Figur ---
  const joystick = document.getElementById('joystick');
  const stick = document.getElementById('stick');
  const player = document.getElementById('player');
  const deck = document.querySelector('.bigBoatDeck');
  const joy = {active:false,x:0,y:0,pointerId:null};
  const playerState = {x:0.50,y:0.64,angle:0};

  function setJoystick(clientX, clientY){
    const r = joystick.getBoundingClientRect();
    const cx=r.left+r.width/2, cy=r.top+r.height/2;
    let dx=clientX-cx, dy=clientY-cy;
    const max=r.width*0.31;
    const len=Math.hypot(dx,dy)||1;
    if(len>max){dx=dx/len*max;dy=dy/len*max;}
    joy.x=dx/max; joy.y=dy/max;
    stick.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
  }
  function resetJoystick(){
    joy.active=false;joy.x=joy.y=0;joy.pointerId=null;
    stick.style.transform='translate(-50%,-50%)';
  }
  joystick.addEventListener('pointerdown', e=>{
    e.preventDefault();joy.active=true;joy.pointerId=e.pointerId;joystick.setPointerCapture(e.pointerId);setJoystick(e.clientX,e.clientY);
  });
  joystick.addEventListener('pointermove', e=>{if(joy.active && e.pointerId===joy.pointerId)setJoystick(e.clientX,e.clientY)});
  joystick.addEventListener('pointerup', resetJoystick);
  joystick.addEventListener('pointercancel', resetJoystick);

  function updatePlayer(dt){
    if(!fishingScene.classList.contains('active')) return;
    const mag=Math.hypot(joy.x,joy.y);
    if(mag>0.08){
      const speed=0.28;
      playerState.x += joy.x*speed*dt;
      playerState.y += joy.y*speed*dt;
      playerState.x=Math.max(0.17,Math.min(0.83,playerState.x));
      playerState.y=Math.max(0.31,Math.min(0.86,playerState.y));
      playerState.angle=Math.atan2(joy.x,-joy.y)*180/Math.PI;
    }
    player.style.left=(playerState.x*100)+'%';
    player.style.top=(playerState.y*100)+'%';
    player.style.transform=`translate(-50%,-50%) rotate(${playerState.angle}deg)`;
  }

  // Verhindert Browser-Scroll/Zoom in der Spieloberfläche
  document.addEventListener('touchmove', e=>e.preventDefault(), {passive:false});
  document.addEventListener('contextmenu', e=>e.preventDefault());

  requestAnimationFrame(loop);
})();
