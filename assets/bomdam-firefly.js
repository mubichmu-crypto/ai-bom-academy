/** AI봄 메인: 금빛 날개 봄담이의 반딧불이 비행.
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
  sprite.setAttribute('aria-label', '봄담이와 무료 선물 받기');
  sprite.title = '나를 누르면 무료 선물방으로 가요';
  sprite.innerHTML = '<span class="firefly-halo"></span><img src="assets/golden-bird-bomdam-dressed.png" alt="" width="1280" height="1280">';
  const portrait = sprite.querySelector('img');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'firefly-toggle';
  toggle.setAttribute('aria-label', '날개 봄담이 움직임 멈추기');
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
    frame = requestAnimationFrame(draw);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = null;
    sprite.classList.toggle('is-still', paused || document.hidden);
    const imagePath = paused || document.hidden ? 'assets/golden-bird-bomdam-dressed.png' : 'assets/bomdam-wing-flight.gif';
    if (portrait.getAttribute('src') !== imagePath) portrait.setAttribute('src', imagePath);
    toggle.textContent = paused ? '날개 봄담이 재생' : '날개 봄담이 멈춤';
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? '날개 봄담이 움직임 재생하기' : '날개 봄담이 움직임 멈추기');
    toggle.disabled = reduced.matches;
    if (reduced.matches) toggle.textContent = '봄담이 · 움직임 줄임';
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
