// One-off: generate PWA/home-screen icons from an inline SVG.
// Run with sharp available (npm install --no-save sharp), then it's not needed again.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const STAR =
  'M50,18 L58.2,40.7 L82.3,41.5 L63.3,56.3 L70,79.5 L50,66 L30,79.5 L36.7,56.3 L17.7,41.5 L41.8,40.7 Z';

const svg = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7c3aed"/>
      <stop offset="1" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#g)"/>
  <path d="${STAR}" fill="#ffffff"/>
</svg>`;

await mkdir('public/icons', { recursive: true });
for (const size of [180, 192, 512]) {
  await sharp(Buffer.from(svg(size))).png().toFile(`public/icons/icon-${size}.png`);
  console.log(`wrote public/icons/icon-${size}.png`);
}
