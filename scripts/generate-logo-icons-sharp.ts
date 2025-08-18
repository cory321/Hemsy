#!/usr/bin/env node
/**
 * Script to generate various icon sizes from the hemsy.svg logo using sharp
 * Required for PWA manifest, favicons, and app icons
 */

import sharp from 'sharp';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ICON_CONFIGS = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
];

async function generateIcons() {
  const svgPath = path.join(process.cwd(), 'public', 'hemsy.svg');
  const publicDir = path.join(process.cwd(), 'public');

  try {
    console.log('🎨 Generating icon files from hemsy.svg...');

    // Read the SVG file
    const svgBuffer = await readFile(svgPath);

    // Generate each icon size
    for (const { size, name } of ICON_CONFIGS) {
      const outputPath = path.join(publicDir, name);

      try {
        // Convert SVG to PNG with white background
        await sharp(svgBuffer)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          .png()
          .toFile(outputPath);

        console.log(`✅ Generated ${name} (${size}x${size})`);
      } catch (error) {
        console.error(`❌ Failed to generate ${name}:`, error);
      }
    }

    // For favicon.ico, we'll need to use a different approach
    // Since sharp doesn't support ICO format, we'll create a fallback
    console.log(
      '\n📝 Note: favicon.ico not generated. Use favicon-32x32.png as fallback.'
    );
    console.log('   Modern browsers support PNG favicons.');

    console.log('\n🎉 Icon generation complete!');
    console.log('\nGenerated files:');
    console.log('- favicon-16x16.png');
    console.log('- favicon-32x32.png');
    console.log('- apple-touch-icon.png (180x180)');
    console.log('- icon-192x192.png (PWA)');
    console.log('- icon-512x512.png (PWA)');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

// Run the script
generateIcons();
