import sharp from 'sharp';
import fs from 'fs';

const w = 1200;
const h = 630;
const bgPath = 'public/images/backgrounds/GuildWars2.webp';
const iconPath = 'public/images/icons/raw.webp';

const bg = await sharp(bgPath)
  .resize(w, h, { fit: 'cover' })
  .modulate({ brightness: 0.4 })
  .toBuffer();

const icon = await sharp(iconPath)
  .resize(220, 220, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const svg = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#7f1d1d" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="320" y="290" font-family="Segoe UI, Arial, sans-serif" font-size="72" font-weight="800" fill="#ffffff">True Farming</text>
  <text x="320" y="360" font-family="Segoe UI, Arial, sans-serif" font-size="36" fill="#cbd5e1">Guild Wars 2 Farming Tools</text>
</svg>`);

const overlay = await sharp(svg).png().toBuffer();

await sharp(bg)
  .composite([
    { input: overlay, top: 0, left: 0 },
    { input: icon, top: Math.round((h - 220) / 2), left: 70 },
  ])
  .png()
  .toFile('public/images/og-default.png');

const meta = await sharp('public/images/og-default.png').metadata();
console.log('wrote', meta.width, 'x', meta.height, fs.statSync('public/images/og-default.png').size, 'bytes');
