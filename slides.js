const viewer = document.getElementById('viewer');
const canvas = document.getElementById('canvas');
const slides = [...document.querySelectorAll('.content')];
const prev = document.getElementById('prev');
const next = document.getElementById('next');
const fullscreen = document.getElementById('fullscreen');
const counter = document.getElementById('counter');
let current = 0;
let idleTimer;

function fit() {
  const scale = Math.min(viewer.clientWidth / 1920, viewer.clientHeight / 1080);
  canvas.style.transform = `translate(${-960 * scale}px, ${-540 * scale}px) scale(${scale})`;
}

function wake() {
  document.body.classList.remove('idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => document.body.classList.add('idle'), 2200);
}

function show(index, updateUrl = true) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === current);
    slide.setAttribute('aria-hidden', String(i !== current));
  });
  counter.textContent = `${current + 1} / ${slides.length}`;
  prev.disabled = current === 0;
  next.disabled = current === slides.length - 1;
  if (updateUrl) history.replaceState(null, '', `#${current + 1}`);
  wake();
}

function readHash() {
  const page = Number(location.hash.slice(1));
  show(Number.isInteger(page) && page >= 1 && page <= slides.length ? page - 1 : 0, false);
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch (_) { wake(); }
}

prev.addEventListener('click', () => show(current - 1));
next.addEventListener('click', () => show(current + 1));
fullscreen.addEventListener('click', toggleFullscreen);
if (!document.fullscreenEnabled) fullscreen.hidden = true;
document.addEventListener('fullscreenchange', () => {
  fullscreen.setAttribute('aria-label', document.fullscreenElement ? '退出全屏' : '进入全屏');
  fit();
});
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target.closest('button') && [' ', 'Enter'].includes(event.key)) return;
  switch (event.key) {
    case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
      event.preventDefault(); show(current + 1); break;
    case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
      event.preventDefault(); show(current - 1); break;
    case 'Home': event.preventDefault(); show(0); break;
    case 'End': event.preventDefault(); show(slides.length - 1); break;
    case 'f': case 'F': toggleFullscreen(); break;
    case 'Tab': wake(); break;
  }
});
let touchStart;
viewer.addEventListener('touchstart', event => {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
  wake();
}, { passive: true });
viewer.addEventListener('touchend', event => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
  touchStart = null;
}, { passive: true });
viewer.addEventListener('click', event => {
  if (event.pointerType === 'touch') return;
  show(current + (event.clientX < viewer.clientWidth / 2 ? -1 : 1));
});
document.addEventListener('pointermove', wake, { passive: true });
document.addEventListener('focusin', wake);
window.addEventListener('resize', fit);
window.addEventListener('hashchange', readHash);
document.querySelectorAll('#canvas img').forEach(img => img.addEventListener('error', () => {
  document.getElementById('error').style.display = 'grid';
}));
fit();
readHash();
