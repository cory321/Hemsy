import React from 'react';
import { Box, Card, CardContent, Skeleton } from '@mui/material';
import Grid2 from '@mui/material/Grid2';

export function GarmentCardSkeletonItem() {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderTop: '4px solid',
        borderTopColor: 'divider',
      }}
    >
      {/* Image Section Skeleton */}
      <Box
        sx={{
          position: 'relative',
          paddingTop: '100%',
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'rgba(0, 0, 0, 0.15)',
            opacity: 1,
          }}
        >
          <i
            className="ri ri-shirt-line"
            style={{ fontSize: 128 }}
            aria-hidden
          />
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Garment Name */}
        <Skeleton variant="text" width="80%" height={28} sx={{ mb: 1 }} />
        {/* Client Name */}
        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
        {/* Due Date Chip */}
        <Skeleton
          variant="rectangular"
          width={100}
          height={24}
          sx={{ borderRadius: 12, mb: 1 }}
        />
        {/* Price */}
        <Skeleton variant="text" width={60} height={24} />
      </CardContent>
    </Card>
  );
}

export default function GarmentCardSkeletonGrid({
  count = 8,
}: {
  count?: number;
}) {
  return (
    <Grid2 container spacing={3} columns={{ xs: 4, sm: 8, md: 12, lg: 20 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid2 size={{ xs: 4, sm: 4, md: 4, lg: 4 }} key={index}>
          <GarmentCardSkeletonItem />
        </Grid2>
      ))}
    </Grid2>
  );
}
