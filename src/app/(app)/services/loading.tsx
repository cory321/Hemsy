import { Container, Box, Skeleton, Paper } from '@mui/material';
import Grid from '@mui/material/Grid2';

export default function Loading() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Grid
          container
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Grid>
            <Skeleton variant="text" width={200} height={40} sx={{ mb: 1 }} />
            <Skeleton variant="text" width={300} height={24} />
          </Grid>
          <Grid>
            <Skeleton
              variant="rectangular"
              width={120}
              height={36}
              sx={{ borderRadius: 1 }}
            />
          </Grid>
        </Grid>

        {/* Frequently Used Services Section */}
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={200} height={28} sx={{ mb: 2 }} />

          {/* Service Cards */}
          <Grid container spacing={2}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Paper sx={{ p: 2 }}>
                  <Skeleton variant="text" width="70%" height={24} />
                  <Skeleton
                    variant="text"
                    width="50%"
                    height={20}
                    sx={{ mt: 1 }}
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2,
                    }}
                  >
                    <Skeleton variant="text" width={80} height={24} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Skeleton variant="circular" width={36} height={36} />
                      <Skeleton variant="circular" width={36} height={36} />
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Other Services Section */}
        <Box>
          <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />

          {/* Service Cards */}
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Paper sx={{ p: 2 }}>
                  <Skeleton variant="text" width="70%" height={24} />
                  <Skeleton
                    variant="text"
                    width="50%"
                    height={20}
                    sx={{ mt: 1 }}
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2,
                    }}
                  >
                    <Skeleton variant="text" width={80} height={24} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Skeleton variant="circular" width={36} height={36} />
                      <Skeleton variant="circular" width={36} height={36} />
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}
