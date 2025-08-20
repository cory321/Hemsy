'use client';

import { LinearProgress, Box } from '@mui/material';
import { useLinkStatus } from 'next/link';
import { useEffect, useState } from 'react';

export function NavigationProgress() {
  const { pending } = useLinkStatus();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pending) {
      setVisible(true);
      setProgress(10);

      // Simulate progress
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(timer);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(timer);
    } else {
      // Complete and hide
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);

      return () => clearTimeout(hideTimer);
    }
  }, [pending]);

  if (!visible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
      }}
    >
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 3,
          backgroundColor: 'transparent',
          '& .MuiLinearProgress-bar': {
            transition: 'transform 0.3s ease',
          },
        }}
      />
    </Box>
  );
}
