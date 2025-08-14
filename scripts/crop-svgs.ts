/*
  Crop SVGs by tightening the root viewBox to the union of all <path> bounds.
  - Leaves path data unchanged
  - Updates <svg viewBox> to [minX minY width height]
  - Preserves existing width/height attributes

  Usage:
    ts-node scripts/crop-svgs.ts [rootDir]
  Defaults to public/presets/garments
*/

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { load } from 'cheerio';
import { createRequire } from 'node:module';
// svg-path-bounds is CommonJS; load via createRequire for ESM compatibility
const pathBounds: (d: string) => [number, number, number, number] =
  createRequire(import.meta.url)('svg-path-bounds');

type BoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

function unionBounds(
  a: BoundingBox | null,
  b: BoundingBox | null
): BoundingBox | null {
  if (!a) return b;
  if (!b) return a;
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function toFixed(n: number): string {
  // Keep a reasonable precision without exploding file diffs
  return Number(n.toFixed(2)).toString();
}

async function cropSvgFile(
  filePath: string
): Promise<{ updated: boolean; message: string }> {
  const original = await fs.promises.readFile(filePath, 'utf8');
  const $ = load(original, { xmlMode: true });

  const svg = $('svg').first();
  if (!svg.length) {
    return { updated: false, message: 'No <svg> root found' };
  }

  // Compute union of bounds across common shape elements
  let bounds: BoundingBox | null = null;
  const pushBounds = (bb: BoundingBox | null) => {
    if (bb) bounds = unionBounds(bounds, bb);
  };

  // Helper to add rectangle-like primitive
  const addRect = (
    xStr?: string,
    yStr?: string,
    wStr?: string,
    hStr?: string
  ) => {
    const x = Number(xStr ?? '0');
    const y = Number(yStr ?? '0');
    const w = Number(wStr ?? '0');
    const h = Number(hStr ?? '0');
    if (isFinite(x) && isFinite(y) && w > 0 && h > 0) {
      pushBounds({ minX: x, minY: y, maxX: x + w, maxY: y + h });
    }
  };

  // Paths
  $('path').each((_, el) => {
    const d = $(el).attr('d');
    if (!d) return;
    try {
      const [minX, minY, maxX, maxY] = pathBounds(d);
      pushBounds({ minX, minY, maxX, maxY });
    } catch {}
  });

  // Basic shapes
  $('rect').each((_, el) =>
    addRect(
      $(el).attr('x'),
      $(el).attr('y'),
      $(el).attr('width'),
      $(el).attr('height')
    )
  );
  $('image').each((_, el) =>
    addRect(
      $(el).attr('x'),
      $(el).attr('y'),
      $(el).attr('width'),
      $(el).attr('height')
    )
  );
  $('use').each((_, el) =>
    addRect(
      $(el).attr('x'),
      $(el).attr('y'),
      $(el).attr('width'),
      $(el).attr('height')
    )
  );

  if (!bounds) {
    return { updated: false, message: 'Could not compute bounds' };
  }

  const b = bounds as BoundingBox;
  const width = b.maxX - b.minX;
  const height = b.maxY - b.minY;
  if (!(isFinite(width) && isFinite(height)) || width <= 0 || height <= 0) {
    return { updated: false, message: 'Invalid computed dimensions' };
  }

  // Normalize to a square viewBox centered on the artwork's true center
  // This ensures consistent scaling and centering across all icons
  const centerX = b.minX + width / 2;
  const centerY = b.minY + height / 2;
  const size = Math.max(width, height);
  const squareMinX = centerX - size / 2;
  const squareMinY = centerY - size / 2;
  const newViewBox = `${toFixed(squareMinX)} ${toFixed(squareMinY)} ${toFixed(size)} ${toFixed(size)}`;
  const oldViewBox = svg.attr('viewBox');

  if (oldViewBox === newViewBox) {
    return { updated: false, message: 'Already cropped' };
  }

  svg.attr('viewBox', newViewBox);

  const updated = $.xml();
  await fs.promises.writeFile(filePath, updated, 'utf8');
  return { updated: true, message: `viewBox: ${oldViewBox} -> ${newViewBox}` };
}

async function main() {
  const rootArg = process.argv[2];
  const root = rootArg
    ? path.resolve(rootArg)
    : path.resolve(process.cwd(), 'public', 'presets', 'garments');

  const pattern = path.join(root, '**', '*.svg').replace(/\\/g, '/');
  const files = await glob(pattern, { nodir: true });
  if (files.length === 0) {
    console.error(`No SVG files found under: ${root}`);
    process.exit(1);
  }

  console.log(`Cropping ${files.length} SVGs under ${root} ...`);
  let changed = 0;
  for (const file of files) {
    try {
      const { updated, message } = await cropSvgFile(file);
      const rel = path.relative(process.cwd(), file);
      if (updated) {
        changed += 1;
        console.log(`✔ ${rel}: ${message}`);
      } else {
        console.log(`• ${rel}: ${message}`);
      }
    } catch (err: any) {
      const rel = path.relative(process.cwd(), file);
      console.warn(`! ${rel}: ${err?.message || err}`);
    }
  }

  console.log(`Done. Updated ${changed}/${files.length} files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
