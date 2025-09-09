'use client';

import { useMemo } from 'react';
import { Box } from '@mui/material';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

export default function Sparkline({
  data,
  width = 60,
  height = 20,
  color = '#5A736C',
  strokeWidth = 1.5,
}: SparklineProps) {
  const pathData = useMemo(() => {
    if (!data || data.length === 0) return '';

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;

    if (range === 0) {
      // Flat line if all values are the same
      const y = height / 2;
      return `M 0 ${y} L ${width} ${y}`;
    }

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x} ${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [data, width, height]);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Box
      component="svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      sx={{ display: 'block' }}
    >
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}
