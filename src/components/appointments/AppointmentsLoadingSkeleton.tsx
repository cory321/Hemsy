import { Container, Box, Skeleton } from '@mui/material';

export default function AppointmentsLoadingSkeleton() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton
            variant="rectangular"
            width={120}
            height={36}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Calendar Skeleton */}
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 3,
          }}
        >
          {/* Calendar Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Skeleton variant="text" width={150} height={32} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="circular" width={36} height={36} />
              <Skeleton variant="circular" width={36} height={36} />
            </Box>
          </Box>

          {/* Calendar Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 1,
            }}
          >
            {Array.from({ length: 35 }).map((_, index) => (
              <Skeleton key={index} variant="rectangular" height={80} />
            ))}
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
