/**
 * Product sphere.
 *
 * Four packs sit on an invisible orbital field. Scroll position through the
 * section (or a horizontal drag on touch) drives one continuous angle; each
 * pack's depth is derived from cos(angle) and expressed as transform + opacity.
 *
 * Cost per frame: 4 transform writes and 4 opacity writes, both compositor
 * properties. Blur is quantised so the (expensive) filter string is rewritten
 * only when it visibly changes, and the drop shadow is static CSS.
 */

/**
 * Flavour worlds. Backgrounds are deep enough that the cream headline, body
 * copy and accent label all clear 4.5:1 against them — the lighter tans and
 * greens from the design export read at 2.4:1 and 3.4:1, which is unusable.
 * Hues are unchanged: warm caramel, chocolate purple, spicy red, fresh green.
 */
const FLAVOURS = [
  {
    name: 'Peanut Butter',
    ghost: 'Peanut Butter',
    desc: 'Sweet, salty, nutty and crowd favourite.',
    bg: '#9C520D', deep: '#5A2C04', accent: '#FFE3A8'
  },
  {
    name: 'Brownie',
    ghost: 'Brownie',
    desc: 'Rich & chocolatey without the guilt.',
    bg: '#6A4AA0', deep: '#2A1745', accent: '#F5CE5C'
  },
  {
    name: 'Spicy Kimchi Cheese',
    ghost: 'Kimchi Cheese',
    desc: 'Bold, fiery, cheesy and extremely addictive.',
    bg: '#A8250F', deep: '#4E0F06', accent: '#FFC93D'
  },
  {
    name: 'Herb n Zing',
    ghost: 'Herb n Zing',
    desc: 'Zesty, herby, and packed with a punch.',
    bg: '#2E6B20', deep: '#12360C', accent: '#E6F25A'
  }
];

const STEP = 90;                 // degrees between neighbouring packs
const SPAN = STEP * (FLAVOURS.length - 1);
const LATERAL = [-16, 20, -6, 26]; // per-pack vertical offset, keeps it organic

