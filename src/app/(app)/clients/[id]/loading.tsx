import {
  Container,
  Box,
  Card,
  CardContent,
  Skeleton,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid2';

export default function Loading() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Skeleton variant="text" width={200} height={40} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Skeleton variant="circular" width={48} height={48} />
          </Box>
        </Box>

        {/* Two-column layout */}
        <Grid container spacing={3}>
          {/* Left column */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Profile Card */}
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Skeleton
                    variant="circular"
                    width={56}
                    height={56}
                    sx={{ mr: 2 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" height={32} />
                    <Skeleton variant="text" width="60%" height={24} />
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {/* Contact info */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width="70%" />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width="80%" />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Communication Preferences */}
            <Box sx={{ mt: 3 }}>
              <Card elevation={2}>
                <CardContent>
                  <Skeleton
                    variant="text"
                    width={200}
                    height={28}
                    sx={{ mb: 2 }}
                  />
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={32}
                      sx={{ borderRadius: 16 }}
                    />
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={32}
                      sx={{ borderRadius: 16 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Mailing Address */}
            <Box sx={{ mt: 3 }}>
              <Card elevation={2}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width={150} height={28} />
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Skeleton variant="text" width="90%" />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="85%" />
                </CardContent>
              </Card>
            </Box>

            {/* Record Information */}
            <Box sx={{ mt: 3 }}>
              <Card elevation={1} sx={{ bgcolor: 'grey.50' }}>
                <CardContent>
                  <Skeleton
                    variant="text"
                    width={180}
                    height={28}
                    sx={{ mb: 2 }}
                  />
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Skeleton variant="text" width="80%" height={20} />
                      <Skeleton variant="text" width="70%" height={24} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Skeleton variant="text" width="80%" height={20} />
                      <Skeleton variant="text" width="70%" height={24} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Right column */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Grid size={{ xs: 6, sm: 3 }} key={index}>
                  <Card>
                    <CardContent>
                      <Skeleton variant="text" width="100%" height={32} />
                      <Skeleton variant="text" width="80%" height={20} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Tabs */}
            <Card>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Skeleton variant="text" width={80} height={48} />
                  <Skeleton variant="text" width={120} height={48} />
                </Box>
              </Box>
              <CardContent>
                {/* Tab content skeleton */}
                {Array.from({ length: 5 }).map((_, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="60%" height={24} />
                        <Skeleton variant="text" width="40%" height={20} />
                      </Box>
                      <Skeleton variant="text" width={80} height={24} />
                    </Box>
                    {index < 4 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
