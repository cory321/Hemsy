import * as React from 'react';
import { Skeleton as MuiSkeleton, SkeletonProps } from '@mui/material';

function Skeleton(props: SkeletonProps) {
  const { className = '', sx, ...rest } = props;

  return (
    <MuiSkeleton
      animation="pulse"
      className={className}
      sx={{
        backgroundColor: 'grey.300',
        borderRadius: 1,
        ...sx,
      }}
      {...rest}
    />
  );
}

export { Skeleton };
