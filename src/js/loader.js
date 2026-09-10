/**
 * Loader: kernel → shake → POP → popcorn → logo → site.
 *
 * The timings below match the keyframes in styles/loader.css. Nothing here
 * blocks the page — the loader is an overlay over already-parsed content, so
 * the site is interactive the moment it lifts.
 */

const SEEN_KEY = 'poptein:seen';

const TIMELINE = [
  [560, 'is-pop'],   // kernel bursts, popcorn lands
  [1250, 'is-logo'], // popcorn lifts away, logo pops in
];
const FADE_AT = 1820;
const DONE_AT = 2260;

export function initLoader(reduced) {
  const el = document.getElementById('loader');
  if (!el) return Promise.resolve();

  const seen = (() => {
    try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
  })();

  // Repeat visit inside the same session, or reduced motion: don't make anyone
  // sit through the show twice.
  if (seen || reduced) {
    el.remove();
    document.body.classList.remove('is-loading');
    return Promise.resolve();
  }

  try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode */ }

  document.body.classList.add('is-loading');

  return new Promise((resolve) => {
    const timers = TIMELINE.map(([at, cls]) => setTimeout(() => el.classList.add(cls), at));

    const finish = () => {
      timers.forEach(clearTimeout);
      clearTimeout(fade);
      clearTimeout(done);
      el.remove();
      document.body.classList.remove('is-loading');
      resolve();
    };

    const fade = setTimeout(() => el.classList.add('is-out'), FADE_AT);
    const done = setTimeout(finish, DONE_AT);

    // Escape hatch — nobody should be trapped behind an animation.
    el.addEventListener('click', finish, { once: true });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') finish();
    }, { once: true });
  });
}
