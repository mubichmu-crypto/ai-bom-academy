/** Bomdami stays still by default. Click opens choices, never direct navigation. */
(()=>{'use strict';if(document.querySelector('.bomdam-firefly'))return;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const read=k=>{try{return localStorage.getItem(k);}catch{return null;}};
const remember=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
const sprite=document.createElement('button');sprite.type='button';sprite.className='bomdam-firefly';sprite.setAttribute('aria-label','봄담이 메뉴 열기');sprite.setAttribute('aria-controls','firefly-menu');sprite.setAttribute('aria-expanded','false');sprite.title='멈추기·숨기기·무료 선물을 선택하세요';sprite.innerHTML='<span class="firefly-halo"></span><img src="assets/golden-bird-bomdam-dressed.png" alt="" width="1280" height="1280">';
  const portrait = sprite.querySelector('img');
  // GIF를 그대로 그리되 작은 화면에서도 보이도록 날개 끝만 추가 변형합니다.
  const wings = document.createElement('canvas');
  wings.width = wings.height = 500;
  wings.setAttribute('aria-hidden', 'true');
  sprite.append(wings);
  const paint = wings.getContext('2d');
  let wingTime = 0;
  const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
  function paintWings(time) {
    if (!portrait.complete || !portrait.naturalWidth) return;
    if (time - wingTime < 32) return;
    wingTime = time;
    paint.clearRect(0, 0, 500, 500);
    const wave = Math.sin(time / 150);
    const sw = portrait.naturalWidth / 500, sh = portrait.naturalHeight / 500;
    for (let x = 0; x < 500; x += 10) {
      const left = smooth((155 - x) / 110);
      const right = smooth((x - 355) / 110);
      if (!left && !right) { paint.drawImage(portrait, x*sw, 0, 10*sw, 500*sh, x, 0, 10, 500); continue; }
      for (let y = 0; y < 500; y += 10) {
        const weight = left * smooth((y-125)/50) * smooth((390-y)/65)
          + right * smooth((y-235)/45) * smooth((435-y)/55);
        const offset = 35 * wave * weight;
        const yn = y + 10;
        const nextWeight = left * smooth((yn-125)/50) * smooth((390-yn)/65)
          + right * smooth((yn-235)/45) * smooth((435-yn)/55);
        const nextOffset = 35 * wave * nextWeight;
        paint.drawImage(portrait, x*sw, y*sh, 10*sw, 10*sh, x, y+offset, 10, Math.max(1,10+nextOffset-offset)+.6);
      }
    }
    sprite.classList.add('wings-ready');
  }

const toggle=document.createElement('button');toggle.type='button';toggle.className='firefly-toggle';toggle.setAttribute('aria-controls','firefly-menu');
const menu=document.createElement('section');menu.id='firefly-menu';menu.className='firefly-menu';menu.hidden=true;menu.setAttribute('aria-label','봄담이 선택 메뉴');menu.innerHTML='<div class="firefly-menu-head"><strong>봄담이와 무엇을 할까요?</strong><button type="button" data-close aria-label="봄담이 메뉴 닫기">×</button></div><p>원하는 것을 골라 주세요. 닫으면 이 페이지에 그대로 있어요.</p><button type="button" data-motion></button><button type="button" data-hide>봄담이 숨기기</button><a href="gift.html">무료 선물 6종 보기 ↗</a><button type="button" data-stay>아무것도 안 하고 닫기</button>';
document.body.append(sprite,toggle,menu);
let hidden=read('aibom.firefly.hidden')==='yes',paused=reduced.matches||read('aibom.firefly.motion')!=='running';
let frame=0,elapsed=0,previous=null,width=innerWidth,height=innerHeight;
  function place() {
    const small = width <= 620;
    const size = small ? 48 : 76;
    const margin = small ? 4 : 12;
    const top = Math.min(100, height * .18);
    const bottom = Math.max(top, height - size - 70);
    // 한 바퀴에 약 38초: 중앙을 가로지르지 않는 완만한 타원 궤적.
    const angle = elapsed / 38000 * Math.PI * 2;
    const centerX = (width - size) / 2;
    const radiusX = Math.max(0, centerX - margin);
    const centerY = (top + bottom) / 2;
    const radiusY = Math.max(0, (bottom - top) / 2);
    const x = centerX + Math.cos(angle) * radiusX;
    const y = centerY + Math.sin(angle) * radiusY;
    sprite.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    sprite.style.setProperty('--flight-tilt', `${(Math.cos(angle) * 9).toFixed(1)}deg`);
  }

  function draw(time) {
    frame = 0;
    if (paused || hidden || !menu.hidden || document.hidden) { previous = null; return; }
    if (previous !== null) elapsed += Math.min(time - previous, 80);
    previous = time;
    place();
    paintWings(time);
    frame = requestAnimationFrame(draw);
  }


function sync(){cancelAnimationFrame(frame);frame=0;previous=null;const resting=paused||hidden||!menu.hidden||document.hidden;sprite.hidden=hidden;sprite.classList.toggle('is-still',resting);if(resting)sprite.classList.remove('wings-ready');const src=resting?'assets/golden-bird-bomdam-dressed.png':'assets/bomdam-wing-flight.gif';if(portrait.getAttribute('src')!==src)portrait.src=src;toggle.textContent=hidden?'봄담이 보이기':'봄담이 설정';toggle.setAttribute('aria-label',hidden?'숨긴 봄담이 다시 보이기':'봄담이 선택 메뉴 열기');const motion=menu.querySelector('[data-motion]');motion.textContent=paused?'다시 움직이기':'움직임 멈추기';motion.disabled=reduced.matches;if(reduced.matches)motion.textContent='움직임 줄이기 설정 적용 중';place();if(!resting)frame=requestAnimationFrame(draw);}
function closeMenu(){menu.hidden=true;toggle.setAttribute('aria-expanded','false');sprite.setAttribute('aria-expanded','false');sync();}
function openMenu(){paused=true;remember('aibom.firefly.motion','paused');menu.hidden=false;toggle.setAttribute('aria-expanded','true');sprite.setAttribute('aria-expanded','true');sync();menu.querySelector('[data-close]').focus({preventScroll:true});}
sprite.onclick=openMenu;toggle.onclick=()=>{if(hidden){hidden=false;remember('aibom.firefly.hidden','no');openMenu();}else if(menu.hidden)openMenu();else closeMenu();};
menu.querySelector('[data-motion]').onclick=()=>{paused=!paused;remember('aibom.firefly.motion',paused?'paused':'running');closeMenu();toggle.focus({preventScroll:true});};
menu.querySelector('[data-hide]').onclick=()=>{hidden=true;remember('aibom.firefly.hidden','yes');closeMenu();toggle.focus({preventScroll:true});};
for(const b of menu.querySelectorAll('[data-close],[data-stay]'))b.onclick=()=>{closeMenu();toggle.focus({preventScroll:true});};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();toggle.focus({preventScroll:true});}});
document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!menu.contains(e.target)&&!sprite.contains(e.target)&&!toggle.contains(e.target))closeMenu();});
sprite.addEventListener('pointerenter',()=>{cancelAnimationFrame(frame);frame=0;previous=null;});sprite.addEventListener('pointerleave',sync);sprite.addEventListener('focus',()=>{cancelAnimationFrame(frame);frame=0;previous=null;});sprite.addEventListener('blur',sync);
reduced.addEventListener('change',()=>{if(reduced.matches)paused=true;sync();});document.addEventListener('visibilitychange',sync);window.addEventListener('resize',()=>{width=innerWidth;height=innerHeight;place();});window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));window.addEventListener('pageshow',sync);sync();})();
