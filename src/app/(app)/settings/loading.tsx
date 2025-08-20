import {
  Container,
  Box,
  Paper,
  Skeleton,
  Card,
  CardContent,
} from '@mui/material';
import Grid from '@mui/material/Grid2';

export default function Loading() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Skeleton variant="text" width={150} height={40} sx={{ mb: 3 }} />

      <Paper sx={{ width: '100%', mb: 4 }}>
        {/* Tabs */}
        <Box
          sx={{
            display: 'flex',
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
          }}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1.5,
                minHeight: 48,
              }}
            >
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="text" width={80} height={24} />
            </Box>
          ))}
        </Box>

        {/* Tab Panel Content */}
        <Box sx={{ py: 3, px: 3 }}>
          {/* Business Information Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Skeleton variant="text" width={200} height={28} sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Skeleton
                    variant="rectangular"
                    height={56}
                    sx={{ borderRadius: 1 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Skeleton
                    variant="rectangular"
                    height={56}
                    sx={{ borderRadius: 1 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Skeleton
                    variant="rectangular"
                    height={56}
                    sx={{ borderRadius: 1 }}
                  />
                </Grid>
                <Grid size={12}>
                  <Skeleton
                    variant="rectangular"
                    height={100}
                    sx={{ borderRadius: 1 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Location Type Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    variant="rectangular"
                    width={150}
                    height={100}
                    sx={{ borderRadius: 1 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Brand Customization Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="text" width={150} height={24} />
              </Box>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Skeleton
              variant="rectangular"
              width={120}
              height={36}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
