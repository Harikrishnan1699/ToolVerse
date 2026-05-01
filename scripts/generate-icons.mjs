import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const iconSvg = (size, padding = 0) => {
  const r = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.55);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#3a5cff"/>
      <stop offset=".5" stop-color="#6366f1"/>
      <stop offset="1" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect x="${padding}" y="${padding}" width="${size - padding * 2}" height="${size - padding * 2}" rx="${r}" fill="url(#g)"/>
  <text x="50%" y="50%" font-family="Arial Black, Helvetica, sans-serif" font-size="${fontSize}" font-weight="900" fill="white" text-anchor="middle" dominant-baseline="central">T</text>
</svg>`;
};

const maskableSvg = (size) => {
  // maskable icons need a "safe zone" — put the logo inside the inner 80% so OS masks don't clip it
  const safe = Math.round(size * 0.1);
  const inner = size - safe * 2;
  const r = Math.round(inner * 0.22);
  const fontSize = Math.round(inner * 0.55);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#3a5cff"/>
      <stop offset=".5" stop-color="#6366f1"/>
      <stop offset="1" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="#3a5cff"/>
  <rect x="${safe}" y="${safe}" width="${inner}" height="${inner}" rx="${r}" fill="url(#g)"/>
  <text x="50%" y="50%" font-family="Arial Black, Helvetica, sans-serif" font-size="${fontSize}" font-weight="900" fill="white" text-anchor="middle" dominant-baseline="central">T</text>
</svg>`;
};

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
console.log('Generating icons…');

for (const s of sizes) {
  const svg = iconSvg(s);
  await sharp(Buffer.from(svg)).png().toFile(join(outDir, `icon-${s}x${s}.png`));
  console.log(`  ✓ icon-${s}x${s}.png`);
}

for (const s of [192, 512]) {
  const svg = maskableSvg(s);
  await sharp(Buffer.from(svg)).png().toFile(join(outDir, `icon-${s}x${s}-maskable.png`));
  console.log(`  ✓ icon-${s}x${s}-maskable.png (maskable)`);
}

// Apple touch icon (180x180 is the iOS standard)
await sharp(Buffer.from(iconSvg(180))).png().toFile(join(outDir, 'apple-touch-icon.png'));
console.log('  ✓ apple-touch-icon.png');

// Favicon as PNG (32x32) — iOS doesn't always honor SVG favicons
await sharp(Buffer.from(iconSvg(32))).png().toFile(join(outDir, '..', 'favicon-32.png'));
console.log('  ✓ favicon-32.png');

// Save the source SVG for future reference
writeFileSync(join(outDir, 'icon-source.svg'), iconSvg(512));
console.log('  ✓ icon-source.svg');

console.log('Done.');
