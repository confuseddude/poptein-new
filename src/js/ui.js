/** Navigation, FAQ, scroll reveals, hero drift. All small, all optional. */

/* ---------------------------------------------------------------- masthead */
export function initNav() {
  const bar = document.getElementById('masthead');
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobile-menu');
  if (!bar) return;

  /* sticky weight once the hero is behind us */
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
  document.body.prepend(sentinel);
  new IntersectionObserver(
    ([e]) => bar.classList.toggle('is-stuck', !e.isIntersecting),
    { threshold: 0 }
  ).observe(sentinel);

  /* mobile menu */
  if (burger && menu) {
    const setOpen = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.hidden = !open;
    };
    burger.addEventListener('click', () =>
      setOpen(burger.getAttribute('aria-expanded') !== 'true')
    );
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        burger.focus();
      }
    });
    /* if the viewport grows past the breakpoint, drop the menu state */
    matchMedia('(min-width: 901px)').addEventListener('change', (m) => {
      if (m.matches) setOpen(false);
    });
  }

  /* mark the section you're currently reading */
  const links = [...bar.querySelectorAll('.masthead__nav a')];
  const targets = links
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (!targets.length) return;

  const seen = new Set();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      const current = targets.find((t) => seen.has(t));
      links.forEach((a, i) =>
        a.toggleAttribute('aria-current', targets[i] === current)
      );
    },
    { rootMargin: '-45% 0px -45% 0px' }
  );
  targets.forEach((t) => io.observe(t));
}

/* --------------------------------------------------------------------- faq */
export function initFaq(reduced) {
  document.querySelectorAll('.faq__item').forEach((item) => {
    const btn = item.querySelector('button');
    const panel = item.querySelector('.faq__panel');
    if (!btn || !panel) return;

    /* animate height without ever transitioning to/from `auto` */
    const setOpen = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      if (reduced) {
        panel.hidden = !open;
        panel.style.height = '';
        return;
      }
      if (open) {
        panel.hidden = false;
        const h = panel.scrollHeight;
        panel.style.height = '0px';
        requestAnimationFrame(() => { panel.style.height = `${h}px`; });
        panel.addEventListener('transitionend', function done(e) {
          if (e.propertyName !== 'height') return;
          panel.style.height = 'auto';
          panel.removeEventListener('transitionend', done);
        });
      } else {
        panel.style.height = `${panel.scrollHeight}px`;
        requestAnimationFrame(() => { panel.style.height = '0px'; });
        panel.addEventListener('transitionend', function done(e) {
          if (e.propertyName !== 'height') return;
          panel.hidden = true;
          panel.style.height = '';
          panel.removeEventListener('transitionend', done);
        });
      }
    };

    /* sync the markup's initial state */
    if (btn.getAttribute('aria-expanded') === 'true') {
      panel.hidden = false;
      panel.style.height = 'auto';
    }

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      if (!open) {
        /* one at a time keeps the section from jumping around */
        document.querySelectorAll('.faq__item button[aria-expanded="true"]')
          .forEach((other) => other !== btn && other.click());
      }
      setOpen(!open);
    });
  });
}

/* ------------------------------------------------------------------ reveal */
export function initReveal(reduced) {
  const els = [...document.querySelectorAll('[data-reveal]')];
  if (!els.length) return;

  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        /* a short stagger between siblings reads as intent, not a wave */
        const siblings = [...e.target.parentElement.children].filter((n) =>
          n.hasAttribute('data-reveal')
        );
        const i = Math.max(0, siblings.indexOf(e.target));
        e.target.style.transitionDelay = `${Math.min(i, 5) * 60}ms`;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px' }
  );
  els.forEach((el) => io.observe(el));
}

/* ---------------------------------------------------------------- ambient */
/**
 * Gates the continuous float so it only runs while its section is on screen.
 * Without this the four orbit packs keep animating through the entire page.
 */
export function initAmbient(reduced) {
  if (reduced) return;
  const sections = [document.querySelector('.hero'), document.querySelector('.orbit')]
    .filter(Boolean);
  if (!sections.length || !('IntersectionObserver' in window)) {
    sections.forEach((s) => s.classList.add('is-live'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting)),
    { rootMargin: '10% 0px' }
  );
  sections.forEach((s) => io.observe(s));
}

/* ------------------------------------------------------- hero crumb drift */
export function initDrift(reduced) {
  const els = [...document.querySelectorAll('[data-drift]')];
  if (reduced || !els.length) return;

  const base = els.map((el) => getComputedStyle(el).transform);
  let frame = 0;

  const run = () => {
    frame = 0;
    const y = window.scrollY;
    if (y > window.innerHeight) return;   // hero is gone, stop working
    els.forEach((el, i) => {
      const k = parseFloat(el.dataset.drift) || 0;
      el.style.transform = `${base[i] === 'none' ? '' : base[i]} translate3d(0, ${(y * k).toFixed(1)}px, 0)`;
    });
  };

  window.addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(run);
  }, { passive: true });
}
