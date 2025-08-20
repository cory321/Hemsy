'use client';

interface RemixIconProps {
  name: string;
  size?: number;
  color?: string;
}

export function RemixIcon({ name, size = 18, color }: RemixIconProps) {
  return (
    <i
      className={`ri ${name}`}
      style={{ fontSize: size, color: color || 'currentColor' }}
      aria-hidden
    />
  );
}
