import Image from 'next/image';
import { Box } from '@mui/material';

interface LogoProps {
  height?: number;
  width?: number;
  variant?: 'light' | 'dark';
}

export function Logo({ height = 32, width, variant = 'light' }: LogoProps) {
  // Calculate width based on SVG aspect ratio (345.79:95.32 ≈ 3.63:1)
  const calculatedWidth = width || Math.round(height * 3.63);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        filter: variant === 'dark' ? 'invert(1)' : 'none',
      }}
    >
      <Image
        src="/hemsy.svg"
        alt="Hemsy"
        width={calculatedWidth}
        height={height}
        priority
      />
    </Box>
  );
}
