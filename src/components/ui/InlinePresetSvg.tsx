'use client';

import React, { CSSProperties, useEffect, useMemo, useState } from 'react';

const svgCache = new Map<string, string>();

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractAndParametrize(svg: string) {
  // Capture root <svg ...>
  const rootMatch = svg.match(/<svg\b[^>]*>/i);
  const rootTag =
    rootMatch && rootMatch[0] ? (rootMatch[0] as string) : '<svg>';

  // Collect encountered hex fill colors in order (exclude none)
  const fillRegex = /fill="(#[0-9a-fA-F]{3,8})"/g;
  const colors: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = fillRegex.exec(svg)) !== null) {
    if (!m[1]) continue;
    const c = m[1].toLowerCase();
    if (!colors.includes(c)) colors.push(c);
  }

  const outline = colors[0] ?? '#605143';
  const fill = colors[1] ?? colors[0] ?? '#cccccc';

  // Replace outline then fill with CSS variables + fallback
  let out = svg.replace(
    new RegExp(`fill="${escapeRegex(outline)}"`, 'g'),
    `fill="var(--garment-outline, ${outline})"`
  );
  // Map all remaining colors to the fill variable to enforce a 2-color scheme
  const remaining = colors.filter((c) => c !== outline);
  for (const c of remaining) {
    out = out.replace(
      new RegExp(`fill="${escapeRegex(c)}"`, 'g'),
      `fill="var(--garment-fill, ${c})"`
    );
  }

  // Normalize root width/height to be responsive and square-friendly
  let normalizedRoot = rootTag
    .replace(/\swidth="[^"]*"/i, '')
    .replace(/\sheight="[^"]*"/i, '');

  // Helper to append attribute(s) to the <svg ...> start tag without clobbering others
  const appendSvgAttrs = (input: string, attrs: string) =>
    input.replace(/<svg\b([^>]*)>/i, (_m, inner) => `<svg${inner} ${attrs}>`);

  if (!/preserveAspectRatio=/i.test(normalizedRoot)) {
    normalizedRoot = appendSvgAttrs(
      normalizedRoot,
      'preserveAspectRatio="xMidYMid meet"'
    );
  }
  // Ensure SVG content is not clipped by default
  if (!/overflow=/i.test(normalizedRoot)) {
    normalizedRoot = appendSvgAttrs(normalizedRoot, 'overflow="visible"');
  }
  // Force width/height 100% and ensure proper display with constraints
  normalizedRoot = appendSvgAttrs(
    normalizedRoot,
    'width="100%" height="100%" style="display: block; max-width: 100%; max-height: 100%;"'
  );

  // Replace the original root tag with normalized one
  out = out.replace(rootTag, normalizedRoot);

  return { svgHtml: out, outline, fill };
}

export interface InlinePresetSvgProps {
  src: string;
  outlineColor?: string;
  fillColor?: string;
  className?: string;
  style?: CSSProperties;
  'data-testid'?: string;
}

export default function InlinePresetSvg({
  src,
  outlineColor,
  fillColor,
  className,
  style,
  'data-testid': dataTestId,
}: InlinePresetSvgProps) {
  const [raw, setRaw] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        if (svgCache.has(src)) {
          if (isMounted) setRaw(svgCache.get(src)!);
          return;
        }
        const res = await fetch(src);
        const text = await res.text();
        svgCache.set(src, text);
        if (isMounted) setRaw(text);
      } catch (e) {
        // ignore
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [src]);

  const processed = useMemo(
    () => (raw ? extractAndParametrize(raw) : null),
    [raw]
  );

  function darken(hex: string, amount = 0.25): string {
    try {
      const v = hex.replace('#', '');
      const full =
        v.length === 3
          ? v
              .split('')
              .map((c) => c + c)
              .join('')
          : v;
      const bigint = parseInt(full, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      const dr = Math.max(0, Math.round(r * (1 - amount)));
      const dg = Math.max(0, Math.round(g * (1 - amount)));
      const db = Math.max(0, Math.round(b * (1 - amount)));
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(dr)}${toHex(dg)}${toHex(db)}`;
    } catch {
      return hex;
    }
  }

  const computedOutline =
    outlineColor || (fillColor ? darken(fillColor) : undefined);

  const vars: CSSProperties = {
    ...(computedOutline
      ? ({ ['--garment-outline' as any]: computedOutline } as any)
      : {}),
    ...(fillColor ? ({ ['--garment-fill' as any]: fillColor } as any) : {}),
  };

  return (
    <div
      className={className}
      data-testid={dataTestId}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...vars,
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: processed?.svgHtml ?? '' }}
    />
  );
}