export function initOrbit(reduced) {
  const root = document.querySelector('[data-orbit]');
  if (!root) return;

  const packs = [...root.querySelectorAll('.orbit__pack')];
  const dots = [...root.querySelectorAll('[data-dot]')];
  const ghost = root.querySelector('[data-ghost]');
  const elName = root.querySelector('[data-name]');
  const elDesc = root.querySelector('[data-desc]');
  const elNum = root.querySelector('[data-num]');
  const elHint = root.querySelector('[data-hint]');
  const live = root.querySelector('[data-announce]');
  const stage = root.querySelector('[data-stage]');

  /* Reduced motion turns the section into a plain four-up: every pack shown
     at once with its own caption. The dots, the hint and the single shared
     flavour panel all describe a rotation that no longer happens, so they go;
     each pack keeps a real action instead of being a button that does nothing. */
  if (reduced) {
    root.style.setProperty('--flavour-bg', FLAVOURS[0].bg);
    root.classList.add('is-static');

    packs.forEach((el, i) => {
      const f = FLAVOURS[i];
      el.setAttribute('aria-label', `${f.name} — where to buy`);
      el.insertAdjacentHTML('beforeend',
        `<span class="orbit__caption"><b>${f.name}</b>${f.desc}</span>`);
      el.addEventListener('click', () => {
        document.getElementById('buy')?.scrollIntoView();
      });
    });

    root.querySelector('.orbit__count')?.remove();
    root.querySelector('.orbit__name')?.remove();
    root.querySelector('.orbit__desc')?.remove();
    root.querySelector('.orbit__controls')?.remove();
    const cta = root.querySelector('.orbit__info .btn');
    if (cta) cta.textContent = 'Where to buy';
    return;
  }

  let angle = 0;        // rendered angle, eased toward target
  let target = 0;       // angle implied by scroll
  let active = -1;
  let radius = 300;
  let packW = 280;
  let frame = 0;
  let popUntil = 0;
  const lastBlur = new Array(packs.length).fill(-1);

  /* --- measurement -------------------------------------------------------- */
  function measure() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const narrow = w < 860;
    /* Height matters as much as width: the foreground pack renders at ~1.53x
       its base width once scale and aspect are applied, and it has to clear
       the masthead above and the flavour panel below. */
    /* the floors on the wide branch keep the orbit from visibly shrinking as
       it crosses the 860px breakpoint */
    radius = narrow
      ? Math.min(w * 0.44, 220)
      : Math.min(Math.max(w * 0.24, 215), 330);
    packW = narrow
      ? Math.min(w * 0.54, (h - 300) / 1.62, 240)
      : Math.min(Math.max(w * 0.22, 212), (h - 290) / 1.62, 290);
    root.style.setProperty('--pack-w', `${Math.round(packW)}px`);
    if (elHint) {
      elHint.textContent = narrow
        ? 'Swipe to explore'
        : 'Scroll to rotate · click a pack';
    }
  }

  /* --- scroll → angle ----------------------------------------------------- */
  function readScroll() {
    const travel = root.offsetHeight - window.innerHeight;
    if (travel <= 0) return;
    const p = clamp(-root.getBoundingClientRect().top / travel, 0, 1);
    target = p * SPAN;
  }

  function scrollToIndex(i) {
    const travel = root.offsetHeight - window.innerHeight;
    if (travel <= 0) return;
    const top = window.scrollY + root.getBoundingClientRect().top +
      (i / (FLAVOURS.length - 1)) * travel;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  /* --- flavour swap ------------------------------------------------------- */
  let swapTimer = 0;
  function apply(i, immediate) {
    if (i === active) return;
    const first = active === -1;
    active = i;
    const f = FLAVOURS[i];

    root.style.setProperty('--flavour-bg', f.bg);
    root.style.setProperty('--flavour-deep', f.deep);
    root.style.setProperty('--flavour-accent', f.accent);

    dots.forEach((d, k) => d.setAttribute('aria-pressed', String(k === i)));

    const write = () => {
      if (ghost) ghost.textContent = f.ghost;
      if (elName) elName.textContent = f.name;
      if (elDesc) elDesc.textContent = f.desc;
      if (elNum) elNum.textContent = `0${i + 1}`;
      root.classList.remove('is-swapping');
    };

    if (first || immediate) {
      write();
    } else {
      root.classList.add('is-swapping');
      clearTimeout(swapTimer);
      swapTimer = setTimeout(write, 190);
      popUntil = performance.now() + 420;
      root.classList.add('is-popping');
      setTimeout(() => root.classList.remove('is-popping'), 420);
    }

    if (live && !first) live.textContent = `${f.name}. ${f.desc}`;
  }

  /* --- render ------------------------------------------------------------- */
  function render(now) {
    frame = 0;

    // ease toward the scroll target — this is what makes it feel physical
    const diff = target - angle;
    angle += Math.abs(diff) < 0.02 ? diff : diff * 0.16;

    const idx = clamp(Math.round(target / STEP), 0, FLAVOURS.length - 1);
    if (idx !== active) apply(idx);

    const popping = now < popUntil;

    for (let i = 0; i < packs.length; i++) {
      const a = ((i * STEP - angle) * Math.PI) / 180;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const t = (cos + 1) / 2;                     // 0 = far side, 1 = foreground
      const front = i === active;

      const scale = (0.5 + 0.6 * t * t) * (front && popping ? 1.07 : 1);
      const x = sin * radius;
      const y = -cos * 14 + LATERAL[i] * (0.4 + 0.6 * (1 - t)) - t * 24;
      const rot = sin * 8;

      const el = packs[i];
      el.style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)` +
        ` scale(${scale.toFixed(3)}) rotate(${rot.toFixed(1)}deg)`;
      el.style.opacity = (0.26 + 0.74 * t).toFixed(2);
      el.style.zIndex = String(Math.round(t * 100));

      // blur is quantised — only rewrite the filter when the step changes
      const blur = Math.round((1 - t) * 8) / 2;
      if (blur !== lastBlur[i]) {
        lastBlur[i] = blur;
        el.style.filter = blur ? `blur(${blur}px)` : '';
      }
      el.tabIndex = front ? 0 : -1;
      el.setAttribute('aria-hidden', front ? 'false' : 'true');
    }

    // keep animating while we're still settling or mid-pop
    if (Math.abs(target - angle) > 0.02 || popping) schedule();
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function onScroll() {
    readScroll();
    schedule();
  }

  /* --- touch: horizontal drag rotates ------------------------------------- */
  if (stage) {
    let lastX = null;
    let lastY = null;
    let axis = null;

    stage.addEventListener('touchstart', (e) => {
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      axis = null;
    }, { passive: true });

    stage.addEventListener('touchmove', (e) => {
      if (lastX === null) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = lastX - x;
      const dy = lastY - y;

      if (!axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axis === 'y') { lastX = null; return; }   // let the page scroll
        root.classList.add('is-dragging');
      }

      lastX = x;
      lastY = y;
      e.preventDefault();
      // horizontal drag maps onto section scroll so scroll stays the one source
      // of truth — the sticky panel keeps the packs on screen either way
      window.scrollBy(0, dx * 2.6);
      onScroll();
    }, { passive: false });

    const end = () => {
      lastX = null;
      axis = null;
      root.classList.remove('is-dragging');
    };
    stage.addEventListener('touchend', end, { passive: true });
    stage.addEventListener('touchcancel', end, { passive: true });
  }

  /* --- controls ----------------------------------------------------------- */
  packs.forEach((el, i) => el.addEventListener('click', () => scrollToIndex(i)));
  dots.forEach((el, i) => el.addEventListener('click', () => scrollToIndex(i)));

  root.querySelector('[data-dots]')?.addEventListener('keydown', (e) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = clamp(active + delta, 0, FLAVOURS.length - 1);
    dots[next].focus();
    scrollToIndex(next);
  });

  /* --- boot --------------------------------------------------------------- */
  measure();
  readScroll();
  angle = target;
  apply(clamp(Math.round(target / STEP), 0, FLAVOURS.length - 1), true);
  render(performance.now());

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); readScroll(); schedule(); }, { passive: true });

  /* rAF is suspended while the tab is hidden, so an ease that was in flight
     when the user switched away would stay frozen mid-transit until the next
     scroll. Snap it up on the way back. */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    readScroll();
    angle = target;
    schedule();
  });
}

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}
