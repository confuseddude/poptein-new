import './styles/fonts.css';
import './styles/base.css';
import './styles/loader.css';
import './styles/masthead.css';
import './styles/hero.css';
import './styles/orbit.css';
import './styles/ambient.css';
import './styles/sections.css';

import { initLoader } from './js/loader.js';
import { initOrbit } from './js/orbit.js';
import { initNav, initFaq, initReveal, initDrift, initAmbient } from './js/ui.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// swap the no-js fallback for the enhanced state before first paint
document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js-ready');

initNav();
initFaq(reduced);
initOrbit(reduced);
initDrift(reduced);
initAmbient(reduced);
initLoader(reduced).then(() => initReveal(reduced));
