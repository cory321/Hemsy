'use client';

interface RemixIconProps {
  name: string;
  size?: number;
  color?: string;
  isDecorative?: boolean;
  ariaLabel?: string;
}

export function RemixIcon({
  name,
  size = 18,
  color,
  isDecorative = true,
  ariaLabel,
}: RemixIconProps) {
  // Ensure proper accessibility attributes
  const iconProps = isDecorative
    ? { 'aria-hidden': true as const }
    : { 'aria-label': ariaLabel || `${name} icon`, role: 'img' as const };

  if (!isDecorative && !ariaLabel) {
    console.warn(
      `RemixIcon: Non-decorative icon "${name}" should have ariaLabel`
    );
  }

  return (
    <i
      className={`ri ${name}`}
      style={{ fontSize: size, color: color || 'currentColor' }}
      {...iconProps}
    />
  );
}
