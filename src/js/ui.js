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

/* -------------------------------------------------------- hero flavour swap */
export function initHeroFlavours(reduced) {
  const btn = document.getElementById('hero-pack-btn') || document.querySelector('.hero__pack');
  if (!btn) return;

  const FLAVOURS = [
    {
      name: 'Peanut Butter',
      alt: "Poptein Peanut Butter protein popcorn pack, 10g protein per serve",
      avif: '/img/packs/pack-peanut-butter-340.avif 340w, /img/packs/pack-peanut-butter-500.avif 500w',
      webp: '/img/packs/pack-peanut-butter-340.webp 340w, /img/packs/pack-peanut-butter-500.webp 500w',
      src: '/img/packs/pack-peanut-butter-500.webp',
      discBg: '#FFC93D',
      crumbAvif: '/img/pops/pop-peanut-butter-200.avif',
      crumbWebp: '/img/pops/pop-peanut-butter-200.webp'
    },
    {
      name: 'Fudge Brownie',
      alt: "Poptein Fudge Brownie protein popcorn pack, 10g protein per serve",
      avif: '/img/packs/pack-brownie-340.avif 340w, /img/packs/pack-brownie-500.avif 500w',
      webp: '/img/packs/pack-brownie-340.webp 340w, /img/packs/pack-brownie-500.webp 500w',
      src: '/img/packs/pack-brownie-500.webp',
      discBg: '#F5CE5C',
      crumbAvif: '/img/pops/pop-plain-200.avif',
      crumbWebp: '/img/pops/pop-plain-200.webp'
    },
    {
      name: 'Spicy Kimchi Cheese',
      alt: "Poptein Spicy Kimchi Cheese protein popcorn pack, 10g protein per serve",
      avif: '/img/packs/pack-kimchi-340.avif 340w, /img/packs/pack-kimchi-500.avif 500w',
      webp: '/img/packs/pack-kimchi-340.webp 340w, /img/packs/pack-kimchi-500.webp 500w',
      src: '/img/packs/pack-kimchi-500.webp',
      discBg: '#FFB347',
      crumbAvif: '/img/pops/pop-plain-200.avif',
      crumbWebp: '/img/pops/pop-plain-200.webp'
    },
    {
      name: "Herb 'N' Zing",
      alt: "Poptein Herb 'N' Zing protein popcorn pack, 10g protein per serve",
      avif: '/img/packs/pack-herb-n-zing-340.avif 340w, /img/packs/pack-herb-n-zing-500.avif 500w',
      webp: '/img/packs/pack-herb-n-zing-340.webp 340w, /img/packs/pack-herb-n-zing-500.webp 500w',
      src: '/img/packs/pack-herb-n-zing-500.webp',
      discBg: '#E6F25A',
      crumbAvif: '/img/pops/pop-plain-200.avif',
      crumbWebp: '/img/pops/pop-plain-200.webp'
    }
  ];

  // Preload all flavour pack images so switches are instant. Deferred to idle
  // so four extra pack downloads never compete with the hero's own render.
  const preload = () => FLAVOURS.forEach((f) => { new Image().src = f.src; });
  if ('requestIdleCallback' in window) requestIdleCallback(preload, { timeout: 2500 });
  else setTimeout(preload, 1200);

  const sourceEl = document.getElementById('hero-pack-source') || btn.querySelector('source');
  const imgEl = document.getElementById('hero-pack-img') || btn.querySelector('img');
  const nameEl = document.getElementById('hero-pack-flavour-name');
  const productEl = document.querySelector('.hero__product');
  const crumbSource = document.getElementById('hero-crumb-a-source');
  const crumbImg = document.getElementById('hero-crumb-a-img');

  let currentIndex = 0;
  let isAnimating = false;

  const applyFlavour = (idx) => {
    const flavour = FLAVOURS[idx];
    if (sourceEl) sourceEl.srcset = flavour.avif;
    if (imgEl) {
      imgEl.src = flavour.src;
      imgEl.srcset = flavour.webp;
      imgEl.alt = flavour.alt;
    }
    if (nameEl) nameEl.textContent = flavour.name;
    if (productEl && flavour.discBg) {
      productEl.style.setProperty('--hero-disc', flavour.discBg);
    }
    if (crumbSource) crumbSource.srcset = flavour.crumbAvif;
    if (crumbImg) crumbImg.src = flavour.crumbWebp;
    
    const nextFlavour = FLAVOURS[(idx + 1) % FLAVOURS.length];
    btn.setAttribute('aria-label', `Switch flavour (currently ${flavour.name}). Click to see ${nextFlavour.name}`);
  };

  const switchFlavour = (dir = 1) => {
    if (isAnimating) return;
    currentIndex = (currentIndex + dir + FLAVOURS.length) % FLAVOURS.length;

    if (!reduced) {
      isAnimating = true;
      btn.classList.add('is-popping');
      
      setTimeout(() => {
        applyFlavour(currentIndex);
      }, 150);

      setTimeout(() => {
        btn.classList.remove('is-popping');
        isAnimating = false;
      }, 450);
    } else {
      applyFlavour(currentIndex);
    }
  };

  /* a swipe ends in a synthesised click on some browsers — swallow that one */
  let swipedAt = 0;
  const SWIPE_CLICK_GUARD = 400;   // ms

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    // a swipe can end in a synthesised click — swallow only that one, and only
    // while it could plausibly belong to the gesture that just fired
    if (performance.now() - swipedAt < SWIPE_CLICK_GUARD) return;
    switchFlavour();
  });

  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      switchFlavour();
    }
    if (e.key === 'ArrowRight') { e.preventDefault(); switchFlavour(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); switchFlavour(-1); }
  });

  /* --- horizontal gestures: left = next flavour, right = previous ---------

     Touch/pen goes through pointer events; the trackpad goes through wheel.
     Both feed one shared decision so the rules can't drift apart.

     Vertical scrolling is left entirely to the browser. `touch-action: pan-y`
     on the surface means the browser will never pan horizontally there, so a
     horizontal gesture is ours by construction and needs no preventDefault —
     every touch listener stays passive. If the gesture turns out to be a
     scroll, the browser takes it and sends us `pointercancel`.

     Deliberately NOT an early axis lock: a real finger rolls, and the first
     few pixels of a firm horizontal swipe are often vertical-dominant noise.
     Committing to an axis at that point kills the gesture. Instead we simply
     wait until the horizontal travel is both big enough and clearly dominant,
     whenever in the gesture that happens. */
  const zone = productEl || btn;

  /* The gesture surface is the pack itself plus the empty space around it, so
     a thumb anywhere over the product composition works. This pad sits at
     z-index -1 — behind the pack, so the button keeps every click, and behind
     the headline and pitch, so their own hit areas are untouched. It paints
     nothing and takes no layout space. */
  if (productEl && !productEl.querySelector('.hero__swipe-pad')) {
    const pad = document.createElement('span');
    pad.className = 'hero__swipe-pad';
    pad.setAttribute('aria-hidden', 'true');
    productEl.appendChild(pad);
  }

  const SWIPE_MIN = 24;     // px of horizontal travel that counts as a swipe
  const DOMINANCE = 1.15;   // horizontal has to beat vertical by this much
  const WHEEL_MIN = 26;     // accumulated px of horizontal wheel delta
  const COOLDOWN = 470;     // ms — just past the existing pop, so no skipping
  const WHEEL_IDLE = 140;   // ms of quiet that ends a trackpad gesture

  let lastStep = 0;
  const step = (dir) => {
    const now = performance.now();
    if (now - lastStep < COOLDOWN) return false;
    lastStep = now;
    switchFlavour(dir);
    return true;
  };

  /* shared drag state machine — fed by pointer events, or by touch events on
     anything too old to have them */
  let dragging = false;
  let fired = false;
  let ox = 0;
  let oy = 0;

  const dragStart = (x, y) => {
    dragging = true;
    fired = false;
    ox = x;
    oy = y;
  };

  const dragMove = (x, y) => {
    if (!dragging || fired) return false;      // one flavour per gesture
    const dx = x - ox;
    const dy = y - oy;
    if (Math.abs(dx) < SWIPE_MIN) return false;
    if (Math.abs(dx) <= Math.abs(dy) * DOMINANCE) return false;
    fired = true;
    swipedAt = performance.now();   // swallow this gesture's synthesised click
    step(dx < 0 ? 1 : -1);
    return true;
  };

  const dragEnd = () => { dragging = false; };

  if (window.PointerEvent) {
    let pid = null;

    zone.addEventListener('pointerdown', (e) => {
      // mouse keeps its existing behaviour — click switches, drag does nothing
      if (!e.isPrimary || e.pointerType === 'mouse') return;
      pid = e.pointerId;
      dragStart(e.clientX, e.clientY);
    }, { passive: true });

    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pid) return;
      if (dragMove(e.clientX, e.clientY)) {
        /* hold the rest of the gesture so a re-render under the finger, or the
           pop animation moving the pack, can't strand us mid-swipe */
        try { zone.setPointerCapture(pid); } catch { /* pointer already gone */ }
      }
    }, { passive: true });

    const pointerDone = (e) => {
      if (e.pointerId !== pid) return;
      if (zone.hasPointerCapture?.(pid)) {
        try { zone.releasePointerCapture(pid); } catch { /* already released */ }
      }
      pid = null;
      dragEnd();
    };
    zone.addEventListener('pointerup', pointerDone, { passive: true });
    zone.addEventListener('pointercancel', pointerDone, { passive: true });
  } else {
    zone.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) { dragEnd(); return; }
      dragStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    zone.addEventListener('touchmove', (e) => {
      if (!e.touches.length) return;
      dragMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    zone.addEventListener('touchend', dragEnd, { passive: true });
    zone.addEventListener('touchcancel', dragEnd, { passive: true });
  }

  /* trackpad / horizontal wheel */
  let wheelAcc = 0;
  let wheelAt = 0;
  let wheelFired = false;

  zone.addEventListener('wheel', (e) => {
    // deltaMode 1 = lines, 2 = pages; normalise everything to pixels
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? zone.clientHeight : 1;
    const dx = e.deltaX * unit;
    const dy = e.deltaY * unit;
    if (Math.abs(dx) <= Math.abs(dy) * DOMINANCE) return;   // vertical: let it scroll

    e.preventDefault();
    const now = performance.now();

    // a quiet gap means the previous gesture ended — start a fresh one
    if (now - wheelAt > WHEEL_IDLE) {
      wheelAcc = 0;
      wheelFired = false;
    }
    wheelAt = now;

    // trackpad momentum keeps firing after the flick; swallow it so one
    // gesture never skips ahead
    if (wheelFired) { wheelAcc = 0; return; }

    if (wheelAcc && Math.sign(dx) !== Math.sign(wheelAcc)) wheelAcc = 0;
    wheelAcc += dx;

    if (Math.abs(wheelAcc) < WHEEL_MIN) return;
    const dir = wheelAcc < 0 ? -1 : 1;   // swipe left on a trackpad = +deltaX
    wheelAcc = 0;
    wheelFired = step(dir);
  }, { passive: false });
}

