# Poptein — brand site

Implementation of the approved Claude Design concept (`Poptein.dc.html`) as a
production site.

```
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # -> dist/
npm run preview    # serve dist/
npm run images     # regenerate public/img from src/assets/raw
```

## Stack

Vite + vanilla ES modules. **No runtime dependencies.** The whole design is CSS
transforms plus one `requestAnimationFrame` loop, so a framework or WebGL layer
would add weight without buying anything. `sharp` is dev-only, for images.

Shipped payload on first view is ~130 KB over the wire (6.4 KB HTML, 7.9 KB CSS,
4.0 KB JS gzipped; the rest is the latin font subsets, the logo and the hero pack).

## Layout

```
index.html               all markup, one page
src/main.js              entry — imports styles, boots modules
src/js/loader.js         kernel → shake → POP → popcorn → logo
src/js/orbit.js          the product sphere
src/js/ui.js             nav, FAQ, scroll reveals, hero drift, ambient gating
src/styles/              base (tokens/type) · loader · masthead · hero
                         orbit · ambient · sections · fonts (generated)
scripts/build-images.mjs responsive AVIF + WebP pipeline
scripts/fonts.mjs        regenerates self-hosted font faces
src/assets/raw/          source brand assets (see note below)
public/img, public/fonts generated output, committed
```

## The two signature pieces

**Loader** (`loader.js` + `loader.css`) — a CSS kernel shakes, squashes,
stretches and blows apart into fragments, and a *real photographed piece of
Poptein popcorn* lands with an overshoot before the logo pops in. ~2.1s.
Skipped entirely on a repeat visit in the same session (`sessionStorage`) and
under `prefers-reduced-motion`. Click or Escape dismisses it.

**Product sphere** (`orbit.js` + `orbit.css`) — four packs on an invisible
orbital field. Scroll position through the section drives one continuous angle;
each pack's depth falls out of `cos(angle)` as scale, z-index, opacity and blur.
Horizontal swipe maps onto the same scroll, so scroll stays the single source of
truth. Per frame this writes only `transform` and `opacity`; blur is quantised so
the filter string is rebuilt a few times a second rather than 60, and the drop
shadow is static CSS. Under `prefers-reduced-motion` the section becomes a plain
captioned four-up with a real CTA on each pack.

## Motion layering

Two independent layers, deliberately nested so they compose instead of
overwriting each other:

```
.orbit__pack     transform written by JS   (orbit position)
  └ picture      CSS `drift` animation     (ambient float)
     └ img
```

Same idea in the hero, where the scroll parallax owns `.hero__crumb` and the
float owns the `<img>` inside it. Amplitude lives in `--fy` / `--fr` custom
properties so one media query dials the system down on small screens. Floats are
gated by an IntersectionObserver (`initAmbient`) so nothing animates off-screen.

## Deviations from the design export

Three things were changed deliberately; everything else follows the export.

1. **Flavour backgrounds are deeper.** The export's `#D98F2B` and `#4B9433` put
   cream text at 2.4:1 and 3.4:1. Hues are unchanged; the values now clear 4.5:1
   for the headline, body and accent label on all four worlds.
2. **Placeholder image slots are filled with real photography** pulled from
   poptein.in — the `kids · street shot` / `movie night` / `brownie · chocolate
   pour` boxes are now the actual shots.
3. **A craft/food section was added** between the ingredients list and the
   testimonial, to give the page a quiet image-led beat between two loud ones.

## Assets

`src/assets/raw/` holds the full brand library recovered from poptein.in,
including all 52 lifestyle photographs — more than the site currently uses. It is
kept whole on purpose so photography can be re-art-directed without re-sourcing;
only what `scripts/build-images.mjs` lists is processed, and only what the markup
references ends up in `dist/`.
