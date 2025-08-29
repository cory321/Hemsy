import { Box, Container, Skeleton } from '@mui/material';
import Grid from '@mui/material/Grid2';

export default function Loading() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 3 }} />

        {/* Dashboard Grid */}
        <Grid container spacing={3}>
          {/* Appointments Focus */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box
              sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={200} />
            </Box>
          </Grid>

          {/* Business Overview */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={200} />
            </Box>
          </Grid>

          {/* Garment Pipeline */}
          <Grid size={12}>
            <Box
              sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={150} />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