/* ---------------------------------------------------- footer gravity popcorn */
export function initFooterGravity(reduced) {
  const logoBtn = document.getElementById('foot-logo-btn');
  const canvas = document.getElementById('foot-gravity-canvas');
  if (!logoBtn || !canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imgPop1 = new Image();
  imgPop1.src = '/img/pops/pop-peanut-butter-200.webp';
  const imgPop2 = new Image();
  imgPop2.src = '/img/pops/pop-plain-200.webp';
  const images = [imgPop1, imgPop2];

  let width = 0;
  let height = 0;
  let dpr = 1;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(rect.width * nextDpr);
    const h = Math.round(rect.height * nextDpr);
    /* reallocating the backing store is the costly part — only do it when the
       numbers actually moved (mobile fires resize on every address-bar shift) */
    if (w === canvas.width && h === canvas.height && width > 0) return;
    dpr = nextDpr;
    width = rect.width;
    height = rect.height;
    canvas.width = w;
    canvas.height = h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; resize(); });
  }, { passive: true });
  resize();

  const particles = [];
  let animId = null;

  class PopcornParticle {
    constructor(startX, startY) {
      this.x = startX + (Math.random() - 0.5) * 36;
      this.y = startY + (Math.random() - 0.5) * 16;
      
      const angle = (Math.random() * 0.7 + 0.15) * Math.PI;
      const speed = Math.random() * 11 + 10;
      this.vx = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
      this.vy = -Math.sin(angle) * speed - Math.random() * 4;
      
      this.radius = Math.random() * 9 + 15;
      this.gravity = 0.68;
      this.bounce = Math.random() * 0.15 + 0.45;
      this.friction = 0.88;
      
      this.rotation = Math.random() * Math.PI * 2;
      this.vRot = (Math.random() - 0.5) * 0.26;
      
      this.img = images[Math.floor(Math.random() * images.length)];
      this.opacity = 1;
      this.settled = false;
      this.settledFrames = 0;
      this.maxSettledFrames = 180 + Math.floor(Math.random() * 100);
      this.isDead = false;
    }

    update() {
      if (this.settled) {
        this.settledFrames++;
        if (this.settledFrames > this.maxSettledFrames) {
          this.opacity -= 0.02;
          if (this.opacity <= 0) {
            this.isDead = true;
          }
        }
        return;
      }

      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.vRot;

      const floorY = height - this.radius - 4;

      if (this.y >= floorY) {
        this.y = floorY;
        this.vy = -this.vy * this.bounce;
        this.vx *= this.friction;
        this.vRot *= this.friction;

        if (Math.abs(this.vy) < 1.3 && Math.abs(this.vx) < 0.5) {
          this.settled = true;
          this.vy = 0;
          this.vx = 0;
          this.vRot = 0;
        }
      }

      if (this.x - this.radius <= 0) {
        this.x = this.radius;
        this.vx = -this.vx * 0.6;
      } else if (this.x + this.radius >= width) {
        this.x = width - this.radius;
        this.vx = -this.vx * 0.6;
      }
    }

    draw(c) {
      c.save();
      c.globalAlpha = Math.max(0, Math.min(1, this.opacity));
      c.translate(this.x, this.y);
      c.rotate(this.rotation);

      if (this.img.complete && this.img.naturalWidth > 0) {
        c.drawImage(this.img, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
      } else {
        c.fillStyle = '#FFE3A8';
        c.strokeStyle = '#0F0D0A';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      c.restore();
    }
  }

  const loop = () => {
    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.isDead) {
        particles.splice(i, 1);
      }
    }

    if (particles.length > 0) {
      animId = requestAnimationFrame(loop);
    } else {
      animId = null;
    }
  };

  const spawnPopcorn = () => {
    resize();
    const btnRect = logoBtn.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const startX = btnRect.left - canvasRect.left + btnRect.width * 0.5;
    const startY = btnRect.top - canvasRect.top + btnRect.height * 0.4;

    const count = reduced ? 8 : 18;
    for (let i = 0; i < count; i++) {
      particles.push(new PopcornParticle(startX, startY));
    }

    if (particles.length > 120) {
      particles.splice(0, particles.length - 120);
    }

    if (!animId) {
      animId = requestAnimationFrame(loop);
    }

    logoBtn.classList.remove('is-popping');
    void logoBtn.offsetWidth;
    logoBtn.classList.add('is-popping');
  };

  logoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    spawnPopcorn();
  });

  logoBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      spawnPopcorn();
    }
  });
}
