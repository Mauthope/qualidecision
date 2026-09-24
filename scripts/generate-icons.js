const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

function getSvg() {
  return `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080e1e"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="50%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0.05"/>
    </linearGradient>
  </defs>

  <!-- Background with rounded corners -->
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="#1e293b" stroke-width="4"/>

  <!-- Subtle glow ring -->
  <circle cx="256" cy="256" r="170" fill="url(#glowGrad)"/>

  <!-- Shield Base Outline -->
  <path d="M256 75 L385 125 C385 270 256 390 256 420 C256 390 127 270 127 125 Z" 
        fill="#091326" 
        stroke="url(#shieldGrad)" 
        stroke-width="16" 
        stroke-linejoin="round"/>

  <!-- Quality Core Emblem (Checkmark) -->
  <path d="M190 250 L235 295 L335 185" 
        fill="none" 
        stroke="url(#shieldGrad)" 
        stroke-width="26" 
        stroke-linecap="round" 
        stroke-linejoin="round"/>

  <!-- Letter Q tail accent -->
  <path d="M295 320 L355 380" 
        fill="none" 
        stroke="#38bdf8" 
        stroke-width="22" 
        stroke-linecap="round"/>

  <!-- Small star dot at apex -->
  <circle cx="256" cy="115" r="8" fill="#a5f3fc"/>
</svg>
`;
}

async function run() {
  const svgContent = getSvg();
  fs.writeFileSync(path.join(dir, 'icon.svg'), svgContent);
  const svgBuffer = Buffer.from(svgContent);

  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(dir, 'icon-192x192.png'));
  console.log('Created icon-192x192.png');

  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(dir, 'icon-512x512.png'));
  console.log('Created icon-512x512.png');

  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(dir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');
}

run().catch(console.error);
