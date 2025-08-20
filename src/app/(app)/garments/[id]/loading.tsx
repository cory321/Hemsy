import {
  Container,
  Box,
  Card,
  CardContent,
  Skeleton,
  Divider,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid2';

export default function Loading() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Possible Back to Order link */}
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width={120} height={36} />
        </Box>

        <Grid container spacing={3}>
          {/* Left Column - Image and Stage */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Image Section */}
            <Card elevation={2}>
              <CardContent>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={300}
                  sx={{ mb: 2, borderRadius: 1 }}
                />

                {/* Image upload area */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <Skeleton
                    variant="rectangular"
                    width={100}
                    height={36}
                    sx={{ borderRadius: 1 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width={100}
                    height={36}
                    sx={{ borderRadius: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Stage Section */}
            <Box sx={{ mt: 3 }}>
              <Card elevation={2}>
                <CardContent>
                  <Skeleton
                    variant="text"
                    width={100}
                    height={28}
                    sx={{ mb: 2 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={48}
                    sx={{ borderRadius: 1 }}
                  />
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Right Column - Details */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Garment Info Card */}
            <Card elevation={2}>
              <CardContent>
                {/* Header with edit button */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Box>
                    <Skeleton variant="text" width={250} height={32} />
                    <Skeleton variant="text" width={150} height={24} />
                  </Box>
                  <Skeleton variant="circular" width={40} height={40} />
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Details Grid */}
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Skeleton variant="text" width={80} height={20} />
                    <Skeleton
                      variant="text"
                      width={120}
                      height={24}
                      sx={{ mb: 2 }}
                    />

                    <Skeleton variant="text" width={80} height={20} />
                    <Skeleton variant="text" width={120} height={24} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Skeleton variant="text" width={80} height={20} />
                    <Skeleton
                      variant="text"
                      width={120}
                      height={24}
                      sx={{ mb: 2 }}
                    />

                    <Skeleton variant="text" width={80} height={20} />
                    <Skeleton variant="text" width={120} height={24} />
                  </Grid>
                </Grid>

                {/* Notes Section */}
                <Box sx={{ mt: 3 }}>
                  <Skeleton variant="text" width={60} height={20} />
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={80}
                    sx={{ mt: 1, borderRadius: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Services Card */}
            <Box sx={{ mt: 3 }}>
              <Card elevation={2}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Skeleton variant="text" width={150} height={28} />
                    <Skeleton
                      variant="rectangular"
                      width={120}
                      height={36}
                      sx={{ borderRadius: 1 }}
                    />
                  </Box>

                  {/* Service Items */}
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 2 }} elevation={1}>
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
                        <Box
                          sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                        >
                          <Skeleton variant="text" width={80} height={24} />
                          <Skeleton variant="circular" width={32} height={32} />
                        </Box>
                      </Box>
                    </Paper>
                  ))}

                  {/* Totals */}
                  <Divider sx={{ my: 2 }} />
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Skeleton variant="text" width={100} height={28} />
                    <Skeleton variant="text" width={80} height={28} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
