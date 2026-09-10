/**
 * Poptein image pipeline.
 * Takes the raw brand assets in src/assets/raw and emits responsive AVIF + WebP
 * into public/img. Run with `npm run images` — output is committed, so the build
 * itself stays dependency-free.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const RAW = 'src/assets/raw';
const OUT = 'public/img';

// name -> { src, widths, dir, transparent }
const JOBS = [];

const add = (name, src, widths, dir, transparent = false) =>
  JOBS.push({ name, src, widths, dir, transparent });

/* ---- brand -------------------------------------------------------------- */
add('poptein-logo', 'Poptein-Logo.avif', [300], 'brand', true);

/* ---- packs (alpha cut-outs, used in the orbit + hero) ------------------- */
add('pack-peanut-butter', 'PEANUT-BUTTER.avif', [340, 500, 720], 'packs', true);
add('pack-brownie', 'Brownie.avif', [340, 500, 720], 'packs', true);
add('pack-kimchi', 'Spicy-kimchi-Cheese.avif', [340, 500, 720], 'packs', true);
add('pack-herb-n-zing', 'HERB-n-ZING.avif', [340, 500, 720], 'packs', true);

/* ---- single popcorn pieces (loader climax + flavour garnish) ------------ */
add('pop-plain', 'Popcorn-1png.avif', [200], 'pops', true);
add('pop-peanut-butter', 'popcorn-2_Png.avif', [200], 'pops', true);

/* ---- photography -------------------------------------------------------- */
const PHOTOS = {
  // story block
  'story-kids': 'grid37.avif',
  'story-festival': 'grid14.avif',
  'story-cinema': 'grid35.avif',
  'story-athlete': 'grid1.avif',
  // craft / food moment
  'craft-bowls': 'grid7.avif',
  'craft-brownie': 'grid38.avif',
  'craft-table': 'grid3.avif',
  // social wall
  'social-coupes': 'grid9.avif',
  'social-orange': 'grid31.avif',
  'social-team': 'grid25.avif',
  'social-sunset': 'grid46.avif',
  'social-paddle': 'grid43.avif',
  // retail proof
  'retail-basket': 'grid39.avif'
};
for (const [name, src] of Object.entries(PHOTOS)) {
  add(name, src, [400, 462], 'photos');
}

/* ------------------------------------------------------------------------ */

const manifest = {};

for (const job of JOBS) {
  const srcPath = path.join(RAW, job.src);
  if (!fs.existsSync(srcPath)) {
    console.warn(`skip (missing): ${job.src}`);
    continue;
  }
  const dir = path.join(OUT, job.dir);
  fs.mkdirSync(dir, { recursive: true });

  const meta = await sharp(srcPath).metadata();
  const entry = { w: meta.width, h: meta.height, widths: [] };

  for (const w of job.widths) {
    if (w > meta.width * 1.02) continue; // never upscale
    const base = sharp(srcPath).resize({ width: w, withoutEnlargement: true });

    await base
      .clone()
      .avif({ quality: job.transparent ? 62 : 55, effort: 6 })
      .toFile(path.join(dir, `${job.name}-${w}.avif`));

    await base
      .clone()
      .webp({ quality: job.transparent ? 82 : 76, effort: 5 })
      .toFile(path.join(dir, `${job.name}-${w}.webp`));

    entry.widths.push(w);
  }
  manifest[job.name] = entry;
  console.log(`${job.name.padEnd(24)} ${meta.width}x${meta.height} -> ${entry.widths.join(',')}`);
}

fs.writeFileSync('src/assets/manifest.json', JSON.stringify(manifest, null, 2));

let bytes = 0;
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p) : (bytes += fs.statSync(p).size);
  });
walk(OUT);
console.log(`\n${Object.keys(manifest).length} assets, ${(bytes / 1024 / 1024).toFixed(2)} MB total`);
