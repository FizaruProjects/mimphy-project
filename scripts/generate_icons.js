import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve('public');
const ICONS_DIR = path.resolve(PUBLIC_DIR, 'icons');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Mimphy-themed generic icon (Red background, white M)
const svgContent = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#dc2626"/>
  <path d="M140 360V180L256 280L372 180V360" stroke="white" stroke-width="48" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>
`;

fs.writeFileSync(path.resolve(PUBLIC_DIR, 'favicon.svg'), svgContent.trim());
fs.writeFileSync(path.resolve(ICONS_DIR, 'icon.svg'), svgContent.trim());

async function generateIcons() {
  const sizes = [16, 32, 192, 512];
  
  for (const size of sizes) {
    const filename = size <= 32 ? `favicon-${size}x${size}.png` : `icon-${size}.png`;
    const targetDir = size <= 32 ? PUBLIC_DIR : ICONS_DIR;
    
    await sharp(Buffer.from(svgContent.trim()))
      .resize(size, size)
      .png()
      .toFile(path.resolve(targetDir, filename));
      
    if (size === 192 || size === 512) {
      // Create maskable versions
      await sharp(Buffer.from(svgContent.trim()))
        .resize(size, size)
        .png()
        .toFile(path.resolve(ICONS_DIR, `maskable-${size}.png`));
    }
  }

  // Apple touch icon
  await sharp(Buffer.from(svgContent.trim()))
    .resize(180, 180)
    .png()
    .toFile(path.resolve(PUBLIC_DIR, 'apple-touch-icon.png'));
    
  // Simple ICO conversion from 32x32 for favicon.ico
  fs.copyFileSync(path.resolve(PUBLIC_DIR, 'favicon-32x32.png'), path.resolve(PUBLIC_DIR, 'favicon.ico'));

  console.log('Icons generated successfully.');
}

generateIcons().catch(console.error);
