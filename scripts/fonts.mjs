import fs from 'node:fs';
const css = fs.readFileSync(process.argv[2], 'utf8');
// Google emits "/* subset */\n@font-face{...}" pairs
const re = /\/\* ([a-z0-9-]+) \*\/\s*@font-face \{([^}]+)\}/g;
const want = new Set(['Anton|400', 'Poppins|400', 'Poppins|500', 'Poppins|700', 'Poppins|800']);
const picked = [];
let m;
while ((m = re.exec(css))) {
  const [, subset, body] = m;
  if (subset !== 'latin' && subset !== 'latin-ext') continue;
  const fam = /font-family:\s*'([^']+)'/.exec(body)?.[1];
  const wt = /font-weight:\s*(\d+)/.exec(body)?.[1];
  const url = /url\((https:[^)]+)\)/.exec(body)?.[1];
  const range = /unicode-range:\s*([^;]+)/.exec(body)?.[1];
  if (!want.has(`${fam}|${wt}`)) continue;
  picked.push({ fam, wt, subset, url, range: range.trim(),
    file: `${fam.toLowerCase()}-${wt}-${subset}.woff2` });
}
fs.writeFileSync(process.argv[3], JSON.stringify(picked, null, 2));
picked.forEach(p => console.log(p.file, p.url));
