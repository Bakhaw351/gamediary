import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../public/icons');
mkdirSync(outDir, { recursive: true });

// SVG icon — joystick on dark background
const svgIcon = (size, padding = 0.15) => {
  const p = Math.round(size * padding);
  const inner = size - p * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff6b35"/>
      <stop offset="100%" stop-color="#b83a00"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#09080e"/>
  <rect x="${p}" y="${p}" width="${inner}" height="${inner}" rx="${Math.round(inner * 0.22)}" fill="url(#bg)"/>
  <ellipse cx="${size/2}" cy="${size*0.76}" rx="${inner*0.53}" ry="${inner*0.19}" fill="rgba(255,255,255,.88)"/>
  <rect x="${size/2 - inner*0.11}" y="${size*0.37}" width="${inner*0.22}" height="${inner*0.39}" rx="${inner*0.11}" fill="white"/>
  <circle cx="${size/2}" cy="${size*0.31}" r="${inner*0.30}" fill="white"/>
  <circle cx="${size/2 - inner*0.11}" cy="${size*0.26}" r="${inner*0.09}" fill="rgba(255,255,255,.45)"/>
  <circle cx="${size*0.30}" cy="${size*0.77}" r="${inner*0.10}" fill="#b83a00"/>
  <circle cx="${size*0.70}" cy="${size*0.77}" r="${inner*0.10}" fill="#b83a00"/>
</svg>`;
};

// Maskable: icon fills the whole canvas (no padding)
const svgMaskable = (size) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff6b35"/>
      <stop offset="100%" stop-color="#b83a00"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <ellipse cx="${size/2}" cy="${size*0.76}" rx="${size*0.45}" ry="${size*0.16}" fill="rgba(255,255,255,.88)"/>
  <rect x="${size/2 - size*0.09}" y="${size*0.37}" width="${size*0.18}" height="${size*0.39}" rx="${size*0.09}" fill="white"/>
  <circle cx="${size/2}" cy="${size*0.31}" r="${size*0.25}" fill="white"/>
  <circle cx="${size/2 - size*0.09}" cy="${size*0.26}" r="${size*0.07}" fill="rgba(255,255,255,.45)"/>
  <circle cx="${size*0.30}" cy="${size*0.77}" r="${size*0.08}" fill="#b83a00"/>
  <circle cx="${size*0.70}" cy="${size*0.77}" r="${size*0.08}" fill="#b83a00"/>
</svg>`;
};

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  await sharp(Buffer.from(svgIcon(size)))
    .png()
    .toFile(join(outDir, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

// Maskable icons
for (const size of [192, 512]) {
  await sharp(Buffer.from(svgMaskable(size)))
    .png()
    .toFile(join(outDir, `icon-maskable-${size}.png`));
  console.log(`✓ icon-maskable-${size}.png`);
}

console.log('\nAll icons generated in public/icons/');
