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

  const outline = colors[0] ?? '#000000';
  const fill = colors[1] ?? colors[0] ?? '#cccccc';

  // Replace outline then fill with CSS variables + fallback
  let out = svg.replace(
    new RegExp(`fill="${escapeRegex(outline)}"`, 'g'),
    `fill="var(--garment-outline, ${outline})"`
  );
  out = out.replace(
    new RegExp(`fill="${escapeRegex(fill)}"`, 'g'),
    `fill="var(--garment-fill, ${fill})"`
  );

  // Normalize root width/height to be responsive and square-friendly
  let normalizedRoot = rootTag
    .replace(/\swidth="[^"]*"/i, '')
    .replace(/\sheight="[^"]*"/i, '');

  if (!/preserveAspectRatio=/i.test(normalizedRoot)) {
    normalizedRoot = normalizedRoot.replace(
      /<svg\b/i,
      '<svg preserveAspectRatio="xMidYMid meet"'
    );
  }
  // Force width/height 100%
  normalizedRoot = normalizedRoot.replace(
    /<svg\b/i,
    '<svg width="100%" height="100%"'
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
}

export default function InlinePresetSvg({
  src,
  outlineColor,
  fillColor,
  className,
  style,
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

  const vars: CSSProperties = {
    ...(outlineColor
      ? ({ ['--garment-outline' as any]: outlineColor } as any)
      : {}),
    ...(fillColor ? ({ ['--garment-fill' as any]: fillColor } as any) : {}),
  };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...vars,
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: processed?.svgHtml ?? '' }}
    />
  );
}
