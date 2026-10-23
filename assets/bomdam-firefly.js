/** AI봄 메인: 금빛 날개 봄담이의 반딧불이 비행.
 * 그림 파일은 기존 golden-bird-bomdam-dressed.png를 그대로 사용합니다.
 * 화면 가장자리를 천천히 돌며, 글과 버튼의 클릭을 막지 않습니다.
 */
(() => {
  'use strict';
  if (document.querySelector('.bomdam-firefly')) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sprite = document.createElement('div');
  sprite.className = 'bomdam-firefly';
  sprite.setAttribute('aria-hidden', 'true');
  sprite.innerHTML = '<span class="firefly-halo"></span><img src="assets/golden-bird-bomdam-dressed.png" alt="" width="1280" height="1280">';
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
    toggle.textContent = paused ? '날개 봄담이 재생' : '날개 봄담이 멈춤';
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? '날개 봄담이 움직임 재생하기' : '날개 봄담이 움직임 멈추기');
    toggle.disabled = reduced.matches;
    if (reduced.matches) toggle.textContent = '봄담이 · 움직임 줄임';
    place();
    if (!paused && !document.hidden) frame = requestAnimationFrame(draw);
  }

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
