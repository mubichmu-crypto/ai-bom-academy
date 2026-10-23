/** AI봄 메인: 금빛 반디봄담이의 반딧불이 비행.
 * 날개짓 GIF를 사용하며 멈춤 상태에서는 정지 그림으로 전환합니다.
 * 화면 가장자리를 천천히 돌며, 봄담이를 누르면 무료 선물방으로 이동합니다.
 */
(() => {
  'use strict';
  if (document.querySelector('.bomdam-firefly')) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sprite = document.createElement('a');
  sprite.className = 'bomdam-firefly';
  sprite.href = 'gift.html';
  sprite.setAttribute('aria-label', '반디봄담이와 무료 선물 받기');
  sprite.title = '나를 누르면 무료 선물방으로 가요';
  sprite.innerHTML = '<span class="firefly-halo"></span><img src="assets/golden-bird-bomdam-dressed.png" alt="" width="1280" height="1280">';
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
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'firefly-toggle';
  toggle.setAttribute('aria-label', '반디봄담이 움직임 멈추기');
  document.body.append(sprite, toggle);

  let paused = reduced.matches;
  let frame = 0;
  let elapsed = 0;
  let previous = null;
  let width = window.innerWidth;
  let height = window.innerHeight;

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
    if (paused || document.hidden) { previous = null; return; }
    if (previous !== null) elapsed += Math.min(time - previous, 80);
    previous = time;
    place();
    paintWings(time);
    frame = requestAnimationFrame(draw);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = null;
    sprite.classList.toggle('is-still', paused || document.hidden);
    if (paused || document.hidden) sprite.classList.remove('wings-ready');
    const imagePath = paused || document.hidden ? 'assets/golden-bird-bomdam-dressed.png' : 'assets/bomdam-wing-flight.gif';
    if (portrait.getAttribute('src') !== imagePath) portrait.setAttribute('src', imagePath);
    toggle.textContent = paused ? '반디봄담이 재생' : '반디봄담이 멈춤';
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? '반디봄담이 움직임 재생하기' : '반디봄담이 움직임 멈추기');
    toggle.disabled = reduced.matches;
    if (reduced.matches) toggle.textContent = '반디봄담이 · 움직임 줄임';
    place();
    if (!paused && !document.hidden) frame = requestAnimationFrame(draw);
  }

  sprite.addEventListener('pointerenter', () => { cancelAnimationFrame(frame); frame = 0; previous = null; });
  sprite.addEventListener('pointerleave', sync);
  sprite.addEventListener('focus', () => { cancelAnimationFrame(frame); frame = 0; previous = null; });
  sprite.addEventListener('blur', sync);
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; sync(); });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    place();
  });
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
  window.addEventListener('pageshow', sync);
  sync();
})();

