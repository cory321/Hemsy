'use client';

import { Box } from '@mui/material';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
});

interface LogoProps {
  height?: number;
  width?: number;
  variant?: 'light' | 'dark';
}

export function Logo({ height = 32, width, variant = 'light' }: LogoProps) {
  return (
    <Box
      component="span"
      className={poppins.className}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: `${height}px`,
        lineHeight: 1,
        fontWeight: 400,
        letterSpacing: '0.02em',
        color: variant === 'dark' ? '#fff' : 'inherit',
        userSelect: 'none',
      }}
    >
      hemsy
    </Box>
  );
}
