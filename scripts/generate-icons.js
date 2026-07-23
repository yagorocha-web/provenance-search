// Generates PWA home-screen icons (Arts & Artifacts monogram) via sharp, rendering an
// inline SVG at each required size. Run once with `node scripts/generate-icons.js`;
// output is committed like the bundled MoMA dataset, not regenerated at request time.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SIZES = [192, 512];
const OUT_DIR = path.join(__dirname, '..', 'icons');

function svgFor(size) {
  const fontSize = Math.round(size * 0.3);
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0d0c0a"/>
  <text x="50%" y="53%" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-style="italic" font-weight="600" fill="#b8952a" text-anchor="middle" dominant-baseline="middle">A&amp;A</text>
</svg>`;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const size of SIZES) {
    const svg = Buffer.from(svgFor(size));
    const outPath = path.join(OUT_DIR, `icon-${size}.png`);
    await sharp(svg).png().toFile(outPath);
    console.log('Wrote', outPath);
  }
})();
